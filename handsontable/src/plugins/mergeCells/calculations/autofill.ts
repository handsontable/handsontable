import { extend } from '../../../helpers/object';
import { arrayEach } from '../../../helpers/array';
import type { HotInstance } from '../../../core/types';
import type MergedCellsCollection from '../cellsCollection';
import type MergedCellCoords from '../cellCoords';

interface MergeCellsPlugin {
  hot: HotInstance;
  mergedCellsCollection: MergedCellsCollection;
  ifChromeForceRepaint(): void;
}

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
  declare plugin: MergeCellsPlugin;
  /**
   * Reference to the MergedCellsCollection class instance.
   *
   * @type {MergedCellsCollection}
   */
  declare mergedCellsCollection: MergedCellsCollection;
  /**
   * Cache of the currently processed autofill data.
   *
   * @private
   * @type {object}
   */
  currentFillData: Record<string, unknown> | null = null;

  constructor(plugin: MergeCellsPlugin) {
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
  getDirection(baseArea: number[], fullArea: number[]) {
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
  snapDragArea(baseArea: number[], fullArea: number[], dragDirection: string, foundMergedCells: MergedCellCoords[]) {
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
  updateCurrentFillCache(updateObject: Record<string, unknown>) {
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
   * @returns {number} The "length" (height or width, depending on the direction) of the drag.
   */
  getAutofillSize(baseArea: number[], fullArea: number[], direction: string) {
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
        return 0;
    }
  }

  /**
   * Trim the default drag area (containing the selection area) to the drag-only area.
   *
   * @private
   * @param {Array} baseArea The base selection area.
   * @param {Array} fullArea The base selection area extended by the drag area.
   * @param {string} direction Drag direction.
   * @returns {Array} Array representing the drag area coordinates.
   */
  getDragArea(baseArea: number[], fullArea: number[], direction: string) {
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
        return [0, 0, 0, 0];
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
  getFarthestCollection(
    baseArea: number[], fullArea: number[], direction: string, mergedCellArray: MergedCellCoords[]
  ): MergedCellCoords | null {
    const [baseAreaStartRow, baseAreaStartColumn, baseAreaEndRow, baseAreaEndColumn] = baseArea;
    const verticalDirection = ['up', 'down'].indexOf(direction) > -1;
    const baseEnd = verticalDirection ? baseAreaEndRow : baseAreaEndColumn;
    const baseStart = verticalDirection ? baseAreaStartRow : baseAreaStartColumn;
    const fillSize = this.getAutofillSize(baseArea, fullArea, direction);
    const fullCycle = verticalDirection ?
      baseAreaEndRow - baseAreaStartRow + 1 : baseAreaEndColumn - baseAreaStartColumn + 1;
    const fulls = Math.floor(fillSize / fullCycle) * fullCycle;
    const partials = fillSize - fulls;
    let inclusionFunctionName: string | null = null;
    let farthestCollection: MergedCellCoords | null = null;
    let endOfDragRecreationIndex: number | null = null;

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
      const mc = currentCollection as MergedCellCoords;

      if ((mc as unknown as Record<string, Function>)[inclusionFunctionName!](endOfDragRecreationIndex) &&
        mc.isFarther(farthestCollection, direction)) {
        farthestCollection = mc;
      }
    });

    return farthestCollection;
  }

  /**
   * Recreate the merged cells after the autofill process.
   *
   * @param {Array} changes Changes made.
   */
  recreateAfterDataPopulation(changes: unknown[][]) {
    if (!this.currentFillData) {
      return;
    }

    const fillRange = this.getRangeFromChanges(changes);
    const foundMergedCells = this.currentFillData.foundMergedCells as MergedCellCoords[];
    const dragDirection = this.currentFillData.dragDirection as string;
    const inBounds = (current: { row: number, col: number, rowspan: number, colspan: number }, offset: number) => {
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
    let current: { row: number, col: number, rowspan: number, colspan: number } | null = null;
    let multiplier = 1;

    do {
      for (let j = 0; j < foundMergedCells.length; j += 1) {
        current = foundMergedCells[j];

        fillOffset = multiplier * (this.currentFillData.cycleLength as number);

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

    } while (current !== null && inBounds(current, fillOffset));

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
  getRangeFromChanges(changes: unknown[][]) {
    let rowMin: number | null = null;
    let rowMax: number | null = null;
    let colMin: number | null = null;
    let colMax: number | null = null;

    arrayEach(changes, (change) => {
      const changeArr = change as unknown[];
      const rowIndex = changeArr[0] as number;
      const columnIndex = this.plugin.hot.propToCol(changeArr[1] as string | number);

      if (rowMin === null || rowIndex < rowMin) {
        rowMin = rowIndex;
      }

      if (rowMax === null || rowIndex > rowMax) {
        rowMax = rowIndex;
      }

      if (colMin === null || columnIndex < colMin) {
        colMin = columnIndex;
      }

      if (colMax === null || columnIndex > colMax) {
        colMax = columnIndex;
      }
    });

    return {
      from: {
        row: rowMin ?? 0,
        column: colMin ?? 0
      },
      to: {
        row: rowMax ?? 0,
        column: colMax ?? 0
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
  dragAreaOverlapsCollections(baseArea: number[], fullArea: number[], direction: string) {
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
      return !mergedCellsWithoutPartials.every(({ colspan }: { colspan: number }) => colspan === dragRange.getWidth());
    }

    return !mergedCellsWithoutPartials.every(({ rowspan }: { rowspan: number }) => rowspan === dragRange.getHeight());
  }
}

export default AutofillCalculations;
