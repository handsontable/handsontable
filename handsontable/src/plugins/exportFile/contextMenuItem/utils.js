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
export function getExportOptions(hot) {
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
      Math.max(0, Math.min(range.from.row, range.to.row)),
      Math.max(0, Math.min(range.from.col, range.to.col)),
      Math.max(range.from.row, range.to.row),
      Math.max(range.from.col, range.to.col),
    ],
  };
}
