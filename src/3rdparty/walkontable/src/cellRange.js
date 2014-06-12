/**
 * A cell range is a set of exactly two WalkontableCellCoords (that can be the same or different)
 */

function WalkontableCellRange(highlight, from, to) {
  this.highlight = highlight; //this property is used to draw bold border around a cell where selection was started and to edit the cell when you press Enter
  this.from = from; //this property is usually the same as highlight, but in Excel there is distinction - one can change highlight within a selection
  this.to = to;
}

WalkontableCellRange.prototype.isValid = function (instance) {
  return (this.from.isValid(instance) && this.to.isValid(instance));
};

WalkontableCellRange.prototype.isSingle = function () {
  return (this.from.row === this.to.row && this.from.col === this.to.col);
};

/**
 * Returns boolean information if given cell coords is within `from` and `to` cell coords of this range
 * @param {WalkontableCellCoords} cellCoords
 * @returns {boolean}
 */
WalkontableCellRange.prototype.includes = function (cellCoords) {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  return (topLeft.row <= cellCoords.row && bottomRight.row >= cellCoords.row && topLeft.col <= cellCoords.col && bottomRight.col >= cellCoords.col);
};

WalkontableCellRange.prototype.includesRange = function (testedRange) {
  return this.includes(testedRange.getTopLeftCorner()) && this.includes(testedRange.getBottomRightCorner());
};

/**
 * Returns true if tested range overlaps with the range.
 * Range A is considered to to be overlapping with range B if intersection of A and B or B and A is not empty.
 * @param testedRange
 * @returns {boolean}
 */
WalkontableCellRange.prototype.overlaps = function (testedRange) {
  return testedRange.isSouthEastOf(this.getTopLeftCorner()) && testedRange.isNorthWestOf(this.getBottomRightCorner());
};

WalkontableCellRange.prototype.isSouthEastOf = function (testedCoords) {
  return this.getTopLeftCorner().isSouthEastOf(testedCoords) || this.getBottomRightCorner().isSouthEastOf(testedCoords);
};

WalkontableCellRange.prototype.isNorthWestOf = function (testedCoords) {
  return this.getTopLeftCorner().isNorthWestOf(testedCoords) || this.getBottomRightCorner().isNorthWestOf(testedCoords);
};

/**
 * Adds a cell to a range (only if exceeds corners of the range). Returns information if range was expanded
 * @param {WalkontableCellCoords} cellCoords
 * @returns {boolean}
 */
WalkontableCellRange.prototype.expand = function (cellCoords) {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  if (cellCoords.row < topLeft.row || cellCoords.col < topLeft.col || cellCoords.row > bottomRight.row || cellCoords.col > bottomRight.col) {
    this.from = new WalkontableCellCoords(Math.min(topLeft.row, cellCoords.row), Math.min(topLeft.col, cellCoords.col));
    this.to = new WalkontableCellCoords(Math.max(bottomRight.row, cellCoords.row), Math.max(bottomRight.col, cellCoords.col));
    return true;
  }
  return false;
};

WalkontableCellRange.prototype.expandByRange = function (expandingRange) {
  if (this.includesRange(expandingRange) || !this.overlaps(expandingRange)){
    return false;
  }

  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();

  var expandingTopLeft = expandingRange.getTopLeftCorner();
  var expandingBottomRight = expandingRange.getBottomRightCorner();

  var resultTopRow = Math.min(topLeft.row, expandingTopLeft.row);
  var resultTopCol = Math.min(topLeft.col, expandingTopLeft.col);
  var resultBottomRow = Math.max(bottomRight.row, expandingBottomRight.row);
  var resultBottomCol = Math.max(bottomRight.col, expandingBottomRight.col);

  this.from = new WalkontableCellCoords(resultTopRow, resultTopCol);
  this.to = new WalkontableCellCoords(resultBottomRow, resultBottomCol);

  return true;


};

WalkontableCellRange.prototype.getTopLeftCorner = function () {
  return new WalkontableCellCoords(Math.min(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
};

WalkontableCellRange.prototype.getBottomRightCorner = function () {
  return new WalkontableCellCoords(Math.max(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
};

WalkontableCellRange.prototype.getInner = function () {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  var out = [];
  for (var r = topLeft.row; r <= bottomRight.row; r++) {
    for (var c = topLeft.col; c <= bottomRight.col; c++) {
      if (!(this.from.row === r && this.from.col === c) && !(this.to.row === r && this.to.col === c)) {
        out.push(new WalkontableCellCoords(r, c));
      }
    }
  }
  return out;
};

WalkontableCellRange.prototype.getAll = function () {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  var out = [];
  for (var r = topLeft.row; r <= bottomRight.row; r++) {
    for (var c = topLeft.col; c <= bottomRight.col; c++) {
      if (topLeft.row === r && topLeft.col === c) {
        out.push(topLeft);
      }
      else if (bottomRight.row === r && bottomRight.col === c) {
        out.push(bottomRight);
      }
      else {
        out.push(new WalkontableCellCoords(r, c));
      }
    }
  }
  return out;
};

/**
 * Runs a callback function against all cells in the range. You can break the iteration by returning false in the callback function
 * @param callback {Function}
 */
WalkontableCellRange.prototype.forAll = function (callback) {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  for (var r = topLeft.row; r <= bottomRight.row; r++) {
    for (var c = topLeft.col; c <= bottomRight.col; c++) {
      var breakIteration = callback(r, c);
      if (breakIteration === false) {
        return;
      }
    }
  }
};

window.WalkontableCellRange = WalkontableCellRange; //export