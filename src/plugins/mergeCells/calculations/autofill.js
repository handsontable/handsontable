import {extend} from '../../../helpers/object';
import {CellCoords, CellRange} from './../../../3rdparty/walkontable/src';
import {arrayEach} from './../../../helpers/array';

/**
 * Class responsible for all of the Autofill-related operations on merged cells.
 *
 * @class AutofillCalculations
 * @plugin MergeCells
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
     * Reference to the CollectionContainer class instance.
     *
     * @type {CollectionContainer}
     */
    this.collectionContainer = this.plugin.collectionContainer;
    /**
     * Cache of the currently processed autofill data.
     *
     * @private
     * @type {Object}
     */
    this.currentFillData = null;
  }

  /**
   * Correct the provided selection area, so it's not selecting only a part of a collection.
   *
   * @private
   * @param {Array} selectionArea
   */
  correctSelectionAreaSize(selectionArea) {
    if (selectionArea[0] === selectionArea[2] && selectionArea[1] === selectionArea[3]) {
      let collection = this.collectionContainer.get(selectionArea[0], selectionArea[1]);

      if (collection) {
        selectionArea[2] = selectionArea[0] + collection.rowspan - 1;
        selectionArea[3] = selectionArea[1] + collection.colspan - 1;
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
   * Snap the drag area to the farthest collection, so it won't clip any of the cell collections.
   *
   * @private
   * @param {Array} baseArea The base selected area.
   * @param {Array} dragArea The drag area.
   * @param {String} dragDirection The autofill drag direction.
   * @param {Array} foundCollections Collections found in the base selection area.
   * @return {Array} The new drag area
   */
  snapDragArea(baseArea, dragArea, dragDirection, foundCollections) {
    let newDragArea = dragArea.slice(0);
    const verticalDirection = ['up', 'down'].indexOf(dragDirection) > -1;
    const fillSize = this.getAutofillSize(baseArea, dragArea, dragDirection);
    const fullCycle = verticalDirection ? baseArea[2] - baseArea[0] + 1 : baseArea[3] - baseArea[1] + 1;
    const fulls = Math.floor(fillSize / fullCycle) * fullCycle;
    const partials = fillSize - fulls;
    let farthestCollection = this.getFarthestCollection(baseArea, dragArea, dragDirection, foundCollections);

    if (farthestCollection) {
      if (dragDirection === 'down') {
        newDragArea[2] += partials ? farthestCollection.row + farthestCollection.rowspan - baseArea[0] - partials : 0;

      } else if (dragDirection === 'right') {
        newDragArea[3] += partials ? farthestCollection.col + farthestCollection.colspan - baseArea[1] - partials : 0;

      } else if (dragDirection === 'up') {
        newDragArea[0] -= partials ? baseArea[2] - partials - farthestCollection.row + 1 : 0;

      } else if (dragDirection === 'left') {
        newDragArea[1] -= partials ? baseArea[3] - partials - farthestCollection.col + 1 : 0;
      }
    }

    this.updateCurrentFillCache({
      baseArea: baseArea,
      dragArea: newDragArea,
      dragDirection: dragDirection,
      foundCollections: foundCollections,
      fillSize: fillSize,
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
   * @return {Number} The "length" (height or width, depending on the direction) of the drag.
   */
  getAutofillSize(baseArea, dragArea, direction) {
    switch (direction) {
      case 'up':
        return baseArea[0] - dragArea[0];
      case 'down':
        return dragArea[2] - baseArea[2];
      case 'left':
        return baseArea[1] - dragArea[1];
      case 'right':
        return dragArea[3] - baseArea[3];
      default:
    }
  }

  /**
   * Trim the default drag area (containing the selection area) to the drag-only area.
   *
   * @param {Array} baseArea The base selection area.
   * @param {Array} dragArea The base selection area extended by the drag area.
   * @param {String} direction Drag direction.
   */
  getDragArea(baseArea, dragArea, direction) {
    switch (direction) {
      case 'up':
        return [dragArea[0], dragArea[1], baseArea[0] - 1, baseArea[3]];
      case 'down':
        return [baseArea[2] + 1, baseArea[1], dragArea[2], baseArea[3]];
      case 'left':
        return [dragArea[0], dragArea[1], baseArea[2], baseArea[1] - 1];
      case 'right':
        return [baseArea[0], baseArea[3] + 1, dragArea[2], dragArea[3]];
      default:
    }
  }

  /**
   * Get the to-be-farthest collection in the newly filled area.
   *
   * @param {Array} baseArea The base selection area.
   * @param {Array} dragArea The drag area (containing the base area).
   * @param {String} direction The drag direction.
   * @param {Array} collectionArray Array of the collections found in the base area.
   * @return {Collection|null}
   */
  getFarthestCollection(baseArea, dragArea, direction, collectionArray) {
    const verticalDirection = ['up', 'down'].indexOf(direction) > -1;
    const baseEnd = verticalDirection ? baseArea[2] : baseArea[3];
    const baseStart = verticalDirection ? baseArea[0] : baseArea[1];
    const fillSize = this.getAutofillSize(baseArea, dragArea, direction);
    const fullCycle = verticalDirection ? baseArea[2] - baseArea[0] + 1 : baseArea[3] - baseArea[1] + 1;
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

    arrayEach(collectionArray, (currentCollection) => {
      if (currentCollection[inclusionFunctionName](endOfDragRecreationIndex)) {
        if (currentCollection.isFarther(farthestCollection, direction)) {
          farthestCollection = currentCollection;
        }
      }
    });

    return farthestCollection;
  }

  /**
   * Recreate the collections after the autofill process.
   *
   * @private
   * @param {Array} changes Changes made.
   */
  recreateAfterDataPopulation(changes) {
    if (!this.currentFillData) {
      return;
    }

    const fillRange = this.getRangeFromChanges(changes);
    const foundCollections = this.currentFillData.foundCollections;
    const dragDirection = this.currentFillData.dragDirection;
    let fillOffset = 0;
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
      }
    };
    let current = null;
    let multiplier = 1;

    do {
      for (let j = 0; j < foundCollections.length; j++) {
        current = foundCollections[j];

        fillOffset = multiplier * this.currentFillData.cycleLength;

        if (inBounds(current, fillOffset)) {
          switch (dragDirection) {
            case 'up':
              this.plugin.collectionContainer.add({
                row: current.row - fillOffset,
                rowspan: current.rowspan,
                col: current.col,
                colspan: current.colspan
              });

              break;
            case 'down':
              this.plugin.collectionContainer.add({
                row: current.row + fillOffset,
                rowspan: current.rowspan,
                col: current.col,
                colspan: current.colspan
              });

              break;
            case 'left':
              this.plugin.collectionContainer.add({
                row: current.row,
                rowspan: current.rowspan,
                col: current.col - fillOffset,
                colspan: current.colspan
              });

              break;
            case 'right':
              this.plugin.collectionContainer.add({
                row: current.row,
                rowspan: current.rowspan,
                col: current.col + fillOffset,
                colspan: current.colspan
              });

              break;
            default:
          }
        }

        if (j === foundCollections.length - 1) {
          multiplier++;
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
   */
  getRangeFromChanges(changes) {
    const rows = {min: null, max: null};
    const columns = {min: null, max: null};

    arrayEach(changes, (change, i) => {
      if (rows.min === null || change[0] < rows.min) {
        rows.min = change[0];
      }

      if (rows.max === null || change[0] > rows.max) {
        rows.max = change[0];
      }

      if (columns.min === null || change[1] < columns.min) {
        columns.min = change[1];
      }

      if (columns.max === null || change[1] > columns.max) {
        columns.max = change[1];
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
   * Check if the drag area contains any merged collections.
   *
   * @param {Array} baseArea The base selection area.
   * @param {Array} fullArea The base area extended by the drag area.
   * @param {String} direction Drag direction.
   */
  dragAreaOverlapsCollections(baseArea, fullArea, direction) {
    const dragArea = this.getDragArea(baseArea, fullArea, direction);
    let topLeft = new CellCoords(dragArea[0], dragArea[1]);
    let bottomRight = new CellCoords(dragArea[2], dragArea[3]);
    let dragRange = new CellRange(topLeft, topLeft, bottomRight);

    return !!this.collectionContainer.getWithinRange(dragRange, true);
  }
}

export default AutofillCalculations;
