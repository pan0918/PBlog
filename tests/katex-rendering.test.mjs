import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("markdown rendering suppresses noisy KaTeX strict warnings for Chinese math text", async () => {
  const { renderMarkdownContent } = await import("../lib/markdown.ts");
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(" "));

  try {
    const html = await renderMarkdownContent(`
强化学习里可以写 $前的状态价值$ 作为中文说明。

$$
V(s) = \\mathbb{E}[前的状态价值]
\\\\
下一状态价值
$$
`);

    assert.match(html, /katex/);
  } finally {
    console.warn = originalWarn;
  }

  assert.deepEqual(
    warnings.filter((line) => /unicodeTextInMathMode|newLineInDisplayMode/.test(line)),
    [],
  );
});

test("post and about markdown pipelines use the shared KaTeX warning policy", async () => {
  const [posts, about] = await Promise.all([
    readFile("lib/posts.ts", "utf8"),
    readFile("app/about/page.tsx", "utf8"),
  ]);

  assert.match(posts, /import \{ renderMarkdownContent, extractToc \} from ['"]\.\/markdown['"]/);
  assert.match(posts, /renderMarkdownContent\(content,\s*\{ withSlugIds: true, preprocess: true \}\)/);
  assert.match(about, /import \{ katexOptions \} from ['"]\.\.\/\.\.\/lib\/markdown['"]/);
  assert.match(about, /use\(rehypeKatex,\s*katexOptions\)/);
});
