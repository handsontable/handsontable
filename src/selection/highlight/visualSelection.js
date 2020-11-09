import { Selection, CellCoords, CellRange } from './../../3rdparty/walkontable/src';

class VisualSelection extends Selection {
  constructor(...args) {
    super(...args);
    /**
     * Range of selection visually. Visual representation may have representation in a rendered selection.
     *
     * @type {null|CellRange}
     */
    this.visualCellRange = null;
  }
  /**
   * Adds a cell coords to the selection.
   *
   * @param {CellCoords} coords Visual coordinates of a cell.
   * @returns {VisualSelection}
   */
  add(coords) {
    if (this.visualCellRange === null) {
      this.visualCellRange = new CellRange(coords);

    } else {
      this.visualCellRange.expand(coords);
    }

    return this;
  }

  /**
   * Clears visual and renderable selection.
   *
   * @returns {VisualSelection}
   */
  clear() {
    this.visualCellRange = null;

    return super.clear();
  }

  /**
   * Search for the first visible coordinates in the range as range may start and/or end with the hidden index.
   *
   * @private
   * @param {CellCoords} startCoords Visual start coordinates for the range. Starting point for finding destination coordinates
   * with visible coordinates (we are going from the starting coordinates to the end coordinates until the criteria are met).
   * @param {CellCoords} endCoords Visual end coordinates for the range.
   * @param {number} incrementByRow We are searching for a next visible rows by increasing (to be precise, or decreasing) indexes.
   * This variable represent indexes shift. We are looking for an index:
   * - for rows: from the left to the right (increasing indexes, then variable should have value 1) or
   * other way around (decreasing indexes, then variable should have the value -1)
   * - for columns: from the top to the bottom (increasing indexes, then variable should have value 1)
   * or other way around (decreasing indexes, then variable should have the value -1).
   * @param {number} incrementByColumn As above, just indexes shift for columns.
   * @returns {null|CellCoords} Visual cell coordinates.
   */
  findVisibleCoordsInRange(startCoords, endCoords, incrementByRow, incrementByColumn = incrementByRow) {
    const { row: startRow, col: startCol } = startCoords;
    const { row: endRow, col: endCol } = endCoords;
    const { row: startRowRenderable, col: startColumnRenderable } = this.settings.visualToRenderableCoords(startCoords);

    // There are no more visual rows in the range.
    if (endRow === startRow && startRowRenderable === null) {
      return null;
    }

    // There are no more visual columns in the range.
    if (endCol === startCol && startColumnRenderable === null) {
      return null;
    }

    // We are looking for next visible row and column in the range.
    if (startRowRenderable === null && startColumnRenderable === null) {
      return this.findVisibleCoordsInRange(new CellCoords(
        startRow + incrementByRow, startCol + incrementByColumn), endCoords, incrementByRow, incrementByColumn);
    }

    // We are looking for a next visible row in the range.
    if (startRowRenderable === null) {
      return this.findVisibleCoordsInRange(new CellCoords(
        startRow + incrementByRow, startCol), endCoords, incrementByRow, incrementByColumn);
    }

    // We are looking for a next visible column in the range.
    if (startColumnRenderable === null) {
      return this.findVisibleCoordsInRange(new CellCoords(
        startRow, startCol + incrementByColumn), endCoords, incrementByRow, incrementByColumn);
    }

    // We found visible coords in the range.
    return startCoords;
  }

