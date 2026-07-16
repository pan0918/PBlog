import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../../lib/admin/api-helpers';
import { updatePostSchema } from '../../../../../lib/admin/validators';
import { getPostById, updatePostWithTags, softDeletePost } from '../../../../../lib/posts';
import { revalidateAfterPost } from '../../../../../lib/admin/revalidate';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;

  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return error('文章不存在', 404);
  return success(post);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;

  const { id } = await params;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');

  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues.map(e => e.message).join('; '));
  }

  try {
    const { tag_ids, ...updateData } = parsed.data;
    const { post, previousSlug } = await updatePostWithTags(id, updateData, tag_ids);
    if (!post) return error('文章不存在', 404);
    revalidateAfterPost([previousSlug, post?.slug]);
    return success(post);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '更新失败';
    return error(msg);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;

  const { id } = await params;
  try {
    const post = await getPostById(id);
    await softDeletePost(id);
    revalidateAfterPost([post?.slug]);
    return success();
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '删除失败');
  }
}
