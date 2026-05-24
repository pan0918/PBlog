"use client";
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

export default function WindyGrass() {
  const { isDark } = useTheme();
  const [bladesData, setBladesData] = useState<any[]>([]);

  useEffect(() => {
    const blades = Array.from({ length: 150 }, (_, i) => {
      const x = (i / 150) * 100 + (Math.random() - 0.5) * 2;
      const height = 30 + Math.random() * 50;
      const width = 2 + Math.random() * 3;
      const duration = 1.5 + Math.random() * 2;
      const delay = Math.random() * 2;
      return { x, height, width, duration, delay };
    });
    setBladesData(blades);
  }, []);

  const blades = bladesData.map((b, i) => (
    <div
      key={i}
      className="absolute bottom-0"
      style={{
        left: `${b.x}%`,
        width: `${b.width}px`,
        height: `${b.height}px`,
        background: isDark
          ? `linear-gradient(to top, rgba(148,163,184,0.3), rgba(148,163,184,0.05))`
          : `linear-gradient(to top, rgba(34,197,94,0.5), rgba(34,197,94,0.1))`,
        borderRadius: '50% 50% 0 0',
        transformOrigin: 'bottom center',
        animation: `swayGrass ${b.duration}s ease-in-out ${b.delay}s infinite`,
      }}
    />
  ));

  return (
    <>
      <style>{`
        @keyframes swayGrass {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}</style>
      <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden pointer-events-none">
        {blades}
      </div>
    </>
  );
}
