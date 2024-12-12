import { extend } from '../../../helpers/object';
import { arrayEach } from '../../../helpers/array';

/**
 * Class responsible for all of the Autofill-related operations on merged cells.
 *
 * @private
 * @class AutofillCalculations
 */
class AutofillCalculations {
  /**
   * Reference to the Merge Cells plugin.
   *
   * @type {MergeCells}
   */
  plugin;
  /**
   * Reference to the MergedCellsCollection class instance.
   *
   * @type {MergedCellsCollection}
   */
  mergedCellsCollection;
  /**
   * Cache of the currently processed autofill data.
   *
   * @private
   * @type {object}
   */
  currentFillData = null;

  constructor(plugin) {
    this.plugin = plugin;
    this.mergedCellsCollection = this.plugin.mergedCellsCollection;
  }

  /**
   * Get the direction of the autofill process.
   *
   * @param {Array} baseArea The selection area.
   * @param {Array} fullArea The final area (base + drag).
   * @returns {string} `up`, `down`, `left` or `right`.
   */
  getDirection(baseArea, fullArea) {
    let direction = null;

    if (fullArea[0] === baseArea[0] &&
        fullArea[1] === baseArea[1] && fullArea[3] === baseArea[3]) {
      direction = 'down';

    } else if (fullArea[2] === baseArea[2] &&
               fullArea[1] === baseArea[1] && fullArea[3] === baseArea[3]) {
      direction = 'up';

    } else if (fullArea[1] === baseArea[1] && fullArea[2] === baseArea[2]) {
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
   * @param {Array} fullArea The drag area.
   * @param {string} dragDirection The autofill drag direction.
   * @param {Array} foundMergedCells MergeCellCoords found in the base selection area.
   * @returns {Array} The new drag area.
   */
  snapDragArea(baseArea, fullArea, dragDirection, foundMergedCells) {
    const newDragArea = fullArea.slice(0);
    const fillSize = this.getAutofillSize(baseArea, fullArea, dragDirection);
    const [baseAreaStartRow, baseAreaStartColumn, baseAreaEndRow, baseAreaEndColumn] = baseArea;
    const verticalDirection = ['up', 'down'].indexOf(dragDirection) > -1;
    const fullCycle = verticalDirection ?
      baseAreaEndRow - baseAreaStartRow + 1 : baseAreaEndColumn - baseAreaStartColumn + 1;
    const fulls = Math.floor(fillSize / fullCycle) * fullCycle;
    const partials = fillSize - fulls;
    const farthestCollection = this.getFarthestCollection(baseArea, fullArea, dragDirection, foundMergedCells);

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
   * @param {object} updateObject The current filled object cache.
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
   * @param {Array} fullArea The drag area (containing the base area).
   * @param {string} direction The drag direction.
   * @returns {number|null} The "length" (height or width, depending on the direction) of the drag.
   */
  getAutofillSize(baseArea, fullArea, direction) {
    const [baseAreaStartRow, baseAreaStartColumn, baseAreaEndRow, baseAreaEndColumn] = baseArea;
    const [dragAreaStartRow, dragAreaStartColumn, dragAreaEndRow, dragAreaEndColumn] = fullArea;

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
   * @param {Array} fullArea The base selection area extended by the drag area.
   * @param {string} direction Drag direction.
   * @returns {Array|null} Array representing the drag area coordinates.
   */
  getDragArea(baseArea, fullArea, direction) {
    const [baseAreaStartRow, baseAreaStartColumn, baseAreaEndRow, baseAreaEndColumn] = baseArea;
    const [fullAreaStartRow, fullAreaStartColumn, fullAreaEndRow, fullAreaEndColumn] = fullArea;

    switch (direction) {
      case 'up':
        return [fullAreaStartRow, fullAreaStartColumn, baseAreaStartRow - 1, baseAreaEndColumn];
      case 'down': {
        const mergedCell = this.mergedCellsCollection.get(fullAreaEndRow, baseAreaEndColumn);
        const rowShift = mergedCell ? mergedCell.rowspan - 1 : 0;

        return [baseAreaEndRow + 1, baseAreaStartColumn, fullAreaEndRow + rowShift, baseAreaEndColumn];
      }
      case 'left':
        return [fullAreaStartRow, fullAreaStartColumn, baseAreaEndRow, baseAreaStartColumn - 1];
      case 'right': {
        const mergedCell = this.mergedCellsCollection.get(fullAreaEndRow, baseAreaEndColumn);
        const columnShift = mergedCell ? mergedCell.colspan - 1 : 0;

        return [baseAreaStartRow, baseAreaEndColumn + columnShift, fullAreaEndRow, fullAreaEndColumn];
      }
      default:
        return null;
    }
  }

  /**
   * Get the to-be-farthest merged cell in the newly filled area.
   *
   * @private
   * @param {Array} baseArea The base selection area.
   * @param {Array} fullArea The drag area (containing the base area).
   * @param {string} direction The drag direction.
   * @param {Array} mergedCellArray Array of the merged cells found in the base area.
   * @returns {MergedCellCoords|null}
   */
  getFarthestCollection(baseArea, fullArea, direction, mergedCellArray) {
    const [baseAreaStartRow, baseAreaStartColumn, baseAreaEndRow, baseAreaEndColumn] = baseArea;
    const verticalDirection = ['up', 'down'].indexOf(direction) > -1;
    const baseEnd = verticalDirection ? baseAreaEndRow : baseAreaEndColumn;
    const baseStart = verticalDirection ? baseAreaStartRow : baseAreaStartColumn;
    const fillSize = this.getAutofillSize(baseArea, fullArea, direction);
    const fullCycle = verticalDirection ?
      baseAreaEndRow - baseAreaStartRow + 1 : baseAreaEndColumn - baseAreaStartColumn + 1;
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
              }, true);
              break;

            case 'down':
              this.plugin.mergedCellsCollection.add({
                row: current.row + fillOffset,
                rowspan: current.rowspan,
                col: current.col,
                colspan: current.colspan
              }, true);
              break;

            case 'left':
              this.plugin.mergedCellsCollection.add({
                row: current.row,
                rowspan: current.rowspan,
                col: current.col - fillOffset,
                colspan: current.colspan
              }, true);
              break;

            case 'right':
              this.plugin.mergedCellsCollection.add({
                row: current.row,
                rowspan: current.rowspan,
                col: current.col + fillOffset,
                colspan: current.colspan
              }, true);
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

    if (foundMergedCells.length > 0) {
      this.plugin.ifChromeForceRepaint();
    }
  }

  /**
   * Get the drag range from the changes made.
   *
   * @private
   * @param {Array} changes The changes made.
   * @returns {object} Object with `from` and `to` properties, both containing `row` and `column` keys.
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
   * @param {string} direction Drag direction.
   * @returns {boolean}
   */
  dragAreaOverlapsCollections(baseArea, fullArea, direction) {
    const dragArea = this.getDragArea(baseArea, fullArea, direction);
    const [dragAreaStartRow, dragAreaStartColumn, dragAreaEndRow, dragAreaEndColumn] = dragArea;
    const topLeft = this.plugin.hot._createCellCoords(dragAreaStartRow, dragAreaStartColumn);
    const bottomRight = this.plugin.hot._createCellCoords(dragAreaEndRow, dragAreaEndColumn);
    const dragRange = this.plugin.hot._createCellRange(topLeft, topLeft, bottomRight);
    const mergedCellsWithPartials = this.mergedCellsCollection.getWithinRange(dragRange, true);

    if (mergedCellsWithPartials.length === 0) {
      return false;
    }

    const mergedCellsWithoutPartials = this.mergedCellsCollection.getWithinRange(dragRange, false);

    if (mergedCellsWithoutPartials.length === 0) {
      return true;
    }

    if (direction === 'up' || direction === 'down') {
      return !mergedCellsWithoutPartials.every(({ colspan }) => colspan === dragRange.getWidth());
    }

    return !mergedCellsWithoutPartials.every(({ rowspan }) => rowspan === dragRange.getHeight());
  }
}

export default AutofillCalculations;
