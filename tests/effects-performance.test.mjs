import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readEffectSources = () => Promise.all([
  readFile("components/Fireflies.tsx", "utf8"),
  readFile("components/Sakura.tsx", "utf8"),
  readFile("components/WindyGrass.tsx", "utf8"),
  readFile("components/DanmakuBackground.tsx", "utf8"),
]);

test("particle layers use deterministic fixed quality budgets", async () => {
  const [fireflies, sakura, grass, danmaku] = await readEffectSources();

  for (const source of [fireflies, sakura, grass, danmaku]) {
    assert.match(source, /useEffectQuality\(\)/);
    assert.match(source, /from ["']\.\.\/lib\/effects["']/);
    assert.match(source, /createFixedEffectList/);
    assert.match(source, /pseudoRandom/);
    assert.match(source, /effectValue/);
    assert.match(source, /useMemo\([\s\S]*\[quality\]/);
    assert.doesNotMatch(source, /function (?:pseudoRandom|effectValue)\(/);
    assert.doesNotMatch(source, /(?:EFFECT_BUDGETS|FIREFLY|SAKURA|GRASS|DANMAKU)_BUDGETS|Math\.random|visibilitychange/);
  }
});

test("particle components avoid regenerating state and per-particle paint costs", async () => {
  const [fireflies, sakura, grass] = await readEffectSources();

  assert.doesNotMatch(fireflies, /setFlies|\buseState\s*(?:<|\()|\buseEffect\s*\(|box-shadow|filter:\s*['"]blur/);
  assert.match(fireflies, /effect-firefly-motion/);
  assert.match(fireflies, /effect-firefly-glow/);

  assert.doesNotMatch(sakura, /\buseState\s*(?:<|\()|\buseEffect\s*\(|will-change-transform|filter:\s*['"]blur/);
  assert.doesNotMatch(grass, /\buseState\s*(?:<|\()|\buseEffect\s*\(|will-change-transform/);
  assert.match(sakura, /type SakuraStyle = CSSProperties & \{/);
  assert.match(grass, /type GrassStyle = CSSProperties & \{/);

  for (const source of [fireflies, sakura, grass]) {
    assert.doesNotMatch(source, /<style/);
    assert.doesNotMatch(source, /will-change/);
  }
});

test("danmaku uses reusable deterministic tracks without lifecycle growth", async () => {
  const danmaku = await readFile("components/DanmakuBackground.tsx", "utf8");

  assert.match(danmaku, /if \(quality === ["']static["']\) return null/);
  assert.match(danmaku, /siteConfig\.danmakuList/);
  assert.match(danmaku, /animationDelay:\s*effectValue\(track\.delay, "s"\)/);
  assert.doesNotMatch(danmaku, /setInterval|setTimeout|onAnimationEnd|\buseState\s*(?:<|\()|\buseEffect\s*\(|\buseRef\s*(?:<|\()|setItems|removeDanmaku/);
  assert.doesNotMatch(danmaku, /<style/);
});

test("deterministic effect styles quantize values across server and browser runtimes", async () => {
  const [fireflies, sakura, grass, danmaku] = await readEffectSources();

  for (const source of [fireflies, sakura, grass, danmaku]) {
    assert.match(source, /effectValue/);
    assert.doesNotMatch(source, /toFixed\(3\)/);
  }

  assert.match(fireflies, /effectValue\(fly\.top, "%"\)/);
  assert.match(sakura, /effectValue\(petal\.rotation, "deg"\)/);
  assert.match(grass, /effectValue\(blade\.height, "px"\)/);
  assert.match(danmaku, /effectValue\(track\.delay, "s"\)/);
});

test("global effect CSS pauses layers and animates only compositor-safe properties", async () => {
  const [globals, layout] = await Promise.all([
    readFile("app/globals.css", "utf8"),
    readFile("app/layout.tsx", "utf8"),
  ]);
  const effectCss = globals.slice(globals.indexOf("/* ---- Decorative effect layers ---- */"));

  assert.match(effectCss, /@keyframes site-firefly-pulse/);
  assert.match(effectCss, /@keyframes site-sakura-fall/);
  assert.match(effectCss, /@keyframes site-grass-sway/);
  assert.match(effectCss, /@keyframes site-danmaku-travel/);
  assert.match(effectCss, /@keyframes site-gradient-drift/);
  assert.match(effectCss, /\.effect-firefly-glow\s*\{[\s\S]*radial-gradient/);
  assert.match(effectCss, /html\.effects-paused \.effect-layer \*,\s*html\.effects-static \.effect-layer \*\s*\{\s*animation-play-state:\s*paused !important;/);
  assert.match(effectCss, /html\.effects-static \.effect-(?:firefly-motion|sakura-petal)[\s\S]*animation:\s*none/);
  assert.match(effectCss, /html\.effects-low \.site-gradient-layer\s*\{\s*animation-duration:\s*(?:4[5-9]|[5-9]\d)s/);
  assert.match(effectCss, /translate3d\(calc\(-100vw - 100%\),\s*0,\s*0\)/);
  assert.doesNotMatch(effectCss, /background-position|(?<!backdrop-)filter:\s*blur|will-change:\s*transform|box-shadow/);

  assert.match(layout, /className="site-gradient-layer"/);
  assert.match(layout, /className="site-ambient-glow"/);
  assert.doesNotMatch(layout, /backgroundSize:\s*['"]400% 400%/);
  assert.doesNotMatch(layout, /gradientMove|backgroundPosition|blur-\[(?:40|50)px\]/);
});

test("CSS hides high-quality DOM immediately for lower pre-paint quality classes", async () => {
  const globals = await readFile("app/globals.css", "utf8");

  assert.match(globals, /html\.effects-low \.effect-firefly-motion:nth-child\(n \+ 11\)/);
  assert.match(globals, /html\.effects-low \.effect-sakura-petal:nth-child\(n \+ 9\)/);
  assert.match(globals, /html\.effects-low \.effect-grass-blade:nth-child\(n \+ 16\)/);
  assert.match(globals, /html\.effects-low \.effect-danmaku-track:nth-child\(n \+ 4\)/);
  assert.match(globals, /html\.effects-static \.effect-firefly-motion:nth-child\(n \+ 6\)/);
  assert.match(globals, /html\.effects-static \.effect-sakura-petal:nth-child\(n \+ 6\)/);
  assert.match(globals, /html\.effects-static \.effect-grass-blade:nth-child\(n \+ 11\)/);
  assert.match(globals, /html\.effects-static \.effect-danmaku-track:nth-child\(n \+ 1\)/);
});
