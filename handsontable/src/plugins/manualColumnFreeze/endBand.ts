import type { HotInstance } from '../../core/types';
import { clampFixedColumnsEnd } from '../../3rdparty/walkontable/src/settings/fixedColumnsEnd';

/**
 * The number of frozen end columns the grid really renders, for the given start count. It is the same
 * clamp the end overlay and ManualColumnMove use: the start band has priority, so
 * `min(fixedColumnsEnd, max(0, countCols - fixedColumnsStart))`.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} fixedColumnsStart The number of frozen start columns to clamp against.
 * @returns {number} Zero without `fixedColumnsEnd`.
 */
export function getEndBandCount(hot: HotInstance, fixedColumnsStart: number): number {
  return clampFixedColumnsEnd(hot.getSettings().fixedColumnsEnd, fixedColumnsStart, hot.countCols());
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
  const endCount = getEndBandCount(hot, hot.getSettings().fixedColumnsStart ?? 0);

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
  const fixedColumnsStart = hot.getSettings().fixedColumnsStart ?? 0;

  return getEndBandCount(hot, fixedColumnsStart) !== getEndBandCount(hot, Math.max(fixedColumnsStart - 1, 0));
}
