import type { HotInstance } from '../../types';
import type { default as CellCoords } from '../../../3rdparty/walkontable/src/cell/coords';
import { scrollWindowToCell } from '../utils';

/**
 * Axes `scrollViewportTo` should receive for a mouse single-cell selection.
 *
 * @typedef {object} MouseSingleScrollTarget
 * @property {number} [row] Visual row index to scroll to.
 * @property {number} [col] Visual column index to scroll to.
 * @property {string} [horizontalSnap] Forced snap when the column is oversized.
 * @property {string} [verticalSnap] Forced snap when the row is oversized.
 */

/**
 * Inputs that decide which axes a mouse last-partial click may scroll.
 *
 * @typedef {object} MouseSingleScrollOptions
 * @property {number} row Visual row index of the selected cell.
 * @property {number} col Visual column index of the selected cell.
 * @property {number|null} lastPartiallyVisibleRow Last partially visible visual row, or `null`.
 * @property {number|null} lastPartiallyVisibleColumn Last partially visible visual column, or `null`.
 * @property {boolean} isRowLargerThanViewport `true` when the row is taller than the viewport.
 * @property {boolean} isColumnLargerThanViewport `true` when the column is wider than the viewport.
 */

/**
 * Decides which axes a mouse single-cell selection should scroll.
 *
 * A last-partial cell skips scrolling so a click does not jump the viewport.
 * When neither axis is oversized, a last-partial click on either axis skips
 * the whole move – the pre-DEV-1159 rule. A one-column nested list (Filters
 * "filter by value") is last-partial on its only column, so scrolling the
 * other axis would move the checkbox under the pointer.
 *
 * An oversized axis still start-snaps, matching keyboard and API selection.
 * That skip is per axis: an oversized row does not disable the last-partial
 * column skip, and an oversized column does not disable the last-partial
 * row skip.
 *
 * Auto-snap can no-op when the oversized track is the only one in view, so
 * an oversized axis also sets an explicit start snap.
 *
 * @param {MouseSingleScrollOptions} options The selected cell and last-partial / oversized flags.
 * @returns {MouseSingleScrollTarget|null} Axes to pass to `scrollViewportTo`, or `null` to skip.
 */
export function getMouseSingleScrollTarget({
  row,
  col,
  lastPartiallyVisibleRow,
  lastPartiallyVisibleColumn,
  isRowLargerThanViewport,
  isColumnLargerThanViewport,
}: {
  row: number;
  col: number;
  lastPartiallyVisibleRow: number | null;
  lastPartiallyVisibleColumn: number | null;
  isRowLargerThanViewport: boolean;
  isColumnLargerThanViewport: boolean;
}): { row?: number; col?: number; horizontalSnap?: string; verticalSnap?: string } | null {
  const lastPartialColumn = col === lastPartiallyVisibleColumn;
  const lastPartialRow = row === lastPartiallyVisibleRow;

  // A normal last-partial click skips the whole move. Per-axis skip is only
  // for an oversized start-snap: otherwise a last-partial column still
  // scrolls the row (the Filters value list is one last-partial column).
  if (
    !isRowLargerThanViewport &&
    !isColumnLargerThanViewport &&
    (lastPartialColumn || lastPartialRow)
  ) {
    return null;
  }

  const skipColumn = lastPartialColumn && !isColumnLargerThanViewport;
  const skipRow = lastPartialRow && !isRowLargerThanViewport;
  const target: { row?: number; col?: number; horizontalSnap?: string; verticalSnap?: string } = {};

  if (!skipRow) {
    target.row = row;

    if (isRowLargerThanViewport) {
      target.verticalSnap = 'top';
    }
  }

  if (!skipColumn) {
    target.col = col;

    if (isColumnLargerThanViewport) {
      target.horizontalSnap = 'start';
    }
  }

  return target;
}

/**
 * Returns `true` when `size` is strictly larger than the viewport on that axis.
 *
 * `Core#getRowHeight` is `undefined` unless a height was provided, so a missing
 * size must not count as oversized. Callers pass Walkontable's rendered height
 * (provided height merged with measured `oversizedRows`) for rows.
 *
 * A zero viewport (an unrendered or hidden-init grid) is never oversized: every
 * non-zero size would otherwise win and invert the last-partial skip.
 *
 * @param {number|undefined} size Cell size in pixels on one axis.
 * @param {number} viewportSize Viewport size in pixels on the same axis.
 * @returns {boolean}
 */
export function isLargerThanViewport(size: number | undefined, viewportSize: number): boolean {
  return viewportSize > 0 && (size ?? 0) > viewportSize;
}

/**
 * Returns the row height Walkontable uses for layout.
 *
 * Translates visual → renderable and reads `wtTable.getRowHeight`, which is the
 * provided height merged with measured `oversizedRows`. {@link Core#getRowHeight}
 * omits the measured record, so content-tall rows without `rowHeights`,
 * ManualRowResize, or AutoRowSize look like the default height there.
 *
 * Kept next to `isRowOversized` rather than on public `TableView`: one internal
 * consumer, and reaching `oversizedRows` directly is a Law of Demeter miss.
 *
 * @param {Core} hot Handsontable instance.
 * @param {number} visualRow Visual row index.
 * @returns {number|undefined} Height in pixels, or `undefined` when the row is
 *   not renderable.
 */
