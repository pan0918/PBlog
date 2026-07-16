import { NextRequest, NextResponse } from 'next/server';
import { toggleCommentLike } from '../../../../../lib/db/comments';
import { requirePublicUser } from '../../../../../lib/public-auth/auth';
import { consumePublicRateLimit, createPublicRateKey } from '../../../../../lib/public-auth/rate-limit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requirePublicUser({ forWrite: true });
  if (!user) return NextResponse.json({ ok: false, message: error }, { status: 401 });
  const key = await createPublicRateKey('like', user.id, '');
  const rate = await consumePublicRateLimit('like', key, [{ limit: 60, windowMs: 10 * 60 * 1000 }]);
  if (!rate.allowed) return NextResponse.json({ ok: false, message: '操作太频繁，请稍后再试' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  try {
    const { id } = await params;
    const liked = await toggleCommentLike(id, { id: user.id, sessionVersion: user.session_version });
    return NextResponse.json({ ok: true, data: { liked } });
  } catch (likeError) {
    return NextResponse.json({ ok: false, message: likeError instanceof Error ? likeError.message : '操作失败' }, { status: 400 });
  }
}
