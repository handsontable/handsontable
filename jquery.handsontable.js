/**
 * Handsontable 0.8.0-dev
 * Handsontable is a simple jQuery plugin for editable tables with basic copy-paste compatibility with Excel and Google Docs
 *
 * Copyright 2012, Marcin Warpechowski
 * Licensed under the MIT license.
 * http://handsontable.com/
 *
 * Date: Sun Dec 02 2012 12:43:26 GMT+0100 (Central European Standard Time)
 */
/*jslint white: true, browser: true, plusplus: true, indent: 4, maxerr: 50 */

var Handsontable = { //class namespace
  extension: {}, //extenstion namespace
  helper: {} //helper namespace
};

(function ($, window, Handsontable) {
  "use strict";
/**
 * Handsontable constructor
 * @param rootElement The jQuery element in which Handsontable DOM will be inserted
 * @param settings
 * @constructor
 */
Handsontable.Core = function (rootElement, settings) {
  this.rootElement = rootElement;

  var priv, datamap, grid, selection, editproxy, highlight, autofill, validate, self = this;

  priv = {
    settings: {},
    selStart: null,
    selEnd: null,
    editProxy: false,
    isPopulated: null,
    scrollable: null,
    undoRedo: null,
    extensions: {},
    colToProp: null,
    propToCol: null,
    dataSchema: null,
    dataType: 'array'
  };

  var hasMinWidthProblem = ($.browser.msie && (parseInt($.browser.version, 10) <= 7));
  /**
   * Used to get over IE7 not respecting CSS min-width (and also not showing border around empty cells)
   * @param {Element} td
   */
  this.minWidthFix = function (td) {
    if (hasMinWidthProblem) {
      if (td.className) {
        td.innerHTML = '<div class="minWidthFix ' + td.className + '">' + td.innerHTML + '</div>';
      }
      else {
        td.innerHTML = '<div class="minWidthFix">' + td.innerHTML + '</div>';
      }
    }
  };

  var hasPositionProblem = ($.browser.msie && (parseInt($.browser.version, 10) <= 7));
  /**
   * Used to get over IE7 returning negative position in demo/buttons.html
   * @param {Object} position
   */
  this.positionFix = function (position) {
    if (hasPositionProblem) {
      if (position.top < 0) {
        position.top = 0;
      }
      if (position.left < 0) {
        position.left = 0;
      }
    }
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
      if (priv.colToProp && typeof priv.colToProp[col] !== 'undefined') {
        return priv.colToProp[col];
      }
      else {
        return col;
      }
    },

    propToCol: function (prop) {
      if (typeof priv.propToCol[prop] !== 'undefined') {
        return priv.propToCol[prop];
      }
      else {
        return prop;
      }

    },

    getSchema: function () {
      return priv.settings.dataSchema || priv.duckDataSchema;
    },

    /**
     * Creates row at the bottom of the data array
     * @param {Object} [coords] Optional. Coords of the cell before which the new row will be inserted
     */
    createRow: function (coords) {
      var row;
      if (priv.dataType === 'array') {
        row = [];
        for (var c = 0; c < self.colCount; c++) {
          row.push(null);
        }
      }
      else {
        row = $.extend(true, {}, datamap.getSchema());
      }
      if (!coords || coords.row >= self.rowCount) {
        priv.settings.data.push(row);
      }
      else {
        priv.settings.data.splice(coords.row, 0, row);
      }
    },

    /**
     * Creates col at the right of the data array
     * @param {Object} [coords] Optional. Coords of the cell before which the new column will be inserted
     */
    createCol: function (coords) {
      if (priv.dataType === 'object' || priv.settings.columns) {
        throw new Error("Cannot create new column. When data source in an object, you can only have as much columns as defined in first data row, data schema or in the 'columns' setting");
      }
      var r = 0, rlen = self.countRows();
      if (!coords || coords.col >= self.countCols()) {
        for (; r < rlen; r++) {
          if (typeof priv.settings.data[r] === 'undefined') {
            priv.settings.data[r] = [];
          }
          priv.settings.data[r].push('');
        }
      }
      else {
        for (; r < rlen; r++) {
          priv.settings.data[r].splice(coords.col, 0, '');
        }
      }
    },

    /**
     * Removes row at the bottom of the data array
     * @param {Object} [coords] Optional. Coords of the cell which row will be removed
     * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all rows will be removed
     */
    removeRow: function (coords, toCoords) {
      if (!coords || coords.row === self.rowCount - 1) {
        priv.settings.data.pop();
      }
      else {
        priv.settings.data.splice(coords.row, toCoords.row - coords.row + 1);
      }
    },

    /**
     * Removes col at the right of the data array
     * @param {Object} [coords] Optional. Coords of the cell which col will be removed
     * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all cols will be removed
     */
    removeCol: function (coords, toCoords) {
      if (priv.dataType === 'object' || priv.settings.columns) {
        throw new Error("cannot remove column with object data source or columns option specified");
      }
      var r = 0;
      if (!coords || coords.col === self.colCount - 1) {
        for (; r < self.rowCount; r++) {
          priv.settings.data[r].pop();
        }
      }
      else {
        var howMany = toCoords.col - coords.col + 1;
        for (; r < self.rowCount; r++) {
          priv.settings.data[r].splice(coords.col, howMany);
        }
      }
    },

    /**
     * Returns single value from the data array
     * @param {Number} row
     * @param {Number} prop
     */
    get: function (row, prop) {
      if (typeof prop === 'string' && prop.indexOf('.') > -1) {
        var sliced = prop.split(".");
        var out = priv.settings.data[row];
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
      else {
        return priv.settings.data[row] ? priv.settings.data[row][prop] : null;
      }
    },

    /**
     * Saves single value to the data array
     * @param {Number} row
     * @param {Number} prop
     * @param {String} value
     */
    set: function (row, prop, value) {
      if (typeof prop === 'string' && prop.indexOf('.') > -1) {
        var sliced = prop.split(".");
        var out = priv.settings.data[row];
        for (var i = 0, ilen = sliced.length - 1; i < ilen; i++) {
          out = out[sliced[i]];
        }
        out[sliced[i]] = value;
      }
      else {
        priv.settings.data[row][prop] = value;
      }
    },

    /**
     * Clears the data array
     */
    clear: function () {
      for (var r = 0; r < self.rowCount; r++) {
        for (var c = 0; c < self.colCount; c++) {
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
     * Alter grid
     * @param {String} action Possible values: "insert_row", "insert_col", "remove_row", "remove_col"
     * @param {Object} coords
     * @param {Object} [toCoords] Required only for actions "remove_row" and "remove_col"
     */
    alter: function (action, coords, toCoords) {
      var oldData, newData, changes, r, rlen, c, clen, result;
      oldData = $.extend(true, [], datamap.getAll());

      switch (action) {
        case "insert_row":
          if (self.countRows() < priv.settings.maxRows) {
            datamap.createRow(coords);
            self.view.createRow(coords);
            self.view.renderRow(coords.row);
            self.blockedCols.refresh();
            if (priv.selStart && priv.selStart.row >= coords.row) {
              priv.selStart.row = priv.selStart.row + 1;
              selection.transformEnd(1, 0);
            }
            else {
              selection.transformEnd(0, 0); //refresh selection, otherwise arrow movement does not work
            }
          }
          break;

        case "insert_col":
          if (self.countCols() < priv.settings.maxCols) {
            datamap.createCol(coords);
            self.view.createCol(coords);
            self.view.renderCol(coords.col);
            self.blockedRows.refresh();
            if (priv.selStart && priv.selStart.col >= coords.col) {
              priv.selStart.col = priv.selStart.col + 1;
              selection.transformEnd(0, 1);
            }
            else {
              selection.transformEnd(0, 0); //refresh selection, otherwise arrow movement does not work
            }
          }
          break;

        case "remove_row":
          datamap.removeRow(coords, toCoords);
          self.view.removeRow(coords, toCoords);
          result = grid.keepEmptyRows();
          if (!result) {
            self.blockedCols.refresh();
          }
          selection.transformEnd(0, 0); //refresh selection, otherwise arrow movement does not work
          break;

        case "remove_col":
          datamap.removeCol(coords, toCoords);
          self.view.removeCol(coords, toCoords);
          result = grid.keepEmptyRows();
          if (!result) {
            self.blockedRows.refresh();
          }
          selection.transformEnd(0, 0); //refresh selection, otherwise arrow movement does not work
          break;
      }

      changes = [];
      newData = datamap.getAll();
      for (r = 0, rlen = newData.length; r < rlen; r++) {
        for (c = 0, clen = newData[r].length; c < clen; c++) {
          changes.push([r, c, oldData[r] ? oldData[r][c] : null, newData[r][c]]);
        }
      }
      self.rootElement.triggerHandler("datachange.handsontable", [changes, 'alter']);
    },

    /**
     * Makes sure there are empty rows at the bottom of the table
     * @return recreate {Boolean} TRUE if row or col was added or removed
     */
    keepEmptyRows: function () {
      var r, c, rlen, clen, emptyRows = 0, emptyCols = 0, recreateRows = false, recreateCols = false, val;

      var $tbody = $(priv.tableBody);

      //count currently empty rows
      rows : for (r = self.countRows() - 1; r >= 0; r--) {
        for (c = 0, clen = self.colCount; c < clen; c++) {
          val = datamap.get(r, datamap.colToProp(c));
          if (val !== '' && val !== null && typeof val !== 'undefined') {
            break rows;
          }
        }
        emptyRows++;
      }

      //should I add empty rows to data source to meet startRows?
      rlen = self.countRows();
      if (rlen < priv.settings.minRows) {
        for (r = 0; r < priv.settings.minRows - rlen; r++) {
          datamap.createRow();
        }
      }

      //should I add empty rows to table view to meet startRows?
      if (self.countRows() < priv.settings.minRows) {
        for (; self.countRows() < priv.settings.minRows; emptyRows++) {
          self.view.createRow();
          self.view.renderRow(self.countRows() - 1);
          recreateRows = true;
        }
      }

      //should I add empty rows to meet minSpareRows?
      if (emptyRows < priv.settings.minSpareRows) {
        for (; emptyRows < priv.settings.minSpareRows && self.countRows() < priv.settings.maxRows; emptyRows++) {
          datamap.createRow();
          self.view.createRow();
          self.view.renderRow(self.countRows() - 1);
          recreateRows = true;
        }
      }

      //count currently empty cols
      if (self.countRows() - 1 > 0) {
        cols : for (c = self.countCols() - 1; c >= 0; c--) {
          for (r = 0; r < self.countRows(); r++) {
            val = datamap.get(r, datamap.colToProp(c));
            if (val !== '' && val !== null && typeof val !== 'undefined') {
              break cols;
            }
          }
          emptyCols++;
        }
      }

      //should I add empty cols to meet minCols?
      if (self.countCols() < priv.settings.minCols) {
        for (; self.countCols() < priv.settings.minCols; emptyCols++) {
          if (!priv.settings.columns) {
            datamap.createCol();
          }
          self.view.createCol();
          self.view.renderCol(self.countCols() - 1);
          recreateCols = true;
        }
      }

      //should I add empty cols to meet minSpareCols?
      if (priv.dataType === 'array' && emptyCols < priv.settings.minSpareCols) {
        for (; emptyCols < priv.settings.minSpareCols && self.countCols() < priv.settings.maxCols; emptyCols++) {
          if (!priv.settings.columns) {
            datamap.createCol();
          }
          self.view.createCol();
          self.view.renderCol(self.colCount - 1);
          recreateCols = true;
        }
      }

      if (!recreateRows && priv.settings.enterBeginsEditing) {
        for (; ((priv.settings.minRows && self.countRows() > priv.settings.minRows) && (priv.settings.minSpareRows && emptyRows > priv.settings.minSpareRows) && (!priv.settings.minHeight || $tbody.height() - $tbody.find('tr:last').height() - 4 > priv.settings.minHeight)); emptyRows--) {
          self.view.removeRow();
          datamap.removeRow();
          recreateRows = true;
        }
      }

      if (!recreateCols && priv.settings.enterBeginsEditing) {
        for (; ((priv.settings.startCols && self.countCols() > priv.settings.startCols) && (priv.settings.minSpareCols && emptyCols > priv.settings.minSpareCols) && (!priv.settings.minWidth || $tbody.width() - $tbody.find('tr:last').find('td:last').width() - 4 > priv.settings.minWidth)); emptyCols--) {
          if (!priv.settings.columns) {
            datamap.removeCol();
          }
          self.view.removeCol();
          recreateCols = true;
        }
      }

      var rowCount = self.countRows();
      var colCount = self.countCols();

      if (rowCount === 0 || colCount === 0) {
        selection.deselect();
      }

      if (recreateRows && priv.selStart) {
        //if selection is outside, move selection to last row
        if (priv.selStart.row > rowCount - 1) {
          priv.selStart.row = rowCount - 1;
          if (priv.selEnd.row > priv.selStart.row) {
            priv.selEnd.row = priv.selStart.row;
          }
        } else if (priv.selEnd.row > rowCount - 1) {
          priv.selEnd.row = rowCount - 1;
          if (priv.selStart.row > priv.selEnd.row) {
            priv.selStart.row = priv.selEnd.row;
          }
        }
      }

      if (recreateCols && priv.selStart) {
        //if selection is outside, move selection to last row
        if (priv.selStart.col > colCount - 1) {
          priv.selStart.col = colCount - 1;
          if (priv.selEnd.col > priv.selStart.col) {
            priv.selEnd.col = priv.selStart.col;
          }
        } else if (priv.selEnd.col > colCount - 1) {
          priv.selEnd.col = colCount - 1;
          if (priv.selStart.col > priv.selEnd.col) {
            priv.selStart.col = priv.selEnd.col;
          }
        }
      }

      if (recreateRows || recreateCols) {
        selection.refreshBorders();
        self.blockedCols.update();
        self.blockedRows.update();
      }

      return (recreateRows || recreateCols);
    },

    /**
     * Is cell writable
     */
    isCellWritable: function ($td, cellProperties) {
      if (priv.isPopulated) {
        var data = $td.data('readOnly');
        if (typeof data === 'undefined') {
          return !cellProperties.readOnly;
        }
        else {
          return !data;
        }
      }
      return true;
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
      var r, rlen, c, clen, td, setData = [], current = {};
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
          td = self.view.getCellAtCoords(current);
          if (self.getCellMeta(current.row, current.col).isWritable) {
            var p = datamap.colToProp(current.col);
            setData.push([current.row, p, input[r][c]]);
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
     * Clears all cells in the grid
     */
    clear: function () {

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
    /**
     * Starts selection range on given td object
     * @param {Object} coords
     */
    setRangeStart: function (coords) {
      selection.deselect();
      priv.selStart = coords;
      selection.setRangeEnd(coords);
    },

    /**
     * Ends selection range on given td object
     * @param {Object} coords
     * @param {Boolean} [scrollToCell=true] If true, viewport will be scrolled to range end
     */
    setRangeEnd: function (coords, scrollToCell) {
      selection.end(coords);
      if (!priv.settings.multiSelect) {
        priv.selStart = coords;
      }
      self.rootElement.triggerHandler("selection.handsontable", [priv.selStart.row, priv.selStart.col, priv.selEnd.row, priv.selEnd.col]);
      self.rootElement.triggerHandler("selectionbyprop.handsontable", [priv.selStart.row, datamap.colToProp(priv.selStart.col), priv.selEnd.row, datamap.colToProp(priv.selEnd.col)]);
      selection.refreshBorders();
      if (scrollToCell !== false) {
        self.view.scrollViewport(coords);
      }
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
      if (!selection.isSelected()) {
        return;
      }
      selection.refreshBorderDimensions();
      if (!keepEditor) {
        editproxy.prepare();
      }
    },

    /**
     * Redraws borders around cells
     */
    refreshBorderDimensions: function () {
      if (!selection.isSelected()) {
        return;
      }
      if (autofill.handle) {
        autofill.showHandle();
      }
      priv.currentBorder.appear([priv.selStart]);
      highlight.on();
    },

    /**
     * Setter/getter for selection start
     */
    start: function (coords) {
      if (typeof coords !== 'undefined') {
        priv.selStart = coords;
      }
      return priv.selStart;
    },

    /**
     * Setter/getter for selection end
     */
    end: function (coords) {
      if (typeof coords !== 'undefined') {
        priv.selEnd = coords;
      }
      return priv.selEnd;
    },

    /**
     * Returns information if we have a multiselection
     * @return {Boolean}
     */
    isMultiple: function () {
      return !(priv.selEnd.col === priv.selStart.col && priv.selEnd.row === priv.selStart.row);
    },

    /**
     * Selects cell relative to current cell (if possible)
     */
    transformStart: function (rowDelta, colDelta, force) {
      if (priv.selStart.row + rowDelta > self.rowCount - 1) {
        if (force && priv.settings.minSpareRows > 0) {
          self.alter("insert_row", self.rowCount);
        }
        else if (priv.settings.autoWrapCol && priv.selStart.col + colDelta < self.colCount - 1) {
          rowDelta = 1 - self.rowCount;
          colDelta = 1;
        }
      }
      else if (priv.settings.autoWrapCol && priv.selStart.row + rowDelta < 0 && priv.selStart.col + colDelta >= 0) {
        rowDelta = self.rowCount - 1;
        colDelta = -1;
      }
      if (priv.selStart.col + colDelta > self.colCount - 1) {
        if (force && priv.settings.minSpareCols > 0) {
          self.alter("insert_col", self.colCount);
        }
        else if (priv.settings.autoWrapRow && priv.selStart.row + rowDelta < self.rowCount - 1) {
          rowDelta = 1;
          colDelta = 1 - self.colCount;
        }
      }
      else if (priv.settings.autoWrapRow && priv.selStart.col + colDelta < 0 && priv.selStart.row + rowDelta >= 0) {
        rowDelta = -1;
        colDelta = self.colCount - 1;
      }

      var totalRows = self.countRows();
      var totalCols = self.countCols();
      var coords = {
        row: (priv.selStart.row + rowDelta),
        col: priv.selStart.col + colDelta
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
      if (priv.selEnd) {
        var totalRows = self.countRows();
        var totalCols = self.countCols();
        var coords = {
          row: (priv.selEnd.row + rowDelta),
          col: priv.selEnd.col + colDelta
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
      var selEnd = selection.end();
      if (!selEnd || typeof selEnd.row === "undefined") {
        return false;
      }
      return true;
    },

    /**
     * Returns true if coords is within current selection coords
     * @return {Boolean}
     */
    inInSelection: function (coords) {
      if (!selection.isSelected()) {
        return false;
      }
      var sel = grid.getCornerCoords([priv.selStart, priv.selEnd]);
      return (sel.TL.row <= coords.row && sel.BR.row >= coords.row && sel.TL.col <= coords.col && sel.BR.col >= coords.col);
    },

    /**
     * Deselects all selected cells
     */
    deselect: function () {
      if (!selection.isSelected()) {
        return;
      }
      highlight.off();
      priv.currentBorder.disappear();
      if (autofill.handle) {
        autofill.hideHandle();
      }
      selection.end(false);
      editproxy.destroy();
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
        row: self.countRows(),
        col: self.countCols()
      }, false);
    },

    /**
     * Deletes data from selected cells
     */
    empty: function () {
      if (!selection.isSelected()) {
        return;
      }
      var corners = grid.getCornerCoords([priv.selStart, selection.end()]);
      var r, c, changes = [];
      for (r = corners.TL.row; r <= corners.BR.row; r++) {
        for (c = corners.TL.col; c <= corners.BR.col; c++) {
          if (self.getCellMeta(r, c).isWritable) {
            changes.push([r, datamap.colToProp(c), '']);
          }
        }
      }
      self.setDataAtCell(changes);
    }
  };

  highlight = {
    /**
     * Create highlight border
     */
    init: function () {
      priv.selectionBorder = new Handsontable.Border(self, {
        className: 'selection',
        bg: true
      });
    },

    /**
     * Show border around selected cells
     */
    on: function () {
      if (!selection.isSelected()) {
        return false;
      }
      if (selection.isMultiple()) {
        priv.selectionBorder.appear([priv.selStart, selection.end()]);
      }
      else {
        priv.selectionBorder.disappear();
      }
    },

    /**
     * Hide border around selected cells
     */
    off: function () {
      if (!selection.isSelected()) {
        return false;
      }
      priv.selectionBorder.disappear();
    }
  };

  this.autofill = autofill = { //this public assignment is only temporary
    handle: null,
    fillBorder: null,

    /**
     * Create fill handle and fill border objects
     */
    init: function () {
      if (!autofill.handle) {
        autofill.handle = new Handsontable.FillHandle(self);
        autofill.fillBorder = new Handsontable.Border(self, {
          className: 'htFillBorder'
        });

        $(autofill.handle.handle).on('dblclick', autofill.selectAdjacent);
      }
      else {
        autofill.handle.disabled = false;
        autofill.fillBorder.disabled = false;
      }

      self.rootElement.on('beginediting.handsontable', function () {
        autofill.hideHandle();
      });

      self.rootElement.on('finishediting.handsontable', function () {
        if (selection.isSelected()) {
          autofill.showHandle();
        }
      });
    },

    /**
     * Hide fill handle and fill border permanently
     */
    disable: function () {
      autofill.handle.disabled = true;
      autofill.fillBorder.disabled = true;
    },

    /**
     * Selects cells down to the last row in the left column, then fills down to that cell
     */
    selectAdjacent: function () {
      var select, data, r, maxR, c;

      if (selection.isMultiple()) {
        select = priv.selectionBorder.corners;
      }
      else {
        select = priv.currentBorder.corners;
      }

      autofill.fillBorder.disappear();

      data = datamap.getAll();
      rows : for (r = select.BR.row + 1; r < self.rowCount; r++) {
        for (c = select.TL.col; c <= select.BR.col; c++) {
          if (data[r][c]) {
            break rows;
          }
        }
        if (!!data[r][select.TL.col - 1] || !!data[r][select.BR.col + 1]) {
          maxR = r;
        }
      }
      if (maxR) {
        autofill.showBorder(self.view.getCellAtCoords({row: maxR, col: select.BR.col}));
        autofill.apply();
      }
    },

    /**
     * Apply fill values to the area in fill border, omitting the selection border
     */
    apply: function () {
      var drag, select, start, end;

      autofill.handle.isDragged = 0;

      drag = autofill.fillBorder.corners;
      if (!drag) {
        return;
      }

      autofill.fillBorder.disappear();

      if (selection.isMultiple()) {
        select = priv.selectionBorder.corners;
      }
      else {
        select = priv.currentBorder.corners;
      }

      if (drag.TL.row === select.TL.row && drag.TL.col < select.TL.col) {
        start = drag.TL;
        end = {
          row: drag.BR.row,
          col: select.TL.col - 1
        };
      }
      else if (drag.TL.row === select.TL.row && drag.BR.col > select.BR.col) {
        start = {
          row: drag.TL.row,
          col: select.BR.col + 1
        };
        end = drag.BR;
      }
      else if (drag.TL.row < select.TL.row && drag.TL.col === select.TL.col) {
        start = drag.TL;
        end = {
          row: select.TL.row - 1,
          col: drag.BR.col
        };
      }
      else if (drag.BR.row > select.BR.row && drag.TL.col === select.TL.col) {
        start = {
          row: select.BR.row + 1,
          col: drag.TL.col
        };
        end = drag.BR;
      }

      if (start) {
        grid.populateFromArray(start, SheetClip.parse(priv.editProxy.val()), end, 'autofill');

        selection.setRangeStart(drag.TL);
        selection.setRangeEnd(drag.BR);
      }
      else {
        //reset to avoid some range bug
        selection.refreshBorders();
      }
    },

    /**
     * Show fill handle
     */
    showHandle: function () {
      autofill.handle.appear([priv.selStart, priv.selEnd]);
    },

    /**
     * Hide fill handle
     */
    hideHandle: function () {
      autofill.handle.disappear();
    },

    /**
     * Show fill border
     */
    showBorder: function (td) {
      var coords = self.view.getCellCoords(td);
      var corners = grid.getCornerCoords([priv.selStart, priv.selEnd]);
      if (priv.settings.fillHandle !== 'horizontal' && (corners.BR.row < coords.row || corners.TL.row > coords.row)) {
        coords = {row: coords.row, col: corners.BR.col};
      }
      else if (priv.settings.fillHandle !== 'vertical') {
        coords = {row: corners.BR.row, col: coords.col};
      }
      else {
        return; //wrong direction
      }
      autofill.fillBorder.appear([priv.selStart, priv.selEnd, coords]);
    }
  };

  this.editproxy = editproxy = { //this public assignment is only temporary
    /**
     * Create input field
     */
    init: function () {
      priv.editProxy = $('<textarea class="handsontableInput">');
      priv.editProxyHolder = $('<div class="handsontableInputHolder">');
      priv.editProxyHolder.append(priv.editProxy);

      function onClick(event) {
        event.stopPropagation();
      }

      function onCut() {
        setTimeout(function () {
          selection.empty();
        }, 100);
      }

      function onPaste() {
        setTimeout(function () {
          self.rootElement.one("datachange.handsontable", function (event, changes, source) {
            if (changes.length) {
              var last = changes[changes.length - 1];
              selection.setRangeEnd({row: last[0], col: self.propToCol(last[1])});
            }
          });

          var input = priv.editProxy.val().replace(/^[\r\n]*/g, '').replace(/[\r\n]*$/g, ''), //remove newline from the start and the end of the input
            inputArray = SheetClip.parse(input),
            coords = grid.getCornerCoords([priv.selStart, priv.selEnd]);

          grid.populateFromArray(coords.TL, inputArray, {
            row: Math.max(coords.BR.row, inputArray.length - 1 + coords.TL.row),
            col: Math.max(coords.BR.col, inputArray[0].length - 1 + coords.TL.col)
          }, 'paste');
        }, 100);
      }

      var $body = $(document.body);

      function onKeyDown(event) {
        if ($body.children('.context-menu-list:visible').length) {
          return;
        }

        priv.lastKeyCode = event.keyCode;
        if (selection.isSelected()) {
          var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
          if (Handsontable.helper.isPrintableChar(event.keyCode) && ctrlDown) {
            if (event.keyCode === 65) { //CTRL + A
              selection.selectAll(); //select all cells
            }
            else if (event.keyCode === 88 && $.browser.opera) { //CTRL + X
              priv.editProxyHolder.triggerHandler('cut'); //simulate oncut for Opera
            }
            else if (event.keyCode === 86 && $.browser.opera) { //CTRL + V
              priv.editProxyHolder.triggerHandler('paste'); //simulate onpaste for Opera
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
              break;

            case 9: /* tab */
              var tabMoves = typeof priv.settings.tabMoves === 'function' ? priv.settings.tabMoves(event) : priv.settings.tabMoves;
              if (event.shiftKey) {
                selection.transformStart(-tabMoves.row, -tabMoves.col);
              }
              else {
                selection.transformStart(tabMoves.row, tabMoves.col);
              }
              event.preventDefault();
              break;

            case 39: /* arrow right */
              if (event.shiftKey) {
                selection.transformEnd(0, 1);
              }
              else {
                selection.transformStart(0, 1);
              }
              event.preventDefault();
              break;

            case 37: /* arrow left */
              if (event.shiftKey) {
                selection.transformEnd(0, -1);
              }
              else {
                selection.transformStart(0, -1);
              }
              event.preventDefault();
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
                selection.transformStart(enterMoves.row, enterMoves.col); //move selection down
              }
              event.preventDefault(); //don't add newline to field
              break;

            case 36: /* home */
              if (event.ctrlKey || event.metaKey) {
                rangeModifier(self.view.getCellAtCoords({row: 0, col: priv.selStart.col}));
              }
              else {
                rangeModifier(self.view.getCellAtCoords({row: priv.selStart.row, col: 0}));
              }
              break;

            case 35: /* end */
              if (event.ctrlKey || event.metaKey) {
                rangeModifier(self.view.getCellAtCoords({row: self.rowCount - 1, col: priv.selStart.col}));
              }
              else {
                rangeModifier(self.view.getCellAtCoords({row: priv.selStart.row, col: self.colCount - 1}));
              }
              break;

            case 33: /* pg up */
              rangeModifier(self.view.getCellAtCoords({row: 0, col: priv.selStart.col}));
              break;

            case 34: /* pg dn */
              rangeModifier(self.view.getCellAtCoords({row: self.rowCount - 1, col: priv.selStart.col}));
              break;

            default:
              break;
          }
        }
      }

      priv.editProxy.on('click', onClick);
      priv.editProxyHolder.on('cut', onCut);
      priv.editProxyHolder.on('paste', onPaste);
      priv.editProxyHolder.on('keydown', onKeyDown);
      self.rootElement.append(priv.editProxyHolder);
      console.log("rpoxy is", self.rootElement, priv.editProxyHolder);
    },

    /**
     * Destroy current editor, if exists
     * @param {Boolean} revertOriginal
     */
    destroy: function (revertOriginal) {
      if (typeof priv.editorDestroyer === "function") {
        priv.editorDestroyer(revertOriginal);
        priv.editorDestroyer = null;
      }
    },

    /**
     * Prepare text input to be displayed at given grid cell
     */
    prepare: function () {
      priv.editProxy.height(priv.editProxy.parent().innerHeight() - 4);
      priv.editProxy.val(datamap.getText(priv.selStart, priv.selEnd));
      setTimeout(editproxy.focus, 1);
      priv.editorDestroyer = self.view.applyCellTypeMethod('editor', self.view.getCellAtCoords(priv.selStart), priv.selStart, priv.editProxy);
    },

    /**
     * Sets focus to textarea
     */
    focus: function () {
      priv.editProxy[0].select();
    }
  };

  this.init = function () {
    editproxy.init();
    this.view = new Handsontable.TableView(this);

    self.rowCount = 0;

    bindEvents();
    this.updateSettings(settings);

    highlight.init();
    priv.currentBorder = new Handsontable.Border(self, {
      className: 'current',
      bg: true
    });

    Handsontable.PluginHooks.run(self, 'afterInit');
  };

  validate = function (changes, source) {
    var validated = $.Deferred();
    var deferreds = [];

    if (source === 'paste') {
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
        var cellProperties = self.getCellMeta(changes[i][0], changes[i][1]);
        if (cellProperties.strict && cellProperties.source) {
          var items = $.isFunction(cellProperties.source) ? cellProperties.source(changes[i][3], process(i)) : cellProperties.source;
          if (items) {
            process(i)(items)
          }
        }
      }
    }

    $.when(deferreds).then(function () {
      for (var i = changes.length - 1; i >= 0; i--) {
        if (changes[i] === null) {
          changes.splice(i, 1);
        }
      }

      if (priv.settings.onBeforeChange && changes.length) {
        var result = priv.settings.onBeforeChange.apply(self.rootElement[0], [changes, source]);
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
  };

  var bindEvents = function () {
    self.rootElement.on("datachange.handsontable", function (event, changes, source) {
      if (priv.settings.onChange) {
        priv.settings.onChange.apply(self.rootElement[0], [changes, source]);
      }
    });
    self.rootElement.on("selection.handsontable", function (event, row, col, endRow, endCol) {
      if (priv.settings.onSelection) {
        priv.settings.onSelection.apply(self.rootElement[0], [row, col, endRow, endCol]);
      }
    });
    self.rootElement.on("selectionbyprop.handsontable", function (event, row, prop, endRow, endProp) {
      if (priv.settings.onSelectionByProp) {
        priv.settings.onSelectionByProp.apply(self.rootElement[0], [row, prop, endRow, endProp]);
      }
    });
  };

  /**
   * Set data at given cell
   * @public
   * @param {Number|Array} row or array of changes in format [[row, col, value], ...]
   * @param {Number} prop
   * @param {String} value
   * @param {String} [source='edit'] String that identifies how this change will be described in changes array (useful in onChange callback)
   */
  this.setDataAtCell = function (row, prop, value, source) {
    var refreshRows = false, refreshCols = false, changes, i, ilen;

    if (typeof row === "object") { //is it an array of changes
      changes = row;
    }
    else if ($.isPlainObject(value)) { //backwards compatibility
      changes = value;
    }
    else {
      changes = [
        [row, prop, value]
      ];
    }

    for (i = 0, ilen = changes.length; i < ilen; i++) {
      changes[i].splice(2, 0, datamap.get(changes[i][0], changes[i][1])); //add old value at index 2
    }

    validate(changes, source).then(function () { //when validate is resolved...
      for (i = 0, ilen = changes.length; i < ilen; i++) {
        row = changes[i][0];
        prop = changes[i][1];
        var col = datamap.propToCol(prop);
        value = changes[i][3];

        if (priv.settings.minSpareRows) {
          while (row > self.countRows() - 1) {
            datamap.createRow();
            self.view.createRow();
            self.view.renderRow(self.rowCount - 1);
            refreshRows = true;
          }
        }
        if (priv.dataType === 'array' && priv.settings.minSpareCols) {
          while (col > self.countCols() - 1) {
            datamap.createCol();
            self.view.createCol();
            self.view.renderCol(self.colCount - 1);
            refreshCols = true;
          }
        }
        self.view.render(row, col, prop, value);
        datamap.set(row, prop, value);
      }
      if (refreshRows) {
        self.blockedCols.refresh();
      }
      if (refreshCols) {
        self.blockedRows.refresh();
      }
      var recreated = grid.keepEmptyRows();
      if (!recreated) {
        selection.refreshBorders();
      }
      self.rootElement.triggerHandler("datachange.handsontable", [changes, source || 'edit']);
      self.rootElement.triggerHandler("cellrender.handsontable", [changes, source || 'edit']);
    });
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
   * @return {Array} [topLeftRow, topLeftCol, bottomRightRow, bottomRightCol]
   */
  this.getSelected = function () { //https://github.com/warpech/jquery-handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      var coords = grid.getCornerCoords([priv.selStart, priv.selEnd]);
      return [coords.TL.row, coords.TL.col, coords.BR.row, coords.BR.col];
    }
  };

  /**
   * Render visible data
   * @public
   * @param {Array} changes (Optional) If not given, all visible grid will be rerendered
   * @param {String} source (Optional)
   */
  this.render = function (changes, source) {
    if (typeof changes === "undefined") {
      changes = [];
      var r
        , c
        , p
        , val
        , rlen = self.countRows()
        , clen = (priv.settings.columns && priv.settings.columns.length) || priv.settings.startCols;
      for (r = 0; r < rlen; r++) {
        for (c = 0; c < clen; c++) {
          p = datamap.colToProp(c);
          val = datamap.get(r, p);
          changes.push([r, p, val, val]);
        }
      }
    }
    for (var i = 0, ilen = changes.length; i < ilen; i++) {
      self.view.render(changes[i][0], datamap.propToCol(changes[i][1]), changes[i][1], changes[i][3]);
    }
    selection.refreshBorderDimensions();
    priv.editProxy.triggerHandler('refreshBorder');
    self.rootElement.triggerHandler('cellrender.handsontable', [changes, source || 'render']);
  };

  /**
   * Load data from array
   * @public
   * @param {Array} data
   */
  this.loadData = function (data) {
    priv.isPopulated = false;
    priv.settings.data = data;
    if ($.isPlainObject(priv.settings.dataSchema) || $.isPlainObject(data[0])) {
      priv.dataType = 'object';
    }
    else {
      priv.dataType = 'array';
    }
    if (data[0]) {
      priv.duckDataSchema = datamap.recursiveDuckSchema(data[0]);
    }
    else {
      priv.duckDataSchema = {};
    }
    datamap.createMap();

    var rlen = priv.settings.data.length;
    while (priv.settings.minRows > rlen) {
      datamap.createRow();
      rlen++;
    }

    if (self.colCount === void 0) {
      self.colCount = self.countCols();
    }

    grid.keepEmptyRows();
    grid.clear();
    var changes = [];
    rlen = priv.settings.data.length; //recount number of rows in case some row was removed by keepEmptyRows
    var clen = self.countCols();
    for (var r = 0; r < rlen; r++) {
      for (var c = 0; c < clen; c++) {
        var p = datamap.colToProp(c);
        changes.push([r, p, "", datamap.get(r, p)])
      }
    }
    self.rootElement.triggerHandler('datachange.handsontable', [changes, 'loadData']);
    self.render(changes, 'loadData');
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
    var i, j, recreated;

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

    if (!self.blockedCols) {
      self.blockedCols = new Handsontable.BlockedCols(self);
      self.blockedRows = new Handsontable.BlockedRows(self);
    }

    for (i in settings) {
      if (i === 'data') {
        continue; //loadData will be triggered later
      }
      else if (settings.hasOwnProperty(i)) {
        priv.settings[i] = settings[i];

        //launch extensions
        if (Handsontable.extension[i]) {
          priv.extensions[i] = new Handsontable.extension[i](self, settings[i]);
        }
      }
    }

    if (priv.settings.data === void 0) {
      if (settings.data === void 0) {
        settings.data = [];
        var row;
        for (var r = 0, rlen = priv.settings.startRows; r < rlen; r++) {
          row = [];
          for (var c = 0, clen = priv.settings.startCols; c < clen; c++) {
            row.push(null);
          }
          settings.data.push(row);
        }
      }
      else {
        if (settings.startRows !== void 0 && settings.minRows === void 0) {
          settings.minRows = settings.startRows;
        }
        if (settings.startCols !== void 0 && settings.minCols === void 0) {
          settings.minCols = settings.startCols;
        }
      }
    }

    if (settings.data !== void 0) {
      self.loadData(settings.data);
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

    if (typeof settings.colHeaders !== "undefined") {
      if (settings.colHeaders === false && priv.extensions["ColHeader"]) {
        priv.extensions["ColHeader"].destroy();
      }
      else if (settings.colHeaders !== false) {
        priv.extensions["ColHeader"] = new Handsontable.ColHeader(self, settings.colHeaders);
      }
    }

    if (typeof settings.rowHeaders !== "undefined") {
      if (settings.rowHeaders === false && priv.extensions["RowHeader"]) {
        priv.extensions["RowHeader"].destroy();
      }
      else if (settings.rowHeaders !== false) {
        priv.extensions["RowHeader"] = new Handsontable.RowHeader(self, settings.rowHeaders);
      }
    }

    var blockedRowsCount = self.blockedRows.count();
    var blockedColsCount = self.blockedCols.count();
    if (blockedRowsCount && blockedColsCount && (typeof settings.rowHeaders !== "undefined" || typeof settings.colHeaders !== "undefined")) {
      if (self.blockedCorner) {
        self.blockedCorner.remove();
        self.blockedCorner = null;
      }

      var position = self.table.position();
      self.positionFix(position);

      var div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.top = position.top + 'px';
      div.style.left = position.left + 'px';

      var table = document.createElement('table');
      table.cellPadding = 0;
      table.cellSpacing = 0;
      div.appendChild(table);

      var thead = document.createElement('thead');
      table.appendChild(thead);

      var tr, th;
      for (i = 0; i < blockedRowsCount; i++) {
        tr = document.createElement('tr');
        for (j = blockedColsCount - 1; j >= 0; j--) {
          th = document.createElement('th');
          th.className = self.blockedCols.headers[j].className;
          th.innerHTML = self.blockedCols.headerText('&nbsp;');
          self.minWidthFix(th);
          tr.appendChild(th);
        }
        thead.appendChild(tr);
      }
      self.blockedCorner = $(div);
      self.blockedCorner.on('click', function () {
        selection.selectAll();
      });
      self.container.append(self.blockedCorner);
    }
    else {
      if (self.blockedCorner) {
        self.blockedCorner.remove();
        self.blockedCorner = null;
      }
    }

    recreated = grid.keepEmptyRows();
    if (!recreated) {
      selection.refreshBorders(null, true);
    }

    self.blockedCols.update();
    self.blockedRows.update();
  };

  /**
   * Returns current settings object
   * @return {Object}
   */
  this.getSettings = function () {
    return priv.settings;
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
   * Alters the grid
   * @param {String} action See grid.alter for possible values
   * @param {Number} from
   * @param {Number} [to] Optional. Used only for actions "remove_row" and "remove_col"
   * @public
   */
  this.alter = function (action, from, to) {
    if (typeof to === "undefined") {
      to = from;
    }
    switch (action) {
      case "insert_row":
      case "remove_row":
        grid.alter(action, {row: from, col: 0}, {row: to, col: 0});
        break;

      case "insert_col":
      case "remove_col":
        grid.alter(action, {row: 0, col: from}, {row: 0, col: to});
        break;

      default:
        throw Error('There is no such action "' + action + '"');
        break;
    }
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
   * Return cell value at `row`, `col`
   * @param {Number} row
   * @param {Number} col
   * @public
   * @return {string}
   */
  this.getDataAtCell = function (row, col) {
    return datamap.get(row, datamap.colToProp(col));
  };

  /**
   * Returns cell meta data object corresponding to params row, col
   * @param {Number} row
   * @param {Number} col
   * @public
   * @return {Object}
   */
  this.getCellMeta = function (row, col) {
    var cellProperites = {}
      , prop = datamap.colToProp(col);
    if (priv.settings.columns) {
      cellProperites = $.extend(true, cellProperites, priv.settings.columns[col] || {});
    }
    if (priv.settings.cells) {
      cellProperites = $.extend(true, cellProperites, priv.settings.cells(row, col, prop) || {});
    }
    cellProperites.isWritable = grid.isCellWritable($(self.view.getCellAtCoords({row: row, col: col})), cellProperites);
    Handsontable.PluginHooks.run(self, 'afterGetCellMeta', [row, col, cellProperites]);
    return cellProperites;
  };

  /**
   * Sets cell to be readonly
   * @param {Number} row
   * @param {Number} col
   * @public
   */
  this.setCellReadOnly = function (row, col) {
    $(self.view.getCellAtCoords({row: row, col: col})).data("readOnly", true);
  };

  /**
   * Sets cell to be editable (removes readonly)
   * @param {Number} row
   * @param {Number} col
   * @public
   */
  this.setCellEditable = function (row, col) {
    $(self.view.getCellAtCoords({row: row, col: col})).data("readOnly", false);
  };

  /**
   * Returns headers (if they are enabled)
   * @param {Object} obj Instance of rowHeader or colHeader
   * @param {Number} count Number of rows or cols
   * @param {Number} index (Optional) Will return only header at given index
   * @return {Array|String}
   */
  var getHeaderText = function (obj, count, index) {
    if (obj) {
      if (typeof index !== 'undefined') {
        return obj.columnLabel(index);
      }
      else {
        var headers = [];
        for (var i = 0; i < count; i++) {
          headers.push(obj.columnLabel(i));
        }
        return headers;
      }
    }
  };

  /**
   * Return array of row headers (if they are enabled). If param `row` given, return header at given row as string
   * @param {Number} row (Optional)
   * @return {Array|String}
   */
  this.getRowHeader = function (row) {
    return getHeaderText(self.rowHeader, self.rowCount, row);
  };

  /**
   * Return array of col headers (if they are enabled). If param `col` given, return header at given col as string
   * @param {Number} col (Optional)
   * @return {Array|String}
   */
  this.getColHeader = function (col) {
    return getHeaderText(self.colHeader, self.colCount, col);
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
    if (priv.dataType === 'object') {
      if (priv.settings.columns && priv.settings.columns.length) {
        return priv.settings.columns.length;
      }
      else {
        return priv.colToProp.length;
      }
    }
    else if (priv.dataType === 'array') {
      return Math.max((priv.settings.columns && priv.settings.columns.length) || 0, (priv.settings.data && priv.settings.data[0] && priv.settings.data[0].length) || 0);
    }
  };

  /**
   * Selects cell on grid. Optionally selects range to another cell
   * @param {Number} row
   * @param {Number} col
   * @param {Number} [endRow]
   * @param {Number} [endCol]
   * @param {Boolean} [scrollToCell=true] If true, viewport will be scrolled to the selection
   * @public
   */
  this.selectCell = function (row, col, endRow, endCol, scrollToCell) {
    if (typeof row !== 'number' || row < 0 || row >= self.rowCount) {
      return false;
    }
    if (typeof col !== 'number' || col < 0 || col >= self.colCount) {
      return false;
    }
    if (typeof endRow !== "undefined") {
      if (typeof endRow !== 'number' || endRow < 0 || endRow >= self.rowCount) {
        return false;
      }
      if (typeof endCol !== 'number' || endCol < 0 || endCol >= self.colCount) {
        return false;
      }
    }
    selection.start({row: row, col: col});
    if (typeof endRow === "undefined") {
      selection.setRangeEnd({row: row, col: col}, scrollToCell);
    }
    else {
      selection.setRangeEnd({row: row, col: col}, scrollToCell);
    }
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
    self.rootElement.empty();
    self.rootElement.removeData('handsontable');
  };

  /**
   * Handsontable version
   */
  this.version = '0.8.0-dev'; //inserted by grunt from package.json
};

var settings = {
  'data': void 0,
  'startRows': 5,
  'startCols': 5,
  'minRows': 0,
  'minCols': 0,
  'maxRows': Infinity,
  'maxCols': Infinity,
  'minSpareRows': 0,
  'minSpareCols': 0,
  'minHeight': 0,
  'minWidth': 0,
  'multiSelect': true,
  'fillHandle': true,
  'undo': true,
  'outsideClickDeselects': true,
  'enterBeginsEditing': true,
  'enterMoves': {row: 1, col: 0},
  'tabMoves': {row: 0, col: 1},
  'autoWrapRow': false,
  'autoWrapCol': false,
  'viewEngine': 'walkontable'
};

$.fn.handsontable = function (action) {
  var i, ilen, args, output = [], userSettings;
  if (typeof action !== 'string') { //init
    userSettings = action || {};
    return this.each(function () {
      var $this = $(this);
      if ($this.data("handsontable")) {
        instance = $this.data("handsontable");
        instance.updateSettings(userSettings);
      }
      else {
        var currentSettings = $.extend(true, {}, settings), instance;
        for (i in userSettings) {
          if (userSettings.hasOwnProperty(i)) {
            currentSettings[i] = userSettings[i];
          }
        }
        instance = new Handsontable.Core($this, currentSettings);
        $this.data("handsontable", instance);
        instance.init();
      }
    });
  }
  else {
    args = [];
    if (arguments.length > 1) {
      for (i = 1, ilen = arguments.length; i < ilen; i++) {
        args.push(arguments[i]);
      }
    }
    this.each(function () {
      output = $(this).data("handsontable")[action].apply(this, args);
    });
    return output;
  }
};
/**
 * Handsontable TableView constructor
 * @param {Object} instance
 */
Handsontable.TableView = function (instance) {
  var that = this;

  this.instance = instance;
  instance.rootElement.addClass('handsontable');
  var $table = $('<table><thead></thead><tbody></tbody></table>');
  instance.rootElement.prepend($table);

  this.wt = new Walkontable({
    table: $table[0],
    data: instance.getDataAtCell,
    totalRows: instance.countRows,
    totalColumns: instance.countCols,
    offsetRow: 0,
    offsetColumn: 0,
    displayRows: 10,
    displayColumns: 5,
    rowHeaders: function (row) {
      return row + 1
    },
    columnHeaders: function (column) {
      return column + 1
    },
    selections: {
      current: {
        border: {
          width: 2,
          color: 'blue',
          style: 'solid'
        }
      }
    },
    onCellMouseDown: function (event, coords, TD) {
      var coordsObj = {row: coords[0], col: coords[1]};
      if (event.button === 2 && instance.selection.inInSelection(coordsObj)) { //right mouse button
        //do nothing
      }
      else if (event.shiftKey) {
        instance.selection.setRangeEnd(coordsObj);
      }
      else {
        instance.selection.setRangeStart(coordsObj);
      }

      that.wt.selections.current.clear();
      that.wt.selections.current.add(coords, TD);
    }
  });

  var interaction = {
    onMouseDown: function (event) {

    },

    onMouseOver: function () {

    },

    onMouseWheel: function (event, delta, deltaX, deltaY) {

    }
  };
};

/**
 * Creates row at the bottom of the <table>
 * @param {Object} [coords] Optional. Coords of the cell before which the new row will be inserted
 */
Handsontable.TableView.prototype.createRow = function (coords) {

};

/**
 * Creates col at the right of the <table>
 * @param {Object} [coords] Optional. Coords of the cell before which the new column will be inserted
 */
Handsontable.TableView.prototype.createCol = function (coords) {

};

/**
 * Removes row at the bottom of the <table>
 * @param {Object} [coords] Optional. Coords of the cell which row will be removed
 * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all rows will be removed
 */
Handsontable.TableView.prototype.removeRow = function (coords, toCoords) {

};

/**
 * Removes col at the right of the <table>
 * @param {Object} [coords] Optional. Coords of the cell which col will be removed
 * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all cols will be removed
 */
Handsontable.TableView.prototype.removeCol = function (coords, toCoords) {

};

Handsontable.TableView.prototype.render = function (row, col, prop, value) {
  this.wt.draw();
};

Handsontable.TableView.prototype.renderRow = function (row) {

};

Handsontable.TableView.prototype.renderCol = function (col) {

};

Handsontable.TableView.prototype.applyCellTypeMethod = function (methodName, td, coords, extraParam) {
  var prop = this.instance.colToProp(coords.col)
    , method
    , cellProperties = this.instance.getCellMeta(coords.row, coords.col);

  if (cellProperties.type && typeof cellProperties.type[methodName] === "function") {
    method = cellProperties.type[methodName];
  }
  if (typeof method !== "function") {
    method = Handsontable.TextCell[methodName];
  }
  return method(this.instance, td, coords.row, coords.col, prop, extraParam, cellProperties);
};

/**
 * Returns coordinates given td object
 */
Handsontable.TableView.prototype.getCellCoords = function (td) {

};

/**
 * Returns td object given coordinates
 */
Handsontable.TableView.prototype.getCellAtCoords = function (coords) {
  return this.wt.wtTable.getCell([coords.row, coords.col]);
};

/**
 * Returns all td objects in grid
 */
Handsontable.TableView.prototype.getAllCells = function () {

};

/**
 * Scroll viewport to selection
 * @param coords
 */
Handsontable.TableView.prototype.scrollViewport = function (coords) {

};
/**
 * Returns true if keyCode represents a printable character
 * @param {Number} keyCode
 * @return {Boolean}
 */
Handsontable.helper.isPrintableChar = function (keyCode) {
  return ((keyCode == 32) || //space
    (keyCode >= 48 && keyCode <= 57) || //0-9
    (keyCode >= 96 && keyCode <= 111) || //numpad
    (keyCode >= 186 && keyCode <= 192) || //;=,-./`
    (keyCode >= 219 && keyCode <= 222) || //[]{}\|"'
    keyCode >= 226 || //special chars (229 for Asian chars)
    (keyCode >= 65 && keyCode <= 90)); //a-z
};

/**
 * Converts a value to string
 * @param value
 * @return {String}
 */
Handsontable.helper.stringify = function (value) {
  switch (typeof value) {
    case 'string':
    case 'number':
      return value + '';
      break;

    case 'object':
      if (value === null) {
        return '';
      }
      else {
        return value.toString();
      }
      break;

    case 'undefined':
      return '';
      break;

    default:
      return value.toString();
  }
};

/**
 * Create DOM elements for selection border lines (top, right, bottom, left) and optionally background
 * @constructor
 * @param {Object} instance Handsontable instance
 * @param {Object} options Configurable options
 * @param {Boolean} [options.bg] Should include a background
 * @param {String} [options.className] CSS class for border elements
 */
Handsontable.Border = function (instance, options) {
};

Handsontable.Border.prototype = {
  /**
   * Show border around one or many cells
   * @param {Object[]} coordsArr
   */
  appear: function (coordsArr) {
  },

  /**
   * Hide border
   */
  disappear: function () {
  }
};
/**
 * Create DOM element for drag-down handle
 * @constructor
 * @param {Object} instance Handsontable instance
 */
Handsontable.FillHandle = function (instance) {
  this.instance = instance;
  this.rootElement = instance.rootElement;
  var container = this.rootElement[0];

  this.handle = document.createElement("div");
  this.handle.className = "htFillHandle";
  this.disappear();
  container.appendChild(this.handle);

  var that = this;
  $(this.handle).mousedown(function () {
    that.isDragged = 1;
  });

  this.rootElement.find('table').on('selectstart', function (event) {
    //https://github.com/warpech/jquery-handsontable/issues/160
    //selectstart is IE only event. Prevent text from being selected when performing drag down in IE8
    event.preventDefault();
  });
};

Handsontable.FillHandle.prototype = {
  /**
   * Show handle in cell cornerł
   * @param {Object[]} coordsArr
   */
  appear: function (coordsArr) {
    if (this.disabled) {
      return;
    }

    var $td, tdOffset, containerOffset, top, left, height, width;

    var corners = this.instance.getCornerCoords(coordsArr);

    $td = $(this.instance.getCell(corners.BR.row, corners.BR.col));
    tdOffset = $td.offset();
    containerOffset = this.$container.offset();

    top = tdOffset.top - containerOffset.top + this.rootElement.scrollTop() - 1;
    left = tdOffset.left - containerOffset.left + this.rootElement.scrollLeft() - 1;
    height = $td.outerHeight();
    width = $td.outerWidth();

    this.handle.style.top = top + height - 3 + 'px';
    this.handle.style.left = left + width - 3 + 'px';
    this.handle.style.display = 'block';
  },

  /**
   * Hide handle
   */
  disappear: function () {
    this.handle.style.display = 'none';
  }
};
/**
 * Handsontable UndoRedo class
 */
Handsontable.UndoRedo = function (instance) {
  var that = this;
  this.instance = instance;
  this.clear();
  instance.rootElement.on("datachange.handsontable", function (event, changes, origin) {
    if (origin !== 'undo' && origin !== 'redo') {
      that.add(changes);
    }
  });
};

/**
 * Undo operation from current revision
 */
Handsontable.UndoRedo.prototype.undo = function () {
  var i, ilen;
  if (this.isUndoAvailable()) {
    var setData = $.extend(true, [], this.data[this.rev]);
    for (i = 0, ilen = setData.length; i < ilen; i++) {
      setData[i].splice(3, 1);
    }
    this.instance.setDataAtCell(setData, null, null, 'undo');
    this.rev--;
  }
};

/**
 * Redo operation from current revision
 */
Handsontable.UndoRedo.prototype.redo = function () {
  var i, ilen;
  if (this.isRedoAvailable()) {
    this.rev++;
    var setData = $.extend(true, [], this.data[this.rev]);
    for (i = 0, ilen = setData.length; i < ilen; i++) {
      setData[i].splice(2, 1);
    }
    this.instance.setDataAtCell(setData, null, null, 'redo');
  }
};

/**
 * Returns true if undo point is available
 * @return {Boolean}
 */
Handsontable.UndoRedo.prototype.isUndoAvailable = function () {
  return (this.rev >= 0);
};

/**
 * Returns true if redo point is available
 * @return {Boolean}
 */
Handsontable.UndoRedo.prototype.isRedoAvailable = function () {
  return (this.rev < this.data.length - 1);
};

/**
 * Add new history poins
 * @param changes
 */
Handsontable.UndoRedo.prototype.add = function (changes) {
  this.rev++;
  this.data.splice(this.rev); //if we are in point abcdef(g)hijk in history, remove everything after (g)
  this.data.push(changes);
};

/**
 * Clears undo history
 */
Handsontable.UndoRedo.prototype.clear = function () {
  this.data = [];
  this.rev = -1;
};
/**
 * Handsontable BlockedRows class
 * @param {Object} instance
 */
Handsontable.BlockedRows = function (instance) {

};

/**
 * Returns number of blocked cols
 */
Handsontable.BlockedRows.prototype.count = function () {

};

/**
 * Create column header in the grid table
 */
Handsontable.BlockedRows.prototype.createCol = function (className) {

};

/**
 * Create column header in the grid table
 */
Handsontable.BlockedRows.prototype.create = function () {

};

/**
 * Copy table column header onto the floating layer above the grid
 */
Handsontable.BlockedRows.prototype.refresh = function () {

};

/**
 * Refresh border width
 */
Handsontable.BlockedRows.prototype.refreshBorders = function () {

};

/**
 * Recalculate column widths on the floating layer above the grid
 */
Handsontable.BlockedRows.prototype.dimensions = function () {

};


/**
 * Update settings of the column header
 */
Handsontable.BlockedRows.prototype.update = function () {

};

/**
 * Add column header to DOM
 */
Handsontable.BlockedRows.prototype.addHeader = function (header) {

};

/**
 * Remove column header from DOM
 */
Handsontable.BlockedRows.prototype.destroyHeader = function (className) {

};

/**
 * Puts string to small text template
 */
Handsontable.BlockedRows.prototype.headerText = function (str) {

};
/**
 * Handsontable BlockedCols class
 * @param {Object} instance
 */
Handsontable.BlockedCols = function (instance) {

};

/**
 * Determine cell height method
 * @return {String}
 */
Handsontable.BlockedCols.prototype.determineCellHeightMethod = function () {

};

/**
 * Returns number of blocked cols
 */
Handsontable.BlockedCols.prototype.count = function () {

};

/**
 * Create row header in the grid table
 */
Handsontable.BlockedCols.prototype.createRow = function (tr) {

};

/**
 * Create row header in the grid table
 */
Handsontable.BlockedCols.prototype.create = function () {

};

/**
 * Copy table row header onto the floating layer above the grid
 */
Handsontable.BlockedCols.prototype.refresh = function () {

};

/**
 * Refresh border width
 */
Handsontable.BlockedCols.prototype.refreshBorders = function () {

};

/**
 * Recalculate row heights on the floating layer above the grid
 */
Handsontable.BlockedCols.prototype.dimensions = function () {

};

/**
 * Update settings of the row header
 */
Handsontable.BlockedCols.prototype.update = Handsontable.BlockedRows.prototype.update;

/**
 * Add row header to DOM
 */
Handsontable.BlockedCols.prototype.addHeader = function (header) {

};

/**
 * Remove row header from DOM
 */
Handsontable.BlockedCols.prototype.destroyHeader = function (className) {

};

/**
 * Puts string to small text template
 */
Handsontable.BlockedCols.prototype.headerText = Handsontable.BlockedRows.prototype.headerText;
/**
 * Handsontable RowHeader extension
 * @param {Object} instance
 * @param {Array|Boolean} [labels]
 */
Handsontable.RowHeader = function (instance, labels) {
  var that = this;
  this.className = 'htRowHeader';
  instance.blockedCols.main.on('mousedown', 'th.htRowHeader', function (event) {
    if (!$(event.target).hasClass('btn') && !$(event.target).hasClass('btnContainer')) {
      instance.deselectCell();
      $(this).addClass('active');
      that.lastActive = this;
      var offset = instance.blockedRows.count();
      instance.selectCell(this.parentNode.rowIndex - offset, 0, this.parentNode.rowIndex - offset, instance.colCount - 1, false);
    }
  });
  instance.rootElement.on('deselect.handsontable', function () {
    that.deselect();
  });
  this.labels = labels;
  this.instance = instance;
  this.instance.rowHeader = this;
  this.format = 'small';
  instance.blockedCols.addHeader(this);
};

/**
 * Return custom row label or automatically generate one
 * @param {Number} index Row index
 * @return {String}
 */
Handsontable.RowHeader.prototype.columnLabel = function (index) {
  if (typeof this.labels[index] !== 'undefined') {
    return this.labels[index];
  }
  return index + 1;
};

/**
 * Remove current highlight of a currently selected row header
 */
Handsontable.RowHeader.prototype.deselect = function () {
  if (this.lastActive) {
    $(this.lastActive).removeClass('active');
    this.lastActive = null;
  }
};

/**
 *
 */
Handsontable.RowHeader.prototype.destroy = function () {
  this.instance.blockedCols.destroyHeader(this.className);
};
/**
 * Handsontable ColHeader extension
 * @param {Object} instance
 * @param {Array|Boolean} [labels]
 */
Handsontable.ColHeader = function (instance, labels) {
  var that = this;
  this.className = 'htColHeader';
  instance.rootElement.on('mousedown', 'th.htColHeader', function () {
    instance.deselectCell();
    var $th = $(this);
    $th.addClass('active');
    that.lastActive = this;
    var index = $th.index();
    var offset = instance.blockedCols ? instance.blockedCols.count() : 0;
    instance.selectCell(0, index - offset, instance.countRows() - 1, index - offset, false);
  });
  instance.rootElement.on('deselect.handsontable', function () {
    that.deselect();
  });
  this.instance = instance;
  this.labels = labels;
  this.instance.colHeader = this;
  this.format = 'small';
  instance.blockedRows.addHeader(this);
};

/**
 * Return custom column label or automatically generate one
 * @param {Number} index Row index
 * @return {String}
 */
Handsontable.ColHeader.prototype.columnLabel = function (index) {
  if (typeof this.labels[index] !== 'undefined') {
    return this.labels[index];
  }
  var dividend = index + 1;
  var columnLabel = '';
  var modulo;
  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt((dividend - modulo) / 26);
  }
  return columnLabel;
};

/**
 * Remove current highlight of a currently selected column header
 */
Handsontable.ColHeader.prototype.deselect = Handsontable.RowHeader.prototype.deselect;

/**
 *
 */
Handsontable.ColHeader.prototype.destroy = function () {
  this.instance.blockedRows.destroyHeader(this.className);
};
/**
 * Default text renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.TextRenderer = function (instance, td, row, col, prop, value, cellProperties) {
  var escaped = Handsontable.helper.stringify(value);
  escaped = escaped.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); //escape html special chars
  td.innerHTML = escaped.replace(/\n/g, '<br/>');
};
/**
 * Autocomplete renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.AutocompleteRenderer = function (instance, td, row, col, prop, value, cellProperties) {
  var $td = $(td);
  var $text = $('<div class="htAutocomplete"></div>');
  var $arrow = $('<div class="htAutocompleteArrow">&#x25BC;</div>');
  $arrow.mouseup(function(){
    $td.triggerHandler('dblclick.editor');
  });

  Handsontable.TextCell.renderer(instance, $text[0], row, col, prop, value, cellProperties);

  if($text.html() === '') {
    $text.html('&nbsp;');
  }

  $text.append($arrow);
  $td.empty().append($text);
};
/**
 * Checkbox renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.CheckboxRenderer = function (instance, td, row, col, prop, value, cellProperties) {
  if (typeof cellProperties.checkedTemplate === "undefined") {
    cellProperties.checkedTemplate = true;
  }
  if (typeof cellProperties.uncheckedTemplate === "undefined") {
    cellProperties.uncheckedTemplate = false;
  }
  if (value === cellProperties.checkedTemplate || value === Handsontable.helper.stringify(cellProperties.checkedTemplate)) {
    td.innerHTML = "<input type='checkbox' checked autocomplete='no'>";
  }
  else if (value === cellProperties.uncheckedTemplate || value === Handsontable.helper.stringify(cellProperties.uncheckedTemplate)) {
    td.innerHTML = "<input type='checkbox' autocomplete='no'>";
  }
  else if (value === null) { //default value
    td.innerHTML = "<input type='checkbox' autocomplete='no' style='opacity: 0.5'>";
  }
  else {
    td.innerHTML = "#bad value#";
  }

  $(td).find('input').change(function () {
    if ($(this).is(':checked')) {
      instance.setDataAtCell(row, prop, cellProperties.checkedTemplate);
    }
    else {
      instance.setDataAtCell(row, prop, cellProperties.uncheckedTemplate);
    }
  });

  return td;
};
var texteditor = {
  isCellEdited: false,

  /**
   * Returns caret position in edit proxy
   * @author http://stackoverflow.com/questions/263743/how-to-get-caret-position-in-textarea
   * @return {Number}
   */
  getCaretPosition: function (keyboardProxy) {
    var el = keyboardProxy[0];
    if (el.selectionStart) {
      return el.selectionStart;
    }
    else if (document.selection) {
      el.focus();
      var r = document.selection.createRange();
      if (r == null) {
        return 0;
      }
      var re = el.createTextRange(),
        rc = re.duplicate();
      re.moveToBookmark(r.getBookmark());
      rc.setEndPoint('EndToStart', re);
      return rc.text.length;
    }
    return 0;
  },

  /**
   * Sets caret position in edit proxy
   * @author http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/
   * @param {Number}
   */
  setCaretPosition: function (keyboardProxy, pos) {
    var el = keyboardProxy[0];
    if (el.setSelectionRange) {
      el.focus();
      el.setSelectionRange(pos, pos);
    }
    else if (el.createTextRange) {
      var range = el.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  },

  /**
   * Shows text input in grid cell
   */
  beginEditing: function (instance, td, row, col, prop, keyboardProxy, useOriginalValue, suffix) {
    if (texteditor.isCellEdited) {
      return;
    }

    keyboardProxy.on('cut.editor', function (event) {
      event.stopPropagation();
    });

    keyboardProxy.on('paste.editor', function (event) {
      event.stopPropagation();
    });

    var $td = $(td);

    if (!instance.getCellMeta(row, col).isWritable) {
      return;
    }

    texteditor.isCellEdited = true;

    if (useOriginalValue) {
      var original = instance.getDataAtCell(row, prop);
      original = Handsontable.helper.stringify(original) + (suffix || '');
      keyboardProxy.val(original);
      texteditor.setCaretPosition(keyboardProxy, original.length);
    }
    else {
      keyboardProxy.val('');
    }

    texteditor.refreshDimensions(instance, $td, keyboardProxy);
    keyboardProxy.parent().removeClass('htHidden');

    instance.rootElement.triggerHandler('beginediting.handsontable');

    setTimeout(function () {
      //async fix for Firefox 3.6.28 (needs manual testing)
      keyboardProxy.parent().css({
        overflow: 'visible'
      });
    }, 1);
  },

  refreshDimensions: function (instance, $td, keyboardProxy) {
    if (!texteditor.isCellEdited) {
      return;
    }
    var width = $td.width()
      , height = $td.outerHeight() - 4;

    if (parseInt($td.css('border-top-width')) > 0) {
      height -= 1;
    }
    if (parseInt($td.css('border-left-width')) > 0) {
      if (instance.blockedCols.count() > 0) {
        width -= 1;
      }
    }

    keyboardProxy.autoResize({
      maxHeight: 200,
      minHeight: height,
      minWidth: width,
      maxWidth: Math.max(168, width),
      animate: false,
      extraSpace: 0
    });
  },

  /**
   * Finishes text input in selected cells
   */
  finishEditing: function (instance, td, row, col, prop, keyboardProxy, isCancelled, ctrlDown) {
    if (texteditor.triggerOnlyByDestroyer) {
      return;
    }
    if (texteditor.isCellEdited) {
      texteditor.isCellEdited = false;
      var val;
      if (isCancelled) {
        val = [
          [texteditor.originalValue]
        ];
      }
      else {
        val = [
          [$.trim(keyboardProxy.val())]
        ];
      }
      if (ctrlDown) { //if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
        var sel = instance.handsontable('getSelected');
        instance.populateFromArray({row: sel[0], col: sel[1]}, val, {row: sel[2], col: sel[3]}, false, 'edit');
      }
      else {
        instance.populateFromArray({row: row, col: col}, val, null, false, 'edit');
      }
    }
    keyboardProxy.off(".editor");
    $(td).off('.editor');

    keyboardProxy.css({
      width: 0,
      height: 0
    });
    keyboardProxy.parent().addClass('htHidden').css({
      overflow: 'hidden'
    });

    instance.rootElement.find('.htBorder.current').off('.editor');
    instance.rootElement.triggerHandler('finishediting.handsontable');
  }
};

/**
 * Default text editor
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param {Object} keyboardProxy jQuery element of keyboard proxy that contains current editing value
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.TextEditor = function (instance, td, row, col, prop, keyboardProxy, cellProperties) {
  texteditor.isCellEdited = false;
  texteditor.originalValue = instance.getDataAtCell(row, prop);
  texteditor.triggerOnlyByDestroyer = cellProperties.strict;

  var $current = $(td);
  var currentOffset = $current.offset();
  var containerOffset = instance.rootElement.offset();
  var scrollTop = instance.rootElement.scrollTop();
  var scrollLeft = instance.rootElement.scrollLeft();
  var editTop = currentOffset.top - containerOffset.top + scrollTop - 1;
  var editLeft = currentOffset.left - containerOffset.left + scrollLeft - 1;

  if (editTop < 0) {
    editTop = 0;
  }
  if (editLeft < 0) {
    editLeft = 0;
  }

  if (instance.blockedRows.count() > 0 && parseInt($current.css('border-top-width')) > 0) {
    editTop += 1;
  }
  if (instance.blockedCols.count() > 0 && parseInt($current.css('border-left-width')) > 0) {
    editLeft += 1;
  }

  if ($.browser.msie && parseInt($.browser.version, 10) <= 7) {
    editTop -= 1;
  }

  keyboardProxy.parent().addClass('htHidden').css({
    top: editTop,
    left: editLeft,
    overflow: 'hidden'
  });
  keyboardProxy.css({
    width: 0,
    height: 0
  });

  keyboardProxy.on('refreshBorder.editor', function () {
    setTimeout(function () {
      if (texteditor.isCellEdited) {
        texteditor.refreshDimensions(instance, $(td), keyboardProxy);
      }
    }, 0);
  });

  keyboardProxy.on("keydown.editor", function (event) {
    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    if (Handsontable.helper.isPrintableChar(event.keyCode)) {
      if (!texteditor.isCellEdited && !ctrlDown) { //disregard CTRL-key shortcuts
        texteditor.beginEditing(instance, td, row, col, prop, keyboardProxy);
        event.stopImmediatePropagation();
      }
      else if (ctrlDown) {
        if (texteditor.isCellEdited && event.keyCode === 65) { //CTRL + A
          event.stopPropagation();
        }
        else if (texteditor.isCellEdited && event.keyCode === 88 && $.browser.opera) { //CTRL + X
          event.stopPropagation();
        }
        else if (texteditor.isCellEdited && event.keyCode === 86 && $.browser.opera) { //CTRL + V
          event.stopPropagation();
        }
      }
      return;
    }

    switch (event.keyCode) {
      case 38: /* arrow up */
        if (texteditor.isCellEdited) {
          texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false);
        }
        break;

      case 9: /* tab */
        if (texteditor.isCellEdited) {
          texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false);
        }
        event.preventDefault();
        break;

      case 39: /* arrow right */
        if (texteditor.isCellEdited) {
          if (texteditor.getCaretPosition(keyboardProxy) === keyboardProxy.val().length) {
            texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false);

          }
          else {
            event.stopPropagation();
          }
        }
        break;

      case 37: /* arrow left */
        if (texteditor.isCellEdited) {
          if (texteditor.getCaretPosition(keyboardProxy) === 0) {
            texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false);
          }
          else {
            event.stopPropagation();
          }
        }
        break;

      case 8: /* backspace */
      case 46: /* delete */
        if (texteditor.isCellEdited) {
          event.stopPropagation();
        }
        break;

      case 40: /* arrow down */
        if (texteditor.isCellEdited) {
          texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false);
        }
        break;

      case 27: /* ESC */
        if (texteditor.isCellEdited) {
          instance.destroyEditor(true);
          event.stopPropagation();
        }
        break;

      case 113: /* F2 */
        if (!texteditor.isCellEdited) {
          texteditor.beginEditing(instance, td, row, col, prop, keyboardProxy, true); //show edit field
          event.stopPropagation();
          event.preventDefault(); //prevent Opera from opening Go to Page dialog
        }
        break;

      case 13: /* return/enter */
        if (texteditor.isCellEdited) {
          var selected = instance.getSelected();
          var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
          if ((event.ctrlKey && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
            keyboardProxy.val(keyboardProxy.val() + '\n');
            keyboardProxy[0].focus();
            event.stopPropagation();
          }
          else {
            texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, false, ctrlDown);
          }
        }
        else if (instance.getSettings().enterBeginsEditing) {
          if ((ctrlDown && !selection.isMultiple()) || event.altKey) { //if ctrl+enter or alt+enter, add new line
            texteditor.beginEditing(instance, td, row, col, prop, keyboardProxy, true, '\n'); //show edit field
          }
          else {
            texteditor.beginEditing(instance, td, row, col, prop, keyboardProxy, true); //show edit field
          }
          event.stopPropagation();
        }
        event.preventDefault(); //don't add newline to field
        break;

      case 36: /* home */
        event.stopPropagation();
        break;

      case 35: /* end */
        event.stopPropagation();
        break;
    }
  });

  function onDblClick() {
    keyboardProxy[0].focus();
    texteditor.beginEditing(instance, td, row, col, prop, keyboardProxy, true);
  }

  $current.on('dblclick.editor', onDblClick);
  instance.rootElement.find('.htBorder.current').on('dblclick.editor', onDblClick);

  return function (isCancelled) {
    texteditor.triggerOnlyByDestroyer = false;
    texteditor.finishEditing(instance, td, row, col, prop, keyboardProxy, isCancelled);
  }
};
function isAutoComplete(keyboardProxy) {
  var typeahead = keyboardProxy.data("typeahead");
  if (typeahead && typeahead.$menu.is(":visible")) {
    return typeahead;
  }
  else {
    return false;
  }
}

/**
 * Autocomplete editor
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param {Object} keyboardProxy jQuery element of keyboard proxy that contains current editing value
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.AutocompleteEditor = function (instance, td, row, col, prop, keyboardProxy, cellProperties) {
  var typeahead = keyboardProxy.data('typeahead')
    , i
    , dontHide = false;

  if (!typeahead) {
    keyboardProxy.typeahead(cellProperties.options || {});
    typeahead = keyboardProxy.data('typeahead');
    typeahead._show = typeahead.show;
    typeahead._hide = typeahead.hide;
    typeahead._render = typeahead.render;
    typeahead._highlighter = typeahead.highlighter;
  }
  else {
    if (cellProperties.options) {
      /* overwrite typeahead options (most importantly `items`) */
      for (i in cellProperties) {
        if (cellProperties.hasOwnProperty(i)) {
          typeahead.options[i] = cellProperties.options[i];
        }
      }
    }
    typeahead.$menu.off(); //remove previous typeahead bindings
    keyboardProxy.off(); //remove previous typeahead bindings. Removing this will cause prepare to register 2 keydown listeners in typeahead
    typeahead.listen(); //add typeahead bindings
  }

  typeahead.minLength = 0;
  typeahead.highlighter = typeahead._highlighter;

  typeahead.show = function () {
    if (keyboardProxy.parent().hasClass('htHidden')) {
      return;
    }
    return typeahead._show.call(this);
  };

  typeahead.hide = function () {
    if (!dontHide) {
      dontHide = false; //set to true by dblclick handler, otherwise appears and disappears immediately after double click
      return typeahead._hide.call(this);
    }
  };

  typeahead.lookup = function () {
    var items;
    this.query = this.$element.val();
    items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source;
    return items ? this.process(items) : this;
  };

  typeahead.matcher = function () {
    return true;
  };

  typeahead.select = function () {
    var val = this.$menu.find('.active').attr('data-value') || keyboardProxy.val();
    destroyer(true);
    instance.setDataAtCell(row, prop, typeahead.updater(val));
    return this.hide();
  };

  typeahead.render = function (items) {
    typeahead._render.call(this, items);
    if (!cellProperties.strict) {
      this.$menu.find('li:eq(0)').removeClass('active');
    }
    return this;
  };

  /* overwrite typeahead methods (matcher, sorter, highlighter, updater, etc) if provided in cellProperties */
  for (i in cellProperties) {
    if (cellProperties.hasOwnProperty(i)) {
      typeahead[i] = cellProperties[i];
    }
  }

  var wasDestroyed = false;

  keyboardProxy.on("keydown.editor", function (event) {
    switch (event.keyCode) {
      case 27: /* ESC */
        dontHide = false;
        break;

      case 37: /* arrow left */
      case 39: /* arrow right */
      case 38: /* arrow up */
      case 40: /* arrow down */
      case 9: /* tab */
      case 13: /* return/enter */
        if (!keyboardProxy.parent().hasClass('htHidden')) {
          event.stopImmediatePropagation();
        }
        event.preventDefault();
    }
  });

  keyboardProxy.on("keyup.editor", function (event) {
      if (wasDestroyed) {
        return;
      }

      switch (event.keyCode) {
        case 9: /* tab */
        case 13: /* return/enter */
          if (!isAutoComplete(keyboardProxy)) {
            var ev = $.Event('keyup');
            ev.keyCode = 113; //113 triggers lookup, in contrary to 13 or 9 which only trigger hide
            keyboardProxy.trigger(ev);
          }
          else {
            setTimeout(function () { //so pressing enter will move one row down after change is applied by 'select' above
              var ev = $.Event('keydown');
              ev.keyCode = event.keyCode;
              keyboardProxy.parent().trigger(ev);
            }, 10);
          }
          break;

        default:
          if (!Handsontable.helper.isPrintableChar(event.keyCode)) { //otherwise Del or F12 would open suggestions list
            event.stopImmediatePropagation();
          }
      }
    }
  );

  var textDestroyer = Handsontable.TextEditor(instance, td, row, col, prop, keyboardProxy, cellProperties);

  function onDblClick() {
    dontHide = true;
    setTimeout(function () { //otherwise is misaligned in IE9
      keyboardProxy.data('typeahead').lookup();
    }, 1);
  }

  $(td).on('dblclick.editor', onDblClick);
  instance.container.find('.htBorder.current').on('dblclick.editor', onDblClick);

  var destroyer = function (isCancelled) {
    wasDestroyed = true;
    keyboardProxy.off(); //remove typeahead bindings
    textDestroyer(isCancelled);
    dontHide = false;
    if (isAutoComplete(keyboardProxy)) {
      isAutoComplete(keyboardProxy).hide();
    }
  };

  return destroyer;
};
function toggleCheckboxCell(instance, row, prop, cellProperties) {
  if (Handsontable.helper.stringify(instance.getDataAtCell(row, prop)) === Handsontable.helper.stringify(cellProperties.checkedTemplate)) {
    instance.setDataAtCell(row, prop, cellProperties.uncheckedTemplate);
  }
  else {
    instance.setDataAtCell(row, prop, cellProperties.checkedTemplate);
  }
}

/**
 * Checkbox editor
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param {Object} keyboardProxy jQuery element of keyboard proxy that contains current editing value
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.CheckboxEditor = function (instance, td, row, col, prop, keyboardProxy, cellProperties) {
  if (typeof cellProperties === "undefined") {
    cellProperties = {};
  }
  if (typeof cellProperties.checkedTemplate === "undefined") {
    cellProperties.checkedTemplate = true;
  }
  if (typeof cellProperties.uncheckedTemplate === "undefined") {
    cellProperties.uncheckedTemplate = false;
  }

  keyboardProxy.on("keydown.editor", function (event) {
    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    if (!ctrlDown && Handsontable.helper.isPrintableChar(event.keyCode)) {
      toggleCheckboxCell(instance, row, prop, cellProperties);
      event.stopPropagation();
    }
  });

  function onDblClick() {
    toggleCheckboxCell(instance, row, prop, cellProperties);
  }

  var $td = $(td);
  $td.on('dblclick.editor', onDblClick);
  instance.container.find('.htBorder.current').on('dblclick.editor', onDblClick);

  return function () {
    keyboardProxy.off(".editor");
    $td.off(".editor");
    instance.container.find('.htBorder.current').off(".editor");
  }
};
Handsontable.AutocompleteCell = {
  renderer: Handsontable.AutocompleteRenderer,
  editor: Handsontable.AutocompleteEditor
};

Handsontable.CheckboxCell = {
  renderer: Handsontable.CheckboxRenderer,
  editor: Handsontable.CheckboxEditor
};

Handsontable.TextCell = {
  renderer: Handsontable.TextRenderer,
  editor: Handsontable.TextEditor
};
Handsontable.PluginHooks = {
  hooks: {
    afterInit: [],
    afterGetCellMeta: []
  },

  push: function (hook, fn) {
    this.hooks[hook].push(fn);
  },

  unshift: function (hook, fn) {
    this.hooks[hook].unshift(fn);
  },

  run: function (instance, hook, args) {
    for (var i = 0, ilen = this.hooks[hook].length; i < ilen; i++) {
      if (args) {
        this.hooks[hook][i].apply(instance, args);
      }
      else {
        this.hooks[hook][i].call(instance);
      }
    }
  }
};
function createContextMenu() {
  var instance = this
    , defaultOptions = {
      selector: "#" + instance.rootElement.attr('id') + ' table, #' + instance.rootElement.attr('id') + ' div',
      trigger: 'right',
      callback: onContextClick
    },
    allItems = {
      "row_above": {name: "Insert row above", disabled: isDisabled},
      "row_below": {name: "Insert row below", disabled: isDisabled},
      "hsep1": "---------",
      "col_left": {name: "Insert column on the left", disabled: isDisabled},
      "col_right": {name: "Insert column on the right", disabled: isDisabled},
      "hsep2": "---------",
      "remove_row": {name: "Remove row", disabled: isDisabled},
      "remove_col": {name: "Remove column", disabled: isDisabled},
      "hsep3": "---------",
      "undo": {name: "Undo", disabled: function () {
        return !instance.isUndoAvailable();
      }},
      "redo": {name: "Redo", disabled: function () {
        return !instance.isRedoAvailable();
      }}
    }
    , options = {}
    , i
    , ilen
    , settings = instance.getSettings();

  function onContextClick(key) {
    var corners = instance.getSelected(); //[top left row, top left col, bottom right row, bottom right col]

    switch (key) {
      case "row_above":
        instance.alter("insert_row", corners[0]);
        break;

      case "row_below":
        instance.alter("insert_row", corners[2] + 1);
        break;

      case "col_left":
        instance.alter("insert_col", corners[1]);
        break;

      case "col_right":
        instance.alter("insert_col", corners[3] + 1);
        break;

      case "remove_row":
        instance.alter(key, corners[0], corners[2]);
        break;

      case "remove_col":
        instance.alter(key, corners[1], corners[3]);
        break;

      case "undo":
        instance.undo();
        break;

      case "redo":
        instance.redo();
        break;
    }
  }

  function isDisabled(key) {
    if (instance.blockedCols.main.find('th.htRowHeader.active').length && (key === "remove_col" || key === "col_left" || key === "col_right")) {
      return true;
    }
    else if (instance.blockedRows.main.find('th.htColHeader.active').length && (key === "remove_row" || key === "row_above" || key === "row_below")) {
      return true;
    }
    else if (instance.countRows() >= instance.getSettings().maxRows && (key === "row_above" || key === "row_below")) {
      return true;
    }
    else if (instance.countCols() >= instance.getSettings().maxCols && (key === "col_left" || key === "col_right")) {
      return true;
    }
    else {
      return false;
    }
  }

  if (!settings.contextMenu) {
    return;
  }
  else if (settings.contextMenu === true) { //contextMenu is true
    options.items = allItems;
  }
  else if (Object.prototype.toString.apply(settings.contextMenu) === '[object Array]') { //contextMenu is an array
    options.items = {};
    for (i = 0, ilen = settings.contextMenu.length; i < ilen; i++) {
      var key = settings.contextMenu[i];
      if (typeof allItems[key] === 'undefined') {
        throw new Error('Context menu key "' + key + '" is not recognised');
      }
      options.items[key] = allItems[key];
    }
  }
  else if (Object.prototype.toString.apply(settings.contextMenu) === '[object Object]') { //contextMenu is an options object as defined in http://medialize.github.com/jQuery-contextMenu/docs.html
    options = settings.contextMenu;
    if (options.items) {
      for (i in options.items) {
        if (options.items.hasOwnProperty(i) && allItems[i]) {
          if (typeof options.items[i] === 'string') {
            options.items[i] = allItems[i];
          }
          else {
            options.items[i] = $.extend(true, allItems[i], options.items[i]);
          }
        }
      }
    }
    else {
      options.items = allItems;
    }

    if (options.callback) {
      var handsontableCallback = defaultOptions.callback;
      var customCallback = options.callback;
      options.callback = function (key, options) {
        handsontableCallback(key, options);
        customCallback(key, options);
      }
    }
  }

  if (!instance.rootElement.attr('id')) {
    throw new Error("Handsontable container must have an id");
  }

  $.contextMenu($.extend(true, defaultOptions, options));
}

Handsontable.PluginHooks.push('afterInit', createContextMenu);
/**
 * This plugin adds support for legacy features, deprecated APIs, etc.
 */

/**
 * Support for old autocomplete syntax
 * For old syntax, see: https://github.com/warpech/jquery-handsontable/blob/8c9e701d090ea4620fe08b6a1a048672fadf6c7e/README.md#defining-autocomplete
 */
Handsontable.PluginHooks.push('afterGetCellMeta', function (row, col, cellProperties) {
  var settings = this.getSettings(), data = this.getData(), i, ilen, a;
  if (settings.autoComplete) {
    for (i = 0, ilen = settings.autoComplete.length; i < ilen; i++) {
      if (settings.autoComplete[i].match(row, col, data)) {
        if (typeof cellProperties.type === 'undefined') {
          cellProperties.type = Handsontable.AutocompleteCell;
        }
        else {
          if (typeof cellProperties.type.renderer === 'undefined') {
            cellProperties.type.renderer = Handsontable.AutocompleteCell.renderer;
          }
          if (typeof cellProperties.type.editor === 'undefined') {
            cellProperties.type.editor = Handsontable.AutocompleteCell.editor;
          }
        }
        for (a in settings.autoComplete[i]) {
          if (settings.autoComplete[i].hasOwnProperty(a) && a !== 'match' && typeof cellProperties[i] === 'undefined') {
            if(a === 'source') {
              cellProperties[a] = settings.autoComplete[i][a](row, col);
            }
            else {
              cellProperties[a] = settings.autoComplete[i][a];
            }
          }
        }
        break;
      }
    }
  }
});
/*
 * jQuery.fn.autoResize 1.1+
 * --
 * https://github.com/warpech/jQuery.fn.autoResize
 *
 * This fork differs from others in a way that it autoresizes textarea in 2-dimensions (horizontally and vertically).
 * It was originally forked from alexbardas's repo but maybe should be merged with dpashkevich's repo in future.
 *
 * originally forked from:
 * https://github.com/jamespadolsey/jQuery.fn.autoResize
 * which is now located here:
 * https://github.com/alexbardas/jQuery.fn.autoResize
 * though the mostly maintained for is here:
 * https://github.com/dpashkevich/jQuery.fn.autoResize/network
 *
 * --
 * This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the Do What The Fuck You Want
 * To Public License, Version 2, as published by Sam Hocevar. See
 * http://sam.zoy.org/wtfpl/COPYING for more details. */

(function($){

  autoResize.defaults = {
    onResize: function(){},
    animate: {
      duration: 200,
      complete: function(){}
    },
    extraSpace: 50,
    minHeight: 'original',
    maxHeight: 500,
    minWidth: 'original',
    maxWidth: 500
  };

  autoResize.cloneCSSProperties = [
    'lineHeight', 'textDecoration', 'letterSpacing',
    'fontSize', 'fontFamily', 'fontStyle', 'fontWeight',
    'textTransform', 'textAlign', 'direction', 'wordSpacing', 'fontSizeAdjust',
    'padding'
  ];

  autoResize.cloneCSSValues = {
    position: 'absolute',
    top: -9999,
    left: -9999,
    opacity: 0,
    overflow: 'hidden',
    border: '1px solid black',
    padding: '0.49em' //this must be about the width of caps W character
  };

  autoResize.resizableFilterSelector = 'textarea,input:not(input[type]),input[type=text],input[type=password]';

  autoResize.AutoResizer = AutoResizer;

  $.fn.autoResize = autoResize;

  function autoResize(config) {
    this.filter(autoResize.resizableFilterSelector).each(function(){
      new AutoResizer( $(this), config );
    });
    return this;
  }

  function AutoResizer(el, config) {

    if(this.clones) return;

    this.config = $.extend({}, autoResize.defaults, config);

    this.el = el;

    this.nodeName = el[0].nodeName.toLowerCase();

    this.previousScrollTop = null;

    if (config.maxWidth === 'original') config.maxWidth = el.width();
    if (config.minWidth === 'original') config.minWidth = el.width();
    if (config.maxHeight === 'original') config.maxHeight = el.height();
    if (config.minHeight === 'original') config.minHeight = el.height();

    if (this.nodeName === 'textarea') {
      el.css({
        resize: 'none',
        overflowY: 'hidden'
      });
    }

    el.data('AutoResizer', this);

    this.createClone();
    this.injectClone();
    this.bind();

  }

  AutoResizer.prototype = {

    bind: function() {

      var check = $.proxy(function(){
        this.check();
        return true;
      }, this);

      this.unbind();

      this.el
        .bind('keyup.autoResize', check)
        //.bind('keydown.autoResize', check)
        .bind('change.autoResize', check);

      this.check(null, true);

    },

    unbind: function() {
      this.el.unbind('.autoResize');
    },

    createClone: function() {

      var el = this.el,
        self = this,
        config = this.config;

      this.clones = $();

      if (config.minHeight !== 'original' || config.maxHeight !== 'original') {
        this.hClone = el.clone().height('auto');
        this.clones = this.clones.add(this.hClone);
      }
      if (config.minWidth !== 'original' || config.maxWidth !== 'original') {
        this.wClone = $('<div/>').width('auto').css({
          whiteSpace: 'nowrap',
          'float': 'left'
        });
        this.clones = this.clones.add(this.wClone);
      }

      $.each(autoResize.cloneCSSProperties, function(i, p){
        self.clones.css(p, el.css(p));
      });

      this.clones
        .removeAttr('name')
        .removeAttr('id')
        .attr('tabIndex', -1)
        .css(autoResize.cloneCSSValues);

    },

    check: function(e, immediate) {

      var config = this.config,
        wClone = this.wClone,
        hClone = this.hClone,
        el = this.el,
        value = el.val();

      if (wClone) {

        wClone.text(value);

        // Calculate new width + whether to change
        var cloneWidth = wClone.outerWidth(),
          newWidth = (cloneWidth + config.extraSpace) >= config.minWidth ?
            cloneWidth + config.extraSpace : config.minWidth,
          currentWidth = el.width();

        newWidth = Math.min(newWidth, config.maxWidth);

        if (
          (newWidth < currentWidth && newWidth >= config.minWidth) ||
            (newWidth >= config.minWidth && newWidth <= config.maxWidth)
          ) {

          config.onResize.call(el);

          el.scrollLeft(0);

          config.animate && !immediate ?
            el.stop(1,1).animate({
              width: newWidth
            }, config.animate)
            : el.width(newWidth);

        }

      }

      if (hClone) {

        if (newWidth) {
          hClone.width(newWidth);
        }

        hClone.height(0).val(value).scrollTop(10000);

        var scrollTop = hClone[0].scrollTop + config.extraSpace;

        // Don't do anything if scrollTop hasen't changed:
        if (this.previousScrollTop === scrollTop) {
          return;
        }

        this.previousScrollTop = scrollTop;

        if (scrollTop >= config.maxHeight) {
          el.css('overflowY', '');
          return;
        }

        el.css('overflowY', 'hidden');

        if (scrollTop < config.minHeight) {
          scrollTop = config.minHeight;
        }

        config.onResize.call(el);

        // Either animate or directly apply height:
        config.animate && !immediate ?
          el.stop(1,1).animate({
            height: scrollTop
          }, config.animate)
          : el.height(scrollTop);
      }
    },

    destroy: function() {
      this.unbind();
      this.el.removeData('AutoResizer');
      this.clones.remove();
      delete this.el;
      delete this.hClone;
      delete this.wClone;
      delete this.clones;
    },

    injectClone: function() {
      (
        autoResize.cloneContainer ||
          (autoResize.cloneContainer = $('<arclones/>').appendTo('body'))
        ).append(this.clones);
    }

  };

})(jQuery);
/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 * 
 * Requires: 1.2.2+
 */

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

if ($.event.fixHooks) {
    for ( var i=types.length; i; ) {
        $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
}

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },
    
    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
    
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";
    
    // Old school scrollwheel delta
    if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
    if ( orgEvent.detail     ) { delta = -orgEvent.detail/3; }
    
    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;
    
    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }
    
    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
    
    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);
    
    return ($.event.dispatch || $.event.handle).apply(this, args);
}

})(jQuery);

