import { db } from '../db';

type DbLike = Pick<typeof db, 'execute'>;

export async function createPublicRateKey(purpose: string, identity: string, ip: string) {
  const bytes = new TextEncoder().encode(`${purpose}\n${identity.trim().toLowerCase()}\n${ip.trim() || 'unknown'}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function checkPublicRateLimit(
  purpose: string,
  rateKey: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
  client: DbLike = db,
) {
  const cutoff = new Date(now - windowMs).toISOString();
  const result = await client.execute({
    sql: `SELECT attempted_at FROM public_auth_events
          WHERE purpose = ? AND rate_key = ? AND attempted_at >= ? ORDER BY attempted_at ASC`,
    args: [purpose, rateKey, cutoff],
  });
  if (result.rows.length < limit) return { allowed: true as const };
  const first = new Date(String(result.rows[0].attempted_at)).getTime();
  return { allowed: false as const, retryAfterSeconds: Math.max(1, Math.ceil((first + windowMs - now) / 1000)) };
}

export async function recordPublicRateEvent(purpose: string, rateKey: string, now = Date.now(), client: DbLike = db) {
  await client.execute({
    sql: `INSERT INTO public_auth_events (id, purpose, rate_key, attempted_at) VALUES (?, ?, ?, ?)`,
    args: [crypto.randomUUID(), purpose, rateKey, new Date(now).toISOString()],
  });
}

export async function clearPublicRateEvents(purpose: string, rateKey: string, client: DbLike = db) {
  await client.execute({ sql: `DELETE FROM public_auth_events WHERE purpose = ? AND rate_key = ?`, args: [purpose, rateKey] });
}
