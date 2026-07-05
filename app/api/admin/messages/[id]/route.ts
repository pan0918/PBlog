import { NextRequest } from 'next/server';
import { requireAdmin, success, error } from '../../../../../lib/admin/api-helpers';
import { softDeleteMessage } from '../../../../../lib/db/messages';
import { revalidateAfterMessage } from '../../../../../lib/admin/revalidate';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  try {
    await softDeleteMessage(id);
    revalidateAfterMessage();
    return success();
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '删除失败');
  }
}
