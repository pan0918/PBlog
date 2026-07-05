import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../../../lib/admin/api-helpers';
import { createPhotoSchema } from '../../../../../../lib/admin/validators';
import { getPhotosByAlbumId, createPhoto } from '../../../../../../lib/db/photos';
import { revalidateAfterPhoto } from '../../../../../../lib/admin/revalidate';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  return success(await getPhotosByAlbumId(id));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = createPhotoSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    const photo = await createPhoto({ ...parsed.data, album_id: id });
    revalidateAfterPhoto();
    return success(photo);
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '创建失败');
  }
}
