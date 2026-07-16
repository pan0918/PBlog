import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyPassword } from '../../../../lib/admin/password';
import { updatePublicUserPassword } from '../../../../lib/db/public-users';
import { getPublicCookieName, getPublicCookieOptions, requirePublicUser, signPublicUserToken, toPublicProfile } from '../../../../lib/public-auth/auth';

export async function PATCH(request: NextRequest) {
  const { user, error } = await requirePublicUser();
  if (!user) return NextResponse.json({ ok: false, message: error }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: '请求格式无效' }, { status: 400 }); }
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!(await verifyPassword(currentPassword, user.password_hash))) return NextResponse.json({ ok: false, message: '当前密码错误' }, { status: 400 });
  if (newPassword.length < 8 || newPassword.length > 72) return NextResponse.json({ ok: false, message: '新密码长度需为 8–72 位' }, { status: 400 });
  const updated = await updatePublicUserPassword(user.id, await hashPassword(newPassword));
  if (!updated) return NextResponse.json({ ok: false, message: '账号不存在' }, { status: 404 });
  const token = await signPublicUserToken({ sub: updated.id, username: updated.username, sessionVersion: updated.session_version });
  const response = NextResponse.json({ ok: true, data: toPublicProfile(updated, true) });
  response.cookies.set(getPublicCookieName(), token, getPublicCookieOptions());
  return response;
}
