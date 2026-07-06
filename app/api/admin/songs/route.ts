import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../lib/admin/api-helpers';
import { createSongSchema } from '../../../../lib/admin/validators';
import { getAdminSongs, createSong } from '../../../../lib/db/songs';
import { revalidateAfterSong } from '../../../../lib/admin/revalidate';

export async function GET() {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  return success(await getAdminSongs());
}

export async function POST(request: NextRequest) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = createSongSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    const song = await createSong(parsed.data);
    revalidateAfterSong();
    return success(song);
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '创建失败');
  }
}
