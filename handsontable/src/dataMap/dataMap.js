import { stringify } from '../3rdparty/SheetClip';
import {
  countFirstRowKeys
} from '../helpers/data';
import {
  createObjectPropListener,
  deepClone,
  deepExtend,
  deepObjectSize,
  duckSchema,
  hasOwnProperty,
  isObject,
  objectEach
} from '../helpers/object';
import { extendArray, to2dArray } from '../helpers/array';
import { rangeEach } from '../helpers/number';
import { isDefined } from '../helpers/mixed';

/*
This class contains open-source contributions covered by the MIT license.

1) In the `createRow` method: Row creation using functional `dataSchema` value
2) In the `set` method: Data setting using functional `prop` value
3) in the `get` method: Data getting using functional `prop` value

The remaining part of this code comment contains the full license text of these contributions.

======

The MIT License

Copyright 2013 Nicholas Bollweg

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * Utility class that gets and saves data from/to the data source using mapping of columns numbers to object property names.
 *
 * @todo Refactor arguments of methods getRange, getText to be numbers (not objects).
 * @todo Remove priv, GridSettings from object constructor.
 *
 * @class DataMap
 * @private
 */
class DataMap {
  /**
   * @type {number}
   */
  static get DESTINATION_RENDERER() {
    return 1;
  }

  /**
   * @type {number}
   */
  static get DESTINATION_CLIPBOARD_GENERATOR() {
    return 2;
  }

  /**
   * Instance of {@link Handsontable}.
   *
   * @private
   * @type {Handsontable}
   */
  hot;
  /**
   * Instance of {@link MetaManager}.
   *
   * @private
   * @type {MetaManager}
   */
  metaManager;
  /**
   * Instance of {@link TableMeta}.
   *
   * @private
   * @type {TableMeta}
   */
  tableMeta;
  /**
   * Reference to the original dataset.
   *
   * @type {*}
   */
  dataSource;
  /**
   * Generated schema based on the first row from the source data.
   *
   * @type {object}
   */
  duckSchema;
  /**
   * Cached array of properties to columns.
   *
   * @type {Array}
   */
  colToPropCache;
  /**
   * Cached map of properties to columns.
   *
   * @type {Map}
   */
  propToColCache;

  /**
   * @param {object} hotInstance Instance of Handsontable.
   * @param {Array} data Array of arrays or array of objects containing data.
   * @param {MetaManager} metaManager The meta manager instance.
   */
  constructor(hotInstance, data, metaManager) {
    this.hot = hotInstance;
    this.metaManager = metaManager;
    this.tableMeta = metaManager.getTableMeta();
    this.dataSource = data;
    this.duckSchema = this.createDuckSchema();

    this.createMap();
  }

  /**
   * Generates cache for property to and from column addressation.
   */
  createMap() {
    const schema = this.getSchema();

    if (typeof schema === 'undefined') {
      throw new Error('trying to create `columns` definition but you didn\'t provide `schema` nor `data`');
    }

    const columns = this.tableMeta.columns;
    let i;

    this.colToPropCache = [];
    this.propToColCache = new Map();

    if (columns) {
      let columnsLen = 0;
      let filteredIndex = 0;
      let columnsAsFunc = false;

      if (typeof columns === 'function') {
        const schemaLen = deepObjectSize(schema);

        columnsLen = schemaLen > 0 ? schemaLen : this.countFirstRowKeys();
        columnsAsFunc = true;

      } else {
        const maxCols = this.tableMeta.maxCols;

        columnsLen = Math.min(maxCols, columns.length);
      }

      for (i = 0; i < columnsLen; i++) {
        const column = columnsAsFunc ? columns(i) : columns[i];

        if (isObject(column)) {
          if (typeof column.data !== 'undefined') {
            const index = columnsAsFunc ? filteredIndex : i;

            this.colToPropCache[index] = column.data;
            this.propToColCache.set(column.data, index);
          }

          filteredIndex += 1;
        }
      }

    } else {
      this.recursiveDuckColumns(schema);
    }
  }

