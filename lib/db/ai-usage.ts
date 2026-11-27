import { db } from '../db';
import type { TokenUsage } from '../ai/pricing';

type DbLike = Pick<typeof db, 'execute'>;

const CREATE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id TEXT PRIMARY KEY,
    feature TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_cache_hit_tokens INTEGER NOT NULL DEFAULT 0,
    prompt_cache_miss_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON ai_usage_logs(created_at)',
];

const tableReady = new WeakMap<DbLike, Promise<void>>();

// Created on first use so shipping the AI features needs no manual migration.
function ensureTable(client: DbLike) {
  let ready = tableReady.get(client);
  if (!ready) {
    ready = (async () => {
      for (const statement of CREATE_STATEMENTS) await client.execute(statement);
    })();
    ready.catch(() => tableReady.delete(client));
    tableReady.set(client, ready);
  }
  return ready;
}

export interface AiUsageEntry {
  feature: string;
  model: string;
  usage: TokenUsage;
  costUsd: number;
  at?: Date;
}

export async function recordAiUsage(entry: AiUsageEntry, client: DbLike = db): Promise<void> {
  await ensureTable(client);
  await client.execute({
    sql: `INSERT INTO ai_usage_logs
          (id, feature, model, prompt_cache_hit_tokens, prompt_cache_miss_tokens, completion_tokens, cost_usd, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(),
      entry.feature,
      entry.model,
      entry.usage.cacheHitTokens,
      entry.usage.cacheMissTokens,
      entry.usage.completionTokens,
      entry.costUsd,
      (entry.at ?? new Date()).toISOString(),
    ],
  });
}

export interface AiUsageTotals extends TokenUsage {
  calls: number;
  costUsd: number;
}

export interface AiFeatureUsage extends AiUsageTotals {
  feature: string;
}

export async function getAiUsageByFeature(since: Date, client: DbLike = db): Promise<AiFeatureUsage[]> {
  await ensureTable(client);
  const result = await client.execute({
    sql: `SELECT feature,
                 COUNT(*) AS calls,
                 COALESCE(SUM(prompt_cache_hit_tokens), 0) AS hit,
                 COALESCE(SUM(prompt_cache_miss_tokens), 0) AS miss,
                 COALESCE(SUM(completion_tokens), 0) AS completion,
                 COALESCE(SUM(cost_usd), 0) AS cost
          FROM ai_usage_logs WHERE created_at >= ?
          GROUP BY feature ORDER BY feature`,
    args: [since.toISOString()],
  });
  return (result.rows as unknown as Record<string, unknown>[]).map((row) => ({
    feature: String(row.feature),
    calls: Number(row.calls ?? 0),
    cacheHitTokens: Number(row.hit ?? 0),
    cacheMissTokens: Number(row.miss ?? 0),
    completionTokens: Number(row.completion ?? 0),
    costUsd: Number(row.cost ?? 0),
  }));
}

export function sumAiUsage(rows: AiUsageTotals[]): AiUsageTotals {
  return rows.reduce<AiUsageTotals>((total, row) => ({
    calls: total.calls + row.calls,
    cacheHitTokens: total.cacheHitTokens + row.cacheHitTokens,
    cacheMissTokens: total.cacheMissTokens + row.cacheMissTokens,
    completionTokens: total.completionTokens + row.completionTokens,
    costUsd: total.costUsd + row.costUsd,
  }), { calls: 0, cacheHitTokens: 0, cacheMissTokens: 0, completionTokens: 0, costUsd: 0 });
}
