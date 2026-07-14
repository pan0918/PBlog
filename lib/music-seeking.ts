type MediaRanges = Pick<TimeRanges, 'length' | 'start' | 'end'>;

export function isTimeInRanges(ranges: MediaRanges, time: number, tolerance = 0.35): boolean {
  if (!Number.isFinite(time)) return false;

  for (let index = 0; index < ranges.length; index += 1) {
    if (time >= ranges.start(index) - tolerance && time <= ranges.end(index) + tolerance) {
      return true;
    }
  }
  return false;
}
