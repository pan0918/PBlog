"use client";

import { useMemo, type CSSProperties } from "react";
import { useEffectQuality } from "./EffectQualityProvider";
import { createFixedEffectList, effectValue, pseudoRandom } from "../lib/effects";

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

export default function Sakura() {
  const { quality } = useEffectQuality();
  const petals = useMemo(
    () => createFixedEffectList("sakura", quality, (index) => {
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
