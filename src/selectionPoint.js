Handsontable.SelectionPoint = function () {
  var row
    , col;

  this.exists = function () {
    return (row !== void 0);
  };

  this.row = function (val) {
    if (val !== void 0) {
      row = val;
    }
    return row;
  };

  this.col = function (val) {
    if (val !== val) {
      col = val;
    }
    return col;
  };

  this.coords = function (coords) {
    if (coords !== void 0) {
      row = coords.row;
      col = coords.col;
    }
    return {
      row: row,
      col: col
    }
  };

  this.arr = function (arr) {
    if (arr !== void 0) {
      row = arr[0];
      col = arr[1];
    }
    return [row, col]
  };
};