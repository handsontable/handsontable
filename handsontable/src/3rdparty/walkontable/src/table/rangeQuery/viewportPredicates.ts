/**
 * Viewport / rendered-range predicates for `Table` and every subclass.
 *
 * These answer "is this row/column a header, before/after the rendered band, before/after the visible
 * band, fully visible, or entirely within the viewport" by reading the range-query outputs
 * (`getFirstRenderedRow`, `getLastVisibleColumn`, …) supplied by the `withRowRangeQuery` /
 * `withColumnRangeQuery` mixins plus the row/column filters and settings. They are universal — every
 * table type needs them — so the mixin is applied once to the base `Table` (`mixin(Table,
 * viewportPredicates)` in `baseTable.ts`) and inherited by all subclasses.
 *
 * Extracted from `baseTable.ts` (C3) to co-locate the rendered-range queries with the rest of the
 * range-query slice. Behavior is unchanged: the methods run on the `Table` instance (`this`), reading
 * the same public fields (`rowFilter`/`columnFilter`/`wtSettings`) and range-query methods as before.
 * They use no `#`-private state, so no `deps` getter is needed here.
 */
import type { default as Table } from '../baseTable';

/**
 * Viewport / rendered-range predicates, mixed into every `Table` type.
 */
export interface ViewportPredicates {
  isColumnHeaderRendered(column: number): boolean;
  isRowHeaderRendered(row: number): boolean;
  isRowBeforeRenderedRows(row: number): boolean;
  isRowAfterRenderedRows(row: number): boolean;
  isColumnBeforeRenderedColumns(column: number): boolean;
  isColumnAfterRenderedColumns(column: number): boolean | null;
  isColumnAfterViewport(column: number): boolean | null;
  isRowAfterViewport(row: number): boolean | null;
  isColumnBeforeViewport(column: number): boolean | null;
  isLastRowFullyVisible(): boolean;
  isLastColumnFullyVisible(): boolean;
  allRowsInViewport(): boolean;
  allColumnsInViewport(): boolean;
}

