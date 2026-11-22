import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createClient } from "@libsql/client";

test("public dates use the site time zone regardless of the server zone", async () => {
  process.env.TZ = "UTC"; // Vercel functions run in UTC
  const { formatSiteDate, formatSiteTime, getSiteDateParts } = await import("../lib/datetime.ts");
  const { formatUpdateTime } = await import("../lib/utils.ts");

  // 2026-01-01 07:30 in Beijing is still 2025-12-31 in UTC.
  const earlyMorning = "2025-12-31T23:30:00.000Z";
  assert.equal(formatSiteDate(earlyMorning), "2026.01.01");
  assert.equal(formatSiteDate(earlyMorning, "-"), "2026-01-01");
  assert.equal(formatSiteTime(earlyMorning), "07:30");
  assert.equal(formatSiteTime("2026-03-01T16:05:00.000Z"), "00:05");
  assert.equal(getSiteDateParts(earlyMorning)?.year, "2026");
  assert.equal(formatSiteDate("not-a-date"), "");

  assert.equal(formatUpdateTime(earlyMorning), "2026.01.01");
  assert.equal(formatUpdateTime("1970-01-01"), "刚刚更新");
  assert.equal(formatUpdateTime("garbage"), "garbage");
});

test("public pages format dates through the shared site-time-zone helpers", async () => {
  const [wall, moments, timeline, about, calendar, home] = await Promise.all([
    readFile("app/chatter/MessageWall.tsx", "utf8"),
    readFile("app/moments/MomentList.tsx", "utf8"),
    readFile("components/TimelineClient.tsx", "utf8"),
    readFile("components/AboutClient.tsx", "utf8"),
    readFile("components/CalendarCard.tsx", "utf8"),
    readFile("app/page.tsx", "utf8"),
  ]);

  assert.match(wall, /formatSiteDate\(msg\.createdAt\)/);
  assert.match(wall, /formatSiteTime\(msg\.createdAt\)/);
  assert.doesNotMatch(wall, /getHours\(\)/);
  assert.match(moments, /getSiteDateParts/);
  assert.doesNotMatch(moments, /split\('T'\)/);
  assert.match(timeline, /getSiteDateParts\(p\.date\)/);
  assert.match(about, /formatSiteDate\(activity\.date\)/);
  // The cached homepage hydrates with its render day, then switches to the visitor's day.
  assert.match(calendar, /useState\(\(\) => siteCalendarDay\(renderedAt\)\)/);
  assert.match(calendar, /setCurrent\(localCalendarDay\(new Date\(\)\)\)/);
  assert.match(home, /<CalendarCard renderedAt=\{renderedAt\} \/>/);
});

test("publishing a draft moment stamps its first publish time once", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pblog-moments-"));
  const url = `file:${join(directory, "moments.db")}`;
  process.env.TURSO_DATABASE_URL = url;
  process.env.TURSO_AUTH_TOKEN = "";
  const setup = createClient({ url });
  await setup.execute("CREATE TABLE moments (id TEXT PRIMARY KEY, content TEXT NOT NULL, mood TEXT, weather TEXT, location TEXT, status TEXT NOT NULL DEFAULT 'published', published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)");

  const moments = await import("../lib/db/moments.ts");
  const draft = await moments.createMoment({ content: "草稿", status: "draft" });
  assert.equal(draft.published_at, null);

  await moments.updateMoment(draft.id, { status: "published" });
  const published = await moments.getMomentById(draft.id);
  assert.ok(published.published_at, "draft -> published sets published_at");

  await moments.updateMoment(draft.id, { status: "draft" });
  await moments.updateMoment(draft.id, { status: "published" });
  assert.equal((await moments.getMomentById(draft.id)).published_at, published.published_at, "republishing keeps the first publish time");

  // Rows published before the fix have no published_at; they still sort by creation time.
  await setup.execute({
    sql: "INSERT INTO moments (id, content, status, published_at, created_at, updated_at) VALUES ('legacy', '旧说说', 'published', NULL, '2999-01-01T00:00:00.000Z', '2999-01-01T00:00:00.000Z')",
    args: [],
  });
  assert.equal((await moments.getPublishedMoments())[0].id, "legacy");

  setup.close();
  const { getDb } = await import("../lib/db.ts");
  getDb().close();
  await rm(directory, { recursive: true, force: true });
});

test("content changes refresh every page that shows them", async () => {
  const revalidation = await readFile("lib/admin/revalidate.ts", "utf8");

  assert.match(revalidation, /revalidateAfterMoment\(\) \{[^}]*revalidatePath\('\/about'\)/);
  assert.match(revalidation, /revalidateAfterSong\(\) \{[^}]*revalidatePath\('\/api\/songs'\)/);
});

test("post lists stay small and database errors are not cached as empty content", async () => {
  const [posts, timeline, songs] = await Promise.all([
    readFile("lib/posts.ts", "utf8"),
    readFile("app/timeline/page.tsx", "utf8"),
    readFile("app/api/songs/route.ts", "utf8"),
  ]);

  assert.doesNotMatch(posts, /p\.content, p\.view_count/);
  assert.match(posts, /substr\(p\.content, 1, 120\) AS excerpt/);
  assert.doesNotMatch(posts, /catch \{\s*return (\[\]|null);/);
  assert.doesNotMatch(timeline, /content/);
  assert.match(songs, /export const revalidate = 3600/);
  assert.doesNotMatch(songs, /force-dynamic/);
});

test("password changes reset the form captured before the request", async () => {
  const dialog = await readFile("components/comments/ProfileDialog.tsx", "utf8");

  assert.match(dialog, /const form = event\.currentTarget;/);
  assert.match(dialog, /form\.reset\(\)/);
  assert.doesNotMatch(dialog, /event\.currentTarget\.reset\(\)/);
});

test("rate limits key on the IP Vercel sets, not spoofable proxy headers", async () => {
  const { getClientIp } = await import("../lib/public-auth/request.ts");
  const request = (headers) => ({ headers: new Headers(headers) });

  assert.equal(getClientIp(request({ "cf-connecting-ip": "6.6.6.6", "x-real-ip": "203.0.113.8" })), "203.0.113.8");
  assert.equal(getClientIp(request({ "x-vercel-forwarded-for": "198.51.100.1", "x-forwarded-for": "6.6.6.6" })), "198.51.100.1");
  assert.equal(getClientIp(request({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })), "203.0.113.9");
  assert.equal(getClientIp(request({ "cf-connecting-ip": "6.6.6.6" })), "unknown");
});

test("moments show their location next to the weather only when one is set", async () => {
  const [page, list] = await Promise.all([
    readFile("app/moments/page.tsx", "utf8"),
    readFile("app/moments/MomentList.tsx", "utf8"),
  ]);

  assert.match(page, /location: m\.location\?\.trim\(\) \|\| ''/);
  assert.match(list, /\{moment\.weather && [^\n]+\n\s*\{moment\.location && \(/);
  assert.match(list, /<MapPin /);
  assert.match(list, /m\.location\.toLowerCase\(\)\.includes\(q\)/);
});
