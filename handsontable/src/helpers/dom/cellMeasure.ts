/**
 * Resolves and measures the rendered cells of a grid. The pointer-to-cell lookups below are shared
 * by the core (which works in visual indexes) and Walkontable (which works in renderable indexes), so
 * they reach the grid only through this seam and never import either of them.
 */
export interface CellMeasurer {
  /**
   * Returns the rendered cell of the topmost overlay that draws it, or `null` when it is not rendered.
   * A slave of a merge resolves to the element of the merge's anchor.
   */
  getCell(row: number, column: number): HTMLElement | null;
  /**
   * Returns the height of a rendered cell in pixels.
   */
  getHeight(cell: HTMLElement): number;
  /**
   * Returns the width of a rendered cell in pixels.
   */
  getWidth(cell: HTMLElement): number;
  /**
   * Returns the number of rows the cell spans, or `undefined` when it is not merged vertically.
   * The anchor of a merge reports it; its slaves do not.
   */
  getRowspan(row: number, column: number, cell: HTMLElement | null): number | undefined;
  /**
   * Returns the number of columns the cell spans, or `undefined` when it is not merged horizontally.
   * The anchor of a merge reports it; its slaves do not.
   */
  getColspan(row: number, column: number, cell: HTMLElement | null): number | undefined;
}

/**
 * Finds which column the mouse is over within a given column range.
 *
 * @param {CellMeasurer} measurer Resolves and measures the rendered cells.
 * @param {number} row Row to use for measuring cell widths.
 * @param {number} startColumn First column in the range.
 * @param {number} endColumn Last column in the range (inclusive).
 * @param {number} relativeX Mouse X position relative to the first cell's edge.
 * @returns {number | null} Column index, or null if mouse is outside the range.
 */
export function findColumnAtX(
  measurer: CellMeasurer,
  row: number,
  startColumn: number,
  endColumn: number,
  relativeX: number,
): number | null {
  let accumulatedX = 0;

  for (let column = startColumn; column <= endColumn; column++) {
    const cellElement = measurer.getCell(row, column);

    if (!cellElement) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const width = measurer.getWidth(cellElement);

    if (relativeX < accumulatedX + width) {
      return column;
    }

    accumulatedX += width;

    const colspan = measurer.getColspan(row, column, cellElement);

    if (colspan !== undefined && colspan > 1) {
      column += colspan - 1;
    }
  }

  return null;
}

/**
 * Finds which row the mouse is over within a given row range.
 *
 * @param {CellMeasurer} measurer Resolves and measures the rendered cells.
 * @param {number} column Column to use for measuring cell heights.
 * @param {number} startRow First row in the range.
 * @param {number} endRow Last row in the range (inclusive).
 * @param {number} relativeY Mouse Y position relative to the first cell's edge.
 * @returns {number | null} Row index, or null if mouse is outside the range.
 */
export function findRowAtY(
  measurer: CellMeasurer,
  column: number,
  startRow: number,
  endRow: number,
  relativeY: number,
): number | null {
  let accumulatedY = 0;

  for (let row = startRow; row <= endRow; row++) {
    const cellElement = measurer.getCell(row, column);

    if (!cellElement) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const height = measurer.getHeight(cellElement);

    if (relativeY < accumulatedY + height) {
      return row;
    }

    accumulatedY += height;

    const rowspan = measurer.getRowspan(row, column, cellElement);

    if (rowspan !== undefined && rowspan > 1) {
      row += rowspan - 1;
    }
  }

  return null;
}

/**
 * Finds a column suitable for mapping a Y coordinate to a row: the first column in the range
 * whose cells across the scanned rows each occupy their own single row. `findRowAtY` walks one
 * column's cell heights and skips a merged cell's spanned rows, so it is distorted by a cell
 * that spans multiple rows - a vertical-merge anchor or any of its slaves. Such a column is
 * detected two ways: a row span above 1 reported by the measurer, and element identity, since every row
 * inside a vertical merge resolves to the same rendered cell. A purely horizontal merge resolves
 * to a distinct, single-row master cell per row, so its columns stay valid. A merge in one column
 * must not distort the row lookup used for other columns.
 *
 * The scanned row range must match the range the returned column will be walked over (the frozen
 * overlays and the scrollable body are resolved separately), so a merge confined to frozen rows
 * cannot leak into the body lookup or vice versa.
 *
 * @param {CellMeasurer} measurer Resolves and measures the rendered cells.
 * @param {number} startColumn First column to consider.
 * @param {number} endColumn Last column to consider (inclusive).
 * @param {number} startRow First row of the scanned range.
 * @param {number} endRow Last row of the scanned range (inclusive).
 * @returns {number} A column index free of vertical-merge distortion, or `startColumn` if none qualifies.
 */
