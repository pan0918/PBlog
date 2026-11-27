"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../siteConfig';

interface ChatMessage { role: 'user' | 'cat'; text: string; }

// Matches the server-side limit in app/api/chat/route.ts.
const MAX_MESSAGE_LENGTH = 300;

function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = sessionStorage.getItem('pet-history');
    if (s) {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed.slice(-50) : [];
    }
  } catch {}
  return [];
}
function saveHistory(m: ChatMessage[]) { try { sessionStorage.setItem('pet-history', JSON.stringify(m.slice(-50))); } catch {} }

const IDLE_PHRASES = [
  "喵~", "肚子饿了喵~", "要小鱼干！", "在写代码吗？",
  "摸鱼中~", "困了zzZ", "无聊喵~", "想出去玩",
  "今天天气不错喵", "主人在忙什么呀",
];

// --- SVG Cat Component ---
function CatSVG({ mood }: { mood: 'idle' | 'happy' | 'talk' | 'sleep' }) {
  const eyeHeight = mood === 'sleep' ? 0.5 : mood === 'happy' ? 1.5 : 3;
  const mouthPath = mood === 'happy' ? 'M18 26 Q20 29 22 26' : 'M19 27 Q20 28 21 27';
  const tailAnim = mood === 'happy' ? 'animate-tail-happy' : 'animate-tail-idle';

  return (
    <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
      {/* Body */}
      <ellipse cx="20" cy="32" rx="10" ry="6" fill="#8B7355" />
      {/* Tail */}
      <path d="M30 30 Q36 25 34 18" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round" fill="none" className={tailAnim} />
      {/* Head */}
      <circle cx="20" cy="20" r="10" fill="#C4A882" />
      {/* Inner ears */}
      <path d="M11 14 L13 8 L17 13 Z" fill="#C4A882" />
      <path d="M23 13 L27 8 L29 14 Z" fill="#C4A882" />
      <path d="M12.5 13 L14 9 L16 12.5 Z" fill="#E8B4B8" />
      <path d="M24 12.5 L26 9 L27.5 13 Z" fill="#E8B4B8" />
      {/* Eyes */}
      <ellipse cx="16" cy="19" rx="2" ry={eyeHeight} fill="#2D2D2D" className={mood === 'sleep' ? '' : 'animate-blink'} />
      <ellipse cx="24" cy="19" rx="2" ry={eyeHeight} fill="#2D2D2D" className={mood === 'sleep' ? '' : 'animate-blink'} />
      {mood !== 'sleep' && <>
        <circle cx="15" cy="18" r="0.6" fill="white" />
        <circle cx="23" cy="18" r="0.6" fill="white" />
      </>}
      {/* Nose */}
      <path d="M19 22 L20 23.5 L21 22 Z" fill="#E8A0A0" />
      {/* Mouth */}
      <path d={mouthPath} stroke="#8B7355" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Whiskers */}
      <line x1="6" y1="20" x2="14" y2="21" stroke="#C4A882" strokeWidth="0.5" />
      <line x1="6" y1="23" x2="14" y2="23" stroke="#C4A882" strokeWidth="0.5" />
      <line x1="26" y1="21" x2="34" y2="20" stroke="#C4A882" strokeWidth="0.5" />
      <line x1="26" y1="23" x2="34" y2="23" stroke="#C4A882" strokeWidth="0.5" />
      {/* Blush */}
      <circle cx="13" cy="23" r="1.5" fill="#F0A0A0" opacity="0.4" />
      <circle cx="27" cy="23" r="1.5" fill="#F0A0A0" opacity="0.4" />
      {/* Front paws */}
      <ellipse cx="14" cy="36" rx="3" ry="2" fill="#C4A882" />
      <ellipse cx="26" cy="36" rx="3" ry="2" fill="#C4A882" />
    </svg>
  );
}

