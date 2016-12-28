export const SELECTION_ROW_FROM_INDEX = 0;
export const SELECTION_COLUMN_FROM_INDEX = 1;
export const SELECTION_ROW_TO_INDEX = 2;
export const SELECTION_COLUMN_TO_INDEX = 3;

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

export function settingsFactory(settings) {
  return function(key) {
    let result;

    if (key === 'direction') {
      if (typeof settings === 'string') {
        result = settings;

      } else if (typeof settings === 'object' && settings[key] !== void 0) {
        result = settings[key];

      } else {
        result = true;
      }

    } else if (key === 'autoInsertRow') {
      if (typeof settings === 'object' && settings[key] !== void 0) {
        result = settings[key];

      } else {
        result = true;
      }

    } else if (key === 'fillHandle') {
      result = settings ? true : false;
    }

    return result;
  };
}

export function getDirectionAndRange(select1, select2) {
  let start, end, direction;

  if (select2[SELECTION_ROW_FROM_INDEX] === select1[SELECTION_ROW_FROM_INDEX] &&
    select2[SELECTION_COLUMN_FROM_INDEX] < select1[SELECTION_COLUMN_FROM_INDEX]) {
    direction = 'left';

    start = new WalkontableCellCoords(select2[SELECTION_ROW_FROM_INDEX], select2[SELECTION_COLUMN_FROM_INDEX]);
    end = new WalkontableCellCoords(select2[SELECTION_ROW_TO_INDEX], select1[SELECTION_COLUMN_FROM_INDEX] - 1);

  } else if (select2[SELECTION_ROW_FROM_INDEX] === select1[SELECTION_ROW_FROM_INDEX] &&
    select2[SELECTION_COLUMN_TO_INDEX] > select1[SELECTION_COLUMN_TO_INDEX]) {
    direction = 'right';

    start = new WalkontableCellCoords(select2[SELECTION_ROW_FROM_INDEX], select1[SELECTION_COLUMN_TO_INDEX] + 1);
    end = new WalkontableCellCoords(select2[SELECTION_ROW_TO_INDEX], select2[SELECTION_COLUMN_TO_INDEX]);

  } else if (select2[SELECTION_ROW_FROM_INDEX] < select1[SELECTION_ROW_FROM_INDEX] &&
    select2[SELECTION_COLUMN_FROM_INDEX] === select1[SELECTION_COLUMN_FROM_INDEX]) {
    direction = 'up';

    start = new WalkontableCellCoords(select2[SELECTION_ROW_FROM_INDEX], select2[SELECTION_COLUMN_FROM_INDEX]);
    end = new WalkontableCellCoords(select1[SELECTION_ROW_FROM_INDEX] - 1, select2[SELECTION_COLUMN_TO_INDEX]);

  } else if (select2[SELECTION_ROW_TO_INDEX] > select1[SELECTION_ROW_TO_INDEX] &&
    select2[SELECTION_COLUMN_FROM_INDEX] === select1[SELECTION_COLUMN_FROM_INDEX]) {
    direction = 'down';

    start = new WalkontableCellCoords(select1[SELECTION_ROW_TO_INDEX] + 1, select2[SELECTION_COLUMN_FROM_INDEX]);
    end = new WalkontableCellCoords(select2[SELECTION_ROW_TO_INDEX], select2[SELECTION_COLUMN_TO_INDEX]);
  }

  return {
    direction,
    start,
    end
  };
}
