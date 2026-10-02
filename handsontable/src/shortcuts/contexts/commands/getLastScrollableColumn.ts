import type { HotInstance } from '../../../core/types';
import { clampFixedColumnsEnd } from '../../../3rdparty/walkontable/src/settings/fixedColumnsEnd';

/**
 * Gets the visual index of the last not hidden column that is not frozen at the inline end (`fixedColumnsEnd`).
 * It is the column "the most inline end" navigation shortcuts target: the counterpart of the first column that
 * is not frozen at the inline start, which the "most inline start" shortcuts target. Without end columns
 * it is the last not hidden column of the grid.
 *
 * The end band is cut down by the start band (`fixedColumnsStart`), which has priority, the same way
 * the rendering engine cuts it.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {number|null} The visual column index, or `null` when no such column exists.
 */
export function getLastScrollableColumn(hot: HotInstance): number | null {
  const settings = hot.getSettings();
  const totalColumns = hot.countCols();
  const fixedColumnsEnd = clampFixedColumnsEnd(settings.fixedColumnsEnd, settings.fixedColumnsStart, totalColumns);

  const column = hot.columnIndexMapper.getNearestNotHiddenIndex(totalColumns - fixedColumnsEnd - 1, -1);

  // Without end columns the answer is the grid's last not hidden column, whatever the start columns cover.
  if (fixedColumnsEnd === 0) {
    return column;
  }

  // The start and end columns cover the grid: what is left is a start column, not a column that scrolls.
  return column !== null && column >= (settings.fixedColumnsStart ?? 0) ? column : null;
}
