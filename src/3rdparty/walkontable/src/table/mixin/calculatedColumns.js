import { defineGetter } from '../../../../../helpers/object';

const MIXIN_NAME = 'calculatedColumns';

/**
 * @type {Object}
 */
const calculatedColumns = {
  getFirstRenderedColumn() {
    const startColumn = this.wot.wtViewport.columnsRenderCalculator.startColumn;

    if (startColumn === null) {
      return -1;
    }
    return startColumn;
  },

  /**
   * @returns {Number} Returns -1 if no row is visible
   */
  getFirstVisibleColumn() {
    const startColumn = this.wot.wtViewport.columnsVisibleCalculator.startColumn;

    if (startColumn === null) {
      return -1;
    }
    return startColumn;
  },

  /**
   * @returns {Number} Returns source index of last rendered column
   */
  getLastRenderedColumn() {
    const endColumn = this.wot.wtViewport.columnsRenderCalculator.endColumn;

    if (endColumn === null) {
      return -1;
    }
    return endColumn;
  },

  /**
   * @returns {Number} Returns -1 if no column is visible, otherwise source index of the last visible column
   */
  getLastVisibleColumn() {
    const endColumn = this.wot.wtViewport.columnsVisibleCalculator.endColumn;

    if (endColumn === null) {
      return -1;
    }
    return endColumn;
  },

  getRenderedColumnsCount() {
    return this.wot.wtViewport.columnsRenderCalculator.count;
  },

  getVisibleColumnsCount() {
    return this.wot.wtViewport.columnsVisibleCalculator.count;
  }
};

defineGetter(calculatedColumns, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default calculatedColumns;
