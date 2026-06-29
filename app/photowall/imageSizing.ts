export interface FittedImageSize {
  width: number;
  height: number;
}

export function fitImageWithinViewport(
  naturalWidth: number,
  naturalHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): FittedImageSize {
  const scale = Math.min(
    1,
    (viewportWidth * 0.85) / naturalWidth,
    (viewportHeight * 0.78) / naturalHeight,
  );

  return {
    width: naturalWidth * scale,
    height: naturalHeight * scale,
  };
}