  /**
   * Get the amount of physical columns in the first data row.
   *
   * @returns {number} Amount of physical columns in the first data row.
   */
  countFirstRowKeys() {
    return countFirstRowKeys(this.dataSource);
  }

  /**
   * Generates columns' translation cache.
   *
   * @param {object} schema An object to generate schema from.
   * @param {number} lastCol The column index.
   * @param {number} parent The property cache for recursive calls.
   * @returns {number}
   */
  recursiveDuckColumns(schema, lastCol, parent) {
    let lastColumn = lastCol;
    let propertyParent = parent;
    let prop;

    if (typeof lastColumn === 'undefined') {
      lastColumn = 0;
      propertyParent = '';
    }
    if (typeof schema === 'object' && !Array.isArray(schema)) {
      objectEach(schema, (value, key) => {
        if (value === null) {
          prop = propertyParent + key;
          this.colToPropCache.push(prop);
          this.propToColCache.set(prop, lastColumn);

          lastColumn += 1;
        } else {
          lastColumn = this.recursiveDuckColumns(value, lastColumn, `${key}.`);
        }
      });
    }

    return lastColumn;
  }

  /**
   * Returns property name that corresponds with the given column index.
   *
   * @param {string|number} column Visual column index or another passed argument.
   * @returns {string|number} Column property, physical column index or passed argument.
   */
  colToProp(column) {
    // TODO: Should it work? Please, look at the test:
    // "it should return the provided property name, when the user passes a property name as a column number".
    if (Number.isInteger(column) === false) {
      return column;
    }

    const physicalColumn = this.hot.toPhysicalColumn(column);

    // Out of range, not visible column index.
    if (physicalColumn === null) {
      return column;
    }

    // Cached property.
    if (this.colToPropCache && isDefined(this.colToPropCache[physicalColumn])) {
      return this.colToPropCache[physicalColumn];
    }

    return physicalColumn;
  }

  /**
   * Translates property into visual column index.
   *
   * @param {string|number} prop Column property which may be also a physical column index.
   * @returns {string|number} Visual column index or passed argument.
   */
  propToCol(prop) {
    const cachedPhysicalIndex = this.propToColCache.get(prop);

    if (isDefined(cachedPhysicalIndex)) {
      return this.hot.toVisualColumn(cachedPhysicalIndex);
    }

    // Property may be a physical column index.
    const visualColumn = this.hot.toVisualColumn(prop);

    if (visualColumn === null) {
      return prop;
    }

    return visualColumn;
  }

  /**
   * Returns data's schema.
   *
   * @returns {object}
   */
  getSchema() {
    const schema = this.tableMeta.dataSchema;

    if (schema) {
      if (typeof schema === 'function') {
        return schema();
      }

      return schema;
    }

    return this.duckSchema;
  }

  /**
   * Creates the duck schema based on the current dataset.
   *
   * @returns {Array|object}
   */
  createDuckSchema() {
    return this.dataSource && this.dataSource[0] ? duckSchema(this.dataSource[0]) : {};
  }

  /**
   * Refresh the data schema.
   */
  refreshDuckSchema() {
    this.duckSchema = this.createDuckSchema();
  }

