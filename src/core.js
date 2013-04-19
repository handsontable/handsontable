/**
 * Handsontable constructor
 * @param rootElement The jQuery element in which Handsontable DOM will be inserted
 * @param settings
 * @constructor
 */
Handsontable.Core = function (rootElement, settings) {
  this.rootElement = rootElement;
  this.guid = 'ht_' + Handsontable.helper.randomString(); //this is the namespace for global events

  if (!this.rootElement[0].id) {
    this.rootElement[0].id = this.guid; //if root element does not have an id, assign a random id
  }

  var priv, hooks, datamap, grid, selection, editproxy, autofill, self = this;

  priv = {
    settings: {},
    settingsFromDOM: {},
    selStart: (new Handsontable.SelectionPoint()),
    selEnd: (new Handsontable.SelectionPoint()),
    editProxy: false,
    isPopulated: null,
    scrollable: null,
    undoRedo: null,
    extensions: {},
    colToProp: null,
    propToCol: null,
    dataSchema: null,
    dataType: 'array',
    firstRun: true
  };

  hooks = {
    beforeInit: [],
    beforeRender: [],
    beforeGet: [],
    beforeSet: [],
    beforeGetCellMeta: [],

    afterInit: [],
    afterLoadData: [],
    afterRender: [],
    afterGetCellMeta: [],
    afterGetColHeader: [],
    afterGetColWidth: [],
    afterDestroy: [],

    onSelection: [],
    onSelectionByProp: [],
    onSelectionEnd: [],
    onSelectionEndByProp: [],
    onBeforeChange: [],
    onChange: [],
    onCopyLimit: [],
    onRemoveRow: []
  };

  datamap = {
    recursiveDuckSchema: function (obj) {
      var schema;
      if ($.isPlainObject(obj)) {
        schema = {};
        for (var i in obj) {
          if (obj.hasOwnProperty(i)) {
            if ($.isPlainObject(obj[i])) {
              schema[i] = datamap.recursiveDuckSchema(obj[i]);
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
              priv.colToProp.push(prop);
              priv.propToCol[prop] = lastCol;
              lastCol++;
            }
            else {
              lastCol = datamap.recursiveDuckColumns(schema[i], lastCol, i + '.');
            }
          }
        }
      }
      return lastCol;
    },

    createMap: function () {
      if (typeof datamap.getSchema() === "undefined") {
        throw new Error("trying to create `columns` definition but you didnt' provide `schema` nor `data`");
      }
      var i, ilen, schema = datamap.getSchema();
      priv.colToProp = [];
      priv.propToCol = {};
      if (priv.settings.columns) {
        for (i = 0, ilen = priv.settings.columns.length; i < ilen; i++) {
          priv.colToProp[i] = priv.settings.columns[i].data;
          priv.propToCol[priv.settings.columns[i].data] = i;
        }
      }
      else {
        datamap.recursiveDuckColumns(schema);
      }
    },

    colToProp: function (col) {
      col = Handsontable.PluginModifiers.run(self, 'col', col);
      if (priv.colToProp && typeof priv.colToProp[col] !== 'undefined') {
        return priv.colToProp[col];
      }
      else {
        return col;
      }
    },

    propToCol: function (prop) {
      var col;
      if (typeof priv.propToCol[prop] !== 'undefined') {
        col = priv.propToCol[prop];
      }
      else {
        col = prop;
      }
      col = Handsontable.PluginModifiers.run(self, 'col', col);
      return col;
    },

    getSchema: function () {
      if (priv.settings.dataSchema) {
        if (typeof priv.settings.dataSchema === 'function') {
          return priv.settings.dataSchema();
        }
        return priv.settings.dataSchema;
      }
      return priv.duckDataSchema;
    },

    /**
     * Creates row at the bottom of the data array
     * @param {Number} [index] Optional. Index of the row before which the new row will be inserted
     */
    createRow: function (index) {
      var row
        , rowCount = self.countRows();

      if (typeof index !== 'number' || index >= rowCount) {
        index = rowCount;
      }

      if (priv.dataType === 'array') {
        row = [];
        for (var c = 0, clen = self.countCols(); c < clen; c++) {
          row.push(null);
        }
      }
      else if (priv.dataType === 'function') {
        row = priv.settings.dataSchema(index);
      }
      else {
        row = $.extend(true, {}, datamap.getSchema());
      }
      if (priv.settings.onCreateRow) {
        priv.settings.onCreateRow(index, row);
      }
      if (index === rowCount) {
        priv.settings.data.push(row);
      }
      else {
        priv.settings.data.splice(index, 0, row);
      }
      self.forceFullRender = true; //used when data was changed
    },

    /**
     * Creates col at the right of the data array
     * @param {Object} [index] Optional. Index of the column before which the new column will be inserted
     */
    createCol: function (index) {
      if (priv.dataType === 'object' || priv.settings.columns) {
        throw new Error("Cannot create new column. When data source in an object, you can only have as much columns as defined in first data row, data schema or in the 'columns' setting");
      }
      var r = 0, rlen = self.countRows();
      if (typeof index !== 'number' || index >= self.countCols()) {
        for (; r < rlen; r++) {
          if (typeof priv.settings.data[r] === 'undefined') {
            priv.settings.data[r] = [];
          }
          priv.settings.data[r].push('');
        }
      }
      else {
        for (; r < rlen; r++) {
          priv.settings.data[r].splice(index, 0, '');
        }
      }
      self.forceFullRender = true; //used when data was changed
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
      priv.settings.data.splice(index, amount);
      self.forceFullRender = true; //used when data was changed
      self.runHooks('onRemoveRow', index, amount);
    },

    /**
     * Removes column from the data array
     * @param {Number} [index] Optional. Index of the column to be removed. If not provided, the last column will be removed
     * @param {Number} [amount] Optional. Amount of the columns to be removed. If not provided, one column will be removed
     */
    removeCol: function (index, amount) {
      if (priv.dataType === 'object' || priv.settings.columns) {
        throw new Error("cannot remove column with object data source or columns option specified");
      }
      if (!amount) {
        amount = 1;
      }
      if (typeof index !== 'number') {
        index = -amount;
      }
      for (var r = 0, rlen = self.countRows(); r < rlen; r++) {
        priv.settings.data[r].splice(index, amount);
      }
      self.forceFullRender = true; //used when data was changed
    },

    /**
     * Returns single value from the data array
     * @param {Number} row
     * @param {Number} prop
     */
    getVars: {},
    get: function (row, prop) {
      datamap.getVars.row = row;
      datamap.getVars.prop = prop;
      self.runHooks('beforeGet', datamap.getVars);
      if (typeof datamap.getVars.prop === 'string' && datamap.getVars.prop.indexOf('.') > -1) {
        var sliced = datamap.getVars.prop.split(".");
        var out = priv.settings.data[datamap.getVars.row];
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
      else if (typeof datamap.getVars.prop === 'function') {
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
        return datamap.getVars.prop(priv.settings.data.slice(
          datamap.getVars.row,
          datamap.getVars.row + 1
        )[0]);
      }
      else {
        return priv.settings.data[datamap.getVars.row] ? priv.settings.data[datamap.getVars.row][datamap.getVars.prop] : null;
      }
    },

    /**
     * Saves single value to the data array
     * @param {Number} row
     * @param {Number} prop
     * @param {String} value
     */
    setVars: {},
    set: function (row, prop, value) {
      datamap.setVars.row = row;
      datamap.setVars.prop = prop;
      datamap.setVars.value = value;
      self.runHooks('beforeSet', datamap.setVars);
      if (typeof datamap.setVars.prop === 'string' && datamap.setVars.prop.indexOf('.') > -1) {
        var sliced = datamap.setVars.prop.split(".");
        var out = priv.settings.data[datamap.setVars.row];
        for (var i = 0, ilen = sliced.length - 1; i < ilen; i++) {
          out = out[sliced[i]];
        }
        out[sliced[i]] = datamap.setVars.value;
      }
      else if (typeof datamap.setVars.prop === 'function') {
        /* see the `function` handler in `get` */
        datamap.setVars.prop(priv.settings.data.slice(
          datamap.setVars.row,
          datamap.setVars.row + 1
        )[0], datamap.setVars.value);
      }
      else {
        priv.settings.data[datamap.setVars.row][datamap.setVars.prop] = datamap.setVars.value;
      }
    },

    /**
     * Clears the data array
     */
    clear: function () {
      for (var r = 0; r < self.countRows(); r++) {
        for (var c = 0; c < self.countCols(); c++) {
          datamap.set(r, datamap.colToProp(c), '');
        }
      }
    },

    /**
     * Returns the data array
     * @return {Array}
     */
    getAll: function () {
      return priv.settings.data;
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
          row.push(datamap.get(r, datamap.colToProp(c)));
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
      return SheetClip.stringify(datamap.getRange(start, end));
    }
  };

  grid = {
    /**
     * Inserts or removes rows and columns
     * @param {String} action Possible values: "insert_row", "insert_col", "remove_row", "remove_col"
     * @param {Number} index
     * @param {Number} amount
     */
    alter: function (action, index, amount) {
      var oldData, newData, changes, r, rlen, c, clen, delta;
      oldData = $.extend(true, [], datamap.getAll());

      switch (action) {
        case "insert_row":
          if (!amount) {
            amount = 1;
          }
          delta = 0;
          while (delta < amount && self.countRows() < priv.settings.maxRows) {
            datamap.createRow(index);
            delta++;
          }
          if (delta) {
            if (priv.selStart.exists() && priv.selStart.row() >= index) {
              priv.selStart.row(priv.selStart.row() + delta);
              selection.transformEnd(delta, 0); //will call render() internally
            }
            else {
              selection.refreshBorders(); //it will call render and prepare methods
            }
          }
          break;

        case "insert_col":
          if (!amount) {
            amount = 1;
          }
          delta = 0;
          while (delta < amount && self.countCols() < priv.settings.maxCols) {
            datamap.createCol(index);
            delta++;
          }
          if (delta) {
            if (priv.selStart.exists() && priv.selStart.col() >= index) {
              priv.selStart.col(priv.selStart.col() + delta);
              selection.transformEnd(0, delta); //will call render() internally
            }
            else {
              selection.refreshBorders(); //it will call render and prepare methods
            }
          }
          break;

        case "remove_row":
          datamap.removeRow(index, amount);
          grid.keepEmptyRows();
          selection.refreshBorders(); //it will call render and prepare methods
          break;

        case "remove_col":
          datamap.removeCol(index, amount);
          grid.keepEmptyRows();
          selection.refreshBorders(); //it will call render and prepare methods
          break;

        default:
          throw Error('There is no such action "' + action + '"');
          break;
      }

      changes = [];
      newData = datamap.getAll();
      for (r = 0, rlen = newData.length; r < rlen; r++) {
        for (c = 0, clen = newData[r].length; c < clen; c++) {
          changes.push([r, c, oldData[r] ? oldData[r][c] : null, newData[r][c]]);
        }
      }
      self.runHooks('onChange', changes, 'alter');
      grid.keepEmptyRows(); //makes sure that we did not add rows that will be removed in next refresh
    },

    /**
     * Makes sure there are empty rows at the bottom of the table
     */
    keepEmptyRows: function () {
      var r, rlen, emptyRows = self.countEmptyRows(true), emptyCols;

      //should I add empty rows to data source to meet minRows?
      rlen = self.countRows();
      if (rlen < priv.settings.minRows) {
        for (r = 0; r < priv.settings.minRows - rlen; r++) {
          datamap.createRow();
        }
      }

      //should I add empty rows to meet minSpareRows?
      if (emptyRows < priv.settings.minSpareRows) {
        for (; emptyRows < priv.settings.minSpareRows && self.countRows() < priv.settings.maxRows; emptyRows++) {
          datamap.createRow();
        }
      }

      //count currently empty cols
      emptyCols = self.countEmptyCols(true);

      //should I add empty cols to meet minCols?
      if (!priv.settings.columns && self.countCols() < priv.settings.minCols) {
        for (; self.countCols() < priv.settings.minCols; emptyCols++) {
          datamap.createCol();
        }
      }

      //should I add empty cols to meet minSpareCols?
      if (!priv.settings.columns && priv.dataType === 'array' && emptyCols < priv.settings.minSpareCols) {
        for (; emptyCols < priv.settings.minSpareCols && self.countCols() < priv.settings.maxCols; emptyCols++) {
          datamap.createCol();
        }
      }

      if (priv.settings.enterBeginsEditing) {
        for (; (((priv.settings.minRows || priv.settings.minSpareRows) && self.countRows() > priv.settings.minRows) && (priv.settings.minSpareRows && emptyRows > priv.settings.minSpareRows)); emptyRows--) {
          datamap.removeRow();
        }
      }

      if (priv.settings.enterBeginsEditing && !priv.settings.columns) {
        for (; (((priv.settings.minCols || priv.settings.minSpareCols) && self.countCols() > priv.settings.minCols) && (priv.settings.minSpareCols && emptyCols > priv.settings.minSpareCols)); emptyCols--) {
          datamap.removeCol();
        }
      }

      var rowCount = self.countRows();
      var colCount = self.countCols();

      if (rowCount === 0 || colCount === 0) {
        selection.deselect();
      }

      if (priv.selStart.exists()) {
        var selectionChanged;
        var fromRow = priv.selStart.row();
        var fromCol = priv.selStart.col();
        var toRow = priv.selEnd.row();
        var toCol = priv.selEnd.col();

        //if selection is outside, move selection to last row
        if (fromRow > rowCount - 1) {
          fromRow = rowCount - 1;
          selectionChanged = true;
          if (toRow > fromRow) {
            toRow = fromRow;
          }
        } else if (toRow > rowCount - 1) {
          toRow = rowCount - 1;
          selectionChanged = true;
          if (fromRow > toRow) {
            fromRow = toRow;
          }
        }

        //if selection is outside, move selection to last row
        if (fromCol > colCount - 1) {
          fromCol = colCount - 1;
          selectionChanged = true;
          if (toCol > fromCol) {
            toCol = fromCol;
          }
        } else if (toCol > colCount - 1) {
          toCol = colCount - 1;
          selectionChanged = true;
          if (fromCol > toCol) {
            fromCol = toCol;
          }
        }

        if (selectionChanged) {
          self.selectCell(fromRow, fromCol, toRow, toCol);
        }
      }
    },

    /**
     * Populate cells at position with 2d array
     * @param {Object} start Start selection position
     * @param {Array} input 2d array
     * @param {Object} [end] End selection position (only for drag-down mode)
     * @param {String} [source="populateFromArray"]
     * @return {Object|undefined} ending td in pasted area (only if any cell was changed)
     */
    populateFromArray: function (start, input, end, source) {
      var r, rlen, c, clen, setData = [], current = {};
      rlen = input.length;
      if (rlen === 0) {
        return false;
      }
      current.row = start.row;
      current.col = start.col;
      for (r = 0; r < rlen; r++) {
        if ((end && current.row > end.row) || (!priv.settings.minSpareRows && current.row > self.countRows() - 1) || (current.row >= priv.settings.maxRows)) {
          break;
        }
        current.col = start.col;
        clen = input[r] ? input[r].length : 0;
        for (c = 0; c < clen; c++) {
          if ((end && current.col > end.col) || (!priv.settings.minSpareCols && current.col > self.countCols() - 1) || (current.col >= priv.settings.maxCols)) {
            break;
          }
          if (self.getCellMeta(current.row, current.col).isWritable) {
            setData.push([current.row, current.col, input[r][c]]);
          }
          current.col++;
          if (end && c === clen - 1) {
            c = -1;
          }
        }
        current.row++;
        if (end && r === rlen - 1) {
          r = -1;
        }
      }
      self.setDataAtCell(setData, null, null, source || 'populateFromArray');
    },

    /**
     * Returns the top left (TL) and bottom right (BR) selection coordinates
     * @param {Object[]} coordsArr
     * @returns {Object}
     */
    getCornerCoords: function (coordsArr) {
      function mapProp(func, array, prop) {
        function getProp(el) {
          return el[prop];
        }

        if (Array.prototype.map) {
          return func.apply(Math, array.map(getProp));
        }
        return func.apply(Math, $.map(array, getProp));
      }

      return {
        TL: {
          row: mapProp(Math.min, coordsArr, "row"),
          col: mapProp(Math.min, coordsArr, "col")
        },
        BR: {
          row: mapProp(Math.max, coordsArr, "row"),
          col: mapProp(Math.max, coordsArr, "col")
        }
      };
    },

    /**
     * Returns array of td objects given start and end coordinates
     */
    getCellsAtCoords: function (start, end) {
      var corners = grid.getCornerCoords([start, end]);
      var r, c, output = [];
      for (r = corners.TL.row; r <= corners.BR.row; r++) {
        for (c = corners.TL.col; c <= corners.BR.col; c++) {
          output.push(self.view.getCellAtCoords({
            row: r,
            col: c
          }));
        }
      }
      return output;
    }
  };

  this.selection = selection = { //this public assignment is only temporary
    inProgress: false,

    /**
     * Sets inProgress to true. This enables onSelectionEnd and onSelectionEndByProp to function as desired
     */
    begin: function () {
      self.selection.inProgress = true;
    },

    /**
     * Sets inProgress to false. Triggers onSelectionEnd and onSelectionEndByProp
     */
    finish: function () {
      var sel = self.getSelected();
      self.runHooks("onSelectionEnd", sel[0], sel[1], sel[2], sel[3]);
      self.runHooks("onSelectionEndByProp", sel[0], self.colToProp(sel[1]), sel[2], self.colToProp(sel[3]));
      self.selection.inProgress = false;
    },

    isInProgress: function () {
      return self.selection.inProgress;
    },

    /**
     * Starts selection range on given td object
     * @param {Object} coords
     */
    setRangeStart: function (coords) {
      priv.selStart.coords(coords);
      selection.setRangeEnd(coords);
    },

    /**
     * Ends selection range on given td object
     * @param {Object} coords
     * @param {Boolean} [scrollToCell=true] If true, viewport will be scrolled to range end
     */
    setRangeEnd: function (coords, scrollToCell) {
      self.selection.begin();

      priv.selEnd.coords(coords);
      if (!priv.settings.multiSelect) {
        priv.selStart.coords(coords);
      }

      //set up current selection
      self.view.wt.selections.current.clear();
      self.view.wt.selections.current.add(priv.selStart.arr());

      //set up area selection
      self.view.wt.selections.area.clear();
      if (selection.isMultiple()) {
        self.view.wt.selections.area.add(priv.selStart.arr());
        self.view.wt.selections.area.add(priv.selEnd.arr());
      }

      //set up highlight
      if (priv.settings.currentRowClassName || priv.settings.currentColClassName) {
      self.view.wt.selections.highlight.clear();
        self.view.wt.selections.highlight.add(priv.selStart.arr());
        self.view.wt.selections.highlight.add(priv.selEnd.arr());
      }

      //trigger handlers
      self.runHooks("onSelection", priv.selStart.row(), priv.selStart.col(), priv.selEnd.row(), priv.selEnd.col());
      self.runHooks("onSelectionByProp", priv.selStart.row(), datamap.colToProp(priv.selStart.col()), priv.selEnd.row(), datamap.colToProp(priv.selEnd.col()));
      if (scrollToCell !== false) {
        self.view.scrollViewport(coords);

        self.view.wt.draw(true); //these two lines are needed to fix scrolling viewport when cell dimensions are significantly bigger than assumed by Walkontable
        self.view.scrollViewport(coords);
      }
      selection.refreshBorders();
    },

    /**
     * Destroys editor, redraws borders around cells, prepares editor
     * @param {Boolean} revertOriginal
     * @param {Boolean} keepEditor
     */
    refreshBorders: function (revertOriginal, keepEditor) {
      if (!keepEditor) {
        editproxy.destroy(revertOriginal);
      }
      self.view.render();
      if (selection.isSelected() && !keepEditor) {
        editproxy.prepare();
      }
    },

    /**
     * Returns information if we have a multiselection
     * @return {Boolean}
     */
    isMultiple: function () {
      return !(priv.selEnd.col() === priv.selStart.col() && priv.selEnd.row() === priv.selStart.row());
    },

    /**
     * Selects cell relative to current cell (if possible)
     */
    transformStart: function (rowDelta, colDelta, force) {
      if (priv.selStart.row() + rowDelta > self.countRows() - 1) {
        if (force && priv.settings.minSpareRows > 0) {
          self.alter("insert_row", self.countRows());
        }
        else if (priv.settings.autoWrapCol && priv.selStart.col() + colDelta < self.countCols() - 1) {
          rowDelta = 1 - self.countRows();
          colDelta = 1;
        }
      }
      else if (priv.settings.autoWrapCol && priv.selStart.row() + rowDelta < 0 && priv.selStart.col() + colDelta >= 0) {
        rowDelta = self.countRows() - 1;
        colDelta = -1;
      }
      if (priv.selStart.col() + colDelta > self.countCols() - 1) {
        if (force && priv.settings.minSpareCols > 0) {
          self.alter("insert_col", self.countCols());
        }
        else if (priv.settings.autoWrapRow && priv.selStart.row() + rowDelta < self.countRows() - 1) {
          rowDelta = 1;
          colDelta = 1 - self.countCols();
        }
      }
      else if (priv.settings.autoWrapRow && priv.selStart.col() + colDelta < 0 && priv.selStart.row() + rowDelta >= 0) {
        rowDelta = -1;
        colDelta = self.countCols() - 1;
      }

      var totalRows = self.countRows();
      var totalCols = self.countCols();
      var coords = {
        row: (priv.selStart.row() + rowDelta),
        col: priv.selStart.col() + colDelta
      };

      if (coords.row < 0) {
        coords.row = 0;
      }
      else if (coords.row > 0 && coords.row >= totalRows) {
        coords.row = totalRows - 1;
      }

      if (coords.col < 0) {
        coords.col = 0;
      }
      else if (coords.col > 0 && coords.col >= totalCols) {
        coords.col = totalCols - 1;
      }

      selection.setRangeStart(coords);
    },

    /**
     * Sets selection end cell relative to current selection end cell (if possible)
     */
    transformEnd: function (rowDelta, colDelta) {
      if (priv.selEnd.exists()) {
        var totalRows = self.countRows();
        var totalCols = self.countCols();
        var coords = {
          row: priv.selEnd.row() + rowDelta,
          col: priv.selEnd.col() + colDelta
        };

        if (coords.row < 0) {
          coords.row = 0;
        }
        else if (coords.row > 0 && coords.row >= totalRows) {
          coords.row = totalRows - 1;
        }

        if (coords.col < 0) {
          coords.col = 0;
        }
        else if (coords.col > 0 && coords.col >= totalCols) {
          coords.col = totalCols - 1;
        }

        selection.setRangeEnd(coords);
      }
    },

    /**
     * Returns true if currently there is a selection on screen, false otherwise
     * @return {Boolean}
     */
    isSelected: function () {
      return priv.selEnd.exists();
    },

    /**
     * Returns true if coords is within current selection coords
     * @return {Boolean}
     */
    inInSelection: function (coords) {
      if (!selection.isSelected()) {
        return false;
      }
      var sel = grid.getCornerCoords([priv.selStart.coords(), priv.selEnd.coords()]);
      return (sel.TL.row <= coords.row && sel.BR.row >= coords.row && sel.TL.col <= coords.col && sel.BR.col >= coords.col);
    },

    /**
     * Deselects all selected cells
     */
    deselect: function () {
      if (!selection.isSelected()) {
        return;
      }
      self.selection.inProgress = false; //needed by HT inception
      priv.selEnd = new Handsontable.SelectionPoint(); //create new empty point to remove the existing one
      self.view.wt.selections.current.clear();
      self.view.wt.selections.area.clear();
      editproxy.destroy();
      selection.refreshBorders();
      self.rootElement.triggerHandler('deselect.handsontable');
    },

    /**
     * Select all cells
     */
    selectAll: function () {
      if (!priv.settings.multiSelect) {
        return;
      }
      selection.setRangeStart({
        row: 0,
        col: 0
      });
      selection.setRangeEnd({
        row: self.countRows() - 1,
        col: self.countCols() - 1
      }, false);
    },

    /**
     * Deletes data from selected cells
     */
    empty: function () {
      if (!selection.isSelected()) {
        return;
      }
      var corners = grid.getCornerCoords([priv.selStart.coords(), priv.selEnd.coords()]);
      var r, c, changes = [];
      for (r = corners.TL.row; r <= corners.BR.row; r++) {
        for (c = corners.TL.col; c <= corners.BR.col; c++) {
          if (self.getCellMeta(r, c).isWritable) {
            changes.push([r, c, '']);
          }
        }
      }
      self.setDataAtCell(changes);
    }
  };

  this.autofill = autofill = { //this public assignment is only temporary
    handle: null,

    /**
     * Create fill handle and fill border objects
     */
    init: function () {
      if (!autofill.handle) {
        autofill.handle = {};
      }
      else {
        autofill.handle.disabled = false;
      }
    },

    /**
     * Hide fill handle and fill border permanently
     */
    disable: function () {
      autofill.handle.disabled = true;
    },

    /**
     * Selects cells down to the last row in the left column, then fills down to that cell
     */
    selectAdjacent: function () {
      var select, data, r, maxR, c;

      if (selection.isMultiple()) {
        select = self.view.wt.selections.area.getCorners();
      }
      else {
        select = self.view.wt.selections.current.getCorners();
      }

      data = datamap.getAll();
      rows : for (r = select[2] + 1; r < self.countRows(); r++) {
        for (c = select[1]; c <= select[3]; c++) {
          if (data[r][c]) {
            break rows;
          }
        }
        if (!!data[r][select[1] - 1] || !!data[r][select[3] + 1]) {
          maxR = r;
        }
      }
      if (maxR) {
        self.view.wt.selections.fill.clear();
        self.view.wt.selections.fill.add([select[0], select[1]]);
        self.view.wt.selections.fill.add([maxR, select[3]]);
        autofill.apply();
      }
    },

    /**
     * Apply fill values to the area in fill border, omitting the selection border
     */
    apply: function () {
      var drag, select, start, end;

      autofill.handle.isDragged = 0;

      drag = self.view.wt.selections.fill.getCorners();
      if (!drag) {
        return;
      }

      self.view.wt.selections.fill.clear();

      if (selection.isMultiple()) {
        select = self.view.wt.selections.area.getCorners();
      }
      else {
        select = self.view.wt.selections.current.getCorners();
      }

      if (drag[0] === select[0] && drag[1] < select[1]) {
        start = {
          row: drag[0],
          col: drag[1]
        };
        end = {
          row: drag[2],
          col: select[1] - 1
        };
      }
      else if (drag[0] === select[0] && drag[3] > select[3]) {
        start = {
          row: drag[0],
          col: select[3] + 1
        };
        end = {
          row: drag[2],
          col: drag[3]
        };
      }
      else if (drag[0] < select[0] && drag[1] === select[1]) {
        start = {
          row: drag[0],
          col: drag[1]
        };
        end = {
          row: select[0] - 1,
          col: drag[3]
        };
      }
      else if (drag[2] > select[2] && drag[1] === select[1]) {
        start = {
          row: select[2] + 1,
          col: drag[1]
        };
        end = {
          row: drag[2],
          col: drag[3]
        };
      }

      if (start) {
        grid.populateFromArray(start, SheetClip.parse(datamap.getText(priv.selStart.coords(), priv.selEnd.coords())), end, 'autofill');

        selection.setRangeStart({row: drag[0], col: drag[1]});
        selection.setRangeEnd({row: drag[2], col: drag[3]});
      }
      /*else {
       //reset to avoid some range bug
       selection.refreshBorders();
       }*/
    },

    /**
     * Show fill border
     */
    showBorder: function (coords) {
      coords.row = coords[0];
      coords.col = coords[1];

      var corners = grid.getCornerCoords([priv.selStart.coords(), priv.selEnd.coords()]);
      if (priv.settings.fillHandle !== 'horizontal' && (corners.BR.row < coords.row || corners.TL.row > coords.row)) {
        coords = [coords.row, corners.BR.col];
      }
      else if (priv.settings.fillHandle !== 'vertical') {
        coords = [corners.BR.row, coords.col];
      }
      else {
        return; //wrong direction
      }

      self.view.wt.selections.fill.clear();
      self.view.wt.selections.fill.add([priv.selStart.coords().row, priv.selStart.coords().col]);
      self.view.wt.selections.fill.add([priv.selEnd.coords().row, priv.selEnd.coords().col]);
      self.view.wt.selections.fill.add(coords);
      self.view.render();
    }
  };

  editproxy = { //this public assignment is only temporary
    /**
     * Create input field
     */
    init: function () {
      function onCut() {
        selection.empty();
      }

      function onPaste(str) {
        self.addOnceHook('onChange', function (changes, source) {
          if (changes.length) {
            var last = changes[changes.length - 1];
            selection.setRangeEnd({row: last[0], col: self.propToCol(last[1])});
          }
        });

        var input = str.replace(/^[\r\n]*/g, '').replace(/[\r\n]*$/g, ''), //remove newline from the start and the end of the input
          inputArray = SheetClip.parse(input),
          coords = grid.getCornerCoords([priv.selStart.coords(), priv.selEnd.coords()]);

        grid.populateFromArray(coords.TL, inputArray, {
          row: Math.max(coords.BR.row, inputArray.length - 1 + coords.TL.row),
          col: Math.max(coords.BR.col, inputArray[0].length - 1 + coords.TL.col)
        }, 'paste');
      }

      var $body = $(document.body);

      function onKeyDown(event) {
        if (priv.settings.beforeOnKeyDown) {
          priv.settings.beforeOnKeyDown.call(self, event);
        }

        if ($body.children('.context-menu-list:visible').length) {
          return;
        }

        if (event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) {
          //when CTRL is pressed, prepare selectable text in textarea
          //http://stackoverflow.com/questions/3902635/how-does-one-capture-a-macs-command-key-via-javascript
          editproxy.setCopyableText();
          return;
        }

        priv.lastKeyCode = event.keyCode;
        if (selection.isSelected()) {
          var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
          if (Handsontable.helper.isPrintableChar(event.keyCode) && ctrlDown) {
            if (event.keyCode === 65) { //CTRL + A
              selection.selectAll(); //select all cells
              editproxy.setCopyableText();
              event.preventDefault();
            }
            else if (event.keyCode === 89 || (event.shiftKey && event.keyCode === 90)) { //CTRL + Y or CTRL + SHIFT + Z
              priv.undoRedo && priv.undoRedo.redo();
            }
            else if (event.keyCode === 90) { //CTRL + Z
              priv.undoRedo && priv.undoRedo.undo();
            }
            return;
          }

          var rangeModifier = event.shiftKey ? selection.setRangeEnd : selection.setRangeStart;

          switch (event.keyCode) {
            case 38: /* arrow up */
              if (event.shiftKey) {
                selection.transformEnd(-1, 0);
              }
              else {
                selection.transformStart(-1, 0);
              }
              event.preventDefault();
              event.stopPropagation(); //required by HandsontableEditor
              break;

            case 9: /* tab */
              var tabMoves = typeof priv.settings.tabMoves === 'function' ? priv.settings.tabMoves(event) : priv.settings.tabMoves;
              if (event.shiftKey) {
                selection.transformStart(-tabMoves.row, -tabMoves.col); //move selection left
              }
              else {
                selection.transformStart(tabMoves.row, tabMoves.col, true); //move selection right (add a new column if needed)
              }
              event.preventDefault();
              event.stopPropagation(); //required by HandsontableEditor
              break;

            case 39: /* arrow right */
              if (event.shiftKey) {
                selection.transformEnd(0, 1);
              }
              else {
                selection.transformStart(0, 1);
              }
              event.preventDefault();
              event.stopPropagation(); //required by HandsontableEditor
              break;

            case 37: /* arrow left */
              if (event.shiftKey) {
                selection.transformEnd(0, -1);
              }
              else {
                selection.transformStart(0, -1);
              }
              event.preventDefault();
              event.stopPropagation(); //required by HandsontableEditor
              break;

            case 8: /* backspace */
            case 46: /* delete */
              selection.empty(event);
              event.preventDefault();
              break;

            case 40: /* arrow down */
              if (event.shiftKey) {
                selection.transformEnd(1, 0); //expanding selection down with shift
              }
              else {
                selection.transformStart(1, 0); //move selection down
              }
              event.preventDefault();
              event.stopPropagation(); //required by HandsontableEditor
              break;

            case 113: /* F2 */
              event.preventDefault(); //prevent Opera from opening Go to Page dialog
              break;

            case 13: /* return/enter */
              var enterMoves = typeof priv.settings.enterMoves === 'function' ? priv.settings.enterMoves(event) : priv.settings.enterMoves;
              if (event.shiftKey) {
                selection.transformStart(-enterMoves.row, -enterMoves.col); //move selection up
              }
              else {
                selection.transformStart(enterMoves.row, enterMoves.col, true); //move selection down (add a new row if needed)
              }
              event.preventDefault(); //don't add newline to field
              break;

            case 36: /* home */
              if (event.ctrlKey || event.metaKey) {
                rangeModifier({row: 0, col: priv.selStart.col()});
              }
              else {
                rangeModifier({row: priv.selStart.row(), col: 0});
              }
              event.preventDefault(); //don't scroll the window
              event.stopPropagation(); //required by HandsontableEditor
              break;

            case 35: /* end */
              if (event.ctrlKey || event.metaKey) {
                rangeModifier({row: self.countRows() - 1, col: priv.selStart.col()});
              }
              else {
                rangeModifier({row: priv.selStart.row(), col: self.countCols() - 1});
              }
              event.preventDefault(); //don't scroll the window
              event.stopPropagation(); //required by HandsontableEditor
              break;

            case 33: /* pg up */
              selection.transformStart(-self.countVisibleRows(), 0);
              self.view.wt.scrollVertical(-self.countVisibleRows());
              self.view.render();
              event.preventDefault(); //don't page up the window
              event.stopPropagation(); //required by HandsontableEditor
              break;

            case 34: /* pg down */
              selection.transformStart(self.countVisibleRows(), 0);
              self.view.wt.scrollVertical(self.countVisibleRows());
              self.view.render();
              event.preventDefault(); //don't page down the window
              event.stopPropagation(); //required by HandsontableEditor
              break;

            default:
              break;
          }
        }
      }

      self.copyPaste = new CopyPaste(self.rootElement[0]);
      self.copyPaste.onCut(onCut);
      self.copyPaste.onPaste(onPaste);
      self.rootElement.on('keydown.handsontable.' + self.guid, onKeyDown);
    },

    /**
     * Destroy current editor, if exists
     * @param {Boolean} revertOriginal
     */
    destroy: function (revertOriginal) {
      if (typeof priv.editorDestroyer === "function") {
        var destroyer = priv.editorDestroyer; //this copy is needed, otherwise destroyer can enter an infinite loop
        priv.editorDestroyer = null;
        destroyer(revertOriginal);
      }
    },

    /**
     * Prepares copyable text in the invisible textarea
     */
    setCopyableText: function () {
      var startRow = Math.min(priv.selStart.row(), priv.selEnd.row());
      var startCol = Math.min(priv.selStart.col(), priv.selEnd.col());
      var endRow = Math.max(priv.selStart.row(), priv.selEnd.row());
      var endCol = Math.max(priv.selStart.col(), priv.selEnd.col());
      var finalEndRow = Math.min(endRow, startRow + priv.settings.copyRowsLimit - 1);
      var finalEndCol = Math.min(endCol, startCol + priv.settings.copyColsLimit - 1);

      self.copyPaste.copyable(datamap.getText({row: startRow, col: startCol}, {row: finalEndRow, col: finalEndCol}));

      if (endRow !== finalEndRow || endCol !== finalEndCol) {
        self.runHooks("onCopyLimit", endRow - startRow + 1, endCol - startCol + 1, priv.settings.copyRowsLimit, priv.settings.copyColsLimit);
      }
    },

    /**
     * Prepare text input to be displayed at given grid cell
     */
    prepare: function () {
      if (!self.getCellMeta(priv.selStart.row(), priv.selStart.col()).isWritable) {
        return;
      }

      self.listen();
      var TD = self.view.getCellAtCoords(priv.selStart.coords());
      priv.editorDestroyer = self.view.applyCellTypeMethod('editor', TD, priv.selStart.row(), priv.selStart.col());
      //presumably TD can be removed from here. Cell editor should also listen for changes if editable cell is outside from viewport
    }
  };

  this.init = function () {
    self.runHooks('beforeInit');
    editproxy.init();

    this.updateSettings(settings);
    this.parseSettingsFromDOM();
    this.focusCatcher = new Handsontable.FocusCatcher(this);
    this.view = new Handsontable.TableView(this);

    this.forceFullRender = true; //used when data was changed
    this.view.render();

    if (typeof priv.firstRun === 'object') {
      self.runHooks('onChange', priv.firstRun[0], priv.firstRun[1]);
      priv.firstRun = false;
    }
    self.runHooks('afterInit');
  };

  function validateChanges(changes, source) {
    var validated = $.Deferred();
    var deferreds = [];

    //validate strict autocompletes
    var process = function (i) {
      var deferred = $.Deferred();
      deferreds.push(deferred);

      var originalVal = changes[i][3];
      var lowercaseVal = typeof originalVal === 'string' ? originalVal.toLowerCase() : null;

      return function (source) {
        var found = false;
        for (var s = 0, slen = source.length; s < slen; s++) {
          if (originalVal === source[s]) {
            found = true; //perfect match
            break;
          }
          else if (lowercaseVal === source[s].toLowerCase()) {
            changes[i][3] = source[s]; //good match, fix the case
            found = true;
            break;
          }
        }
        if (!found) {
          changes[i] = null;
        }
        deferred.resolve();
      }
    };

    for (var i = changes.length - 1; i >= 0; i--) {
      var cellProperties = self.getCellMeta(changes[i][0], datamap.propToCol(changes[i][1]));
      if (cellProperties.strict && cellProperties.source) {
        $.isFunction(cellProperties.source) ? cellProperties.source(changes[i][3], process(i)) : process(i)(cellProperties.source);
      }
    }

    $.when.apply($, deferreds).then(function () {
      for (var i = changes.length - 1; i >= 0; i--) {
        if (changes[i] === null) {
          changes.splice(i, 1);
        } else {
          var cellProperties = self.getCellMeta(changes[i][0], datamap.propToCol(changes[i][1]));

          if (cellProperties.dataType === 'number' && typeof changes[i][3] === 'string') {
            if (changes[i][3].length > 0 && /^[0-9\s]*[.]*[0-9]*$/.test(changes[i][3])) {
              changes[i][3] = numeral().unformat(changes[i][3] || '0'); //numeral cannot unformat empty string
            }
          }
        }
      }

      if (changes.length) {
        var result = self.runHooks("onBeforeChange", changes, source);
        if (typeof result === 'function') {
          $.when(result).then(function () {
            validated.resolve();
          });
        }
        else {
          if (result === false) {
            changes.splice(0, changes.length); //invalidate all changes (remove everything from array)
          }
          validated.resolve();
        }
      }
      else {
        validated.resolve();
      }
    });

    return $.when(validated);
  }

  var fireEvent = function (name, params) {
    self.rootElement.triggerHandler(name, params);
  };

  /**
   * Internal function to apply changes. Called after validateChanges
   * @param {Array} changes Array in form of [row, prop, oldValue, newValue]
   * @param {String} source String that identifies how this change will be described in changes array (useful in onChange callback)
   */
  function applyChanges(changes, source) {
    var i = 0
      , ilen = changes.length;

    if (!ilen) {
      return;
    }

    while (i < ilen) {
      if (priv.settings.minSpareRows) {
        while (changes[i][0] > self.countRows() - 1) {
          datamap.createRow();
        }
      }
      if (priv.dataType === 'array' && priv.settings.minSpareCols) {
        while (datamap.propToCol(changes[i][1]) > self.countCols() - 1) {
          datamap.createCol();
        }
      }
      datamap.set(changes[i][0], changes[i][1], changes[i][3]);
      i++;
    }
    self.forceFullRender = true; //used when data was changed
    grid.keepEmptyRows();
    selection.refreshBorders();
    self.runHooks('onChange', changes, source || 'edit');
  }

  function setDataInputToArray(arg0, arg1, arg2) {
    if (typeof arg0 === "object") { //is it an array of changes
      return arg0;
    }
    else if ($.isPlainObject(arg2)) { //backwards compatibility
      return value;
    }
    else {
      return [
        [arg0, arg1, arg2]
      ];
    }
  }

  /**
   * Set data at given cell
   * @public
   * @param {Number|Array} row or array of changes in format [[row, col, value], ...]
   * @param {Number} col
   * @param {String} value
   * @param {String} source String that identifies how this change will be described in changes array (useful in onChange callback)
   */
  this.setDataAtCell = function (row, col, value, source) {
    var input = setDataInputToArray(row, col, value)
      , i
      , ilen
      , changes = []
      , prop;

    for (i = 0, ilen = input.length; i < ilen; i++) {
      if (typeof input[i][1] !== 'number') {
        throw new Error('Method `setDataAtCell` accepts row and column number as its parameters. If you want to use object property name, use method `setDataAtRowProp`');
      }
      prop = datamap.colToProp(input[i][1]);
      changes.push([
        input[i][0],
        prop,
        datamap.get(input[i][0], prop),
        input[i][2]
      ]);
    }

    validateChanges(changes, source).then(function () {
      applyChanges(changes, source);
    });
  };


  /**
   * Set data at given row property
   * @public
   * @param {Number|Array} row or array of changes in format [[row, prop, value], ...]
   * @param {Number} prop
   * @param {String} value
   * @param {String} source String that identifies how this change will be described in changes array (useful in onChange callback)
   */
  this.setDataAtRowProp = function (row, prop, value, source) {
    var input = setDataInputToArray(row, prop, value)
      , i
      , ilen
      , changes = [];

    for (i = 0, ilen = input.length; i < ilen; i++) {
      changes.push([
        input[i][0],
        input[i][1],
        datamap.get(input[i][0], input[i][1]),
        input[i][2]
      ]);
    }

    validateChanges(changes, source).then(function () {
      applyChanges(changes, source);
    });
  };

  /**
   * Listen to keyboard input
   */
  this.listen = function () {
    self.focusCatcher.listen();
  };

  /**
   * Destroys current editor, renders and selects current cell. If revertOriginal != true, edited data is saved
   * @param {Boolean} revertOriginal
   */
  this.destroyEditor = function (revertOriginal) {
    selection.refreshBorders(revertOriginal);
  };

  /**
   * Populate cells at position with 2d array
   * @param {Object} start Start selection position
   * @param {Array} input 2d array
   * @param {Object} [end] End selection position (only for drag-down mode)
   * @param {String} [source="populateFromArray"]
   * @return {Object|undefined} ending td in pasted area (only if any cell was changed)
   */
  this.populateFromArray = function (start, input, end, source) {
    return grid.populateFromArray(start, input, end, source);
  };

  /**
   * Returns the top left (TL) and bottom right (BR) selection coordinates
   * @param {Object[]} coordsArr
   * @returns {Object}
   */
  this.getCornerCoords = function (coordsArr) {
    return grid.getCornerCoords(coordsArr);
  };

  /**
   * Returns current selection. Returns undefined if there is no selection.
   * @public
   * @return {Array} [`startRow`, `startCol`, `endRow`, `endCol`]
   */
  this.getSelected = function () { //https://github.com/warpech/jquery-handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return [priv.selStart.row(), priv.selStart.col(), priv.selEnd.row(), priv.selEnd.col()];
    }
  };

  /**
   * Parse settings from DOM and CSS
   * @public
   */
  this.parseSettingsFromDOM = function () {
    var overflow = this.rootElement.css('overflow');
    if (overflow === 'scroll' || overflow === 'auto') {
      this.rootElement[0].style.overflow = 'visible';
      priv.settingsFromDOM.overflow = overflow;
    }
    else if (priv.settings.width === void 0 || priv.settings.height === void 0) {
      priv.settingsFromDOM.overflow = 'auto';
    }

    if (priv.settings.width === void 0) {
      priv.settingsFromDOM.width = this.rootElement.width();
    }
    else {
      priv.settingsFromDOM.width = void 0;
    }

    priv.settingsFromDOM.height = void 0;
    if (priv.settings.height === void 0) {
      if (priv.settingsFromDOM.overflow === 'scroll' || priv.settingsFromDOM.overflow === 'auto') {
        var computedHeight = this.rootElement.height();
        if (computedHeight > 0) {
          priv.settingsFromDOM.height = computedHeight;
        }
      }
    }
  };

  /**
   * Render visible data
   * @public
   */
  this.render = function () {
    if (self.view) {
      self.forceFullRender = true; //used when data was changed
      selection.refreshBorders(null, true);
    }
  };

  /**
   * Load data from array
   * @public
   * @param {Array} data
   */
  this.loadData = function (data) {
    if (!(data instanceof Array)) {
      throw new Error("loadData only accepts array of objects or array of arrays (" + typeof data + " given)");
    }

    priv.isPopulated = false;
    priv.settings.data = data;
    if (priv.settings.dataSchema instanceof Array || data[0]  instanceof Array) {
      priv.dataType = 'array';
    }
    else if ($.isFunction(priv.settings.dataSchema)) {
      priv.dataType = 'function';
    }
    else {
      priv.dataType = 'object';
    }
    if (data[0]) {
      priv.duckDataSchema = datamap.recursiveDuckSchema(data[0]);
    }
    else {
      priv.duckDataSchema = {};
    }
    datamap.createMap();

    grid.keepEmptyRows();
    self.runHooks('afterLoadData');

    if (priv.firstRun) {
      priv.firstRun = [null, 'loadData'];
    }
    else {
      self.runHooks('onChange', null, 'loadData');
      self.render();
    }
    priv.isPopulated = true;
    self.clearUndo();
  };

  /**
   * Return the current data object (the same that was passed by `data` configuration option or `loadData` method). Optionally you can provide cell range `r`, `c`, `r2`, `c2` to get only a fragment of grid data
   * @public
   * @param {Number} r (Optional) From row
   * @param {Number} c (Optional) From col
   * @param {Number} r2 (Optional) To row
   * @param {Number} c2 (Optional) To col
   * @return {Array|Object}
   */
  this.getData = function (r, c, r2, c2) {
    if (typeof r === 'undefined') {
      return datamap.getAll();
    }
    else {
      return datamap.getRange({row: r, col: c}, {row: r2, col: c2});
    }
  };

  /**
   * Update settings
   * @public
   */
  this.updateSettings = function (settings) {
    var i;

    if (typeof settings.rows !== "undefined") {
      throw new Error("'rows' setting is no longer supported. do you mean startRows, minRows or maxRows?");
    }
    if (typeof settings.cols !== "undefined") {
      throw new Error("'cols' setting is no longer supported. do you mean startCols, minCols or maxCols?");
    }

    if (typeof settings.undo !== "undefined") {
      if (priv.undoRedo && settings.undo === false) {
        priv.undoRedo = null;
      }
      else if (!priv.undoRedo && settings.undo === true) {
        priv.undoRedo = new Handsontable.UndoRedo(self);
      }
    }

    for (i in settings) {
      if (i === 'data') {
        continue; //loadData will be triggered later
      }
      else if (settings.hasOwnProperty(i)) {
        if (i in hooks) {
          self.addHook(i, settings[i]);
        }
        else {
          priv.settings[i] = settings[i];

          //launch extensions
          if (Handsontable.extension[i]) {
            priv.extensions[i] = new Handsontable.extension[i](self, settings[i]);
          }
        }
      }
    }

    if (settings.data === void 0 && priv.settings.data === void 0) {
      var data = [];
      var row;
      for (var r = 0, rlen = priv.settings.startRows; r < rlen; r++) {
        row = [];
        for (var c = 0, clen = priv.settings.startCols; c < clen; c++) {
          row.push(null);
        }
        data.push(row);
      }
      self.loadData(data); //data source created just now
    }
    else if (settings.data !== void 0) {
      self.loadData(settings.data); //data source given as option
    }
    else if (settings.columns !== void 0) {
      datamap.createMap();
    }

    if (typeof settings.fillHandle !== "undefined") {
      if (autofill.handle && settings.fillHandle === false) {
        autofill.disable();
      }
      else if (!autofill.handle && settings.fillHandle !== false) {
        autofill.init();
      }
    }

    grid.keepEmptyRows();
    if (self.view) {
      self.forceFullRender = true; //used when data was changed
      selection.refreshBorders(null, true);
    }
  };

  /**
   * Returns current settings object
   * @return {Object}
   */
  this.getSettings = function () {
    return priv.settings;
  };

  /**
   * Returns current settingsFromDOM object
   * @return {Object}
   */
  this.getSettingsFromDOM = function () {
    return priv.settingsFromDOM;
  };

  /**
   * Clears grid
   * @public
   */
  this.clear = function () {
    selection.selectAll();
    selection.empty();
  };

  /**
   * Return true if undo can be performed, false otherwise
   * @public
   */
  this.isUndoAvailable = function () {
    return priv.undoRedo && priv.undoRedo.isUndoAvailable();
  };

  /**
   * Return true if redo can be performed, false otherwise
   * @public
   */
  this.isRedoAvailable = function () {
    return priv.undoRedo && priv.undoRedo.isRedoAvailable();
  };

  /**
   * Undo last edit
   * @public
   */
  this.undo = function () {
    priv.undoRedo && priv.undoRedo.undo();
  };

  /**
   * Redo edit (used to reverse an undo)
   * @public
   */
  this.redo = function () {
    priv.undoRedo && priv.undoRedo.redo();
  };

  /**
   * Clears undo history
   * @public
   */
  this.clearUndo = function () {
    priv.undoRedo && priv.undoRedo.clear();
  };

  /**
   * Inserts or removes rows and columns
   * @param {String} action See grid.alter for possible values
   * @param {Number} index
   * @param {Number} amount
   * @public
   */
  this.alter = function (action, index, amount) {
    grid.alter(action, index, amount);
  };

  /**
   * Returns <td> element corresponding to params row, col
   * @param {Number} row
   * @param {Number} col
   * @public
   * @return {Element}
   */
  this.getCell = function (row, col) {
    return self.view.getCellAtCoords({row: row, col: col});
  };

  /**
   * Returns property name associated with column number
   * @param {Number} col
   * @public
   * @return {String}
   */
  this.colToProp = function (col) {
    return datamap.colToProp(col);
  };

  /**
   * Returns column number associated with property name
   * @param {String} prop
   * @public
   * @return {Number}
   */
  this.propToCol = function (prop) {
    return datamap.propToCol(prop);
  };

  /**
   * Return value at `row`, `col`
   * @param {Number} row
   * @param {Number} col
   * @public
   * @return value (mixed data type)
   */
  this.getDataAtCell = function (row, col) {
    return datamap.get(row, datamap.colToProp(col));
  };

  /**
   * Return value at `row`, `prop`
   * @param {Number} row
   * @param {Number} prop
   * @public
   * @return value (mixed data type)
   */
  this.getDataAtRowProp = function (row, prop) {
    return datamap.get(row, prop);
  };

  /**
   * Returns cell meta data object corresponding to params row, col
   * @param {Number} row
   * @param {Number} col
   * @public
   * @return {Object}
   */
  this.getCellMeta = function (row, col) {
    var cellProperties = $.extend(true, cellProperties, Handsontable.TextCell)
      , prop = datamap.colToProp(col)
      , i
      , type;

    if (priv.settings.columns) {
      cellProperties = $.extend(true, cellProperties, priv.settings.columns[col] || {});
    }
    if (priv.settings.cells) {
      cellProperties = $.extend(true, cellProperties, priv.settings.cells(row, col, prop) || {});
    }
    self.runHooks('beforeGetCellMeta', row, col, cellProperties);

    if (typeof cellProperties.type === 'string' && Handsontable.cellTypes[cellProperties.type]) {
      type = Handsontable.cellTypes[cellProperties.type];
    }
    else if (typeof cellProperties.type === 'object') {
      type = cellProperties.type;
    }

    if (type) {
      for (i in type) {
        if (type.hasOwnProperty(i)) {
          cellProperties[i] = type[i];
        }
      }
    }

    cellProperties.isWritable = !cellProperties.readOnly;
    self.runHooks('afterGetCellMeta', row, col, cellProperties);
    return cellProperties;
  };

  /**
   * Return array of row headers (if they are enabled). If param `row` given, return header at given row as string
   * @param {Number} row (Optional)
   * @return {Array|String}
   */
  this.getRowHeader = function (row) {
    if (row === void 0) {
      var out = [];
      for (var i = 0, ilen = self.countRows(); i < ilen; i++) {
        out.push(self.getRowHeader(i));
      }
      return out;
    }
    else if (Object.prototype.toString.call(priv.settings.rowHeaders) === '[object Array]' && priv.settings.rowHeaders[row] !== void 0) {
      return priv.settings.rowHeaders[row];
    }
    else if (typeof priv.settings.rowHeaders === 'function') {
      return priv.settings.rowHeaders(row);
    }
    else if (priv.settings.rowHeaders && typeof priv.settings.rowHeaders !== 'string' && typeof priv.settings.rowHeaders !== 'number') {
      return row + 1;
    }
    else {
      return priv.settings.rowHeaders;
    }
  };

  /**
   * Return array of column headers (if they are enabled). If param `col` given, return header at given column as string
   * @param {Number} col (Optional)
   * @return {Array|String}
   */
  this.getColHeader = function (col) {
    if (col === void 0) {
      var out = [];
      for (var i = 0, ilen = self.countCols(); i < ilen; i++) {
        out.push(self.getColHeader(i));
      }
      return out;
    }
    else {
      col = Handsontable.PluginModifiers.run(self, 'col', col);

      if (priv.settings.columns && priv.settings.columns[col] && priv.settings.columns[col].title) {
        return priv.settings.columns[col].title;
      }
      else if (Object.prototype.toString.call(priv.settings.colHeaders) === '[object Array]' && priv.settings.colHeaders[col] !== void 0) {
        return priv.settings.colHeaders[col];
      }
      else if (typeof priv.settings.colHeaders === 'function') {
        return priv.settings.colHeaders(col);
      }
      else if (priv.settings.colHeaders && typeof priv.settings.colHeaders !== 'string' && typeof priv.settings.colHeaders !== 'number') {
        return Handsontable.helper.spreadsheetColumnLabel(col);
      }
      else {
        return priv.settings.colHeaders;
      }
    }
  };

  /**
   * Return column width
   * @param {Number} col
   * @return {Number}
   */
  this.getColWidth = function (col) {
    col = Handsontable.PluginModifiers.run(self, 'col', col);
    var response = {};
    if (priv.settings.columns && priv.settings.columns[col] && priv.settings.columns[col].width) {
      response.width = priv.settings.columns[col].width;
    }
    else if (Object.prototype.toString.call(priv.settings.colWidths) === '[object Array]' && priv.settings.colWidths[col] !== void 0) {
      response.width = priv.settings.colWidths[col];
    }
    else {
      response.width = 50;
    }
    self.runHooks('afterGetColWidth', col, response);
    return response.width;
  };

  /**
   * Return total number of rows in grid
   * @return {Number}
   */
  this.countRows = function () {
    return priv.settings.data.length;
  };

  /**
   * Return total number of columns in grid
   * @return {Number}
   */
  this.countCols = function () {
    if (priv.dataType === 'object' || priv.dataType === 'function') {
      if (priv.settings.columns && priv.settings.columns.length) {
        return priv.settings.columns.length;
      }
      else {
        return priv.colToProp.length;
      }
    }
    else if (priv.dataType === 'array') {
      if (priv.settings.columns && priv.settings.columns.length) {
        return priv.settings.columns.length;
      }
      else if (priv.settings.data && priv.settings.data[0] && priv.settings.data[0].length) {
        return priv.settings.data[0].length;
      }
      else {
        return 0;
      }
    }
  };

  /**
   * Return index of first visible row
   * @return {Number}
   */
  this.rowOffset = function () {
    return self.view.wt.getSetting('offsetRow');
  };

  /**
   * Return index of first visible column
   * @return {Number}
   */
  this.colOffset = function () {
    return self.view.wt.getSetting('offsetColumn');
  };

  /**
   * Return number of visible rows
   * @return {Number}
   */
  this.countVisibleRows = function () {
    return self.view.wt.wtTable.countVisibleRows();
  };

  /**
   * Return number of visible columns
   * @return {Number}
   */
  this.countVisibleCols = function () {
    return self.view.wt.wtTable.countVisibleColumns();
  };

  /**
   * Return number of empty rows
   * @return {Boolean} ending If true, will only count empty rows at the end of the data source
   */
  this.countEmptyRows = function (ending) {
    var i = self.countRows() - 1
      , empty = 0;
    while (i >= 0) {
      if (self.isEmptyRow(i)) {
        empty++;
      }
      else if (ending) {
        break;
      }
      i--;
    }
    return empty;
  };

  /**
   * Return number of empty columns
   * @return {Boolean} ending If true, will only count empty columns at the end of the data source row
   */
  this.countEmptyCols = function (ending) {
    if (self.countRows() < 1) {
      return 0;
    }

    var i = self.countCols() - 1
      , empty = 0;
    while (i >= 0) {
      if (self.isEmptyCol(i)) {
        empty++;
      }
      else if (ending) {
        break;
      }
      i--;
    }
    return empty;
  };

  /**
   * Return true if the row at the given index is empty, false otherwise
   * @param {Number} r Row index
   * @return {Boolean}
   */
  this.isEmptyRow = function (r) {
    if (priv.settings.isEmptyRow) {
      return priv.settings.isEmptyRow.call(this, r);
    }

    var val;
    for (var c = 0, clen = this.countCols(); c < clen; c++) {
      val = this.getDataAtCell(r, c);
      if (val !== '' && val !== null && typeof val !== 'undefined') {
        return false;
      }
    }
    return true;
  };

  /**
   * Return true if the column at the given index is empty, false otherwise
   * @param {Number} c Column index
   * @return {Boolean}
   */
  this.isEmptyCol = function (c) {
    if (priv.settings.isEmptyCol) {
      return priv.settings.isEmptyCol.call(this, c);
    }

    var val;
    for (var r = 0, rlen = this.countRows(); r < rlen; r++) {
      val = this.getDataAtCell(r, c);
      if (val !== '' && val !== null && typeof val !== 'undefined') {
        return false;
      }
    }
    return true;
  };

  /**
   * Selects cell on grid. Optionally selects range to another cell
   * @param {Number} row
   * @param {Number} col
   * @param {Number} [endRow]
   * @param {Number} [endCol]
   * @param {Boolean} [scrollToCell=true] If true, viewport will be scrolled to the selection
   * @public
   * @return {Boolean}
   */
  this.selectCell = function (row, col, endRow, endCol, scrollToCell) {
    if (typeof row !== 'number' || row < 0 || row >= self.countRows()) {
      return false;
    }
    if (typeof col !== 'number' || col < 0 || col >= self.countCols()) {
      return false;
    }
    if (typeof endRow !== "undefined") {
      if (typeof endRow !== 'number' || endRow < 0 || endRow >= self.countRows()) {
        return false;
      }
      if (typeof endCol !== 'number' || endCol < 0 || endCol >= self.countCols()) {
        return false;
      }
    }
    priv.selStart.coords({row: row, col: col});
    self.listen(); //needed or otherwise prepare won't focus the cell. selectionSpec tests this (should move focus to selected cell)
    if (typeof endRow === "undefined") {
      selection.setRangeEnd({row: row, col: col}, scrollToCell);
    }
    else {
      selection.setRangeEnd({row: endRow, col: endCol}, scrollToCell);
    }

    self.selection.finish();
    return true;
  };

  this.selectCellByProp = function (row, prop, endRow, endProp, scrollToCell) {
    arguments[1] = datamap.propToCol(arguments[1]);
    if (typeof arguments[3] !== "undefined") {
      arguments[3] = datamap.propToCol(arguments[3]);
    }
    return self.selectCell.apply(self, arguments);
  };

  /**
   * Deselects current sell selection on grid
   * @public
   */
  this.deselectCell = function () {
    selection.deselect();
  };

  /**
   * Remove grid from DOM
   * @public
   */
  this.destroy = function () {
    self.clearTimeouts();
    if (self.view) { //in case HT is destroyed before initialization has finished
      self.view.wt.destroy();
    }
    self.rootElement.empty();
    self.rootElement.removeData('handsontable');
    self.rootElement.off('.handsontable');
    $(window).off('.' + self.guid);
    $(document.documentElement).off('.' + self.guid);
    self.runHooks('afterDestroy');
  };

  /**
   * Return Handsontable instance
   * @public
   * @return {Object}
   */
  this.getInstance = function () {
    return self.rootElement.data("handsontable");
  };

  /**
   * Add PluginHook to this instance
   * @public
   */
  this.addHook = function (key, fn) {
    if (typeof hooks[key] === "undefined") {
      hooks[key] = [];
    }

    if (fn instanceof Array) {
      for (var i = 0, len = fn.length; i < len; i++) {
        hooks[key].push(fn[i]);
      }
    } else {
      hooks[key].push(fn);
    }
  };

  /**
   * Add 'once run' PluginHook to this instance
   * @public
   */
  this.addOnceHook = function (key, fn) {
    if (typeof hooks[key] === "undefined") {
      hooks[key] = [];
    }

    var wrapper = function() {
      this.removeHook(key, wrapper);
      return fn.apply(this, arguments);
    };

    hooks[key].push(wrapper);

  };

  /**
   * Remove PluginHook from this instance
   * @public
   * @return {Boolean}
   */
  this.removeHook = function (key, fn) {
    for(var i = 0, len = hooks[key].length; i < len; i++) {
      if (hooks[key][i] == fn) {
        hooks[key].splice(i, 1);
        return true;
      }
    }
    return false;
  };

  /**
   * Run all PluginHooks (global and public)
   * @public
   */
  this.runHooks = function (key, p1, p2, p3, p4, p5) {
    if (typeof hooks[key] !== 'undefined') {
      for (var i = 0, len = hooks[key].length; i < len; i++) {
        hooks[key][i].call(self, p1, p2, p3, p4, p5);
      }
    }
    Handsontable.PluginHooks.run(self, key, p1, p2, p3, p4, p5);
  };

  this.timeouts = {};

  /**
   * Sets timeout. Purpose of this method is to clear all known timeouts when `destroy` method is called
   * @public
   */
  this.registerTimeout = function (key, handle, ms) {
    clearTimeout(this.timeouts[key]);
    this.timeouts[key] = setTimeout(handle, ms || 0);
  };

  /**
   * Clears all known timeouts
   * @public
   */
  this.clearTimeouts = function () {
    for (var key in this.timeouts) {
      if (this.timeouts.hasOwnProperty(key)) {
        clearTimeout(this.timeouts[key]);
      }
    }
  };

  /**
   * Handsontable version
   */
  this.version = '@@version'; //inserted by grunt from package.json
};

