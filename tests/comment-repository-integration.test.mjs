import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createClient } from "@libsql/client";

test("comment writes recheck user state and replies paginate without orphan counts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pblog-comments-"));
  const url = `file:${join(directory, "comments.db")}`;
  process.env.TURSO_DATABASE_URL = url;
  process.env.TURSO_AUTH_TOKEN = "";
  const setup = createClient({ url });
  await setup.batch([
    "CREATE TABLE admin_users (id TEXT PRIMARY KEY, username TEXT NOT NULL)",
    "CREATE TABLE public_users (id TEXT PRIMARY KEY, username TEXT NOT NULL, avatar_url TEXT, status TEXT NOT NULL, muted_until TEXT, session_version INTEGER NOT NULL, must_change_password INTEGER NOT NULL, deleted_at TEXT)",
    "CREATE TABLE posts (id TEXT PRIMARY KEY, status TEXT NOT NULL, deleted_at TEXT)",
    "CREATE TABLE post_comments (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, parent_id TEXT, public_user_id TEXT, admin_user_id TEXT, content TEXT NOT NULL, status TEXT NOT NULL, edited_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)",
    "CREATE TABLE comment_likes (comment_id TEXT NOT NULL, public_user_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (comment_id, public_user_id))",
    { sql: "INSERT INTO public_users VALUES (?, ?, NULL, 'active', NULL, 1, 0, NULL)", args: ["user-1", "Alice"] },
    { sql: "INSERT INTO posts VALUES (?, 'published', NULL)", args: ["post-1"] },
  ], "write");

  const comments = await import("../lib/db/comments.ts");
  const actor = { kind: "user", id: "user-1", username: "Alice", sessionVersion: 1 };
  const createdParent = await comments.createComment({ postId: "post-1", content: "top", actor });
  const parentId = createdParent.id;
  const base = Date.now();
  await setup.batch(Array.from({ length: 21 }, (_, index) => ({
    sql: "INSERT INTO post_comments VALUES (?, ?, ?, ?, NULL, ?, 'visible', NULL, ?, ?, NULL)",
    args: [`reply-${String(index).padStart(2, "0")}`, "post-1", parentId, "user-1", `reply ${index}`, new Date(base + index).toISOString(), new Date(base + index).toISOString()],
  })), "write");

  const firstPage = await comments.listComments("post-1", null, "user-1");
  assert.equal(firstPage.total, 22);
  assert.equal(firstPage.comments[0].replyCount, 21);
  assert.deepEqual(firstPage.comments[0].replies, []);
  const replies = await comments.listCommentReplies(parentId, null, "user-1");
  assert.equal(replies.comments.length, 20);
  assert.ok(replies.nextCursor);
  const finalReplies = await comments.listCommentReplies(parentId, replies.nextCursor, "user-1");
  assert.equal(finalReplies.comments.length, 1);
  assert.equal(finalReplies.nextCursor, null);
  const nestedReply = await comments.createComment({ postId: "post-1", parentId: "reply-00", content: "nested reply", actor });
  assert.equal(nestedReply.parentId, parentId);
  const afterNestedReply = await comments.listComments("post-1");
  assert.equal(afterNestedReply.total, 23);
  assert.equal(afterNestedReply.comments[0].replyCount, 22);

  await assert.rejects(
    comments.createComment({ postId: "post-1", content: "stale", actor: { ...actor, sessionVersion: 0 } }),
    /账号状态已变更/,
  );
  assert.equal(await comments.toggleCommentLike(parentId, { id: "user-1", sessionVersion: 1 }), true);
  await setup.execute({ sql: "UPDATE public_users SET status = 'banned', session_version = 2 WHERE id = ?", args: ["user-1"] });
  await assert.rejects(comments.toggleCommentLike(parentId, { id: "user-1", sessionVersion: 1 }), /账号状态已变更/);

  await setup.execute({ sql: "UPDATE post_comments SET status = 'hidden' WHERE id = ?", args: [parentId] });
  assert.equal((await comments.listComments("post-1")).total, 0);
  await assert.rejects(comments.listCommentReplies(parentId), /评论不存在/);

  setup.close();
  const { getDb } = await import("../lib/db.ts");
  getDb().close();
  await rm(directory, { recursive: true, force: true });
});
