"use client";

import { useMemo, type CSSProperties } from "react";
import { useEffectQuality, type EffectQuality } from "./EffectQualityProvider";

const FIREFLY_BUDGETS: Record<EffectQuality, number> = {
  high: 20,
  low: 10,
  static: 5,
};

type FireflyMotionStyle = CSSProperties & {
  "--firefly-top": string;
  "--firefly-left": string;
  "--firefly-float-duration": string;
  "--firefly-float-delay": string;
};

type FireflyGlowStyle = CSSProperties & {
  "--firefly-glow-size": string;
  "--firefly-glow-offset": string;
  "--firefly-pulse-duration": string;
  "--firefly-pulse-delay": string;
};

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 999.91) * 43758.5453;
  return value - Math.floor(value);
}

function effectValue(value: number, unit: string) {
  return `${value.toFixed(3)}${unit}`;
}

export default function Fireflies() {
  const { quality } = useEffectQuality();
  const flies = useMemo(
    () => Array.from({ length: FIREFLY_BUDGETS[quality] }, (_, index) => {
      const seed = index + 1;
      return {
        id: index,
        top: pseudoRandom(seed) * 100,
        left: pseudoRandom(seed + 31) * 100,
        size: 3 + pseudoRandom(seed + 67) * 4,
        pulseDuration: 3 + pseudoRandom(seed + 101) * 5,
        pulseDelay: -pseudoRandom(seed + 137) * 10,
        floatDuration: 15 + pseudoRandom(seed + 173) * 20,
        floatDelay: -pseudoRandom(seed + 211) * 20,
        path: (index % 4) + 1,
      };
    }),
    [quality],
  );

  return (
    <div
      className="effect-layer fixed inset-0 z-10 h-full w-full overflow-hidden pointer-events-none mix-blend-screen"
      style={{ contain: "strict" }}
      aria-hidden="true"
    >
      {flies.map((fly) => {
        const motionStyle: FireflyMotionStyle = {
          "--firefly-top": effectValue(fly.top, "%"),
          "--firefly-left": effectValue(fly.left, "%"),
          "--firefly-float-duration": effectValue(fly.floatDuration, "s"),
          "--firefly-float-delay": effectValue(fly.floatDelay, "s"),
        };
        const glowStyle: FireflyGlowStyle = {
          "--firefly-glow-size": effectValue(fly.size * 7, "px"),
          "--firefly-glow-offset": effectValue(fly.size * -3, "px"),
          "--firefly-pulse-duration": effectValue(fly.pulseDuration, "s"),
          "--firefly-pulse-delay": effectValue(fly.pulseDelay, "s"),
        };

        return (
          <div
            key={fly.id}
            className={`effect-firefly-motion effect-firefly-path-${fly.path}`}
            style={motionStyle}
          >
            <div className="effect-firefly-glow" style={glowStyle} />
          </div>
        );
      })}
    </div>
  );
}
