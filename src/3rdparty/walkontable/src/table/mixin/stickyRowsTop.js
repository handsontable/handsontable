import { defineGetter } from '../../../../../helpers/object';

const MIXIN_NAME = 'stickyRowsTop';

/**
 * @type {Object}
 */
const stickyRowsTop = {
  getFirstRenderedRow() {
    const totalRows = this.wot.getSetting('totalRows');

    if (totalRows === 0) {
      return -1;
    }
    return 0;
  },

  getFirstVisibleRow() {
    return this.getFirstRenderedRow();
  },

  /**
   * @returns {Number} Returns -1 if no row is visible, otherwise source index of the last rendered row
   */
  getLastRenderedRow() {
    return this.getRenderedRowsCount() - 1;
  },

  /**
   * @returns {Number} Returns source index of last visible row
   */
  getLastVisibleRow() {
    return this.getLastRenderedRow();
  },

  getRenderedRowsCount() {
    const totalRows = this.wot.getSetting('totalRows');

    return Math.min(this.wot.getSetting('fixedRowsTop'), totalRows);
  },

  getVisibleRowsCount() {
    return this.getRenderedRowsCount();
  }
};

defineGetter(stickyRowsTop, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default stickyRowsTop;
