import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../../lib/admin/api-helpers';
import { updateCategorySchema } from '../../../../../lib/admin/validators';
import { getCategoryById, updateCategory, deleteCategory } from '../../../../../lib/db/categories';
import { getPostSlugsByCategoryId } from '../../../../../lib/db/posts';
import { revalidateAfterPost } from '../../../../../lib/admin/revalidate';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const cat = await getCategoryById(id);
  if (!cat) return error('分类不存在', 404);
  return success(cat);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  const affectedSlugs = await getPostSlugsByCategoryId(id);
  await updateCategory(id, parsed.data);
  revalidateAfterPost(affectedSlugs);
  return success(await getCategoryById(id));
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const affectedSlugs = await getPostSlugsByCategoryId(id);
  await deleteCategory(id);
  revalidateAfterPost(affectedSlugs);
  return success();
}
