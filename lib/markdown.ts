import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
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

const HIGHLIGHT_LANGUAGES = ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml'];

interface RenderOptions {
  /** Add id attributes to headings (for TOC extraction) */
  withSlugIds?: boolean;
  /** Pre-process content: fix numbered lists, normalize line endings, convert excess blank lines to <br/> */
  preprocess?: boolean;
}

/**
 * Pre-process Markdown content before rendering.
 * Fixes common formatting issues from database-stored content.
 */
function preprocessContent(content: string): string {
  let processed = content;
  // Fix numbered lists missing space after period (e.g. "1.Text" → "1. Text")
  processed = processed.replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2');
  // Normalize line endings
  processed = processed.replace(/\r\n/g, '\n').replace(/^[ \t]+$/gm, '');
  // Convert 3+ consecutive newlines to <br/> tags (outside code blocks)
  const blocks = processed.split(/(```[\s\S]*?```)/g);
  processed = blocks.map((block, index) => {
    if (index % 2 === 1) return block; // code block, skip
    return block.replace(/\n{3,}/g, (match) => {
      const brCount = match.length - 2;
      return '\n\n' + '<br/>'.repeat(brCount) + '\n\n';
    });
  }).join('');
  return processed;
}

/**
 * Render Markdown content to HTML.
 * Supports GFM, math (KaTeX), code highlighting, and optional heading IDs.
 */
export async function renderMarkdownContent(content: string, options: RenderOptions = {}): Promise<string> {
  const { withSlugIds = false, preprocess = false } = options;

  const processedContent = preprocess ? preprocessContent(content) : content;

  const pipeline = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    // @ts-ignore — rehype-highlight types are slightly off
    .use(rehypeHighlight, { detect: true, ignoreMissing: true, subset: HIGHLIGHT_LANGUAGES })
    .use(rehypeKatex, katexOptions);

  if (withSlugIds) {
    pipeline.use(rehypeSlug);
  }

  pipeline.use(rehypeStringify, { allowDangerousHtml: true });

  const processed = await pipeline.process(processedContent);
  return processed.toString();
}

/**
 * Extract table of contents from rendered HTML.
 * Requires headings to have `id` attributes (use withSlugIds: true).
 */
export function extractToc(html: string): { level: number; text: string; id: string }[] {
  const headingRegex = /<h([1-3])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h[1-3]>/g;
  const toc: { level: number; text: string; id: string }[] = [];
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const text = match[3].replace(/<[^>]*>/g, '').trim();
    toc.push({ level: parseInt(match[1]), text, id: match[2] });
  }
  return toc;
}
