import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@libsql/client";

process.env.TURSO_DATABASE_URL ||= "file::memory:";
process.env.TURSO_AUTH_TOKEN ||= "test-token";
process.env.JWT_SECRET ||= "test-jwt-secret-with-at-least-32-characters";

const NOW = Date.parse("2026-07-05T12:00:00.000Z");

async function createLoginFailureTable(client) {
  await client.execute(`
    CREATE TABLE admin_login_failures (
      id TEXT PRIMARY KEY,
      rate_key TEXT NOT NULL,
      attempted_at TEXT NOT NULL
    )
  `);
  await client.execute(`
    CREATE INDEX idx_admin_login_failures_key_time
    ON admin_login_failures(rate_key, attempted_at)
  `);
}

test("JWT secrets must be at least 32 characters", async () => {
  const { normalizeJwtSecret } = await import("../lib/admin/jwt-secret.ts");

  assert.throws(() => normalizeJwtSecret(undefined), /JWT_SECRET/);
  assert.throws(() => normalizeJwtSecret("short"), /32/);
  assert.equal(normalizeJwtSecret("x".repeat(32)), "x".repeat(32));
});

test("five failed logins block a durable rate key", async () => {
  const {
    checkLoginRateLimit,
    recordLoginFailure,
  } = await import("../lib/admin/login-rate-limit.ts");
  const client = createClient({ url: "file::memory:" });
  await createLoginFailureTable(client);

  for (let index = 0; index < 5; index += 1) {
    await recordLoginFailure("rate-key", NOW + index, client);
  }

  const result = await checkLoginRateLimit("rate-key", NOW + 5, client);
  assert.equal(result.allowed, false);
  assert.ok(result.retryAfterSeconds > 0);
  client.close();
});

test("expired failures are ignored and successful login clears failures", async () => {
  const {
    checkLoginRateLimit,
    clearLoginFailures,
    recordLoginFailure,
  } = await import("../lib/admin/login-rate-limit.ts");
  const client = createClient({ url: "file::memory:" });
  await createLoginFailureTable(client);

  await recordLoginFailure("rate-key", NOW - 16 * 60 * 1000, client);
  assert.deepEqual(
    await checkLoginRateLimit("rate-key", NOW, client),
    { allowed: true },
  );

  for (let index = 0; index < 5; index += 1) {
    await recordLoginFailure("rate-key", NOW + index, client);
  }
  await clearLoginFailures("rate-key", client);
  assert.deepEqual(
    await checkLoginRateLimit("rate-key", NOW + 5, client),
    { allowed: true },
  );
  client.close();
});

test("login rate keys do not expose the username or IP address", async () => {
  const { createLoginRateKey } = await import("../lib/admin/login-rate-limit.ts");
  const key = await createLoginRateKey("Admin", "203.0.113.8");

  assert.equal(key.length, 64);
  assert.doesNotMatch(key, /admin/i);
  assert.doesNotMatch(key, /203/);
});
