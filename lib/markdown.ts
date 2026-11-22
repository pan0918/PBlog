import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { responsiveImage } from './images/cdn';

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

// Article column is ~960px wide on desktop and full width below the lg breakpoint.
const ARTICLE_IMAGE_SIZES = '(min-width: 1024px) 960px, 100vw';

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/** Lazy-load article images and serve them at the size they are displayed. */
function rehypeArticleImages() {
  const visit = (node: HastNode) => {
    if (node.type === 'element' && node.tagName === 'img' && node.properties) {
      const src = node.properties.src;
      if (typeof src === 'string') {
        const image = responsiveImage(src, { sizes: ARTICLE_IMAGE_SIZES, maxWidth: 1920 });
        node.properties.src = image.src;
        if (image.srcSet) {
          node.properties.srcSet = image.srcSet;
          node.properties.sizes = image.sizes;
        }
      }
      node.properties.loading = 'lazy';
      node.properties.decoding = 'async';
    }
    node.children?.forEach(visit);
  };
  return (tree: HastNode) => visit(tree);
}

/**
 * Normalizes editor quirks before parsing: "1.item" lists, CRLF line endings,
 * and runs of blank lines, which are kept as visible spacing outside code.
 */
function preprocessMarkdown(content: string) {
  const normalized = content
    .replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2')
    .replace(/\r\n/g, '\n')
    .replace(/^[ \t]+$/gm, '');
  return normalized
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g)
    .map((block, index) => {
      if (index % 2 === 1) return block;
      return block.replace(/\n{3,}/g, (match) => '\n\n' + '<br/>'.repeat(match.length - 2) + '\n\n');
    })
    .join('');
}

const markdownProcessor = unified()
  .use(remarkParse).use(remarkGfm).use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  // @ts-ignore
  .use(rehypeHighlight, { detect: true, ignoreMissing: true, subset: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml'] })
  .use(rehypeKatex, katexOptions)
  .use(rehypeSlug)
  .use(rehypeArticleImages)
  .use(rehypeStringify, { allowDangerousHtml: true });

/** Renders post and about-page Markdown (GFM, math, highlighted code, heading ids). */
export async function renderMarkdownContent(content: string) {
  const processed = await markdownProcessor.process(preprocessMarkdown(content));
  return processed.toString();
}
