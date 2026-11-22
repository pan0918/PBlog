import type { NextRequest } from 'next/server';

/**
 * Client IP for rate limiting. Only headers that Vercel's edge sets itself are
 * trusted: Vercel overwrites any client-supplied X-Forwarded-For/X-Real-IP, and
 * x-vercel-forwarded-for stays correct even behind another proxy. Headers such
 * as cf-connecting-ip are deliberately ignored: the site is not proxied
 * through Cloudflare, so a client could set them to dodge rate limits.
 */
export function getClientIp(request: Pick<NextRequest, 'headers'>) {
  return request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
}