  /**
   * Creates row at the bottom of the data array.
   *
   * @param {number} [index] Physical index of the row before which the new row will be inserted.
   * @param {number} [amount=1] An amount of rows to add.
   * @param {object} [options] Additional options for created rows.
   * @param {string} [options.source] Source of method call.
   * @param {'above'|'below'} [options.mode] Sets where the row is inserted: above or below the passed index.
   * @fires Hooks#afterCreateRow
   * @returns {number} Returns number of created rows.
   */
  createRow(index, amount = 1, { source, mode = 'above' } = {}) {
    const sourceRowsCount = this.hot.countSourceRows();
    let physicalRowIndex = sourceRowsCount;
    let numberOfCreatedRows = 0;
    let rowIndex = index;

    if (typeof rowIndex !== 'number' || rowIndex >= sourceRowsCount) {
      rowIndex = sourceRowsCount;
    }

    if (rowIndex < this.hot.countRows()) {
      physicalRowIndex = this.hot.toPhysicalRow(rowIndex);
    }

    const continueProcess = this.hot.runHooks('beforeCreateRow', rowIndex, amount, source);

    if (continueProcess === false || physicalRowIndex === null) {
      return {
        delta: 0,
      };
    }

    const maxRows = this.tableMeta.maxRows;
    const columnCount = this.getSchema().length;
    const rowsToAdd = [];

    while (numberOfCreatedRows < amount && sourceRowsCount + numberOfCreatedRows < maxRows) {
      let row = null;

      if (this.hot.dataType === 'array') {
        if (this.tableMeta.dataSchema) {
          // Clone template array
          row = deepClone(this.getSchema());

        } else {
          row = [];
          /* eslint-disable no-loop-func */
          rangeEach(columnCount - 1, () => row.push(null));
        }

      } else if (this.hot.dataType === 'function') {
        row = this.tableMeta.dataSchema(rowIndex + numberOfCreatedRows);

      } else {
        row = {};
        deepExtend(row, this.getSchema());
      }

      rowsToAdd.push(row);

      numberOfCreatedRows += 1;
    }

    this.hot.rowIndexMapper.insertIndexes(rowIndex, numberOfCreatedRows);

    if (mode === 'below') {
      physicalRowIndex = Math.min(physicalRowIndex + 1, sourceRowsCount);
    }

    this.spliceData(physicalRowIndex, 0, rowsToAdd);

    const newVisualRowIndex = this.hot.toVisualRow(physicalRowIndex);

    // In case the created rows are the only ones in the table, the column index mappers need to be rebuilt based on
    // the number of columns created in the row or the schema.
    if (this.hot.countSourceRows() === rowsToAdd.length) {
      this.hot.columnIndexMapper.initToLength(this.hot.getInitialColumnCount());
    }

    if (numberOfCreatedRows > 0) {
      if ((index === undefined || index === null)) {
        // Creates the meta rows at the end of the rows collection without shifting the cells
        // that were defined out of the range of the dataset.
        this.metaManager.createRow(null, numberOfCreatedRows);

      } else if (source !== 'auto') {
        this.metaManager.createRow(physicalRowIndex, amount);
      }
    }

    this.hot.runHooks('afterCreateRow', newVisualRowIndex, numberOfCreatedRows, source);
    this.hot.forceFullRender = true; // used when data was changed

    return {
      delta: numberOfCreatedRows,
      startPhysicalIndex: physicalRowIndex,
    };
  }

