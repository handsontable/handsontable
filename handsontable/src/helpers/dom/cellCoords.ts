import { clamp } from '../number';
import { throwWithCause } from '../errors';
import type { HotInstance } from '../../core/types';
import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';

/**
 * Finds which column the mouse is over within a given column range.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 * @param {number} row Row to use for measuring cell widths.
 * @param {number} startColumn First column in the range.
 * @param {number} endColumn Last column in the range (inclusive).
 * @param {number} relativeX Mouse X position relative to the first cell's edge.
 * @returns {number | null} Column index, or null if mouse is outside the range.
 */
function findColumnAtX(
  hotInstance: HotInstance,
  row: number,
  startColumn: number,
  endColumn: number,
  relativeX: number,
): number | null {
  let accumulatedX = 0;

  for (let column = startColumn; column <= endColumn; column++) {
    const cellElement = hotInstance.getCell(row, column, true);

    if (!cellElement) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const width = cellElement.offsetWidth;

    if (relativeX < accumulatedX + width) {
      return column;
    }

    accumulatedX += width;

    const { colspan } = hotInstance.getCellMetaTransient<{ colspan?: number }>(row, column);

    if (colspan !== undefined && colspan > 1) {
      column += colspan - 1;
    }
  }

  return null;
}

/**
 * Finds which row the mouse is over within a given row range.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 * @param {number} column Column to use for measuring cell heights.
 * @param {number} startRow First row in the range.
 * @param {number} endRow Last row in the range (inclusive).
 * @param {number} relativeY Mouse Y position relative to the first cell's edge.
 * @returns {number | null} Row index, or null if mouse is outside the range.
 */
