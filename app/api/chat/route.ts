import { after, NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '../../../siteConfig';
import { getMonthlyAiUsage } from '../../../lib/ai/budget';
import { isAiConfigured, openChatStream, type AiMessage } from '../../../lib/ai/deepseek';
import { getClientIp } from '../../../lib/public-auth/request';
import { consumePublicRateLimit, createPublicRateKey } from '../../../lib/public-auth/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_MESSAGE_LENGTH = 300;
const MAX_HISTORY = 8;
const MAX_HISTORY_ITEM_LENGTH = 500;
// Replies are capped at ~80 Chinese characters by the persona prompt.
const MAX_REPLY_TOKENS = 200;

// Per visitor IP, stored in the database so the limit holds across serverless instances.
const CHAT_RATE_WINDOWS = [
  { limit: 6, windowMs: 60 * 1000 },
  { limit: 30, windowMs: 60 * 60 * 1000 },
  { limit: 80, windowMs: 24 * 60 * 60 * 1000 },
];

const RESTING_REPLY = `${siteConfig.petConfig.name}今天说了太多话，要去睡觉啦，下次再陪你聊喵~`;

function reply(text: string, status = 200, headers?: HeadersInit) {
  return NextResponse.json({ reply: text }, { status, headers });
}

// Reject obvious cross-site use; stay lenient when no Origin/Referer is present
// (same-origin fetches without an Origin header, server-to-server, curl, etc.).
function isSameOrigin(request: NextRequest): boolean {
  const candidate = request.headers.get('origin') || request.headers.get('referer');
  if (!candidate) return true;
  try {
    return new URL(candidate).host.toLowerCase() === request.nextUrl.host.toLowerCase();
  } catch {
    return true;
  }
}

function sanitizeHistory(history: unknown): AiMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m): m is { role?: unknown; content: string } =>
      !!m && typeof m === 'object' && typeof (m as { content?: unknown }).content === 'string')
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.slice(0, MAX_HISTORY_ITEM_LENGTH),
    }));
}

/**
 * Streams the deltas as plain text. `settled` resolves once the generator has
 * finished (and so recorded its usage), including when the visitor disconnects.
 */
function toTextStream(deltas: AsyncGenerator<string>, upstream: AbortController) {
  let markSettled!: () => void;
  const settled = new Promise<void>((resolve) => { markSettled = resolve; });
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await deltas.next();
        if (!done) {
          controller.enqueue(encoder.encode(value));
          return;
        }
      } catch (error) {
        if (!upstream.signal.aborted) console.error('Chat stream failed', error);
      }
      // Ending normally keeps whatever the visitor already received.
      try { controller.close(); } catch {}
      markSettled();
    },
    async cancel() {
      upstream.abort();
      await deltas.return(undefined).catch(() => {});
      markSettled();
    },
  });
  return { body, settled };
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return reply('喵？这个请求不太对劲...', 403);

  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return reply('喵？没听清你说什么...', 400);
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return reply('说点什么呀喵~', 400);
  if (message.length > MAX_MESSAGE_LENGTH) return reply('太长了喵，说短一点~', 400);

  if (!isAiConfigured()) return reply(RESTING_REPLY);

  try {
    const rateKey = await createPublicRateKey('pet-chat', '', getClientIp(request));
    const rateCheck = await consumePublicRateLimit('pet-chat', rateKey, CHAT_RATE_WINDOWS);
    if (!rateCheck.allowed) {
      return reply('说太快啦，让煤球喘口气喵~', 429, { 'Retry-After': String(rateCheck.retryAfterSeconds) });
    }
    if ((await getMonthlyAiUsage()).exhausted) return reply(RESTING_REPLY);
  } catch (error) {
    console.error('Chat pre-checks failed', error);
    return reply('网络出问题了喵~ 等会儿再试试', 503);
  }

  // The fixed persona goes first so DeepSeek's prefix cache can reuse it across visitors.
  const messages: AiMessage[] = [
    { role: 'system', content: siteConfig.petConfig.systemPrompt },
    ...sanitizeHistory(body.history),
    { role: 'user', content: message },
  ];

  const upstream = new AbortController();
  let deltas: AsyncGenerator<string>;
  try {
    deltas = await openChatStream({
      feature: 'pet-chat',
      messages,
      maxTokens: MAX_REPLY_TOKENS,
      signal: AbortSignal.any([request.signal, upstream.signal]),
    });
  } catch (error) {
    console.error('Chat request failed', error);
    return reply('网络出问题了喵~ 等会儿再试试', 503);
  }

  const { body: stream, settled } = toTextStream(deltas, upstream);
  // Keeps the function alive until usage is recorded, even if the visitor leaves mid-reply.
  after(settled);
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
