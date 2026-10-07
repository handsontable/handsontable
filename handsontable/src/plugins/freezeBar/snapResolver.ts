export interface ResolveFreezeCountOptions {
  /**
   * The distance of the pointer from the edge the band grows from (the start or the top edge, or the end or
   * the bottom edge for the opposite bands), in pixels. A negative value means the pointer is past that edge.
   */
  distance: number;
  /**
   * The sizes of the tracks, in the order they get frozen from that edge. A hidden track has size 0.
   */
  trackSizes: ArrayLike<number>;
  /**
   * The largest count the band may take.
   */
  maxCount: number;
}

/**
 * Snaps a pointer position to the nearest freeze boundary and returns the count of frozen tracks.
 *
 * Boundary `n` lies after the first `n` tracks. When several boundaries coincide (hidden tracks have no size),
 * the lowest count wins, so a hidden track that follows the last frozen one stays unfrozen.
 *
 * @param {ResolveFreezeCountOptions} options The pointer position and the track sizes.
 * @returns {number} A non-negative integer, never larger than `maxCount` or the number of tracks.
 */
export function resolveFreezeCount(options: ResolveFreezeCountOptions): number {
  const { distance, trackSizes, maxCount } = options;
  const limit = Math.max(0, Math.min(maxCount, trackSizes.length));
  let best = 0;
  let bestGap = Math.abs(distance);
  let boundary = 0;

  for (let count = 1; count <= limit; count++) {
    boundary += trackSizes[count - 1];

    const gap = Math.abs(distance - boundary);

    if (gap < bestGap) {
      best = count;
      bestGap = gap;
    }
  }

  return best;
}
