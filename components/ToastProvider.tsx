"use client";
import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }
const ToastContext = createContext({ showToast: (msg: string, type?: 'success' | 'error' | 'info') => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = 0;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`px-5 py-3 rounded-2xl backdrop-blur-xl shadow-xl border text-sm font-bold pointer-events-auto
                ${toast.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-300' :
                  toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300' :
                  'bg-white/40 dark:bg-slate-800/50 border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-200'}`}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
