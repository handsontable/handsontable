import { CellCoords, CellRange } from './../../../3rdparty/walkontable/src';

/**
 * Class responsible for all of the Selection-related operations on merged cells.
 *
 * @class SelectionCalculations
 * @plugin MergeCells
 * @util
 */
class SelectionCalculations {
  constructor(plugin) {
    /**
     * Reference to the Merge Cells plugin.
     *
     * @type {MergeCells}
     */
    this.plugin = plugin;
    /**
     * Class name used for fully selected merged cells.
     *
     * @type {String}
     */
    this.fullySelectedMergedCellClassName = 'fullySelectedMergedCell';

  }

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
  jumpOverMergedCell(delta, mergedCell, newIndex) {
    let flatDelta = delta.row || delta.col;
    let includesIndex = null;
    let firstIndex = null;
    let lastIndex = null;

    if (delta.row) {
      includesIndex = mergedCell.includesVertically(newIndex);
      firstIndex = mergedCell.row;
      lastIndex = mergedCell.getLastRow();

    } else if (delta.col) {
      includesIndex = mergedCell.includesHorizontally(newIndex);
      firstIndex = mergedCell.col;
      lastIndex = mergedCell.getLastColumn();
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

  /**
   * Generate an additional class name for the entirely-selected merged cells.
   *
   * @param {Number} currentRow Row index of the currently processed cell.
   * @param {Number} currentColumn Column index of the currently cell.
   * @param {Array} cornersOfSelection Array of the current selection in a form of `[startRow, startColumn, endRow, endColumn]`.
   * @param {Number|undefined} layerLevel Number indicating which layer of selection is currently processed.
   * @returns {String|undefined} A `String`, which will act as an additional `className` to be added to the currently processed cell.
   */
  getSelectedMergedCellClassName(currentRow, currentColumn, cornersOfSelection, layerLevel) {
    const [startRow, startColumn, endRow, endColumn] = cornersOfSelection;

    if (layerLevel === void 0) {
      return;
    }

    if (currentRow >= startRow &&
      currentRow <= endRow &&
      currentColumn >= startColumn &&
      currentColumn <= endColumn) {

      const isMergedCellParent = this.plugin.mergedCellsCollection.isMergedParent(currentRow, currentColumn);

      if (!isMergedCellParent) {
        return;
      }

      const mergedCell = this.plugin.mergedCellsCollection.get(currentRow, currentColumn);

      if (!mergedCell) {
        return;
      }

      if (mergedCell.row + mergedCell.rowspan - 1 <= endRow && mergedCell.col + mergedCell.colspan - 1 <= endColumn) {
        return `${this.fullySelectedMergedCellClassName}-${layerLevel}`;

      } else if (this.plugin.selectionCalculations.isMergeCellFullySelected(mergedCell, this.plugin.hot.getSelectedRange())) {
        return `${this.fullySelectedMergedCellClassName}-multiple`;
      }
    }
  }

  /**
   * Check if the provided merged cell is fully selected (by one or many layers of selection)
   *
   * @param {MergedCellCoords} mergedCell The merged cell to be processed.
   * @param {CellRange[]} selectionRangesArray Array of selection ranges.
   * @returns {Boolean}
   */
  isMergeCellFullySelected(mergedCell, selectionRangesArray) {
    const mergedCellIndividualCoords = [];

    if (!selectionRangesArray || !mergedCell) {
      return false;
    }

    for (let r = 0; r < mergedCell.rowspan; r += 1) {
      for (let c = 0; c < mergedCell.colspan; c += 1) {
        mergedCellIndividualCoords.push(new CellCoords(mergedCell.row + r, mergedCell.col + c));
      }
    }

    for (let i = 0; i < mergedCellIndividualCoords.length; i += 1) {
      const insideSelections = [];

      for (let s = 0; s < selectionRangesArray.length; s += 1) {
        insideSelections[s] = selectionRangesArray[s].includes(mergedCellIndividualCoords[i]);
      }

      if (!insideSelections.includes(true)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate an array of the entirely-selected merged cells' class names.
   *
   * @returns {String[]} An `Array` of `String`s. Each of these strings will act like class names to be removed from all the cells in the table.
   */
  getSelectedMergedCellClassNameToRemove() {
    const classNames = [];

    for (let i = 0; i <= 7; i += 1) {
      classNames.push(`${this.fullySelectedMergedCellClassName}-${i}`);
    }

    classNames.push(`${this.fullySelectedMergedCellClassName}-multiple`);

    return classNames;
  }
}

export default SelectionCalculations;
