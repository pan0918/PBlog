'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { useEffectQuality } from './EffectQualityProvider';

const WAVE_HEIGHT = 126;
const WAVE_COLORS = {
  light: {
    back: 'rgba(255, 250, 244, 0.72)',
    main: '#f7efe7',
    front: 'rgba(255, 246, 235, 0.86)',
    highlight: 'rgba(255, 255, 255, 0.52)',
  },
  dark: {
    back: 'rgba(67, 53, 45, 0.48)',
    main: '#241b17',
    front: 'rgba(58, 45, 38, 0.58)',
    highlight: 'rgba(255, 214, 176, 0.08)',
  },
};

function WaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDark } = useTheme();
  const { quality, isVisible } = useEffectQuality();
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fps = quality === 'high' ? 30 : 20;
    const frameInterval = 1000 / fps;
    const palette = isDark ? WAVE_COLORS.dark : WAVE_COLORS.light;
    let lastFrameTime: number | null = null;

    const drawLayer = (
      w: number,
      h: number,
      offset: number,
      amplitude: number,
      color: string,
      speed: number,
      baseline: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, baseline);

      for (let x = 0; x <= w; x += 3) {
        const y = baseline
          + Math.sin(x * 0.0062 + timeRef.current * speed + offset) * amplitude
          + Math.sin(x * 0.0125 + timeRef.current * speed * 0.72 + offset) * (amplitude * 0.45);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const haze = ctx.createLinearGradient(0, 0, 0, h);
      haze.addColorStop(0, 'rgba(255,255,255,0)');
      haze.addColorStop(0.55, palette.highlight);
      haze.addColorStop(1, palette.main);
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);

      drawLayer(w, h, 0, 10, palette.back, 0.62, h * 0.46);
      drawLayer(w, h, 1.7, 8, palette.main, 0.82, h * 0.58);
      drawLayer(w, h, 3.1, 5.5, palette.front, 0.48, h * 0.69);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.style.height = `${WAVE_HEIGHT}px`;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(WAVE_HEIGHT * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const animate = (timestamp: number) => {
      if (!isVisible || quality === 'static') return;

      const elapsed = lastFrameTime === null ? frameInterval : timestamp - lastFrameTime;
      if (lastFrameTime === null || elapsed >= frameInterval) {
        const delta = Math.min(lastFrameTime === null ? frameInterval : elapsed, frameInterval * 2);
        timeRef.current += 0.022 * (delta / (1000 / 60));
        lastFrameTime = timestamp;
        draw();
      }
      animRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);

    if (quality !== 'static' && isVisible) {
      animRef.current = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
      animRef.current = 0;
    };
  }, [isDark, isVisible, quality]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-0 left-0 block w-full"
      style={{ height: `${WAVE_HEIGHT}px` }}
    />
  );
}

export default function HeroBanner() {
  return (
    <div className="relative w-full">
      <div
        className="relative w-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://a68b43cc.cloudflare-imgbed-9pz.pages.dev/file/1782476376234_博客首页.png)',
          height: '68vh',
          minHeight: '430px',
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(21,17,15,0.48)_0%,rgba(42,32,26,0.2)_42%,rgba(255,244,232,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_36%,rgba(255,238,219,0.24),transparent_34%)]" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 pb-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl font-black text-white md:text-6xl"
            style={{
              textShadow: '0 8px 34px rgba(30, 22, 18, 0.54)',
              letterSpacing: '0.02em',
            }}
          >
            Never Say Never
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-4 text-sm font-medium text-white/90 md:text-lg"
            style={{ textShadow: '0 3px 18px rgba(30, 22, 18, 0.45)' }}
          >
            代码与AI之间的桥梁，用代码训练会思考的系统
          </motion.p>
        </div>
      </div>

      <WaveCanvas />
    </div>
  );
}
