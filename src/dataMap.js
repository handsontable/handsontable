import Handsontable from './browser';
import SheetClip from 'SheetClip';
import {cellMethodLookupFactory} from './helpers/data';
import {columnFactory} from './helpers/setting';
import {duckSchema, deepExtend, deepClone} from './helpers/object';
import {extendArray, to2dArray} from './helpers/array';
import {Interval} from './utils/interval';
import {rangeEach} from './helpers/number';
import {MultiMap} from './multiMap';

/**
 * Utility class that gets and saves data from/to the data source using mapping of columns numbers to object property names
 * @todo refactor arguments of methods getRange, getText to be numbers (not objects)
 * @todo remove priv, GridSettings from object constructor
 *
 * @param {Object} instance Instance of Handsontable
 * @param {*} priv
 * @param {*} GridSettings Grid settings
 * @util
 * @class DataMap
 * @dependencies SheetClip
 */
function DataMap(instance, priv, GridSettings) {
  this.instance = instance;
  this.priv = priv;
  this.GridSettings = GridSettings;
  this.dataSource = this.instance.getSettings().data;
  this.cachedLength = null;
  this.latestSourceRowsCount = 0;

  if (this.dataSource[0]) {
    this.duckSchema = this.recursiveDuckSchema(this.dataSource[0]);
  } else {
    this.duckSchema = {};
  }
  this.createMap();
  this.interval = Interval.create(() => this.clearLengthCache(), '15fps');
}

DataMap.prototype.DESTINATION_RENDERER = 1;
DataMap.prototype.DESTINATION_CLIPBOARD_GENERATOR = 2;

/**
 * @param {Object|Array} object
 * @returns {Object|Array}
 */
DataMap.prototype.recursiveDuckSchema = function(object) {
  return duckSchema(object);
};

/**
 * @param {Object} schema
 * @param {Number} lastCol
 * @param {Number} parent
 * @returns {Number}
 */
DataMap.prototype.recursiveDuckColumns = function(schema, lastCol, parent) {
  var prop, i;
  if (typeof lastCol === 'undefined') {
    lastCol = 0;
    parent = '';
  }
  if (typeof schema === 'object' && !Array.isArray(schema)) {
    for (i in schema) {
      if (schema.hasOwnProperty(i)) {
        if (schema[i] === null) {
          prop = parent + i;
          this.colToPropCache.push(prop);
          this.propToColCache.set(prop, lastCol);

          lastCol++;
        } else {
          lastCol = this.recursiveDuckColumns(schema[i], lastCol, i + '.');
        }
      }
    }
  }

  return lastCol;
};

DataMap.prototype.createMap = function() {
  var i, ilen, schema = this.getSchema();

  if (typeof schema === 'undefined') {
    throw new Error('trying to create `columns` definition but you didnt\' provide `schema` nor `data`');
  }
  this.colToPropCache = [];
  this.propToColCache = new MultiMap();
  var columns = this.instance.getSettings().columns;
  if (columns) {
    for (i = 0, ilen = columns.length; i < ilen; i++) {
      if (typeof columns[i].data != 'undefined') {
        this.colToPropCache[i] = columns[i].data;
        this.propToColCache.set(columns[i].data, i);
      }
    }
  } else {
    this.recursiveDuckColumns(schema);
  }
};

/**
 * Returns property name that corresponds with the given column index.
 *
 * @param {Number} col
 * @returns {Number}
 */
DataMap.prototype.colToProp = function(col) {
  col = Handsontable.hooks.run(this.instance, 'modifyCol', col);

  if (this.colToPropCache && typeof this.colToPropCache[col] !== 'undefined') {
    return this.colToPropCache[col];
  }

  return col;
};

/**
 * @param {Object} prop
 * @fires Hooks#modifyCol
 * @returns {*}
 */
