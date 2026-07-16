import sharp from 'sharp';
import { uploadImageToBed } from '../images/image-bed';
import { updatePublicUserAvatar } from '../db/public-users';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function processAvatar(file: File): Promise<Blob> {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('头像仅支持 JPEG、PNG 或 WebP');
  if (file.size > MAX_AVATAR_BYTES) throw new Error('头像不能超过 2 MB');
  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  try {
    output = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(256, 256, { fit: 'cover', position: 'attention' })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new Error('头像文件无法解析');
  }
  return new Blob([new Uint8Array(output)], { type: 'image/webp' });
}

type AvatarDependencies = {
  process?: typeof processAvatar;
  upload?: typeof uploadImageToBed;
  persist?: typeof updatePublicUserAvatar;
};

export async function updateAvatarForUser(userId: string, file: File, dependencies: AvatarDependencies = {}) {
  const process = dependencies.process || processAvatar;
  const upload = dependencies.upload || uploadImageToBed;
  const persist = dependencies.persist || updatePublicUserAvatar;
  const blob = await process(file);
  const url = await upload(blob, `${crypto.randomUUID()}-avatar.webp`);
  await persist(userId, url);
  return url;
}
