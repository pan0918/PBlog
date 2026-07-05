import { NextResponse } from 'next/server';
import { getCookieName } from '../../../../lib/admin/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(getCookieName());
  return response;
}
