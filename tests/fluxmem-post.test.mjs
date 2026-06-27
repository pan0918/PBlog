import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const figures = [
  "1782549995163_image.png",
  "1782550008403_image.png",
  "1782550062669_image.png",
  "1782550068501_image.png",
];

test("FluxMem reading note keeps figures and results aligned", async () => {
  const post = await readFile("posts/Research/FluxMem.md", "utf8");
  const positions = figures.map((figure) => post.indexOf(figure));

  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);

  for (const figure of figures) {
    assert.equal(post.split(figure).length - 1, 1);
  }

  assert.match(post, /Full Context\s*\|\s*81\.23/);
  assert.match(post, /EverMemOS\s*\|\s*93\.05/);
  assert.match(post, /FluxMem\s*\|\s*95\.06/);
  assert.match(post, /AWM\s*\|\s*3\.6/);
  assert.match(post, /FluxMem\s*\|\s*8\.1/);
  assert.match(post, /Flash-Searcher\s*\|\s*52\.12/);
  assert.match(post, /FluxMem\s*\|\s*64\.85/);
  assert.doesNotMatch(post, /internal-api-drive-stream\.feishu\.cn/);
  assert.doesNotMatch(post, /[—–]/);
});
