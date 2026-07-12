import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("last update uses natural minute, hour, day, and absolute date boundaries", async () => {
  let stats;
  try {
    stats = await import("../lib/site-stats.ts");
  } catch {}

  assert.ok(stats, "site statistics formatter should exist");
  const { formatRelativeUpdateTime } = stats;
  const now = new Date("2026-07-12T12:00:00+08:00");

  assert.equal(formatRelativeUpdateTime("", now), "暂无");
  assert.equal(formatRelativeUpdateTime("not-a-date", now), "暂无");
  assert.equal(formatRelativeUpdateTime("2026-07-12T12:01:00+08:00", now), "刚刚");
  assert.equal(formatRelativeUpdateTime("2026-07-12T11:59:31+08:00", now), "刚刚");
  assert.equal(formatRelativeUpdateTime("2026-07-12T11:01:00+08:00", now), "59 分钟前");
  assert.equal(formatRelativeUpdateTime("2026-07-12T10:30:00+08:00", now), "1 小时前");
  assert.equal(formatRelativeUpdateTime("2026-07-11T13:00:00+08:00", now), "23 小时前");
  assert.equal(formatRelativeUpdateTime("2026-07-11T12:00:00+08:00", now), "1 天前");
  assert.equal(formatRelativeUpdateTime("2026-06-13T12:00:00+08:00", now), "29 天前");
  assert.equal(formatRelativeUpdateTime("2026-05-01T00:00:00+08:00", now), "2026.05.01");
});

test("site statistics remain server-rendered to avoid relative-time hydration drift", async () => {
  const component = await readFile("components/SiteStats.tsx", "utf8");
  assert.doesNotMatch(component, /^["']use client["'];/);
});
