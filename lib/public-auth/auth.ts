import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getJwtSecret } from '../admin/jwt-secret';
import { getPublicUserById, type PublicUserRecord } from '../db/public-users';

const COOKIE_NAME = 'pblog_user_token';
const ISSUER = 'pblog-public-users';
const AUDIENCE = 'pblog-public-web';

export interface PublicUserJwtPayload {
  sub: string;
  username: string;
  sessionVersion: number;
}

export async function signPublicUserToken(payload: PublicUserJwtPayload) {
  return new SignJWT({ username: payload.username, sessionVersion: payload.sessionVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function verifyPublicUserToken(token: string): Promise<PublicUserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { issuer: ISSUER, audience: AUDIENCE });
    if (typeof payload.sub !== 'string' || typeof payload.username !== 'string' || typeof payload.sessionVersion !== 'number') return null;
    return { sub: payload.sub, username: payload.username, sessionVersion: payload.sessionVersion };
  } catch {
    return null;
  }
}

export function getPublicCookieName() { return COOKIE_NAME; }

export function getPublicCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function toPublicProfile(user: PublicUserRecord, includeEmail = false) {
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatar_url,
    status: user.status,
    mustChangePassword: Boolean(user.must_change_password),
    isAuthor: false,
    ...(includeEmail ? { email: user.email } : {}),
  };
}

export async function getPublicUserSession(): Promise<PublicUserRecord | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyPublicUserToken(token);
  if (!payload) return null;
  const user = await getPublicUserById(payload.sub);
  if (!user || user.status === 'banned' || user.session_version !== payload.sessionVersion) return null;
  return user;
}

export async function requirePublicUser(options: { forWrite?: boolean } = {}) {
  const user = await getPublicUserSession();
  if (!user) return { user: null, error: '请先登录' };
  if (options.forWrite && user.must_change_password) return { user: null, error: '请先修改临时密码' };
  if (options.forWrite && user.status === 'muted' && (!user.muted_until || new Date(user.muted_until).getTime() > Date.now())) {
    return { user: null, error: '账号当前处于禁言状态' };
  }
  return { user, error: null };
}
