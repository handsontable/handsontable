import { defineGetter } from '../../../../../helpers/object';

const MIXIN_NAME = 'stickyColumnsLeft';

/**
 * Mixin for the subclasses of `Table` with implementations of
 * helper methods that are related to columns.
 * This mixin is meant to be applied in the subclasses of `Table`
 * that use sticky rendering of the first columns in the horizontal axis.
 *
 * @type {object}
 */
const stickyColumnsLeft = {
  /**
   * Get the source index of the first rendered column. If no columns are rendered, returns an error code: -1.
   *
   * @returns {number}
   */
  getFirstRenderedColumn() {
    const totalColumns = this.wot.getSetting('totalColumns');

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
   */
  getFirstVisibleColumn() {
    return this.getFirstRenderedColumn();
  },

  /**
   * Get the source index of the last rendered column. If no columns are rendered, returns an error code: -1.
   *
   * @returns {number}
   */
  getLastRenderedColumn() {
    return this.getRenderedColumnsCount() - 1;
  },

  /**
   * Get the source index of the last column fully visible in the viewport. If no columns are fully visible, returns an error code: -1.
   * Assumes that all rendered columns are fully visible.
   *
   * @returns {number}
   */
  getLastVisibleColumn() {
    return this.getLastRenderedColumn();
  },

  /**
   * Get the number of rendered columns.
   *
   * @returns {number}
   */
  getRenderedColumnsCount() {
    const totalColumns = this.wot.getSetting('totalColumns');

    return Math.min(this.wot.getSetting('fixedColumnsLeft'), totalColumns);
  },

  /**
   * Get the number of fully visible columns in the viewport.
   * Assumes that all rendered columns are fully visible.
   *
   * @returns {number}
   */
  getVisibleColumnsCount() {
    return this.getRenderedColumnsCount();
  }
};

defineGetter(stickyColumnsLeft, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default stickyColumnsLeft;