export default function CyberCat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [idlePhrase, setIdlePhrase] = useState('');
  const [mood, setMood] = useState<'idle' | 'happy' | 'talk' | 'sleep'>('idle');
  const [proactiveMsg, setProactiveMsg] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRefs = useRef(new Set<ReturnType<typeof setTimeout>>());
  const chatAbortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      timeoutRefs.current.delete(timeout);
      callback();
    }, delay);
    timeoutRefs.current.add(timeout);
    return timeout;
  }, []);

  useEffect(() => {
    const timeouts = timeoutRefs.current;
    return () => {
      mountedRef.current = false;
      chatAbortRef.current?.abort();
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);

  useEffect(() => {
    setMessages(loadHistory());
    setIdlePhrase(IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)]);

    // Reduce idle phrase updates when page is hidden
    const idleInterval = document.hidden ? 30000 : 10000; // 3x slower when hidden
    const t = setInterval(() => setIdlePhrase(IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)]), idleInterval);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Only scroll when page is visible
    if (!document.hidden) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Re-scroll when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Proactive - reduce frequency when page is hidden
  useEffect(() => {
    const proactiveInterval = siteConfig.petConfig.proactiveInterval;

    const t = setInterval(() => {
      if (document.hidden || isOpen) return;
      const msgs = siteConfig.petConfig.proactiveMessages;
      setProactiveMsg(msgs[Math.floor(Math.random() * msgs.length)]);
      setMood('talk');
      scheduleTimeout(() => { setProactiveMsg(null); setMood('idle'); }, 5000);
    }, document.hidden ? proactiveInterval * 3 : proactiveInterval); // 3x slower when hidden

    return () => clearInterval(t);
  }, [isOpen, scheduleTimeout]);

  // Sleep when idle - faster sleep when page is hidden
  useEffect(() => {
    if (isOpen || isHovered || proactiveMsg) { if (mood === 'sleep') setMood('idle'); return; }
    const sleepDelay = document.hidden ? 10000 : 30000; // Sleep faster when hidden
    const t = setTimeout(() => setMood('sleep'), sleepDelay);
    return () => clearTimeout(t);
  }, [isOpen, isHovered, proactiveMsg, mood]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput('');
    const newMsgs = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMsgs);
    saveHistory(newMsgs);
    setIsTyping(true);
    setMood('talk');

    const historyForApi = newMsgs.slice(-10).map(m => ({ role: m.role === 'cat' ? 'assistant' : 'user', content: m.text }));
    chatAbortRef.current?.abort();
    const controller = new AbortController();
    chatAbortRef.current = controller;

    let replyText = '';
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: historyForApi.slice(0, -1) }),
      });
      if (res.headers.get('content-type')?.includes('application/json')) {
        // Local replies (resting, rate limited, errors) arrive as JSON.
        const data = await res.json();
        replyText = typeof data.reply === 'string' ? data.reply : '';
      } else if (res.body) {
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          replyText += value;
          if (!mountedRef.current) return;
          // The first chunk replaces the typing dots.
          setIsTyping(false);
          setMessages([...newMsgs, { role: 'cat', text: replyText }]);
        }
      }
      if (controller.signal.aborted || !mountedRef.current) return;
      const updated = [...newMsgs, { role: 'cat' as const, text: replyText || '喵？听不懂...' }];
      setMessages(updated);
      saveHistory(updated);
      setMood('happy');
      scheduleTimeout(() => setMood('idle'), 2000);
    } catch {
      if (controller.signal.aborted || !mountedRef.current) return;
      // Keep the part of the reply that already arrived.
      setMessages([...newMsgs, { role: 'cat' as const, text: replyText || '网络出问题了喵~' }]);
      setMood('idle');
    } finally {
      if (chatAbortRef.current === controller) {
        chatAbortRef.current = null;
      }
      if (!controller.signal.aborted && mountedRef.current) {
        setIsTyping(false);
      }
    }
  }, [input, isTyping, messages, scheduleTimeout]);

  return (
    <>
      {/* Pet */}
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={{ left: -300, right: -10, top: -500, bottom: -10 }}
        onDragStart={() => setMood('happy')}
        onDragEnd={() => { scheduleTimeout(() => setMood('idle'), 1000); }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-4 right-4 z-[56] hidden md:block cursor-grab active:cursor-grabbing"
      >
        <div className="relative">
          {/* Cat */}
          <motion.div
            animate={{ y: mood === 'idle' ? [0, -2, 0] : 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 drop-shadow-lg hover:scale-110 transition-transform"
            onClick={() => { setIsOpen(!isOpen); setMood(isOpen ? 'idle' : 'happy'); }}
          >
            <CatSVG mood={mood} />
          </motion.div>

          {/* Idle bubble */}
          <AnimatePresence>
            {!isOpen && !proactiveMsg && idlePhrase && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.9 }}
                className="absolute -top-9 right-0 whitespace-nowrap px-2.5 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl rounded-br-sm text-[10px] font-bold text-slate-600 dark:text-slate-300 shadow-md border border-slate-200/50 dark:border-white/10 pointer-events-none"
              >
                {idlePhrase}
                <div className="absolute -bottom-1 right-3 w-2 h-2 bg-white/90 dark:bg-slate-800/90 rotate-45 border-r border-b border-slate-200/50 dark:border-white/10" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Proactive bubble */}
          <AnimatePresence>
            {proactiveMsg && !isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.9 }}
                onClick={() => { setIsOpen(true); setProactiveMsg(null); }}
                className="absolute -top-9 right-0 whitespace-nowrap px-2.5 py-1 bg-indigo-500 text-white rounded-xl rounded-br-sm text-[10px] font-bold shadow-md cursor-pointer hover:bg-indigo-600 transition-colors"
              >
                {proactiveMsg}
                <div className="absolute -bottom-1 right-3 w-2 h-2 bg-indigo-500 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-4 z-[57] w-80 h-[26rem] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 flex flex-col overflow-hidden hidden md:flex"
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b border-slate-200/50 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 p-0.5 shadow-sm">
                  <CatSVG mood="idle" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white block leading-tight">{siteConfig.petConfig.name}</span>
                  <span className="text-[10px] text-slate-400">在线</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => { setMessages([]); saveHistory([]); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="清空">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Welcome */}
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 p-0.5 flex-shrink-0"><CatSVG mood="idle" /></div>
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-2xl rounded-tl-sm text-sm text-slate-700 dark:text-slate-200 max-w-[85%] leading-relaxed">
                  你好呀~ 我是{siteConfig.petConfig.name}，有什么想问的吗？
                </div>
              </div>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'cat' && <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 p-0.5 flex-shrink-0"><CatSVG mood="idle" /></div>}
                  <div className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] leading-relaxed ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 p-0.5 flex-shrink-0"><CatSVG mood="talk" /></div>
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-2xl rounded-tl-sm flex items-center gap-1.5 h-9">
                    <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-slate-200/50 dark:border-white/5 shrink-0">
              <div className="flex gap-2">
                <input type="text" value={input} maxLength={MAX_MESSAGE_LENGTH} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder={`和${siteConfig.petConfig.name}说点什么...`} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-sm text-slate-800 dark:text-white outline-none border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/30 transition-shadow" />
                <button onClick={sendMessage} className="px-3.5 py-2 bg-indigo-500 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 active:scale-95 transition-all shadow-sm shadow-indigo-500/20">发送</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes tail-idle { 0%,100% { d: path("M30 30 Q36 25 34 18"); } 50% { d: path("M30 30 Q38 22 35 16"); } }
        @keyframes tail-happy { 0%,100% { d: path("M30 30 Q36 25 34 18"); } 25% { d: path("M30 30 Q40 20 36 14"); } 75% { d: path("M30 30 Q34 28 32 20"); } }
        .animate-tail-idle { animation: tail-idle 3s ease-in-out infinite; }
        .animate-tail-happy { animation: tail-happy 0.6s ease-in-out infinite; }
        @keyframes blink { 0%,90%,100% { ry: 3; } 95% { ry: 0.5; } }
        .animate-blink { animation: blink 4s ease-in-out infinite; }
      `}</style>
    </>
  );
}
