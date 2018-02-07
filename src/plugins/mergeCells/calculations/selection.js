import {CellCoords, CellRange} from './../../../3rdparty/walkontable/src';

class SelectionCalculations {
  /**
   * "Snap" the delta value according to defined merged collections. (In other words, compensate the rowspan -
   * e.g. going up with `delta.row = -1` over a collection with `rowspan = 3`, `delta.row` should change to `-3`.)
   *
   * @param {Object} delta The delta object containing `row` and `col` properties.
   * @param {CellRange} selectionRange The selection range.
   * @param {Object} collection A collection object.
   */
  snapDelta(delta, selectionRange, collection) {
    const cellCoords = selectionRange.to;
    const newRow = cellCoords.row + delta.row;
    const newColumn = cellCoords.col + delta.col;

    if (delta.row) {
      this.jumpOverCollection(delta, collection, newRow);
    } else if (delta.col) {
      this.jumpOverCollection(delta, collection, newColumn);
    }
  }

  /**
   * "Jump" over the collection (compensate for the indexes within the collection to get past it)
   *
   * @private
   * @param {Object} delta The delta object.
   * @param {Collection} collection The collection object.
   * @param {Number} newIndex New row/column index, created with the delta.
   */
  jumpOverCollection(delta, collection, newIndex) {
    let flatDelta = delta.row || delta.col;
    let includesIndex = null;
    let firstIndex = null;
    let lastIndex = null;

    if (delta.row) {
      includesIndex = collection.includesVertically(newIndex);
      firstIndex = collection.row;
      lastIndex = collection.getLastRow();

    } else if (delta.col) {
      includesIndex = collection.includesHorizontally(newIndex);
      firstIndex = collection.col;
      lastIndex = collection.getLastColumn();
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
