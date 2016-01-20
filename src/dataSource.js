
import {cellMethodLookupFactory} from './helpers/data';
import {columnFactory} from './helpers/setting';
import {duckSchema, deepExtend, getProperty} from './helpers/object';
import {extendArray, arrayEach} from './helpers/array';
import {rangeEach} from './helpers/number';

/**
 * @class DataSource
 * @private
 */
class DataSource {
  constructor(hotInstance, dataSource) {
    /**
     * Instance of Handsontable.
     *
     * @type {Handsontable}
     */
    this.hot = hotInstance;
    /**
     * Data source
     *
     * @type {Array}
     */
    this.data = dataSource;
    /**
     * Type of data source.
     *
     * @type {String}
     * @default 'array'
     */
    this.dataType = 'array';

    this.colToProp = () => {};
    this.propToCol = () => {};
  }

  /**
   * Get all data
   *
   * @returns {Array}
   */
  getData() {
    return this.data;
  }

  /**
   * Returns array of column values from the data source. `column` is the index of the row in the data source.
   *
   * @param {Number} column
   * @returns {Array}
   */
  getAtColumn(column) {
    let result = [];

    arrayEach(this.data, (row) => {
      let property = this.colToProp(column);

      if (typeof property === 'string') {
        row = getProperty(row, property);
      } else {
        row = row[property];
      }
      result.push(row);
    });

    return result;
  }

  /**
   * Returns a single row of the data (array or object, depending on what you have). `row` is the index of the row in the data source.
   *
   * @param {Number} row
   * @returns {Array|Object}
   */
  getAtRow(row) {
    return this.data[row];
  }

  /**
   * Returns a single value from the data.
   *
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @returns {String|Number}
   */
  getAtCell(row, column) {
    return this.data[row][this.colToProp(column)];
  }

  /**
   * Returns source data by passed range.
   *
   * @param {Object} start Object with `row` and `col` keys.
   * @param {Object} end Object with `row` and `col` keys.
   * @returns {Array}
   */
  getByRange(start, end) {
    let startRow = Math.min(start.row, end.row);
    let startCol = Math.min(start.col, end.col);
    let endRow = Math.max(start.row, end.row);
    let endCol = Math.max(start.col, end.col);
    let result = [];

    rangeEach(startRow, endRow, (currentRow) => {
      let row = this.getAtRow(currentRow);
      let newRow;

      if (this.dataType === 'array') {
        newRow = row.slice(startCol, endCol);
      } else if (this.dataType === 'object') {
        newRow = {};

        rangeEach(startCol, endCol, (column) => {
          let prop = this.colToProp(column);

          newRow[prop] = row[prop];
        });
      }

      result.push(newRow);
    });

    return result;
  }

  /**
   * Destroy instance.
   */
  destroy() {
    this.data = null;
    this.hot = null;
  }
}

export {DataSource};
