import { isObject } from '../../helpers/object';
import { isDefined } from '../../helpers/mixed';

export const DIRECTIONS = {
  horizontal: 'horizontal',
  vertical: 'vertical'
};

/**
 * Get direction between positions and cords of selections difference (drag area).
 *
 * @param {Array} startSelection The coordinates where the selection starts.
 * @param {Array} endSelection The coordinates where the selection ends.
 * @param {Function} cellCoordsFactory The function factory for CellCoords objects.
 * @returns {{direction: string, start: CellCoords, end: CellCoords}}
 */
export function getDragDirectionAndRange(startSelection, endSelection, cellCoordsFactory) {
  let startOfDragCoords;
  let endOfDragCoords;
  let directionOfDrag;

  if (endSelection[0] === startSelection[0] && endSelection[1] < startSelection[1]) {
    directionOfDrag = 'left';

    startOfDragCoords = cellCoordsFactory(endSelection[0], endSelection[1]);
    endOfDragCoords = cellCoordsFactory(endSelection[2], startSelection[1] - 1);

  } else if (endSelection[2] === startSelection[2] && endSelection[0] === startSelection[0] &&
      endSelection[3] > startSelection[3]) {
    directionOfDrag = 'right';

    startOfDragCoords = cellCoordsFactory(endSelection[0], startSelection[3] + 1);
    endOfDragCoords = cellCoordsFactory(endSelection[2], endSelection[3]);

  } else if (endSelection[0] < startSelection[0] && endSelection[1] === startSelection[1]) {
    directionOfDrag = 'up';

    startOfDragCoords = cellCoordsFactory(endSelection[0], endSelection[1]);
    endOfDragCoords = cellCoordsFactory(startSelection[0] - 1, endSelection[3]);

  } else if (endSelection[2] > startSelection[2] &&
    endSelection[1] === startSelection[1]) {
    directionOfDrag = 'down';

    startOfDragCoords = cellCoordsFactory(startSelection[2] + 1, endSelection[1]);
    endOfDragCoords = cellCoordsFactory(endSelection[2], endSelection[3]);
  }

  if (startOfDragCoords) {
    startOfDragCoords.normalize();
  }

  if (endOfDragCoords) {
    endOfDragCoords.normalize();
  }

  return {
    directionOfDrag,
    startOfDragCoords,
    endOfDragCoords,
  };
}

/**
 * Get mapped FillHandle setting containing information about
 * allowed FillHandle directions and if allowed is automatic insertion of rows on drag.
 *
 * @param {boolean|object} fillHandle Property of Handsontable settings.
 * @returns {{directions: Array, autoInsertRow: boolean}} Object allowing access to information
 * about FillHandle in more useful way.
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