DataMap.prototype.propToCol = function(prop) {
  var col;

  if (typeof this.propToColCache.get(prop) === 'undefined') {
    col = prop;
  } else {
    col = this.propToColCache.get(prop);
  }
  col = Handsontable.hooks.run(this.instance, 'unmodifyCol', col);

  return col;
};

/**
 * @returns {Object}
 */
DataMap.prototype.getSchema = function() {
  var schema = this.instance.getSettings().dataSchema;

  if (schema) {
    if (typeof schema === 'function') {
      return schema();
    }
    return schema;
  }

  return this.duckSchema;
};

/**
 * Creates row at the bottom of the data array.
 *
 * @param {Number} [index] Index of the row before which the new row will be inserted
 * @fires Hooks#afterCreateRow
 * @returns {Number} Returns number of created rows
 */
DataMap.prototype.createRow = function(index, amount, createdAutomatically) {
  var row, colCount = this.instance.countCols(),
    numberOfCreatedRows = 0,
    currentIndex;

  if (!amount) {
    amount = 1;
  }

  if (typeof index !== 'number' || index >= this.instance.countSourceRows()) {
    index = this.instance.countSourceRows();
  }

  currentIndex = index;
  var maxRows = this.instance.getSettings().maxRows;

  while (numberOfCreatedRows < amount && this.instance.countSourceRows() < maxRows) {
    if (this.instance.dataType === 'array') {
      if (this.instance.getSettings().dataSchema) {
        // Clone template array
        row = deepClone(this.getSchema());

      } else {
        row = [];
        rangeEach(colCount - 1, () => row.push(null));
      }

    } else if (this.instance.dataType === 'function') {
      row = this.instance.getSettings().dataSchema(index);

    } else {
      row = {};
      deepExtend(row, this.getSchema());
    }

    if (index === this.instance.countSourceRows()) {
      this.dataSource.push(row);

    } else {
      this.dataSource.splice(index, 0, row);
    }

    numberOfCreatedRows++;
    currentIndex++;
  }

  Handsontable.hooks.run(this.instance, 'afterCreateRow', index, numberOfCreatedRows, createdAutomatically);
  this.instance.forceFullRender = true; // used when data was changed

  return numberOfCreatedRows;
};

/**
 * Creates col at the right of the data array.
 *
 * @param {Number} [index] Index of the column before which the new column will be inserted
 * @param {Number} [amount]
 * @param {Number} [createdAutomatically]
 * @fires Hooks#afterCreateCol
 * @returns {Number} Returns number of created columns
 */
DataMap.prototype.createCol = function(index, amount, createdAutomatically) {
  if (!this.instance.isColumnModificationAllowed()) {
    throw new Error('Cannot create new column. When data source in an object, ' +
      'you can only have as much columns as defined in first data row, data schema or in the \'columns\' setting.' +
      'If you want to be able to add new columns, you have to use array datasource.');
  }
  var rlen = this.instance.countSourceRows(),
    data = this.dataSource,
    constructor, numberOfCreatedCols = 0,
    currentIndex;

  if (!amount) {
    amount = 1;
  }

  if (typeof index !== 'number' || index >= this.instance.countCols()) {
    index = this.instance.countCols();
  }

  currentIndex = index;

  var maxCols = this.instance.getSettings().maxCols;
  while (numberOfCreatedCols < amount && this.instance.countCols() < maxCols) {
    constructor = columnFactory(this.GridSettings, this.priv.columnsSettingConflicts);
    if (typeof index !== 'number' || index >= this.instance.countCols()) {
      for (var r = 0; r < rlen; r++) {
        if (typeof data[r] === 'undefined') {
          data[r] = [];
        }
        data[r].push(null);
      }
      // Add new column constructor
      this.priv.columnSettings.push(constructor);

    } else {
      for (var r = 0; r < rlen; r++) {
        data[r].splice(currentIndex, 0, null);
      }
      // Add new column constructor at given index
      this.priv.columnSettings.splice(currentIndex, 0, constructor);
    }

    numberOfCreatedCols++;
    currentIndex++;
  }

  Handsontable.hooks.run(this.instance, 'afterCreateCol', index, numberOfCreatedCols, createdAutomatically);
  this.instance.forceFullRender = true; // used when data was changed

  return numberOfCreatedCols;
};

