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

test("playlist search keeps decorative layers out of the input hit target", async () => {
  const musicPage = await readFile("app/music/MusicClient.tsx", "utf8");

  assert.match(musicPage, /data-playlist-search-glow[^>]*className="[^"]*pointer-events-none[^"]*"/);
  assert.match(musicPage, /aria-label="搜索歌单"[^>]*className="[^"]*relative z-10[^"]*"/);
  assert.match(musicPage, /aria-label="清空歌单搜索"[^>]*className="[^"]*z-20[^"]*"/);
});

test("non-range audio keeps a pending seek until the target becomes buffered", async () => {
  let seeking;
  try {
    seeking = await import("../lib/music-seeking.ts");
  } catch {}
  assert.ok(seeking, "music seeking helpers should exist");

  const ranges = {
    length: 2,
    start: (index) => [0, 80][index],
    end: (index) => [30, 120][index],
  };
  assert.equal(seeking.isTimeInRanges(ranges, 20), true);
  assert.equal(seeking.isTimeInRanges(ranges, 90), true);
  assert.equal(seeking.isTimeInRanges(ranges, 60), false);

  const [provider, engine] = await Promise.all([
    readFile("components/MusicProvider.tsx", "utf8"),
    readFile("hooks/useAudioEngine.ts", "utf8"),
  ]);
  assert.match(provider, /onProgress=\{engine\.retryPendingSeek\}/);
  assert.match(provider, /onSeeked=\{handleSeeked\}/);
  assert.match(engine, /pendingSeekRef\.current\s*=\s*target/);
  assert.match(engine, /isTimeInRanges\(audio\.buffered,\s*target/);
  assert.doesNotMatch(engine, /const target = pendingSeekRef\.current;\s*pendingSeekRef\.current = null;/);
});

test("lyrics prepare the next line 300ms early without waiting for throttled progress", async () => {
  let lyricTiming;
  try {
    lyricTiming = await import("../lib/music-lyrics.ts");
  } catch {}
  assert.ok(lyricTiming, "music lyric timing helpers should exist");

  const lyrics = [
    { time: 5, text: "上一句" },
    { time: 10, text: "下一句" },
    { time: 15, text: "再下一句" },
  ];

  assert.equal(lyricTiming.LYRIC_DISPLAY_LEAD_SECONDS, 0.3);
  assert.equal(lyricTiming.getActiveLyricIndex(lyrics, 9.69), 0);
  assert.equal(lyricTiming.getActiveLyricIndex(lyrics, 9.7), 1);
  assert.equal(lyricTiming.getNextLyricDelayMs(lyrics, 9.5), 200);
  assert.equal(lyricTiming.getNextLyricDelayMs(lyrics, 15), null);

  const [provider, lyricSync, musicPage] = await Promise.all([
    readFile("components/MusicProvider.tsx", "utf8"),
    readFile("hooks/useLyricSync.ts", "utf8"),
    readFile("app/music/MusicClient.tsx", "utf8"),
  ]);
  assert.match(lyricSync, /lyricSyncTimerRef/);
  assert.match(lyricSync, /setTimeout\(/);
  assert.match(lyricSync, /if\s*\(!isPlaying\)/);
  assert.match(provider, /engine\.handlePlaying\(\);\s*lyricSync\.syncLyricTimeline\(\);/);
  assert.match(provider, /engine\.handleTimeUpdate\(\);\s*lyricSync\.syncLyricTimeline\(\);/);
  assert.match(musicPage, /getActiveLyricIndex\(parsedLyrics, currentTime\)/);
});

test("shared LRC parser preserves untimed, repeated, and long-minute timestamps", async () => {
  const { parseLrc } = await import("../lib/music-parse.ts");
  const parsed = parseLrc([
    "[00:05]无小数时间戳",
    "[01:02.50]两位小数",
    "[02:03.45][02:04.450]重复时间戳",
    "[100:00.000]长音频",
  ].join("\n"));

  assert.deepEqual(parsed, [
    { time: 5, text: "无小数时间戳" },
    { time: 62.5, text: "两位小数" },
    { time: 123.45, text: "重复时间戳" },
    { time: 124.45, text: "重复时间戳" },
    { time: 6000, text: "长音频" },
  ]);
});
