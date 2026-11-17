import { NextRequest, NextResponse } from 'next/server';

/**
 * v39 global API guard — defense in depth on top of the per-route
 * rateLimit() calls in src/lib/server/auth.ts:
 *
 * 1. HARD BODY CAP — profile/forgot photos post as base64 JSON; nothing in
 *    the app needs more than a few MB, so anything bigger is a DoS attempt
 *    against the small LAN server. 25 MB is far above every real request.
 * 2. GLOBAL API THROTTLE — per-IP bucket (300 req/min) on ALL /api routes.
 *    The per-route limits key on x-forwarded-for, which a direct LAN caller
 *    can spoof to spread its attempts over fake IPs — this global bucket
 *    bounds the TOTAL attempt rate no matter how the headers are faked.
 * 3. AUTH-PATH THROTTLE — the login/unlock/forgot/password endpoints get a
 *    much tighter per-IP ceiling (20 req/min) as a second layer under the
 *    per-route 10-per-5-min limits.
 */

const WINDOW_MS = 60_000;
const API_MAX = 300;
const AUTH_MAX = 20;
const MAX_BODY_BYTES = 25 * 1024 * 1024;

const buckets = new Map<string, { n: number; reset: number }>();

function take(key: string, max: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + WINDOW_MS });
    return true;
  }
  b.n += 1;
  return b.n <= max;
}

function prune(now: number): void {
  if (buckets.size < 10_000) return;
  for (const [k, v] of buckets) {
    if (v.reset < now) buckets.delete(k);
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/api/')) return NextResponse.next();

  const cl = Number(req.headers.get('content-length') || 0);
  if (cl > MAX_BODY_BYTES) {
    return new NextResponse(JSON.stringify({ error: 'payloadTooLarge' }), {
      status: 413,
      headers: { 'content-type': 'application/json' },
    });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local';
  const now = Date.now();
  prune(now);

  const authPath = /\/api\/(auth|staff)\/(login|unlock|forgot|password)/.test(pathname);
  if ((authPath && !take(`auth:${ip}`, AUTH_MAX)) || !take(`api:${ip}`, API_MAX)) {
    return new NextResponse(JSON.stringify({ error: 'rateLimited' }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
