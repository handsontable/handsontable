/**
 * Handsontable 0.7.4
 * Handsontable is a simple jQuery plugin for editable tables with basic copy-paste compatibility with Excel and Google Docs
 *
 * Copyright 2012, Marcin Warpechowski
 * Licensed under the MIT license.
 * http://handsontable.com/
 *
 * Date: Mon Nov 19 2012 22:41:28 GMT+0100 (Central European Standard Time)
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
    colToProp: [],
    propToCol: {},
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
      if (typeof priv.colToProp[col] !== 'undefined') {
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
        throw new Error("cannot create column with object data source or columns option specified");
      }
      var r = 0;
      if (!coords || coords.col >= self.colCount) {
        for (; r < self.rowCount; r++) {
          if (typeof priv.settings.data[r] === 'undefined') {
            priv.settings.data[r] = [];
          }
          priv.settings.data[r].push('');
        }
      }
      else {
        for (; r < self.rowCount; r++) {
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
          break;

        case "insert_col":
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
      if (rlen < priv.settings.startRows) {
        for (r = 0; r < priv.settings.startRows - rlen; r++) {
          datamap.createRow();
        }
      }

      //should I add empty rows to table view to meet startRows?
      if (self.rowCount < priv.settings.startRows) {
        for (; self.rowCount < priv.settings.startRows; emptyRows++) {
          self.view.createRow();
          self.view.renderRow(self.rowCount - 1);
          recreateRows = true;
        }
      }

      //should I add empty rows to meet minSpareRows?
      if (emptyRows < priv.settings.minSpareRows) {
        for (; emptyRows < priv.settings.minSpareRows; emptyRows++) {
          datamap.createRow();
          self.view.createRow();
          self.view.renderRow(self.rowCount - 1);
          recreateRows = true;
        }
      }

      //should I add empty rows to meet minHeight
      //WARNING! jQuery returns 0 as height() for container which is not :visible. this will lead to a infinite loop
      if (priv.settings.minHeight) {
        if ($tbody.height() > 0 && $tbody.height() <= priv.settings.minHeight) {
          while ($tbody.height() <= priv.settings.minHeight) {
            datamap.createRow();
            self.view.createRow();
            self.view.renderRow(self.rowCount - 1);
            recreateRows = true;
          }
        }
      }

      //count currently empty cols
      if (self.countRows() - 1 > 0) {
        cols : for (c = self.colCount - 1; c >= 0; c--) {
          for (r = 0; r < self.countRows(); r++) {
            val = datamap.get(r, datamap.colToProp(c));
            if (val !== '' && val !== null && typeof val !== 'undefined') {
              break cols;
            }
          }
          emptyCols++;
        }
      }

      //should I add empty cols to meet startCols?
      if (self.colCount < priv.settings.startCols) {
        for (; self.colCount < priv.settings.startCols; emptyCols++) {
          if (!priv.settings.columns) {
            datamap.createCol();
          }
          self.view.createCol();
          self.view.renderCol(self.colCount - 1);
          recreateCols = true;
        }
      }

      //should I add empty cols to meet minSpareCols?
      if (priv.dataType === 'array' && emptyCols < priv.settings.minSpareCols) {
        for (; emptyCols < priv.settings.minSpareCols; emptyCols++) {
          if (!priv.settings.columns) {
            datamap.createCol();
          }
          self.view.createCol();
          self.view.renderCol(self.colCount - 1);
          recreateCols = true;
        }
      }

      //should I add empty rows to meet minWidth
      //WARNING! jQuery returns 0 as width() for container which is not :visible. this will lead to a infinite loop
      if (priv.settings.minWidth) {
        if ($tbody.width() > 0 && $tbody.width() <= priv.settings.minWidth) {
          while ($tbody.width() <= priv.settings.minWidth) {
            if (!priv.settings.columns) {
              datamap.createCol();
            }
            self.view.createCol();
            self.view.renderCol(self.colCount - 1);
            recreateCols = true;
          }
        }
      }

      if (!recreateRows && priv.settings.enterBeginsEditing) {
        for (; ((priv.settings.startRows && self.rowCount > priv.settings.startRows) && (priv.settings.minSpareRows && emptyRows > priv.settings.minSpareRows) && (!priv.settings.minHeight || $tbody.height() - $tbody.find('tr:last').height() - 4 > priv.settings.minHeight)); emptyRows--) {
          self.view.removeRow();
          datamap.removeRow();
          recreateRows = true;
        }
      }

      if (recreateRows && priv.selStart) {
        //if selection is outside, move selection to last row
        if (priv.selStart.row > self.rowCount - 1) {
          priv.selStart.row = self.rowCount - 1;
          if (priv.selEnd.row > priv.selStart.row) {
            priv.selEnd.row = priv.selStart.row;
          }
        } else if (priv.selEnd.row > self.rowCount - 1) {
          priv.selEnd.row = self.rowCount - 1;
          if (priv.selStart.row > priv.selEnd.row) {
            priv.selStart.row = priv.selEnd.row;
          }
        }
      }

      if (priv.settings.columns && priv.settings.columns.length) {
        clen = priv.settings.columns.length;
        if (self.colCount !== clen) {
          while (self.colCount > clen) {
            self.view.removeCol();
          }
          while (self.colCount < clen) {
            self.view.createCol();
            self.view.renderCol(self.colCount - 1);
          }
          recreateCols = true;
        }
      }
      else if (!recreateCols && priv.settings.enterBeginsEditing) {
        for (; ((priv.settings.startCols && self.colCount > priv.settings.startCols) && (priv.settings.minSpareCols && emptyCols > priv.settings.minSpareCols) && (!priv.settings.minWidth || $tbody.width() - $tbody.find('tr:last').find('td:last').width() - 4 > priv.settings.minWidth)); emptyCols--) {
          if (!priv.settings.columns) {
            datamap.removeCol();
          }
          self.view.removeCol();
          recreateCols = true;
        }
      }

      if (recreateCols && priv.selStart) {
        //if selection is outside, move selection to last row
        if (priv.selStart.col > self.colCount - 1) {
          priv.selStart.col = self.colCount - 1;
          if (priv.selEnd.col > priv.selStart.col) {
            priv.selEnd.col = priv.selStart.col;
          }
        } else if (priv.selEnd.col > self.colCount - 1) {
          priv.selEnd.col = self.colCount - 1;
          if (priv.selStart.col > priv.selEnd.col) {
            priv.selStart.col = priv.selEnd.col;
          }
        }
      }

      if (recreateRows || recreateCols) {
        selection.refreshBorders();
        self.blockedCols.refresh();
        self.blockedRows.refresh();
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
        if ((end && current.row > end.row) || (!priv.settings.minSpareRows && current.row > self.rowCount - 1)) {
          break;
        }
        current.col = start.col;
        clen = input[r] ? input[r].length : 0;
        for (c = 0; c < clen; c++) {
          if ((end && current.col > end.col) || (!priv.settings.minSpareCols && current.col > self.colCount - 1)) {
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
      var tds = self.view.getAllCells();
      for (var i = 0, ilen = tds.length; i < ilen; i++) {
        $(tds[i]).empty();
        self.minWidthFix(tds[i]);
      }
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
     * @param td element
     */
    setRangeStart: function (td) {
      selection.deselect();
      priv.selStart = self.view.getCellCoords(td);
      selection.setRangeEnd(td);
    },

    /**
     * Ends selection range on given td object
     * @param {Element} td
     * @param {Boolean} [scrollToCell=true] If true, viewport will be scrolled to range end
     */
    setRangeEnd: function (td, scrollToCell) {
      var coords = self.view.getCellCoords(td);
      selection.end(coords);
      if (!priv.settings.multiSelect) {
        priv.selStart = coords;
      }
      self.rootElement.triggerHandler("selection.handsontable", [priv.selStart.row, priv.selStart.col, priv.selEnd.row, priv.selEnd.col]);
      self.rootElement.triggerHandler("selectionbyprop.handsontable", [priv.selStart.row, datamap.colToProp(priv.selStart.col), priv.selEnd.row, datamap.colToProp(priv.selEnd.col)]);
      selection.refreshBorders();
      if (scrollToCell !== false) {
        self.view.scrollViewport(td);
      }
    },

    /**
     * Redraws borders around cells
     * @param {Boolean} revertOriginal
     */
    refreshBorders: function (revertOriginal) {
      editproxy.destroy(revertOriginal);
      if (!selection.isSelected()) {
        return;
      }
      if (autofill.handle) {
        autofill.showHandle();
      }
      priv.currentBorder.appear([priv.selStart]);
      highlight.on();
      editproxy.prepare();
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
      var td = self.view.getCellAtCoords({
        row: (priv.selStart.row + rowDelta),
        col: priv.selStart.col + colDelta
      });
      if (td) {
        selection.setRangeStart(td);
      }
      else {
        selection.setRangeStart(self.view.getCellAtCoords(priv.selStart)); //rerun some routines
      }
    },

    /**
     * Sets selection end cell relative to current selection end cell (if possible)
     */
    transformEnd: function (rowDelta, colDelta) {
      if (priv.selEnd) {
        var td = self.view.getCellAtCoords({
          row: (priv.selEnd.row + rowDelta),
          col: priv.selEnd.col + colDelta
        });
        if (td) {
          selection.setRangeEnd(td);
        }
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
      var tds = self.view.getAllCells();
      if (tds.length) {
        selection.setRangeStart(tds[0]);
        selection.setRangeEnd(tds[tds.length - 1], false);
      }
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

        selection.setRangeStart(self.view.getCellAtCoords(drag.TL));
        selection.setRangeEnd(self.view.getCellAtCoords(drag.BR));
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
              var endTd = self.view.getCellAtCoords({row: last[0], col: self.propToCol(last[1])});
              selection.setRangeEnd(endTd);
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
      self.container.append(priv.editProxyHolder);
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
    this.view = new Handsontable.TableView(this);

    if (typeof settings.cols !== 'undefined') {
      settings.startCols = settings.cols; //backwards compatibility
    }

    self.colCount = settings.startCols;
    self.rowCount = 0;

    highlight.init();
    priv.currentBorder = new Handsontable.Border(self, {
      className: 'current',
      bg: true
    });
    editproxy.init();

    bindEvents();
    this.updateSettings(settings);

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
    var refreshRows = false, refreshCols = false, changes, i, ilen, changesByCol = [];

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
        changesByCol.push([changes[i][0], col, changes[i][2], changes[i][3], changes[i][4]]);

        if (priv.settings.minSpareRows) {
          while (row > self.rowCount - 1) {
            datamap.createRow();
            self.view.createRow();
            self.view.renderRow(self.rowCount - 1);
            refreshRows = true;
          }
        }
        if (priv.dataType === 'array' && priv.settings.minSpareCols) {
          while (col > self.colCount - 1) {
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
      var r, c, p, val, clen = (priv.settings.columns && priv.settings.columns.length) || priv.settings.startCols;
      for (r = 0; r < priv.settings.startRows; r++) {
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
    var dlen = priv.settings.data.length;
    while (priv.settings.startRows > dlen) {
      datamap.createRow();
      dlen++;
    }
    while (self.rowCount < dlen) {
      self.view.createRow();
    }

    grid.keepEmptyRows();
    grid.clear();
    var changes = [];
    dlen = priv.settings.data.length; //recount number of rows in case some row was removed by keepEmptyRows
    var clen = (priv.settings.columns && priv.settings.columns.length) || priv.settings.startCols;
    for (var r = 0; r < dlen; r++) {
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
      settings.startRows = settings.rows; //backwards compatibility
    }
    if (typeof settings.cols !== "undefined") {
      settings.startCols = settings.cols; //backwards compatibility
    }

    if (typeof settings.fillHandle !== "undefined") {
      if (autofill.handle && settings.fillHandle === false) {
        autofill.disable();
      }
      else if (!autofill.handle && settings.fillHandle !== false) {
        autofill.init();
      }
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

    if (typeof settings.data !== 'undefined') {
      self.loadData(settings.data);
      recreated = true;
    }
    else if (typeof settings.columns !== "undefined") {
      datamap.createMap();
    }

    if (!recreated) {
      recreated = grid.keepEmptyRows();
    }

    if (!recreated) {
      selection.refreshBorders();
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
    return self.colCount;
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
      selection.setRangeEnd(self.getCell(row, col), scrollToCell);
    }
    else {
      selection.setRangeEnd(self.getCell(endRow, endCol), scrollToCell);
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
  this.version = '0.7.4'; //inserted by grunt from package.json
};

var settings = {
  'data': [],
  'startRows': 5,
  'startCols': 5,
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
  'autoWrapCol': false
};

$.fn.handsontable = function (action, options) {
  var i, ilen, args, output = [];
  if (typeof action !== 'string') { //init
    options = action;
    return this.each(function () {
      var $this = $(this);
      if ($this.data("handsontable")) {
        instance = $this.data("handsontable");
        instance.updateSettings(options);
      }
      else {
        var currentSettings = $.extend(true, {}, settings), instance;
        for (i in options) {
          if (options.hasOwnProperty(i)) {
            currentSettings[i] = options[i];
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
  var priv = {};

  var interaction = {
    onMouseDown: function (event) {
      priv.isMouseDown = true;
      if (event.button === 2 && that.instance.selection.inInSelection(that.getCellCoords(this))) { //right mouse button
        //do nothing
      }
      else if (event.shiftKey) {
        that.instance.selection.setRangeEnd(this);
      }
      else {
        that.instance.selection.setRangeStart(this);
      }
    },

    onMouseOver: function () {
      if (priv.isMouseDown) {
        that.instance.selection.setRangeEnd(this);
      }
      else if (that.instance.autofill.handle && that.instance.autofill.handle.isDragged) {
        that.instance.autofill.handle.isDragged++;
        that.instance.autofill.showBorder(this);
      }
    },

    onMouseWheel: function (event, delta, deltaX, deltaY) {
      if (priv.virtualScroll) {
        if (deltaY) {
          priv.virtualScroll.scrollTop(priv.virtualScroll.scrollTop() + 44 * -deltaY);
        }
        else if (deltaX) {
          priv.virtualScroll.scrollLeft(priv.virtualScroll.scrollLeft() + 100 * deltaX);
        }
        event.preventDefault();
      }
    }
  };


  that.instance.container = $('<div class="handsontable"></div>');
  var overflow = that.instance.rootElement.css('overflow');
  if (overflow === 'auto' || overflow === 'scroll') {
    that.instance.container[0].style.overflow = overflow;
    var w = that.instance.rootElement.css('width');
    if (w) {
      that.instance.container[0].style.width = w;
    }
    var h = that.instance.rootElement.css('height');
    if (h) {
      that.instance.container[0].style.height = h;
    }
    that.instance.rootElement[0].style.overflow = 'hidden';
    that.instance.rootElement[0].style.position = 'relative';
  }
  that.instance.rootElement.append(that.instance.container);

//this.init

  function onMouseEnterTable() {
    priv.isMouseOverTable = true;
  }

  function onMouseLeaveTable() {
    priv.isMouseOverTable = false;
  }

  that.instance.curScrollTop = that.instance.curScrollLeft = 0;
  that.instance.lastScrollTop = that.instance.lastScrollLeft = null;
  this.scrollbarSize = this.measureScrollbar();

  var div = $('<div><table class="htCore" cellspacing="0" cellpadding="0"><thead></thead><tbody></tbody></table></div>');
  priv.tableContainer = div[0];
  that.instance.table = $(priv.tableContainer.firstChild);
  this.$tableBody = that.instance.table.find("tbody")[0];
  that.instance.table.on('mousedown', 'td', interaction.onMouseDown);
  that.instance.table.on('mouseover', 'td', interaction.onMouseOver);
  that.instance.table.on('mousewheel', 'td', interaction.onMouseWheel);
  that.instance.container.append(div);

  //...


  that.instance.container.on('mouseenter', onMouseEnterTable).on('mouseleave', onMouseLeaveTable);


  function onMouseUp() {
    if (priv.isMouseDown) {
      setTimeout(that.instance.editproxy.focus, 1);
    }
    priv.isMouseDown = false;
    if (that.instance.autofill.handle && that.instance.autofill.handle.isDragged) {
      if (that.instance.autofill.handle.isDragged > 1) {
        that.instance.autofill.apply();
      }
      that.instance.autofill.handle.isDragged = 0;
    }
  }

  function onOutsideClick(event) {
    if (that.instance.getSettings().outsideClickDeselects) {
      setTimeout(function () {//do async so all mouseenter, mouseleave events will fire before
        if (!priv.isMouseOverTable && event.target !== priv.tableContainer && $(event.target).attr('id') !== 'context-menu-layer') { //if clicked outside the table or directly at container which also means outside
          that.instance.selection.deselect();
        }
      }, 1);
    }
  }

  $("html").on('mouseup', onMouseUp).
    on('click', onOutsideClick);

  if (that.instance.container[0].tagName.toLowerCase() !== "html" && that.instance.container[0].tagName.toLowerCase() !== "body" && (that.instance.container.css('overflow') === 'scroll' || that.instance.container.css('overflow') === 'auto')) {
    that.scrollable = that.instance.container;
  }

  if (that.scrollable) {
    //create fake scrolling div
    priv.virtualScroll = $('<div class="virtualScroll"><div class="spacer"></div></div>');
    that.scrollable = priv.virtualScroll;
    that.instance.container.before(priv.virtualScroll);
    that.instance.table[0].style.position = 'absolute';
    priv.virtualScroll.css({
      width: that.instance.container.width() + 'px',
      height: that.instance.container.height() + 'px',
      overflow: that.instance.container.css('overflow')
    });
    that.instance.container.css({
      overflow: 'hidden',
      position: 'absolute',
      top: '0px',
      left: '0px'
    });
    that.instance.container.width(priv.virtualScroll.innerWidth() - this.scrollbarSize.width);
    that.instance.container.height(priv.virtualScroll.innerHeight() - this.scrollbarSize.height);
    setInterval(function () {
      priv.virtualScroll.find('.spacer').height(that.instance.table.height());
      priv.virtualScroll.find('.spacer').width(that.instance.table.width());
    }, 100);

    that.scrollable.scrollTop(0);
    that.scrollable.scrollLeft(0);

    that.scrollable.on('scroll.handsontable', function () {
      that.instance.curScrollTop = that.scrollable[0].scrollTop;
      that.instance.curScrollLeft = that.scrollable[0].scrollLeft;

      if (that.instance.curScrollTop !== that.instance.lastScrollTop) {
        that.instance.blockedRows.refreshBorders();
        that.instance.blockedCols.main[0].style.top = -that.instance.curScrollTop + 'px';
        that.instance.table[0].style.top = -that.instance.curScrollTop + 'px';
      }

      if (that.instance.curScrollLeft !== that.instance.lastScrollLeft) {
        that.instance.blockedCols.refreshBorders();
        that.instance.blockedRows.main[0].style.left = -that.instance.curScrollLeft + 'px';
        that.instance.table[0].style.left = -that.instance.curScrollLeft + 'px';
      }

      if (that.instance.curScrollTop !== that.instance.lastScrollTop || that.instance.curScrollLeft !== that.instance.lastScrollLeft) {
        that.instance.selection.refreshBorders();

        if (that.instance.blockedCorner) {
          if (that.instance.curScrollTop === 0 && that.instance.curScrollLeft === 0) {
            that.instance.blockedCorner.find("th:last-child").css({borderRightWidth: 0});
            that.instance.blockedCorner.find("tr:last-child th").css({borderBottomWidth: 0});
          }
          else if (that.instance.lastScrollTop === 0 && that.instance.lastScrollLeft === 0) {
            that.instance.blockedCorner.find("th:last-child").css({borderRightWidth: '1px'});
            that.instance.blockedCorner.find("tr:last-child th").css({borderBottomWidth: '1px'});
          }
        }
      }

      that.instance.lastScrollTop = that.instance.curScrollTop;
      that.instance.lastScrollLeft = that.instance.curScrollLeft;

      that.instance.selection.refreshBorders();
    });

    Handsontable.PluginHooks.push('afterInit', function () {
      that.scrollable.trigger('scroll.handsontable');
    });
  }
  else {
    that.scrollable = $(window);
    if (that.instance.blockedCorner) {
      that.instance.blockedCorner.find("th:last-child").css({borderRightWidth: 0});
      that.instance.blockedCorner.find("tr:last-child th").css({borderBottomWidth: 0});
    }
  }

  that.scrollable.on('scroll', function (e) {
    e.stopPropagation();
  });

  $(window).on('resize', function () {
    //https://github.com/warpech/jquery-handsontable/issues/193
    that.instance.blockedCols.update();
    that.instance.blockedRows.update();
  });

  $('.context-menu-root').on('mouseenter', onMouseEnterTable).on('mouseleave', onMouseLeaveTable);

};

/**
 * Measure the width and height of browser scrollbar
 * @return {Object}
 */
Handsontable.TableView.prototype.measureScrollbar = function () {
  var div = $('<div style="width:150px;height:150px;overflow:hidden;position:absolute;top:200px;left:200px"><div style="width:100%;height:100%;position:absolute">x</div>');
  $('body').append(div);
  var subDiv = $(div[0].firstChild);
  var w1 = subDiv.innerWidth();
  var h1 = subDiv.innerHeight();
  div[0].style.overflow = 'scroll';
  w1 -= subDiv.innerWidth();
  h1 -= subDiv.innerHeight();
  if (w1 === 0) {
    w1 = 17;
  }
  if (h1 === 0) {
    h1 = 17;
  }
  div.remove();
  return {width: w1, height: h1};
};

/**
 * Creates row at the bottom of the <table>
 * @param {Object} [coords] Optional. Coords of the cell before which the new row will be inserted
 */
Handsontable.TableView.prototype.createRow = function (coords) {
  var tr, c, r, td;
  tr = document.createElement('tr');
  this.instance.blockedCols.createRow(tr);
  for (c = 0; c < this.instance.colCount; c++) {
    tr.appendChild(td = document.createElement('td'));
    this.instance.minWidthFix(td);
  }
  if (!coords || coords.row >= this.instance.rowCount) {
    this.$tableBody.appendChild(tr);
  }
  else {
    var oldTr = this.instance.getCell(coords.row, coords.col).parentNode;
    this.$tableBody.insertBefore(tr, oldTr);
  }
  this.instance.rowCount++;
};

/**
 * Creates col at the right of the <table>
 * @param {Object} [coords] Optional. Coords of the cell before which the new column will be inserted
 */
Handsontable.TableView.prototype.createCol = function (coords) {
  var trs = this.$tableBody.childNodes, r, c, td;
  this.instance.blockedRows.createCol();
  if (!coords || coords.col >= this.instance.colCount) {
    for (r = 0; r < this.instance.rowCount; r++) {
      trs[r].appendChild(td = document.createElement('td'));
      this.instance.minWidthFix(td);
    }
  }
  else {
    for (r = 0; r < this.instance.rowCount; r++) {
      trs[r].insertBefore(td = document.createElement('td'), this.instance.getCell(r, coords.col));
      this.instance.minWidthFix(td);
    }
  }
  this.instance.colCount++;
};

/**
 * Removes row at the bottom of the <table>
 * @param {Object} [coords] Optional. Coords of the cell which row will be removed
 * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all rows will be removed
 */
Handsontable.TableView.prototype.removeRow = function (coords, toCoords) {
  if (!coords || coords.row === this.instance.rowCount - 1) {
    $(this.$tableBody.childNodes[this.instance.rowCount - 1]).remove();
    this.instance.rowCount--;
  }
  else {
    for (var i = toCoords.row; i >= coords.row; i--) {
      $(this.$tableBody.childNodes[i]).remove();
      this.instance.rowCount--;
    }
  }
};

/**
 * Removes col at the right of the <table>
 * @param {Object} [coords] Optional. Coords of the cell which col will be removed
 * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all cols will be removed
 */
Handsontable.TableView.prototype.removeCol = function (coords, toCoords) {
  var trs = this.$tableBody.childNodes, colThs, i;
  if (this.instance.blockedRows) {
    colThs = this.instance.table.find('thead th');
  }
  var r = 0;
  if (!coords || coords.col === this.instance.colCount - 1) {
    for (; r < this.instance.rowCount; r++) {
      $(trs[r].childNodes[this.instance.colCount + this.instance.blockedCols.count() - 1]).remove();
      if (colThs) {
        colThs.eq(this.instance.colCount + this.instance.blockedCols.count() - 1).remove();
      }
    }
    this.instance.colCount--;
  }
  else {
    for (; r < this.instance.rowCount; r++) {
      for (i = toCoords.col; i >= coords.col; i--) {
        $(trs[r].childNodes[i + this.instance.blockedCols.count()]).remove();

      }
    }
    if (colThs) {
      for (i = toCoords.col; i >= coords.col; i--) {
        colThs.eq(i + this.instance.blockedCols.count()).remove();
      }
    }
    this.instance.colCount -= toCoords.col - coords.col + 1;
  }
};

Handsontable.TableView.prototype.render = function (row, col, prop, value) {
  var coords = {row: row, col: col};
  var td = this.instance.getCell(row, col);
  this.applyCellTypeMethod('renderer', td, coords, value);
  this.instance.minWidthFix(td);
  return td;
};

Handsontable.TableView.prototype.renderRow = function (row) {
  var c, p;
  for (c = 0; c < this.instance.colCount; c++) {
    p = this.instance.colToProp(c);
    this.render(row, c, p, this.instance.getData()[row][p]);
  }
};

Handsontable.TableView.prototype.renderCol = function (col) {
  var r, p;
  for (r = 0; r < this.instance.rowCount; r++) {
    p = this.instance.colToProp(col);
    this.render(r, col, p, this.instance.getData()[r][p]);
  }
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
  return {
    row: td.parentNode.rowIndex - this.instance.blockedRows.count(),
    col: td.cellIndex - this.instance.blockedCols.count()
  };
};

/**
 * Returns td object given coordinates
 */
Handsontable.TableView.prototype.getCellAtCoords = function (coords) {
  if (coords.row < 0 || coords.col < 0) {
    return null;
  }
  var tr = this.$tableBody.childNodes[coords.row];
  if (tr) {
    return tr.childNodes[coords.col + this.instance.blockedCols.count()];
  }
  else {
    return null;
  }
};

/**
 * Returns all td objects in grid
 */
Handsontable.TableView.prototype.getAllCells = function () {
  var tds = [], trs, r, rlen, c, clen;
  trs = this.$tableBody.childNodes;
  rlen = this.instance.rowCount;
  if (rlen > 0) {
    clen = this.instance.colCount;
    for (r = 0; r < rlen; r++) {
      for (c = 0; c < clen; c++) {
        tds.push(trs[r].childNodes[c + this.instance.blockedCols.count()]);
      }
    }
  }
  return tds;
};

/**
 * Scroll viewport to selection
 * @param td
 */
Handsontable.TableView.prototype.scrollViewport = function (td) {
  if (!this.instance.selection.isSelected()) {
    return false;
  }

  var $td = $(td);
  var tdOffset = $td.offset();
  var scrollLeft = this.scrollable.scrollLeft(); //scrollbar position
  var scrollTop = this.scrollable.scrollTop(); //scrollbar position
  var scrollOffset = this.scrollable.offset();
  var rowHeaderWidth = this.instance.blockedCols.count() ? $(this.instance.blockedCols.main[0].firstChild).outerWidth() : 2;
  var colHeaderHeight = this.instance.blockedRows.count() ? $(this.instance.blockedRows.main[0].firstChild).outerHeight() : 2;

  var offsetTop = tdOffset.top;
  var offsetLeft = tdOffset.left;
  var scrollWidth, scrollHeight;
  if (scrollOffset) { //if is not the window
    scrollWidth = this.scrollable.outerWidth();
    scrollHeight = this.scrollable.outerHeight();
    offsetTop += scrollTop - scrollOffset.top;
    offsetLeft += scrollLeft - scrollOffset.left;
  }
  else {
    scrollWidth = this.scrollable.width(); //don't use outerWidth with window (http://api.jquery.com/outerWidth/)
    scrollHeight = this.scrollable.height();
  }
  scrollWidth -= this.scrollbarSize.width;
  scrollHeight -= this.scrollbarSize.height;

  var height = $td.outerHeight();
  var width = $td.outerWidth();

  var that = this;
  if (scrollLeft + scrollWidth <= offsetLeft + width) {
    setTimeout(function () {
      that.scrollable.scrollLeft(offsetLeft + width - scrollWidth);
    }, 1);
  }
  else if (scrollLeft > offsetLeft - rowHeaderWidth) {
    setTimeout(function () {
      that.scrollable.scrollLeft(offsetLeft - rowHeaderWidth);
    }, 1);
  }

  if (scrollTop + scrollHeight <= offsetTop + height) {
    setTimeout(function () {
      that.scrollable.scrollTop(offsetTop + height - scrollHeight);
    }, 1);
  }
  else if (scrollTop > offsetTop - colHeaderHeight) {
    setTimeout(function () {
      that.scrollable.scrollTop(offsetTop - colHeaderHeight);
    }, 1);
  }
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
  this.instance = instance;
  this.$container = instance.container;
  var container = this.$container[0];

  if (options.bg) {
    this.bg = document.createElement("div");
    this.bg.className = 'htBorderBg ' + options.className;
    container.insertBefore(this.bg, container.firstChild);
  }

  this.main = document.createElement("div");
  this.main.style.position = 'absolute';
  this.main.style.top = 0;
  this.main.style.left = 0;
  this.main.innerHTML = (new Array(5)).join('<div class="htBorder ' + options.className + '"></div>');
  this.disappear();
  container.appendChild(this.main);

  var nodes = this.main.childNodes;
  this.top = nodes[0];
  this.left = nodes[1];
  this.bottom = nodes[2];
  this.right = nodes[3];

  this.borderWidth = $(this.left).width();
};

Handsontable.Border.prototype = {
  /**
   * Show border around one or many cells
   * @param {Object[]} coordsArr
   */
  appear: function (coordsArr) {
    var $from, $to, fromOffset, toOffset, containerOffset, top, minTop, left, minLeft, height, width;
    if (this.disabled) {
      return;
    }

    this.corners = this.instance.getCornerCoords(coordsArr);

    $from = $(this.instance.getCell(this.corners.TL.row, this.corners.TL.col));
    $to = (coordsArr.length > 1) ? $(this.instance.getCell(this.corners.BR.row, this.corners.BR.col)) : $from;
    fromOffset = $from.offset();
    toOffset = (coordsArr.length > 1) ? $to.offset() : fromOffset;
    containerOffset = this.$container.offset();

    minTop = fromOffset.top;
    height = toOffset.top + $to.outerHeight() - minTop;
    minLeft = fromOffset.left;
    width = toOffset.left + $to.outerWidth() - minLeft;

    top = minTop - containerOffset.top + this.$container.scrollTop() - 1;
    left = minLeft - containerOffset.left + this.$container.scrollLeft() - 1;

    if (parseInt($from.css('border-top-width')) > 0) {
      top += 1;
      height -= 1;
    }
    if (parseInt($from.css('border-left-width')) > 0) {
      left += 1;
      width -= 1;
    }

    if (this.bg) {
      this.bg.style.top = top + 'px';
      this.bg.style.left = left + 'px';
      this.bg.style.width = width + 'px';
      this.bg.style.height = height + 'px';
      this.bg.style.display = 'block';
    }

    this.top.style.top = top + 'px';
    this.top.style.left = left + 'px';
    this.top.style.width = width + 'px';

    this.left.style.top = top + 'px';
    this.left.style.left = left + 'px';
    this.left.style.height = height + 'px';

    var delta = Math.floor(this.borderWidth / 2);

    this.bottom.style.top = top + height - delta + 'px';
    this.bottom.style.left = left + 'px';
    this.bottom.style.width = width + 'px';

    this.right.style.top = top + 'px';
    this.right.style.left = left + width - delta + 'px';
    this.right.style.height = height + 1 + 'px';

    this.main.style.display = 'block';
  },

  /**
   * Hide border
   */
  disappear: function () {
    this.main.style.display = 'none';
    if (this.bg) {
      this.bg.style.display = 'none';
    }
    this.corners = null;
  }
};
/**
 * Create DOM element for drag-down handle
 * @constructor
 * @param {Object} instance Handsontable instance
 */
Handsontable.FillHandle = function (instance) {
  this.instance = instance;
  this.$container = instance.container;
  var container = this.$container[0];

  this.handle = document.createElement("div");
  this.handle.className = "htFillHandle";
  this.disappear();
  container.appendChild(this.handle);

  var that = this;
  $(this.handle).mousedown(function () {
    that.isDragged = 1;
  });

  this.$container.find('table').on('selectstart', function (event) {
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

    top = tdOffset.top - containerOffset.top + this.$container.scrollTop() - 1;
    left = tdOffset.left - containerOffset.left + this.$container.scrollLeft() - 1;
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
  var that = this;
  this.instance = instance;
  this.headers = [];
  var position = instance.table.position();
  instance.positionFix(position);
  this.main = $('<div style="position: absolute; top: ' + position.top + 'px; left: ' + position.left + 'px"><table class="htBlockedRows" cellspacing="0" cellpadding="0"><thead></thead></table></div>');
  this.instance.container.append(this.main);
  this.hasCSS3 = !($.browser.msie && (parseInt($.browser.version, 10) <= 8)); //Used to get over IE8- not having :last-child selector
  this.update();
  this.instance.rootElement.on('cellrender.handsontable', function (event, changes, source) {
    setTimeout(function () {
      that.dimensions();
    }, 10);
  });
};

/**
 * Returns number of blocked cols
 */
Handsontable.BlockedRows.prototype.count = function () {
  return this.headers.length;
};

/**
 * Create column header in the grid table
 */
Handsontable.BlockedRows.prototype.createCol = function (className) {
  var $tr, th, h, hlen = this.count();
  for (h = 0; h < hlen; h++) {
    $tr = this.main.find('thead tr.' + this.headers[h].className);
    if (!$tr.length) {
      $tr = $('<tr class="' + this.headers[h].className + '"></tr>');
      this.main.find('thead').append($tr);
    }
    $tr = this.instance.table.find('thead tr.' + this.headers[h].className);
    if (!$tr.length) {
      $tr = $('<tr class="' + this.headers[h].className + '"></tr>');
      this.instance.table.find('thead').append($tr);
    }

    th = document.createElement('th');
    th.className = this.headers[h].className;
    if (className) {
      th.className += ' ' + className;
    }
    th.innerHTML = this.headerText('&nbsp;');
    this.instance.minWidthFix(th);
    this.instance.table.find('thead tr.' + this.headers[h].className)[0].appendChild(th);

    th = document.createElement('th');
    th.className = this.headers[h].className;
    if (className) {
      th.className += ' ' + className;
    }
    this.instance.minWidthFix(th);
    this.main.find('thead tr.' + this.headers[h].className)[0].appendChild(th);
  }
};

/**
 * Create column header in the grid table
 */
Handsontable.BlockedRows.prototype.create = function () {
  var c;
  if (this.count() > 0) {
    this.instance.table.find('thead').empty();
    this.main.find('thead').empty();
    var offset = this.instance.blockedCols.count();
    for (c = offset - 1; c >= 0; c--) {
      this.createCol(this.instance.blockedCols.headers[c].className);
    }
    for (c = 0; c < this.instance.colCount; c++) {
      this.createCol();
    }
  }
  if (!this.hasCSS3) {
    this.instance.container.find('thead tr.lastChild').not(':last-child').removeClass('lastChild');
    this.instance.container.find('thead tr:last-child').not('.lastChild').addClass('lastChild');
  }
};

/**
 * Copy table column header onto the floating layer above the grid
 */
Handsontable.BlockedRows.prototype.refresh = function () {
  var label;
  if (this.count() > 0) {
    var that = this;
    var hlen = this.count(), h;
    for (h = 0; h < hlen; h++) {
      var $tr = this.main.find('thead tr.' + this.headers[h].className);
      var tr = $tr[0];
      var ths = tr.childNodes;
      var thsLen = ths.length;
      var offset = this.instance.blockedCols.count();

      while (thsLen > this.instance.colCount + offset) {
        //remove excessive cols
        thsLen--;
        $(tr.childNodes[thsLen]).remove();
      }

      for (h = 0; h < hlen; h++) {
        var realThs = this.instance.table.find('thead th.' + this.headers[h].className);
        for (var i = 0; i < thsLen; i++) {
          label = that.headers[h].columnLabel(i - offset);
          if (this.headers[h].format && this.headers[h].format === 'small') {
            realThs[i].innerHTML = this.headerText(label);
            ths[i].innerHTML = this.headerText(label);
          }
          else {
            realThs[i].innerHTML = label;
            ths[i].innerHTML = label;
          }
          this.instance.minWidthFix(realThs[i]);
          this.instance.minWidthFix(ths[i]);
          ths[i].style.minWidth = realThs.eq(i).width() + 'px';
        }
      }
    }

    this.ths = this.main.find('tr:last-child th');
    this.refreshBorders();
  }
};

/**
 * Refresh border width
 */
Handsontable.BlockedRows.prototype.refreshBorders = function () {
  if (this.count() > 0) {
    if (this.instance.curScrollTop === 0) {
      this.ths.css('borderBottomWidth', 0);
    }
    else if (this.instance.lastScrollTop === 0) {
      this.ths.css('borderBottomWidth', '1px');
    }
  }
};

/**
 * Recalculate column widths on the floating layer above the grid
 */
Handsontable.BlockedRows.prototype.dimensions = function () {
  if (this.count() > 0) {
    var realThs = this.instance.table.find('thead th');
    for (var i = 0, ilen = realThs.length; i < ilen; i++) {
      this.ths[i].style.minWidth = $(realThs[i]).width() + 'px';
    }
  }
};


/**
 * Update settings of the column header
 */
Handsontable.BlockedRows.prototype.update = function () {
  this.create();
  this.refresh();
};

/**
 * Add column header to DOM
 */
Handsontable.BlockedRows.prototype.addHeader = function (header) {
  for (var h = this.count() - 1; h >= 0; h--) {
    if (this.headers[h].className === header.className) {
      this.headers.splice(h, 1); //if exists, remove then add to recreate
    }
  }
  this.headers.push(header);
  this.headers.sort(function (a, b) {
    return a.priority || 0 - b.priority || 0
  });
  this.update();
};

/**
 * Remove column header from DOM
 */
Handsontable.BlockedRows.prototype.destroyHeader = function (className) {
  for (var h = this.count() - 1; h >= 0; h--) {
    if (this.headers[h].className === className) {
      this.main.find('thead tr.' + this.headers[h].className).remove();
      this.instance.table.find('thead tr.' + this.headers[h].className).remove();
      this.headers.splice(h, 1);
    }
  }
};

/**
 * Puts string to small text template
 */
Handsontable.BlockedRows.prototype.headerText = function (str) {
  return '&nbsp;<span class="small">' + str + '</span>&nbsp;';
};
/**
 * Handsontable BlockedCols class
 * @param {Object} instance
 */
Handsontable.BlockedCols = function (instance) {
  var that = this;
  this.instance = instance;
  this.headers = [];
  var position = instance.table.position();
  instance.positionFix(position);
  this.main = $('<div style="position: absolute; top: ' + position.top + 'px; left: ' + position.left + 'px"><table class="htBlockedCols" cellspacing="0" cellpadding="0"><thead><tr></tr></thead><tbody></tbody></table></div>');
  this.instance.container.append(this.main);
  this.heightMethod = this.determineCellHeightMethod();
  this.instance.rootElement.on('cellrender.handsontable', function (/*event, changes, source*/) {
    setTimeout(function () {
      that.dimensions();
    }, 10);
  });
};

/**
 * Determine cell height method
 * @return {String}
 */
Handsontable.BlockedCols.prototype.determineCellHeightMethod = function () {
  return 'height';
};

/**
 * Returns number of blocked cols
 */
Handsontable.BlockedCols.prototype.count = function () {
  return this.headers.length;
};

/**
 * Create row header in the grid table
 */
Handsontable.BlockedCols.prototype.createRow = function (tr) {
  var th;
  var mainTr = document.createElement('tr');

  for (var h = 0, hlen = this.count(); h < hlen; h++) {
    th = document.createElement('th');
    th.className = this.headers[h].className;
    this.instance.minWidthFix(th);
    tr.insertBefore(th, tr.firstChild);

    th = document.createElement('th');
    th.className = this.headers[h].className;
    mainTr.insertBefore(th, mainTr.firstChild);
  }

  this.main.find('tbody')[0].appendChild(mainTr);
};

/**
 * Create row header in the grid table
 */
Handsontable.BlockedCols.prototype.create = function () {
  var hlen = this.count(), h, th;
  this.main.find('tbody').empty();
  this.instance.table.find('tbody th').remove();
  var $theadTr = this.main.find('thead tr');
  $theadTr.empty();

  if (hlen > 0) {
    var offset = this.instance.blockedRows.count();
    if (offset) {
      for (h = 0; h < hlen; h++) {
        th = $theadTr[0].getElementsByClassName ? $theadTr[0].getElementsByClassName(this.headers[h].className)[0] : $theadTr.find('.' + this.headers[h].className.replace(/\s/i, '.'))[0];
        if (!th) {
          th = document.createElement('th');
          th.className = this.headers[h].className;
          th.innerHTML = this.headerText('&nbsp;');
          this.instance.minWidthFix(th);
          $theadTr[0].insertBefore(th, $theadTr[0].firstChild);
        }
      }
    }

    var trs = this.instance.table.find('tbody')[0].childNodes;
    for (var r = 0; r < this.instance.rowCount; r++) {
      this.createRow(trs[r]);
    }
  }
};

/**
 * Copy table row header onto the floating layer above the grid
 */
Handsontable.BlockedCols.prototype.refresh = function () {
  var hlen = this.count(), h, th, realTh, i, label;
  if (hlen > 0) {
    var $tbody = this.main.find('tbody');
    var tbody = $tbody[0];
    var trs = tbody.childNodes;
    var trsLen = trs.length;
    while (trsLen > this.instance.rowCount) {
      //remove excessive rows
      trsLen--;
      $(tbody.childNodes[trsLen]).remove();
    }

    var realTrs = this.instance.table.find('tbody tr');
    for (i = 0; i < trsLen; i++) {
      for (h = 0; h < hlen; h++) {
        label = this.headers[h].columnLabel(i);
        realTh = realTrs[i].getElementsByClassName ? realTrs[i].getElementsByClassName(this.headers[h].className)[0] : $(realTrs[i]).find('.' + this.headers[h].className.replace(/\s/i, '.'))[0];
        th = trs[i].getElementsByClassName ? trs[i].getElementsByClassName(this.headers[h].className)[0] : $(trs[i]).find('.' + this.headers[h].className.replace(/\s/i, '.'))[0];
        if (this.headers[h].format && this.headers[h].format === 'small') {
          realTh.innerHTML = this.headerText(label);
          th.innerHTML = this.headerText(label);
        }
        else {
          realTh.innerHTML = label;
          th.innerHTML = label;
        }
        this.instance.minWidthFix(th);
        th.style.height = $(realTh)[this.heightMethod]() + 'px';
      }
    }

    this.ths = this.main.find('th:last-child');
    this.refreshBorders();
  }
};

/**
 * Refresh border width
 */
Handsontable.BlockedCols.prototype.refreshBorders = function () {
  if (this.count() > 0) {
    if (this.instance.curScrollLeft === 0) {
      this.ths.css('borderRightWidth', 0);
    }
    else if (this.instance.lastScrollLeft === 0) {
      this.ths.css('borderRightWidth', '1px');
    }
  }
};

/**
 * Recalculate row heights on the floating layer above the grid
 */
Handsontable.BlockedCols.prototype.dimensions = function () {
  if (this.count() > 0) {
    var realTrs = this.instance.table[0].getElementsByTagName('tbody')[0].childNodes;
    var trs = this.main[0].firstChild.getElementsByTagName('tbody')[0].childNodes;
    for (var i = 0, ilen = realTrs.length; i < ilen; i++) {
      trs[i].firstChild.style.height = $(realTrs[i].firstChild)[this.heightMethod]() + 'px';
    }
  }
};

/**
 * Update settings of the row header
 */
Handsontable.BlockedCols.prototype.update = Handsontable.BlockedRows.prototype.update;

/**
 * Add row header to DOM
 */
Handsontable.BlockedCols.prototype.addHeader = function (header) {
  for (var h = this.count() - 1; h >= 0; h--) {
    if (this.headers[h].className === header.className) {
      this.headers.splice(h, 1); //if exists, remove then add to recreate
    }
  }
  this.headers.push(header);
  this.headers.sort(function (a, b) {
    return a.priority || 0 - b.priority || 0
  });
};

/**
 * Remove row header from DOM
 */
Handsontable.BlockedCols.prototype.destroyHeader = function (className) {
  for (var h = this.count() - 1; h >= 0; h--) {
    if (this.headers[h].className === className) {
      this.headers.splice(h, 1);
    }
  }
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
  instance.blockedRows.main.on('mousedown', 'th.htColHeader', function () {
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

    instance.container.find('.htBorder.current').off('.editor');
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
  var containerOffset = instance.container.offset();
  var scrollTop = instance.container.scrollTop();
  var scrollLeft = instance.container.scrollLeft();
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
  instance.container.find('.htBorder.current').on('dblclick.editor', onDblClick);

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
    , dontHide = false;

  if (!typeahead) {
    keyboardProxy.typeahead();
    typeahead = keyboardProxy.data('typeahead');
    typeahead._show = typeahead.show;
    typeahead._hide = typeahead.hide;
    typeahead._render = typeahead.render;
    typeahead._highlighter = typeahead.highlighter;
  }
  else {
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
  for (var i in cellProperties) {
    if ((typeahead.hasOwnProperty(i) || i === 'render') && i !== 'options') {
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
})(jQuery, window, Handsontable);
/* =============================================================
 * bootstrap-typeahead.js v2.1.1
 * http://twitter.github.com/bootstrap/javascript.html#typeahead
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function($){

  "use strict"; // jshint ;_;


 /* TYPEAHEAD PUBLIC CLASS DEFINITION
  * ================================= */

  var Typeahead = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.typeahead.defaults, options)
    this.matcher = this.options.matcher || this.matcher
    this.sorter = this.options.sorter || this.sorter
    this.highlighter = this.options.highlighter || this.highlighter
    this.updater = this.options.updater || this.updater
    this.$menu = $(this.options.menu).appendTo('body')
    this.source = this.options.source
    this.shown = false
    this.listen()
  }

  Typeahead.prototype = {

    constructor: Typeahead

  , select: function () {
      var val = this.$menu.find('.active').attr('data-value')
      this.$element
        .val(this.updater(val))
        .change()
      return this.hide()
    }

  , updater: function (item) {
      return item
    }

  , show: function () {
      var pos = $.extend({}, this.$element.offset(), {
        height: this.$element[0].offsetHeight
      })

      this.$menu.css({
        top: pos.top + pos.height
      , left: pos.left
      })

      this.$menu.show()
      this.shown = true
      return this
    }

  , hide: function () {
      this.$menu.hide()
      this.shown = false
      return this
    }

  , lookup: function (event) {
      var items

      this.query = this.$element.val()

      if (!this.query || this.query.length < this.options.minLength) {
        return this.shown ? this.hide() : this
      }

      items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source

      return items ? this.process(items) : this
    }

  , process: function (items) {
      var that = this

      items = $.grep(items, function (item) {
        return that.matcher(item)
      })

      items = this.sorter(items)

      if (!items.length) {
        return this.shown ? this.hide() : this
      }

      return this.render(items.slice(0, this.options.items)).show()
    }

  , matcher: function (item) {
      return ~item.toLowerCase().indexOf(this.query.toLowerCase())
    }

  , sorter: function (items) {
      var beginswith = []
        , caseSensitive = []
        , caseInsensitive = []
        , item

      while (item = items.shift()) {
        if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
        else if (~item.indexOf(this.query)) caseSensitive.push(item)
        else caseInsensitive.push(item)
      }

      return beginswith.concat(caseSensitive, caseInsensitive)
    }

  , highlighter: function (item) {
      var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
      return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>'
      })
    }

  , render: function (items) {
      var that = this

      items = $(items).map(function (i, item) {
        i = $(that.options.item).attr('data-value', item)
        i.find('a').html(that.highlighter(item))
        return i[0]
      })

      items.first().addClass('active')
      this.$menu.html(items)
      return this
    }

  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next()

      if (!next.length) {
        next = $(this.$menu.find('li')[0])
      }

      next.addClass('active')
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev()

      if (!prev.length) {
        prev = this.$menu.find('li').last()
      }

      prev.addClass('active')
    }

  , listen: function () {
      this.$element
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this))

      if ($.browser.chrome || $.browser.webkit || $.browser.msie) {
        this.$element.on('keydown', $.proxy(this.keydown, this))
      }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
    }

  , move: function (e) {
      if (!this.shown) return

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault()
          break

        case 38: // up arrow
          e.preventDefault()
          this.prev()
          break

        case 40: // down arrow
          e.preventDefault()
          this.next()
          break
      }

      e.stopPropagation()
    }

  , keydown: function (e) {
      this.suppressKeyPressRepeat = !~$.inArray(e.keyCode, [40,38,9,13,27])
      this.move(e)
    }

  , keypress: function (e) {
      if (this.suppressKeyPressRepeat) return
      this.move(e)
    }

  , keyup: function (e) {
      switch(e.keyCode) {
        case 40: // down arrow
        case 38: // up arrow
          break

        case 9: // tab
        case 13: // enter
          if (!this.shown) return
          this.select()
          break

        case 27: // escape
          if (!this.shown) return
          this.hide()
          break

        default:
          this.lookup()
      }

      e.stopPropagation()
      e.preventDefault()
  }

  , blur: function (e) {
      var that = this
      setTimeout(function () { that.hide() }, 150)
    }

  , click: function (e) {
      e.stopPropagation()
      e.preventDefault()
      this.select()
    }

  , mouseenter: function (e) {
      this.$menu.find('.active').removeClass('active')
      $(e.currentTarget).addClass('active')
    }

  }


  /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

  $.fn.typeahead = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('typeahead')
        , options = typeof option == 'object' && option
      if (!data) $this.data('typeahead', (data = new Typeahead(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.typeahead.defaults = {
    source: []
  , items: 8
  , menu: '<ul class="typeahead dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  , minLength: 1
  }

  $.fn.typeahead.Constructor = Typeahead


 /*   TYPEAHEAD DATA-API
  * ================== */

  $(function () {
    $('body').on('focus.typeahead.data-api', '[data-provide="typeahead"]', function (e) {
      var $this = $(this)
      if ($this.data('typeahead')) return
      e.preventDefault()
      $this.typeahead($this.data())
    })
  })

}(window.jQuery);
/*!
 * jQuery contextMenu - Plugin for simple contextMenu handling
 *
 * Version: 1.5.25
 *
 * Authors: Rodney Rehm, Addy Osmani (patches for FF)
 * Web: http://medialize.github.com/jQuery-contextMenu/
 *
 * Licensed under
 *   MIT License http://www.opensource.org/licenses/mit-license
 *   GPL v3 http://opensource.org/licenses/GPL-3.0
 *
 */

(function($, undefined){
    
    // TODO: -
        // ARIA stuff: menuitem, menuitemcheckbox und menuitemradio
        // create <menu> structure if $.support[htmlCommand || htmlMenuitem] and !opt.disableNative

// determine html5 compatibility
$.support.htmlMenuitem = ('HTMLMenuItemElement' in window);
$.support.htmlCommand = ('HTMLCommandElement' in window);
$.support.eventSelectstart = ("onselectstart" in document.documentElement);
/* // should the need arise, test for css user-select
$.support.cssUserSelect = (function(){
    var t = false,
        e = document.createElement('div');
    
    $.each('Moz|Webkit|Khtml|O|ms|Icab|'.split('|'), function(i, prefix) {
        var propCC = prefix + (prefix ? 'U' : 'u') + 'serSelect',
            prop = (prefix ? ('-' + prefix.toLowerCase() + '-') : '') + 'user-select';
            
        e.style.cssText = prop + ': text;';
        if (e.style[propCC] == 'text') {
            t = true;
            return false;
        }
        
        return true;
    });
    
    return t;
})();
*/

var // currently active contextMenu trigger
    $currentTrigger = null,
    // is contextMenu initialized with at least one menu?
    initialized = false,
    // window handle
    $win = $(window),
    // number of registered menus
    counter = 0,
    // mapping selector to namespace
    namespaces = {},
    // mapping namespace to options
    menus = {},
    // custom command type handlers
    types = {},
    // default values
    defaults = {
        // selector of contextMenu trigger
        selector: null,
        // where to append the menu to
        appendTo: null,
        // method to trigger context menu ["right", "left", "hover"]
        trigger: "right",
        // hide menu when mouse leaves trigger / menu elements
        autoHide: false,
        // ms to wait before showing a hover-triggered context menu
        delay: 200,
        // determine position to show menu at
        determinePosition: function($menu) {
            // position to the lower middle of the trigger element
            if ($.ui && $.ui.position) {
                // .position() is provided as a jQuery UI utility
                // (...and it won't work on hidden elements)
                $menu.css('display', 'block').position({
                    my: "center top",
                    at: "center bottom",
                    of: this,
                    offset: "0 5",
                    collision: "fit"
                }).css('display', 'none');
            } else {
                // determine contextMenu position
                var offset = this.offset();
                offset.top += this.outerHeight();
                offset.left += this.outerWidth() / 2 - $menu.outerWidth() / 2;
                $menu.css(offset);
            }
        },
        // position menu
        position: function(opt, x, y) {
            var $this = this,
                offset;
            // determine contextMenu position
            if (!x && !y) {
                opt.determinePosition.call(this, opt.$menu);
                return;
            } else if (x === "maintain" && y === "maintain") {
                // x and y must not be changed (after re-show on command click)
                offset = opt.$menu.position();
            } else {
                // x and y are given (by mouse event)
                var triggerIsFixed = opt.$trigger.parents().andSelf()
                    .filter(function() {
                        return $(this).css('position') == "fixed";
                    }).length;

                if (triggerIsFixed) {
                    y -= $win.scrollTop();
                    x -= $win.scrollLeft();
                }
                offset = {top: y, left: x};
            }
            
            // correct offset if viewport demands it
            var bottom = $win.scrollTop() + $win.height(),
                right = $win.scrollLeft() + $win.width(),
                height = opt.$menu.height(),
                width = opt.$menu.width();
            
            if (offset.top + height > bottom) {
                offset.top -= height;
            }
            
            if (offset.left + width > right) {
                offset.left -= width;
            }
            
            opt.$menu.css(offset);
        },
        // position the sub-menu
        positionSubmenu: function($menu) {
            if ($.ui && $.ui.position) {
                // .position() is provided as a jQuery UI utility
                // (...and it won't work on hidden elements)
                $menu.css('display', 'block').position({
                    my: "left top",
                    at: "right top",
                    of: this,
                    collision: "fit"
                }).css('display', '');
            } else {
                // determine contextMenu position
                var offset = {
                    top: 0,
                    left: this.outerWidth()
                };
                $menu.css(offset);
            }
        },
        // offset to add to zIndex
        zIndex: 1,
        // show hide animation settings
        animation: {
            duration: 50,
            show: 'slideDown',
            hide: 'slideUp'
        },
        // events
        events: {
            show: $.noop,
            hide: $.noop
        },
        // default callback
        callback: null,
        // list of contextMenu items
        items: {}
    },
    // mouse position for hover activation
    hoveract = {
        timer: null,
        pageX: null,
        pageY: null
    },
    // determine zIndex
    zindex = function($t) {
        var zin = 0,
            $tt = $t;

        while (true) {
            zin = Math.max(zin, parseInt($tt.css('z-index'), 10) || 0);
            $tt = $tt.parent();
            if (!$tt || !$tt.length || "html body".indexOf($tt.prop('nodeName').toLowerCase()) > -1 ) {
                break;
            }
        }
        
        return zin;
    },
    // event handlers
    handle = {
        // abort anything
        abortevent: function(e){
            e.preventDefault();
            e.stopImmediatePropagation();
        },
        
        // contextmenu show dispatcher
        contextmenu: function(e) {
            var $this = $(this);
            
            // disable actual context-menu
            e.preventDefault();
            e.stopImmediatePropagation();
            
            // abort native-triggered events unless we're triggering on right click
            if (e.data.trigger != 'right' && e.originalEvent) {
                return;
            }
            
            if (!$this.hasClass('context-menu-disabled')) {
                // theoretically need to fire a show event at <menu>
                // http://www.whatwg.org/specs/web-apps/current-work/multipage/interactive-elements.html#context-menus
                // var evt = jQuery.Event("show", { data: data, pageX: e.pageX, pageY: e.pageY, relatedTarget: this });
                // e.data.$menu.trigger(evt);
                
                $currentTrigger = $this;
                if (e.data.build) {
                    var built = e.data.build($currentTrigger, e);
                    // abort if build() returned false
                    if (built === false) {
                        return;
                    }
                    
                    // dynamically build menu on invocation
                    e.data = $.extend(true, {}, defaults, e.data, built || {});

                    // abort if there are no items to display
                    if (!e.data.items || $.isEmptyObject(e.data.items)) {
                        // Note: jQuery captures and ignores errors from event handlers
                        if (window.console) {
                            (console.error || console.log)("No items specified to show in contextMenu");
                        }
                        
                        throw new Error('No Items sepcified');
                    }
                    
                    // backreference for custom command type creation
                    e.data.$trigger = $currentTrigger;
                    
                    op.create(e.data);
                }
                // show menu
                op.show.call($this, e.data, e.pageX, e.pageY);
            }
        },
        // contextMenu left-click trigger
        click: function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            $(this).trigger($.Event("contextmenu", { data: e.data, pageX: e.pageX, pageY: e.pageY }));
        },
        // contextMenu right-click trigger
        mousedown: function(e) {
            // register mouse down
            var $this = $(this);
            
            // hide any previous menus
            if ($currentTrigger && $currentTrigger.length && !$currentTrigger.is($this)) {
                $currentTrigger.data('contextMenu').$menu.trigger('contextmenu:hide');
            }
            
            // activate on right click
            if (e.button == 2) {
                $currentTrigger = $this.data('contextMenuActive', true);
            }
        },
        // contextMenu right-click trigger
        mouseup: function(e) {
            // show menu
            var $this = $(this);
            if ($this.data('contextMenuActive') && $currentTrigger && $currentTrigger.length && $currentTrigger.is($this) && !$this.hasClass('context-menu-disabled')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                $currentTrigger = $this;
                $this.trigger($.Event("contextmenu", { data: e.data, pageX: e.pageX, pageY: e.pageY }));
            }
            
            $this.removeData('contextMenuActive');
        },
        // contextMenu hover trigger
        mouseenter: function(e) {
            var $this = $(this),
                $related = $(e.relatedTarget),
                $document = $(document);
            
            // abort if we're coming from a menu
            if ($related.is('.context-menu-list') || $related.closest('.context-menu-list').length) {
                return;
            }
            
            // abort if a menu is shown
            if ($currentTrigger && $currentTrigger.length) {
                return;
            }
            
            hoveract.pageX = e.pageX;
            hoveract.pageY = e.pageY;
            hoveract.data = e.data;
            $document.on('mousemove.contextMenuShow', handle.mousemove);
            hoveract.timer = setTimeout(function() {
                hoveract.timer = null;
                $document.off('mousemove.contextMenuShow');
                $currentTrigger = $this;
                $this.trigger($.Event("contextmenu", { data: hoveract.data, pageX: hoveract.pageX, pageY: hoveract.pageY }));
            }, e.data.delay );
        },
        // contextMenu hover trigger
        mousemove: function(e) {
            hoveract.pageX = e.pageX;
            hoveract.pageY = e.pageY;
        },
        // contextMenu hover trigger
        mouseleave: function(e) {
            // abort if we're leaving for a menu
            var $related = $(e.relatedTarget);
            if ($related.is('.context-menu-list') || $related.closest('.context-menu-list').length) {
                return;
            }
            
            try {
                clearTimeout(hoveract.timer);
            } catch(e) {}
            
            hoveract.timer = null;
        },
        
        // click on layer to hide contextMenu
        layerClick: function(e) {
            var $this = $(this),
                root = $this.data('contextMenuRoot'),
                mouseup = false,
                button = e.button,
                x = e.pageX,
                y = e.pageY,
                target, 
                offset,
                selectors;
                
            e.preventDefault();
            e.stopImmediatePropagation();
            
            // This hack looks about as ugly as it is
            // Firefox 12 (at least) fires the contextmenu event directly "after" mousedown
            // for some reason `root.$layer.hide(); document.elementFromPoint()` causes this
            // contextmenu event to be triggered on the uncovered element instead of on the
            // layer (where every other sane browser, including Firefox nightly at the time)
            // triggers the event. This workaround might be obsolete by September 2012.
            $this.on('mouseup', function() {
                mouseup = true;
            });
            setTimeout(function() {
                var $window, hideshow;
                // test if we need to reposition the menu
                if ((root.trigger == 'left' && button == 0) || (root.trigger == 'right' && button == 2)) {
                    if (document.elementFromPoint) {
                        root.$layer.hide();
                        target = document.elementFromPoint(x - $win.scrollLeft(), y - $win.scrollTop());
                        root.$layer.show();

                        selectors = [];
                        for (var s in namespaces) {
                            selectors.push(s);
                        }

                        target = $(target).closest(selectors.join(', '));

                        if (target.length) {
                            if (target.is(root.$trigger[0])) {
                                root.position.call(root.$trigger, root, x, y);
                                return;
                            }
                        }
                    } else {
                        offset = root.$trigger.offset();
                        $window = $(window);
                        // while this looks kinda awful, it's the best way to avoid
                        // unnecessarily calculating any positions
                        offset.top += $window.scrollTop();
                        if (offset.top <= e.pageY) {
                            offset.left += $window.scrollLeft();
                            if (offset.left <= e.pageX) {
                                offset.bottom = offset.top + root.$trigger.outerHeight();
                                if (offset.bottom >= e.pageY) {
                                    offset.right = offset.left + root.$trigger.outerWidth();
                                    if (offset.right >= e.pageX) {
                                        // reposition
                                        root.position.call(root.$trigger, root, x, y);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }

                hideshow = function(e) {
                    if (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                    }

                    root.$menu.trigger('contextmenu:hide');
                    if (target && target.length) {
                        setTimeout(function() {
                            target.contextMenu({x: x, y: y});
                        }, 50);
                    }
                };
            
                if (mouseup) {
                    // mouseup has already happened
                    hideshow();
                } else {
                    // remove only after mouseup has completed
                    $this.on('mouseup', hideshow);
                }
            }, 50);
        },
        // key handled :hover
        keyStop: function(e, opt) {
            if (!opt.isInput) {
                e.preventDefault();
            }
            
            e.stopPropagation();
        },
        key: function(e) {
            var opt = $currentTrigger.data('contextMenu') || {},
                $children = opt.$menu.children(),
                $round;

            switch (e.keyCode) {
                case 9:
                case 38: // up
                    handle.keyStop(e, opt);
                    // if keyCode is [38 (up)] or [9 (tab) with shift]
                    if (opt.isInput) {
                        if (e.keyCode == 9 && e.shiftKey) {
                            e.preventDefault();
                            opt.$selected && opt.$selected.find('input, textarea, select').blur();
                            opt.$menu.trigger('prevcommand');
                            return;
                        } else if (e.keyCode == 38 && opt.$selected.find('input, textarea, select').prop('type') == 'checkbox') {
                            // checkboxes don't capture this key
                            e.preventDefault();
                            return;
                        }
                    } else if (e.keyCode != 9 || e.shiftKey) {
                        opt.$menu.trigger('prevcommand');
                        return;
                    }
                    // omitting break;
                    
                // case 9: // tab - reached through omitted break;
                case 40: // down
                    handle.keyStop(e, opt);
                    if (opt.isInput) {
                        if (e.keyCode == 9) {
                            e.preventDefault();
                            opt.$selected && opt.$selected.find('input, textarea, select').blur();
                            opt.$menu.trigger('nextcommand');
                            return;
                        } else if (e.keyCode == 40 && opt.$selected.find('input, textarea, select').prop('type') == 'checkbox') {
                            // checkboxes don't capture this key
                            e.preventDefault();
                            return;
                        }
                    } else {
                        opt.$menu.trigger('nextcommand');
                        return;
                    }
                    break;
                
                case 37: // left
                    handle.keyStop(e, opt);
                    if (opt.isInput || !opt.$selected || !opt.$selected.length) {
                        break;
                    }
                
                    if (!opt.$selected.parent().hasClass('context-menu-root')) {
                        var $parent = opt.$selected.parent().parent();
                        opt.$selected.trigger('contextmenu:blur');
                        opt.$selected = $parent;
                        return;
                    }
                    break;
                    
                case 39: // right
                    handle.keyStop(e, opt);
                    if (opt.isInput || !opt.$selected || !opt.$selected.length) {
                        break;
                    }
                    
                    var itemdata = opt.$selected.data('contextMenu') || {};
                    if (itemdata.$menu && opt.$selected.hasClass('context-menu-submenu')) {
                        opt.$selected = null;
                        itemdata.$selected = null;
                        itemdata.$menu.trigger('nextcommand');
                        return;
                    }
                    break;
                
                case 35: // end
                case 36: // home
                    if (opt.$selected && opt.$selected.find('input, textarea, select').length) {
                        return;
                    } else {
                        (opt.$selected && opt.$selected.parent() || opt.$menu)
                            .children(':not(.disabled, .not-selectable)')[e.keyCode == 36 ? 'first' : 'last']()
                            .trigger('contextmenu:focus');
                        e.preventDefault();
                        return;
                    }
                    break;
                    
                case 13: // enter
                    handle.keyStop(e, opt);
                    if (opt.isInput) {
                        if (opt.$selected && !opt.$selected.is('textarea, select')) {
                            e.preventDefault();
                            return;
                        }
                        break;
                    }
                    opt.$selected && opt.$selected.trigger('mouseup');
                    return;
                    
                case 32: // space
                case 33: // page up
                case 34: // page down
                    // prevent browser from scrolling down while menu is visible
                    handle.keyStop(e, opt);
                    return;
                    
                case 27: // esc
                    handle.keyStop(e, opt);
                    opt.$menu.trigger('contextmenu:hide');
                    return;
                    
                default: // 0-9, a-z
                    var k = (String.fromCharCode(e.keyCode)).toUpperCase();
                    if (opt.accesskeys[k]) {
                        // according to the specs accesskeys must be invoked immediately
                        opt.accesskeys[k].$node.trigger(opt.accesskeys[k].$menu
                            ? 'contextmenu:focus'
                            : 'mouseup'
                        );
                        return;
                    }
                    break;
            }
            // pass event to selected item, 
            // stop propagation to avoid endless recursion
            e.stopPropagation();
            opt.$selected && opt.$selected.trigger(e);
        },

        // select previous possible command in menu
        prevItem: function(e) {
            e.stopPropagation();
            var opt = $(this).data('contextMenu') || {};

            // obtain currently selected menu
            if (opt.$selected) {
                var $s = opt.$selected;
                opt = opt.$selected.parent().data('contextMenu') || {};
                opt.$selected = $s;
            }
            
            var $children = opt.$menu.children(),
                $prev = !opt.$selected || !opt.$selected.prev().length ? $children.last() : opt.$selected.prev(),
                $round = $prev;
            
            // skip disabled
            while ($prev.hasClass('disabled') || $prev.hasClass('not-selectable')) {
                if ($prev.prev().length) {
                    $prev = $prev.prev();
                } else {
                    $prev = $children.last();
                }
                if ($prev.is($round)) {
                    // break endless loop
                    return;
                }
            }
            
            // leave current
            if (opt.$selected) {
                handle.itemMouseleave.call(opt.$selected.get(0), e);
            }
            
            // activate next
            handle.itemMouseenter.call($prev.get(0), e);
            
            // focus input
            var $input = $prev.find('input, textarea, select');
            if ($input.length) {
                $input.focus();
            }
        },
        // select next possible command in menu
        nextItem: function(e) {
            e.stopPropagation();
            var opt = $(this).data('contextMenu') || {};

            // obtain currently selected menu
            if (opt.$selected) {
                var $s = opt.$selected;
                opt = opt.$selected.parent().data('contextMenu') || {};
                opt.$selected = $s;
            }

            var $children = opt.$menu.children(),
                $next = !opt.$selected || !opt.$selected.next().length ? $children.first() : opt.$selected.next(),
                $round = $next;

            // skip disabled
            while ($next.hasClass('disabled') || $next.hasClass('not-selectable')) {
                if ($next.next().length) {
                    $next = $next.next();
                } else {
                    $next = $children.first();
                }
                if ($next.is($round)) {
                    // break endless loop
                    return;
                }
            }
            
            // leave current
            if (opt.$selected) {
                handle.itemMouseleave.call(opt.$selected.get(0), e);
            }
            
            // activate next
            handle.itemMouseenter.call($next.get(0), e);
            
            // focus input
            var $input = $next.find('input, textarea, select');
            if ($input.length) {
                $input.focus();
            }
        },
        
        // flag that we're inside an input so the key handler can act accordingly
        focusInput: function(e) {
            var $this = $(this).closest('.context-menu-item'),
                data = $this.data(),
                opt = data.contextMenu,
                root = data.contextMenuRoot;

            root.$selected = opt.$selected = $this;
            root.isInput = opt.isInput = true;
        },
        // flag that we're inside an input so the key handler can act accordingly
        blurInput: function(e) {
            var $this = $(this).closest('.context-menu-item'),
                data = $this.data(),
                opt = data.contextMenu,
                root = data.contextMenuRoot;

            root.isInput = opt.isInput = false;
        },
        
        // :hover on menu
        menuMouseenter: function(e) {
            var root = $(this).data().contextMenuRoot;
            root.hovering = true;
        },
        // :hover on menu
        menuMouseleave: function(e) {
            var root = $(this).data().contextMenuRoot;
            if (root.$layer && root.$layer.is(e.relatedTarget)) {
                root.hovering = false;
            }
        },
        
        // :hover done manually so key handling is possible
        itemMouseenter: function(e) {
            var $this = $(this),
                data = $this.data(),
                opt = data.contextMenu,
                root = data.contextMenuRoot;
            
            root.hovering = true;

            // abort if we're re-entering
            if (e && root.$layer && root.$layer.is(e.relatedTarget)) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }

            // make sure only one item is selected
            (opt.$menu ? opt : root).$menu
                .children('.hover').trigger('contextmenu:blur');

            if ($this.hasClass('disabled') || $this.hasClass('not-selectable')) {
                opt.$selected = null;
                return;
            }
            
            $this.trigger('contextmenu:focus');
        },
        // :hover done manually so key handling is possible
        itemMouseleave: function(e) {
            var $this = $(this),
                data = $this.data(),
                opt = data.contextMenu,
                root = data.contextMenuRoot;

            if (root !== opt && root.$layer && root.$layer.is(e.relatedTarget)) {
                root.$selected && root.$selected.trigger('contextmenu:blur');
                e.preventDefault();
                e.stopImmediatePropagation();
                root.$selected = opt.$selected = opt.$node;
                return;
            }
            
            $this.trigger('contextmenu:blur');
        },
        // contextMenu item click
        itemClick: function(e) {
            var $this = $(this),
                data = $this.data(),
                opt = data.contextMenu,
                root = data.contextMenuRoot,
                key = data.contextMenuKey,
                callback;

            // abort if the key is unknown or disabled or is a menu
            if (!opt.items[key] || $this.hasClass('disabled') || $this.hasClass('context-menu-submenu')) {
                return;
            }

            e.preventDefault();
            e.stopImmediatePropagation();

            if ($.isFunction(root.callbacks[key])) {
                // item-specific callback
                callback = root.callbacks[key];
            } else if ($.isFunction(root.callback)) {
                // default callback
                callback = root.callback;                
            } else {
                // no callback, no action
                return;
            }

            // hide menu if callback doesn't stop that
            if (callback.call(root.$trigger, key, root) !== false) {
                root.$menu.trigger('contextmenu:hide');
            } else if (root.$menu.parent().length) {
                op.update.call(root.$trigger, root);
            }
        },
        // ignore click events on input elements
        inputClick: function(e) {
            e.stopImmediatePropagation();
        },
        
        // hide <menu>
        hideMenu: function(e, data) {
            var root = $(this).data('contextMenuRoot');
            op.hide.call(root.$trigger, root, data && data.force);
        },
        // focus <command>
        focusItem: function(e) {
            e.stopPropagation();
            var $this = $(this),
                data = $this.data(),
                opt = data.contextMenu,
                root = data.contextMenuRoot;

            $this.addClass('hover')
                .siblings('.hover').trigger('contextmenu:blur');
            
            // remember selected
            opt.$selected = root.$selected = $this;
            
            // position sub-menu - do after show so dumb $.ui.position can keep up
            if (opt.$node) {
                root.positionSubmenu.call(opt.$node, opt.$menu);
            }
        },
        // blur <command>
        blurItem: function(e) {
            e.stopPropagation();
            var $this = $(this),
                data = $this.data(),
                opt = data.contextMenu,
                root = data.contextMenuRoot;
            
            $this.removeClass('hover');
            opt.$selected = null;
        }
    },
    // operations
    op = {
        show: function(opt, x, y) {
            var $this = $(this),
                offset,
                css = {};

            // hide any open menus
            $('#context-menu-layer').trigger('mousedown');

            // backreference for callbacks
            opt.$trigger = $this;

            // show event
            if (opt.events.show.call($this, opt) === false) {
                $currentTrigger = null;
                return;
            }

            // create or update context menu
            op.update.call($this, opt);
            
            // position menu
            opt.position.call($this, opt, x, y);

            // make sure we're in front
            if (opt.zIndex) {
                css.zIndex = zindex($this) + opt.zIndex;
            }
            
            // add layer
            op.layer.call(opt.$menu, opt, css.zIndex);
            
            // adjust sub-menu zIndexes
            opt.$menu.find('ul').css('zIndex', css.zIndex + 1);
            
            // position and show context menu
            opt.$menu.css( css )[opt.animation.show](opt.animation.duration);
            // make options available
            $this.data('contextMenu', opt);
            // register key handler
            $(document).off('keydown.contextMenu').on('keydown.contextMenu', handle.key);
            // register autoHide handler
            if (opt.autoHide) {
                // trigger element coordinates
                var pos = $this.position();
                pos.right = pos.left + $this.outerWidth();
                pos.bottom = pos.top + this.outerHeight();
                // mouse position handler
                $(document).on('mousemove.contextMenuAutoHide', function(e) {
                    if (opt.$layer && !opt.hovering && (!(e.pageX >= pos.left && e.pageX <= pos.right) || !(e.pageY >= pos.top && e.pageY <= pos.bottom))) {
                        // if mouse in menu...
                        opt.$menu.trigger('contextmenu:hide');
                    }
                });
            }
        },
        hide: function(opt, force) {
            var $this = $(this);
            if (!opt) {
                opt = $this.data('contextMenu') || {};
            }
            
            // hide event
            if (!force && opt.events && opt.events.hide.call($this, opt) === false) {
                return;
            }
            
            if (opt.$layer) {
                // keep layer for a bit so the contextmenu event can be aborted properly by opera
                setTimeout((function($layer){ return function(){
                        $layer.remove();
                    };
                })(opt.$layer), 10);
                
                try {
                    delete opt.$layer;
                } catch(e) {
                    opt.$layer = null;
                }
            }
            
            // remove handle
            $currentTrigger = null;
            // remove selected
            opt.$menu.find('.hover').trigger('contextmenu:blur');
            opt.$selected = null;
            // unregister key and mouse handlers
            //$(document).off('.contextMenuAutoHide keydown.contextMenu'); // http://bugs.jquery.com/ticket/10705
            $(document).off('.contextMenuAutoHide').off('keydown.contextMenu');
            // hide menu
            opt.$menu && opt.$menu[opt.animation.hide](opt.animation.duration, function (){
                // tear down dynamically built menu after animation is completed.
                if (opt.build) {
                    opt.$menu.remove();
                    $.each(opt, function(key, value) {
                        switch (key) {
                            case 'ns':
                            case 'selector':
                            case 'build':
                            case 'trigger':
                                return true;

                            default:
                                opt[key] = undefined;
                                try {
                                    delete opt[key];
                                } catch (e) {}
                                return true;
                        }
                    });
                }
            });
        },
        create: function(opt, root) {
            if (root === undefined) {
                root = opt;
            }
            // create contextMenu
            opt.$menu = $('<ul class="context-menu-list ' + (opt.className || "") + '"></ul>').data({
                'contextMenu': opt,
                'contextMenuRoot': root
            });
            
            $.each(['callbacks', 'commands', 'inputs'], function(i,k){
                opt[k] = {};
                if (!root[k]) {
                    root[k] = {};
                }
            });
            
            root.accesskeys || (root.accesskeys = {});
            
            // create contextMenu items
            $.each(opt.items, function(key, item){
                var $t = $('<li class="context-menu-item ' + (item.className || "") +'"></li>'),
                    $label = null,
                    $input = null;
                
                item.$node = $t.data({
                    'contextMenu': opt,
                    'contextMenuRoot': root,
                    'contextMenuKey': key
                });
                
                // register accesskey
                // NOTE: the accesskey attribute should be applicable to any element, but Safari5 and Chrome13 still can't do that
                if (item.accesskey) {
                    var aks = splitAccesskey(item.accesskey);
                    for (var i=0, ak; ak = aks[i]; i++) {
                        if (!root.accesskeys[ak]) {
                            root.accesskeys[ak] = item;
                            item._name = item.name.replace(new RegExp('(' + ak + ')', 'i'), '<span class="context-menu-accesskey">$1</span>');
                            break;
                        }
                    }
                }
                
                if (typeof item == "string") {
                    $t.addClass('context-menu-separator not-selectable');
                } else if (item.type && types[item.type]) {
                    // run custom type handler
                    types[item.type].call($t, item, opt, root);
                    // register commands
                    $.each([opt, root], function(i,k){
                        k.commands[key] = item;
                        if ($.isFunction(item.callback)) {
                            k.callbacks[key] = item.callback;
                        }
                    });
                } else {
                    // add label for input
                    if (item.type == 'html') {
                        $t.addClass('context-menu-html not-selectable');
                    } else if (item.type) {
                        $label = $('<label></label>').appendTo($t);
                        $('<span></span>').html(item._name || item.name).appendTo($label);
                        $t.addClass('context-menu-input');
                        opt.hasTypes = true;
                        $.each([opt, root], function(i,k){
                            k.commands[key] = item;
                            k.inputs[key] = item;
                        });
                    } else if (item.items) {
                        item.type = 'sub';
                    }
                
                    switch (item.type) {
                        case 'text':
                            $input = $('<input type="text" value="1" name="context-menu-input-'+ key +'" value="">')
                                .val(item.value || "").appendTo($label);
                            break;
                    
                        case 'textarea':
                            $input = $('<textarea name="context-menu-input-'+ key +'"></textarea>')
                                .val(item.value || "").appendTo($label);

                            if (item.height) {
                                $input.height(item.height);
                            }
                            break;

                        case 'checkbox':
                            $input = $('<input type="checkbox" value="1" name="context-menu-input-'+ key +'" value="">')
                                .val(item.value || "").prop("checked", !!item.selected).prependTo($label);
                            break;

                        case 'radio':
                            $input = $('<input type="radio" value="1" name="context-menu-input-'+ item.radio +'" value="">')
                                .val(item.value || "").prop("checked", !!item.selected).prependTo($label);
                            break;
                    
                        case 'select':
                            $input = $('<select name="context-menu-input-'+ key +'">').appendTo($label);
                            if (item.options) {
                                $.each(item.options, function(value, text) {
                                    $('<option></option>').val(value).text(text).appendTo($input);
                                });
                                $input.val(item.selected);
                            }
                            break;
                        
                        case 'sub':
                            $('<span></span>').html(item._name || item.name).appendTo($t);
                            item.appendTo = item.$node;
                            op.create(item, root);
                            $t.data('contextMenu', item).addClass('context-menu-submenu');
                            item.callback = null;
                            break;
                        
                        case 'html':
                            $(item.html).appendTo($t);
                            break;
                        
                        default:
                            $.each([opt, root], function(i,k){
                                k.commands[key] = item;
                                if ($.isFunction(item.callback)) {
                                    k.callbacks[key] = item.callback;
                                }
                            });
                            
                            $('<span></span>').html(item._name || item.name || "").appendTo($t);
                            break;
                    }
                    
                    // disable key listener in <input>
                    if (item.type && item.type != 'sub' && item.type != 'html') {
                        $input
                            .on('focus', handle.focusInput)
                            .on('blur', handle.blurInput);
                        
                        if (item.events) {
                            $input.on(item.events, opt);
                        }
                    }
                
                    // add icons
                    if (item.icon) {
                        $t.addClass("icon icon-" + item.icon);
                    }
                }
                
                // cache contained elements
                item.$input = $input;
                item.$label = $label;

                // attach item to menu
                $t.appendTo(opt.$menu);
                
                // Disable text selection
                if (!opt.hasTypes && $.support.eventSelectstart) {
                    // browsers support user-select: none, 
                    // IE has a special event for text-selection
                    // browsers supporting neither will not be preventing text-selection
                    $t.on('selectstart.disableTextSelect', handle.abortevent);
                }
            });
            // attach contextMenu to <body> (to bypass any possible overflow:hidden issues on parents of the trigger element)
            if (!opt.$node) {
                opt.$menu.css('display', 'none').addClass('context-menu-root');
            }
            opt.$menu.appendTo(opt.appendTo || document.body);
        },
        update: function(opt, root) {
            var $this = this;
            if (root === undefined) {
                root = opt;
                // determine widths of submenus, as CSS won't grow them automatically
                // position:absolute > position:absolute; min-width:100; max-width:200; results in width: 100;
                // kinda sucks hard...
                opt.$menu.find('ul').andSelf().css({position: 'static', display: 'block'}).each(function(){
                    var $this = $(this);
                    $this.width($this.css('position', 'absolute').width())
                        .css('position', 'static');
                }).css({position: '', display: ''});
            }
            // re-check disabled for each item
            opt.$menu.children().each(function(){
                var $item = $(this),
                    key = $item.data('contextMenuKey'),
                    item = opt.items[key],
                    disabled = ($.isFunction(item.disabled) && item.disabled.call($this, key, root)) || item.disabled === true;

                // dis- / enable item
                $item[disabled ? 'addClass' : 'removeClass']('disabled');
                
                if (item.type) {
                    // dis- / enable input elements
                    $item.find('input, select, textarea').prop('disabled', disabled);
                    
                    // update input states
                    switch (item.type) {
                        case 'text':
                        case 'textarea':
                            item.$input.val(item.value || "");
                            break;
                            
                        case 'checkbox':
                        case 'radio':
                            item.$input.val(item.value || "").prop('checked', !!item.selected);
                            break;
                            
                        case 'select':
                            item.$input.val(item.selected || "");
                            break;
                    }
                }
                
                if (item.$menu) {
                    // update sub-menu
                    op.update.call($this, item, root);
                }
            });
        },
        layer: function(opt, zIndex) {
            // add transparent layer for click area
            // filter and background for Internet Explorer, Issue #23
            var $layer = opt.$layer = $('<div id="context-menu-layer" style="position:fixed; z-index:' + zIndex + '; top:0; left:0; opacity: 0; filter: alpha(opacity=0); background-color: #000;"></div>')
                .css({height: $win.height(), width: $win.width(), display: 'block'})
                .data('contextMenuRoot', opt)
                .insertBefore(this)
                .on('contextmenu', handle.abortevent)
                .on('mousedown', handle.layerClick);
            
            // IE6 doesn't know position:fixed;
            if (!$.support.fixedPosition) {
                $layer.css({
                    'position' : 'absolute',
                    'height' : $(document).height()
                });
            }
            
            return $layer;
        }
    };

// split accesskey according to http://www.whatwg.org/specs/web-apps/current-work/multipage/editing.html#assigned-access-key
function splitAccesskey(val) {
    var t = val.split(/\s+/),
        keys = [];
        
    for (var i=0, k; k = t[i]; i++) {
        k = k[0].toUpperCase(); // first character only
        // theoretically non-accessible characters should be ignored, but different systems, different keyboard layouts, ... screw it.
        // a map to look up already used access keys would be nice
        keys.push(k);
    }
    
    return keys;
}

// handle contextMenu triggers
$.fn.contextMenu = function(operation) {
    if (operation === undefined) {
        this.first().trigger('contextmenu');
    } else if (operation.x && operation.y) {
        this.first().trigger($.Event("contextmenu", {pageX: operation.x, pageY: operation.y}));
    } else if (operation === "hide") {
        var $menu = this.data('contextMenu').$menu;
        $menu && $menu.trigger('contextmenu:hide');
    } else if (operation) {
        this.removeClass('context-menu-disabled');
    } else if (!operation) {
        this.addClass('context-menu-disabled');
    }
    
    return this;
};

// manage contextMenu instances
$.contextMenu = function(operation, options) {
    if (typeof operation != 'string') {
        options = operation;
        operation = 'create';
    }
    
    if (typeof options == 'string') {
        options = {selector: options};
    } else if (options === undefined) {
        options = {};
    }
    
    // merge with default options
    var o = $.extend(true, {}, defaults, options || {}),
        $document = $(document);
    
    switch (operation) {
        case 'create':
            // no selector no joy
            if (!o.selector) {
                throw new Error('No selector specified');
            }
            // make sure internal classes are not bound to
            if (o.selector.match(/.context-menu-(list|item|input)($|\s)/)) {
                throw new Error('Cannot bind to selector "' + o.selector + '" as it contains a reserved className');
            }
            if (!o.build && (!o.items || $.isEmptyObject(o.items))) {
                throw new Error('No Items sepcified');
            }
            counter ++;
            o.ns = '.contextMenu' + counter;
            namespaces[o.selector] = o.ns;
            menus[o.ns] = o;
            
            // default to right click
            if (!o.trigger) {
                o.trigger = 'right';
            }
            
            if (!initialized) {
                // make sure item click is registered first
                $document
                    .on({
                        'contextmenu:hide.contextMenu': handle.hideMenu,
                        'prevcommand.contextMenu': handle.prevItem,
                        'nextcommand.contextMenu': handle.nextItem,
                        'contextmenu.contextMenu': handle.abortevent,
                        'mouseenter.contextMenu': handle.menuMouseenter,
                        'mouseleave.contextMenu': handle.menuMouseleave
                    }, '.context-menu-list')
                    .on('mouseup.contextMenu', '.context-menu-input', handle.inputClick)
                    .on({
                        'mouseup.contextMenu': handle.itemClick,
                        'contextmenu:focus.contextMenu': handle.focusItem,
                        'contextmenu:blur.contextMenu': handle.blurItem,
                        'contextmenu.contextMenu': handle.abortevent,
                        'mouseenter.contextMenu': handle.itemMouseenter,
                        'mouseleave.contextMenu': handle.itemMouseleave
                    }, '.context-menu-item');

                initialized = true;
            }
            
            // engage native contextmenu event
            $document
                .on('contextmenu' + o.ns, o.selector, o, handle.contextmenu);
            
            switch (o.trigger) {
                case 'hover':
                        $document
                            .on('mouseenter' + o.ns, o.selector, o, handle.mouseenter)
                            .on('mouseleave' + o.ns, o.selector, o, handle.mouseleave);                    
                    break;
                    
                case 'left':
                        $document.on('click' + o.ns, o.selector, o, handle.click);
                    break;
                /*
                default:
                    // http://www.quirksmode.org/dom/events/contextmenu.html
                    $document
                        .on('mousedown' + o.ns, o.selector, o, handle.mousedown)
                        .on('mouseup' + o.ns, o.selector, o, handle.mouseup);
                    break;
                */
            }
            
            // create menu
            if (!o.build) {
                op.create(o);
            }
            break;
        
        case 'destroy':
            if (!o.selector) {
                $document.off('.contextMenu .contextMenuAutoHide');
                $.each(namespaces, function(key, value) {
                    $document.off(value);
                });
                
                namespaces = {};
                menus = {};
                counter = 0;
                initialized = false;
                
                $('#context-menu-layer, .context-menu-list').remove();
            } else if (namespaces[o.selector]) {
                var $visibleMenu = $('.context-menu-list').filter(':visible');
                if ($visibleMenu.length && $visibleMenu.data().contextMenuRoot.$trigger.is(o.selector)) {
                    $visibleMenu.trigger('contextmenu:hide', {force: true});
                }
                
                try {
                    if (menus[namespaces[o.selector]].$menu) {
                        menus[namespaces[o.selector]].$menu.remove();
                    }
                    
                    delete menus[namespaces[o.selector]];
                } catch(e) {
                    menus[namespaces[o.selector]] = null;
                }
                
                $document.off(namespaces[o.selector]);
            }
            break;
        
        case 'html5':
            // if <command> or <menuitem> are not handled by the browser,
            // or options was a bool true,
            // initialize $.contextMenu for them
            if ((!$.support.htmlCommand && !$.support.htmlMenuitem) || (typeof options == "boolean" && options)) {
                $('menu[type="context"]').each(function() {
                    if (this.id) {
                        $.contextMenu({
                            selector: '[contextmenu=' + this.id +']',
                            items: $.contextMenu.fromMenu(this)
                        });
                    }
                }).css('display', 'none');
            }
            break;
        
        default:
            throw new Error('Unknown operation "' + operation + '"');
    }
    
    return this;
};

// import values into <input> commands
$.contextMenu.setInputValues = function(opt, data) {
    if (data === undefined) {
        data = {};
    }
    
    $.each(opt.inputs, function(key, item) {
        switch (item.type) {
            case 'text':
            case 'textarea':
                item.value = data[key] || "";
                break;

            case 'checkbox':
                item.selected = data[key] ? true : false;
                break;
                
            case 'radio':
                item.selected = (data[item.radio] || "") == item.value ? true : false;
                break;
            
            case 'select':
                item.selected = data[key] || "";
                break;
        }
    });
};

// export values from <input> commands
$.contextMenu.getInputValues = function(opt, data) {
    if (data === undefined) {
        data = {};
    }
    
    $.each(opt.inputs, function(key, item) {
        switch (item.type) {
            case 'text':
            case 'textarea':
            case 'select':
                data[key] = item.$input.val();
                break;

            case 'checkbox':
                data[key] = item.$input.prop('checked');
                break;
                
            case 'radio':
                if (item.$input.prop('checked')) {
                    data[item.radio] = item.value;
                }
                break;
        }
    });
    
    return data;
};

// find <label for="xyz">
function inputLabel(node) {
    return (node.id && $('label[for="'+ node.id +'"]').val()) || node.name;
}

// convert <menu> to items object
function menuChildren(items, $children, counter) {
    if (!counter) {
        counter = 0;
    }
    
    $children.each(function() {
        var $node = $(this),
            node = this,
            nodeName = this.nodeName.toLowerCase(),
            label,
            item;
        
        // extract <label><input>
        if (nodeName == 'label' && $node.find('input, textarea, select').length) {
            label = $node.text();
            $node = $node.children().first();
            node = $node.get(0);
            nodeName = node.nodeName.toLowerCase();
        }
        
        /*
         * <menu> accepts flow-content as children. that means <embed>, <canvas> and such are valid menu items.
         * Not being the sadistic kind, $.contextMenu only accepts:
         * <command>, <menuitem>, <hr>, <span>, <p> <input [text, radio, checkbox]>, <textarea>, <select> and of course <menu>.
         * Everything else will be imported as an html node, which is not interfaced with contextMenu.
         */
        
        // http://www.whatwg.org/specs/web-apps/current-work/multipage/commands.html#concept-command
        switch (nodeName) {
            // http://www.whatwg.org/specs/web-apps/current-work/multipage/interactive-elements.html#the-menu-element
            case 'menu':
                item = {name: $node.attr('label'), items: {}};
                counter = menuChildren(item.items, $node.children(), counter);
                break;
            
            // http://www.whatwg.org/specs/web-apps/current-work/multipage/commands.html#using-the-a-element-to-define-a-command
            case 'a':
            // http://www.whatwg.org/specs/web-apps/current-work/multipage/commands.html#using-the-button-element-to-define-a-command
            case 'button':
                item = {
                    name: $node.text(),
                    disabled: !!$node.attr('disabled'),
                    callback: (function(){ return function(){ $node.click(); }; })()
                };
                break;
            
            // http://www.whatwg.org/specs/web-apps/current-work/multipage/commands.html#using-the-command-element-to-define-a-command

            case 'menuitem':
            case 'command':
                switch ($node.attr('type')) {
                    case undefined:
                    case 'command':
                    case 'menuitem':
                        item = {
                            name: $node.attr('label'),
                            disabled: !!$node.attr('disabled'),
                            callback: (function(){ return function(){ $node.click(); }; })()
                        };
                        break;
                        
                    case 'checkbox':
                        item = {
                            type: 'checkbox',
                            disabled: !!$node.attr('disabled'),
                            name: $node.attr('label'),
                            selected: !!$node.attr('checked')
                        };
                        break;
                        
                    case 'radio':
                        item = {
                            type: 'radio',
                            disabled: !!$node.attr('disabled'),
                            name: $node.attr('label'),
                            radio: $node.attr('radiogroup'),
                            value: $node.attr('id'),
                            selected: !!$node.attr('checked')
                        };
                        break;
                        
                    default:
                        item = undefined;
                }
                break;
 
            case 'hr':
                item = '-------';
                break;
                
            case 'input':
                switch ($node.attr('type')) {
                    case 'text':
                        item = {
                            type: 'text',
                            name: label || inputLabel(node),
                            disabled: !!$node.attr('disabled'),
                            value: $node.val()
                        };
                        break;
                        
                    case 'checkbox':
                        item = {
                            type: 'checkbox',
                            name: label || inputLabel(node),
                            disabled: !!$node.attr('disabled'),
                            selected: !!$node.attr('checked')
                        };
                        break;
                        
                    case 'radio':
                        item = {
                            type: 'radio',
                            name: label || inputLabel(node),
                            disabled: !!$node.attr('disabled'),
                            radio: !!$node.attr('name'),
                            value: $node.val(),
                            selected: !!$node.attr('checked')
                        };
                        break;
                    
                    default:
                        item = undefined;
                        break;
                }
                break;
                
            case 'select':
                item = {
                    type: 'select',
                    name: label || inputLabel(node),
                    disabled: !!$node.attr('disabled'),
                    selected: $node.val(),
                    options: {}
                };
                $node.children().each(function(){
                    item.options[this.value] = $(this).text();
                });
                break;
                
            case 'textarea':
                item = {
                    type: 'textarea',
                    name: label || inputLabel(node),
                    disabled: !!$node.attr('disabled'),
                    value: $node.val()
                };
                break;
            
            case 'label':
                break;
            
            default:
                item = {type: 'html', html: $node.clone(true)};
                break;
        }
        
        if (item) {
            counter++;
            items['key' + counter] = item;
        }
    });
    
    return counter;
}

// convert html5 menu
$.contextMenu.fromMenu = function(element) {
    var $this = $(element),
        items = {};
        
    menuChildren(items, $this.children());
    
    return items;
};

// make defaults accessible
$.contextMenu.defaults = defaults;
$.contextMenu.types = types;

})(jQuery);

/*!
 * jQuery UI Position 1.9.0-RC1
 * http://jqueryui.com
 *
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Position
 */
(function( $, undefined ) {

$.ui = $.ui || {};

var cachedScrollbarWidth,
	max = Math.max,
	abs = Math.abs,
	round = Math.round,
	rhorizontal = /left|center|right/,
	rvertical = /top|center|bottom/,
	roffset = /[\+\-]\d+%?/,
	rposition = /^\w+/,
	rpercent = /%$/,
	_position = $.fn.position;

function getOffsets( offsets, width, height ) {
	return [
		parseInt( offsets[ 0 ], 10 ) * ( rpercent.test( offsets[ 0 ] ) ? width / 100 : 1 ),
		parseInt( offsets[ 1 ], 10 ) * ( rpercent.test( offsets[ 1 ] ) ? height / 100 : 1 )
	];
}
function parseCss( element, property ) {
	return parseInt( $.css( element, property ), 10 ) || 0;
}

$.position = {
	scrollbarWidth: function() {
		if ( cachedScrollbarWidth !== undefined ) {
			return cachedScrollbarWidth;
		}
		var w1, w2,
			div = $( "<div style='display:block;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>" ),
			innerDiv = div.children()[0];

		$( "body" ).append( div );
		w1 = innerDiv.offsetWidth;
		div.css( "overflow", "scroll" );

		w2 = innerDiv.offsetWidth;

		if ( w1 === w2 ) {
			w2 = div[0].clientWidth;
		}

		div.remove();

		return (cachedScrollbarWidth = w1 - w2);
	},
	getScrollInfo: function( within ) {
		var overflowX = within.isWindow ? "" : within.element.css( "overflow-x" ),
			overflowY = within.isWindow ? "" : within.element.css( "overflow-y" ),
			hasOverflowX = overflowX === "scroll" ||
				( overflowX === "auto" && within.width < within.element[0].scrollWidth ),
			hasOverflowY = overflowY === "scroll" ||
				( overflowY === "auto" && within.height < within.element[0].scrollHeight );
		return {
			width: hasOverflowX ? $.position.scrollbarWidth() : 0,
			height: hasOverflowY ? $.position.scrollbarWidth() : 0
		};
	},
	getWithinInfo: function( element ) {
		var withinElement = $( element || window ),
			isWindow = $.isWindow( withinElement[0] );
		return {
			element: withinElement,
			isWindow: isWindow,
			offset: withinElement.offset() || { left: 0, top: 0 },
			scrollLeft: withinElement.scrollLeft(),
			scrollTop: withinElement.scrollTop(),
			width: isWindow ? withinElement.width() : withinElement.outerWidth(),
			height: isWindow ? withinElement.height() : withinElement.outerHeight()
		};
	}
};

$.fn.position = function( options ) {
	if ( !options || !options.of ) {
		return _position.apply( this, arguments );
	}

	// make a copy, we don't want to modify arguments
	options = $.extend( {}, options );

	var atOffset, targetWidth, targetHeight, targetOffset, basePosition,
		target = $( options.of ),
		within = $.position.getWithinInfo( options.within ),
		scrollInfo = $.position.getScrollInfo( within ),
		targetElem = target[0],
		collision = ( options.collision || "flip" ).split( " " ),
		offsets = {};

	if ( targetElem.nodeType === 9 ) {
		targetWidth = target.width();
		targetHeight = target.height();
		targetOffset = { top: 0, left: 0 };
	} else if ( $.isWindow( targetElem ) ) {
		targetWidth = target.width();
		targetHeight = target.height();
		targetOffset = { top: target.scrollTop(), left: target.scrollLeft() };
	} else if ( targetElem.preventDefault ) {
		// force left top to allow flipping
		options.at = "left top";
		targetWidth = targetHeight = 0;
		targetOffset = { top: targetElem.pageY, left: targetElem.pageX };
	} else {
		targetWidth = target.outerWidth();
		targetHeight = target.outerHeight();
		targetOffset = target.offset();
	}
	// clone to reuse original targetOffset later
	basePosition = $.extend( {}, targetOffset );

	// force my and at to have valid horizontal and vertical positions
	// if a value is missing or invalid, it will be converted to center
	$.each( [ "my", "at" ], function() {
		var pos = ( options[ this ] || "" ).split( " " ),
			horizontalOffset,
			verticalOffset;

		if ( pos.length === 1) {
			pos = rhorizontal.test( pos[ 0 ] ) ?
				pos.concat( [ "center" ] ) :
				rvertical.test( pos[ 0 ] ) ?
					[ "center" ].concat( pos ) :
					[ "center", "center" ];
		}
		pos[ 0 ] = rhorizontal.test( pos[ 0 ] ) ? pos[ 0 ] : "center";
		pos[ 1 ] = rvertical.test( pos[ 1 ] ) ? pos[ 1 ] : "center";

		// calculate offsets
		horizontalOffset = roffset.exec( pos[ 0 ] );
		verticalOffset = roffset.exec( pos[ 1 ] );
		offsets[ this ] = [
			horizontalOffset ? horizontalOffset[ 0 ] : 0,
			verticalOffset ? verticalOffset[ 0 ] : 0
		];

		// reduce to just the positions without the offsets
		options[ this ] = [
			rposition.exec( pos[ 0 ] )[ 0 ],
			rposition.exec( pos[ 1 ] )[ 0 ]
		];
	});

	// normalize collision option
	if ( collision.length === 1 ) {
		collision[ 1 ] = collision[ 0 ];
	}

	if ( options.at[ 0 ] === "right" ) {
		basePosition.left += targetWidth;
	} else if ( options.at[ 0 ] === "center" ) {
		basePosition.left += targetWidth / 2;
	}

	if ( options.at[ 1 ] === "bottom" ) {
		basePosition.top += targetHeight;
	} else if ( options.at[ 1 ] === "center" ) {
		basePosition.top += targetHeight / 2;
	}

	atOffset = getOffsets( offsets.at, targetWidth, targetHeight );
	basePosition.left += atOffset[ 0 ];
	basePosition.top += atOffset[ 1 ];

	return this.each(function() {
		var collisionPosition, using,
			elem = $( this ),
			elemWidth = elem.outerWidth(),
			elemHeight = elem.outerHeight(),
			marginLeft = parseCss( this, "marginLeft" ),
			marginTop = parseCss( this, "marginTop" ),
			collisionWidth = elemWidth + marginLeft + parseCss( this, "marginRight" ) + scrollInfo.width,
			collisionHeight = elemHeight + marginTop + parseCss( this, "marginBottom" ) + scrollInfo.height,
			position = $.extend( {}, basePosition ),
			myOffset = getOffsets( offsets.my, elem.outerWidth(), elem.outerHeight() );

		if ( options.my[ 0 ] === "right" ) {
			position.left -= elemWidth;
		} else if ( options.my[ 0 ] === "center" ) {
			position.left -= elemWidth / 2;
		}

		if ( options.my[ 1 ] === "bottom" ) {
			position.top -= elemHeight;
		} else if ( options.my[ 1 ] === "center" ) {
			position.top -= elemHeight / 2;
		}

		position.left += myOffset[ 0 ];
		position.top += myOffset[ 1 ];

		// if the browser doesn't support fractions, then round for consistent results
		if ( !$.support.offsetFractions ) {
			position.left = round( position.left );
			position.top = round( position.top );
		}

		collisionPosition = {
			marginLeft: marginLeft,
			marginTop: marginTop
		};

		$.each( [ "left", "top" ], function( i, dir ) {
			if ( $.ui.position[ collision[ i ] ] ) {
				$.ui.position[ collision[ i ] ][ dir ]( position, {
					targetWidth: targetWidth,
					targetHeight: targetHeight,
					elemWidth: elemWidth,
					elemHeight: elemHeight,
					collisionPosition: collisionPosition,
					collisionWidth: collisionWidth,
					collisionHeight: collisionHeight,
					offset: [ atOffset[ 0 ] + myOffset[ 0 ], atOffset [ 1 ] + myOffset[ 1 ] ],
					my: options.my,
					at: options.at,
					within: within,
					elem : elem
				});
			}
		});

		if ( $.fn.bgiframe ) {
			elem.bgiframe();
		}

		if ( options.using ) {
			// adds feedback as second argument to using callback, if present
			using = function( props ) {
				var left = targetOffset.left - position.left,
					right = left + targetWidth - elemWidth,
					top = targetOffset.top - position.top,
					bottom = top + targetHeight - elemHeight,
					feedback = {
						target: {
							element: target,
							left: targetOffset.left,
							top: targetOffset.top,
							width: targetWidth,
							height: targetHeight
						},
						element: {
							element: elem,
							left: position.left,
							top: position.top,
							width: elemWidth,
							height: elemHeight
						},
						horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
						vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
					};
				if ( targetWidth < elemWidth && abs( left + right ) < targetWidth ) {
					feedback.horizontal = "center";
				}
				if ( targetHeight < elemHeight && abs( top + bottom ) < targetHeight ) {
					feedback.vertical = "middle";
				}
				if ( max( abs( left ), abs( right ) ) > max( abs( top ), abs( bottom ) ) ) {
					feedback.important = "horizontal";
				} else {
					feedback.important = "vertical";
				}
				options.using.call( this, props, feedback );
			};
		}

		elem.offset( $.extend( position, { using: using } ) );
	});
};

$.ui.position = {
	fit: {
		left: function( position, data ) {
			var within = data.within,
				withinOffset = within.isWindow ? within.scrollLeft : within.offset.left,
				outerWidth = within.width,
				collisionPosLeft = position.left - data.collisionPosition.marginLeft,
				overLeft = withinOffset - collisionPosLeft,
				overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset,
				newOverRight;

			// element is wider than within
			if ( data.collisionWidth > outerWidth ) {
				// element is initially over the left side of within
				if ( overLeft > 0 && overRight <= 0 ) {
					newOverRight = position.left + overLeft + data.collisionWidth - outerWidth - withinOffset;
					position.left += overLeft - newOverRight;
				// element is initially over right side of within
				} else if ( overRight > 0 && overLeft <= 0 ) {
					position.left = withinOffset;
				// element is initially over both left and right sides of within
				} else {
					if ( overLeft > overRight ) {
						position.left = withinOffset + outerWidth - data.collisionWidth;
					} else {
						position.left = withinOffset;
					}
				}
			// too far left -> align with left edge
			} else if ( overLeft > 0 ) {
				position.left += overLeft;
			// too far right -> align with right edge
			} else if ( overRight > 0 ) {
				position.left -= overRight;
			// adjust based on position and margin
			} else {
				position.left = max( position.left - collisionPosLeft, position.left );
			}
		},
		top: function( position, data ) {
			var within = data.within,
				withinOffset = within.isWindow ? within.scrollTop : within.offset.top,
				outerHeight = data.within.height,
				collisionPosTop = position.top - data.collisionPosition.marginTop,
				overTop = withinOffset - collisionPosTop,
				overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset,
				newOverBottom;

			// element is taller than within
			if ( data.collisionHeight > outerHeight ) {
				// element is initially over the top of within
				if ( overTop > 0 && overBottom <= 0 ) {
					newOverBottom = position.top + overTop + data.collisionHeight - outerHeight - withinOffset;
					position.top += overTop - newOverBottom;
				// element is initially over bottom of within
				} else if ( overBottom > 0 && overTop <= 0 ) {
					position.top = withinOffset;
				// element is initially over both top and bottom of within
				} else {
					if ( overTop > overBottom ) {
						position.top = withinOffset + outerHeight - data.collisionHeight;
					} else {
						position.top = withinOffset;
					}
				}
			// too far up -> align with top
			} else if ( overTop > 0 ) {
				position.top += overTop;
			// too far down -> align with bottom edge
			} else if ( overBottom > 0 ) {
				position.top -= overBottom;
			// adjust based on position and margin
			} else {
				position.top = max( position.top - collisionPosTop, position.top );
			}
		}
	},
	flip: {
		left: function( position, data ) {
			var within = data.within,
				withinOffset = within.offset.left + within.scrollLeft,
				outerWidth = within.width,
				offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
				collisionPosLeft = position.left - data.collisionPosition.marginLeft,
				overLeft = collisionPosLeft - offsetLeft,
				overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
				myOffset = data.my[ 0 ] === "left" ?
					-data.elemWidth :
					data.my[ 0 ] === "right" ?
						data.elemWidth :
						0,
				atOffset = data.at[ 0 ] === "left" ?
					data.targetWidth :
					data.at[ 0 ] === "right" ?
						-data.targetWidth :
						0,
				offset = -2 * data.offset[ 0 ],
				newOverRight,
				newOverLeft;

			if ( overLeft < 0 ) {
				newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth - outerWidth - withinOffset;
				if ( newOverRight < 0 || newOverRight < abs( overLeft ) ) {
					position.left += myOffset + atOffset + offset;
				}
			}
			else if ( overRight > 0 ) {
				newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset + atOffset + offset - offsetLeft;
				if ( newOverLeft > 0 || abs( newOverLeft ) < overRight ) {
					position.left += myOffset + atOffset + offset;
				}
			}
		},
		top: function( position, data ) {
			var within = data.within,
				withinOffset = within.offset.top + within.scrollTop,
				outerHeight = within.height,
				offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
				collisionPosTop = position.top - data.collisionPosition.marginTop,
				overTop = collisionPosTop - offsetTop,
				overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
				top = data.my[ 1 ] === "top",
				myOffset = top ?
					-data.elemHeight :
					data.my[ 1 ] === "bottom" ?
						data.elemHeight :
						0,
				atOffset = data.at[ 1 ] === "top" ?
					data.targetHeight :
					data.at[ 1 ] === "bottom" ?
						-data.targetHeight :
						0,
				offset = -2 * data.offset[ 1 ],
				newOverTop,
				newOverBottom;
			if ( overTop < 0 ) {
				newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight - outerHeight - withinOffset;
				if ( ( position.top + myOffset + atOffset + offset) > overTop && ( newOverBottom < 0 || newOverBottom < abs( overTop ) ) ) {
					position.top += myOffset + atOffset + offset;
				}
			}
			else if ( overBottom > 0 ) {
				newOverTop = position.top -  data.collisionPosition.marginTop + myOffset + atOffset + offset - offsetTop;
				if ( ( position.top + myOffset + atOffset + offset) > overBottom && ( newOverTop > 0 || abs( newOverTop ) < overBottom ) ) {
					position.top += myOffset + atOffset + offset;
				}
			}
		}
	},
	flipfit: {
		left: function() {
			$.ui.position.flip.left.apply( this, arguments );
			$.ui.position.fit.left.apply( this, arguments );
		},
		top: function() {
			$.ui.position.flip.top.apply( this, arguments );
			$.ui.position.fit.top.apply( this, arguments );
		}
	}
};

// fraction support test
(function () {
	var testElement, testElementParent, testElementStyle, offsetLeft, i,
		body = document.getElementsByTagName( "body" )[ 0 ],
		div = document.createElement( "div" );

	//Create a "fake body" for testing based on method used in jQuery.support
	testElement = document.createElement( body ? "div" : "body" );
	testElementStyle = {
		visibility: "hidden",
		width: 0,
		height: 0,
		border: 0,
		margin: 0,
		background: "none"
	};
	if ( body ) {
		$.extend( testElementStyle, {
			position: "absolute",
			left: "-1000px",
			top: "-1000px"
		});
	}
	for ( i in testElementStyle ) {
		testElement.style[ i ] = testElementStyle[ i ];
	}
	testElement.appendChild( div );
	testElementParent = body || document.documentElement;
	testElementParent.insertBefore( testElement, testElementParent.firstChild );

	div.style.cssText = "position: absolute; left: 10.7432222px;";

	offsetLeft = $( div ).offset().left;
	$.support.offsetFractions = offsetLeft > 10 && offsetLeft < 11;

	testElement.innerHTML = "";
	testElementParent.removeChild( testElement );
})();

// DEPRECATED
if ( $.uiBackCompat !== false ) {
	// offset option
	(function( $ ) {
		var _position = $.fn.position;
		$.fn.position = function( options ) {
			if ( !options || !options.offset ) {
				return _position.call( this, options );
			}
			var offset = options.offset.split( " " ),
				at = options.at.split( " " );
			if ( offset.length === 1 ) {
				offset[ 1 ] = offset[ 0 ];
			}
			if ( /^\d/.test( offset[ 0 ] ) ) {
				offset[ 0 ] = "+" + offset[ 0 ];
			}
			if ( /^\d/.test( offset[ 1 ] ) ) {
				offset[ 1 ] = "+" + offset[ 1 ];
			}
			if ( at.length === 1 ) {
				if ( /left|center|right/.test( at[ 0 ] ) ) {
					at[ 1 ] = "center";
				} else {
					at[ 1 ] = at[ 0 ];
					at[ 0 ] = "center";
				}
			}
			return _position.call( this, $.extend( options, {
				at: at[ 0 ] + offset[ 0 ] + " " + at[ 1 ] + offset[ 1 ],
				offset: undefined
			} ) );
		};
	}( jQuery ) );
}

}( jQuery ) );
