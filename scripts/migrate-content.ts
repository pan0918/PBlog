import { createClient, type Client } from '@libsql/client';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import matter from 'gray-matter';

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!url || !token) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
    process.exit(1);
  }

  const db = createClient({ url, authToken: token });
  const projectRoot = join(__dirname, '..');

  console.log(isDryRun ? '🔍 DRY RUN MODE - No data will be written\n' : '🚀 MIGRATE MODE - Writing to database\n');

  await migrateCategories(db, projectRoot);
  await migrateTags(db, projectRoot);
  await migratePosts(db, projectRoot);
  await migrateMoments(db, projectRoot);
  await migrateProjects(db, projectRoot);
  await migrateFriends(db, projectRoot);
  await migrateMessages(db, projectRoot);
  await migrateAlbumsAndPhotos(db, projectRoot);

  console.log('\n✅ Migration complete!');
}

async function upsert(db: Client, sql: string, args: (string | number | null)[], label: string) {
  if (isDryRun) {
    console.log(`  🔍 [DRY] ${label}`);
    return;
  }
  try {
    await db.execute({ sql, args });
    console.log(`  ✅ ${label}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE constraint')) {
      console.log(`  ⏭️  ${label} (already exists, skipped)`);
    } else {
      throw new Error(`${label}: ${msg}`);
    }
  }
}

// --- Categories ---
async function migrateCategories(db: Client, root: string) {
  console.log('📂 Migrating categories...');
  const postsDir = join(root, 'posts');
  if (!existsSync(postsDir)) { console.log('  ⏭️  No posts/ directory'); return; }

  const dirs = readdirSync(postsDir, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const dir of dirs) {
    const slug = dir.name.toLowerCase();
    const name = dir.name;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await upsert(db,
      `INSERT OR IGNORE INTO categories (id, name, slug, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, slug, null, 0, now, now],
      `Category: ${name}`
    );
  }
}

