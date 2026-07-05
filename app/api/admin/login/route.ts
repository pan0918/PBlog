import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { verifyPassword } from '../../../../lib/admin/password';
import { signAdminToken, getCookieName, getCookieOptions } from '../../../../lib/admin/auth';
import { loginSchema } from '../../../../lib/admin/validators';
import {
  checkLoginRateLimit,
  clearLoginFailures,
  createLoginRateKey,
  recordLoginFailure,
} from '../../../../lib/admin/login-rate-limit';

const DUMMY_PASSWORD_HASH = '$2b$12$lbN0q.xkuMsXLTLPPFnXBu2oremCrce1Kd.3ndfemYfKke.Izy3KO';

function getClientIp(request: NextRequest): string {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: '请输入用户名和密码' }, { status: 400 });
    }

    const { username, password } = parsed.data;
    const rateKey = await createLoginRateKey(username, getClientIp(request));
    const rateLimit = await checkLoginRateLimit(rateKey, Date.now(), db);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, message: '登录尝试过多，请稍后再试' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    // Find admin user
    const result = await db.execute({
      sql: `SELECT id, username, password_hash, is_active FROM admin_users WHERE username = ?`,
      args: [username],
    });

    if (result.rows.length === 0) {
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      await recordLoginFailure(rateKey, Date.now(), db);
      return NextResponse.json({ ok: false, message: '用户名或密码错误' }, { status: 401 });
    }

    const admin = result.rows[0] as Record<string, unknown>;

    if (!admin.is_active) {
      await recordLoginFailure(rateKey, Date.now(), db);
      return NextResponse.json({ ok: false, message: '用户名或密码错误' }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.password_hash as string);
    if (!valid) {
      await recordLoginFailure(rateKey, Date.now(), db);
      return NextResponse.json({ ok: false, message: '用户名或密码错误' }, { status: 401 });
    }

    await clearLoginFailures(rateKey, db);

    // Update last_login_at
    const now = new Date().toISOString();
    await db.execute({ sql: `UPDATE admin_users SET last_login_at = ? WHERE id = ?`, args: [now, admin.id as string] });

    // Sign JWT
    const token = await signAdminToken({ sub: admin.id as string, username: admin.username as string });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(getCookieName(), token, getCookieOptions());
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: '服务器错误' }, { status: 500 });
  }
}
