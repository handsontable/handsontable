import type { GridSettings } from '../../../core/settings';
import type CellRange from '../../../3rdparty/walkontable/src/cell/range';

/**
 * Derives export options from the current Handsontable selection and settings.
 *
 * Always reflects the visible header state (`colHeaders`, `rowHeaders`).
 * Returns an options object with a `range` property when the selection spans
 * more than one cell. Omits `range` (full-table export) when:
 * - there is no selection,
 * - only a single cell is focused (cursor, no drag),
 * - the corner was clicked (select-all).
 *
 * Row header selections (entire rows) and column header selections (entire
 * columns) are treated as multi-cell selections — only the selected rows or
 * columns are exported. Negative coordinates from headers are clamped to 0.
 *
 * @param {object} hot Handsontable instance (`this` inside a menu item callback).
 * @returns {object}
 */
export function getExportOptions(
  hot: { getSettings(): GridSettings; getSelectedRangeLast(): CellRange | undefined }
): object {
  const settings = hot.getSettings();
  const colHeaders = !!(settings.colHeaders || settings.nestedHeaders);
  const rowHeaders = !!settings.rowHeaders;
  const range = hot.getSelectedRangeLast();

  const opts = { colHeaders, rowHeaders };

  // No selection, single-cell cursor, or corner (select-all) → export entire table.
  if (!range || range.isSingleCell() || (range.from.row < 0 && range.from.col < 0)) {
    return opts;
  }

  return {
    ...opts,
    range: [
      Math.max(0, Math.min(range.from.row ?? 0, range.to.row ?? 0)),
      Math.max(0, Math.min(range.from.col ?? 0, range.to.col ?? 0)),
      Math.max(range.from.row ?? 0, range.to.row ?? 0),
      Math.max(range.from.col ?? 0, range.to.col ?? 0),
    ],
  };
}