/**
 * SheetClip - Spreadsheet Clipboard Parser
 * version 0.2
 *
 * This tiny library transforms JavaScript arrays to strings that are pasteable by LibreOffice, OpenOffice,
 * Google Docs and Microsoft Excel.
 *
 * Copyright 2012, Marcin Warpechowski
 * Licensed under the MIT license.
 * http://github.com/warpech/sheetclip/
 */
/*jslint white: true*/
(function (global) {
  "use strict";

  function countQuotes(str) {
    return str.split('"').length - 1;
  }

  global.SheetClip = {
    parse: function (str) {
      var r, rlen, rows, arr = [], a = 0, c, clen, multiline, last;
      rows = str.split('\n');
      if (rows.length > 1 && rows[rows.length - 1] === '') {
        rows.pop();
      }
      for (r = 0, rlen = rows.length; r < rlen; r += 1) {
        rows[r] = rows[r].split('\t');
        for (c = 0, clen = rows[r].length; c < clen; c += 1) {
          if (!arr[a]) {
            arr[a] = [];
          }
          if (multiline && c === 0) {
            last = arr[a].length - 1;
            arr[a][last] = arr[a][last] + '\n' + rows[r][0];
            if (multiline && countQuotes(rows[r][0]) % 2 === 1) {
              multiline = false;
              arr[a][last] = arr[a][last].substring(0, arr[a][last].length - 1).replace(/""/g, '"');
            }
          }
          else {
            if (c === clen - 1 && rows[r][c].indexOf('"') === 0) {
              arr[a].push(rows[r][c].substring(1).replace(/""/g, '"'));
              multiline = true;
            }
            else {
              arr[a].push(rows[r][c].replace(/""/g, '"'));
              multiline = false;
            }
          }
        }
        if (!multiline) {
          a += 1;
        }
      }
      return arr;
    },

    stringify: function (arr) {
      var r, rlen, c, clen, str = '', val;
      for (r = 0, rlen = arr.length; r < rlen; r += 1) {
        for (c = 0, clen = arr[r].length; c < clen; c += 1) {
          if (c > 0) {
            str += '\t';
          }
          val = arr[r][c];
          if (typeof val === 'string') {
            if (val.indexOf('\n') > -1) {
              str += '"' + val.replace(/"/g, '""') + '"';
            }
            else {
              str += val;
            }
          }
          else if (val === null || val === void 0) { //void 0 resolves to undefined
            str += '';
          }
          else {
            str += val;
          }
        }
        str += '\n';
      }
      return str;
    }
  };
}(window));
/**
 * walkontable 0.1
 * 
 * Date: Sun Dec 02 2012 12:42:34 GMT+0100 (Central European Standard Time)
*/

function Walkontable(settings) {
  var that = this;
  var originalHeaders = [];

  //default settings. void 0 means it is required, null means it can be empty
  var defaults = {
    table: void 0,
    data: void 0,
    offsetRow: 0,
    offsetColumn: 0,
    rowHeaders: false,
    columnHeaders: false,
    totalRows: void 0,
    totalColumns: void 0,
    displayRows: function () {
      return that.getSetting('totalRows'); //display all rows by default
    },
    displayColumns: function () {
      if (that.wtTable.THEAD.childNodes[0].childNodes.length) {
        return that.wtTable.THEAD.childNodes[0].childNodes.length;
      }
      else {
        return that.getSetting('totalColumns'); //display all columns by default
      }
    },
    selections: null,
    onCellMouseDown: null
  };

  //reference to settings
  this.settings = {};
  for (var i in defaults) {
    if (defaults.hasOwnProperty(i)) {
      if (settings[i] !== void 0) {
        this.settings[i] = settings[i];
      }
      else if (defaults[i] === void 0) {
        throw new Error('A required setting "' + i + '" was not provided');
      }
      else {
        this.settings[i] = defaults[i];
      }
    }
  }

  //bootstrap from settings
  this.wtTable = new WalkontableTable(this);
  this.wtScrollV = new WalkontableScrollbar(this, 'vertical');
  this.wtScrollH = new WalkontableScrollbar(this, 'horizontal');
  this.wtWheel = new WalkontableWheel(this);
  this.wtEvent = new WalkontableEvent(this);
  this.wtDom = new WalkontableDom();

  //find original headers
  if (this.wtTable.THEAD.childNodes.length && this.wtTable.THEAD.childNodes[0].childNodes.length) {
    for (var c = 0, clen = this.wtTable.THEAD.childNodes[0].childNodes.length; c < clen; c++) {
      originalHeaders.push(this.wtTable.THEAD.childNodes[0].childNodes[c].innerHTML);
    }
    if (!this.hasSetting('columnHeaders')) {
      this.settings.columnHeaders = function (column) {
        return originalHeaders[column];
      }
    }
  }

  //initialize selections
  this.selections = {};
  if (this.settings.selections) {
    for (i in this.settings.selections) {
      if (this.settings.selections.hasOwnProperty(i)) {
        this.selections[i] = (function (setting) {
          return new WalkontableSelection(function (coords) {
            var TD = that.wtTable.getCell(coords);
            if (setting.className) {
              that.wtDom.addClass(TD, setting.className);
            }
            if (setting.border) {
              TD.style.outline = setting.border.width + 'px ' + setting.border.style + ' ' + setting.border.color;
            }
          }, function (coords) {
            var TD = that.wtTable.getCell(coords);
            if (setting.className) {
              that.wtDom.removeClass(TD, setting.className);
            }
            if (setting.border) {
              TD.style.outline = '';
            }
          });
        })(this.settings.selections[i])
      }
    }
  }

  this.drawn = false;
}

Walkontable.prototype.draw = function () {
  this.wtTable.draw();
  this.wtScrollV.refresh();
  this.wtScrollH.refresh();
  this.drawn = true;
  return this;
};

Walkontable.prototype.update = function (settings, value) {
  if (value === void 0) { //settings is object
    for (var i in settings) {
      if (settings.hasOwnProperty(i)) {
        this.settings[i] = settings[i];
      }
    }
  }
  else { //if value is defined then settings is the key
    this.settings[settings] = value;
  }
  return this;
};

Walkontable.prototype.scrollVertical = function (delta) {
  var max = this.getSetting('totalRows') - 1 - this.settings.displayRows;
  this.settings.offsetRow = this.settings.offsetRow + delta;
  if (this.settings.offsetRow < 0) {
    this.settings.offsetRow = 0;
  }
  else if (this.settings.offsetRow >= max) {
    this.settings.offsetRow = max;
  }
  return this;
};

Walkontable.prototype.scrollHorizontal = function (delta) {
  var max = this.getSetting('totalColumns') - this.settings.displayColumns;
  if (this.hasSetting('rowHeaders')) {
    max++;
  }
  this.settings.offsetColumn = this.settings.offsetColumn + delta;
  if (this.settings.offsetColumn < 0) {
    this.settings.offsetColumn = 0;
  }
  else if (this.settings.offsetColumn >= max) {
    this.settings.offsetColumn = max;
  }
  return this;
};

Walkontable.prototype.getSetting = function (key, param1, param2, param3) {
  if (typeof this.settings[key] === 'function') {
    return this.settings[key](param1, param2, param3);
  }
  else {
    return this.settings[key];
  }
};

Walkontable.prototype.hasSetting = function (key) {
  return !!this.settings[key]
};
function WalkontableDom() {
}

//goes up the DOM tree (including given element) until it finds an element that matches the nodeName
WalkontableDom.prototype.closest = function (elem, nodeNames) {
  while (elem != null) {
    if (elem.nodeType === 1 && nodeNames.indexOf(elem.nodeName) > -1) {
      return elem;
    }
    elem = elem.parentNode;
  }
  return null;
};

WalkontableDom.prototype.prevSiblings = function (elem) {
  var out = [];
  while ((elem = elem.previousSibling) != null) {
    if (elem.nodeType === 1) {
      out.push(elem);
    }
  }
  return out;
};

//http://snipplr.com/view/3561/addclass-removeclass-hasclass/
WalkontableDom.prototype.hasClass = function (ele, cls) {
  return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
};

WalkontableDom.prototype.addClass = function (ele, cls) {
  if (!this.hasClass(ele, cls)) ele.className += " " + cls;
};

WalkontableDom.prototype.removeClass = function (ele, cls) {
  if (this.hasClass(ele, cls)) { //is this really needed?
    var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
    ele.className = ele.className.replace(reg, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, ''); //last 2 replaces do right trim (see http://blog.stevenlevithan.com/archives/faster-trim-javascript)
  }
};

/*//http://net.tutsplus.com/tutorials/javascript-ajax/javascript-from-null-cross-browser-event-binding/
 WalkontableDom.prototype.addEvent = (function () {
 var that = this;
 if (document.addEventListener) {
 return function (elem, type, cb) {
 if ((elem && !elem.length) || elem === window) {
 elem.addEventListener(type, cb, false);
 }
 else if (elem && elem.length) {
 var len = elem.length;
 for (var i = 0; i < len; i++) {
 that.addEvent(elem[i], type, cb);
 }
 }
 };
 }
 else {
 return function (elem, type, cb) {
 if ((elem && !elem.length) || elem === window) {
 elem.attachEvent('on' + type, function () {

 //normalize
 //http://stackoverflow.com/questions/4643249/cross-browser-event-object-normalization
 var e = window['event'];
 e.target = e.srcElement;
 //e.offsetX = e.layerX;
 //e.offsetY = e.layerY;
 e.relatedTarget = e.relatedTarget || e.type == 'mouseover' ? e.fromElement : e.toElement;
 if (e.target.nodeType === 3) e.target = e.target.parentNode; //Safari bug

 return cb.call(elem, e)
 });
 }
 else if (elem.length) {
 var len = elem.length;
 for (var i = 0; i < len; i++) {
 that.addEvent(elem[i], type, cb);
 }
 }
 };
 }
 })();

 WalkontableDom.prototype.triggerEvent = function (element, eventName, target) {
 var event;
 if (document.createEvent) {
 event = document.createEvent("MouseEvents");
 event.initEvent(eventName, true, true);
 } else {
 event = document.createEventObject();
 event.eventType = eventName;
 }

 event.eventName = eventName;
 event.target = target;

 console.log("próbujem", event, element, target);

 if (document.createEvent) {
 target.dispatchEvent(event);
 } else {
 target.fireEvent("on" + event.eventType, event);
 }
 };*/

WalkontableDom.prototype.removeTextNodes = function (elem, parent) {
  if (elem.nodeType === 3) {
    parent.removeChild(elem); //bye text nodes!
  }
  else if (['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR'].indexOf(elem.nodeName) > -1) {
    var childs = elem.childNodes;
    for (var i = childs.length - 1; i >= 0; i--) {
      this.removeTextNodes(childs[i], elem);
    }
  }
};
function WalkontableEvent(instance) {
  var that = this;

  //reference to instance
  this.instance = instance;

  this.wtDom = new WalkontableDom();

  $(this.instance.settings.table).on('mousedown', function (event) {
    if (that.instance.settings.onCellMouseDown) {
      var TD = that.wtDom.closest(event.target, ['TD', 'TH']);
      that.instance.getSetting('onCellMouseDown', event, that.instance.wtTable.getCoords(TD), TD);
    }
  });
}
//http://stackoverflow.com/questions/3629183/why-doesnt-indexof-work-on-an-array-ie8
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (elt /*, from*/) {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
      ? Math.ceil(from)
      : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++) {
      if (from in this &&
        this[from] === elt)
        return from;
    }
    return -1;
  };
}
function WalkontableScrollbar(instance, type) {
  var that = this;

  //reference to instance
  this.instance = instance;
  this.type = type;
  var TABLE = this.instance.getSetting('table');
  this.$table = $(TABLE);
  var wtDom = new WalkontableDom();

  //create elements
  this.slider = document.createElement('DIV');
  this.slider.style.position = 'absolute';
  this.slider.style.top = '0';
  this.slider.style.left = '0';
  this.slider.className = 'dragdealer ' + type;

  this.handle = document.createElement('DIV');
  this.handle.className = 'handle';

  var parent = TABLE.parentNode;
  if (!parent || parent.nodeType !== 1 || !wtDom.hasClass(parent, 'wtHolder')) {
    var holder = document.createElement('DIV');
    holder.style.position = 'relative';
    holder.className = 'wtHolder';
    if (parent) {
      parent.insertBefore(holder, TABLE); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    holder.appendChild(TABLE);
    parent = holder;
  }

  this.slider.appendChild(this.handle);
  parent.appendChild(this.slider);

  this.dragdealer = new Dragdealer(this.slider, {
    vertical: (type === 'vertical'),
    horizontal: (type === 'horizontal'),
    speed: 100,
    yPrecision: 100,
    animationCallback: function (x, y) {
      that.onScroll(type === 'vertical' ? y : x);
    }
  });
}

WalkontableScrollbar.prototype.onScroll = function (delta) {
  if (this.instance.drawn) {
    var keys = this.type === 'vertical' ? ['offsetRow', 'totalRows', 'displayRows'] : ['offsetColumn', 'totalColumns', 'displayColumns'];
    var total = this.instance.getSetting(keys[1]);
    var display = this.instance.getSetting(keys[2]);
    if(total > display) {
      var newOffset = Math.max(0, Math.round((total - display) * delta));
      if (newOffset !== this.instance.getSetting(keys[0])) { //is new offset different than old offset
        this.instance.update(keys[0], newOffset);
        this.instance.draw();
      }
    }
  }
};

WalkontableScrollbar.prototype.refresh = function () {
  var ratio = 1
    , handleSize
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , tableWidth = this.$table.outerWidth()
    , tableHeight = this.$table.outerHeight()
    , displayRows = Math.min(this.instance.getSetting('displayRows'), totalRows)
    , displayColumns = Math.min(this.instance.getSetting('displayColumns'), totalColumns);

  if (!tableWidth) {
    throw new Error("I could not compute table width. Is the <table> element attached to the DOM?");
  }
  if (!tableHeight) {
    throw new Error("I could not compute table height. Is the <table> element attached to the DOM?");
  }

  if (this.type === 'vertical') {
    this.slider.style.top = this.$table.position().top + 'px';
    this.slider.style.left = tableWidth - 1 + 'px'; //1 is sliders border-width
    this.slider.style.height = tableHeight - 2 + 'px'; //2 is sliders border-width

    if (totalRows) {
      ratio = displayRows / totalRows;
    }
    handleSize = Math.round($(this.slider).height() * ratio);
    if (handleSize < 10) {
      handleSize = 30;
    }
    this.handle.style.height = handleSize + 'px';
  }
  else if (this.type === 'horizontal') {
    this.slider.style.left = this.$table.position().left + 'px';
    this.slider.style.top = tableHeight - 1 + 'px'; //1 is sliders border-width
    this.slider.style.width = tableWidth - 2 + 'px'; //2 is sliders border-width

    if (totalColumns) {
      ratio = displayColumns / totalColumns;
    }
    handleSize = Math.round($(this.slider).width() * ratio);
    if (handleSize < 10) {
      handleSize = 30;
    }
    this.handle.style.width = handleSize + 'px';
  }

  this.dragdealer.setWrapperOffset();
  //this.dragdealer.setBoundsPadding();
  this.dragdealer.setBounds();
  //this.dragdealer.setSteps();
};
function WalkontableSelection(onAdd, onRemove) {
  this.selected = [];
  this.onAdd = onAdd; //optional
  this.onRemove = onRemove; //optional
  //this.wtCell = new WalkontableCell();
  //this.wtDom = new WalkontableDom();
}

WalkontableSelection.prototype.add = function (coords) {
  this.selected.push(coords);
  if (this.onAdd) {
    this.onAdd(coords);
  }
};

WalkontableSelection.prototype.remove = function (coords) {
  var index = this.isSelected(coords);
  if (index > -1) {
    this.selected.splice(index, 1);
    if (this.onRemove) {
      this.onRemove(coords);
    }
  }
};

WalkontableSelection.prototype.clear = function () {
  for (var i = 0, ilen = this.selected.length; i < ilen; i++) {
    this.remove(this.selected[i]);
  }
};

WalkontableSelection.prototype.isSelected = function (coords) {
  for (var i = 0, ilen = this.selected.length; i < ilen; i++) {
    if(this.selected[i][0] === coords[0] && this.selected[i][1] === coords[1]) {
      return i;
    }
  }
  return -1;
};

WalkontableSelection.prototype.getSelected = function () {
  return this.selected;
};

/*WalkontableSelection.prototype.rectangleSize = function () {
  var that = this
    , rowLengths = {}
    , rowBegins = {}
    , rowEnds = {}
    , row
    , col
    , rowSpan
    , colSpan
    , lastRow
    , i
    , ilen
    , j
    , height = 0
    , tableSection
    , lastTableSection;

  this.selected.sort(function (a, b) {
    return that.wtCell.colIndex(a) - that.wtCell.colIndex(b);
  });

  this.selected.sort(function (a, b) {
    return that.wtCell.rowIndex(a) - that.wtCell.rowIndex(b);
  });

  for (i = 0, ilen = this.selected.length; i < ilen; i++) {
    tableSection = this.wtDom.closestParent(this.selected[i], ['THEAD', 'TBODY', 'TFOOT', 'TABLE']);
    if(lastTableSection && lastTableSection !== tableSection) {
      return null; //can only select cells that are in the same section (thead, tbody, tfoot or table if none of them is defined)
    }
    lastTableSection = tableSection;

    row = this.wtCell.rowIndex(this.selected[i]);
    col = this.wtCell.colIndex(this.selected[i]);
    rowSpan = this.selected[i].rowSpan;
    colSpan = this.selected[i].colSpan;
    for (j = 0; j < rowSpan; j++) {
      if (typeof rowBegins[row + j] === 'undefined' || col < rowBegins[row + j]) {
        rowBegins[row + j] = col;
      }
      if (typeof rowEnds[row + j] === 'undefined' || col + colSpan - 1 > rowEnds[row + j]) {
        rowEnds[row + j] = col + colSpan - 1;
      }
      if (typeof rowLengths[row + j] === 'undefined') {
        rowLengths[row + j] = 0;
        height++;
      }
      rowLengths[row + j] += colSpan;
    }
  }

  if (!ilen) {
    return null; //empty selection
  }

  lastRow = -1;
  for (i in rowBegins) {
    if (rowBegins.hasOwnProperty(i)) {
      if (lastRow !== -1 && rowBegins[i] !== lastRow) {
        return null; //selected rows begin in different column
      }
      lastRow = rowBegins[i];
    }
  }

  lastRow = -1;
  for (i in rowEnds) {
    if (rowEnds.hasOwnProperty(i)) {
      if (lastRow !== -1 && rowEnds[i] !== lastRow) {
        return null; //selected rows end in different column
      }
      if (rowEnds[i] !== rowBegins[i] + rowLengths[i] - 1) {
        return null; //selected rows end does not match begin + length
      }
      lastRow = rowEnds[i];
    }
  }

  lastRow = -1;
  for (i in rowLengths) {
    if (rowLengths.hasOwnProperty(i)) {
      if (lastRow !== -1 && rowLengths[i] !== lastRow) {
        return null; //selected rows have different length
      }
      if (lastRow !== -1 && !rowLengths.hasOwnProperty(i - 1)) {
        return null; //there is a row gap in selection
      }
      lastRow = rowLengths[i];
    }
  }

  return {width: lastRow, height: height};
};*/
function WalkontableTable(instance) {
  //reference to instance
  this.instance = instance;

  //bootstrap from settings
  this.TABLE = this.instance.getSetting('table');
  this.wtDom = new WalkontableDom();
  this.wtDom.removeTextNodes(this.TABLE);
  this.TBODY = this.TABLE.getElementsByTagName('TBODY')[0];
  if (!this.TBODY) {
    this.TBODY = document.createElement('TBODY');
    this.TABLE.appendChild(this.TBODY);
  }
  this.THEAD = this.TABLE.getElementsByTagName('THEAD')[0];
  if (!this.THEAD) {
    this.THEAD = document.createElement('THEAD');
    this.TABLE.insertBefore(this.THEAD, this.TBODY);
  }

  if (this.instance.hasSetting('columnHeaders')) {
    if (!this.THEAD.childNodes.length) {
      var TR = document.createElement('TR');
      this.THEAD.appendChild(TR);
    }
  }

  this.availableTRs = 0;
}

WalkontableTable.prototype.adjustAvailableNodes = function () {
  var totalRows = this.instance.getSetting('totalRows')
    , displayRows = this.instance.getSetting('displayRows')
    , displayColumns = this.instance.getSetting('displayColumns')
    , displayTds = displayColumns
    , TR
    , TH
    , TD;

  if (this.instance.hasSetting('rowHeaders')) {
    displayTds--;
  }

  if (this.instance.hasSetting('columnHeaders')) {
    var availableTHs = this.THEAD.childNodes[0].childNodes.length;
    while (availableTHs < displayColumns) {
      TH = document.createElement('TH');
      this.THEAD.firstChild.appendChild(TH);
      availableTHs++;
    }
  }

  displayRows = Math.min(displayRows, totalRows);
  while (this.availableTRs < displayRows) {
    TR = document.createElement('TR');
    if (this.instance.hasSetting('rowHeaders')) {
      TH = document.createElement('TH');
      TR.appendChild(TH);
    }
    for (var c = 0; c < displayTds; c++) {
      TD = document.createElement('TD');
      TR.appendChild(TD);
    }
    this.TBODY.appendChild(TR);
    this.availableTRs++;
  }

  var TRs = this.TABLE.getElementsByTagName('TR');

  for (var r = 0, rlen = TRs.length; r < rlen; r++) {
    while (TRs[r].childNodes.length > displayColumns) {
      TRs[r].removeChild(TRs[r].lastChild);
    }
  }
};

WalkontableTable.prototype.draw = function () {
  var r
    , c
    , offsetRow = this.instance.getSetting('offsetRow')
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , totalRows = this.instance.getSetting('totalRows')
    , displayRows = this.instance.getSetting('displayRows')
    , displayColumns = this.instance.getSetting('displayColumns')
    , offsetTd = 0
    , displayTds = displayColumns
    , TR
    , TH
    , TD
    , cellData;
  this.adjustAvailableNodes();

  if (this.instance.hasSetting('rowHeaders')) {
    displayTds--;
    offsetTd++;
    if (this.instance.hasSetting('columnHeaders')) {
      this.THEAD.childNodes[0].childNodes[0].innerHTML = '';
    }
  }

  //draw THEAD
  if (this.instance.hasSetting('columnHeaders')) {
    for (c = 0; c < displayTds; c++) {
      this.THEAD.childNodes[0].childNodes[offsetTd + c].innerHTML = this.instance.getSetting('columnHeaders', offsetColumn + c);
    }
  }

  //draw TBODY
  displayRows = Math.min(displayRows, totalRows);
  for (r = 0; r < displayRows; r++) {
    TR = this.TBODY.childNodes[r];
    if (this.instance.hasSetting('rowHeaders')) {
      TH = TR.childNodes[0];
      cellData = this.instance.getSetting('rowHeaders', offsetRow + r);
      if (cellData !== void 0) {
        TH.innerHTML = cellData;
      }
      else {
        TH.innerHTML = '';
      }
    }
    for (c = 0; c < displayTds; c++) {
      TD = TR.childNodes[c + offsetTd];
      cellData = this.instance.getSetting('data', offsetRow + r, offsetColumn + c);
      if (cellData !== void 0) {
        TD.innerHTML = cellData;
      }
      else {
        TD.innerHTML = '';
      }
      TD.className = '';
      TD.style.outline = ''; //temporary code to remove outline
    }
  }

  //redraw selections
  if (this.instance.selections) {
    for (r in this.instance.selections) {
      if (this.instance.selections.hasOwnProperty(r)) {
        for (c in this.instance.selections[r].selected) {
          if (this.instance.selections[r].selected.hasOwnProperty(c)) {
            TD = this.getCell(this.instance.selections[r].selected[c]);
            if (TD) {
              this.instance.selections[r].onAdd(this.instance.selections[r].selected[c], TD);
            }
          }
        }
      }
    }
  }

  return this;
};

WalkontableTable.prototype.getCell = function (coords) {
  var offsetRow = this.instance.getSetting('offsetRow')
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , displayRows = this.instance.getSetting('displayRows')
    , displayColumns = this.instance.getSetting('displayColumns')
    , rowHeaderOffset = this.instance.hasSetting('rowHeaders') ? 1 : 0;

  if (coords[0] >= offsetRow && coords[0] <= offsetRow + displayRows) {
    if (coords[1] >= offsetColumn && coords[1] < offsetColumn + displayColumns - rowHeaderOffset) {
      return this.TBODY.childNodes[coords[0] - offsetRow].childNodes[coords[1] - offsetColumn + rowHeaderOffset];
    }
  }
  return null;
};

WalkontableTable.prototype.getCoords = function (TD) {
  var rowHeaderOffset = this.instance.hasSetting('rowHeaders') ? 1 : 0;
  return [
    this.wtDom.prevSiblings(TD.parentNode).length + this.instance.getSetting('offsetRow'),
    TD.cellIndex + this.instance.getSetting('offsetColumn') - rowHeaderOffset
  ];
};
function WalkontableWheel(instance) {
  var that = this;

  //reference to instance
  this.instance = instance;
  $(this.instance.settings.table).on('mousewheel', function (event, delta, deltaX, deltaY) {
    if (deltaY) {
      that.instance.scrollVertical(-deltaY).draw();
    }
    else if (deltaX) {

    }
    event.preventDefault();
  });
}
/**
 * Dragdealer JS v0.9.5 - patched by Walkontable at line 66
 * http://code.ovidiu.ch/dragdealer-js
 *
 * Copyright (c) 2010, Ovidiu Chereches
 * MIT License
 * http://legal.ovidiu.ch/licenses/MIT
 */

/* Cursor */

var Cursor =
{
	x: 0, y: 0,
	init: function()
	{
		this.setEvent('mouse');
		this.setEvent('touch');
	},
	setEvent: function(type)
	{
		var moveHandler = document['on' + type + 'move'] || function(){};
		document['on' + type + 'move'] = function(e)
		{
			moveHandler(e);
			Cursor.refresh(e);
		}
	},
	refresh: function(e)
	{
		if(!e)
		{
			e = window.event;
		}
		if(e.type == 'mousemove')
		{
			this.set(e);
		}
		else if(e.touches)
		{
			this.set(e.touches[0]);
		}
	},
	set: function(e)
	{
		if(e.pageX || e.pageY)
		{
			this.x = e.pageX;
			this.y = e.pageY;
		}
		else if(e.clientX || e.clientY)
		{
			this.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			this.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
	}
};
Cursor.init();

/* Position */

var Position =
{
	get: function(obj)
	{
		var curtop = 0, curleft = 0; //Walkontable patch. Original (var curleft = curtop = 0;) created curtop in global scope
		if(obj.offsetParent)
		{
			do
			{
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			}
			while((obj = obj.offsetParent));
		}
		return [curleft, curtop];
	}
};

/* Dragdealer */

var Dragdealer = function(wrapper, options)
{
	if(typeof(wrapper) == 'string')
	{
		wrapper = document.getElementById(wrapper);
	}
	if(!wrapper)
	{
		return;
	}
	var handle = wrapper.getElementsByTagName('div')[0];
	if(!handle || handle.className.search(/(^|\s)handle(\s|$)/) == -1)
	{
		return;
	}
	this.init(wrapper, handle, options || {});
	this.setup();
};
Dragdealer.prototype =
{
	init: function(wrapper, handle, options)
	{
		this.wrapper = wrapper;
		this.handle = handle;
		this.options = options;
		
		this.disabled = this.getOption('disabled', false);
		this.horizontal = this.getOption('horizontal', true);
		this.vertical = this.getOption('vertical', false);
		this.slide = this.getOption('slide', true);
		this.steps = this.getOption('steps', 0);
		this.snap = this.getOption('snap', false);
		this.loose = this.getOption('loose', false);
		this.speed = this.getOption('speed', 10) / 100;
		this.xPrecision = this.getOption('xPrecision', 0);
		this.yPrecision = this.getOption('yPrecision', 0);
		
		this.callback = options.callback || null;
		this.animationCallback = options.animationCallback || null;
		
		this.bounds = {
			left: options.left || 0, right: -(options.right || 0),
			top: options.top || 0, bottom: -(options.bottom || 0),
			x0: 0, x1: 0, xRange: 0,
			y0: 0, y1: 0, yRange: 0
		};
		this.value = {
			prev: [-1, -1],
			current: [options.x || 0, options.y || 0],
			target: [options.x || 0, options.y || 0]
		};
		this.offset = {
			wrapper: [0, 0],
			mouse: [0, 0],
			prev: [-999999, -999999],
			current: [0, 0],
			target: [0, 0]
		};
		this.change = [0, 0];
		
		this.activity = false;
		this.dragging = false;
		this.tapping = false;
	},
	getOption: function(name, defaultValue)
	{
		return this.options[name] !== undefined ? this.options[name] : defaultValue;
	},
	setup: function()
	{
		this.setWrapperOffset();
		this.setBoundsPadding();
		this.setBounds();
		this.setSteps();
		
		this.addListeners();
	},
	setWrapperOffset: function()
	{
		this.offset.wrapper = Position.get(this.wrapper);
	},
	setBoundsPadding: function()
	{
		if(!this.bounds.left && !this.bounds.right)
		{
			this.bounds.left = Position.get(this.handle)[0] - this.offset.wrapper[0];
			this.bounds.right = -this.bounds.left;
		}
		if(!this.bounds.top && !this.bounds.bottom)
		{
			this.bounds.top = Position.get(this.handle)[1] - this.offset.wrapper[1];
			this.bounds.bottom = -this.bounds.top;
		}
	},
	setBounds: function()
	{
		this.bounds.x0 = this.bounds.left;
		this.bounds.x1 = this.wrapper.offsetWidth + this.bounds.right;
		this.bounds.xRange = (this.bounds.x1 - this.bounds.x0) - this.handle.offsetWidth;
		
		this.bounds.y0 = this.bounds.top;
		this.bounds.y1 = this.wrapper.offsetHeight + this.bounds.bottom;
		this.bounds.yRange = (this.bounds.y1 - this.bounds.y0) - this.handle.offsetHeight;
		
		this.bounds.xStep = 1 / (this.xPrecision || Math.max(this.wrapper.offsetWidth, this.handle.offsetWidth));
		this.bounds.yStep = 1 / (this.yPrecision || Math.max(this.wrapper.offsetHeight, this.handle.offsetHeight));
	},
	setSteps: function()
	{
		if(this.steps > 1)
		{
			this.stepRatios = [];
			for(var i = 0; i <= this.steps - 1; i++)
			{
				this.stepRatios[i] = i / (this.steps - 1);
			}
		}
	},
	addListeners: function()
	{
		var self = this;
		
		this.wrapper.onselectstart = function()
		{
			return false;
		}
		this.handle.onmousedown = this.handle.ontouchstart = function(e)
		{
			self.handleDownHandler(e);
		};
		this.wrapper.onmousedown = this.wrapper.ontouchstart = function(e)
		{
			self.wrapperDownHandler(e);
		};
		var mouseUpHandler = document.onmouseup || function(){};
		document.onmouseup = function(e)
		{
			mouseUpHandler(e);
			self.documentUpHandler(e);
		};
		var touchEndHandler = document.ontouchend || function(){};
		document.ontouchend = function(e)
		{
			touchEndHandler(e);
			self.documentUpHandler(e);
		};
		var resizeHandler = window.onresize || function(){};
		window.onresize = function(e)
		{
			resizeHandler(e);
			self.documentResizeHandler(e);
		};
		this.wrapper.onmousemove = function(e)
		{
			self.activity = true;
		}
		this.wrapper.onclick = function(e)
		{
			return !self.activity;
		}
		
		this.interval = setInterval(function(){ self.animate() }, 25);
		self.animate(false, true);
	},
	handleDownHandler: function(e)
	{
		this.activity = false;
		Cursor.refresh(e);
		
		this.preventDefaults(e, true);
		this.startDrag();
		this.cancelEvent(e);
	},
	wrapperDownHandler: function(e)
	{
		Cursor.refresh(e);
		
		this.preventDefaults(e, true);
		this.startTap();
	},
	documentUpHandler: function(e)
	{
		this.stopDrag();
		this.stopTap();
		//this.cancelEvent(e);
	},
	documentResizeHandler: function(e)
	{
		this.setWrapperOffset();
		this.setBounds();
		
		this.update();
	},
	enable: function()
	{
		this.disabled = false;
		this.handle.className = this.handle.className.replace(/\s?disabled/g, '');
	},
	disable: function()
	{
		this.disabled = true;
		this.handle.className += ' disabled';
	},
	setStep: function(x, y, snap)
	{
		this.setValue(
			this.steps && x > 1 ? (x - 1) / (this.steps - 1) : 0,
			this.steps && y > 1 ? (y - 1) / (this.steps - 1) : 0,
			snap
		);
	},
	setValue: function(x, y, snap)
	{
		this.setTargetValue([x, y || 0]);
		if(snap)
		{
			this.groupCopy(this.value.current, this.value.target);
		}
	},
	startTap: function(target)
	{
		if(this.disabled)
		{
			return;
		}
		this.tapping = true;
		
		if(target === undefined)
		{
			target = [
				Cursor.x - this.offset.wrapper[0] - (this.handle.offsetWidth / 2),
				Cursor.y - this.offset.wrapper[1] - (this.handle.offsetHeight / 2)
			];
		}
		this.setTargetOffset(target);
	},
	stopTap: function()
	{
		if(this.disabled || !this.tapping)
		{
			return;
		}
		this.tapping = false;
		
		this.setTargetValue(this.value.current);
		this.result();
	},
	startDrag: function()
	{
		if(this.disabled)
		{
			return;
		}
		this.offset.mouse = [
			Cursor.x - Position.get(this.handle)[0],
			Cursor.y - Position.get(this.handle)[1]
		];
		
		this.dragging = true;
	},
	stopDrag: function()
	{
		if(this.disabled || !this.dragging)
		{
			return;
		}
		this.dragging = false;
		
		var target = this.groupClone(this.value.current);
		if(this.slide)
		{
			var ratioChange = this.change;
			target[0] += ratioChange[0] * 4;
			target[1] += ratioChange[1] * 4;
		}
		this.setTargetValue(target);
		this.result();
	},
	feedback: function()
	{
		var value = this.value.current;
		if(this.snap && this.steps > 1)
		{
			value = this.getClosestSteps(value);
		}
		if(!this.groupCompare(value, this.value.prev))
		{
			if(typeof(this.animationCallback) == 'function')
			{
				this.animationCallback(value[0], value[1]);
			}
			this.groupCopy(this.value.prev, value);
		}
	},
	result: function()
	{
		if(typeof(this.callback) == 'function')
		{
			this.callback(this.value.target[0], this.value.target[1]);
		}
	},
	animate: function(direct, first)
	{
		if(direct && !this.dragging)
		{
			return;
		}
		if(this.dragging)
		{
			var prevTarget = this.groupClone(this.value.target);
			
			var offset = [
				Cursor.x - this.offset.wrapper[0] - this.offset.mouse[0],
				Cursor.y - this.offset.wrapper[1] - this.offset.mouse[1]
			];
			this.setTargetOffset(offset, this.loose);
			
			this.change = [
				this.value.target[0] - prevTarget[0],
				this.value.target[1] - prevTarget[1]
			];
		}
		if(this.dragging || first)
		{
			this.groupCopy(this.value.current, this.value.target);
		}
		if(this.dragging || this.glide() || first)
		{
			this.update();
			this.feedback();
		}
	},
	glide: function()
	{
		var diff = [
			this.value.target[0] - this.value.current[0],
			this.value.target[1] - this.value.current[1]
		];
		if(!diff[0] && !diff[1])
		{
			return false;
		}
		if(Math.abs(diff[0]) > this.bounds.xStep || Math.abs(diff[1]) > this.bounds.yStep)
		{
			this.value.current[0] += diff[0] * this.speed;
			this.value.current[1] += diff[1] * this.speed;
		}
		else
		{
			this.groupCopy(this.value.current, this.value.target);
		}
		return true;
	},
	update: function()
	{
		if(!this.snap)
		{
			this.offset.current = this.getOffsetsByRatios(this.value.current);
		}
		else
		{
			this.offset.current = this.getOffsetsByRatios(
				this.getClosestSteps(this.value.current)
			);
		}
		this.show();
	},
	show: function()
	{
		if(!this.groupCompare(this.offset.current, this.offset.prev))
		{
			if(this.horizontal)
			{
				this.handle.style.left = String(this.offset.current[0]) + 'px';
			}
			if(this.vertical)
			{
				this.handle.style.top = String(this.offset.current[1]) + 'px';
			}
			this.groupCopy(this.offset.prev, this.offset.current);
		}
	},
	setTargetValue: function(value, loose)
	{
		var target = loose ? this.getLooseValue(value) : this.getProperValue(value);
		
		this.groupCopy(this.value.target, target);
		this.offset.target = this.getOffsetsByRatios(target);
	},
	setTargetOffset: function(offset, loose)
	{
		var value = this.getRatiosByOffsets(offset);
		var target = loose ? this.getLooseValue(value) : this.getProperValue(value);
		
		this.groupCopy(this.value.target, target);
		this.offset.target = this.getOffsetsByRatios(target);
	},
	getLooseValue: function(value)
	{
		var proper = this.getProperValue(value);
		return [
			proper[0] + ((value[0] - proper[0]) / 4),
			proper[1] + ((value[1] - proper[1]) / 4)
		];
	},
	getProperValue: function(value)
	{
		var proper = this.groupClone(value);

		proper[0] = Math.max(proper[0], 0);
		proper[1] = Math.max(proper[1], 0);
		proper[0] = Math.min(proper[0], 1);
		proper[1] = Math.min(proper[1], 1);
		
		if((!this.dragging && !this.tapping) || this.snap)
		{
			if(this.steps > 1)
			{
				proper = this.getClosestSteps(proper);
			}
		}
		return proper;
	},
	getRatiosByOffsets: function(group)
	{
		return [
			this.getRatioByOffset(group[0], this.bounds.xRange, this.bounds.x0),
			this.getRatioByOffset(group[1], this.bounds.yRange, this.bounds.y0)
		];
	},
	getRatioByOffset: function(offset, range, padding)
	{
		return range ? (offset - padding) / range : 0;
	},
	getOffsetsByRatios: function(group)
	{
		return [
			this.getOffsetByRatio(group[0], this.bounds.xRange, this.bounds.x0),
			this.getOffsetByRatio(group[1], this.bounds.yRange, this.bounds.y0)
		];
	},
	getOffsetByRatio: function(ratio, range, padding)
	{
		return Math.round(ratio * range) + padding;
	},
	getClosestSteps: function(group)
	{
		return [
			this.getClosestStep(group[0]),
			this.getClosestStep(group[1])
		];
	},
	getClosestStep: function(value)
	{
		var k = 0;
		var min = 1;
		for(var i = 0; i <= this.steps - 1; i++)
		{
			if(Math.abs(this.stepRatios[i] - value) < min)
			{
				min = Math.abs(this.stepRatios[i] - value);
				k = i;
			}
		}
		return this.stepRatios[k];
	},
	groupCompare: function(a, b)
	{
		return a[0] == b[0] && a[1] == b[1];
	},
	groupCopy: function(a, b)
	{
		a[0] = b[0];
		a[1] = b[1];
	},
	groupClone: function(a)
	{
		return [a[0], a[1]];
	},
	preventDefaults: function(e, selection)
	{
		if(!e)
		{
			e = window.event;
		}
		if(e.preventDefault)
		{
			e.preventDefault();
		}
		e.returnValue = false;
		
		if(selection && document.selection)
		{
			document.selection.empty();
		}
	},
	cancelEvent: function(e)
	{
		if(!e)
		{
			e = window.event;
		}
		if(e.stopPropagation)
		{
			e.stopPropagation();
		}
		e.cancelBubble = true;
	}
};

/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 * 
 * Requires: 1.2.2+
 */

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

if ($.event.fixHooks) {
    for ( var i=types.length; i; ) {
        $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
}

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },
    
    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
    
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";
    
    // Old school scrollwheel delta
    if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
    if ( orgEvent.detail     ) { delta = -orgEvent.detail/3; }
    
    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;
    
    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }
    
    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
    
    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);
    
    return ($.event.dispatch || $.event.handle).apply(this, args);
}

})(jQuery);

})(jQuery, window, Handsontable);