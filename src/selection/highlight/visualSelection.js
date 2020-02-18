import { Selection, CellCoords } from './../../3rdparty/walkontable/src';
import CellRange from '../../3rdparty/walkontable/src/cell/range';

class VisualSelection extends Selection {
  constructor(...args) {
    super(...args);
    /**
     * Range of selection visually. Visual representation may have representation in a rendered selection.
     *
     * @type {null|Selection}
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
   * Clears selection.
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
   * @param {CellCoords} startCoords Start coordinates for the range. Starting point for finding destination coordinates
   * with visible coordinates (we are going from the starting coordinates to the end coordinates until the criteria are met).
   * @param {CellCoords} endCoords End coordinates for the range.
   * @param {number} incrementBy We are searching for a next visible indexes by increasing (to be precise, or decreasing) indexes.
   * This variable represent indexes shift. We are looking for an index:
   * - for rows: from the left to the right (increasing indexes, then variable should have value 1) or
   * other way around (decreasing indexes, then variable should have the value -1)
   * - for columns: from the top to the bottom (increasing indexes, then variable should have value 1)
   * or other way around (decreasing indexes, then variable should have the value -1).
   * @returns {null|CellCoords}
   */
  findVisibleCoordsInRange(startCoords, endCoords, incrementBy) {
    const { row: startRow, col: startCol } = startCoords;
    const { row: endRow, col: endCol } = endCoords;
    const { row: startRowTranslated, col: startColTranslated } = this.settings.translateCoords(startCoords);

    // There are no more visual rows in the range.
    if (endRow - startRow === 0 && startRowTranslated === null) {
      return null;
    }

    // There are no more visual columns in the range.
    if (endCol - startCol === 0 && startColTranslated === null) {
      return null;
    }

    // We are looking for next visible row and column in the range.
    if (startRowTranslated === null && startColTranslated === null) {
      return this.findVisibleCoordsInRange(new CellCoords(startRow + incrementBy, startCol + incrementBy), endCoords, incrementBy);
    }

    // We are looking for a next visible row in the range.
    if (startRowTranslated === null) {
      return this.findVisibleCoordsInRange(new CellCoords(startRow + incrementBy, startCol), endCoords, incrementBy);
    }

    // We are looking for a next visible column in the range.
    if (startColTranslated === null) {
      return this.findVisibleCoordsInRange(new CellCoords(startRow, startCol + incrementBy), endCoords, incrementBy);
    }

    // We found visible coords in the range.
    return this.settings.translateCoords(startCoords);
  }

  /**
   * Override internally stored visual indexes added by the Selection's `add` function. It should be executed
   * at the end of process of adding visual selection coordinates.
   *
   * @returns {VisualSelection}
   */
  commit() {
    const fromRangeTranslated = this.findVisibleCoordsInRange(this.visualCellRange.from, this.visualCellRange.to, 1);
    const toRangeTranslated = this.findVisibleCoordsInRange(this.visualCellRange.to, this.visualCellRange.from, -1);

    // There is no visual start point (and also visual end point) in the range. We are looking for the first visible cell in a broader range.
    if (fromRangeTranslated === null) {
      this.cellRange = null;

      return this;
    }

    this.cellRange = new CellRange(fromRangeTranslated, fromRangeTranslated, toRangeTranslated);

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
      const singleCellRangeTranslated = this.findVisibleCoordsInRange(broaderCellRange.from, broaderCellRange.to, 1);

      if (singleCellRangeTranslated !== null) {
        this.cellRange = new CellRange(singleCellRangeTranslated);

        broaderCellRange.setHighlight(this.settings.untranslateCoords(singleCellRangeTranslated));
      }
    }

    return this;
  }

  /**
   * Returns the top left (TL) and bottom right (BR) selection coordinates (visual indexes).
   *
   * @returns {Array} Returns array of coordinates for example `[1, 1, 5, 5]`.
   */
  getVisualCorners() {
    const topLeft = this.settings.untranslateCoords(this.cellRange.getTopLeftCorner());
    const bottomRight = this.settings.untranslateCoords(this.cellRange.getBottomRightCorner());

    return [
      topLeft.row,
      topLeft.col,
      bottomRight.row,
      bottomRight.col,
    ];
  }
}

export default VisualSelection;
