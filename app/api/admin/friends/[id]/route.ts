import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../../lib/admin/api-helpers';
import { updateFriendSchema } from '../../../../../lib/admin/validators';
import { getFriendById, updateFriend, softDeleteFriend } from '../../../../../lib/db/friends';
import { revalidateAfterFriend } from '../../../../../lib/admin/revalidate';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const friend = await getFriendById(id);
  if (!friend) return error('友链不存在', 404);
  return success(friend);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = updateFriendSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    await updateFriend(id, parsed.data);
    revalidateAfterFriend();
    return success(await getFriendById(id));
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '更新失败');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  try {
    await softDeleteFriend(id);
    revalidateAfterFriend();
    return success();
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '删除失败');
  }
}
