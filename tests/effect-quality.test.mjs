import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("effect quality uses shared runtime decisions and pre-paint root classes", async () => {
  const [provider, layout, decorations, styles] = await Promise.all([
    readFile("components/EffectQualityProvider.tsx", "utf8"),
    readFile("app/layout.tsx", "utf8"),
    readFile("components/ClientDecorations.tsx", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);

  assert.match(provider, /resolveEffectQuality/);
  assert.match(provider, /from ["']\.\.\/lib\/effects["']/);
  assert.doesNotMatch(provider, /function resolveEffectQuality/);
  assert.match(provider, /navigator\.hardwareConcurrency/);
  assert.match(provider, /viewportWidth:\s*window\.innerWidth/);
  assert.match(provider, /hardwareConcurrency:\s*navigator\.hardwareConcurrency/);
  assert.match(provider, /visibilitychange/);
  assert.match(provider, /removeEventListener/);
  assert.match(layout, /<EffectQualityProvider>/);
  assert.match(layout, /prefers-reduced-motion: reduce/);
  assert.match(layout, /hardwareConcurrency/);
  assert.match(layout, /innerWidth<768/);
  assert.match(layout, /effects-static/);
  assert.match(layout, /effects-low/);
  assert.match(layout, /effects-high/);
  assert.match(layout, /document\.hidden/);
  assert.match(layout, /effects-paused/);
  assert.doesNotMatch(decorations, /addEventListener\(['"]visibilitychange/);
  assert.match(styles, /html\.effects-paused \*,[\s\S]*animation-play-state: paused !important;[\s\S]*transition: none !important;/);
  assert.doesNotMatch(styles, /html\.effects-paused audio/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.effect-layer[\s\S]*animation:\s*none !important/);
});
