import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../../lib/admin/api-helpers';
import { updateAlbumSchema } from '../../../../../lib/admin/validators';
import { getAlbumById, updateAlbum, softDeleteAlbum } from '../../../../../lib/db/albums';
import { revalidateAfterAlbum } from '../../../../../lib/admin/revalidate';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const album = await getAlbumById(id);
  if (!album) return error('相册不存在', 404);
  return success(album);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = updateAlbumSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    await updateAlbum(id, parsed.data);
    revalidateAfterAlbum();
    return success(await getAlbumById(id));
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '更新失败');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  try {
    await softDeleteAlbum(id);
    revalidateAfterAlbum();
    return success();
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '删除失败');
  }
}
