import { NextResponse } from 'next/server';
import { getPublicUserSession, toPublicProfile } from '../../../../lib/public-auth/auth';

export async function GET() {
  const user = await getPublicUserSession();
  return NextResponse.json({ ok: true, data: user ? toPublicProfile(user, true) : null });
}
