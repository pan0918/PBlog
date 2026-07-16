import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("admin navigation exposes comment and user moderation", async () => {
  const layout = await read("app/admin/layout.tsx");
  assert.match(layout, /评论管理/);
  assert.match(layout, /用户管理/);
  assert.match(layout, /\/admin\/comments/);
  assert.match(layout, /\/admin\/users/);
});
test("admin comment API is authenticated, paginated, searchable, and status-aware", async () => {
  const [collection, item, repository] = await Promise.all([
    read("app/api/admin/comments/route.ts"),
    read("app/api/admin/comments/[id]/route.ts"),
    read("lib/db/comments.ts"),
  ]);
  assert.match(collection, /requireAdmin/);
  assert.match(collection, /searchParams/);
  assert.match(collection, /listAdminComments/);
  assert.match(item, /updateAdminCommentStatus/);
  assert.match(repository, /COUNT\(\*\).*post_comments/s);
  assert.match(repository, /LIMIT \? OFFSET \?/);
  assert.match(repository, /c\.content LIKE/);
  assert.match(repository, /UPDATE post_comments SET status/);
});

test("admin user API protects private email and moderation mutations", async () => {
  const [collection, item, password, repository] = await Promise.all([
    read("app/api/admin/users/route.ts"),
    read("app/api/admin/users/[id]/route.ts"),
    read("app/api/admin/users/[id]/password/route.ts"),
    read("lib/db/public-users.ts"),
  ]);
  assert.match(collection, /requireAdmin/);
  assert.match(collection, /listAdminPublicUsers/);
  assert.match(item, /moderatePublicUser/);
  assert.match(password, /requireAdmin/);
  assert.match(password, /hashPassword/);
  assert.match(password, /setPublicUserTemporaryPassword/);
  assert.match(repository, /email/);
  assert.match(repository, /must_change_password = 1/);
  assert.match(repository, /session_version = session_version \+ 1/);
  assert.match(repository, /UPDATE post_comments SET status = 'deleted'/);
});

test("admin pages use bounded API pagination and shared toast behavior", async () => {
  const [commentsPage, usersPage] = await Promise.all([
    read("app/admin/comments/page.tsx"),
    read("app/admin/users/page.tsx"),
  ]);
  for (const source of [commentsPage, usersPage]) {
    assert.match(source, /AbortController/);
    assert.match(source, /Pagination/);
    assert.match(source, /useAdminToast/);
    assert.doesNotMatch(source, /setInterval/);
  }
  assert.match(commentsPage, /垃圾/);
  assert.match(commentsPage, /隐藏/);
  assert.match(usersPage, /临时密码/);
  assert.match(usersPage, /禁言/);
  assert.match(usersPage, /封禁/);
});
