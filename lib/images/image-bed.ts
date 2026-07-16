const DEFAULT_IMAGE_BED_BASE_URL = 'https://a68b43cc.cloudflare-imgbed-9pz.pages.dev';
const DEFAULT_IMAGE_BED_UPLOAD_CHANNEL = 'huggingface';

type ImageBedUploadItem = {
  src?: string;
  url?: string;
  publicUrl?: string;
  pathname?: string;
};

export function getImageBedBaseUrl() {
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

function asAbsoluteImageUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, getImageBedBaseUrl()).href;
}

export function findUploadedUrl(payload: unknown): string | null {
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

export async function uploadImageToBed(file: Blob, filename: string): Promise<string> {
  const token = process.env.IMAGE_BED_TOKEN;
  if (!token) throw new Error('IMAGE_BED_TOKEN 未配置，无法上传到图床');

  const formData = new FormData();
  formData.append('file', file, filename);

  const response = await fetch(buildUploadUrl(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
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
  if (!uploadedUrl) throw new Error('图床响应中没有可用图片地址');
  return uploadedUrl;
}
