/**
 * CellCoords holds cell coordinates (row, column) and few method to validate them and retrieve as an array or an object.
 *
 * @util
 */
class CellCoords {
  constructor(row, column) {
    /**
     * Row index.
     *
     * @type {number}
     */
    this.row = null;
    /**
     * Column index.
     *
     * @type {number}
     */
    this.col = null;

    if (typeof row !== 'undefined' && typeof column !== 'undefined') {
      this.row = row;
      this.col = column;
    }
  }

  /**
   * Checks if given set of coordinates is valid in context of a given Walkontable instance.
   *
   * @param {Walkontable} wot A Walkontable instance.
   * @returns {boolean}
   */
  isValid(wot) {
    // is it a valid cell index (0 or higher)
    if (this.row < 0 || this.col < 0) {
      return false;
    }
    // is selection within total rows and columns
    if (this.row >= wot.getSetting('totalRows') || this.col >= wot.getSetting('totalColumns')) {
      return false;
    }

    return true;
  }

  /**
   * Checks if this cell coordinates are the same as cell coordinates given as an argument.
   *
   * @param {CellCoords} cellCoords Cell coordinates to equal.
   * @returns {boolean}
   */
  isEqual(cellCoords) {
    if (cellCoords === this) {
      return true;
    }

    return this.row === cellCoords.row && this.col === cellCoords.col;
  }

  /**
   * Checks if tested coordinates are positioned in south-east from this cell coordinates.
   *
   * @param {object} testedCoords Cell coordinates to check.
   * @returns {boolean}
   */
  isSouthEastOf(testedCoords) {
    return this.row >= testedCoords.row && this.col >= testedCoords.col;
  }

  /**
   * Checks if tested coordinates are positioned in north-east from this cell coordinates.
   *
   * @param {object} testedCoords Cell coordinates to check.
   * @returns {boolean}
   */
  isNorthWestOf(testedCoords) {
    return this.row <= testedCoords.row && this.col <= testedCoords.col;
  }

  /**
   * Checks if tested coordinates are positioned in south-west from this cell coordinates.
   *
   * @param {object} testedCoords Cell coordinates to check.
   * @returns {boolean}
   */
  isSouthWestOf(testedCoords) {
    return this.row >= testedCoords.row && this.col <= testedCoords.col;
  }

  /**
   * Checks if tested coordinates are positioned in north-east from this cell coordinates.
   *
   * @param {object} testedCoords Cell coordinates to check.
   * @returns {boolean}
   */
  isNorthEastOf(testedCoords) {
    return this.row <= testedCoords.row && this.col >= testedCoords.col;
  }

  /**
   * Normalizes the coordinates to the nearest valid position. The coordinates that point
   * to the headers (negative values) are normalized to 0.
   *
   * @returns {CellCoords}
   */
  normalize() {
    this.row = this.row === null ? this.row : Math.max(this.row, 0);
    this.col = this.col === null ? this.col : Math.max(this.col, 0);

    return this;
  }

  /**
   * Clones the coordinates.
   *
   * @returns {CellCoords}
   */
  clone() {
    return new CellCoords(this.row, this.col);
  }

  /**
   * Converts CellCoords to literal object with `row` and `col` properties.
   *
   * @returns {object} Returns a literal object with `row` and `col` properties.
   */
  toObject() {
    return {
      row: this.row,
      col: this.col,
    };
  }
}

export default CellCoords;
