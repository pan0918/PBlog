"use client";

import { useMemo, type CSSProperties } from "react";
import { useEffectQuality, type EffectQuality } from "./EffectQualityProvider";

const SAKURA_BUDGETS: Record<EffectQuality, number> = {
  high: 14,
  low: 8,
  static: 5,
};

type SakuraStyle = CSSProperties & {
  "--sakura-left": string;
  "--sakura-size": string;
  "--sakura-height": string;
  "--sakura-duration": string;
  "--sakura-delay": string;
  "--sakura-rotation": string;
  "--sakura-drift": string;
  "--sakura-static-top": string;
};

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 999.91) * 43758.5453;
  return value - Math.floor(value);
}

function effectValue(value: number, unit: string) {
  return `${value.toFixed(3)}${unit}`;
}

export default function Sakura() {
  const { quality } = useEffectQuality();
  const petals = useMemo(
    () => Array.from({ length: SAKURA_BUDGETS[quality] }, (_, index) => {
      const seed = index + 1;
      return {
        id: index,
        left: pseudoRandom(seed) * 100,
        size: 8 + pseudoRandom(seed + 29) * 12,
        duration: 8 + pseudoRandom(seed + 61) * 7,
        delay: -pseudoRandom(seed + 97) * 15,
        rotation: pseudoRandom(seed + 131) * 360,
        drift: 70 + pseudoRandom(seed + 167) * 60,
        staticTop: 10 + pseudoRandom(seed + 199) * 80,
      };
    }),
    [quality],
  );

  return (
    <div
      className="effect-layer absolute inset-0 h-full w-full overflow-hidden pointer-events-none"
      style={{ contain: "strict" }}
      aria-hidden="true"
    >
      {petals.map((petal) => {
        const style: SakuraStyle = {
          "--sakura-left": effectValue(petal.left, "%"),
          "--sakura-size": effectValue(petal.size, "px"),
          "--sakura-height": effectValue(petal.size * 0.6, "px"),
          "--sakura-duration": effectValue(petal.duration, "s"),
          "--sakura-delay": effectValue(petal.delay, "s"),
          "--sakura-rotation": effectValue(petal.rotation, "deg"),
          "--sakura-drift": effectValue(petal.drift, "px"),
          "--sakura-static-top": effectValue(petal.staticTop, "%"),
        };

        return <div key={petal.id} className="effect-sakura-petal" style={style} />;
      })}
    </div>
  );
}
