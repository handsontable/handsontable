import {
  createObjectPropListener,
  getProperty,
  isObject,
  objectEach,
  setProperty
} from './helpers/object';
import { countFirstRowKeys } from './helpers/data';
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
   * Run the `modifyRowData` hook and return either the modified or the source data for the provided row.
   *
   * @private
   * @param {number} rowIndex Row index.
   * @returns {Array|object} Source or modified row of data.
   */
  modifyRowData(rowIndex) {
    let modifyRowData;

    if (this.hot.hasHook('modifyRowData')) {
      modifyRowData = this.hot.runHooks('modifyRowData', rowIndex);
    }

    return (modifyRowData !== void 0 && !Number.isInteger(modifyRowData)) ? modifyRowData : this.data[rowIndex];
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
      return this.data;
    }

    return this.getByRange(
      null,
      null,
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
   * Returns a single row of the data or a subset of its columns. If a column range or `toArray` arguments are provided, it
   * operates only on the columns declared by the `columns` setting or the data schema.
   *
   * @param {number} row Physical row index.
   * @param {number} [startColumn] Starting index for the column range (optional).
   * @param {number} [endColumn] Ending index for the column range (optional).
   * @param {boolean} [toArray=false] `true` if the returned value should be forced to be presented as an array.
   * @returns {Array|object}
   */
  getAtRow(row, startColumn, endColumn, toArray = false) {
    const getAllProps = startColumn === void 0 && endColumn === void 0;
    let dataRow = null;
    let newDataRow = null;

    dataRow = this.modifyRowData(row);

    if (Array.isArray(dataRow)) {
      newDataRow = [];

      if (getAllProps) {
        dataRow.forEach((cell, column) => {
          newDataRow[column] = this.getAtPhysicalCell(row, column, dataRow);
        });

      } else {
        // Only the columns from the provided range
        rangeEach(startColumn, endColumn, (column) => {
          newDataRow[column - startColumn] = this.getAtPhysicalCell(row, column, dataRow);
        });
      }

    } else if (isObject(dataRow) || isFunction(dataRow)) {
      if (toArray) {
        newDataRow = [];
      } else {
        newDataRow = {};
      }

      if (!getAllProps || toArray) {
        const rangeStart = 0;
        const rangeEnd = this.countFirstRowKeys() - 1;

        rangeEach(rangeStart, rangeEnd, (column) => {
          const prop = this.colToProp(column);

          if (column >= (startColumn || rangeStart) && column <= (endColumn || rangeEnd) && !Number.isInteger(prop)) {
            const cellValue = this.getAtPhysicalCell(row, prop, dataRow);

            if (toArray) {
              newDataRow.push(cellValue);

            } else {
              setProperty(newDataRow, prop, cellValue);
            }
          }
        });

      } else {
        objectEach(dataRow, (value, prop) => {
          setProperty(newDataRow, prop, this.getAtPhysicalCell(row, prop, dataRow));
        });
      }
    }

    return newDataRow;
  }

  /**
   * Set the provided value in the source data set at the provided coordinates.
   *
   * @param {number} row Physical row index.
   * @param {number|string} column Property name / physical column index.
   * @param {*} value The value to be set at the provided coordinates.
   */
  setAtCell(row, column, value) {
    if (row >= this.countRows() || column >= this.countFirstRowKeys()) {
      // Not enough rows and/or columns.
      return;
    }

    if (this.hot.hasHook('modifySourceData')) {
      const valueHolder = createObjectPropListener(value);

      this.hot.runHooks('modifySourceData', row, this.propToCol(column), valueHolder, 'set');

      if (valueHolder.isTouched()) {
        value = valueHolder.value;
      }
    }

    if (!Number.isInteger(column)) {
      // column argument is the prop name
      setProperty(this.data[row], column, value);

    } else {
      this.data[row][column] = value;
    }
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
    const dataRow = this.modifyRowData(row);

    return this.getAtPhysicalCell(row, this.colToProp(column), dataRow);
  }

  /**
   * Returns source data by passed range.
   *
   * @param {object} [start] Object with physical `row` and `col` keys (or visual column index, if data type is an array of objects).
   * @param {object} [end] Object with physical `row` and `col` keys (or visual column index, if data type is an array of objects).
   * @param {boolean} [toArray=false] If `true` return source data as an array of arrays even when source data was provided
   *                                  in another format.
   * @returns {Array}
   */
  getByRange(start = null, end = null, toArray = false) {
    let getAllProps = false;
    let startRow = null;
    let startCol = null;
    let endRow = null;
    let endCol = null;

    if (start === null || end === null) {
      getAllProps = true;
      startRow = 0;
      endRow = this.countRows() - 1;

    } else {
      startRow = Math.min(start.row, end.row);
      startCol = Math.min(start.col, end.col);
      endRow = Math.max(start.row, end.row);
      endCol = Math.max(start.col, end.col);
    }

    const result = [];

    rangeEach(startRow, endRow, (currentRow) => {
      result.push((
        getAllProps ?
          this.getAtRow(currentRow, void 0, void 0, toArray) :
          this.getAtRow(currentRow, startCol, endCol, toArray)
      ));
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

      if (Number.isInteger(modifiedSourceLength)) {
        return modifiedSourceLength;
      }
    }

    return this.data.length;
  }

  /**
   * Count number of columns.
   *
   * @returns {number}
   */
  countFirstRowKeys() {
    return countFirstRowKeys(this.data);
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