function findRowAtY(
  hotInstance: HotInstance,
  column: number,
  startRow: number,
  endRow: number,
  relativeY: number,
): number | null {
  let accumulatedY = 0;

  for (let row = startRow; row <= endRow; row++) {
    const cellElement = hotInstance.getCell(row, column, true);

    if (!cellElement) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const height = cellElement.offsetHeight;

    if (relativeY < accumulatedY + height) {
      return row;
    }

    accumulatedY += height;

    const { rowspan } = hotInstance.getCellMetaTransient<{ rowspan?: number }>(row, column);

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
 * that spans multiple rows — a vertical-merge anchor or any of its slaves. Such a column is
 * detected two ways: `rowspan > 1` on the anchor's meta, and element identity, since every row
 * inside a vertical merge resolves to the same rendered cell. A purely horizontal merge resolves
 * to a distinct, single-row master cell per row, so its columns stay valid. A merge in one column
 * must not distort the row lookup used for other columns (DEV-2115).
 *
 * The scanned row range must match the range the returned column will be walked over (the frozen
 * overlays and the scrollable body are resolved separately), so a merge confined to frozen rows
 * cannot leak into the body lookup or vice versa.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 * @param {number} startColumn First column to consider.
 * @param {number} endColumn Last column to consider (inclusive).
 * @param {number} startRow First row of the scanned range.
 * @param {number} endRow Last row of the scanned range (inclusive).
 * @returns {number} A column index free of vertical-merge distortion, or `startColumn` if none qualifies.
 */
function findRowReferenceColumn(
  hotInstance: HotInstance,
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
      const cell = hotInstance.getCell(row, column, true);
      const { rowspan } = hotInstance.getCellMetaTransient<{ rowspan?: number }>(row, column);

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
  // distortion, so `findRowAtY` will still collapse the band onto its anchor — `startColumn` is
  // simply the least-surprising choice. This is a known narrow case of DEV-2115, not a bug here.
  return startColumn;
}

/**
 * Get the cell coordinates from the mouse position. When the mouse is outside of the table,
 * the nearest cell is returned.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 * @param {number} mouseX The x coordinate of the mouse.
 * @param {number} mouseY The y coordinate of the mouse.
 * @returns {CellCoords} The cell coordinates.
 */
export function getCellCoordsFromMousePosition(
  hotInstance: HotInstance,
  mouseX: number,
  mouseY: number,
): CellCoords {
  const {
    view,
    columnIndexMapper,
    rowIndexMapper,
  } = hotInstance;
  const isRtl = hotInstance.isRtl();
  const numberOfFixedColumnsStart = view.countNotHiddenFixedColumnsStart();
  const numberOfFixedRowsTop = view.countNotHiddenFixedRowsTop();
  const numberOfFixedRowsBottom = view.countNotHiddenFixedRowsBottom();

  const firstPartiallyVisibleRow = hotInstance.getFirstPartiallyVisibleRow();
  const lastPartiallyVisibleRow = hotInstance.getLastPartiallyVisibleRow();
  const firstPartiallyVisibleColumn = hotInstance.getFirstPartiallyVisibleColumn();
  const lastPartiallyVisibleColumn = hotInstance.getLastPartiallyVisibleColumn();
  const tableOffset = hotInstance.rootElement.getBoundingClientRect();

  const columnHeaderHeight = hotInstance.hasColHeaders() ? view.getColumnHeaderHeight() : 0;
  const rowHeaderWidth = hotInstance.hasRowHeaders() ? view.getRowHeaderWidth() : 0;
  // When the window is the scroll container, tableOffset.top/left can be positive (RTL) or
  // negative (LTR after scrolling) relative to the viewport. The naive formula using
  // tableOffset as the viewport boundary causes the clamped mouse position to shift with
  // each scroll tick, locking getCellCoordsFromMousePosition onto the same column/row
  // regardless of scroll position. Use the physical window bounds (0 / innerWidth /
  // innerHeight) instead so the clamped position stays fixed and the cell lookup always
  // resolves to the edge cell of the CURRENT viewport.
  const { rootWindow } = hotInstance;
  // When the window is the scroll container and the table's left/top edge has been
  // scrolled PAST the viewport origin (tableOffset.left/top > 0, e.g. RTL at max-left
  // scroll where tableOffset.left can be 4809 while innerWidth = 1100), clamping to
  // tableOffset.left produces clamp(min > max) which always returns the minimum,
  // making scrollRelativeX negative and mapping every mouse position to the wrong edge
  // column. Clamp to 0 in that case so the boundary aligns with the viewport edge.
  // When the table is partially off-screen in the opposite direction (tableOffset < 0),
  // keep the original tableOffset so the relative position calculation remains correct.
  const tableViewportLeft = view.isHorizontallyScrollableByWindow()
    ? Math.min(0, tableOffset.left)
    : tableOffset.left;
  const tableViewportTop = view.isVerticallyScrollableByWindow()
    ? Math.min(0, tableOffset.top)
    : tableOffset.top;
  const tableViewportRight = view.isHorizontallyScrollableByWindow()
    ? rootWindow.innerWidth
    : tableOffset.left + view.getViewportWidth() + rowHeaderWidth;
  const tableViewportBottom = view.isVerticallyScrollableByWindow()
    ? rootWindow.innerHeight
    : tableOffset.top + view.getViewportHeight() + columnHeaderHeight;

  const clampedX = clamp(mouseX, tableViewportLeft, tableViewportRight);
  const clampedY = clamp(mouseY, tableViewportTop, tableViewportBottom);

  let foundColumn: number | null = null;

  // Check fixed columns first
  if (numberOfFixedColumnsStart > 0) {
    const firstFixedColumn = columnIndexMapper.getVisualFromRenderableIndex(0);
    const lastFixedColumn = columnIndexMapper.getVisualFromRenderableIndex(numberOfFixedColumnsStart - 1);
    const firstNonHiddenColumn = firstFixedColumn !== null
      ? columnIndexMapper.getNearestNotHiddenIndex(firstFixedColumn, 1)
      : null;

    if (firstNonHiddenColumn !== null && lastFixedColumn !== null) {
      const fixedCell = hotInstance.getCell(firstPartiallyVisibleRow, firstNonHiddenColumn, true);

      if (fixedCell instanceof HTMLElement) {
        const fixedCellRect = fixedCell.getBoundingClientRect();
        const fixedRelativeX = isRtl ? fixedCellRect.right - clampedX : clampedX - fixedCellRect.left;

        foundColumn = findColumnAtX(
          hotInstance,
          firstPartiallyVisibleRow,
          firstNonHiddenColumn,
          lastFixedColumn,
          fixedRelativeX,
        );
      }
    }
  }

  // If not in fixed columns, check scrollable columns (main table)
  if (foundColumn === null) {
    const scrollCell = hotInstance.getCell(firstPartiallyVisibleRow, firstPartiallyVisibleColumn, true);

    if (scrollCell instanceof HTMLElement) {
      const scrollCellRect = scrollCell.getBoundingClientRect();
      const scrollRelativeX = isRtl ? scrollCellRect.right - clampedX : clampedX - scrollCellRect.left;

      foundColumn = findColumnAtX(
        hotInstance,
        firstPartiallyVisibleRow,
        firstPartiallyVisibleColumn,
        lastPartiallyVisibleColumn,
        scrollRelativeX,
      );

      // Fallback to edge columns if still not found.
      // If `lastPartiallyVisibleColumn` is null (e.g., the HoT is positioned off-screen and
      // viewport queries return invalid indexes), fall back to the global column bounds.
      if (foundColumn === null) {
        foundColumn = scrollRelativeX < 0
          ? firstPartiallyVisibleColumn ?? 0
          : lastPartiallyVisibleColumn ?? (hotInstance.countCols() - 1);
      }
    } else {
      foundColumn = firstPartiallyVisibleColumn ?? 0;
    }
  }

  if (foundColumn === null) {
    throwWithCause('Failed to resolve cell coordinates from mouse position.');
  }

  // Resolve the row against a column that has no vertical merge across the rows being walked.
  // `findRowAtY` skips a merged cell's spanned rows, so measuring against a vertically merged
  // column collapses every Y inside the band onto the merge anchor. Neither a fixed column nor
  // the pointer's column is universally safe (a merge can live in either), so each row-scan
  // branch picks the first column free of vertical merges within its own row range (DEV-2115).
  const rowReferenceColumnStart = firstPartiallyVisibleColumn ?? 0;
  // When the viewport query returns null nothing is rendered, so there is no cell to measure
  // against. Keep the search inside the (empty) rendered range instead of opening it to every
  // column in the grid — otherwise `findRowReferenceColumn` walks the full column x row product,
  // calling `getCellMetaTransient` on each step, and a single held autofill/`dragToScroll` drag
  // on a large off-screen grid locks the tab.
  const rowReferenceColumnEnd = lastPartiallyVisibleColumn ?? rowReferenceColumnStart;

  let foundRow: number | null = null;

  // Check fixed top rows first
  if (numberOfFixedRowsTop > 0) {
    const firstFixedRow = rowIndexMapper.getVisualFromRenderableIndex(0);
    const lastFixedRow = rowIndexMapper.getVisualFromRenderableIndex(numberOfFixedRowsTop - 1);
    const firstNonHiddenRow = firstFixedRow !== null
      ? rowIndexMapper.getNearestNotHiddenIndex(firstFixedRow, 1)
      : null;

    if (firstNonHiddenRow !== null && lastFixedRow !== null) {
      const rowReferenceColumn = findRowReferenceColumn(
        hotInstance, rowReferenceColumnStart, rowReferenceColumnEnd, firstNonHiddenRow, lastFixedRow);
      const fixedCell = hotInstance.getCell(firstNonHiddenRow, rowReferenceColumn, true);

      if (fixedCell instanceof HTMLElement) {
        const fixedCellRect = fixedCell.getBoundingClientRect();
        const fixedRelativeY = clampedY - fixedCellRect.top;

        foundRow = findRowAtY(
          hotInstance,
          rowReferenceColumn,
          firstNonHiddenRow,
          lastFixedRow,
          fixedRelativeY,
        );
      }
    }
  }

  // Check fixed bottom rows if not found in fixed top rows
  if (foundRow === null && numberOfFixedRowsBottom > 0) {
    const totalSourceRows = rowIndexMapper.getNotHiddenIndexesLength();
    const bottomStartRow = rowIndexMapper.getVisualFromRenderableIndex(totalSourceRows - numberOfFixedRowsBottom);
    const bottomEndRow = rowIndexMapper.getVisualFromRenderableIndex(totalSourceRows - 1);
    const bottomStartNonHiddenRow = bottomStartRow !== null
      ? rowIndexMapper.getNearestNotHiddenIndex(bottomStartRow, 1)
      : null;
    const bottomEndNonHiddenRow = bottomEndRow !== null
      ? rowIndexMapper.getNearestNotHiddenIndex(bottomEndRow, -1)
      : null;

    if (bottomStartNonHiddenRow !== null && bottomEndNonHiddenRow !== null) {
      const rowReferenceColumn = findRowReferenceColumn(
        hotInstance, rowReferenceColumnStart, rowReferenceColumnEnd, bottomStartNonHiddenRow, bottomEndNonHiddenRow);
      const fixedBottomCell = hotInstance.getCell(bottomStartNonHiddenRow, rowReferenceColumn, true);

      if (fixedBottomCell instanceof HTMLElement) {
        const fixedBottomCellRect = fixedBottomCell.getBoundingClientRect();
        const fixedBottomRelativeY = clampedY - fixedBottomCellRect.top;

        if (fixedBottomRelativeY >= 0) {
          foundRow = findRowAtY(
            hotInstance,
            rowReferenceColumn,
            bottomStartNonHiddenRow,
            bottomEndNonHiddenRow,
            fixedBottomRelativeY
          );

          if (foundRow === null) {
            foundRow = bottomEndNonHiddenRow;
          }
        }
      }
    }
  }

  // Check scrollable rows (main table)
  if (foundRow === null) {
    const scrollRowScanStart = firstPartiallyVisibleRow ?? 0;
    // Same null-viewport guard as the column bound above: clamp the row scan to the (empty)
    // rendered range rather than `countRows()`, so the reference-column search cannot walk the
    // whole grid when nothing is rendered.
    const scrollRowScanEnd = lastPartiallyVisibleRow ?? scrollRowScanStart;
    const rowReferenceColumn = findRowReferenceColumn(
      hotInstance,
      rowReferenceColumnStart,
      rowReferenceColumnEnd,
      scrollRowScanStart,
      scrollRowScanEnd,
    );
    const scrollCell = hotInstance.getCell(firstPartiallyVisibleRow, rowReferenceColumn, true);

    if (scrollCell instanceof HTMLElement) {
      const scrollCellRect = scrollCell.getBoundingClientRect();
      const scrollRelativeY = clampedY - scrollCellRect.top;

      foundRow = findRowAtY(
        hotInstance,
        rowReferenceColumn,
        firstPartiallyVisibleRow,
        lastPartiallyVisibleRow,
        scrollRelativeY,
      );

      // Fallback to edge rows if still not found. If the viewport query returns null
      // (off-screen HoT edge case), use the global row bounds.
      if (foundRow === null) {
        foundRow = scrollRelativeY < 0
          ? firstPartiallyVisibleRow ?? 0
          : lastPartiallyVisibleRow ?? (hotInstance.countRows() - 1);
      }
    } else {
      foundRow = firstPartiallyVisibleRow ?? 0;
    }
  }

  if (foundRow === null) {
    throwWithCause('Failed to resolve cell coordinates from mouse position.');
  }

  return hotInstance._createCellCoords(foundRow, foundColumn);
}
