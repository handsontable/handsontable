import { defineGetter } from '../../../../../helpers/object';

const MIXIN_NAME = 'calculatedColumns';

/**
 * Mixin for the subclasses of `Table` with implementations of
 * helper methods that are related to columns.
 * This mixin is meant to be applied in the subclasses of `Table`
 * that use virtual rendering in the horizontal axis.
 *
 * @type {object}
 */
const calculatedColumns = {
  /**
   * Get the source index of the first rendered column. If no columns are rendered, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getFirstRenderedColumn() {
    const startColumn = this.dataAccessObject.startColumnRendered;

    if (startColumn === null) {
      return -1;
    }

    return startColumn;
  },

  /**
   * Get the source index of the first column fully visible in the viewport. If no columns are fully visible, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getFirstVisibleColumn() {
    const startColumn = this.dataAccessObject.startColumnVisible;

    if (startColumn === null) {
      return -1;
    }

    return startColumn;
  },

  /**
   * Get the source index of the first column partially visible in the viewport. If no columns are partially visible, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getFirstPartiallyVisibleColumn() {
    const startColumn = this.dataAccessObject.startColumnPartiallyVisible;

    if (startColumn === null) {
      return -1;
    }

    return startColumn;
  },

  /**
   * Get the source index of the last rendered column. If no columns are rendered, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getLastRenderedColumn() {
    const endColumn = this.dataAccessObject.endColumnRendered;

    if (endColumn === null) {
      return -1;
    }

    return endColumn;
  },

  /**
   * Get the source index of the last column fully visible in the viewport. If no columns are fully visible, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getLastVisibleColumn() {
    const endColumn = this.dataAccessObject.endColumnVisible;

    if (endColumn === null) {
      return -1;
    }

    return endColumn;
  },

  /**
   * Get the source index of the last column partially visible in the viewport. If no columns are partially visible, returns an error code: -1.
   *
   * @returns {number}
   * @this Table
   */
  getLastPartiallyVisibleColumn() {
    const endColumn = this.dataAccessObject.endColumnPartiallyVisible;

    if (endColumn === null) {
      return -1;
    }

    return endColumn;
  },

  /**
   * Get the number of rendered columns.
   *
   * @returns {number}
   * @this Table
   */
  getRenderedColumnsCount() {
    return this.dataAccessObject.countColumnsRendered;
  },

  /**
   * Get the number of fully visible columns in the viewport.
   *
   * @returns {number}
   * @this Table
   */
  getVisibleColumnsCount() {
    return this.dataAccessObject.countColumnsVisible;
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

defineGetter(calculatedColumns, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default calculatedColumns;