  /**
   * Creates column at the right of the data array.
   *
   * @param {number} [index] Visual index of the column before which the new column will be inserted.
   * @param {number} [amount=1] An amount of columns to add.
   * @param {object} [options] Additional options for created columns.
   * @param {string} [options.source] Source of method call.
   * @param {'start'|'end'} [options.mode] Sets where the column is inserted: at the start (left in [LTR](@/api/options.md#layoutdirection), right in [RTL](@/api/options.md#layoutdirection)) or at the end (right in LTR, left in LTR)
   * the passed index.
   * @fires Hooks#afterCreateCol
   * @returns {number} Returns number of created columns.
   */
  createCol(index, amount = 1, { source, mode = 'start' } = {}) {
    if (!this.hot.isColumnModificationAllowed()) {
      throw new Error('Cannot create new column. When data source in an object, ' +
        'you can only have as much columns as defined in first data row, data schema or in the \'columns\' setting.' +
        'If you want to be able to add new columns, you have to use array datasource.');
    }

    const dataSource = this.dataSource;
    const maxCols = this.tableMeta.maxCols;
    const countSourceCols = this.hot.countSourceCols();
    let columnIndex = index;

    if (typeof columnIndex !== 'number' || columnIndex >= countSourceCols) {
      columnIndex = countSourceCols;
    }

    const continueProcess = this.hot.runHooks('beforeCreateCol', columnIndex, amount, source);

    if (continueProcess === false) {
      return {
        delta: 0,
      };
    }

    let physicalColumnIndex = countSourceCols;

    if (columnIndex < this.hot.countCols()) {
      physicalColumnIndex = this.hot.toPhysicalColumn(columnIndex);
    }

    const numberOfSourceRows = this.hot.countSourceRows();
    let nrOfColumns = this.hot.countCols();
    let numberOfCreatedCols = 0;
    let currentIndex = physicalColumnIndex;

    if (mode === 'end') {
      currentIndex = Math.min(currentIndex + 1, countSourceCols);
    }

    const startPhysicalIndex = currentIndex;

    while (numberOfCreatedCols < amount && nrOfColumns < maxCols) {
      if (typeof columnIndex !== 'number' || columnIndex >= nrOfColumns) {
        if (numberOfSourceRows > 0) {
          for (let row = 0; row < numberOfSourceRows; row += 1) {
            if (typeof dataSource[row] === 'undefined') {
              dataSource[row] = [];
            }

            dataSource[row].push(null);
          }
        } else {
          dataSource.push([null]);
        }

      } else {
        for (let row = 0; row < numberOfSourceRows; row++) {
          dataSource[row].splice(currentIndex, 0, null);
        }
      }

      numberOfCreatedCols += 1;
      currentIndex += 1;
      nrOfColumns += 1;
    }

    this.hot.columnIndexMapper.insertIndexes(columnIndex, numberOfCreatedCols);

    if (numberOfCreatedCols > 0) {
      if ((index === undefined || index === null)) {
        // Creates the meta columns at the end of the columns collection without shifting the cells
        // that were defined out of the range of the dataset.
        this.metaManager.createColumn(null, numberOfCreatedCols);

      } else if (source !== 'auto') {
        this.metaManager.createColumn(startPhysicalIndex, amount);
      }
    }

    const newVisualColumnIndex = this.hot.toVisualColumn(startPhysicalIndex);

    this.hot.runHooks('afterCreateCol', newVisualColumnIndex, numberOfCreatedCols, source);
    this.hot.forceFullRender = true; // used when data was changed

    this.refreshDuckSchema();

    return {
      delta: numberOfCreatedCols,
      startPhysicalIndex,
    };
  }

  /**
   * Removes row from the data array.
   *
   * @fires Hooks#beforeRemoveRow
   * @fires Hooks#afterRemoveRow
   * @param {number} [index] Visual index of the row to be removed. If not provided, the last row will be removed.
   * @param {number} [amount=1] Amount of the rows to be removed. If not provided, one row will be removed.
   * @param {string} [source] Source of method call.
   * @returns {boolean} Returns `false` when action was cancelled, otherwise `true`.
   */
  removeRow(index, amount = 1, source) {
    let rowIndex = Number.isInteger(index) ? index : -amount; // -amount = taking indexes from the end.
    const removedPhysicalIndexes = this.visualRowsToPhysical(rowIndex, amount);
    const sourceRowsLength = this.hot.countSourceRows();

    rowIndex = (sourceRowsLength + rowIndex) % sourceRowsLength;

    // It handle also callback from the `NestedRows` plugin. Removing parent node has effect in removing children nodes.
    const actionWasNotCancelled = this.hot.runHooks(
      'beforeRemoveRow', rowIndex, removedPhysicalIndexes.length, removedPhysicalIndexes, source
    );

    if (actionWasNotCancelled === false) {
      return false;
    }

    // List of removed indexes might be changed in the `beforeRemoveRow` hook. There may be new values.
    const numberOfRemovedIndexes = removedPhysicalIndexes.length;

    this.filterData(rowIndex, numberOfRemovedIndexes, removedPhysicalIndexes);

    // TODO: Function `removeRow` should validate fully, probably above.
    if (rowIndex < this.hot.countRows()) {
      this.hot.rowIndexMapper.removeIndexes(removedPhysicalIndexes);

      const customDefinedColumns = isDefined(this.tableMeta.columns) || isDefined(this.tableMeta.dataSchema);

      // All rows have been removed. There shouldn't be any columns.
      if (this.hot.rowIndexMapper.getNotTrimmedIndexesLength() === 0 && customDefinedColumns === false) {
        this.hot.columnIndexMapper.setIndexesSequence([]);
      }
    }

    const descendingPhysicalRows = removedPhysicalIndexes.slice(0).sort((a, b) => b - a);

    descendingPhysicalRows.forEach((rowPhysicalIndex) => {
      this.metaManager.removeRow(rowPhysicalIndex, 1);
    });

    this.hot.runHooks('afterRemoveRow', rowIndex, numberOfRemovedIndexes, removedPhysicalIndexes, source);
    this.hot.forceFullRender = true; // used when data was changed

    return true;
  }

