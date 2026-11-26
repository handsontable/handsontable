/**
 * Cell / header DOM-access queries for `Table` and every subclass.
 *
 * These methods translate between source coordinates and the rendered DOM (finding a `TD`/`TH`, a row,
 * a header, or the coords for a given element). They are universal — every table type (master and each
 * overlay clone) needs them — so the mixin is applied once to the base `Table` (`mixin(Table,
 * cellAccess)` in `table.ts`) and inherited by all subclasses, unlike the axis-selective range-query /
 * sticky mixins that are applied per subclass. The methods run on the `Table` instance (`this`),
 * reading its public fields (`THEAD`/`TBODY`/`rowFilter`/`columnFilter`/`wtSettings`/`wot`/
 * `wtRootElement`). They use no `#`-private state, so no `deps` getter is needed here.
 */
import {
  index,
  isHTMLElement,
  isHTMLTableCellElement,
  overlayContainsElement,
  closest,
} from '../../../../helpers/dom/element';
import { defineGetter } from '../../../../helpers/object';
import { throwWithCause } from '../../../../helpers/errors';
import {
  CLONE_TOP,
  CLONE_BOTTOM,
  CLONE_INLINE_START,
  CLONE_INLINE_END,
  CLONE_TOP_INLINE_START_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
  CLONE_TOP_INLINE_END_CORNER,
  CLONE_BOTTOM_INLINE_END_CORNER,
  INLINE_END_CLONE_TYPES,
  BOTTOM_CLONE_TYPES,
  TOP_CLONE_TYPES,
} from '../overlay';
import type { default as Table } from './baseTable';
import type CellCoords from '../cell/coords';

/**
 * Cell / header DOM-access queries, mixed into every `Table` type.
 */
export interface CellAccess {
  getCell(coords: { row: number | null; col: number | null }): HTMLElement | number;
  getRow(rowIndex: number): HTMLTableRowElement | false;
  getColumnHeader(col: number, level?: number): HTMLElement | undefined;
  getColumnHeaders(column: number): HTMLTableCellElement[];
  getRowHeader(row: number, level?: number): HTMLElement | undefined;
  getRowHeaders(row: number): ChildNode[];
  getCoords(TD: HTMLTableCellElement | HTMLElement): CellCoords | null;
  getTrForRow(row: number): HTMLTableRowElement;
}

/**
 * Tells whether a bottom clone's last draw no longer matches the band its live settings describe. A clone that
 * was never drawn holds nothing. Otherwise the filter is built from the same `getFirstRenderedRow()` in every
 * draw, so its offset agrees with the live one at rest and differs only between a change of `totalRows` or
 * `fixedRowsBottom` and the draw that follows it. The first row alone is not enough: it stays the same while the
 * band grows at its end (every row pinned, or the rows and the pinned rows growing by the same amount), so the
 * rows the clone holds are counted against the rows the live band names too.
 *
 * @param {Table} table The table to check.
 * @returns {boolean}
 */
function hasStaleBottomBand(table: Table): boolean {
  if (!BOTTOM_CLONE_TYPES.includes(table.name)) {
    return false;
  }

  if (table.rowFilter === null || table.TBODY === null) {
    return true;
  }

  return Math.max(table.getFirstRenderedRow(), 0) !== table.rowFilter.offset ||
    table.TBODY.childNodes.length < table.getRenderedRowsCount();
}

/**
 * Tells whether a top clone has no row in its TBODY for the given body row yet. The clone's rendered rows
 * count follows the live settings (`stickyRowsTop`), so after the number of rows grew past the rows of the last
 * draw and before the render that follows, the count names rows the clone has not drawn. A clone that was never
 * drawn holds none. Shrinking is not affected: the rows the clone still holds are the rows it should hold.
 *
 * @param {Table} table The table to check.
 * @param {number} row The body row index.
 * @returns {boolean}
 */
function isBeyondDrawnTopRows(table: Table, row: number): boolean {
  if (!TOP_CLONE_TYPES.includes(table.name)) {
    return false;
  }

  return table.rowFilter === null ||
    table.TBODY === null ||
    table.rowFilter.sourceToRendered(row) >= table.TBODY.childNodes.length;
}

