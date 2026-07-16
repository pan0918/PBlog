import { NextRequest } from 'next/server';
import { error, readBody, requireAdmin, success } from '../../../../../lib/admin/api-helpers';
import { type AdminCommentStatus, updateAdminCommentStatus } from '../../../../../lib/db/comments';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;
  const body = await readBody(request);
  const status = body && typeof body.status === 'string' ? body.status : '';
  if (!['visible', 'hidden', 'spam', 'deleted'].includes(status)) return error('评论状态无效');
  try {
    const { id } = await params;
    await updateAdminCommentStatus(id, status as AdminCommentStatus);
    return success();
  } catch (updateError) {
    return error(updateError instanceof Error ? updateError.message : '更新失败', 404);
  }
}
