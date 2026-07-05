import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../lib/admin/api-helpers';
import { createTagSchema } from '../../../../lib/admin/validators';
import { getAllTags, createTag } from '../../../../lib/db/tags';

export async function GET() {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  return success(await getAllTags());
}

export async function POST(request: NextRequest) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    return success(await createTag(parsed.data));
  } catch (err: unknown) {
    return error(err instanceof Error && err.message.includes('UNIQUE') ? '名称或 slug 已存在' : '创建失败');
  }
}
