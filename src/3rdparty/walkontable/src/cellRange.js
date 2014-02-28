/**
 * A cell range is a set of exactly two WalkontableCellCoords (that can be the same or different)
 */

function WalkontableCellRange(from, to) {
  this.from = from;
  this.to = to;
}

WalkontableCellRange.prototype.isValid = function (instance) {
  return (this.from.isValid(instance) && this.to.isValid(instance));
};

WalkontableCellRange.prototype.isSingle = function () {
  return (this.from.row === this.to.row && this.from.col === this.to.col);
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

window.WalkontableCellRange = WalkontableCellRange; //export