/**
 * Class responsible for all of the Selection-related operations on merged cells.
 *
 * @private
 * @class SelectionCalculations
 */
class SelectionCalculations {
  /**
   * Reference to the Merge Cells plugin.
   *
   * @type {MergeCells}
   */
  plugin;
  /**
   * Reference to the Handsontable instance.
   *
   * @type {Handsontable}
   */
  hot;
  /**
   * Class name used for fully selected merged cells.
   *
   * @type {string}
   */
  fullySelectedMergedCellClassName = 'fullySelectedMergedCell';

  constructor(plugin) {
    this.plugin = plugin;
    this.hot = plugin.hot;
  }

  /**
   * Generate an additional class name for the entirely-selected merged cells.
   *
   * @param {number} currentRow Visual row index of the currently processed cell.
   * @param {number} currentColumn Visual column index of the currently cell.
   * @param {Array} cornersOfSelection Array of the current selection in a form of `[startRow, startColumn, endRow, endColumn]`.
   * @param {number|undefined} layerLevel Number indicating which layer of selection is currently processed.
   * @returns {string|undefined} A `String`, which will act as an additional `className` to be added to the currently processed cell.
   */
  getSelectedMergedCellClassName(currentRow, currentColumn, cornersOfSelection, layerLevel) {
    const startRow = Math.min(cornersOfSelection[0], cornersOfSelection[2]);
    const startColumn = Math.min(cornersOfSelection[1], cornersOfSelection[3]);
    const endRow = Math.max(cornersOfSelection[0], cornersOfSelection[2]);
    const endColumn = Math.max(cornersOfSelection[1], cornersOfSelection[3]);

    if (layerLevel === undefined) {
      return;
    }

    const isFirstRenderableMergedCell =
      this.plugin.mergedCellsCollection.isFirstRenderableMergedCell(currentRow, currentColumn);

    // We add extra classes just to the first renderable merged cell.
    if (!isFirstRenderableMergedCell) {
      return;
    }

    const mergedCell = this.plugin.mergedCellsCollection.get(currentRow, currentColumn);

    if (!mergedCell) {
      return;
    }

    const mergeRowEnd = mergedCell.getLastRow();
    const mergeColumnEnd = mergedCell.getLastColumn();
    const fullMergeAreaWithinSelection =
      startRow <= mergedCell.row && startColumn <= mergedCell.col &&
      endRow >= mergeRowEnd && endColumn >= mergeColumnEnd;

    if (fullMergeAreaWithinSelection) {
      return `${this.fullySelectedMergedCellClassName}-${layerLevel}`;

    } else if (this.isMergeCellFullySelected(mergedCell, this.plugin.hot.getSelectedRange())) {
      return `${this.fullySelectedMergedCellClassName}-multiple`;
    }
  }

  /**
   * Check if the provided merged cell is fully selected (by one or many layers of selection).
   *
   * @param {MergedCellCoords} mergedCell The merged cell to be processed.
   * @param {CellRange[]} selectionRangesArray Array of selection ranges.
   * @returns {boolean}
   */
  isMergeCellFullySelected(mergedCell, selectionRangesArray) {
    const mergedCellIndividualCoords = [];

    if (!selectionRangesArray || !mergedCell) {
      return false;
    }

    for (let r = 0; r < mergedCell.rowspan; r += 1) {
      for (let c = 0; c < mergedCell.colspan; c += 1) {
        mergedCellIndividualCoords.push(this.hot._createCellCoords(mergedCell.row + r, mergedCell.col + c));
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
   * @returns {string[]} An `Array` of `String`s. Each of these strings will act like class names to be removed from all the cells in the table.
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