const cellAccess = {
  /**
   * Returns the TD element for the provided coordinates (from the rendered DOM) if it is rendered on
   * the screen, or the exit code otherwise (a negative number when the coordinates are out of the
   * rendered viewport). The exit codes are checked in the order the arguments are given. Thus, if both
   * the row and the column coords are out of the rendered bounds, the method returns the error code for
   * the row.
   *
   * @param {CellCoords} coords The cell coordinates.
   * @returns {HTMLElement|number} HTMLElement on success or Number one of the exit codes on error:
   *  -1 row before viewport
   *  -2 row after viewport
   *  -3 column before viewport
   *  -4 column after viewport.
   * A bottom clone that has not been redrawn since the number of rows or of frozen bottom rows changed also
   * answers -1 or -2 for a body row, as its DOM does not hold the band yet, and so does a top clone for a row
   * it has not drawn since the number of rows grew. Any negative code means "not rendered".
   * @this Table
   */
  getCell(this: Table, coords: { row: number | null; col: number | null }): HTMLElement | number {
    if (coords.row === null || coords.col === null) {
      return -5;
    }

    let row = coords.row;
    let column = coords.col;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const hookResult = this.wtSettings
      .getSetting('onModifyGetCellCoords', row, column, !this.isMaster, 'render');

    if (hookResult && Array.isArray(hookResult)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [, , lastRow, lastColumn] = hookResult as (number | null | undefined)[];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [row, column] = hookResult;

      // The hook may answer with the extent of a block (a merged cell) that starts before this overlay's
      // first rendered row but reaches into it: the overlay renders only the part of the block it holds, so
      // the cell that stands for the block here is its first rendered row. Only a clone can render a block
      // from the middle (the bottom overlay holds the last rows and never the block's origin).
      if (
        !this.isMaster &&
        typeof lastRow === 'number' &&
        row >= 0 &&
        this.isRowBeforeRenderedRows(row) &&
        !this.isRowBeforeRenderedRows(lastRow)
      ) {
        row = this.getFirstRenderedRow();
      }

      // The column-side counterpart: an end overlay renders only the last `fixedColumnsEnd` columns, so a block
      // that starts in the scrolling columns and reaches into the band has its origin outside the overlay. The
      // cell that stands for the block there is the overlay's first rendered column. The start overlays hold
      // the first columns and never miss the block's origin.
      if (
        INLINE_END_CLONE_TYPES.includes(this.name) &&
        typeof lastColumn === 'number' &&
        column >= 0 &&
        this.isColumnBeforeRenderedColumns(column) &&
        !this.isColumnBeforeRenderedColumns(lastColumn)
      ) {
        column = this.getFirstRenderedColumn();
      }
    }

    // The bottom clones derive their rendered band from the live settings (`stickyRowsBottom`), but the element
    // is resolved through the filter and the TBODY of the last draw. After `loadData()` or a row removal, and
    // before the render that follows, the band names rows the clone's DOM does not hold yet: the lookup below
    // would throw, or answer the cell of another row. The row is not rendered as far as the DOM is concerned.
    if (row >= 0 && hasStaleBottomBand(this)) {
      return this.rowFilter !== null && row < this.rowFilter.offset ? -1 : -2;
    }

    // The same for a top clone, whose count of rows follows the live settings while its DOM is the last draw's.
    if (row >= 0 && isBeyondDrawnTopRows(this, row)) {
      return -2;
    }

    if (this.isRowBeforeRenderedRows(row)) {
      // row before rendered rows
      return -1;

    } else if (this.isRowAfterRenderedRows(row)) {
      // row after rendered rows
      return -2;

    } else if (this.isColumnBeforeRenderedColumns(column)) {
      // column before rendered columns
      return -3;

    } else if (this.isColumnAfterRenderedColumns(column)) {
      // column after rendered columns
      return -4;
    }

    const TR = this.getRow(row);

    if (!TR && row >= 0) {
      throwWithCause('TR was expected to be rendered but is not');
    }

    const trElement = TR !== false ? TR : null;
    const TD = trElement?.childNodes[this.columnFilter!.sourceColumnToVisibleRowHeadedColumn(column)];

    if (!TD && column >= 0) {
      throwWithCause('TD or TH was expected to be rendered but is not');
    }

    // TD is a TD/TH HTMLElement guaranteed by DOM structure. TypeScript cannot narrow ChildNode
    // to HTMLElement without instanceof, but adding a throw here would change the existing contract
    // for negative column (header) lookups where TD may be undefined.
    return TD as HTMLElement;
  },

  /**
   * Get the DOM element of the row with the provided index.
   *
   * @param {number} rowIndex Row index.
   * @returns {HTMLTableRowElement|boolean} Return the row's DOM element or `false` if the row with the
   * provided index doesn't exist.
   * @this Table
   */
  getRow(this: Table, rowIndex: number): HTMLTableRowElement | false {
    let renderedRowIndex = null;
    let parentElement = null;

    if (rowIndex < 0) {
      renderedRowIndex = this.rowFilter?.sourceRowToVisibleColHeadedRow(rowIndex);
      parentElement = this.THEAD;

    } else {
      renderedRowIndex = this.rowFilter?.sourceToRendered(rowIndex);
      parentElement = this.TBODY;
    }

    if (renderedRowIndex !== undefined && renderedRowIndex !== null && parentElement !== null) {
      if (parentElement.childNodes.length < renderedRowIndex + 1) {
        return false;

      } else {
        return parentElement.childNodes[renderedRowIndex] as HTMLTableRowElement;
      }
    }

    return false;
  },

  /**
   * GetColumnHeader.
   *
   * @param {number} col Column index.
   * @param {number} [level=0] Header level (0 = most distant to the table).
   * @returns {object} HTMLElement on success or undefined on error.
   * @this Table
   */
  getColumnHeader(this: Table, col: number, level = 0): HTMLElement | undefined {
    const TR = this.THEAD!.childNodes[level];
    const TH = TR?.childNodes[this.columnFilter!.sourceColumnToVisibleRowHeadedColumn(col)];

    return isHTMLElement(TH) ? TH : undefined;
  },

  /**
   * Gets all columns headers (TH elements) from the table.
   *
   * @param {number} column A source column index.
   * @returns {HTMLTableCellElement[]}
   * @this Table
   */
  getColumnHeaders(this: Table, column: number): HTMLTableCellElement[] {
    const THs: HTMLTableCellElement[] = [];
    const visibleColumn = this.columnFilter!.sourceColumnToVisibleRowHeadedColumn(column);

    this.THEAD!.childNodes.forEach((TR: ChildNode) => {
      const TH = TR.childNodes[visibleColumn];

      if (isHTMLTableCellElement(TH)) {
        THs.push(TH);
      }
    });

    return THs;
  },

  /**
   * GetRowHeader.
   *
   * @param {number} row Row index.
   * @param {number} [level=0] Header level (0 = most distant to the table).
   * @returns {HTMLElement} HTMLElement on success or Number one of the exit codes on error: `null table
   *   doesn't have row headers`.
   * @this Table
   */
  getRowHeader(this: Table, row: number, level = 0): HTMLElement | undefined {
    // Zero for the end clones, which render no row headers.
    const rowHeadersCount = this.getRowHeadersCount();

    if (level >= rowHeadersCount) {
      return undefined;
    }

    const renderedRow = this.rowFilter!.sourceToRendered(row);
    const visibleRow = renderedRow < 0 ? this.rowFilter!.sourceRowToVisibleColHeadedRow(row) : renderedRow;
    const parentElement = renderedRow < 0 ? this.THEAD : this.TBODY;
    const TR = parentElement?.childNodes[visibleRow];
    const TH = TR?.childNodes[level];

    return isHTMLElement(TH) ? TH : undefined;
  },

  /**
   * Gets all rows headers (TH elements) from the table.
   *
   * @param {number} row A source row index.
   * @returns {HTMLTableCellElement[]}
   * @this Table
   */
  getRowHeaders(this: Table, row: number): ChildNode[] {
    const THs = [];
    // Zero for the end clones, which render no row headers.
    const rowHeadersCount = this.getRowHeadersCount();

    for (let renderedRowIndex = 0; renderedRowIndex < rowHeadersCount; renderedRowIndex++) {
      const TR = this.TBODY!.childNodes[this.rowFilter!.sourceToRendered(row)];
      const TH = TR?.childNodes[renderedRowIndex];

      if (TH) {
        THs.push(TH);
      }
    }

    return THs;
  },

  /**
   * Returns cell coords object for a given TD (or a child element of a TD element).
   *
   * @param {HTMLTableCellElement} TD A cell DOM element (or a child of one).
   * @returns {CellCoords|null} The coordinates of the provided TD element (or the closest TD element) or
   *   null, if the provided element is not applicable.
   * @this Table
   */
  getCoords(this: Table, TD: HTMLTableCellElement | HTMLElement): CellCoords | null {
    let cellElement: HTMLElement | null = TD;

    if (cellElement.nodeName !== 'TD' && cellElement.nodeName !== 'TH') {
      cellElement = closest(cellElement, ['TD', 'TH']);
    }

    if (cellElement === null) {
      return null;
    }

    const TR = cellElement.parentNode;

    if (!TR) {
      return null;
    }

    const CONTAINER = TR.parentNode as (Node & ParentNode) | null;

    if (!CONTAINER) {
      return null;
    }

    let row = isHTMLElement(TR) ? index(TR) : 0;
    let col = isHTMLTableCellElement(cellElement) ? cellElement.cellIndex : 0;

    if (overlayContainsElement(CLONE_TOP_INLINE_START_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_TOP_INLINE_END_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_TOP, cellElement, this.wtRootElement)) {
      if (CONTAINER.nodeName === 'THEAD') {
        row -= CONTAINER.childNodes.length;
      }

    } else if (overlayContainsElement(CLONE_BOTTOM_INLINE_START_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_BOTTOM_INLINE_END_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_BOTTOM, cellElement, this.wtRootElement)) {
      const totalRows = this.wtSettings.getSetting<number>('totalRows');

      row = totalRows - CONTAINER.childNodes.length + row;

    } else if (CONTAINER === this.THEAD) {
      row = this.rowFilter!.visibleColHeadedRowToSourceRow(row);

    } else if (this.rowFilter) {
      row = this.rowFilter!.renderedToSource(row);
    }

    if (overlayContainsElement(CLONE_TOP_INLINE_START_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_INLINE_START, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_BOTTOM_INLINE_START_CORNER, cellElement, this.wtRootElement)) {
      col = this.columnFilter!.offsettedTH(col);

    } else if (overlayContainsElement(CLONE_TOP_INLINE_END_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_INLINE_END, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_BOTTOM_INLINE_END_CORNER, cellElement, this.wtRootElement)) {
      // The end clones render the LAST columns and no row headers, so the first cell is the first end column.
      col = this.wtSettings.getSetting<number>('totalColumns') -
        this.wtSettings.getSetting<number>('fixedColumnsEnd') + col;

    } else if (this.columnFilter) {
      col = this.columnFilter!.visibleRowHeadedColumnToSourceColumn(col);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const hookResult = this.wtSettings
      .getSetting('onModifyGetCoordsElement', row, col);

    if (hookResult && Array.isArray(hookResult)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [row, col] = hookResult;
    }

    return this.wot.createCellCoords(row, col);
  },

  /**
   * Returns the TR element for the provided visual row index.
   *
   * @param {number} row The visual row index.
   * @returns {HTMLTableRowElement}
   * @this Table
   */
  getTrForRow(this: Table, row: number): HTMLTableRowElement {
    return this.TBODY!.childNodes[this.rowFilter!.sourceToRendered(row)] as HTMLTableRowElement;
  },
};

defineGetter(cellAccess, 'MIXIN_NAME', 'cellAccess', {
  writable: false,
  enumerable: false,
});

export { cellAccess };