  /**
   * Removes column from the data array.
   *
   * @fires Hooks#beforeRemoveCol
   * @fires Hooks#afterRemoveCol
   * @param {number} [index] Visual index of the column to be removed. If not provided, the last column will be removed.
   * @param {number} [amount=1] Amount of the columns to be removed. If not provided, one column will be removed.
   * @param {string} [source] Source of method call.
   * @returns {boolean} Returns `false` when action was cancelled, otherwise `true`.
   */
  removeCol(index, amount = 1, source) {
    if (this.hot.dataType === 'object' || this.tableMeta.columns) {
      throw new Error('cannot remove column with object data source or columns option specified');
    }
    let columnIndex = typeof index !== 'number' ? -amount : index;

    columnIndex = (this.hot.countCols() + columnIndex) % this.hot.countCols();

    const removedPhysicalIndexes = this.visualColumnsToPhysical(columnIndex, amount);
    const descendingPhysicalColumns = removedPhysicalIndexes.slice(0).sort((a, b) => b - a);
    const actionWasNotCancelled = this.hot
      .runHooks('beforeRemoveCol', columnIndex, amount, removedPhysicalIndexes, source);

    if (actionWasNotCancelled === false) {
      return false;
    }

    let isTableUniform = true;
    const removedColumnsCount = descendingPhysicalColumns.length;
    const data = this.dataSource;

    for (let c = 0; c < removedColumnsCount; c++) {
      if (isTableUniform && removedPhysicalIndexes[0] !== removedPhysicalIndexes[c] - c) {
        isTableUniform = false;
      }
    }

    if (isTableUniform) {
      for (let r = 0, rlen = this.hot.countSourceRows(); r < rlen; r++) {
        data[r].splice(removedPhysicalIndexes[0], amount);

        if (r === 0) {
          this.metaManager.removeColumn(removedPhysicalIndexes[0], amount);
        }
      }

    } else {
      for (let r = 0, rlen = this.hot.countSourceRows(); r < rlen; r++) {
        for (let c = 0; c < removedColumnsCount; c++) {
          data[r].splice(descendingPhysicalColumns[c], 1);

          if (r === 0) {
            this.metaManager.removeColumn(descendingPhysicalColumns[c], 1);
          }
        }
      }
    }

    // TODO: Function `removeCol` should validate fully, probably above.
    if (columnIndex < this.hot.countCols()) {
      this.hot.columnIndexMapper.removeIndexes(removedPhysicalIndexes);

      // All columns have been removed. There shouldn't be any rows.
      if (this.hot.columnIndexMapper.getNotTrimmedIndexesLength() === 0) {
        this.hot.rowIndexMapper.setIndexesSequence([]);
      }
    }

    this.hot.runHooks('afterRemoveCol', columnIndex, amount, removedPhysicalIndexes, source);
    this.hot.forceFullRender = true; // used when data was changed
    this.refreshDuckSchema();

    return true;
  }

  /**
   * Add/Removes data from the column.
   *
   * @param {number} col Physical index of column in which do you want to do splice.
   * @param {number} index Index at which to start changing the array. If negative, will begin that many elements from the end.
   * @param {number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed.
   * @param {Array} [elements] The new columns to add.
   * @returns {Array} Returns removed portion of columns.
   */
  spliceCol(col, index, amount, ...elements) {
    const colData = this.hot.getDataAtCol(col);
    const removed = colData.slice(index, index + amount);
    const after = colData.slice(index + amount);

    extendArray(elements, after);
    let i = 0;

    while (i < amount) {
      elements.push(null); // add null in place of removed elements
      i += 1;
    }
    to2dArray(elements);
    this.hot.populateFromArray(index, col, elements, null, null, 'spliceCol');

    return removed;
  }

