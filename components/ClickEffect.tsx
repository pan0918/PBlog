"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEffectQuality } from "./EffectQualityProvider";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
};

const CLICK_EFFECT_BUDGETS = {
  high: { fps: 30, dpr: 1.5, maxParticles: 12 },
  low: { fps: 20, dpr: 1.25, maxParticles: 6 },
} as const;

const PARTICLE_COLORS = ["#818cf8", "#a78bfa", "#c084fc", "#e879f9", "#f472b6"];

export default function ClickEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animIdRef = useRef<number>(0);
  const isRunningRef = useRef(false);
  const { quality, isVisible } = useEffectQuality();
  const budget = quality === "static" ? null : CLICK_EFFECT_BUDGETS[quality];

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(animIdRef.current);
    animIdRef.current = 0;
    isRunningRef.current = false;
  }, []);

  const startAnimation = useCallback(() => {
    if (!budget || !isVisible || document.hidden || isRunningRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { fps } = budget;
    const frameInterval = 1000 / fps;
    let lastFrameTime: number | null = null;
    isRunningRef.current = true;

    const animate = (timestamp: number) => {
      if (document.hidden || !isVisible) {
        isRunningRef.current = false;
        return;
      }

      const elapsed = lastFrameTime === null ? frameInterval : timestamp - lastFrameTime;
      if (elapsed < frameInterval) {
        animIdRef.current = requestAnimationFrame(animate);
        return;
      }

      lastFrameTime = timestamp;
      const delta = Math.min(elapsed, frameInterval * 2) / (1000 / 60);
      const particles = particlesRef.current;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vy += 0.05 * delta;
        particle.alpha -= 0.02 * delta;

        if (particle.alpha <= 0) {
          particles.splice(index, 1);
          continue;
        }

        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (particles.length === 0) {
        isRunningRef.current = false;
        animIdRef.current = 0;
        return;
      }

      animIdRef.current = requestAnimationFrame(animate);
    };

    animIdRef.current = requestAnimationFrame(animate);
  }, [budget, isVisible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (!budget) {
      particlesRef.current = [];
      stopAnimation();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, budget.dpr);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation();
      } else if (particlesRef.current.length > 0) {
        startAnimation();
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (!isVisible || document.hidden) return;

      const particleCount = Math.min(8, budget.maxParticles);
      for (let index = 0; index < particleCount; index += 1) {
        const angle = (Math.PI * 2 / particleCount) * index + Math.random() * 0.5;
        const speed = 2 + Math.random() * 3;
        particlesRef.current.push({
          x: event.clientX,
          y: event.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          size: 3 + Math.random() * 4,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        });
      }

      if (particlesRef.current.length > budget.maxParticles) {
        particlesRef.current.splice(0, particlesRef.current.length - budget.maxParticles);
      }
      startAnimation();
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("click", handleClick);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (isVisible && particlesRef.current.length > 0) startAnimation();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("click", handleClick);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopAnimation();
    };
  }, [budget, isVisible, startAnimation, stopAnimation]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9998] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
