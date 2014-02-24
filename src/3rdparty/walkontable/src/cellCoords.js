/**
 * WalkontableCellCoords holds cell coordinates (row, column) and few metiod to validate them and retrieve as an array or an object
 * TODO: change interface to WalkontableCellCoords(row, col) everywhere, remove those unnecessary setter and getter functions
 */

function WalkontableCellCoords(row, col) {
  if (typeof row !== 'undefined' && typeof col !== 'undefined') {
    this._row = row;
    this._col = col;
  }
  else {
    this._row = null;
    this._col = null;
  }
};

/**
 * Returns boolean information if given set of coordinates is valid in context of a given Walkontable instance
 * @param instance
 * @returns {boolean}
 */
WalkontableCellCoords.prototype.isValid = function (instance) {
  //is it a valid cell index (0 or higher)
  if (this._row < 0 || this._col < 0) {
    return false;
  }

  //is selection within total rows and columns
  if (this._row >= instance.getSetting('totalRows') || this._col >= instance.getSetting('totalColumns')) {
    return false;
  }

  return true;
};

WalkontableCellCoords.prototype.exists = function () {
  return (this._row !== null);
};

WalkontableCellCoords.prototype.row = function (val) {
  if (val !== void 0) {
    this._row = val;
  }
  return this._row;
};

WalkontableCellCoords.prototype.col = function (val) {
  if (val !== void 0) {
    this._col = val;
  }
  return this._col;
};

WalkontableCellCoords.prototype.coords = function (coords) {
  if (coords !== void 0) {
    this._row = coords.row;
    this._col = coords.col;
  }
  return {
    row: this._row,
    col: this._col
  }
};

WalkontableCellCoords.prototype.arr = function (arr) {
  if (arr !== void 0) {
    this._row = arr[0];
    this._col = arr[1];
  }
  return [this._row, this._col]
};