  /**
   * Add/Removes data from the row.
   *
   * @param {number} row Physical index of row in which do you want to do splice.
   * @param {number} index Index at which to start changing the array. If negative, will begin that many elements from the end.
   * @param {number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed.
   * @param {Array} [elements] The new rows to add.
   * @returns {Array} Returns removed portion of rows.
   */
  spliceRow(row, index, amount, ...elements) {
    const rowData = this.hot.getSourceDataAtRow(row);
    const removed = rowData.slice(index, index + amount);
    const after = rowData.slice(index + amount);

    extendArray(elements, after);
    let i = 0;

    while (i < amount) {
      elements.push(null); // add null in place of removed elements
      i += 1;
    }
    this.hot.populateFromArray(row, index, [elements], null, null, 'spliceRow');

    return removed;
  }

  /**
   * Add/remove row(s) to/from the data source.
   *
   * @param {number} index Physical index of the element to add/remove.
   * @param {number} deleteCount Number of rows to remove.
   * @param {Array<object>} elements Row elements to be added.
   */
  spliceData(index, deleteCount, elements) {
    const continueSplicing = this.hot.runHooks('beforeDataSplice', index, deleteCount, elements);

    if (continueSplicing !== false) {
      const newData = [...this.dataSource.slice(0, index), ...elements, ...this.dataSource.slice(index)];

      // We try not to change the reference.
      this.dataSource.length = 0;

      // Pushing to array instead of using `splice`, because Babel changes the code to one that uses the `apply` method.
      // The used method was cause of the problem described within #7840.
      newData.forEach(row => this.dataSource.push(row));
    }
  }

  /**
   * Filter unwanted data elements from the data source.
   *
   * @param {number} index Visual index of the element to remove.
   * @param {number} amount Number of rows to add/remove.
   * @param {number} physicalRows Physical row indexes.
   */
  filterData(index, amount, physicalRows) {
    // Custom data filtering (run as a consequence of calling the below hook) provide an array containing new data.
    let data = this.hot.runHooks('filterData', index, amount, physicalRows);

    // Hooks by default returns first argument (when there is no callback changing execution result).
    if (Array.isArray(data) === false) {
      data = this.dataSource.filter((row, rowIndex) => physicalRows.indexOf(rowIndex) === -1);
    }

    this.dataSource.length = 0;
    Array.prototype.push.apply(this.dataSource, data);
  }

  /**
   * Returns single value from the data array.
   *
   * @param {number} row Visual row index.
   * @param {number} prop The column property.
   * @returns {*}
   */
  get(row, prop) {
    const physicalRow = this.hot.toPhysicalRow(row);

    let dataRow = this.dataSource[physicalRow];
    // TODO: To remove, use 'modifyData' hook instead (see below)
    const modifiedRowData = this.hot.runHooks('modifyRowData', physicalRow);

    dataRow = isNaN(modifiedRowData) ? modifiedRowData : dataRow;
    //

    const { dataDotNotation } = this.hot.getSettings();
    let value = null;

    // try to get value under property `prop` (includes dot)
    if (dataRow && dataRow.hasOwnProperty && hasOwnProperty(dataRow, prop)) {
      value = dataRow[prop];

    } else if (dataDotNotation && typeof prop === 'string' && prop.indexOf('.') > -1) {
      let out = dataRow;

      if (!out) {
        return null;
      }

      const sliced = prop.split('.');

      for (let i = 0, ilen = sliced.length; i < ilen; i++) {
        out = out[sliced[i]];

        if (typeof out === 'undefined') {
          return null;
        }
      }

      value = out;

    } else if (typeof prop === 'function') {
      value = prop(this.dataSource.slice(physicalRow, physicalRow + 1)[0]);
    }

    if (this.hot.hasHook('modifyData')) {
      const valueHolder = createObjectPropListener(value);

      this.hot.runHooks('modifyData', physicalRow, this.propToCol(prop), valueHolder, 'get');

      if (valueHolder.isTouched()) {
        value = valueHolder.value;
      }
    }

    return value;
  }

