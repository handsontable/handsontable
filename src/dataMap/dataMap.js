import { stringify } from '../3rdparty/SheetClip';
import {
  cellMethodLookupFactory,
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

const copyableLookup = cellMethodLookupFactory('copyable', false);

/**
 * Utility class that gets and saves data from/to the data source using mapping of columns numbers to object property names.
 *
 * @todo Refactor arguments of methods getRange, getText to be numbers (not objects).
 * @todo Remove priv, GridSettings from object constructor.
 *
 * @util
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
   * @param {object} instance Instance of Handsontable.
   * @param {Array} data Array of arrays or array of objects containing data.
   * @param {TableMeta} tableMeta The table meta instance.
   */
  constructor(instance, data, tableMeta) {
    /**
     * Instance of {@link Handsontable}.
     *
     * @private
     * @type {Handsontable}
     */
    this.instance = instance;
    /**
     * Instance of {@link TableMeta}.
     *
     * @private
     * @type {TableMeta}
     */
    this.tableMeta = tableMeta;
    /**
     * Reference to the original dataset.
     *
     * @type {*}
     */
    this.dataSource = data;
    /**
     * Generated schema based on the first row from the source data.
     *
     * @type {object}
     */
    this.duckSchema = this.dataSource && this.dataSource[0] ? duckSchema(this.dataSource[0]) : {};
    /**
     * Cached array of properties to columns.
     *
     * @type {Array}
     */
    this.colToPropCache = void 0;
    /**
     * Cached map of properties to columns.
     *
     * @type {Map}
     */
    this.propToColCache = void 0;

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

    const physicalColumn = this.instance.toPhysicalColumn(column);

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
      return this.instance.toVisualColumn(cachedPhysicalIndex);
    }

    // Property may be a physical column index.
    const visualColumn = this.instance.toVisualColumn(prop);

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
   * Creates row at the bottom of the data array.
   *
   * @param {number} [index] Physical index of the row before which the new row will be inserted.
   * @param {number} [amount=1] An amount of rows to add.
   * @param {string} [source] Source of method call.
   * @fires Hooks#afterCreateRow
   * @returns {number} Returns number of created rows.
   */
  createRow(index, amount = 1, source) {
    const sourceRowsCount = this.instance.countSourceRows();
    let physicalRowIndex = sourceRowsCount;
    let numberOfCreatedRows = 0;
    let rowIndex = index;

    if (typeof rowIndex !== 'number' || rowIndex >= sourceRowsCount) {
      rowIndex = sourceRowsCount;
    }

    if (rowIndex < this.instance.countRows()) {
      physicalRowIndex = this.instance.toPhysicalRow(rowIndex);
    }

    const continueProcess = this.instance.runHooks('beforeCreateRow', rowIndex, amount, source);

    if (continueProcess === false || physicalRowIndex === null) {
      return 0;
    }

    const maxRows = this.tableMeta.maxRows;
    const columnCount = this.instance.countCols();
    const rowsToAdd = [];

    while (numberOfCreatedRows < amount && sourceRowsCount + numberOfCreatedRows < maxRows) {
      let row = null;

      if (this.instance.dataType === 'array') {
        if (this.tableMeta.dataSchema) {
          // Clone template array
          row = deepClone(this.getSchema());

        } else {
          row = [];
          /* eslint-disable no-loop-func */
          rangeEach(columnCount - 1, () => row.push(null));
        }

      } else if (this.instance.dataType === 'function') {
        row = this.tableMeta.dataSchema(rowIndex + numberOfCreatedRows);

      } else {
        row = {};
        deepExtend(row, this.getSchema());
      }

      rowsToAdd.push(row);

      numberOfCreatedRows += 1;
    }

    this.instance.rowIndexMapper.insertIndexes(rowIndex, numberOfCreatedRows);

    this.spliceData(physicalRowIndex, 0, ...rowsToAdd);

    this.instance.runHooks('afterCreateRow', rowIndex, numberOfCreatedRows, source);
    this.instance.forceFullRender = true; // used when data was changed

    return numberOfCreatedRows;
  }

  /**
   * Creates column at the right of the data array.
   *
   * @param {number} [index] Visual index of the column before which the new column will be inserted.
   * @param {number} [amount=1] An amount of columns to add.
   * @param {string} [source] Source of method call.
   * @fires Hooks#afterCreateCol
   * @returns {number} Returns number of created columns.
   */
  createCol(index, amount = 1, source) {
    if (!this.instance.isColumnModificationAllowed()) {
      throw new Error('Cannot create new column. When data source in an object, ' +
        'you can only have as much columns as defined in first data row, data schema or in the \'columns\' setting.' +
        'If you want to be able to add new columns, you have to use array datasource.');
    }

    const dataSource = this.dataSource;
    const maxCols = this.tableMeta.maxCols;
    let columnIndex = index;

    if (typeof columnIndex !== 'number' || columnIndex >= this.instance.countSourceCols()) {
      columnIndex = this.instance.countSourceCols();
    }

    const continueProcess = this.instance.runHooks('beforeCreateCol', columnIndex, amount, source);

    if (continueProcess === false) {
      return 0;
    }

    let physicalColumnIndex = this.instance.countSourceCols();

    if (columnIndex < this.instance.countCols()) {
      physicalColumnIndex = this.instance.toPhysicalColumn(columnIndex);
    }

    const numberOfSourceRows = this.instance.countSourceRows();
    let nrOfColumns = this.instance.countCols();
    let numberOfCreatedCols = 0;
    let currentIndex = physicalColumnIndex;

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

    this.instance.columnIndexMapper.insertIndexes(columnIndex, numberOfCreatedCols);

    this.instance.runHooks('afterCreateCol', columnIndex, numberOfCreatedCols, source);
    this.instance.forceFullRender = true; // used when data was changed

    return numberOfCreatedCols;
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
    const sourceRowsLength = this.instance.countSourceRows();

    rowIndex = (sourceRowsLength + rowIndex) % sourceRowsLength;

    // It handle also callback from the `NestedRows` plugin. Removing parent node has effect in removing children nodes.
    const actionWasNotCancelled = this.instance.runHooks(
      'beforeRemoveRow', rowIndex, removedPhysicalIndexes.length, removedPhysicalIndexes, source
    );

    if (actionWasNotCancelled === false) {
      return false;
    }

    // List of removed indexes might be changed in the `beforeRemoveRow` hook. There may be new values.
    const numberOfRemovedIndexes = removedPhysicalIndexes.length;

    this.filterData(rowIndex, numberOfRemovedIndexes, removedPhysicalIndexes);

    // TODO: Function `removeRow` should validate fully, probably above.
    if (rowIndex < this.instance.countRows()) {
      this.instance.rowIndexMapper.removeIndexes(removedPhysicalIndexes);

      const customDefinedColumns = isDefined(this.tableMeta.columns) || isDefined(this.tableMeta.dataSchema);

      // All rows have been removed. There shouldn't be any columns.
      if (this.instance.rowIndexMapper.getNotTrimmedIndexesLength() === 0 && customDefinedColumns === false) {
        this.instance.columnIndexMapper.setIndexesSequence([]);
      }
    }

    this.instance.runHooks('afterRemoveRow', rowIndex, numberOfRemovedIndexes, removedPhysicalIndexes, source);

    this.instance.forceFullRender = true; // used when data was changed

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
    if (this.instance.dataType === 'object' || this.tableMeta.columns) {
      throw new Error('cannot remove column with object data source or columns option specified');
    }
    let columnIndex = typeof index !== 'number' ? -amount : index;

    columnIndex = (this.instance.countCols() + columnIndex) % this.instance.countCols();

    const logicColumns = this.visualColumnsToPhysical(columnIndex, amount);
    const descendingLogicColumns = logicColumns.slice(0).sort((a, b) => b - a);
    const actionWasNotCancelled = this.instance.runHooks('beforeRemoveCol', columnIndex, amount, logicColumns, source);

    if (actionWasNotCancelled === false) {
      return false;
    }

    let isTableUniform = true;
    const removedColumnsCount = descendingLogicColumns.length;
    const data = this.dataSource;

    for (let c = 0; c < removedColumnsCount; c++) {
      if (isTableUniform && logicColumns[0] !== logicColumns[c] - c) {
        isTableUniform = false;
      }
    }

    if (isTableUniform) {
      for (let r = 0, rlen = this.instance.countSourceRows(); r < rlen; r++) {
        data[r].splice(logicColumns[0], amount);
      }

    } else {
      for (let r = 0, rlen = this.instance.countSourceRows(); r < rlen; r++) {
        for (let c = 0; c < removedColumnsCount; c++) {
          data[r].splice(descendingLogicColumns[c], 1);
        }
      }
    }

    // TODO: Function `removeCol` should validate fully, probably above.
    if (columnIndex < this.instance.countCols()) {
      this.instance.columnIndexMapper.removeIndexes(logicColumns);

      // All columns have been removed. There shouldn't be any rows.
      if (this.instance.columnIndexMapper.getNotTrimmedIndexesLength() === 0) {
        this.instance.rowIndexMapper.setIndexesSequence([]);
      }
    }

    this.instance.runHooks('afterRemoveCol', columnIndex, amount, logicColumns, source);

    this.instance.forceFullRender = true; // used when data was changed

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
    const colData = this.instance.getDataAtCol(col);
    const removed = colData.slice(index, index + amount);
    const after = colData.slice(index + amount);

    extendArray(elements, after);
    let i = 0;

    while (i < amount) {
      elements.push(null); // add null in place of removed elements
      i += 1;
    }
    to2dArray(elements);
    this.instance.populateFromArray(index, col, elements, null, null, 'spliceCol');

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
    const rowData = this.instance.getSourceDataAtRow(row);
    const removed = rowData.slice(index, index + amount);
    const after = rowData.slice(index + amount);

    extendArray(elements, after);
    let i = 0;

    while (i < amount) {
      elements.push(null); // add null in place of removed elements
      i += 1;
    }
    this.instance.populateFromArray(row, index, [elements], null, null, 'spliceRow');

    return removed;
  }

  /**
   * Add/remove row(s) to/from the data source.
   *
   * @param {number} index Physical index of the element to add/remove.
   * @param {number} amount Number of rows to add/remove.
   * @param {...object} elements Row elements to be added.
   */
  spliceData(index, amount, ...elements) {
    const continueSplicing = this.instance.runHooks('beforeDataSplice', index, amount, elements);

    if (continueSplicing !== false) {
      this.dataSource.splice(index, amount, ...elements);
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
    let data = this.instance.runHooks('filterData', index, amount, physicalRows);

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
    const physicalRow = this.instance.toPhysicalRow(row);

    let dataRow = this.dataSource[physicalRow];
    // TODO: To remove, use 'modifyData' hook instead (see below)
    const modifiedRowData = this.instance.runHooks('modifyRowData', physicalRow);

    dataRow = isNaN(modifiedRowData) ? modifiedRowData : dataRow;
    //

    let value = null;

    // try to get value under property `prop` (includes dot)
    if (dataRow && dataRow.hasOwnProperty && hasOwnProperty(dataRow, prop)) {
      value = dataRow[prop];

    } else if (typeof prop === 'string' && prop.indexOf('.') > -1) {
      const sliced = prop.split('.');
      let out = dataRow;

      if (!out) {
        return null;
      }
      for (let i = 0, ilen = sliced.length; i < ilen; i++) {
        out = out[sliced[i]];

        if (typeof out === 'undefined') {
          return null;
        }
      }
      value = out;

    } else if (typeof prop === 'function') {
      /**
       *  Allows for interacting with complex structures, for example
       *  d3/jQuery getter/setter properties:
       *
       *    {columns: [{
       *      data: function(row, value){
       *        if(arguments.length === 1){
       *          return row.property();
       *        }
       *        row.property(value);
       *      }
       *    }]}.
       */
      value = prop(this.dataSource.slice(physicalRow, physicalRow + 1)[0]);
    }

    if (this.instance.hasHook('modifyData')) {
      const valueHolder = createObjectPropListener(value);

      this.instance.runHooks('modifyData', physicalRow, this.propToCol(prop), valueHolder, 'get');

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
    if (copyableLookup.call(this.instance, row, this.propToCol(prop))) {
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
    const physicalRow = this.instance.toPhysicalRow(row);
    let newValue = value;
    let dataRow = this.dataSource[physicalRow];
    // TODO: To remove, use 'modifyData' hook instead (see below)
    const modifiedRowData = this.instance.runHooks('modifyRowData', physicalRow);

    dataRow = isNaN(modifiedRowData) ? modifiedRowData : dataRow;
    //

    if (this.instance.hasHook('modifyData')) {
      const valueHolder = createObjectPropListener(newValue);

      this.instance.runHooks('modifyData', physicalRow, this.propToCol(prop), valueHolder, 'set');

      if (valueHolder.isTouched()) {
        newValue = valueHolder.value;
      }
    }

    // try to set value under property `prop` (includes dot)
    if (dataRow && dataRow.hasOwnProperty && hasOwnProperty(dataRow, prop)) {
      dataRow[prop] = newValue;

    } else if (typeof prop === 'string' && prop.indexOf('.') > -1) {
      const sliced = prop.split('.');
      let out = dataRow;
      let i = 0;
      let ilen;

      for (i = 0, ilen = sliced.length - 1; i < ilen; i++) {
        if (typeof out[sliced[i]] === 'undefined') {
          out[sliced[i]] = {};
        }
        out = out[sliced[i]];
      }
      out[sliced[i]] = newValue;

    } else if (typeof prop === 'function') {
      /* see the `function` handler in `get` */
      prop(this.dataSource.slice(physicalRow, physicalRow + 1)[0], newValue);

    } else {
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
    const totalRows = this.instance.countSourceRows();
    const logicRows = [];
    let physicRow = (totalRows + index) % totalRows;
    let rowsToRemove = amount;
    let row;

    while (physicRow < totalRows && rowsToRemove) {
      row = this.instance.toPhysicalRow(physicRow);
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
    const totalCols = this.instance.countCols();
    const visualCols = [];
    let physicalCol = (totalCols + index) % totalCols;
    let colsToRemove = amount;

    while (physicalCol < totalCols && colsToRemove) {
      const col = this.instance.toPhysicalColumn(physicalCol);

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
    for (let r = 0; r < this.instance.countSourceRows(); r++) {
      for (let c = 0; c < this.instance.countCols(); c++) {
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

    const length = this.instance.rowIndexMapper.getNotTrimmedIndexesLength();

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
      row: Math.max(this.instance.countRows() - 1, 0),
      col: Math.max(this.instance.countCols() - 1, 0),
    };

    if (start.row - end.row === 0 && !this.instance.countSourceRows()) {
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
      const physicalRow = r >= 0 ? this.instance.toPhysicalRow(r) : r;

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
    this.instance = null;
    this.tableMeta = null;
    this.dataSource = null;
    this.duckSchema = null;
    this.colToPropCache.length = 0;

    this.propToColCache.clear();
    this.propToColCache = void 0;
  }
}

export default DataMap;
