import CellCoords from './../cell/coords';

/**
 * A cell range is a set of exactly two CellCoords (that can be the same or different).
 *
 * @class CellRange
 */
class CellRange {
  /**
   * @param {CellCoords} highlight Used to draw bold border around a cell where selection was
   *                               started and to edit the cell when you press Enter.
   * @param {CellCoords} [from] Usually the same as highlight, but in Excel there is distinction - one can change
   *                            highlight within a selection.
   * @param {CellCoords} [to] End selection.
   */
  constructor(highlight, from = highlight, to = highlight) {
    this.highlight = highlight;
    this.from = from;
    this.to = to;
  }

  /**
   * Set the new coordinates for highlighting selection.
   *
   * @param {CellCoords} coords Coordinates to use.
   */
  setHighlight(coords) {
    this.highlight = coords;

    return this;
  }

  /**
   * Set the new coordinates where selection starts from.
   *
   * @param {CellCoords} coords Coordinates to use.
   */
  setFrom(coords) {
    this.from = coords;

    return this;
  }

  /**
   * Set new coordinates where selection ends from.
   *
   * @param {CellCoords} coords Coordinates to use.
   */
  setTo(coords) {
    this.to = coords;

    return this;
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
   * @param {CellCoords} cellCoords
   * @returns {Boolean}
   */
  includes(cellCoords) {
    const {row, col} = cellCoords;
    const topLeft = this.getTopLeftCorner();
    const bottomRight = this.getBottomRightCorner();

    return topLeft.row <= row && bottomRight.row >= row &&
      topLeft.col <= col && bottomRight.col >= col;
  }

  /**
   * Checks if given range is within of this range
   *
   * @param {CellRange} testedRange
   * @returns {Boolean}
   */
  includesRange(testedRange) {
    return this.includes(testedRange.getTopLeftCorner()) && this.includes(testedRange.getBottomRightCorner());
  }

  /**
   * Checks if given range is equal to this range
   *
   * @param {CellRange} testedRange
   * @returns {Boolean}
   */
  isEqual(testedRange) {
    return (Math.min(this.from.row, this.to.row) === Math.min(testedRange.from.row, testedRange.to.row)) &&
      (Math.max(this.from.row, this.to.row) === Math.max(testedRange.from.row, testedRange.to.row)) &&
      (Math.min(this.from.col, this.to.col) === Math.min(testedRange.from.col, testedRange.to.col)) &&
      (Math.max(this.from.col, this.to.col) === Math.max(testedRange.from.col, testedRange.to.col));
  }

  /**
   * Checks if tested range overlaps with the range.
   * Range A is considered to to be overlapping with range B if intersection of A and B or B and A is not empty.
   *
   * @param {CellRange} testedRange
   * @returns {Boolean}
   */
  overlaps(testedRange) {
    return testedRange.isSouthEastOf(this.getTopLeftCorner()) && testedRange.isNorthWestOf(this.getBottomRightCorner());
  }

  /**
   * @param {CellRange} testedCoords
   * @returns {Boolean}
   */
  isSouthEastOf(testedCoords) {
    return this.getTopLeftCorner().isSouthEastOf(testedCoords) || this.getBottomRightCorner().isSouthEastOf(testedCoords);
  }

  /**
   * @param {CellRange} testedCoords
   * @returns {Boolean}
   */
  isNorthWestOf(testedCoords) {
    return this.getTopLeftCorner().isNorthWestOf(testedCoords) || this.getBottomRightCorner().isNorthWestOf(testedCoords);
  }

  /**
   * Returns `true` if the provided range is overlapping the current range horizontally
   * (e.g. the current range's last column is 5 and the provided range's first column is 3).
   *
   * @param {CellRange} range The range to check against.
   * @returns {Boolean}
   */
  isOverlappingHorizontally(range) {
    return (this.getTopRightCorner().col >= range.getTopLeftCorner().col && this.getTopRightCorner().col <= range.getTopRightCorner().col)
      || (this.getTopLeftCorner().col <= range.getTopRightCorner().col && this.getTopLeftCorner().col >= range.getTopLeftCorner().col);
  }

  /**
   * Returns `true` if the provided range is overlapping the current range vertically
   * (e.g. the current range's last row is 5 and the provided range's first row is 3).
   *
   * @param {CellRange} range The range to check against.
   * @returns {Boolean}
   */
  isOverlappingVertically(range) {
    return (this.getBottomRightCorner().row >= range.getTopRightCorner().row && this.getBottomRightCorner().row <= range.getBottomRightCorner().row)
      || (this.getTopRightCorner().row <= range.getBottomRightCorner().row && this.getTopRightCorner().row >= range.getTopRightCorner().row);
  }

  /**
   * Adds a cell to a range (only if exceeds corners of the range). Returns information if range was expanded
   *
   * @param {CellCoords} cellCoords
   * @returns {Boolean}
   */
  expand(cellCoords) {
    const topLeft = this.getTopLeftCorner();
    const bottomRight = this.getBottomRightCorner();

    if (cellCoords.row < topLeft.row || cellCoords.col < topLeft.col ||
      cellCoords.row > bottomRight.row || cellCoords.col > bottomRight.col) {
      this.from = new CellCoords(Math.min(topLeft.row, cellCoords.row), Math.min(topLeft.col, cellCoords.col));
      this.to = new CellCoords(Math.max(bottomRight.row, cellCoords.row), Math.max(bottomRight.col, cellCoords.col));

      return true;
    }

    return false;
  }

  /**
   * @param {CellRange} expandingRange
   * @returns {Boolean}
   */
  expandByRange(expandingRange) {
    if (this.includesRange(expandingRange) || !this.overlaps(expandingRange)) {
      return false;
    }

    const topLeft = this.getTopLeftCorner();
    const bottomRight = this.getBottomRightCorner();
    const initialDirection = this.getDirection();

    const expandingTopLeft = expandingRange.getTopLeftCorner();
    const expandingBottomRight = expandingRange.getBottomRightCorner();

    const resultTopRow = Math.min(topLeft.row, expandingTopLeft.row);
    const resultTopCol = Math.min(topLeft.col, expandingTopLeft.col);
    const resultBottomRow = Math.max(bottomRight.row, expandingBottomRight.row);
    const resultBottomCol = Math.max(bottomRight.col, expandingBottomRight.col);

    let finalFrom = new CellCoords(resultTopRow, resultTopCol);
    let finalTo = new CellCoords(resultBottomRow, resultBottomCol);

    this.from = finalFrom;
    this.to = finalTo;

    this.setDirection(initialDirection);

    if (this.highlight.row === this.getBottomRightCorner().row && this.getVerticalDirection() === 'N-S') {
      this.flipDirectionVertically();
    }

    if (this.highlight.col === this.getTopRightCorner().col && this.getHorizontalDirection() === 'W-E') {
      this.flipDirectionHorizontally();
    }

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
   * Get the vertical direction of the range.
   *
   * @returns {String} Available options: `N-S` (north->south), `S-N` (south->north).
   */
  getVerticalDirection() {
    return ['NE-SW', 'NW-SE'].indexOf(this.getDirection()) > -1 ? 'N-S' : 'S-N';
  }

  /**
   * Get the horizontal direction of the range.
   *
   * @returns {String} Available options: `W-E` (west->east), `E-W` (east->west).
   */
  getHorizontalDirection() {
    return ['NW-SE', 'SW-NE'].indexOf(this.getDirection()) > -1 ? 'W-E' : 'E-W';
  }

  /**
   * @param {String} direction
   */
  setDirection(direction) {
    switch (direction) {
      case 'NW-SE':
        [this.from, this.to] = [this.getTopLeftCorner(), this.getBottomRightCorner()];
        break;
      case 'NE-SW':
        [this.from, this.to] = [this.getTopRightCorner(), this.getBottomLeftCorner()];
        break;
      case 'SE-NW':
        [this.from, this.to] = [this.getBottomRightCorner(), this.getTopLeftCorner()];
        break;
      case 'SW-NE':
        [this.from, this.to] = [this.getBottomLeftCorner(), this.getTopRightCorner()];
        break;
      default:
        break;
    }
  }

  /**
   * Flip the direction vertically. (e.g. `NW-SE` changes to `SW-NE`)
   */
  flipDirectionVertically() {
    const direction = this.getDirection();
    switch (direction) {
      case 'NW-SE':
        this.setDirection('SW-NE');
        break;
      case 'NE-SW':
        this.setDirection('SE-NW');
        break;
      case 'SE-NW':
        this.setDirection('NE-SW');
        break;
      case 'SW-NE':
        this.setDirection('NW-SE');
        break;
      default:
        break;
    }
  }

  /**
   * Flip the direction horizontally. (e.g. `NW-SE` changes to `NE-SW`)
   */
  flipDirectionHorizontally() {
    const direction = this.getDirection();
    switch (direction) {
      case 'NW-SE':
        this.setDirection('NE-SW');
        break;
      case 'NE-SW':
        this.setDirection('NW-SE');
        break;
      case 'SE-NW':
        this.setDirection('SW-NE');
        break;
      case 'SW-NE':
        this.setDirection('SE-NW');
        break;
      default:
        break;
    }
  }

  /**
   * Get top left corner of this range
   *
   * @returns {CellCoords}
   */
  getTopLeftCorner() {
    return new CellCoords(Math.min(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
  }

  /**
   * Get bottom right corner of this range
   *
   * @returns {CellCoords}
   */
  getBottomRightCorner() {
    return new CellCoords(Math.max(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
  }

  /**
   * Get top right corner of this range
   *
   * @returns {CellCoords}
   */
  getTopRightCorner() {
    return new CellCoords(Math.min(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
  }

  /**
   * Get bottom left corner of this range
   *
   * @returns {CellCoords}
   */
  getBottomLeftCorner() {
    return new CellCoords(Math.max(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
  }

  /**
   * @param {CellCoords} coords
   * @param {CellRange} expandedRange
   * @returns {*}
   */
  isCorner(coords, expandedRange) {
    if (expandedRange &&
      expandedRange.includes(coords) &&
      (this.getTopLeftCorner().isEqual(new CellCoords(expandedRange.from.row, expandedRange.from.col)) ||
      this.getTopRightCorner().isEqual(new CellCoords(expandedRange.from.row, expandedRange.to.col)) ||
      this.getBottomLeftCorner().isEqual(new CellCoords(expandedRange.to.row, expandedRange.from.col)) ||
      this.getBottomRightCorner().isEqual(new CellCoords(expandedRange.to.row, expandedRange.to.col)))) {
      return true;
    }

    return coords.isEqual(this.getTopLeftCorner()) || coords.isEqual(this.getTopRightCorner()) ||
      coords.isEqual(this.getBottomLeftCorner()) || coords.isEqual(this.getBottomRightCorner());
  }

  /**
   * @param {CellCoords} coords
   * @param {CellRange} expandedRange
   * @returns {CellCoords}
   */
  getOppositeCorner(coords, expandedRange) {
    if (!(coords instanceof CellCoords)) {
      return false;
    }

    if (expandedRange) {
      if (expandedRange.includes(coords)) {
        if (this.getTopLeftCorner().isEqual(new CellCoords(expandedRange.from.row, expandedRange.from.col))) {
          return this.getBottomRightCorner();
        }
        if (this.getTopRightCorner().isEqual(new CellCoords(expandedRange.from.row, expandedRange.to.col))) {
          return this.getBottomLeftCorner();
        }
        if (this.getBottomLeftCorner().isEqual(new CellCoords(expandedRange.to.row, expandedRange.from.col))) {
          return this.getTopRightCorner();
        }
        if (this.getBottomRightCorner().isEqual(new CellCoords(expandedRange.to.row, expandedRange.to.col))) {
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
   * @param {CellRange} range
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
          out.push(new CellCoords(r, c));
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
          out.push(new CellCoords(r, c));
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

  /**
   * Convert CellRange to literal object.
   *
   * @return {Object} Returns a literal object with `from` and `to` properties which each of that object
   *                  contains `row` and `col` keys.
   */
  toObject() {
    return {
      from: this.from.toObject(),
      to: this.to.toObject(),
    };
  }
}

export default CellRange;
