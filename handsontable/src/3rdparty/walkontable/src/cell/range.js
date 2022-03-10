import CellCoords from './../cell/coords';

/**
 * CellRange holds cell coordinates as {@link CellCoords} instances. This object represent unit of the selection layer which
 * can contains multiple contiguous cells or single cell.
 *
 * @util
 */
class CellRange {
  /**
   * Used to draw bold border around a cell where selection was started and to edit the cell
   * when you press Enter. The highlight cannot point to headers (negative values) so its
   * coordinates object is normalized while assigning.
   *
   * @type {CellCoords}
   */
  highlight = null;
  /**
   * Usually the same as highlight, but in Excel there is distinction - one can change
   * highlight within a selection.
   *
   * @type {CellCoords}
   */
  from = null;
  /**
   * End selection.
   *
   * @type {CellCoords}
   */
  to = null;
  /**
   * @type {boolean}
   */
  #isRtl = false;

  constructor(highlight, from = highlight, to = highlight, isRtl = false) {
    this.highlight = highlight.clone().normalize();
    this.from = from.clone();
    this.to = to.clone();
    this.#isRtl = isRtl;
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
    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();

    return topStart.row <= row && bottomEnd.row >= row && topStart.col <= col && bottomEnd.col >= col;
  }

  /**
   * Checks if given range is within of this range.
   *
   * @param {CellRange} cellRange The cells range to check.
   * @returns {boolean}
   */
  includesRange(cellRange) {
    return this.includes(cellRange.getOuterTopStartCorner()) &&
           this.includes(cellRange.getOuterBottomEndCorner());
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
    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();

    if (cellCoords.row < topStart.row || cellCoords.col < topStart.col ||
        cellCoords.row > bottomEnd.row || cellCoords.col > bottomEnd.col) {
      this.from = this._createCellCoords(Math.min(topStart.row, cellCoords.row),
        Math.min(topStart.col, cellCoords.col));
      this.to = this._createCellCoords(Math.max(bottomEnd.row, cellCoords.row),
        Math.max(bottomEnd.col, cellCoords.col));

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

    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();
    const initialDirection = this.getDirection();

    const expandingTopStart = expandingRange.getOuterTopStartCorner();
    const expandingBottomEnd = expandingRange.getOuterBottomEndCorner();

    const resultTopRow = Math.min(topStart.row, expandingTopStart.row);
    const resultTopCol = Math.min(topStart.col, expandingTopStart.col);
    const resultBottomRow = Math.max(bottomEnd.row, expandingBottomEnd.row);
    const resultBottomCol = Math.max(bottomEnd.col, expandingBottomEnd.col);

    const finalFrom = this._createCellCoords(resultTopRow, resultTopCol);
    const finalTo = this._createCellCoords(resultBottomRow, resultBottomCol);

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
   * Gets the top left (in LTR) or top right (in RTL) corner coordinates of this range. If the corner contains
   * header coordinates (negative values), the corner coordinates will be normalized to 0.
   *
   * @returns {CellCoords}
   */
  getTopStartCorner() {
    return this._createCellCoords(Math.min(this.from.row, this.to.row),
      Math.min(this.from.col, this.to.col)).normalize();
  }

  /**
   * Gets the top left corner coordinates of this range, no matter if the code runs in LTR or RTL document mode.
   * If the corner contains header coordinates (negative values), the corner coordinates will be normalized to 0.
   *
   * @returns {CellCoords}
   */
  getTopLeftCorner() {
    return this.#isRtl ? this.getTopEndCorner() : this.getTopStartCorner();
  }

  /**
   * Gets the bottom right (in LTR) or bottom left (in RTL) corner coordinates of this range. If the corner contains
   * header coordinates (negative values), the corner coordinates will be normalized to 0.
   *
   * @returns {CellCoords}
   */
  getBottomEndCorner() {
    return this._createCellCoords(Math.max(this.from.row, this.to.row),
      Math.max(this.from.col, this.to.col)).normalize();
  }

  /**
   * Gets the bottom right corner coordinates of this range, no matter if the code runs in LTR or RTL document mode.
   * If the corner contains header coordinates (negative values), the corner coordinates will be normalized to 0.
   *
   * @returns {CellCoords}
   */
  getBottomRightCorner() {
    return this.#isRtl ? this.getBottomStartCorner() : this.getBottomEndCorner();
  }

  /**
   * Gets the top right (in LTR) or top left (in RTL) corner coordinates of this range. If the corner contains
   * header coordinates (negative values), the corner coordinates will be normalized to 0.
   *
   * @returns {CellCoords}
   */
  getTopEndCorner() {
    return this._createCellCoords(Math.min(this.from.row, this.to.row),
      Math.max(this.from.col, this.to.col)).normalize();
  }

  /**
   * Gets the top right corner coordinates of this range, no matter if the code runs in LTR or RTL document mode.
   * If the corner contains header coordinates (negative values), the corner coordinates will be normalized to 0.
   *
   * @returns {CellCoords}
   */
  getTopRightCorner() {
    return this.#isRtl ? this.getTopStartCorner() : this.getTopEndCorner();
  }

  /**
   * Gets the bottom left (in LTR) or bottom right (in RTL) corner coordinates of this range. If the corner
   * contains header coordinates (negative values), the corner coordinates will be normalized to 0.
   *
   * @returns {CellCoords}
   */
  getBottomStartCorner() {
    return this._createCellCoords(Math.max(this.from.row, this.to.row),
      Math.min(this.from.col, this.to.col)).normalize();
  }

  /**
   * Gets the bottom left corner coordinates of this range, no matter if the code runs in LTR or RTL document mode.
   * If the corner contains header coordinates (negative values), the corner coordinates will be normalized to 0.
   *
   * @returns {CellCoords}
   */
  getBottomLeftCorner() {
    return this.#isRtl ? this.getBottomEndCorner() : this.getBottomStartCorner();
  }

  /**
   * Gets the top left (in LTR) or top right (in RTL) corner coordinates of this range. If the corner
   * contains header coordinates (negative values), then the top and start coordinates will be pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterTopStartCorner() {
    return this._createCellCoords(Math.min(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
  }

  /**
   * Gets the top left corner coordinates of this range, no matter if the code runs in LTR or RTL document mode.
   * If the corner contains header coordinates (negative values), then the top and left coordinates will be
   * pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterTopLeftCorner() {
    return this.#isRtl ? this.getOuterTopEndCorner() : this.getOuterTopStartCorner();
  }

  /**
   * Gets the bottom right (in LTR) or bottom left (in RTL) corner coordinates of this range. If the corner
   * contains header coordinates (negative values), then the top and start coordinates will be pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterBottomEndCorner() {
    return this._createCellCoords(Math.max(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
  }

  /**
   * Gets the bottom right corner coordinates of this range, no matter if the code runs in LTR or RTL document mode.
   * If the corner contains header coordinates (negative values), then the top and left coordinates will be
   * pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterBottomRightCorner() {
    return this.#isRtl ? this.getOuterBottomStartCorner() : this.getOuterBottomEndCorner();
  }

  /**
   * Gets the top right (in LTR) or top left (in RTL) corner coordinates of this range. If the corner
   * contains header coordinates (negative values), then the top and start coordinates will be pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterTopEndCorner() {
    return this._createCellCoords(Math.min(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
  }

  /**
   * Gets the top right corner coordinates of this range, no matter if the code runs in LTR or RTL document mode.
   * If the corner contains header coordinates (negative values), then the top and left coordinates will be
   * pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterTopRightCorner() {
    return this.#isRtl ? this.getOuterTopStartCorner() : this.getOuterTopEndCorner();
  }

  /**
   * Gets the bottom left (in LTR) or bottom right (in RTL) corner coordinates of this range. If the corner
   * contains header coordinates (negative values), then the top and start coordinates will be pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterBottomStartCorner() {
    return this._createCellCoords(Math.max(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
  }

  /**
   * Gets the bottom left corner coordinates of this range, no matter if the code runs in LTR or RTL document mode.
   * If the corner contains header coordinates (negative values), then the top and left coordinates will be
   * pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterBottomLeftCorner() {
    return this.#isRtl ? this.getOuterBottomEndCorner() : this.getOuterBottomStartCorner();
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
       (this.getOuterTopLeftCorner().isEqual(this._createCellCoords(expandedRange.from.row, expandedRange.from.col)) ||
       this.getOuterTopRightCorner().isEqual(this._createCellCoords(expandedRange.from.row, expandedRange.to.col)) ||
       this.getOuterBottomLeftCorner().isEqual(this._createCellCoords(expandedRange.to.row, expandedRange.from.col)) ||
       this.getOuterBottomRightCorner().isEqual(this._createCellCoords(expandedRange.to.row, expandedRange.to.col)))) {
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
      const { from, to } = expandedRange;

      if (expandedRange.includes(coords)) {
        if (this.getOuterTopStartCorner().isEqual(this._createCellCoords(from.row, from.col))) {
          return this.getOuterBottomEndCorner();
        }
        if (this.getOuterTopEndCorner().isEqual(this._createCellCoords(from.row, to.col))) {
          return this.getOuterBottomStartCorner();
        }
        if (this.getOuterBottomStartCorner().isEqual(this._createCellCoords(to.row, from.col))) {
          return this.getOuterTopEndCorner();
        }
        if (this.getOuterBottomEndCorner().isEqual(this._createCellCoords(to.row, to.col))) {
          return this.getOuterTopStartCorner();
        }
      }
    }

    if (coords.isEqual(this.getOuterBottomEndCorner())) {
      return this.getOuterTopStartCorner();

    } else if (coords.isEqual(this.getOuterTopStartCorner())) {
      return this.getOuterBottomEndCorner();

    } else if (coords.isEqual(this.getOuterTopEndCorner())) {
      return this.getOuterBottomStartCorner();

    } else if (coords.isEqual(this.getOuterBottomStartCorner())) {
      return this.getOuterTopEndCorner();
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
    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();
    const out = [];

    for (let r = topStart.row; r <= bottomEnd.row; r++) {
      for (let c = topStart.col; c <= bottomEnd.col; c++) {
        if (!(this.from.row === r && this.from.col === c) && !(this.to.row === r && this.to.col === c)) {
          out.push(this._createCellCoords(r, c));
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
    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();
    const out = [];

    for (let r = topStart.row; r <= bottomEnd.row; r++) {
      for (let c = topStart.col; c <= bottomEnd.col; c++) {
        if (topStart.row === r && topStart.col === c) {
          out.push(topStart);

        } else if (bottomEnd.row === r && bottomEnd.col === c) {
          out.push(bottomEnd);

        } else {
          out.push(this._createCellCoords(r, c));
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
    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();

    for (let r = topStart.row; r <= bottomEnd.row; r++) {
      for (let c = topStart.col; c <= bottomEnd.col; c++) {
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
    return new CellRange(this.highlight, this.from, this.to, this.#isRtl);
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

  /**
   * Creates and returns a new instance of the CellCoords object. The object automatically inherits
   * the LTR/RTL flag from this CellRange instance.
   *
   * @private
   * @param {number} row The row index.
   * @param {number} column The column index.
   * @returns {CellCoords}
   */
  _createCellCoords(row, column) {
    return new CellCoords(row, column, this.#isRtl);
  }
}

export default CellRange;
