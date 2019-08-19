import { defineGetter } from '../../../../../helpers/object';

const MIXIN_NAME = 'calculatedRows';

/**
 * @type {Object}
 */
const calculatedRows = {
  getFirstRenderedRow() {
    const startRow = this.wot.wtViewport.rowsRenderCalculator.startRow;
    if (startRow === null) {
      return -1;
    }
    return startRow;
  },

  getFirstVisibleRow() {
    return this.wot.wtViewport.rowsVisibleCalculator.startRow;
  },

  /**
   * @returns {Number} Returns -1 if no row is visible, otherwise source index of the last rendered row
   */
  getLastRenderedRow() {
    return this.wot.wtViewport.rowsRenderCalculator.endRow;
  },

  /**
   * @returns {Number} Returns source index of last visible row
   */
  getLastVisibleRow() {
    return this.wot.wtViewport.rowsVisibleCalculator.endRow;
  },

  getRenderedRowsCount() {
    return this.wot.wtViewport.rowsRenderCalculator.count;
  },

  getVisibleRowsCount() {
    return this.wot.wtViewport.rowsVisibleCalculator.count;
  }
};

defineGetter(calculatedRows, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default calculatedRows;
