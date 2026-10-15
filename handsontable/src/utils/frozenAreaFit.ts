export interface FrozenAreaFitOptions {
  /**
   * The size of the viewport on the measured axis (width for columns, height for rows).
   */
  viewportSize: number;
  /**
   * The sizes of the tracks, in the order they would be frozen from the edge being measured.
   */
  trackSizes: ArrayLike<number>;
  /**
   * The size of the band frozen on the opposite edge, which is not available to this one.
   */
  oppositeBandSize: number;
  /**
   * The size that must stay scrollable. The frozen band never grows into it.
   */
  minScrollableSize: number;
}

/**
 * Resolves how many tracks can be frozen on one edge and still leave a scrollable strip.
 *
 * The frozen band is drawn at its full size, so a band as large as the viewport leaves the rest of the grid
 * unreachable. The opposite band has priority (the caller passes its size), and `minScrollableSize` is
 * always kept free for scrolling.
 *
 * @param {FrozenAreaFitOptions} options The measured sizes.
 * @returns {number} A non-negative integer, never larger than the number of tracks.
 */
export function getMaxFittingFrozenCount(options: FrozenAreaFitOptions): number {
  const { viewportSize, trackSizes, oppositeBandSize, minScrollableSize } = options;
  const available = viewportSize - oppositeBandSize - minScrollableSize;
  let used = 0;
  let count = 0;

  while (count < trackSizes.length && used + trackSizes[count] <= available) {
    used += trackSizes[count];
    count += 1;
  }

  // A zero-size track (a hidden one) always fits, so the count may end on one. A count that ends on a hidden track
  // freezes nothing more than the count before it, so the trailing ones are dropped, the same way the snap
  // resolver prefers the lowest count.
  while (count > 0 && trackSizes[count - 1] === 0) {
    count -= 1;
  }

  return count;
}
