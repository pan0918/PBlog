import assert from "node:assert/strict";
import test from "node:test";

import { publishPublicSession, requestPublicAccount, subscribePublicAccountRequest, subscribePublicSession } from "../lib/public-auth/session-events.ts";

test("public session changes synchronize independent account surfaces", () => {
  const target = new EventTarget();
  const received = [];
  const unsubscribe = subscribePublicSession((session) => received.push(session), target);
  const session = { id: "reader-1", username: "Alice", avatarUrl: null, status: "active", mustChangePassword: false, isAuthor: false };
  publishPublicSession(session, target);
  publishPublicSession(null, target);
  unsubscribe();
  publishPublicSession(session, target);
  assert.deepEqual(received, [session, null]);
});

test("comment surfaces can request the single navbar account entry", () => {
  const target = new EventTarget();
  let requests = 0;
  const unsubscribe = subscribePublicAccountRequest(() => { requests += 1; }, target);
  requestPublicAccount(target);
  unsubscribe();
  requestPublicAccount(target);
  assert.equal(requests, 1);
});
