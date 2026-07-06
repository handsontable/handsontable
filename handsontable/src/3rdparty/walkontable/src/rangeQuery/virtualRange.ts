/**
 * Calculator-backed adapters for the range-query ports (`RowRangeQuery` / `ColumnRangeQuery`).
 *
 * These mixin objects implement the ports by reading the current render / visible / partially-visible
 * calculators off the viewport and reporting the rendered range. They used to live in two separate
 * files (`table/mixin/calculatedRows` and `table/mixin/calculatedColumns`).
 *
 * Selectivity is unchanged: `MasterTable` mixes both groups, the top/bottom overlays mix the column
 * group, the inline-start overlay mixes the row group, and the corner overlays mix neither. The mixin
 * objects are applied with the same `mixin()` helper the sticky-overlay mixins use, so a table type
 * that does not mix a group has no runtime implementation for it (calling one throws — exactly as
 * before). Each method reads the calculator fresh through `this.deps.getWtViewport()`, so the
 * per-draw calculator objects are never captured.
 */
import { defineGetter } from '../../../../helpers/object';
import type { default as Table } from '../table';
import type { RowRangeQuery, ColumnRangeQuery } from './renderedRange';

/**
 * Row range-query mixin. Implements `RowRangeQuery` by reading the current row calculators.
 *
 * @type {RowRangeQuery}
 */
const rowRangeQuery: RowRangeQuery = {
  /**
   * Get the source index of the first rendered row, or -1 when no rows are rendered.
   *
   * @returns {number}
   * @this Table
   */
  getFirstRenderedRow(this: Table): number {
    return this.deps.getWtViewport().rowsRenderCalculator?.startRow ?? -1;
  },

  /**
   * Get the source index of the first fully visible row, or -1 when none are.
   *
   * @returns {number}
   * @this Table
   */
  getFirstVisibleRow(this: Table): number {
    return this.deps.getWtViewport().rowsVisibleCalculator?.startRow ?? -1;
  },

  /**
   * Get the source index of the first partially visible row, or -1 when none are.
   *
   * @returns {number}
   * @this Table
   */
  getFirstPartiallyVisibleRow(this: Table): number {
    return this.deps.getWtViewport().rowsPartiallyVisibleCalculator?.startRow ?? -1;
  },

  /**
   * Get the source index of the last rendered row, or -1 when no rows are rendered.
   *
   * @returns {number}
   * @this Table
   */
  getLastRenderedRow(this: Table): number {
    return this.deps.getWtViewport().rowsRenderCalculator?.endRow ?? -1;
  },

  /**
   * Get the source index of the last fully visible row, or -1 when none are.
   *
   * @returns {number}
   * @this Table
   */
  getLastVisibleRow(this: Table): number {
    return this.deps.getWtViewport().rowsVisibleCalculator?.endRow ?? -1;
  },

  /**
   * Get the source index of the last partially visible row, or -1 when none are.
   *
   * @returns {number}
   * @this Table
   */
  getLastPartiallyVisibleRow(this: Table): number {
    return this.deps.getWtViewport().rowsPartiallyVisibleCalculator?.endRow ?? -1;
  },

  /**
   * Get the number of rendered rows.
   *
   * @returns {number}
   * @this Table
   */
  getRenderedRowsCount(this: Table): number {
    return this.deps.getWtViewport().rowsRenderCalculator?.count ?? 0;
  },

  /**
   * Get the number of fully visible rows.
   *
   * @returns {number}
   * @this Table
   */
  getVisibleRowsCount(this: Table): number {
    return this.deps.getWtViewport().rowsVisibleCalculator?.count ?? 0;
  },

  /**
   * Get the number of column headers.
   *
   * @returns {number}
   * @this Table
   */
  getColumnHeadersCount(this: Table): number {
    return this.deps.getColumnHeaders().length;
  },
};

defineGetter(rowRangeQuery, 'MIXIN_NAME', 'calculatedRows', {
  writable: false,
  enumerable: false,
});

/**
 * Column range-query mixin. Implements `ColumnRangeQuery` by reading the current column calculators.
 *
 * @type {ColumnRangeQuery}
 */
const columnRangeQuery: ColumnRangeQuery = {
  /**
   * Get the source index of the first rendered column, or -1 when no columns are rendered.
   *
   * @returns {number}
   * @this Table
   */
  getFirstRenderedColumn(this: Table): number {
    return this.deps.getWtViewport().columnsRenderCalculator?.startColumn ?? -1;
  },

  /**
   * Get the source index of the first fully visible column, or -1 when none are.
   *
   * @returns {number}
   * @this Table
   */
  getFirstVisibleColumn(this: Table): number {
    return this.deps.getWtViewport().columnsVisibleCalculator?.startColumn ?? -1;
  },

  /**
   * Get the source index of the first partially visible column, or -1 when none are.
   *
   * @returns {number}
   * @this Table
   */
  getFirstPartiallyVisibleColumn(this: Table): number {
    return this.deps.getWtViewport().columnsPartiallyVisibleCalculator?.startColumn ?? -1;
  },

  /**
   * Get the source index of the last rendered column, or -1 when no columns are rendered.
   *
   * @returns {number}
   * @this Table
   */
  getLastRenderedColumn(this: Table): number {
    return this.deps.getWtViewport().columnsRenderCalculator?.endColumn ?? -1;
  },

  /**
   * Get the source index of the last fully visible column, or -1 when none are.
   *
   * @returns {number}
   * @this Table
   */
  getLastVisibleColumn(this: Table): number {
    return this.deps.getWtViewport().columnsVisibleCalculator?.endColumn ?? -1;
  },

  /**
   * Get the source index of the last partially visible column, or -1 when none are.
   *
   * @returns {number}
   * @this Table
   */
  getLastPartiallyVisibleColumn(this: Table): number {
    return this.deps.getWtViewport().columnsPartiallyVisibleCalculator?.endColumn ?? -1;
  },

  /**
   * Get the number of rendered columns.
   *
   * @returns {number}
   * @this Table
   */
  getRenderedColumnsCount(this: Table): number {
    return this.deps.getWtViewport().columnsRenderCalculator?.count ?? 0;
  },

  /**
   * Get the number of fully visible columns.
   *
   * @returns {number}
   * @this Table
   */
  getVisibleColumnsCount(this: Table): number {
    return this.deps.getWtViewport().columnsVisibleCalculator?.count ?? 0;
  },

  /**
   * Get the number of row headers.
   *
   * @returns {number}
   * @this Table
   */
  getRowHeadersCount(this: Table): number {
    return this.deps.getRowHeaders().length;
  },
};

defineGetter(columnRangeQuery, 'MIXIN_NAME', 'calculatedColumns', {
  writable: false,
  enumerable: false,
});

export { rowRangeQuery, columnRangeQuery };
