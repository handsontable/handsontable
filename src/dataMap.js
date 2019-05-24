import SheetClip from './../lib/SheetClip/SheetClip';
import { cellMethodLookupFactory } from './helpers/data';
import { columnFactory } from './helpers/setting';
import {
  createObjectPropListener,
  deepClone,
  deepExtend,
  deepObjectSize,
  duckSchema,
  hasOwnProperty,
  isObject,
  objectEach
} from './helpers/object';
import { extendArray, to2dArray } from './helpers/array';
import Interval from './utils/interval';
import { rangeEach } from './helpers/number';

const copyableLookup = cellMethodLookupFactory('copyable', false);

/**
 * Utility class that gets and saves data from/to the data source using mapping of columns numbers to object property names
 * @todo refactor arguments of methods getRange, getText to be numbers (not objects)
 * @todo remove priv, GridSettings from object constructor
 *
 * @util
 * @class DataMap
 * @private
 */
class DataMap {
  /**
   * @type {Number}
   */
  static get DESTINATION_RENDERER() {
    return 1;
  }

  /**
   * @type {Number}
   */
  static get DESTINATION_CLIPBOARD_GENERATOR() {
    return 2;
  }

  /**
   * @param {Object} instance Instance of Handsontable
   * @param {*} priv
   * @param {GridSettings} GridSettings Grid settings
   */
  constructor(instance, priv, GridSettings) {
    /**
     * Instance of {@link Handsontable}
     *
     * @private
     * @type {Handsontable}
     */
    this.instance = instance;
    /**
     * Private settings object.
     *
     * @private
     * @type {Object}
     */
    this.priv = priv;
    /**
     * Instance of {@link GridSettings}
     *
     * @private
     * @type {GridSettings}
     */
    this.GridSettings = GridSettings;
    /**
     * Reference to the original dataset.
     *
     * @type {*}
     */
    this.dataSource = this.instance.getSettings().data;
    /**
     * Cached rows number.
     *
     * @type {Number}
     */
    this.cachedLength = null;
    /**
     * Flag determines if the cache should be used.
     *
     * @type {Boolean}
     */
    this.skipCache = false;
    /**
     * Cached sourceData rows number.
     *
     * @type {Number}
     */
    this.latestSourceRowsCount = 0;
    /**
     * Generated schema based on the first row from the source data.
     *
     * @type {Object}
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
    /**
     * Instance of {@link Interval}
     *
     * @type {Interval}
     */
    this.interval = Interval.create(() => this.clearLengthCache(), '15fps');

    this.instance.addHook('skipLengthCache', delay => this.onSkipLengthCache(delay));
    this.onSkipLengthCache(500);
  }

