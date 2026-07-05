import { createClient } from '@libsql/client';

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('Missing TURSO_DATABASE_URL environment variable');
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('Missing TURSO_AUTH_TOKEN environment variable');
}

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
