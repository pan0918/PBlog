import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("music playback derives progress and skips unchanged store updates", async () => {
  const [provider, store] = await Promise.all([
    readFile("components/MusicProvider.tsx", "utf8"),
    readFile("lib/music-playback-store.ts", "utf8"),
  ]);

  assert.match(store, /musicPlaybackStore/);
  assert.match(provider, /useMusicPlayback/);
  assert.match(provider, /useSyncExternalStore/);
  assert.match(provider, /musicPlaybackStore\.update/);
  assert.doesNotMatch(provider, /progress,\s*\n\s*currentTime/);
  assert.doesNotMatch(provider, /setProgress\(/);
  assert.doesNotMatch(store, /^\s*progress:\s*number/m);
  assert.match(store, /Object\.is/);
  assert.match(provider, /useCurrentLyric/);
});

test("lyric components subscribe without reacting to timeline updates", async () => {
  const [cloudPlayer, sidebarLyric] = await Promise.all([
    readFile("components/CloudPlayer.tsx", "utf8"),
    readFile("components/SidebarLyric.tsx", "utf8"),
  ]);

  assert.match(cloudPlayer, /MusicProgressBar/);
  assert.doesNotMatch(cloudPlayer, /setInterval\(/);
  assert.match(cloudPlayer, /useCurrentLyric\(\)/);
  assert.match(sidebarLyric, /useCurrentLyric\(\)/);
});

test("decorative layers remain mounted regardless of music playback", async () => {
  const decorations = await readFile("components/ClientDecorations.tsx", "utf8");

  assert.match(decorations, /<BackgroundEffects \/>/);
  assert.match(decorations, /<DanmakuBackground \/>/);
  assert.match(decorations, /<CyberCat \/>/);
  assert.match(decorations, /<ClickEffect \/>/);
  assert.match(decorations, /<GlobalToolbox \/>/);
  assert.doesNotMatch(decorations, /reduceDecorations/);
  assert.doesNotMatch(decorations, /isPlaying/);
});
