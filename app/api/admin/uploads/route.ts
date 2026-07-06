import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/admin/api-helpers';

export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const DEFAULT_IMAGE_BED_BASE_URL = 'https://a68b43cc.cloudflare-imgbed-9pz.pages.dev';
const DEFAULT_IMAGE_BED_UPLOAD_CHANNEL = 'huggingface';

type ImageBedUploadItem = {
  src?: string;
  url?: string;
  publicUrl?: string;
  pathname?: string;
};

function getImageBedBaseUrl() {
  return (process.env.IMAGE_BED_BASE_URL || DEFAULT_IMAGE_BED_BASE_URL).replace(/\/+$/, '');
}

function getImageBedUploadChannel() {
  return process.env.IMAGE_BED_UPLOAD_CHANNEL || DEFAULT_IMAGE_BED_UPLOAD_CHANNEL;
}

function buildUploadUrl() {
  const uploadUrl = new URL('/upload', getImageBedBaseUrl());
  uploadUrl.searchParams.set('uploadChannel', getImageBedUploadChannel());
  uploadUrl.searchParams.set('returnFormat', 'full');
  return uploadUrl;
}

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

function asAbsoluteImageUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, getImageBedBaseUrl()).href;
}

function findUploadedUrl(payload: unknown): string | null {
  const candidates: unknown[] = [];

  if (Array.isArray(payload)) {
    candidates.push(...payload);
  } else if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) candidates.push(...record.data);
    else if (record.data) candidates.push(record.data);
    candidates.push(record);
  }

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const item = candidate as ImageBedUploadItem;
    const url = item.publicUrl || item.url || item.src || item.pathname;
    if (typeof url === 'string' && url) return asAbsoluteImageUrl(url);
  }

  return null;
}

async function uploadToImageBed(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file, file.name);

  const uploadUrl = buildUploadUrl();
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const responseText = await response.text();
  let payload: unknown = null;
  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(typeof payload === 'object' && payload && 'message' in payload
      ? String((payload as { message?: unknown }).message)
      : responseText || '图床上传失败');
  }

  const uploadedUrl = findUploadedUrl(payload);
  if (!uploadedUrl) {
    throw new Error('图床响应中没有可用图片地址');
  }

  return uploadedUrl;
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
      succMap[file.name] = await uploadToImageBed(file, token);
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
