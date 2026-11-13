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
 * The number of frozen start columns the configured settings describe. A freeze counts from this band, not from the
 * drawn one: the drawn count is a memo of the last render, so a second freeze before the next render would read the
 * count from before the first one.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {number}
 */
export function getConfiguredStartBandCount(hot: HotInstance): number {
  return Number(hot.getSettings().fixedColumnsStart) || 0;
}

/**
 * Checks whether the grid can draw one more frozen start column. With `limitFixedToViewport` the column that is
 * frozen must fit next to the configured band: a band that was cut, or is the most that fits, would only move the
 * column to the freeze line, where the next render cuts it out of the band again, and it keeps scrolling.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} column Visual column index of the column to freeze.
 * @returns {boolean} Always `true` without the option.
 */
export function canFreezeFit(hot: HotInstance, column: number): boolean {
  return hot.view ? hot.view.canFreezeStartColumn(column) : true;
}

/**
 * Checks whether the visual column sits in the frozen end band. Such a column is pinned by `fixedColumnsEnd`
 * and cannot also be frozen at the start: moving it to the freeze line would pull the column in front of the
 * band into it.
 *
 * It reads the CONFIGURED band on purpose, as `getEndBandCount()` does. With `limitFixedToViewport` the drawn end
 * band can be smaller, but the columns in front of the configured band would still be shifted into it by the move,
 * and a different set of columns would be frozen at the end when the grid grows.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} column Visual column index.
 * @returns {boolean}
 */
export function isInEndBand(hot: HotInstance, column: number): boolean {
  const endCount = getEndBandCount(hot, getConfiguredStartBandCount(hot));

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
  const configuredStart = getConfiguredStartBandCount(hot);
  const startAfterUnfreeze = Math.max(getStartBandCount(hot) - 1, 0);

  return getEndBandCount(hot, configuredStart) !== getEndBandCount(hot, startAfterUnfreeze);
}
