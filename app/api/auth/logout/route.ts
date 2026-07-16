import { NextResponse } from 'next/server';
import { getPublicCookieName } from '../../../../lib/public-auth/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(getPublicCookieName());
  return response;
}
