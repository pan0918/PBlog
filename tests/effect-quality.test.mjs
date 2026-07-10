import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("effect quality provider centralizes quality, visibility, integration, and pause styles", async () => {
  const [provider, layout, decorations, styles] = await Promise.all([
    readFile("components/EffectQualityProvider.tsx", "utf8"),
    readFile("app/layout.tsx", "utf8"),
    readFile("components/ClientDecorations.tsx", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);

  assert.match(provider, /prefers-reduced-motion: reduce/);
  assert.match(provider, /navigator\.hardwareConcurrency/);
  assert.match(provider, /window\.innerWidth < 768/);
  assert.match(provider, /visibilitychange/);
  assert.match(provider, /removeEventListener/);
  assert.match(layout, /<EffectQualityProvider>/);
  assert.doesNotMatch(decorations, /addEventListener\(['"]visibilitychange/);
  assert.match(styles, /html\.effects-paused \*,[\s\S]*animation-play-state: paused !important;[\s\S]*transition: none !important;/);
  assert.doesNotMatch(styles, /html\.effects-paused audio/);
});
