(function (Handsontable) {
  'use strict';

  /**
   * Utility class that gets and saves data from/to the data source using mapping of columns numbers to object property names
   * TODO refactor arguments of methods getRange, getText to be numbers (not objects)
   * TODO remove priv, GridSettings from object constructor
   *
   * @param instance
   * @param priv
   * @param GridSettings
   * @constructor
   */
  Handsontable.DataMap = function (instance, priv, GridSettings) {
    this.instance = instance;
    this.priv = priv;
    this.GridSettings = GridSettings;
    this.dataSource = this.instance.getSettings().data;

    if (this.dataSource[0]) {
      this.duckSchema = this.recursiveDuckSchema(this.dataSource[0]);
    }
    else {
      this.duckSchema = {};
    }
    this.createMap();

    this.getVars = {}; //used by modifier
    this.setVars = {}; //used by modifier
  };

  Handsontable.DataMap.prototype.DESTINATION_RENDERER = 1;
  Handsontable.DataMap.prototype.DESTINATION_CLIPBOARD_GENERATOR = 2;

  Handsontable.DataMap.prototype.recursiveDuckSchema = function (obj) {
    var schema;
    if ($.isPlainObject(obj)) {
      schema = {};
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          if ($.isPlainObject(obj[i])) {
            schema[i] = this.recursiveDuckSchema(obj[i]);
          }
          else {
            schema[i] = null;
          }
        }
      }
    }
    else {
      schema = [];
    }
    return schema;
  };

  Handsontable.DataMap.prototype.recursiveDuckColumns = function (schema, lastCol, parent) {
    var prop, i;
    if (typeof lastCol === 'undefined') {
      lastCol = 0;
      parent = '';
    }
    if ($.isPlainObject(schema)) {
      for (i in schema) {
        if (schema.hasOwnProperty(i)) {
          if (schema[i] === null) {
            prop = parent + i;
            this.colToPropCache.push(prop);
            this.propToColCache[prop] = lastCol;
            lastCol++;
          }
          else {
            lastCol = this.recursiveDuckColumns(schema[i], lastCol, i + '.');
          }
        }
      }
    }
    return lastCol;
  };

  Handsontable.DataMap.prototype.createMap = function () {
    if (typeof this.getSchema() === "undefined") {
      throw new Error("trying to create `columns` definition but you didnt' provide `schema` nor `data`");
    }
    var i, ilen, schema = this.getSchema();
    this.colToPropCache = [];
    this.propToColCache = {};
    var columns = this.instance.getSettings().columns;
    if (columns) {
      for (i = 0, ilen = columns.length; i < ilen; i++) {
        this.colToPropCache[i] = columns[i].data;
        this.propToColCache[columns[i].data] = i;
      }
    }
    else {
      this.recursiveDuckColumns(schema);
    }
  };

  Handsontable.DataMap.prototype.colToProp = function (col) {
    col = Handsontable.PluginHooks.execute(this.instance, 'modifyCol', col);
    if (this.colToPropCache && typeof this.colToPropCache[col] !== 'undefined') {
      return this.colToPropCache[col];
    }
    else {
      return col;
    }
  };

  Handsontable.DataMap.prototype.propToCol = function (prop) {
    var col;
    if (typeof this.propToColCache[prop] !== 'undefined') {
      col = this.propToColCache[prop];
    }
    else {
      col = prop;
    }
    col = Handsontable.PluginHooks.execute(this.instance, 'modifyCol', col);
    return col;
  };

  Handsontable.DataMap.prototype.getSchema = function () {
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
   * Creates row at the bottom of the data array
   * @param {Number} [index] Optional. Index of the row before which the new row will be inserted
   */
  Handsontable.DataMap.prototype.createRow = function (index, amount) {
    var row
      , colCount = this.instance.countCols()
      , numberOfCreatedRows = 0
      , currentIndex;

    if (!amount) {
      amount = 1;
    }

    if (typeof index !== 'number' || index >= this.instance.countRows()) {
      index = this.instance.countRows();
    }

    currentIndex = index;
    var maxRows = this.instance.getSettings().maxRows;
    while (numberOfCreatedRows < amount && this.instance.countRows() < maxRows) {

      if (this.instance.dataType === 'array') {
        row = [];
        for (var c = 0; c < colCount; c++) {
          row.push(null);
        }
      }
      else if (this.instance.dataType === 'function') {
        row = this.instance.getSettings().dataSchema(index);
      }
      else {
        row = $.extend(true, {}, this.getSchema());
      }

      if (index === this.instance.countRows()) {
        this.dataSource.push(row);
      }
      else {
        this.dataSource.splice(index, 0, row);
      }

      numberOfCreatedRows++;
      currentIndex++;
    }


    this.instance.PluginHooks.run('afterCreateRow', index, numberOfCreatedRows);
    this.instance.forceFullRender = true; //used when data was changed

    return numberOfCreatedRows;
  };

  /**
   * Creates col at the right of the data array
   * @param {Number} [index] Optional. Index of the column before which the new column will be inserted
   *   * @param {Number} [amount] Optional.
   */
  Handsontable.DataMap.prototype.createCol = function (index, amount) {
    if (this.instance.dataType === 'object' || this.instance.getSettings().columns) {
      throw new Error("Cannot create new column. When data source in an object, " +
        "you can only have as much columns as defined in first data row, data schema or in the 'columns' setting." +
        "If you want to be able to add new columns, you have to use array datasource.");
    }
    var rlen = this.instance.countRows()
      , data = this.dataSource
      , constructor
      , numberOfCreatedCols = 0
      , currentIndex;

    if (!amount) {
      amount = 1;
    }

    currentIndex = index;

    var maxCols = this.instance.getSettings().maxCols;
    while (numberOfCreatedCols < amount && this.instance.countCols() < maxCols) {
      constructor = Handsontable.helper.columnFactory(this.GridSettings, this.priv.columnsSettingConflicts);
      if (typeof index !== 'number' || index >= this.instance.countCols()) {
        for (var r = 0; r < rlen; r++) {
          if (typeof data[r] === 'undefined') {
            data[r] = [];
          }
          data[r].push(null);
        }
        // Add new column constructor
        this.priv.columnSettings.push(constructor);
      }
      else {
        for (var r = 0; r < rlen; r++) {
          data[r].splice(currentIndex, 0, null);
        }
        // Add new column constructor at given index
        this.priv.columnSettings.splice(currentIndex, 0, constructor);
      }

      numberOfCreatedCols++;
      currentIndex++;
    }

    this.instance.PluginHooks.run('afterCreateCol', index, numberOfCreatedCols);
    this.instance.forceFullRender = true; //used when data was changed

    return numberOfCreatedCols;
  };

  /**
   * Removes row from the data array
   * @param {Number} [index] Optional. Index of the row to be removed. If not provided, the last row will be removed
   * @param {Number} [amount] Optional. Amount of the rows to be removed. If not provided, one row will be removed
   */
  Handsontable.DataMap.prototype.removeRow = function (index, amount) {
    if (!amount) {
      amount = 1;
    }
    if (typeof index !== 'number') {
      index = -amount;
    }

    index = (this.instance.countRows() + index) % this.instance.countRows();

    // We have to map the physical row ids to logical and than perform removing with (possibly) new row id
    var logicRows = this.physicalRowsToLogical(index, amount);

    var actionWasNotCancelled = this.instance.PluginHooks.execute('beforeRemoveRow', index, amount);

    if (actionWasNotCancelled === false) {
      return;
    }

    var data = this.dataSource;
    var newData = data.filter(function (row, index) {
      return logicRows.indexOf(index) == -1;
    });

    data.length = 0;
    Array.prototype.push.apply(data, newData);

    this.instance.PluginHooks.run('afterRemoveRow', index, amount);

    this.instance.forceFullRender = true; //used when data was changed
  };

  /**
   * Removes column from the data array
   * @param {Number} [index] Optional. Index of the column to be removed. If not provided, the last column will be removed
   * @param {Number} [amount] Optional. Amount of the columns to be removed. If not provided, one column will be removed
   */
  Handsontable.DataMap.prototype.removeCol = function (index, amount) {
    if (this.instance.dataType === 'object' || this.instance.getSettings().columns) {
      throw new Error("cannot remove column with object data source or columns option specified");
    }
    if (!amount) {
      amount = 1;
    }
    if (typeof index !== 'number') {
      index = -amount;
    }

    index = (this.instance.countCols() + index) % this.instance.countCols();

    var actionWasNotCancelled = this.instance.PluginHooks.execute('beforeRemoveCol', index, amount);

    if (actionWasNotCancelled === false) {
      return;
    }

    var data = this.dataSource;
    for (var r = 0, rlen = this.instance.countRows(); r < rlen; r++) {
      data[r].splice(index, amount);
    }
    this.priv.columnSettings.splice(index, amount);

    this.instance.PluginHooks.run('afterRemoveCol', index, amount);
    this.instance.forceFullRender = true; //used when data was changed
  };

  /**
   * Add / removes data from the column
   * @param {Number} col Index of column in which do you want to do splice.
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
   * param {...*} elements Optional. The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array
   */
  Handsontable.DataMap.prototype.spliceCol = function (col, index, amount/*, elements...*/) {
    var elements = 4 <= arguments.length ? [].slice.call(arguments, 3) : [];

    var colData = this.instance.getDataAtCol(col);
    var removed = colData.slice(index, index + amount);
    var after = colData.slice(index + amount);

    Handsontable.helper.extendArray(elements, after);
    var i = 0;
    while (i < amount) {
      elements.push(null); //add null in place of removed elements
      i++;
    }
    Handsontable.helper.to2dArray(elements);
    this.instance.populateFromArray(index, col, elements, null, null, 'spliceCol');

    return removed;
  };

  /**
   * Add / removes data from the row
   * @param {Number} row Index of row in which do you want to do splice.
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
   * param {...*} elements Optional. The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array
   */
  Handsontable.DataMap.prototype.spliceRow = function (row, index, amount/*, elements...*/) {
    var elements = 4 <= arguments.length ? [].slice.call(arguments, 3) : [];

    var rowData = this.instance.getDataAtRow(row);
    var removed = rowData.slice(index, index + amount);
    var after = rowData.slice(index + amount);

    Handsontable.helper.extendArray(elements, after);
    var i = 0;
    while (i < amount) {
      elements.push(null); //add null in place of removed elements
      i++;
    }
    this.instance.populateFromArray(row, index, [elements], null, null, 'spliceRow');

    return removed;
  };

  /**
   * Returns single value from the data array
   * @param {Number} row
   * @param {Number} prop
   */
  Handsontable.DataMap.prototype.get = function (row, prop) {
    this.getVars.row = row;
    this.getVars.prop = prop;
    this.instance.PluginHooks.run('beforeGet', this.getVars);
    if (typeof this.getVars.prop === 'string' && this.getVars.prop.indexOf('.') > -1) {
      var sliced = this.getVars.prop.split(".");
      var out = this.dataSource[this.getVars.row];
      if (!out) {
        return null;
      }
      for (var i = 0, ilen = sliced.length; i < ilen; i++) {
        out = out[sliced[i]];
        if (typeof out === 'undefined') {
          return null;
        }
      }
      return out;
    }
    else if (typeof this.getVars.prop === 'function') {
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
      return this.getVars.prop(this.dataSource.slice(
        this.getVars.row,
        this.getVars.row + 1
      )[0]);
    }
    else {
      return this.dataSource[this.getVars.row] ? this.dataSource[this.getVars.row][this.getVars.prop] : null;
    }
  };

  var copyableLookup = Handsontable.helper.cellMethodLookupFactory('copyable', false);

  /**
   * Returns single value from the data array (intended for clipboard copy to an external application)
   * @param {Number} row
   * @param {Number} prop
   * @return {String}
   */
  Handsontable.DataMap.prototype.getCopyable = function (row, prop) {
    if (copyableLookup.call(this.instance, row, this.propToCol(prop))) {
      return this.get(row, prop);
    }
    return '';
  };

  /**
   * Saves single value to the data array
   * @param {Number} row
   * @param {Number} prop
   * @param {String} value
   * @param {String} [source] Optional. Source of hook runner.
   */
  Handsontable.DataMap.prototype.set = function (row, prop, value, source) {
    this.setVars.row = row;
    this.setVars.prop = prop;
    this.setVars.value = value;
    this.instance.PluginHooks.run('beforeSet', this.setVars, source || "datamapGet");
    if (typeof this.setVars.prop === 'string' && this.setVars.prop.indexOf('.') > -1) {
      var sliced = this.setVars.prop.split(".");
      var out = this.dataSource[this.setVars.row];
      for (var i = 0, ilen = sliced.length - 1; i < ilen; i++) {
        out = out[sliced[i]];
      }
      out[sliced[i]] = this.setVars.value;
    }
    else if (typeof this.setVars.prop === 'function') {
      /* see the `function` handler in `get` */
      this.setVars.prop(this.dataSource.slice(
        this.setVars.row,
        this.setVars.row + 1
      )[0], this.setVars.value);
    }
    else {
      this.dataSource[this.setVars.row][this.setVars.prop] = this.setVars.value;
    }
  };

  /**
   * This ridiculous piece of code maps rows Id that are present in table data to those displayed for user.
   * The trick is, the physical row id (stored in settings.data) is not necessary the same
   * as the logical (displayed) row id (e.g. when sorting is applied).
   */
  Handsontable.DataMap.prototype.physicalRowsToLogical = function (index, amount) {
    var totalRows = this.instance.countRows();
    var physicRow = (totalRows + index) % totalRows;
    var logicRows = [];
    var rowsToRemove = amount;

    while (physicRow < totalRows && rowsToRemove) {
      this.get(physicRow, 0); //this performs an actual mapping and saves the result to getVars
      logicRows.push(this.getVars.row);

      rowsToRemove--;
      physicRow++;
    }

    return logicRows;
  };

  /**
   * Clears the data array
   */
  Handsontable.DataMap.prototype.clear = function () {
    for (var r = 0; r < this.instance.countRows(); r++) {
      for (var c = 0; c < this.instance.countCols(); c++) {
        this.set(r, this.colToProp(c), '');
      }
    }
  };

  /**
   * Returns the data array
   * @return {Array}
   */
  Handsontable.DataMap.prototype.getAll = function () {
    return this.dataSource;
  };

  /**
   * Returns data range as array
   * @param {Object} start Start selection position
   * @param {Object} end End selection position
   * @param {Number} destination Destination of datamap.get
   * @return {Array}
   */
  Handsontable.DataMap.prototype.getRange = function (start, end, destination) {
    var r, rlen, c, clen, output = [], row;
    var getFn = destination === this.DESTINATION_CLIPBOARD_GENERATOR ? this.getCopyable : this.get;
    rlen = Math.max(start.row, end.row);
    clen = Math.max(start.col, end.col);
    for (r = Math.min(start.row, end.row); r <= rlen; r++) {
      row = [];
      for (c = Math.min(start.col, end.col); c <= clen; c++) {
        row.push(getFn.call(this, r, this.colToProp(c)));
      }
      output.push(row);
    }
    return output;
  };

  /**
   * Return data as text (tab separated columns)
   * @param {Object} start (Optional) Start selection position
   * @param {Object} end (Optional) End selection position
   * @return {String}
   */
  Handsontable.DataMap.prototype.getText = function (start, end) {
    return SheetClip.stringify(this.getRange(start, end, this.DESTINATION_RENDERER));
  };

  /**
   * Return data as copyable text (tab separated columns intended for clipboard copy to an external application)
   * @param {Object} start (Optional) Start selection position
   * @param {Object} end (Optional) End selection position
   * @return {String}
   */
  Handsontable.DataMap.prototype.getCopyableText = function (start, end) {
    return SheetClip.stringify(this.getRange(start, end, this.DESTINATION_CLIPBOARD_GENERATOR));
  };

})(Handsontable);
