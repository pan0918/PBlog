import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("homepage uses soft cream background and wave tokens", async () => {
  const [globals, hero, page, layout, decorations, danmaku, projects, timeline] = await Promise.all([
    readFile("app/globals.css", "utf8"),
    readFile("components/HeroBanner.tsx", "utf8"),
    readFile("app/page.tsx", "utf8"),
    readFile("app/layout.tsx", "utf8"),
    readFile("components/ClientDecorations.tsx", "utf8"),
    readFile("components/DanmakuBackground.tsx", "utf8"),
    readFile("app/projects/ProjectsBoard.tsx", "utf8"),
    readFile("components/TimelineClient.tsx", "utf8"),
  ]);

  assert.match(globals, /--bg-cream:\s*#f7efe7/i);
  assert.match(globals, /--surface-glass:\s*rgba\(255,\s*250,\s*244,\s*0\.68\)/i);
  assert.match(globals, /--page-bg-dark:\s*linear-gradient\(180deg,\s*#2a211c\s*0%,\s*#241b17\s*46%,\s*#1b1411\s*100%\)/i);
  assert.match(globals, /html\.dark body/i);
  assert.match(hero, /WAVE_COLORS/);
  assert.match(hero, /const WAVE_HEIGHT = 126/);
  assert.match(hero, /#f7efe7/i);
  assert.match(hero, /#241b17/i);
  assert.doesNotMatch(hero, /#d4a574/i);
  assert.doesNotMatch(page, /<WindyGrass \/>/);
  assert.match(layout, /body className="[^"]*warm-page-surface/);
  assert.match(layout, /id="app-mount-root" className="flex-1 flex flex-col min-h-screen"/);
  assert.match(layout, /<ClientDecorations \/>/);
  assert.match(decorations, /<BackgroundEffects \/>/);
  assert.doesNotMatch(layout, /style=\{\{\s*background:\s*'var\(--page-bg\)'\s*\}\}/);
  assert.match(danmaku, /high:\s*6/);
  assert.match(danmaku, /low:\s*3/);
  assert.match(danmaku, /static:\s*0/);
  assert.doesNotMatch(danmaku, /onAnimationEnd|setInterval|setItems/);
  assert.match(danmaku, /left:\s*'100vw'/);
  assert.match(projects, /soft-glass-panel-strong/);
  assert.match(projects, /from-amber-400 to-orange-500/);
  assert.match(timeline, /from-amber-500 to-orange-400/);
  assert.match(timeline, /soft-glass-panel block rounded-2xl/);
});

test("post profile sidebar and theme toggles use synchronized surfaces", async () => {
  const [globals, profileCard, postPage, themeProvider, layout] = await Promise.all([
    readFile("app/globals.css", "utf8"),
    readFile("components/ProfileCard.tsx", "utf8"),
    readFile("app/posts/[[...slug]]/page.tsx", "utf8"),
    readFile("components/ThemeProvider.tsx", "utf8"),
    readFile("app/layout.tsx", "utf8"),
  ]);

  assert.match(profileCard, /surfaceTone\?:\s*'warm'\s*\|\s*'slate'/);
  assert.match(profileCard, /soft-glass-panel-slate/);
  assert.match(postPage, /<ProfileCard showStats=\{false\} surfaceTone="slate" \/>/);

  assert.match(globals, /--theme-transition-duration:\s*640ms/);
  assert.match(globals, /html\.theme-transitioning \*/);
  assert.match(globals, /transition-duration:\s*var\(--theme-transition-duration\)\s*!important/);
  assert.match(globals, /\.dark \.soft-glass-panel-slate/);

  assert.match(themeProvider, /THEME_TRANSITION_MS = 640/);
  assert.match(themeProvider, /theme-transitioning/);
  assert.match(themeProvider, /window\.clearTimeout/);
  assert.doesNotMatch(layout, /theme-transitioning/);
});
