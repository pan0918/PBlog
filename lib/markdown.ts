import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

const IGNORED_KATEX_STRICT_CODES = new Set([
  'unicodeTextInMathMode',
  'newLineInDisplayMode',
]);

export const katexOptions = {
  throwOnError: false,
  strict(errorCode: string) {
    return IGNORED_KATEX_STRICT_CODES.has(errorCode) ? 'ignore' : 'warn';
  },
};

export async function renderMarkdownContent(content: string) {
  const processed = await unified()
    .use(remarkParse).use(remarkGfm).use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    // @ts-ignore
    .use(rehypeHighlight, { detect: true, ignoreMissing: true, subset: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml'] })
    .use(rehypeKatex, katexOptions)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return processed.toString();
}
