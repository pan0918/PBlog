import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '../../../../lib/admin/password';
import { createPublicUser } from '../../../../lib/db/public-users';
import { getPublicCookieName, getPublicCookieOptions, signPublicUserToken, toPublicProfile } from '../../../../lib/public-auth/auth';
import { createPublicRateKey, checkPublicRateLimit, recordPublicRateEvent } from '../../../../lib/public-auth/rate-limit';
import { getClientIp } from '../../../../lib/public-auth/request';
import { validateRegistration } from '../../../../lib/public-auth/validation';

export async function POST(request: NextRequest) {
  const key = await createPublicRateKey('register', 'public', getClientIp(request));
  const rate = await checkPublicRateLimit('register', key, 3, 60 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ ok: false, message: '注册尝试过多，请稍后再试' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  await recordPublicRateEvent('register', key);

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: '请求格式无效' }, { status: 400 }); }
  const parsed = validateRegistration((body || {}) as Record<string, unknown>);
  if (!parsed.ok) return NextResponse.json({ ok: false, message: parsed.error }, { status: 400 });

  try {
    const passwordHash = await hashPassword(parsed.value.password);
    const user = await createPublicUser({ username: parsed.value.username, email: parsed.value.email, passwordHash });
    const token = await signPublicUserToken({ sub: user.id, username: user.username, sessionVersion: user.session_version });
    const response = NextResponse.json({ ok: true, data: toPublicProfile(user, true) }, { status: 201 });
    response.cookies.set(getPublicCookieName(), token, getPublicCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/username/i.test(message)) return NextResponse.json({ ok: false, message: '用户名已被使用' }, { status: 409 });
    if (/email/i.test(message)) return NextResponse.json({ ok: false, message: '邮箱已被使用' }, { status: 409 });
    return NextResponse.json({ ok: false, message: '注册失败，请稍后再试' }, { status: 500 });
  }
}
