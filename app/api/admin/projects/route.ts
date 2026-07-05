import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../lib/admin/api-helpers';
import { createProjectSchema } from '../../../../lib/admin/validators';
import { getAdminProjects, createProject } from '../../../../lib/db/projects';
import { revalidateAfterProject } from '../../../../lib/admin/revalidate';

export async function GET() {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  return success(await getAdminProjects());
}

export async function POST(request: NextRequest) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));
  try {
    const project = await createProject(parsed.data);
    revalidateAfterProject();
    return success(project);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '创建失败';
    return error(msg.includes('UNIQUE') ? 'slug 已存在' : msg);
  }
}
