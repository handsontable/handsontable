/**
 * WalkontableCellCoords holds cell coordinates (row, column) and few metiod to validate them and retrieve as an array or an object
 * TODO: change interface to WalkontableCellCoords(row, col) everywhere, remove those unnecessary setter and getter functions
 */

function WalkontableCellCoords(row, col) {
  if (typeof row !== 'undefined' && typeof col !== 'undefined') {
    this.row = row;
    this.col = col;
  }
  else {
    this.row = null;
    this.col = null;
  }
}

/**
 * Returns boolean information if given set of coordinates is valid in context of a given Walkontable instance
 *
 * @param instance
 * @returns {boolean}
 */
WalkontableCellCoords.prototype.isValid = function (instance) {
  //is it a valid cell index (0 or higher)
  if (this.row < 0 || this.col < 0) {
    return false;
  }

  //is selection within total rows and columns
  if (this.row >= instance.getSetting('totalRows') || this.col >= instance.getSetting('totalColumns')) {
    return false;
  }

  return true;
};

/**
 * Returns boolean information if this cell coords are the same as cell coords given as a parameter
 *
 * @param {WalkontableCellCoords} cellCoords
 * @returns {boolean}
 */
WalkontableCellCoords.prototype.isEqual = function (cellCoords) {
  if (cellCoords === this) {
    return true;
  }
  return (this.row === cellCoords.row && this.col === cellCoords.col);
};

WalkontableCellCoords.prototype.isSouthEastOf = function (testedCoords) {
  return this.row >= testedCoords.row && this.col >= testedCoords.col;
};

WalkontableCellCoords.prototype.isNorthWestOf = function (testedCoords) {
  return this.row <= testedCoords.row && this.col <= testedCoords.col;
};

WalkontableCellCoords.prototype.isSouthWestOf = function (testedCoords) {
  return this.row >= testedCoords.row && this.col <= testedCoords.col;
};

WalkontableCellCoords.prototype.isNorthEastOf = function (testedCoords) {
  return this.row <= testedCoords.row && this.col >= testedCoords.col;
};

window.WalkontableCellCoords = WalkontableCellCoords; //export
