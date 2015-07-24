
/**
 * WalkontableCellCoords holds cell coordinates (row, column) and few method to validate them and
 * retrieve as an array or an object
 *
 * @class WalkontableCellCoords
 */
class WalkontableCellCoords {
  /**
   * @param {Number} row Row index
   * @param {Number} col Column index
   */
  constructor(row, col) {
    if (typeof row !== 'undefined' && typeof col !== 'undefined') {
      this.row = row;
      this.col = col;

    } else {
      this.row = null;
      this.col = null;
    }
  }

  /**
   * Checks if given set of coordinates is valid in context of a given Walkontable instance
   *
   * @param {Walkontable} wotInstance
   * @returns {Boolean}
   */
  isValid(wotInstance) {
    // is it a valid cell index (0 or higher)
    if (this.row < 0 || this.col < 0) {
      return false;
    }
    // is selection within total rows and columns
    if (this.row >= wotInstance.getSetting('totalRows') || this.col >= wotInstance.getSetting('totalColumns')) {
      return false;
    }

    return true;
  }

  /**
   * Checks if this cell coords are the same as cell coords given as a parameter
   *
   * @param {WalkontableCellCoords} cellCoords
   * @returns {Boolean}
   */
  isEqual(cellCoords) {
    if (cellCoords === this) {
      return true;
    }

    return this.row === cellCoords.row && this.col === cellCoords.col;
  }

  /**
   * Checks if tested coordinates are positioned in south-east from this cell coords
   *
   * @param {Object} testedCoords
   * @returns {Boolean}
   */
  isSouthEastOf(testedCoords) {
    return this.row >= testedCoords.row && this.col >= testedCoords.col;
  }

  /**
   * Checks if tested coordinates are positioned in north-east from this cell coords
   *
   * @param {Object} testedCoords
   * @returns {Boolean}
   */
  isNorthWestOf(testedCoords) {
    return this.row <= testedCoords.row && this.col <= testedCoords.col;
  }

  /**
   * Checks if tested coordinates are positioned in south-west from this cell coords
   *
   * @param {Object} testedCoords
   * @returns {Boolean}
   */
  isSouthWestOf(testedCoords) {
    return this.row >= testedCoords.row && this.col <= testedCoords.col;
  }

  /**
   * Checks if tested coordinates are positioned in north-east from this cell coords
   *
   * @param {Object} testedCoords
   * @returns {Boolean}
   */
  isNorthEastOf(testedCoords) {
    return this.row <= testedCoords.row && this.col >= testedCoords.col;
  }
}

export {WalkontableCellCoords};

window.WalkontableCellCoords = WalkontableCellCoords;
