/**
 * The row and column range-query PORT interfaces for `Table` and its subclasses.
 *
 * These describe the contract for reporting the rendered / visible / partially-visible range. The
 * calculator-backed implementation lives in `./virtualRange` (the `rowRangeQuery` / `columnRangeQuery`
 * mixin objects); a table type that does not mix a group has no runtime implementation for it.
 *
 * The contract is an explicit pair of interfaces (`RowRangeQuery` / `ColumnRangeQuery`) merged onto
 * the `Table` type, instead of the loose per-method `declare` fields that used to sit on the class.
 */

/**
 * Row range queries — mixed into table types that render virtually along the vertical axis.
 */
export interface RowRangeQuery {
  getFirstRenderedRow(): number;
  getFirstVisibleRow(): number;
  getFirstPartiallyVisibleRow(): number;
  getLastRenderedRow(): number;
  getLastVisibleRow(): number;
  getLastPartiallyVisibleRow(): number;
  getRenderedRowsCount(): number;
  getVisibleRowsCount(): number;
  getColumnHeadersCount(): number;
}

/**
 * Column range queries — mixed into table types that render virtually along the horizontal axis.
 */
export interface ColumnRangeQuery {
  getFirstRenderedColumn(): number;
  getFirstVisibleColumn(): number;
  getFirstPartiallyVisibleColumn(): number;
  getLastRenderedColumn(): number;
  getLastVisibleColumn(): number;
  getLastPartiallyVisibleColumn(): number;
  getRenderedColumnsCount(): number;
  getVisibleColumnsCount(): number;
  getRowHeadersCount(): number;
}