export function getRenderedRowHeight(hot: HotInstance, visualRow: number): number | undefined {
  const renderableRow = hot.rowIndexMapper.getRenderableFromVisualIndex(visualRow);

  if (renderableRow === null) {
    return undefined;
  }

  return hot.view._wt.wtTable.getRowHeight(renderableRow);
}

/**
 * Returns `true` when a mouse click on this column should force a start snap.
 *
 * Frozen start columns (`col < fixedColumnsStart`) never count as oversized.
 * Forced `horizontalSnap: 'start'` bypasses Walkontable's auto-snap guard
 * (`autoSnapping && column < fixedColumnsStart` returns false) and jumps the
 * main viewport to scroll 0. A frozen cell cannot have a clipped start, so
 * the snap buys nothing. Pair visual `fixedColumnsStart` with the visual
 * `col` from mouse `cellCoords` — Walkontable's not-hidden frozen count
 * would mismatch if hidden columns sit in the frozen band.
 *
 * `getColWidth` already falls back to `DEFAULT_COLUMN_WIDTH`. There is no
 * Walkontable `oversizedColumns` merge like `oversizedRows` for height.
 *
 * @param {Core} hot Handsontable instance.
 * @param {number} col Visual column index.
 * @returns {boolean}
 */
export function isColumnOversized(hot: HotInstance, col: number): boolean {
  const fixedColumnsStart = hot.getSettings().fixedColumnsStart ?? 0;

  if (col < fixedColumnsStart) {
    return false;
  }

  return isLargerThanViewport(hot.getColWidth(col), hot.view.getViewportWidth());
}

/**
 * Returns `true` when a mouse click on this row should force a top snap.
 *
 * Frozen top and bottom rows (`row < fixedRowsTop` or
 * `row >= totalRows - fixedRowsBottom`) never count as oversized. Forced
 * `verticalSnap: 'top'` bypasses Walkontable's auto-snap guard
 * (`autoSnapping && (row < fixedRowsTop || row > totalRows - fixedRowsBottom - 1)`
 * returns false) and jumps the main viewport to the top. A frozen cell
 * cannot have a clipped start, so the snap buys nothing. Pair visual
 * `fixedRowsTop` / `fixedRowsBottom` and {@link Core#countRows} with the
 * visual `row` from mouse `cellCoords`.
 *
 * Uses `getRenderedRowHeight` so content-tall rows recorded in Walkontable
 * `oversizedRows` match keyboard and API start-snap. {@link Core#getRowHeight}
 * is `undefined` unless `rowHeights`, ManualRowResize, or AutoRowSize provided a height.
 *
 * @param {Core} hot Handsontable instance.
 * @param {number} row Visual row index.
 * @returns {boolean}
 */
export function isRowOversized(hot: HotInstance, row: number): boolean {
  const settings = hot.getSettings();
  const fixedRowsTop = settings.fixedRowsTop ?? 0;
  const fixedRowsBottom = settings.fixedRowsBottom ?? 0;

  if (row < fixedRowsTop || row >= hot.countRows() - fixedRowsBottom) {
    return false;
  }

  return isLargerThanViewport(getRenderedRowHeight(hot, row), hot.view.getViewportHeight());
}

/**
 * Scroll strategy for single cell selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function singleScrollStrategy(hot: HotInstance) {
  return (cellCoords: CellCoords) => {
    const selectionSource = hot.selection.getSelectionSource();
    const { row, col } = cellCoords;

    if (typeof row !== 'number' || typeof col !== 'number') {
      return;
    }

    const scrollWindow = () => {
      scrollWindowToCell(hot.getCell(row, col, true));
    };

    // navigating through the column headers (when `navigableHeaders` is enabled)
    // scrolls the viewport horizontally only
    if (row < 0 && col >= 0) {
      hot.scrollViewportTo({ col }, scrollWindow);

    // navigating through the row headers (when `navigableHeaders` is enabled)
    // scrolls the viewport vertically only
    } else if (col < 0 && row >= 0) {
      hot.scrollViewportTo({ row }, scrollWindow);

    // navigating through the cells
    } else {
      let target: { row?: number; col?: number; horizontalSnap?: string; verticalSnap?: string } = { row, col };

      if (selectionSource === 'mouse') {
        const mouseTarget = getMouseSingleScrollTarget({
          row,
          col,
          lastPartiallyVisibleRow: hot.view.getLastPartiallyVisibleRow(),
          lastPartiallyVisibleColumn: hot.view.getLastPartiallyVisibleColumn(),
          isRowLargerThanViewport: isRowOversized(hot, row),
          isColumnLargerThanViewport: isColumnOversized(hot, col),
        });

        if (mouseTarget === null) {
          return;
        }

        target = mouseTarget;
      }

      // `scrollIntoView` on a last-partial cell would move the skipped axis.
      const skippedAnAxis = target.row === undefined || target.col === undefined;

      hot.scrollViewportTo(target, skippedAnAxis ? undefined : scrollWindow);
    }
  };
}
