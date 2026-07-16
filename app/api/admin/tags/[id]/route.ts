import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../../lib/admin/api-helpers';
import { updateTagSchema } from '../../../../../lib/admin/validators';
import { getTagById, updateTag, deleteTag } from '../../../../../lib/db/tags';
import { getPostSlugsByTagId } from '../../../../../lib/posts';
import { revalidateAfterPost } from '../../../../../lib/admin/revalidate';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const tag = await getTagById(id);
  if (!tag) return error('标签不存在', 404);
  return success(tag);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = updateTagSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    const affectedSlugs = await getPostSlugsByTagId(id);
    await updateTag(id, parsed.data);
    revalidateAfterPost(affectedSlugs);
    return success(await getTagById(id));
  } catch (err: unknown) {
    return error(err instanceof Error && err.message.includes('UNIQUE') ? '名称或 slug 已存在' : '更新失败');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const affectedSlugs = await getPostSlugsByTagId(id);
  await deleteTag(id);
  revalidateAfterPost(affectedSlugs);
  return success();
}
