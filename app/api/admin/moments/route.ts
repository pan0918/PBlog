import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../lib/admin/api-helpers';
import { createMomentSchema } from '../../../../lib/admin/validators';
import { getAdminMoments, createMoment } from '../../../../lib/db/moments';
import { revalidateAfterMoment } from '../../../../lib/admin/revalidate';

export async function GET() {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  return success(await getAdminMoments());
}

export async function POST(request: NextRequest) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = createMomentSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    const moment = await createMoment(parsed.data);
    revalidateAfterMoment();
    return success(moment);
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '创建失败');
  }
}
