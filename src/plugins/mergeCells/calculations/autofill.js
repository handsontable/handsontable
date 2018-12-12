import { extend } from '../../../helpers/object';
import { CellCoords, CellRange } from './../../../3rdparty/walkontable/src';
import { arrayEach } from './../../../helpers/array';

/**
 * Class responsible for all of the Autofill-related operations on merged cells.
 *
 * @class AutofillCalculations
 * @plugin MergeCells
 * @util
 */
class AutofillCalculations {
  constructor(plugin) {
    /**
     * Reference to the Merge Cells plugin.
     *
     * @type {MergeCells}
     */
    this.plugin = plugin;
    /**
     * Reference to the MergedCellsCollection class instance.
     *
     * @type {MergedCellsCollection}
     */
    this.mergedCellsCollection = this.plugin.mergedCellsCollection;
    /**
     * Cache of the currently processed autofill data.
     *
     * @private
     * @type {Object}
     */
    this.currentFillData = null;
  }

  /**
   * Correct the provided selection area, so it's not selecting only a part of a merged cell.
   *
   * @param {Array} selectionArea
   */
  correctSelectionAreaSize(selectionArea) {
    if (selectionArea[0] === selectionArea[2] && selectionArea[1] === selectionArea[3]) {
      const mergedCell = this.mergedCellsCollection.get(selectionArea[0], selectionArea[1]);

      if (mergedCell) {
        selectionArea[2] = selectionArea[0] + mergedCell.rowspan - 1;
        selectionArea[3] = selectionArea[1] + mergedCell.colspan - 1;
      }
    }
  }

  /**
   * Get the direction of the autofill process.
   *
   * @param {Array} selectionArea The selection area.
   * @param {Array} finalArea The final area (base + drag).
   * @return {String} `up`, `down`, `left` or `right`.
   */
  getDirection(selectionArea, finalArea) {
    let direction = null;

    if (finalArea[0] === selectionArea[0] && finalArea[1] === selectionArea[1] && finalArea[3] === selectionArea[3]) {
      direction = 'down';

    } else if (finalArea[2] === selectionArea[2] && finalArea[1] === selectionArea[1] && finalArea[3] === selectionArea[3]) {
      direction = 'up';

    } else if (finalArea[1] === selectionArea[1] && finalArea[2] === selectionArea[2]) {
      direction = 'right';

    } else {
      direction = 'left';
    }

    return direction;
  }

