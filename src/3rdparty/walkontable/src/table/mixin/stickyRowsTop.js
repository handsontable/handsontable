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
   */
  getFirstRenderedRow() {
    const totalRows = this.wot.getSetting('totalRows');

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
   */
  getFirstVisibleRow() {
    return this.getFirstRenderedRow();
  },

  /**
   * Get the source index of the last rendered row. If no rows are rendered, returns an error code: -1.
   *
   * @returns {number}
   */
  getLastRenderedRow() {
    return this.getRenderedRowsCount() - 1;
  },

  /**
   * Get the source index of the last row fully visible in the viewport. If no rows are fully visible, returns an error code: -1.
   * Assumes that all rendered rows are fully visible.
   *
   * @returns {number}
   */
  getLastVisibleRow() {
    return this.getLastRenderedRow();
  },

  /**
   * Get the number of rendered rows.
   *
   * @returns {number}
   */
  getRenderedRowsCount() {
    const totalRows = this.wot.getSetting('totalRows');

    return Math.min(this.wot.getSetting('fixedRowsTop'), totalRows);
  },

  /**
   * Get the number of fully visible rows in the viewport.
   * Assumes that all rendered rows are fully visible.
   *
   * @returns {number}
   */
  getVisibleRowsCount() {
    return this.getRenderedRowsCount();
  }
};

defineGetter(stickyRowsTop, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default stickyRowsTop;
