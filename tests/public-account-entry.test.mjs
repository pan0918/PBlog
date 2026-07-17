import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DEFAULT_PUBLIC_AVATAR_URL } from "../lib/public-auth/presentation.ts";

const expectedAvatar = "https://a68b43cc.cloudflare-imgbed-9pz.pages.dev/file/1784254976002_ChatGPT_Image_2026年7月17日_10_22_03.png";

test("public account surfaces share the supplied default avatar", async () => {
  assert.equal(DEFAULT_PUBLIC_AVATAR_URL, expectedAvatar);
  const fallbackFiles = [
    "components/comments/CommentItem.tsx",
    "components/comments/CommentSurface.tsx",
    "components/comments/ProfileDialog.tsx",
    "app/admin/users/page.tsx",
  ];
  for (const path of fallbackFiles) {
    const source = await readFile(path, "utf8");
    assert.match(source, /DEFAULT_PUBLIC_AVATAR_URL/, `${path} should use the shared avatar fallback`);
  }
});
