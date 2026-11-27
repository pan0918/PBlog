import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createClient } from "@libsql/client";

// The streaming client records usage through the default database client.
process.env.TURSO_DATABASE_URL = "file::memory:";

const { estimateCostUsd, isPeakTime } = await import("../lib/ai/pricing.ts");
const { startOfSiteMonth } = await import("../lib/datetime.ts");
const { recordAiUsage, getAiUsageByFeature } = await import("../lib/db/ai-usage.ts");
const { getMonthlyAiUsage, isAdminFeature } = await import("../lib/ai/budget.ts");
const { completeChat, openChatStream, readSseData, toTokenUsage, AiUnavailableError } = await import("../lib/ai/deepseek.ts");
const { buildPostMetaMessages, parsePostMeta } = await import("../lib/ai/post-meta.ts");
const { toPlainDescription } = await import("../lib/seo.ts");
const { db } = await import("../lib/db.ts");

const usage = (cacheHitTokens, cacheMissTokens, completionTokens) => ({ cacheHitTokens, cacheMissTokens, completionTokens });

function streamOf(chunks) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(typeof chunk === "string" ? encoder.encode(chunk) : chunk);
      controller.close();
    },
  });
}

async function withStubbedFetch(respond, run) {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.DEEPSEEK_API_KEY;
  const requests = [];
  process.env.DEEPSEEK_API_KEY = "test-key";
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init, body: JSON.parse(init.body) });
    return respond();
  };
  try {
    await run(requests);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = originalKey;
  }
}

test("DeepSeek cost estimates follow peak hours and fall back to the dearest model", () => {
  const mondayPeak = new Date("2026-11-23T02:00:00Z");
  const mondayOffPeak = new Date("2026-11-23T05:00:00Z");
  const saturday = new Date("2026-11-28T02:00:00Z");
  assert.equal(isPeakTime(mondayPeak), true);
  assert.equal(isPeakTime(mondayOffPeak), false);
  assert.equal(isPeakTime(saturday), false);

  const million = usage(0, 1_000_000, 0);
  assert.equal(estimateCostUsd(million, "deepseek-flash", mondayPeak), 0.3);
  assert.equal(estimateCostUsd(million, "deepseek-flash", mondayOffPeak), 0.15);
  assert.equal(estimateCostUsd(million, "some-future-model", mondayPeak), estimateCostUsd(million, "deepseek-v4-pro", mondayPeak));
});

test("the AI budget month starts at midnight Beijing time", () => {
  assert.equal(startOfSiteMonth(new Date("2026-11-30T17:00:00Z")).toISOString(), "2026-11-30T16:00:00.000Z");
  assert.equal(startOfSiteMonth(new Date("2026-11-30T15:00:00Z")).toISOString(), "2026-10-31T16:00:00.000Z");
});

test("the monthly budget counts this month's visitor usage only", async () => {
  const client = createClient({ url: "file::memory:" });
  const now = new Date("2026-11-27T12:00:00Z");
  const log = (feature, costUsd, at) => recordAiUsage({ feature, model: "deepseek-flash", usage: usage(1, 2, 3), costUsd, at: new Date(at) }, client);

  await log("pet-chat", 1.5, "2026-11-20T00:00:00Z");
  await log("admin-post-meta", 5, "2026-11-21T00:00:00Z");
  await log("pet-chat", 10, "2026-10-15T00:00:00Z");

  let monthly = await getMonthlyAiUsage(now, client);
  assert.equal(monthly.visitor.calls, 1);
  assert.equal(monthly.visitor.costUsd, 1.5);
  assert.equal(monthly.admin.costUsd, 5);
  assert.equal(monthly.exhausted, false);

  await log("pet-chat", 0.6, "2026-11-26T00:00:00Z");
  monthly = await getMonthlyAiUsage(now, client);
  assert.equal(monthly.visitor.calls, 2);
  assert.equal(monthly.visitor.completionTokens, 6);
  assert.equal(monthly.exhausted, true);

  assert.equal(isAdminFeature("admin-post-meta"), true);
  assert.equal(isAdminFeature("pet-chat"), false);
  client.close();
});

