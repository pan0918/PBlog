import { createClient } from '@libsql/client';
import { loadEnvConfig } from '@next/env';
import {
  backfillPhotoDerivatives,
  type BackfillPhoto,
} from '../lib/images/backfill-photo-derivatives';
import { generatePhotoDerivatives } from '../lib/images/photo-derivatives';

loadEnvConfig(process.cwd());

async function ensurePreviewColumn(db: ReturnType<typeof createClient>) {
  const columns = await db.execute('PRAGMA table_info(photos)');
  const hasPreviewColumn = columns.rows.some((row) => row.name === 'preview_url');
  if (!hasPreviewColumn) {
    await db.execute('ALTER TABLE photos ADD COLUMN preview_url TEXT');
    console.log('✅ 已添加 photos.preview_url 字段');
  }
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error('缺少 TURSO_DATABASE_URL 或 TURSO_AUTH_TOKEN');
  if (!process.env.IMAGE_BED_TOKEN) throw new Error('缺少 IMAGE_BED_TOKEN');

  const db = createClient({ url, authToken });
  await ensurePreviewColumn(db);
  const query = await db.execute(`
    SELECT id, image_url, thumbnail_url, preview_url
    FROM photos
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC, id ASC
  `);
  const photos = query.rows.map((row) => ({
    id: String(row.id),
    image_url: String(row.image_url),
    thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
    preview_url: row.preview_url ? String(row.preview_url) : null,
  })) satisfies BackfillPhoto[];

  console.log(`📷 共读取 ${photos.length} 张照片，开始低并发处理`);
  const result = await backfillPhotoDerivatives(
    photos,
    (photo) => generatePhotoDerivatives(photo.image_url),
    async (id, derivatives) => {
      await db.execute({
        sql: `UPDATE photos
              SET thumbnail_url = ?, preview_url = ?, width = ?, height = ?, updated_at = ?
              WHERE id = ?`,
        args: [
          derivatives.thumbnailUrl,
          derivatives.previewUrl,
          derivatives.width,
          derivatives.height,
          new Date().toISOString(),
          id,
        ],
      });
      console.log(`  ✅ ${id}`);
    },
    2,
  );

  for (const failure of result.failed) {
    console.error(`  ❌ ${failure.id}: ${failure.error}`);
  }
  console.log(`完成：成功 ${result.succeeded}，跳过 ${result.skipped}，失败 ${result.failed.length}`);
  if (result.failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
