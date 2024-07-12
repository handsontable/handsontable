/* eslint-disable jsdoc/require-description-complete-sentence */
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
 * import Handsontable, { CellCoords } from '/handsontable';
 *
 * // or, using modules
 * import Handsontable, { CellCoords } from '/handsontable/base';
 * ```
 */
class CellCoords {
  /**
   * A visual row index.
   *
   * @type {number}
   */
  row = null;
  /**
   * A visual column index.
   *
   * @type {number}
   */
  col = null;
  /**
   * A flag which determines if the coordinates run in RTL mode.
   *
   * @type {boolean}
   */
  #isRtl = false;

  constructor(row, column, isRtl = false) {
    this.#isRtl = isRtl;

    if (typeof row !== 'undefined' && typeof column !== 'undefined') {
      this.row = row;
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
   * @param {object} [tableParams] An object with a defined table size.
   * @param {number} [tableParams.countRows=0] The total number of rows.
   * @param {number} [tableParams.countCols=0] The total number of columns.
   * @param {number} [tableParams.countRowHeaders=0] A number of row headers.
   * @param {number} [tableParams.countColHeaders=0] A number of column headers.
   * @returns {boolean} `true`: The coordinates are valid.
   */
  isValid(tableParams) {
    const { countRows, countCols, countRowHeaders, countColHeaders } = {
      countRows: 0,
      countCols: 0,
      countRowHeaders: 0,
      countColHeaders: 0,
      ...tableParams,
    };

    if (!Number.isInteger(this.row) || !Number.isInteger(this.col)) {
      return false;
    }

    if (this.row < -countColHeaders || this.col < -countRowHeaders) {
      return false;
    }

    if (this.row >= countRows || this.col >= countCols) {
      return false;
    }

    return true;
  }

  /**
   * Checks if another set of coordinates (`coords`)
   * is equal to the coordinates in your `CellCoords` instance.
   *
   * @param {CellCoords} coords Coordinates to check.
   * @returns {boolean}
   */
  isEqual(coords) {
    if (coords === this) {
      return true;
    }

    return this.row === coords.row && this.col === coords.col;
  }

  /**
   * Checks if the coordinates point to the headers range. If one of the axis (row or col) point to
   * the header (negative value) then method returns `true`.
   *
   * @returns {boolean}
   */
  isHeader() {
    return !this.isCell();
  }

  /**
   * Checks if the coordinates point to the cells range. If all axis (row and col) point to
   * the cell (positive value) then method returns `true`.
   *
   * @returns {boolean}
   */
  isCell() {
    return this.row >= 0 && this.col >= 0;
  }

  /**
   * Checks if the coordinates runs in RTL mode.
   *
   * @returns {boolean}
   */
  isRtl() {
    return this.#isRtl;
  }

  /**
   * Checks if another set of coordinates (`testedCoords`)
   * is south-east of the coordinates in your `CellCoords` instance.
   *
   * @param {CellCoords} testedCoords Coordinates to check.
   * @returns {boolean}
   */
  isSouthEastOf(testedCoords) {
    return this.row >= testedCoords.row &&
      (this.#isRtl ? this.col <= testedCoords.col : this.col >= testedCoords.col);
  }

  /**
   * Checks if another set of coordinates (`testedCoords`)
   * is north-west of the coordinates in your `CellCoords` instance.
   *
   * @param {CellCoords} testedCoords Coordinates to check.
   * @returns {boolean}
   */
  isNorthWestOf(testedCoords) {
    return this.row <= testedCoords.row &&
      (this.#isRtl ? this.col >= testedCoords.col : this.col <= testedCoords.col);
  }

  /**
   * Checks if another set of coordinates (`testedCoords`)
   * is south-west of the coordinates in your `CellCoords` instance.
   *
   * @param {CellCoords} testedCoords Coordinates to check.
   * @returns {boolean}
   */
  isSouthWestOf(testedCoords) {
    return this.row >= testedCoords.row &&
      (this.#isRtl ? this.col >= testedCoords.col : this.col <= testedCoords.col);
  }

  /**
   * Checks if another set of coordinates (`testedCoords`)
   * is north-east of the coordinates in your `CellCoords` instance.
   *
   * @param {CellCoords} testedCoords Coordinates to check.
   * @returns {boolean}
   */
  isNorthEastOf(testedCoords) {
    return this.row <= testedCoords.row &&
      (this.#isRtl ? this.col <= testedCoords.col : this.col >= testedCoords.col);
  }

  /**
   * Normalizes the coordinates in your `CellCoords` instance to the nearest valid position.
   *
   * Coordinates that point to headers (negative values) are normalized to `0`.
   *
   * @returns {CellCoords}
   */
  normalize() {
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
   * @returns {CellCoords}
   */
  assign(coords) {
    if (Number.isInteger(coords?.row)) {
      this.row = coords.row;
    }
    if (Number.isInteger(coords?.col)) {
      this.col = coords.col;
    }

    if (coords instanceof CellCoords) {
      this.#isRtl = coords.isRtl();
    }

    return this;
  }

  /**
   * Clones your `CellCoords` instance.
   *
   * @returns {CellCoords}
   */
  clone() {
    return new CellCoords(this.row, this.col, this.#isRtl);
  }

  /**
   * Converts your `CellCoords` instance into an object literal with `row` and `col` properties.
   *
   * @returns {{row: number, col: number}} An object literal with `row` and `col` properties.
   */
  toObject() {
    return {
      row: this.row,
      col: this.col,
    };
  }
}

export default CellCoords;