test("SSE parsing handles split multi-byte characters, comments, and [DONE]", async () => {
  const bytes = new TextEncoder().encode('data: {"t":"喵"}\n');
  const chunks = [
    ": keep-alive\n",
    bytes.slice(0, 13),
    bytes.slice(13),
    "data: second\n\ndata: [DONE]\n",
    "data: after-done\n",
  ];
  const seen = [];
  for await (const data of readSseData(streamOf(chunks))) seen.push(data);
  assert.deepEqual(seen, ['{"t":"喵"}', "second"]);

  assert.deepEqual(toTokenUsage({ prompt_tokens: 10, prompt_cache_hit_tokens: 4, completion_tokens: 3 }), usage(4, 6, 3));
});

test("streamed chat disables thinking, yields deltas, and records reported usage", async () => {
  const events = [
    { choices: [{ delta: { content: "你好" } }] },
    { choices: [{ delta: { content: "喵~" } }] },
    { choices: [], usage: { prompt_cache_hit_tokens: 100, prompt_cache_miss_tokens: 20, completion_tokens: 5 } },
  ];
  const sse = events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("") + "data: [DONE]\n\n";

  await withStubbedFetch(() => new Response(streamOf([sse])), async (requests) => {
    const deltas = await openChatStream({
      feature: "test-stream",
      messages: [{ role: "user", content: "hi" }],
      maxTokens: 50,
    });
    let text = "";
    for await (const delta of deltas) text += delta;
    assert.equal(text, "你好喵~");

    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "https://api.deepseek.com/chat/completions");
    assert.equal(requests[0].init.headers.Authorization, "Bearer test-key");
    assert.deepEqual(requests[0].body.thinking, { type: "disabled" });
    assert.equal(requests[0].body.stream, true);
    assert.deepEqual(requests[0].body.stream_options, { include_usage: true });
    assert.equal(requests[0].body.max_tokens, 50);
  });

  const [row] = (await getAiUsageByFeature(new Date(0), db)).filter((entry) => entry.feature === "test-stream");
  assert.equal(row.calls, 1);
  assert.equal(row.cacheHitTokens, 100);
  assert.equal(row.cacheMissTokens, 20);
  assert.equal(row.completionTokens, 5);
});

test("a chat stream cut short records a high estimate instead of nothing", async () => {
  const sse = `data: ${JSON.stringify({ choices: [{ delta: { content: "第一段" } }] })}\n\n`
    + `data: ${JSON.stringify({ choices: [{ delta: { content: "第二段" } }] })}\n\n`;

  await withStubbedFetch(() => new Response(streamOf([sse])), async () => {
    const deltas = await openChatStream({
      feature: "test-cancel",
      messages: [{ role: "user", content: "一二三四五" }],
      maxTokens: 200,
    });
    assert.deepEqual(await deltas.next(), { value: "第一段", done: false });
    await deltas.return(undefined);
  });

  const [row] = (await getAiUsageByFeature(new Date(0), db)).filter((entry) => entry.feature === "test-cancel");
  assert.equal(row.calls, 1);
  assert.equal(row.completionTokens, 200);
  assert.equal(row.cacheMissTokens, 3);
});

test("single-shot JSON completions request JSON mode and reject empty replies", async () => {
  const reply = (content) => Response.json({
    choices: [{ message: { content } }],
    usage: { prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 10, completion_tokens: 5 },
  });

  await withStubbedFetch(() => reply('{"summary":"x","tags":[]}'), async (requests) => {
    const text = await completeChat({ feature: "test-json", messages: [{ role: "user", content: "json" }], maxTokens: 100, json: true });
    assert.equal(text, '{"summary":"x","tags":[]}');
    assert.deepEqual(requests[0].body.response_format, { type: "json_object" });
    assert.equal(requests[0].body.stream, undefined);
  });

  await withStubbedFetch(() => reply("  \n"), async () => {
    await assert.rejects(
      completeChat({ feature: "test-json", messages: [{ role: "user", content: "json" }], maxTokens: 100, json: true }),
      AiUnavailableError,
    );
  });

  await withStubbedFetch(() => new Response("busy", { status: 503 }), async () => {
    await assert.rejects(
      completeChat({ feature: "test-json", messages: [{ role: "user", content: "json" }], maxTokens: 100 }),
      AiUnavailableError,
    );
  });
});

