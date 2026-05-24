"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const idlePhrases = ["喵~", "肚子饿了喵~", "要小鱼干！", "在写代码吗？", "摸鱼中~", "困了zzZ"];

export default function CyberCat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'cat'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [idlePhrase, setIdlePhrase] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const phrase = idlePhrases[Math.floor(Math.random() * idlePhrases.length)];
    setIdlePhrase(phrase);
    const timer = setInterval(() => {
      setIdlePhrase(idlePhrases[Math.floor(Math.random() * idlePhrases.length)]);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'cat', text: data.reply || '喵？听不懂...' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'cat', text: '网络出问题了喵~' }]);
    }
    setIsTyping(false);
  };

  return (
    <>
      {/* Cat button */}
      <motion.div
        drag
        dragConstraints={{ left: -50, right: 0, top: -400, bottom: 0 }}
        className="fixed bottom-6 right-6 z-[56] hidden md:block"
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center text-2xl border-2 border-white/30"
        >
          🐱
        </button>
        {!isOpen && idlePhrase && (
          <div className="absolute -top-10 right-0 whitespace-nowrap px-3 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 shadow-lg border border-white/40 dark:border-white/10">
            {idlePhrase}
          </div>
        )}
      </motion.div>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-[57] w-80 h-96 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 flex flex-col overflow-hidden hidden md:flex"
          >
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-sm flex items-center justify-between">
              <span>🐱 煤球助理</span>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs flex-shrink-0">🐱</div>
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm text-sm text-slate-700 dark:text-slate-200 max-w-[80%]">
                  你好呀~ 我是煤球，有什么想问的吗？喵~
                </div>
              </div>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'cat' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs flex-shrink-0">🐱</div>}
                  <div className={`px-3 py-2 rounded-2xl text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs flex-shrink-0">🐱</div>
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm text-sm text-slate-500 animate-pulse">思考中...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="和煤球聊天..."
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 border border-slate-200 dark:border-slate-700"
                />
                <button onClick={sendMessage} className="px-3 py-2 bg-indigo-500 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors">
                  发送
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
