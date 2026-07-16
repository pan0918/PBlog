import { NextRequest, NextResponse } from 'next/server';
import { resolveCommentActor } from '../../../../lib/comments/service';
import { sanitizeCommentContent } from '../../../../lib/comments/validation';
import { editComment } from '../../../../lib/db/comments';
import { checkPublicRateLimit, createPublicRateKey, recordPublicRateEvent } from '../../../../lib/public-auth/rate-limit';
import { getClientIp } from '../../../../lib/public-auth/request';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { actor, error } = await resolveCommentActor(true);
  if (!actor) return NextResponse.json({ ok: false, message: error || '请先登录' }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: '请求格式无效' }, { status: 400 }); }
  const parsed = sanitizeCommentContent(body.content);
  if (!parsed.ok) return NextResponse.json({ ok: false, message: parsed.error }, { status: 400 });
  try {
    const { id } = await params;
    let editRateKey: string | null = null;
    if (actor.kind === 'user') {
      editRateKey = await createPublicRateKey('comment-edit', actor.id, getClientIp(request));
      const rate = await checkPublicRateLimit('comment-edit', editRateKey, 20, 60 * 60 * 1000);
      if (!rate.allowed) return NextResponse.json({ ok: false, message: '编辑太频繁，请稍后再试' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
    }
    await editComment(id, parsed.content, actor);
    if (editRateKey) await recordPublicRateEvent('comment-edit', editRateKey);
    return NextResponse.json({ ok: true });
  } catch (editError) {
    return NextResponse.json({ ok: false, message: editError instanceof Error ? editError.message : '编辑失败' }, { status: 403 });
  }
}
