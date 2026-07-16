import { db } from '../db';
import type { InStatement } from '@libsql/client';

type DbLike = Pick<typeof db, 'execute'>;

export type PublicRateWindow = { limit: number; windowMs: number };

async function executeRateStatement(client: DbLike, statement: InStatement) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      return await client.execute(statement);
    } catch (error) {
      const busy = error instanceof Error && /SQLITE_BUSY|database is locked/i.test(`${error.name} ${error.message}`);
      if (!busy || attempt === 19) throw error;
      await new Promise((resolve) => setTimeout(resolve, 5 * (attempt + 1)));
    }
  }
  throw new Error('无法执行限流操作');
}

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

export async function consumePublicRateLimit(
  purpose: string,
  rateKey: string,
  windows: PublicRateWindow[],
  now = Date.now(),
  client: DbLike = db,
) {
  if (!windows.length) throw new Error('限流窗口不能为空');
  const retentionCutoff = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  await client.execute({ sql: `DELETE FROM public_auth_events WHERE attempted_at < ?`, args: [retentionCutoff] }).catch(() => {});
  const conditions = windows.map(() => `(SELECT COUNT(*) FROM public_auth_events WHERE purpose = ? AND rate_key = ? AND attempted_at >= ?) < ?`).join(' AND ');
  const args: Array<string | number> = [crypto.randomUUID(), purpose, rateKey, new Date(now).toISOString()];
  for (const window of windows) {
    args.push(purpose, rateKey, new Date(now - window.windowMs).toISOString(), window.limit);
  }
  const inserted = await executeRateStatement(client, {
    sql: `INSERT INTO public_auth_events (id, purpose, rate_key, attempted_at)
          SELECT ?, ?, ?, ? WHERE ${conditions}`,
    args,
  });
  if (inserted.rowsAffected === 1) return { allowed: true as const };

  const maxWindowMs = Math.max(...windows.map((window) => window.windowMs));
  const result = await client.execute({
    sql: `SELECT attempted_at FROM public_auth_events
          WHERE purpose = ? AND rate_key = ? AND attempted_at >= ? ORDER BY attempted_at ASC`,
    args: [purpose, rateKey, new Date(now - maxWindowMs).toISOString()],
  });
  let retryAfterSeconds = 1;
  for (const window of windows) {
    const matching = result.rows.map((row) => new Date(String(row.attempted_at)).getTime()).filter((attemptedAt) => attemptedAt >= now - window.windowMs);
    if (matching.length >= window.limit) retryAfterSeconds = Math.max(retryAfterSeconds, Math.ceil((matching[matching.length - window.limit] + window.windowMs - now) / 1000));
  }
  return { allowed: false as const, retryAfterSeconds };
}
