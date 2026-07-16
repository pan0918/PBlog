import { createPhoto, type CreatePhotoInput, type PhotoRecord } from '../db/photos';
import {
  generatePhotoDerivatives,
  type PhotoDerivativeResult,
} from '../images/photo-derivatives';

type CreateOptimizedPhotoDependencies = {
  generate?: (sourceUrl: string) => Promise<PhotoDerivativeResult>;
  insert?: (input: CreatePhotoInput) => Promise<PhotoRecord>;
};

export async function createOptimizedPhoto(
  input: CreatePhotoInput,
  dependencies: CreateOptimizedPhotoDependencies = {},
): Promise<PhotoRecord> {
  const generate = dependencies.generate || generatePhotoDerivatives;
  const insert = dependencies.insert || createPhoto;
  const derivatives = await generate(input.image_url);

  return insert({
    ...input,
    thumbnail_url: derivatives.thumbnailUrl,
    preview_url: derivatives.previewUrl,
    width: derivatives.width,
    height: derivatives.height,
  });
}
