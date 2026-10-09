import { clamp } from '../../../../helpers/number';
import { isHTMLElement } from '../../../../helpers/dom/element';
import {
  findColumnAtX,
  findColumnReferenceRow,
  findRowAtY,
  findRowReferenceColumn,
  type CellMeasurer,
} from '../../../../helpers/dom/cellMeasure';
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
 * Counts how much of a merge is left from the queried coordinate. A slave resolves to the anchor's element,
 * whose span is the whole block, so the span is cut to the cells after the queried one that still resolve to
 * that element.
 *
 * @param {number} span The span of the rendered element.
 * @param {Function} getCellAt Returns the cell at an offset from the queried coordinate.
 * @param {HTMLElement | null} cell The rendered element of the queried coordinate.
 * @returns {number} The number of rows or columns left in the merge, counting the queried one.
 */
function spanLeft(span: number, getCellAt: (offset: number) => HTMLElement | null, cell: HTMLElement | null) {
  let left = 1;

  while (left < span && getCellAt(left) === cell) {
    left += 1;
  }

  return left;
}

/**
 * Builds the measurer of a Walkontable instance. The lookups run in renderable indexes and read the
 * span of a merge from the rendered cell, because Walkontable holds no cell meta.
 *
 * @param {Walkontable} wotInstance The Walkontable instance.
 * @returns {CellMeasurer}
 */
function createCellMeasurer(wotInstance: WalkontableInstance): CellMeasurer {
  const { geometryReader } = wotInstance.domBindings;

  const getCell = (row: number, column: number) => {
    const cell = wotInstance.getCell({ row, col: column }, true);

    return isHTMLElement(cell) ? cell : null;
  };

  return {
    getCell,
    getHeight: cell => geometryReader.offsetHeight(cell),
    getWidth: cell => geometryReader.offsetWidth(cell),
    getRowspan: (row, column, cell) => {
      const span = (cell as HTMLTableCellElement | null)?.rowSpan;

      return span === undefined || span <= 1 ? span : spanLeft(span, offset => getCell(row + offset, column), cell);
    },
    getColspan: (row, column, cell) => {
      const span = (cell as HTMLTableCellElement | null)?.colSpan;

      return span === undefined || span <= 1 ? span : spanLeft(span, offset => getCell(row, column + offset), cell);
    },
  };
}

/**
 * Finds which of the frozen end columns the mouse is over.
 *
 * The end band lies past the scrollable columns, so a pointer that is not before its first column
 * belongs to it - past the last one it maps to the last column. A pointer before the band is left to
 * the scrollable columns (`null`).
 *
 * @param {Walkontable} wotInstance The Walkontable instance.
 * @param {number} row Row to use for measuring cell widths.
 * @param {number} firstEndColumn First column of the end band.
 * @param {number} lastEndColumn Last column of the end band (inclusive).
 * @param {number} mouseX Client X coordinate of the mouse, clamped to the table.
 * @param {boolean} isRtl Whether the grid is right-to-left.
 * @returns {number | null} Column index, or null if the mouse is before the end band.
 */
export function findEndColumnAtX(
  wotInstance: WalkontableInstance,
  row: number,
  firstEndColumn: number,
  lastEndColumn: number,
  mouseX: number,
  isRtl: boolean
): number | null {
  const firstEndCell = wotInstance.getCell({ row, col: firstEndColumn }, true);

  if (!isHTMLElement(firstEndCell)) {
    return null;
  }

  const rect = wotInstance.domBindings.geometryReader.getBoundingClientRect(firstEndCell);
  const relativeX = isRtl ? rect.right - mouseX : mouseX - rect.left;

  if (relativeX < 0) {
    return null;
  }

  return findColumnAtX(createCellMeasurer(wotInstance), row, firstEndColumn, lastEndColumn, relativeX) ?? lastEndColumn;
}

/**
 * Returns the client rectangle the pointer is mapped inside. A pointer past it is outside the table.
 *
 * @param {MousePositionDeps} deps The layout/settings/geometry dependencies.
 * @returns {{ left: number, top: number, right: number, bottom: number }}
 */
function getTableViewportBounds(deps: MousePositionDeps) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const wot = deps.facadeGetter();
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

  return {
    left: tableViewportLeft,
    top: tableViewportTop,
    right: tableViewportRight,
    bottom: tableViewportBottom,
  };
}

/**
 * Tells whether the pointer is outside the visible viewport of the table. It reads the bounds only, so it is
 * cheap enough to run on every pointer move, unlike the lookup of the cell.
 *
 * @param {MousePositionDeps} deps The layout/settings/geometry dependencies (satisfied by `Event`'s deps).
 * @param {number} mouseX Client X coordinate of the mouse.
 * @param {number} mouseY Client Y coordinate of the mouse.
 * @returns {boolean}
 */
