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

test("post and about pages render through the shared markdown pipeline", async () => {
  const [posts, about, markdown] = await Promise.all([
    readFile("lib/posts.ts", "utf8"),
    readFile("app/about/page.tsx", "utf8"),
    readFile("lib/markdown.ts", "utf8"),
  ]);

  assert.match(posts, /import \{ renderMarkdownContent \} from ['"]\.\/markdown['"]/);
  assert.match(about, /import \{ renderMarkdownContent \} from ['"]\.\.\/\.\.\/lib\/markdown['"]/);
  for (const page of [posts, about]) assert.doesNotMatch(page, /unified\(\)/);
  assert.match(markdown, /use\(rehypeKatex,\s*katexOptions\)/);
});

test("article images are lazy-loaded and keep their source without a CDN configured", async () => {
  const { renderMarkdownContent } = await import("../lib/markdown.ts");
  const html = await renderMarkdownContent("![cat](https://example.com/cat.png)\n\n## Q&A");

  assert.match(html, /<img src="https:\/\/example\.com\/cat\.png" alt="cat" loading="lazy" decoding="async">/);
  assert.match(html, /<h2 id="qa">/);
});

test("post pages highlight code and return a real 404 for missing posts", async () => {
  const page = await readFile("app/posts/[[...slug]]/page.tsx", "utf8");

  assert.match(page, /import ['"]highlight\.js\/styles\/atom-one-dark\.css['"]/);
  assert.match(page, /if \(!postData\) notFound\(\);/);
});
