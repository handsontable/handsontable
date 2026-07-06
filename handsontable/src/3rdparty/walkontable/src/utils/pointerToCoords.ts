import { clamp } from '../../../../helpers/number';
import type { WalkontableInstance } from '../types';
import type { default as Settings } from '../settings';
import type { GeometryReader } from '../domMeasure/geometryReader';
import type { default as Table } from '../table/baseTable';

// The subset of dependencies `getCellCoordsFromMousePosition` needs. `Event`'s deps satisfy it.
interface MousePositionDeps {
  wtSettings: Settings;
  geometryReader: GeometryReader;
  wtTable: Table;
  rootWindow: Window;
  facadeGetter: Function;
}

/**
 * Finds which column the mouse is over within a given column range.
 *
 * @param {Walkontable} wotInstance The Walkontable instance.
 * @param {number} row Row to use for measuring cell widths.
 * @param {number} startColumn First column in the range.
 * @param {number} endColumn Last column in the range (inclusive).
 * @param {number} relativeX Mouse X position relative to the first cell's left edge (or right edge in RTL).
 * @returns {number | null} Column index, or null if the mouse is outside the range.
 */
export function findColumnAtX(
  wotInstance: WalkontableInstance,
  row: number,
  startColumn: number,
  endColumn: number,
  relativeX: number
): number | null {
  let accumulatedX = 0;

  for (let column = startColumn; column <= endColumn; column++) {
    const cellElement = wotInstance.getCell({ row, col: column }, true);

    if (!(cellElement instanceof HTMLElement)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const width = wotInstance.domBindings.geometryReader.offsetWidth(cellElement);

    if (relativeX < accumulatedX + width) {
      return column;
    }

    accumulatedX += width;
  }

  return null;
}

/**
 * Finds which row the mouse is over within a given row range.
 *
 * @param {Walkontable} wotInstance The Walkontable instance.
 * @param {number} column Column to use for measuring cell heights.
 * @param {number} startRow First row in the range.
 * @param {number} endRow Last row in the range (inclusive).
 * @param {number} relativeY Mouse Y position relative to the first cell's top edge.
 * @returns {number | null} Row index, or null if the mouse is outside the range.
 */
export function findRowAtY(
  wotInstance: WalkontableInstance,
  column: number,
  startRow: number,
  endRow: number,
  relativeY: number
): number | null {
  let accumulatedY = 0;

  for (let row = startRow; row <= endRow; row++) {
    const cellElement = wotInstance.getCell({ row, col: column }, true);

    if (!(cellElement instanceof HTMLElement)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const height = wotInstance.domBindings.geometryReader.offsetHeight(cellElement);

    if (relativeY < accumulatedY + height) {
      return row;
    }

    accumulatedY += height;
  }

  return null;
}

/**
 * Returns the cell coordinates for the given mouse position and whether the mouse is
 * outside the visible viewport. When the mouse is outside, the nearest edge cell is returned.
 *
 * @param {MousePositionDeps} deps The layout/settings/geometry dependencies (satisfied by `Event`'s deps).
 * @param {number} mouseX Client X coordinate of the mouse.
 * @param {number} mouseY Client Y coordinate of the mouse.
 * @returns {{ coords: CellCoords, isOutside: boolean }}
 */
export function getCellCoordsFromMousePosition(deps: MousePositionDeps, mouseX: number, mouseY: number) {
  const isRtl = deps.wtSettings.getSetting<boolean>('rtlMode');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const wot = deps.facadeGetter();

  const numberOfFixedColumnsStart = deps.wtSettings.getSetting<number>('fixedColumnsStart');
  const numberOfFixedRowsTop = deps.wtSettings.getSetting<number>('fixedRowsTop');
  const numberOfFixedRowsBottom = deps.wtSettings.getSetting<number>('fixedRowsBottom');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const firstPartiallyVisibleRow: number = wot.wtScroll.getFirstPartiallyVisibleRow();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const lastPartiallyVisibleRow: number = wot.wtScroll.getLastPartiallyVisibleRow();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const firstPartiallyVisibleColumn: number = wot.wtScroll.getFirstPartiallyVisibleColumn();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const lastPartiallyVisibleColumn: number = wot.wtScroll.getLastPartiallyVisibleColumn();
  const tableOffset = deps.geometryReader.getBoundingClientRect(deps.wtTable.wtRootElement);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const columnHeaderHeight: number = deps.wtSettings.getSetting<Function[]>('columnHeaders').length > 0
    ? wot.wtViewport.getColumnHeaderHeight() : 0;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rowHeaderWidth: number = deps.wtSettings.getSetting<Function[]>('rowHeaders').length > 0
    ? wot.wtViewport.getRowHeaderWidth() : 0;
  const rootWindow = deps.rootWindow;
  // When the window is the scroll container and tableOffset.left/top > 0 (e.g. RTL
  // at max-left scroll where tableOffset.left can exceed innerWidth), using it as the
  // clamp minimum causes clamp(min > max) to always return min, mapping every mouse
  // position to the wrong edge column. Math.min(0, tableOffset) corrects this while
  // preserving the original boundary when the table is partially off-screen to the
  // left/top (tableOffset < 0), which is the normal scrolled-past-origin case.
  const tableViewportLeft = wot.wtViewport.isHorizontallyScrollableByWindow()
    ? Math.min(0, tableOffset.left)
    : tableOffset.left;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const tableViewportTop: number = wot.wtViewport.isVerticallyScrollableByWindow()
    ? Math.min(0, tableOffset.top)
    : tableOffset.top;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const tableViewportRight: number = wot.wtViewport.isHorizontallyScrollableByWindow()
    ? rootWindow.innerWidth
    : tableOffset.left + wot.wtViewport.getViewportWidth() + rowHeaderWidth;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const tableViewportBottom: number = wot.wtViewport.isVerticallyScrollableByWindow()
    ? rootWindow.innerHeight
    : tableOffset.top + wot.wtViewport.getViewportHeight() + columnHeaderHeight;

  const clampedX = clamp(mouseX, tableViewportLeft, tableViewportRight);
  const clampedY = clamp(mouseY, tableViewportTop, tableViewportBottom);

  let foundColumn = null;

  if (numberOfFixedColumnsStart > 0) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const fixedCell = wot.getCell({ row: firstPartiallyVisibleRow, col: 0 }, true);

    if (fixedCell instanceof HTMLElement) {
      const fixedCellRect = deps.geometryReader.getBoundingClientRect(fixedCell);
      const fixedRelativeX = isRtl ? fixedCellRect.right - clampedX : clampedX - fixedCellRect.left;

      foundColumn = findColumnAtX(wot, firstPartiallyVisibleRow, 0, numberOfFixedColumnsStart - 1, fixedRelativeX);
    }
  }

  if (foundColumn === null) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const scrollCell = wot.getCell({ row: firstPartiallyVisibleRow, col: firstPartiallyVisibleColumn }, true);

    if (scrollCell instanceof HTMLElement) {
      const scrollCellRect = deps.geometryReader.getBoundingClientRect(scrollCell);
      const scrollRelativeX = isRtl ? scrollCellRect.right - clampedX : clampedX - scrollCellRect.left;

      foundColumn = findColumnAtX(
        wot,
        firstPartiallyVisibleRow,
        firstPartiallyVisibleColumn,
        lastPartiallyVisibleColumn,
        scrollRelativeX,
      );

      if (foundColumn === null) {
        foundColumn = scrollRelativeX < 0 ? firstPartiallyVisibleColumn : lastPartiallyVisibleColumn;
      }
    } else {
      foundColumn = firstPartiallyVisibleColumn;
    }
  }

  let foundRow = null;

  if (numberOfFixedRowsTop > 0) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const fixedCell = wot.getCell({ row: 0, col: firstPartiallyVisibleColumn }, true);

    if (fixedCell instanceof HTMLElement) {
      const fixedCellRect = deps.geometryReader.getBoundingClientRect(fixedCell);
      const fixedRelativeY = clampedY - fixedCellRect.top;

      foundRow = findRowAtY(wot, firstPartiallyVisibleColumn, 0, numberOfFixedRowsTop - 1, fixedRelativeY);
    }
  }

  if (foundRow === null && numberOfFixedRowsBottom > 0) {
    const totalRows = deps.wtSettings.getSetting<number>('totalRows');
    const bottomStartRow = totalRows - numberOfFixedRowsBottom;
    const bottomEndRow = totalRows - 1;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const fixedBottomCell = wot.getCell({ row: bottomStartRow, col: firstPartiallyVisibleColumn }, true);

    if (fixedBottomCell instanceof HTMLElement) {
      const fixedBottomCellRect = deps.geometryReader.getBoundingClientRect(fixedBottomCell);
      const fixedBottomRelativeY = clampedY - fixedBottomCellRect.top;

      if (fixedBottomRelativeY >= 0) {
        foundRow = findRowAtY(wot, firstPartiallyVisibleColumn, bottomStartRow, bottomEndRow, fixedBottomRelativeY);

        if (foundRow === null) {
          foundRow = bottomEndRow;
        }
      }
    }
  }

  if (foundRow === null) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const scrollCell = wot.getCell({ row: firstPartiallyVisibleRow, col: firstPartiallyVisibleColumn }, true);

    if (scrollCell instanceof HTMLElement) {
      const scrollCellRect = deps.geometryReader.getBoundingClientRect(scrollCell);
      const scrollRelativeY = clampedY - scrollCellRect.top;

      foundRow = findRowAtY(
        wot,
        firstPartiallyVisibleColumn,
        firstPartiallyVisibleRow,
        lastPartiallyVisibleRow,
        scrollRelativeY,
      );

      if (foundRow === null) {
        foundRow = lastPartiallyVisibleRow;
      }
    } else {
      foundRow = firstPartiallyVisibleRow;
    }
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    coords: wot.createCellCoords(foundRow, foundColumn),
    isOutside: mouseX < tableViewportLeft ||
               mouseX > tableViewportRight ||
               mouseY < tableViewportTop ||
               mouseY > tableViewportBottom,
  };
}
