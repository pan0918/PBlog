import { NextRequest } from 'next/server';
import { error, readBody, requireAdmin, success } from '../../../../../../lib/admin/api-helpers';
import { hashPassword } from '../../../../../../lib/admin/password';
import { setPublicUserTemporaryPassword } from '../../../../../../lib/db/public-users';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;
  const body = await readBody(request);
  const password = body && typeof body.password === 'string' ? body.password : '';
  if (password.length < 8 || password.length > 72) return error('临时密码长度需为 8–72 位');
  try {
    const { id } = await params;
    await setPublicUserTemporaryPassword(id, await hashPassword(password));
    return success();
  } catch (updateError) {
    return error(updateError instanceof Error ? updateError.message : '设置失败', 404);
  }
}
