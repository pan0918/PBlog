"use client";
import { motion } from 'framer-motion';

export default function PageTransition({ children, duration = 0.5 }: { children: React.ReactNode; duration?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
