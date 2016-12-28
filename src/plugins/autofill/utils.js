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
