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
export class CellRange {
  /**
   * Used to draw bold border around a cell where selection was started and to edit the cell
   * when you press Enter. The highlight cannot point to headers (negative values) so its
   * coordinates object is normalized while assigning.
   *
   * @private
   * @type {CellCoords}
   */
  highlight: CellCoords | null = null;
  /**
   * Usually the same as highlight, but in Excel there is distinction - one can change
   * highlight within a selection.
   *
   * @private
   * @type {CellCoords}
   */
  from: CellCoords | null = null;
  /**
   * End selection.
   *
   * @private
   * @type {CellCoords}
   */
  to: CellCoords | null = null;
  /**
   * @type {boolean}
   */
  #isRtl = false;

  constructor(highlight: CellCoords, from: CellCoords = highlight, to: CellCoords = highlight, isRtl: boolean = false) {
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
  setHighlight(coords: CellCoords): CellRange {
    this.highlight = coords.clone();

    return this;
  }

  /**
   * Sets the `coords` coordinates as the start of your range.
   *
   * @param {CellCoords} coords Coordinates to use.
   * @returns {CellRange}
   */
  setFrom(coords: CellCoords): CellRange {
    this.from = coords.clone();

    return this;
  }

  /**
   * Sets the `coords` coordinates as the end of your range.
   *
   * @param {CellCoords} coords Coordinates to use.
   * @returns {CellRange}
   */
  setTo(coords: CellCoords): CellRange {
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
  isValid(tableParams: { countRows: number, countCols: number, countRowHeaders?: number, countColHeaders?: number }): boolean {
    return this.from!.isValid(tableParams) && this.to!.isValid(tableParams);
  }

  /**
   * Checks if your range is just a single cell or header.
   *
   * @returns {boolean}
   */
  isSingle(): boolean {
    return this.isSingleCell() || this.isSingleHeader();
  }

  /**
   * Checks if your range is just a single cell.
   *
   * @returns {boolean}
   */
  isSingleCell(): boolean {
    return this.from!.row >= 0 && this.from!.row === this.to!.row &&
           this.from!.col >= 0 && this.from!.col === this.to!.col;
  }

  /**
   * Checks if your range is just a single header.
   *
   * @returns {boolean}
   */
  isSingleHeader(): boolean {
    return (this.from!.row < 0 || this.from!.col < 0) && this.from!.row === this.to!.row &&
           this.from!.col === this.to!.col;
  }

  /**
   * Checks if your range covers only headers range (negative coordinates, without any cells).
   *
   * @returns {boolean}
   */
  isHeader(): boolean {
    if (this.from!.isHeader() && this.to!.isHeader()) {
      return true;
    }

    return this.from!.col < 0 && this.to!.col < 0 || this.from!.row < 0 && this.to!.row < 0;
  }

  /**
   * Checks if your range overlaps headers range (negative coordinates).
   *
   * @returns {boolean}
   */
  containsHeaders(): boolean {
    return this.from!.isHeader() || this.to!.isHeader();
  }

  /**
   * Returns the height of your range (as a number of rows, including row headers).
   *
   * @returns {number}
   */
  getOuterHeight(): number {
    return Math.max(this.from!.row, this.to!.row) - Math.min(this.from!.row, this.to!.row) + 1;
  }

  /**
   * Returns the width of your range (as a number of columns, including column headers).
   *
   * @returns {number}
   */
  getOuterWidth(): number {
    return Math.max(this.from!.col, this.to!.col) - Math.min(this.from!.col, this.to!.col) + 1;
  }

  /**
   * Returns the height of your range (as a number of rows, excluding row headers).
   *
   * @returns {number}
   */
  getHeight(): number {
    // if the selection contains only row headers, return 0
    if (this.from!.row < 0 && this.to!.row < 0) {
      return 0;
    }

    const fromRow = Math.max(this.from!.row, 0);
    const toRow = Math.max(this.to!.row, 0);

    return Math.max(fromRow, toRow) - Math.min(fromRow, toRow) + 1;
  }

  /**
   * Returns the width of your range (as a number of columns, excluding column headers).
   *
   * @returns {number}
   */
  getWidth(): number {
    // if the selection contains only column headers, return 0
    if (this.from!.col < 0 && this.to!.col < 0) {
      return 0;
    }

    const fromCol = Math.max(this.from!.col, 0);
    const toCol = Math.max(this.to!.col, 0);

    return Math.max(fromCol, toCol) - Math.min(fromCol, toCol) + 1;
  }

  /**
   * Returns the number of cells within your range (excluding column and row headers).
   *
   * @returns {number}
   */
  getCellsCount(): number {
    return this.getWidth() * this.getHeight();
  }

  /**
   * Checks if another set of coordinates (`cellCoords`)
   * is within the `from` and `to` coordinates of your range.
   *
   * @param {CellCoords} cellCoords Coordinates to check.
   * @returns {boolean}
   */
  includes(cellCoords: CellCoords): boolean {
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
  includesRange(cellRange: CellRange): boolean {
    return this.includes(cellRange.getOuterTopStartCorner()) &&
           this.includes(cellRange.getOuterBottomEndCorner());
  }

  /**
   * Checks if another range (`cellRange`) is equal to your range.
   *
   * @param {CellRange} cellRange A range to check.
   * @returns {boolean}
   */
  isEqual(cellRange: CellRange): boolean {
    return (Math.min(this.from!.row, this.to!.row) === Math.min(cellRange.from!.row, cellRange.to!.row)) &&
      (Math.max(this.from!.row, this.to!.row) === Math.max(cellRange.from!.row, cellRange.to!.row)) &&
      (Math.min(this.from!.col, this.to!.col) === Math.min(cellRange.from!.col, cellRange.to!.col)) &&
      (Math.max(this.from!.col, this.to!.col) === Math.max(cellRange.from!.col, cellRange.to!.col));
  }

  /**
   * Checks if another range (`cellRange`) overlaps your range.
   *
   * Range A overlaps range B if the intersection of A and B (or B and A) is not empty.
   *
   * @param {CellRange} cellRange A range to check.
   * @returns {boolean}
   */
  overlaps(cellRange: CellRange): boolean {
    return cellRange.isSouthEastOf(this.getOuterTopLeftCorner()) &&
           cellRange.isNorthWestOf(this.getOuterBottomRightCorner());
  }

  /**
   * Checks if coordinates point is south-east of your range.
   *
   * @param {CellCoords} cellCoords Coordinates to check.
   * @returns {boolean}
   */
  isSouthEastOf(cellCoords: CellCoords): boolean {
    return this.getOuterTopLeftCorner().isSouthEastOf(cellCoords) ||
           this.getOuterBottomRightCorner().isSouthEastOf(cellCoords);
  }

  /**
   * Checks if coordinates point is north-west of your range.
   *
   * @param {CellRange} cellCoords Coordinates to check.
   * @returns {boolean}
   */
  isNorthWestOf(cellCoords: CellCoords): boolean {
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
  isOverlappingHorizontally(cellRange: CellRange): boolean {
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
  isOverlappingVertically(cellRange: CellRange): boolean {
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
  expand(cellCoords: CellCoords): boolean {
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
  expandByRange(expandingRange: CellRange, changeDirection = true): boolean {
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
      if (this.highlight!.row === this.getOuterBottomRightCorner().row && this.getVerticalDirection() === 'N-S') {
        this.flipDirectionVertically();
      }

      if (this.highlight!.col === this.getOuterTopRightCorner().col && this.getHorizontalDirection() === 'W-E') {
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
  getDirection(): string {
    if (this.from!.isNorthWestOf(this.to!)) { // NorthWest - SouthEast
      return 'NW-SE';

    } else if (this.from!.isNorthEastOf(this.to!)) { // NorthEast - SouthWest
      return 'NE-SW';

    } else if (this.from!.isSouthEastOf(this.to!)) { // SouthEast - NorthWest
      return 'SE-NW';

    } else if (this.from!.isSouthWestOf(this.to!)) { // SouthWest - NorthEast
      return 'SW-NE';
    }
  }

  /**
   * Sets the direction of the selection.
   *
   * @param {string} direction One of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`.
   */
  setDirection(direction: string) {
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
  getVerticalDirection(): string {
    return ['NE-SW', 'NW-SE'].indexOf(this.getDirection()) > -1 ? 'N-S' : 'S-N';
  }

  /**
   * Gets the horizontal direction of the selection.
   *
   * @returns {string} Returns one of the values: `W-E` (west->east), `E-W` (east->west).
   */
  getHorizontalDirection(): string {
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
  getTopStartCorner(): CellCoords {
    return this._createCellCoords(Math.min(this.from!.row, this.to!.row),
      Math.min(this.from!.col, this.to!.col)).normalize();
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
  getTopLeftCorner(): CellCoords {
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
  getBottomEndCorner(): CellCoords {
    return this._createCellCoords(Math.max(this.from!.row, this.to!.row),
      Math.max(this.from!.col, this.to!.col)).normalize();
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
  getBottomRightCorner(): CellCoords {
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
  getTopEndCorner(): CellCoords {
    return this._createCellCoords(Math.min(this.from!.row, this.to!.row),
      Math.max(this.from!.col, this.to!.col)).normalize();
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
  getTopRightCorner(): CellCoords {
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
  getBottomStartCorner(): CellCoords {
    return this._createCellCoords(Math.max(this.from!.row, this.to!.row),
      Math.min(this.from!.col, this.to!.col)).normalize();
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
  getBottomLeftCorner(): CellCoords {
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
  getOuterTopStartCorner(): CellCoords {
    return this._createCellCoords(Math.min(this.from!.row, this.to!.row), Math.min(this.from!.col, this.to!.col));
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
  getOuterTopLeftCorner(): CellCoords {
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
  getOuterBottomEndCorner(): CellCoords {
    return this._createCellCoords(Math.max(this.from!.row, this.to!.row), Math.max(this.from!.col, this.to!.col));
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
  getOuterBottomRightCorner(): CellCoords {
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
  getOuterTopEndCorner(): CellCoords {
    return this._createCellCoords(Math.min(this.from!.row, this.to!.row), Math.max(this.from!.col, this.to!.col));
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
  getOuterTopRightCorner(): CellCoords {
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
  getOuterBottomStartCorner(): CellCoords {
    return this._createCellCoords(Math.max(this.from!.row, this.to!.row), Math.min(this.from!.col, this.to!.col));
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
  getOuterBottomLeftCorner(): CellCoords {
    return this.#isRtl ? this.getOuterBottomEndCorner() : this.getOuterBottomStartCorner();
  }

  /**
   * Checks if the specified coords are the corner of this range
   *
   * @param {CellCoords} coords The CellCoords to check
   * @returns {boolean}
   */
  isCorner(coords: CellCoords): boolean {
    return coords.isEqual(this.getOuterTopLeftCorner()) || coords.isEqual(this.getOuterTopRightCorner()) ||
      coords.isEqual(this.getOuterBottomLeftCorner()) || coords.isEqual(this.getOuterBottomRightCorner());
  }

  /**
   * Gets the corner opposite to the specified coords
   *
   * @param {CellCoords} coords The CellCoords to check
   * @returns {CellCoords|undefined} Returns coordinates of the opposite corner or undefined if the coords are not the corner.
   */
  getOppositeCorner(coords: CellCoords): CellCoords | undefined {
    if (!this.isCorner(coords)) {
      return;
    }

    if (coords.isEqual(this.getOuterTopLeftCorner())) {
      return this.getOuterBottomRightCorner();
    }

    if (coords.isEqual(this.getOuterTopRightCorner())) {
      return this.getOuterBottomLeftCorner();
    }

    if (coords.isEqual(this.getOuterBottomLeftCorner())) {
      return this.getOuterTopRightCorner();
    }

    if (coords.isEqual(this.getOuterBottomRightCorner())) {
      return this.getOuterTopLeftCorner();
    }
  }

  /**
   * @param {CellRange} range The range to check shared borders with.
   * @returns {number} Returns a number that indicates the position of the range bordered. Possible values:
   *  0 - no border touch
   *  1 - only top border touch
   *  2 - only right border touch
   *  3 - only bottom border touch
   *  4 - only left border touch
   *  5 - top-right border touch
   *  6 - top-bottom border touch
   *  7 - top-left border touch
   *  8 - right-bottom border touch
   *  9 - right-left border touch
   * 10 - bottom-left border touch
   * 11 - top-right-bottom border touch
   * 12 - right-bottom-left border touch
   * 13 - top-bottom-left border touch
   * 14 - top-right-left border touch
   * 15 - top-right-bottom-left border touch (all borders)
   */
  getBordersSharedWith(range: CellRange): number {
    let flags = 0;

    if (this.from !== null && this.to !== null && range.from !== null && range.to !== null) {
      if (range.from.row === this.to.row + 1 && range.from.col <= this.to.col && range.to.col >= this.from.col) {
        flags |= 1; // Add top flag
      }

      if (range.from.col === this.to.col + 1 && range.from.row <= this.to.row && range.to.row >= this.from.row) {
        flags |= 2; // Add right flag
      }

      if (range.to.row === this.from.row - 1 && range.from.col <= this.to.col && range.to.col >= this.from.col) {
        flags |= 4; // Add bottom flag
      }

      if (range.to.col === this.from.col - 1 && range.from.row <= this.to.row && range.to.row >= this.from.row) {
        flags |= 8; // Add left flag
      }
    }

    return flags;
  }

  /**
   * Gets all the cells coordinates inside this range.
   *
   * @returns {CellCoords[]}
   */
  getInner(): CellCoords[] {
    const topLeft = this.getOuterTopLeftCorner();
    const bottomRight = this.getOuterBottomRightCorner();
    const out = [];

    for (let r = topLeft.row!; r <= bottomRight.row!; r++) {
      for (let c = topLeft.col!; c <= bottomRight.col!; c++) {
        if (this.from !== null && this.to !== null &&
            !(this.from.row === r && this.from.col === c) && 
            !(this.to.row === r && this.to.col === c)) {
          out.push(new CellCoords(r, c, this.#isRtl));
        }
      }
    }

    return out;
  }

  /**
   * Gets all the cells coordinates (including from and to cell) inside this range.
   *
   * @returns {CellCoords[]}
   */
  getAll(): CellCoords[] {
    const topLeft = this.getOuterTopLeftCorner();
    const bottomRight = this.getOuterBottomRightCorner();
    const out = [];

    for (let r = topLeft.row!; r <= bottomRight.row!; r++) {
      for (let c = topLeft.col!; c <= bottomRight.col!; c++) {
        if (topLeft.row === r && topLeft.col === c) {
          out.push(topLeft);
        } else if (bottomRight.row === r && bottomRight.col === c) {
          out.push(bottomRight);
        } else {
          out.push(new CellCoords(r, c, this.#isRtl));
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
  forAll(callback: (row: number, column: number) => boolean | void): void {
    const topLeft = this.getOuterTopLeftCorner();
    const bottomRight = this.getOuterBottomRightCorner();

    if (topLeft.row === null || topLeft.col === null || bottomRight.row === null || bottomRight.col === null) {
      return;
    }

    for (let r = topLeft.row; r <= bottomRight.row; r++) {
      for (let c = topLeft.col; c <= bottomRight.col; c++) {
        const breakIteration = callback(r, c) === false;

        if (breakIteration) {
          return;
        }
      }
    }
  }

  /**
   * Creates a new range instance.
   *
   * @returns {CellRange}
   */
  clone(): CellRange {
    const topLeft = this.getTopLeftCorner();
    const bottomRight = this.getBottomRightCorner();

    return new CellRange(
      new CellCoords(topLeft.row, topLeft.col, this.#isRtl),
      new CellCoords(topLeft.row, topLeft.col, this.#isRtl),
      new CellCoords(bottomRight.row, bottomRight.col, this.#isRtl)
    );
  }

  /**
   * Convert CellRange to literal object.
   *
   * @returns {object} Returns a literal object with `from` and `to` properties which each of that object
   *                  contains `row` and `col` keys.
   */
  toObject(): { from: { row: number | null, col: number | null }, to: { row: number | null, col: number | null } } {
    return {
      from: this.from.toObject(),
      to: this.to.toObject(),
    };
  }

  /**
   * Creates new CellCoords object.
   *
   * @param {number} row The row index.
   * @param {number} column The column index.
   * @returns {CellCoords}
   * @private
   */
  _createCellCoords(row: number, column: number): CellCoords {
    return new CellCoords(row, column, this.#isRtl);
  }
}

export default CellRange;
