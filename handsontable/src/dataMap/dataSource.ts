import {
  createObjectPropListener,
  getProperty,
  isObject,
  objectEach,
  setProperty
} from '../helpers/object';
import { countFirstRowKeys } from '../helpers/data';
import { arrayEach } from '../helpers/array';
import { rangeEach } from '../helpers/number';
import { isFunction } from '../helpers/function';
import { DataSource as DataSourceType, PropDescriptor, Handsontable, CellValue } from './types';
import { CellCoords } from './../3rdparty/walkontable/src/cell/coords';

/**
 * @class DataSource
 * @private
 */
class DataSource {
  /**
   * Instance of Handsontable.
   *
   * @type {Handsontable}
   */
  hot: Handsontable;
  /**
   * Data source.
   *
   * @type {Array}
   */
  data: DataSourceType;
  /**
   * Type of data source.
   *
   * @type {string}
   * @default 'array'
   */
  dataType: string = 'array';

  colToProp: (column: number) => PropDescriptor = () => '';
  propToCol: (prop: PropDescriptor) => number = () => 0;
  countCachedColumns: () => number = () => 0;

  constructor(hotInstance: Handsontable, dataSource: DataSourceType = []) {
    this.hot = hotInstance;
    this.data = dataSource;
  }

  /**
   * Run the `modifyRowData` hook and return either the modified or the source data for the provided row.
   *
   * @private
   * @param {number} rowIndex Row index.
   * @returns {Array|object} Source or modified row of data.
   */
  modifyRowData(rowIndex: number): any[] | Record<string, any> {
    let modifyRowData: any;

    if (this.hot.hasHook('modifyRowData')) {
      modifyRowData = this.hot.runHooks('modifyRowData', rowIndex);
    }

    return (modifyRowData !== undefined && !Number.isInteger(modifyRowData)) ? modifyRowData : this.data[rowIndex];
  }

  /**
   * Get all data.
   *
   * @param {boolean} [toArray=false] If `true` return source data as an array of arrays even when source data was provided
   *                                  in another format.
   * @returns {Array}
   */
  getData(toArray: boolean = false): DataSourceType {
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
  setData(data: DataSourceType): void {
    this.data = data;
  }

  /**
   * Returns array of column values from the data source. `column` is the index of the row in the data source.
   *
   * @param {number} column Visual column index.
   * @returns {Array}
   */
  getAtColumn(column: number): any[] {
    const result: any[] = [];

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
  getAtRow(row: number, startColumn?: number, endColumn?: number, toArray: boolean = false): any[] | Record<string, any> {
    const getAllProps = startColumn === undefined && endColumn === undefined;
    const { dataDotNotation } = this.hot.getSettings();
    let dataRow: any = null;
    let newDataRow: any = null;

    dataRow = this.modifyRowData(row);

    if (Array.isArray(dataRow)) {
      newDataRow = [];

      if (getAllProps) {
        dataRow.forEach((cell, column) => {
          newDataRow[column] = this.getAtPhysicalCell(row, column, dataRow);
        });

      } else {
        // Only the columns from the provided range
        rangeEach(startColumn as number, endColumn as number, (column) => {
          newDataRow[column - (startColumn as number)] = this.getAtPhysicalCell(row, column, dataRow);
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

            } else if (dataDotNotation) {
              setProperty(newDataRow, prop as string, cellValue);

            } else {
              newDataRow[prop as string] = cellValue;
            }
          }
        });

      } else {
        objectEach(dataRow, (value, prop) => {
          const cellValue = this.getAtPhysicalCell(row, prop, dataRow);

          if (dataDotNotation) {
            setProperty(newDataRow, prop, cellValue);
          } else {
            newDataRow[prop] = cellValue;
          }
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
  setAtCell(row: number, column: number | string, value: CellValue): void {
    if (row >= this.countRows() || (typeof column === 'number' && column >= this.countFirstRowKeys())) {
      // Not enough rows and/or columns.
      return;
    }

    if (this.hot.hasHook('modifySourceData')) {
      const valueHolder = createObjectPropListener(value);

      this.hot.runHooks('modifySourceData', row, column, valueHolder, 'set');

      if (valueHolder.isTouched()) {
        value = valueHolder.value;
      }
    }

    if (['__proto__', 'constructor', 'prototype'].includes(row as any)) {
      // prevent prototype pollution
      return;
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
  getAtPhysicalCell(row: number, column: PropDescriptor, dataRow: any): CellValue {
    let result: CellValue = null;

    if (dataRow) {
      if (typeof column === 'string') {
        const { dataDotNotation } = this.hot.getSettings();

        result = dataDotNotation ? getProperty(dataRow, column) : dataRow[column];

      } else if (typeof column === 'function') {
        result = column(dataRow);

      } else {
        result = dataRow[column];
      }
    }

    if (this.hot.hasHook('modifySourceData')) {
      const valueHolder = createObjectPropListener(result);

      this.hot.runHooks('modifySourceData', row, column, valueHolder, 'get');

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
   * @param {number} columnOrProp Visual column index or property.
   * @returns {*}
   */
  getAtCell(row: number, columnOrProp: number | string): CellValue {
    const dataRow = this.modifyRowData(row);

    return this.getAtPhysicalCell(row, typeof columnOrProp === 'number' ? this.colToProp(columnOrProp) : columnOrProp, dataRow);
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
  getByRange(start: CellCoords | null = null, end: CellCoords | null = null, toArray: boolean = false): any[] {
    let getAllProps = false;
    let startRow: number = 0;
    let startCol: number | null = null;
    let endRow: number = 0;
    let endCol: number | null = null;

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

    const result: any[] = [];

    rangeEach(startRow, endRow, (currentRow) => {
      result.push((
        getAllProps ?
          this.getAtRow(currentRow, undefined, undefined, toArray) :
          this.getAtRow(currentRow, startCol as number, endCol as number, toArray)
      ));
    });

    return result;
  }

  /**
   * Count number of rows.
   *
   * @returns {number}
   */
  countRows(): number {
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
  countFirstRowKeys(): number {
    return countFirstRowKeys(this.data);
  }

  /**
   * Destroy instance.
   */
  destroy(): void {
    this.data = null as any;
    this.hot = null as any;
  }
}

export default DataSource;
