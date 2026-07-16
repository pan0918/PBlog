import { NextRequest } from 'next/server';
import { error, readBody, requireAdmin, success } from '../../../../../lib/admin/api-helpers';
import { moderatePublicUser, type PublicUserStatus } from '../../../../../lib/db/public-users';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;
  const body = await readBody(request);
  const status = body && typeof body.status === 'string' ? body.status : '';
  if (!['active', 'muted', 'banned'].includes(status)) return error('用户状态无效');
  let mutedUntil: string | null = null;
  if (status === 'muted' && body?.mutedUntil) {
    if (typeof body.mutedUntil !== 'string' || !Number.isFinite(new Date(body.mutedUntil).getTime())) return error('禁言截止时间无效');
    mutedUntil = new Date(body.mutedUntil).toISOString();
  }
  try {
    const { id } = await params;
    await moderatePublicUser(id, status as PublicUserStatus, mutedUntil);
    return success();
  } catch (updateError) {
    return error(updateError instanceof Error ? updateError.message : '更新失败', 404);
  }
}
