import { defineGetter } from '../../../../../helpers/object';
import { Table } from '../../types';

const MIXIN_NAME = 'calculatedRows';

/**
 * Mixin for the subclasses of `Table` with implementations of
 * helper methods that are related to rows.
 * This mixin is meant to be applied in the subclasses of `Table`
 * that use virtual rendering in the vertical axis.
 *
 * @type {object}
 */
const calculatedRows = {
  /**
   * Get the source index of the first rendered row. If no rows are rendered, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getFirstRenderedRow(this: Table): number {
    const startRow = this.dataAccessObject.startRowRendered;

    if (startRow === null) {
      return -1;
    }

    return startRow;
  },

  /**
   * Get the source index of the first row fully visible in the viewport. If no rows are fully visible, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getFirstVisibleRow(this: Table): number {
    const startRow = this.dataAccessObject.startRowVisible;

    if (startRow === null) {
      return -1;
    }

    return startRow;
  },

  /**
   * Get the source index of the first row partially visible in the viewport. If no rows are partially visible, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getFirstPartiallyVisibleRow(this: Table): number {
    const startRow = this.dataAccessObject.startRowPartiallyVisible;

    if (startRow === null) {
      return -1;
    }

    return startRow;
  },

  /**
   * Get the source index of the last rendered row. If no rows are rendered, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getLastRenderedRow(this: Table): number {
    const endRow = this.dataAccessObject.endRowRendered;

    if (endRow === null) {
      return -1;
    }

    return endRow;
  },

  /**
   * Get the source index of the last row fully visible in the viewport. If no rows are fully visible, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getLastVisibleRow(this: Table): number {
    const endRow = this.dataAccessObject.endRowVisible;

    if (endRow === null) {
      return -1;
    }

    return endRow;
  },

  /**
   * Get the source index of the last row partially visible in the viewport. If no rows are partially visible, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getLastPartiallyVisibleRow(this: Table): number {
    const endRow = this.dataAccessObject.endRowPartiallyVisible;

    if (endRow === null) {
      return -1;
    }

    return endRow;
  },

  /**
   * Get the number of rendered rows.
   *
   * @returns {number}
   * @this Table
   */
  getRenderedRowsCount(this: Table): number {
    return this.dataAccessObject.countRowsRendered;
  },

  /**
   * Get the number of fully visible rows in the viewport.
   *
   * @returns {number}
   * @this Table
   */
  getVisibleRowsCount(this: Table): number {
    return this.dataAccessObject.countRowsVisible;
  },

  /**
   * Get the number of rendered column headers.
   *
   * @returns {number}
   * @this Table
   */
  getColumnHeadersCount(this: Table): number {
    return this.dataAccessObject.columnHeaders.length;
  },
};

defineGetter(calculatedRows, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default calculatedRows;
