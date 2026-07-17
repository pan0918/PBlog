import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sanitizeCommentContent } from "../lib/comments/validation.ts";

test("sanitizes comments as bounded plain text", () => {
  assert.deepEqual(sanitizeCommentContent(" <b>hi</b>\nthere "), { ok: true, content: "hi there" });
  assert.equal(sanitizeCommentContent("a".repeat(501)).ok, false);
  assert.equal(sanitizeCommentContent("🙂".repeat(500)).ok, true);
  assert.equal(sanitizeCommentContent("🙂".repeat(501)).ok, false);
  assert.deepEqual(sanitizeCommentContent(" 你好，世界 "), { ok: true, content: "你好，世界" });
});

test("schema and migration define comments and unique likes", async () => {
  const [schema, migration, packageSource] = await Promise.all([
    readFile("lib/schema.sql", "utf8"),
    readFile("scripts/migrate-native-comments.ts", "utf8"),
    readFile("package.json", "utf8"),
  ]);
  for (const source of [schema, migration]) {
    assert.match(source, /post_comments/);
    assert.match(source, /comment_likes/);
  }
  assert.match(schema, /PRIMARY KEY \(comment_id, public_user_id\)/);
  assert.match(schema, /idx_post_comments_post_created/);
  assert.match(schema, /idx_post_comments_parent_created/);
  assert.equal(JSON.parse(packageSource).scripts["migrate:comments"], "tsx scripts/migrate-native-comments.ts");
  assert.match(migration, /SELECT name FROM sqlite_master/);
  assert.match(migration, /requiredTables/);
  assert.match(migration, /client\.close\(\)/);
});
