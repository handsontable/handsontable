import {isObject} from './../../helpers/object';
import {isDefined} from './../../helpers/mixed';

export const DIRECTIONS = {
  horizontal: 'horizontal',
  vertical: 'vertical'
};

/**
 * Get deltas array.
 *
 * @param {WalkontableCellCoords} start
 * @param {WalkontableCellCoords} end
 * @param {Array} data
 * @param {String} direction
 * @returns {Array}
 */
export function getDeltas(start, end, data, direction) {
  const rowsLength = data.length;
  const columnsLength = data ? data[0].length : 0;
  const deltas = [];
  const diffRow = end.row - start.row;
  const diffCol = end.col - start.col;

  if (['down', 'up'].indexOf(direction) !== -1) {
    const arr = [];

    for (let col = 0; col <= diffCol; col++) {
      let startValue = parseInt(data[0][col], 10);
      let endValue = parseInt(data[rowsLength - 1][col], 10);
      let delta = (direction === 'down' ? (endValue - startValue) : (startValue - endValue)) / (rowsLength - 1) || 0;

      arr.push(delta);
    }

    deltas.push(arr);
  }

  if (['right', 'left'].indexOf(direction) !== -1) {
    for (let row = 0; row <= diffRow; row++) {
      let startValue = parseInt(data[row][0], 10);
      let endValue = parseInt(data[row][columnsLength - 1], 10);
      let delta = (direction === 'right' ? (endValue - startValue) : (startValue - endValue)) / (columnsLength - 1) || 0;

      deltas.push([delta]);
    }
  }

  return deltas;
}

/**
 * Get direction between positions and cords of selections difference (drag area)
 *
 * @param {Array} startSelection
 * @param {Array} endSelection
 * @returns {{direction: String, start: WalkontableCellCoords, end: WalkontableCellCoords}}
 */
export function getDragDirectionAndRange(startSelection, endSelection) {
  let startOfDragCoords, endOfDragCoords, directionOfDrag;

  if (endSelection[0] === startSelection[0] && endSelection[1] < startSelection[1]) {
    directionOfDrag = 'left';

    startOfDragCoords = new WalkontableCellCoords(endSelection[0], endSelection[1]);
    endOfDragCoords = new WalkontableCellCoords(endSelection[2], startSelection[1] - 1);

  } else if (endSelection[0] === startSelection[0] && endSelection[3] > startSelection[3]) {
    directionOfDrag = 'right';

    startOfDragCoords = new WalkontableCellCoords(endSelection[0], startSelection[3] + 1);
    endOfDragCoords = new WalkontableCellCoords(endSelection[2], endSelection[3]);

  } else if (endSelection[0] < startSelection[0] && endSelection[1] === startSelection[1]) {
    directionOfDrag = 'up';

    startOfDragCoords = new WalkontableCellCoords(endSelection[0], endSelection[1]);
    endOfDragCoords = new WalkontableCellCoords(startSelection[0] - 1, endSelection[3]);

  } else if (endSelection[2] > startSelection[2] &&
    endSelection[1] === startSelection[1]) {
    directionOfDrag = 'down';

    startOfDragCoords = new WalkontableCellCoords(startSelection[2] + 1, endSelection[1]);
    endOfDragCoords = new WalkontableCellCoords(endSelection[2], endSelection[3]);
  }

  return {
    directionOfDrag,
    startOfDragCoords,
    endOfDragCoords
  };
}

/**
 * Get mapped FillHandle setting containing information about
 * allowed FillHandle directions and if allowed is automatic insertion of rows on drag
 *
 * @param {Boolean|Object} fillHandle property of Handsontable settings
 * @returns {{directions: Array, autoInsertRow: Boolean}} object allowing access to information
 * about FillHandle in more useful way
 */
export function getMappedFillHandleSetting(fillHandle) {
  const mappedSettings = {};

  if (fillHandle === true) {
    mappedSettings.directions = Object.keys(DIRECTIONS);
    mappedSettings.autoInsertRow = true;

  } else if (isObject(fillHandle)) {
    if (isDefined(fillHandle.autoInsertRow)) {

      // autoInsertRow for horizontal direction will be always false

      if (fillHandle.direction === DIRECTIONS.horizontal) {
        mappedSettings.autoInsertRow = false;

      } else {
        mappedSettings.autoInsertRow = fillHandle.autoInsertRow;
      }

    } else {
      mappedSettings.autoInsertRow = false;
    }

    if (isDefined(fillHandle.direction)) {
      mappedSettings.directions = [fillHandle.direction];

    } else {
      mappedSettings.directions = Object.keys(DIRECTIONS);
    }

  } else if (typeof fillHandle === 'string') {
    mappedSettings.directions = [fillHandle];
    mappedSettings.autoInsertRow = true;

  } else {
    mappedSettings.directions = [];
    mappedSettings.autoInsertRow = false;
  }

  return mappedSettings;
}
