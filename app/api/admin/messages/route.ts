import { requireAdmin, success } from '../../../../lib/admin/api-helpers';
import { getAdminMessages } from '../../../../lib/db/messages';

export async function GET() {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  return success(await getAdminMessages());
}
