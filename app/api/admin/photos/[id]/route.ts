import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../../lib/admin/api-helpers';
import { updatePhotoSchema } from '../../../../../lib/admin/validators';
import { updatePhoto, softDeletePhoto } from '../../../../../lib/db/photos';
import { revalidateAfterPhoto } from '../../../../../lib/admin/revalidate';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = updatePhotoSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    const photo = await updatePhoto(id, parsed.data);
    if (!photo) return error('照片不存在', 404);
    revalidateAfterPhoto();
    return success(photo);
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '更新失败');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  try {
    await softDeletePhoto(id);
    revalidateAfterPhoto();
    return success();
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '删除失败');
  }
}
