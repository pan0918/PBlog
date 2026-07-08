"use client";
import { useState, useEffect, useRef } from 'react';
import { siteConfig } from '../siteConfig';

interface DanmakuItem {
  id: number;
  text: string;
  top: number;
  duration: number;
}

const MAX_DANMAKU_ITEMS = 4;

export default function DanmakuBackground() {
  const [items, setItems] = useState<DanmakuItem[]>([]);
  const counterRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const list = siteConfig.danmakuList;
    if (!list.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const addDanmaku = () => {
      const id = ++counterRef.current;
      const text = list[Math.floor(Math.random() * list.length)];
      const newItem: DanmakuItem = {
        id,
        text,
        top: 18 + Math.random() * 52,
        duration: 24 + Math.random() * 10,
      };
      setItems(prev => [...prev.slice(-(MAX_DANMAKU_ITEMS - 1)), newItem]);
    };

    const initialTimer = window.setTimeout(addDanmaku, 1200);
    intervalRef.current = window.setInterval(addDanmaku, 6500);

    // Pause danmaku when page is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        if (!intervalRef.current) {
          intervalRef.current = window.setInterval(addDanmaku, 6500);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearTimeout(initialTimer);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const removeDanmaku = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <>
      <style>{`
        @keyframes danmakuFloat {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          12% { opacity: 0.72; }
          86% { opacity: 0.72; }
          100% { transform: translate3d(calc(-100vw - 100%), 0, 0); opacity: 0; }
        }
      `}</style>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden="true" style={{ contain: 'strict' }}>
        {items.map(item => (
          <div
            key={item.id}
            className="absolute whitespace-nowrap text-[rgba(130,116,106,0.11)] dark:text-[rgba(238,233,228,0.055)] font-black text-sm md:text-base select-none will-change-transform"
            style={{
              left: '100vw',
              top: `${item.top}%`,
              animation: `danmakuFloat ${item.duration}s linear`,
              animationFillMode: 'forwards',
            }}
            onAnimationEnd={() => removeDanmaku(item.id)}
          >
            {item.text}
          </div>
        ))}
      </div>
    </>
  );
}
