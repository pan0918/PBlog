"use client";

import { useEffect, useState } from 'react';

interface Firefly {
  id: number;
  top: string;
  left: string;
  size: number;
  breatheDuration: number;
  breatheDelay: number;
  floatDuration: number;
  floatDelay: number;
  floatPath: string;
}

export default function Fireflies() {
  const [flies, setFlies] = useState<Firefly[]>([]);

  useEffect(() => {
    const generated: Firefly[] = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: 3 + Math.random() * 4,
      breatheDuration: 3 + Math.random() * 5,
      breatheDelay: Math.random() * -10,
      floatDuration: 15 + Math.random() * 20,
      floatDelay: Math.random() * -20,
      floatPath: `float${Math.floor(Math.random() * 4) + 1}`,
    }));
    setFlies(generated);

    // Reduce particles when page is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFlies(prev => prev.slice(0, 5)); // Keep only 5 particles
      } else {
        setFlies(generated); // Restore all particles
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-10 overflow-hidden mix-blend-screen" style={{ contain: 'strict' }}>
      <style>{`
        @keyframes fireflyBreathe {
          0%, 100% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
            box-shadow: 0 0 10px 3px rgba(100, 255, 150, 0.8), 0 0 20px 6px rgba(50, 255, 100, 0.4);
          }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(10vw, -15vh); }
          66% { transform: translate(-5vw, -20vh); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-12vw, 10vh); }
          66% { transform: translate(8vw, 15vh); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(15vw, 15vh); }
          66% { transform: translate(-10vw, 5vh); }
        }
        @keyframes float4 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-15vw, -10vh); }
          66% { transform: translate(10vw, -15vh); }
        }
      `}</style>

      {flies.map(fly => (
        <div
          key={fly.id}
          className="absolute"
          style={{
            top: fly.top,
            left: fly.left,
            animation: `${fly.floatPath} ${fly.floatDuration}s ease-in-out infinite`,
            animationDelay: `${fly.floatDelay}s`,
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: `${fly.size}px`,
              height: `${fly.size}px`,
              backgroundColor: 'rgba(200, 255, 200, 0.9)',
              animation: `fireflyBreathe ${fly.breatheDuration}s ease-in-out infinite`,
              animationDelay: `${fly.breatheDelay}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
