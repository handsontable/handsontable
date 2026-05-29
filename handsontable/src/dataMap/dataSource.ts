import type { HotInstance } from '../core/types';
import {
  createObjectPropListener,
  getProperty,
  isObject,
  objectEach,
  setProperty
} from '../helpers/object';
import { cloneRow, countFirstRowKeys } from '../helpers/data';
import { arrayEach } from '../helpers/array';
import { rangeEach } from '../helpers/number';
import { isFunction } from '../helpers/function';

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
  declare hot: HotInstance | null;
  /**
   * Data source.
   *
   * @type {Array}
   */
  declare data: (Record<string, unknown> | unknown[])[] | null;
  /**
   * Type of data source.
   *
   * @type {string}
   * @default 'array'
   */
  dataType = 'array';

  colToProp: (column: unknown) => unknown = (_column: unknown) => undefined;
  propToCol: (prop: unknown) => unknown = (_prop: unknown) => undefined;
  countCachedColumns?: () => number;

  constructor(hotInstance: HotInstance, dataSource: unknown[][] | object[][] = []) {
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
  modifyRowData(rowIndex: number) {
    let modifyRowData;

    if (this.hot!.hasHook('modifyRowData')) {
      modifyRowData = this.hot!.runHooks('modifyRowData', rowIndex);
    }

    return (modifyRowData !== undefined && !Number.isInteger(modifyRowData)) ? modifyRowData : this.data![rowIndex];
  }

  /**
   * Get all data.
   *
   * Each call returns a fresh shallow clone of the source data so consumers can
   * safely mutate the returned array without affecting subsequent calls or the
   * underlying data. The fast path skips the per-cell hook lookups in
   * `getByRange()` and is taken when no `modifySourceData` / `modifyRowData`
   * hooks are registered and the caller does not request array-of-arrays
   * coercion (which needs the `colToProp` mapping `getByRange()` supplies).
   *
   * @param {boolean} [toArray=false] If `true` return source data as an array of arrays even when source data was provided
   *                                  in another format.
   * @returns {Array}
   */
  getData(toArray = false) {
    if (!this.data?.length) {
      return this.data;
    }

    if (!toArray
        && !this.hot!.hasHook('modifySourceData')
        && !this.hot!.hasHook('modifyRowData')) {
      return this.data.map(cloneRow);
    }

    return this.getByRange(null, null, toArray);
  }

  /**
   * Set new data source.
   *
   * @param {Array} data The new data.
   */
  setData(data: unknown[]) {
    this.data = data as (Record<string, unknown> | unknown[])[];
  }

  /**
   * Returns array of column values from the data source. `column` is the index of the row in the data source.
   *
   * @param {number} column Visual column index.
   * @returns {Array}
   */
  getAtColumn(column: number) {
    const result: unknown[] = [];

    arrayEach(this.data!, (row: unknown, rowIndex: number) => {
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
  getAtRow(row: number, startColumn?: number, endColumn?: number, toArray = false) {
    const getAllProps = startColumn === undefined && endColumn === undefined;
    const { dataDotNotation } = this.hot!.getSettings();
    let dataRow = null;
    let newDataRow: Record<string | number, unknown> | null = null;

    dataRow = this.modifyRowData(row);

    if (Array.isArray(dataRow)) {
      newDataRow = [] as unknown as Record<string | number, unknown>;

      if (getAllProps) {
        dataRow.forEach((cell: unknown, column: number) => {
          newDataRow![column] = this.getAtPhysicalCell(row, column, dataRow);
        });

      } else {
        // Only the columns from the provided range
        rangeEach(startColumn!, endColumn!, (column: number) => {
          newDataRow![column - startColumn!] = this.getAtPhysicalCell(row, column, dataRow);
        });
      }

    } else if (isObject(dataRow) || isFunction(dataRow)) {
      if (toArray) {
        newDataRow = [] as unknown as Record<string | number, unknown>;
      } else {
        newDataRow = {};
      }

      if (!getAllProps || toArray) {
        const rangeStart = 0;
        const rangeEnd = this.countFirstRowKeys() - 1;

        rangeEach(rangeStart, rangeEnd, (column: number) => {
          const prop = this.colToProp(column);

          if (column >= (startColumn || rangeStart) && column <= (endColumn || rangeEnd) && !Number.isInteger(prop)) {
            const cellValue = this.getAtPhysicalCell(row, prop as string | number | Function, dataRow);

            if (toArray) {
              (newDataRow as unknown as unknown[]).push(cellValue);

            } else if (dataDotNotation) {
              if (newDataRow !== null) {
                setProperty(newDataRow as Record<string, unknown>, prop as string, cellValue);
              }

            } else {
              newDataRow![prop as string] = cellValue;
            }
          }
        });

      } else {
        objectEach(dataRow as Record<string, unknown>, (value: unknown, prop: string) => {
          const cellValue = this.getAtPhysicalCell(row, prop, dataRow);

          if (dataDotNotation) {
            if (newDataRow !== null) {
              setProperty(newDataRow as Record<string, unknown>, prop, cellValue);
            }
          } else {
            newDataRow![prop] = cellValue;
          }
        });
      }
    }

    return newDataRow;
  }

  /**
   * Set the provided value in the source data set at the provided coordinates.
   *
   * @param {number|string} row Physical row index.
   * @param {number|string} column Property name / physical column index.
   * @param {*} value The value to be set at the provided coordinates.
   */
  setAtCell(row: number | string, column: string | number, value: unknown) {
    // Normalize row: accept string numeric indices (e.g. '0', '1') passed by setSourceDataAtCell,
    // but reject prototype-pollution keys like '__proto__', 'constructor', 'prototype'.
    let normalizedRow: number;

    if (typeof row === 'string') {
      const parsed = Number(row);

      if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed < 0) {
        return;
      }
      normalizedRow = parsed;
    } else if (typeof row !== 'number' || !Number.isInteger(row) || row < 0) {
      return;
    } else {
      normalizedRow = row;
    }

    if (normalizedRow >= this.countRows() || (typeof column === 'number' && column >= this.countFirstRowKeys())) {
      // Not enough rows and/or columns.
      return;
    }

    if (this.hot!.hasHook('modifySourceData')) {
      const valueHolder = createObjectPropListener(value);

      this.hot!.runHooks('modifySourceData', normalizedRow, column, valueHolder, 'set');

      if (valueHolder.isTouched()) {
        value = valueHolder.value;
      }
    }

    const dataRow = this.modifyRowData(normalizedRow);

    if (!Number.isInteger(column)) {
      // column argument is the prop name
      if (Array.isArray(dataRow)) {
        // String numeric column with array data — convert to number and write directly, same as
        // the integer path below. setProperty rejects arrays, so this must be handled here.
        const numericIndex = Number(column);

        if (!Number.isNaN(numericIndex) && Number.isInteger(numericIndex) &&
            numericIndex >= 0 && numericIndex < this.countFirstRowKeys()) {
          dataRow[numericIndex] = value;
        }
      } else if (isObject(dataRow)) {
        setProperty(dataRow as Record<string, unknown>, String(column), value);
      }
    } else if (Array.isArray(dataRow)) {
      dataRow[column as number] = value;
    } else if (isObject(dataRow)) {
      setProperty(dataRow as Record<string, unknown>, String(column), value);
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
  getAtPhysicalCell(row: number, column: number | string | Function, dataRow: unknown): unknown {
    let result = null;

    if (dataRow) {
      if (typeof column === 'string') {
        const { dataDotNotation } = this.hot!.getSettings();

        result = dataDotNotation
          ? getProperty(dataRow as Record<string, unknown>, column)
          : (dataRow as Record<string, unknown>)[column];

      } else if (typeof column === 'function') {
        result = column(dataRow);

      } else {
        result = (dataRow as unknown[])[column];
      }
    }

    if (this.hot!.hasHook('modifySourceData')) {
      const valueHolder = createObjectPropListener(result);

      this.hot!.runHooks('modifySourceData', row, column, valueHolder, 'get');

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
  getAtCell(row: number, columnOrProp: number | string): unknown {
    const dataRow = this.modifyRowData(row);

    return this.getAtPhysicalCell(row, this.colToProp(columnOrProp) as number | string | Function, dataRow);
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
  getByRange(
    start: {row?: number, col?: number} | null = null, end: {row?: number, col?: number} | null = null, toArray = false
  ) {
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
      startRow = Math.min(start.row!, end.row!);
      startCol = Math.min(start.col!, end.col!);
      endRow = Math.max(start.row!, end.row!);
      endCol = Math.max(start.col!, end.col!);
    }

    const result: unknown[] = [];

    rangeEach(startRow, endRow, (currentRow: number) => {
      result.push((
        getAllProps ?
          this.getAtRow(currentRow, undefined, undefined, toArray) :
          this.getAtRow(currentRow, startCol!, endCol!, toArray)
      ));
    });

    return result;
  }

  /**
   * Returns single value from the data array (intended for clipboard copy to an external application).
   *
   * @param {number} row Visual row index.
   * @param {number} prop The column property.
   * @since 16.1.0
   * @returns {string}
   */
  getCopyable(row: number, prop: string | number): unknown {
    const visualColumn = this.propToCol(prop);

    if (typeof visualColumn === 'number' && this.hot!.getCellMeta(row, visualColumn).copyable) {
      return this.getAtCell(this.hot!.toPhysicalRow(row), visualColumn);
    }

    return '';
  }

  /**
   * Count number of rows.
   *
   * @returns {number}
   */
  countRows() {
    if (this.hot!.hasHook('modifySourceLength')) {
      const modifiedSourceLength = this.hot!.runHooks('modifySourceLength');

      if (typeof modifiedSourceLength === 'number' && Number.isInteger(modifiedSourceLength)) {
        return modifiedSourceLength;
      }
    }

    return this.data!.length;
  }

  /**
   * Count number of columns.
   *
   * @returns {number}
   */
  countFirstRowKeys() {
    return countFirstRowKeys(this.data ?? []);
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
