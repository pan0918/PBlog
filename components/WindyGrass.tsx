"use client";
import { useState, useEffect, useMemo } from 'react';
import { useTheme } from './ThemeProvider';

export default function WindyGrass() {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [bladesCount, setBladesCount] = useState(30);

  const bladesData = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: bladesCount }, (_, i) => {
      const x = (i / bladesCount) * 100 + (Math.random() - 0.5) * 2.4;
      const height = 26 + Math.random() * 48;
      const width = 1.5 + Math.random() * 2.8;
      const duration = 1.6 + Math.random() * 2.2;
      const delay = Math.random() * 2;
      return { x, height, width, duration, delay, key: i };
    });
  }, [mounted, bladesCount]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setBladesCount(10);
      } else {
        setBladesCount(30);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes swayGrass {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}</style>
      <div
        className="fixed bottom-0 left-0 right-0 h-24 overflow-hidden pointer-events-none z-[5]"
        style={{
          WebkitMaskImage: 'linear-gradient(to top, black 12%, rgba(0,0,0,0.78) 52%, transparent 100%)',
          maskImage: 'linear-gradient(to top, black 12%, rgba(0,0,0,0.78) 52%, transparent 100%)',
          contain: 'strict',
        }}
      >
        {bladesData.map((b) => (
          <div
            key={b.key}
            className="absolute bottom-0 will-change-transform"
            style={{
              left: `${b.x}%`,
              width: `${b.width}px`,
              height: `${b.height}px`,
              background: isDark
                ? `linear-gradient(to top, rgba(151,124,88,0.28), rgba(151,124,88,0.04))`
                : `linear-gradient(to top, rgba(90,165,106,0.42), rgba(90,165,106,0.08))`,
              borderRadius: '50% 50% 0 0',
              transformOrigin: 'bottom center',
              animation: `swayGrass ${b.duration}s ease-in-out ${b.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}
