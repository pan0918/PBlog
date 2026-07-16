import type { PhotoDerivativeResult } from './photo-derivatives';

export type BackfillPhoto = {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
  preview_url: string | null;
};

type BackfillResult = {
  succeeded: number;
  skipped: number;
  failed: Array<{ id: string; error: string }>;
};

export async function backfillPhotoDerivatives(
  photos: BackfillPhoto[],
  processPhoto: (photo: BackfillPhoto) => Promise<PhotoDerivativeResult>,
  updatePhoto: (id: string, derivatives: PhotoDerivativeResult) => Promise<void>,
  concurrency = 2,
): Promise<BackfillResult> {
  const pending = photos.filter((photo) => !(photo.thumbnail_url && photo.preview_url));
  const result: BackfillResult = {
    succeeded: 0,
    skipped: photos.length - pending.length,
    failed: [],
  };
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      const photo = pending[index];
      if (!photo) return;

      try {
        const derivatives = await processPhoto(photo);
        await updatePhoto(photo.id, derivatives);
        result.succeeded += 1;
      } catch (error) {
        result.failed.push({
          id: photo.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const workerCount = Math.min(pending.length, Math.max(1, Math.floor(concurrency)));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return result;
}
