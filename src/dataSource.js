import {
  createObjectPropListener,
  getProperty,
  isObject,
  objectEach
} from './helpers/object';
import { arrayEach } from './helpers/array';
import { rangeEach } from './helpers/number';
import { isFunction } from './helpers/function';

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
     * Data source.
     *
     * @type {Array}
     */
    this.data = dataSource;
    /**
     * Type of data source.
     *
     * @type {string}
     * @default 'array'
     */
    this.dataType = 'array';

    this.colToProp = () => {};
    this.propToCol = () => {};
  }

  /**
   * Get the reference to the original dataset passed to the instance.
   *
   * @private
   * @returns {Array} Reference to the original dataset.
   */
  getRawData() {
    return this.data;
  }

  /**
   * Get all data.
   *
   * @param {boolean} [toArray=false] If `true` return source data as an array of arrays even when source data was provided
   *                                  in another format.
   * @returns {Array}
   */
  getData(toArray = false) {
    if (!this.data || this.data.length === 0) {
      return this.getRawData();
    }

    return this.getByRange(
      { row: 0, col: 0 },
      { row: Math.max(this.countRows() - 1, 0), col: Math.max(this.countColumns() - 1, 0) },
      toArray
    );
  }

  /**
   * Set new data source.
   *
   * @param {Array} data The new data.
   */
  setData(data) {
    this.data = data;
  }

  /**
   * Returns array of column values from the data source. `column` is the index of the row in the data source.
   *
   * @param {number} column Visual column index.
   * @returns {Array}
   */
  getAtColumn(column) {
    const result = [];

    arrayEach(this.data, (row, rowIndex) => {
      const value = this.getAtCell(rowIndex, column);

      result.push(value);
    });

    return result;
  }

  /**
   * Returns a single row of the data (array or object, depending on what you have). `row` is the index of the row in the data source.
   *
   * @param {number} row Physical row index.
   * @returns {Array|object}
   */
  getAtRow(row) {
    let dataRow = null;
    let newDataRow = null;
    let modifyRowData = null;

    if (this.hot.hasHook('modifyRowData')) {
      modifyRowData = this.hot.runHooks('modifyRowData', row);
    }

    dataRow = modifyRowData !== null && isNaN(modifyRowData) ? modifyRowData : this.data[row];

    if (Array.isArray(dataRow)) {
      newDataRow = [];

      rangeEach(0, dataRow.length - 1, (column) => {
        newDataRow[column] = this.getAtPhysicalCell(row, column, dataRow);
      });

    } else if (isObject(dataRow) || isFunction(dataRow)) {
      newDataRow = {};

      objectEach(dataRow, (value, prop) => {
        newDataRow[prop] = this.getAtPhysicalCell(row, prop, dataRow);
      });
    }

    return newDataRow;
  }

  /**
   * Set the provided data array/object in the source data set.
   *
   * @param {number} row Physical row index.
   * @param {Array|object} rowData Row of data to be set in the source data set.
   */
  setAtRow(row, rowData) {
    if (Array.isArray(rowData)) {
      rangeEach(0, rowData.length - 1, (column) => {
        this.setAtCell(row, column, rowData[column]);
      });

    } else if (isObject(rowData) || isFunction(rowData)) {
      objectEach(rowData, (value, prop) => {
        this.setAtCell(row, prop, rowData[prop]);
      });
    }
  }

  /**
   * Set the provided value in the source data set at the provided coordinates.
   *
   * @param {number} row Physical row index.
   * @param {number|string} column Property name / physical column index.
   * @param {*} value The value to be set at the provided coordinates.
   */
  setAtCell(row, column, value) {
    if (this.hot.hasHook('modifySourceData')) {
      const valueHolder = createObjectPropListener(value);

      this.hot.runHooks('modifySourceData', row, this.propToCol(column), valueHolder, 'set');

      if (valueHolder.isTouched()) {
        value = valueHolder.value;
      }
    }

    this.data[row][column] = value;
  }

  /**
   * Get data from the source data set using the physical indexes.
   *
   * @private
   * @param {number} row Physical row index.
   * @param {string|number|Function} column Physical column index / property / function.
   * @param {Array|object} dataRow A representation of a data row.
   * @returns {*} Value at the provided coordinates.
   */
  getAtPhysicalCell(row, column, dataRow) {
    let result = null;

    if (dataRow) {
      if (typeof column === 'string') {
        result = getProperty(dataRow, column);

      } else if (typeof column === 'function') {
        result = column(dataRow);

      } else {
        result = dataRow[column];
      }
    }

    if (this.hot.hasHook('modifySourceData')) {
      const valueHolder = createObjectPropListener(result);

      this.hot.runHooks('modifySourceData', row, this.colToProp(column), valueHolder, 'get');

      if (valueHolder.isTouched()) {
        result = valueHolder.value;
      }
    }

    return result;
  }

  /**
   * Returns a single value from the data.
   *
   * @param {number} row Physical row index.
   * @param {number} column Visual column index.
   * @returns {*}
   */
  getAtCell(row, column) {
    let modifyRowData = null;

    if (this.hot.hasHook('modifyRowData')) {
      modifyRowData = this.hot.runHooks('modifyRowData', row);
    }

    const dataRow = modifyRowData !== null && isNaN(modifyRowData) ? modifyRowData : this.data[row];

    return this.getAtPhysicalCell(row, this.colToProp(column), dataRow);
  }

  /**
   * Returns source data by passed range.
   *
   * @param {object} start Object with physical `row` and `col` keys (or visual column index, if data type is an array of objects).
   * @param {object} end Object with physical `row` and `col` keys (or visual column index, if data type is an array of objects).
   * @param {boolean} [toArray=false] If `true` return source data as an array of arrays even when source data was provided
   *                                  in another format.
   * @returns {Array}
   */
  getByRange(start, end, toArray = false) {
    const startRow = Math.min(start.row, end.row);
    const startCol = Math.min(start.col, end.col);
    const endRow = Math.max(start.row, end.row);
    const endCol = Math.max(start.col, end.col);
    const result = [];

    rangeEach(startRow, endRow, (currentRow) => {
      const row = this.getAtRow(currentRow);
      let newRow;

      if (this.data[0] && Array.isArray(this.data[0])) {
        newRow = row.slice(startCol, endCol + 1);

      } else if (this.data[0] && isObject(this.data[0])) {
        newRow = toArray ? [] : {};

        rangeEach(startCol, endCol, (column) => {
          const prop = this.colToProp(column);
          const propHierarchy = isNaN(prop) ? prop.split('.') : [prop];
          let value = null;

          if (propHierarchy.length > 1) {
            value = propHierarchy.reduce((acc, cv) => acc && acc[cv], row);

          } else {
            value = row[prop];
          }

          if (toArray) {
            newRow.push(value);

          } else {
            let nestedObject = newRow;
            let deepProp = prop;

            propHierarchy.forEach((nestedProp, i) => {
              if (i === propHierarchy.length - 1) {
                deepProp = nestedProp;

                return;
              }

              if (!nestedObject[nestedProp]) {
                nestedObject[nestedProp] = {};
              }

              nestedObject = nestedObject[nestedProp];
            });

            nestedObject[deepProp] = value;
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
   * @returns {number}
   */
  countRows() {
    if (this.hot.hasHook('modifySourceLength')) {
      const modifiedSourceLength = this.hot.runHooks('modifySourceLength');

      return isNaN(modifiedSourceLength) ? (this.data.length || 0) : modifiedSourceLength;

    }

    return this.data.length || 0;
  }

  /**
   * Count number of columns.
   *
   * @returns {number}
   */
  countColumns() {
    let result = 0;

    if (Array.isArray(this.data)) {
      if (this.data[0] && Array.isArray(this.data[0])) {
        result = this.data[0].length;

      } else if (this.data[0] && isObject(this.data[0])) {
        const countKeys = (object, keycount) => {
          objectEach(object, (value, key) => {
            if (key === '__children') {
              return;
            }

            if (isObject(value)) {
              keycount += countKeys(value, 0);

            } else {
              keycount += 1;
            }
          });

          return keycount;
        };

        result = countKeys(this.data[0], 0);

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
