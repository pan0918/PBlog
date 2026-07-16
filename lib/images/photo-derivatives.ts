import sharp from 'sharp';
import { uploadImageToBed } from './image-bed';

export const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const SOURCE_TIMEOUT_MS = 60_000;

type DerivativeDependencies = {
  fetchImpl?: typeof fetch;
  upload?: typeof uploadImageToBed;
  createId?: () => string;
};

export type PhotoDerivativeResult = {
  thumbnailUrl: string;
  previewUrl: string;
  width: number;
  height: number;
};

function sizeLimitError(maxBytes: number) {
  return new Error(`原图超过 ${Math.floor(maxBytes / 1024 / 1024)} MB 限制`);
}

export async function readResponseBytes(response: Response, maxBytes: number): Promise<Buffer> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw sizeLimitError(maxBytes);
  }

  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw sizeLimitError(maxBytes);
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, total);
}

function validateSourceUrl(sourceUrl: string) {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    throw new Error('图片地址格式无效');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('仅支持 HTTP 或 HTTPS 图片地址');
  }
  return url;
}

function toWebpBlob(buffer: Buffer) {
  return new Blob([new Uint8Array(buffer)], { type: 'image/webp' });
}

export async function generatePhotoDerivatives(
  sourceUrl: string,
  dependencies: DerivativeDependencies = {},
): Promise<PhotoDerivativeResult> {
  const url = validateSourceUrl(sourceUrl);
  const fetchImpl = dependencies.fetchImpl || fetch;
  const upload = dependencies.upload || uploadImageToBed;
  const createId = dependencies.createId || (() => crypto.randomUUID());

  const response = await fetchImpl(url, { signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`原图下载失败（HTTP ${response.status}）`);
  const source = await readResponseBytes(response, MAX_SOURCE_BYTES);
  if (source.length === 0) throw new Error('原图内容为空');

  let image: sharp.Sharp;
  let width: number;
  let height: number;
  try {
    image = sharp(source, { animated: false }).rotate();
    const metadata = await image.metadata();
    const oriented = metadata.autoOrient;
    width = oriented?.width || metadata.width || 0;
    height = oriented?.height || metadata.height || 0;
    if (!width || !height) throw new Error('无法读取图片尺寸');
  } catch (error) {
    throw new Error(error instanceof Error ? `原图解析失败：${error.message}` : '原图解析失败');
  }

  const thumbnail = await image.clone()
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer();
  const preview = await image.clone()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const id = createId();
  const thumbnailUrl = await upload(toWebpBlob(thumbnail), `${id}-thumb.webp`);
  const previewUrl = await upload(toWebpBlob(preview), `${id}-preview.webp`);
  return { thumbnailUrl, previewUrl, width, height };
}
