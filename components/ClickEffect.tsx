"use client";
import { useEffect, useRef, useCallback } from 'react';

export default function ClickEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number; color: string }[]>([]);
  const animIdRef = useRef<number>(0);
  const isRunningRef = useRef(false);

  const startAnimation = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const particles = particlesRef.current;
      if (particles.length === 0) {
        isRunningRef.current = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.alpha -= 0.02;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      animIdRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6'];

    const handleClick = (e: MouseEvent) => {
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
        const speed = 2 + Math.random() * 3;
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          size: 3 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      startAnimation();
    };
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animIdRef.current);
    };
  }, [startAnimation]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9998] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