  /**
   * Generates cache for property to and from column addressation.
   */
  createMap() {
    const schema = this.getSchema();
    let i;

    if (typeof schema === 'undefined') {
      throw new Error('trying to create `columns` definition but you didn\'t provide `schema` nor `data`');
    }

    this.colToPropCache = [];
    this.propToColCache = new Map();

    const columns = this.instance.getSettings().columns;

    if (columns) {
      const maxCols = this.instance.getSettings().maxCols;
      let columnsLen = Math.min(maxCols, columns.length);
      let filteredIndex = 0;
      let columnsAsFunc = false;
      const schemaLen = deepObjectSize(schema);

      if (typeof columns === 'function') {
        columnsLen = schemaLen > 0 ? schemaLen : this.instance.countSourceCols();
        columnsAsFunc = true;
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
   * Generates columns' translation cache.
   *
   * @param {Object} schema
   * @param {Number} lastCol
   * @param {Number} parent
   * @returns {Number}
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
   * @param {Number} col Visual column index.
   * @returns {Number} Physical column index.
   */
  colToProp(col) {
    const physicalColumn = this.instance.toPhysicalColumn(col);

    if (!isNaN(physicalColumn) && this.colToPropCache && typeof this.colToPropCache[physicalColumn] !== 'undefined') {
      return this.colToPropCache[physicalColumn];
    }

    return physicalColumn;
  }

  /**
   * Translates property into visual column index.
   *
   * @param {Object} prop
   * @fires Hooks#modifyCol
   * @returns {Number}
   */
  propToCol(prop) {
    let col;

    if (typeof this.propToColCache.get(prop) === 'undefined') {
      col = prop;
    } else {
      col = this.propToColCache.get(prop);
    }
    col = this.instance.toVisualColumn(col);

    return col;
  }

  /**
   * Returns data's schema.
   *
   * @returns {Object}
   */
  getSchema() {
    const schema = this.instance.getSettings().dataSchema;

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
   * @param {Number} [index] Physical index of the row before which the new row will be inserted.
   * @param {Number} [amount=1] An amount of rows to add.
   * @param {String} [source] Source of method call.
   * @fires Hooks#afterCreateRow
   * @returns {Number} Returns number of created rows.
   */
  createRow(index, amount = 1, source) {
    let numberOfCreatedRows = 0;
    let rowIndex = index;

    if (typeof rowIndex !== 'number' || rowIndex >= this.instance.countSourceRows()) {
      rowIndex = this.instance.countSourceRows();
    }

    const continueProcess = this.instance.runHooks('beforeCreateRow', rowIndex, amount, source);

    if (continueProcess === false) {
      return 0;
    }

    const maxRows = this.instance.getSettings().maxRows;
    const columnCount = this.instance.countCols();

    while (numberOfCreatedRows < amount && this.instance.countSourceRows() < maxRows) {
      let row = null;

      if (this.instance.dataType === 'array') {
        if (this.instance.getSettings().dataSchema) {
          // Clone template array
          row = deepClone(this.getSchema());

        } else {
          row = [];
          /* eslint-disable no-loop-func */
          rangeEach(columnCount - 1, () => row.push(null));
        }

      } else if (this.instance.dataType === 'function') {
        row = this.instance.getSettings().dataSchema(rowIndex);

      } else {
        row = {};
        deepExtend(row, this.getSchema());
      }

      if (rowIndex === this.instance.countSourceRows()) {
        this.dataSource.push(row);

      } else {
        this.spliceData(rowIndex, 0, row);
      }

      numberOfCreatedRows += 1;
    }

    this.instance.runHooks('afterCreateRow', rowIndex, numberOfCreatedRows, source);
    this.instance.forceFullRender = true; // used when data was changed

    return numberOfCreatedRows;
  }

  /**
   * Creates column at the right of the data array.
   *
   * @param {Number} [index] Visual index of the column before which the new column will be inserted
   * @param {Number} [amount=1] An amount of columns to add.
   * @param {String} [source] Source of method call.
   * @fires Hooks#afterCreateCol
   * @returns {Number} Returns number of created columns
   */
  createCol(index, amount = 1, source) {
    if (!this.instance.isColumnModificationAllowed()) {
      throw new Error('Cannot create new column. When data source in an object, ' +
        'you can only have as much columns as defined in first data row, data schema or in the \'columns\' setting.' +
        'If you want to be able to add new columns, you have to use array datasource.');
    }
    const rlen = this.instance.countSourceRows();
    const data = this.dataSource;
    const countColumns = this.instance.countCols();
    const columnIndex = typeof index !== 'number' || index >= countColumns ? countColumns : index;
    let numberOfCreatedCols = 0;
    let currentIndex;

    const continueProcess = this.instance.runHooks('beforeCreateCol', columnIndex, amount, source);

    if (continueProcess === false) {
      return 0;
    }

    currentIndex = columnIndex;

    const maxCols = this.instance.getSettings().maxCols;
    while (numberOfCreatedCols < amount && this.instance.countCols() < maxCols) {
      const constructor = columnFactory(this.GridSettings, this.priv.columnsSettingConflicts);

      if (typeof columnIndex !== 'number' || columnIndex >= this.instance.countCols()) {
        if (rlen > 0) {
          for (let r = 0; r < rlen; r++) {
            if (typeof data[r] === 'undefined') {
              data[r] = [];
            }
            data[r].push(null);
          }
        } else {
          data.push([null]);
        }
        // Add new column constructor
        this.priv.columnSettings.push(constructor);

      } else {
        for (let row = 0; row < rlen; row++) {
          data[row].splice(currentIndex, 0, null);
        }
        // Add new column constructor at given index
        this.priv.columnSettings.splice(currentIndex, 0, constructor);
      }

      numberOfCreatedCols += 1;
      currentIndex += 1;
    }

    this.instance.runHooks('afterCreateCol', columnIndex, numberOfCreatedCols, source);
    this.instance.forceFullRender = true; // used when data was changed

    return numberOfCreatedCols;
  }

  /**
   * Removes row from the data array.
   *
   * @param {Number} [index] Visual index of the row to be removed. If not provided, the last row will be removed
   * @param {Number} [amount=1] Amount of the rows to be removed. If not provided, one row will be removed
   * @param {String} [source] Source of method call.
   * @fires Hooks#beforeRemoveRow
   * @fires Hooks#afterRemoveRow
   */
  removeRow(index, amount = 1, source) {
    let rowIndex = typeof index !== 'number' ? -amount : index;
    const rowsAmount = this.instance.runHooks('modifyRemovedAmount', amount, rowIndex);
    const sourceRowsLength = this.instance.countSourceRows();

    rowIndex = (sourceRowsLength + rowIndex) % sourceRowsLength;

    const logicRows = this.visualRowsToPhysical(rowIndex, rowsAmount);
    const actionWasNotCancelled = this.instance.runHooks('beforeRemoveRow', rowIndex, rowsAmount, logicRows, source);

    if (actionWasNotCancelled === false) {
      return;
    }

    const data = this.dataSource;
    const newData = this.filterData(rowIndex, rowsAmount);

    if (newData) {
      data.length = 0;
      Array.prototype.push.apply(data, newData);
    }

    this.instance.runHooks('afterRemoveRow', rowIndex, rowsAmount, logicRows, source);

    this.instance.forceFullRender = true; // used when data was changed
  }

  /**
   * Removes column from the data array.
   *
   * @param {Number} [index] Visual index of the column to be removed. If not provided, the last column will be removed
   * @param {Number} [amount=1] Amount of the columns to be removed. If not provided, one column will be removed
   * @param {String} [source] Source of method call.
   * @fires Hooks#beforeRemoveCol
   * @fires Hooks#afterRemoveCol
   */
  removeCol(index, amount = 1, source) {
    if (this.instance.dataType === 'object' || this.instance.getSettings().columns) {
      throw new Error('cannot remove column with object data source or columns option specified');
    }
    let columnIndex = typeof index !== 'number' ? -amount : index;

    columnIndex = (this.instance.countCols() + columnIndex) % this.instance.countCols();

    const logicColumns = this.visualColumnsToPhysical(columnIndex, amount);
    const descendingLogicColumns = logicColumns.slice(0).sort((a, b) => b - a);
    const actionWasNotCancelled = this.instance.runHooks('beforeRemoveCol', columnIndex, amount, logicColumns, source);

    if (actionWasNotCancelled === false) {
      return;
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

      for (let c = 0; c < removedColumnsCount; c++) {
        this.priv.columnSettings.splice(logicColumns[c], 1);
      }
    }

    this.instance.runHooks('afterRemoveCol', columnIndex, amount, logicColumns, source);

    this.instance.forceFullRender = true; // used when data was changed
  }

  /**
   * Add/Removes data from the column.
   *
   * @param {Number} col Physical index of column in which do you want to do splice
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
   * @param {Array} [elements]
   * @returns {Array} Returns removed portion of columns
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
   * @param {Number} row Physical index of row in which do you want to do splice
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end.
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed.
   * @param {Array} [elements]
   * @returns {Array} Returns removed portion of rows
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
   * @param {Number} index Physical index of the element to remove.
   * @param {Number} amount Number of rows to add/remove.
   * @param {Object} element Row to add.
   */
  spliceData(index, amount, element) {
    const continueSplicing = this.instance.runHooks('beforeDataSplice', index, amount, element);

    if (continueSplicing !== false) {
      this.dataSource.splice(index, amount, element);
    }
  }

  /**
   * Filter unwanted data elements from the data source.
   *
   * @param {Number} index Visual index of the element to remove.
   * @param {Number} amount Number of rows to add/remove.
   * @returns {Array}
   */
  filterData(index, amount) {
    const physicalRows = this.visualRowsToPhysical(index, amount);
    const continueSplicing = this.instance.runHooks('beforeDataFilter', index, amount, physicalRows);

    if (continueSplicing !== false) {
      const newData = this.dataSource.filter((row, rowIndex) => physicalRows.indexOf(rowIndex) === -1);

      return newData;
    }
  }

  /**
   * Returns single value from the data array.
   *
   * @param {Number} row Visual row index.
   * @param {Number} prop
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
       *  allows for interacting with complex structures, for example
       *  d3/jQuery getter/setter properties:
       *
       *    {columns: [{
       *      data: function(row, value){
       *        if(arguments.length === 1){
       *          return row.property();
       *        }
       *        row.property(value);
       *      }
       *    }]}
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
   * @param {Number} row Physical row index.
   * @param {Number} prop
   * @returns {String}
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
   * @param {Number} row Visual row index.
   * @param {Number} prop
   * @param {String} value
   * @param {String} [source] Source of hook runner.
   */
  set(row, prop, value, source) {
    const physicalRow = this.instance.runHooks('modifyRow', row, source || 'datamapGet');
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
   * as the visual (displayed) row id (e.g. when sorting is applied).
   *
   * @param {Number} index Visual row index.
   * @param {Number} amount
   * @fires Hooks#modifyRow
   * @returns {Number}
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
   * @param index Visual column index.
   * @param amount
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
   * Clear cached data length.
   */
  clearLengthCache() {
    this.cachedLength = null;
  }

  /**
   * Get data length.
   *
   * @returns {Number}
   */
  getLength() {
    const maxRowsFromSettings = this.instance.getSettings().maxRows;
    let maxRows;

    if (maxRowsFromSettings < 0 || maxRowsFromSettings === 0) {
      maxRows = 0;
    } else {
      maxRows = maxRowsFromSettings || Infinity;
    }

    let length = this.instance.countSourceRows();

    if (this.instance.hasHook('modifyRow')) {
      let reValidate = this.skipCache;

      this.interval.start();
      if (length !== this.latestSourceRowsCount) {
        reValidate = true;
      }

      this.latestSourceRowsCount = length;
      if (this.cachedLength === null || reValidate) {
        rangeEach(length - 1, (row) => {
          const physicalRow = this.instance.toPhysicalRow(row);

          if (physicalRow === null) {
            length -= 1;
          }
        });
        this.cachedLength = length;

      } else {
        length = this.cachedLength;
      }
    } else {
      this.interval.stop();
    }

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
      row: Math.max(this.instance.countSourceRows() - 1, 0),
      col: Math.max(this.instance.countCols() - 1, 0),
    };

    if (start.row - end.row === 0 && !this.instance.countSourceRows()) {
      return [];
    }

    return this.getRange(start, end, DataMap.DESTINATION_RENDERER);
  }

  /**
   * Returns data range as array.
   *
   * @param {Object} [start] Start selection position. Visual indexes.
   * @param {Object} [end] End selection position. Visual indexes.
   * @param {Number} destination Destination of datamap.get
   * @returns {Array}
   */
  getRange(start, end, destination) {
    const output = [];
    let r;
    let c;
    let row;

    const maxRows = this.instance.getSettings().maxRows;
    const maxCols = this.instance.getSettings().maxCols;

    if (maxRows === 0 || maxCols === 0) {
      return [];
    }

    const getFn = destination === DataMap.DESTINATION_CLIPBOARD_GENERATOR ? this.getCopyable : this.get;

    const rlen = Math.min(Math.max(maxRows - 1, 0), Math.max(start.row, end.row));
    const clen = Math.min(Math.max(maxCols - 1, 0), Math.max(start.col, end.col));

    for (r = Math.min(start.row, end.row); r <= rlen; r++) {
      row = [];
      const physicalRow = this.instance.toPhysicalRow(r);

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
   * @param {Object} [start] Start selection position. Visual indexes.
   * @param {Object} [end] End selection position. Visual indexes.
   * @returns {String}
   */
  getText(start, end) {
    return SheetClip.stringify(this.getRange(start, end, DataMap.DESTINATION_RENDERER));
  }

  /**
   * Return data as copyable text (tab separated columns intended for clipboard copy to an external application).
   *
   * @param {Object} [start] Start selection position. Visual indexes.
   * @param {Object} [end] End selection position. Visual indexes.
   * @returns {String}
   */
  getCopyableText(start, end) {
    return SheetClip.stringify(this.getRange(start, end, DataMap.DESTINATION_CLIPBOARD_GENERATOR));
  }

  /**
   * `skipLengthCache` callback.
   *
   * @private
   * @param {Number} delay Time of the delay in milliseconds.
   */
  onSkipLengthCache(delay) {
    this.skipCache = true;

    setTimeout(() => {
      this.skipCache = false;
    }, delay);
  }

  /**
   * Destroy instance.
   */
  destroy() {
    this.interval.stop();

    this.interval = null;
    this.instance = null;
    this.priv = null;
    this.GridSettings = null;
    this.dataSource = null;
    this.cachedLength = null;
    this.duckSchema = null;
    this.colToPropCache.length = 0;

    this.propToColCache.clear();
    this.propToColCache = void 0;
  }
}

export default DataMap;