var settings = {
  'data': void 0,
  'width': void 0,
  'height': void 0,
  'startRows': 5,
  'startCols': 5,
  'minRows': 0,
  'minCols': 0,
  'maxRows': Infinity,
  'maxCols': Infinity,
  'minSpareRows': 0,
  'minSpareCols': 0,
  'multiSelect': true,
  'fillHandle': true,
  'undo': true,
  'outsideClickDeselects': true,
  'enterBeginsEditing': true,
  'enterMoves': {row: 1, col: 0},
  'tabMoves': {row: 0, col: 1},
  'autoWrapRow': false,
  'autoWrapCol': false,
  'copyRowsLimit': 1000,
  'copyColsLimit': 1000,
  'currentRowClassName': void 0,
  'currentColClassName': void 0,
  'stretchH': 'hybrid',
  isEmptyRow: void 0,
  isEmptyCol: void 0
};

$.fn.handsontable = function (action) {
  var i, ilen, args, output, userSettings;

  // Use only first element from list
  var _this = this.first();

  // Init case
  if (typeof action !== 'string') {
    userSettings = action || {};
    if (_this.data("handsontable")) {
      instance = _this.data("handsontable");
      instance.updateSettings(userSettings);
    }
    else {
      var currentSettings = $.extend(true, {}, settings), instance;
      for (i in userSettings) {
        if (userSettings.hasOwnProperty(i)) {
          currentSettings[i] = userSettings[i];
        }
      }
      instance = new Handsontable.Core(_this, currentSettings);
      _this.data("handsontable", instance);
      instance.init();
    }

    return _this;
  }
  // Action case
  else {
    args = [];
    if (arguments.length > 1) {
      for (i = 1, ilen = arguments.length; i < ilen; i++) {
        args.push(arguments[i]);
      }
    }

    var instance = _this.data("handsontable");
    if (instance) {
      if (typeof instance[action] !== "undefined") {
        output = instance[action].apply(_this, args);
      }
      else {
        throw new Error('Handsontable do not provide action: ' + action);
      }
    }

    return output;
  }
};