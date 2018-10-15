'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _SheetClip = require('./../lib/SheetClip/SheetClip');

var _SheetClip2 = _interopRequireDefault(_SheetClip);

var _data = require('./helpers/data');

var _setting = require('./helpers/setting');

var _object = require('./helpers/object');

var _array = require('./helpers/array');

var _interval = require('./utils/interval');

var _interval2 = _interopRequireDefault(_interval);

var _number = require('./helpers/number');

var _multiMap = require('./multiMap');

var _multiMap2 = _interopRequireDefault(_multiMap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
 */
function DataMap(instance, priv, GridSettings) {
  var _this = this;

  this.instance = instance;
  this.priv = priv;
  this.GridSettings = GridSettings;
  this.dataSource = this.instance.getSettings().data;
  this.cachedLength = null;
  this.skipCache = false;
  this.latestSourceRowsCount = 0;

  if (this.dataSource && this.dataSource[0]) {
    this.duckSchema = this.recursiveDuckSchema(this.dataSource[0]);
  } else {
    this.duckSchema = {};
  }
  this.createMap();
  this.interval = _interval2.default.create(function () {
    return _this.clearLengthCache();
  }, '15fps');

  this.instance.addHook('skipLengthCache', function (delay) {
    return _this.onSkipLengthCache(delay);
  });
  this.onSkipLengthCache(500);
}

DataMap.prototype.DESTINATION_RENDERER = 1;
DataMap.prototype.DESTINATION_CLIPBOARD_GENERATOR = 2;

/**
 * @param {Object|Array} object
 * @returns {Object|Array}
 */
DataMap.prototype.recursiveDuckSchema = function (object) {
  return (0, _object.duckSchema)(object);
};

/**
 * @param {Object} schema
 * @param {Number} lastCol
 * @param {Number} parent
 * @returns {Number}
 */
DataMap.prototype.recursiveDuckColumns = function (schema, lastCol, parent) {
  var _this2 = this;

  var lastColumn = lastCol;
  var propertyParent = parent;
  var prop = void 0;

  if (typeof lastColumn === 'undefined') {
    lastColumn = 0;
    propertyParent = '';
  }
  if ((typeof schema === 'undefined' ? 'undefined' : _typeof(schema)) === 'object' && !Array.isArray(schema)) {
    (0, _object.objectEach)(schema, function (value, key) {
      if (value === null) {
        prop = propertyParent + key;
        _this2.colToPropCache.push(prop);
        _this2.propToColCache.set(prop, lastColumn);

        lastColumn += 1;
      } else {
        lastColumn = _this2.recursiveDuckColumns(value, lastColumn, key + '.');
      }
    });
  }

  return lastColumn;
};

DataMap.prototype.createMap = function () {
  var i = void 0;
  var schema = this.getSchema();

  if (typeof schema === 'undefined') {
    throw new Error('trying to create `columns` definition but you didn\'t provide `schema` nor `data`');
  }

  this.colToPropCache = [];
  this.propToColCache = new _multiMap2.default();

  var columns = this.instance.getSettings().columns;

  if (columns) {
    var maxCols = this.instance.getSettings().maxCols;
    var columnsLen = Math.min(maxCols, columns.length);
    var filteredIndex = 0;
    var columnsAsFunc = false;
    var schemaLen = (0, _object.deepObjectSize)(schema);

    if (typeof columns === 'function') {
      columnsLen = schemaLen > 0 ? schemaLen : this.instance.countSourceCols();
      columnsAsFunc = true;
    }

    for (i = 0; i < columnsLen; i++) {
      var column = columnsAsFunc ? columns(i) : columns[i];

      if ((0, _object.isObject)(column)) {
        if (typeof column.data !== 'undefined') {
          var index = columnsAsFunc ? filteredIndex : i;
          this.colToPropCache[index] = column.data;
          this.propToColCache.set(column.data, index);
        }

        filteredIndex += 1;
      }
    }
  } else {
    this.recursiveDuckColumns(schema);
  }
};

/**
 * Returns property name that corresponds with the given column index.
 *
 * @param {Number} col Visual column index.
 * @returns {Number} Physical column index.
 */
DataMap.prototype.colToProp = function (col) {
  var physicalColumn = this.instance.runHooks('modifyCol', col);

  if (!isNaN(physicalColumn) && this.colToPropCache && typeof this.colToPropCache[physicalColumn] !== 'undefined') {
    return this.colToPropCache[physicalColumn];
  }

  return physicalColumn;
};

/**
 * @param {Object} prop
 * @fires Hooks#modifyCol
 * @returns {*}
 */
DataMap.prototype.propToCol = function (prop) {
  var col = void 0;

  if (typeof this.propToColCache.get(prop) === 'undefined') {
    col = prop;
  } else {
    col = this.propToColCache.get(prop);
  }
  col = this.instance.runHooks('unmodifyCol', col);

  return col;
};

/**
 * @returns {Object}
 */
DataMap.prototype.getSchema = function () {
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
 * @param {Number} [index] Physical index of the row before which the new row will be inserted.
 * @param {Number} [amount=1] An amount of rows to add.
 * @param {String} [source] Source of method call.
 * @fires Hooks#afterCreateRow
 * @returns {Number} Returns number of created rows.
 */
DataMap.prototype.createRow = function (index) {
  var _this3 = this;

  var amount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
  var source = arguments[2];

  var numberOfCreatedRows = 0;
  var rowIndex = index;

  if (typeof rowIndex !== 'number' || rowIndex >= this.instance.countSourceRows()) {
    rowIndex = this.instance.countSourceRows();
  }

  var continueProcess = this.instance.runHooks('beforeCreateRow', rowIndex, amount, source);

  if (continueProcess === false) {
    return 0;
  }

  var maxRows = this.instance.getSettings().maxRows;
  var columnCount = this.instance.countCols();

  var _loop = function _loop() {
    var row = null;

    if (_this3.instance.dataType === 'array') {
      if (_this3.instance.getSettings().dataSchema) {
        // Clone template array
        row = (0, _object.deepClone)(_this3.getSchema());
      } else {
        row = [];
        /* eslint-disable no-loop-func */
        (0, _number.rangeEach)(columnCount - 1, function () {
          return row.push(null);
        });
      }
    } else if (_this3.instance.dataType === 'function') {
      row = _this3.instance.getSettings().dataSchema(rowIndex);
    } else {
      row = {};
      (0, _object.deepExtend)(row, _this3.getSchema());
    }

    if (rowIndex === _this3.instance.countSourceRows()) {
      _this3.dataSource.push(row);
    } else {
      _this3.spliceData(rowIndex, 0, row);
    }

    numberOfCreatedRows += 1;
  };

  while (numberOfCreatedRows < amount && this.instance.countSourceRows() < maxRows) {
    _loop();
  }

  this.instance.runHooks('afterCreateRow', rowIndex, numberOfCreatedRows, source);
  this.instance.forceFullRender = true; // used when data was changed

  return numberOfCreatedRows;
};

/**
 * Creates col at the right of the data array.
 *
 * @param {Number} [index] Visual index of the column before which the new column will be inserted
 * @param {Number} [amount=1] An amount of columns to add.
 * @param {String} [source] Source of method call.
 * @fires Hooks#afterCreateCol
 * @returns {Number} Returns number of created columns
 */
DataMap.prototype.createCol = function (index) {
  var amount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
  var source = arguments[2];

  if (!this.instance.isColumnModificationAllowed()) {
    throw new Error('Cannot create new column. When data source in an object, ' + 'you can only have as much columns as defined in first data row, data schema or in the \'columns\' setting.' + 'If you want to be able to add new columns, you have to use array datasource.');
  }
  var rlen = this.instance.countSourceRows();
  var data = this.dataSource;
  var countColumns = this.instance.countCols();
  var columnIndex = typeof index !== 'number' || index >= countColumns ? countColumns : index;
  var constructor = void 0;
  var numberOfCreatedCols = 0;
  var currentIndex = void 0;

  this.instance.runHooks('beforeCreateCol', columnIndex, amount, source);

  currentIndex = columnIndex;

  var maxCols = this.instance.getSettings().maxCols;
  while (numberOfCreatedCols < amount && this.instance.countCols() < maxCols) {
    constructor = (0, _setting.columnFactory)(this.GridSettings, this.priv.columnsSettingConflicts);

    if (typeof columnIndex !== 'number' || columnIndex >= this.instance.countCols()) {
      if (rlen > 0) {
        for (var r = 0; r < rlen; r++) {
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
      for (var _row = 0; _row < rlen; _row++) {
        data[_row].splice(currentIndex, 0, null);
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
};

/**
 * Removes row from the data array.
 *
 * @param {Number} [index] Visual index of the row to be removed. If not provided, the last row will be removed
 * @param {Number} [amount=1] Amount of the rows to be removed. If not provided, one row will be removed
 * @param {String} [source] Source of method call.
 * @fires Hooks#beforeRemoveRow
 * @fires Hooks#afterRemoveRow
 */
DataMap.prototype.removeRow = function (index) {
  var amount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
  var source = arguments[2];

  var rowIndex = typeof index !== 'number' ? -amount : index;
  var rowsAmount = this.instance.runHooks('modifyRemovedAmount', amount, rowIndex);

  rowIndex = (this.instance.countSourceRows() + rowIndex) % this.instance.countSourceRows();

  var logicRows = this.visualRowsToPhysical(rowIndex, rowsAmount);
  var actionWasNotCancelled = this.instance.runHooks('beforeRemoveRow', rowIndex, rowsAmount, logicRows, source);

  if (actionWasNotCancelled === false) {
    return;
  }

  var data = this.dataSource;
  var newData = this.filterData(rowIndex, rowsAmount);

  if (newData) {
    data.length = 0;
    Array.prototype.push.apply(data, newData);
  }

  this.instance.runHooks('afterRemoveRow', rowIndex, rowsAmount, logicRows, source);

  this.instance.forceFullRender = true; // used when data was changed
};

/**
 * Removes column from the data array.
 *
 * @param {Number} [index] Visual index of the column to be removed. If not provided, the last column will be removed
 * @param {Number} [amount=1] Amount of the columns to be removed. If not provided, one column will be removed
 * @param {String} [source] Source of method call.
 * @fires Hooks#beforeRemoveCol
 * @fires Hooks#afterRemoveCol
 */
DataMap.prototype.removeCol = function (index) {
  var amount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
  var source = arguments[2];

  if (this.instance.dataType === 'object' || this.instance.getSettings().columns) {
    throw new Error('cannot remove column with object data source or columns option specified');
  }
  var columnIndex = typeof index !== 'number' ? -amount : index;

  columnIndex = (this.instance.countCols() + columnIndex) % this.instance.countCols();

  var logicColumns = this.visualColumnsToPhysical(columnIndex, amount);
  var descendingLogicColumns = logicColumns.slice(0).sort(function (a, b) {
    return b - a;
  });
  var actionWasNotCancelled = this.instance.runHooks('beforeRemoveCol', columnIndex, amount, logicColumns, source);

  if (actionWasNotCancelled === false) {
    return;
  }

  var isTableUniform = true;
  var removedColumnsCount = descendingLogicColumns.length;
  var data = this.dataSource;

  for (var c = 0; c < removedColumnsCount; c++) {
    if (isTableUniform && logicColumns[0] !== logicColumns[c] - c) {
      isTableUniform = false;
    }
  }

  if (isTableUniform) {
    for (var r = 0, rlen = this.instance.countSourceRows(); r < rlen; r++) {
      data[r].splice(logicColumns[0], amount);
    }
  } else {
    for (var _r = 0, _rlen = this.instance.countSourceRows(); _r < _rlen; _r++) {
      for (var _c = 0; _c < removedColumnsCount; _c++) {
        data[_r].splice(descendingLogicColumns[_c], 1);
      }
    }

    for (var _c2 = 0; _c2 < removedColumnsCount; _c2++) {
      this.priv.columnSettings.splice(logicColumns[_c2], 1);
    }
  }

  this.instance.runHooks('afterRemoveCol', columnIndex, amount, logicColumns, source);

  this.instance.forceFullRender = true; // used when data was changed
};

/**
 * Add/Removes data from the column.
 *
 * @param {Number} col Physical index of column in which do you want to do splice
 * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
 * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
 * @param {Array} [elements]
 * @returns {Array} Returns removed portion of columns
 */
DataMap.prototype.spliceCol = function (col, index, amount) {
  var colData = this.instance.getDataAtCol(col);
  var removed = colData.slice(index, index + amount);
  var after = colData.slice(index + amount);

  for (var _len = arguments.length, elements = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
    elements[_key - 3] = arguments[_key];
  }

  (0, _array.extendArray)(elements, after);
  var i = 0;
  while (i < amount) {
    elements.push(null); // add null in place of removed elements
    i += 1;
  }
  (0, _array.to2dArray)(elements);
  this.instance.populateFromArray(index, col, elements, null, null, 'spliceCol');

  return removed;
};

/**
 * Add/Removes data from the row.
 *
 * @param {Number} row Physical index of row in which do you want to do splice
 * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end.
 * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed.
 * @param {Array} [elements]
 * @returns {Array} Returns removed portion of rows
 */
DataMap.prototype.spliceRow = function (row, index, amount) {
  var rowData = this.instance.getSourceDataAtRow(row);
  var removed = rowData.slice(index, index + amount);
  var after = rowData.slice(index + amount);

  for (var _len2 = arguments.length, elements = Array(_len2 > 3 ? _len2 - 3 : 0), _key2 = 3; _key2 < _len2; _key2++) {
    elements[_key2 - 3] = arguments[_key2];
  }

  (0, _array.extendArray)(elements, after);
  var i = 0;
  while (i < amount) {
    elements.push(null); // add null in place of removed elements
    i += 1;
  }
  this.instance.populateFromArray(row, index, [elements], null, null, 'spliceRow');

  return removed;
};

/**
 * Add/remove row(s) to/from the data source.
 *
 * @param {Number} index Physical index of the element to remove.
 * @param {Number} amount Number of rows to add/remove.
 * @param {Object} element Row to add.
 */
DataMap.prototype.spliceData = function (index, amount, element) {
  var continueSplicing = this.instance.runHooks('beforeDataSplice', index, amount, element);

  if (continueSplicing !== false) {
    this.dataSource.splice(index, amount, element);
  }
};

/**
 * Filter unwanted data elements from the data source.
 *
 * @param {Number} index Visual index of the element to remove.
 * @param {Number} amount Number of rows to add/remove.
 * @returns {Array}
 */
DataMap.prototype.filterData = function (index, amount) {
  var physicalRows = this.visualRowsToPhysical(index, amount);
  var continueSplicing = this.instance.runHooks('beforeDataFilter', index, amount, physicalRows);

  if (continueSplicing !== false) {
    var newData = this.dataSource.filter(function (row, rowIndex) {
      return physicalRows.indexOf(rowIndex) === -1;
    });

    return newData;
  }
};

/**
 * Returns single value from the data array.
 *
 * @param {Number} row Visual row index.
 * @param {Number} prop
 */
DataMap.prototype.get = function (row, prop) {
  var physicalRow = this.instance.runHooks('modifyRow', row);

  var dataRow = this.dataSource[physicalRow];
  // TODO: To remove, use 'modifyData' hook instead (see below)
  var modifiedRowData = this.instance.runHooks('modifyRowData', physicalRow);

  dataRow = isNaN(modifiedRowData) ? modifiedRowData : dataRow;
  //

  var value = null;

  // try to get value under property `prop` (includes dot)
  if (dataRow && dataRow.hasOwnProperty && (0, _object.hasOwnProperty)(dataRow, prop)) {
    value = dataRow[prop];
  } else if (typeof prop === 'string' && prop.indexOf('.') > -1) {
    var sliced = prop.split('.');
    var out = dataRow;

    if (!out) {
      return null;
    }
    for (var i = 0, ilen = sliced.length; i < ilen; i++) {
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
    var valueHolder = (0, _object.createObjectPropListener)(value);

    this.instance.runHooks('modifyData', physicalRow, this.propToCol(prop), valueHolder, 'get');

    if (valueHolder.isTouched()) {
      value = valueHolder.value;
    }
  }

  return value;
};

var copyableLookup = (0, _data.cellMethodLookupFactory)('copyable', false);

/**
 * Returns single value from the data array (intended for clipboard copy to an external application).
 *
 * @param {Number} row Physical row index.
 * @param {Number} prop
 * @returns {String}
 */
DataMap.prototype.getCopyable = function (row, prop) {
  if (copyableLookup.call(this.instance, row, this.propToCol(prop))) {
    return this.get(row, prop);
  }
  return '';
};

/**
 * Saves single value to the data array.
 *
 * @param {Number} row Visual row index.
 * @param {Number} prop
 * @param {String} value
 * @param {String} [source] Source of hook runner.
 */
DataMap.prototype.set = function (row, prop, value, source) {
  var physicalRow = this.instance.runHooks('modifyRow', row, source || 'datamapGet');
  var newValue = value;
  var dataRow = this.dataSource[physicalRow];
  // TODO: To remove, use 'modifyData' hook instead (see below)
  var modifiedRowData = this.instance.runHooks('modifyRowData', physicalRow);

  dataRow = isNaN(modifiedRowData) ? modifiedRowData : dataRow;
  //

  if (this.instance.hasHook('modifyData')) {
    var valueHolder = (0, _object.createObjectPropListener)(newValue);

    this.instance.runHooks('modifyData', physicalRow, this.propToCol(prop), valueHolder, 'set');

    if (valueHolder.isTouched()) {
      newValue = valueHolder.value;
    }
  }

  // try to set value under property `prop` (includes dot)
  if (dataRow && dataRow.hasOwnProperty && (0, _object.hasOwnProperty)(dataRow, prop)) {
    dataRow[prop] = newValue;
  } else if (typeof prop === 'string' && prop.indexOf('.') > -1) {
    var sliced = prop.split('.');
    var out = dataRow;
    var i = 0;
    var ilen = void 0;

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
};

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
DataMap.prototype.visualRowsToPhysical = function (index, amount) {
  var totalRows = this.instance.countSourceRows();
  var logicRows = [];
  var physicRow = (totalRows + index) % totalRows;
  var rowsToRemove = amount;
  var row = void 0;

  while (physicRow < totalRows && rowsToRemove) {
    row = this.instance.runHooks('modifyRow', physicRow);
    logicRows.push(row);

    rowsToRemove -= 1;
    physicRow += 1;
  }

  return logicRows;
};

/**
 *
 * @param index Visual column index.
 * @param amount
 * @returns {Array}
 */
DataMap.prototype.visualColumnsToPhysical = function (index, amount) {
  var totalCols = this.instance.countCols();
  var physicalCol = (totalCols + index) % totalCols;
  var visualCols = [];
  var colsToRemove = amount;

  while (physicalCol < totalCols && colsToRemove) {
    var col = this.instance.runHooks('modifyCol', physicalCol);

    visualCols.push(col);

    colsToRemove -= 1;
    physicalCol += 1;
  }

  return visualCols;
};

/**
 * Clears the data array.
 */
DataMap.prototype.clear = function () {
  for (var r = 0; r < this.instance.countSourceRows(); r++) {
    for (var c = 0; c < this.instance.countCols(); c++) {
      this.set(r, this.colToProp(c), '');
    }
  }
};

/**
 * Clear cached data length.
 */
DataMap.prototype.clearLengthCache = function () {
  this.cachedLength = null;
};

/**
 * Get data length.
 *
 * @returns {Number}
 */
DataMap.prototype.getLength = function () {
  var _this4 = this;

  var maxRowsFromSettings = this.instance.getSettings().maxRows;
  var maxRows = void 0;

  if (maxRowsFromSettings < 0 || maxRowsFromSettings === 0) {
    maxRows = 0;
  } else {
    maxRows = maxRowsFromSettings || Infinity;
  }

  var length = this.instance.countSourceRows();

  if (this.instance.hasHook('modifyRow')) {
    var reValidate = this.skipCache;

    this.interval.start();
    if (length !== this.latestSourceRowsCount) {
      reValidate = true;
    }

    this.latestSourceRowsCount = length;
    if (this.cachedLength === null || reValidate) {
      (0, _number.rangeEach)(length - 1, function (row) {
        var physicalRow = _this4.instance.runHooks('modifyRow', row);

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
};

/**
 * Returns the data array.
 *
 * @returns {Array}
 */
DataMap.prototype.getAll = function () {
  var start = {
    row: 0,
    col: 0
  };

  var end = {
    row: Math.max(this.instance.countSourceRows() - 1, 0),
    col: Math.max(this.instance.countCols() - 1, 0)
  };

  if (start.row - end.row === 0 && !this.instance.countSourceRows()) {
    return [];
  }

  return this.getRange(start, end, DataMap.prototype.DESTINATION_RENDERER);
};

/**
 * Returns data range as array.
 *
 * @param {Object} [start] Start selection position. Visual indexes.
 * @param {Object} [end] End selection position. Visual indexes.
 * @param {Number} destination Destination of datamap.get
 * @returns {Array}
 */
DataMap.prototype.getRange = function (start, end, destination) {
  var output = [];
  var r = void 0;
  var c = void 0;
  var row = void 0;

  var maxRows = this.instance.getSettings().maxRows;
  var maxCols = this.instance.getSettings().maxCols;

  if (maxRows === 0 || maxCols === 0) {
    return [];
  }

  var getFn = destination === this.DESTINATION_CLIPBOARD_GENERATOR ? this.getCopyable : this.get;

  var rlen = Math.min(Math.max(maxRows - 1, 0), Math.max(start.row, end.row));
  var clen = Math.min(Math.max(maxCols - 1, 0), Math.max(start.col, end.col));

  for (r = Math.min(start.row, end.row); r <= rlen; r++) {
    row = [];
    var physicalRow = this.instance.runHooks('modifyRow', r);

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
};

/**
 * Return data as text (tab separated columns).
 *
 * @param {Object} [start] Start selection position. Visual indexes.
 * @param {Object} [end] End selection position. Visual indexes.
 * @returns {String}
 */
DataMap.prototype.getText = function (start, end) {
  return _SheetClip2.default.stringify(this.getRange(start, end, this.DESTINATION_RENDERER));
};

/**
 * Return data as copyable text (tab separated columns intended for clipboard copy to an external application).
 *
 * @param {Object} [start] Start selection position. Visual indexes.
 * @param {Object} [end] End selection position. Visual indexes.
 * @returns {String}
 */
DataMap.prototype.getCopyableText = function (start, end) {
  return _SheetClip2.default.stringify(this.getRange(start, end, this.DESTINATION_CLIPBOARD_GENERATOR));
};

/**
 * `skipLengthCache` callback.
 * @private
 * @param {Number} delay Time of the delay in milliseconds.
 */
DataMap.prototype.onSkipLengthCache = function (delay) {
  var _this5 = this;

  this.skipCache = true;
  setTimeout(function () {
    _this5.skipCache = false;
  }, delay);
};

/**
 * Destroy instance.
 */
DataMap.prototype.destroy = function () {
  this.interval.stop();

  this.interval = null;
  this.instance = null;
  this.priv = null;
  this.GridSettings = null;
  this.dataSource = null;
  this.cachedLength = null;
  this.duckSchema = null;
};

exports.default = DataMap;