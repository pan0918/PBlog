import { NextRequest } from 'next/server';
import { requireAdmin, success, error } from '../../../../../../lib/admin/api-helpers';
import { markMessageAsSpam } from '../../../../../../lib/db/messages';
import { revalidateAfterMessage } from '../../../../../../lib/admin/revalidate';

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const { id } = await params;
  try {
    await markMessageAsSpam(id);
    revalidateAfterMessage();
    return success();
  } catch (err: unknown) {
    return error(err instanceof Error ? err.message : '操作失败');
  }
}
