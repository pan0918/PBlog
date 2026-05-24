"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../siteConfig';

export default function SplashScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('hasSeenSplash') === 'true') {
      document.documentElement.classList.add('splash-seen');
      setShow(false);
      return;
    }
    setShow(true);
    const timer = setTimeout(() => {
      sessionStorage.setItem('hasSeenSplash', 'true');
      document.documentElement.classList.add('splash-seen');
      setShow(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
            className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-[0_0_40px_rgba(99,102,241,0.6)] mb-8"
          >
            <img src={siteConfig.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover bg-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-black text-white mb-4 tracking-tight"
          >
            {siteConfig.authorName}
          </motion.h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 200 }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
            className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-slate-400 text-sm mt-6 font-medium tracking-widest uppercase"
          >
            Loading...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
