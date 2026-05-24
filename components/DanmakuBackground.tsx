"use client";
import { useState, useEffect, useRef } from 'react';
import { siteConfig } from '../siteConfig';

interface DanmakuItem {
  id: number;
  text: string;
  top: number;
  duration: number;
  delay: number;
}

export default function DanmakuBackground() {
  const [items, setItems] = useState<DanmakuItem[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    const list = siteConfig.danmakuList;
    if (!list.length) return;

    const addDanmaku = () => {
      const id = ++counterRef.current;
      const text = list[Math.floor(Math.random() * list.length)];
      const newItem: DanmakuItem = {
        id,
        text,
        top: 5 + Math.random() * 25,
        duration: 15 + Math.random() * 10,
        delay: 0,
      };
      setItems(prev => [...prev.slice(-15), newItem]);
    };

    addDanmaku();
    const interval = setInterval(addDanmaku, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes danmakuFloat {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
        {items.map(item => (
          <div
            key={item.id}
            className="absolute whitespace-nowrap text-slate-400/20 dark:text-slate-500/15 font-bold text-lg select-none"
            style={{
              top: `${item.top}%`,
              animation: `danmakuFloat ${item.duration}s linear`,
            }}
          >
            {item.text}
          </div>
        ))}
      </div>
    </>
  );
}
