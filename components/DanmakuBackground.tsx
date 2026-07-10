"use client";

import { useMemo } from "react";
import { siteConfig } from "../siteConfig";
import { useEffectQuality, type EffectQuality } from "./EffectQualityProvider";

const DANMAKU_BUDGETS: Record<EffectQuality, number> = {
  high: 6,
  low: 3,
  static: 0,
};

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 999.91) * 43758.5453;
  return value - Math.floor(value);
}

function effectValue(value: number, unit: string) {
  return `${value.toFixed(3)}${unit}`;
}

export default function DanmakuBackground() {
  const { quality } = useEffectQuality();
  const tracks = useMemo(() => {
    const list = siteConfig.danmakuList;
    if (!list.length) return [];

    return Array.from({ length: DANMAKU_BUDGETS[quality] }, (_, index) => {
      const seed = index + 1;
      const duration = 24 + pseudoRandom(seed + 47) * 10;
      return {
        id: index,
        text: list[Math.floor(pseudoRandom(seed + 13) * list.length)],
        top: 18 + pseudoRandom(seed + 79) * 52,
        duration,
        delay: -pseudoRandom(seed + 113) * duration,
      };
    });
  }, [quality]);

  if (quality === "static") return null;
  if (!tracks.length) return null;

  return (
    <div
      className="effect-layer fixed inset-0 z-[1] overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{ contain: "strict" }}
    >
      {tracks.map((track) => (
        <div
          key={track.id}
          className="effect-danmaku-track"
          style={{
            left: '100vw',
            top: effectValue(track.top, "%"),
            animationDuration: effectValue(track.duration, "s"),
            animationDelay: effectValue(track.delay, "s"),
          }}
        >
          {track.text}
        </div>
      ))}
    </div>
  );
}
