"use client";
import { useState, useEffect, useMemo } from 'react';

export default function Sakura() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [petalsCount, setPetalsCount] = useState(8);

  const petals = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: petalsCount }, (_, i) => {
      const x = Math.random() * 100;
      const size = 8 + Math.random() * 12;
      const duration = 8 + Math.random() * 7;
      const delay = Math.random() * 10;
      const rotate = Math.random() * 360;
      return { x, size, duration, delay, rotate, key: i };
    });
  }, [mounted, petalsCount]);

  // Reduce petals when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setPetalsCount(3); // Keep only 3 petals
      } else {
        setPetalsCount(8); // Restore all petals
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes sakuraFall {
          0% { transform: translateY(-20px) rotate(0deg) translateX(0); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translateY(100vh) rotate(720deg) translateX(100px); opacity: 0; }
        }
      `}</style>
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ contain: 'strict' }}>
        {petals.map((p) => (
          <div
            key={p.key}
            className="absolute will-change-transform"
            style={{
              left: `${p.x}%`,
              top: '-20px',
              width: `${p.size}px`,
              height: `${p.size * 0.6}px`,
              background: `linear-gradient(135deg, #fbb6ce 0%, #f687b3 50%, #ed64a6 100%)`,
              borderRadius: '100% 0 100% 0',
              opacity: 0.7,
              transform: `rotate(${p.rotate}deg)`,
              animation: `sakuraFall ${p.duration}s linear ${p.delay}s infinite`,
              filter: 'blur(0.5px)',
            }}
          />
        ))}
      </div>
    </>
  );
}
