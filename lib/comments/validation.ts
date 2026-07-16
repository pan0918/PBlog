export const MAX_COMMENT_LENGTH = 500;

export function sanitizeCommentContent(value: unknown) {
  if (typeof value !== 'string') return { ok: false as const, error: '评论内容不能为空' };
  const content = value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!content) return { ok: false as const, error: '评论内容不能为空' };
  if (content.length > MAX_COMMENT_LENGTH) {
    return { ok: false as const, error: `评论不能超过 ${MAX_COMMENT_LENGTH} 个字符` };
  }
  return { ok: true as const, content };
}
