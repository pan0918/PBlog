import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../lib/admin/api-helpers';
import { createCategorySchema } from '../../../../lib/admin/validators';
import { getAllCategories, createCategory } from '../../../../lib/db/categories';

export async function GET() {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  return success(await getAllCategories());
}

export async function POST(request: NextRequest) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    return success(await createCategory(parsed.data));
  } catch (err: unknown) {
    return error(err instanceof Error && err.message.includes('UNIQUE') ? '名称或 slug 已存在' : '创建失败');
  }
}
