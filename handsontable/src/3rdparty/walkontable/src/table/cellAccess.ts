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
  CLONE_TOP_INLINE_START_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
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
      [row, column] = hookResult;
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
    const rowHeadersCount = this.wtSettings.getSetting<Function[]>('rowHeaders').length;

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
    const rowHeadersCount = this.wtSettings.getSetting<Function[]>('rowHeaders').length;

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
      || overlayContainsElement(CLONE_TOP, cellElement, this.wtRootElement)) {
      if (CONTAINER.nodeName === 'THEAD') {
        row -= CONTAINER.childNodes.length;
      }

    } else if (overlayContainsElement(CLONE_BOTTOM_INLINE_START_CORNER, cellElement, this.wtRootElement)
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
