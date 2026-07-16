import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("article moves native comments into a wider desktop sidebar", async () => {
  const source = await read("app/posts/[[...slug]]/page.tsx");
  assert.doesNotMatch(source, /mt-12 md:mt-16[^>]*><Comments/);
  assert.match(source, /max-w-\[1440px\]/);
  assert.match(source, /lg:w-\[360px\]/);
  assert.match(source, /<Comments postId=\{postData\.data\.id\} postTitle=\{postData\.data\.title\}/);
});

test("comment UI has a shared hook with abort cleanup and targeted optimistic rollbacks", async () => {
  const source = await read("components/comments/useCommentData.ts");
  assert.match(source, /new AbortController\(\)/);
  assert.match(source, /controller\.abort\(\)/);
  assert.match(source, /pendingLikes/);
  assert.match(source, /pendingEdits/);
  assert.match(source, /\.\.\.snapshot/);
  assert.match(source, /created\.parentId/);
  assert.doesNotMatch(source, /submitComment[\s\S]*?await refresh\(\)/);
  assert.doesNotMatch(source, /setComments\(previousComments\)/);
  assert.doesNotMatch(source, /setInterval/);
});

test("comment surface supports accessible desktop and mobile states", async () => {
  const [comments, surface, list, item] = await Promise.all([
    read("components/Comments.tsx"),
    read("components/comments/CommentSurface.tsx"),
    read("components/comments/CommentList.tsx"),
    read("components/comments/CommentItem.tsx"),
  ]);
  assert.match(comments, /role="dialog"/);
  assert.match(comments, /aria-modal="true"/);
  assert.match(comments, /createPortal/);
  assert.match(comments, /document\.body/);
  assert.match(comments, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(comments, /event\.key === 'Escape'/);
  assert.match(comments, /const trigger = triggerRef\.current/);
  assert.match(comments, /trigger\?\.focus\(\)/);
  assert.match(comments, /md:max-lg:right-\[20rem\]/);
  assert.match(surface, /dark:/);
  assert.match(surface, /评论/);
  assert.match(list, /loading/);
  assert.match(list, /error/);
  assert.match(item, /作者/);
  assert.match(item, /showReplies/);
  assert.match(item, /onLoadReplies/);
  assert.match(item, /comment\.parentId \|\| comment\.id/);
  assert.match(item, /加载更多回复/);
  assert.match(item, /回复按时间正序/);
});

test("account dialogs expose labels, recovery guidance, profile and destructive actions", async () => {
  const [auth, profile] = await Promise.all([
    read("components/comments/AuthDialog.tsx"),
    read("components/comments/ProfileDialog.tsx"),
  ]);
  assert.match(auth, /<label/);
  assert.match(auth, /name="passwordConfirm"/);
  assert.match(auth, /联系管理员/);
  assert.match(auth, /注册邮箱/);
  assert.match(profile, /上传头像/);
  assert.match(profile, /修改密码/);
  assert.match(profile, /注销账号/);
});

test("Gitalk is fully removed", async () => {
  const [comments, config, pkg] = await Promise.all([
    read("components/Comments.tsx"),
    read("siteConfig.ts"),
    read("package.json"),
  ]);
  assert.doesNotMatch(comments, /gitalk/i);
  assert.doesNotMatch(config, /gitalk/i);
  assert.doesNotMatch(pkg, /gitalk/i);
});
