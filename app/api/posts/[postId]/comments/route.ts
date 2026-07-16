import { NextRequest, NextResponse } from 'next/server';
import { sanitizeCommentContent } from '../../../../../lib/comments/validation';
import { resolveCommentActor } from '../../../../../lib/comments/service';
import { createComment, listComments } from '../../../../../lib/db/comments';
import { consumePublicRateLimit, createPublicRateKey } from '../../../../../lib/public-auth/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const { actor } = await resolveCommentActor(false);
  const viewerId = actor?.kind === 'user' ? actor.id : null;
  return NextResponse.json({ ok: true, data: await listComments(postId, request.nextUrl.searchParams.get('cursor'), viewerId) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const { actor, error } = await resolveCommentActor(true);
  if (!actor) return NextResponse.json({ ok: false, message: error || '请先登录' }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: '请求格式无效' }, { status: 400 }); }
  const parsed = sanitizeCommentContent(body.content);
  if (!parsed.ok) return NextResponse.json({ ok: false, message: parsed.error }, { status: 400 });
  if (actor.kind === 'user') {
    const key = await createPublicRateKey('comment', actor.id, '');
    const rate = await consumePublicRateLimit('comment', key, [{ limit: 5, windowMs: 10 * 60 * 1000 }, { limit: 20, windowMs: 60 * 60 * 1000 }]);
    if (!rate.allowed) return NextResponse.json({ ok: false, message: '评论太频繁，请稍后再试' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  }
  try {
    const id = await createComment({ postId, parentId: typeof body.parentId === 'string' ? body.parentId : null, content: parsed.content, actor });
    return NextResponse.json({ ok: true, data: { id } }, { status: 201 });
  } catch (writeError) {
    return NextResponse.json({ ok: false, message: writeError instanceof Error ? writeError.message : '评论失败' }, { status: 400 });
  }
}
