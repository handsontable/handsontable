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
 * Returns selected range height (in number of rows)
 * @returns {number}
 */
WalkontableCellRange.prototype.getHeight = function () {
  return Math.max(this.from.row, this.to.row) - Math.min(this.from.row, this.to.row) + 1;
};

/**
 * Returns selected range width (in number of columns)
 * @returns {number}
 */
WalkontableCellRange.prototype.getWidth = function () {
  return Math.max(this.from.col, this.to.col) - Math.min(this.from.col, this.to.col) + 1;
};

/**
 * Returns boolean information if given cell coords is within `from` and `to` cell coords of this range
 * @param {WalkontableCellCoords} cellCoords
 * @returns {boolean}
 */
WalkontableCellRange.prototype.includes = function (cellCoords) {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();

  if (cellCoords.row < 0) {
    cellCoords.row = 0;
  }

  if (cellCoords.col < 0) {
    cellCoords.col = 0;
  }

  return (topLeft.row <= cellCoords.row && bottomRight.row >= cellCoords.row && topLeft.col <= cellCoords.col && bottomRight.col >= cellCoords.col);
};

WalkontableCellRange.prototype.includesRange = function (testedRange) {
  return this.includes(testedRange.getTopLeftCorner()) && this.includes(testedRange.getBottomRightCorner());
};

WalkontableCellRange.prototype.isEqual = function (testedRange) {
  return (Math.min(this.from.row, this.to.row) == Math.min(testedRange.from.row, testedRange.to.row)) &&
         (Math.max(this.from.row, this.to.row) == Math.max(testedRange.from.row, testedRange.to.row)) &&
         (Math.min(this.from.col, this.to.col) == Math.min(testedRange.from.col, testedRange.to.col)) &&
         (Math.max(this.from.col, this.to.col) == Math.max(testedRange.from.col, testedRange.to.col));
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
  if (this.includesRange(expandingRange) || !this.overlaps(expandingRange)) {
    return false;
  }

  var topLeft = this.getTopLeftCorner()
    , bottomRight = this.getBottomRightCorner()
    , topRight = this.getTopRightCorner()
    , bottomLeft = this.getBottomLeftCorner();

  var expandingTopLeft = expandingRange.getTopLeftCorner();
  var expandingBottomRight = expandingRange.getBottomRightCorner();

  var resultTopRow = Math.min(topLeft.row, expandingTopLeft.row);
  var resultTopCol = Math.min(topLeft.col, expandingTopLeft.col);
  var resultBottomRow = Math.max(bottomRight.row, expandingBottomRight.row);
  var resultBottomCol = Math.max(bottomRight.col, expandingBottomRight.col);

  var finalFrom = new WalkontableCellCoords(resultTopRow, resultTopCol)
    , finalTo = new WalkontableCellCoords(resultBottomRow, resultBottomCol);
  var isCorner = new WalkontableCellRange(finalFrom, finalFrom, finalTo).isCorner(this.from, expandingRange)
    , onlyMerge = expandingRange.isEqual(new WalkontableCellRange(finalFrom, finalFrom, finalTo));

  if (isCorner && !onlyMerge) {
    if (this.from.col > finalFrom.col) {
      finalFrom.col = resultBottomCol;
      finalTo.col = resultTopCol;
    }
    if (this.from.row > finalFrom.row) {
      finalFrom.row = resultBottomRow;
      finalTo.row = resultTopRow;
    }
  }

  this.from = finalFrom;
  this.to = finalTo;

  return true;
};

WalkontableCellRange.prototype.getDirection = function () {
  if (this.from.isNorthWestOf(this.to)) {        // NorthWest - SouthEast
    return "NW-SE";
  } else if (this.from.isNorthEastOf(this.to)) { // NorthEast - SouthWest
    return "NE-SW";
  } else if (this.from.isSouthEastOf(this.to)) { // SouthEast - NorthWest
    return "SE-NW";
  } else if (this.from.isSouthWestOf(this.to)) { // SouthWest - NorthEast
    return "SW-NE";
  }
};

