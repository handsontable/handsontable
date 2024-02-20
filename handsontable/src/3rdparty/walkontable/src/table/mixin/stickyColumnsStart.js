import { defineGetter } from '../../../../../helpers/object';

const MIXIN_NAME = 'stickyColumnsStart';

/**
 * Mixin for the subclasses of `Table` with implementations of
 * helper methods that are related to columns.
 * This mixin is meant to be applied in the subclasses of `Table`
 * that use sticky rendering of the first columns in the horizontal axis.
 *
 * @type {object}
 */
const stickyColumnsStart = {
  /**
   * Get the source index of the first rendered column. If no columns are rendered, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getFirstRenderedColumn() {
    const totalColumns = this.wtSettings.getSetting('totalColumns');

    if (totalColumns === 0) {
      return -1;
    }

    return 0;
  },

  /**
   * Get the source index of the first column fully visible in the viewport. If no columns are fully visible, returns an error code: -1.
   * Assumes that all rendered columns are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getFirstVisibleColumn() {
    return this.getFirstRenderedColumn();
  },

  /**
   * Get the source index of the first column partially visible in the viewport. If no columns are partially visible, returns an error code: -1.
   * Assumes that all rendered columns are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getFirstPartiallyVisibleColumn() {
    return this.getFirstRenderedColumn();
  },

  /**
   * Get the source index of the last rendered column. If no columns are rendered, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getLastRenderedColumn() {
    return this.getRenderedColumnsCount() - 1;
  },

  /**
   * Get the source index of the last column fully visible in the viewport. If no columns are fully visible, returns an error code: -1.
   * Assumes that all rendered columns are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getLastVisibleColumn() {
    return this.getLastRenderedColumn();
  },

  /**
   * Get the source index of the last column partially visible in the viewport. If no columns are partially visible, returns an error code: -1.
   * Assumes that all rendered columns are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getLastPartiallyVisibleColumn() {
    return this.getLastRenderedColumn();
  },

  /**
   * Get the number of rendered columns.
   *
   * @returns {number}
   * @this Table
   */
  getRenderedColumnsCount() {
    const totalColumns = this.wtSettings.getSetting('totalColumns');

    return Math.min(this.wtSettings.getSetting('fixedColumnsStart'), totalColumns);
  },

  /**
   * Get the number of fully visible columns in the viewport.
   * Assumes that all rendered columns are fully visible.
   *
   * @returns {number}
   * @this Table
   */
  getVisibleColumnsCount() {
    return this.getRenderedColumnsCount();
  },

  /**
   * Get the number of rendered row headers.
   *
   * @returns {number}
   * @this Table
   */
  getRowHeadersCount() {
    return this.dataAccessObject.rowHeaders.length;
  },
};

defineGetter(stickyColumnsStart, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default stickyColumnsStart;
