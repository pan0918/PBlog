import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/admin/api-helpers';
import { uploadImageToBed } from '../../../../lib/images/image-bed';

export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
function vditorResponse(
  succMap: Record<string, string>,
  errFiles: string[] = [],
  msg = '',
  status = 200,
) {
  return NextResponse.json({
    msg,
    code: 0,
    data: {
      errFiles,
      succMap,
    },
  }, { status });
}

export async function POST(request: NextRequest) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;

  const token = process.env.IMAGE_BED_TOKEN;
  if (!token) {
    return vditorResponse({}, [], 'IMAGE_BED_TOKEN 未配置，无法上传到图床', 500);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return vditorResponse({}, [], '上传请求格式无效', 400);
  }

  const files = [
    ...formData.getAll('file[]'),
    ...formData.getAll('file'),
  ].filter((value): value is File => value instanceof File);

  if (files.length === 0) {
    return vditorResponse({}, [], '请选择图片文件', 400);
  }

  const succMap: Record<string, string> = {};
  const errFiles: string[] = [];

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      errFiles.push(file.name);
      continue;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      errFiles.push(file.name);
      continue;
    }

    try {
      succMap[file.name] = await uploadImageToBed(file, file.name);
    } catch {
      errFiles.push(file.name);
    }
  }

  return vditorResponse(
    succMap,
    errFiles,
    errFiles.length > 0 ? '部分图片上传失败，请检查图床配置、文件类型和大小' : '',
  );
}
