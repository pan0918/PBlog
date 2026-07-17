import { NextResponse } from 'next/server';
import { getAdminFromCookie } from '../../../../lib/admin/auth';
import { getPublicUserSession, toPublicProfile } from '../../../../lib/public-auth/auth';
import { siteConfig } from '../../../../siteConfig';

export async function GET() {
  const admin = await getAdminFromCookie();
  if (admin) {
    return NextResponse.json({ ok: true, data: { id: admin.sub, username: siteConfig.authorName, avatarUrl: siteConfig.avatarUrl, status: 'active', mustChangePassword: false, isAuthor: true } });
  }
  const user = await getPublicUserSession();
  return NextResponse.json({ ok: true, data: user ? toPublicProfile(user, true) : null });
}
