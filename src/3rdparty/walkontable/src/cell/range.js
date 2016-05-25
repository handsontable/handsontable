
import {WalkontableCellCoords} from './../cell/coords';

/**
 * A cell range is a set of exactly two WalkontableCellCoords (that can be the same or different)
 *
 * @class WalkontableCellRange
 */
class WalkontableCellRange {
  /**
   * @param {WalkontableCellCoords} highlight Used to draw bold border around a cell where selection was
   *                                          started and to edit the cell when you press Enter
   * @param {WalkontableCellCoords} from Usually the same as highlight, but in Excel there is distinction - one can change
   *                                     highlight within a selection
   * @param {WalkontableCellCoords} to End selection
   */
  constructor(highlight, from, to) {
    this.highlight = highlight;
    this.from = from;
    this.to = to;
  }

  /**
   * Checks if given coords are valid in context of a given Walkontable instance
   *
   * @param {Walkontable} wotInstance
   * @returns {Boolean}
   */
  isValid(wotInstance) {
    return this.from.isValid(wotInstance) && this.to.isValid(wotInstance);
  }

  /**
   * Checks if this cell range is restricted to one cell
   *
   * @returns {Boolean}
   */
  isSingle() {
    return this.from.row === this.to.row && this.from.col === this.to.col;
  }

  /**
   * Returns selected range height (in number of rows)
   *
   * @returns {Number}
   */
  getHeight() {
    return Math.max(this.from.row, this.to.row) - Math.min(this.from.row, this.to.row) + 1;
  }

  /**
   * Returns selected range width (in number of columns)
   *
   * @returns {Number}
   */
  getWidth() {
    return Math.max(this.from.col, this.to.col) - Math.min(this.from.col, this.to.col) + 1;
  }

  /**
   * Checks if given cell coords is within `from` and `to` cell coords of this range
   *
   * @param {WalkontableCellCoords} cellCoords
   * @returns {Boolean}
   */
  includes(cellCoords) {
    let {row, col} = cellCoords;
    let topLeft = this.getTopLeftCorner();
    let bottomRight = this.getBottomRightCorner();

    return topLeft.row <= row && bottomRight.row >= row &&
        topLeft.col <= col && bottomRight.col >= col;
  }

  /**
   * Checks if given range is within of this range
   *
   * @param {WalkontableCellRange} testedRange
   * @returns {Boolean}
   */
  includesRange(testedRange) {
    return this.includes(testedRange.getTopLeftCorner()) && this.includes(testedRange.getBottomRightCorner());
  }

  /**
   * Checks if given range is equal to this range
   *
   * @param {WalkontableCellRange} testedRange
   * @returns {Boolean}
   */
  isEqual(testedRange) {
    return (Math.min(this.from.row, this.to.row) == Math.min(testedRange.from.row, testedRange.to.row)) &&
           (Math.max(this.from.row, this.to.row) == Math.max(testedRange.from.row, testedRange.to.row)) &&
           (Math.min(this.from.col, this.to.col) == Math.min(testedRange.from.col, testedRange.to.col)) &&
           (Math.max(this.from.col, this.to.col) == Math.max(testedRange.from.col, testedRange.to.col));
  }

  /**
   * Checks if tested range overlaps with the range.
   * Range A is considered to to be overlapping with range B if intersection of A and B or B and A is not empty.
   *
   * @param {WalkontableCellRange} testedRange
   * @returns {Boolean}
   */
  overlaps(testedRange) {
    return testedRange.isSouthEastOf(this.getTopLeftCorner()) && testedRange.isNorthWestOf(this.getBottomRightCorner());
  }

  /**
   * @param {WalkontableCellRange} testedCoords
   * @returns {Boolean}
   */
  isSouthEastOf(testedCoords) {
    return this.getTopLeftCorner().isSouthEastOf(testedCoords) || this.getBottomRightCorner().isSouthEastOf(testedCoords);
  }

