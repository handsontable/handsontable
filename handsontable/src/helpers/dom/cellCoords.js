import { clamp } from '../number';

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
function findColumnAtX(hotInstance, row, startColumn, endColumn, relativeX) {
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

    const { colspan } = hotInstance.getCellMeta(row, column);

    if (colspan > 1) {
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
function findRowAtY(hotInstance, column, startRow, endRow, relativeY) {
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

    const { rowspan } = hotInstance.getCellMeta(row, column);

    if (rowspan > 1) {
      row += rowspan - 1;
    }
  }

  return null;
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
export function getCellCoordsFromMousePosition(hotInstance, mouseX, mouseY) {
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

  let foundColumn = null;

  // Check fixed columns first
  if (numberOfFixedColumnsStart > 0) {
    const firstFixedColumn = columnIndexMapper.getVisualFromRenderableIndex(0);
    const firstNonHiddenColumn = columnIndexMapper.getNearestNotHiddenIndex(firstFixedColumn, 1);
    const fixedCell = hotInstance.getCell(firstPartiallyVisibleRow, firstNonHiddenColumn, true);

    if (fixedCell instanceof HTMLElement) {
      const fixedCellRect = fixedCell.getBoundingClientRect();
      const fixedRelativeX = isRtl ? fixedCellRect.right - clampedX : clampedX - fixedCellRect.left;

      foundColumn = findColumnAtX(
        hotInstance,
        firstPartiallyVisibleRow,
        firstNonHiddenColumn,
        columnIndexMapper.getVisualFromRenderableIndex(numberOfFixedColumnsStart - 1),
        fixedRelativeX,
      );
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

  let foundRow = null;

  // Check fixed top rows first
  if (numberOfFixedRowsTop > 0) {
    const firstFixedRow = rowIndexMapper.getVisualFromRenderableIndex(0);
    const firstNonHiddenRow = rowIndexMapper.getNearestNotHiddenIndex(firstFixedRow, 1);
    const fixedCell = hotInstance.getCell(firstNonHiddenRow, firstPartiallyVisibleColumn, true);

    if (fixedCell instanceof HTMLElement) {
      const fixedCellRect = fixedCell.getBoundingClientRect();
      const fixedRelativeY = clampedY - fixedCellRect.top;

      foundRow = findRowAtY(
        hotInstance,
        firstPartiallyVisibleColumn,
        firstNonHiddenRow,
        rowIndexMapper.getVisualFromRenderableIndex(numberOfFixedRowsTop - 1),
        fixedRelativeY,
      );
    }
  }

  // Check fixed bottom rows if not found in fixed top rows
  if (foundRow === null && numberOfFixedRowsBottom > 0) {
    const totalSourceRows = rowIndexMapper.getNotHiddenIndexesLength();
    const bottomStartRow = rowIndexMapper.getVisualFromRenderableIndex(totalSourceRows - numberOfFixedRowsBottom);
    const bottomEndRow = rowIndexMapper.getVisualFromRenderableIndex(totalSourceRows - 1);
    const bottomStartNonHiddenRow = rowIndexMapper.getNearestNotHiddenIndex(bottomStartRow, 1);
    const bottomEndNonHiddenRow = rowIndexMapper.getNearestNotHiddenIndex(bottomEndRow, -1);
    const fixedBottomCell = hotInstance.getCell(bottomStartNonHiddenRow, firstPartiallyVisibleColumn, true);

    if (fixedBottomCell instanceof HTMLElement) {
      const fixedBottomCellRect = fixedBottomCell.getBoundingClientRect();
      const fixedBottomRelativeY = clampedY - fixedBottomCellRect.top;

      if (fixedBottomRelativeY >= 0) {
        foundRow = findRowAtY(
          hotInstance,
          firstPartiallyVisibleColumn,
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

  // Check scrollable rows (main table)
  if (foundRow === null) {
    const scrollCell = hotInstance.getCell(firstPartiallyVisibleRow, firstPartiallyVisibleColumn, true);

    if (scrollCell instanceof HTMLElement) {
      const scrollCellRect = scrollCell.getBoundingClientRect();
      const scrollRelativeY = clampedY - scrollCellRect.top;

      foundRow = findRowAtY(
        hotInstance,
        firstPartiallyVisibleColumn,
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

  return hotInstance._createCellCoords(foundRow, foundColumn);
}
