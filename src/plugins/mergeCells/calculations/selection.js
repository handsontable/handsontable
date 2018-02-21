import {CellCoords, CellRange} from './../../../3rdparty/walkontable/src';

/**
 * Class responsible for all of the Selection-related operations on merged cells.
 *
 * @class SelectionCalculations
 * @plugin MergeCells
 * @util
 */
class SelectionCalculations {
  /**
   * "Snap" the delta value according to defined merged cells. (In other words, compensate the rowspan -
   * e.g. going up with `delta.row = -1` over a merged cell with `rowspan = 3`, `delta.row` should change to `-3`.)
   *
   * @param {Object} delta The delta object containing `row` and `col` properties.
   * @param {CellRange} selectionRange The selection range.
   * @param {Object} mergedCell A merged cell object.
   */
  snapDelta(delta, selectionRange, mergedCell) {
    const cellCoords = selectionRange.to;
    const newRow = cellCoords.row + delta.row;
    const newColumn = cellCoords.col + delta.col;

    if (delta.row) {
      this.jumpOverMergedCell(delta, mergedCell, newRow);

    } else if (delta.col) {
      this.jumpOverMergedCell(delta, mergedCell, newColumn);
    }
  }

  /**
   * "Jump" over the merged cell (compensate for the indexes within the merged cell to get past it)
   *
   * @private
   * @param {Object} delta The delta object.
   * @param {MergedCellCoords} mergedCell The merge cell object.
   * @param {Number} newIndex New row/column index, created with the delta.
   */
  jumpOverMergedCell(delta, mergeCell, newIndex) {
    let flatDelta = delta.row || delta.col;
    let includesIndex = null;
    let firstIndex = null;
    let lastIndex = null;

    if (delta.row) {
      includesIndex = mergeCell.includesVertically(newIndex);
      firstIndex = mergeCell.row;
      lastIndex = mergeCell.getLastRow();

    } else if (delta.col) {
      includesIndex = mergeCell.includesHorizontally(newIndex);
      firstIndex = mergeCell.col;
      lastIndex = mergeCell.getLastColumn();
    }

    if (flatDelta === 0) {
      return;

    } else if (flatDelta > 0) {
      if (includesIndex && newIndex !== firstIndex) {
        flatDelta += (lastIndex - newIndex + 1);
      }

    } else if (includesIndex && newIndex !== lastIndex) {
      flatDelta -= (newIndex - firstIndex + 1);
    }

    if (delta.row) {
      delta.row = flatDelta;
    } else if (delta.col) {
      delta.col = flatDelta;
    }
  }

  /**
   * Get a selection range with `to` property incremented by the provided delta.
   *
   * @param {CellRange} oldSelectionRange The base selection range.
   * @param {Object} delta The delta object with `row` and `col` properties.
   * @returns {CellRange} A new `CellRange` object.
   */
  getUpdatedSelectionRange(oldSelectionRange, delta) {
    return new CellRange(oldSelectionRange.highlight, oldSelectionRange.from, new CellCoords(oldSelectionRange.to.row + delta.row, oldSelectionRange.to.col + delta.col));
  }
}

export default SelectionCalculations;
