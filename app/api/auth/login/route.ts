import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '../../../../lib/admin/password';
import { getPublicUserByUsername, markPublicUserLogin } from '../../../../lib/db/public-users';
import { getPublicCookieName, getPublicCookieOptions, signPublicUserToken, toPublicProfile } from '../../../../lib/public-auth/auth';
import { clearPublicRateEvents, consumePublicRateLimit, createPublicRateKey } from '../../../../lib/public-auth/rate-limit';
import { getClientIp } from '../../../../lib/public-auth/request';
import { normalizeUsername } from '../../../../lib/public-auth/validation';

const DUMMY_PASSWORD_HASH = '$2b$12$lbN0q.xkuMsXLTLPPFnXBu2oremCrce1Kd.3ndfemYfKke.Izy3KO';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: '请求格式无效' }, { status: 400 }); }
  const username = normalizeUsername(body.username);
  const password = typeof body.password === 'string' ? body.password : '';
  const key = await createPublicRateKey('login', username, getClientIp(request));
  const rate = await consumePublicRateLimit('login', key, [{ limit: 5, windowMs: 15 * 60 * 1000 }]);
  if (!rate.allowed) return NextResponse.json({ ok: false, message: '登录尝试过多，请稍后再试' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });

  const user = username ? await getPublicUserByUsername(username) : null;
  const valid = await verifyPassword(password, user?.password_hash || DUMMY_PASSWORD_HASH);
  if (!user || !valid || user.status === 'banned') {
    return NextResponse.json({ ok: false, message: '用户名或密码错误' }, { status: 401 });
  }
  await clearPublicRateEvents('login', key);
  await markPublicUserLogin(user.id);
  const token = await signPublicUserToken({ sub: user.id, username: user.username, sessionVersion: user.session_version });
  const response = NextResponse.json({ ok: true, data: toPublicProfile(user, true) });
  response.cookies.set(getPublicCookieName(), token, getPublicCookieOptions());
  return response;
}