  /**
   * Returns single value from the data array (intended for clipboard copy to an external application).
   *
   * @param {number} row Physical row index.
   * @param {number} prop The column property.
   * @returns {string}
   */
  getCopyable(row, prop) {
    if (this.hot.getCellMeta(row, this.propToCol(prop)).copyable) {
      return this.get(row, prop);
    }

    return '';
  }

  /**
   * Saves single value to the data array.
   *
   * @param {number} row Visual row index.
   * @param {number} prop The column property.
   * @param {string} value The value to set.
   */
  set(row, prop, value) {
    const physicalRow = this.hot.toPhysicalRow(row);
    let newValue = value;
    let dataRow = this.dataSource[physicalRow];
    // TODO: To remove, use 'modifyData' hook instead (see below)
    const modifiedRowData = this.hot.runHooks('modifyRowData', physicalRow);

    dataRow = isNaN(modifiedRowData) ? modifiedRowData : dataRow;
    //

    if (this.hot.hasHook('modifyData')) {
      const valueHolder = createObjectPropListener(newValue);

      this.hot.runHooks('modifyData', physicalRow, this.propToCol(prop), valueHolder, 'set');

      if (valueHolder.isTouched()) {
        newValue = valueHolder.value;
      }
    }

    const { dataDotNotation } = this.hot.getSettings();

    // try to set value under property `prop` (includes dot)
    if (dataRow && dataRow.hasOwnProperty && hasOwnProperty(dataRow, prop)) {
      dataRow[prop] = newValue;

    } else if (dataDotNotation && typeof prop === 'string' && prop.indexOf('.') > -1) {
      let out = dataRow;
      let i = 0;
      let ilen;

      const sliced = prop.split('.');

      for (i = 0, ilen = sliced.length - 1; i < ilen; i++) {
        if (sliced[i] === '__proto__' || sliced[i] === 'constructor' || sliced[i] === 'prototype') {
          // Security: prototype-polluting is not allowed
          return;
        }

        if (typeof out[sliced[i]] === 'undefined') {
          out[sliced[i]] = {};
        }
        out = out[sliced[i]];
      }

      out[sliced[i]] = newValue;
    } else if (typeof prop === 'function') {
      prop(this.dataSource.slice(physicalRow, physicalRow + 1)[0], newValue);

    } else {
      if (prop === '__proto__' || prop === 'constructor' || prop === 'prototype') {
        // Security: prototype-polluting is not allowed
        return;
      }

      dataRow[prop] = newValue;
    }
  }

  /**
   * This ridiculous piece of code maps rows Id that are present in table data to those displayed for user.
   * The trick is, the physical row id (stored in settings.data) is not necessary the same
   * as the visual (displayed) row id (e.g. When sorting is applied).
   *
   * @param {number} index Visual row index.
   * @param {number} amount An amount of rows to translate.
   * @returns {number}
   */
  visualRowsToPhysical(index, amount) {
    const totalRows = this.hot.countSourceRows();
    const logicRows = [];
    let physicRow = (totalRows + index) % totalRows;
    let rowsToRemove = amount;
    let row;

    while (physicRow < totalRows && rowsToRemove) {
      row = this.hot.toPhysicalRow(physicRow);
      logicRows.push(row);

      rowsToRemove -= 1;
      physicRow += 1;
    }

    return logicRows;
  }

  /**
   *
   * @param {number} index Visual column index.
   * @param {number} amount An amount of rows to translate.
   * @returns {Array}
   */
  visualColumnsToPhysical(index, amount) {
    const totalCols = this.hot.countCols();
    const visualCols = [];
    let physicalCol = (totalCols + index) % totalCols;
    let colsToRemove = amount;

    while (physicalCol < totalCols && colsToRemove) {
      const col = this.hot.toPhysicalColumn(physicalCol);

      visualCols.push(col);

      colsToRemove -= 1;
      physicalCol += 1;
    }

    return visualCols;
  }

