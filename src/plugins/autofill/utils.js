import {isObject} from './../../helpers/object';
import {isDefined} from './../../helpers/mixed';

export const DIRECTIONS = {
  horizontal: 'horizontal',
  vertical: 'vertical'
};

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

export function getDirectionAndRange(select1, select2) {
  let start, end, direction;

  if (select2[0] === select1[0] && select2[1] < select1[1]) {
    direction = 'left';

    start = new WalkontableCellCoords(select2[0], select2[1]);
    end = new WalkontableCellCoords(select2[2], select1[1] - 1);

  } else if (select2[0] === select1[0] && select2[3] > select1[3]) {
    direction = 'right';

    start = new WalkontableCellCoords(select2[0], select1[3] + 1);
    end = new WalkontableCellCoords(select2[2], select2[3]);

  } else if (select2[0] < select1[0] && select2[1] === select1[1]) {
    direction = 'up';

    start = new WalkontableCellCoords(select2[0], select2[1]);
    end = new WalkontableCellCoords(select1[0] - 1, select2[3]);

  } else if (select2[2] > select1[2] &&
    select2[1] === select1[1]) {
    direction = 'down';

    start = new WalkontableCellCoords(select1[2] + 1, select2[1]);
    end = new WalkontableCellCoords(select2[2], select2[3]);
  }

  return {
    direction,
    start,
    end
  };
}

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

  // TODO: We could use predefined Array `includes` function (ES7)

  mappedSettings.directions.includes = function(value) {
    if (DIRECTIONS.hasOwnProperty(value)) {
      return this.indexOf(value) !== -1;
    } else {
      return false;
    }
  };

  return mappedSettings;
}
