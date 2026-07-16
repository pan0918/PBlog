import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { unlink } from "node:fs/promises";
import test from "node:test";
import { createClient } from "@libsql/client";

process.env.JWT_SECRET ||= "test-public-jwt-secret-with-at-least-32-characters";

const {
  getPublicCookieOptions,
  signPublicUserToken,
  verifyPublicUserToken,
} = await import("../lib/public-auth/auth.ts");
const { createPublicRateKey } = await import("../lib/public-auth/rate-limit.ts");

test("public JWTs are isolated and retain session version", async () => {
  const payload = { sub: "u1", username: "alice", sessionVersion: 2 };
  const token = await signPublicUserToken(payload);
  assert.deepEqual(await verifyPublicUserToken(token), payload);
  assert.equal(getPublicCookieOptions().maxAge, 60 * 60 * 24 * 7);
  assert.equal(getPublicCookieOptions().httpOnly, true);
  assert.equal(getPublicCookieOptions().sameSite, "lax");
});

test("public JWTs cannot be replayed as administrator sessions", async () => {
  const { signAdminToken, verifyAdminToken } = await import("../lib/admin/auth.ts");
  const adminToken = await signAdminToken({ sub: "a1", username: "admin" });
  assert.deepEqual(await verifyAdminToken(adminToken), { sub: "a1", username: "admin" });
  const publicToken = await signPublicUserToken({ sub: "u1", username: "alice", sessionVersion: 1 });
  assert.equal(await verifyAdminToken(publicToken), null);
});

test("durable public rate keys do not expose identifiers or IPs", async () => {
  const key = await createPublicRateKey("login", "Alice", "203.0.113.8");
  assert.doesNotMatch(key, /alice/i);
  assert.doesNotMatch(key, /203\.0\.113\.8/);
  assert.match(key, /^[a-f0-9]{64}$/);
});

test("durable rate consumption is atomic under concurrent requests", async () => {
  const { consumePublicRateLimit } = await import("../lib/public-auth/rate-limit.ts");
  const databasePath = `/tmp/pblog-rate-${crypto.randomUUID()}.db`;
  const client = createClient({ url: `file:${databasePath}` });
  await client.execute("CREATE TABLE public_auth_events (id TEXT PRIMARY KEY, purpose TEXT NOT NULL, rate_key TEXT NOT NULL, attempted_at TEXT NOT NULL)");
  await client.execute("CREATE INDEX idx_public_auth_events_key_time ON public_auth_events(purpose, rate_key, attempted_at)");
  const clients = Array.from({ length: 10 }, () => createClient({ url: `file:${databasePath}` }));
  const results = await Promise.all(clients.map((rateClient) => consumePublicRateLimit("comment", "user-key", [{ limit: 3, windowMs: 60_000 }], Date.now(), rateClient)));
  assert.equal(results.filter((result) => result.allowed).length, 3);
  clients.forEach((rateClient) => rateClient.close());
  client.close();
  await unlink(databasePath).catch(() => {});
});

test("public auth routes hash passwords and use generic login failures", async () => {
  const [register, login, password, account, auth, repository] = await Promise.all([
    readFile("app/api/auth/register/route.ts", "utf8"),
    readFile("app/api/auth/login/route.ts", "utf8"),
    readFile("app/api/auth/password/route.ts", "utf8"),
    readFile("app/api/auth/account/route.ts", "utf8"),
    readFile("lib/public-auth/auth.ts", "utf8"),
    readFile("lib/db/public-users.ts", "utf8"),
  ]);
  assert.match(register, /hashPassword/);
  assert.match(register, /validateRegistration/);
  assert.match(login, /DUMMY_PASSWORD_HASH/);
  assert.match(login, /用户名或密码错误/);
  assert.match(`${password}\n${repository}`, /session_version/);
  assert.match(`${password}\n${repository}`, /must_change_password/);
  assert.match(account, /deletePublicUserAccount/);
  assert.match(auth, /pblog_user_token/);
  assert.match(auth, /ISSUER = ['"]pblog-public-users['"]/);
  assert.match(auth, /jwtVerify\(token, getJwtSecret\(\), \{ issuer: ISSUER, audience: AUDIENCE \}\)/);
  assert.match(repository, /UPDATE post_comments SET status = 'deleted'/);
  assert.match(repository, /transaction\('write'\)/);
});

test("session endpoint never exposes password hashes", async () => {
  const [route, auth] = await Promise.all([
    readFile("app/api/auth/session/route.ts", "utf8"),
    readFile("lib/public-auth/auth.ts", "utf8"),
  ]);
  assert.doesNotMatch(route, /password_hash/);
  assert.match(`${route}\n${auth}`, /mustChangePassword/);
});
