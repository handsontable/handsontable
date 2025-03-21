import { defineGetter } from '../../../../../helpers/object';
import { Table } from '../../types';

const MIXIN_NAME = 'stickyRowsBottom';

/**
 * Mixin for the subclasses of `Table` with implementations of
 * helper methods that are related to rows.
 * This mixin is meant to be applied in the subclasses of `Table`
 * that use sticky rendering of the bottom rows in the vertical axis.
 *
 * @type {object}
 */
const stickyRowsBottom = {
  /**
   * Get the source index of the first rendered row. If no rows are rendered, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getFirstRenderedRow(this: Table): number {
    const totalRows = this.wtSettings.getSetting('totalRows');

    return Math.max(totalRows - this.wtSettings.getSetting('fixedRowsBottom'), 0);
  },

  /**
   * Get the source index of the first row fully visible in the viewport. If no rows are fully visible, returns an error code: -1.
   * Assumes that all rendered rows are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getFirstVisibleRow(this: Table): number {
    return this.getFirstRenderedRow();
  },

  /**
   * Get the source index of the first row partially visible in the viewport. If no rows are partially visible, returns an error code: -1.
   * Assumes that all rendered rows are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getFirstPartiallyVisibleRow(this: Table): number {
    return this.getFirstRenderedRow();
  },

  /**
   * Get the source index of the last rendered row. If no rows are rendered, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getLastRenderedRow(this: Table): number {
    return this.wtSettings.getSetting('totalRows') - 1;
  },

  /**
   * Get the source index of the last row fully visible in the viewport. If no rows are fully visible, returns an error code: -1.
   * Assumes that all rendered rows are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getLastVisibleRow(this: Table): number {
    return this.getLastRenderedRow();
  },

  /**
   * Get the source index of the last row partially visible in the viewport. If no rows are partially visible, returns an error code: -1.
   * Assumes that all rendered rows are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getLastPartiallyVisibleRow(this: Table): number {
    return this.getLastRenderedRow();
  },

  /**
   * Get the number of rendered rows.
   *
   * @returns {number}
   * @this Table
   */
  getRenderedRowsCount(this: Table): number {
    let result = this.wtSettings.getSetting('fixedRowsBottom');
    const totalRows = this.wtSettings.getSetting('totalRows');

    if (result > totalRows) {
      result = totalRows;
    }

    return result;
  },

  /**
   * Get the number of fully visible rows in the viewport.
   * Assumes that all rendered rows are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getVisibleRowsCount(this: Table): number {
    return this.getRenderedRowsCount();
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

defineGetter(stickyRowsBottom, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default stickyRowsBottom;
