import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../lib/admin/api-helpers';
import { createPostSchema } from '../../../../lib/admin/validators';
import { getAdminPosts, createPostWithTags } from '../../../../lib/posts';
import { revalidateAfterPost } from '../../../../lib/admin/revalidate';

export async function GET() {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const posts = await getAdminPosts();
  return success(posts);
}

export async function POST(request: NextRequest) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;

  const body = await readBody(request);
  if (!body) return error('请求格式无效');

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues.map(e => e.message).join('; '));
  }

  try {
    const { tag_ids, ...postData } = parsed.data;
    const post = await createPostWithTags(postData, tag_ids ?? []);
    revalidateAfterPost([post.slug]);
    return success(post);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '创建失败';
    return error(msg.includes('UNIQUE') ? 'slug 已存在' : msg);
  }
}
