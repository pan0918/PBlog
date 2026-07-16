import type { NextRequest } from 'next/server';

export function getClientIp(request: NextRequest) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
}
