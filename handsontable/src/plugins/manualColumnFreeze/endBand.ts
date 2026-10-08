import type { HotInstance } from '../../core/types';
import { clampFixedColumnsEnd } from '../../3rdparty/walkontable/src/settings/fixedColumnsEnd';

/**
 * The number of frozen end columns the configured settings describe, for the given start count. It is the same
 * clamp the end overlay and ManualColumnMove use: the start band has priority, so
 * `min(fixedColumnsEnd, max(0, countCols - fixedColumnsStart))`.
 *
 * It reads the configured end count on purpose, not the drawn one. The drawn end band is already clamped against the
 * drawn start band, so comparing it for two start counts would never differ, and a column could slide into the band
 * when the start band shrinks. Whether a column is in the band the user sees is `isInEndBand()`.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} fixedColumnsStart The number of frozen start columns to clamp against.
 * @returns {number} Zero without `fixedColumnsEnd`.
 */
export function getEndBandCount(hot: HotInstance, fixedColumnsStart: number): number {
  return clampFixedColumnsEnd(hot.getSettings().fixedColumnsEnd, fixedColumnsStart, hot.countCols());
}

/**
 * The number of frozen end columns the grid draws. It equals `getEndBandCount()` for the drawn start band unless
 * `limitFixedToViewport` cut the end band down to what fits.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {number}
 */
export function getDrawnEndBandCount(hot: HotInstance): number {
  return hot.view ? hot.view.countFixedColumnsEnd() : getEndBandCount(hot, getStartBandCount(hot));
}

/**
 * The number of frozen start columns the grid draws. It is the configured count unless `limitFixedToViewport`
 * cut the band down to what fits, and then the columns past it are scrollable, so they count as not frozen.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {number}
 */
export function getStartBandCount(hot: HotInstance): number {
  return hot.view ? hot.view.countFixedColumnsStart() : Number(hot.getSettings().fixedColumnsStart) || 0;
}

/**
 * Checks whether `limitFixedToViewport` cut the start band down, so the grid draws fewer frozen columns than are
 * configured. The drawn band is then the most that fits, so freezing one more column cannot show: it would only
 * move a column to the freeze line, where it keeps scrolling.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {boolean}
 */
export function isStartBandCut(hot: HotInstance): boolean {
  return getStartBandCount(hot) < (Number(hot.getSettings().fixedColumnsStart) || 0);
}

/**
 * Checks whether the visual column sits in the frozen end band. Such a column is pinned by `fixedColumnsEnd`
 * and cannot also be frozen at the start: moving it to the freeze line would pull the column in front of the
 * band into it.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} column Visual column index.
 * @returns {boolean}
 */
export function isInEndBand(hot: HotInstance, column: number): boolean {
  const endCount = getDrawnEndBandCount(hot);

  return endCount > 0 && column >= hot.countCols() - endCount;
}

/**
 * Checks whether unfreezing one start column would change the size of the end band. That happens when
 * `fixedColumnsStart + fixedColumnsEnd` exceeds the column count: the clamp cuts the end band down, and
 * lowering `fixedColumnsStart` hands the column back, so the unfrozen column would slide into the band.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {boolean}
 */
export function unfreezeWouldShiftEndBand(hot: HotInstance): boolean {
  // The unfreeze writes the drawn start count minus one over the configured one. With `limitFixedToViewport` the
  // configured start can be larger than the drawn one, so the band it replaces is the one the CONFIGURED start gives,
  // not the one at the drawn start: comparing the drawn start with the drawn start minus one would miss that the
  // smaller write un-squeezes `fixedColumnsEnd`. Without the option the two starts are the same number.
  const configuredStart = Number(hot.getSettings().fixedColumnsStart) || 0;
  const startAfterUnfreeze = Math.max(getStartBandCount(hot) - 1, 0);

  return getEndBandCount(hot, configuredStart) !== getEndBandCount(hot, startAfterUnfreeze);
}
