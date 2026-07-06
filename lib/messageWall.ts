export const MAX_MESSAGE_LENGTH = 200;
export const MAX_AUTHOR_LENGTH = 20;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const LONG_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const LONG_RATE_LIMIT_MAX = 10;

type RateLimitBucket = {
  shortWindow: number[];
  longWindow: number[];
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

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

export type MessageRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export type ModerationEmailInput = {
  content: string;
  author: string;
  ip: string;
  userAgent: string;
  createdAt: string;
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

export function normalizePublicMessage(input: Partial<WallMessage>, index = 0): WallMessage | null {
  const content = sanitizeText(input.content, MAX_MESSAGE_LENGTH);
  if (!content) return null;

  const createdAt =
    typeof input.createdAt === "string" && !Number.isNaN(new Date(input.createdAt).getTime())
      ? new Date(input.createdAt).toISOString()
      : new Date(0).toISOString();

  return {
    id: typeof input.id === "string" && input.id ? input.id : `message-${index}`,
    content,
    author: sanitizeText(input.author, MAX_AUTHOR_LENGTH) || "匿名",
    colorIndex: Number.isInteger(input.colorIndex) ? input.colorIndex! : index,
    createdAt,
  };
}

export function checkMessageRateLimit(ip: string, now = Date.now()): MessageRateLimitResult {
  const key = ip || "unknown";
  const bucket = rateLimitBuckets.get(key) ?? { shortWindow: [], longWindow: [] };

  bucket.shortWindow = bucket.shortWindow.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  bucket.longWindow = bucket.longWindow.filter((timestamp) => now - timestamp < LONG_RATE_LIMIT_WINDOW_MS);

  if (bucket.shortWindow.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(key, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.shortWindow[0] + RATE_LIMIT_WINDOW_MS - now) / 1000),
    };
  }

  if (bucket.longWindow.length >= LONG_RATE_LIMIT_MAX) {
    rateLimitBuckets.set(key, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.longWindow[0] + LONG_RATE_LIMIT_WINDOW_MS - now) / 1000),
    };
  }

  bucket.shortWindow.push(now);
  bucket.longWindow.push(now);
  rateLimitBuckets.set(key, bucket);
  return { allowed: true };
}

export function buildModerationEmail(input: ModerationEmailInput) {
  const subject = "新的留言墙审核请求";
  const text = [
    "收到一条新的留言墙提交，请在后台管理系统审核并写入数据库。",
    "",
    `昵称：${input.author}`,
    `留言：${input.content}`,
    `时间：${input.createdAt}`,
    `IP：${input.ip}`,
    `User-Agent：${input.userAgent}`,
  ].join("\n");

  const html = text
    .split("\n")
    .map((line) => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))
    .join("<br>");

  return { subject, text, html };
}