  /**
   * Snap the drag area to the farthest merged cell, so it won't clip any of the merged cells.
   *
   * @param {Array} baseArea The base selected area.
   * @param {Array} dragArea The drag area.
   * @param {String} dragDirection The autofill drag direction.
   * @param {Array} foundMergedCells MergeCellCoords found in the base selection area.
   * @return {Array} The new drag area
   */
  snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells) {
    const newDragArea = dragArea.slice(0);
    const fillSize = this.getAutofillSize(baseArea, dragArea, dragDirection);
    const [baseAreaStartRow, baseAreaStartColumn, baseAreaEndRow, baseAreaEndColumn] = baseArea;
    const verticalDirection = ['up', 'down'].indexOf(dragDirection) > -1;
    const fullCycle = verticalDirection ? baseAreaEndRow - baseAreaStartRow + 1 : baseAreaEndColumn - baseAreaStartColumn + 1;
    const fulls = Math.floor(fillSize / fullCycle) * fullCycle;
    const partials = fillSize - fulls;
    const farthestCollection = this.getFarthestCollection(baseArea, dragArea, dragDirection, foundMergedCells);

    if (farthestCollection) {
      if (dragDirection === 'down') {
        const fill = farthestCollection.row + farthestCollection.rowspan - baseAreaStartRow - partials;
        const newLimit = newDragArea[2] + fill;

        if (newLimit >= this.plugin.hot.countRows()) {
          newDragArea[2] -= partials;

        } else {
          newDragArea[2] += partials ? fill : 0;
        }

      } else if (dragDirection === 'right') {
        const fill = farthestCollection.col + farthestCollection.colspan - baseAreaStartColumn - partials;
        const newLimit = newDragArea[3] + fill;

        if (newLimit >= this.plugin.hot.countCols()) {
          newDragArea[3] -= partials;

        } else {
          newDragArea[3] += partials ? fill : 0;
        }

      } else if (dragDirection === 'up') {
        const fill = baseAreaEndRow - partials - farthestCollection.row + 1;
        const newLimit = newDragArea[0] + fill;

        if (newLimit < 0) {
          newDragArea[0] += partials;

        } else {
          newDragArea[0] -= partials ? fill : 0;
        }

      } else if (dragDirection === 'left') {
        const fill = baseAreaEndColumn - partials - farthestCollection.col + 1;
        const newLimit = newDragArea[1] + fill;

        if (newLimit < 0) {
          newDragArea[1] += partials;

        } else {
          newDragArea[1] -= partials ? fill : 0;
        }
      }
    }

    this.updateCurrentFillCache({
      baseArea,
      dragDirection,
      foundMergedCells,
      fillSize,
      dragArea: newDragArea,
      cycleLength: fullCycle,
    });

    return newDragArea;
  }

  /**
   * Update the current fill cache with the provided object.
   *
   * @private
   * @param {Object} updateObject
   */
  updateCurrentFillCache(updateObject) {
    if (!this.currentFillData) {
      this.currentFillData = {};
    }

    extend(this.currentFillData, updateObject);
  }

  /**
   * Get the "length" of the drag area.
   *
   * @private
   * @param {Array} baseArea The base selection area.
   * @param {Array} dragArea The drag area (containing the base area).
   * @param {String} direction The drag direction.
   * @return {Number|null} The "length" (height or width, depending on the direction) of the drag.
   */
  getAutofillSize(baseArea, dragArea, direction) {
    const [baseAreaStartRow, baseAreaStartColumn, baseAreaEndRow, baseAreaEndColumn] = baseArea;
    const [dragAreaStartRow, dragAreaStartColumn, dragAreaEndRow, dragAreaEndColumn] = dragArea;

    switch (direction) {
      case 'up':
        return baseAreaStartRow - dragAreaStartRow;
      case 'down':
        return dragAreaEndRow - baseAreaEndRow;
      case 'left':
        return baseAreaStartColumn - dragAreaStartColumn;
      case 'right':
        return dragAreaEndColumn - baseAreaEndColumn;
      default:
        return null;
    }
  }

  /**
   * Trim the default drag area (containing the selection area) to the drag-only area.
   *
   * @private
   * @param {Array} baseArea The base selection area.
   * @param {Array} dragArea The base selection area extended by the drag area.
   * @param {String} direction Drag direction.
   * @return {Array|null} Array representing the drag area coordinates.
   */
  getDragArea(baseArea, dragArea, direction) {
    const [baseAreaStartRow, baseAreaStartColumn, baseAreaEndRow, baseAreaEndColumn] = baseArea;
    const [dragAreaStartRow, dragAreaStartColumn, dragAreaEndRow, dragAreaEndColumn] = dragArea;

    switch (direction) {
      case 'up':
        return [dragAreaStartRow, dragAreaStartColumn, baseAreaStartRow - 1, baseAreaEndColumn];
      case 'down':
        return [baseAreaEndRow + 1, baseAreaStartColumn, dragAreaEndRow, baseAreaEndColumn];
      case 'left':
        return [dragAreaStartRow, dragAreaStartColumn, baseAreaEndRow, baseAreaStartColumn - 1];
      case 'right':
        return [baseAreaStartRow, baseAreaEndColumn + 1, dragAreaEndRow, dragAreaEndColumn];
      default:
        return null;
    }
  }

  /**
   * Get the to-be-farthest merged cell in the newly filled area.
   *
   * @private
   * @param {Array} baseArea The base selection area.
   * @param {Array} dragArea The drag area (containing the base area).
   * @param {String} direction The drag direction.
   * @param {Array} mergedCellArray Array of the merged cells found in the base area.
   * @return {MergedCellCoords|null}
   */
  getFarthestCollection(baseArea, dragArea, direction, mergedCellArray) {
    const [baseAreaStartRow, baseAreaStartColumn, baseAreaEndRow, baseAreaEndColumn] = baseArea;
    const verticalDirection = ['up', 'down'].indexOf(direction) > -1;
    const baseEnd = verticalDirection ? baseAreaEndRow : baseAreaEndColumn;
    const baseStart = verticalDirection ? baseAreaStartRow : baseAreaStartColumn;
    const fillSize = this.getAutofillSize(baseArea, dragArea, direction);
    const fullCycle = verticalDirection ? baseAreaEndRow - baseAreaStartRow + 1 : baseAreaEndColumn - baseAreaStartColumn + 1;
    const fulls = Math.floor(fillSize / fullCycle) * fullCycle;
    const partials = fillSize - fulls;
    let inclusionFunctionName = null;
    let farthestCollection = null;
    let endOfDragRecreationIndex = null;

    switch (direction) {
      case 'up':
        inclusionFunctionName = 'includesVertically';
        endOfDragRecreationIndex = baseEnd - partials + 1;
        break;

      case 'left':
        inclusionFunctionName = 'includesHorizontally';
        endOfDragRecreationIndex = baseEnd - partials + 1;
        break;

      case 'down':
        inclusionFunctionName = 'includesVertically';
        endOfDragRecreationIndex = baseStart + partials - 1;
        break;

      case 'right':
        inclusionFunctionName = 'includesHorizontally';
        endOfDragRecreationIndex = baseStart + partials - 1;
        break;

      default:
    }

    arrayEach(mergedCellArray, (currentCollection) => {
      if (currentCollection[inclusionFunctionName](endOfDragRecreationIndex) &&
        currentCollection.isFarther(farthestCollection, direction)) {
        farthestCollection = currentCollection;
      }
    });

    return farthestCollection;
  }

  /**
   * Recreate the merged cells after the autofill process.
   *
   * @param {Array} changes Changes made.
   */
  recreateAfterDataPopulation(changes) {
    if (!this.currentFillData) {
      return;
    }

    const fillRange = this.getRangeFromChanges(changes);
    const foundMergedCells = this.currentFillData.foundMergedCells;
    const dragDirection = this.currentFillData.dragDirection;
    const inBounds = (current, offset) => {
      switch (dragDirection) {
        case 'up':
          return current.row - offset >= fillRange.from.row;
        case 'down':
          return current.row + current.rowspan - 1 + offset <= fillRange.to.row;
        case 'left':
          return current.col - offset >= fillRange.from.column;
        case 'right':
          return current.col + current.colspan - 1 + offset <= fillRange.to.column;
        default:
          return null;
      }
    };
    let fillOffset = 0;
    let current = null;
    let multiplier = 1;

    do {
      for (let j = 0; j < foundMergedCells.length; j += 1) {
        current = foundMergedCells[j];

        fillOffset = multiplier * this.currentFillData.cycleLength;

        if (inBounds(current, fillOffset)) {
          switch (dragDirection) {
            case 'up':
              this.plugin.mergedCellsCollection.add({
                row: current.row - fillOffset,
                rowspan: current.rowspan,
                col: current.col,
                colspan: current.colspan
              });
              break;

            case 'down':
              this.plugin.mergedCellsCollection.add({
                row: current.row + fillOffset,
                rowspan: current.rowspan,
                col: current.col,
                colspan: current.colspan
              });
              break;

            case 'left':
              this.plugin.mergedCellsCollection.add({
                row: current.row,
                rowspan: current.rowspan,
                col: current.col - fillOffset,
                colspan: current.colspan
              });
              break;

            case 'right':
              this.plugin.mergedCellsCollection.add({
                row: current.row,
                rowspan: current.rowspan,
                col: current.col + fillOffset,
                colspan: current.colspan
              });
              break;

            default:
          }
        }

        if (j === foundMergedCells.length - 1) {
          multiplier += 1;
        }
      }

    } while (inBounds(current, fillOffset));

    this.currentFillData = null;
    this.plugin.hot.render();
  }

  /**
   * Get the drag range from the changes made.
   *
   * @private
   * @param {Array} changes The changes made.
   * @returns {Object} Object with `from` and `to` properties, both containing `row` and `column` keys.
   */
  getRangeFromChanges(changes) {
    const rows = { min: null, max: null };
    const columns = { min: null, max: null };

    arrayEach(changes, (change) => {
      const rowIndex = change[0];
      const columnIndex = this.plugin.hot.propToCol(change[1]);

      if (rows.min === null || rowIndex < rows.min) {
        rows.min = rowIndex;
      }

      if (rows.max === null || rowIndex > rows.max) {
        rows.max = rowIndex;
      }

      if (columns.min === null || columnIndex < columns.min) {
        columns.min = columnIndex;
      }

      if (columns.max === null || columnIndex > columns.max) {
        columns.max = columnIndex;
      }
    });

    return {
      from: {
        row: rows.min,
        column: columns.min
      },
      to: {
        row: rows.max,
        column: columns.max
      }
    };
  }

  /**
   * Check if the drag area contains any merged cells.
   *
   * @param {Array} baseArea The base selection area.
   * @param {Array} fullArea The base area extended by the drag area.
   * @param {String} direction Drag direction.
   * @returns {Boolean}
   */
  dragAreaOverlapsCollections(baseArea, fullArea, direction) {
    const dragArea = this.getDragArea(baseArea, fullArea, direction);
    const [dragAreaStartRow, dragAreaStartColumn, dragAreaEndRow, dragAreaEndColumn] = dragArea;
    const topLeft = new CellCoords(dragAreaStartRow, dragAreaStartColumn);
    const bottomRight = new CellCoords(dragAreaEndRow, dragAreaEndColumn);
    const dragRange = new CellRange(topLeft, topLeft, bottomRight);

    return !!this.mergedCellsCollection.getWithinRange(dragRange, true);
  }
}

export default AutofillCalculations;