// --- Tags ---
async function migrateTags(db: Client, root: string) {
  console.log('\n🏷️  Migrating tags...');
  const postsDir = join(root, 'posts');
  if (!existsSync(postsDir)) return;

  const tagSet = new Set<string>();
  scanForTags(postsDir, tagSet);

  for (const tagName of tagSet) {
    const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await upsert(db,
      `INSERT OR IGNORE INTO tags (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [id, tagName, slug, now, now],
      `Tag: ${tagName}`
    );
  }
}

function scanForTags(dir: string, tagSet: Set<string>) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      scanForTags(fullPath, tagSet);
    } else if (entry.name.endsWith('.md')) {
      const content = readFileSync(fullPath, 'utf8');
      const { data } = matter(content);
      if (Array.isArray(data.tags)) {
        data.tags.forEach((t: string) => tagSet.add(t));
      }
    }
  }
}

// --- Posts ---
async function migratePosts(db: Client, root: string) {
  console.log('\n📝 Migrating posts...');
  const postsDir = join(root, 'posts');
  if (!existsSync(postsDir)) { console.log('  ⏭️  No posts/ directory'); return; }

  const files = scanMdFiles(postsDir);
  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf8');
    const { data, content: body } = matter(content);
    const relPath = relative(postsDir, filePath);
    const slug = relPath.replace(/\.md$/, '');
    const legacySlug = slug.replace(/\//g, '-');
    const dirName = dirname(relPath);
    const categorySlug = dirName === '.' ? null : dirName.toLowerCase();

    const title = data.title || slug;
    const summary = data.description || body.substring(0, 120);
    const coverUrl = data.cover || null;
    const publishedAt = data.date ? new Date(data.date).toISOString() : new Date().toISOString();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Get category_id
    let categoryId: string | null = null;
    if (categorySlug) {
      const catResult = await db.execute({ sql: `SELECT id FROM categories WHERE slug = ?`, args: [categorySlug] });
      if (catResult.rows.length > 0) {
        categoryId = (catResult.rows[0] as Record<string, unknown>).id as string;
      }
    }

    if (!isDryRun) {
      const canonicalPost = await db.execute({
        sql: `SELECT id FROM posts WHERE slug = ?`,
        args: [slug],
      });
      if (canonicalPost.rows.length === 0 && legacySlug !== slug) {
        await db.execute({
          sql: `UPDATE posts SET slug = ?, updated_at = ? WHERE slug = ?`,
          args: [slug, now, legacySlug],
        });
      }
    }

    await upsert(
      db,
      `INSERT OR IGNORE INTO posts (id, title, slug, summary, content, cover_url, category_id, status, is_pinned, view_count, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 0, 0, ?, ?, ?)`,
      [id, title, slug, summary, body, coverUrl, categoryId, publishedAt, now, now],
      `Post: ${title}`,
    );

    // Migrate post tags
    if (Array.isArray(data.tags) && !isDryRun) {
      const postResult = await db.execute({ sql: `SELECT id FROM posts WHERE slug = ?`, args: [slug] });
      if (postResult.rows.length > 0) {
        const postId = (postResult.rows[0] as Record<string, unknown>).id as string;
        for (const tagName of data.tags) {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const tagResult = await db.execute({ sql: `SELECT id FROM tags WHERE slug = ?`, args: [tagSlug] });
          if (tagResult.rows.length > 0) {
            const tagId = (tagResult.rows[0] as Record<string, unknown>).id as string;
            await db.execute({ sql: `INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`, args: [postId, tagId] });
          }
        }
      }
    }
  }
}

function scanMdFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanMdFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

// --- Moments ---
async function migrateMoments(db: Client, root: string) {
  console.log('\n💭 Migrating moments...');
  const momentsDir = join(root, 'moments');
  if (!existsSync(momentsDir)) { console.log('  ⏭️  No moments/ directory'); return; }

  const files = readdirSync(momentsDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const content = readFileSync(join(momentsDir, file), 'utf8');
    const { data, content: body } = matter(content);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const publishedAt = data.date ? new Date(data.date).toISOString() : now;
    const normalizedBody = body.trim();

    if (!isDryRun) {
      const existing = await db.execute({
        sql: `SELECT id FROM moments WHERE published_at = ? AND content = ?`,
        args: [publishedAt, normalizedBody],
      });
      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Moment: ${file} (already exists, skipped)`);
        continue;
      }
    }

    await upsert(db,
      `INSERT OR IGNORE INTO moments (id, content, mood, weather, location, status, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'published', ?, ?, ?)`,
      [id, normalizedBody, data.mood || null, data.weather || null, data.location || null, publishedAt, now, now],
      `Moment: ${file}`
    );
  }
}

// --- Projects ---
async function migrateProjects(db: Client, root: string) {
  console.log('\n🚀 Migrating projects...');
  const projectsPath = join(root, 'data', 'projects.ts');
  if (!existsSync(projectsPath)) { console.log('  ⏭️  No data/projects.ts'); return; }

  // Import the projects data
  const { projectsData } = await import(join(root, 'data', 'projects'));

  for (let i = 0; i < projectsData.length; i++) {
    const p = projectsData[i];
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const slug = p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    await upsert(db,
      `INSERT OR IGNORE INTO projects (id, title, slug, description, content, project_url, github_url, status, sort_order, started_at, ended_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, NULL, NULL, ?, ?)`,
      [id, p.name, slug, p.description, null, null, p.githubUrl || null, i, now, now],
      `Project: ${p.name}`
    );
  }
}

