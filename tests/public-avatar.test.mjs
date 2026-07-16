import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

import { processAvatar, updateAvatarForUser } from "../lib/public-auth/avatar.ts";

test("avatar processing crops and emits a 256px WebP", async () => {
  const png = await sharp({ create: { width: 640, height: 320, channels: 3, background: "#345678" } }).png().toBuffer();
  const output = await processAvatar(new File([new Uint8Array(png)], "avatar.png", { type: "image/png" }));
  const metadata = await sharp(Buffer.from(await output.arrayBuffer())).metadata();
  assert.deepEqual(
    { width: metadata.width, height: metadata.height, format: metadata.format },
    { width: 256, height: 256, format: "webp" },
  );
});

test("avatar processing rejects unsafe types and oversized files", async () => {
  await assert.rejects(processAvatar(new File(["x"], "x.svg", { type: "image/svg+xml" })), /JPEG、PNG 或 WebP/);
  await assert.rejects(processAvatar(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "x.png", { type: "image/png" })), /2 MB/);
});

test("failed avatar uploads never replace the saved avatar", async () => {
  let persistCount = 0;
  await assert.rejects(updateAvatarForUser("u1", new File(["x"], "x.png", { type: "image/png" }), {
    process: async () => new Blob(["webp"], { type: "image/webp" }),
    upload: async () => { throw new Error("图床失败"); },
    persist: async () => { persistCount += 1; },
  }), /图床失败/);
  assert.equal(persistCount, 0);
});

test("profile and avatar routes are authenticated and rate limited", async () => {
  const [profile, avatar] = await Promise.all([
    readFile("app/api/auth/profile/route.ts", "utf8"),
    readFile("app/api/auth/avatar/route.ts", "utf8"),
  ]);
  assert.match(profile, /requirePublicUser/);
  assert.match(profile, /normalizeUsername/);
  assert.match(avatar, /requirePublicUser/);
  assert.match(avatar, /checkPublicRateLimit/);
  assert.match(avatar, /updateAvatarForUser/);
});
