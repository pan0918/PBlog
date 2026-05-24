"use client";
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function GlobalToolbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');

  const calculate = () => {
    try {
      const result = Function(`"use strict"; return (${calcInput})`)();
      setCalcResult(String(result));
    } catch {
      setCalcResult('Error');
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[55] hidden md:block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-16 left-0 w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-white/10 p-4"
          >
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">计算器</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={calcInput}
                onChange={(e) => setCalcInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && calculate()}
                placeholder="输入表达式..."
                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 border border-slate-200 dark:border-slate-700"
              />
              <button onClick={calculate} className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm font-bold hover:bg-indigo-600 transition-colors">=</button>
            </div>
            {calcResult && <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">= {calcResult}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
