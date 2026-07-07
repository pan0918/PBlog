import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("music provider streams first and lazily prepares one-track blob fallback for reliable seeking", async () => {
  const provider = await readFile("components/MusicProvider.tsx", "utf8");

  assert.match(provider, /const \[audioSrc, setAudioSrc\]/);
  assert.match(provider, /setAudioSrc\(currentSong\.url\)/);
  assert.match(provider, /preload="metadata"/);
  assert.match(provider, /crossOrigin="anonymous"/);
  assert.match(provider, /prepareSeekableBlob/);
  assert.match(provider, /fetch\(song\.url/);
  assert.match(provider, /res\.blob\(\)/);
  assert.match(provider, /URL\.createObjectURL/);
  assert.match(provider, /URL\.revokeObjectURL/);
  assert.match(provider, /AbortController/);
  assert.doesNotMatch(
    provider,
    /setAudioSrc\(currentSong\.url\)[\s\S]{0,900}fetch\(currentSong\.url/,
  );
});

test("music provider preserves instant playback intent across song switches", async () => {
  const provider = await readFile("components/MusicProvider.tsx", "utf8");

  assert.match(provider, /pendingPlayRef/);
  assert.match(provider, /pendingSeekRatioRef/);
  assert.match(provider, /requestPlayback/);
  assert.match(provider, /audio\.load\(\)/);
  assert.match(provider, /handleCanPlay/);
  assert.doesNotMatch(provider, /setCurrentIndex\(index\);\s*const audio = audioRef\.current;\s*if \(audio\)/);
});

test("music provider never reloads the current track after seeking", async () => {
  const provider = await readFile("components/MusicProvider.tsx", "utf8");

  assert.match(provider, /audio\.currentTime = target/);
  assert.match(provider, /requestPlayback\(\)/);
  assert.doesNotMatch(
    provider,
    /readyState\s*<\s*HTMLMediaElement\.HAVE_CURRENT_DATA[\s\S]{0,180}audio\.load\(\)/,
  );
});

test("music provider does not native-seek an unseekable remote source before blob fallback is ready", async () => {
  const provider = await readFile("components/MusicProvider.tsx", "utf8");

  assert.match(provider, /const ensureSeekableSource/);
  assert.match(provider, /blobReadyIndexRef/);
  assert.match(provider, /pendingSeekRatioRef\.current = ratio/);
  assert.match(provider, /if \(!ensureSeekableSource\(\)\) return/);
});

test("music page seeks lyrics without waiting for smooth scroll work", async () => {
  const musicPage = await readFile("app/music/MusicClient.tsx", "utf8");

  assert.match(musicPage, /onClick=\{\(\) => duration > 0 && handleSeek/);
  assert.match(musicPage, /behavior: 'auto'/);
  assert.doesNotMatch(musicPage, /behavior: 'smooth'/);
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