export function findRowReferenceColumn(
  measurer: CellMeasurer,
  startColumn: number,
  endColumn: number,
  startRow: number,
  endRow: number,
): number {
  for (let column = startColumn; column <= endColumn; column++) {
    let spansMultipleRows = false;
    let hasRenderableCell = false;
    let previousCell: HTMLElement | null = null;

    for (let row = startRow; row <= endRow; row++) {
      const cell = measurer.getCell(row, column);
      const rowspan = measurer.getRowspan(row, column, cell);

      // A vertically merged cell reports `rowspan > 1` on its anchor and resolves to the same
      // rendered element for every row it covers; either signal marks the column as distorting.
      if ((rowspan !== undefined && rowspan > 1) || (cell !== null && cell === previousCell)) {
        spansMultipleRows = true;
        break;
      }

      if (cell !== null) {
        previousCell = cell;
        hasRenderableCell = true;
      }
    }

    // A hidden column (e.g. `hiddenColumns`) renders no cells, so `findRowAtY` cannot measure
    // against it. Require at least one renderable cell so a hidden column between the merged
    // column and a usable one is skipped rather than picked as the reference.
    if (!spansMultipleRows && hasRenderableCell) {
      return column;
    }
  }

  // Best-effort fallback: every column in the scanned range is vertically merged (e.g. a grouped
  // report grid whose visible columns all merge across the same band). No column is free of the
  // distortion, so `findRowAtY` will still collapse the band onto its anchor - `startColumn` is
  // simply the least-surprising choice. This is a known narrow case, not a bug here.
  return startColumn;
}

/**
 * Finds a row suitable for mapping an X coordinate to a column: the first row in the range
 * whose cells across the scanned columns each occupy their own single column. `findColumnAtX`
 * walks one row's cell widths and skips a merged cell's spanned columns, so it is distorted by a
 * cell that spans multiple columns - a horizontal-merge anchor or any of its slaves. Such a row
 * is detected two ways: a column span above 1 reported by the measurer, and element identity, since every
 * column inside a horizontal merge resolves to the same rendered cell. A purely vertical merge
 * resolves to a distinct, single-column master cell per column, so its rows stay valid. A merge
 * in one row must not distort the column lookup used for other rows.
 *
 * The scanned column range must match the range the returned row will be walked over (the frozen
 * overlays and the scrollable body are resolved separately), so a merge confined to frozen
 * columns cannot leak into the body lookup or vice versa.
 *
 * @param {CellMeasurer} measurer Resolves and measures the rendered cells.
 * @param {number} startRow First row to consider.
 * @param {number} endRow Last row to consider (inclusive).
 * @param {number} startColumn First column of the scanned range.
 * @param {number} endColumn Last column of the scanned range (inclusive).
 * @returns {number} A row index free of horizontal-merge distortion, or `startRow` if none qualifies.
 */
export function findColumnReferenceRow(
  measurer: CellMeasurer,
  startRow: number,
  endRow: number,
  startColumn: number,
  endColumn: number,
): number {
  for (let row = startRow; row <= endRow; row++) {
    let spansMultipleColumns = false;
    let hasRenderableCell = false;
    let previousCell: HTMLElement | null = null;

    for (let column = startColumn; column <= endColumn; column++) {
      const cell = measurer.getCell(row, column);
      const colspan = measurer.getColspan(row, column, cell);

      // A horizontally merged cell reports `colspan > 1` on its anchor and resolves to the same
      // rendered element for every column it covers; either signal marks the row as distorting.
      if ((colspan !== undefined && colspan > 1) || (cell !== null && cell === previousCell)) {
        spansMultipleColumns = true;
        break;
      }

      if (cell !== null) {
        previousCell = cell;
        hasRenderableCell = true;
      }
    }

    // A hidden row (e.g. `hiddenRows`) renders no cells, so `findColumnAtX` cannot measure
    // against it. Require at least one renderable cell so a hidden row between the merged
    // row and a usable one is skipped rather than picked as the reference.
    if (!spansMultipleColumns && hasRenderableCell) {
      return row;
    }
  }

  // Best-effort fallback: every row in the scanned range is horizontally merged (e.g. a banded
  // report grid whose visible rows all merge across the same columns). No row is free of the
  // distortion, so `findColumnAtX` will still collapse the band onto its anchor - `startRow` is
  // simply the least-surprising choice. This is a known narrow case, not a bug here.
  return startRow;
}
