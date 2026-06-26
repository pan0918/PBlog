"use client";
import { useState, useEffect, useMemo } from 'react';

export default function Fireflies() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fireflies = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 25 }, (_, i) => {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = 2 + Math.random() * 4;
      const duration = 3 + Math.random() * 4;
      const delay = Math.random() * 5;
      const path = Math.floor(Math.random() * 4);
      const driftDuration = 10 + Math.random() * 10;
      return { x, y, size, duration, delay, path, driftDuration, key: i };
    });
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes fireflyBreath {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes fireflyPath0 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, -40px); }
          50% { transform: translate(-20px, -60px); }
          75% { transform: translate(40px, -20px); }
        }
        @keyframes fireflyPath1 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-50px, 30px); }
          66% { transform: translate(20px, -50px); }
        }
        @keyframes fireflyPath2 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(60px, 20px); }
          50% { transform: translate(30px, -30px); }
          75% { transform: translate(-40px, 10px); }
        }
        @keyframes fireflyPath3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, -40px); }
        }
      `}</style>
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {fireflies.map((p) => (
          <div
            key={p.key}
            className="absolute rounded-full will-change-transform"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: 'radial-gradient(circle, #fde68a 0%, #f59e0b 30%, transparent 70%)',
              boxShadow: `0 0 ${p.size * 3}px ${p.size}px rgba(251, 191, 36, 0.4)`,
              animation: `fireflyBreath ${p.duration}s ease-in-out infinite ${p.delay}s, fireflyPath${p.path} ${p.driftDuration}s ease-in-out infinite ${p.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}
