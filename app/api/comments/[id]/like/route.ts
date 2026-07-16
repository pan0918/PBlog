import { NextRequest, NextResponse } from 'next/server';
import { toggleCommentLike } from '../../../../../lib/db/comments';
import { requirePublicUser } from '../../../../../lib/public-auth/auth';
import { checkPublicRateLimit, createPublicRateKey, recordPublicRateEvent } from '../../../../../lib/public-auth/rate-limit';
import { getClientIp } from '../../../../../lib/public-auth/request';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requirePublicUser({ forWrite: true });
  if (!user) return NextResponse.json({ ok: false, message: error }, { status: 401 });
  const key = await createPublicRateKey('like', user.id, getClientIp(request));
  const rate = await checkPublicRateLimit('like', key, 60, 10 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ ok: false, message: '操作太频繁，请稍后再试' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  await recordPublicRateEvent('like', key);
  try {
    const { id } = await params;
    const liked = await toggleCommentLike(id, user.id);
    return NextResponse.json({ ok: true, data: { liked } });
  } catch (likeError) {
    return NextResponse.json({ ok: false, message: likeError instanceof Error ? likeError.message : '操作失败' }, { status: 400 });
  }
}