  /**
   * Clears the data array.
   */
  clear() {
    for (let r = 0; r < this.hot.countSourceRows(); r++) {
      for (let c = 0; c < this.hot.countCols(); c++) {
        this.set(r, this.colToProp(c), '');
      }
    }
  }

  /**
   * Get data length.
   *
   * @returns {number}
   */
  getLength() {
    const maxRowsFromSettings = this.tableMeta.maxRows;
    let maxRows;

    if (maxRowsFromSettings < 0 || maxRowsFromSettings === 0) {
      maxRows = 0;

    } else {
      maxRows = maxRowsFromSettings || Infinity;
    }

    const length = this.hot.rowIndexMapper.getNotTrimmedIndexesLength();

    return Math.min(length, maxRows);
  }

  /**
   * Returns the data array.
   *
   * @returns {Array}
   */
  getAll() {
    const start = {
      row: 0,
      col: 0,
    };

    const end = {
      row: Math.max(this.hot.countRows() - 1, 0),
      col: Math.max(this.hot.countCols() - 1, 0),
    };

    if (start.row - end.row === 0 && !this.hot.countSourceRows()) {
      return [];
    }

    return this.getRange(start, end, DataMap.DESTINATION_RENDERER);
  }

  /**
   * Count the number of columns cached in the `colToProp` cache.
   *
   * @returns {number} Amount of cached columns.
   */
  countCachedColumns() {
    return this.colToPropCache.length;
  }

  /**
   * Returns data range as array.
   *
   * @param {object} [start] Start selection position. Visual indexes.
   * @param {object} [end] End selection position. Visual indexes.
   * @param {number} destination Destination of datamap.get.
   * @returns {Array}
   */
  getRange(start, end, destination) {
    const output = [];
    let r;
    let c;
    let row;

    const maxRows = this.tableMeta.maxRows;
    const maxCols = this.tableMeta.maxCols;

    if (maxRows === 0 || maxCols === 0) {
      return [];
    }

    const getFn = destination === DataMap.DESTINATION_CLIPBOARD_GENERATOR ? this.getCopyable : this.get;

    const rlen = Math.min(Math.max(maxRows - 1, 0), Math.max(start.row, end.row));
    const clen = Math.min(Math.max(maxCols - 1, 0), Math.max(start.col, end.col));

    for (r = Math.min(start.row, end.row); r <= rlen; r++) {
      row = [];
      // We just store indexes for rows without headers.
      const physicalRow = r >= 0 ? this.hot.toPhysicalRow(r) : r;

      for (c = Math.min(start.col, end.col); c <= clen; c++) {

        if (physicalRow === null) {
          break;
        }
        row.push(getFn.call(this, r, this.colToProp(c)));
      }
      if (physicalRow !== null) {
        output.push(row);
      }
    }

    return output;
  }

  /**
   * Return data as text (tab separated columns).
   *
   * @param {object} [start] Start selection position. Visual indexes.
   * @param {object} [end] End selection position. Visual indexes.
   * @returns {string}
   */
  getText(start, end) {
    return stringify(this.getRange(start, end, DataMap.DESTINATION_RENDERER));
  }

  /**
   * Return data as copyable text (tab separated columns intended for clipboard copy to an external application).
   *
   * @param {object} [start] Start selection position. Visual indexes.
   * @param {object} [end] End selection position. Visual indexes.
   * @returns {string}
   */
  getCopyableText(start, end) {
    return stringify(this.getRange(start, end, DataMap.DESTINATION_CLIPBOARD_GENERATOR));
  }

  /**
   * Destroy instance.
   */
  destroy() {
    this.hot = null;
    this.metaManager = null;
    this.dataSource = null;
    this.duckSchema = null;
    this.colToPropCache.length = 0;

    this.propToColCache.clear();
    this.propToColCache = undefined;
  }
}

export default DataMap;
