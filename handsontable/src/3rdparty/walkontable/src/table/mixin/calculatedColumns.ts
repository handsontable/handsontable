import { defineGetter } from '../../../../../helpers/object';
import type Table from '../../table';

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
  getFirstRenderedColumn(this: Table): number {
    const startColumn = this.deps.getWtViewport().columnsRenderCalculator?.startColumn ?? null;

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
  getFirstVisibleColumn(this: Table): number {
    const startColumn = this.deps.getWtViewport().columnsVisibleCalculator?.startColumn ?? null;

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
  getFirstPartiallyVisibleColumn(this: Table): number {
    const startColumn = this.deps.getWtViewport().columnsPartiallyVisibleCalculator?.startColumn ?? null;

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
  getLastRenderedColumn(this: Table): number {
    const endColumn = this.deps.getWtViewport().columnsRenderCalculator?.endColumn ?? null;

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
  getLastVisibleColumn(this: Table): number {
    const endColumn = this.deps.getWtViewport().columnsVisibleCalculator?.endColumn ?? null;

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
  getLastPartiallyVisibleColumn(this: Table): number {
    const endColumn = this.deps.getWtViewport().columnsPartiallyVisibleCalculator?.endColumn ?? null;

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
  getRenderedColumnsCount(this: Table): number {
    return this.deps.getWtViewport().columnsRenderCalculator?.count ?? 0;
  },

  /**
   * Get the number of fully visible columns in the viewport.
   *
   * @returns {number}
   * @this Table
   */
  getVisibleColumnsCount(this: Table): number {
    return this.deps.getWtViewport().columnsVisibleCalculator?.count ?? 0;
  },

  /**
   * Get the number of rendered row headers.
   *
   * @returns {number}
   * @this Table
   */
  getRowHeadersCount(this: Table): number {
    return this.deps.getRowHeaders().length;
  },
};

defineGetter(calculatedColumns, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default calculatedColumns;
