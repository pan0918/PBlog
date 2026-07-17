import { createClient } from '@libsql/client';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const statements = [
  `CREATE TABLE IF NOT EXISTS public_users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, avatar_url TEXT, status TEXT NOT NULL DEFAULT 'active', muted_until TEXT, session_version INTEGER NOT NULL DEFAULT 1, must_change_password INTEGER NOT NULL DEFAULT 0, last_login_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS public_auth_events (id TEXT PRIMARY KEY, purpose TEXT NOT NULL, rate_key TEXT NOT NULL, attempted_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS post_comments (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, parent_id TEXT, public_user_id TEXT, admin_user_id TEXT, content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'visible', edited_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT, FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (parent_id) REFERENCES post_comments(id) ON DELETE CASCADE, FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE SET NULL, FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL, CHECK ((public_user_id IS NOT NULL) != (admin_user_id IS NOT NULL)))`,
  `CREATE TABLE IF NOT EXISTS comment_likes (comment_id TEXT NOT NULL, public_user_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (comment_id, public_user_id), FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE, FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS idx_public_auth_events_key_time ON public_auth_events(purpose, rate_key, attempted_at)`,
  `CREATE INDEX IF NOT EXISTS idx_public_auth_events_attempted_at ON public_auth_events(attempted_at)`,
  `CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON post_comments(post_id, parent_id, status, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_post_comments_parent_created ON post_comments(parent_id, status, created_at, id)`,
  `CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(public_user_id, status)`,
];

const requiredTables = ['public_users', 'public_auth_events', 'post_comments', 'comment_likes'];
const requiredIndexes = [
  'idx_public_auth_events_key_time',
  'idx_public_auth_events_attempted_at',
  'idx_post_comments_post_created',
  'idx_post_comments_parent_created',
  'idx_post_comments_user',
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error('缺少 TURSO_DATABASE_URL 或 TURSO_AUTH_TOKEN');
  const client = createClient({ url, authToken });
  try {
    for (const statement of statements) {
      await client.execute(statement);
      console.log(`✅ ${statement.match(/(?:TABLE|INDEX) IF NOT EXISTS (\w+)/)?.[1] || 'migration'}`);
    }
    const requiredObjects = [...requiredTables, ...requiredIndexes];
    const schema = await client.execute({
      sql: `SELECT name FROM sqlite_master WHERE name IN (${requiredObjects.map(() => '?').join(',')})`,
      args: requiredObjects,
    });
    const existing = new Set(schema.rows.map((row) => String(row.name)));
    const missing = requiredObjects.filter((name) => !existing.has(name));
    if (missing.length) throw new Error(`迁移校验失败，缺少数据库对象：${missing.join(', ')}`);
    console.log(`✅ 迁移校验通过：${requiredTables.length} 个表，${requiredIndexes.length} 个索引`);
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
