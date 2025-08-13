import { BaseTransformation } from './_base';

/**
 * The FocusTransformation class implements algorithms for transforming coordinates while the
 * focus is being moved. The currently selection layer range defines the bounds for the focus movement.
 *
 * @class FocusTransformation
 * @private
 */
export class FocusTransformation extends BaseTransformation {
  /**
   * Calculates offset coordinates for focus selection based on the current selection state.
   * For header focus selection, calculates offset including headers.
   * For cell focus selection, calculates offset only for selected cells.
   *
   * @returns {{x: number, y: number}}
   */
  calculateOffset() {
    const range = this.getCurrentSelection();
    const { row, col } = range.getOuterTopStartCorner();
    const columnsInRange = this.tableApi.countRenderableColumnsInRange(0, col - 1);
    const rowsInRange = this.tableApi.countRenderableRowsInRange(0, row - 1);
    const isHeaderSelection = range.highlight.isHeader();
    const headerX = isHeaderSelection ? Math.abs(col) : 0;
    const headerY = isHeaderSelection ? Math.abs(row) : 0;

    return {
      x: col < 0 ? headerX : -columnsInRange,
      y: row < 0 ? headerY : -rowsInRange
    };
  }

  /**
   * Gets the count of renderable rows for focus transformation.
   * Focus transformation operates on the current selection range.
   *
   * @returns {number}
   */
  countRenderableRows() {
    const range = this.getCurrentSelection();

    return this.tableApi.countRenderableRowsInRange(0, range.getOuterBottomEndCorner().row);
  }

  /**
   * Gets the count of renderable columns for focus transformation.
   * Focus transformation operates on the current selection range.
   *
   * @returns {number}
   */
  countRenderableColumns() {
    const range = this.getCurrentSelection();

    return this.tableApi.countRenderableColumnsInRange(0, range.getOuterBottomEndCorner().col);
  }

  /**
   * Throws an error because focus transformation doesn't support `transformEnd`.
   */
  transformEnd() {
    throw new Error('`transformEnd` is not valid for focus selection use `transformStart` instead', { cause: { handsontable: true } });
  }

  /**
   * Changes the behavior of the transformation logic by switching the selection layer
   * when the selection is out of range.
   *
   * @returns {boolean}
   */
  shouldSwitchSelectionLayer() {
    return true;
  }
}
