import { isObject } from 'handsontable/helpers/object';
import { toLabel } from 'hot-formula-parser';

/**
 * @class BaseCell
 * @util
 */
class BaseCell {
  constructor(row, column) {
    const rowObject = isObject(row);
    const columnObject = isObject(column);

    this._row = rowObject ? row.index : row;
    this.rowAbsolute = rowObject ? row.isAbsolute : true;
    this._column = columnObject ? column.index : column;
    this.columnAbsolute = columnObject ? column.isAbsolute : true;
    this.rowOffset = 0;
    this.columnOffset = 0;

    // TODO: Change syntax to es6 after upgrade tests to newer version of phantom and jasmine.
    Object.defineProperty(this, 'row', {
      get() {
        return this.rowOffset + this._row;
      },
      set(rowIndex) {
        this._row = rowIndex;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(this, 'column', {
      get() {
        return this.columnOffset + this._column;
      },
      set(columnIndex) {
        this._column = columnIndex;
      },
      enumerable: true,
      configurable: true
    });
  }

  /**
   * Translate cell coordinates.
   *
   * @param {Number} rowOffset Row offset to move.
   * @param {Number} columnOffset Column offset to move.
   */
  translateTo(rowOffset, columnOffset) {
    this.row = this.row + rowOffset;
    this.column = this.column + columnOffset;
  }

  /**
   * Check if cell is equal to provided one.
   *
   * @param {BaseCell} cell Cell object.
   * @returns {Boolean}
   */
  isEqual(cell) {
    return cell.row === this.row && cell.column === this.column;
  }

  /**
   * Stringify object.
   *
   * @returns {String}
   */
  toString() {
    return toLabel(
      { index: this.row, isAbsolute: this.rowAbsolute },
      { index: this.column, isAbsolute: this.columnAbsolute }
    );
  }
}

export default BaseCell;
