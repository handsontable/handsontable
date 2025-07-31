import { BaseTransformation } from './_base';

/**
 * The ExtenderTransformation class implements algorithms for transforming coordinates while the
 * selection is being extended or shrunk. Table size defines the bounds for the selection extent.
 *
 * @class ExtenderTransformation
 * @private
 */
export class ExtenderTransformation extends BaseTransformation {
  /**
   * Calculates offset coordinates for extender selection.
   *
   * @returns {{x: number, y: number}}
   */
  calculateOffset() {
    return {
      x: this.tableApi.navigableHeaders() ? this.tableApi.countRowHeaders() : 0,
      y: this.tableApi.navigableHeaders() ? this.tableApi.countColHeaders() : 0,
    };
  }

  /**
   * Gets the count of renderable rows for extender transformation.
   * Extender transformation operates on the full table size.
   *
   * @returns {number}
   */
  countRenderableRows() {
    return this.tableApi.countRenderableRows();
  }

  /**
   * Gets the count of renderable columns for extender transformation.
   * Extender transformation operates on the full table size.
   *
   * @returns {number}
   */
  countRenderableColumns() {
    return this.tableApi.countRenderableColumns();
  }

  /**
   * Changes the behavior of the transformation logic by not switching the selection layer
   * when the selection is out of range.
   *
   * @returns {boolean}
   */
  shouldSwitchSelectionLayer() {
    return false;
  }
}
