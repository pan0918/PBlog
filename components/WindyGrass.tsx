"use client";

import { useMemo, type CSSProperties } from "react";
import { useEffectQuality } from "./EffectQualityProvider";
import { createFixedEffectList, effectValue, getEffectBudget, pseudoRandom } from "../lib/effects";

type GrassStyle = CSSProperties & {
  "--grass-left": string;
  "--grass-width": string;
  "--grass-height": string;
  "--grass-duration": string;
  "--grass-delay": string;
};

export default function WindyGrass() {
  const { quality } = useEffectQuality();
  const blades = useMemo(
    () => {
      const count = getEffectBudget("grass", quality);
      return createFixedEffectList("grass", quality, (index) => {
        const seed = index + 1;
        return {
          id: index,
          left: (index / count) * 100 + (pseudoRandom(seed) - 0.5) * 2.4,
          height: 26 + pseudoRandom(seed + 37) * 48,
          width: 1.5 + pseudoRandom(seed + 73) * 2.8,
          duration: 1.6 + pseudoRandom(seed + 109) * 2.2,
          delay: -pseudoRandom(seed + 149) * 2,
        };
      });
    },
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