export function isPointerOutsideTable(deps: MousePositionDeps, mouseX: number, mouseY: number): boolean {
  const { left, top, right, bottom } = getTableViewportBounds(deps);

  return mouseX < left || mouseX > right || mouseY < top || mouseY > bottom;
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
  const numberOfFixedColumnsEnd = deps.wtSettings.getSetting<number>('fixedColumnsEnd');
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
  const { left: tableViewportLeft, top: tableViewportTop, right: tableViewportRight, bottom: tableViewportBottom } =
    getTableViewportBounds(deps);

  const clampedX = clamp(mouseX, tableViewportLeft, tableViewportRight);
  const clampedY = clamp(mouseY, tableViewportTop, tableViewportBottom);

  const measurer = createCellMeasurer(wot);

  // Each band is measured against a row (columns) or a column (rows) that no merge spans, so a merge
  // cannot add its full size once per slave. The lookups pick it within the range they walk and scan
  // the rendered rows and columns only.
  let foundColumn = null;

  if (numberOfFixedColumnsStart > 0) {
    const referenceRow = findColumnReferenceRow(
      measurer, firstPartiallyVisibleRow, lastPartiallyVisibleRow, 0, numberOfFixedColumnsStart - 1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const fixedCell = wot.getCell({ row: referenceRow, col: 0 }, true);

    if (isHTMLElement(fixedCell)) {
      const fixedCellRect = deps.geometryReader.getBoundingClientRect(fixedCell);
      const fixedRelativeX = isRtl ? fixedCellRect.right - clampedX : clampedX - fixedCellRect.left;

      foundColumn = findColumnAtX(measurer, referenceRow, 0, numberOfFixedColumnsStart - 1, fixedRelativeX);
    }
  }

  if (foundColumn === null && numberOfFixedColumnsEnd > 0) {
    const totalColumns = deps.wtSettings.getSetting<number>('totalColumns');
    const firstEndColumn = totalColumns - numberOfFixedColumnsEnd;
    const referenceRow = findColumnReferenceRow(
      measurer, firstPartiallyVisibleRow, lastPartiallyVisibleRow, firstEndColumn, totalColumns - 1);

    foundColumn = findEndColumnAtX(wot, referenceRow, firstEndColumn, totalColumns - 1, clampedX, isRtl);
  }

  if (foundColumn === null) {
    const referenceRow = findColumnReferenceRow(
      measurer,
      firstPartiallyVisibleRow,
      lastPartiallyVisibleRow,
      firstPartiallyVisibleColumn,
      lastPartiallyVisibleColumn,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const scrollCell = wot.getCell({ row: referenceRow, col: firstPartiallyVisibleColumn }, true);

    if (isHTMLElement(scrollCell)) {
      const scrollCellRect = deps.geometryReader.getBoundingClientRect(scrollCell);
      const scrollRelativeX = isRtl ? scrollCellRect.right - clampedX : clampedX - scrollCellRect.left;

      foundColumn = findColumnAtX(
        measurer,
        referenceRow,
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
    const referenceColumn = findRowReferenceColumn(
      measurer, firstPartiallyVisibleColumn, lastPartiallyVisibleColumn, 0, numberOfFixedRowsTop - 1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const fixedCell = wot.getCell({ row: 0, col: referenceColumn }, true);

    if (isHTMLElement(fixedCell)) {
      const fixedCellRect = deps.geometryReader.getBoundingClientRect(fixedCell);
      const fixedRelativeY = clampedY - fixedCellRect.top;

      foundRow = findRowAtY(measurer, referenceColumn, 0, numberOfFixedRowsTop - 1, fixedRelativeY);
    }
  }

  if (foundRow === null && numberOfFixedRowsBottom > 0) {
    const totalRows = deps.wtSettings.getSetting<number>('totalRows');
    const bottomStartRow = totalRows - numberOfFixedRowsBottom;
    const bottomEndRow = totalRows - 1;
    const referenceColumn = findRowReferenceColumn(
      measurer, firstPartiallyVisibleColumn, lastPartiallyVisibleColumn, bottomStartRow, bottomEndRow);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const fixedBottomCell = wot.getCell({ row: bottomStartRow, col: referenceColumn }, true);

    if (isHTMLElement(fixedBottomCell)) {
      const fixedBottomCellRect = deps.geometryReader.getBoundingClientRect(fixedBottomCell);
      const fixedBottomRelativeY = clampedY - fixedBottomCellRect.top;

      if (fixedBottomRelativeY >= 0) {
        foundRow = findRowAtY(measurer, referenceColumn, bottomStartRow, bottomEndRow, fixedBottomRelativeY);

        if (foundRow === null) {
          foundRow = bottomEndRow;
        }
      }
    }
  }

  if (foundRow === null) {
    const referenceColumn = findRowReferenceColumn(
      measurer,
      firstPartiallyVisibleColumn,
      lastPartiallyVisibleColumn,
      firstPartiallyVisibleRow,
      lastPartiallyVisibleRow,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const scrollCell = wot.getCell({ row: firstPartiallyVisibleRow, col: referenceColumn }, true);

    if (isHTMLElement(scrollCell)) {
      const scrollCellRect = deps.geometryReader.getBoundingClientRect(scrollCell);
      const scrollRelativeY = clampedY - scrollCellRect.top;

      foundRow = findRowAtY(
        measurer,
        referenceColumn,
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
