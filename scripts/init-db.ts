import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!url || !token) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
    process.exit(1);
  }

  const db = createClient({ url, authToken: token });
  const schemaPath = join(__dirname, '..', 'lib', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');

  // Execute each CREATE TABLE and CREATE INDEX statement individually
  const statements = [
    `PRAGMA foreign_keys = ON`,
    `CREATE TABLE IF NOT EXISTS admin_users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1, last_login_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS admin_login_failures (id TEXT PRIMARY KEY, rate_key TEXT NOT NULL, attempted_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS public_users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, avatar_url TEXT, status TEXT NOT NULL DEFAULT 'active', muted_until TEXT, session_version INTEGER NOT NULL DEFAULT 1, must_change_password INTEGER NOT NULL DEFAULT 0, last_login_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS public_auth_events (id TEXT PRIMARY KEY, purpose TEXT NOT NULL, rate_key TEXT NOT NULL, attempted_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, description TEXT, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, summary TEXT, content TEXT NOT NULL, cover_url TEXT, category_id TEXT, status TEXT NOT NULL DEFAULT 'draft', is_pinned INTEGER NOT NULL DEFAULT 0, view_count INTEGER NOT NULL DEFAULT 0, published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT, FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL)`,
    `CREATE TABLE IF NOT EXISTS post_tags (post_id TEXT NOT NULL, tag_id TEXT NOT NULL, PRIMARY KEY (post_id, tag_id), FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS post_comments (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, parent_id TEXT, public_user_id TEXT, admin_user_id TEXT, content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'visible', edited_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT, FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (parent_id) REFERENCES post_comments(id) ON DELETE CASCADE, FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE SET NULL, FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL, CHECK ((public_user_id IS NOT NULL) != (admin_user_id IS NOT NULL)))`,
    `CREATE TABLE IF NOT EXISTS comment_likes (comment_id TEXT NOT NULL, public_user_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (comment_id, public_user_id), FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE, FOREIGN KEY (public_user_id) REFERENCES public_users(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS moments (id TEXT PRIMARY KEY, content TEXT NOT NULL, mood TEXT, weather TEXT, location TEXT, status TEXT NOT NULL DEFAULT 'published', published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT, content TEXT, project_url TEXT, github_url TEXT, status TEXT NOT NULL DEFAULT 'published', sort_order INTEGER NOT NULL DEFAULT 0, started_at TEXT, ended_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS friends (id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE, avatar_url TEXT, description TEXT, site_title TEXT, status TEXT NOT NULL DEFAULT 'pending', sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, approved_at TEXT, deleted_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, author TEXT NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, approved_at TEXT, deleted_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS albums (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT, cover_url TEXT, location TEXT, status TEXT NOT NULL DEFAULT 'published', sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, album_id TEXT NOT NULL, title TEXT, description TEXT, image_url TEXT NOT NULL, thumbnail_url TEXT, preview_url TEXT, width INTEGER, height INTEGER, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT, FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS songs (id TEXT PRIMARY KEY, title TEXT NOT NULL, artist TEXT NOT NULL, album TEXT NOT NULL DEFAULT '', pic TEXT NOT NULL DEFAULT '', url TEXT NOT NULL, lrc TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_status_published_at ON posts(status, published_at)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(is_pinned, published_at)`,
    `CREATE INDEX IF NOT EXISTS idx_moments_status_published_at ON moments(status, published_at)`,
    `CREATE INDEX IF NOT EXISTS idx_projects_status_sort ON projects(status, sort_order)`,
    `CREATE INDEX IF NOT EXISTS idx_friends_status_sort ON friends(status, sort_order)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_status_created ON messages(status, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_albums_status_sort ON albums(status, sort_order)`,
    `CREATE INDEX IF NOT EXISTS idx_photos_album_sort ON photos(album_id, sort_order)`,
    `CREATE INDEX IF NOT EXISTS idx_admin_login_failures_key_time ON admin_login_failures(rate_key, attempted_at)`,
    `CREATE INDEX IF NOT EXISTS idx_public_auth_events_key_time ON public_auth_events(purpose, rate_key, attempted_at)`,
    `CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON post_comments(post_id, parent_id, status, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(public_user_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_songs_sort ON songs(sort_order)`,
  ];

  console.log(`📦 Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    try {
      await db.execute(statements[i]);
      console.log(`  ✅ [${i + 1}/${statements.length}] OK`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('already exists')) {
        console.log(`  ⏭️  [${i + 1}/${statements.length}] Already exists`);
      } else {
        console.error(`  ❌ [${i + 1}/${statements.length}] ${msg}`);
      }
    }
  }

  console.log('\n✅ Database initialization complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
