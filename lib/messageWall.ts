export const MAX_MESSAGE_LENGTH = 200;
export const MAX_AUTHOR_LENGTH = 20;

export type WallMessage = {
  id: string;
  content: string;
  author: string;
  colorIndex: number;
  createdAt: string;
};

export type MessageSubmissionInput = {
  content?: unknown;
  author?: unknown;
  honeypot?: unknown;
};

export type ValidMessageSubmission = {
  ok: true;
  content: string;
  author: string;
};

export type InvalidMessageSubmission = {
  ok: false;
  error: string;
  status: 400 | 413;
};

export function sanitizeText(value: unknown, maxLength = Number.POSITIVE_INFINITY) {
  if (typeof value !== "string") return "";

  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function validateMessageSubmission(
  input: MessageSubmissionInput,
): ValidMessageSubmission | InvalidMessageSubmission {
  if (sanitizeText(input.honeypot).length > 0) {
    return { ok: false, error: "请求无效", status: 400 };
  }

  const fullContent = sanitizeText(input.content, MAX_MESSAGE_LENGTH + 1);
  if (!fullContent) {
    return { ok: false, error: "留言内容不能为空", status: 400 };
  }

  if (fullContent.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `留言不能超过 ${MAX_MESSAGE_LENGTH} 个字符`, status: 413 };
  }

  return {
    ok: true,
    content: fullContent,
    author: sanitizeText(input.author, MAX_AUTHOR_LENGTH) || "匿名",
  };
}
