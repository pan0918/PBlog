import type { Client } from '@libsql/client';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export async function createLoginRateKey(username: string, ip: string): Promise<string> {
  const normalized = `${username.trim().toLowerCase()}\n${ip.trim() || 'unknown'}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function checkLoginRateLimit(
  rateKey: string,
  now: number,
  client: Client,
): Promise<RateLimitResult> {
  const cutoff = new Date(now - WINDOW_MS).toISOString();
  await client.execute({
    sql: 'DELETE FROM admin_login_failures WHERE rate_key = ? AND attempted_at <= ?',
    args: [rateKey, cutoff],
  });

  const result = await client.execute({
    sql: `SELECT COUNT(*) AS failure_count, MIN(attempted_at) AS first_attempt
          FROM admin_login_failures
          WHERE rate_key = ?`,
    args: [rateKey],
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  const failureCount = Number(row?.failure_count ?? 0);
  if (failureCount < MAX_FAILURES) {
    return { allowed: true };
  }

  const firstAttempt = Date.parse(String(row?.first_attempt ?? ''));
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((firstAttempt + WINDOW_MS - now) / 1000),
  );
  return { allowed: false, retryAfterSeconds };
}

export async function recordLoginFailure(
  rateKey: string,
  now: number,
  client: Client,
): Promise<void> {
  await client.execute({
    sql: `INSERT INTO admin_login_failures (id, rate_key, attempted_at)
          VALUES (?, ?, ?)`,
    args: [crypto.randomUUID(), rateKey, new Date(now).toISOString()],
  });
}

export async function clearLoginFailures(
  rateKey: string,
  client: Client,
): Promise<void> {
  await client.execute({
    sql: 'DELETE FROM admin_login_failures WHERE rate_key = ?',
    args: [rateKey],
  });
}
