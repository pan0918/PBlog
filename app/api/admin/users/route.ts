import { NextRequest } from 'next/server';
import { requireAdmin, success } from '../../../../lib/admin/api-helpers';
import { listAdminPublicUsers } from '../../../../lib/db/public-users';

export async function GET(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  return success(await listAdminPublicUsers({
    query: searchParams.get('query') || '',
    status: searchParams.get('status') || '',
    page,
    pageSize: 20,
  }));
}