WalkontableCellRange.prototype.setDirection = function (direction) {
  switch (direction) {
    case "NW-SE" :
      this.from = this.getTopLeftCorner();
      this.to = this.getBottomRightCorner();
      break;
    case "NE-SW" :
      this.from = this.getTopRightCorner();
      this.to = this.getBottomLeftCorner();
      break;
    case "SE-NW" :
      this.from = this.getBottomRightCorner();
      this.to = this.getTopLeftCorner();
      break;
    case "SW-NE" :
      this.from = this.getBottomLeftCorner();
      this.to = this.getTopRightCorner();
      break;
  }
};

WalkontableCellRange.prototype.getTopLeftCorner = function () {
  return new WalkontableCellCoords(Math.min(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
};

WalkontableCellRange.prototype.getBottomRightCorner = function () {
  return new WalkontableCellCoords(Math.max(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
};

WalkontableCellRange.prototype.getTopRightCorner = function () {
  return new WalkontableCellCoords(Math.min(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
};

WalkontableCellRange.prototype.getBottomLeftCorner = function () {
  return new WalkontableCellCoords(Math.max(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
};

WalkontableCellRange.prototype.isCorner = function (coords, expandedRange) {
  if (expandedRange) {
    if (expandedRange.includes(coords)) {
      if (this.getTopLeftCorner().isEqual(new WalkontableCellCoords(expandedRange.from.row, expandedRange.from.col)) ||
          this.getTopRightCorner().isEqual(new WalkontableCellCoords(expandedRange.from.row, expandedRange.to.col)) ||
          this.getBottomLeftCorner().isEqual(new WalkontableCellCoords(expandedRange.to.row, expandedRange.from.col)) ||
          this.getBottomRightCorner().isEqual(new WalkontableCellCoords(expandedRange.to.row, expandedRange.to.col))) {
        return true;
      }
    }
  }
  return coords.isEqual(this.getTopLeftCorner()) || coords.isEqual(this.getTopRightCorner()) || coords.isEqual(this.getBottomLeftCorner()) || coords.isEqual(this.getBottomRightCorner());
};

WalkontableCellRange.prototype.getOppositeCorner = function (coords, expandedRange) {
  if (!(coords instanceof WalkontableCellCoords)) {
    return false;
  }

  if (expandedRange) {
    if (expandedRange.includes(coords)) {
      if (this.getTopLeftCorner().isEqual(new WalkontableCellCoords(expandedRange.from.row, expandedRange.from.col))) {
        return this.getBottomRightCorner();
      }
      if (this.getTopRightCorner().isEqual(new WalkontableCellCoords(expandedRange.from.row, expandedRange.to.col))) {
        return this.getBottomLeftCorner();
      }
      if (this.getBottomLeftCorner().isEqual(new WalkontableCellCoords(expandedRange.to.row, expandedRange.from.col))) {
        return this.getTopRightCorner();
      }
      if (this.getBottomRightCorner().isEqual(new WalkontableCellCoords(expandedRange.to.row, expandedRange.to.col))) {
        return this.getTopLeftCorner();
      }
    }
  }

  if (coords.isEqual(this.getBottomRightCorner())) {
    return this.getTopLeftCorner();
  } else if (coords.isEqual(this.getTopLeftCorner())) {
    return this.getBottomRightCorner();
  } else if (coords.isEqual(this.getTopRightCorner())) {
    return this.getBottomLeftCorner();
  } else if (coords.isEqual(this.getBottomLeftCorner())) {
    return  this.getTopRightCorner();
  }
};

WalkontableCellRange.prototype.getBordersSharedWith = function (range) {
  if (!this.includesRange(range)) {
    return [];
  }

  var thisBorders = {
      top: Math.min(this.from.row, this.to.row),
      bottom: Math.max(this.from.row, this.to.row),
      left: Math.min(this.from.col, this.to.col),
      right: Math.max(this.from.col, this.to.col)
    }
    , rangeBorders = {
      top: Math.min(range.from.row, range.to.row),
      bottom: Math.max(range.from.row, range.to.row),
      left: Math.min(range.from.col, range.to.col),
      right: Math.max(range.from.col, range.to.col)
    }
    , result = [];

  if (thisBorders.top == rangeBorders.top) {
    result.push('top');
  }
  if (thisBorders.right == rangeBorders.right) {
    result.push('right');
  }
  if (thisBorders.bottom == rangeBorders.bottom) {
    result.push('bottom');
  }
  if (thisBorders.left == rangeBorders.left) {
    result.push('left');
  }

  return result;
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
