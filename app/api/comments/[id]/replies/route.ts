import { NextRequest, NextResponse } from 'next/server';
import { resolveCommentActor } from '../../../../../lib/comments/service';
import { listCommentReplies } from '../../../../../lib/db/comments';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actor } = await resolveCommentActor(false);
  const viewerId = actor?.kind === 'user' ? actor.id : null;
  try {
    const data = await listCommentReplies(id, request.nextUrl.searchParams.get('cursor'), viewerId);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : '回复加载失败' }, { status: 404 });
  }
}
