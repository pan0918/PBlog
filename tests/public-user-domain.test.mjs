import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  normalizeEmail,
  normalizeUsername,
  validateRegistration,
} from "../lib/public-auth/validation.ts";

test("normalizes public account identifiers", () => {
  assert.equal(normalizeUsername("  Alice_1 "), "alice_1");
  assert.equal(normalizeUsername("  小明_1 "), "小明_1");
  assert.equal(normalizeEmail(" USER@Example.COM "), "user@example.com");
});

test("validates registration fields without weakening passwords", () => {
  assert.deepEqual(validateRegistration({
    username: "Alice_1",
    email: "USER@example.com",
    password: "correct-horse",
    passwordConfirm: "correct-horse",
  }), {
    ok: true,
    value: { username: "alice_1", email: "user@example.com", password: "correct-horse" },
  });
  assert.equal(validateRegistration({ username: "a", email: "bad", password: "123", passwordConfirm: "456" }).ok, false);
});

test("schema and migration define durable public identity tables", async () => {
  const [schema, init, migration] = await Promise.all([
    readFile("lib/schema.sql", "utf8"),
    readFile("scripts/init-db.ts", "utf8"),
    readFile("scripts/migrate-native-comments.ts", "utf8"),
  ]);
  for (const source of [schema, init, migration]) {
    assert.match(source, /public_users/);
    assert.match(source, /public_auth_events/);
  }
  assert.match(schema, /session_version INTEGER NOT NULL DEFAULT 1/);
  assert.match(schema, /must_change_password INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS/);
});
