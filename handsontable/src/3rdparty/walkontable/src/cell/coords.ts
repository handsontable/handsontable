/**
 * @description
 *
 * The `CellCoords` class holds the coordinates (`row`, `col`) of a single cell.
 *
 * It also contains methods for validating the coordinates
 * and retrieving them as an object.
 *
 * To import the `CellCoords` class:
 *
 * ```js
 * import Handsontable, from '/handsontable';
 *
 * // or, using modules
 * import Handsontable, from '/handsontable/base';
 * ```
 */
class CellCoords {
  /**
   * A visual row index.
   *
   */
  row: number | null = null;
  /**
   * A visual column index.
   *
   */
  col: number | null = null;
  /**
   * A flag which determines if the coordinates run in RTL mode.
   *
   */
  #isRtl: boolean = false;

  /**
   * @param [row] The visual row index.
   * @param [column] The visual column index.
   * @param [isRtl=false] When `true`, the column index is interpreted in right-to-left mode.
   */
  constructor(row?: number, column?: number, isRtl: boolean = false) {
    this.#isRtl = isRtl;

    if (typeof row !== 'undefined') {
      this.row = row;
    }
    if (typeof column !== 'undefined') {
      this.col = column;
    }
  }

  /**
   * Checks if the coordinates in your `CellCoords` instance are valid
   * in the context of given table parameters.
   *
   * The `row` index:
   * - Must be an integer.
   * - Must be higher than the number of column headers in the table.
   * - Must be lower than the total number of rows in the table.
   *
   * The `col` index:
   * - Must be an integer.
   * - Must be higher than the number of row headers in the table.
   * - Must be lower than the total number of columns in the table.
   *
   * @param [tableParams] An object with a defined table size.
   * @param [tableParams.countRows=0] The total number of rows.
   * @param [tableParams.countCols=0] The total number of columns.
   * @param [tableParams.countRowHeaders=0] A number of row headers.
   * @param [tableParams.countColHeaders=0] A number of column headers.
   * @returns `true`: The coordinates are valid.
   */
  isValid(tableParams?: {
    countRows?: number;
    countCols?: number;
    countRowHeaders?: number;
    countColHeaders?: number;
  }): boolean {
    const = {
      countRows: 0,
      countCols: 0,
      countRowHeaders: 0,
      countColHeaders: 0,
      ...tableParams,
    };

    if (!Number.isInteger(this.row) || !Number.isInteger(this.col)) {
      return false;
    }

    const row = this.row!;
    const col = this.col!;

    if (row < -countColHeaders || col < -countRowHeaders) {
      return false;
    }

    if (row >= countRows || col >= countCols) {
      return false;
    }

    return true;
  }

  /**
   * Checks whether both row and col coordinates are set (not null).
   *
   * @returns 
   */
  isSet(): this is CellCoords & {
    return this.row !== null && this.col !== null;
  }

  /**
   * Checks if another set of coordinates (`coords`)
   * is equal to the coordinates in your `CellCoords` instance.
   *
   * @param coords Coordinates to check.
   * @returns 
   */
  isEqual(coords: CellCoords): boolean {
    if (coords === this) {
      return true;
    }

    return this.row === coords.row && this.col === coords.col;
  }

  /**
   * Checks if the coordinates point to the headers range. If one of the axis (row or col) point to
   * the header (negative value) then method returns `true`.
   *
   * @returns 
   */
  isHeader(): boolean {
    return !this.isCell();
  }

  /**
   * Checks if the coordinates point to the cells range. If all axis (row and col) point to
   * the cell (positive value) then method returns `true`.
   *
   * @returns 
   */
  isCell(): boolean {
    return this.row !== null && this.col !== null && this.row >= 0 && this.col >= 0;
  }

  /**
   * Checks if the coordinates runs in RTL mode.
   *
   * @returns 
   */
  isRtl(): boolean {
    return this.#isRtl;
  }

