import CellCoords from './../cell/coords';

/**
 * CellRange holds cell coordinates as {@link CellCoords} instances. This object represent unit of the selection layer which
 * can contains multiple contiquous cells or single cell.
 *
 * @util
 */
class CellRange {
  constructor(highlight, from = highlight, to = highlight) {
    /**
     * Used to draw bold border around a cell where selection was started and to edit the cell
     * when you press Enter. The highlight cannot point to headers (negative values) so its
     * coordinates object is normalized while assigning.
     *
     * @type {CellCoords}
     */
    this.highlight = highlight.clone().normalize();
    /**
     * Usually the same as highlight, but in Excel there is distinction - one can change
     * highlight within a selection.
     *
     * @type {CellCoords}
     */
    this.from = from.clone();
    /**
     * End selection.
     *
     * @type {CellCoords}
     */
    this.to = to.clone();
  }

  /**
   * Set the new coordinates for highlighting selection.
   *
   * @param {CellCoords} coords Coordinates to use.
   * @returns {CellRange}
   */
  setHighlight(coords) {
    this.highlight = coords.clone().normalize();

    return this;
  }

  /**
   * Set the new coordinates where selection starts from.
   *
   * @param {CellCoords} coords Coordinates to use.
   * @returns {CellRange}
   */
  setFrom(coords) {
    this.from = coords.clone();

    return this;
  }

  /**
   * Set new coordinates where selection ends from.
   *
   * @param {CellCoords} coords Coordinates to use.
   * @returns {CellRange}
   */
  setTo(coords) {
    this.to = coords.clone();

    return this;
  }

  /**
   * Checks if given coordinates are valid in context of a given Walkontable instance.
   *
   * @param {Walkontable} wot The Walkontable instance.
   * @returns {boolean}
   */
  isValid(wot) {
    return this.from.isValid(wot) && this.to.isValid(wot);
  }

  /**
   * Checks if this cell range is restricted to one cell.
   *
   * @returns {boolean}
   */
  isSingle() {
    return this.from.row >= 0 && this.from.row === this.to.row &&
           this.from.col >= 0 && this.from.col === this.to.col;
  }

  /**
   * Returns selected range height (in number of rows including rows' headers).
   *
   * @returns {number}
   */
  getOuterHeight() {
    return Math.max(this.from.row, this.to.row) - Math.min(this.from.row, this.to.row) + 1;
  }

  /**
   * Returns selected range width (in number of columns including columns' headers).
   *
   * @returns {number}
   */
  getOuterWidth() {
    return Math.max(this.from.col, this.to.col) - Math.min(this.from.col, this.to.col) + 1;
  }

  /**
   * Returns selected range height (in number of rows excluding rows' headers).
   *
   * @returns {number}
   */
  getHeight() {
    const fromRow = Math.max(this.from.row, 0);
    const toRow = Math.max(this.to.row, 0);

    return Math.max(fromRow, toRow) - Math.min(fromRow, toRow) + 1;
  }

  /**
   * Returns selected range width (in number of columns excluding columns' headers).
   *
   * @returns {number}
   */
  getWidth() {
    const fromCol = Math.max(this.from.col, 0);
    const toCol = Math.max(this.to.col, 0);

    return Math.max(fromCol, toCol) - Math.min(fromCol, toCol) + 1;
  }

  /**
   * Checks if given cell coordinates are within `from` and `to` cell coordinates of this range.
   *
   * @param {CellCoords} cellCoords The cell coordinates to check.
   * @returns {boolean}
   */
  includes(cellCoords) {
    const { row, col } = cellCoords;
    const topLeft = this.getOuterTopLeftCorner();
    const bottomRight = this.getOuterBottomRightCorner();

    return topLeft.row <= row && bottomRight.row >= row && topLeft.col <= col && bottomRight.col >= col;
  }

  /**
   * Checks if given range is within of this range.
   *
   * @param {CellRange} cellRange The cells range to check.
   * @returns {boolean}
   */
  includesRange(cellRange) {
    return this.includes(cellRange.getOuterTopLeftCorner()) &&
           this.includes(cellRange.getOuterBottomRightCorner());
  }

  /**
   * Checks if given range is equal to this range.
   *
   * @param {CellRange} cellRange The cells range to check.
   * @returns {boolean}
   */
  isEqual(cellRange) {
    return (Math.min(this.from.row, this.to.row) === Math.min(cellRange.from.row, cellRange.to.row)) &&
      (Math.max(this.from.row, this.to.row) === Math.max(cellRange.from.row, cellRange.to.row)) &&
      (Math.min(this.from.col, this.to.col) === Math.min(cellRange.from.col, cellRange.to.col)) &&
      (Math.max(this.from.col, this.to.col) === Math.max(cellRange.from.col, cellRange.to.col));
  }