test("post meta prompts skip images and parsed tags are cleaned up", () => {
  const [system, user] = buildPostMetaMessages("标题", "正文![图](https://img.example/a.png)继续", ["Next.js", "随笔"]);
  assert.equal(system.role, "system");
  assert.match(system.content, /JSON/);
  assert.match(user.content, /已有标签：Next\.js、随笔/);
  assert.doesNotMatch(user.content, /img\.example/);
  assert.match(user.content, /正文继续/);

  assert.deepEqual(
    parsePostMeta('{"summary":"  一段摘要  ","tags":["#Next.js","Next.js"," 随笔 ",3,"","一二三四五六七八九十一二三四五六七八九十多"]}'),
    { summary: "一段摘要", tags: ["Next.js", "随笔"] },
  );
  assert.equal(parsePostMeta('{"summary":"a","tags":["1","2","3","4","5","6"]}').tags.length, 5);
  assert.equal(parsePostMeta("not json"), null);
  assert.equal(parsePostMeta('{"tags":["a"]}'), null);
  assert.equal(parsePostMeta('{"summary":"   "}'), null);
});

test("page descriptions are plain one-line text", () => {
  assert.equal(
    toPlainDescription("# 标题\n\n这是**加粗**和[链接](https://a.b)，![图](x.png)\n\n- 列表项"),
    "标题 这是加粗和链接， 列表项",
  );
  assert.equal(toPlainDescription("字".repeat(200)).length, 160);
});

test("the cat chat uses only the server key, with rate limits and a monthly budget", async () => {
  const [route, cat, siteConfig] = await Promise.all([
    readFile("app/api/chat/route.ts", "utf8"),
    readFile("components/CyberCat.tsx", "utf8"),
    readFile("siteConfig.ts", "utf8"),
  ]);

  assert.match(route, /isAiConfigured\(\)/);
  assert.match(route, /consumePublicRateLimit\(['"]pet-chat['"]/);
  assert.match(route, /getMonthlyAiUsage\(\)\)\.exhausted/);
  assert.match(route, /getClientIp\(request\)/);
  assert.match(route, /after\(settled\)/);
  assert.doesNotMatch(route, /apiKey|baseUrl|allowedApiHosts|GEMINI/i);

  assert.doesNotMatch(cat, /apiKey|localStorage|pet-config/i);
  assert.match(cat, /TextDecoderStream/);
  assert.doesNotMatch(siteConfig, /allowedApiHosts|geminiConfig/);
  assert.match(siteConfig, /monthlyBudgetUsd/);
});

test("admin AI writing help is admin-only and kept out of the visitor budget", async () => {
  const [route, editor, dashboard, schema, initDb] = await Promise.all([
    readFile("app/api/admin/ai/post-meta/route.ts", "utf8"),
    readFile("app/admin/components/PostEditorWorkspace.tsx", "utf8"),
    readFile("app/admin/page.tsx", "utf8"),
    readFile("lib/schema.sql", "utf8"),
    readFile("scripts/init-db.ts", "utf8"),
  ]);

  assert.match(route, /await requireAdmin\(\)/);
  assert.match(route, /feature:\s*['"]admin-/);
  assert.match(route, /json:\s*true/);
  assert.match(editor, /\/api\/admin\/ai\/post-meta/);
  assert.match(editor, /suggestedTags/);
  assert.match(dashboard, /getMonthlyAiUsage/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS ai_usage_logs/);
  assert.match(initDb, /CREATE TABLE IF NOT EXISTS ai_usage_logs/);
});

test("search engines get a sitemap, robots rules, and per-post metadata", async () => {
  const [robots, sitemap, layout, postPage] = await Promise.all([
    readFile("app/robots.ts", "utf8"),
    readFile("app/sitemap.ts", "utf8"),
    readFile("app/layout.tsx", "utf8"),
    readFile("app/posts/[[...slug]]/page.tsx", "utf8"),
  ]);

  assert.match(robots, /disallow:\s*\[['"]\/admin['"],\s*['"]\/api\/['"]\]/);
  assert.match(robots, /sitemap\.xml/);
  assert.match(sitemap, /getAllPosts\(\)/);
  assert.match(layout, /metadataBase:\s*new URL\(siteConfig\.siteUrl\)/);
  assert.match(postPage, /export async function generateMetadata/);
  assert.match(postPage, /getAllPosts\(\)/);
});
