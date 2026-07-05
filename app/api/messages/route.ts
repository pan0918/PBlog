import { NextRequest, NextResponse } from 'next/server';
import { createPendingMessage, getApprovedMessages } from '../../../lib/db/messages';
import { revalidateAfterMessage } from '../../../lib/admin/revalidate';
import { checkMessageRateLimit, validateMessageSubmission } from '../../../lib/messageWall';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(request: NextRequest): string {
  return request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
}

export async function GET() {
  try {
    const messages = await getApprovedMessages(100);
    const formatted = messages.map(m => ({
      id: m.id,
      content: m.content,
      author: m.author,
      colorIndex: Math.abs(hashCode(m.id)) % 10,
      createdAt: m.approved_at || m.created_at,
    }));
    return NextResponse.json({ messages: formatted });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateCheck = checkMessageRateLimit(ip);
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
    await createPendingMessage({
      author: validation.author,
      content: validation.content,
    });
    revalidateAfterMessage();
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
