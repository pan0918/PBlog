import { createClient } from '@libsql/client';
import { hashPassword } from '../lib/admin/password';

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  const username = process.env.ADMIN_INIT_USERNAME || 'admin';
  const password = process.env.ADMIN_INIT_PASSWORD;

  if (!url || !token) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
    process.exit(1);
  }

  if (!password) {
    console.error('❌ Missing ADMIN_INIT_PASSWORD');
    process.exit(1);
  }

  const db = createClient({ url, authToken: token });

  // Check if admin already exists
  const existing = await db.execute({
    sql: `SELECT id FROM admin_users WHERE username = ?`,
    args: [username],
  });

  if (existing.rows.length > 0) {
    console.log(`⏭️  Admin user "${username}" already exists, skipping.`);
    return;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);

  await db.execute({
    sql: `INSERT INTO admin_users (id, username, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)`,
    args: [id, username, passwordHash, now, now],
  });

  console.log(`✅ Admin user "${username}" created successfully!`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