  /**
   * @param {WalkontableCellRange} testedCoords
   * @returns {Boolean}
   */
  isNorthWestOf(testedCoords) {
    return this.getTopLeftCorner().isNorthWestOf(testedCoords) || this.getBottomRightCorner().isNorthWestOf(testedCoords);
  }

  /**
   * Adds a cell to a range (only if exceeds corners of the range). Returns information if range was expanded
   *
   * @param {WalkontableCellCoords} cellCoords
   * @returns {Boolean}
   */
  expand(cellCoords) {
    let topLeft = this.getTopLeftCorner();
    let bottomRight = this.getBottomRightCorner();

    if (cellCoords.row < topLeft.row || cellCoords.col < topLeft.col ||
        cellCoords.row > bottomRight.row || cellCoords.col > bottomRight.col) {
      this.from = new WalkontableCellCoords(Math.min(topLeft.row, cellCoords.row), Math.min(topLeft.col, cellCoords.col));
      this.to = new WalkontableCellCoords(Math.max(bottomRight.row, cellCoords.row), Math.max(bottomRight.col, cellCoords.col));

      return true;
    }

    return false;
  }

  /**
   * @param {WalkontableCellRange} expandingRange
   * @returns {Boolean}
   */
  expandByRange(expandingRange) {
    if (this.includesRange(expandingRange) || !this.overlaps(expandingRange)) {
      return false;
    }

    let topLeft = this.getTopLeftCorner();
    let bottomRight = this.getBottomRightCorner();
    let topRight = this.getTopRightCorner();
    let bottomLeft = this.getBottomLeftCorner();

    let expandingTopLeft = expandingRange.getTopLeftCorner();
    let expandingBottomRight = expandingRange.getBottomRightCorner();

    let resultTopRow = Math.min(topLeft.row, expandingTopLeft.row);
    let resultTopCol = Math.min(topLeft.col, expandingTopLeft.col);
    let resultBottomRow = Math.max(bottomRight.row, expandingBottomRight.row);
    let resultBottomCol = Math.max(bottomRight.col, expandingBottomRight.col);

    let finalFrom = new WalkontableCellCoords(resultTopRow, resultTopCol),
      finalTo = new WalkontableCellCoords(resultBottomRow, resultBottomCol);
    let isCorner = new WalkontableCellRange(finalFrom, finalFrom, finalTo).isCorner(this.from, expandingRange),
      onlyMerge = expandingRange.isEqual(new WalkontableCellRange(finalFrom, finalFrom, finalTo));

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
  }

  /**
   * @returns {String}
   */
  getDirection() {
    if (this.from.isNorthWestOf(this.to)) { // NorthWest - SouthEast
      return 'NW-SE';

    } else if (this.from.isNorthEastOf(this.to)) { // NorthEast - SouthWest
      return 'NE-SW';

    } else if (this.from.isSouthEastOf(this.to)) { // SouthEast - NorthWest
      return 'SE-NW';

    } else if (this.from.isSouthWestOf(this.to)) { // SouthWest - NorthEast
      return 'SW-NE';
    }
  }

  /**
   * @param {String} direction
   */
  setDirection(direction) {
    switch (direction) {
      case 'NW-SE':
        this.from = this.getTopLeftCorner();
        this.to = this.getBottomRightCorner();
        break;
      case 'NE-SW':
        this.from = this.getTopRightCorner();
        this.to = this.getBottomLeftCorner();
        break;
      case 'SE-NW':
        this.from = this.getBottomRightCorner();
        this.to = this.getTopLeftCorner();
        break;
      case 'SW-NE':
        this.from = this.getBottomLeftCorner();
        this.to = this.getTopRightCorner();
        break;
    }
  }

