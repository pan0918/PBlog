import { createClient } from '@libsql/client';

let _db: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (_db) return _db;
  _db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  return _db;
}

// Lazy proxy so module evaluation doesn't throw during build
export const db = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    const client = getDb();
    const val = (client as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});
