import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../lib/admin/api-helpers';
import { createAlbumSchema } from '../../../../lib/admin/validators';
import { getAdminAlbums, createAlbum } from '../../../../lib/db/albums';
import { revalidateAfterAlbum } from '../../../../lib/admin/revalidate';
import { db } from '../../../../lib/db';

export async function GET() {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const albums = await getAdminAlbums();

  // Add photo count for each album
  const albumsWithCount = await Promise.all(
    albums.map(async (album) => {
      try {
        const result = await db.execute({
          sql: `SELECT COUNT(*) as count FROM photos WHERE album_id = ? AND deleted_at IS NULL`,
          args: [album.id],
        });
        return { ...album, photo_count: Number(result.rows[0]?.count ?? 0) };
      } catch {
        return { ...album, photo_count: 0 };
      }
    })
  );

  return success(albumsWithCount);
}

export async function POST(request: NextRequest) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = createAlbumSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    const album = await createAlbum(parsed.data);
    revalidateAfterAlbum();
    return success(album);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '创建失败';
    return error(msg.includes('UNIQUE') ? 'slug 已存在' : msg);
  }
}
