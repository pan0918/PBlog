import assert from "node:assert/strict";
import test from "node:test";
import {
  EFFECT_BUDGETS,
  createFixedEffectList,
  effectValue,
  getEffectBudget,
  pseudoRandom,
  resolveEffectQuality,
} from "../lib/effects.ts";

test("resolveEffectQuality prioritizes reduced motion then device limits", () => {
  assert.equal(resolveEffectQuality({ reducedMotion: true, viewportWidth: 1440, hardwareConcurrency: 16 }), "static");
  assert.equal(resolveEffectQuality({ reducedMotion: false, viewportWidth: 767, hardwareConcurrency: 16 }), "low");
  assert.equal(resolveEffectQuality({ reducedMotion: false, viewportWidth: 1440, hardwareConcurrency: 4 }), "low");
  assert.equal(resolveEffectQuality({ reducedMotion: false, viewportWidth: 768, hardwareConcurrency: 8 }), "high");
});

test("EFFECT_BUDGETS centralizes every decorative layer budget", () => {
  assert.deepEqual(EFFECT_BUDGETS, {
    fireflies: { high: 20, low: 10, static: 5 },
    sakura: { high: 14, low: 8, static: 5 },
    grass: { high: 30, low: 15, static: 10 },
    danmaku: { high: 6, low: 3, static: 0 },
  });
});

test("fixed effect lists use every component budget and remain stable", () => {
  for (const kind of Object.keys(EFFECT_BUDGETS)) {
    for (const quality of ["high", "low", "static"]) {
      const first = createFixedEffectList(kind, quality, (index) => ({ index, kind, quality }));
      const second = createFixedEffectList(kind, quality, (index) => ({ index, kind, quality }));

      assert.equal(first.length, getEffectBudget(kind, quality));
      assert.equal(second.length, getEffectBudget(kind, quality));
      assert.deepEqual(first, second);
    }
  }

  assert.deepEqual(createFixedEffectList("danmaku", "static", (index) => index), []);
});

test("effect utility values are deterministic and quantized to three decimals", () => {
  assert.equal(pseudoRandom(17), pseudoRandom(17));
  assert.notEqual(pseudoRandom(17), pseudoRandom(18));
  assert.ok(pseudoRandom(17) >= 0 && pseudoRandom(17) < 1);
  assert.equal(effectValue(1.23456, "px"), "1.235px");
  assert.equal(effectValue(-0.0049, "s"), "-0.005s");
});
