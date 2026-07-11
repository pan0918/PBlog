import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("music provider streams directly from the song URL with native range seeking", async () => {
  const provider = await readFile("components/MusicProvider.tsx", "utf8");

  assert.match(provider, /src=\{currentSong\.url\}/);
  assert.match(provider, /seekToSeconds/);
  assert.match(provider, /seekToPercent/);
  assert.match(provider, /onDurationChange/);
  assert.match(provider, /preload="metadata"/);
  assert.match(provider, /crossOrigin="anonymous"/);
  assert.doesNotMatch(provider, /blobUrlRef|prepareSeekableBlob|ensureSeekableSource/);
  assert.doesNotMatch(provider, /res\.blob\(|URL\.createObjectURL|audioSrc/);
  assert.doesNotMatch(provider, /fetch\(song\.url/);
  assert.doesNotMatch(provider, /t\s*>=\s*dur\s*-\s*0\.3/);
});

test("seek controls use explicit percent and seconds APIs", async () => {
  const [progressBar, musicPage] = await Promise.all([
    readFile("components/MusicProgressBar.tsx", "utf8"),
    readFile("app/music/MusicClient.tsx", "utf8"),
  ]);

  assert.match(progressBar, /seekToPercent\(Number\(e\.target\.value\)\)/);
  assert.match(musicPage, /seekToSeconds\(line\.time\)/);
});

test("audio seeking keeps the lyric scroller mounted", async () => {
  const musicPage = await readFile("app/music/MusicClient.tsx", "utf8");

  assert.doesNotMatch(musicPage, /if\s*\(\s*isLoading\s*\|\|\s*!currentSong\s*\)/);
  assert.doesNotMatch(musicPage, /唤醒音频引擎/);
  assert.match(musicPage, /if\s*\(\s*!currentSong\s*\)/);
  assert.match(musicPage, /data-player-shell/);
  assert.match(musicPage, /aria-busy="true"/);
});

test("music cover art uses optimized Next images", async () => {
  const [config, musicPage, floatingPlayer, sidebarLyric] = await Promise.all([
    readFile("next.config.ts", "utf8"),
    readFile("app/music/MusicClient.tsx", "utf8"),
    readFile("components/FloatingPlayer.tsx", "utf8"),
    readFile("components/SidebarLyric.tsx", "utf8"),
  ]);

  assert.match(config, /hostname:\s*"p3\.music\.126\.net"/);
  assert.match(config, /hostname:\s*"p4\.music\.126\.net"/);

  for (const source of [musicPage, floatingPlayer, sidebarLyric]) {
    assert.match(source, /from ['"]next\/image['"]/);
    assert.doesNotMatch(source, /<img\b/);
    assert.match(source, /sizes=/);
    assert.match(source, /quality=\{75\}/);
  }
});
