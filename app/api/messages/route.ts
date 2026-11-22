import { NextRequest, NextResponse } from 'next/server';
import { createPendingMessage, getApprovedMessages } from '../../../lib/db/messages';
import { validateMessageSubmission } from '../../../lib/messageWall';
import { getClientIp } from '../../../lib/public-auth/request';
import { consumePublicRateLimit, createPublicRateKey } from '../../../lib/public-auth/rate-limit';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stored in the database so the limit holds across serverless instances.
const MESSAGE_RATE_WINDOWS = [
  { limit: 3, windowMs: 10 * 60 * 1000 },
  { limit: 10, windowMs: 60 * 60 * 1000 },
];

export async function GET() {
  try {
    const messages = await getApprovedMessages();
    const formatted = messages.map(m => ({
      id: m.id,
      content: m.content,
      author: m.author?.trim() || '匿名',
      colorIndex: Math.abs(hashCode(m.id)) % 10,
      createdAt: m.created_at,
    }));
    return NextResponse.json({ messages: formatted });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request: NextRequest) {
  let rateCheck: Awaited<ReturnType<typeof consumePublicRateLimit>>;
  try {
    const rateKey = await createPublicRateKey('message', '', getClientIp(request));
    rateCheck = await consumePublicRateLimit('message', rateKey, MESSAGE_RATE_WINDOWS);
  } catch {
    return NextResponse.json({ error: '留言提交失败，请稍后再试' }, { status: 500 });
  }
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: '提交太频繁，请稍后再试' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求格式无效' }, { status: 400 });
  }

  const validation = validateMessageSubmission({
    author: body.author,
    content: body.content,
    honeypot: body.honeypot,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  try {
    // Pending messages are not public yet, so no page cache needs refreshing;
    // approving one in the admin revalidates the wall.
    await createPendingMessage({
      author: validation.author,
      content: validation.content,
    });
    return NextResponse.json({ ok: true, message: '留言已收到，审核后展示。' });
  } catch {
    return NextResponse.json({ error: '留言提交失败，请稍后再试' }, { status: 500 });
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}
