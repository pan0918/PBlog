import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../../lib/admin/api-helpers';
import { updateSongSchema } from '../../../../../lib/admin/validators';
import { getSongById, updateSong, softDeleteSong } from '../../../../../lib/db/songs';
import { revalidateAfterSong } from '../../../../../lib/admin/revalidate';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const song = await getSongById(id);
  if (!song) return error('歌曲不存在', 404);
  return success(song);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = updateSongSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    await updateSong(id, parsed.data);
    revalidateAfterSong();
    return success(await getSongById(id));
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '更新失败');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  try {
    await softDeleteSong(id);
    revalidateAfterSong();
    return success();
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '删除失败');
  }
}
