import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../lib/admin/api-helpers';
import { createFriendSchema } from '../../../../lib/admin/validators';
import { getAdminFriends, createFriend } from '../../../../lib/db/friends';
import { revalidateAfterFriend } from '../../../../lib/admin/revalidate';

export async function GET() {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  return success(await getAdminFriends());
}

export async function POST(request: NextRequest) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = createFriendSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    const friend = await createFriend(parsed.data);
    revalidateAfterFriend();
    return success(friend);
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '创建失败');
  }
}
