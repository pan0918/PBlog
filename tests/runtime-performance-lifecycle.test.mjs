import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("toast provider tracks ids and clears pending timers on unmount", async () => {
  const source = await readFile("components/ToastProvider.tsx", "utf8");

  assert.match(source, /useRef/);
  assert.match(source, /timerRefs/);
  assert.match(source, /nextIdRef/);
  assert.match(source, /clearTimeout/);
  assert.match(source, /return \(\) =>/);
});

test("cyber cat cleans nested timers and aborts chat requests", async () => {
  const source = await readFile("components/CyberCat.tsx", "utf8");

  assert.match(source, /timeoutRefs/);
  assert.match(source, /scheduleTimeout/);
  assert.match(source, /AbortController/);
  assert.match(source, /chatAbortRef/);
  assert.match(source, /chatAbortRef\.current\?\.abort\(\)/);
});

test("background effects mount only the active theme animation tree", async () => {
  const source = await readFile("components/BackgroundEffects.tsx", "utf8");

  assert.match(source, /isDark \? <Fireflies \/> : <Sakura \/>/);
  assert.doesNotMatch(source, /opacity-0[\s\S]{0,120}<Fireflies \/>/);
  assert.doesNotMatch(source, /opacity-0[\s\S]{0,120}<Sakura \/>/);
});

test("weather and view count requests abort when components unmount", async () => {
  const [weather, viewCount] = await Promise.all([
    readFile("components/WeatherCard.tsx", "utf8"),
    readFile("components/ClientViewCount.tsx", "utf8"),
  ]);

  assert.match(weather, /AbortController/);
  assert.match(weather, /signal: controller\.signal/);
  assert.match(weather, /controller\.abort\(\)/);
  assert.match(weather, /navigator\.geolocation/);
  assert.match(weather, /YUEQING_LOCATION/);
  assert.match(weather, /buildWeatherUrl/);
  assert.doesNotMatch(weather, /wttr\.in/);

  assert.match(viewCount, /AbortController/);
  assert.match(viewCount, /signal: controller\.signal/);
  assert.match(viewCount, /controller\.abort\(\)/);
});

test("site dashboard pauses the second timer while the tab is hidden", async () => {
  const source = await readFile("components/SiteDashboard.tsx", "utf8");

  assert.match(source, /visibilitychange/);
  assert.match(source, /document\.hidden/);
  assert.match(source, /clearInterval/);
});

test("admin pages use the shared timer-safe toast hook", async () => {
  const [hook, posts, songs] = await Promise.all([
    readFile("app/admin/components/useAdminToast.ts", "utf8"),
    readFile("app/admin/posts/page.tsx", "utf8"),
    readFile("app/admin/songs/page.tsx", "utf8"),
  ]);

  assert.match(hook, /timerRef/);
  assert.match(hook, /clearTimeout/);
  assert.match(hook, /return \(\) =>/);
  assert.match(posts, /useAdminToast/);
  assert.match(songs, /useAdminToast/);
  assert.doesNotMatch(posts, /setTimeout\(\(\) => setToast\(null\)/);
  assert.doesNotMatch(songs, /setTimeout\(\(\) => setToast\(null\)/);
});