  /**
   * Checks if tested range overlaps with the range. Range A is considered to to be overlapping with range B
   * if intersection of A and B or B and A is not empty.
   *
   * @param {CellRange} cellRange The cells range to check.
   * @returns {boolean}
   */
  overlaps(cellRange) {
    return cellRange.isSouthEastOf(this.getOuterTopLeftCorner()) &&
           cellRange.isNorthWestOf(this.getOuterBottomRightCorner());
  }

  /**
   * Checks if tested coordinates are positioned in south-east from this cell range.
   *
   * @param {CellRange} cellRange The cells range to check.
   * @returns {boolean}
   */
  isSouthEastOf(cellRange) {
    return this.getOuterTopLeftCorner().isSouthEastOf(cellRange) ||
           this.getOuterBottomRightCorner().isSouthEastOf(cellRange);
  }

  /**
   * Checks if tested coordinates are positioned in north-west from this cell range.
   *
   * @param {CellRange} cellRange The cells range to check.
   * @returns {boolean}
   */
  isNorthWestOf(cellRange) {
    return this.getOuterTopLeftCorner().isNorthWestOf(cellRange) ||
           this.getOuterBottomRightCorner().isNorthWestOf(cellRange);
  }

  /**
   * Returns `true` if the provided range is overlapping the current range horizontally (e.g. The current range's last
   * column is 5 and the provided range's first column is 3).
   *
   * @param {CellRange} cellRange The cells range to check.
   * @returns {boolean}
   */
  isOverlappingHorizontally(cellRange) {
    return (this.getOuterTopRightCorner().col >= cellRange.getOuterTopLeftCorner().col &&
            this.getOuterTopRightCorner().col <= cellRange.getOuterTopRightCorner().col) ||
           (this.getOuterTopLeftCorner().col <= cellRange.getOuterTopRightCorner().col &&
            this.getOuterTopLeftCorner().col >= cellRange.getOuterTopLeftCorner().col);
  }

  /**
   * Returns `true` if the provided range is overlapping the current range vertically (e.g. The current range's last
   *  row is 5 and the provided range's first row is 3).
   *
   * @param {CellRange} cellRange The cells range to check.
   * @returns {boolean}
   */
  isOverlappingVertically(cellRange) {
    return (this.getOuterBottomRightCorner().row >= cellRange.getOuterTopRightCorner().row &&
            this.getOuterBottomRightCorner().row <= cellRange.getOuterBottomRightCorner().row) ||
           (this.getOuterTopRightCorner().row <= cellRange.getOuterBottomRightCorner().row &&
            this.getOuterTopRightCorner().row >= cellRange.getOuterTopRightCorner().row);
  }

  /**
   * Adds a cell to a range (only if exceeds corners of the range). Returns information if range was expanded.
   *
   * @param {CellCoords} cellCoords The cell coordinates.
   * @returns {boolean}
   */
  expand(cellCoords) {
    const topLeft = this.getOuterTopLeftCorner();
    const bottomRight = this.getOuterBottomRightCorner();

    if (cellCoords.row < topLeft.row || cellCoords.col < topLeft.col ||
      cellCoords.row > bottomRight.row || cellCoords.col > bottomRight.col) {
      this.from = new CellCoords(Math.min(topLeft.row, cellCoords.row), Math.min(topLeft.col, cellCoords.col));
      this.to = new CellCoords(Math.max(bottomRight.row, cellCoords.row), Math.max(bottomRight.col, cellCoords.col));

      return true;
    }

    return false;
  }

  /**
   * Expand the current object by the range passed in the first argument.
   *
   * @param {CellRange} expandingRange Object extending the range.
   * @returns {boolean}
   */
  expandByRange(expandingRange) {
    if (this.includesRange(expandingRange) || !this.overlaps(expandingRange)) {
      return false;
    }

    const topLeft = this.getOuterTopLeftCorner();
    const bottomRight = this.getOuterBottomRightCorner();
    const initialDirection = this.getDirection();

    const expandingTopLeft = expandingRange.getOuterTopLeftCorner();
    const expandingBottomRight = expandingRange.getOuterBottomRightCorner();

    const resultTopRow = Math.min(topLeft.row, expandingTopLeft.row);
    const resultTopCol = Math.min(topLeft.col, expandingTopLeft.col);
    const resultBottomRow = Math.max(bottomRight.row, expandingBottomRight.row);
    const resultBottomCol = Math.max(bottomRight.col, expandingBottomRight.col);

    const finalFrom = new CellCoords(resultTopRow, resultTopCol);
    const finalTo = new CellCoords(resultBottomRow, resultBottomCol);

    this.from = finalFrom;
    this.to = finalTo;

    this.setDirection(initialDirection);

    if (this.highlight.row === this.getOuterBottomRightCorner().row && this.getVerticalDirection() === 'N-S') {
      this.flipDirectionVertically();
    }

    if (this.highlight.col === this.getOuterTopRightCorner().col && this.getHorizontalDirection() === 'W-E') {
      this.flipDirectionHorizontally();
    }

    return true;
  }