  /**
   * Checks if another set of coordinates (`testedCoords`)
   * is south-east of the coordinates in your `CellCoords` instance.
   *
   * @param testedCoords Coordinates to check.
   * @returns 
   */
  isSouthEastOf(testedCoords: CellCoords): boolean {
    if (this.row === null || this.col === null || testedCoords.row === null || testedCoords.col === null) {
      return false;
    }
    const row = this.row;
    const col = this.col;
    const testedRow = testedCoords.row;
    const testedCol = testedCoords.col;

    return row >= testedRow &&
      (this.#isRtl ? col <= testedCol : col >= testedCol);
  }

  /**
   * Checks if another set of coordinates (`testedCoords`)
   * is north-west of the coordinates in your `CellCoords` instance.
   *
   * @param testedCoords Coordinates to check.
   * @returns 
   */
  isNorthWestOf(testedCoords: CellCoords): boolean {
    if (this.row === null || this.col === null || testedCoords.row === null || testedCoords.col === null) {
      return false;
    }
    const row = this.row;
    const col = this.col;
    const testedRow = testedCoords.row;
    const testedCol = testedCoords.col;

    return row <= testedRow &&
      (this.#isRtl ? col >= testedCol : col <= testedCol);
  }

  /**
   * Checks if another set of coordinates (`testedCoords`)
   * is south-west of the coordinates in your `CellCoords` instance.
   *
   * @param testedCoords Coordinates to check.
   * @returns 
   */
  isSouthWestOf(testedCoords: CellCoords): boolean {
    if (this.row === null || this.col === null || testedCoords.row === null || testedCoords.col === null) {
      return false;
    }
    const row = this.row;
    const col = this.col;
    const testedRow = testedCoords.row;
    const testedCol = testedCoords.col;

    return row >= testedRow &&
      (this.#isRtl ? col >= testedCol : col <= testedCol);
  }

  /**
   * Checks if another set of coordinates (`testedCoords`)
   * is north-east of the coordinates in your `CellCoords` instance.
   *
   * @param testedCoords Coordinates to check.
   * @returns 
   */
  isNorthEastOf(testedCoords: CellCoords): boolean {
    if (this.row === null || this.col === null || testedCoords.row === null || testedCoords.col === null) {
      return false;
    }
    const row = this.row;
    const col = this.col;
    const testedRow = testedCoords.row;
    const testedCol = testedCoords.col;

    return row <= testedRow &&
      (this.#isRtl ? col <= testedCol : col >= testedCol);
  }

  /**
   * Normalizes the coordinates in your `CellCoords` instance to the nearest valid position.
   *
   * Coordinates that point to headers (negative values) are normalized to `0`.
   *
   * @returns 
   */
  normalize(): CellCoords {
    this.row = this.row === null ? this.row : Math.max(this.row, 0);
    this.col = this.col === null ? this.col : Math.max(this.col, 0);

    return this;
  }

  /**
   * Assigns the coordinates from another `CellCoords` instance (or compatible literal object)
   * to your `CellCoords` instance.
   *
   * @param {CellCoords | { row: number | undefined, col: number | undefined }} coords The CellCoords
   * instance or compatible literal object.
   * @returns 
   */
  assign(coords: CellCoords | { row?: number; col?: number }): CellCoords {
    if (Number.isInteger(coords?.row)) {
      this.row = coords.row!;
    }
    if (Number.isInteger(coords?.col)) {
      this.col = coords.col!;
    }

    if (coords instanceof CellCoords) {
      this.#isRtl = coords.isRtl();
    }

    return this;
  }

  /**
   * Clones your `CellCoords` instance.
   *
   * @returns 
   */
  clone(): CellCoords {
    return new CellCoords(this.row ?? undefined, this.col ?? undefined, this.#isRtl);
  }

  /**
   * Converts your `CellCoords` instance into an object literal with `row` and `col` properties.
   *
   * @returns } An object literal with `row` and `col` properties.
   */
  toObject(): {
    return {
      row: this.row,
      col: this.col,
    };
  }
}

export default CellCoords;
