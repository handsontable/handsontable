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

/**
 * The size that must stay scrollable next to a frozen band, in pixels.
 */
export const MIN_SCROLLABLE_SIZE = 40;

export interface ResolveFrozenCountsOptions {
  /**
   * The size of the viewport on the measured axis (width for columns, height for rows).
   */
  viewportSize: number;
  /**
   * The count requested for the leading edge (start columns or top rows). It has priority.
   */
  requestedLeading: number;
  /**
   * The count requested for the trailing edge (end columns or bottom rows).
   */
  requestedTrailing: number;
  /**
   * The number of tracks on the axis.
   */
  total: number;
  /**
   * Returns the size of the track at a visual index. A hidden track has size 0.
   */
  getTrackSize: (visualIndex: number) => number;
  /**
   * The size that must stay scrollable.
   */
  minScrollableSize: number;
}

/**
 * Collects the sizes of the first `count` tracks from one edge. It stops as soon as the sizes add up to more than
 * `limit`, because no larger count can fit then, so a huge requested count does not walk the whole axis.
 *
 * @param {number} count How many tracks to look at, at most.
 * @param {number} total The number of tracks on the axis.
 * @param {boolean} fromLeading `true` to walk from the first track, `false` from the last one.
 * @param {Function} getTrackSize Returns the size of the track at a visual index.
 * @param {number} limit The sum after which the walk stops.
 * @returns {number[]} The sizes, in the order they would be frozen from the edge.
 */
function collectTrackSizes(
  count: number,
  total: number,
  fromLeading: boolean,
  getTrackSize: (visualIndex: number) => number,
  limit: number
): number[] {
  const sizes: number[] = [];
  let sum = 0;

  for (let offset = 0; offset < count && sum <= limit; offset++) {
    const size = getTrackSize(fromLeading ? offset : total - 1 - offset);

    sizes.push(size);
    sum += size;
  }

  return sizes;
}

/**
 * Resolves how many tracks each frozen band may take so both fit the viewport and leave a scrollable strip.
 *
 * The leading band (start columns or top rows) has priority. The trailing band gets what the leading one leaves,
 * and never more than the tracks that remain after the leading band as configured. Counts are visual and include hidden tracks, which take
 * no room.
 *
 * @param {ResolveFrozenCountsOptions} options The measured sizes and the requested counts.
 * @returns {{ leading: number, trailing: number }} The counts that fit.
 */
export function resolveFittingFrozenCounts(
  options: ResolveFrozenCountsOptions
): { leading: number, trailing: number } {
  const { viewportSize, requestedLeading, requestedTrailing, total, getTrackSize, minScrollableSize } = options;
  const leadingRequest = Math.min(Math.max(Math.floor(requestedLeading) || 0, 0), total);
  const leadingSizes = collectTrackSizes(leadingRequest, total, true, getTrackSize, viewportSize);
  const leading = Math.min(
    leadingRequest,
    getMaxFittingFrozenCount({ viewportSize, trackSizes: leadingSizes, oppositeBandSize: 0, minScrollableSize })
  );
  // The trailing band is capped by the CONFIGURED leading band, as it is without the option: cutting the leading band
  // down must not hand its tracks to the trailing band, which would freeze more of them than the option off does.
  const trailingRequest = Math.min(Math.max(Math.floor(requestedTrailing) || 0, 0), total - leadingRequest);
  const trailingSizes = collectTrackSizes(trailingRequest, total, false, getTrackSize, viewportSize);
  const leadingBandSize = leadingSizes.slice(0, leading).reduce((sum, size) => sum + size, 0);
  const trailing = Math.min(
    trailingRequest,
    getMaxFittingFrozenCount({
      viewportSize,
      trackSizes: trailingSizes,
      oppositeBandSize: leadingBandSize,
      minScrollableSize,
    })
  );

  return { leading, trailing };
}
