import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../../lib/admin/api-helpers';
import { updateMomentSchema } from '../../../../../lib/admin/validators';
import { getMomentById, updateMoment, softDeleteMoment } from '../../../../../lib/db/moments';
import { revalidateAfterMoment } from '../../../../../lib/admin/revalidate';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const moment = await getMomentById(id);
  if (!moment) return error('动态不存在', 404);
  return success(moment);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = updateMomentSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    await updateMoment(id, parsed.data);
    revalidateAfterMoment();
    return success(await getMomentById(id));
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '更新失败');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  try {
    await softDeleteMoment(id);
    revalidateAfterMoment();
    return success();
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '删除失败');
  }
}
