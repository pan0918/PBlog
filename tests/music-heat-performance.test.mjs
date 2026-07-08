import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("music playback progress lives outside react context to avoid full-tree re-renders", async () => {
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
});

test("cloud player isolates lyric/progress updates from the main card shell", async () => {
  const cloudPlayer = await readFile("components/CloudPlayer.tsx", "utf8");

  assert.match(cloudPlayer, /useMusicPlayback/);
  assert.match(cloudPlayer, /MusicProgressBar/);
  assert.doesNotMatch(cloudPlayer, /setInterval\(/);
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
