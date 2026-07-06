import { access, readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

async function assertMissing(path) {
  await assert.rejects(access(path), {
    code: "ENOENT",
  });
}

test("legacy markdown and static data sources are removed after database migration", async () => {
  for (const path of [
    "posts",
    "moments",
    "data/albums.ts",
    "data/projects.ts",
    "data/friends.ts",
    "data/messages.json",
  ]) {
    await assertMissing(path);
  }
});

test("local superpowers artifacts are not committed", async () => {
  await assertMissing(".superpowers");
  await assertMissing("docs/superpowers");

  const gitignore = await readFile(".gitignore", "utf8");
  assert.match(gitignore, /^\.superpowers\/$/m);
  assert.match(gitignore, /^docs\/superpowers\/$/m);
});

test("documentation points writers to the database-backed admin system", async () => {
  const readme = await readFile("README.md", "utf8");

  assert.match(readme, /后台管理系统/);
  assert.match(readme, /数据库/);
  assert.doesNotMatch(readme, /在 `posts\/` 目录下创建/);
  assert.doesNotMatch(readme, /data\/albums\.ts/);
  assert.doesNotMatch(readme, /data\/projects\.ts/);
  assert.doesNotMatch(readme, /data\/friends\.ts/);
});