// --- Friends ---
async function migrateFriends(db: Client, root: string) {
  console.log('\n🔗 Migrating friends...');
  const friendsPath = join(root, 'data', 'friends.ts');
  if (!existsSync(friendsPath)) { console.log('  ⏭️  No data/friends.ts'); return; }

  const { friendsData } = await import(join(root, 'data', 'friends'));

  for (let i = 0; i < friendsData.length; i++) {
    const f = friendsData[i];
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await upsert(db,
      `INSERT OR IGNORE INTO friends (id, name, url, avatar_url, description, site_title, status, sort_order, created_at, updated_at, approved_at) VALUES (?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?)`,
      [id, f.name, f.url, f.avatar || null, f.description || null, null, i, now, now, now],
      `Friend: ${f.name}`
    );
  }
}

// --- Messages ---
async function migrateMessages(db: Client, root: string) {
  console.log('\n💬 Migrating messages...');
  const messagesPath = join(root, 'data', 'messages.json');
  if (!existsSync(messagesPath)) { console.log('  ⏭️  No data/messages.json'); return; }

  const raw = readFileSync(messagesPath, 'utf8');
  const messages = JSON.parse(raw);
  if (!Array.isArray(messages)) { console.log('  ⏭️  messages.json is not an array'); return; }

  for (const msg of messages) {
    const id = msg.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const createdAt = msg.createdAt || now;
    const author = msg.author || '匿名';
    const messageContent = msg.content;

    if (!isDryRun) {
      const existing = await db.execute({
        sql: `SELECT id FROM messages WHERE created_at = ? AND author = ? AND content = ?`,
        args: [createdAt, author, messageContent],
      });
      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Message: ${(messageContent || '').substring(0, 30)}... (already exists, skipped)`);
        continue;
      }
    }

    await upsert(db,
      `INSERT OR IGNORE INTO messages (id, author, content, status, created_at, updated_at, approved_at) VALUES (?, ?, ?, 'approved', ?, ?, ?)`,
      [id, author, messageContent, createdAt, now, createdAt],
      `Message: ${(messageContent || '').substring(0, 30)}...`
    );
  }
}

// --- Albums & Photos ---
async function migrateAlbumsAndPhotos(db: Client, root: string) {
  console.log('\n📸 Migrating albums & photos...');
  const albumsPath = join(root, 'data', 'albums.ts');
  if (!existsSync(albumsPath)) { console.log('  ⏭️  No data/albums.ts'); return; }

  const { albums } = await import(join(root, 'data', 'albums'));

  for (let i = 0; i < albums.length; i++) {
    const album = albums[i];
    const albumId = crypto.randomUUID();
    const now = new Date().toISOString();
    const slug = album.id || album.title.toLowerCase().replace(/\s+/g, '-');

    await upsert(db,
      `INSERT OR IGNORE INTO albums (id, title, slug, description, cover_url, location, status, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)`,
      [albumId, album.title, slug, album.description || null, album.cover || null, null, i, now, now],
      `Album: ${album.title}`
    );

    // Get the actual album ID (might be different if already existed)
    if (!isDryRun && album.photos && Array.isArray(album.photos)) {
      const albumResult = await db.execute({ sql: `SELECT id FROM albums WHERE slug = ?`, args: [slug] });
      if (albumResult.rows.length > 0) {
        const actualAlbumId = (albumResult.rows[0] as Record<string, unknown>).id as string;
        for (let j = 0; j < album.photos.length; j++) {
          const photo = album.photos[j];
          const photoId = crypto.randomUUID();
          const existing = await db.execute({
            sql: `SELECT id FROM photos WHERE album_id = ? AND image_url = ?`,
            args: [actualAlbumId, photo.url],
          });
          if (existing.rows.length > 0) {
            console.log(`    ⏭️  Photo ${j + 1} already exists`);
            continue;
          }
          await db.execute({
            sql: `INSERT OR IGNORE INTO photos (id, album_id, title, description, image_url, thumbnail_url, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [photoId, actualAlbumId, photo.caption || null, photo.caption || null, photo.url, null, j, now, now],
          });
        }
        console.log(`  ✅ Album: ${album.title} (${album.photos.length} photos)`);
      }
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
