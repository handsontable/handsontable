/**
 * Derives export options from the current Handsontable selection and settings.
 *
 * Always reflects the visible header state (`columnHeaders`, `rowHeaders`).
 * Returns an options object with a `range` property when the context menu
 * was triggered from a data cell selection.  Omits `range` (full-table export) when:
 * - there is no selection,
 * - the menu was opened from a corner or header element
 *   (indicated by negative `from.row` or `from.col`).
 *
 * @param {object} hot Handsontable instance (`this` inside a menu item callback).
 * @returns {object}
 */
export function getExportOptions(hot) {
  const settings = hot.getSettings();
  const columnHeaders = !!(settings.colHeaders || settings.nestedHeaders);
  const rowHeaders = !!settings.rowHeaders;
  const range = hot.getSelectedRangeLast();

  const opts = { columnHeaders, rowHeaders };

  if (!range || range.from.row < 0 || range.from.col < 0) {
    return opts;
  }

  return {
    ...opts,
    range: [
      Math.min(range.from.row, range.to.row),
      Math.min(range.from.col, range.to.col),
      Math.max(range.from.row, range.to.row),
      Math.max(range.from.col, range.to.col),
    ],
  };
}
