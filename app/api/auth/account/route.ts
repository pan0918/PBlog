import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '../../../../lib/admin/password';
import { deletePublicUserAccount } from '../../../../lib/db/public-users';
import { getPublicCookieName, requirePublicUser } from '../../../../lib/public-auth/auth';

export async function DELETE(request: NextRequest) {
  const { user, error } = await requirePublicUser();
  if (!user) return NextResponse.json({ ok: false, message: error }, { status: 401 });
  let password = '';
  try { const body = await request.json(); password = typeof body.password === 'string' ? body.password : ''; } catch {}
  if (!(await verifyPassword(password, user.password_hash))) return NextResponse.json({ ok: false, message: '密码错误' }, { status: 400 });
  await deletePublicUserAccount(user.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(getPublicCookieName());
  return response;
}
