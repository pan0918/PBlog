"use client";

import { useMemo, type CSSProperties } from "react";
import { useEffectQuality, type EffectQuality } from "./EffectQualityProvider";

const GRASS_BUDGETS: Record<EffectQuality, number> = {
  high: 30,
  low: 15,
  static: 10,
};

type GrassStyle = CSSProperties & {
  "--grass-left": string;
  "--grass-width": string;
  "--grass-height": string;
  "--grass-duration": string;
  "--grass-delay": string;
};

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 999.91) * 43758.5453;
  return value - Math.floor(value);
}

function effectValue(value: number, unit: string) {
  return `${value.toFixed(3)}${unit}`;
}

export default function WindyGrass() {
  const { quality } = useEffectQuality();
  const blades = useMemo(
    () => Array.from({ length: GRASS_BUDGETS[quality] }, (_, index) => {
      const seed = index + 1;
      const count = GRASS_BUDGETS[quality];
      return {
        id: index,
        left: (index / count) * 100 + (pseudoRandom(seed) - 0.5) * 2.4,
        height: 26 + pseudoRandom(seed + 37) * 48,
        width: 1.5 + pseudoRandom(seed + 73) * 2.8,
        duration: 1.6 + pseudoRandom(seed + 109) * 2.2,
        delay: -pseudoRandom(seed + 149) * 2,
      };
    }),
    [quality],
  );

  return (
    <div
      className="effect-layer fixed bottom-0 left-0 right-0 z-[5] h-24 overflow-hidden pointer-events-none"
      style={{
        WebkitMaskImage: "linear-gradient(to top, black 12%, rgba(0,0,0,0.78) 52%, transparent 100%)",
        maskImage: "linear-gradient(to top, black 12%, rgba(0,0,0,0.78) 52%, transparent 100%)",
        contain: "strict",
      }}
      aria-hidden="true"
    >
      {blades.map((blade) => {
        const style: GrassStyle = {
          "--grass-left": effectValue(blade.left, "%"),
          "--grass-width": effectValue(blade.width, "px"),
          "--grass-height": effectValue(blade.height, "px"),
          "--grass-duration": effectValue(blade.duration, "s"),
          "--grass-delay": effectValue(blade.delay, "s"),
        };

        return <div key={blade.id} className="effect-grass-blade" style={style} />;
      })}
    </div>
  );
}
