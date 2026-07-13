import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("chatter page no longer stores public messages in the browser", async () => {
  const [wall, page] = await Promise.all([
    readFile("app/chatter/MessageWall.tsx", "utf8"),
    readFile("app/chatter/page.tsx", "utf8"),
  ]);

  assert.doesNotMatch(wall, /localStorage|STORAGE_KEY|MIGRATION_KEY|saveMessages|loadMessages/);
  assert.match(wall, /initialMessages/);
  assert.match(page, /getApprovedMessages/);
  assert.match(page, /<MessageWall initialMessages=\{messages\}/);
});

test("approved messages use the complete submission-time ordered dataset", async () => {
  const [wall, page, route, repository] = await Promise.all([
    readFile("app/chatter/MessageWall.tsx", "utf8"),
    readFile("app/chatter/page.tsx", "utf8"),
    readFile("app/api/messages/route.ts", "utf8"),
    readFile("lib/db/messages.ts", "utf8"),
  ]);

  assert.doesNotMatch(repository, /LIMIT\s+\?/i);
  assert.match(repository, /ORDER BY created_at DESC/i);
  assert.doesNotMatch(page, /getApprovedMessages\(10\)/);
  assert.doesNotMatch(route, /getApprovedMessages\(100\)/);
  assert.match(page, /createdAt:\s*m\.created_at/);
  assert.match(route, /createdAt:\s*m\.created_at/);
  assert.doesNotMatch(page, /approved_at\s*\|\|/);
  assert.doesNotMatch(route, /approved_at\s*\|\|/);
  assert.doesNotMatch(wall, /slice\(0,\s*10\)/);
});

test("message wall scrolls vertically with responsive height and a one-way hint", async () => {
  const [wall, styles] = await Promise.all([
    readFile("app/chatter/MessageWall.tsx", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);

  assert.match(wall, /overflow-y-auto/);
  assert.match(wall, /h-\[620px\]/);
  assert.match(wall, /md:h-\[600px\]/);
  assert.match(wall, /lg:grid-cols-5/);
  assert.match(wall, /onScroll=\{updateScrollHint\}/);
  assert.match(wall, /scrollHeight\s*-\s*scrollTop\s*-\s*clientHeight/);
  assert.match(wall, /向下查看更多留言/);
  assert.match(wall, /\{showScrollHint\s*&&/);
  assert.match(styles, /\.message-wall-scroll/);
  assert.match(styles, /scrollbar-width:\s*thin/);
});

test("sticky notes show the author and full adaptive content with bounded animation", async () => {
  const wall = await readFile("app/chatter/MessageWall.tsx", "utf8");

  assert.match(wall, /msg\.author\?\.trim\(\)\s*\|\|\s*["']匿名["']/);
  assert.doesNotMatch(wall, /line-clamp/);
  assert.match(wall, /getMessageTextClass\(msg\.content\.length\)/);
  assert.match(wall, /animated=\{index < 10\}/);
  assert.match(wall, /contentVisibility:\s*["']auto["']/);
  assert.doesNotMatch(wall, /<AnimatePresence mode=["']popLayout["']>/);
});

test("message API stores pending submissions and protects against basic abuse", async () => {
  const [route, repository] = await Promise.all([
    readFile("app/api/messages/route.ts", "utf8"),
    readFile("lib/db/messages.ts", "utf8"),
  ]);

  assert.doesNotMatch(route, /writeFile/);
  assert.match(route, /checkMessageRateLimit/);
  assert.match(route, /validateMessageSubmission/);
  assert.match(route, /honeypot/);
  assert.match(route, /createPendingMessage/);
  assert.match(repository, /'pending'/);
  assert.match(route, /审核后展示/);
});

test("message helpers sanitize submissions and enforce rate limits", async () => {
  const {
    buildModerationEmail,
    checkMessageRateLimit,
    sanitizeText,
    validateMessageSubmission,
  } = await import("../lib/messageWall.ts");

  assert.equal(sanitizeText("  hi\t\n there  "), "hi there");
  assert.equal(sanitizeText("<script>alert(1)</script>"), "alert(1)");

  assert.deepEqual(validateMessageSubmission({ content: "  你好  ", author: "" }), {
    ok: true,
    content: "你好",
    author: "匿名",
  });

  assert.deepEqual(validateMessageSubmission({ content: "", author: "bot" }), {
    ok: false,
    error: "留言内容不能为空",
    status: 400,
  });

  assert.deepEqual(validateMessageSubmission({ content: "x", honeypot: "spam" }), {
    ok: false,
    error: "请求无效",
    status: 400,
  });

  const now = 1_700_000_000_000;
  assert.equal(checkMessageRateLimit("203.0.113.8", now).allowed, true);
  assert.equal(checkMessageRateLimit("203.0.113.8", now + 1).allowed, true);
  assert.equal(checkMessageRateLimit("203.0.113.8", now + 2).allowed, true);
  assert.deepEqual(checkMessageRateLimit("203.0.113.8", now + 3), {
    allowed: false,
    retryAfterSeconds: 600,
  });

  const email = buildModerationEmail({
    content: "你好",
    author: "匿名",
    ip: "203.0.113.8",
    userAgent: "UnitTest",
    createdAt: "2026-06-30T00:00:00.000Z",
  });

  assert.match(email.subject, /新的留言墙审核/);
  assert.match(email.text, /你好/);
  assert.match(email.text, /203\.0\.113\.8/);
});