/**
 * Removes row from the data array.
 *
 * @param {Number} [index] Index of the row to be removed. If not provided, the last row will be removed
 * @param {Number} [amount] Amount of the rows to be removed. If not provided, one row will be removed
 * @fires Hooks#beforeRemoveRow
 * @fires Hooks#afterRemoveRow
 */
DataMap.prototype.removeRow = function(index, amount) {
  if (!amount) {
    amount = 1;
  }
  if (typeof index !== 'number') {
    index = -amount;
  }

  index = (this.instance.countSourceRows() + index) % this.instance.countSourceRows();

  let logicRows = this.physicalRowsToLogical(index, amount);
  let descendingLogicRows = logicRows.slice(0).sort(function(a, b) {return b - a;});
  let actionWasNotCancelled = Handsontable.hooks.run(this.instance, 'beforeRemoveRow', index, amount, logicRows);
  if (actionWasNotCancelled === false) {
    return;
  }

  let data = this.dataSource;
  let newData;

  newData = data.filter(function(row, index) {
    return logicRows.indexOf(index) == -1;
  });

  data.length = 0;
  Array.prototype.push.apply(data, newData);

  Handsontable.hooks.run(this.instance, 'afterRemoveRow', index, amount, logicRows);

  this.instance.forceFullRender = true; // used when data was changed
};

/**
 * Removes column from the data array.
 *
 * @param {Number} [index] Index of the column to be removed. If not provided, the last column will be removed
 * @param {Number} [amount] Amount of the columns to be removed. If not provided, one column will be removed
 * @fires Hooks#beforeRemoveCol
 * @fires Hooks#afterRemoveCol
 */
DataMap.prototype.removeCol = function(index, amount) {
  if (this.instance.dataType === 'object' || this.instance.getSettings().columns) {
    throw new Error('cannot remove column with object data source or columns option specified');
  }
  if (!amount) {
    amount = 1;
  }
  if (typeof index !== 'number') {
    index = -amount;
  }

  index = (this.instance.countCols() + index) % this.instance.countCols();

  let logicColumns = this.physicalColumnsToLogical(index, amount);
  let descendingLogicColumns = logicColumns.slice(0).sort(function(a, b) {return b - a;});
  let actionWasNotCancelled = Handsontable.hooks.run(this.instance, 'beforeRemoveCol', index, amount, logicColumns);
  if (actionWasNotCancelled === false) {
    return;
  }

  let isTableUniform = true;
  let removedColumnsCount = descendingLogicColumns.length;
  let data = this.dataSource;

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

  Handsontable.hooks.run(this.instance, 'afterRemoveCol', index, amount);

  this.instance.forceFullRender = true; // used when data was changed
};

/**
 * Add/Removes data from the column.
 *
 * @param {Number} col Index of column in which do you want to do splice
 * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
 * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
 * @returns {Array} Returns removed portion of columns
 */
DataMap.prototype.spliceCol = function(col, index, amount/*, elements...*/) {
  var elements = 4 <= arguments.length ? [].slice.call(arguments, 3) : [];

  var colData = this.instance.getDataAtCol(col);
  var removed = colData.slice(index, index + amount);
  var after = colData.slice(index + amount);

  extendArray(elements, after);
  var i = 0;
  while (i < amount) {
    elements.push(null); // add null in place of removed elements
    i++;
  }
  to2dArray(elements);
  this.instance.populateFromArray(index, col, elements, null, null, 'spliceCol');

  return removed;
};

/**
 * Add/Removes data from the row.
 *
 * @param {Number} row Index of row in which do you want to do splice
 * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
 * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
 * @returns {Array} Returns removed portion of rows
 */
