Handsontable.SelectionPoint = function () {
  this._row = null; //private use intended
  this._col = null;
};

Handsontable.SelectionPoint.prototype.exists = function () {
  return (this._row !== null);
};

Handsontable.SelectionPoint.prototype.row = function (val) {
  if (val !== void 0) {
    this._row = val;
  }
  return this._row;
};

Handsontable.SelectionPoint.prototype.col = function (val) {
  if (val !== void 0) {
    this._col = val;
  }
  return this._col;
};

Handsontable.SelectionPoint.prototype.coords = function (coords) {
  if (coords !== void 0) {
    this._row = coords.row;
    this._col = coords.col;
  }
  return {
    row: this._row,
    col: this._col
  }
};

Handsontable.SelectionPoint.prototype.arr = function (arr) {
  if (arr !== void 0) {
    this._row = arr[0];
    this._col = arr[1];
  }
  return [this._row, this._col]
};