import {arrayEach} from 'handsontable/helpers/array';
import {rangeEach} from 'handsontable/helpers/number';
import {hasOwnProperty} from 'handsontable/helpers/object';
import {getTranslator} from 'handsontable/utils/recordTranslator';
import {isFormulaExpression} from './utils';

/**
 * @class DataProvider
 * @util
 */
class DataProvider {
  constructor(hot) {
    /**
     * Handsontable instance.
     *
     * @type {Core}
     */
    this.hot = hot;
    /**
     * Collected changes applied into editors or by calling public Handsontable API.
     *
     * @type {Object}
     */
    this.changes = {};
    /**
     * Record translator for translating visual records into psychical and vice versa.
     *
     * @type {RecordTranslator}
     */
    this.t = getTranslator(this.hot);
  }

  /**
   * Collect data changes to the collection.
   *
   * @param {Number} row Physical row index.
   * @param {Number} column Physical column index.
   * @param {*} value Value to save.
   */
  collectChanges(row, column, value) {
    if (!isFormulaExpression(value)) {
      this.changes[this._coordId(row, column)] = value;
    }
  }

  /**
   * Clear all collected changes.
   */
  clearChanges() {
    this.changes = {};
  }

  /**
   * Check if provided coordinates match to the table range data.
   *
   * @param {Number} row Visual row index.
   * @param {Number} column Visual row index.
   * @returns {Boolean}
   */
  isInDataRange(row, column) {
    return row >= 0 && row < this.hot.countRows() && column >= 0 && column < this.hot.countCols();
  }

  /**
   * Get calculated data at specified cell.
   *
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @returns {*}
   */
  getDataAtCell(row, column) {
    const id = this._coordId(...this.t.toPhysical(row, column));
    let result;

    if (hasOwnProperty(this.changes, id)) {
      result = this.changes[id];
    } else {
      result = this.hot.getDataAtCell(row, column);
    }

    return result;
  }

  /**
   * Get calculated data at specified range.
   *
   * @param {Number} [row1] Visual row index.
   * @param {Number} [column1] Visual column index.
   * @param {Number} [row2] Visual row index.
   * @param {Number} [column2] Visual column index.
   * @returns {Array}
   */
  getDataByRange(row1, column1, row2, column2) {
    const result = this.hot.getData(row1, column1, row2, column2);

    arrayEach(result, (rowData, rowIndex) => {
      arrayEach(rowData, (value, columnIndex) => {
        const id = this._coordId(...this.t.toPhysical(rowIndex + row1, columnIndex + column1));

        if (hasOwnProperty(this.changes, id)) {
          result[rowIndex][columnIndex] = this.changes[id];
        }
      });
    });

    return result;
  }

  /**
   * Get source data at specified physical cell.
   *
   * @param {Number} row Physical row index.
   * @param {Number} column Physical column index.
   * @returns {*}
   */
  getSourceDataAtCell(row, column) {
    return this.hot.getSourceDataAtCell(row, column);
  }

  /**
   * Get source data at specified visual cell.
   *
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @returns {*}
   */
  getRawDataAtCell(row, column) {
    return this.getSourceDataAtCell(...this.t.toPhysical(row, column));
  }

  /**
   * Get source data at specified physical range.
   *
   * @param {Number} [row1] Physical row index.
   * @param {Number} [column1] Physical column index.
   * @param {Number} [row2] Physical row index.
   * @param {Number} [column2] Physical column index.
   * @returns {Array}
   */
  getSourceDataByRange(row1, column1, row2, column2) {
    return this.hot.getSourceDataArray(row1, column1, row2, column2);
  }

  /**
   * Get source data at specified visual range.
   *
   * @param {Number} [row1] Visual row index.
   * @param {Number} [column1] Visual column index.
   * @param {Number} [row2] Visual row index.
   * @param {Number} [column2] Visual column index.
   * @returns {Array}
   */
  getRawDataByRange(row1, column1, row2, column2) {
    const args = [...this.t.toPhysical(row1, column1), ...this.t.toPhysical(row2, column2)];

    return this.getSourceDataByRange(...args);
  }

  /**
   * Update source data.
   *
   * @param {Number} row Physical row index.
   * @param {Number} column Physical row index.
   * @param {*} value Value to update.
   */
  updateSourceData(row, column, value) {
    this.hot.getSourceData()[row][this.hot.colToProp(column)] = value;
  }

  /**
   * Get coords id.
   *
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @returns {String}
   * @private
   */
  _coordId(row, column) {
    return `${row}:${column}`;
  }

  /**
   * Destroy class.
   */
  destroy() {
    this.hot = null;
    this.changes = null;
    this.t = null;
  }
}

export default DataProvider;