const viewportPredicates = {
  /**
   * Checks if the column index (negative value from -1 to N) is rendered.
   *
   * @param {number} column The column index (negative value from -1 to N).
   * @returns {boolean}
   * @this Table
   */
  isColumnHeaderRendered(this: Table, column: number) {
    if (column >= 0) {
      return false;
    }

    const rowHeaders = this.wtSettings.getSetting<Function[]>('rowHeaders');
    const rowHeadersCount = rowHeaders.length;

    return Math.abs(column) <= rowHeadersCount;
  },

  /**
   * Checks if the row index (negative value from -1 to N) is rendered.
   *
   * @param {number} row The row index (negative value from -1 to N).
   * @returns {boolean}
   * @this Table
   */
  isRowHeaderRendered(this: Table, row: number) {
    if (row >= 0) {
      return false;
    }

    const columnHeaders = this.wtSettings.getSetting<Function[]>('columnHeaders');
    const columnHeadersCount = columnHeaders.length;

    return Math.abs(row) <= columnHeadersCount;
  },

  /**
   * Check if the given row index is lower than the index of the first row that
   * is currently rendered and return TRUE in that case, or FALSE otherwise.
   *
   * Negative row index is used to check the columns' headers.
   *
   *  Headers
   *           +--------------+                                     │
   *       -3  │    │    │    │                                     │
   *           +--------------+                                     │
   *       -2  │    │    │    │                                     │ TRUE
   *           +--------------+                                     │
   *       -1  │    │    │    │                                     │
   *  Cells  +==================+                                   │
   *        0  ┇    ┇    ┇    ┇ <--- For fixedRowsTop: 1            │
   *           +--------------+      the master overlay do       ---+ first rendered row (index 1)
   *        1  │ A2 │ B2 │ C2 │      not render the first row.      │
   *           +--------------+                                     │ FALSE
   *        2  │ A3 │ B3 │ C3 │                                     │
   *           +--------------+                                  ---+ last rendered row
   *                                                                │
   *                                                                │ FALSE
   *
   * @param {number} row The visual row index.
   * @memberof Table#
   * @function isRowBeforeRenderedRows
   * @returns {boolean}
   * @this Table
   */
  isRowBeforeRenderedRows(this: Table, row: number) {
    const first = this.getFirstRenderedRow();

    // Check the headers only in case when the first rendered row is -1 or 0.
    // This is an indication that the overlay is placed on the most top position.
    if (row < 0 && first <= 0) {
      return !this.isRowHeaderRendered(row);
    }

    return row < first;
  },

  /**
   * Check if the given column index is greater than the index of the last column that
   * is currently rendered and return TRUE in that case, or FALSE otherwise.
   *
   * The negative row index is used to check the columns' headers. However,
   * keep in mind that for negative indexes, the method always returns FALSE as
   * it is not possible to render headers partially. The "after" index can not be
   * lower than -1.
   *
   *  Headers
   *           +--------------+                                     │
   *       -3  │    │    │    │                                     │
   *           +--------------+                                     │
   *       -2  │    │    │    │                                     │ FALSE
   *           +--------------+                                     │
   *       -1  │    │    │    │                                     │
   *  Cells  +==================+                                   │
   *        0  ┇    ┇    ┇    ┇ <--- For fixedRowsTop: 1            │
   *           +--------------+      the master overlay do       ---+ first rendered row (index 1)
   *        1  │ A2 │ B2 │ C2 │      not render the first rows      │
   *           +--------------+                                     │ FALSE
   *        2  │ A3 │ B3 │ C3 │                                     │
   *           +--------------+                                  ---+ last rendered row
   *                                                                │
   *                                                                │ TRUE
   *
   * @param {number} row The visual row index.
   * @memberof Table#
   * @function isRowAfterRenderedRows
   * @returns {boolean}
   * @this Table
   */
  isRowAfterRenderedRows(this: Table, row: number) {
    return row > this.getLastRenderedRow();
  },

  /**
   * Check if the given column index is lower than the index of the first column that
   * is currently rendered and return TRUE in that case, or FALSE otherwise.
   *
   * Negative column index is used to check the rows' headers.
   *
   *                            For fixedColumnsStart: 1 the master overlay
   *                            do not render this first columns.
   *  Headers    -3   -2   -1    |
   *           +----+----+----║┄ ┄ +------+------+
   *           │    │    │    ║    │  B1  │  C1  │
   *           +--------------║┄ ┄ --------------│
   *           │    │    │    ║    │  B2  │  C2  │
   *           +--------------║┄ ┄ --------------│
   *           │    │    │    ║    │  B3  │  C3  │
   *           +----+----+----║┄ ┄ +------+------+
   *                               ╷             ╷
   *      -------------------------+-------------+---------------->
   *          TRUE             first    FALSE   last         FALSE
   *                           rendered         rendered
   *                           column           column
   *
   * @param {number} column The visual column index.
   * @memberof Table#
   * @function isColumnBeforeRenderedColumns
   * @returns {boolean}
   * @this Table
   */
  isColumnBeforeRenderedColumns(this: Table, column: number) {
    const first = this.getFirstRenderedColumn();

    // Check the headers only in case when the first rendered column is -1 or 0.
    // This is an indication that the overlay is placed on the most left position.
    if (column < 0 && first <= 0) {
      return !this.isColumnHeaderRendered(column);
    }

    return column < first;
  },

  /**
   * Check if the given column index is greater than the index of the last column that
   * is currently rendered and return TRUE in that case, or FALSE otherwise.
   *
   * The negative column index is used to check the rows' headers. However,
   * keep in mind that for negative indexes, the method always returns FALSE as
   * it is not possible to render headers partially. The "after" index can not be
   * lower than -1.
   *
   *                            For fixedColumnsStart: 1 the master overlay
   *                            do not render this first columns.
   *  Headers    -3   -2   -1    |
   *           +----+----+----║┄ ┄ +------+------+
   *           │    │    │    ║    │  B1  │  C1  │
   *           +--------------║┄ ┄ --------------│
   *           │    │    │    ║    │  B2  │  C2  │
   *           +--------------║┄ ┄ --------------│
   *           │    │    │    ║    │  B3  │  C3  │
   *           +----+----+----║┄ ┄ +------+------+
   *                               ╷             ╷
   *      -------------------------+-------------+---------------->
   *          FALSE             first    FALSE   last         TRUE
   *                           rendered         rendered
   *                           column           column
   *
   * @param {number} column The visual column index.
   * @memberof Table#
   * @function isColumnAfterRenderedColumns
   * @returns {boolean}
   * @this Table
   */
  isColumnAfterRenderedColumns(this: Table, column: number) {
    return this.columnFilter && (column > this.getLastRenderedColumn());
  },

  /**
   * Checks if the column is after the last visible column.
   *
   * @param {number} column The visual column index.
   * @returns {boolean}
   * @this Table
   */
  isColumnAfterViewport(this: Table, column: number) {
    return this.columnFilter && (column > this.getLastVisibleColumn());
  },

  /**
   * Checks if the row is after the last visible row.
   *
   * @param {number} row The visual row index.
   * @returns {boolean}
   * @this Table
   */
  isRowAfterViewport(this: Table, row: number) {
    return this.rowFilter && (row > this.getLastVisibleRow());
  },

  /**
   * Checks if the column is before the first visible column.
   *
   * @param {number} column The visual column index.
   * @returns {boolean}
   * @this Table
   */
  isColumnBeforeViewport(this: Table, column: number) {
    return this.columnFilter && (this.columnFilter!.sourceToRendered(column) < 0 && column >= 0);
  },

  /**
   * Checks if the last row is fully visible.
   *
   * @returns {boolean}
   * @this Table
   */
  isLastRowFullyVisible(this: Table) {
    return this.getLastVisibleRow() === this.getLastRenderedRow();
  },

  /**
   * Checks if the last column is fully visible.
   *
   * @returns {boolean}
   * @this Table
   */
  isLastColumnFullyVisible(this: Table) {
    return this.getLastVisibleColumn() === this.getLastRenderedColumn();
  },

  /**
   * Checks if all rows fit in the viewport.
   *
   * @returns {boolean}
   * @this Table
   */
  allRowsInViewport(this: Table) {
    return this.wtSettings.getSetting('totalRows') === this.getVisibleRowsCount();
  },

  /**
   * Checks if all columns fit in the viewport.
   *
   * @returns {boolean}
   * @this Table
   */
  allColumnsInViewport(this: Table) {
    return this.wtSettings.getSetting('totalColumns') === this.getVisibleColumnsCount();
  },
};

export default viewportPredicates;
