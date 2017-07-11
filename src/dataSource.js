import {getProperty} from './helpers/object';
import {arrayEach} from './helpers/array';
import {rangeEach} from './helpers/number';

/**
 * @class DataSource
 * @private
 */
class DataSource {
  constructor(hotInstance, dataSource = []) {
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
   * Get all data.
   *
   * @param {Boolean} [toArray=false] If `true` return source data as an array of arrays even when source data was provided
   *                                  in another format.
   * @returns {Array}
   */
  getData(toArray = false) {
    let result = this.data;

    if (toArray) {
      result = this.getByRange(
        {row: 0, col: 0},
        {row: Math.max(this.countRows() - 1, 0), col: Math.max(this.countColumns() - 1, 0)},
        true
      );
    }

    return result;
  }

  /**
   * Set new data source.
   *
   * @param data {Array}
   */
  setData(data) {
    this.data = data;
  }

  /**
   * Returns array of column values from the data source. `column` is the index of the row in the data source.
   *
   * @param {Number} column Visual column index.
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
   * @param {Number} row Physical row index.
   * @returns {Array|Object}
   */
  getAtRow(row) {
    return this.data[row];
  }

  /**
   * Returns a single value from the data.
   *
   * @param {Number} row Physical row index.
   * @param {Number} column Visual column index.
   * @returns {*}
   */
  getAtCell(row, column) {
    let result = null;

    let modifyRowData = this.hot.runHooks('modifyRowData', row);

    let dataRow = isNaN(modifyRowData) ? modifyRowData : this.data[row];

    if (dataRow) {
      let prop = this.colToProp(column);

      if (typeof prop === 'string') {
        result = getProperty(dataRow, prop);

      } else if (typeof prop === 'function') {
        result = prop(this.data.slice(row, row + 1)[0]);

      } else {
        result = dataRow[prop];
      }
    }

    return result;
  }

  /**
   * Returns source data by passed range.
   *
   * @param {Object} start Object with physical `row` and `col` keys (or visual column index, if data type is an array of objects).
   * @param {Object} end Object with physical `row` and `col` keys (or visual column index, if data type is an array of objects).
   * @param {Boolean} [toArray=false] If `true` return source data as an array of arrays even when source data was provided
   *                                  in another format.
   * @returns {Array}
   */
  getByRange(start, end, toArray = false) {
    let startRow = Math.min(start.row, end.row);
    let startCol = Math.min(start.col, end.col);
    let endRow = Math.max(start.row, end.row);
    let endCol = Math.max(start.col, end.col);
    let result = [];

    rangeEach(startRow, endRow, (currentRow) => {
      let row = this.getAtRow(currentRow);
      let newRow;

      if (this.dataType === 'array') {
        newRow = row.slice(startCol, endCol + 1);

      } else if (this.dataType === 'object') {
        newRow = toArray ? [] : {};

        rangeEach(startCol, endCol, (column) => {
          let prop = this.colToProp(column);

          if (toArray) {
            newRow.push(row[prop]);
          } else {
            newRow[prop] = row[prop];
          }
        });
      }

      result.push(newRow);
    });

    return result;
  }

  /**
   * Count number of rows.
   *
   * @returns {Number}
   */
  countRows() {
    return Array.isArray(this.data) ? this.data.length : 0;
  }

  /**
   * Count number of columns.
   *
   * @returns {Number}
   */
  countColumns() {
    let result = 0;

    if (Array.isArray(this.data)) {
      if (this.dataType === 'array') {
        result = this.data[0].length;

      } else if (this.dataType === 'object') {
        result = Object.keys(this.data[0]).length;
      }
    }

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

export default DataSource;
