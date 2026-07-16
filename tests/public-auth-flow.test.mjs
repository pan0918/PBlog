import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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

test("durable public rate keys do not expose identifiers or IPs", async () => {
  const key = await createPublicRateKey("login", "Alice", "203.0.113.8");
  assert.doesNotMatch(key, /alice/i);
  assert.doesNotMatch(key, /203\.0\.113\.8/);
  assert.match(key, /^[a-f0-9]{64}$/);
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