  /**
   * Override internally stored visual indexes added by the Selection's `add` function. It should be executed
   * at the end of process of adding visual selection coordinates.
   *
   * @returns {VisualSelection}
   */
  commit() {
    // There is no information about visual ranges, thus no selection may be displayed.
    if (this.visualCellRange === null) {
      return this;
    }

    // We may move in two different directions while searching for visible rows and visible columns.
    const incrementByRow = this.getRowSearchDirection(this.visualCellRange);
    const incrementByColumn = this.getColumnSearchDirection(this.visualCellRange);
    const fromRangeVisual = this.findVisibleCoordsInRange(
      this.visualCellRange.from, this.visualCellRange.to, incrementByRow, incrementByColumn);
    const toRangeVisual = this.findVisibleCoordsInRange(
      this.visualCellRange.to, this.visualCellRange.from, -incrementByRow, -incrementByColumn);

    // There is no visual start point (and also visual end point) in the range. We are looking for the first visible cell in a broader range.
    if (fromRangeVisual === null) {
      this.cellRange = null;

      return this;
    }

    const fromRangeRenderable = this.settings.visualToRenderableCoords(fromRangeVisual);
    const toRangeRenderable = this.settings.visualToRenderableCoords(toRangeVisual);

    this.cellRange = new CellRange(fromRangeRenderable, fromRangeRenderable, toRangeRenderable);

    return this;
  }

  /**
   * Some selection may be a part of broader cell range. This function adjusting coordinates of current selection
   * and the broader cell range when needed (current selection can't be presented visually).
   *
   * @param {CellRange} broaderCellRange Actual cell range may be contained in the broader cell range. When there is
   * no way to represent some cell range visually we try to find range containing just the first visible cell.
   *
   * Warn: Please keep in mind that this function may change coordinates of the handled broader range.
   *
   * @returns {VisualSelection}
   */
  adjustCoordinates(broaderCellRange) {
    // We can't show selection visually now, but we try to find fist visible range in the broader cell range.
    if (this.cellRange === null && broaderCellRange) {
      // We may move in two different directions while searching for visible rows and visible columns.
      const incrementByRow = this.getRowSearchDirection(broaderCellRange);
      const incrementByColumn = this.getColumnSearchDirection(broaderCellRange);
      const singleCellRangeVisual =
        this.findVisibleCoordsInRange(broaderCellRange.from, broaderCellRange.to, incrementByRow, incrementByColumn);

      if (singleCellRangeVisual !== null) {
        const singleCellRangeRenderable = this.settings.visualToRenderableCoords(singleCellRangeVisual);

        this.cellRange = new CellRange(singleCellRangeRenderable);

        broaderCellRange.setHighlight(singleCellRangeVisual);

        return this;
      }
    }

    broaderCellRange.setHighlight(broaderCellRange.from); // Fallback to the start of the range.

    return this;
  }

  /**
   * Returns the top left (TL) and bottom right (BR) selection coordinates (visual indexes).
   *
   * @returns {Array} Returns array of coordinates for example `[1, 1, 5, 5]`.
   */
  getVisualCorners() {
    const topLeft = this.settings.renderableToVisualCoords(this.cellRange.getTopLeftCorner());
    const bottomRight = this.settings.renderableToVisualCoords(this.cellRange.getBottomRightCorner());

    return [
      topLeft.row,
      topLeft.col,
      bottomRight.row,
      bottomRight.col,
    ];
  }

  /**
   * It returns rows shift needed for searching visual row.
   *
   * @private
   * @param {CellRange} cellRange Selection range.
   * @returns {number} Rows shift. It return 1 when we should increase indexes (moving from the top to the bottom) or
   * -1 when we should decrease indexes (moving other way around).
   */
  getRowSearchDirection(cellRange) {
    if (cellRange.from.row < cellRange.to.row) {
      return 1; // Increasing row indexes.
    }

    return -1; // Decreasing row indexes.
  }

  /**
   * It returns columns shift needed for searching visual column.
   *
   * @private
   * @param {CellRange} cellRange Selection range.
   * @returns {number} Columns shift. It return 1 when we should increase indexes (moving from the left to the right) or
   * -1 when we should decrease indexes (moving other way around).
   */
  getColumnSearchDirection(cellRange) {
    if (cellRange.from.col < cellRange.to.col) {
      return 1; // Increasing column indexes.
    }

    return -1; // Decreasing column indexes.
  }
}

export default VisualSelection;
