import CellCoords from './../cell/coords';

type DirectionType = 'NW-SE' | 'NE-SW' | 'SE-NW' | 'SW-NE';

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
 * import Handsontable, from '/handsontable';
 *
 * // or, using modules
 * import Handsontable, from '/handsontable/base';
 * ```
 */
class CellRange {
  /**
   * Used to draw bold border around a cell where selection was started and to edit the cell
   * when you press Enter. The highlight cannot point to headers (negative values) so its
   * coordinates object is normalized while assigning.
   *
   * @private
   */
  declare highlight: CellCoords;
  /**
   * Usually the same as highlight, but in Excel there is distinction - one can change
   * highlight within a selection.
   *
   * @private
   */
  declare from: CellCoords;
  /**
   * End selection.
   *
   * @private
   */
  declare to: CellCoords;
  /**
   */
  #isRtl: boolean = false;

  /**
   * Creates a new CellRange instance spanning from the `from` coordinate to the `to` coordinate,
   * with an optional highlighted cell and RTL layout flag.
   */
  constructor(highlight: CellCoords, from: CellCoords = highlight, to: CellCoords = highlight, isRtl: boolean = false) {
    this.highlight = highlight.clone();
    this.from = from.clone();
    this.to = to.clone();
    this.#isRtl = isRtl;
  }

  /**
   * Highlights cell selection at the `coords` coordinates.
   *
   * @param coords Coordinates to use.
   * @returns 
   */
  setHighlight(coords: CellCoords): CellRange {
    this.highlight = coords.clone();

    return this;
  }

  /**
   * Sets the `coords` coordinates as the start of your range.
   *
   * @param coords Coordinates to use.
   * @returns 
   */
  setFrom(coords: CellCoords): CellRange {
    this.from = coords.clone();

    return this;
  }

  /**
   * Sets the `coords` coordinates as the end of your range.
   *
   * @param coords Coordinates to use.
   * @returns 
   */
  setTo(coords: CellCoords): CellRange {
    this.to = coords.clone();

    return this;
  }

  /**
   * Normalizes the coordinates in your `CellRange` instance to the nearest valid position.
   *
   * Coordinates that point to headers (negative values) are normalized to `0`.
   *
   * @returns 
   */
  normalize(): CellRange {
    this.highlight.normalize();
    this.from.normalize();
    this.to.normalize();

    return this;
  }

  /**
   * Checks if the coordinates in your `CellRange` instance are valid
   * in the context of given table parameters.
   *
   * See the [`isValid()`](@/api/cellCoords.md#isvalid) method of the [`CellCoords`](@/api/cellCoords.md) class.
   *
   * @param tableParams An object with a defined table size.
   * @param tableParams.countRows The total number of rows.
   * @param tableParams.countCols The total number of columns.
   * @param tableParams.countRowHeaders A number of row headers.
   * @param tableParams.countColHeaders A number of column headers.
   * @returns 
   */
  isValid(tableParams: {
    countRows?: number;
    countCols?: number;
    countRowHeaders?: number;
    countColHeaders?: number;
  }): boolean {
    return this.from.isValid(tableParams) && this.to.isValid(tableParams);
  }

  /**
   * Checks if your range is just a single cell or header.
   *
   * @returns 
   */
  isSingle(): boolean {
    return this.isSingleCell() || this.isSingleHeader();
  }

  /**
   * Checks if your range is just a single cell.
   *
   * @returns 
   */
  isSingleCell(): boolean {
    if (this.from.row === null || this.from.col === null || this.to.row === null || this.to.col === null) {
      return false;
    }

    return this.#n(this.from.row) >= 0 && this.from.row === this.to.row &&
           this.#n(this.from.col) >= 0 && this.from.col === this.to.col;
  }

  /**
   * Checks if your range is just a single header.
   *
   * @returns 
   */
  isSingleHeader(): boolean {
    if (this.from.row === null || this.from.col === null || this.to.row === null || this.to.col === null) {
      return false;
    }

    return (this.#n(this.from.row) < 0 || this.#n(this.from.col) < 0) && this.from.row === this.to.row &&
           this.from.col === this.to.col;
  }

  /**
   * Checks if your range covers only headers range (negative coordinates, without any cells).
   *
   * @returns 
   */
  isHeader(): boolean {
    if (this.from.isHeader() && this.to.isHeader()) {
      return true;
    }

    return (this.#n(this.from.col) < 0 && this.#n(this.to.col) < 0) ||
      (this.#n(this.from.row) < 0 && this.#n(this.to.row) < 0);
  }

  /**
   * Checks if your range overlaps headers range (negative coordinates).
   *
   * @returns 
   */
  containsHeaders(): boolean {
    return this.from.isHeader() || this.to.isHeader();
  }

  /**
   * Returns the height of your range (as a number of rows, including row headers).
   *
   * @returns 
   */
  getOuterHeight(): number {
    return Math.max(this.#n(this.from.row), this.#n(this.to.row)) -
      Math.min(this.#n(this.from.row), this.#n(this.to.row)) + 1;
  }

  /**
   * Returns the width of your range (as a number of columns, including column headers).
   *
   * @returns 
   */
  getOuterWidth(): number {
    return Math.max(this.#n(this.from.col), this.#n(this.to.col)) -
      Math.min(this.#n(this.from.col), this.#n(this.to.col)) + 1;
  }

  /**
   * Returns the height of your range (as a number of rows, excluding row headers).
   *
   * @returns 
   */
  getHeight(): number {
    // if the selection contains only row headers, return 0
    if (this.#n(this.from.row) < 0 && this.#n(this.to.row) < 0) {
      return 0;
    }

    const fromRow = Math.max(this.#n(this.from.row), 0);
    const toRow = Math.max(this.#n(this.to.row), 0);

    return Math.max(fromRow, toRow) - Math.min(fromRow, toRow) + 1;
  }

  /**
   * Returns the width of your range (as a number of columns, excluding column headers).
   *
   * @returns 
   */
  getWidth(): number {
    // if the selection contains only column headers, return 0
    if (this.#n(this.from.col) < 0 && this.#n(this.to.col) < 0) {
      return 0;
    }

    const fromCol = Math.max(this.#n(this.from.col), 0);
    const toCol = Math.max(this.#n(this.to.col), 0);

    return Math.max(fromCol, toCol) - Math.min(fromCol, toCol) + 1;
  }

  /**
   * Returns the number of cells within your range (excluding column and row headers).
   *
   * @returns 
   */
  getCellsCount(): number {
    return this.getWidth() * this.getHeight();
  }

  /**
   * Checks if another set of coordinates (`cellCoords`)
   * is within the `from` and `to` coordinates of your range.
   *
   * @param cellCoords Coordinates to check.
   * @returns 
   */
  includes(cellCoords: CellCoords): boolean {
    if (this.from.row === null || this.from.col === null || this.to.row === null || this.to.col === null ||
        cellCoords.row === null || cellCoords.col === null) {
      return false;
    }

    const row = this.#n(cellCoords.row);
    const col = this.#n(cellCoords.col);
    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();

    return this.#n(topStart.row) <= row && this.#n(bottomEnd.row) >= row &&
      this.#n(topStart.col) <= col && this.#n(bottomEnd.col) >= col;
  }

  /**
   * Checks if another range (`cellRange`) is within your range.
   *
   * @param cellRange A range to check.
   * @returns 
   */
  includesRange(cellRange: CellRange): boolean {
    return this.includes(cellRange.getOuterTopStartCorner()) &&
           this.includes(cellRange.getOuterBottomEndCorner());
  }

  /**
   * Checks if another range (`cellRange`) is equal to your range.
   *
   * @param cellRange A range to check.
   * @returns 
   */
  isEqual(cellRange: CellRange): boolean {
    if (this.from.row === null || this.from.col === null || this.to.row === null || this.to.col === null ||
        cellRange.from.row === null || cellRange.from.col === null ||
        cellRange.to.row === null || cellRange.to.col === null) {
      return false;
    }

    const fromRowMin = Math.min(this.#n(this.from.row), this.#n(this.to.row));
    const fromRowMax = Math.max(this.#n(this.from.row), this.#n(this.to.row));
    const fromColMin = Math.min(this.#n(this.from.col), this.#n(this.to.col));
    const fromColMax = Math.max(this.#n(this.from.col), this.#n(this.to.col));
    const toRowMin = Math.min(this.#n(cellRange.from.row), this.#n(cellRange.to.row));
    const toRowMax = Math.max(this.#n(cellRange.from.row), this.#n(cellRange.to.row));
    const toColMin = Math.min(this.#n(cellRange.from.col), this.#n(cellRange.to.col));
    const toColMax = Math.max(this.#n(cellRange.from.col), this.#n(cellRange.to.col));

    return fromRowMin === toRowMin && fromRowMax === toRowMax &&
      fromColMin === toColMin && fromColMax === toColMax;
  }

  /**
   * Checks if another range (`cellRange`) overlaps your range.
   *
   * Range A overlaps range B if the intersection of A and B (or B and A) is not empty.
   *
   * @param cellRange A range to check.
   * @returns 
   */
  overlaps(cellRange: CellRange): boolean {
    return cellRange.isSouthEastOf(this.getOuterTopLeftCorner()) &&
           cellRange.isNorthWestOf(this.getOuterBottomRightCorner());
  }

  /**
   * Checks if coordinates point is south-east of your range.
   *
   * @param cellCoords Coordinates to check.
   * @returns 
   */
  isSouthEastOf(cellCoords: CellCoords): boolean {
    return this.getOuterTopLeftCorner().isSouthEastOf(cellCoords) ||
           this.getOuterBottomRightCorner().isSouthEastOf(cellCoords);
  }

  /**
   * Checks if coordinates point is north-west of your range.
   *
   * @param cellCoords Coordinates to check.
   * @returns 
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
   * @param cellRange A range to check.
   * @returns 
   */
  isOverlappingHorizontally(cellRange: CellRange): boolean {
    return (this.#n(this.getOuterTopEndCorner().col) >= this.#n(cellRange.getOuterTopStartCorner().col) &&
            this.#n(this.getOuterTopEndCorner().col) <= this.#n(cellRange.getOuterTopEndCorner().col)) ||
           (this.#n(this.getOuterTopStartCorner().col) <= this.#n(cellRange.getOuterTopEndCorner().col) &&
            this.#n(this.getOuterTopStartCorner().col) >= this.#n(cellRange.getOuterTopStartCorner().col));
  }

  /**
   * Checks if another range (`cellRange`) overlaps your range vertically.
   *
   * For example: returns `true` if the last row of your range is `5`
   * and the first row of the `cellRange` range is `3`.
   *
   * @param cellRange A range to check.
   * @returns 
   */
  isOverlappingVertically(cellRange: CellRange): boolean {
    return (this.#n(this.getOuterBottomStartCorner().row) >= this.#n(cellRange.getOuterTopRightCorner().row) &&
            this.#n(this.getOuterBottomStartCorner().row) <= this.#n(cellRange.getOuterBottomStartCorner().row)) ||
           (this.#n(this.getOuterTopEndCorner().row) <= this.#n(cellRange.getOuterBottomStartCorner().row) &&
            this.#n(this.getOuterTopEndCorner().row) >= this.#n(cellRange.getOuterTopRightCorner().row));
  }

  /**
   * Adds a cell to your range, at `cellCoords` coordinates.
   *
   * The `cellCoords` coordinates must exceed a corner of your range.
   *
   * @param cellCoords A new cell's coordinates.
   * @param [changeDirection=true] If `true`, the direction of your range is changed to the direction
   * of the `cellCoords` coordinates.
   * @returns 
   */
  expand(cellCoords: CellCoords, changeDirection: boolean = true): boolean {
    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();

    if (
      this.#n(cellCoords.row) < this.#n(topStart.row) || this.#n(cellCoords.col) < this.#n(topStart.col) ||
      this.#n(cellCoords.row) > this.#n(bottomEnd.row) || this.#n(cellCoords.col) > this.#n(bottomEnd.col)
    ) {
      const verticalDirection = this.getVerticalDirection();
      const horizontalDirection = this.getHorizontalDirection();

      this.from = this._createCellCoords(Math.min(this.#n(topStart.row), this.#n(cellCoords.row)),
        Math.min(this.#n(topStart.col), this.#n(cellCoords.col)));
      this.to = this._createCellCoords(Math.max(this.#n(bottomEnd.row), this.#n(cellCoords.row)),
        Math.max(this.#n(bottomEnd.col), this.#n(cellCoords.col)));

      if (changeDirection) {
        if (this.#n(cellCoords.row) < this.#n(topStart.row) && verticalDirection === 'N-S') {
          this.flipDirectionVertically();

        } else if (this.#n(cellCoords.row) > this.#n(bottomEnd.row) && verticalDirection === 'S-N') {
          this.flipDirectionVertically();
        }

        if (this.#n(cellCoords.col) < this.#n(topStart.col) && horizontalDirection === 'W-E') {
          this.flipDirectionHorizontally();

        } else if (this.#n(cellCoords.col) > this.#n(bottomEnd.col) && horizontalDirection === 'E-W') {
          this.flipDirectionHorizontally();
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Expand your range with another range (`expandingRange`).
   *
   * @param expandingRange A new range.
   * @param [changeDirection=true] If `true`, the direction of your range is changed to the direction
   * of the `expandingRange` range.
   * @returns 
   */
  expandByRange(expandingRange: CellRange, changeDirection: boolean = true): boolean {
    if (this.includesRange(expandingRange) || !this.overlaps(expandingRange)) {
      return false;
    }

    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();
    const initialDirection = this.getDirection();

    const expandingTopStart = expandingRange.getOuterTopStartCorner();
    const expandingBottomEnd = expandingRange.getOuterBottomEndCorner();

    const resultTopRow = Math.min(this.#n(topStart.row), this.#n(expandingTopStart.row));
    const resultTopCol = Math.min(this.#n(topStart.col), this.#n(expandingTopStart.col));
    const resultBottomRow = Math.max(this.#n(bottomEnd.row), this.#n(expandingBottomEnd.row));
    const resultBottomCol = Math.max(this.#n(bottomEnd.col), this.#n(expandingBottomEnd.col));

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
   * @returns Returns one of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`.
   */
  getDirection(): DirectionType {
    if (this.from.isNorthWestOf(this.to)) { // NorthWest - SouthEast
      return 'NW-SE';

    } else if (this.from.isNorthEastOf(this.to)) { // NorthEast - SouthWest
      return 'NE-SW';

    } else if (this.from.isSouthEastOf(this.to)) { // SouthEast - NorthWest
      return 'SE-NW';

    } else if (this.from.isSouthWestOf(this.to)) { // SouthWest - NorthEast
      return 'SW-NE';
    }

    return 'NW-SE';
  }

  /**
   * Sets the direction of the selection.
   *
   * @param direction One of the values: `'NW-SE'`, `'NE-SW'`, `'SE-NW'`, `'SW-NE'`.
   */
  setDirection(direction: DirectionType): void {
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
   * @returns Returns one of the values: `N-S` (north->south), `S-N` (south->north).
   */
  getVerticalDirection(): 'N-S' | 'S-N' {
    return ['NE-SW', 'NW-SE'].indexOf(this.getDirection()) > -1 ? 'N-S' : 'S-N';
  }

  /**
   * Gets the horizontal direction of the selection.
   *
   * @returns Returns one of the values: `W-E` (west->east), `E-W` (east->west).
   */
  getHorizontalDirection(): 'W-E' | 'E-W' {
    return ['NW-SE', 'SW-NE'].indexOf(this.getDirection()) > -1 ? 'W-E' : 'E-W';
  }

  /**
   * Gets the inline (horizontal) direction of the selection.
   *
   * @returns Returns one of the values: `start-end`, `end-start`.
   */
  getInlineDirection() {
    return this.getHorizontalDirection() === (this.#isRtl ? 'E-W' : 'W-E') ? 'start-end' : 'end-start';
  }

  /**
   * Flips the direction of your range vertically (e.g., `NW-SE` changes to `SW-NE`).
   */
  flipDirectionVertically(): void {
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
  flipDirectionHorizontally(): void {
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
   * @returns 
   */
  getTopStartCorner(): CellCoords {
    return this._createCellCoords(Math.min(this.#n(this.from.row), this.#n(this.to.row)),
      Math.min(this.#n(this.from.col), this.#n(this.to.col))).normalize();
  }

  /**
   * Gets the top-left corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the corner coordinates are normalized to `0`.
   *
   * @returns 
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
   * @returns 
   */
  getBottomEndCorner(): CellCoords {
    return this._createCellCoords(Math.max(this.#n(this.from.row), this.#n(this.to.row)),
      Math.max(this.#n(this.from.col), this.#n(this.to.col))).normalize();
  }

  /**
   * Gets the bottom right corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the corner coordinates are normalized to `0`.
   *
   * @returns 
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
   * @returns 
   */
  getTopEndCorner(): CellCoords {
    return this._createCellCoords(Math.min(this.#n(this.from.row), this.#n(this.to.row)),
      Math.max(this.#n(this.from.col), this.#n(this.to.col))).normalize();
  }

  /**
   * Gets the top right corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the corner coordinates are normalized to `0`.
   *
   * @returns 
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
   * @returns 
   */
  getBottomStartCorner(): CellCoords {
    return this._createCellCoords(Math.max(this.#n(this.from.row), this.#n(this.to.row)),
      Math.min(this.#n(this.from.col), this.#n(this.to.col))).normalize();
  }

  /**
   * Gets the bottom left corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the corner coordinates are normalized to `0`.
   *
   * @returns 
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
   * @returns 
   */
  getOuterTopStartCorner(): CellCoords {
    return this._createCellCoords(
      Math.min(this.#n(this.from.row), this.#n(this.to.row)),
      Math.min(this.#n(this.from.col), this.#n(this.to.col)));
  }

  /**
   * Gets the top left corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the top and left coordinates are pointed to that header.
   *
   * @returns 
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
   * @returns 
   */
  getOuterBottomEndCorner(): CellCoords {
    return this._createCellCoords(
      Math.max(this.#n(this.from.row), this.#n(this.to.row)),
      Math.max(this.#n(this.from.col), this.#n(this.to.col)));
  }

  /**
   * Gets the bottom right corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the top and left coordinates are pointed to that header.
   *
   * @returns 
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
   * @returns 
   */
  getOuterTopEndCorner(): CellCoords {
    return this._createCellCoords(
      Math.min(this.#n(this.from.row), this.#n(this.to.row)),
      Math.max(this.#n(this.from.col), this.#n(this.to.col)));
  }

  /**
   * Gets the top right corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the top and left coordinates are pointed to that header.
   *
   * @returns 
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
   * @returns 
   */
  getOuterBottomStartCorner(): CellCoords {
    return this._createCellCoords(
      Math.max(this.#n(this.from.row), this.#n(this.to.row)),
      Math.min(this.#n(this.from.col), this.#n(this.to.col)));
  }

  /**
   * Gets the bottom left corner coordinates of your range,
   * both in the LTR and RTL layout direction.
   *
   * If the corner contains header coordinates (negative values),
   * the top and left coordinates are pointed to that header.
   *
   * @returns 
   */
  getOuterBottomLeftCorner(): CellCoords {
    return this.#isRtl ? this.getOuterBottomEndCorner() : this.getOuterBottomStartCorner();
  }

  /**
   * Checks if a set of coordinates (`coords`) matches one of the 4 corners of your range.
   *
   * @param coords Coordinates to check.
   * @returns 
   */
  isCorner(coords: CellCoords): boolean {
    return coords.isEqual(this.getOuterTopLeftCorner()) || coords.isEqual(this.getOuterTopRightCorner()) ||
      coords.isEqual(this.getOuterBottomLeftCorner()) || coords.isEqual(this.getOuterBottomRightCorner());
  }

  /**
   * Gets the coordinates of a range corner opposite to the provided `coords`.
   *
   * For example: if the `coords` coordinates match the bottom-right corner of your range,
   * the coordinates of the top-left corner of your range are returned.
   *
   * @param coords Coordinates to check.
   * @returns 
   */
  getOppositeCorner(coords: CellCoords): CellCoords | undefined {
    if (!(coords instanceof CellCoords)) {
      return undefined;
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

    return undefined;
  }

  /**
   * Indicates which borders (top, right, bottom, left) are shared between
   * your `CellRange`instance and another `range` that's within your range.
   *
   * @param range A range to compare with.
   * @returns 
   */
  getBordersSharedWith(range: CellRange): Array<'top' | 'right' | 'bottom' | 'left'> {
    if (!this.includesRange(range)) {
      return [];
    }

    const thisBorders = {
      top: Math.min(this.#n(this.from.row), this.#n(this.to.row)),
      bottom: Math.max(this.#n(this.from.row), this.#n(this.to.row)),
      left: Math.min(this.#n(this.from.col), this.#n(this.to.col)),
      right: Math.max(this.#n(this.from.col), this.#n(this.to.col))
    };
    const rangeBorders = {
      top: Math.min(this.#n(range.from.row), this.#n(range.to.row)),
      bottom: Math.max(this.#n(range.from.row), this.#n(range.to.row)),
      left: Math.min(this.#n(range.from.col), this.#n(range.to.col)),
      right: Math.max(this.#n(range.from.col), this.#n(range.to.col))
    };
    const result: Array<'top' | 'right' | 'bottom' | 'left'> = [];

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
   * @returns 
   */
  getInner(): CellCoords[] {
    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();
    const out: CellCoords[] = [];

    if (topStart.row === null || topStart.col === null || bottomEnd.row === null || bottomEnd.col === null) {
      return out;
    }

    const tsRow = this.#n(topStart.row);
    const tsCol = this.#n(topStart.col);
    const beRow = this.#n(bottomEnd.row);
    const beCol = this.#n(bottomEnd.col);

    for (let r = tsRow; r <= beRow; r++) {
      for (let c = tsCol; c <= beCol; c++) {
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
   * @returns 
   */
  getAll(): CellCoords[] {
    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();
    const out: CellCoords[] = [];

    if (topStart.row === null || topStart.col === null || bottomEnd.row === null || bottomEnd.col === null) {
      return out;
    }

    const tsRow = this.#n(topStart.row);
    const tsCol = this.#n(topStart.col);
    const beRow = this.#n(bottomEnd.row);
    const beCol = this.#n(bottomEnd.col);

    for (let r = tsRow; r <= beRow; r++) {
      for (let c = tsCol; c <= beCol; c++) {
        if (tsRow === r && tsCol === c) {
          out.push(topStart);

        } else if (beRow === r && beCol === c) {
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
   * @param callback A callback function.
   */
  forAll(callback: (row: number, column: number) => boolean | void): void {
    const topStart = this.getOuterTopStartCorner();
    const bottomEnd = this.getOuterBottomEndCorner();

    if (topStart.row === null || topStart.col === null || bottomEnd.row === null || bottomEnd.col === null) {
      return;
    }

    const tsRow = this.#n(topStart.row);
    const tsCol = this.#n(topStart.col);
    const beRow = this.#n(bottomEnd.row);
    const beCol = this.#n(bottomEnd.col);

    for (let r = tsRow; r <= beRow; r++) {
      for (let c = tsCol; c <= beCol; c++) {
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
   * @returns 
   */
  clone(): CellRange {
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
   * @returns , to: {row: number, col: number}}} An object literal with `from` and `to` properties.
   */
  toObject(): { from: { row: number | null; col: number | null }; to: } {
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
   * @param row A row index.
   * @param column A column index.
   * @returns 
   */
  _createCellCoords(row: number | null, column: number | null): CellCoords {
    return new CellCoords(row ?? undefined, column ?? undefined, this.#isRtl);
  }

  /**
   * Returns a numeric coordinate value, treating null as 0.
   *
   * @private
   * @param v The coordinate value.
   * @returns 
   */
  #n(v: number | null): number {
    return v ?? 0;
  }
}

export default CellRange;