DataMap.prototype.spliceRow = function(row, index, amount/*, elements...*/) {
  var elements = 4 <= arguments.length ? [].slice.call(arguments, 3) : [];

  var rowData = this.instance.getSourceDataAtRow(row);
  var removed = rowData.slice(index, index + amount);
  var after = rowData.slice(index + amount);

  extendArray(elements, after);
  var i = 0;
  while (i < amount) {
    elements.push(null); // add null in place of removed elements
    i++;
  }
  this.instance.populateFromArray(row, index, [elements], null, null, 'spliceRow');

  return removed;
};

/**
 * Returns single value from the data array.
 *
 * @param {Number} row
 * @param {Number} prop
 */
DataMap.prototype.get = function(row, prop) {
  row = Handsontable.hooks.run(this.instance, 'modifyRow', row);

  const dataRow = this.dataSource[row];

  // try to get value under property `prop` (includes dot)
  if (dataRow && dataRow.hasOwnProperty && dataRow.hasOwnProperty(prop)) {
    return dataRow[prop];

  } else if (typeof prop === 'string' && prop.indexOf('.') > -1) {
    let sliced = prop.split('.');
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
    return out;

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
    return prop(this.dataSource.slice(row, row + 1)[0]);
  }

  return null;
};

var copyableLookup = cellMethodLookupFactory('copyable', false);

/**
 * Returns single value from the data array (intended for clipboard copy to an external application).
 *
 * @param {Number} row
 * @param {Number} prop
 * @returns {String}
 */
DataMap.prototype.getCopyable = function(row, prop) {
  if (copyableLookup.call(this.instance, row, this.propToCol(prop))) {
    return this.get(row, prop);
  }
  return '';
};

/**
 * Saves single value to the data array.
 *
 * @param {Number} row
 * @param {Number} prop
 * @param {String} value
 * @param {String} [source] Source of hook runner.
 */
DataMap.prototype.set = function(row, prop, value, source) {
  row = Handsontable.hooks.run(this.instance, 'modifyRow', row, source || 'datamapGet');

  const dataRow = this.dataSource[row];

  // try to set value under property `prop` (includes dot)
  if (dataRow && dataRow.hasOwnProperty && dataRow.hasOwnProperty(prop)) {
    dataRow[prop] = value;

  } else if (typeof prop === 'string' && prop.indexOf('.') > -1) {
    let sliced = prop.split('.');
    let out = dataRow;

    for (let i = 0, ilen = sliced.length - 1; i < ilen; i++) {
      if (typeof out[sliced[i]] === 'undefined') {
        out[sliced[i]] = {};
      }
      out = out[sliced[i]];
    }
    out[sliced[i]] = value;

  } else if (typeof prop === 'function') {
    /* see the `function` handler in `get` */
    prop(this.dataSource.slice(row, row + 1)[0], value);

  } else {
    dataRow[prop] = value;
  }
};

/**
 * This ridiculous piece of code maps rows Id that are present in table data to those displayed for user.
 * The trick is, the physical row id (stored in settings.data) is not necessary the same
 * as the logical (displayed) row id (e.g. when sorting is applied).
 *
 * @param {Number} index
 * @param {Number} amount
 * @fires Hooks#modifyRow
 * @returns {Number}
 */
DataMap.prototype.physicalRowsToLogical = function(index, amount) {
  var totalRows = this.instance.countSourceRows();
  var physicRow = (totalRows + index) % totalRows;
  var logicRows = [];
  var rowsToRemove = amount;
  var row;

  while (physicRow < totalRows && rowsToRemove) {
    row = Handsontable.hooks.run(this.instance, 'modifyRow', physicRow);
    logicRows.push(row);

    rowsToRemove--;
    physicRow++;
  }

  return logicRows;
};

/**
 *
 * @param index
 * @param amount
 * @returns {Array}
 */
