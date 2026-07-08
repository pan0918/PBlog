"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../siteConfig';

interface ChatMessage { role: 'user' | 'cat'; text: string; }

interface PetConfig {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
}

const DEFAULT_CONFIG: PetConfig = {
  apiBaseUrl: '',
  apiKey: '',
  model: 'gemini-2.5-flash-lite',
  systemPrompt: siteConfig.petConfig.systemPrompt,
};

function loadConfig(): PetConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try { const s = sessionStorage.getItem('pet-config'); if (s) return { ...DEFAULT_CONFIG, ...JSON.parse(s) }; } catch {}
  return DEFAULT_CONFIG;
}
function saveConfig(c: PetConfig) { try { sessionStorage.setItem('pet-config', JSON.stringify(c)); } catch {} }
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
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [idlePhrase, setIdlePhrase] = useState('');
  const [mood, setMood] = useState<'idle' | 'happy' | 'talk' | 'sleep'>('idle');
  const [config, setConfig] = useState<PetConfig>(DEFAULT_CONFIG);
  const [proactiveMsg, setProactiveMsg] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<PetConfig>(DEFAULT_CONFIG);
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
    setConfig(loadConfig());
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

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: historyForApi.slice(0, -1),
          config: { apiBaseUrl: config.apiBaseUrl || undefined, apiKey: config.apiKey || undefined, model: config.model || undefined, systemPrompt: config.systemPrompt || undefined },
        }),
      });
      const data = await res.json();
      if (controller.signal.aborted || !mountedRef.current) return;
      const catMsg = { role: 'cat' as const, text: data.reply || '喵？听不懂...' };
      const updated = [...newMsgs, catMsg];
      setMessages(updated);
      saveHistory(updated);
      setMood('happy');
      scheduleTimeout(() => setMood('idle'), 2000);
    } catch {
      if (controller.signal.aborted || !mountedRef.current) return;
      setMessages([...newMsgs, { role: 'cat' as const, text: '网络出问题了喵~' }]);
      setMood('idle');
    } finally {
      if (chatAbortRef.current === controller) {
        chatAbortRef.current = null;
      }
      if (!controller.signal.aborted && mountedRef.current) {
        setIsTyping(false);
      }
    }
  }, [input, isTyping, messages, config, scheduleTimeout]);

  // BYO-key mode: the server keeps no key, so availability is purely the client-provided key.
  // (process.env.* is undefined in client components unless NEXT_PUBLIC_-prefixed.)
  const hasApiKey = !!config.apiKey;

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
            onClick={() => { setIsOpen(!isOpen); setShowSettings(false); setMood(isOpen ? 'idle' : 'happy'); }}
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
                  <span className="text-[10px] text-slate-400">{hasApiKey ? '在线' : '未配置 API'}</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => { setMessages([]); saveHistory([]); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="清空">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button onClick={() => { setConfigDraft(config); setShowSettings(!showSettings); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="设置">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">✕</button>
              </div>
            </div>

            {showSettings ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">API 设置</h4>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block">Base URL</label>
                  <input type="text" value={configDraft.apiBaseUrl} onChange={(e) => setConfigDraft({ ...configDraft, apiBaseUrl: e.target.value })} placeholder="留空使用默认 Gemini" className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block">API Key</label>
                  <input type="password" value={configDraft.apiKey} onChange={(e) => setConfigDraft({ ...configDraft, apiKey: e.target.value })} placeholder="输入 API Key" className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block">模型</label>
                  <input type="text" value={configDraft.model} onChange={(e) => setConfigDraft({ ...configDraft, model: e.target.value })} placeholder="gpt-4o-mini / gemini-2.5-flash-lite" className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block">System Prompt</label>
                  <textarea value={configDraft.systemPrompt} onChange={(e) => setConfigDraft({ ...configDraft, systemPrompt: e.target.value })} rows={3} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-indigo-500/50 resize-none" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setConfig(configDraft); saveConfig(configDraft); setShowSettings(false); }} className="flex-1 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-colors">保存</button>
                  <button onClick={() => setShowSettings(false)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">取消</button>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">支持 OpenAI 兼容格式和 Gemini API。API Key 仅存储在当前浏览器会话中，关闭页面后自动清除，不会发送到本站服务器以外的任何地方。</p>
              </div>
            ) : (
              <>
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
                  {!hasApiKey && (
                    <div className="mb-2 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                      点击 ⚙ 配置 API 后即可聊天
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder={`和${siteConfig.petConfig.name}说点什么...`} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-sm text-slate-800 dark:text-white outline-none border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/30 transition-shadow" />
                    <button onClick={sendMessage} className="px-3.5 py-2 bg-indigo-500 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 active:scale-95 transition-all shadow-sm shadow-indigo-500/20">发送</button>
                  </div>
                </div>
              </>
            )}
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
