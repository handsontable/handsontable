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
  return (this.from._row === this.to._row && this.from._col === this.to._col);
};

WalkontableCellRange.prototype.getTopLeftCorner = function () {
  return new WalkontableCellCoords(Math.min(this.from.row(), this.to.row()), Math.min(this.from.col(), this.to.col()));
};

WalkontableCellRange.prototype.getBottomRightCorner = function () {
  return new WalkontableCellCoords(Math.max(this.from.row(), this.to.row()), Math.max(this.from.col(), this.to.col()));
};

WalkontableCellRange.prototype.getInner = function () {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  var out = [];
  for (var r = topLeft._row; r <= bottomRight._row; r++) {
    for (var c = topLeft._col; c <= bottomRight._col; c++) {
      if (!(this.from._row === r && this.from._col === c) && !(this.to._row === r && this.to._col === c)) {
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
  for (var r = topLeft._row; r <= bottomRight._row; r++) {
    for (var c = topLeft._col; c <= bottomRight._col; c++) {
      if (topLeft._row === r && topLeft._col === c) {
        out.push(topLeft);
      }
      else if (bottomRight._row === r && bottomRight._col === c) {
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