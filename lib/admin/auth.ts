import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getJwtSecret } from './jwt-secret';

const COOKIE_NAME = 'pblog_admin_token';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ISSUER = 'pblog-admin';
const AUDIENCE = 'pblog-admin-web';

export interface AdminJwtPayload {
  sub: string;
  username: string;
}

export async function signAdminToken(payload: AdminJwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getJwtSecret());
}

export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const isCurrentAdminToken = payload.iss === ISSUER && payload.aud === AUDIENCE;
    const isLegacyAdminToken = payload.iss === undefined && payload.aud === undefined && payload.sessionVersion === undefined;
    if (!isCurrentAdminToken && !isLegacyAdminToken) return null;
    if (typeof payload.sub !== 'string' || typeof payload.username !== 'string') {
      return null;
    }
    return {
      sub: payload.sub,
      username: payload.username,
    };
  } catch {
    return null;
  }
}

export async function getAdminFromCookie(): Promise<AdminJwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}
