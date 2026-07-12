import { unstable_cache } from 'next/cache';
import { db } from './db';

export interface HomepageCounts {
  momentCount: number;
  photoCount: number;
  lastPostUpdatedAt: string | null;
}

async function queryHomepageCounts(): Promise<HomepageCounts> {
  try {
    const result = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM moments WHERE status = 'published' AND deleted_at IS NULL) AS moment_count,
        (SELECT COUNT(*) FROM photos WHERE deleted_at IS NULL) AS photo_count,
        (SELECT MAX(updated_at) FROM posts WHERE status = 'published' AND deleted_at IS NULL) AS last_post_updated_at
    `);
    const row = result.rows[0];
    return {
      momentCount: Number(row?.moment_count ?? 0),
      photoCount: Number(row?.photo_count ?? 0),
      lastPostUpdatedAt: row?.last_post_updated_at ? String(row.last_post_updated_at) : null,
    };
  } catch {
    return { momentCount: 0, photoCount: 0, lastPostUpdatedAt: null };
  }
}

export const getHomepageCounts = unstable_cache(
  queryHomepageCounts,
  ['homepage-counts'],
  { tags: ['homepage-stats'], revalidate: 300 },
);
