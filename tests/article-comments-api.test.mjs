import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveReplyParent } from "../lib/comments/service.ts";

test("replies normalize to a top-level parent", () => {
  assert.equal(resolveReplyParent({ id: "top", parent_id: null }), "top");
  assert.equal(resolveReplyParent({ id: "reply", parent_id: "top" }), "top");
});

test("published post data exposes a stable database id", async () => {
  const source = await readFile("lib/posts.ts", "utf8");
  assert.match(source, /interface PostMeta \{\s*id: string;/s);
  assert.match(source, /SELECT p\.id, p\.slug/);
  assert.match(source, /id:\s*r\.id as string/);
});

test("comment repository uses oldest-first pages, paged replies, and unique like toggles", async () => {
  const source = await readFile("lib/db/comments.ts", "utf8");
  assert.match(source, /ORDER BY c\.created_at ASC/);
  assert.match(source, /LIMIT \?/);
  assert.match(source, /listCommentReplies/);
  assert.match(source, /DELETE FROM comment_likes/);
  assert.match(source, /INSERT INTO comment_likes/);
  assert.doesNotMatch(source, /SELECT \* FROM post_comments[^;]+forEach/s);
});

test("public comment routes separate public reads, actor writes, ownership edits, and user likes", async () => {
  const [postRoute, editRoute, likeRoute] = await Promise.all([
    readFile("app/api/posts/[postId]/comments/route.ts", "utf8"),
    readFile("app/api/comments/[id]/route.ts", "utf8"),
    readFile("app/api/comments/[id]/like/route.ts", "utf8"),
  ]);
  assert.match(postRoute, /export async function GET/);
  assert.match(postRoute, /resolveCommentActor/);
  assert.match(postRoute, /sanitizeCommentContent/);
  assert.match(postRoute, /limit: 20, windowMs: 60 \* 60 \* 1000/);
  assert.match(editRoute, /editComment/);
  assert.match(editRoute, /comment-edit/);
  assert.match(editRoute, /consumePublicRateLimit/);
  assert.match(editRoute, /limit: 20, windowMs: 60 \* 60 \* 1000/);
  assert.doesNotMatch(editRoute, /export async function DELETE/);
  assert.match(likeRoute, /requirePublicUser/);
  assert.match(likeRoute, /toggleCommentLike/);
  assert.match(likeRoute, /consumePublicRateLimit/);
  assert.match(postRoute, /createPublicRateKey\('comment', actor\.id, ''\)/);
});
