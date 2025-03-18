import { defineGetter } from '../../../../../helpers/object';

const MIXIN_NAME = 'stickyRowsTop';

/**
 * Mixin for the subclasses of `Table` with implementations of
 * helper methods that are related to rows.
 * This mixin is meant to be applied in the subclasses of `Table`
 * that use sticky rendering of the top rows in the vertical axis.
 *
 * @type {object}
 */
const stickyRowsTop = {
  /**
   * Get the source index of the first rendered row. If no rows are rendered, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getFirstRenderedRow() {
    const totalRows = this.wtSettings.getSetting('totalRows');

    if (totalRows === 0) {
      return -1;
    }

    return 0;
  },

  /**
   * Get the source index of the first row fully visible in the viewport. If no rows are fully visible, returns an error code: -1.
   * Assumes that all rendered rows are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getFirstVisibleRow() {
    return this.getFirstRenderedRow();
  },

  /**
   * Get the source index of the first row partially visible in the viewport. If no rows are partially visible, returns an error code: -1.
   * Assumes that all rendered rows are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getFirstPartiallyVisibleRow() {
    return this.getFirstRenderedRow();
  },

  /**
   * Get the source index of the last rendered row. If no rows are rendered, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getLastRenderedRow() {
    return this.getRenderedRowsCount() - 1;
  },

  /**
   * Get the source index of the last row fully visible in the viewport. If no rows are fully visible, returns an error code: -1.
   * Assumes that all rendered rows are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getLastVisibleRow() {
    return this.getLastRenderedRow();
  },

  /**
   * Get the source index of the last row partially visible in the viewport. If no rows are partially visible, returns an error code: -1.
   * Assumes that all rendered rows are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getLastPartiallyVisibleRow() {
    return this.getLastRenderedRow();
  },

  /**
   * Get the number of rendered rows.
   *
   * @returns {number}
   * @this Table
   */
  getRenderedRowsCount() {
    const totalRows = this.wtSettings.getSetting('totalRows');

    return Math.min(this.wtSettings.getSetting('fixedRowsTop'), totalRows);
  },

  /**
   * Get the number of fully visible rows in the viewport.
   * Assumes that all rendered rows are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getVisibleRowsCount() {
    return this.getRenderedRowsCount();
  },

  /**
   * Get the number of rendered column headers.
   *
   * @returns {number}
   * @this Table
   */
  getColumnHeadersCount() {
    return this.dataAccessObject.columnHeaders.length;
  }
};

defineGetter(stickyRowsTop, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default stickyRowsTop;
