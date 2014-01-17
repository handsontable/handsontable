(function (Handsontable) {
  'use strict';

  /**
   * Utility class that gets and saves data from/to the data source using mapping of columns numbers to object property names
   * TODO refactor methods to prototype methods
   * TODO refactor arguments of methods getRange, getText to be numbers (not objects)
   * TODO remove priv, GridSettings from object constructor
   *
   * @param instance
   * @param priv
   * @param GridSettings
   * @constructor
   */
  Handsontable.DataMap = function (instance, priv, GridSettings) {
    var out = {
      recursiveDuckSchema: function (obj) {
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
      },

      recursiveDuckColumns: function (schema, lastCol, parent) {
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
      },

      createMap: function () {
        if (typeof this.getSchema() === "undefined") {
          throw new Error("trying to create `columns` definition but you didnt' provide `schema` nor `data`");
        }
        var i, ilen, schema = this.getSchema();
        this.colToPropCache = [];
        this.propToColCache = {};
        var columns = instance.getSettings().columns;
        if (columns) {
          for (i = 0, ilen = columns.length; i < ilen; i++) {
            this.colToPropCache[i] = columns[i].data;
            this.propToColCache[columns[i].data] = i;
          }
        }
        else {
          this.recursiveDuckColumns(schema);
        }
      },

      colToProp: function (col) {
        col = Handsontable.PluginHooks.execute(instance, 'modifyCol', col);
        if (this.colToPropCache && typeof this.colToPropCache[col] !== 'undefined') {
          return this.colToPropCache[col];
        }
        else {
          return col;
        }
      },

      propToCol: function (prop) {
        var col;
        if (typeof this.propToColCache[prop] !== 'undefined') {
          col = this.propToColCache[prop];
        }
        else {
          col = prop;
        }
        col = Handsontable.PluginHooks.execute(instance, 'modifyCol', col);
        return col;
      },

      getSchema: function () {
        var schema = instance.getSettings().dataSchema;
        if (schema) {
          if (typeof schema === 'function') {
            return schema();
          }
          return schema;
        }
        return this.duckSchema;
      },

      /**
       * Creates row at the bottom of the data array
       * @param {Number} [index] Optional. Index of the row before which the new row will be inserted
       */
      createRow: function (index, amount) {
        var row
          , colCount = instance.countCols()
          , numberOfCreatedRows = 0
          , currentIndex;

        if (!amount) {
          amount = 1;
        }

        if (typeof index !== 'number' || index >= instance.countRows()) {
          index = instance.countRows();
        }

        currentIndex = index;
        var maxRows = instance.getSettings().maxRows;
        while (numberOfCreatedRows < amount && instance.countRows() < maxRows) {

          if (instance.dataType === 'array') {
            row = [];
            for (var c = 0; c < colCount; c++) {
              row.push(null);
            }
          }
          else if (instance.dataType === 'function') {
            row = instance.getSettings().dataSchema(index);
          }
          else {
            row = $.extend(true, {}, this.getSchema());
          }

          if (index === instance.countRows()) {
            this.getAll().push(row);
          }
          else {
            this.getAll().splice(index, 0, row);
          }

          numberOfCreatedRows++;
          currentIndex++;
        }


        instance.PluginHooks.run('afterCreateRow', index, numberOfCreatedRows);
        instance.forceFullRender = true; //used when data was changed

        return numberOfCreatedRows;
      },

      /**
       * Creates col at the right of the data array
       * @param {Number} [index] Optional. Index of the column before which the new column will be inserted
       *   * @param {Number} [amount] Optional.
       */
      createCol: function (index, amount) {
        if (instance.dataType === 'object' || instance.getSettings().columns) {
          throw new Error("Cannot create new column. When data source in an object, " +
            "you can only have as much columns as defined in first data row, data schema or in the 'columns' setting." +
            "If you want to be able to add new columns, you have to use array datasource.");
        }
        var rlen = instance.countRows()
          , data = this.getAll()
          , constructor
          , numberOfCreatedCols = 0
          , currentIndex;

        if (!amount) {
          amount = 1;
        }

        currentIndex = index;

        var maxCols = instance.getSettings().maxCols;
        while (numberOfCreatedCols < amount && instance.countCols() < maxCols) {
          constructor = Handsontable.helper.columnFactory(GridSettings, priv.columnsSettingConflicts);
          if (typeof index !== 'number' || index >= instance.countCols()) {
            for (var r = 0; r < rlen; r++) {
              if (typeof data[r] === 'undefined') {
                data[r] = [];
              }
              data[r].push(null);
            }
            // Add new column constructor
            priv.columnSettings.push(constructor);
          }
          else {
            for (var r = 0; r < rlen; r++) {
              data[r].splice(currentIndex, 0, null);
            }
            // Add new column constructor at given index
            priv.columnSettings.splice(currentIndex, 0, constructor);
          }

          numberOfCreatedCols++;
          currentIndex++;
        }

        instance.PluginHooks.run('afterCreateCol', index, numberOfCreatedCols);
        instance.forceFullRender = true; //used when data was changed

        return numberOfCreatedCols;
      },

      /**
       * Removes row from the data array
       * @param {Number} [index] Optional. Index of the row to be removed. If not provided, the last row will be removed
       * @param {Number} [amount] Optional. Amount of the rows to be removed. If not provided, one row will be removed
       */
      removeRow: function (index, amount) {
        if (!amount) {
          amount = 1;
        }
        if (typeof index !== 'number') {
          index = -amount;
        }

        index = (instance.countRows() + index) % instance.countRows();

        // We have to map the physical row ids to logical and than perform removing with (possibly) new row id
        var logicRows = this.physicalRowsToLogical(index, amount);

        var actionWasNotCancelled = instance.PluginHooks.execute('beforeRemoveRow', index, amount);

        if (actionWasNotCancelled === false) {
          return;
        }

        var data = this.getAll();
        var newData = data.filter(function (row, index) {
          return logicRows.indexOf(index) == -1;
        });

        data.length = 0;
        Array.prototype.push.apply(data, newData);

        instance.PluginHooks.run('afterRemoveRow', index, amount);

        instance.forceFullRender = true; //used when data was changed
      },

      /**
       * Removes column from the data array
       * @param {Number} [index] Optional. Index of the column to be removed. If not provided, the last column will be removed
       * @param {Number} [amount] Optional. Amount of the columns to be removed. If not provided, one column will be removed
       */
      removeCol: function (index, amount) {
        if (instance.dataType === 'object' || instance.getSettings().columns) {
          throw new Error("cannot remove column with object data source or columns option specified");
        }
        if (!amount) {
          amount = 1;
        }
        if (typeof index !== 'number') {
          index = -amount;
        }

        index = (instance.countCols() + index) % instance.countCols();

        var actionWasNotCancelled = instance.PluginHooks.execute('beforeRemoveCol', index, amount);

        if (actionWasNotCancelled === false) {
          return;
        }

        var data = this.getAll();
        for (var r = 0, rlen = instance.countRows(); r < rlen; r++) {
          data[r].splice(index, amount);
        }
        priv.columnSettings.splice(index, amount);

        instance.PluginHooks.run('afterRemoveCol', index, amount);
        instance.forceFullRender = true; //used when data was changed
      },

      /**
       * Add / removes data from the column
       * @param {Number} col Index of column in which do you want to do splice.
       * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
       * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
       * param {...*} elements Optional. The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array
       */
      spliceCol: function (col, index, amount/*, elements...*/) {
        var elements = 4 <= arguments.length ? [].slice.call(arguments, 3) : [];

        var colData = instance.getDataAtCol(col);
        var removed = colData.slice(index, index + amount);
        var after = colData.slice(index + amount);

        Handsontable.helper.extendArray(elements, after);
        var i = 0;
        while (i < amount) {
          elements.push(null); //add null in place of removed elements
          i++;
        }
        Handsontable.helper.to2dArray(elements);
        instance.populateFromArray(index, col, elements, null, null, 'spliceCol');

        return removed;
      },

      /**
       * Add / removes data from the row
       * @param {Number} row Index of row in which do you want to do splice.
       * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
       * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
       * param {...*} elements Optional. The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array
       */
      spliceRow: function (row, index, amount/*, elements...*/) {
        var elements = 4 <= arguments.length ? [].slice.call(arguments, 3) : [];

        var rowData = instance.getDataAtRow(row);
        var removed = rowData.slice(index, index + amount);
        var after = rowData.slice(index + amount);

        Handsontable.helper.extendArray(elements, after);
        var i = 0;
        while (i < amount) {
          elements.push(null); //add null in place of removed elements
          i++;
        }
        instance.populateFromArray(row, index, [elements], null, null, 'spliceRow');

        return removed;
      },

      /**
       * Returns single value from the data array
       * @param {Number} row
       * @param {Number} prop
       */
      getVars: {},
      get: function (row, prop) {
        this.getVars.row = row;
        this.getVars.prop = prop;
        instance.PluginHooks.run('beforeGet', this.getVars);
        if (typeof this.getVars.prop === 'string' && this.getVars.prop.indexOf('.') > -1) {
          var sliced = this.getVars.prop.split(".");
          var out = this.getAll()[this.getVars.row];
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
          return this.getVars.prop(this.getAll().slice(
            this.getVars.row,
            this.getVars.row + 1
          )[0]);
        }
        else {
          return this.getAll()[this.getVars.row] ? this.getAll()[this.getVars.row][this.getVars.prop] : null;
        }
      },

      /**
       * Saves single value to the data array
       * @param {Number} row
       * @param {Number} prop
       * @param {String} value
       * @param {String} [source] Optional. Source of hook runner.
       */
      setVars: {},
      set: function (row, prop, value, source) {
        this.setVars.row = row;
        this.setVars.prop = prop;
        this.setVars.value = value;
        instance.PluginHooks.run('beforeSet', this.setVars, source || "datamapGet");
        if (typeof this.setVars.prop === 'string' && this.setVars.prop.indexOf('.') > -1) {
          var sliced = this.setVars.prop.split(".");
          var out = this.getAll()[this.setVars.row];
          for (var i = 0, ilen = sliced.length - 1; i < ilen; i++) {
            out = out[sliced[i]];
          }
          out[sliced[i]] = this.setVars.value;
        }
        else if (typeof this.setVars.prop === 'function') {
          /* see the `function` handler in `get` */
          this.setVars.prop(this.getAll().slice(
            this.setVars.row,
            this.setVars.row + 1
          )[0], this.setVars.value);
        }
        else {
          this.getAll()[this.setVars.row][this.setVars.prop] = this.setVars.value;
        }
      },
      /**
       * This ridiculous piece of code maps rows Id that are present in table data to those displayed for user.
       * The trick is, the physical row id (stored in settings.data) is not necessary the same
       * as the logical (displayed) row id (e.g. when sorting is applied).
       */
      physicalRowsToLogical: function (index, amount) {
        var totalRows = instance.countRows();
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
      },

      /**
       * Clears the data array
       */
      clear: function () {
        for (var r = 0; r < instance.countRows(); r++) {
          for (var c = 0; c < instance.countCols(); c++) {
            this.set(r, this.colToProp(c), '');
          }
        }
      },

      /**
       * Returns the data array
       * @return {Array}
       */
      getAll: function () {
        return instance.getSettings().data;
      },

      /**
       * Returns data range as array
       * @param {Object} start Start selection position
       * @param {Object} end End selection position
       * @return {Array}
       */
      getRange: function (start, end) {
        var r, rlen, c, clen, output = [], row;
        rlen = Math.max(start.row, end.row);
        clen = Math.max(start.col, end.col);
        for (r = Math.min(start.row, end.row); r <= rlen; r++) {
          row = [];
          for (c = Math.min(start.col, end.col); c <= clen; c++) {
            row.push(this.get(r, this.colToProp(c)));
          }
          output.push(row);
        }
        return output;
      },

      /**
       * Return data as text (tab separated columns)
       * @param {Object} start (Optional) Start selection position
       * @param {Object} end (Optional) End selection position
       * @return {String}
       */
      getText: function (start, end) {
        return SheetClip.stringify(this.getRange(start, end));
      }
    }
    return out;
  };

})(Handsontable);
