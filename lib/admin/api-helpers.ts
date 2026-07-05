import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromCookie } from './auth';

export async function requireAdmin() {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return { admin: null, error: NextResponse.json({ ok: false, message: '未授权' }, { status: 401 }) };
  }
  return { admin, error: null };
}

export function success(data?: unknown) {
  return NextResponse.json({ ok: true, data });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function readBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