  /**
   * Get top left corner of this range
   *
   * @returns {WalkontableCellCoords}
   */
  getTopLeftCorner() {
    return new WalkontableCellCoords(Math.min(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
  }

  /**
   * Get bottom right corner of this range
   *
   * @returns {WalkontableCellCoords}
   */
  getBottomRightCorner() {
    return new WalkontableCellCoords(Math.max(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
  }

  /**
   * Get top right corner of this range
   *
   * @returns {WalkontableCellCoords}
   */
  getTopRightCorner() {
    return new WalkontableCellCoords(Math.min(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
  }

  /**
   * Get bottom left corner of this range
   *
   * @returns {WalkontableCellCoords}
   */
  getBottomLeftCorner() {
    return new WalkontableCellCoords(Math.max(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
  }

  /**
   * @param {WalkontableCellCoords} coords
   * @param {WalkontableCellRange} expandedRange
   * @returns {*}
   */
  isCorner(coords, expandedRange) {
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

    return coords.isEqual(this.getTopLeftCorner()) || coords.isEqual(this.getTopRightCorner()) ||
      coords.isEqual(this.getBottomLeftCorner()) || coords.isEqual(this.getBottomRightCorner());
  }

  /**
   * @param {WalkontableCellCoords} coords
   * @param {WalkontableCellRange} expandedRange
   * @returns {WalkontableCellCoords}
   */
  getOppositeCorner(coords, expandedRange) {
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
      return this.getTopRightCorner();
    }
  }

  /**
   * @param {WalkontableCellRange} range
   * @returns {Array}
   */
  getBordersSharedWith(range) {
    if (!this.includesRange(range)) {
      return [];
    }

    const thisBorders = {
      top: Math.min(this.from.row, this.to.row),
      bottom: Math.max(this.from.row, this.to.row),
      left: Math.min(this.from.col, this.to.col),
      right: Math.max(this.from.col, this.to.col)
    };
    const rangeBorders = {
      top: Math.min(range.from.row, range.to.row),
      bottom: Math.max(range.from.row, range.to.row),
      left: Math.min(range.from.col, range.to.col),
      right: Math.max(range.from.col, range.to.col)
    };
    const result = [];

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
  }

  /**
   * Get inner selected cell coords defined by this range
   *
   * @returns {Array}
   */
  getInner() {
    let topLeft = this.getTopLeftCorner();
    let bottomRight = this.getBottomRightCorner();
    let out = [];

    for (let r = topLeft.row; r <= bottomRight.row; r++) {
      for (let c = topLeft.col; c <= bottomRight.col; c++) {
        if (!(this.from.row === r && this.from.col === c) && !(this.to.row === r && this.to.col === c)) {
          out.push(new WalkontableCellCoords(r, c));
        }
      }
    }
    return out;
  }

  /**
   * Get all selected cell coords defined by this range
   *
   * @returns {Array}
   */
  getAll() {
    let topLeft = this.getTopLeftCorner();
    let bottomRight = this.getBottomRightCorner();
    let out = [];

    for (let r = topLeft.row; r <= bottomRight.row; r++) {
      for (let c = topLeft.col; c <= bottomRight.col; c++) {
        if (topLeft.row === r && topLeft.col === c) {
          out.push(topLeft);

        } else if (bottomRight.row === r && bottomRight.col === c) {
          out.push(bottomRight);

        } else {
          out.push(new WalkontableCellCoords(r, c));
        }
      }
    }

    return out;
  }

  /**
   * Runs a callback function against all cells in the range. You can break the iteration by returning
   * `false` in the callback function
   *
   * @param callback {Function}
   */
  forAll(callback) {
    let topLeft = this.getTopLeftCorner();
    let bottomRight = this.getBottomRightCorner();

    for (let r = topLeft.row; r <= bottomRight.row; r++) {
      for (let c = topLeft.col; c <= bottomRight.col; c++) {
        let breakIteration = callback(r, c);

        if (breakIteration === false) {
          return;
        }
      }
    }
  }
}

export {WalkontableCellRange};

window.WalkontableCellRange = WalkontableCellRange;