  /**
   * Gets the direction of the selection.
   *
   * @returns {string} Returns one of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`.
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
   * Sets the direction of the selection.
   *
   * @param {string} direction One of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`.
   */
  setDirection(direction) {
    switch (direction) {
      case 'NW-SE':
        [this.from, this.to] = [this.getOuterTopLeftCorner(), this.getOuterBottomRightCorner()];
        break;
      case 'NE-SW':
        [this.from, this.to] = [this.getOuterTopRightCorner(), this.getOuterBottomLeftCorner()];
        break;
      case 'SE-NW':
        [this.from, this.to] = [this.getOuterBottomRightCorner(), this.getOuterTopLeftCorner()];
        break;
      case 'SW-NE':
        [this.from, this.to] = [this.getOuterBottomLeftCorner(), this.getOuterTopRightCorner()];
        break;
      default:
        break;
    }
  }

  /**
   * Gets the vertical direction of the range.
   *
   * @returns {string} Returns one of the values: `N-S` (north->south), `S-N` (south->north).
   */
  getVerticalDirection() {
    return ['NE-SW', 'NW-SE'].indexOf(this.getDirection()) > -1 ? 'N-S' : 'S-N';
  }

  /**
   * Gets the horizontal direction of the range.
   *
   * @returns {string} Returns one of the values: `W-E` (west->east), `E-W` (east->west).
   */
  getHorizontalDirection() {
    return ['NW-SE', 'SW-NE'].indexOf(this.getDirection()) > -1 ? 'W-E' : 'E-W';
  }

  /**
   * Flip the direction vertically. (e.g. `NW-SE` changes to `SW-NE`).
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
   * Flip the direction horizontally. (e.g. `NW-SE` changes to `NE-SW`).
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
   * Gets the top left corner of this range. If the corner contains header coordinates
   * (negative values), the corner coordinates will be normalized to 0.
   *
   * @returns {CellCoords}
   */
  getTopLeftCorner() {
    return new CellCoords(Math.min(this.from.row, this.to.row), Math.min(this.from.col, this.to.col)).normalize();
  }

  /**
   * Gets the bottom right corner of this range. If the corner contains header coordinates
   * (negative values), the corner coordinates will be normalized to 0.
   *
   * @returns {CellCoords}
   */
  getBottomRightCorner() {
    return new CellCoords(Math.max(this.from.row, this.to.row), Math.max(this.from.col, this.to.col)).normalize();
  }

  /**
   * Gets the top right corner of this range. If the corner contains header coordinates
   * (negative values), the corner coordinates will be normalized to 0.
   *
   * @returns {CellCoords}
   */
  getTopRightCorner() {
    return new CellCoords(Math.min(this.from.row, this.to.row), Math.max(this.from.col, this.to.col)).normalize();
  }

  /**
   * Gets the bottom left corner of this range. If the corner contains header coordinates
   * (negative values), the corner coordinates will be normalized to 0.
   *
   * @returns {CellCoords}
   */
  getBottomLeftCorner() {
    return new CellCoords(Math.max(this.from.row, this.to.row), Math.min(this.from.col, this.to.col)).normalize();
  }

