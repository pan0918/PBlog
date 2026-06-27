import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("root canvas stays themed during vertical overscroll", async () => {
  const globals = await readFile("app/globals.css", "utf8");

  assert.match(globals, /html\s*\{[^}]*background:\s*var\(--page-bg\)/s);
  assert.match(globals, /html\.dark\s*\{[^}]*background:\s*var\(--page-bg-dark\)/s);
  assert.match(globals, /html,\s*body\s*\{[^}]*overscroll-behavior-y:\s*none/s);
});
