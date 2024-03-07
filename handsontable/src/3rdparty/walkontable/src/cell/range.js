import CellCoords from './../cell/coords';

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @description
 *
 * The `CellRange` class holds a set of cell coordinates ([`CellCoords`](@/api/cellCoords.md) instances)
 * that form a [selection range](@/guides/cell-features/selection/selection.md#select-ranges).
 *
 * A single `CellRange` instance represents a single unit of selection
 * that contains either a single cell or multiple adjacent cells.
 *
 * To import the `CellRange` class:
 *
 * ```js
 * import Handsontable, { CellRange } from '/handsontable';
 *
 * // or, using modules
 * import Handsontable, { CellRange } from '/handsontable/base';
 * ```
 */
class CellRange {
  /**
   * Used to draw bold border around a cell where selection was started and to edit the cell
   * when you press Enter. The highlight cannot point to headers (negative values) so its
   * coordinates object is normalized while assigning.
   *
   * @private
   * @type {CellCoords}
   */
  highlight = null;
  /**
   * Usually the same as highlight, but in Excel there is distinction - one can change
   * highlight within a selection.
   *
   * @private
   * @type {CellCoords}
   */
  from = null;
  /**
   * End selection.
   *
   * @private
   * @type {CellCoords}
   */
  to = null;
  /**
   * @type {boolean}
   */
  #isRtl = false;

  constructor(highlight, from = highlight, to = highlight, isRtl = false) {
    this.highlight = highlight.clone();
    this.from = from.clone();
    this.to = to.clone();
    this.#isRtl = isRtl;
  }

  /**
   * Highlights cell selection at the `coords` coordinates.
   *
   * @param {CellCoords} coords Coordinates to use.
   * @returns {CellRange}
   */
  setHighlight(coords) {
    this.highlight = coords.clone();

    return this;
  }

  /**
   * Sets the `coords` coordinates as the start of your range.
   *
   * @param {CellCoords} coords Coordinates to use.
   * @returns {CellRange}
   */
  setFrom(coords) {
    this.from = coords.clone();

    return this;
  }

  /**
   * Sets the `coords` coordinates as the end of your range.
   *
   * @param {CellCoords} coords Coordinates to use.
   * @returns {CellRange}
   */
  setTo(coords) {
    this.to = coords.clone();

    return this;
  }

  /**
   * Checks if the coordinates in your `CellRange` instance are valid
   * in the context of given table parameters.
   *
   * See the [`isValid()`](@/api/cellCoords.md#isvalid) method of the [`CellCoords`](@/api/cellCoords.md) class.
   *
   * @param {object} tableParams An object with a defined table size.
   * @param {number} tableParams.countRows The total number of rows.
   * @param {number} tableParams.countCols The total number of columns.
   * @param {number} tableParams.countRowHeaders A number of row headers.
   * @param {number} tableParams.countColHeaders A number of column headers.
   * @returns {boolean}
   */
  isValid(tableParams) {
    return this.from.isValid(tableParams) && this.to.isValid(tableParams);
  }

  /**
   * Checks if your range is just a single cell or header.
   *
   * @returns {boolean}
   */
  isSingle() {
    return this.isSingleCell() || this.isSingleHeader();
  }

  /**
   * Checks if your range is just a single cell.
   *
   * @returns {boolean}
   */
  isSingleCell() {
    return this.from.row >= 0 && this.from.row === this.to.row &&
           this.from.col >= 0 && this.from.col === this.to.col;
  }

  /**
   * Checks if your range is just a single header.
   *
   * @returns {boolean}
   */
  isSingleHeader() {
    return (this.from.row < 0 || this.from.col < 0) && this.from.row === this.to.row &&
           this.from.col === this.to.col;
  }

  /**
   * Checks if your range covers only headers range (negative coordinates, without any cells).
   *
   * @returns {boolean}
   */
  isHeader() {
    if (this.from.isHeader() && this.to.isHeader()) {
      return true;
    }

    return this.from.col < 0 && this.to.col < 0 || this.from.row < 0 && this.to.row < 0;
  }

  /**
   * Checks if your range overlaps headers range (negative coordinates).
   *
   * @returns {boolean}
   */
  containsHeaders() {
    return this.from.isHeader() || this.to.isHeader();
  }

  /**
   * Returns the height of your range (as a number of rows, including row headers).
   *
   * @returns {number}
   */
  getOuterHeight() {
    return Math.max(this.from.row, this.to.row) - Math.min(this.from.row, this.to.row) + 1;
  }

  /**
   * Returns the width of your range (as a number of columns, including column headers).
   *
   * @returns {number}
   */
  getOuterWidth() {
    return Math.max(this.from.col, this.to.col) - Math.min(this.from.col, this.to.col) + 1;
  }

  /**
   * Returns the height of your range (as a number of rows, excluding row headers).
   *
   * @returns {number}
   */
  getHeight() {
    // if the selection contains only row headers, return 0
    if (this.from.row < 0 && this.to.row < 0) {
      return 0;
    }

    const fromRow = Math.max(this.from.row, 0);
    const toRow = Math.max(this.to.row, 0);

    return Math.max(fromRow, toRow) - Math.min(fromRow, toRow) + 1;
  }

  /**
   * Returns the width of your range (as a number of columns, excluding column headers).
   *
   * @returns {number}
   */
  getWidth() {
    // if the selection contains only column headers, return 0
    if (this.from.col < 0 && this.to.col < 0) {
      return 0;
    }

    const fromCol = Math.max(this.from.col, 0);
    const toCol = Math.max(this.to.col, 0);

    return Math.max(fromCol, toCol) - Math.min(fromCol, toCol) + 1;
  }

  /**
   * Returns the number of cells within your range (excluding column and row headers).
   *
   * @returns {number}
   */
  getCellsCount() {
    return this.getWidth() * this.getHeight();
  }

  /**
   * Checks if another set of coordinates (`cellCoords`)
   * is within the `from` and `to` coordinates of your range.
   *
   * @param {CellCoords} cellCoords Coordinates to check.
   * @returns {boolean}
   */
  includes(cellCoords) {
    const { row, col } = cellCoords;
    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();

    return topStart.row <= row && bottomEnd.row >= row && topStart.col <= col && bottomEnd.col >= col;
  }

  /**
   * Checks if another range (`cellRange`) is within your range.
   *
   * @param {CellRange} cellRange A range to check.
   * @returns {boolean}
   */
  includesRange(cellRange) {
    return this.includes(cellRange.getOuterTopStartCorner()) &&
           this.includes(cellRange.getOuterBottomEndCorner());
  }

  /**
   * Checks if another range (`cellRange`) is equal to your range.
   *
   * @param {CellRange} cellRange A range to check.
   * @returns {boolean}
   */
  isEqual(cellRange) {
    return (Math.min(this.from.row, this.to.row) === Math.min(cellRange.from.row, cellRange.to.row)) &&
      (Math.max(this.from.row, this.to.row) === Math.max(cellRange.from.row, cellRange.to.row)) &&
      (Math.min(this.from.col, this.to.col) === Math.min(cellRange.from.col, cellRange.to.col)) &&
      (Math.max(this.from.col, this.to.col) === Math.max(cellRange.from.col, cellRange.to.col));
  }

  /**
   * Checks if another range (`cellRange`) overlaps your range.
   *
   * Range A overlaps range B if the intersection of A and B (or B and A) is not empty.
   *
   * @param {CellRange} cellRange A range to check.
   * @returns {boolean}
   */
  overlaps(cellRange) {
    return cellRange.isSouthEastOf(this.getOuterTopLeftCorner()) &&
           cellRange.isNorthWestOf(this.getOuterBottomRightCorner());
  }

  /**
   * Checks if coordinates point is south-east of your range.
   *
   * @param {CellCoords} cellCoords Coordinates to check.
   * @returns {boolean}
   */
  isSouthEastOf(cellCoords) {
    return this.getOuterTopLeftCorner().isSouthEastOf(cellCoords) ||
           this.getOuterBottomRightCorner().isSouthEastOf(cellCoords);
  }

  /**
   * Checks if coordinates point is north-west of your range.
   *
   * @param {CellRange} cellCoords Coordinates to check.
   * @returns {boolean}
   */
  isNorthWestOf(cellCoords) {
    return this.getOuterTopLeftCorner().isNorthWestOf(cellCoords) ||
           this.getOuterBottomRightCorner().isNorthWestOf(cellCoords);
  }

  /**
   * Checks if another range (`cellRange`) overlaps your range horizontally.
   *
   * For example: returns `true` if the last column of your range is `5`
   * and the first column of the `cellRange` range is `3`.
   *
   * @param {CellRange} cellRange A range to check.
   * @returns {boolean}
   */
  isOverlappingHorizontally(cellRange) {
    return (this.getOuterTopEndCorner().col >= cellRange.getOuterTopStartCorner().col &&
            this.getOuterTopEndCorner().col <= cellRange.getOuterTopEndCorner().col) ||
           (this.getOuterTopStartCorner().col <= cellRange.getOuterTopEndCorner().col &&
            this.getOuterTopStartCorner().col >= cellRange.getOuterTopStartCorner().col);
  }

  /**
   * Checks if another range (`cellRange`) overlaps your range vertically.
   *
   * For example: returns `true` if the last row of your range is `5`
   * and the first row of the `cellRange` range is `3`.
   *
   * @param {CellRange} cellRange A range to check.
   * @returns {boolean}
   */
  isOverlappingVertically(cellRange) {
    return (this.getOuterBottomStartCorner().row >= cellRange.getOuterTopRightCorner().row &&
            this.getOuterBottomStartCorner().row <= cellRange.getOuterBottomStartCorner().row) ||
           (this.getOuterTopEndCorner().row <= cellRange.getOuterBottomStartCorner().row &&
            this.getOuterTopEndCorner().row >= cellRange.getOuterTopRightCorner().row);
  }

  /**
   * Adds a cell to your range, at `cellCoords` coordinates.
   *
   * The `cellCoords` coordinates must exceed a corner of your range.
   *
   * @param {CellCoords} cellCoords A new cell's coordinates.
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
   * Expand your range with another range (`expandingRange`).
   *
   * @param {CellRange} expandingRange A new range.
   * @param {boolean} [changeDirection=true] If `true`, the direction of your range is changed to the direction
   * of the `expandingRange` range.
   * @returns {boolean}
   */
  expandByRange(expandingRange, changeDirection = true) {
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

    if (changeDirection) {
      if (this.highlight.row === this.getOuterBottomRightCorner().row && this.getVerticalDirection() === 'N-S') {
        this.flipDirectionVertically();
      }

      if (this.highlight.col === this.getOuterTopRightCorner().col && this.getHorizontalDirection() === 'W-E') {
        this.flipDirectionHorizontally();
      }
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
   * Gets the vertical direction of the selection.
   *
   * @returns {string} Returns one of the values: `N-S` (north->south), `S-N` (south->north).
   */
  getVerticalDirection() {
    return ['NE-SW', 'NW-SE'].indexOf(this.getDirection()) > -1 ? 'N-S' : 'S-N';
  }

  /**
   * Gets the horizontal direction of the selection.
   *
   * @returns {string} Returns one of the values: `W-E` (west->east), `E-W` (east->west).
   */
  getHorizontalDirection() {
    return ['NW-SE', 'SW-NE'].indexOf(this.getDirection()) > -1 ? 'W-E' : 'E-W';
  }

  /**
   * Flips the direction of your range vertically (e.g., `NW-SE` changes to `SW-NE`).
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
   * Flips the direction of your range horizontally (e.g., `NW-SE` changes to `NE-SW`).
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
   * Gets the top-left (in LTR) or top-right (in RTL) corner coordinates of your range.
   *
   * If the corner contains header coordinates (negative values),
   * the corner coordinates are normalized to `0`.
   *
   * @returns {CellCoords}
   */
  getTopStartCorner() {
    return this._createCellCoords(Math.min(this.from.row, this.to.row),
      Math.min(this.from.col, this.to.col)).normalize();
  }

  /**
   * Gets the top-left corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the corner coordinates are normalized to `0`.
   *
   * @returns {CellCoords}
   */
  getTopLeftCorner() {
    return this.#isRtl ? this.getTopEndCorner() : this.getTopStartCorner();
  }

  /**
   * Gets the bottom right (in LTR) or bottom left (in RTL) corner coordinates of your range.
   *
   * If the corner contains header coordinates (negative values),
   * the corner coordinates are normalized to `0`.
   *
   * @returns {CellCoords}
   */
  getBottomEndCorner() {
    return this._createCellCoords(Math.max(this.from.row, this.to.row),
      Math.max(this.from.col, this.to.col)).normalize();
  }

  /**
   * Gets the bottom right corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the corner coordinates are normalized to `0`.
   *
   * @returns {CellCoords}
   */
  getBottomRightCorner() {
    return this.#isRtl ? this.getBottomStartCorner() : this.getBottomEndCorner();
  }

  /**
   * Gets the top right (in LTR) or top left (in RTL) corner coordinates of your range.
   *
   * If the corner contains header coordinates (negative values),
   * the corner coordinates are normalized to `0`.
   *
   * @returns {CellCoords}
   */
  getTopEndCorner() {
    return this._createCellCoords(Math.min(this.from.row, this.to.row),
      Math.max(this.from.col, this.to.col)).normalize();
  }

  /**
   * Gets the top right corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the corner coordinates are normalized to `0`.
   *
   * @returns {CellCoords}
   */
  getTopRightCorner() {
    return this.#isRtl ? this.getTopStartCorner() : this.getTopEndCorner();
  }

  /**
   * Gets the bottom left (in LTR) or bottom right (in RTL) corner coordinates of your range.
   *
   * If the corner contains header coordinates (negative values),
   * the corner coordinates are normalized to `0`.
   *
   * @returns {CellCoords}
   */
  getBottomStartCorner() {
    return this._createCellCoords(Math.max(this.from.row, this.to.row),
      Math.min(this.from.col, this.to.col)).normalize();
  }

  /**
   * Gets the bottom left corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the corner coordinates are normalized to `0`.
   *
   * @returns {CellCoords}
   */
  getBottomLeftCorner() {
    return this.#isRtl ? this.getBottomEndCorner() : this.getBottomStartCorner();
  }

  /**
   * Gets the top left (in LTR) or top right (in RTL) corner coordinates of your range.
   *
   * If the corner contains header coordinates (negative values),
   * the top and start coordinates are pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterTopStartCorner() {
    return this._createCellCoords(Math.min(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
  }

  /**
   * Gets the top left corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the top and left coordinates are pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterTopLeftCorner() {
    return this.#isRtl ? this.getOuterTopEndCorner() : this.getOuterTopStartCorner();
  }

  /**
   * Gets the bottom right (in LTR) or bottom left (in RTL) corner coordinates of your range.
   *
   * If the corner contains header coordinates (negative values),
   * the top and start coordinates are pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterBottomEndCorner() {
    return this._createCellCoords(Math.max(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
  }

  /**
   * Gets the bottom right corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the top and left coordinates are pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterBottomRightCorner() {
    return this.#isRtl ? this.getOuterBottomStartCorner() : this.getOuterBottomEndCorner();
  }

  /**
   * Gets the top right (in LTR) or top left (in RTL) corner coordinates of your range.
   *
   * If the corner contains header coordinates (negative values),
   * the top and start coordinates are pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterTopEndCorner() {
    return this._createCellCoords(Math.min(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
  }

  /**
   * Gets the top right corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the top and left coordinates are pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterTopRightCorner() {
    return this.#isRtl ? this.getOuterTopStartCorner() : this.getOuterTopEndCorner();
  }

  /**
   * Gets the bottom left (in LTR) or bottom right (in RTL) corner coordinates of your range.
   *
   * If the corner contains header coordinates (negative values),
   * the top and start coordinates are pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterBottomStartCorner() {
    return this._createCellCoords(Math.max(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
  }

  /**
   * Gets the bottom left corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the top and left coordinates are pointed to that header.
   *
   * @returns {CellCoords}
   */
  getOuterBottomLeftCorner() {
    return this.#isRtl ? this.getOuterBottomEndCorner() : this.getOuterBottomStartCorner();
  }

  /**
   * Checks if a set of coordinates (`coords`) matches one of the 4 corners of your range.
   *
   * @param {CellCoords} coords Coordinates to check.
   * @returns {boolean}
   */
  isCorner(coords) {
    return coords.isEqual(this.getOuterTopLeftCorner()) || coords.isEqual(this.getOuterTopRightCorner()) ||
      coords.isEqual(this.getOuterBottomLeftCorner()) || coords.isEqual(this.getOuterBottomRightCorner());
  }

  /**
   * Gets the coordinates of a range corner opposite to the provided `coords`.
   *
   * For example: if the `coords` coordinates match the bottom-right corner of your range,
   * the coordinates of the top-left corner of your range are returned.
   *
   * @param {CellCoords} coords Coordinates to check.
   * @returns {CellCoords}
   */
  getOppositeCorner(coords) {
    if (!(coords instanceof CellCoords)) {
      return false;
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
   * Indicates which borders (top, right, bottom, left) are shared between
   * your `CellRange`instance and another `range` that's within your range.
   *
   * @param {CellRange} range A range to compare with.
   * @returns {Array<'top' | 'right' | 'bottom' | 'left'>}
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
      result.push(this.#isRtl ? 'left' : 'right');
    }
    if (thisBorders.bottom === rangeBorders.bottom) {
      result.push('bottom');
    }
    if (thisBorders.left === rangeBorders.left) {
      result.push(this.#isRtl ? 'right' : 'left');
    }

    return result;
  }

  /**
   * Gets the coordinates of the inner cells of your range.
   *
   * @returns {CellCoords[]}
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
   * Gets the coordinates of all cells of your range.
   *
   * @returns {CellCoords[]}
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
   * Runs a callback function on all cells within your range.
   *
   * You can break the iteration by returning `false` in the callback function.
   *
   * @param {function(number, number): boolean} callback A callback function.
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
   * Clones your `CellRange` instance.
   *
   * @returns {CellRange}
   */
  clone() {
    return new CellRange(this.highlight, this.from, this.to, this.#isRtl);
  }

  /**
   * Converts your `CellRange` instance into an object literal with the following properties:
   *
   * - `from`
   *    - `row`
   *    - `col`
   * - `to`
   *    - `row`
   *    - `col`
   *
   * @returns {{from: {row: number, col: number}, to: {row: number, col: number}}} An object literal with `from` and `to` properties.
   */
  toObject() {
    return {
      from: this.from.toObject(),
      to: this.to.toObject(),
    };
  }

  /**
   * Creates and returns a new instance of the `CellCoords` class.
   *
   * The new `CellCoords` instance automatically inherits the LTR/RTL flag
   * from your `CellRange` instance.
   *
   * @private
   * @param {number} row A row index.
   * @param {number} column A column index.
   * @returns {CellCoords}
   */
  _createCellCoords(row, column) {
    return new CellCoords(row, column, this.#isRtl);
  }
}

export default CellRange;