  /**
   * Gets the top left corner of this range. If the corner contains header coordinates
   * (negative values), then the top and left coordinates will be pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterTopLeftCorner() {
    return new CellCoords(Math.min(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
  }

  /**
   * Gets the bottom right corner of this range.
   *
   * @returns {CellCoords}
   */
  getOuterBottomRightCorner() {
    return new CellCoords(Math.max(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
  }

  /**
   * Gets the top right corner of this range. If the corner contains header coordinates
   * (negative values), then the top coordinate will be pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterTopRightCorner() {
    return new CellCoords(Math.min(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
  }

  /**
   * Gets the bottom left corner of this range. If the corner contains header coordinates
   * (negative values), then the left coordinate will be pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterBottomLeftCorner() {
    return new CellCoords(Math.max(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
  }

  /**
   * Checks if coordinates match to one of the 4th corners of this range.
   *
   * @param {CellCoords} coords Cell coordinates to check.
   * @param {CellRange} [expandedRange] The cells range to compare with.
   * @returns {boolean}
   */
  isCorner(coords, expandedRange) {
    if (expandedRange && expandedRange.includes(coords) &&
       (this.getOuterTopLeftCorner().isEqual(new CellCoords(expandedRange.from.row, expandedRange.from.col)) ||
       this.getOuterTopRightCorner().isEqual(new CellCoords(expandedRange.from.row, expandedRange.to.col)) ||
       this.getOuterBottomLeftCorner().isEqual(new CellCoords(expandedRange.to.row, expandedRange.from.col)) ||
       this.getOuterBottomRightCorner().isEqual(new CellCoords(expandedRange.to.row, expandedRange.to.col)))) {
      return true;
    }

    return coords.isEqual(this.getOuterTopLeftCorner()) || coords.isEqual(this.getOuterTopRightCorner()) ||
      coords.isEqual(this.getOuterBottomLeftCorner()) || coords.isEqual(this.getOuterBottomRightCorner());
  }

  /**
   * Gets coordinates of the corner which is opposite to the matched. When the passed coordinates matched to the
   * bottom-right corner of this range then the coordinates for top-left will be returned.
   *
   * @param {CellCoords} coords Cell coordinates to check.
   * @param {CellRange} [expandedRange] The cells range to compare with.
   * @returns {CellCoords}
   */
  getOppositeCorner(coords, expandedRange) {
    if (!(coords instanceof CellCoords)) {
      return false;
    }

    if (expandedRange) {
      if (expandedRange.includes(coords)) {
        if (this.getOuterTopLeftCorner().isEqual(new CellCoords(expandedRange.from.row, expandedRange.from.col))) {
          return this.getOuterBottomRightCorner();
        }
        if (this.getOuterTopRightCorner().isEqual(new CellCoords(expandedRange.from.row, expandedRange.to.col))) {
          return this.getOuterBottomLeftCorner();
        }
        if (this.getOuterBottomLeftCorner().isEqual(new CellCoords(expandedRange.to.row, expandedRange.from.col))) {
          return this.getOuterTopRightCorner();
        }
        if (this.getOuterBottomRightCorner().isEqual(new CellCoords(expandedRange.to.row, expandedRange.to.col))) {
          return this.getOuterTopLeftCorner();
        }
      }
    }

    if (coords.isEqual(this.getOuterBottomRightCorner())) {
      return this.getOuterTopLeftCorner();

    } else if (coords.isEqual(this.getOuterTopLeftCorner())) {
      return this.getOuterBottomRightCorner();

    } else if (coords.isEqual(this.getOuterTopRightCorner())) {
      return this.getOuterBottomLeftCorner();

    } else if (coords.isEqual(this.getOuterBottomLeftCorner())) {
      return this.getOuterTopRightCorner();
    }
  }

  /**
   * @param {CellRange} range The cells range to compare with.
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

    if (thisBorders.top === rangeBorders.top) {
      result.push('top');
    }
    if (thisBorders.right === rangeBorders.right) {
      result.push('right');
    }
    if (thisBorders.bottom === rangeBorders.bottom) {
      result.push('bottom');
    }
    if (thisBorders.left === rangeBorders.left) {
      result.push('left');
    }

    return result;
  }

  /**
   * Get inner selected cell coords defined by this range.
   *
   * @returns {Array}
   */
  getInner() {
    const topLeft = this.getOuterTopLeftCorner();
    const bottomRight = this.getOuterBottomRightCorner();
    const out = [];

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
   * Get all selected cell coords defined by this range.
   *
   * @returns {Array}
   */
  getAll() {
    const topLeft = this.getOuterTopLeftCorner();
    const bottomRight = this.getOuterBottomRightCorner();
    const out = [];

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
   * `false` in the callback function.
   *
   * @param {Function} callback The callback function.
   */
  forAll(callback) {
    const topLeft = this.getOuterTopLeftCorner();
    const bottomRight = this.getOuterBottomRightCorner();

    for (let r = topLeft.row; r <= bottomRight.row; r++) {
      for (let c = topLeft.col; c <= bottomRight.col; c++) {
        const breakIteration = callback(r, c);

        if (breakIteration === false) {
          return;
        }
      }
    }
  }

  /**
   * Clones the range coordinates.
   *
   * @returns {CellRange}
   */
  clone() {
    return new CellRange(this.highlight, this.from, this.to);
  }

  /**
   * Convert CellRange to literal object.
   *
   * @returns {object} Returns a literal object with `from` and `to` properties which each of that object
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
