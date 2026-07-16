import { NextRequest, NextResponse } from 'next/server';
import { updatePublicUserProfile } from '../../../../lib/db/public-users';
import { getPublicCookieName, getPublicCookieOptions, requirePublicUser, signPublicUserToken, toPublicProfile } from '../../../../lib/public-auth/auth';
import { normalizeUsername } from '../../../../lib/public-auth/validation';

export async function PATCH(request: NextRequest) {
  const { user, error } = await requirePublicUser();
  if (!user) return NextResponse.json({ ok: false, message: error }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: '请求格式无效' }, { status: 400 }); }
  const username = normalizeUsername(body.username);
  if (!/^[\p{L}\p{N}_]{2,20}$/u.test(username)) return NextResponse.json({ ok: false, message: '用户名需为 2–20 位中英文、数字或下划线' }, { status: 400 });
  try {
    const updated = await updatePublicUserProfile(user.id, username);
    if (!updated) return NextResponse.json({ ok: false, message: '账号不存在' }, { status: 404 });
    const token = await signPublicUserToken({ sub: updated.id, username: updated.username, sessionVersion: updated.session_version });
    const response = NextResponse.json({ ok: true, data: toPublicProfile(updated, true) });
    response.cookies.set(getPublicCookieName(), token, getPublicCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ ok: false, message: '用户名已被使用' }, { status: 409 });
  }
}