DataMap.prototype.physicalColumnsToLogical = function(index, amount) {
  let totalCols = this.instance.countCols();
  let physicalCol = (totalCols + index) % totalCols;
  let logicalCols = [];
  let colsToRemove = amount;

  while (physicalCol < totalCols && colsToRemove) {
    let col = Handsontable.hooks.run(this.instance, 'modifyCol', physicalCol);

    logicalCols.push(col);

    colsToRemove--;
    physicalCol++;
  }

  return logicalCols;
};

/**
 * Clears the data array.
 */
DataMap.prototype.clear = function() {
  for (var r = 0; r < this.instance.countSourceRows(); r++) {
    for (var c = 0; c < this.instance.countCols(); c++) {
      this.set(r, this.colToProp(c), '');
    }
  }
};

/**
 * Clear cached data length.
 */
DataMap.prototype.clearLengthCache = function() {
  this.cachedLength = null;
};

/**
 * Get data length.
 *
 * @returns {Number}
 */
DataMap.prototype.getLength = function() {
  let length = this.instance.countSourceRows();

  if (Handsontable.hooks.has('modifyRow', this.instance)) {
    let reValidate = false;

    this.interval.start();

    if (length !== this.latestSourceRowsCount) {
      reValidate = true;
    }
    this.latestSourceRowsCount = length;

    if (this.cachedLength === null || reValidate) {
      rangeEach(length - 1, (row) => {
        row = Handsontable.hooks.run(this.instance, 'modifyRow', row);

        if (row === null) {
          --length;
        }
      });
      this.cachedLength = length;

    } else {
      length = this.cachedLength;
    }
  } else {
    this.interval.stop();
  }

  return length;
};

/**
 * Returns the data array.
 *
 * @returns {Array}
 */
DataMap.prototype.getAll = function() {
  let start = {
    row: 0,
    col: 0,
  };
  let end = {
    row: Math.max(this.instance.countSourceRows() - 1, 0),
    col: Math.max(this.instance.countCols() - 1, 0),
  };

  if (start.row - end.row === 0 && !this.instance.countSourceRows()) {
    return [];
  }

  return this.getRange(start, end, DataMap.prototype.DESTINATION_RENDERER);
};

/**
 * Returns data range as array.
 *
 * @param {Object} [start] Start selection position
 * @param {Object} [end] End selection position
 * @param {Number} destination Destination of datamap.get
 * @returns {Array}
 */
DataMap.prototype.getRange = function(start, end, destination) {
  var r, rlen, c, clen, output = [],
    row, rowExists;

  var getFn = destination === this.DESTINATION_CLIPBOARD_GENERATOR ? this.getCopyable : this.get;

  rlen = Math.max(start.row, end.row);
  clen = Math.max(start.col, end.col);

  for (r = Math.min(start.row, end.row); r <= rlen; r++) {
    row = [];
    let physicalRow = Handsontable.hooks.run(this.instance, 'modifyRow', r);

    for (c = Math.min(start.col, end.col); c <= clen; c++) {
      let rowValue;

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
};

/**
 * Return data as text (tab separated columns).
 *
 * @param {Object} [start] Start selection position
 * @param {Object} [end] End selection position
 * @returns {String}
 */
DataMap.prototype.getText = function(start, end) {
  return SheetClip.stringify(this.getRange(start, end, this.DESTINATION_RENDERER));
};

/**
 * Return data as copyable text (tab separated columns intended for clipboard copy to an external application).
 *
 * @param {Object} [start] Start selection position
 * @param {Object} [end] End selection position
 * @returns {String}
 */
DataMap.prototype.getCopyableText = function(start, end) {
  return SheetClip.stringify(this.getRange(start, end, this.DESTINATION_CLIPBOARD_GENERATOR));
};

/**
 * Destroy instance.
 */
DataMap.prototype.destroy = function() {
  this.interval.stop();

  this.interval = null;
  this.instance = null;
  this.priv = null;
  this.GridSettings = null;
  this.dataSource = null;
  this.cachedLength = null;
  this.duckSchema = null;
};

export {DataMap};
