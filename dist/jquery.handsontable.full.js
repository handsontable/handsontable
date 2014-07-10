/**
 * Handsontable 0.11.0-beta1
 * Handsontable is a simple jQuery plugin for editable tables with basic copy-paste compatibility with Excel and Google Docs
 *
 * Copyright 2012-2014 Marcin Warpechowski
 * Licensed under the MIT license.
 * http://handsontable.com/
 *
 * Date: Thu Jul 10 2014 13:20:50 GMT+0200 (CEST)
 */
/*jslint white: true, browser: true, plusplus: true, indent: 4, maxerr: 50 */

var Handsontable = { //class namespace
  plugins: {}, //plugin namespace
  helper: {} //helper namespace
};

(function ($, window, Handsontable) {
  "use strict";
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
/**
 * Array.filter() shim by Trevor Menagh (https://github.com/trevmex) with some modifications
 */

if (!Array.prototype.filter) {
  Array.prototype.filter = function (fun, thisp) {
    "use strict";

    if (typeof this === "undefined" || this === null) {
      throw new TypeError();
    }
    if (typeof fun !== "function") {
      throw new TypeError();
    }

    thisp = thisp || this;

    if (isNodeList(thisp)) {
      thisp = convertNodeListToArray(thisp);
    }

    var len = thisp.length,
      res = [],
      i,
      val;

    for (i = 0; i < len; i += 1) {
      if (thisp.hasOwnProperty(i)) {
        val = thisp[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, thisp)) {
          res.push(val);
        }
      }
    }

    return res;

    function isNodeList(object) {
      return /NodeList/i.test(object.item);
    }

    function convertNodeListToArray(nodeList) {
      var array = [];

      for (var i = 0, len = nodeList.length; i < len; i++){
        array[i] = nodeList[i]
      }

      return array;
    }
  };
}

/*
 * Copyright 2012 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

if (typeof WeakMap === 'undefined') {
  (function() {
    var defineProperty = Object.defineProperty;

    try {
      var properDefineProperty = true;
      defineProperty(function(){}, 'foo', {});
    } catch (e) {
      properDefineProperty = false;
    }

    /*
      IE8 does not support Date.now() but IE8 compatibility mode in IE9 and IE10 does.
      M$ deserves a high five for this one :)
     */
    var counter = +(new Date) % 1e9;

    var WeakMap = function() {
      this.name = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
      if(!properDefineProperty){
        this._wmCache = [];
      }
    };

    if(properDefineProperty){
      WeakMap.prototype = {
        set: function(key, value) {
          var entry = key[this.name];
          if (entry && entry[0] === key)
            entry[1] = value;
          else
            defineProperty(key, this.name, {value: [key, value], writable: true});

        },
        get: function(key) {
          var entry;
          return (entry = key[this.name]) && entry[0] === key ?
            entry[1] : undefined;
        },
        'delete': function(key) {
          this.set(key, undefined);
        }
      };
    } else {
      WeakMap.prototype = {
        set: function(key, value) {

          if(typeof key == 'undefined' || typeof value == 'undefined') return;

          for(var i = 0, len = this._wmCache.length; i < len; i++){
            if(this._wmCache[i].key == key){
              this._wmCache[i].value = value;
              return;
            }
          }

          this._wmCache.push({key: key, value: value});

        },
        get: function(key) {

          if(typeof key == 'undefined') return;

          for(var i = 0, len = this._wmCache.length; i < len; i++){
            if(this._wmCache[i].key == key){
              return  this._wmCache[i].value;
            }
          }

          return;

        },
        'delete': function(key) {

          if(typeof key == 'undefined') return;

          for(var i = 0, len = this._wmCache.length; i < len; i++){
            if(this._wmCache[i].key == key){
              Array.prototype.slice.call(this._wmCache, i, 1);
            }
          }
        }
      };
    }

    window.WeakMap = WeakMap;
  })();
}

Handsontable.activeGuid = null;

/**
 * Handsontable constructor
 * @param rootElement The jQuery element in which Handsontable DOM will be inserted
 * @param userSettings
 * @constructor
 */
Handsontable.Core = function (rootElement, userSettings) {
  var priv
    , datamap
    , grid
    , selection
    , editorManager
    , autofill
    , instance = this
    , GridSettings = function () {};

  Handsontable.helper.extend(GridSettings.prototype, DefaultSettings.prototype); //create grid settings as a copy of default settings
  Handsontable.helper.extend(GridSettings.prototype, userSettings); //overwrite defaults with user settings
  Handsontable.helper.extend(GridSettings.prototype, expandType(userSettings));

  this.rootElement = rootElement;

  this.container = document.createElement('DIV');
  this.container.className = 'htContainer';
  rootElement.prepend(this.container);
  this.container = $(this.container);

  var $document = $(document.documentElement);
  var $body = $(document.body);
  this.guid = 'ht_' + Handsontable.helper.randomString(); //this is the namespace for global events

  if (!this.rootElement[0].id) {
    this.rootElement[0].id = this.guid; //if root element does not have an id, assign a random id
  }

  priv = {
    cellSettings: [],
    columnSettings: [],
    columnsSettingConflicts: ['data', 'width'],
    settings: new GridSettings(), // current settings instance
    selRange: null, //exposed by public method `getSelectedRange`
    isPopulated: null,
    scrollable: null,
    firstRun: true
  };

  grid = {
    /**
     * Inserts or removes rows and columns
     * @param {String} action Possible values: "insert_row", "insert_col", "remove_row", "remove_col"
     * @param {Number} index
     * @param {Number} amount
     * @param {String} [source] Optional. Source of hook runner.
     * @param {Boolean} [keepEmptyRows] Optional. Flag for preventing deletion of empty rows.
     */
    alter: function (action, index, amount, source, keepEmptyRows) {
      var delta;

      amount = amount || 1;

      switch (action) {
        case "insert_row":
          delta = datamap.createRow(index, amount);

          if (delta) {
            if (selection.isSelected() && priv.selRange.from.row >= index) {
              priv.selRange.from.row = priv.selRange.from.row + delta;
              selection.transformEnd(delta, 0); //will call render() internally
            }
            else {
              selection.refreshBorders(); //it will call render and prepare methods
            }
          }
          break;

        case "insert_col":
          delta = datamap.createCol(index, amount);

          if (delta) {

            if(Handsontable.helper.isArray(instance.getSettings().colHeaders)){
              var spliceArray = [index, 0];
              spliceArray.length += delta; //inserts empty (undefined) elements at the end of an array
              Array.prototype.splice.apply(instance.getSettings().colHeaders, spliceArray); //inserts empty (undefined) elements into the colHeader array
            }

            if (selection.isSelected() && priv.selRange.from.col >= index) {
              priv.selRange.from.col = priv.selRange.from.col + delta;
              selection.transformEnd(0, delta); //will call render() internally
            }
            else {
              selection.refreshBorders(); //it will call render and prepare methods
            }
          }
          break;

        case "remove_row":
          datamap.removeRow(index, amount);
          priv.cellSettings.splice(index, amount);
          grid.adjustRowsAndCols();
          selection.refreshBorders(); //it will call render and prepare methods
          break;

        case "remove_col":
          datamap.removeCol(index, amount);

          for(var row = 0, len = datamap.getAll().length; row < len; row++){
            if(row in priv.cellSettings){  //if row hasn't been rendered it wouldn't have cellSettings
              priv.cellSettings[row].splice(index, amount);
            }
          }

          if(Handsontable.helper.isArray(instance.getSettings().colHeaders)){
            if(typeof index == 'undefined'){
              index = -1;
            }
            instance.getSettings().colHeaders.splice(index, amount);
          }

          priv.columnSettings.splice(index, amount);

          grid.adjustRowsAndCols();
          selection.refreshBorders(); //it will call render and prepare methods
          break;

        default:
          throw new Error('There is no such action "' + action + '"');
          break;
      }

      if (!keepEmptyRows) {
        grid.adjustRowsAndCols(); //makes sure that we did not add rows that will be removed in next refresh
      }
    },

    /**
     * Makes sure there are empty rows at the bottom of the table
     */
    adjustRowsAndCols: function () {
      var r, rlen, emptyRows, emptyCols;

      //should I add empty rows to data source to meet minRows?
      rlen = instance.countRows();
      if (rlen < priv.settings.minRows) {
        for (r = 0; r < priv.settings.minRows - rlen; r++) {
          datamap.createRow(instance.countRows(), 1, true);
        }
      }

      emptyRows = instance.countEmptyRows(true);

      //should I add empty rows to meet minSpareRows?
      if (emptyRows < priv.settings.minSpareRows) {
        for (; emptyRows < priv.settings.minSpareRows && instance.countRows() < priv.settings.maxRows; emptyRows++) {
          datamap.createRow(instance.countRows(), 1, true);
        }
      }

      //count currently empty cols
      emptyCols = instance.countEmptyCols(true);

      //should I add empty cols to meet minCols?
      if (!priv.settings.columns && instance.countCols() < priv.settings.minCols) {
        for (; instance.countCols() < priv.settings.minCols; emptyCols++) {
          datamap.createCol(instance.countCols(), 1, true);
        }
      }

      //should I add empty cols to meet minSpareCols?
      if (!priv.settings.columns && instance.dataType === 'array' && emptyCols < priv.settings.minSpareCols) {
        for (; emptyCols < priv.settings.minSpareCols && instance.countCols() < priv.settings.maxCols; emptyCols++) {
          datamap.createCol(instance.countCols(), 1, true);
        }
      }

      // if (priv.settings.enterBeginsEditing) {
      //   for (; (((priv.settings.minRows || priv.settings.minSpareRows) && instance.countRows() > priv.settings.minRows) && (priv.settings.minSpareRows && emptyRows > priv.settings.minSpareRows)); emptyRows--) {
      //     datamap.removeRow();
      //   }
      // }

      // if (priv.settings.enterBeginsEditing && !priv.settings.columns) {
      //   for (; (((priv.settings.minCols || priv.settings.minSpareCols) && instance.countCols() > priv.settings.minCols) && (priv.settings.minSpareCols && emptyCols > priv.settings.minSpareCols)); emptyCols--) {
      //     datamap.removeCol();
      //   }
      // }

      var rowCount = instance.countRows();
      var colCount = instance.countCols();

      if (rowCount === 0 || colCount === 0) {
        selection.deselect();
      }

      if (selection.isSelected()) {
        var selectionChanged;
        var fromRow = priv.selRange.from.row;
        var fromCol = priv.selRange.from.col;
        var toRow = priv.selRange.to.row;
        var toCol = priv.selRange.to.col;

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
          instance.selectCell(fromRow, fromCol, toRow, toCol);
        }
      }
    },

    /**
     * Populate cells at position with 2d array
     * @param {Object} start Start selection position
     * @param {Array} input 2d array
     * @param {Object} [end] End selection position (only for drag-down mode)
     * @param {String} [source="populateFromArray"]
     * @param {String} [method="overwrite"]
     * @return {Object|undefined} ending td in pasted area (only if any cell was changed)
     */
    populateFromArray: function (start, input, end, source, method) {
      var r, rlen, c, clen, setData = [], current = {};
      rlen = input.length;
      if (rlen === 0) {
        return false;
      }

      var repeatCol
        , repeatRow
        , cmax
        , rmax;

      // insert data with specified pasteMode method
      switch (method) {
        case 'shift_down' :
          repeatCol = end ? end.col - start.col + 1 : 0;
          repeatRow = end ? end.row - start.row + 1 : 0;
          input = Handsontable.helper.translateRowsToColumns(input);
          for (c = 0, clen = input.length, cmax = Math.max(clen, repeatCol); c < cmax; c++) {
            if (c < clen) {
              for (r = 0, rlen = input[c].length; r < repeatRow - rlen; r++) {
                input[c].push(input[c][r % rlen]);
              }
              input[c].unshift(start.col + c, start.row, 0);
              instance.spliceCol.apply(instance, input[c]);
            }
            else {
              input[c % clen][0] = start.col + c;
              instance.spliceCol.apply(instance, input[c % clen]);
            }
          }
          break;

        case 'shift_right' :
          repeatCol = end ? end.col - start.col + 1 : 0;
          repeatRow = end ? end.row - start.row + 1 : 0;
          for (r = 0, rlen = input.length, rmax = Math.max(rlen, repeatRow); r < rmax; r++) {
            if (r < rlen) {
              for (c = 0, clen = input[r].length; c < repeatCol - clen; c++) {
                input[r].push(input[r][c % clen]);
              }
              input[r].unshift(start.row + r, start.col, 0);
              instance.spliceRow.apply(instance, input[r]);
            }
            else {
              input[r % rlen][0] = start.row + r;
              instance.spliceRow.apply(instance, input[r % rlen]);
            }
          }
          break;

        case 'overwrite' :
        default:
          // overwrite and other not specified options
          current.row = start.row;
          current.col = start.col;
          for (r = 0; r < rlen; r++) {
            if ((end && current.row > end.row) || (!priv.settings.minSpareRows && current.row > instance.countRows() - 1) || (current.row >= priv.settings.maxRows)) {
              break;
            }
            current.col = start.col;
            clen = input[r] ? input[r].length : 0;
            for (c = 0; c < clen; c++) {
              if ((end && current.col > end.col) || (!priv.settings.minSpareCols && current.col > instance.countCols() - 1) || (current.col >= priv.settings.maxCols)) {
                break;
              }
              if (!instance.getCellMeta(current.row, current.col).readOnly) {
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
          instance.setDataAtCell(setData, null, null, source || 'populateFromArray');
          break;
      }
    }
  };

  this.selection = selection = { //this public assignment is only temporary
    inProgress: false,

    /**
     * Sets inProgress to true. This enables onSelectionEnd and onSelectionEndByProp to function as desired
     */
    begin: function () {
      instance.selection.inProgress = true;
    },

    /**
     * Sets inProgress to false. Triggers onSelectionEnd and onSelectionEndByProp
     */
    finish: function () {
      var sel = instance.getSelected();
      Handsontable.hooks.run(instance, "afterSelectionEnd", sel[0], sel[1], sel[2], sel[3]);
      Handsontable.hooks.run(instance, "afterSelectionEndByProp", sel[0], instance.colToProp(sel[1]), sel[2], instance.colToProp(sel[3]));
      instance.selection.inProgress = false;
    },

    isInProgress: function () {
      return instance.selection.inProgress;
    },

    /**
     * Starts selection range on given td object
     * @param {WalkontableCellCoords} coords
     */
    setRangeStart: function (coords) {
      Handsontable.hooks.run(instance, "beforeSetRangeStart", coords);
      priv.selRange = new WalkontableCellRange(coords, coords, coords);
      selection.setRangeEnd(coords);
    },

    /**
     * Ends selection range on given td object
     * @param {WalkontableCellCoords} coords
     * @param {Boolean} [scrollToCell=true] If true, viewport will be scrolled to range end
     */
    setRangeEnd: function (coords, scrollToCell) {
      //trigger handlers
      Handsontable.hooks.run(instance, "beforeSetRangeEnd", coords);

      instance.selection.begin();

      priv.selRange.to = coords;
      if (!priv.settings.multiSelect) {
        priv.selRange.from = coords;
      }

      //set up current selection
      instance.view.wt.selections.current.clear();
      instance.view.wt.selections.current.add(priv.selRange.highlight);

      //set up area selection
      instance.view.wt.selections.area.clear();
      if (selection.isMultiple()) {
        instance.view.wt.selections.area.add(priv.selRange.from);
        instance.view.wt.selections.area.add(priv.selRange.to);
      }

      //set up highlight
      if (priv.settings.currentRowClassName || priv.settings.currentColClassName) {
        instance.view.wt.selections.highlight.clear();
        instance.view.wt.selections.highlight.add(priv.selRange.from);
        instance.view.wt.selections.highlight.add(priv.selRange.to);
      }

      //trigger handlers
      Handsontable.hooks.run(instance, "afterSelection", priv.selRange.from.row, priv.selRange.from.col, priv.selRange.to.row, priv.selRange.to.col);
      Handsontable.hooks.run(instance, "afterSelectionByProp", priv.selRange.from.row, datamap.colToProp(priv.selRange.from.col), priv.selRange.to.row, datamap.colToProp(priv.selRange.to.col));

      if (scrollToCell !== false && instance.view.mainViewIsActive()) {
        instance.view.scrollViewport(coords);
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
        editorManager.destroyEditor(revertOriginal);
      }
      instance.view.render();
      if (selection.isSelected() && !keepEditor) {
        editorManager.prepareEditor();
      }
    },

    /**
     * Returns information if we have a multiselection
     * @return {Boolean}
     */
    isMultiple: function () {
      return !(priv.selRange.to.col === priv.selRange.from.col && priv.selRange.to.row === priv.selRange.from.row);
    },

    /**
     * Selects cell relative to current cell (if possible)
     */
    transformStart: function (rowDelta, colDelta, force) {
      var delta = new WalkontableCellCoords(rowDelta, colDelta);
      instance.runHooks('modifyTransformStart', delta);

      if (priv.selRange.highlight.row + rowDelta > instance.countRows() - 1) {
        if (force && priv.settings.minSpareRows > 0) {
          instance.alter("insert_row", instance.countRows());
        }
        else if (priv.settings.autoWrapCol) {
          delta.row = 1 - instance.countRows();
          delta.col = priv.selRange.highlight.col + delta.col == instance.countCols() - 1 ? 1 - instance.countCols() : 1;
        }
      }
      else if (priv.settings.autoWrapCol && priv.selRange.highlight.row + delta.row < 0 && priv.selRange.highlight.col + delta.col >= 0) {
        delta.row = instance.countRows() - 1;
        delta.col = priv.selRange.highlight.col + delta.col == 0 ? instance.countCols() - 1 : -1;
      }

      if (priv.selRange.highlight.col + delta.col > instance.countCols() - 1) {
        if (force && priv.settings.minSpareCols > 0) {
          instance.alter("insert_col", instance.countCols());
        }
        else if (priv.settings.autoWrapRow) {
          delta.row = priv.selRange.highlight.row + delta.row == instance.countRows() - 1 ? 1 - instance.countRows() : 1;
          delta.col = 1 - instance.countCols();
        }
      }
      else if (priv.settings.autoWrapRow && priv.selRange.highlight.col + delta.col < 0 && priv.selRange.highlight.row + delta.row >= 0) {
        delta.row = priv.selRange.highlight.row + delta.row == 0 ? instance.countRows() - 1 : -1;
        delta.col = instance.countCols() - 1;
      }

      var totalRows = instance.countRows();
      var totalCols = instance.countCols();
      var coords = new WalkontableCellCoords(priv.selRange.highlight.row + delta.row, priv.selRange.highlight.col + delta.col);

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
      var delta = new WalkontableCellCoords(rowDelta, colDelta);
      instance.runHooks('modifyTransformEnd', delta);

        var totalRows = instance.countRows();
        var totalCols = instance.countCols();
        var coords = new WalkontableCellCoords(priv.selRange.to.row + delta.row, priv.selRange.to.col + delta.col);

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
    },

    /**
     * Returns true if currently there is a selection on screen, false otherwise
     * @return {Boolean}
     */
    isSelected: function () {
      return (priv.selRange !== null);
    },

    /**
     * Returns true if coords is within current selection coords
     * @param {WalkontableCellCoords} coords
     * @return {Boolean}
     */
    inInSelection: function (coords) {
      if (!selection.isSelected()) {
        return false;
      }
      return priv.selRange.includes(coords);
    },

    /**
     * Deselects all selected cells
     */
    deselect: function () {
      if (!selection.isSelected()) {
        return;
      }
      instance.selection.inProgress = false; //needed by HT inception
      priv.selRange = null;
      instance.view.wt.selections.current.clear();
      instance.view.wt.selections.area.clear();
      editorManager.destroyEditor();
      selection.refreshBorders();
      Handsontable.hooks.run(instance, 'afterDeselect');
    },

    /**
     * Select all cells
     */
    selectAll: function () {
      if (!priv.settings.multiSelect) {
        return;
      }
      selection.setRangeStart(new WalkontableCellCoords(0, 0));
      selection.setRangeEnd(new WalkontableCellCoords(instance.countRows() - 1, instance.countCols() - 1), false);
    },

    /**
     * Deletes data from selected cells
     */
    empty: function () {
      if (!selection.isSelected()) {
        return;
      }
      var topLeft = priv.selRange.getTopLeftCorner();
      var bottomRight = priv.selRange.getBottomRightCorner();
      var r, c, changes = [];
      for (r = topLeft.row; r <= bottomRight.row; r++) {
        for (c = topLeft.col; c <= bottomRight.col; c++) {
          if (!instance.getCellMeta(r, c).readOnly) {
            changes.push([r, c, '']);
          }
        }
      }
      instance.setDataAtCell(changes);
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
        select = instance.view.wt.selections.area.getCorners();
      }
      else {
        select = instance.view.wt.selections.current.getCorners();
      }

      data = datamap.getAll();
      rows : for (r = select[2] + 1; r < instance.countRows(); r++) {
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
        instance.view.wt.selections.fill.clear();
        instance.view.wt.selections.fill.add([select[0], select[1]]);
        instance.view.wt.selections.fill.add([maxR, select[3]]);
        autofill.apply();
      }
    },

    /**
     * Apply fill values to the area in fill border, omitting the selection border
     */
    apply: function () {
      var drag, select, start, end, _data;

      autofill.handle.isDragged = 0;

      drag = instance.view.wt.selections.fill.getCorners();
      if (!drag) {
        return;
      }

      instance.view.wt.selections.fill.clear();

      if (selection.isMultiple()) {
        select = instance.view.wt.selections.area.getCorners();
      }
      else {
        select = instance.view.wt.selections.current.getCorners();
      }

      if (drag[0] === select[0] && drag[1] < select[1]) {
        start = new WalkontableCellCoords(
          drag[0],
          drag[1]
        );
        end = new WalkontableCellCoords(
          drag[2],
          select[1] - 1
        );
      }
      else if (drag[0] === select[0] && drag[3] > select[3]) {
        start = new WalkontableCellCoords(
          drag[0],
          select[3] + 1
        );
        end = new WalkontableCellCoords(
          drag[2],
          drag[3]
        );
      }
      else if (drag[0] < select[0] && drag[1] === select[1]) {
        start = new WalkontableCellCoords(
          drag[0],
          drag[1]
        );
        end = new WalkontableCellCoords(
          select[0] - 1,
          drag[3]
        );
      }
      else if (drag[2] > select[2] && drag[1] === select[1]) {
        start = new WalkontableCellCoords(
          select[2] + 1,
          drag[1]
        );
        end = new WalkontableCellCoords(
          drag[2],
          drag[3]
        );
      }

      if (start) {

        _data = SheetClip.parse(datamap.getText(priv.selRange.from, priv.selRange.to));
        Handsontable.hooks.run(instance, 'beforeAutofill', start, end, _data);

        grid.populateFromArray(start, _data, end, 'autofill');
        selection.setRangeStart(new WalkontableCellCoords(drag[0], drag[1]));
        selection.setRangeEnd(new WalkontableCellCoords(drag[2], drag[3]));
      }
      /*else {
       //reset to avoid some range bug
       selection.refreshBorders();
       }*/
    },

    /**
     * Show fill border
     * @param {WalkontableCellCoords} coords
     */
    showBorder: function (coords) {
      var topLeft = priv.selRange.getTopLeftCorner();
      var bottomRight = priv.selRange.getBottomRightCorner();
      if (priv.settings.fillHandle !== 'horizontal' && (bottomRight.row < coords.row || topLeft.row > coords.row)) {
        coords = new WalkontableCellCoords(coords.row, bottomRight.col);
      }
      else if (priv.settings.fillHandle !== 'vertical') {
        coords = new WalkontableCellCoords(bottomRight.row, coords.col);
      }
      else {
        return; //wrong direction
      }

      instance.view.wt.selections.fill.clear();
      instance.view.wt.selections.fill.add(priv.selRange.from);
      instance.view.wt.selections.fill.add(priv.selRange.to);
      instance.view.wt.selections.fill.add(coords);
      instance.view.render();
    }
  };

  this.init = function () {
    Handsontable.hooks.run(instance, 'beforeInit');

    this.updateSettings(priv.settings, true);

    this.view = new Handsontable.TableView(this);
    editorManager = new Handsontable.EditorManager(instance, priv, selection, datamap);

    this.forceFullRender = true; //used when data was changed
    this.view.render();

    if (typeof priv.firstRun === 'object') {
      Handsontable.hooks.run(instance, 'afterChange', priv.firstRun[0], priv.firstRun[1]);
      priv.firstRun = false;
    }
    Handsontable.hooks.run(instance, 'afterInit');
  };

  function ValidatorsQueue() { //moved this one level up so it can be used in any function here. Probably this should be moved to a separate file
    var resolved = false;

    return {
      validatorsInQueue: 0,
      addValidatorToQueue: function () {
        this.validatorsInQueue++;
        resolved = false;
      },
      removeValidatorFormQueue: function () {
        this.validatorsInQueue = this.validatorsInQueue - 1 < 0 ? 0 : this.validatorsInQueue - 1;
        this.checkIfQueueIsEmpty();
      },
      onQueueEmpty: function () {
      },
      checkIfQueueIsEmpty: function () {
        if (this.validatorsInQueue == 0 && resolved == false) {
          resolved = true;
          this.onQueueEmpty();
        }
      }
    };
  }

  function validateChanges(changes, source, callback) {
    var waitingForValidator = new ValidatorsQueue();
    waitingForValidator.onQueueEmpty = resolve;

    for (var i = changes.length - 1; i >= 0; i--) {
      if (changes[i] === null) {
        changes.splice(i, 1);
      }
      else {
        var row = changes[i][0];
        var col = datamap.propToCol(changes[i][1]);
        var logicalCol = instance.runHooksAndReturn('modifyCol', col); //column order may have changes, so we need to translate physical col index (stored in datasource) to logical (displayed to user)
        var cellProperties = instance.getCellMeta(row, logicalCol);

        if (cellProperties.type === 'numeric' && typeof changes[i][3] === 'string') {
          if (changes[i][3].length > 0 && /^-?[\d\s]*(\.|\,)?\d*$/.test(changes[i][3])) {

            if(typeof cellProperties.language == 'undefined') {
              numeral.language('en');
            } else {
              numeral.language(cellProperties.language);
            }

            changes[i][3] = parseFloat(changes[i][3].replace(',','.'));
          }
        }

        if (instance.getCellValidator(cellProperties)) {
          waitingForValidator.addValidatorToQueue();
          instance.validateCell(changes[i][3], cellProperties, (function (i, cellProperties) {
            return function (result) {
              if (typeof result !== 'boolean') {
                throw new Error("Validation error: result is not boolean");
              }
              if (result === false && cellProperties.allowInvalid === false) {
                changes.splice(i, 1);         // cancel the change
                cellProperties.valid = true;  // we cancelled the change, so cell value is still valid
                --i;
              }
              waitingForValidator.removeValidatorFormQueue();
            }
          })(i, cellProperties)
            , source);
        }
      }
    }
    waitingForValidator.checkIfQueueIsEmpty();

    function resolve() {
      var beforeChangeResult;

      if (changes.length) {
        beforeChangeResult = Handsontable.hooks.execute(instance, "beforeChange", changes, source);
        if (typeof beforeChangeResult === 'function') {
          $.when(result).then(function () {
            callback(); //called when async validators and async beforeChange are resolved
          });
        }
        else if (beforeChangeResult === false) {
          changes.splice(0, changes.length); //invalidate all changes (remove everything from array)
        }
      }
      if (typeof beforeChangeResult !== 'function') {
        callback(); //called when async validators are resolved and beforeChange was not async
      }
    }
  }

  /**
   * Internal function to apply changes. Called after validateChanges
   * @param {Array} changes Array in form of [row, prop, oldValue, newValue]
   * @param {String} source String that identifies how this change will be described in changes array (useful in onChange callback)
   */
  function applyChanges(changes, source) {
    var i = changes.length - 1;

    if (i < 0) {
      return;
    }

    for (; 0 <= i; i--) {
      if (changes[i] === null) {
        changes.splice(i, 1);
        continue;
      }

      if(changes[i][2] == null && changes[i][3] == null) {
        continue;
      }

      if (priv.settings.minSpareRows) {
        while (changes[i][0] > instance.countRows() - 1) {
          datamap.createRow();
        }
      }

      if (instance.dataType === 'array' && priv.settings.minSpareCols) {
        while (datamap.propToCol(changes[i][1]) > instance.countCols() - 1) {
          datamap.createCol();
        }
      }

      datamap.set(changes[i][0], changes[i][1], changes[i][3]);
    }

    instance.forceFullRender = true; //used when data was changed
    grid.adjustRowsAndCols();
    Handsontable.hooks.run(instance, 'beforeChangeRender', changes, source);
    selection.refreshBorders(null, true);
    Handsontable.hooks.run(instance, 'afterChange', changes, source || 'edit');
  }

  this.validateCell = function (value, cellProperties, callback, source) {
    var validator = instance.getCellValidator(cellProperties);

    if (Object.prototype.toString.call(validator) === '[object RegExp]') {
      validator = (function (validator) {
        return function (value, callback) {
          callback(validator.test(value));
        }
      })(validator);
    }

    if (typeof validator == 'function') {

      value = Handsontable.hooks.execute(instance, "beforeValidate", value, cellProperties.row, cellProperties.prop, source);

      // To provide consistent behaviour, validation should be always asynchronous
      setTimeout(function () {
        validator.call(cellProperties, value, function (valid) {
          cellProperties.valid = valid;

          valid = Handsontable.hooks.execute(instance, "afterValidate", valid, value, cellProperties.row, cellProperties.prop, source);

          callback(valid);
        });
      });

    } else { //resolve callback even if validator function was not found
      cellProperties.valid = true;
      callback(true);
    }



  };

  function setDataInputToArray(row, prop_or_col, value) {
    if (typeof row === "object") { //is it an array of changes
      return row;
    }
    else if ($.isPlainObject(value)) { //backwards compatibility
      return value;
    }
    else {
      return [
        [row, prop_or_col, value]
      ];
    }
  }

  /**
   * Set data at given cell
   * @public
   * @param {Number|Array} row or array of changes in format [[row, col, value], ...]
   * @param {Number|String} col or source String
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
      if (typeof input[i] !== 'object') {
        throw new Error('Method `setDataAtCell` accepts row number or changes array of arrays as its first parameter');
      }
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

    if (!source && typeof row === "object") {
      source = col;
    }

    validateChanges(changes, source, function () {
      applyChanges(changes, source);
    });
  };


  /**
   * Set data at given row property
   * @public
   * @param {Number|Array} row or array of changes in format [[row, prop, value], ...]
   * @param {String} prop or source String
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

    if (!source && typeof row === "object") {
      source = prop;
    }

    validateChanges(changes, source, function () {
      applyChanges(changes, source);
    });
  };

  /**
   * Listen to document body keyboard input
   */
  this.listen = function () {
    Handsontable.activeGuid = instance.guid;

    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    else if (!document.activeElement) { //IE
      document.body.focus();
    }
  };

  /**
   * Stop listening to document body keyboard input
   */
  this.unlisten = function () {
    Handsontable.activeGuid = null;
  };

  /**
   * Returns true if current Handsontable instance is listening on document body keyboard input
   */
  this.isListening = function () {
    return Handsontable.activeGuid === instance.guid;
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
   * @param {Number} row Start row
   * @param {Number} col Start column
   * @param {Array} input 2d array
   * @param {Number=} endRow End row (use when you want to cut input when certain row is reached)
   * @param {Number=} endCol End column (use when you want to cut input when certain column is reached)
   * @param {String=} [source="populateFromArray"]
   * @param {String=} [method="overwrite"]
   * @return {Object|undefined} ending td in pasted area (only if any cell was changed)
   */
  this.populateFromArray = function (row, col, input, endRow, endCol, source, method) {
    if (!(typeof input === 'object' && typeof input[0] === 'object')) {
      throw new Error("populateFromArray parameter `input` must be an array of arrays"); //API changed in 0.9-beta2, let's check if you use it correctly
    }
    return grid.populateFromArray(new WalkontableCellCoords(row, col), input, typeof endRow === 'number' ? new WalkontableCellCoords(endRow, endCol) : null, source, method);
  };

  /**
   * Adds/removes data from the column
   * @param {Number} col Index of column in which do you want to do splice.
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
   * param {...*} elements Optional. The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array
   */
  this.spliceCol = function (col, index, amount/*, elements... */) {
    return datamap.spliceCol.apply(datamap, arguments);
  };

  /**
   * Adds/removes data from the row
   * @param {Number} row Index of column in which do you want to do splice.
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
   * param {...*} elements Optional. The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array
   */
  this.spliceRow = function (row, index, amount/*, elements... */) {
    return datamap.spliceRow.apply(datamap, arguments);
  };

  /**
   * Returns current selection. Returns undefined if there is no selection.
   * @public
   * @return {Array} [`startRow`, `startCol`, `endRow`, `endCol`]
   */
  this.getSelected = function () { //https://github.com/handsontable/jquery-handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return [priv.selRange.from.row, priv.selRange.from.col, priv.selRange.to.row, priv.selRange.to.col];
    }
  };

  /**
   * Returns current selection as a WalkontableCellRange object. Returns undefined if there is no selection.
   * @public
   * @return {WalkontableCellRange}
   */
  this.getSelectedRange = function () { //https://github.com/handsontable/jquery-handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return priv.selRange;
    }
  };


  /**
   * Render visible data
   * @public
   */
  this.render = function () {
    if (instance.view) {
      instance.forceFullRender = true; //used when data was changed
      selection.refreshBorders(null, true);
    }
  };

  /**
   * Load data from array
   * @public
   * @param {Array} data
   */
  this.loadData = function (data) {
    if (typeof data === 'object' && data !== null) {
      if (!(data.push && data.splice)) { //check if data is array. Must use duck-type check so Backbone Collections also pass it
        //when data is not an array, attempt to make a single-row array of it
        data = [data];
      }
    }
    else if(data === null) {
      data = [];
      var row;
      for (var r = 0, rlen = priv.settings.startRows; r < rlen; r++) {
        row = [];
        for (var c = 0, clen = priv.settings.startCols; c < clen; c++) {
          row.push(null);
        }
        data.push(row);
      }
    }
    else {
      throw new Error("loadData only accepts array of objects or array of arrays (" + typeof data + " given)");
    }

    priv.isPopulated = false;
    GridSettings.prototype.data = data;

    if (priv.settings.dataSchema instanceof Array || data[0]  instanceof Array) {
      instance.dataType = 'array';
    }
    else if (typeof priv.settings.dataSchema === 'function') {
      instance.dataType = 'function';
    }
    else {
      instance.dataType = 'object';
    }

    datamap = new Handsontable.DataMap(instance, priv, GridSettings);

    clearCellSettingCache();

    grid.adjustRowsAndCols();
    Handsontable.hooks.run(instance, 'afterLoadData');

    if (priv.firstRun) {
      priv.firstRun = [null, 'loadData'];
    }
    else {
      Handsontable.hooks.run(instance, 'afterChange', null, 'loadData');
      instance.render();
    }

    priv.isPopulated = true;



    function clearCellSettingCache() {
      priv.cellSettings.length = 0;
    }
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
      return datamap.getRange(new WalkontableCellCoords(r, c), new WalkontableCellCoords(r2, c2), datamap.DESTINATION_RENDERER);
    }
  };

  this.getCopyableData = function (startRow, startCol, endRow, endCol) {
    return datamap.getCopyableText(new WalkontableCellCoords(startRow, startCol), new WalkontableCellCoords(endRow, endCol));
  };

  /**
   * Update settings
   * @public
   */
  this.updateSettings = function (settings, init) {
    var i, clen;

    if (typeof settings.rows !== "undefined") {
      throw new Error("'rows' setting is no longer supported. do you mean startRows, minRows or maxRows?");
    }
    if (typeof settings.cols !== "undefined") {
      throw new Error("'cols' setting is no longer supported. do you mean startCols, minCols or maxCols?");
    }

    for (i in settings) {
      if (i === 'data') {
        continue; //loadData will be triggered later
      }
      else {
        if (Handsontable.hooks.hooks[i] !== void 0 || Handsontable.hooks.legacy[i] !== void 0) {
          if (typeof settings[i] === 'function' || Handsontable.helper.isArray(settings[i])) {
            instance.addHook(i, settings[i]);
          }
        }
        else {
          // Update settings
          if (!init && settings.hasOwnProperty(i)) {
            GridSettings.prototype[i] = settings[i];
          }
        }
      }
    }

    // Load data or create data map
    if (settings.data === void 0 && priv.settings.data === void 0) {
      instance.loadData(null); //data source created just now
    }
    else if (settings.data !== void 0) {
      instance.loadData(settings.data); //data source given as option
    }
    else if (settings.columns !== void 0) {
      datamap.createMap();
    }

    // Init columns constructors configuration
    clen = instance.countCols();

    //Clear cellSettings cache
    priv.cellSettings.length = 0;

    if (clen > 0) {
      var proto, column;

      for (i = 0; i < clen; i++) {
        priv.columnSettings[i] = Handsontable.helper.columnFactory(GridSettings, priv.columnsSettingConflicts);

        // shortcut for prototype
        proto = priv.columnSettings[i].prototype;

        // Use settings provided by user
        if (GridSettings.prototype.columns) {
          column = GridSettings.prototype.columns[i];
          Handsontable.helper.extend(proto, column);
          Handsontable.helper.extend(proto, expandType(column));
        }
      }
    }
    Handsontable.hooks.run(instance, 'afterCellMetaReset');

    if (typeof settings.fillHandle !== "undefined") {
      if (autofill.handle && settings.fillHandle === false) {
        autofill.disable();
      }
      else if (!autofill.handle && settings.fillHandle !== false) {
        autofill.init();
      }
    }

    if (typeof settings.className !== "undefined") {
      if (GridSettings.prototype.className) {
        instance.rootElement.removeClass(GridSettings.prototype.className);
      }
      if (settings.className) {
        instance.rootElement.addClass(settings.className);
      }
    }

    if (typeof settings.height != 'undefined'){
      var height = settings.height;

      if (typeof height == 'function'){
        height = height();
      }

      instance.rootElement[0].style.height = height + 'px';
    }

    if (typeof settings.width != 'undefined'){
      var width = settings.width;

      if (typeof width == 'function'){
        width = width();
      }

      instance.rootElement[0].style.width = width + 'px';
    }

    if (height){
      instance.rootElement[0].style.overflow = 'auto';
    } else {
      instance.rootElement[0].style.overflow = 'none';
    }


    if (!init) {
      Handsontable.hooks.run(instance, 'afterUpdateSettings');
    }

    grid.adjustRowsAndCols();
    if (instance.view && !priv.firstRun) {
      instance.forceFullRender = true; //used when data was changed
      selection.refreshBorders(null, true);
    }
  };

  this.getValue = function () {
    var sel = instance.getSelected();
    if (GridSettings.prototype.getValue) {
      if (typeof GridSettings.prototype.getValue === 'function') {
        return GridSettings.prototype.getValue.call(instance);
      }
      else if (sel) {
        return instance.getData()[sel[0]][GridSettings.prototype.getValue];
      }
    }
    else if (sel) {
      return instance.getDataAtCell(sel[0], sel[1]);
    }
  };

  function expandType(obj) {
    if (!obj.hasOwnProperty('type')) return; //ignore obj.prototype.type


    var type, expandedType = {};

    if (typeof obj.type === 'object') {
      type = obj.type;
    }
    else if (typeof obj.type === 'string') {
      type = Handsontable.cellTypes[obj.type];
      if (type === void 0) {
        throw new Error('You declared cell type "' + obj.type + '" as a string that is not mapped to a known object. Cell type must be an object or a string mapped to an object in Handsontable.cellTypes');
      }
    }


    for (var i in type) {
      if (type.hasOwnProperty(i) && !obj.hasOwnProperty(i)) {
        expandedType[i] = type[i];
      }
    }

    return expandedType;

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
   * Inserts or removes rows and columns
   * @param {String} action See grid.alter for possible values
   * @param {Number} index
   * @param {Number} amount
   * @param {String} [source] Optional. Source of hook runner.
   * @param {Boolean} [keepEmptyRows] Optional. Flag for preventing deletion of empty rows.
   * @public
   */
  this.alter = function (action, index, amount, source, keepEmptyRows) {
    grid.alter(action, index, amount, source, keepEmptyRows);
  };

  /**
   * Returns <td> element corresponding to params row, col
   * @param {Number} row
   * @param {Number} col
   * @public
   * @return {Element}
   */
  this.getCell = function (row, col) {
    return instance.view.getCellAtCoords(new WalkontableCellCoords(row, col));
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
   * @param {String} prop
   * @public
   * @return value (mixed data type)
   */
  this.getDataAtRowProp = function (row, prop) {
    return datamap.get(row, prop);
  };

  /**
   * Return value at `col`
   * @param {Number} col
   * @public
   * @return value (mixed data type)
   */
  this.getDataAtCol = function (col) {
    return [].concat.apply([], datamap.getRange(new WalkontableCellCoords(0, col), new WalkontableCellCoords(priv.settings.data.length - 1, col), datamap.DESTINATION_RENDERER));
  };

  /**
   * Return value at `prop`
   * @param {String} prop
   * @public
   * @return value (mixed data type)
   */
  this.getDataAtProp = function (prop) {
    return [].concat.apply([], datamap.getRange(new WalkontableCellCoords(0, datamap.propToCol(prop)), new WalkontableCellCoords(priv.settings.data.length - 1, datamap.propToCol(prop)), datamap.DESTINATION_RENDERER));
  };

  /**
   * Return value at `row`
   * @param {Number} row
   * @public
   * @return value (mixed data type)
   */
  this.getDataAtRow = function (row) {
    return priv.settings.data[row];
  };

  /**
   * Sets cell meta data object "key" corresponding to params row, col
   * @param {Number} row
   * @param {Number} col
   * @param {String} key
   * @param {String} val
   *
   */
  this.setCellMeta = function (row, col, key, val) {
    if (!priv.cellSettings[row]) {
      priv.cellSettings[row] = [];
    }
    if (!priv.cellSettings[row][col]) {
      priv.cellSettings[row][col] = new priv.columnSettings[col]();
    }
    priv.cellSettings[row][col][key] = val;
    Handsontable.hooks.run(instance, 'afterSetCellMeta', row, col, key, val);
  };

  /**
   * Returns cell meta data object corresponding to params row, col
   * @param {Number} row
   * @param {Number} col
   * @public
   * @return {Object}
   */
  this.getCellMeta = function (row, col) {
    var prop = datamap.colToProp(col)
      , cellProperties;

    row = translateRowIndex(row);
    col = translateColIndex(col);

    if (!priv.columnSettings[col]) {
      priv.columnSettings[col] = Handsontable.helper.columnFactory(GridSettings, priv.columnsSettingConflicts);
    }

    if (!priv.cellSettings[row]) {
      priv.cellSettings[row] = [];
    }
    if (!priv.cellSettings[row][col]) {
      priv.cellSettings[row][col] = new priv.columnSettings[col]();
    }

    cellProperties = priv.cellSettings[row][col]; //retrieve cellProperties from cache

    cellProperties.row = row;
    cellProperties.col = col;
    cellProperties.prop = prop;
    cellProperties.instance = instance;

    Handsontable.hooks.run(instance, 'beforeGetCellMeta', row, col, cellProperties);
    Handsontable.helper.extend(cellProperties, expandType(cellProperties)); //for `type` added in beforeGetCellMeta

    if (cellProperties.cells) {
      var settings = cellProperties.cells.call(cellProperties, row, col, prop);

      if (settings) {
        Handsontable.helper.extend(cellProperties, settings);
        Handsontable.helper.extend(cellProperties, expandType(settings)); //for `type` added in cells
      }
    }

    Handsontable.hooks.run(instance, 'afterGetCellMeta', row, col, cellProperties);

    return cellProperties;
  };

  /**
   * If displayed rows order is different than the order of rows stored in memory (i.e. sorting is applied)
   * we need to translate logical (stored) row index to physical (displayed) index.
   * @param row - original row index
   * @returns {int} translated row index
   */
  function translateRowIndex(row){
    return Handsontable.hooks.execute(instance, 'modifyRow', row);
  }

  /**
   * If displayed columns order is different than the order of columns stored in memory (i.e. column were moved using manualColumnMove plugin)
   * we need to translate logical (stored) column index to physical (displayed) index.
   * @param col - original column index
   * @returns {int} - translated column index
   */
  function translateColIndex(col){
    return Handsontable.hooks.execute(instance, 'modifyCol', col); // warning: this must be done after datamap.colToProp
  }

  var rendererLookup = Handsontable.helper.cellMethodLookupFactory('renderer');
  this.getCellRenderer = function (row, col) {
    var renderer = rendererLookup.call(this, row, col);
    return Handsontable.renderers.getRenderer(renderer);

  };

  this.getCellEditor = Handsontable.helper.cellMethodLookupFactory('editor');

  this.getCellValidator = Handsontable.helper.cellMethodLookupFactory('validator');


  /**
   * Validates all cells using their validator functions and calls callback when finished. Does not render the view
   * @param callback
   */
  this.validateCells = function (callback) {
    var waitingForValidator = new ValidatorsQueue();
    waitingForValidator.onQueueEmpty = callback;

    var i = instance.countRows() - 1;
    while (i >= 0) {
      var j = instance.countCols() - 1;
      while (j >= 0) {
        waitingForValidator.addValidatorToQueue();
        instance.validateCell(instance.getDataAtCell(i, j), instance.getCellMeta(i, j), function () {
          waitingForValidator.removeValidatorFormQueue();
        }, 'validateCells');
        j--;
      }
      i--;
    }
    waitingForValidator.checkIfQueueIsEmpty();
  };

  /**
   * Return array of row headers (if they are enabled). If param `row` given, return header at given row as string
   * @param {Number} row (Optional)
   * @return {Array|String}
   */
  this.getRowHeader = function (row) {
    if (row === void 0) {
      var out = [];
      for (var i = 0, ilen = instance.countRows(); i < ilen; i++) {
        out.push(instance.getRowHeader(i));
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
   * Returns information of this table is configured to display row headers
   * @returns {boolean}
   */
  this.hasRowHeaders = function () {
    return !!priv.settings.rowHeaders;
  };

  /**
   * Returns information of this table is configured to display column headers
   * @returns {boolean}
   */
  this.hasColHeaders = function () {
    if (priv.settings.colHeaders !== void 0 && priv.settings.colHeaders !== null) { //Polymer has empty value = null
      return !!priv.settings.colHeaders;
    }
    for (var i = 0, ilen = instance.countCols(); i < ilen; i++) {
      if (instance.getColHeader(i)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Return array of column headers (if they are enabled). If param `col` given, return header at given column as string
   * @param {Number} col (Optional)
   * @return {Array|String}
   */
  this.getColHeader = function (col) {
    if (col === void 0) {
      var out = [];
      for (var i = 0, ilen = instance.countCols(); i < ilen; i++) {
        out.push(instance.getColHeader(i));
      }
      return out;
    }
    else {
      var baseCol = col;
      col = Handsontable.hooks.execute(instance, 'modifyCol', col);

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
        return Handsontable.helper.spreadsheetColumnLabel(baseCol); //see #1458
      }
      else {
        return priv.settings.colHeaders;
      }
    }
  };

  /**
   * Return column width from settings (no guessing). Private use intended
   * @param {Number} col
   * @return {Number}
   */
  this._getColWidthFromSettings = function (col) {
    var cellProperties = instance.getCellMeta(0, col);
    var width = cellProperties.width;
    if (width === void 0 || width === priv.settings.width) {
      width = cellProperties.colWidths;
    }
    if (width !== void 0 && width !== null) {
      switch (typeof width) {
        case 'object': //array
          width = width[col];
          break;

        case 'function':
          width = width(col);
          break;
      }
      if (typeof width === 'string') {
        width = parseInt(width, 10);
      }
    }
    return width;
  };

  /**
   * Return column width
   * @param {Number} col
   * @return {Number}
   */
  this.getColWidth = function (col) {
    var width = instance._getColWidthFromSettings(col);
    if (!width) {
      width = 50;
    }
    width = Handsontable.hooks.execute(instance, 'modifyColWidth', width, col);
    return width;
  };

  /**
   * Return row height from settings (no guessing). Private use intended
   * @param {Number} row
   * @return {Number}
   */
  this._getRowHeightFromSettings= function (row) {
    /* inefficient
    var cellProperties = instance.getCellMeta(0, row);
    var height = cellProperties.height;
    if (height === void 0 || height === priv.settings.height) {
      height = cellProperties.rowHeights;
    }
    */
    var height = priv.settings.rowHeights; //only uses grid settings
    if (height !== void 0 && height !== null) {
      switch (typeof height) {
        case 'object': //array
          height = height[row];
          break;

        case 'function':
          height = height(row);
          break;
      }
      if (typeof height === 'string') {
        height = parseInt(height, 10);
      }
    }
    return height;
  };

  /**
   * Return row height
   * @param {Number} row
   * @return {Number}
   */
  this.getRowHeight = function (row) {
    var height = instance._getRowHeightFromSettings(row);

    height = Handsontable.hooks.execute(instance, 'modifyRowHeight', height, row);
    return height;
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
    if (instance.dataType === 'object' || instance.dataType === 'function') {
      if (priv.settings.columns && priv.settings.columns.length) {
        return priv.settings.columns.length;
      }
      else {
        return datamap.colToPropCache.length;
      }
    }
    else if (instance.dataType === 'array') {
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
    return instance.view.wt.getSetting('offsetRow');
  };

  /**
   * Return index of first visible column
   * @return {Number}
   */
  this.colOffset = function () {
    return instance.view.wt.getSetting('offsetColumn');
  };

  /**
   * Return number of visible rows. Returns -1 if table is not visible
   * @return {Number}
   */
  this.countVisibleRows = function () {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.rowStrategy.countVisible() : -1;
  };

  /**
   * Return number of visible columns. Returns -1 if table is not visible
   * @return {Number}
   */
  this.countVisibleCols = function () {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.columnStrategy.countVisible() : -1;
  };

  /**
   * Return number of empty rows
   * @return {Boolean} ending If true, will only count empty rows at the end of the data source
   */
  this.countEmptyRows = function (ending) {
    var i = instance.countRows() - 1
      , empty = 0
      , row;
    while (i >= 0) {
      row = Handsontable.hooks.execute(this, 'modifyRow', i);
      if (instance.isEmptyRow(row)) {
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
    if (instance.countRows() < 1) {
      return 0;
    }

    var i = instance.countCols() - 1
      , empty = 0;
    while (i >= 0) {
      if (instance.isEmptyCol(i)) {
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
    return priv.settings.isEmptyRow.call(instance, r);
  };

  /**
   * Return true if the column at the given index is empty, false otherwise
   * @param {Number} c Column index
   * @return {Boolean}
   */
  this.isEmptyCol = function (c) {
    return priv.settings.isEmptyCol.call(instance, c);
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
    if (typeof row !== 'number' || row < 0 || row >= instance.countRows()) {
      return false;
    }
    if (typeof col !== 'number' || col < 0 || col >= instance.countCols()) {
      return false;
    }
    if (typeof endRow !== "undefined") {
      if (typeof endRow !== 'number' || endRow < 0 || endRow >= instance.countRows()) {
        return false;
      }
      if (typeof endCol !== 'number' || endCol < 0 || endCol >= instance.countCols()) {
        return false;
      }
    }
    var coords = new WalkontableCellCoords(row, col);
    priv.selRange = new WalkontableCellRange(coords, coords, coords);
    if (document.activeElement && document.activeElement !== document.documentElement && document.activeElement !== document.body) {
      document.activeElement.blur(); //needed or otherwise prepare won't focus the cell. selectionSpec tests this (should move focus to selected cell)
    }
    instance.listen();
    if (typeof endRow === "undefined") {
      selection.setRangeEnd(priv.selRange.from, scrollToCell);
    }
    else {
      selection.setRangeEnd(new WalkontableCellCoords(endRow, endCol), scrollToCell);
    }

    instance.selection.finish();
    return true;
  };

  this.selectCellByProp = function (row, prop, endRow, endProp, scrollToCell) {
    arguments[1] = datamap.propToCol(arguments[1]);
    if (typeof arguments[3] !== "undefined") {
      arguments[3] = datamap.propToCol(arguments[3]);
    }
    return instance.selectCell.apply(instance, arguments);
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
    instance._clearTimeouts();
    if (instance.view) { //in case HT is destroyed before initialization has finished
      instance.view.wt.destroy();
    }
    instance.rootElement.empty();
    instance.rootElement.removeData('handsontable');
    instance.rootElement.off('.handsontable');
    $(window).off('.' + instance.guid);
    $document.off('.' + instance.guid);
    $body.off('.' + instance.guid);
    Handsontable.hooks.run(instance, 'afterDestroy');
  };

  /**
   * Returns active editor object
   * @returns {Object}
   */
  this.getActiveEditor = function(){
    return editorManager.getActiveEditor();
  };

  /**
   * Return Handsontable instance
   * @public
   * @return {Object}
   */
  this.getInstance = function () {
    return instance;
  };

  this.addHook = function (key, fn) {
    Handsontable.hooks.add(key, fn, instance);
  };

  this.addHookOnce = function (key, fn) {
    Handsontable.hooks.once(key, fn, instance);
  };

  this.removeHook = function (key, fn) {
    Handsontable.hooks.remove(key, fn, instance);
  };

  this.runHooks = function (key, p1, p2, p3, p4, p5) {
    Handsontable.hooks.run(instance, key, p1, p2, p3, p4, p5);
  };

  this.runHooksAndReturn = function (key, p1, p2, p3, p4, p5) {
    return Handsontable.hooks.execute(instance, key, p1, p2, p3, p4, p5);
  };

  this.timeouts = {};

  /**
   * Sets timeout. Purpose of this method is to clear all known timeouts when `destroy` method is called
   * @public
   */
  this._registerTimeout = function (key, handle, ms) {
    clearTimeout(this.timeouts[key]);
    this.timeouts[key] = setTimeout(handle, ms || 0);
  };

  /**
   * Clears all known timeouts
   * @public
   */
  this._clearTimeouts = function () {
    for (var key in this.timeouts) {
      if (this.timeouts.hasOwnProperty(key)) {
        clearTimeout(this.timeouts[key]);
      }
    }
  };

  /**
   * Handsontable version
   */
  this.version = '0.11.0-beta1'; //inserted by grunt from package.json
};

var DefaultSettings = function () {};

DefaultSettings.prototype = {
  data: void 0,
  width: void 0,
  height: void 0,
  startRows: 5,
  startCols: 5,
  rowHeaders: null,
  colHeaders: null,
  minRows: 0,
  minCols: 0,
  maxRows: Infinity,
  maxCols: Infinity,
  minSpareRows: 0,
  minSpareCols: 0,
  multiSelect: true,
  fillHandle: true,
  fixedRowsTop: 0,
  fixedColumnsLeft: 0,
  outsideClickDeselects: true,
  enterBeginsEditing: true,
  enterMoves: {row: 1, col: 0},
  tabMoves: {row: 0, col: 1},
  autoWrapRow: false,
  autoWrapCol: false,
  copyRowsLimit: 1000,
  copyColsLimit: 1000,
  pasteMode: 'overwrite',
  currentRowClassName: void 0,
  currentColClassName: void 0,
  stretchH: 'hybrid',
  isEmptyRow: function (r) {
    var val;
    for (var c = 0, clen = this.countCols(); c < clen; c++) {
      val = this.getDataAtCell(r, c);
      if (val !== '' && val !== null && typeof val !== 'undefined') {
        return false;
      }
    }
    return true;
  },
  isEmptyCol: function (c) {
    var val;
    for (var r = 0, rlen = this.countRows(); r < rlen; r++) {
      val = this.getDataAtCell(r, c);
      if (val !== '' && val !== null && typeof val !== 'undefined') {
        return false;
      }
    }
    return true;
  },
  observeDOMVisibility: true,
  allowInvalid: true,
  invalidCellClassName: 'htInvalid',
  placeholderCellClassName: 'htPlaceholder',
  readOnlyCellClassName: 'htDimmed',
  fragmentSelection: false,
  readOnly: false,
  type: 'text',
  copyable: true,
  debug: false, //shows debug overlays in Walkontable
  wordWrap: true,
  noWordWrapClassName: 'htNoWrap'
};
Handsontable.DefaultSettings = DefaultSettings;

$.fn.handsontable = function (action) {
  var i
    , ilen
    , args
    , output
    , userSettings
    , $this = this.first() // Use only first element from list
    , instance = $this.data('handsontable');

  // Init case
  if (typeof action !== 'string') {
    userSettings = action || {};
    if (instance) {
      instance.updateSettings(userSettings);
    }
    else {
      instance = new Handsontable.Core($this, userSettings);
      $this.data('handsontable', instance);
      instance.init();
    }

    return $this;
  }
  // Action case
  else {
    args = [];
    if (arguments.length > 1) {
      for (i = 1, ilen = arguments.length; i < ilen; i++) {
        args.push(arguments[i]);
      }
    }

    if (instance) {
      if (typeof instance[action] !== 'undefined') {
        output = instance[action].apply(instance, args);
      }
      else {
        throw new Error('Handsontable do not provide action: ' + action);
      }
    }

    return output;
  }
};

(function (window) {
  'use strict';

  function MultiMap() {
    var map = {
      arrayMap: [],
      weakMap: new WeakMap()
    };

    return {
      'get': function (key) {
        if (canBeAnArrayMapKey(key)) {
          return map.arrayMap[key];
        } else if (canBeAWeakMapKey(key)) {
          return map.weakMap.get(key);
        }
      },

      'set': function (key, value) {
        if (canBeAnArrayMapKey(key)) {
          map.arrayMap[key] = value;
        } else if (canBeAWeakMapKey(key)) {
          map.weakMap.set(key, value);
        } else {
          throw new Error('Invalid key type');
        }


      },

      'delete': function (key) {
        if (canBeAnArrayMapKey(key)) {
          delete map.arrayMap[key];
        } else if (canBeAWeakMapKey(key)) {
          map.weakMap['delete'](key);  //Delete must be called using square bracket notation, because IE8 does not handle using `delete` with dot notation
        }
      }
    };



    function canBeAnArrayMapKey(obj){
      return obj !== null && !isNaNSymbol(obj) && (typeof obj == 'string' || typeof obj == 'number');
    }

    function canBeAWeakMapKey(obj){
      return obj !== null && (typeof obj == 'object' || typeof obj == 'function');
    }

    function isNaNSymbol(obj){
      return obj !== obj; // NaN === NaN is always false
    }

  }

  if (!window.MultiMap){
    window.MultiMap = MultiMap;
  }

})(window);
/**
 * DOM helper optimized for maximum performance
 * It is recommended for Handsontable plugins and renderers, because it is much faster than jQuery
 * @type {Object}
 */
if(!window.Handsontable) {
  var Handsontable = {}; //required because Walkontable test suite uses this class directly
}
Handsontable.Dom = {};

//goes up the DOM tree (including given element) until it finds an element that matches the nodeName
Handsontable.Dom.closest = function (elem, nodeNames, until) {
  while (elem != null && elem !== until) {
    if (elem.nodeType === 1 && nodeNames.indexOf(elem.nodeName) > -1) {
      return elem;
    }
    elem = elem.parentNode;
  }
  return null;
};

//goes up the DOM tree and checks if element is child of another element
Handsontable.Dom.isChildOf = function (child, parent) {
  var node = child.parentNode;
  while (node != null) {
    if (node == parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};

/**
 * Counts index of element within its parent
 * WARNING: for performance reasons, assumes there are only element nodes (no text nodes). This is true for Walkotnable
 * Otherwise would need to check for nodeType or use previousElementSibling
 * @see http://jsperf.com/sibling-index/10
 * @param {Element} elem
 * @return {Number}
 */
Handsontable.Dom.index = function (elem) {
  var i = 0;
  while (elem = elem.previousSibling) {
    ++i
  }
  return i;
};

if (document.documentElement.classList) {
  // HTML5 classList API
  Handsontable.Dom.hasClass = function (ele, cls) {
    return ele.classList.contains(cls);
  };

  Handsontable.Dom.addClass = function (ele, cls) {
    ele.classList.add(cls);
  };

  Handsontable.Dom.removeClass = function (ele, cls) {
    ele.classList.remove(cls);
  };
}
else {
  //http://snipplr.com/view/3561/addclass-removeclass-hasclass/
  Handsontable.Dom.hasClass = function (ele, cls) {
    return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
  };

  Handsontable.Dom.addClass = function (ele, cls) {
    if (!this.hasClass(ele, cls)) ele.className += " " + cls;
  };

  Handsontable.Dom.removeClass = function (ele, cls) {
    if (this.hasClass(ele, cls)) { //is this really needed?
      var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
      ele.className = ele.className.replace(reg, ' ').trim(); //String.prototype.trim is defined in polyfill.js
    }
  };
}

/*//http://net.tutsplus.com/tutorials/javascript-ajax/javascript-from-null-cross-browser-event-binding/
 Handsontable.Dom.addEvent = (function () {
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

 Handsontable.Dom.triggerEvent = function (element, eventName, target) {
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

 if (document.createEvent) {
 target.dispatchEvent(event);
 } else {
 target.fireEvent("on" + event.eventType, event);
 }
 };*/

Handsontable.Dom.removeTextNodes = function (elem, parent) {
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

/**
 * Remove childs function
 * WARNING - this doesn't unload events and data attached by jQuery
 * http://jsperf.com/jquery-html-vs-empty-vs-innerhtml/9
 * http://jsperf.com/jquery-html-vs-empty-vs-innerhtml/11 - no siginificant improvement with Chrome remove() method
 * @param element
 * @returns {void}
 */
//
Handsontable.Dom.empty = function (element) {
  var child;
  while (child = element.lastChild) {
    element.removeChild(child);
  }
};

Handsontable.Dom.HTML_CHARACTERS = /(<(.*)>|&(.*);)/;

/**
 * Insert content into element trying avoid innerHTML method.
 * @return {void}
 */
Handsontable.Dom.fastInnerHTML = function (element, content) {
  if (this.HTML_CHARACTERS.test(content)) {
    element.innerHTML = content;
  }
  else {
    this.fastInnerText(element, content);
  }
};

/**
 * Insert text content into element
 * @return {void}
 */
if (document.createTextNode('test').textContent) { //STANDARDS
  Handsontable.Dom.fastInnerText = function (element, content) {
    var child = element.firstChild;
    if (child && child.nodeType === 3 && child.nextSibling === null) {
      //fast lane - replace existing text node
      //http://jsperf.com/replace-text-vs-reuse
      child.textContent = content;
    }
    else {
      //slow lane - empty element and insert a text node
      this.empty(element);
      element.appendChild(document.createTextNode(content));
    }
  };
}
else { //IE8
  Handsontable.Dom.fastInnerText = function (element, content) {
    var child = element.firstChild;
    if (child && child.nodeType === 3 && child.nextSibling === null) {
      //fast lane - replace existing text node
      //http://jsperf.com/replace-text-vs-reuse
      child.data = content;
    }
    else {
      //slow lane - empty element and insert a text node
      this.empty(element);
      element.appendChild(document.createTextNode(content));
    }
  };
}

/**
 * Returns true/false depending if element has offset parent
 * @param elem
 * @returns {boolean}
 */
/*if (document.createTextNode('test').textContent) { //STANDARDS
  Handsontable.Dom.hasOffsetParent = function (elem) {
    return !!elem.offsetParent;
  }
}
else {
  Handsontable.Dom.hasOffsetParent = function (elem) {
    try {
      if (!elem.offsetParent) {
        return false;
      }
    }
    catch (e) {
      return false; //IE8 throws "Unspecified error" when offsetParent is not found - we catch it here
    }
    return true;
  }
}*/

/**
 * Returns true if element is attached to the DOM and visible, false otherwise
 * @param elem
 * @returns {boolean}
 */
Handsontable.Dom.isVisible = function (elem) {
  //fast method according to benchmarks, but requires layout so slow in our case
  /*
  if (!Handsontable.Dom.hasOffsetParent(elem)) {
    return false; //fixes problem with UI Bootstrap <tabs> directive
  }

//  if (elem.offsetWidth > 0 || (elem.parentNode && elem.parentNode.offsetWidth > 0)) { //IE10 was mistaken here
  if (elem.offsetWidth > 0) {
    return true;
  }
  */

  //slow method
  var next = elem;
  while (next !== document.documentElement) { //until <html> reached
    if (next === null) { //parent detached from DOM
      return false;
    }
    else if (next.nodeType === 11) {  //nodeType == 1 -> DOCUMENT_FRAGMENT_NODE
      if (next.host) { //this is Web Components Shadow DOM
        //see: http://w3c.github.io/webcomponents/spec/shadow/#encapsulation
        //according to spec, should be if (next.ownerDocument !== window.document), but that doesn't work yet
        if (next.host.impl) { //Chrome 33.0.1723.0 canary (2013-11-29) Web Platform features disabled
          return Handsontable.Dom.isVisible(next.host.impl);
        }
        else if (next.host) { //Chrome 33.0.1723.0 canary (2013-11-29) Web Platform features enabled
          return Handsontable.Dom.isVisible(next.host);
        }
        else {
          throw new Error("Lost in Web Components world");
        }
      }
      else {
        return false; //this is a node detached from document in IE8
      }
    }
    else if (next.style.display === 'none') {
      return false;
    }
    next = next.parentNode;
  }
  return true;
};

/**
 * Returns elements top and left offset relative to the document. In our usage case compatible with jQuery but 2x faster
 * @param {HTMLElement} elem
 * @return {Object}
 */
Handsontable.Dom.offset = function (elem) {
  if (this.hasCaptionProblem() && elem.firstChild && elem.firstChild.nodeName === 'CAPTION') {
    //fixes problem with Firefox ignoring <caption> in TABLE offset (see also Handsontable.Dom.outerHeight)
    //http://jsperf.com/offset-vs-getboundingclientrect/8
    var box = elem.getBoundingClientRect();
    return {
      top: box.top + (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0),
      left: box.left + (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0)
    };
  }

  var offsetLeft = elem.offsetLeft
    , offsetTop = elem.offsetTop
    , lastElem = elem;

  while (elem = elem.offsetParent) {
    if (elem === document.body) { //from my observation, document.body always has scrollLeft/scrollTop == 0
      break;
    }
    offsetLeft += elem.offsetLeft;
    offsetTop += elem.offsetTop;
    lastElem = elem;
  }

  if (lastElem && lastElem.style.position === 'fixed') { //slow - http://jsperf.com/offset-vs-getboundingclientrect/6
    //if(lastElem !== document.body) { //faster but does gives false positive in Firefox
    offsetLeft += window.pageXOffset || document.documentElement.scrollLeft;
    offsetTop += window.pageYOffset || document.documentElement.scrollTop;
  }

  return {
    left: offsetLeft,
    top: offsetTop
  };
};

Handsontable.Dom.getWindowScrollTop = function () {
  var res = window.scrollY;
  if (res == void 0) { //IE8-11
    res = document.documentElement.scrollTop;
  }
  return res;
};

Handsontable.Dom.getWindowScrollLeft = function () {
  var res = window.scrollX;
  if (res == void 0) { //IE8-11
    res = document.documentElement.scrollLeft;
  }
  return res;
};

Handsontable.Dom.getScrollTop = function (elem) {
  if (elem === window) {
    return Handsontable.Dom.getWindowScrollTop(elem);
  }
  else {
    return elem.scrollTop;
  }
};

Handsontable.Dom.getScrollLeft = function (elem) {
  if (elem === window) {
    return Handsontable.Dom.getWindowScrollLeft(elem);
  }
  else {
    return elem.scrollLeft;
  }
};

Handsontable.Dom.getComputedStyle = function (elem) {
  return elem.currentStyle || document.defaultView.getComputedStyle(elem);
};

Handsontable.Dom.outerWidth = function (elem) {
  return elem.offsetWidth;
};

Handsontable.Dom.outerHeight = function (elem) {
  if (this.hasCaptionProblem() && elem.firstChild && elem.firstChild.nodeName === 'CAPTION') {
    //fixes problem with Firefox ignoring <caption> in TABLE.offsetHeight
    //jQuery (1.10.1) still has this unsolved
    //may be better to just switch to getBoundingClientRect
    //http://bililite.com/blog/2009/03/27/finding-the-size-of-a-table/
    //http://lists.w3.org/Archives/Public/www-style/2009Oct/0089.html
    //http://bugs.jquery.com/ticket/2196
    //http://lists.w3.org/Archives/Public/www-style/2009Oct/0140.html#start140
    return elem.offsetHeight + elem.firstChild.offsetHeight;
  }
  else {
    return elem.offsetHeight;
  }
};

(function () {
  var hasCaptionProblem;

  function detectCaptionProblem() {
    var TABLE = document.createElement('TABLE');
    TABLE.style.borderSpacing = 0;
    TABLE.style.borderWidth = 0;
    TABLE.style.padding = 0;
    var TBODY = document.createElement('TBODY');
    TABLE.appendChild(TBODY);
    TBODY.appendChild(document.createElement('TR'));
    TBODY.firstChild.appendChild(document.createElement('TD'));
    TBODY.firstChild.firstChild.innerHTML = '<tr><td>t<br>t</td></tr>';

    var CAPTION = document.createElement('CAPTION');
    CAPTION.innerHTML = 'c<br>c<br>c<br>c';
    CAPTION.style.padding = 0;
    CAPTION.style.margin = 0;
    TABLE.insertBefore(CAPTION, TBODY);

    document.body.appendChild(TABLE);
    hasCaptionProblem = (TABLE.offsetHeight < 2 * TABLE.lastChild.offsetHeight); //boolean
    document.body.removeChild(TABLE);
  }

  Handsontable.Dom.hasCaptionProblem = function () {
    if (hasCaptionProblem === void 0) {
      detectCaptionProblem();
    }
    return hasCaptionProblem;
  };

  /**
   * Returns caret position in text input
   * @author http://stackoverflow.com/questions/263743/how-to-get-caret-position-in-textarea
   * @return {Number}
   */
  Handsontable.Dom.getCaretPosition = function (el) {
    if (el.selectionStart) {
      return el.selectionStart;
    }
    else if (document.selection) { //IE8
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
  };

  /**
   * Sets caret position in text input
   * @author http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/
   * @param {Element} el
   * @param {Number} pos
   * @param {Number} endPos
   */
  Handsontable.Dom.setCaretPosition = function (el, pos, endPos) {
    if (endPos === void 0) {
      endPos = pos;
    }
    if (el.setSelectionRange) {
      el.focus();
      el.setSelectionRange(pos, endPos);
    }
    else if (el.createTextRange) { //IE8
      var range = el.createTextRange();
      range.collapse(true);
      range.moveEnd('character', endPos);
      range.moveStart('character', pos);
      range.select();
    }
  };

  var cachedScrollbarWidth;
  //http://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes
  function walkontableCalculateScrollbarWidth() {
    var inner = document.createElement('p');
    inner.style.width = "100%";
    inner.style.height = "200px";

    var outer = document.createElement('div');
    outer.style.position = "absolute";
    outer.style.top = "0px";
    outer.style.left = "0px";
    outer.style.visibility = "hidden";
    outer.style.width = "200px";
    outer.style.height = "150px";
    outer.style.overflow = "hidden";
    outer.appendChild(inner);

    (document.body || document.documentElement).appendChild(outer);
    var w1 = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    var w2 = inner.offsetWidth;
    if (w1 == w2) w2 = outer.clientWidth;

    (document.body || document.documentElement).removeChild(outer);

    return (w1 - w2);
  }

  /**
   * Returns the computed width of the native browser scroll bar
   * @return {Number} width
   */
  Handsontable.Dom.getScrollbarWidth = function () {
    if (cachedScrollbarWidth === void 0) {
      cachedScrollbarWidth = walkontableCalculateScrollbarWidth();
    }
    return cachedScrollbarWidth;
  }
})();

/**
 * Handsontable TableView constructor
 * @param {Object} instance
 */
Handsontable.TableView = function (instance) {
  var that = this
    , $window = $(window)
    , $documentElement = $(document.documentElement);

  this.instance = instance;
  this.settings = instance.getSettings();

  instance.rootElement.data('originalStyle', instance.rootElement[0].getAttribute('style')); //needed to retrieve original style in jsFiddle link generator in HT examples. may be removed in future versions
  // in IE7 getAttribute('style') returns an object instead of a string, but we only support IE8+

  instance.rootElement.addClass('handsontable');

  var table = document.createElement('TABLE');
  table.className = 'htCore';
  this.THEAD = document.createElement('THEAD');
  table.appendChild(this.THEAD);
  this.TBODY = document.createElement('TBODY');
  table.appendChild(this.TBODY);

  instance.$table = $(table);
  instance.container.prepend(instance.$table);

  instance.rootElement.on('mousedown.handsontable', function (event) {
    if (!that.isTextSelectionAllowed(event.target)) {
      clearTextSelection();
      event.preventDefault();
      window.focus(); //make sure that window that contains HOT is active. Important when HOT is in iframe.
    }
  });

  $documentElement.on('keyup.' + instance.guid, function (event) {
    if (instance.selection.isInProgress() && !event.shiftKey) {
      instance.selection.finish();
    }
  });

  var isMouseDown;

  $documentElement.on('mouseup.' + instance.guid, function (event) {
    if (instance.selection.isInProgress() && event.which === 1) { //is left mouse button
      instance.selection.finish();
    }

    isMouseDown = false;

    if (instance.autofill.handle && instance.autofill.handle.isDragged) {
      if (instance.autofill.handle.isDragged > 1) {
        instance.autofill.apply();
      }
      instance.autofill.handle.isDragged = 0;
    }

    if (Handsontable.helper.isOutsideInput(document.activeElement)) {
      instance.unlisten();
    }
  });

  $documentElement.on('mousedown.' + instance.guid, function (event) {
    var next = event.target;

    if (next.shadowRoot) {
      return; //click inside Web Component
    }

    if (next !== that.wt.wtTable.spreader) { //immediate click on "spreader" means click on the right side of vertical scrollbar
      while (next !== document.documentElement) {
        if (next === null) {
          return; //click on something that was a row but now is detached (possibly because your click triggered a rerender)
        }
        if (next === instance.rootElement[0]) {
          return; //click inside container
        }
        next = next.parentNode;
      }
    }

    //function did not return until here, we have an outside click!

    if (that.settings.outsideClickDeselects) {
      instance.deselectCell();
    }
    else {
      instance.destroyEditor();
    }
  });

  instance.$table.on('selectstart', function (event) {
    if (that.settings.fragmentSelection) {
      return;
    }

    //https://github.com/handsontable/jquery-handsontable/issues/160
    //selectstart is IE only event. Prevent text from being selected when performing drag down in IE8
    event.preventDefault();
  });

  var clearTextSelection = function () {
    //http://stackoverflow.com/questions/3169786/clear-text-selection-with-javascript
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {  // IE?
      document.selection.empty();
    }
  };

  var walkontableConfig = {
    debug: function () {
      return that.settings.debug;
    },
    table: table,
    stretchH: this.settings.stretchH,
    data: instance.getDataAtCell,
    totalRows: instance.countRows,
    totalColumns: instance.countCols,
    offsetRow: 0,
    offsetColumn: 0,
    fixedColumnsLeft: function () {
      return that.settings.fixedColumnsLeft;
    },
    fixedRowsTop: function () {
      return that.settings.fixedRowsTop;
    },
    renderAllRows: that.settings.renderAllRows,
    rowHeaders: function () {
      return instance.hasRowHeaders() ? [function (index, TH) {
        that.appendRowHeader(index, TH);
      }] : []
    },
    columnHeaders: function () {
      return instance.hasColHeaders() ? [function (index, TH) {
        that.appendColHeader(index, TH);
      }] : []
    },
    columnWidth: instance.getColWidth,
    rowHeight: instance.getRowHeight,
    cellRenderer: function (row, col, TD) {

      var prop = that.instance.colToProp(col)
        , cellProperties = that.instance.getCellMeta(row, col)
        , renderer = that.instance.getCellRenderer(cellProperties);

      var value = that.instance.getDataAtRowProp(row, prop);

      renderer(that.instance, TD, row, col, prop, value, cellProperties);

      Handsontable.hooks.run(that.instance, 'afterRenderer', TD, row, col, prop, value, cellProperties);

    },
    selections: {
      current: {
        className: 'current',
        border: {
          width: 2,
          color: '#5292F7',
          style: 'solid',
          cornerVisible: function () {
            return that.settings.fillHandle && !that.isCellEdited() && !instance.selection.isMultiple()
          }
        }
      },
      area: {
        className: 'area',
        border: {
          width: 1,
          color: '#89AFF9',
          style: 'solid',
          cornerVisible: function () {
            return that.settings.fillHandle && !that.isCellEdited() && instance.selection.isMultiple()
          }
        }
      },
      highlight: {
        highlightRowClassName: that.settings.currentRowClassName,
        highlightColumnClassName: that.settings.currentColClassName
      },
      fill: {
        className: 'fill',
        border: {
          width: 1,
          color: 'red',
          style: 'solid'
        }
      }
    },
    hideBorderOnMouseDownOver: function () {
      return that.settings.fragmentSelection;
    },
    onCellMouseDown: function (event, coords, TD, wt) {
      instance.listen();
      that.activeWt = wt;

      isMouseDown = true;

      if (event.target.className === 'manualColumnMover') {
        return;
      }

      if (event.button === 2 && instance.selection.inInSelection(coords)) { //right mouse button
        //do nothing
      }
      else if (event.shiftKey) {
        if (coords.row >= 0 && coords.col >= 0) {
          instance.selection.setRangeEnd(coords);
        }
      }
      else {
        if (coords.row < 0 || coords.col < 0) {
          if (coords.row < 0) {
            instance.selectCell(0, coords.col, instance.countRows() - 1, coords.col);
          }
          if (coords.col < 0) {
            instance.selectCell(coords.row, 0, coords.row, instance.countCols() - 1);
          }
        }
        else {
          instance.selection.setRangeStart(coords);
        }
      }

      Handsontable.hooks.run(instance, 'afterOnCellMouseDown', event, coords, TD);

      that.activeWt = that.wt;
    },
    /*onCellMouseOut: function (/*event, coords, TD* /) {
     if (isMouseDown && that.settings.fragmentSelection === 'single') {
     clearTextSelection(); //otherwise text selection blinks during multiple cells selection
     }
     },*/
    onCellMouseOver: function (event, coords, TD, wt) {
      that.activeWt = wt;
      if (coords.row >= 0 && coords.col >= 0) { //is not a header
        if (isMouseDown) {
          /*if (that.settings.fragmentSelection === 'single') {
           clearTextSelection(); //otherwise text selection blinks during multiple cells selection
           }*/
          instance.selection.setRangeEnd(coords);
        }
        else if (instance.autofill.handle && instance.autofill.handle.isDragged) {
          instance.autofill.handle.isDragged++;
          instance.autofill.showBorder(coords);
        }
      }
      Handsontable.hooks.run(instance, 'afterOnCellMouseOver', event, coords, TD);
      that.activeWt = that.wt;
    },
    onCellCornerMouseDown: function (event) {
      instance.autofill.handle.isDragged = 1;
      event.preventDefault();
      Handsontable.hooks.run(instance, 'afterOnCellCornerMouseDown', event);
    },
    onCellCornerDblClick: function () {
      instance.autofill.selectAdjacent();
    },
    beforeDraw: function (force) {
      that.beforeRender(force);
    },
    onDraw: function(force){
      that.onDraw(force);
    },
    onScrollVertically: function () {
      instance.runHooks('afterScrollVertically');
    },
    onScrollHorizontally: function () {
      instance.runHooks('afterScrollHorizontally');
    }
  };

  Handsontable.hooks.run(instance, 'beforeInitWalkontable', walkontableConfig);

  this.wt = new Walkontable(walkontableConfig);
  this.activeWt = this.wt;

  /*$window.on('resize.' + instance.guid, function () {
    instance._registerTimeout('resizeTimeout', function () {
      instance.forceFullRender = true;
      that.render();
    }, 60);
  });*/

  $(that.wt.wtTable.spreader).on('mousedown.handsontable, contextmenu.handsontable', function (event) {
    if (event.target === that.wt.wtTable.spreader && event.which === 3) { //right mouse button exactly on spreader means right clickon the right hand side of vertical scrollbar
      event.stopPropagation();
    }
  });

  $documentElement.on('click.' + instance.guid, function () {
    if (that.settings.observeDOMVisibility) {
      if (that.wt.drawInterrupted) {
        that.instance.forceFullRender = true;
        that.render();
      }
    }
  });
};

Handsontable.TableView.prototype.isTextSelectionAllowed = function (el) {
  if ( Handsontable.helper.isInput(el) ) {
    return (true);
  }
  if (this.settings.fragmentSelection && Handsontable.Dom.isChildOf(el, this.TBODY)) {
    return (true);
  }
  return false;
};

Handsontable.TableView.prototype.isCellEdited = function () {
  var activeEditor = this.instance.getActiveEditor();
  return activeEditor && activeEditor.isOpened();
};

Handsontable.TableView.prototype.getWidth = function () {
  return this.wt.wtViewport.getWorkspaceActualWidth();
};

Handsontable.TableView.prototype.getHeight = function () {
  return this.wt.wtViewport.getWorkspaceActualHeight();
};

Handsontable.TableView.prototype.beforeRender = function (force) {
  if (force) { //force = did Walkontable decide to do full render
    Handsontable.hooks.run(this.instance, 'beforeRender', this.instance.forceFullRender); //this.instance.forceFullRender = did Handsontable request full render?
  }
};

Handsontable.TableView.prototype.onDraw = function(force){
  if (force) { //force = did Walkontable decide to do full render
    Handsontable.hooks.run(this.instance, 'afterRender', this.instance.forceFullRender); //this.instance.forceFullRender = did Handsontable request full render?
  }
};

Handsontable.TableView.prototype.render = function () {
  this.wt.draw(!this.instance.forceFullRender);
  this.instance.forceFullRender = false;
  this.instance.rootElement.triggerHandler('render.handsontable');
};

/**
 * Returns td object given coordinates
 * @param {WalkontableCellCoords} coords
 */
Handsontable.TableView.prototype.getCellAtCoords = function (coords) {
  var td = this.wt.wtTable.getCell(coords);
  if (td < 0) { //there was an exit code (cell is out of bounds)
    return null;
  }
  else {
    return td;
  }
};

/**
 * Scroll viewport to selection
 * @param {WalkontableCellCoords} coords
 */
Handsontable.TableView.prototype.scrollViewport = function (coords) {
  this.wt.scrollViewport(coords);
};

/**
 * Append row header to a TH element
 * @param row
 * @param TH
 */
Handsontable.TableView.prototype.appendRowHeader = function (row, TH) {
  if (row > -1) {
    Handsontable.Dom.fastInnerHTML(TH, this.instance.getRowHeader(row));
  }
  else {
    var DIV = document.createElement('DIV');
    DIV.className = 'relative';
    Handsontable.Dom.fastInnerText(DIV, '\u00A0');
    Handsontable.Dom.empty(TH);
    TH.appendChild(DIV);
  }
};

/**
 * Append column header to a TH element
 * @param col
 * @param TH
 */
Handsontable.TableView.prototype.appendColHeader = function (col, TH) {
  var DIV = document.createElement('DIV')
    , SPAN = document.createElement('SPAN');

  DIV.className = 'relative';
  SPAN.className = 'colHeader';

  Handsontable.Dom.fastInnerHTML(SPAN, this.instance.getColHeader(col));
  DIV.appendChild(SPAN);

  Handsontable.Dom.empty(TH);
  TH.appendChild(DIV);
  Handsontable.hooks.run(this.instance, 'afterGetColHeader', col, TH);
};

/**
 * Given a element's left position relative to the viewport, returns maximum element width until the right edge of the viewport (before scrollbar)
 * @param {Number} left
 * @return {Number}
 */
Handsontable.TableView.prototype.maximumVisibleElementWidth = function (leftOffset) {
  this.wt.wtScrollbars.horizontal.readWindowSize();
  var workspaceWidth = this.wt.wtViewport.getWorkspaceWidth();
  var maxWidth = workspaceWidth - leftOffset;
  return maxWidth > 0 ? maxWidth : 0;
};

/**
 * Given a element's top position relative to the viewport, returns maximum element height until the bottom edge of the viewport (before scrollbar)
 * @param {Number} topOffset
 * @return {Number}
 */
Handsontable.TableView.prototype.maximumVisibleElementHeight = function (topOffset) {
  this.wt.wtScrollbars.vertical.readWindowSize();
  var workspaceHeight = this.wt.wtViewport.getWorkspaceHeight();
  var maxHeight = workspaceHeight - topOffset;
  return maxHeight > 0 ? maxHeight : 0;
};

Handsontable.TableView.prototype.mainViewIsActive = function () {
  return this.wt === this.activeWt;
};

/**
 * Utility to register editors and common namespace for keeping reference to all editor classes
 */
(function (Handsontable) {
  'use strict';

  function RegisteredEditor(editorClass) {
    var clazz, instances;

    instances = {};
    clazz = editorClass;

    this.getInstance = function (hotInstance) {
      if (!(hotInstance.guid in instances)) {
        instances[hotInstance.guid] = new clazz(hotInstance);
      }

      return instances[hotInstance.guid];
    }

  }

  var registeredEditorNames = {};
  var registeredEditorClasses = new WeakMap();

  Handsontable.editors = {

    /**
     * Registers editor under given name
     * @param {String} editorName
     * @param {Function} editorClass
     */
    registerEditor: function (editorName, editorClass) {
      var editor = new RegisteredEditor(editorClass);
      if (typeof editorName === "string") {
        registeredEditorNames[editorName] = editor;
      }
      registeredEditorClasses.set(editorClass, editor);
    },

    /**
     * Returns instance (singleton) of editor class
     * @param {String|Function} editorName/editorClass
     * @returns {Function} editorClass
     */
    getEditor: function (editorName, hotInstance) {
      var editor;
      if (typeof editorName == 'function') {
        if (!(registeredEditorClasses.get(editorName))) {
          this.registerEditor(null, editorName);
        }
        editor = registeredEditorClasses.get(editorName);
      }
      else if (typeof editorName == 'string') {
        editor = registeredEditorNames[editorName];
      }
      else {
        throw Error('Only strings and functions can be passed as "editor" parameter ');
      }

      if (!editor) {
        throw Error('No editor registered under name "' + editorName + '"');
      }

      return editor.getInstance(hotInstance);
    }

  };


})(Handsontable);

(function(Handsontable){
  'use strict';

  Handsontable.EditorManager = function(instance, priv, selection){
    var that = this;
    var $document = $(document);
    var keyCodes = Handsontable.helper.keyCode;

    var activeEditor;

    var init = function () {

      function onKeyDown(event) {

        if (!instance.isListening()) {
          return;
        }

        if (priv.settings.beforeOnKeyDown) { // HOT in HOT Plugin
          priv.settings.beforeOnKeyDown.call(instance, event);
        }

        Handsontable.hooks.run(instance, 'beforeKeyDown', event);

        if (!event.isImmediatePropagationStopped()) {

          priv.lastKeyCode = event.keyCode;
          if (selection.isSelected()) {
            var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)

            if (!activeEditor.isWaiting()) {
              if (!Handsontable.helper.isMetaKey(event.keyCode) && !ctrlDown && !that.isEditorOpened()) {
                that.openEditor('');
                event.stopPropagation(); //required by HandsontableEditor
                return;
              }
            }

            var rangeModifier = event.shiftKey ? selection.setRangeEnd : selection.setRangeStart;

              switch (event.keyCode) {

                case keyCodes.A:
                  if (ctrlDown) {
                    selection.selectAll(); //select all cells

                    event.preventDefault();
                    event.stopPropagation();
                    break;
                  }

                case keyCodes.ARROW_UP:

                  if (that.isEditorOpened() && !activeEditor.isWaiting()){
                    that.closeEditorAndSaveChanges(ctrlDown);
                  }

                  moveSelectionUp(event.shiftKey);

                  event.preventDefault();
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.ARROW_DOWN:
                  if (that.isEditorOpened() && !activeEditor.isWaiting()){
                    that.closeEditorAndSaveChanges(ctrlDown);
                  }

                  moveSelectionDown(event.shiftKey);

                  event.preventDefault();
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.ARROW_RIGHT:
                  if(that.isEditorOpened()  && !activeEditor.isWaiting()){
                    that.closeEditorAndSaveChanges(ctrlDown);
                  }

                  moveSelectionRight(event.shiftKey);

                  event.preventDefault();
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.ARROW_LEFT:
                  if(that.isEditorOpened() && !activeEditor.isWaiting()){
                    that.closeEditorAndSaveChanges(ctrlDown);
                  }

                  moveSelectionLeft(event.shiftKey);

                  event.preventDefault();
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.TAB:
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

                case keyCodes.BACKSPACE:
                case keyCodes.DELETE:
                  selection.empty(event);
                  that.prepareEditor();
                  event.preventDefault();
                  break;

                case keyCodes.F2: /* F2 */
                  that.openEditor();
                  event.preventDefault(); //prevent Opera from opening Go to Page dialog
                  break;

                case keyCodes.ENTER: /* return/enter */
                  if(that.isEditorOpened()){

                    if (activeEditor.state !== Handsontable.EditorState.WAITING){
                      that.closeEditorAndSaveChanges(ctrlDown);
                    }

                    moveSelectionAfterEnter(event.shiftKey);

                  } else {

                    if (instance.getSettings().enterBeginsEditing){
                      that.openEditor();
                    } else {
                      moveSelectionAfterEnter(event.shiftKey);
                    }

                  }

                  event.preventDefault(); //don't add newline to field
                  event.stopImmediatePropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.ESCAPE:
                  if(that.isEditorOpened()){
                    that.closeEditorAndRestoreOriginalValue(ctrlDown);
                  }
                  event.preventDefault();
                  break;

                case keyCodes.HOME:
                  if (event.ctrlKey || event.metaKey) {
                    rangeModifier(new WalkontableCellCoords(0, priv.selRange.from.col));
                  }
                  else {
                    rangeModifier(new WalkontableCellCoords(priv.selRange.from.row, 0));
                  }
                  event.preventDefault(); //don't scroll the window
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.END:
                  if (event.ctrlKey || event.metaKey) {
                    rangeModifier(new WalkontableCellCoords(instance.countRows() - 1, priv.selRange.from.col));
                  }
                  else {
                    rangeModifier(new WalkontableCellCoords(priv.selRange.from.row, instance.countCols() - 1));
                  }
                  event.preventDefault(); //don't scroll the window
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.PAGE_UP:
                  selection.transformStart(-instance.countVisibleRows(), 0);
                  instance.view.wt.scrollVertical(-instance.countVisibleRows());
                  instance.view.render();
                  event.preventDefault(); //don't page up the window
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.PAGE_DOWN:
                  selection.transformStart(instance.countVisibleRows(), 0);
                  instance.view.wt.scrollVertical(instance.countVisibleRows());
                  instance.view.render();
                  event.preventDefault(); //don't page down the window
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                default:
                  break;
              }

          }
        }
      }
      $document.on('keydown.handsontable.' + instance.guid, onKeyDown);

      function onDblClick(event, coords, elem) {
        if(elem.nodeName == "TD") { //may be TD or TH
          //that.instance.destroyEditor();
          that.openEditor();
        }
      }

      instance.view.wt.update('onCellDblClick', onDblClick);

      instance.addHook('afterDestroy', function(){
        $document.off('keydown.handsontable.' + instance.guid);
      });

      function moveSelectionAfterEnter(shiftKey){
        var enterMoves = typeof priv.settings.enterMoves === 'function' ? priv.settings.enterMoves(event) : priv.settings.enterMoves;

        if (shiftKey) {
          selection.transformStart(-enterMoves.row, -enterMoves.col); //move selection up
        }
        else {
          selection.transformStart(enterMoves.row, enterMoves.col, true); //move selection down (add a new row if needed)
        }
      }

      function moveSelectionUp(shiftKey){
        if (shiftKey) {
          selection.transformEnd(-1, 0);
        }
        else {
          selection.transformStart(-1, 0);
        }
      }

      function moveSelectionDown(shiftKey){
        if (shiftKey) {
          selection.transformEnd(1, 0); //expanding selection down with shift
        }
        else {
          selection.transformStart(1, 0); //move selection down
        }
      }

      function moveSelectionRight(shiftKey){
        if (shiftKey) {
          selection.transformEnd(0, 1);
        }
        else {
          selection.transformStart(0, 1);
        }
      }

      function moveSelectionLeft(shiftKey){
        if (shiftKey) {
          selection.transformEnd(0, -1);
        }
        else {
          selection.transformStart(0, -1);
        }
      }
    };

    /**
     * Destroy current editor, if exists
     * @param {Boolean} revertOriginal
     */
    this.destroyEditor = function (revertOriginal) {
      this.closeEditor(revertOriginal);
    };

    this.getActiveEditor = function () {
      return activeEditor;
    };

    /**
     * Prepare text input to be displayed at given grid cell
     */
    this.prepareEditor = function () {

      if (activeEditor && activeEditor.isWaiting()){

        this.closeEditor(false, false, function(dataSaved){
          if(dataSaved){
            that.prepareEditor();
          }
        });

        return;
      }

      var row = priv.selRange.highlight.row;
      var col = priv.selRange.highlight.col;
      var prop = instance.colToProp(col);
      var td = instance.getCell(row, col);
      var originalValue = instance.getDataAtCell(row, col);
      var cellProperties = instance.getCellMeta(row, col);

      var editorClass = instance.getCellEditor(cellProperties);
      activeEditor = Handsontable.editors.getEditor(editorClass, instance);

      activeEditor.prepare(row, col, prop, td, originalValue, cellProperties);

    };

    this.isEditorOpened = function () {
      return activeEditor.isOpened();
    };

    this.openEditor = function (initialValue) {
      if (!activeEditor.cellProperties.readOnly){
        activeEditor.beginEditing(initialValue);
      }
    };

    this.closeEditor = function (restoreOriginalValue, ctrlDown, callback) {

      if (!activeEditor){
        if(callback) {
          callback(false);
        }
      }
      else {
        activeEditor.finishEditing(restoreOriginalValue, ctrlDown, callback);
      }
    };

    this.closeEditorAndSaveChanges = function(ctrlDown){
      return this.closeEditor(false, ctrlDown);
    };

    this.closeEditorAndRestoreOriginalValue = function(ctrlDown){
      return this.closeEditor(true, ctrlDown);
    };

    init();
  };

})(Handsontable);

/**
 * Utility to register renderers and common namespace for keeping reference to all renderers classes
 */
(function (Handsontable) {
  'use strict';

  var registeredRenderers = {};

  Handsontable.renderers = {

    /**
     * Registers renderer under given name
     * @param {String} rendererName
     * @param {Function} rendererFunction
     */
    registerRenderer: function (rendererName, rendererFunction) {
      registeredRenderers[rendererName] = rendererFunction
    },

    /**
     * @param {String|Function} rendererName/rendererFunction
     * @returns {Function} rendererFunction
     */
    getRenderer: function (rendererName) {
      if (typeof rendererName == 'function'){
        return rendererName;
      }

      if (typeof rendererName != 'string'){
        throw Error('Only strings and functions can be passed as "renderer" parameter ');
      }

      if (!(rendererName in registeredRenderers)) {
        throw Error('No editor registered under name "' + rendererName + '"');
      }

      return registeredRenderers[rendererName];
    }

  };


})(Handsontable);

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

Handsontable.helper.isMetaKey = function (keyCode) {
  var keyCodes = Handsontable.helper.keyCode;
  var metaKeys = [
    keyCodes.ARROW_DOWN,
    keyCodes.ARROW_UP,
    keyCodes.ARROW_LEFT,
    keyCodes.ARROW_RIGHT,
    keyCodes.HOME,
    keyCodes.END,
    keyCodes.DELETE,
    keyCodes.BACKSPACE,
    keyCodes.F1,
    keyCodes.F2,
    keyCodes.F3,
    keyCodes.F4,
    keyCodes.F5,
    keyCodes.F6,
    keyCodes.F7,
    keyCodes.F8,
    keyCodes.F9,
    keyCodes.F10,
    keyCodes.F11,
    keyCodes.F12,
    keyCodes.TAB,
    keyCodes.PAGE_DOWN,
    keyCodes.PAGE_UP,
    keyCodes.ENTER,
    keyCodes.ESCAPE,
    keyCodes.SHIFT,
    keyCodes.CAPS_LOCK,
    keyCodes.ALT
  ];

  return metaKeys.indexOf(keyCode) != -1;
};

Handsontable.helper.isCtrlKey = function (keyCode) {

  var keys = Handsontable.helper.keyCode;

  return [keys.CONTROL_LEFT, 224, keys.COMMAND_LEFT, keys.COMMAND_RIGHT].indexOf(keyCode) != -1;
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
 * Generates spreadsheet-like column names: A, B, C, ..., Z, AA, AB, etc
 * @param index
 * @returns {String}
 */
Handsontable.helper.spreadsheetColumnLabel = function (index) {
  var dividend = index + 1;
  var columnLabel = '';
  var modulo;
  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt((dividend - modulo) / 26, 10);
  }
  return columnLabel;
};

/**
 * Checks if value of n is a numeric one
 * http://jsperf.com/isnan-vs-isnumeric/4
 * @param n
 * @returns {boolean}
 */
Handsontable.helper.isNumeric = function (n) {
    var t = typeof n;
    return t == 'number' ? !isNaN(n) && isFinite(n) :
           t == 'string' ? !n.length ? false :
           n.length == 1 ? /\d/.test(n) :
           /^\s*[+-]?\s*(?:(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?)|(?:0x[a-f\d]+))\s*$/i.test(n) :
           t == 'object' ? !!n && typeof n.valueOf() == "number" && !(n instanceof Date) : false;
};

Handsontable.helper.isArray = function (obj) {
  return Object.prototype.toString.call(obj).match(/array/i) !== null;
};

/**
 * Checks if child is a descendant of given parent node
 * http://stackoverflow.com/questions/2234979/how-to-check-in-javascript-if-one-element-is-a-child-of-another
 * @param parent
 * @param child
 * @returns {boolean}
 */
Handsontable.helper.isDescendant = function (parent, child) {
  var node = child.parentNode;
  while (node != null) {
    if (node == parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};

/**
 * Generates a random hex string. Used as namespace for Handsontable instance events.
 * @return {String} - 16 character random string: "92b1bfc74ec4"
 */
Handsontable.helper.randomString = function () {
  return walkontableRandomString();
};

/**
 * Inherit without without calling parent constructor, and setting `Child.prototype.constructor` to `Child` instead of `Parent`.
 * Creates temporary dummy function to call it as constructor.
 * Described in ticket: https://github.com/handsontable/jquery-handsontable/pull/516
 * @param  {Object} Child  child class
 * @param  {Object} Parent parent class
 * @return {Object}        extended Child
 */
Handsontable.helper.inherit = function (Child, Parent) {
  Parent.prototype.constructor = Parent;
  Child.prototype = new Parent();
  Child.prototype.constructor = Child;
  return Child;
};

/**
 * Perform shallow extend of a target object with extension's own properties
 * @param {Object} target An object that will receive the new properties
 * @param {Object} extension An object containing additional properties to merge into the target
 */
Handsontable.helper.extend = function (target, extension) {
  for (var i in extension) {
    if (extension.hasOwnProperty(i)) {
      target[i] = extension[i];
    }
  }
};

Handsontable.helper.getPrototypeOf = function (obj) {
  var prototype;

  if(typeof obj.__proto__ == "object"){
    prototype = obj.__proto__;
  } else {
    var oldConstructor,
        constructor = obj.constructor;

    if (typeof obj.constructor == "function") {
      oldConstructor = constructor;

      if (delete obj.constructor){
        constructor = obj.constructor; // get real constructor
        obj.constructor = oldConstructor; // restore constructor
      }


    }

    prototype = constructor ? constructor.prototype : null; // needed for IE

  }

  return prototype;
};

/**
 * Factory for columns constructors.
 * @param {Object} GridSettings
 * @param {Array} conflictList
 * @return {Object} ColumnSettings
 */
Handsontable.helper.columnFactory = function (GridSettings, conflictList) {
  function ColumnSettings () {}

  Handsontable.helper.inherit(ColumnSettings, GridSettings);

  // Clear conflict settings
  for (var i = 0, len = conflictList.length; i < len; i++) {
    ColumnSettings.prototype[conflictList[i]] = void 0;
  }

  return ColumnSettings;
};

Handsontable.helper.translateRowsToColumns = function (input) {
  var i
    , ilen
    , j
    , jlen
    , output = []
    , olen = 0;

  for (i = 0, ilen = input.length; i < ilen; i++) {
    for (j = 0, jlen = input[i].length; j < jlen; j++) {
      if (j == olen) {
        output.push([]);
        olen++;
      }
      output[j].push(input[i][j])
    }
  }
  return output;
};

Handsontable.helper.to2dArray = function (arr) {
  var i = 0
    , ilen = arr.length;
  while (i < ilen) {
    arr[i] = [arr[i]];
    i++;
  }
};

Handsontable.helper.extendArray = function (arr, extension) {
  var i = 0
    , ilen = extension.length;
  while (i < ilen) {
    arr.push(extension[i]);
    i++;
  }
};

/**
 * Determines if the given DOM element is an input field.
 * Notice: By 'input' we mean input, textarea and select nodes
 * @param element - DOM element
 * @returns {boolean}
 */
Handsontable.helper.isInput = function (element) {
  var inputs = ['INPUT', 'SELECT', 'TEXTAREA'];

  return inputs.indexOf(element.nodeName) > -1;
}

/**
 * Determines if the given DOM element is an input field placed OUTSIDE of HOT.
 * Notice: By 'input' we mean input, textarea and select nodes
 * @param element - DOM element
 * @returns {boolean}
 */
Handsontable.helper.isOutsideInput = function (element) {
  return Handsontable.helper.isInput(element) && element.className.indexOf('handsontableInput') == -1;
};

Handsontable.helper.keyCode = {
  MOUSE_LEFT: 1,
  MOUSE_RIGHT: 3,
  MOUSE_MIDDLE: 2,
  BACKSPACE: 8,
  COMMA: 188,
  DELETE: 46,
  END: 35,
  ENTER: 13,
  ESCAPE: 27,
  CONTROL_LEFT: 91,
  COMMAND_LEFT: 17,
  COMMAND_RIGHT: 93,
  ALT: 18,
  HOME: 36,
  PAGE_DOWN: 34,
  PAGE_UP: 33,
  PERIOD: 190,
  SPACE: 32,
  SHIFT: 16,
  CAPS_LOCK: 20,
  TAB: 9,
  ARROW_RIGHT: 39,
  ARROW_LEFT: 37,
  ARROW_UP: 38,
  ARROW_DOWN: 40,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  A: 65,
  X: 88,
  C: 67,
  V: 86
};

/**
 * Determines whether given object is a plain Object.
 * Note: String and Array are not plain Objects
 * @param {*} obj
 * @returns {boolean}
 */
Handsontable.helper.isObject = function (obj) {
  return Object.prototype.toString.call(obj) == '[object Object]';
};

/**
 * Determines whether given object is an Array.
 * Note: String is not an Array
 * @param {*} obj
 * @returns {boolean}
 */
Handsontable.helper.isArray = function(obj){
  return Array.isArray ? Array.isArray(obj) : Object.prototype.toString.call(obj) == '[object Array]';
};

Handsontable.helper.pivot = function (arr) {
  var pivotedArr = [];

  if(!arr || arr.length == 0 || !arr[0] || arr[0].length == 0){
    return pivotedArr;
  }

  var rowCount = arr.length;
  var colCount = arr[0].length;

  for(var i = 0; i < rowCount; i++){
    for(var j = 0; j < colCount; j++){
      if(!pivotedArr[j]){
        pivotedArr[j] = [];
      }

      pivotedArr[j][i] = arr[i][j];
    }
  }

  return pivotedArr;

};

Handsontable.helper.proxy = function (fun, context) {
  return function () {
    return fun.apply(context, arguments);
  };
};

/**
 * Factory that produces a function for searching methods (or any properties) which could be defined directly in
 * table configuration or implicitly, within cell type definition.
 *
 * For example: renderer can be defined explicitly using "renderer" property in column configuration or it can be
 * defined implicitly using "type" property.
 *
 * Methods/properties defined explicitly always takes precedence over those defined through "type".
 *
 * If the method/property is not found in an object, searching is continued recursively through prototype chain, until
 * it reaches the Object.prototype.
 *
 *
 * @param methodName {String} name of the method/property to search (i.e. 'renderer', 'validator', 'copyable')
 * @param allowUndefined {Boolean} [optional] if false, the search is continued if methodName has not been found in cell "type"
 * @returns {Function}
 */
Handsontable.helper.cellMethodLookupFactory = function (methodName, allowUndefined) {

  allowUndefined = typeof allowUndefined == 'undefined' ? true : allowUndefined;

  return function cellMethodLookup (row, col) {

    return (function getMethodFromProperties(properties) {

      if (!properties){

        return;                       //method not found

      }
      else if (properties.hasOwnProperty(methodName) && properties[methodName] !== void 0) { //check if it is own and is not empty

        return properties[methodName];  //method defined directly

      } else if (properties.hasOwnProperty('type') && properties.type) { //check if it is own and is not empty

        var type;

        if(typeof properties.type != 'string' ){
          throw new Error('Cell type must be a string ');
        }

        type = translateTypeNameToObject(properties.type);

        if (type.hasOwnProperty(methodName)) {
          return type[methodName]; //method defined in type.
        } else if (allowUndefined) {
          return; //method does not defined in type (eg. validator), returns undefined
        }

      }

      return getMethodFromProperties(Handsontable.helper.getPrototypeOf(properties));

    })(typeof row == 'number' ? this.getCellMeta(row, col) : row);

  };

  function translateTypeNameToObject(typeName) {
    var type = Handsontable.cellTypes[typeName];

    if(typeof type == 'undefined'){
      throw new Error('You declared cell type "' + typeName + '" as a string that is not mapped to a known object. Cell type must be an object or a string mapped to an object in Handsontable.cellTypes');
    }

    return type;
  }

};

Handsontable.helper.toString = function (obj) {
  return '' + obj;
};
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
            this.propToColCache.set(prop, lastCol);

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
    this.propToColCache = new MultiMap();
    var columns = this.instance.getSettings().columns;
    if (columns) {
      for (i = 0, ilen = columns.length; i < ilen; i++) {

        if (typeof columns[i].data != 'undefined'){
          this.colToPropCache[i] = columns[i].data;
          this.propToColCache.set(columns[i].data, i);
        }

      }
    }
    else {
      this.recursiveDuckColumns(schema);
    }
  };

  Handsontable.DataMap.prototype.colToProp = function (col) {
    col = Handsontable.hooks.execute(this.instance, 'modifyCol', col);
    if (this.colToPropCache && typeof this.colToPropCache[col] !== 'undefined') {
      return this.colToPropCache[col];
    }
    else {
      return col;
    }
  };

  Handsontable.DataMap.prototype.propToCol = function (prop) {
    var col;
    if (typeof this.propToColCache.get(prop) !== 'undefined') {
      col = this.propToColCache.get(prop);
    } else {
      col = prop;
    }
    col = Handsontable.hooks.execute(this.instance, 'modifyCol', col);
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
  Handsontable.DataMap.prototype.createRow = function (index, amount, createdAutomatically) {
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


    Handsontable.hooks.run(this.instance, 'afterCreateRow', index, numberOfCreatedRows, createdAutomatically);
    this.instance.forceFullRender = true; //used when data was changed

    return numberOfCreatedRows;
  };

  /**
   * Creates col at the right of the data array
   * @param {Number} [index] Optional. Index of the column before which the new column will be inserted
   *   * @param {Number} [amount] Optional.
   */
  Handsontable.DataMap.prototype.createCol = function (index, amount, createdAutomatically) {
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

    Handsontable.hooks.run(this.instance, 'afterCreateCol', index, numberOfCreatedCols, createdAutomatically);
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

    var actionWasNotCancelled = Handsontable.hooks.execute(this.instance, 'beforeRemoveRow', index, amount);

    if (actionWasNotCancelled === false) {
      return;
    }

    var data = this.dataSource;
    var newData = data.filter(function (row, index) {
      return logicRows.indexOf(index) == -1;
    });

    data.length = 0;
    Array.prototype.push.apply(data, newData);

    Handsontable.hooks.run(this.instance, 'afterRemoveRow', index, amount);

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

    var actionWasNotCancelled = Handsontable.hooks.execute(this.instance, 'beforeRemoveCol', index, amount);

    if (actionWasNotCancelled === false) {
      return;
    }

    var data = this.dataSource;
    for (var r = 0, rlen = this.instance.countRows(); r < rlen; r++) {
      data[r].splice(index, amount);
    }
    this.priv.columnSettings.splice(index, amount);

    Handsontable.hooks.run(this.instance, 'afterRemoveCol', index, amount);
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
    row = Handsontable.hooks.execute(this.instance, 'modifyRow', row);
    if (typeof prop === 'string' && prop.indexOf('.') > -1) {
      var sliced = prop.split(".");
      var out = this.dataSource[row];
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
    else if (typeof prop === 'function') {
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
      return prop(this.dataSource.slice(
        row,
        row + 1
      )[0]);
    }
    else {
      return this.dataSource[row] ? this.dataSource[row][prop] : null;
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
    row = Handsontable.hooks.execute(this.instance, 'modifyRow', row, source || "datamapGet");
    if (typeof prop === 'string' && prop.indexOf('.') > -1) {
      var sliced = prop.split(".");
      var out = this.dataSource[row];
      for (var i = 0, ilen = sliced.length - 1; i < ilen; i++) {
        out = out[sliced[i]];
      }
      out[sliced[i]] = value;
    }
    else if (typeof prop === 'function') {
      /* see the `function` handler in `get` */
      prop(this.dataSource.slice(
        row,
        row + 1
      )[0], value);
    }
    else {
      this.dataSource[row][prop] = value;
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
    var row;

    while (physicRow < totalRows && rowsToRemove) {
      row = Handsontable.hooks.execute(this.instance, 'modifyRow', physicRow);
      logicRows.push(row);

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

(function (Handsontable) {
  'use strict';

  /*
    Adds appropriate CSS class to table cell, based on cellProperties
   */
  Handsontable.renderers.cellDecorator = function (instance, TD, row, col, prop, value, cellProperties) {
    if (cellProperties.className) {
      TD.className = cellProperties.className;
    }

    if (cellProperties.readOnly) {
      Handsontable.Dom.addClass(TD, cellProperties.readOnlyCellClassName);
    }

    if (cellProperties.valid === false && cellProperties.invalidCellClassName) {
      Handsontable.Dom.addClass(TD, cellProperties.invalidCellClassName);
    }

    if (cellProperties.wordWrap === false && cellProperties.noWordWrapClassName) {
      Handsontable.Dom.addClass(TD, cellProperties.noWordWrapClassName);
    }

    if (!value && cellProperties.placeholder) {
      Handsontable.Dom.addClass(TD, cellProperties.placeholderCellClassName);
    }
  }

})(Handsontable);
/**
 * Default text renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
(function (Handsontable) {
  'use strict';

  var TextRenderer = function (instance, TD, row, col, prop, value, cellProperties) {

    Handsontable.renderers.cellDecorator.apply(this, arguments);

    if (!value && cellProperties.placeholder) {
      value = cellProperties.placeholder;
    }

    var escaped = Handsontable.helper.stringify(value);

    if (cellProperties.rendererTemplate) {
      Handsontable.Dom.empty(TD);
      var TEMPLATE = document.createElement('TEMPLATE');
      TEMPLATE.setAttribute('bind', '{{}}');
      TEMPLATE.innerHTML = cellProperties.rendererTemplate;
      HTMLTemplateElement.decorate(TEMPLATE);
      TEMPLATE.model = instance.getDataAtRow(row);
      TD.appendChild(TEMPLATE);
    }
    else {
      Handsontable.Dom.fastInnerText(TD, escaped); //this is faster than innerHTML. See: https://github.com/handsontable/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
    }

  };

  //Handsontable.TextRenderer = TextRenderer; //Left for backward compatibility
  Handsontable.renderers.TextRenderer = TextRenderer;
  Handsontable.renderers.registerRenderer('text', TextRenderer);

})(Handsontable);
(function (Handsontable) {

  var clonableWRAPPER = document.createElement('DIV');
  clonableWRAPPER.className = 'htAutocompleteWrapper';

  var clonableARROW = document.createElement('DIV');
  clonableARROW.className = 'htAutocompleteArrow';
  clonableARROW.appendChild(document.createTextNode('\u25BC'));
//this is faster than innerHTML. See: https://github.com/handsontable/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips

  var wrapTdContentWithWrapper = function(TD, WRAPPER){
    WRAPPER.innerHTML = TD.innerHTML;
    Handsontable.Dom.empty(TD);
    TD.appendChild(WRAPPER);
  };

  /**
   * Autocomplete renderer
   * @param {Object} instance Handsontable instance
   * @param {Element} TD Table cell where to render
   * @param {Number} row
   * @param {Number} col
   * @param {String|Number} prop Row object property name
   * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
   * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
   */
  var AutocompleteRenderer = function (instance, TD, row, col, prop, value, cellProperties) {

    var WRAPPER = clonableWRAPPER.cloneNode(true); //this is faster than createElement
    var ARROW = clonableARROW.cloneNode(true); //this is faster than createElement

    Handsontable.renderers.TextRenderer(instance, TD, row, col, prop, value, cellProperties);

    TD.appendChild(ARROW);
    Handsontable.Dom.addClass(TD, 'htAutocomplete');


    if (!TD.firstChild) { //http://jsperf.com/empty-node-if-needed
      //otherwise empty fields appear borderless in demo/renderers.html (IE)
      TD.appendChild(document.createTextNode('\u00A0')); //\u00A0 equals &nbsp; for a text node
      //this is faster than innerHTML. See: https://github.com/handsontable/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
    }

    if (!instance.acArrowListener) {
      //not very elegant but easy and fast
      instance.acArrowListener = function () {
        instance.view.wt.getSetting('onCellDblClick', null, new WalkontableCellCoords(row, col), TD);
      };

      instance.rootElement.on('mousedown.htAutocompleteArrow', '.htAutocompleteArrow', instance.acArrowListener); //this way we don't bind event listener to each arrow. We rely on propagation instead

      //We need to unbind the listener after the table has been destroyed
      instance.addHookOnce('afterDestroy', function () {
        this.rootElement.off('mousedown.htAutocompleteArrow');
      });

    }
  };

  Handsontable.AutocompleteRenderer = AutocompleteRenderer;
  Handsontable.renderers.AutocompleteRenderer = AutocompleteRenderer;
  Handsontable.renderers.registerRenderer('autocomplete', AutocompleteRenderer);
})(Handsontable);
/**
 * Checkbox renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
(function (Handsontable) {

  'use strict';

  var clonableINPUT = document.createElement('INPUT');
  clonableINPUT.className = 'htCheckboxRendererInput';
  clonableINPUT.type = 'checkbox';
  clonableINPUT.setAttribute('autocomplete', 'off');

  var CheckboxRenderer = function (instance, TD, row, col, prop, value, cellProperties) {

    if (typeof cellProperties.checkedTemplate === "undefined") {
      cellProperties.checkedTemplate = true;
    }
    if (typeof cellProperties.uncheckedTemplate === "undefined") {
      cellProperties.uncheckedTemplate = false;
    }

    Handsontable.Dom.empty(TD); //TODO identify under what circumstances this line can be removed

    var INPUT = clonableINPUT.cloneNode(false); //this is faster than createElement

    if (value === cellProperties.checkedTemplate || value === Handsontable.helper.stringify(cellProperties.checkedTemplate)) {
      INPUT.checked = true;
      TD.appendChild(INPUT);
    }
    else if (value === cellProperties.uncheckedTemplate || value === Handsontable.helper.stringify(cellProperties.uncheckedTemplate)) {
      TD.appendChild(INPUT);
    }
    else if (value === null) { //default value
      INPUT.className += ' noValue';
      TD.appendChild(INPUT);
    }
    else {
      Handsontable.Dom.fastInnerText(TD, '#bad value#'); //this is faster than innerHTML. See: https://github.com/handsontable/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
    }

    var $input = $(INPUT);

    if (cellProperties.readOnly) {
      $input.on('click', function (event) {
        event.preventDefault();
      });
    }
    else {
      $input.on('mousedown', function (event) {
        event.stopPropagation(); //otherwise can confuse cell mousedown handler
      });

      $input.on('mouseup', function (event) {
        event.stopPropagation(); //otherwise can confuse cell dblclick handler
      });

      $input.on('change', function(){
        if (this.checked) {
          instance.setDataAtRowProp(row, prop, cellProperties.checkedTemplate);
        }
        else {
          instance.setDataAtRowProp(row, prop, cellProperties.uncheckedTemplate);
        }
      });
    }

    if(!instance.CheckboxRenderer || !instance.CheckboxRenderer.beforeKeyDownHookBound){
      instance.CheckboxRenderer = {
        beforeKeyDownHookBound : true
      };

      instance.addHook('beforeKeyDown', function(event){
        if(event.keyCode == Handsontable.helper.keyCode.SPACE){

          var cell, checkbox, cellProperties;

          var selRange = instance.getSelectedRange();
          var topLeft = selRange.getTopLeftCorner();
          var bottomRight = selRange.getBottomRightCorner();

          for(var row = topLeft.row; row <= bottomRight.row; row++ ){
            for(var col = topLeft.col; col <= bottomRight.col; col++){
              cell = instance.getCell(row, col);
              cellProperties = instance.getCellMeta(row, col);

              checkbox = cell.querySelectorAll('input[type=checkbox]');

              if(checkbox.length > 0 && !cellProperties.readOnly){

                if(!event.isImmediatePropagationStopped()){
                  event.stopImmediatePropagation();
                  event.preventDefault();
                }

                for(var i = 0, len = checkbox.length; i < len; i++){
                  checkbox[i].checked = !checkbox[i].checked;
                  $(checkbox[i]).trigger('change');
                }

              }

            }
          }
        }
      });
    }

  };

  Handsontable.CheckboxRenderer = CheckboxRenderer;
  Handsontable.renderers.CheckboxRenderer = CheckboxRenderer;
  Handsontable.renderers.registerRenderer('checkbox', CheckboxRenderer);

})(Handsontable);
/**
 * Numeric cell renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
(function (Handsontable) {

  'use strict';

  var NumericRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
    if (Handsontable.helper.isNumeric(value)) {
      if (typeof cellProperties.language !== 'undefined') {
        numeral.language(cellProperties.language)
      }
      value = numeral(value).format(cellProperties.format || '0'); //docs: http://numeraljs.com/
      Handsontable.Dom.addClass(TD, 'htNumeric');
    }
    Handsontable.renderers.TextRenderer(instance, TD, row, col, prop, value, cellProperties);
  };

  Handsontable.NumericRenderer = NumericRenderer; //Left for backward compatibility with versions prior 0.10.0
  Handsontable.renderers.NumericRenderer = NumericRenderer;
  Handsontable.renderers.registerRenderer('numeric', NumericRenderer);

})(Handsontable);
(function(Handosntable){

  'use strict';

  var PasswordRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
    Handsontable.renderers.TextRenderer.apply(this, arguments);

    value = TD.innerHTML;

    var hash;
    var hashLength = cellProperties.hashLength || value.length;
    var hashSymbol = cellProperties.hashSymbol || '*';

    for( hash = ''; hash.split(hashSymbol).length - 1 < hashLength; hash += hashSymbol);

    Handsontable.Dom.fastInnerHTML(TD, hash);

  };

  Handosntable.PasswordRenderer = PasswordRenderer;
  Handosntable.renderers.PasswordRenderer = PasswordRenderer;
  Handosntable.renderers.registerRenderer('password', PasswordRenderer);

})(Handsontable);
(function (Handsontable) {

  function HtmlRenderer(instance, TD, row, col, prop, value, cellProperties){

    Handsontable.renderers.cellDecorator.apply(this, arguments);

    Handsontable.Dom.fastInnerHTML(TD, value);
  }

  Handsontable.renderers.registerRenderer('html', HtmlRenderer);
  Handsontable.renderers.HtmlRenderer = HtmlRenderer;

})(Handsontable);

(function (Handsontable) {
  'use strict';

  Handsontable.EditorState = {
    VIRGIN: 'STATE_VIRGIN', //before editing
    EDITING: 'STATE_EDITING',
    WAITING: 'STATE_WAITING', //waiting for async validation
    FINISHED: 'STATE_FINISHED'
  };

  function BaseEditor(instance) {
    this.instance = instance;
    this.state = Handsontable.EditorState.VIRGIN;

    this._opened = false;
    this._closeCallback = null;

    this.init();
  }

  BaseEditor.prototype._fireCallbacks = function(result) {
    if(this._closeCallback){
      this._closeCallback(result);
      this._closeCallback = null;
    }

  }

  BaseEditor.prototype.init = function(){};

  BaseEditor.prototype.getValue = function(){
    throw Error('Editor getValue() method unimplemented');
  };

  BaseEditor.prototype.setValue = function(newValue){
    throw Error('Editor setValue() method unimplemented');
  };

  BaseEditor.prototype.open = function(){
    throw Error('Editor open() method unimplemented');
  };

  BaseEditor.prototype.close = function(){
    throw Error('Editor close() method unimplemented');
  };

  BaseEditor.prototype.prepare = function(row, col, prop, td, originalValue, cellProperties){
    this.TD = td;
    this.row = row;
    this.col = col;
    this.prop = prop;
    this.originalValue = originalValue;
    this.cellProperties = cellProperties;

    this.state = Handsontable.EditorState.VIRGIN;
  };

  BaseEditor.prototype.extend = function(){
    var baseClass = this.constructor;
    function Editor(){
      baseClass.apply(this, arguments);
    }

    function inherit(Child, Parent){
      function Bridge() {
      }

      Bridge.prototype = Parent.prototype;
      Child.prototype = new Bridge();
      Child.prototype.constructor = Child;
      return Child;
    }

    return inherit(Editor, baseClass);
  };

  BaseEditor.prototype.saveValue = function (val, ctrlDown) {
    if (ctrlDown) { //if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
      var sel = this.instance.getSelected();
      this.instance.populateFromArray(sel[0], sel[1], val, sel[2], sel[3], 'edit');
    }
    else {
      this.instance.populateFromArray(this.row, this.col, val, null, null, 'edit');
    }
  };

  BaseEditor.prototype.beginEditing = function(initialValue){
    if (this.state != Handsontable.EditorState.VIRGIN) {
      return;
    }

    this.instance.view.scrollViewport(new WalkontableCellCoords(this.row, this.col));
    this.instance.view.render();

    this.state = Handsontable.EditorState.EDITING;

    initialValue = typeof initialValue == 'string' ? initialValue : this.originalValue;

    this.setValue(Handsontable.helper.stringify(initialValue));

    this.open();
    this._opened = true;
    this.focus();

    this.instance.view.render(); //only rerender the selections (FillHandle should disappear when beginediting is triggered)
  };

  BaseEditor.prototype.finishEditing = function (restoreOriginalValue, ctrlDown, callback) {

    if (callback) {
      var previousCloseCallback = this._closeCallback;
      this._closeCallback = function (result) {
        if(previousCloseCallback){
          previousCloseCallback(result);
        }

        callback(result);
      };
    }

    if (this.isWaiting()) {
      return;
    }

    if (this.state == Handsontable.EditorState.VIRGIN) {
      var that = this;
      setTimeout(function () {
        that._fireCallbacks(true);
      });
      return;
    }

    if (this.state == Handsontable.EditorState.EDITING) {

      if (restoreOriginalValue) {

        this.cancelChanges();
        return;

      }


      var val = [
        [String.prototype.trim.call(this.getValue())] //String.prototype.trim is defined in Walkontable polyfill.js
      ];

      this.state = Handsontable.EditorState.WAITING;

      this.saveValue(val, ctrlDown);

      if(this.instance.getCellValidator(this.cellProperties)){
        var that = this;
        this.instance.addHookOnce('afterValidate', function (result) {
          that.state = Handsontable.EditorState.FINISHED;
          that.discardEditor(result);
        });
      } else {
        this.state = Handsontable.EditorState.FINISHED;
        this.discardEditor(true);
      }

    }
  };

  BaseEditor.prototype.cancelChanges = function () {
    this.state = Handsontable.EditorState.FINISHED;
    this.discardEditor();
  };

  BaseEditor.prototype.discardEditor = function (result) {
    if (this.state !== Handsontable.EditorState.FINISHED) {
      return;
    }

    if (result === false && this.cellProperties.allowInvalid !== true) { //validator was defined and failed

      this.instance.selectCell(this.row, this.col);
      this.focus();

      this.state = Handsontable.EditorState.EDITING;

      this._fireCallbacks(false);
    }
    else {
      this.close();
      this._opened = false;

      this.state = Handsontable.EditorState.VIRGIN;

      this._fireCallbacks(true);
    }

  };

  BaseEditor.prototype.isOpened = function(){
    return this._opened;
  };

  BaseEditor.prototype.isWaiting = function () {
    return this.state === Handsontable.EditorState.WAITING;
  };

  Handsontable.editors.BaseEditor = BaseEditor;

})(Handsontable);

(function(Handsontable){
  var TextEditor = Handsontable.editors.BaseEditor.prototype.extend();

  TextEditor.prototype.init = function(){
    this.createElements();
    this.bindEvents();
  };

  TextEditor.prototype.getValue = function(){
    return this.TEXTAREA.value
  };

  TextEditor.prototype.setValue = function(newValue){
    this.TEXTAREA.value = newValue;
  };

  var onBeforeKeyDown =  function onBeforeKeyDown(event){

    var instance = this;
    var that = instance.getActiveEditor();

    var keyCodes = Handsontable.helper.keyCode;
    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)


    //Process only events that have been fired in the editor
    if (event.target !== that.TEXTAREA || event.isImmediatePropagationStopped()){
      return;
    }

    if (event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) {
      //when CTRL or its equivalent is pressed and cell is edited, don't prepare selectable text in textarea
      event.stopImmediatePropagation();
      return;
    }

    switch (event.keyCode) {
      case keyCodes.ARROW_RIGHT:
        if (Handsontable.Dom.getCaretPosition(that.TEXTAREA) !== that.TEXTAREA.value.length) {
          event.stopImmediatePropagation();
        }
        break;

      case keyCodes.ARROW_LEFT: /* arrow left */
        if (Handsontable.Dom.getCaretPosition(that.TEXTAREA) !== 0) {
          event.stopImmediatePropagation();
        }
        break;

      case keyCodes.ENTER:
        var selected = that.instance.getSelected();
        var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
        if ((ctrlDown && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
          if(that.isOpened()){
            that.setValue(that.getValue() + '\n');
            that.focus();
          } else {
            that.beginEditing(that.originalValue + '\n')
          }
          event.stopImmediatePropagation();
        }
        event.preventDefault(); //don't add newline to field
        break;

      case keyCodes.A:
      case keyCodes.X:
      case keyCodes.C:
      case keyCodes.V:
        if(ctrlDown){
          event.stopImmediatePropagation(); //CTRL+A, CTRL+C, CTRL+V, CTRL+X should only work locally when cell is edited (not in table context)
          break;
        }
      case keyCodes.BACKSPACE:
      case keyCodes.DELETE:
      case keyCodes.HOME:
      case keyCodes.END:
        event.stopImmediatePropagation(); //backspace, delete, home, end should only work locally when cell is edited (not in table context)
        break;
    }

  };

  TextEditor.prototype.open = function(){
    this.refreshDimensions(); //need it instantly, to prevent https://github.com/handsontable/jquery-handsontable/issues/348

    this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
  };

  TextEditor.prototype.close = function(){
    this.textareaParentStyle.display = 'none';

    if (document.activeElement === this.TEXTAREA) {
      this.instance.listen(); //don't refocus the table if user focused some cell outside of HT on purpose
    }

    this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
  };

  TextEditor.prototype.focus = function(){
    this.TEXTAREA.focus();
    Handsontable.Dom.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
  };

  TextEditor.prototype.createElements = function () {
    this.$body = $(document.body);

    this.TEXTAREA = document.createElement('TEXTAREA');
    this.$textarea = $(this.TEXTAREA);

    Handsontable.Dom.addClass(this.TEXTAREA, 'handsontableInput');

    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = 0;
    this.textareaStyle.height = 0;

    this.TEXTAREA_PARENT = document.createElement('DIV');
    Handsontable.Dom.addClass(this.TEXTAREA_PARENT, 'handsontableInputHolder');

    this.textareaParentStyle = this.TEXTAREA_PARENT.style;
    this.textareaParentStyle.top = 0;
    this.textareaParentStyle.left = 0;
    this.textareaParentStyle.display = 'none';

    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);

    this.instance.rootElement[0].appendChild(this.TEXTAREA_PARENT);

    var that = this;
    Handsontable.hooks.add('afterRender', function () {
      that.instance._registerTimeout('refresh_editor_dimensions', function () {
        that.refreshDimensions();
      }, 0);
    });
  };

  TextEditor.prototype.refreshDimensions = function () {
    if (this.state !== Handsontable.EditorState.EDITING) {
      return;
    }

    ///start prepare textarea position
    this.TD = this.instance.getCell(this.row, this.col);
    if (!this.TD) {
      //TD is outside of the viewport. Otherwise throws exception when scrolling the table while a cell is edited
      return;
    }
    var $td = $(this.TD); //because old td may have been scrolled out with scrollViewport
    var currentOffset = Handsontable.Dom.offset(this.TD);
    var containerOffset = Handsontable.Dom.offset(this.instance.rootElement[0]);
    var editTop = currentOffset.top - containerOffset.top - 1;
    var editLeft = currentOffset.left - containerOffset.left - 1;

    var settings = this.instance.getSettings();
    var rowHeadersCount = settings.rowHeaders === false ? 0 : 1;
    var colHeadersCount = settings.colHeaders === false ? 0 : 1;

    if (editTop < 0) {
      editTop = 0;
    }
    if (editLeft < 0) {
      editLeft = 0;
    }

    if (rowHeadersCount > 0 && parseInt($td.css('border-top-width'), 10) > 0) {
      editTop += 1;
    }
    if (colHeadersCount > 0 && parseInt($td.css('border-left-width'), 10) > 0) {
      editLeft += 1;
    }

    this.textareaParentStyle.top = editTop + 'px';
    this.textareaParentStyle.left = editLeft + 'px';
    ///end prepare textarea position


    var cellTopOffset = this.TD.offsetTop,
      cellLeftOffset = this.TD.offsetLeft - this.instance.view.wt.wtScrollbars.horizontal.getScrollPosition();

    var width = $td.width()
      , maxWidth = this.instance.view.maximumVisibleElementWidth(cellLeftOffset) - 10 //10 is TEXTAREAs border and padding
      , height = $td.outerHeight() - 4
      , maxHeight = this.instance.view.maximumVisibleElementHeight(cellTopOffset)-2; //10 is TEXTAREAs border and padding

    if (parseInt($td.css('border-top-width'), 10) > 0) {
      height -= 1;
    }
    if (parseInt($td.css('border-left-width'), 10) > 0) {
      if (rowHeadersCount > 0) {
        width -= 1;
      }
    }


    //in future may change to pure JS http://stackoverflow.com/questions/454202/creating-a-textarea-with-auto-resize
    this.$textarea.autoResize({
      minHeight: Math.min(height, maxHeight),
      maxHeight: maxHeight, //TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
      minWidth: Math.min(width, maxWidth),
      maxWidth: maxWidth, //TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
      animate: false,
      extraSpace: 0
    });

    this.textareaParentStyle.display = 'block';
  };

  TextEditor.prototype.bindEvents = function () {
    this.$textarea.on('cut.editor', function (event) {
      event.stopPropagation();
    });

    this.$textarea.on('paste.editor', function (event) {
      event.stopPropagation();
    });
  };

  Handsontable.editors.TextEditor = TextEditor;
  Handsontable.editors.registerEditor('text', Handsontable.editors.TextEditor);

})(Handsontable);

(function(Handsontable){

  //Blank editor, because all the work is done by renderer
  var CheckboxEditor = Handsontable.editors.BaseEditor.prototype.extend();

  CheckboxEditor.prototype.beginEditing = function () {
    var checkbox = this.TD.querySelector('input[type="checkbox"]');

    if (checkbox) {
      $(checkbox).trigger('click');
    }

  };

  CheckboxEditor.prototype.finishEditing = function () {};

  CheckboxEditor.prototype.init = function () {};
  CheckboxEditor.prototype.open = function () {};
  CheckboxEditor.prototype.close = function () {};
  CheckboxEditor.prototype.getValue = function () {};
  CheckboxEditor.prototype.setValue = function () {};
  CheckboxEditor.prototype.focus = function () {};

  Handsontable.editors.CheckboxEditor = CheckboxEditor;
  Handsontable.editors.registerEditor('checkbox', CheckboxEditor);

})(Handsontable);


(function (Handsontable) {
  var DateEditor = Handsontable.editors.TextEditor.prototype.extend();

  DateEditor.prototype.init = function () {
    if (!$.datepicker) {
      throw new Error("jQuery UI Datepicker dependency not found. Did you forget to include jquery-ui.custom.js or its substitute?");
    }

    Handsontable.editors.TextEditor.prototype.init.apply(this, arguments);

    this.isCellEdited = false;
    var that = this;

    this.instance.addHook('afterDestroy', function () {
      that.destroyElements();
    })

  };

  DateEditor.prototype.createElements = function () {
    Handsontable.editors.TextEditor.prototype.createElements.apply(this, arguments);

    this.datePicker = document.createElement('DIV');
    Handsontable.Dom.addClass(this.datePicker, 'htDatepickerHolder');
    this.datePickerStyle = this.datePicker.style;
    this.datePickerStyle.position = 'absolute';
    this.datePickerStyle.top = 0;
    this.datePickerStyle.left = 0;
    this.datePickerStyle.zIndex = 99;
    document.body.appendChild(this.datePicker);
    this.$datePicker = $(this.datePicker);

    var that = this;
    var defaultOptions = {
      dateFormat: "yy-mm-dd",
      showButtonPanel: true,
      changeMonth: true,
      changeYear: true,
      onSelect: function (dateStr) {
        that.setValue(dateStr);
        that.finishEditing(false);
      }
    };
    this.$datePicker.datepicker(defaultOptions);

    /**
     * Prevent recognizing clicking on jQuery Datepicker as clicking outside of table
     */
    this.$datePicker.on('mousedown', function (event) {
      event.stopPropagation();
    });

    this.hideDatepicker();
  };

  DateEditor.prototype.destroyElements = function () {
    this.$datePicker.datepicker('destroy');
    this.$datePicker.remove();
  };

  DateEditor.prototype.open = function () {
    Handsontable.editors.TextEditor.prototype.open.call(this);
    this.showDatepicker();
  };

  DateEditor.prototype.finishEditing = function (isCancelled, ctrlDown) {
    this.hideDatepicker();
    Handsontable.editors.TextEditor.prototype.finishEditing.apply(this, arguments);
  };

  DateEditor.prototype.showDatepicker = function () {
    var $td = $(this.TD);
    var offset = $td.offset();
    this.datePickerStyle.top = (offset.top + $td.height()) + 'px';
    this.datePickerStyle.left = offset.left + 'px';

    var dateOptions = {
      defaultDate: this.originalValue || void 0
    };
    $.extend(dateOptions, this.cellProperties);
    this.$datePicker.datepicker("option", dateOptions);
    if (this.originalValue) {
      this.$datePicker.datepicker("setDate", this.originalValue);
    }
    this.datePickerStyle.display = 'block';
  };

  DateEditor.prototype.hideDatepicker = function () {
    this.datePickerStyle.display = 'none';
  };


  Handsontable.editors.DateEditor = DateEditor;
  Handsontable.editors.registerEditor('date', DateEditor);
})(Handsontable);
/**
 * This is inception. Using Handsontable as Handsontable editor
 */
(function (Handsontable) {
  "use strict";

  var HandsontableEditor = Handsontable.editors.TextEditor.prototype.extend();

  HandsontableEditor.prototype.createElements = function () {
    Handsontable.editors.TextEditor.prototype.createElements.apply(this, arguments);

    var DIV = document.createElement('DIV');
    DIV.className = 'handsontableEditor';
    this.TEXTAREA_PARENT.appendChild(DIV);

    this.$htContainer = $(DIV);
    this.$htContainer.handsontable();
  };

  HandsontableEditor.prototype.prepare = function (td, row, col, prop, value, cellProperties) {

    Handsontable.editors.TextEditor.prototype.prepare.apply(this, arguments);

    var parent = this;

    var options = {
      startRows: 0,
      startCols: 0,
      minRows: 0,
      minCols: 0,
      className: 'listbox',
      copyPaste: false,
      cells: function () {
        return {
          readOnly: true
        }
      },
      fillHandle: false,
      afterOnCellMouseDown: function () {
        var value = this.getValue();
        if (value !== void 0) { //if the value is undefined then it means we don't want to set the value
          parent.setValue(value);
        }
        parent.instance.destroyEditor();
      },
      beforeOnKeyDown: function (event) {
        var instance = this;

        switch (event.keyCode) {
          case Handsontable.helper.keyCode.ESCAPE:
            parent.instance.destroyEditor(true);
            event.stopImmediatePropagation();
            event.preventDefault();
            break;

          case Handsontable.helper.keyCode.ENTER: //enter
            var sel = instance.getSelected();
            var value = this.getDataAtCell(sel[0], sel[1]);
            if (value !== void 0) { //if the value is undefined then it means we don't want to set the value
              parent.setValue(value);
            }
            parent.instance.destroyEditor();
            break;

          case Handsontable.helper.keyCode.ARROW_UP:
            if (instance.getSelected() && instance.getSelected()[0] == 0 && !parent.cellProperties.strict){
              instance.deselectCell();
              parent.instance.listen();
              parent.focus();
              event.preventDefault();
              event.stopImmediatePropagation();
            }
            break;
        }
      }
    };

    if (this.cellProperties.handsontable) {
      options = $.extend(options, cellProperties.handsontable);
    }
    this.$htContainer.handsontable('destroy');
    this.$htContainer.handsontable(options);
  };

  var onBeforeKeyDown = function (event) {

    if (event.isImmediatePropagationStopped()) {
      return;
    }

    var editor = this.getActiveEditor();
    var innerHOT = editor.$htContainer.handsontable('getInstance');

    if (event.keyCode == Handsontable.helper.keyCode.ARROW_DOWN) {

      if (!innerHOT.getSelected()){
        innerHOT.selectCell(0, 0);
      } else {
        var selectedRow = innerHOT.getSelected()[0];
        var rowToSelect = selectedRow < innerHOT.countRows() - 1 ? selectedRow + 1 : selectedRow;

        innerHOT.selectCell(rowToSelect, 0);
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    }

  };

  HandsontableEditor.prototype.open = function () {

    this.instance.addHook('beforeKeyDown', onBeforeKeyDown);

    Handsontable.editors.TextEditor.prototype.open.apply(this, arguments);

    this.$htContainer.handsontable('render');

    if (this.cellProperties.strict) {
      this.$htContainer.handsontable('selectCell', 0, 0);
      this.$textarea[0].style.visibility = 'hidden';
    } else {
      this.$htContainer.handsontable('deselectCell');
      this.$textarea[0].style.visibility = 'visible';
    }

    Handsontable.Dom.setCaretPosition(this.$textarea[0], 0, this.$textarea[0].value.length);

  };

  HandsontableEditor.prototype.close = function () {

    this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
    this.instance.listen();

    Handsontable.editors.TextEditor.prototype.close.apply(this, arguments);
  };

  HandsontableEditor.prototype.focus = function () {

    this.instance.listen();

    Handsontable.editors.TextEditor.prototype.focus.apply(this, arguments);
  };

  HandsontableEditor.prototype.beginEditing = function (initialValue) {
    var onBeginEditing = this.instance.getSettings().onBeginEditing;
    if (onBeginEditing && onBeginEditing() === false) {
      return;
    }

    Handsontable.editors.TextEditor.prototype.beginEditing.apply(this, arguments);

  };

  HandsontableEditor.prototype.finishEditing = function (isCancelled, ctrlDown) {
    if (this.$htContainer.handsontable('isListening')) { //if focus is still in the HOT editor
      this.instance.listen(); //return the focus to the parent HOT instance
    }

    if (this.$htContainer.handsontable('getSelected')) {
      var value = this.$htContainer.handsontable('getInstance').getValue();
      if (value !== void 0) { //if the value is undefined then it means we don't want to set the value
        this.setValue(value);
      }
    }

    return Handsontable.editors.TextEditor.prototype.finishEditing.apply(this, arguments);
  };

  Handsontable.editors.HandsontableEditor = HandsontableEditor;
  Handsontable.editors.registerEditor('handsontable', HandsontableEditor);

})(Handsontable);






(function (Handsontable) {
  var AutocompleteEditor = Handsontable.editors.HandsontableEditor.prototype.extend();

  AutocompleteEditor.prototype.init = function () {
    Handsontable.editors.HandsontableEditor.prototype.init.apply(this, arguments);
    this.$htContainer.handsontable('updateSettings', {height: this.getDropdownHeight()});

    this.query = null;
    this.choices = [];
  };

  AutocompleteEditor.prototype.createElements = function(){
    Handsontable.editors.HandsontableEditor.prototype.createElements.apply(this, arguments);

    this.$htContainer.addClass('autocompleteEditor');

  };

  AutocompleteEditor.prototype.bindEvents = function(){

    var that = this;
    this.$textarea.on('keydown.autocompleteEditor', function(event){
      if(!Handsontable.helper.isMetaKey(event.keyCode) || [Handsontable.helper.keyCode.BACKSPACE, Handsontable.helper.keyCode.DELETE].indexOf(event.keyCode) != -1){
        setTimeout(function () {
          that.queryChoices(that.$textarea.val());
        });
      } else if (event.keyCode == Handsontable.helper.keyCode.ENTER && that.cellProperties.strict !== true){
        that.$htContainer.handsontable('deselectCell');
      }

    });

    this.$htContainer.on('mouseleave', function () {
      if(that.cellProperties.strict === true){
        that.highlightBestMatchingChoice();
      }
    });

    this.$htContainer.on('mouseenter', function () {
      that.$htContainer.handsontable('deselectCell');
    });

    Handsontable.editors.HandsontableEditor.prototype.bindEvents.apply(this, arguments);

  };

  var onBeforeKeyDownInner;

  AutocompleteEditor.prototype.open = function () {

    Handsontable.editors.HandsontableEditor.prototype.open.apply(this, arguments);

    this.$textarea[0].style.visibility = 'visible';
    this.focus();

    var choicesListHot =  this.$htContainer.handsontable('getInstance');
    var that = this;
    choicesListHot.updateSettings({
      'colWidths': [Handsontable.Dom.outerWidth(this.TEXTAREA) - 2],
      afterRenderer: function (TD, row, col, prop, value) {
        var caseSensitive = this.getCellMeta(row, col).filteringCaseSensitive === true;
        var indexOfMatch =  caseSensitive ? value.indexOf(this.query) : value.toLowerCase().indexOf(that.query.toLowerCase());

        if(indexOfMatch != -1){
          var match = value.substr(indexOfMatch, that.query.length);
          TD.innerHTML = value.replace(match, '<strong>' + match + '</strong>');
        }
      }
    });

    onBeforeKeyDownInner = function (event) {
      var instance = this;

      if (event.keyCode == Handsontable.helper.keyCode.ARROW_UP){
        if (instance.getSelected() && instance.getSelected()[0] == 0){

          if(!parent.cellProperties.strict){
            instance.deselectCell();
          }

          parent.instance.listen();
          parent.focus();
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }

    };

    choicesListHot.addHook('beforeKeyDown', onBeforeKeyDownInner);

    this.queryChoices(this.TEXTAREA.value);

  };

  AutocompleteEditor.prototype.close = function () {

    this.$htContainer.handsontable('getInstance').removeHook('beforeKeyDown', onBeforeKeyDownInner);

    Handsontable.editors.HandsontableEditor.prototype.close.apply(this, arguments);
  };

  AutocompleteEditor.prototype.queryChoices = function(query){

    this.query = query;

    if (typeof this.cellProperties.source == 'function'){
      var that = this;

      this.cellProperties.source(query, function(choices){
        that.updateChoicesList(choices)
      });

    } else if (Handsontable.helper.isArray(this.cellProperties.source)) {

      var choices;

      if(!query || this.cellProperties.filter === false){
        choices = this.cellProperties.source;
      } else {

        var filteringCaseSensitive = this.cellProperties.filteringCaseSensitive === true;
        var lowerCaseQuery = query.toLowerCase();

        choices = this.cellProperties.source.filter(function(choice){

          if (filteringCaseSensitive) {
            return choice.indexOf(query) != -1;
          } else {
            return choice.toLowerCase().indexOf(lowerCaseQuery) != -1;
          }

        });
      }

      this.updateChoicesList(choices)

    } else {
      this.updateChoicesList([]);
    }

  };

  AutocompleteEditor.prototype.updateChoicesList = function (choices) {

     this.choices = choices;

    this.$htContainer.handsontable('loadData', Handsontable.helper.pivot([choices]));

    if(this.cellProperties.strict === true){
      this.highlightBestMatchingChoice();
    }

    this.focus();
  };

  AutocompleteEditor.prototype.highlightBestMatchingChoice = function () {
    var bestMatchingChoice = this.findBestMatchingChoice();

    if ( typeof bestMatchingChoice == 'undefined' && this.cellProperties.allowInvalid === false){
      bestMatchingChoice = 0;
    }

    if(typeof bestMatchingChoice == 'undefined'){
      this.$htContainer.handsontable('deselectCell');
    } else {
      this.$htContainer.handsontable('selectCell', bestMatchingChoice, 0);
    }

  };

  AutocompleteEditor.prototype.findBestMatchingChoice = function(){
    var bestMatch = {};
    var valueLength = this.getValue().length;
    var currentItem;
    var indexOfValue;
    var charsLeft;


    for(var i = 0, len = this.choices.length; i < len; i++){
      currentItem = this.choices[i];

      if(valueLength > 0){
        indexOfValue = currentItem.indexOf(this.getValue())
      } else {
        indexOfValue = currentItem === this.getValue() ? 0 : -1;
      }

      if(indexOfValue == -1) continue;

      charsLeft =  currentItem.length - indexOfValue - valueLength;

      if( typeof bestMatch.indexOfValue == 'undefined'
        || bestMatch.indexOfValue > indexOfValue
        || ( bestMatch.indexOfValue == indexOfValue && bestMatch.charsLeft > charsLeft ) ){

        bestMatch.indexOfValue = indexOfValue;
        bestMatch.charsLeft = charsLeft;
        bestMatch.index = i;

      }

    }


    return bestMatch.index;
  };

  AutocompleteEditor.prototype.getDropdownHeight = function(){
    //return 10 * this.$htContainer.handsontable('getInstance').getRowHeight(0);
    //sorry, we can't measure row height before it was rendered. Let's use fixed height for now
    return 230;
  };


  Handsontable.editors.AutocompleteEditor = AutocompleteEditor;
  Handsontable.editors.registerEditor('autocomplete', AutocompleteEditor);

})(Handsontable);

(function(Handsontable){

  var PasswordEditor = Handsontable.editors.TextEditor.prototype.extend();

  PasswordEditor.prototype.createElements = function () {
    Handsontable.editors.TextEditor.prototype.createElements.apply(this, arguments);

    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('type', 'password');
    this.TEXTAREA.className = 'handsontableInput';
    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = 0;
    this.textareaStyle.height = 0;
    this.$textarea = $(this.TEXTAREA);

    Handsontable.Dom.empty(this.TEXTAREA_PARENT);
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);

  };

  Handsontable.editors.PasswordEditor = PasswordEditor;
  Handsontable.editors.registerEditor('password', PasswordEditor);

})(Handsontable);

(function (Handsontable) {

  var SelectEditor = Handsontable.editors.BaseEditor.prototype.extend();

  SelectEditor.prototype.init = function(){
    this.select = document.createElement('SELECT');
    Handsontable.Dom.addClass(this.select, 'htSelectEditor');
    this.select.style.display = 'none';
    this.instance.rootElement[0].appendChild(this.select);
  };

  SelectEditor.prototype.prepare = function(){
    Handsontable.editors.BaseEditor.prototype.prepare.apply(this, arguments);


    var selectOptions = this.cellProperties.selectOptions;
    var options;

    if (typeof selectOptions == 'function'){
      options =  this.prepareOptions(selectOptions(this.row, this.col, this.prop))
    } else {
      options =  this.prepareOptions(selectOptions);
    }

    Handsontable.Dom.empty(this.select);

    for (var option in options){
      if (options.hasOwnProperty(option)){
        var optionElement = document.createElement('OPTION');
        optionElement.value = option;
        Handsontable.Dom.fastInnerHTML(optionElement, options[option]);
        this.select.appendChild(optionElement);
      }
    }
  };

  SelectEditor.prototype.prepareOptions = function(optionsToPrepare){

    var preparedOptions = {};

    if (Handsontable.helper.isArray(optionsToPrepare)){
      for(var i = 0, len = optionsToPrepare.length; i < len; i++){
        preparedOptions[optionsToPrepare[i]] = optionsToPrepare[i];
      }
    }
    else if (typeof optionsToPrepare == 'object') {
      preparedOptions = optionsToPrepare;
    }

    return preparedOptions;

  };

  SelectEditor.prototype.getValue = function () {
    return this.select.value;
  };

  SelectEditor.prototype.setValue = function (value) {
    this.select.value = value;
  };

  var onBeforeKeyDown = function (event) {
    var instance = this;
    var editor = instance.getActiveEditor();

    switch (event.keyCode){
      case Handsontable.helper.keyCode.ARROW_UP:

        var previousOption = editor.select.find('option:selected').prev();

        if (previousOption.length == 1){
          previousOption.prop('selected', true);
        }

        event.stopImmediatePropagation();
        event.preventDefault();
        break;

      case Handsontable.helper.keyCode.ARROW_DOWN:

        var nextOption = editor.select.find('option:selected').next();

        if (nextOption.length == 1){
          nextOption.prop('selected', true);
        }

        event.stopImmediatePropagation();
        event.preventDefault();
        break;
    }
  };

  SelectEditor.prototype.open = function () {
    var width = Handsontable.Dom.outerWidth(this.TD); //important - group layout reads together for better performance
    var height = Handsontable.Dom.outerHeight(this.TD);
    var rootOffset = Handsontable.Dom.offset(this.instance.rootElement[0]);
    var tdOffset = Handsontable.Dom.offset(this.TD);

    this.select.style.height = height + 'px';
    this.select.style.minWidth = width + 'px';
    this.select.style.top = tdOffset.top - rootOffset.top + 'px';
    this.select.style.left = tdOffset.left - rootOffset.left - 2 + 'px'; //2 is cell border
    this.select.style.display = '';

    this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
  };

  SelectEditor.prototype.close = function () {
    this.select.style.display = 'none';
    this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
  };

  SelectEditor.prototype.focus = function () {
    this.select.focus();
  };

  Handsontable.editors.SelectEditor = SelectEditor;
  Handsontable.editors.registerEditor('select', SelectEditor);

})(Handsontable);

(function (Handsontable) {

  var DropdownEditor = Handsontable.editors.AutocompleteEditor.prototype.extend();

  DropdownEditor.prototype.prepare = function () {
    Handsontable.editors.AutocompleteEditor.prototype.prepare.apply(this, arguments);

    this.cellProperties.filter = false;
    this.cellProperties.strict = true;

  };


  Handsontable.editors.DropdownEditor = DropdownEditor;
  Handsontable.editors.registerEditor('dropdown', DropdownEditor);


})(Handsontable);
/**
 * Numeric cell validator
 * @param {*} value - Value of edited cell
 * @param {*} callback - Callback called with validation result
 */
Handsontable.NumericValidator = function (value, callback) {
  if (value === null) {
    value = '';
  }
  callback(/^-?\d*(\.|\,)?\d*$/.test(value));
};
/**
 * Function responsible for validation of autocomplete value
 * @param {*} value - Value of edited cell
 * @param {*} calback - Callback called with validation result
 */
var process = function (value, callback) {

  var originalVal  = value;
  var lowercaseVal = typeof originalVal === 'string' ? originalVal.toLowerCase() : null;

  return function (source) {
    var found = false;
    for (var s = 0, slen = source.length; s < slen; s++) {
      if (originalVal === source[s]) {
        found = true; //perfect match
        break;
      }
      else if (lowercaseVal === source[s].toLowerCase()) {
        // changes[i][3] = source[s]; //good match, fix the case << TODO?
        found = true;
        break;
      }
    }

    callback(found);
  }
};

/**
 * Autocomplete cell validator
 * @param {*} value - Value of edited cell
 * @param {*} calback - Callback called with validation result
 */
Handsontable.AutocompleteValidator = function (value, callback) {
  if (this.strict && this.source) {
    typeof this.source === 'function' ? this.source(value, process(value, callback)) : process(value, callback)(this.source);
  } else {
    callback(true);
  }
};

/**
 * Cell type is just a shortcut for setting bunch of cellProperties (used in getCellMeta)
 */

Handsontable.AutocompleteCell = {
  editor: Handsontable.editors.AutocompleteEditor,
  renderer: Handsontable.renderers.AutocompleteRenderer,
  validator: Handsontable.AutocompleteValidator
};

Handsontable.CheckboxCell = {
  editor: Handsontable.editors.CheckboxEditor,
  renderer: Handsontable.renderers.CheckboxRenderer
};

Handsontable.TextCell = {
  editor: Handsontable.editors.TextEditor,
  renderer: Handsontable.renderers.TextRenderer
};

Handsontable.NumericCell = {
  editor: Handsontable.editors.TextEditor,
  renderer: Handsontable.renderers.NumericRenderer,
  validator: Handsontable.NumericValidator,
  dataType: 'number'
};

Handsontable.DateCell = {
  editor: Handsontable.editors.DateEditor,
  renderer: Handsontable.renderers.AutocompleteRenderer //displays small gray arrow on right side of the cell
};

Handsontable.HandsontableCell = {
  editor: Handsontable.editors.HandsontableEditor,
  renderer: Handsontable.renderers.AutocompleteRenderer //displays small gray arrow on right side of the cell
};

Handsontable.PasswordCell = {
  editor: Handsontable.editors.PasswordEditor,
  renderer: Handsontable.renderers.PasswordRenderer,
  copyable: false
};

Handsontable.DropdownCell = {
  editor: Handsontable.editors.DropdownEditor,
  renderer: Handsontable.renderers.AutocompleteRenderer, //displays small gray arrow on right side of the cell
  validator: Handsontable.AutocompleteValidator
};

//here setup the friendly aliases that are used by cellProperties.type
Handsontable.cellTypes = {
  text: Handsontable.TextCell,
  date: Handsontable.DateCell,
  numeric: Handsontable.NumericCell,
  checkbox: Handsontable.CheckboxCell,
  autocomplete: Handsontable.AutocompleteCell,
  handsontable: Handsontable.HandsontableCell,
  password: Handsontable.PasswordCell,
  dropdown: Handsontable.DropdownCell
};

//here setup the friendly aliases that are used by cellProperties.renderer and cellProperties.editor
Handsontable.cellLookup = {
  validator: {
    numeric: Handsontable.NumericValidator,
    autocomplete: Handsontable.AutocompleteValidator
  }
};
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
    overflowX: 'hidden',
    overflowY: 'hidden',
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
        overflowY: 'none'
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
        .css(autoResize.cloneCSSValues)
        .css('overflowY', 'scroll');

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
          scrollTop = config.maxHeight;
        }

        if (scrollTop < config.minHeight) {
          scrollTop = config.minHeight;
        }

        if(scrollTop == config.maxHeight && newWidth == config.maxWidth) {
          el.css('overflowY', 'scroll');
        }
        else {
          el.css('overflowY', 'hidden');
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
        ).empty().append(this.clones); //this should be refactored so that a node is never cloned more than once
    }

  };

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
            if (multiline && (countQuotes(rows[r][0]) & 1)) { //& 1 is a bitwise way of performing mod 2
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
 * CopyPaste.js
 * Creates a textarea that stays hidden on the page and gets focused when user presses CTRL while not having a form input focused
 * In future we may implement a better driver when better APIs are available
 * @constructor
 */
var CopyPaste = (function () {
  var instance;
  return {
    getInstance: function () {
      if (!instance) {
        instance = new CopyPasteClass();
      } else if (instance.hasBeenDestroyed()){
        instance.init();
      }

      instance.refCounter++;

      return instance;
    }
  };
})();

function CopyPasteClass() {
  this.refCounter = 0;
  this.init();
}

CopyPasteClass.prototype.init = function () {
  var that = this
    , style
    , parent;

  this.copyCallbacks = [];
  this.cutCallbacks = [];
  this.pasteCallbacks = [];

  this.listenerElement = document.documentElement;
  parent = document.body;

  if (document.getElementById('CopyPasteDiv')) {
    this.elDiv = document.getElementById('CopyPasteDiv');
    this.elTextarea = this.elDiv.firstChild;
  }
  else {
    this.elDiv = document.createElement('DIV');
    this.elDiv.id = 'CopyPasteDiv';
    style = this.elDiv.style;
    style.position = 'fixed';
    style.top = '-10000px';
    style.left = '-10000px';
    parent.appendChild(this.elDiv);

    this.elTextarea = document.createElement('TEXTAREA');
    this.elTextarea.className = 'copyPaste';
    style = this.elTextarea.style;
    style.width = '10000px';
    style.height = '10000px';
    style.overflow = 'hidden';
    this.elDiv.appendChild(this.elTextarea);

    if (typeof style.opacity !== 'undefined') {
      style.opacity = 0;
    }
    else {
      /*@cc_on @if (@_jscript)
       if(typeof style.filter === 'string') {
       style.filter = 'alpha(opacity=0)';
       }
       @end @*/
    }
  }

  this.keydownListener = function (event) {
    var isCtrlDown = false;
    if (event.metaKey) { //mac
      isCtrlDown = true;
    }
    else if (event.ctrlKey && navigator.userAgent.indexOf('Mac') === -1) { //pc
      isCtrlDown = true;
    }

    if (isCtrlDown) {
      if (document.activeElement !== that.elTextarea && (that.getSelectionText() != '' || ['INPUT', 'SELECT', 'TEXTAREA'].indexOf(document.activeElement.nodeName) != -1)) {
        return; //this is needed by fragmentSelection in Handsontable. Ignore copypaste.js behavior if fragment of cell text is selected
      }

      that.selectNodeText(that.elTextarea);
      setTimeout(function () {
        that.selectNodeText(that.elTextarea);
      }, 0);
    }

    /* 67 = c
     * 86 = v
     * 88 = x
     */
    if (isCtrlDown && (event.keyCode === 67 || event.keyCode === 86 || event.keyCode === 88)) {
      // that.selectNodeText(that.elTextarea);

      if (event.keyCode === 88) { //works in all browsers, incl. Opera < 12.12
        setTimeout(function () {
          that.triggerCut(event);
        }, 0);
      }
      else if (event.keyCode === 86) {
        setTimeout(function () {
          that.triggerPaste(event);
        }, 0);
      }
    }
  }

  this._bindEvent(this.listenerElement, 'keydown', this.keydownListener);
};

//http://jsperf.com/textara-selection
//http://stackoverflow.com/questions/1502385/how-can-i-make-this-code-work-in-ie
CopyPasteClass.prototype.selectNodeText = function (el) {
  el.select();
};

//http://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
CopyPasteClass.prototype.getSelectionText = function () {
  var text = "";
  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type != "Control") {
    text = document.selection.createRange().text;
  }
  return text;
};

CopyPasteClass.prototype.copyable = function (str) {
  if (typeof str !== 'string' && str.toString === void 0) {
    throw new Error('copyable requires string parameter');
  }
  this.elTextarea.value = str;
};

/*CopyPasteClass.prototype.onCopy = function (fn) {
  this.copyCallbacks.push(fn);
};*/

CopyPasteClass.prototype.onCut = function (fn) {
  this.cutCallbacks.push(fn);
};

CopyPasteClass.prototype.onPaste = function (fn) {
  this.pasteCallbacks.push(fn);
};

CopyPasteClass.prototype.removeCallback = function (fn) {
  var i, ilen;
  for (i = 0, ilen = this.copyCallbacks.length; i < ilen; i++) {
    if (this.copyCallbacks[i] === fn) {
      this.copyCallbacks.splice(i, 1);
      return true;
    }
  }
  for (i = 0, ilen = this.cutCallbacks.length; i < ilen; i++) {
    if (this.cutCallbacks[i] === fn) {
      this.cutCallbacks.splice(i, 1);
      return true;
    }
  }
  for (i = 0, ilen = this.pasteCallbacks.length; i < ilen; i++) {
    if (this.pasteCallbacks[i] === fn) {
      this.pasteCallbacks.splice(i, 1);
      return true;
    }
  }
  return false;
};

CopyPasteClass.prototype.triggerCut = function (event) {
  var that = this;
  if (that.cutCallbacks) {
    setTimeout(function () {
      for (var i = 0, ilen = that.cutCallbacks.length; i < ilen; i++) {
        that.cutCallbacks[i](event);
      }
    }, 50);
  }
};

CopyPasteClass.prototype.triggerPaste = function (event, str) {
  var that = this;
  if (that.pasteCallbacks) {
    setTimeout(function () {
      var val = (str || that.elTextarea.value).replace(/\n$/, ''); //remove trailing newline
      for (var i = 0, ilen = that.pasteCallbacks.length; i < ilen; i++) {
        that.pasteCallbacks[i](val, event);
      }
    }, 50);
  }
};

CopyPasteClass.prototype.destroy = function () {

  if(!this.hasBeenDestroyed() && --this.refCounter == 0){
    if (this.elDiv && this.elDiv.parentNode) {
      this.elDiv.parentNode.removeChild(this.elDiv);
    }

    this._unbindEvent(this.listenerElement, 'keydown', this.keydownListener);

  }

};

CopyPasteClass.prototype.hasBeenDestroyed = function () {
  return !this.refCounter;
};

//old version used this:
// - http://net.tutsplus.com/tutorials/javascript-ajax/javascript-from-null-cross-browser-event-binding/
// - http://stackoverflow.com/questions/4643249/cross-browser-event-object-normalization
//but that cannot work with jQuery.trigger
CopyPasteClass.prototype._bindEvent = (function () {
  if (window.jQuery) { //if jQuery exists, use jQuery event (for compatibility with $.trigger and $.triggerHandler, which can only trigger jQuery events - and we use that in tests)
    return function (elem, type, cb) {
      $(elem).on(type + '.copypaste', cb);
    };
  }
  else {
    return function (elem, type, cb) {
      elem.addEventListener(type, cb, false); //sorry, IE8 will only work with jQuery
    };
  }
})();

CopyPasteClass.prototype._unbindEvent = (function () {
  if (window.jQuery) { //if jQuery exists, use jQuery event (for compatibility with $.trigger and $.triggerHandler, which can only trigger jQuery events - and we use that in tests)
    return function (elem, type, cb) {
      $(elem).off(type + '.copypaste', cb);
    };
  }
  else {
    return function (elem, type, cb) {
      elem.removeEventListener(type, cb, false); //sorry, IE8 will only work with jQuery
    };
  }
})();
// json-patch-duplex.js 0.3.6
// (c) 2013 Joachim Wester
// MIT license
var jsonpatch;
(function (jsonpatch) {
    var objOps = {
        add: function (obj, key) {
            obj[key] = this.value;
            return true;
        },
        remove: function (obj, key) {
            delete obj[key];
            return true;
        },
        replace: function (obj, key) {
            obj[key] = this.value;
            return true;
        },
        move: function (obj, key, tree) {
            var temp = { op: "_get", path: this.from };
            apply(tree, [temp]);
            apply(tree, [
                { op: "remove", path: this.from }
            ]);
            apply(tree, [
                { op: "add", path: this.path, value: temp.value }
            ]);
            return true;
        },
        copy: function (obj, key, tree) {
            var temp = { op: "_get", path: this.from };
            apply(tree, [temp]);
            apply(tree, [
                { op: "add", path: this.path, value: temp.value }
            ]);
            return true;
        },
        test: function (obj, key) {
            return (JSON.stringify(obj[key]) === JSON.stringify(this.value));
        },
        _get: function (obj, key) {
            this.value = obj[key];
        }
    };

    var arrOps = {
        add: function (arr, i) {
            arr.splice(i, 0, this.value);
            return true;
        },
        remove: function (arr, i) {
            arr.splice(i, 1);
            return true;
        },
        replace: function (arr, i) {
            arr[i] = this.value;
            return true;
        },
        move: objOps.move,
        copy: objOps.copy,
        test: objOps.test,
        _get: objOps._get
    };

    var observeOps = {
        add: function (patches, path) {
            var patch = {
                op: "add",
                path: path + escapePathComponent(this.name),
                value: this.object[this.name]
            };
            patches.push(patch);
        },
        'delete': function (patches, path) {
            var patch = {
                op: "remove",
                path: path + escapePathComponent(this.name)
            };
            patches.push(patch);
        },
        update: function (patches, path) {
            var patch = {
                op: "replace",
                path: path + escapePathComponent(this.name),
                value: this.object[this.name]
            };
            patches.push(patch);
        }
    };

    function escapePathComponent(str) {
        if (str.indexOf('/') === -1 && str.indexOf('~') === -1)
            return str;
        return str.replace(/~/g, '~0').replace(/\//g, '~1');
    }

    function _getPathRecursive(root, obj) {
        var found;
        for (var key in root) {
            if (root.hasOwnProperty(key)) {
                if (root[key] === obj) {
                    return escapePathComponent(key) + '/';
                } else if (typeof root[key] === 'object') {
                    found = _getPathRecursive(root[key], obj);
                    if (found != '') {
                        return escapePathComponent(key) + '/' + found;
                    }
                }
            }
        }
        return '';
    }

    function getPath(root, obj) {
        if (root === obj) {
            return '/';
        }
        var path = _getPathRecursive(root, obj);
        if (path === '') {
            throw new Error("Object not found in root");
        }
        return '/' + path;
    }

    var beforeDict = [];

    jsonpatch.intervals;

    var Mirror = (function () {
        function Mirror(obj) {
            this.observers = [];
            this.obj = obj;
        }
        return Mirror;
    })();

    var ObserverInfo = (function () {
        function ObserverInfo(callback, observer) {
            this.callback = callback;
            this.observer = observer;
        }
        return ObserverInfo;
    })();

    function getMirror(obj) {
        for (var i = 0, ilen = beforeDict.length; i < ilen; i++) {
            if (beforeDict[i].obj === obj) {
                return beforeDict[i];
            }
        }
    }

    function getObserverFromMirror(mirror, callback) {
        for (var j = 0, jlen = mirror.observers.length; j < jlen; j++) {
            if (mirror.observers[j].callback === callback) {
                return mirror.observers[j].observer;
            }
        }
    }

    function removeObserverFromMirror(mirror, observer) {
        for (var j = 0, jlen = mirror.observers.length; j < jlen; j++) {
            if (mirror.observers[j].observer === observer) {
                mirror.observers.splice(j, 1);
                return;
            }
        }
    }

    function unobserve(root, observer) {
        generate(observer);
        if (Object.observe) {
            _unobserve(observer, root);
        } else {
            clearTimeout(observer.next);
        }

        var mirror = getMirror(root);
        removeObserverFromMirror(mirror, observer);
    }
    jsonpatch.unobserve = unobserve;

    function observe(obj, callback) {
        var patches = [];
        var root = obj;
        var observer;
        var mirror = getMirror(obj);

        if (!mirror) {
            mirror = new Mirror(obj);
            beforeDict.push(mirror);
        } else {
            observer = getObserverFromMirror(mirror, callback);
        }

        if (observer) {
            return observer;
        }

        if (Object.observe) {
            observer = function (arr) {
                //This "refresh" is needed to begin observing new object properties
                _unobserve(observer, obj);
                _observe(observer, obj);

                var a = 0, alen = arr.length;
                while (a < alen) {
                    if (!(arr[a].name === 'length' && _isArray(arr[a].object)) && !(arr[a].name === '__Jasmine_been_here_before__')) {
                        var type = arr[a].type;

                        switch (type) {
                            case 'new':
                                type = 'add';
                                break;

                            case 'deleted':
                                type = 'delete';
                                break;

                            case 'updated':
                                type = 'update';
                                break;
                        }

                        observeOps[type].call(arr[a], patches, getPath(root, arr[a].object));
                    }
                    a++;
                }

                if (patches) {
                    if (callback) {
                        callback(patches);
                    }
                }
                observer.patches = patches;
                patches = [];
            };
        } else {
            observer = {};

            mirror.value = JSON.parse(JSON.stringify(obj));

            if (callback) {
                //callbacks.push(callback); this has no purpose
                observer.callback = callback;
                observer.next = null;
                var intervals = this.intervals || [100, 1000, 10000, 60000];
                var currentInterval = 0;

                var dirtyCheck = function () {
                    generate(observer);
                };
                var fastCheck = function () {
                    clearTimeout(observer.next);
                    observer.next = setTimeout(function () {
                        dirtyCheck();
                        currentInterval = 0;
                        observer.next = setTimeout(slowCheck, intervals[currentInterval++]);
                    }, 0);
                };
                var slowCheck = function () {
                    dirtyCheck();
                    if (currentInterval == intervals.length)
                        currentInterval = intervals.length - 1;
                    observer.next = setTimeout(slowCheck, intervals[currentInterval++]);
                };
                if (typeof window !== 'undefined') {
                    if (window.addEventListener) {
                        window.addEventListener('mousedown', fastCheck);
                        window.addEventListener('mouseup', fastCheck);
                        window.addEventListener('keydown', fastCheck);
                    } else {
                        window.attachEvent('onmousedown', fastCheck);
                        window.attachEvent('onmouseup', fastCheck);
                        window.attachEvent('onkeydown', fastCheck);
                    }
                }
                observer.next = setTimeout(slowCheck, intervals[currentInterval++]);
            }
        }
        observer.patches = patches;
        observer.object = obj;

        mirror.observers.push(new ObserverInfo(callback, observer));

        return _observe(observer, obj);
    }
    jsonpatch.observe = observe;

    /// Listen to changes on an object tree, accumulate patches
    function _observe(observer, obj) {
        if (Object.observe) {
            Object.observe(obj, observer);
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    var v = obj[key];
                    if (v && typeof (v) === "object") {
                        _observe(observer, v);
                    }
                }
            }
        }
        return observer;
    }

    function _unobserve(observer, obj) {
        if (Object.observe) {
            Object.unobserve(obj, observer);
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    var v = obj[key];
                    if (v && typeof (v) === "object") {
                        _unobserve(observer, v);
                    }
                }
            }
        }
        return observer;
    }

    function generate(observer) {
        if (Object.observe) {
            Object.deliverChangeRecords(observer);
        } else {
            var mirror;
            for (var i = 0, ilen = beforeDict.length; i < ilen; i++) {
                if (beforeDict[i].obj === observer.object) {
                    mirror = beforeDict[i];
                    break;
                }
            }
            _generate(mirror.value, observer.object, observer.patches, "");
        }
        var temp = observer.patches;
        if (temp.length > 0) {
            observer.patches = [];
            if (observer.callback) {
                observer.callback(temp);
            }
        }
        return temp;
    }
    jsonpatch.generate = generate;

    var _objectKeys;
    if (Object.keys) {
        _objectKeys = Object.keys;
    } else {
        _objectKeys = function (obj) {
            var keys = [];
            for (var o in obj) {
                if (obj.hasOwnProperty(o)) {
                    keys.push(o);
                }
            }
            return keys;
        };
    }

    // Dirty check if obj is different from mirror, generate patches and update mirror
    function _generate(mirror, obj, patches, path) {
        var newKeys = _objectKeys(obj);
        var oldKeys = _objectKeys(mirror);
        var changed = false;
        var deleted = false;

        for (var t = oldKeys.length - 1; t >= 0; t--) {
            var key = oldKeys[t];
            var oldVal = mirror[key];
            if (obj.hasOwnProperty(key)) {
                var newVal = obj[key];
                if (oldVal instanceof Object) {
                    _generate(oldVal, newVal, patches, path + "/" + escapePathComponent(key));
                } else {
                    if (oldVal != newVal) {
                        changed = true;
                        patches.push({ op: "replace", path: path + "/" + escapePathComponent(key), value: newVal });
                        mirror[key] = newVal;
                    }
                }
            } else {
                patches.push({ op: "remove", path: path + "/" + escapePathComponent(key) });
                delete mirror[key];
                deleted = true;
            }
        }

        if (!deleted && newKeys.length == oldKeys.length) {
            return;
        }

        for (var t = 0; t < newKeys.length; t++) {
            var key = newKeys[t];
            if (!mirror.hasOwnProperty(key)) {
                patches.push({ op: "add", path: path + "/" + escapePathComponent(key), value: obj[key] });
                mirror[key] = JSON.parse(JSON.stringify(obj[key]));
            }
        }
    }

    var _isArray;
    if (Array.isArray) {
        _isArray = Array.isArray;
    } else {
        _isArray = function (obj) {
            return obj.push && typeof obj.length === 'number';
        };
    }

    /// Apply a json-patch operation on an object tree
    function apply(tree, patches) {
        var result = false, p = 0, plen = patches.length, patch;
        while (p < plen) {
            patch = patches[p];

            // Find the object
            var keys = patch.path.split('/');
            var obj = tree;
            var t = 1;
            var len = keys.length;
            while (true) {
                if (_isArray(obj)) {
                    var index = parseInt(keys[t], 10);
                    t++;
                    if (t >= len) {
                        result = arrOps[patch.op].call(patch, obj, index, tree);
                        break;
                    }
                    obj = obj[index];
                } else {
                    var key = keys[t];
                    if (key.indexOf('~') != -1)
                        key = key.replace(/~1/g, '/').replace(/~0/g, '~');
                    t++;
                    if (t >= len) {
                        result = objOps[patch.op].call(patch, obj, key, tree);
                        break;
                    }
                    obj = obj[key];
                }
            }
            p++;
        }
        return result;
    }
    jsonpatch.apply = apply;
})(jsonpatch || (jsonpatch = {}));

if (typeof exports !== "undefined") {
    exports.apply = jsonpatch.apply;
    exports.observe = jsonpatch.observe;
    exports.unobserve = jsonpatch.unobserve;
    exports.generate = jsonpatch.generate;
}

Handsontable.PluginHookClass = (function () {

  var Hooks = function () {
    return {
      // Hooks
      beforeInitWalkontable: [],

      beforeInit: [],
      beforeRender: [],
      beforeSetRangeEnd: [],
      beforeChange: [],
      beforeChangeRender: [],
      beforeRemoveCol: [],
      beforeRemoveRow: [],
      beforeValidate: [],
      beforeGetCellMeta: [],
      beforeAutofill: [],
      beforeKeyDown: [],

      afterInit : [],
      afterLoadData : [],
      afterUpdateSettings: [],
      afterRender : [],
      afterRenderer : [],
      afterChange : [],
      afterValidate: [],
      afterGetCellMeta: [],
      afterSetCellMeta: [],
      afterGetColHeader: [],
      afterDestroy: [],
      afterRemoveRow: [],
      afterCreateRow: [],
      afterRemoveCol: [],
      afterCreateCol: [],
      afterDeselect: [],
      afterSelection: [],
      afterSelectionByProp: [],
      afterSelectionEnd: [],
      afterSelectionEndByProp: [],
      afterOnCellMouseDown: [],
      afterOnCellMouseOver: [],
      afterOnCellCornerMouseDown: [],
      afterScrollVertically: [],
      afterScrollHorizontally: [],
	  afterCellMetaReset:[],

      // Modifiers
      modifyColWidth: [],
      modifyRowHeight: [],
      modifyRow: [],
      modifyCol: []
    }
  };

  var legacy = {
    onBeforeChange: "beforeChange",
    onChange: "afterChange",
    onCreateRow: "afterCreateRow",
    onCreateCol: "afterCreateCol",
    onSelection: "afterSelection",
    onCopyLimit: "afterCopyLimit",
    onSelectionEnd: "afterSelectionEnd",
    onSelectionByProp: "afterSelectionByProp",
    onSelectionEndByProp: "afterSelectionEndByProp"
  };

  function PluginHookClass() {

    this.hooks = Hooks();
    this.globalBucket = {};
    this.legacy = legacy;

  }

  PluginHookClass.prototype.getBucket = function (instance) {
    if(instance) {
      if(!instance.pluginHookBucket) {
        instance.pluginHookBucket = {};
      }
      return instance.pluginHookBucket;
    }
    return this.globalBucket;
  };

  PluginHookClass.prototype.add = function (key, fn, instance) {
    //if fn is array, run this for all the array items
    if (Handsontable.helper.isArray(fn)) {
      for (var i = 0, len = fn.length; i < len; i++) {
        this.add(key, fn[i]);
      }
    }
    else {
      // provide support for old versions of HOT
      if (key in legacy) {
        key = legacy[key];
      }

      var bucket = this.getBucket(instance);

      if (typeof bucket[key] === "undefined") {
        bucket[key] = [];
      }

      fn.skip = false;

      if (bucket[key].indexOf(fn) == -1) {
        bucket[key].push(fn); //only add a hook if it has not already be added (adding the same hook twice is now silently ignored)
      }
    }
    return this;
  };

  PluginHookClass.prototype.once = function(key, fn, instance){

    if(Handsontable.helper.isArray(fn)){

      for(var i = 0, len = fn.length; i < len; i++){
        fn[i].runOnce = true;
        this.add(key, fn[i], instance);
      }

    } else {
      fn.runOnce = true;
      this.add(key, fn, instance);

    }

  };

  PluginHookClass.prototype.remove = function (key, fn, instance) {
    var status = false;

    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    var bucket = this.getBucket(instance);

    if (typeof bucket[key] !== 'undefined') {

      for (var i = 0, leni = bucket[key].length; i < leni; i++) {

        if (bucket[key][i] == fn) {
          bucket[key][i].skip = true;
          status = true;
          break;
        }

      }

    }

    return status;
  };

  PluginHookClass.prototype.run = function (instance, key, p1, p2, p3, p4, p5) {
    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    this._runBucket(this.globalBucket, instance, key, p1, p2, p3, p4, p5);
    this._runBucket(this.getBucket(instance), instance, key, p1, p2, p3, p4, p5);
  };

  PluginHookClass.prototype._runBucket = function (bucket, instance, key, p1, p2, p3, p4, p5) {
    var handlers = bucket[key];
    if (handlers) {
      for (var i = 0, leni = handlers.length; i < leni; i++) {
        if (!handlers[i].skip) {
          handlers[i].call(instance, p1, p2, p3, p4, p5);

          if (handlers[i].runOnce) {
            this.remove(key, handlers[i], bucket === this.globalBucket ? null : instance);
          }
        }
      }
    }
  };

  PluginHookClass.prototype.execute = function (instance, key, p1, p2, p3, p4, p5) {
    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    p1 = this._executeBucket(this.globalBucket, instance, key, p1, p2, p3, p4, p5);
    p1 = this._executeBucket(this.getBucket(instance), instance, key, p1, p2, p3, p4, p5);
    return p1;
  };

  PluginHookClass.prototype._executeBucket = function (bucket, instance, key, p1, p2, p3, p4, p5) {
    var res,
      handlers = bucket[key];

    //performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
    if (handlers) {
      for (var i = 0, leni = handlers.length; i < leni; i++) {
        if (!handlers[i].skip) {
          res = handlers[i].call(instance, p1, p2, p3, p4, p5);
          if (res !== void 0) {
            p1 = res;
          }

          if (handlers[i].runOnce) {
            this.remove(key, handlers[i], bucket === this.globalBucket ? null : instance);
          }

          if (res === false) { //if any handler returned false
            return false; //event has been cancelled and further execution of handler queue is being aborted
          }
        }
      }
    }

    return p1;
  };

  /**
   * Registers a hook name (adds it to the list of the known hook names). Used by plugins. It is not neccessary to call,
   * register, but if you use it, your plugin hook will be used returned by getRegistered
   * (which itself is used in the demo http://handsontable.com/demo/callbacks.html)
   * @param key {String}
   */
  PluginHookClass.prototype.register = function (key) {
    if (!this.isRegistered(key)) {
      this.hooks[key] = [];
    }
  };

  /**
   * Deregisters a hook name (removes it from the list of known hook names)
   * @param key {String}
   */
  PluginHookClass.prototype.deregister = function (key) {
    delete this.hooks[key];
  };

  /**
   * Returns boolean information if a hook by such name has been registered
   * @param key {String}
   */
  PluginHookClass.prototype.isRegistered = function (key) {
    return (typeof this.hooks[key] !== "undefined");
  };

  /**
   * Returns an array of registered hooks
   * @returns {Array}
   */
  PluginHookClass.prototype.getRegistered = function () {
    return Object.keys(this.hooks);
  };

  return PluginHookClass;

})();

Handsontable.hooks = new Handsontable.PluginHookClass();
Handsontable.PluginHooks = Handsontable.hooks; //in future move this line to legacy.js

(function (Handsontable) {

  function HandsontableAutoColumnSize() {
    var plugin = this
      , sampleCount = 5; //number of samples to take of each value length

    this.beforeInit = function () {
      var instance = this;
      instance.autoColumnWidths = [];

      if (instance.getSettings().autoColumnSize !== false) {
        if (!instance.autoColumnSizeTmp) {
          instance.autoColumnSizeTmp = {
            table: null,
            tableStyle: null,
            theadTh: null,
            tbody: null,
            container: null,
            containerStyle: null,
            determineBeforeNextRender: true
          };

          instance.addHook('beforeRender', htAutoColumnSize.determineIfChanged);
          instance.addHook('modifyColWidth', htAutoColumnSize.modifyColWidth);
          instance.addHook('afterDestroy', htAutoColumnSize.afterDestroy);

          instance.determineColumnWidth = plugin.determineColumnWidth;
        }
      } else {
        if (instance.autoColumnSizeTmp) {
          instance.removeHook('beforeRender', htAutoColumnSize.determineIfChanged);
          instance.removeHook('modifyColWidth', htAutoColumnSize.modifyColWidth);
          instance.removeHook('afterDestroy', htAutoColumnSize.afterDestroy);

          delete instance.determineColumnWidth;

          plugin.afterDestroy.call(instance);
        }
      }
    };

    this.determineIfChanged = function (force) {
      if (force) {
        htAutoColumnSize.determineColumnsWidth.apply(this, arguments);
      }
    };

    this.determineColumnWidth = function (col) {
      var instance = this
        , tmp = instance.autoColumnSizeTmp;

      if (!tmp.container) {
        createTmpContainer.call(tmp, instance);
      }

      tmp.container.className = instance.rootElement[0].className + ' htAutoColumnSize';
      tmp.table.className = instance.$table[0].className;

      var rows = instance.countRows();
      var samples = {};
      var maxLen = 0;
      for (var r = 0; r < rows; r++) {
        var value = Handsontable.helper.stringify(instance.getDataAtCell(r, col));
        var len = value.length;
        if (len > maxLen) {
          maxLen = len;
        }
        if (!samples[len]) {
          samples[len] = {
            needed: sampleCount,
            strings: []
          };
        }
        if (samples[len].needed) {
          samples[len].strings.push({value: value, row: r});
          samples[len].needed--;
        }
      }

      var settings = instance.getSettings();
      if (settings.colHeaders) {
        instance.view.appendColHeader(col, tmp.theadTh); //TH innerHTML
      }

      Handsontable.Dom.empty(tmp.tbody);

      for (var i in samples) {
        if (samples.hasOwnProperty(i)) {
          for (var j = 0, jlen = samples[i].strings.length; j < jlen; j++) {
            var row = samples[i].strings[j].row;

            var cellProperties = instance.getCellMeta(row, col);
            cellProperties.col = col;
            cellProperties.row = row;

            var renderer = instance.getCellRenderer(cellProperties);

            var tr = document.createElement('tr');
            var td = document.createElement('td');

            renderer(instance, td, row, col, instance.colToProp(col), samples[i].strings[j].value, cellProperties);
            r++;
            tr.appendChild(td);
            tmp.tbody.appendChild(tr);
          }
        }
      }

      var parent = instance.rootElement[0].parentNode;
      parent.appendChild(tmp.container);
      var width = Handsontable.Dom.outerWidth(tmp.table);
      parent.removeChild(tmp.container);

      return width;
    };

    this.determineColumnsWidth = function () {
      var instance = this;
      var settings = this.getSettings();
      if (settings.autoColumnSize || !settings.colWidths) {
        var cols = this.countCols();
        for (var c = 0; c < cols; c++) {
          if (!instance._getColWidthFromSettings(c)) {
            this.autoColumnWidths[c] = plugin.determineColumnWidth.call(instance, c);
          }
        }
      }
    };

    this.modifyColWidth = function (width, col) {
      if (this.autoColumnWidths[col] && this.autoColumnWidths[col] > width) {
        return this.autoColumnWidths[col];
      }
      return width;
    };

    this.afterDestroy = function () {
      var instance = this;
      if (instance.autoColumnSizeTmp && instance.autoColumnSizeTmp.container && instance.autoColumnSizeTmp.container.parentNode) {
        instance.autoColumnSizeTmp.container.parentNode.removeChild(instance.autoColumnSizeTmp.container);
      }
      instance.autoColumnSizeTmp = null;
    };

    function createTmpContainer(instance) {
      var d = document
        , tmp = this;

      tmp.table = d.createElement('table');
      tmp.theadTh = d.createElement('th');
      tmp.table.appendChild(d.createElement('thead')).appendChild(d.createElement('tr')).appendChild(tmp.theadTh);

      tmp.tableStyle = tmp.table.style;
      tmp.tableStyle.tableLayout = 'auto';
      tmp.tableStyle.width = 'auto';

      tmp.tbody = d.createElement('tbody');
      tmp.table.appendChild(tmp.tbody);

      tmp.container = d.createElement('div');
      tmp.container.className = instance.rootElement[0].className + ' hidden';
      tmp.containerStyle = tmp.container.style;

      tmp.container.appendChild(tmp.table);
    }
  }

  var htAutoColumnSize = new HandsontableAutoColumnSize();

  Handsontable.hooks.add('beforeInit', htAutoColumnSize.beforeInit);
  Handsontable.hooks.add('afterUpdateSettings', htAutoColumnSize.beforeInit);

})(Handsontable);

/**
 * This plugin sorts the view by a column (but does not sort the data source!)
 * @constructor
 */
function HandsontableColumnSorting() {
  var plugin = this;

  this.init = function (source) {
    var instance = this;
    var sortingSettings = instance.getSettings().columnSorting;
    var sortingColumn, sortingOrder;

    instance.sortingEnabled = !!(sortingSettings);

    if (instance.sortingEnabled) {
      instance.sortIndex = [];

      var loadedSortingState = loadSortingState.call(instance);

      if (typeof loadedSortingState != 'undefined') {
        sortingColumn = loadedSortingState.sortColumn;
        sortingOrder = loadedSortingState.sortOrder;
      } else {
        sortingColumn = sortingSettings.column;
        sortingOrder = sortingSettings.sortOrder;
      }
      plugin.sortByColumn.call(instance, sortingColumn, sortingOrder);

      instance.sort = function(){
        var args = Array.prototype.slice.call(arguments);

        return plugin.sortByColumn.apply(instance, args)
      };

      if (typeof instance.getSettings().observeChanges == 'undefined'){
        enableObserveChangesPlugin.call(instance);
      }

      if (source == 'afterInit') {
        bindColumnSortingAfterClick.call(instance);

        instance.addHook('afterCreateRow', plugin.afterCreateRow);
        instance.addHook('afterRemoveRow', plugin.afterRemoveRow);
        instance.addHook('afterLoadData', plugin.init);
      }
    } else {
      delete instance.sort;

      instance.removeHook('afterCreateRow', plugin.afterCreateRow);
      instance.removeHook('afterRemoveRow', plugin.afterRemoveRow);
      instance.removeHook('afterLoadData', plugin.init);
    }
  };

  this.setSortingColumn = function (col, order) {
    var instance = this;

    if (typeof col == 'undefined') {
      delete instance.sortColumn;
      delete instance.sortOrder;

      return;
    } else if (instance.sortColumn === col && typeof order == 'undefined') {
      instance.sortOrder = !instance.sortOrder;
    } else {
      instance.sortOrder = typeof order != 'undefined' ? order : true;
    }

    instance.sortColumn = col;

  };

  this.sortByColumn = function (col, order) {
    var instance = this;

    plugin.setSortingColumn.call(instance, col, order);

    if(typeof instance.sortColumn == 'undefined'){
      return;
    }

    Handsontable.hooks.run(instance, 'beforeColumnSort', instance.sortColumn, instance.sortOrder);

    plugin.sort.call(instance);
    instance.render();

    saveSortingState.call(instance);

    Handsontable.hooks.run(instance, 'afterColumnSort', instance.sortColumn, instance.sortOrder);
  };

  var saveSortingState = function () {
    var instance = this;

    var sortingState = {};

    if (typeof instance.sortColumn != 'undefined') {
      sortingState.sortColumn = instance.sortColumn;
    }

    if (typeof instance.sortOrder != 'undefined') {
      sortingState.sortOrder = instance.sortOrder;
    }

    if (sortingState.hasOwnProperty('sortColumn') || sortingState.hasOwnProperty('sortOrder')) {
      Handsontable.hooks.run(instance, 'persistentStateSave', 'columnSorting', sortingState);
    }

  };

  var loadSortingState = function () {
    var instance = this;
    var storedState = {};
    Handsontable.hooks.run(instance, 'persistentStateLoad', 'columnSorting', storedState);

    return storedState.value;
  };

  var bindColumnSortingAfterClick = function () {
    var instance = this;

    instance.rootElement.on('click.handsontable', '.columnSorting', function (e) {
      if (Handsontable.Dom.hasClass(e.target, 'columnSorting')) {
        var col = getColumn(e.target);
        plugin.sortByColumn.call(instance, col);
      }
    });

    function countRowHeaders() {
      var THs = instance.view.TBODY.querySelector('tr').querySelectorAll('th');
      return THs.length;
    }

    function getColumn(target) {
      var TH = Handsontable.Dom.closest(target, 'TH');
      return Handsontable.Dom.index(TH) - countRowHeaders();
    }
  };

  function enableObserveChangesPlugin () {
    var instance = this;
    instance._registerTimeout('enableObserveChanges', function(){
      instance.updateSettings({
        observeChanges: true
      });
    }, 0);
  }

  function defaultSort(sortOrder) {
    return function (a, b) {
      if (a[1] === b[1]) {
        return 0;
      }
      if (a[1] === null) {
        return 1;
      }
      if (b[1] === null) {
        return -1;
      }
      if (a[1] < b[1]) return sortOrder ? -1 : 1;
      if (a[1] > b[1]) return sortOrder ? 1 : -1;
      return 0;
    }
  }

  function dateSort(sortOrder) {
    return function (a, b) {
      if (a[1] === b[1]) {
        return 0;
      }
      if (a[1] === null) {
        return 1;
      }
      if (b[1] === null) {
        return -1;
      }

      var aDate = new Date(a[1]);
      var bDate = new Date(b[1]);

      if (aDate < bDate) return sortOrder ? -1 : 1;
      if (aDate > bDate) return sortOrder ? 1 : -1;

      return 0;
    }
  }

  this.sort = function () {
    var instance = this;

    if (typeof instance.sortOrder == 'undefined') {
      return;
    }

    instance.sortingEnabled = false; //this is required by translateRow plugin hook
    instance.sortIndex.length = 0;

    var colOffset = this.colOffset();
    for (var i = 0, ilen = this.countRows() - instance.getSettings()['minSpareRows']; i < ilen; i++) {
      this.sortIndex.push([i, instance.getDataAtCell(i, this.sortColumn + colOffset)]);
    }

    var colMeta = instance.getCellMeta(0, instance.sortColumn);
    var sortFunction;
    switch (colMeta.type) {
      case 'date':
        sortFunction = dateSort;
        break;
      default:
        sortFunction = defaultSort;
    }

    this.sortIndex.sort(sortFunction(instance.sortOrder));

    //Append spareRows
    for(var i = this.sortIndex.length; i < instance.countRows(); i++){
      this.sortIndex.push([i, instance.getDataAtCell(i, this.sortColumn + colOffset)]);
    }

    instance.sortingEnabled = true; //this is required by translateRow plugin hook
  };

  this.translateRow = function (row) {
    var instance = this;

    if (instance.sortingEnabled && instance.sortIndex && instance.sortIndex.length && instance.sortIndex[row]) {
      return instance.sortIndex[row][0];
    }

    return row;
  };

  this.untranslateRow = function (row) {
    var instance = this;
    if (instance.sortingEnabled && instance.sortIndex && instance.sortIndex.length) {
      for (var i = 0; i < instance.sortIndex.length; i++) {
        if (instance.sortIndex[i][0] == row) {
          return i;
        }
      }
    }
  };

  this.getColHeader = function (col, TH) {
    if (this.getSettings().columnSorting) {
      Handsontable.Dom.addClass(TH.querySelector('.colHeader'), 'columnSorting');
    }
  };

  function isSorted(instance){
    return typeof instance.sortColumn != 'undefined';
  }

  this.afterCreateRow = function(index, amount){
    var instance = this;

    if(!isSorted(instance)){
      return;
    }


    for(var i = 0; i < instance.sortIndex.length; i++){
      if (instance.sortIndex[i][0] >= index){
        instance.sortIndex[i][0] += amount;
      }
    }

    for(var i=0; i < amount; i++){
      instance.sortIndex.splice(index+i, 0, [index+i, instance.getData()[index+i][instance.sortColumn + instance.colOffset()]]);
    }



    saveSortingState.call(instance);

  };

  this.afterRemoveRow = function(index, amount){
    var instance = this;

    if(!isSorted(instance)){
      return;
    }

    var physicalRemovedIndex = plugin.translateRow.call(instance, index);

    instance.sortIndex.splice(index, amount);

    for(var i = 0; i < instance.sortIndex.length; i++){

      if (instance.sortIndex[i][0] > physicalRemovedIndex){
        instance.sortIndex[i][0] -= amount;
      }
    }

    saveSortingState.call(instance);

  };

  this.afterChangeSort = function (changes/*, source*/) {
    var instance = this;
    var sortColumnChanged = false;
    var selection = {};
    if (!changes) {
      return;
    }

    for (var i = 0; i < changes.length; i++) {
      if (changes[i][1] == instance.sortColumn) {
        sortColumnChanged = true;
        selection.row = plugin.translateRow.call(instance, changes[i][0]);
        selection.col = changes[i][1];
        break;
      }
    }

    if (sortColumnChanged) {
      setTimeout(function () {
        plugin.sort.call(instance);
        instance.render();
        instance.selectCell(plugin.untranslateRow.call(instance, selection.row), selection.col);
      }, 0);
    }
  };
}
var htSortColumn = new HandsontableColumnSorting();

Handsontable.hooks.add('afterInit', function () {
  htSortColumn.init.call(this, 'afterInit')
});
Handsontable.hooks.add('afterUpdateSettings', function () {
  htSortColumn.init.call(this, 'afterUpdateSettings')
});
Handsontable.hooks.add('modifyRow', htSortColumn.translateRow);
Handsontable.hooks.add('afterGetColHeader', htSortColumn.getColHeader);

Handsontable.hooks.register('beforeColumnSort');
Handsontable.hooks.register('afterColumnSort');


(function (Handsontable) {
  'use strict';

  function prepareVerticalAlignClass (className, alignment) {
    if (className.indexOf(alignment)!= -1){
      return className;
    }

    className =  className
      .replace('htTop','')
      .replace('htMiddle','')
      .replace('htBottom','')
      .replace('  ','');

    className += " " + alignment;
    return className;
  }

  function prepareHorizontalAlignClass (className, alignment) {
    if (className.indexOf(alignment)!= -1){
      return className;
    }

    className =  className
      .replace('htLeft','')
      .replace('htCenter','')
      .replace('htRight','')
      .replace('htJustify','')
      .replace('  ','');

    className += " " + alignment;
    return className;
  }

  function doAlign (row, col, type, alignment) {
      var cellMeta = this.getCellMeta(row, col),
        className = alignment;

      if (cellMeta.className) {
        if(type === 'vertical') {
          className = prepareVerticalAlignClass(cellMeta.className, alignment);
        } else {
          className = prepareHorizontalAlignClass(cellMeta.className, alignment);
        }
      }

      this.setCellMeta(row, col, 'className',className);
      this.render();
  }

  function align (range, type, alignment) {
//    if (range.from.row < 0) {
//      range.from = new WalkontableCellCoords(0,range.from.col);
//      range.to = new WalkontableCellCoords(this.view.wt.wtTable.getRowStrategy().cellCount - 1, range.to.col);
//    }
//    if (range.from.col < 0) {
//      range.from = new WalkontableCellCoords(range.from.row, 0);
//      range.to = new WalkontableCellCoords(range.to.row, this.view.wt.wtTable.getColumnStrategy().cellCount - 1);
//    }

    if (range.from.row == range.to.row && range.from.col == range.to.col){
      doAlign.call(this,range.from.row, range.from.col, type, alignment);
    } else {
      for(var row = range.from.row; row<= range.to.row; row++) {
        for (var col = range.from.col; col <= range.to.col; col++) {
          doAlign.call(this,row, col, type, alignment);
        }
      }
    }
  }

  function ContextMenu(instance, customOptions){
    this.instance = instance;
    var contextMenu = this;

    this.menu = createMenu();
    this.enabled = true;

    this.bindMouseEvents();

    this.instance.addHook('afterDestroy', function () {
       contextMenu.destroy();
    });

    this.defaultOptions = {
      items: {
        'row_above': {
          name: 'Insert row above',
          callback: function(key, selection){
            this.alter("insert_row", selection.start.row);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireColumnSelection = [0,selected[1],this.view.wt.wtTable.getRowStrategy().cellCount-1,selected[1]],
              columnSelected = entireColumnSelection.join(',') == selected.join(',');

            return selected[0] < 0 || this.countRows() >= this.getSettings().maxRows || columnSelected;
          }
        },
        'row_below': {
          name: 'Insert row below',
          callback: function(key, selection){
            this.alter("insert_row", selection.end.row + 1);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireColumnSelection = [0,selected[1],this.view.wt.wtTable.getRowStrategy().cellCount-1,selected[1]],
              columnSelected = entireColumnSelection.join(',') == selected.join(',');

            return this.getSelected()[0] < 0 || this.countRows() >= this.getSettings().maxRows || columnSelected;
          }
        },
        "hsep1": ContextMenu.SEPARATOR,
        'col_left': {
          name: 'Insert column on the left',
          callback: function(key, selection){
            this.alter("insert_col", selection.start.col);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireRowSelection = [selected[0],0, selected[0],this.view.wt.wtTable.getColumnStrategy().cellCount-1],
              rowSelected = entireRowSelection.join(',') == selected.join(',');

            return this.getSelected()[1] < 0 || this.countCols() >= this.getSettings().maxCols || rowSelected;
          }
        },
        'col_right': {
          name: 'Insert column on the right',
          callback: function(key, selection){
            this.alter("insert_col", selection.end.col + 1);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireRowSelection = [selected[0],0, selected[0],this.view.wt.wtTable.getColumnStrategy().cellCount-1],
              rowSelected = entireRowSelection.join(',') == selected.join(',');

            return selected[1] < 0 || this.countCols() >= this.getSettings().maxCols || rowSelected;
          }
        },
        "hsep2": ContextMenu.SEPARATOR,
        'remove_row': {
          name: 'Remove row',
          callback: function(key, selection){
            var amount = selection.end.row - selection.start.row + 1;
            this.alter("remove_row", selection.start.row, amount);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireColumnSelection = [0,selected[1],this.view.wt.wtTable.getRowStrategy().cellCount-1,selected[1]],
              columnSelected = entireColumnSelection.join(',') == selected.join(',');
            return (selected[0] < 0 || columnSelected);
          }
        },
        'remove_col': {
          name: 'Remove column',
          callback: function(key, selection){
            var amount = selection.end.col - selection.start.col + 1;
            this.alter("remove_col", selection.start.col, amount);
          },
          disabled: function (){
            var selected = this.getSelected(),
              entireRowSelection = [selected[0],0, selected[0],this.view.wt.wtTable.getColumnStrategy().cellCount-1],
              rowSelected = entireRowSelection.join(',') == selected.join(',');
            return (selected[1] < 0 || rowSelected);
          }
        },
        "hsep3": ContextMenu.SEPARATOR,
        'undo': {
          name: 'Undo',
          callback: function(){
            this.undo();
          },
          disabled: function () {
            return this.undoRedo && !this.undoRedo.isUndoAvailable();
          }
        },
        'redo': {
          name: 'Redo',
          callback: function(){
            this.redo();
          },
          disabled: function () {
            return this.undoRedo && !this.undoRedo.isRedoAvailable();
          }
        },
        "hsep4": ContextMenu.SEPARATOR,
        'make_read_only': {
          name: function() {
            var atLeastOneReadOnly = contextMenu.checkSelectionReadOnlyConsistency(this);

            if(!atLeastOneReadOnly) {
              return "Make read-only";
            } else {
              return "Make writable";
            }
          },
          callback: function() {
            var atLeastOneReadOnly = contextMenu.checkSelectionReadOnlyConsistency(this);

            var that = this;
            this.getSelectedRange().forAll(function(r, c) {
              that.getCellMeta(r, c).readOnly = atLeastOneReadOnly ? false : true;
            });

            this.render();
          }
        },
        "hsep5": ContextMenu.SEPARATOR,
        'horizontal_alignment': {
          name: function () {
            var div = document.createElement('div'),
              button = document.createElement('button'),
              lButton = button.cloneNode(true),
              rButton = button.cloneNode(true),
              cButton = button.cloneNode(true),
              jButton = button.cloneNode(true),
              lText = document.createTextNode('left'),
              cText = document.createTextNode('center'),
              rText = document.createTextNode('right'),
              jText = document.createTextNode('justify');

            lButton.appendChild(lText);
            cButton.appendChild(cText);
            rButton.appendChild(rText);
            jButton.appendChild(jText);

            Handsontable.Dom.addClass(lButton,'Left');
            Handsontable.Dom.addClass(cButton,'Center');
            Handsontable.Dom.addClass(rButton,'Right');
            Handsontable.Dom.addClass(jButton,'Justify');

            div.appendChild(lButton);
            div.appendChild(cButton);
            div.appendChild(rButton);
            div.appendChild(jButton);

            return div.outerHTML;
          },
          callback: function (key, selection ,event) {
            var className = event.target.className,
              type = event.target.tagName;

            if (type === "BUTTON") {
              if(className) {
                align.call(this, this.getSelectedRange(),'horizontal','ht' + className );
              }
            }

          },
          disabled: function () {
            return false;
          }
        },
        "hsep6": ContextMenu.SEPARATOR,
        'vertical_alignment': {
          name: function () {
            var div = document.createElement('div'),
              button = document.createElement('button'),
              tButton = button.cloneNode(true),
              mButton = button.cloneNode(true),
              bButton = button.cloneNode(true),
              tText = document.createTextNode('top'),
              mText = document.createTextNode('middle'),
              bText = document.createTextNode('bottom');

            tButton.appendChild(tText);
            mButton.appendChild(mText);
            bButton.appendChild(bText);

            Handsontable.Dom.addClass(tButton,'Top');
            Handsontable.Dom.addClass(mButton,'Middle');
            Handsontable.Dom.addClass(bButton,'Bottom');

            div.appendChild(tButton);
            div.appendChild(mButton);
            div.appendChild(bButton);

            return div.outerHTML;
          },
          callback: function (key, selection ,event) {
            var className = event.target.className,
              type = event.target.tagName;
            if (type === "BUTTON") {
              if(className) {
                align.call(this, this.getSelectedRange(),'vertical','ht' + className );
              }
            }
          },
          disabled: function () {
            return false;
          }
        }
      }
    };

    this.checkSelectionReadOnlyConsistency = function(hot) {
      var atLeastOneReadOnly = false;

      hot.getSelectedRange().forAll(function(r, c) {
        if(hot.getCellMeta(r, c).readOnly) {
          atLeastOneReadOnly = true;
          return false; //breaks forAll
        }
      });

      return atLeastOneReadOnly;
    };

    Handsontable.hooks.run(instance, 'afterContextMenuDefaultOptions', this.defaultOptions);

    this.options = {};
    Handsontable.helper.extend(this.options, this.defaultOptions);

    this.updateOptions(customOptions);

    function createMenu(){

      var menu = $('body > .htContextMenu')[0];

      if(!menu){
        menu = document.createElement('DIV');
        Handsontable.Dom.addClass(menu, 'htContextMenu');
        document.getElementsByTagName('body')[0].appendChild(menu);
      }

      return menu;
    }
  }

  ContextMenu.prototype.bindMouseEvents = function (){

    function contextMenuOpenListener(event){

      event.preventDefault();

      var showRowHeaders = this.instance.getSettings().rowHeaders,
          showColHeaders = this.instance.getSettings().colHeaders;

      if(!(showRowHeaders || showColHeaders)) {
        if(event.target.nodeName != 'TD' && !(Handsontable.Dom.hasClass(event.target, 'current') && Handsontable.Dom.hasClass(event.target, 'wtBorder'))){
          return;
        }
      }

      //if(event.target.nodeName != 'TD' && !(Handsontable.Dom.hasClass(event.target, 'current') && Handsontable.Dom.hasClass(event.target, 'wtBorder'))){
      //	return;
      //}

      this.show(event.pageY, event.pageX);

      $(document).on('mousedown.htContextMenu', Handsontable.helper.proxy(ContextMenu.prototype.close, this));
    }

    this.instance.rootElement.on('contextmenu.htContextMenu', Handsontable.helper.proxy(contextMenuOpenListener, this));

  };

  ContextMenu.prototype.bindTableEvents = function () {
    var that = this;

    this._afterScrollCallback = function () {
      that.close();
    };

    this.instance.addHook('afterScrollVertically', this._afterScrollCallback);
    this.instance.addHook('afterScrollHorizontally', this._afterScrollCallback);
  };

  ContextMenu.prototype.unbindTableEvents = function () {
    if(this._afterScrollCallback){
      this.instance.removeHook('afterScrollVertically', this._afterScrollCallback);
      this.instance.removeHook('afterScrollHorizontally', this._afterScrollCallback);
      this._afterScrollCallback = null;
    }
  };

  ContextMenu.prototype.performAction = function (event){
    var hot = $(this.menu).handsontable('getInstance');
    var selectedItemIndex = hot.getSelected()[0];
    var selectedItem = hot.getData()[selectedItemIndex];

    if (selectedItem.disabled === true || (typeof selectedItem.disabled == 'function' && selectedItem.disabled.call(this.instance) === true)){
      return;
    }

    if(typeof selectedItem.callback != 'function'){
      return;
    }
    var selRange = this.instance.getSelectedRange();
    var normalizedSelection = ContextMenu.utils.normalizeSelection(selRange);

    selectedItem.callback.call(this.instance, selectedItem.key, normalizedSelection, event);
  };

  ContextMenu.prototype.unbindMouseEvents = function () {
    this.instance.rootElement.off('contextmenu.htContextMenu');
    $(document).off('mousedown.htContextMenu');
  };

  ContextMenu.prototype.show = function(top, left){
    this.menu.style.display = 'block';

    $(this.menu)
      .off('mousedown.htContextMenu')
      .on('mousedown.htContextMenu', Handsontable.helper.proxy(this.performAction, this));

    $(this.menu).handsontable({
      data: ContextMenu.utils.convertItemsToArray(this.getItems()),
      colHeaders: false,
      colWidths: [160],
      readOnly: true,
      copyPaste: false,
      columns: [
        {
          data: 'name',
          renderer: Handsontable.helper.proxy(this.renderer, this)
        }
      ],
      beforeKeyDown: Handsontable.helper.proxy(this.onBeforeKeyDown, this),
      renderAllRows: true
    });
    this.bindTableEvents();

    this.setMenuPosition(top, left);

    $(this.menu).handsontable('listen');

  };

  ContextMenu.prototype.close = function () {
    this.hide();
    $(document).off('mousedown.htContextMenu');
    this.unbindTableEvents();
    this.instance.listen();
  };

  ContextMenu.prototype.hide = function(){
    this.menu.style.display = 'none';
    $(this.menu).handsontable('destroy');
  };

  ContextMenu.prototype.renderer = function(instance, TD, row, col, prop, value, cellProperties){
    var contextMenu = this;
    var item = instance.getData()[row];
    var wrapper = document.createElement('DIV');

    if(typeof value === 'function') {
      value = value.call(this.instance);
    }

    Handsontable.Dom.empty(TD);
    TD.appendChild(wrapper);

    if(itemIsSeparator(item)){
      Handsontable.Dom.addClass(TD, 'htSeparator');
    } else {
      Handsontable.Dom.fastInnerHTML(wrapper, value);
    }

    if (itemIsDisabled(item)){
      Handsontable.Dom.addClass(TD, 'htDisabled');

      $(wrapper).on('mouseenter', function () {
        instance.deselectCell();
      });

    } else {
      Handsontable.Dom.removeClass(TD, 'htDisabled');

      $(wrapper).on('mouseenter', function () {
        instance.selectCell(row, col);
      });

    }

    function itemIsSeparator(item){
      return new RegExp(ContextMenu.SEPARATOR, 'i').test(item.name);
    }

    function itemIsDisabled(item){
      return item.disabled === true || (typeof item.disabled == 'function' && item.disabled.call(contextMenu.instance) === true);
    }
  };

  ContextMenu.prototype.onBeforeKeyDown = function (event) {
    var contextMenu = this;
    var instance = $(contextMenu.menu).handsontable('getInstance');
    var selection = instance.getSelected();

    switch(event.keyCode){

      case Handsontable.helper.keyCode.ESCAPE:
        contextMenu.close();
        event.preventDefault();
        event.stopImmediatePropagation();
        break;

      case Handsontable.helper.keyCode.ENTER:
        if(instance.getSelected()){
          contextMenu.performAction();
          contextMenu.close();
        }
        break;

      case Handsontable.helper.keyCode.ARROW_DOWN:
        if(!selection){

          selectFirstCell(instance);

        } else {

          selectNextCell(selection[0], selection[1], instance);

        }

        event.preventDefault();
        event.stopImmediatePropagation();

        break;

      case Handsontable.helper.keyCode.ARROW_UP:
        if(!selection){

          selectLastCell(instance);

        }  else {

          selectPrevCell(selection[0], selection[1], instance);

        }

        event.preventDefault();
        event.stopImmediatePropagation();

        break;

    }

    function selectFirstCell(instance) {

      var firstCell = instance.getCell(0, 0);

      if(ContextMenu.utils.isSeparator(firstCell) || ContextMenu.utils.isDisabled(firstCell)){
        selectNextCell(0, 0, instance);
      } else {
        instance.selectCell(0, 0);
      }

    }


    function selectLastCell(instance) {

      var lastRow = instance.countRows() - 1;
      var lastCell = instance.getCell(lastRow, 0);

      if(ContextMenu.utils.isSeparator(lastCell) || ContextMenu.utils.isDisabled(lastCell)){
        selectPrevCell(lastRow, 0, instance);
      } else {
        instance.selectCell(lastRow, 0);
      }

    }

    function selectNextCell(row, col, instance){
      var nextRow = row + 1;
      var nextCell =  nextRow < instance.countRows() ? instance.getCell(nextRow, col) : null;

      if(!nextCell){
        return;
      }

      if(ContextMenu.utils.isSeparator(nextCell) || ContextMenu.utils.isDisabled(nextCell)){
        selectNextCell(nextRow, col, instance);
      } else {
        instance.selectCell(nextRow, col);
      }
    }

    function selectPrevCell(row, col, instance) {

      var prevRow = row - 1;
      var prevCell = prevRow >= 0 ? instance.getCell(prevRow, col) : null;

      if (!prevCell) {
        return;
      }

      if(ContextMenu.utils.isSeparator(prevCell) || ContextMenu.utils.isDisabled(prevCell)){
        selectPrevCell(prevRow, col, instance);
      } else {
        instance.selectCell(prevRow, col);
      }

    }

  };

  ContextMenu.prototype.getItems = function () {
    var items = {};
    function Item(rawItem){
      if(typeof rawItem == 'string'){
        this.name = rawItem;
      } else {
        Handsontable.helper.extend(this, rawItem);
      }
    }
    Item.prototype = this.options;

    for(var itemName in this.options.items){
      if(this.options.items.hasOwnProperty(itemName) && (!this.itemsFilter || this.itemsFilter.indexOf(itemName) != -1)){
        items[itemName] = new Item(this.options.items[itemName]);
      }
    }

    return items;

  };

  ContextMenu.prototype.updateOptions = function(newOptions){
    newOptions = newOptions || {};

    if(newOptions.items){
      for(var itemName in newOptions.items){
        var item = {};

        if(newOptions.items.hasOwnProperty(itemName)) {
          if(this.defaultOptions.items.hasOwnProperty(itemName)
            && Handsontable.helper.isObject(newOptions.items[itemName])){
            Handsontable.helper.extend(item, this.defaultOptions.items[itemName]);
            Handsontable.helper.extend(item, newOptions.items[itemName]);
            newOptions.items[itemName] = item;
          }
        }

      }
    }

    Handsontable.helper.extend(this.options, newOptions);
  };

  ContextMenu.prototype.setMenuPosition = function (cursorY, cursorX) {
    var scrollTop = Handsontable.Dom.getWindowScrollTop();
    var scrollLeft = Handsontable.Dom.getWindowScrollLeft();

    var cursor = {
      top:  cursorY,
      topRelative: cursorY - scrollTop,
      left: cursorX,
      leftRelative:cursorX - scrollLeft,
      scrollTop: scrollTop,
      scrollLeft: scrollLeft
    };

    if(this.menuFitsBelowCursor(cursor)){
      this.positionMenuBelowCursor(cursor);
    } else {
      if (this.menuFitsAboveCursor(cursor)) {
        this.positionMenuAboveCursor(cursor);
      } else {
        this.positionMenuBelowCursor(cursor);
      }
    }

    if(this.menuFitsOnRightOfCursor(cursor)){
      this.positionMenuOnRightOfCursor(cursor);
    } else {
      this.positionMenuOnLeftOfCursor(cursor);
    }

  };

  ContextMenu.prototype.menuFitsAboveCursor = function (cursor) {
    return cursor.topRelative >= this.menu.offsetHeight;
  };

  ContextMenu.prototype.menuFitsBelowCursor = function (cursor) {
    return cursor.topRelative + this.menu.offsetHeight <= cursor.scrollTop + document.body.clientHeight;
  };

  ContextMenu.prototype.menuFitsOnRightOfCursor = function (cursor) {
    return cursor.leftRelative + this.menu.offsetWidth <= cursor.scrollLeft + document.body.clientWidth;
  };

  ContextMenu.prototype.positionMenuBelowCursor = function (cursor) {
    this.menu.style.top = cursor.top + 'px';
  };

  ContextMenu.prototype.positionMenuAboveCursor = function (cursor) {
    this.menu.style.top = (cursor.top - this.menu.offsetHeight) + 'px';
  };

  ContextMenu.prototype.positionMenuOnRightOfCursor = function (cursor) {
    this.menu.style.left = cursor.left + 'px';
  };

  ContextMenu.prototype.positionMenuOnLeftOfCursor = function (cursor) {
    this.menu.style.left = (cursor.left - this.menu.offsetWidth) + 'px';
  };

  ContextMenu.utils = {};
  ContextMenu.utils.convertItemsToArray = function (items) {
    var itemArray = [];
    var item;
    for(var itemName in items){
      if(items.hasOwnProperty(itemName)){
        if(typeof items[itemName] == 'string'){
          item = {name: items[itemName]};
        } else if (items[itemName].visible !== false) {
          item = items[itemName];
        } else {
          continue;
        }

        item.key = itemName;
        itemArray.push(item);
      }
    }

    return itemArray;
  };

  ContextMenu.utils.normalizeSelection = function(selRange){
   return {
      start: selRange.getTopLeftCorner(),
      end: selRange.getBottomRightCorner()
    };
  };

  ContextMenu.utils.isSeparator = function (cell) {
    return Handsontable.Dom.hasClass(cell, 'htSeparator');
  };

  ContextMenu.utils.isDisabled = function (cell) {
    return Handsontable.Dom.hasClass(cell, 'htDisabled');
  };

  ContextMenu.prototype.enable = function () {
    if(!this.enabled){
      this.enabled = true;
      this.bindMouseEvents();
    }
  };

  ContextMenu.prototype.disable = function () {
    if(this.enabled){
      this.enabled = false;
      this.close();
      this.unbindMouseEvents();
      this.unbindTableEvents();
    }
  };

  ContextMenu.prototype.destroy = function () {
    this.close();
    this.unbindMouseEvents();
    this.unbindTableEvents();

    if(!this.isMenuEnabledByOtherHotInstance()){
      this.removeMenu();
    }

  };

  ContextMenu.prototype.isMenuEnabledByOtherHotInstance = function () {
    var hotContainers = $('.handsontable');
    var menuEnabled = false;

    for(var i = 0, len = hotContainers.length; i < len; i++){
      var instance = $(hotContainers[i]).handsontable('getInstance');
      if(instance && instance.getSettings().contextMenu){
        menuEnabled = true;
        break;
      }
    }

    return menuEnabled;
  };

  ContextMenu.prototype.removeMenu = function () {
    if(this.menu.parentNode){
      this.menu.parentNode.removeChild(this.menu);
    }
  };

  ContextMenu.prototype.filterItems = function(itemsToLeave){
    this.itemsFilter = itemsToLeave;
  };

  ContextMenu.SEPARATOR = "---------";

  function updateHeight() {

    if(this.rootElement[0].className.indexOf('htContextMenu')) {
      return;
    }

    var realSeparatorHeight = 0,
        realEntrySize = 0,
        dataSize = this.getSettings().data.length;

    for(var i = 0; i < dataSize; i++) {
      if(this.getSettings().data[i].name == ContextMenu.SEPARATOR) {
        realSeparatorHeight += 2;
      } else {
        realEntrySize += 26;
      }
    }

    this.view.wt.wtScrollbars.vertical.fixedContainer.style.height = realEntrySize + realSeparatorHeight + "px";
  }

  function init(){
    var instance = this;
    var contextMenuSetting = instance.getSettings().contextMenu;
    var customOptions = Handsontable.helper.isObject(contextMenuSetting) ? contextMenuSetting : {};

    if(contextMenuSetting){
      if(!instance.contextMenu){
        instance.contextMenu = new ContextMenu(instance, customOptions);
      }

      instance.contextMenu.enable();

      if(Handsontable.helper.isArray(contextMenuSetting)){
        instance.contextMenu.filterItems(contextMenuSetting);
      }

    }  else if(instance.contextMenu){
      instance.contextMenu.destroy();
      delete instance.contextMenu;
    }

  }

  Handsontable.hooks.add('afterInit', init);
  Handsontable.hooks.add('afterUpdateSettings', init);
  Handsontable.hooks.add('afterInit',updateHeight);

  if(Handsontable.PluginHooks.register) { //HOT 0.11+
    Handsontable.PluginHooks.register('afterContextMenuDefaultOptions');
  }

  Handsontable.ContextMenu = ContextMenu;

})(Handsontable);

function HandsontableManualColumnMove() {
  var pressed
    , startCol
    , endCol
    , startX
    , startOffset;

  var ghost = document.createElement('DIV')
    , ghostStyle = ghost.style;

  ghost.className = 'ghost';
  ghostStyle.position = 'absolute';
  ghostStyle.top = '25px';
  ghostStyle.left = 0;
  ghostStyle.width = '10px';
  ghostStyle.height = '10px';
  ghostStyle.backgroundColor = '#CCC';
  ghostStyle.opacity = 0.7;

  var saveManualColumnPositions = function () {
    var instance = this;

    Handsontable.hooks.run(instance, 'persistentStateSave', 'manualColumnPositions', instance.manualColumnPositions);
  };

  var loadManualColumnPositions = function () {
    var instance = this;
    var storedState = {};
    Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualColumnPositions', storedState);

    return storedState.value;
  };


  var bindMoveColEvents = function () {
    var instance = this;

    instance.rootElement.on('mousemove.manualColumnMove', function (e) {
      if (pressed) {
        ghostStyle.left = startOffset + e.pageX - startX + 6 + 'px';
        if (ghostStyle.display === 'none') {
          ghostStyle.display = 'block';
        }
      }
    });

    instance.rootElement.on('mouseup.manualColumnMove', function () {
      if (pressed) {
        if (startCol < endCol) {
          endCol--;
        }
        if (instance.getSettings().rowHeaders) {
          startCol--;
          endCol--;
        }
        instance.manualColumnPositions.splice(endCol, 0, instance.manualColumnPositions.splice(startCol, 1)[0]);
        $('.manualColumnMover.active').removeClass('active');
        pressed = false;
        instance.forceFullRender = true;
        instance.view.render(); //updates all
        ghostStyle.display = 'none';

        saveManualColumnPositions.call(instance);

        Handsontable.hooks.run(instance, 'afterColumnMove', startCol, endCol);
      }
    });

    instance.rootElement.on('mousedown.manualColumnMove', '.manualColumnMover', function (e) {

      var mover = e.currentTarget;
      var TH = Handsontable.Dom.closest(mover, 'TH');
      startCol = Handsontable.Dom.index(TH) + instance.colOffset();
      endCol = startCol;
      pressed = true;
      startX = e.pageX;

      var TABLE = instance.$table[0];
      TABLE.parentNode.appendChild(ghost);
      ghostStyle.width = Handsontable.Dom.outerWidth(TH) + 'px';
      ghostStyle.height = Handsontable.Dom.outerHeight(TABLE) + 'px';
      startOffset = parseInt(Handsontable.Dom.offset(TH).left - Handsontable.Dom.offset(TABLE).left, 10);
      ghostStyle.left = startOffset + 6 + 'px';
    });

    instance.rootElement.on('mouseenter.manualColumnMove', 'td, th', function () {
      if (pressed) {
        var active = instance.view.THEAD.querySelector('.manualColumnMover.active');
        if (active) {
          Handsontable.Dom.removeClass(active, 'active');
        }
        endCol = Handsontable.Dom.index(this) + instance.colOffset();
        var THs = instance.view.THEAD.querySelectorAll('th');
        var mover = THs[endCol].querySelector('.manualColumnMover');
        Handsontable.Dom.addClass(mover, 'active');
      }
    });

    instance.addHook('afterDestroy', unbindMoveColEvents);
  };

  var unbindMoveColEvents = function(){
    var instance = this;
    instance.rootElement.off('mouseup.manualColumnMove');
    instance.rootElement.off('mousemove.manualColumnMove');
    instance.rootElement.off('mousedown.manualColumnMove');
    instance.rootElement.off('mouseenter.manualColumnMove');
  };

  this.beforeInit = function () {
    this.manualColumnPositions = [];
  };

  this.init = function (source) {
    var instance = this;

    var manualColMoveEnabled = !!(this.getSettings().manualColumnMove);

    if (manualColMoveEnabled) {
      var initialManualColumnPositions = this.getSettings().manualColumnMove;

      var loadedManualColumnPositions = loadManualColumnPositions.call(instance);

      if (typeof loadedManualColumnPositions != 'undefined') {
        this.manualColumnPositions = loadedManualColumnPositions;
      } else if (initialManualColumnPositions instanceof Array) {
        this.manualColumnPositions = initialManualColumnPositions;
      } else {
        this.manualColumnPositions = [];
      }


      instance.forceFullRender = true;

      if (source == 'afterInit') {
        bindMoveColEvents.call(this);
        if (this.manualColumnPositions.length > 0) {
          this.forceFullRender = true;
          this.render();
        }

      }

    } else {
      unbindMoveColEvents.call(this);
      this.manualColumnPositions = [];
    }
  };

  this.modifyCol = function (col) {
    //TODO test performance: http://jsperf.com/object-wrapper-vs-primitive/2
    if (this.getSettings().manualColumnMove) {
      if (typeof this.manualColumnPositions[col] === 'undefined') {
        this.manualColumnPositions[col] = col;
      }
      return this.manualColumnPositions[col];
    }
    return col;
  };

  this.getColHeader = function (col, TH) {
    if (this.getSettings().manualColumnMove) {
      var DIV = document.createElement('DIV');
      DIV.className = 'manualColumnMover';
      TH.firstChild.appendChild(DIV);
    }
  };
}
var htManualColumnMove = new HandsontableManualColumnMove();

Handsontable.hooks.add('beforeInit', htManualColumnMove.beforeInit);
Handsontable.hooks.add('afterInit', function () {
  htManualColumnMove.init.call(this, 'afterInit')
});

Handsontable.hooks.add('afterUpdateSettings', function () {
  htManualColumnMove.init.call(this, 'afterUpdateSettings')
});
Handsontable.hooks.add('afterGetColHeader', htManualColumnMove.getColHeader);
Handsontable.hooks.add('modifyCol', htManualColumnMove.modifyCol);

Handsontable.hooks.register('afterColumnMove');

function HandsontableManualColumnResize() {
  var pressed
    , currentTH
    , currentCol
    , currentWidth
    , instance
    , newSize
    , startX
    , startWidth
    , startOffset
    , scrollTop = 0
    , scrollLeft = 0
    , resizer = document.createElement('DIV')
    , handle = document.createElement('DIV')
    , line = document.createElement('DIV')
    , lineStyle = line.style;

  resizer.className = 'manualColumnResizer';

  handle.className = 'manualColumnResizerHandle';
  resizer.appendChild(handle);

  line.className = 'manualColumnResizerLine';
  resizer.appendChild(line);

  var $document = $(document);

  $document.mousemove(function (e) {
    if (pressed) {
      currentWidth = startWidth + (e.pageX - startX);
      newSize = setManualSize(currentCol, currentWidth); //save col width
      resizer.style.left = startOffset + currentWidth + 'px';
    }
  });

  $document.mouseup(function () {
    if (pressed) {
      Handsontable.Dom.removeClass(resizer, 'active');
      pressed = false;

      if(newSize != startWidth){
        instance.forceFullRender = true;
        instance.view.render(); //updates all

        saveManualColumnWidths.call(instance);

        Handsontable.hooks.run(instance, 'afterColumnResize', currentCol, newSize);
      }

      refreshResizerPosition.call(instance, currentTH);
    }
  });

  var saveManualColumnWidths = function () {
    var instance = this;

    Handsontable.hooks.run(instance, 'persistentStateSave', 'manualColumnWidths', instance.manualColumnWidths);
  };

  var loadManualColumnWidths = function () {
    var instance = this;
    var storedState = {};
    Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualColumnWidths', storedState);

    return storedState.value;
  };

  function refreshResizerPosition(TH) {
    instance = this;
    currentTH = TH;

    var col = this.view.wt.wtTable.getCoords(TH).col; //getCoords returns WalkontableCellCoords
    if (col >= 0) { //if not row header
      currentCol = col;
      var rootOffset = Handsontable.Dom.offset(this.rootElement[0]).left;
      var thOffset = Handsontable.Dom.offset(TH).left;
      startOffset = (thOffset - rootOffset) - 6 + scrollLeft;
      resizer.style.left = startOffset + parseInt(Handsontable.Dom.outerWidth(TH), 10) + 'px';
      resizer.style.top = scrollTop + 'px';
      this.rootElement[0].appendChild(resizer);
    }
  }

  function refreshLinePosition() {
    var instance = this;
    startWidth = parseInt(Handsontable.Dom.outerWidth(currentTH), 10);
    Handsontable.Dom.addClass(resizer, 'active');
    lineStyle.height = Handsontable.Dom.outerHeight(instance.$table[0]) + 'px';
    pressed = instance;
  }

  var bindManualColumnWidthEvents = function () {
    var instance = this;
    var dblclick = 0;
    var autoresizeTimeout = null;

    this.rootElement.on('mouseenter.handsontable', 'table thead tr > th', function (e) {
      if (!pressed) {
        refreshResizerPosition.call(instance, e.currentTarget);
      }
    });

    this.rootElement.on('mousedown.handsontable', '.manualColumnResizer', function () {
      if (autoresizeTimeout == null) {
        autoresizeTimeout = setTimeout(function () {
          if (dblclick >= 2) {
            newSize = instance.determineColumnWidth.call(instance, currentCol);
            setManualSize(currentCol, newSize);
            instance.forceFullRender = true;
            instance.view.render(); //updates all
            Handsontable.hooks.run(instance, 'afterColumnResize', currentCol, newSize);
          }
          dblclick = 0;
          autoresizeTimeout = null;
        }, 500);
      }
      dblclick++;
    });

    this.rootElement.on('mousedown.handsontable', '.manualColumnResizer', function (e) {
      startX = e.pageX;
      refreshLinePosition.call(instance);
      newSize = startWidth;
    });
  };

  this.beforeInit = function () {
    this.manualColumnWidths = [];
  };

  this.init = function (source) {
    var instance = this;
    var manualColumnWidthEnabled = !!(this.getSettings().manualColumnResize);

    if (manualColumnWidthEnabled) {
      var initialColumnWidths = this.getSettings().manualColumnResize;

      var loadedManualColumnWidths = loadManualColumnWidths.call(instance);

      if (typeof loadedManualColumnWidths != 'undefined') {
        this.manualColumnWidths = loadedManualColumnWidths;
      } else if (initialColumnWidths instanceof Array) {
        this.manualColumnWidths = initialColumnWidths;
      } else {
        this.manualColumnWidths = [];
      }

      if (source == 'afterInit') {
        bindManualColumnWidthEvents.call(this);
        instance.forceFullRender = true;
        instance.render();

        Handsontable.hooks.add('afterScrollVertically', afterScrollVertically);
        Handsontable.hooks.add('afterScrollHorizontally', afterScrollHorizontally);
      }
    }
  };


  var setManualSize = function (col, width) {
    width = Math.max(width, 20);

    /**
     *  We need to run col through modifyCol hook, in case the order of displayed columns is different than the order
     *  in data source. For instance, this order can be modified by manualColumnMove plugin.
     */
    col = Handsontable.hooks.execute(instance, 'modifyCol', col);

    instance.manualColumnWidths[col] = width;
    return width;
  };

  this.modifyColWidth = function (width, col) {
    col = this.runHooksAndReturn('modifyCol', col);
    if (this.getSettings().manualColumnResize && this.manualColumnWidths[col]) {
      return this.manualColumnWidths[col];
    }
    return width;
  };

  var afterScrollVertically = function () {
    scrollTop = Handsontable.Dom.getScrollTop(this.rootElement[0]);
  };

  var afterScrollHorizontally = function () {
    scrollLeft = Handsontable.Dom.getScrollLeft(this.rootElement[0]);
  }
}
var htManualColumnResize = new HandsontableManualColumnResize();

Handsontable.hooks.add('beforeInit', htManualColumnResize.beforeInit);
Handsontable.hooks.add('afterInit', function () {
  htManualColumnResize.init.call(this, 'afterInit')
});
Handsontable.hooks.add('afterUpdateSettings', function () {
  htManualColumnResize.init.call(this, 'afterUpdateSettings')
});
Handsontable.hooks.add('modifyColWidth', htManualColumnResize.modifyColWidth);

Handsontable.hooks.register('afterColumnResize');

(function (Handsontable) {
  function HandsontableManualRowResize () {

    var pressed
      , currentTH
      , currentRow
      , currentHeight
      , instance
      , newSize
      , startY
      , startHeight
      , startOffset
      , scrollTop = 0
      , scrollLeft = 0
      , resizer = document.createElement('DIV')
      , handle = document.createElement('DIV')
      , line = document.createElement('DIV')
      , lineStyle = line.style;


    resizer.className = 'manualRowResizer';
    handle.className = 'manualRowResizerHandle';

    resizer.appendChild(handle);

    line.className = 'manualRowResizerLine';
    resizer.appendChild(line);

    var $document = $(document);
    $document.mousemove(function (e) {
      if (pressed) {
        currentHeight = startHeight + (e.pageY - startY);
        newSize = setManualSize(currentRow, currentHeight);
        resizer.style.top = startOffset + currentHeight + 'px';
      }
    });

    $document.mouseup(function () {
      if (pressed) {
        Handsontable.Dom.removeClass(resizer, 'active');
        pressed = false;

        if (newSize != startHeight) {
          instance.forceFullRender = true;
          instance.view.render();

          saveManualRowHeights.call(instance);

          Handsontable.hooks.run(instance, 'afterRowResize', currentRow, newSize);
        }

        refreshResizerPosition.call(instance, currentTH);
      }
    });

    var saveManualRowHeights = function () {
      var instance = this;
      Handsontable.hooks.run(instance, 'persistentStateSave', 'manualRowHeights', instance.manualRowHeights);
    };

    var loadManualRowHeights = function () {
      var instance = this
        , storedState = {};

      Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualRowHeights', storedState);

      return storedState.value;
    };

    var refreshResizerPosition = function(TH) {
      instance = this;
      currentTH = TH;

      var row = this.view.wt.wtTable.getCoords(TH).row; //getCoords returns WalkontableCellCoords

      if (row >= 0) { //if not row header
        currentRow = row;
        var rootOffset = Handsontable.Dom.offset(this.rootElement[0]).top;
        var thOffset = Handsontable.Dom.offset(TH).top;
        startOffset = (thOffset - rootOffset) + scrollTop - 4;
        resizer.style.top = startOffset + parseInt(Handsontable.Dom.outerHeight(TH), 10) + 'px';
        resizer.style.left = scrollLeft + 'px';
        this.rootElement[0].appendChild(resizer);
      }
    }

    var refreshLinePosition = function() {
      var instance = this;
      startHeight = parseInt(Handsontable.Dom.outerHeight(currentTH), 10);
      Handsontable.Dom.addClass(resizer, 'active');
      lineStyle.width = Handsontable.Dom.outerWidth(instance.$table[0]) + 'px';
      pressed = instance;
    }

    var bindManualRowHeightEvents = function () {
      var instance = this,
        autoresizeTimeout = null,
        dblclick = 0;


      instance.rootElement.on('mouseenter.handsontable', 'table tbody tr > th', function (e) {
        if (!pressed) {
          refreshResizerPosition.call(instance, e.currentTarget);
        }
      });


      instance.rootElement.on('mousedown.handsontable', '.manualRowResizer', function () {
        if (autoresizeTimeout == null) {
          autoresizeTimeout = setTimeout(function () {

            if (dblclick >= 2) {
              setManualSize(currentRow, null); //double click sets auto row size
              instance.forceFullRender = true;
              instance.view.render();
              Handsontable.hooks.run(instance, 'afterRowResize', currentRow, newSize);
            }

            dblclick = 0;
            autoresizeTimeout = null;
          }, 200);
        }
        dblclick++;
      });

      instance.rootElement.on('mousedown.handsontable', '.manualRowResizer', function (e) {
        startY = e.pageY;
        refreshLinePosition.call(instance);
        newSize = startHeight;
      });
    };

    this.beforeInit = function () {
      this.manualRowHeights = [];
    };

    this.init = function (source) {

      var instance = this;
      var manualColumnHeightEnabled = !!(this.getSettings().manualRowResize);

      if (manualColumnHeightEnabled) {

        var initialRowHeights = this.getSettings().manualRowResize;

        var loadedManualRowHeights = loadManualRowHeights.call(instance);

        if (typeof loadedManualRowHeights != 'undefined') {
          this.manualRowHeights = loadedManualRowHeights;
        } else if (initialRowHeights instanceof Array) {
          this.manualRowHeights = initialRowHeights;
        } else {
          this.manualRowHeights = [];
        }

        if (source === 'afterInit') {
          bindManualRowHeightEvents.call(this);
          instance.forceFullRender = true;
          instance.render();
          Handsontable.hooks.add('afterScrollVertically', afterScrollVertically);
          Handsontable.hooks.add('afterScrollHorizontally', afterScrollHorizontally);
        }
      }
    };

    var setManualSize = function (row, height) {
      row = Handsontable.hooks.execute(instance, 'modifyRow', row);

      instance.manualRowHeights[row] = height;
      return height;
    };

    this.modifyRowHeight = function (height, row) {
      if (this.getSettings().manualRowResize) {
        row = this.runHooksAndReturn('modifyRow', row);
        if (this.manualRowHeights[row] !== void 0) {
          return this.manualRowHeights[row];
        }
      }
      return height;
    };

    var afterScrollVertically = function () {
      scrollTop = Handsontable.Dom.getScrollTop(this.rootElement[0]);
    };

    var afterScrollHorizontally = function () {
      scrollLeft = Handsontable.Dom.getScrollLeft(this.rootElement[0]);
    }
  }

  var htManualRowResize = new HandsontableManualRowResize();

  Handsontable.hooks.add('beforeInit', htManualRowResize.beforeInit);
  Handsontable.hooks.add('afterInit', function () {
    htManualRowResize.init.call(this, 'afterInit');
  });

  Handsontable.hooks.add('afterUpdateSettings', function () {
    htManualRowResize.init.call(this, 'afterUpdateSettings')
  });

  Handsontable.hooks.add('modifyRowHeight', htManualRowResize.modifyRowHeight);

  Handsontable.hooks.register('afterRowResize');

})(Handsontable);

(function HandsontableObserveChanges() {

  Handsontable.hooks.add('afterLoadData', init);
  Handsontable.hooks.add('afterUpdateSettings', init);

  Handsontable.hooks.register('afterChangesObserved');

  function init() {
    var instance = this;
    var pluginEnabled = instance.getSettings().observeChanges;

    if (pluginEnabled) {
      if(instance.observer) {
        destroy.call(instance); //destroy observer for old data object
      }
      createObserver.call(instance);
      bindEvents.call(instance);

    } else if (!pluginEnabled){
      destroy.call(instance);
    }
  }

  function createObserver(){
    var instance = this;

    instance.observeChangesActive = true;

    instance.pauseObservingChanges = function(){
      instance.observeChangesActive = false;
    };

    instance.resumeObservingChanges = function(){
      instance.observeChangesActive = true;
    };

    instance.observedData = instance.getData();
    instance.observer = jsonpatch.observe(instance.observedData, function (patches) {
      if(instance.observeChangesActive){
        runHookForOperation.call(instance, patches);
        instance.render();
      }

      instance.runHooks('afterChangesObserved');
    });
  }

  function runHookForOperation(rawPatches){
    var instance = this;
    var patches = cleanPatches(rawPatches);

    for(var i = 0, len = patches.length; i < len; i++){
      var patch = patches[i];
      var parsedPath = parsePath(patch.path);


      switch(patch.op){
        case 'add':
          if(isNaN(parsedPath.col)){
            instance.runHooks('afterCreateRow', parsedPath.row);
          } else {
            instance.runHooks('afterCreateCol', parsedPath.col);
          }
          break;

        case 'remove':
          if(isNaN(parsedPath.col)){
            instance.runHooks('afterRemoveRow', parsedPath.row, 1);
          } else {
            instance.runHooks('afterRemoveCol', parsedPath.col, 1);
          }
          break;

        case 'replace':
          instance.runHooks('afterChange', [parsedPath.row, parsedPath.col, null, patch.value], 'external');
          break;
      }
    }

    function cleanPatches(rawPatches){
      var patches;

      patches = removeLengthRelatedPatches(rawPatches);
      patches = removeMultipleAddOrRemoveColPatches(patches);

      return patches;
    }

    /**
     * Removing or adding column will produce one patch for each table row.
     * This function leaves only one patch for each column add/remove operation
     */
    function removeMultipleAddOrRemoveColPatches(rawPatches){
      var newOrRemovedColumns = [];

      return rawPatches.filter(function(patch){
        var parsedPath = parsePath(patch.path);

        if(['add', 'remove'].indexOf(patch.op) != -1 && !isNaN(parsedPath.col)){
          if(newOrRemovedColumns.indexOf(parsedPath.col) != -1){
            return false;
          } else {
            newOrRemovedColumns.push(parsedPath.col);
          }
        }

        return true;
      });

    }

    /**
     * If observeChanges uses native Object.observe method, then it produces patches for length property.
     * This function removes them.
     */
    function removeLengthRelatedPatches(rawPatches){
      return rawPatches.filter(function(patch){
        return !/[/]length/ig.test(patch.path);
      })
    }

    function parsePath(path){
      var match = path.match(/^\/(\d+)\/?(.*)?$/);
      return {
        row: parseInt(match[1], 10),
        col: /^\d*$/.test(match[2]) ? parseInt(match[2], 10) : match[2]
      }
    }
  }

  function destroy(){
    var instance = this;

    if (instance.observer){
      destroyObserver.call(instance);
      unbindEvents.call(instance);
    }
  }

  function destroyObserver(){
    var instance = this;

    jsonpatch.unobserve(instance.observedData, instance.observer);
    delete instance.observeChangesActive;
    delete instance.pauseObservingChanges;
    delete instance.resumeObservingChanges;
  }

  function bindEvents(){
    var instance = this;
    instance.addHook('afterDestroy', destroy);

    instance.addHook('afterCreateRow', afterTableAlter);
    instance.addHook('afterRemoveRow', afterTableAlter);

    instance.addHook('afterCreateCol', afterTableAlter);
    instance.addHook('afterRemoveCol', afterTableAlter);

    instance.addHook('afterChange', function(changes, source){
      if(source != 'loadData'){
        afterTableAlter.call(this);
      }
    });
  }

  function unbindEvents(){
    var instance = this;
    instance.removeHook('afterDestroy', destroy);

    instance.removeHook('afterCreateRow', afterTableAlter);
    instance.removeHook('afterRemoveRow', afterTableAlter);

    instance.removeHook('afterCreateCol', afterTableAlter);
    instance.removeHook('afterRemoveCol', afterTableAlter);

    instance.removeHook('afterChange', afterTableAlter);
  }

  function afterTableAlter(){
    var instance = this;

    instance.pauseObservingChanges();

    instance.addHookOnce('afterChangesObserved', function(){
      instance.resumeObservingChanges();
    });

  }
})();


/*
 *
 * Plugin enables saving table state
 *
 * */


function Storage(prefix) {

  var savedKeys;

  var saveSavedKeys = function () {
    window.localStorage[prefix + '__' + 'persistentStateKeys'] = JSON.stringify(savedKeys);
  };

  var loadSavedKeys = function () {
    var keysJSON = window.localStorage[prefix + '__' + 'persistentStateKeys'];
    var keys = typeof keysJSON == 'string' ? JSON.parse(keysJSON) : void 0;
    savedKeys = keys ? keys : [];
  };

  var clearSavedKeys = function () {
    savedKeys = [];
    saveSavedKeys();
  };

  loadSavedKeys();

  this.saveValue = function (key, value) {
    window.localStorage[prefix + '_' + key] = JSON.stringify(value);
    if (savedKeys.indexOf(key) == -1) {
      savedKeys.push(key);
      saveSavedKeys();
    }

  };

  this.loadValue = function (key, defaultValue) {

    key = typeof key != 'undefined' ? key : defaultValue;

    var value = window.localStorage[prefix + '_' + key];

    return typeof value == "undefined" ? void 0 : JSON.parse(value);

  };

  this.reset = function (key) {
    window.localStorage.removeItem(prefix + '_' + key);
  };

  this.resetAll = function () {
    for (var index = 0; index < savedKeys.length; index++) {
      window.localStorage.removeItem(prefix + '_' + savedKeys[index]);
    }

    clearSavedKeys();
  };

}


(function (StorageClass) {
  function HandsontablePersistentState() {
    var plugin = this;


    this.init = function () {
      var instance = this,
        pluginSettings = instance.getSettings()['persistentState'];

      plugin.enabled = !!(pluginSettings);

      if (!plugin.enabled) {
        removeHooks.call(instance);
        return;
      }

      if (!instance.storage) {
        instance.storage = new StorageClass(instance.rootElement[0].id);
      }

      instance.resetState = plugin.resetValue;

      addHooks.call(instance);

    };

    this.saveValue = function (key, value) {
      var instance = this;

      instance.storage.saveValue(key, value);
    };

    this.loadValue = function (key, saveTo) {
      var instance = this;

      saveTo.value = instance.storage.loadValue(key);
    };

    this.resetValue = function (key) {
      var instance = this;

      if (typeof  key != 'undefined') {
        instance.storage.reset(key);
      } else {
        instance.storage.resetAll();
      }

    };

    var hooks = {
      'persistentStateSave': plugin.saveValue,
      'persistentStateLoad': plugin.loadValue,
      'persistentStateReset': plugin.resetValue
    };

    for (var hookName in hooks) {
      if (hooks.hasOwnProperty(hookName)) {
        Handsontable.hooks.register(hookName);
      }
    }

    function addHooks() {
      var instance = this;

      for (var hookName in hooks) {
        if (hooks.hasOwnProperty(hookName)) {
          instance.addHook(hookName, hooks[hookName]);
        }
      }
    }

    function removeHooks() {
      var instance = this;

      for (var hookName in hooks) {
        if (hooks.hasOwnProperty(hookName)) {
          instance.removeHook(hookName, hooks[hookName]);
        }
      }
    }
  }

  var htPersistentState = new HandsontablePersistentState();
  Handsontable.hooks.add('beforeInit', htPersistentState.init);
  Handsontable.hooks.add('afterUpdateSettings', htPersistentState.init);
})(Storage);

/**
 * Handsontable UndoRedo class
 */
(function(Handsontable){
  Handsontable.UndoRedo = function (instance) {
    var plugin = this;
    this.instance = instance;
    this.doneActions = [];
    this.undoneActions = [];
    this.ignoreNewActions = false;
    instance.addHook("afterChange", function (changes, origin) {
      if(changes){
        var action = new Handsontable.UndoRedo.ChangeAction(changes);
        plugin.done(action);
      }
    });

    instance.addHook("afterCreateRow", function (index, amount, createdAutomatically) {

      if (createdAutomatically) {
        return;
      }

      var action = new Handsontable.UndoRedo.CreateRowAction(index, amount);
      plugin.done(action);
    });

    instance.addHook("beforeRemoveRow", function (index, amount) {
      var originalData = plugin.instance.getData();
      index = ( originalData.length + index ) % originalData.length;
      var removedData = originalData.slice(index, index + amount);
      var action = new Handsontable.UndoRedo.RemoveRowAction(index, removedData);
      plugin.done(action);
    });

    instance.addHook("afterCreateCol", function (index, amount, createdAutomatically) {

      if (createdAutomatically) {
        return;
      }

      var action = new Handsontable.UndoRedo.CreateColumnAction(index, amount);
      plugin.done(action);
    });

    instance.addHook("beforeRemoveCol", function (index, amount) {
      var originalData = plugin.instance.getData();
      index = ( plugin.instance.countCols() + index ) % plugin.instance.countCols();
      var removedData = [];

      for (var i = 0, len = originalData.length; i < len; i++) {
        removedData[i] = originalData[i].slice(index, index + amount);
      }

      var headers;
      if(Handsontable.helper.isArray(instance.getSettings().colHeaders)){
        headers = instance.getSettings().colHeaders.slice(index, index + removedData.length);
      }

      var action = new Handsontable.UndoRedo.RemoveColumnAction(index, removedData, headers);
      plugin.done(action);
    });
  };

  Handsontable.UndoRedo.prototype.done = function (action) {
    if (!this.ignoreNewActions) {
      this.doneActions.push(action);
      this.undoneActions.length = 0;
    }
  };

  /**
   * Undo operation from current revision
   */
  Handsontable.UndoRedo.prototype.undo = function () {
    if (this.isUndoAvailable()) {
      var action = this.doneActions.pop();

      this.ignoreNewActions = true;
      var that = this;
      action.undo(this.instance, function () {
        that.ignoreNewActions = false;
        that.undoneActions.push(action);
      });



    }
  };

  /**
   * Redo operation from current revision
   */
  Handsontable.UndoRedo.prototype.redo = function () {
    if (this.isRedoAvailable()) {
      var action = this.undoneActions.pop();

      this.ignoreNewActions = true;
      var that = this;
      action.redo(this.instance, function () {
        that.ignoreNewActions = false;
        that.doneActions.push(action);
      });



    }
  };

  /**
   * Returns true if undo point is available
   * @return {Boolean}
   */
  Handsontable.UndoRedo.prototype.isUndoAvailable = function () {
    return this.doneActions.length > 0;
  };

  /**
   * Returns true if redo point is available
   * @return {Boolean}
   */
  Handsontable.UndoRedo.prototype.isRedoAvailable = function () {
    return this.undoneActions.length > 0;
  };

  /**
   * Clears undo history
   */
  Handsontable.UndoRedo.prototype.clear = function () {
    this.doneActions.length = 0;
    this.undoneActions.length = 0;
  };

  Handsontable.UndoRedo.Action = function () {
  };
  Handsontable.UndoRedo.Action.prototype.undo = function () {
  };
  Handsontable.UndoRedo.Action.prototype.redo = function () {
  };

  Handsontable.UndoRedo.ChangeAction = function (changes) {
    this.changes = changes;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.ChangeAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.ChangeAction.prototype.undo = function (instance, undoneCallback) {
    var data = $.extend(true, [], this.changes),
        emptyRowsAtTheEnd = instance.countEmptyRows(true),
        emptyColsAtTheEnd = instance.countEmptyCols(true);

    for (var i = 0, len = data.length; i < len; i++) {
      data[i].splice(3, 1);
    }

    instance.addHookOnce('afterChange', undoneCallback);

    instance.setDataAtRowProp(data, null, null, 'undo');

    for (var i = 0, len = data.length; i < len; i++) {
     if(instance.getSettings().minSpareRows && 
      data[i][0] + 1 + instance.getSettings().minSpareRows === instance.countRows()
      && emptyRowsAtTheEnd == instance.getSettings().minSpareRows) {
        instance.alter('remove_row', parseInt(data[i][0]+1,10), instance.getSettings().minSpareRows);
        
        instance.undoRedo.doneActions.pop();

      }
      
      if (instance.getSettings().minSpareCols && 
      data[i][1] + 1 + instance.getSettings().minSpareCols === instance.countCols()
      && emptyColsAtTheEnd == instance.getSettings().minSpareCols) {
        instance.alter('remove_col', parseInt(data[i][1]+1,10), instance.getSettings().minSpareCols);
        
        instance.undoRedo.doneActions.pop();
      }
    }

  };
  Handsontable.UndoRedo.ChangeAction.prototype.redo = function (instance, onFinishCallback) {
    var data = $.extend(true, [], this.changes);
    for (var i = 0, len = data.length; i < len; i++) {
      data[i].splice(2, 1);
    }

    instance.addHookOnce('afterChange', onFinishCallback);

    instance.setDataAtRowProp(data, null, null, 'redo');

  };

  Handsontable.UndoRedo.CreateRowAction = function (index, amount) {
    this.index = index;
    this.amount = amount;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.CreateRowAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.CreateRowAction.prototype.undo = function (instance, undoneCallback) {
    instance.addHookOnce('afterRemoveRow', undoneCallback);
    instance.alter('remove_row', this.index, this.amount);
  };
  Handsontable.UndoRedo.CreateRowAction.prototype.redo = function (instance, redoneCallback) {
    instance.addHookOnce('afterCreateRow', redoneCallback);
    instance.alter('insert_row', this.index + 1, this.amount);
  };

  Handsontable.UndoRedo.RemoveRowAction = function (index, data) {
    this.index = index;
    this.data = data;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.RemoveRowAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.RemoveRowAction.prototype.undo = function (instance, undoneCallback) {
    var spliceArgs = [this.index, 0];
    Array.prototype.push.apply(spliceArgs, this.data);

    Array.prototype.splice.apply(instance.getData(), spliceArgs);

    instance.addHookOnce('afterRender', undoneCallback);
    instance.render();
  };
  Handsontable.UndoRedo.RemoveRowAction.prototype.redo = function (instance, redoneCallback) {
    instance.addHookOnce('afterRemoveRow', redoneCallback);
    instance.alter('remove_row', this.index, this.data.length);
  };

  Handsontable.UndoRedo.CreateColumnAction = function (index, amount) {
    this.index = index;
    this.amount = amount;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.CreateColumnAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.CreateColumnAction.prototype.undo = function (instance, undoneCallback) {
    instance.addHookOnce('afterRemoveCol', undoneCallback);
    instance.alter('remove_col', this.index, this.amount);
  };
  Handsontable.UndoRedo.CreateColumnAction.prototype.redo = function (instance, redoneCallback) {
    instance.addHookOnce('afterCreateCol', redoneCallback);
    instance.alter('insert_col', this.index + 1, this.amount);
  };

  Handsontable.UndoRedo.RemoveColumnAction = function (index, data, headers) {
    this.index = index;
    this.data = data;
    this.amount = this.data[0].length;
    this.headers = headers;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.RemoveColumnAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.RemoveColumnAction.prototype.undo = function (instance, undoneCallback) {
    var row, spliceArgs;
    for (var i = 0, len = instance.getData().length; i < len; i++) {
      row = instance.getDataAtRow(i);

      spliceArgs = [this.index, 0];
      Array.prototype.push.apply(spliceArgs, this.data[i]);

      Array.prototype.splice.apply(row, spliceArgs);

    }

    if(typeof this.headers != 'undefined'){
      spliceArgs = [this.index, 0];
      Array.prototype.push.apply(spliceArgs, this.headers);
      Array.prototype.splice.apply(instance.getSettings().colHeaders, spliceArgs);
    }

    instance.addHookOnce('afterRender', undoneCallback);
    instance.render();
  };
  Handsontable.UndoRedo.RemoveColumnAction.prototype.redo = function (instance, redoneCallback) {
    instance.addHookOnce('afterRemoveCol', redoneCallback);
    instance.alter('remove_col', this.index, this.amount);
  };
})(Handsontable);

(function(Handsontable){

  function init(){
    var instance = this;
    var pluginEnabled = typeof instance.getSettings().undo == 'undefined' || instance.getSettings().undo;

    if(pluginEnabled){
      if(!instance.undoRedo){
        instance.undoRedo = new Handsontable.UndoRedo(instance);

        exposeUndoRedoMethods(instance);

        instance.addHook('beforeKeyDown', onBeforeKeyDown);
        instance.addHook('afterChange', onAfterChange);
      }
    } else {
      if(instance.undoRedo){
        delete instance.undoRedo;

        removeExposedUndoRedoMethods(instance);

        instance.removeHook('beforeKeyDown', onBeforeKeyDown);
        instance.removeHook('afterChange', onAfterChange);
      }
    }
  }

  function onBeforeKeyDown(event){
    var instance = this;

    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

    if(ctrlDown){
      if (event.keyCode === 89 || (event.shiftKey && event.keyCode === 90)) { //CTRL + Y or CTRL + SHIFT + Z
        instance.undoRedo.redo();
        event.stopImmediatePropagation();
      }
      else if (event.keyCode === 90) { //CTRL + Z
        instance.undoRedo.undo();
        event.stopImmediatePropagation();
      }
    }
  }

  function onAfterChange(changes, source){
    var instance = this;
    if (source == 'loadData'){
      return instance.undoRedo.clear();
    }
  }

  function exposeUndoRedoMethods(instance){
    instance.undo = function(){
      return instance.undoRedo.undo();
    };

    instance.redo = function(){
      return instance.undoRedo.redo();
    };

    instance.isUndoAvailable = function(){
      return instance.undoRedo.isUndoAvailable();
    };

    instance.isRedoAvailable = function(){
      return instance.undoRedo.isRedoAvailable();
    };

    instance.clearUndo = function(){
      return instance.undoRedo.clear();
    };
  }

  function removeExposedUndoRedoMethods(instance){
    delete instance.undo;
    delete instance.redo;
    delete instance.isUndoAvailable;
    delete instance.isRedoAvailable;
    delete instance.clearUndo;
  }

  Handsontable.hooks.add('afterInit', init);
  Handsontable.hooks.add('afterUpdateSettings', init);

})(Handsontable);
/**
 * Plugin used to scroll Handsontable by selecting a cell and dragging outside of visible viewport
 * @constructor
 */
function DragToScroll() {
  this.boundaries = null;
  this.callback = null;
}

/**
 * @param boundaries {Object} compatible with getBoundingClientRect
 */
DragToScroll.prototype.setBoundaries = function (boundaries) {
  this.boundaries = boundaries;
};

/**
 * @param callback {Function}
 */
DragToScroll.prototype.setCallback = function (callback) {
  this.callback = callback;
};

/**
 * Check if mouse position (x, y) is outside of the viewport
 * @param x
 * @param y
 */
DragToScroll.prototype.check = function (x, y) {
  var diffX = 0;
  var diffY = 0;

  if (y < this.boundaries.top) {
    //y is less than top
    diffY = y - this.boundaries.top;
  }
  else if (y > this.boundaries.bottom) {
    //y is more than bottom
    diffY = y - this.boundaries.bottom;
  }

  if (x < this.boundaries.left) {
    //x is less than left
    diffX = x - this.boundaries.left;
  }
  else if (x > this.boundaries.right) {
    //x is more than right
    diffX = x - this.boundaries.right;
  }

  this.callback(diffX, diffY);
};

var dragToScroll;
var instance;

if (typeof Handsontable !== 'undefined') {
  var setupListening = function (instance) {
    instance.dragToScrollListening = false;
    var scrollHandler = instance.view.wt.wtScrollbars.vertical.scrollHandler; //native scroll
    dragToScroll = new DragToScroll();
    if (scrollHandler === window) {
      //not much we can do currently
      return;
    }
    else if (scrollHandler) {
      dragToScroll.setBoundaries(scrollHandler.getBoundingClientRect());
    }
    else {
      dragToScroll.setBoundaries(instance.$table[0].getBoundingClientRect());
    }

    dragToScroll.setCallback(function (scrollX, scrollY) {
      if (scrollX < 0) {
        if (scrollHandler) {
          scrollHandler.scrollLeft -= 50;
        }
        else {
          instance.view.wt.scrollHorizontal(-1).draw();
        }
      }
      else if (scrollX > 0) {
        if (scrollHandler) {
          scrollHandler.scrollLeft += 50;
        }
        else {
          instance.view.wt.scrollHorizontal(1).draw();
        }
      }

      if (scrollY < 0) {
        if (scrollHandler) {
          scrollHandler.scrollTop -= 20;
        }
        else {
          instance.view.wt.scrollVertical(-1).draw();
        }
      }
      else if (scrollY > 0) {
        if (scrollHandler) {
          scrollHandler.scrollTop += 20;
        }
        else {
          instance.view.wt.scrollVertical(1).draw();
        }
      }
    });

    instance.dragToScrollListening = true;
  };

  Handsontable.hooks.add('afterInit', function () {
    var instance = this;

    $(document).on('mouseup.' + this.guid, function () {
      instance.dragToScrollListening = false;
    });

    $(document).on('mousemove.' + this.guid, function (event) {
      if (instance.dragToScrollListening) {
        dragToScroll.check(event.clientX, event.clientY);
      }
    });
  });

  Handsontable.hooks.add('afterDestroy', function () {
    $(document).off('.' + this.guid);
  });

  Handsontable.hooks.add('afterOnCellMouseDown', function () {
    setupListening(this);
  });

  Handsontable.hooks.add('afterOnCellCornerMouseDown', function () {
    setupListening(this);
  });

  Handsontable.plugins.DragToScroll = DragToScroll;
}

(function (Handsontable, CopyPaste, SheetClip) {

  function CopyPastePlugin(instance) {
    this.copyPasteInstance = CopyPaste.getInstance();

    this.copyPasteInstance.onCut(onCut);
    this.copyPasteInstance.onPaste(onPaste);
    var plugin = this;

    instance.addHook('beforeKeyDown', onBeforeKeyDown);

    function onCut() {
      if (!instance.isListening()) {
        return;
      }

      instance.selection.empty();
    }

    function onPaste(str) {
      if (!instance.isListening() || !instance.selection.isSelected()) {
        return;
      }

      var input = str.replace(/^[\r\n]*/g, '').replace(/[\r\n]*$/g, '') //remove newline from the start and the end of the input
        , inputArray = SheetClip.parse(input)
        , selected = instance.getSelected()
        , coordsFrom = new WalkontableCellCoords(selected[0], selected[1])
        , coordsTo = new WalkontableCellCoords(selected[2], selected[3])
        , cellRange = new WalkontableCellRange(coordsFrom, coordsFrom, coordsTo)
        , topLeftCorner = cellRange.getTopLeftCorner()
        , bottomRightCorner = cellRange.getBottomRightCorner()
        , areaStart = topLeftCorner
        , areaEnd = new WalkontableCellCoords(
          Math.max(bottomRightCorner.row, inputArray.length - 1 + topLeftCorner.row),
          Math.max(bottomRightCorner.col, inputArray[0].length - 1 + topLeftCorner.col)
        );

      instance.addHookOnce('afterChange', function (changes, source) {
        if (changes && changes.length) {
          this.selectCell(areaStart.row, areaStart.col, areaEnd.row, areaEnd.col);
        }
      });

      instance.populateFromArray(areaStart.row, areaStart.col, inputArray, areaEnd.row, areaEnd.col, 'paste', instance.getSettings().pasteMode);
    };

    function onBeforeKeyDown (event) {
      if (Handsontable.helper.isCtrlKey(event.keyCode) && instance.getSelected()) {
        //when CTRL is pressed, prepare selectable text in textarea
        //http://stackoverflow.com/questions/3902635/how-does-one-capture-a-macs-command-key-via-javascript
        plugin.setCopyableText();
        event.stopImmediatePropagation();
        return;
      }

      var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)

      if (event.keyCode == Handsontable.helper.keyCode.A && ctrlDown) {
        setTimeout(Handsontable.helper.proxy(plugin.setCopyableText, plugin));
      }

    }

    this.destroy = function () {
      this.copyPasteInstance.removeCallback(onCut);
      this.copyPasteInstance.removeCallback(onPaste);
      this.copyPasteInstance.destroy();
      instance.removeHook('beforeKeyDown', onBeforeKeyDown);
    };

    instance.addHook('afterDestroy', Handsontable.helper.proxy(this.destroy, this));

    this.triggerPaste = Handsontable.helper.proxy(this.copyPasteInstance.triggerPaste, this.copyPasteInstance);
    this.triggerCut = Handsontable.helper.proxy(this.copyPasteInstance.triggerCut, this.copyPasteInstance);

    /**
     * Prepares copyable text in the invisible textarea
     */
    this.setCopyableText = function () {

      var settings = instance.getSettings();
      var copyRowsLimit = settings.copyRowsLimit;
      var copyColsLimit = settings.copyColsLimit;

      var selRange = instance.getSelectedRange();
      var topLeft = selRange.getTopLeftCorner();
      var bottomRight = selRange.getBottomRightCorner();
      var startRow = topLeft.row;
      var startCol = topLeft.col;
      var endRow = bottomRight.row;
      var endCol = bottomRight.col;
      var finalEndRow = Math.min(endRow, startRow + copyRowsLimit - 1);
      var finalEndCol = Math.min(endCol, startCol + copyColsLimit - 1);

      instance.copyPaste.copyPasteInstance.copyable(instance.getCopyableData(startRow, startCol, finalEndRow, finalEndCol));

      if (endRow !== finalEndRow || endCol !== finalEndCol) {
        Handsontable.hooks.run(instance, "afterCopyLimit", endRow - startRow + 1, endCol - startCol + 1, copyRowsLimit, copyColsLimit);
      }
    };

  }



  function init() {
    var instance  = this;
    var pluginEnabled = instance.getSettings().copyPaste !== false;

    if(pluginEnabled && !instance.copyPaste){

      instance.copyPaste = new CopyPastePlugin(instance);

    } else if (!pluginEnabled && instance.copyPaste) {

      instance.copyPaste.destroy();
      delete instance.copyPaste;

    }

  }

  Handsontable.hooks.add('afterInit', init);
  Handsontable.hooks.add('afterUpdateSettings', init);

  Handsontable.hooks.register('afterCopyLimit');
})(Handsontable, CopyPaste, SheetClip);
(function (Handsontable) {

  'use strict';

  Handsontable.Search = function Search(instance) {
    this.query = function (queryStr, callback, queryMethod) {
      var rowCount = instance.countRows();
      var colCount = instance.countCols();
      var queryResult = [];

      if (!callback) {
        callback = Handsontable.Search.global.getDefaultCallback();
      }

      if (!queryMethod) {
        queryMethod = Handsontable.Search.global.getDefaultQueryMethod();
      }

      for (var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        for (var colIndex = 0; colIndex < colCount; colIndex++) {
          var cellData = instance.getDataAtCell(rowIndex, colIndex);
          var cellProperties = instance.getCellMeta(rowIndex, colIndex);
          var cellCallback = cellProperties.search.callback || callback;
          var cellQueryMethod = cellProperties.search.queryMethod || queryMethod;
          var testResult = cellQueryMethod(queryStr, cellData);

          if (testResult) {
            var singleResult = {
              row: rowIndex,
              col: colIndex,
              data: cellData
            };

            queryResult.push(singleResult);
          }

          if (cellCallback) {
            cellCallback(instance, rowIndex, colIndex, cellData, testResult);
          }
        }
      }

      return queryResult;

    };

  };

  Handsontable.Search.DEFAULT_CALLBACK = function (instance, row, col, data, testResult) {
    instance.getCellMeta(row, col).isSearchResult = testResult;
  };

  Handsontable.Search.DEFAULT_QUERY_METHOD = function (query, value) {

    if (typeof query == 'undefined' || query == null || !query.toLowerCase || query.length == 0){
      return false;
    }

    return value.toString().toLowerCase().indexOf(query.toLowerCase()) != -1;
  };

  Handsontable.Search.DEFAULT_SEARCH_RESULT_CLASS = 'htSearchResult';

  Handsontable.Search.global = (function () {

    var defaultCallback = Handsontable.Search.DEFAULT_CALLBACK;
    var defaultQueryMethod = Handsontable.Search.DEFAULT_QUERY_METHOD;
    var defaultSearchResultClass = Handsontable.Search.DEFAULT_SEARCH_RESULT_CLASS;

    return {
      getDefaultCallback: function () {
        return defaultCallback;
      },

      setDefaultCallback: function (newDefaultCallback) {
        defaultCallback = newDefaultCallback;
      },

      getDefaultQueryMethod: function () {
        return defaultQueryMethod;
      },

      setDefaultQueryMethod: function (newDefaultQueryMethod) {
        defaultQueryMethod = newDefaultQueryMethod;
      },

      getDefaultSearchResultClass: function () {
        return defaultSearchResultClass;
      },

      setDefaultSearchResultClass: function (newSearchResultClass) {
        defaultSearchResultClass = newSearchResultClass;
      }
    }

  })();



  Handsontable.SearchCellDecorator = function (instance, TD, row, col, prop, value, cellProperties) {

    var searchResultClass = (typeof cellProperties.search == 'object' && cellProperties.search.searchResultClass) || Handsontable.Search.global.getDefaultSearchResultClass();

    if(cellProperties.isSearchResult){
      Handsontable.Dom.addClass(TD, searchResultClass);
    } else {
      Handsontable.Dom.removeClass(TD, searchResultClass);
    }
  };



  var originalDecorator = Handsontable.renderers.cellDecorator;

  Handsontable.renderers.cellDecorator = function (instance, TD, row, col, prop, value, cellProperties) {
    originalDecorator.apply(this, arguments);
    Handsontable.SearchCellDecorator.apply(this, arguments);
  };

  function init() {
    var instance = this;

    var pluginEnabled = !!instance.getSettings().search;

    if (pluginEnabled) {
      instance.search = new Handsontable.Search(instance);
    } else {
      delete instance.search;
    }

  }

  Handsontable.hooks.add('afterInit', init);
  Handsontable.hooks.add('afterUpdateSettings', init);


})(Handsontable);
function CellInfoCollection() {

  var collection = [];

  collection.getInfo = function (row, col) {
    for (var i = 0, ilen = this.length; i < ilen; i++) {
      if (this[i].row <= row && this[i].row + this[i].rowspan - 1 >= row && this[i].col <= col && this[i].col + this[i].colspan - 1 >= col) {
        return this[i];
      }
    }
  };

  collection.setInfo = function (info) {
    for (var i = 0, ilen = this.length; i < ilen; i++) {
      if (this[i].row === info.row && this[i].col === info.col) {
        this[i] = info;
        return;
      }
    }
    this.push(info);
  };

  collection.removeInfo = function (row, col) {
    for (var i = 0, ilen = this.length; i < ilen; i++) {
      if (this[i].row === row && this[i].col === col) {
        this.splice(i, 1);
        break;
      }
    }
  };

  return collection;

}


/**
 * Plugin used to merge cells in Handsontable
 * @constructor
 */
function MergeCells(mergeCellsSetting) {
  this.mergedCellInfoCollection = new CellInfoCollection();

  if (Handsontable.helper.isArray(mergeCellsSetting)) {
    for (var i = 0, ilen = mergeCellsSetting.length; i < ilen; i++) {
      this.mergedCellInfoCollection.setInfo(mergeCellsSetting[i]);
    }
  }
}

/**
 * @param cellRange (WalkontableCellRange)
 */
MergeCells.prototype.canMergeRange = function (cellRange) {
  //is more than one cell selected
  return !cellRange.isSingle();
};

MergeCells.prototype.mergeRange = function (cellRange) {
  if (!this.canMergeRange(cellRange)) {
    return;
  }

  //normalize top left corner
  var topLeft = cellRange.getTopLeftCorner();
  var bottomRight = cellRange.getBottomRightCorner();

  var mergeParent = {};
  mergeParent.row = topLeft.row;
  mergeParent.col = topLeft.col;
  mergeParent.rowspan = bottomRight.row - topLeft.row + 1; //TD has rowspan == 1 by default. rowspan == 2 means spread over 2 cells
  mergeParent.colspan = bottomRight.col - topLeft.col + 1;
  this.mergedCellInfoCollection.setInfo(mergeParent);
};

MergeCells.prototype.mergeOrUnmergeSelection = function (cellRange) {
  var info = this.mergedCellInfoCollection.getInfo(cellRange.from.row, cellRange.from.col);
  if (info) {
    //unmerge
    this.unmergeSelection(cellRange.from);
  }
  else {
    //merge
    this.mergeSelection(cellRange);
  }
};

MergeCells.prototype.mergeSelection = function (cellRange) {
  this.mergeRange(cellRange);
};

MergeCells.prototype.unmergeSelection = function (cellRange) {
  var info = this.mergedCellInfoCollection.getInfo(cellRange.row, cellRange.col);
  this.mergedCellInfoCollection.removeInfo(info.row, info.col);
};

MergeCells.prototype.applySpanProperties = function (TD, row, col) {
  var info = this.mergedCellInfoCollection.getInfo(row, col);
  if (info) {
    if (info.row === row && info.col === col) {
      TD.setAttribute('rowspan', info.rowspan);
      TD.setAttribute('colspan', info.colspan);
    }
    else {
      TD.style.display = "none";
    }
  }
  else {
    TD.removeAttribute('rowspan');
    TD.removeAttribute('colspan');
  }
};

MergeCells.prototype.modifyTransform = function (hook, currentSelectedRange, delta) {
  var current;
  switch (hook) {
    case 'modifyTransformStart':
      current = currentSelectedRange.highlight;
      break;

    case 'modifyTransformEnd':
      current = currentSelectedRange.to;
      break;
  }

  if (hook == "modifyTransformStart") {
    //in future - can this take the logic from modifyTransformEnd?
    var mergeParent = this.mergedCellInfoCollection.getInfo(current.row + delta.row, current.col + delta.col);
    if (mergeParent) {
      if (current.row > mergeParent.row) { //entering merge by going up or left
        this.lastDesiredCoords = new WalkontableCellCoords(current.row + delta.row, current.col + delta.col); //copy
        delta.row += (mergeParent.row - current.row) - delta.row;
      }
      else if (current.row == mergeParent.row && delta.row > 0) { //leaving merge by going down
        delta.row += mergeParent.row - current.row + mergeParent.rowspan - 1;
      }
      else { //leaving merge by going right
        if (this.lastDesiredCoords && delta.row === 0) {
          delta.row += this.lastDesiredCoords.row - current.row;
          this.lastDesiredCoords = null;
        }
      }

      if (current.col > mergeParent.col) { //entering merge by going up or left
        if (!this.lastDesiredCoords) {
          this.lastDesiredCoords = new WalkontableCellCoords(current.row + delta.row, current.col + delta.col); //copy
        }
        delta.col += (mergeParent.col - current.col) - delta.col;
      }
      else if (current.col == mergeParent.col && delta.col > 0) { //leaving merge by going right
        delta.col += mergeParent.col - current.col + mergeParent.colspan - 1;
      }
      else { //leaving merge by going down
        if (this.lastDesiredCoords && delta.col === 0) {
          delta.col += this.lastDesiredCoords.col - current.col;
          this.lastDesiredCoords = null;
        }
      }
    }
    else {
      if (this.lastDesiredCoords) {
        if (delta.col == 0) { //leaving merge by going up
          delta.col += this.lastDesiredCoords.col - current.col;
        }
        else if (delta.row == 0) { //leaving merge by going left
          delta.row += this.lastDesiredCoords.row - current.row;
        }
        this.lastDesiredCoords = null;
      }
    }
  }
  else {
    //modify transform end
    var hightlightMergeParent = this.mergedCellInfoCollection.getInfo(currentSelectedRange.highlight.row, currentSelectedRange.highlight.col);
    if (hightlightMergeParent) {
      if (currentSelectedRange.isSingle()) {
        currentSelectedRange.from = new WalkontableCellCoords(hightlightMergeParent.row, hightlightMergeParent.col);
        currentSelectedRange.to = new WalkontableCellCoords(hightlightMergeParent.row + hightlightMergeParent.rowspan - 1, hightlightMergeParent.col + hightlightMergeParent.colspan - 1);
      }
    }

    if (currentSelectedRange.isSingle()) {
      //make sure objects are clones but not reference to the same instance
      //because we will mutate them
      currentSelectedRange.from = new WalkontableCellCoords(currentSelectedRange.highlight.row, currentSelectedRange.highlight.col);
      currentSelectedRange.to = new WalkontableCellCoords(currentSelectedRange.highlight.row, currentSelectedRange.highlight.col);
    }

    var solveDimension = function (dim) {
      var altDim = dim == "col" ? "row" : "col";

      function changeCoords(obj, altDimValue, dimValue) {
        obj[altDim] = altDimValue;
        obj[dim] = dimValue;
      }

      if (delta[dim] != 0) {
        var topLeft;
        var bottomRight;

        var updateCornerInfo = function () {
          topLeft = currentSelectedRange.getTopLeftCorner();
          bottomRight = currentSelectedRange.getBottomRightCorner();
        }
        updateCornerInfo();

        var expanding = false; //expanding false means shrinking
        var examinedCol;
        //now check if maybe we are expanding?
        if (delta[dim] < 0) {
          examinedCol = bottomRight[dim] + delta[dim];
          if (bottomRight[dim] == currentSelectedRange.highlight[dim]) {
            examinedCol = topLeft[dim] + delta[dim];
            expanding = true;
          }
          else {
            for (var i = topLeft[altDim]; i <= bottomRight[altDim]; i++) {
              var mergeParent = this.mergedCellInfoCollection.getInfo(i, bottomRight[dim]);
              if (mergeParent) {
                if (mergeParent[dim] <= currentSelectedRange.highlight[dim]) {
                  examinedCol = topLeft[dim] + delta[dim];
                  expanding = true;
                  break;
                }
              }
            }
          }
        }
        else if (delta[dim] > 0) {
          examinedCol = topLeft[dim] + delta[dim];
          if (topLeft[dim] == currentSelectedRange.highlight[dim]) {
            examinedCol = bottomRight[dim] + delta[dim];
            expanding = true;
          }
          else {
            for (var i = topLeft[altDim]; i <= bottomRight[altDim]; i++) {
              var mergeParent = this.mergedCellInfoCollection.getInfo(i, topLeft[dim]);
              if (mergeParent) {
                if (mergeParent[dim] + mergeParent[dim + "span"] > currentSelectedRange.highlight[dim]) {
                  examinedCol = bottomRight[dim] + delta[dim];
                  expanding = true;
                  break;
                }
              }
            }
          }
        }

        if (expanding) {
          if (delta[dim] > 0) { //moving East wall further East
            changeCoords(currentSelectedRange.from, topLeft[altDim], topLeft[dim]);
            changeCoords(currentSelectedRange.to, bottomRight[altDim], Math.max(bottomRight[dim], examinedCol));
            updateCornerInfo();
          }
          else { //moving West wall further West
            changeCoords(currentSelectedRange.from, topLeft[altDim], Math.min(topLeft[dim], examinedCol));
            changeCoords(currentSelectedRange.to, bottomRight[altDim], bottomRight[dim]);
            updateCornerInfo();
          }

        }
        else {
          if (delta[dim] > 0) { //shrinking West wall towards East
            changeCoords(currentSelectedRange.from, topLeft[altDim], Math.max(topLeft[dim], examinedCol));
            changeCoords(currentSelectedRange.to, bottomRight[altDim], bottomRight[dim]);
            updateCornerInfo();
          }
          else { //shrinking East wall towards West
            changeCoords(currentSelectedRange.from, topLeft[altDim], topLeft[dim]);
            changeCoords(currentSelectedRange.to, bottomRight[altDim], Math.min(bottomRight[dim], examinedCol));
            updateCornerInfo();
          }
        }

        for (var i = topLeft[altDim]; i <= bottomRight[altDim]; i++) {
          var mergeParent = dim == "col" ? this.mergedCellInfoCollection.getInfo(i, examinedCol) : this.mergedCellInfoCollection.getInfo(examinedCol, i);
          if (mergeParent) {
            if (expanding) {
              if (delta[dim] > 0) { //moving East wall further East
                changeCoords(currentSelectedRange.from, Math.min(topLeft[altDim], mergeParent[altDim]), Math.min(topLeft[dim], mergeParent[dim]));
                if (examinedCol > mergeParent[dim]) {
                  changeCoords(currentSelectedRange.to, Math.max(bottomRight[altDim], mergeParent[altDim] + mergeParent[altDim + "span"] - 1), Math.max(bottomRight[dim], mergeParent[dim] + mergeParent[dim + "span"]));
                }
                else {
                  changeCoords(currentSelectedRange.to, Math.max(bottomRight[altDim], mergeParent[altDim] + mergeParent[altDim + "span"] - 1), Math.max(bottomRight[dim], mergeParent[dim] + mergeParent[dim + "span"] - 1));
                }
                updateCornerInfo();
              }
              else { //moving West wall further West
                changeCoords(currentSelectedRange.from, Math.min(topLeft[altDim], mergeParent[altDim]), Math.min(topLeft[dim], mergeParent[dim]));
                changeCoords(currentSelectedRange.to, Math.max(bottomRight[altDim], mergeParent[altDim] + mergeParent[altDim + "span"] - 1), Math.max(bottomRight[dim], mergeParent[dim] + mergeParent[dim + "span"] - 1));
                updateCornerInfo();
              }
            }
            else {
              if (delta[dim] > 0) { //shrinking West wall towards East
                if (examinedCol > mergeParent[dim]) {
                  changeCoords(currentSelectedRange.from, topLeft[altDim], Math.max(topLeft[dim], mergeParent[dim] + mergeParent[dim + "span"]));
                  changeCoords(currentSelectedRange.to, bottomRight[altDim], Math.max(bottomRight[dim], mergeParent[dim] + mergeParent[dim + "span"]));
                }
                else {
                  changeCoords(currentSelectedRange.from, topLeft[altDim], Math.max(topLeft[dim], mergeParent[dim]));
                  changeCoords(currentSelectedRange.to, bottomRight[altDim], Math.max(bottomRight[dim], mergeParent[dim] + mergeParent[dim + "span"] - 1));
                }
                updateCornerInfo();
              }
              else { //shrinking East wall towards West
                if (examinedCol < mergeParent[dim] + mergeParent[dim + "span"] - 1) {
                  changeCoords(currentSelectedRange.from, topLeft[altDim], Math.min(topLeft[dim], mergeParent[dim] - 1));
                  changeCoords(currentSelectedRange.to, bottomRight[altDim], Math.min(bottomRight[dim], mergeParent[dim] - 1));
                }
                else {
                  changeCoords(currentSelectedRange.from, topLeft[altDim], Math.min(topLeft[dim], mergeParent[dim]));
                  changeCoords(currentSelectedRange.to, bottomRight[altDim], Math.min(bottomRight[dim], mergeParent[dim] + mergeParent[dim + "span"]));
                }
                updateCornerInfo();
              }
            }
          }
        }

        /*if (expanding) {
         //check if corners are not part of merged cells as well
         var oneLastCheck = function (row, col) {
         var mergeParent = this.mergedCellInfoCollection.getInfo(row, col);
         if (mergeParent) {
         currentSelectedRange.expand(new WalkontableCellCoords(mergeParent.row, mergeParent.col));
         currentSelectedRange.expand(new WalkontableCellCoords(mergeParent.row + mergeParent.rowspan - 1, mergeParent.col + mergeParent.colspan - 1));
         updateCornerInfo();
         }
         }
         oneLastCheck.call(this, topLeft.row, topLeft.col);
         oneLastCheck.call(this, topLeft.row, bottomRight.col);
         oneLastCheck.call(this, bottomRight.row, bottomRight.col);
         oneLastCheck.call(this, bottomRight.row, topLeft.col);
         }
         else {
         //TODO there is still a glitch if you go to merge_cells.html, go to D5 and press up, right, down
         }*/
      }
    };

    solveDimension.call(this, "col");
    solveDimension.call(this, "row");

    delta.row = 0;
    delta.col = 0;
  }
};

if (typeof Handsontable == 'undefined') {
  throw new Error('Handsontable is not defined');
}

var init = function () {
  var instance = this;
  var mergeCellsSetting = instance.getSettings().mergeCells;

  if (mergeCellsSetting) {
    if (!instance.mergeCells) {
      instance.mergeCells = new MergeCells(mergeCellsSetting);
    }
  }
};

var onBeforeKeyDown = function (event) {
  if (!this.mergeCells) {
    return;
  }

  var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

  if (ctrlDown) {
    if (event.keyCode === 77) { //CTRL + M
      this.mergeCells.mergeOrUnmergeSelection(this.getSelectedRange());
      this.render();
      event.stopImmediatePropagation();
    }
  }
};

var addMergeActionsToContextMenu = function (defaultOptions) {
  if (!this.getSettings().mergeCells) {
    return;
  }

  defaultOptions.items.mergeCellsSeparator = Handsontable.ContextMenu.SEPARATOR;

  defaultOptions.items.mergeCells = {
    name: function () {
      var sel = this.getSelected();
      var info = this.mergeCells.mergedCellInfoCollection.getInfo(sel[0], sel[1]);
      if (info) {
        return 'Unmerge cells';
      }
      else {
        return 'Merge cells';
      }
    },
    callback: function () {
      this.mergeCells.mergeOrUnmergeSelection(this.getSelectedRange());
      this.render();
    },
    disabled: function () {
      return false;
    }
  };
};

var afterRenderer = function (TD, row, col, prop, value, cellProperties) {
  if (this.mergeCells) {
    this.mergeCells.applySpanProperties(TD, row, col);
  }
};

var modifyTransformFactory = function (hook) {
  return function (delta) {
    var mergeCellsSetting = this.getSettings().mergeCells;
    if (mergeCellsSetting) {
      var currentSelectedRange = this.getSelectedRange();
      this.mergeCells.modifyTransform(hook, currentSelectedRange, delta);

      if (hook === "modifyTransformEnd") {
        //sanitize "from" (core.js will sanitize to)
        var totalRows = this.countRows();
        var totalCols = this.countCols();
        if (currentSelectedRange.from.row < 0) {
          currentSelectedRange.from.row = 0;
        }
        else if (currentSelectedRange.from.row > 0 && currentSelectedRange.from.row >= totalRows) {
          currentSelectedRange.from.row = currentSelectedRange.from - 1;
        }

        if (currentSelectedRange.from.col < 0) {
          currentSelectedRange.from.col = 0;
        }
        else if (currentSelectedRange.from.col > 0 && currentSelectedRange.from.col >= totalCols) {
          currentSelectedRange.from.col = totalCols - 1;
        }
      }
    }
  }
};

/**
 * While selecting cells with keyboard or mouse, make sure that rectangular area is expanded to the extent of the merged cell
 * @param coords
 */
var beforeSetRangeEnd = function (coords) {
  this.lastDesiredCoords = null; //unset lastDesiredCoords when selection is changed with mouse
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var selRange = this.getSelectedRange();
    selRange.highlight = new WalkontableCellCoords(selRange.highlight.row, selRange.highlight.col); //clone in case we will modify its reference
    selRange.to = coords;

    for (var i = 0, ilen = this.mergeCells.mergedCellInfoCollection.length; i < ilen; i++) {
      var cellInfo = this.mergeCells.mergedCellInfoCollection[i];
      var mergedCellTopLeft = new WalkontableCellCoords(cellInfo.row, cellInfo.col);
      var mergedCellBottomRight = new WalkontableCellCoords(cellInfo.row + cellInfo.rowspan - 1, cellInfo.col + cellInfo.colspan - 1);

      var mergedCellRange = new WalkontableCellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);
      if (selRange.expandByRange(mergedCellRange)) {
        var selRangeBottomRight = selRange.getBottomRightCorner();
        coords.row = selRangeBottomRight.row;
        coords.col = selRangeBottomRight.col;
      }
    }
  }
};

var afterGetCellMeta = function(row, col, cellProperties) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(row, col);
    if(mergeParent && (mergeParent.row != row || mergeParent.col != col)) {
      cellProperties.copyable = false;
    }
  }
};

Handsontable.hooks.add('beforeInit', init);
Handsontable.hooks.add('beforeKeyDown', onBeforeKeyDown);
Handsontable.hooks.add('modifyTransformStart', modifyTransformFactory('modifyTransformStart'));
Handsontable.hooks.add('modifyTransformEnd', modifyTransformFactory('modifyTransformEnd'));
Handsontable.hooks.add('beforeSetRangeEnd', beforeSetRangeEnd);
Handsontable.hooks.add('afterRenderer', afterRenderer);
Handsontable.hooks.add('afterContextMenuDefaultOptions', addMergeActionsToContextMenu);
Handsontable.hooks.add('afterGetCellMeta', afterGetCellMeta);

Handsontable.MergeCells = MergeCells;


/**
 * Creates an overlay over the original Walkontable instance. The overlay renders the clone of the original Walkontable
 * and (optionally) implements behavior needed for native horizontal and vertical scrolling
 */
function WalkontableOverlay() {}

/*
 Possible optimizations:
 [x] don't rerender if scroll delta is smaller than the fragment outside of the viewport
 [ ] move .style.top change before .draw()
 [ ] put .draw() in requestAnimationFrame
 [ ] don't rerender rows that remain visible after the scroll
 */

WalkontableOverlay.prototype.init = function () {
  this.TABLE = this.instance.wtTable.TABLE;
  this.fixed = this.instance.wtTable.hider;
  this.fixedContainer = this.instance.wtTable.holder;
//  this.fixed.style.position = 'absolute';
//  this.fixed.style.left = '0';
  this.scrollHandler = this.getScrollableElement(this.TABLE);
  this.$scrollHandler = $(this.scrollHandler); //in future remove jQuery from here
};

WalkontableOverlay.prototype.makeClone = function (direction) {
  var clone = document.createElement('DIV');
  clone.className = 'ht_clone_' + direction + ' handsontable';
  clone.style.position = 'fixed';
  clone.style.overflow = 'hidden';

  var table2 = document.createElement('TABLE');
  table2.className = this.instance.wtTable.TABLE.className;
  clone.appendChild(table2);

  this.instance.wtTable.holder.parentNode.appendChild(clone);

  return new Walkontable({
    cloneSource: this.instance,
    cloneOverlay: this,
    table: table2
  });
};

WalkontableOverlay.prototype.getScrollableElement = function (TABLE) {
  var el = TABLE.parentNode;
  while (el && el.style) {
    if (el.style.overflow !== 'visible' && el.style.overflow !== '') {
      return el;
    }
    if (this instanceof WalkontableHorizontalScrollbarNative && el.style.overflowX !== 'visible' && el.style.overflowX !== '') {
      return el;
    }
    el = el.parentNode;
  }
  return window;
};

WalkontableOverlay.prototype.prepare = function () {
};

WalkontableOverlay.prototype.onScroll = function () {

  this.windowScrollPosition = this.getScrollPosition();
  this.readSettings(); //read window scroll position

  this.resetFixedPosition(); //may be redundant
};

WalkontableOverlay.prototype.availableSize = function () {
  var availableSize;

  if (this.windowScrollPosition > this.tableParentOffset /*&& last > -1*/) { //last -1 means that viewport is scrolled behind the table
    if (this.instance.wtTable.getLastVisibleRow() === this.total - 1) {
      availableSize = Handsontable.Dom.outerHeight(this.TABLE);
    }
    else {
      availableSize = this.windowSize;
    }
  }
  else {
    availableSize = this.windowSize - (this.tableParentOffset);
  }

  return availableSize;
};

WalkontableOverlay.prototype.refresh = function (selectionsOnly) {
  var last = this.getLastCell();
  this.measureBefore = this.sumCellSizes(0, this.offset);
  if (last === -1) { //last -1 means that viewport is scrolled behind the table
    this.measureAfter = 0;
  }
  else {
    this.measureAfter = this.sumCellSizes(last, this.total - last);
  }
  this.applyToDOM();
  this.clone && this.clone.draw(selectionsOnly);
};

WalkontableOverlay.prototype.destroy = function () {
  this.$scrollHandler.off('.' + this.clone.guid);
  $(window).off('.' + this.clone.guid);
  $(document).off('.' + this.clone.guid);
  $(document.body).off('.' + this.clone.guid);
};
/**
 * WalkontableAbstractFilter (WalkontableColumnFilter and WalkontableRowFilter inherit from this)
 * @constructor
 */
function WalkontableAbstractFilter() {
  this.offset = 0;
  this.total = 0;
  this.fixedCount = 0;
}

WalkontableAbstractFilter.prototype.offsetted = function (n) {
  return n + this.offset;
};

WalkontableAbstractFilter.prototype.unOffsetted = function (n) {
  return n - this.offset;
};

WalkontableAbstractFilter.prototype.fixed = function (n) {
  if (n < this.fixedCount) {
    return n - this.offset;
  }
  else {
    return n;
  }
};

WalkontableAbstractFilter.prototype.unFixed = function (n) {
  if (n < this.fixedCount) {
    return n + this.offset;
  }
  else {
    return n;
  }
};

WalkontableAbstractFilter.prototype.visibleToSource = function (n) {
  return this.offsetted(this.fixed(n));
};

WalkontableAbstractFilter.prototype.sourceToVisible = function (n) {
  return this.unOffsetted(this.unFixed(n));
};
/**
 * WalkontableAbstractStrategy (WalkontableColumnStrategy and WalkontableRowStrategy inherit from this)
 * @constructor
 */
function WalkontableAbstractStrategy(instance) {
  this.instance = instance;
}

WalkontableAbstractStrategy.prototype.getSize = function (index) {
  return this.cellSizes[index];
};

WalkontableAbstractStrategy.prototype.getContainerSize = function (proposedSize) {
  return typeof this.containerSizeFn === 'function' ? this.containerSizeFn(proposedSize) : this.containerSizeFn;
};

WalkontableAbstractStrategy.prototype.countVisible = function () {
  return this.cellCount;
};

WalkontableAbstractStrategy.prototype.isLastIncomplete = function () {
  return this.remainingSize > 0;
};
function WalkontableBorder(instance, settings) {
  var style;

  //reference to instance
  this.instance = instance;
  this.settings = settings;

  this.main = document.createElement("div");
  style = this.main.style;
  style.position = 'absolute';
  style.top = 0;
  style.left = 0;

  for (var i = 0; i < 5; i++) {
    var DIV = document.createElement('DIV');
    DIV.className = 'wtBorder ' + (settings.className || '');
    style = DIV.style;
    style.backgroundColor = settings.border.color;
    style.height = settings.border.width + 'px';
    style.width = settings.border.width + 'px';
    this.main.appendChild(DIV);
  }

  this.top = this.main.childNodes[0];
  this.left = this.main.childNodes[1];
  this.bottom = this.main.childNodes[2];
  this.right = this.main.childNodes[3];

  this.topStyle = this.top.style;
  this.leftStyle = this.left.style;
  this.bottomStyle = this.bottom.style;
  this.rightStyle = this.right.style;

  this.corner = this.main.childNodes[4];
  this.corner.className += ' corner';
  this.cornerStyle = this.corner.style;
  this.cornerStyle.width = '5px';
  this.cornerStyle.height = '5px';
  this.cornerStyle.border = '2px solid #FFF';

  this.disappear();
  if (!instance.wtTable.bordersHolder) {
    instance.wtTable.bordersHolder = document.createElement('div');
    instance.wtTable.bordersHolder.className = 'htBorders';
    instance.wtTable.hider.appendChild(instance.wtTable.bordersHolder);

  }
  instance.wtTable.bordersHolder.appendChild(this.main);

  var down = false;
  var $body = $(document.body);

  $body.on('mousedown.walkontable.' + instance.guid, function () {
    down = true;
  });

  $body.on('mouseup.walkontable.' + instance.guid, function () {
    down = false
  });

  $(this.main.childNodes).on('mouseenter', function (event) {
    if (!down || !instance.getSetting('hideBorderOnMouseDownOver')) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();

    var bounds = this.getBoundingClientRect();

    var $this = $(this);
    $this.hide();

    var isOutside = function (event) {
      if (event.clientY < Math.floor(bounds.top)) {
        return true;
      }
      if (event.clientY > Math.ceil(bounds.top + bounds.height)) {
        return true;
      }
      if (event.clientX < Math.floor(bounds.left)) {
        return true;
      }
      if (event.clientX > Math.ceil(bounds.left + bounds.width)) {
        return true;
      }
    };

    $body.on('mousemove.border.' + instance.guid, function (event) {
      if (isOutside(event)) {
        $body.off('mousemove.border.' + instance.guid);
        $this.show();
      }
    });
  });
}

/**
 * Show border around one or many cells
 * @param {Array} corners
 */
WalkontableBorder.prototype.appear = function (corners) {
  var isMultiple, fromTD, toTD, fromOffset, toOffset, containerOffset, top, minTop, left, minLeft, height, width;
  if (this.disabled) {
    return;
  }

  var instance = this.instance;

  var fromRow
    , fromColumn
    , toRow
    , toColumn
    , hideTop = false
    , hideLeft = false
    , hideBottom = false
    , hideRight = false
    , i
    , ilen
    , s;

  if (!instance.wtTable.isRowInViewport(corners[0])) {
    hideTop = true;
  }

  if (!instance.wtTable.isRowInViewport(corners[2])) {
    hideBottom = true;
  }

  if (instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative || instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
    ilen = instance.getSetting('fixedRowsTop');
  }
  else {
    ilen = instance.wtTable.getRowStrategy().countVisible();
  }

  for (i = 0; i < ilen; i++) {
    s = instance.wtTable.rowFilter.visibleToSource(i);
    if (s >= corners[0] && s <= corners[2]) {
      fromRow = s;
      break;
    }
  }

  for (i = ilen - 1; i >= 0; i--) {
    s = instance.wtTable.rowFilter.visibleToSource(i);
    if (s >= corners[0] && s <= corners[2]) {
      toRow = s;
      break;
    }
  }

  if (hideTop && hideBottom) {
    hideLeft = true;
    hideRight = true;
  }
  else {
    if (!instance.wtTable.isColumnInViewport(corners[1])) {
      hideLeft = true;
    }

    if (!instance.wtTable.isColumnInViewport(corners[3])) {
      hideRight = true;
    }

    if (instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative || instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
      ilen = instance.getSetting('fixedColumnsLeft');
    }
    else {
      ilen = instance.wtTable.getColumnStrategy().cellCount;
    }



    for (i = 0; i < ilen; i++) {
      s = instance.wtTable.columnFilter.visibleToSource(i);
      if (s >= corners[1] && s <= corners[3]) {
        fromColumn = s;
        break;
      }
    }

    for (i = ilen - 1; i >= 0; i--) {
      s = instance.wtTable.columnFilter.visibleToSource(i);
      if (s >= corners[1] && s <= corners[3]) {
        toColumn = s;
        break;
      }
    }
  }

  if (fromRow !== void 0 && fromColumn !== void 0) {
    isMultiple = (fromRow !== toRow || fromColumn !== toColumn);
    fromTD = instance.wtTable.getCell(new WalkontableCellCoords(fromRow, fromColumn));
    toTD = isMultiple ? instance.wtTable.getCell(new WalkontableCellCoords(toRow, toColumn)) : fromTD;
    fromOffset = Handsontable.Dom.offset(fromTD);
    toOffset = isMultiple ? Handsontable.Dom.offset(toTD) : fromOffset;
    containerOffset = Handsontable.Dom.offset(instance.wtTable.TABLE);

    minTop = fromOffset.top;
    height = toOffset.top + Handsontable.Dom.outerHeight(toTD) - minTop;
    minLeft = fromOffset.left;
    width = toOffset.left + Handsontable.Dom.outerWidth(toTD) - minLeft;

    top = minTop - containerOffset.top - 1;
    left = minLeft - containerOffset.left - 1;

    var style = Handsontable.Dom.getComputedStyle(fromTD);
    if (parseInt(style['borderTopWidth'], 10) > 0) {
      top += 1;
      height = height > 0 ? height - 1 : 0;
    }
    if (parseInt(style['borderLeftWidth'], 10) > 0) {
      left += 1;
      width = width > 0 ? width - 1 : 0;
    }
  }
  else {
    this.disappear();
    return;
  }

  if (hideTop) {
    this.topStyle.display = 'none';
  }
  else {
    this.topStyle.top = top + 'px';
    this.topStyle.left = left + 'px';
    this.topStyle.width = width + 'px';
    this.topStyle.display = 'block';
  }

  if (hideLeft) {
    this.leftStyle.display = 'none';
  }
  else {
    this.leftStyle.top = top + 'px';
    this.leftStyle.left = left + 'px';
    this.leftStyle.height = height + 'px';
    this.leftStyle.display = 'block';
  }

  var delta = Math.floor(this.settings.border.width / 2);

  if (hideBottom) {
    this.bottomStyle.display = 'none';
  }
  else {
    this.bottomStyle.top = top + height - delta + 'px';
    this.bottomStyle.left = left + 'px';
    this.bottomStyle.width = width + 'px';
    this.bottomStyle.display = 'block';
  }

  if (hideRight) {
    this.rightStyle.display = 'none';
  }
  else {
    this.rightStyle.top = top + 'px';
    this.rightStyle.left = left + width - delta + 'px';
    this.rightStyle.height = height + 1 + 'px';
    this.rightStyle.display = 'block';
  }

  if (hideBottom || hideRight || !this.hasSetting(this.settings.border.cornerVisible)) {
    this.cornerStyle.display = 'none';
  }
  else {
    this.cornerStyle.top = top + height - 4 + 'px';
    this.cornerStyle.left = left + width - 4 + 'px';
    this.cornerStyle.display = 'block';
  }
};

/**
 * Hide border
 */
WalkontableBorder.prototype.disappear = function () {
  this.topStyle.display = 'none';
  this.leftStyle.display = 'none';
  this.bottomStyle.display = 'none';
  this.rightStyle.display = 'none';
  this.cornerStyle.display = 'none';
};

WalkontableBorder.prototype.hasSetting = function (setting) {
  if (typeof setting === 'function') {
    return setting();
  }
  return !!setting;
};
/**
 * WalkontableCellCoords holds cell coordinates (row, column) and few metiod to validate them and retrieve as an array or an object
 * TODO: change interface to WalkontableCellCoords(row, col) everywhere, remove those unnecessary setter and getter functions
 */

function WalkontableCellCoords(row, col) {
  if (typeof row !== 'undefined' && typeof col !== 'undefined') {
    this.row = row;
    this.col = col;
  }
  else {
    this.row = null;
    this.col = null;
  }
}

/**
 * Returns boolean information if given set of coordinates is valid in context of a given Walkontable instance
 * @param instance
 * @returns {boolean}
 */
WalkontableCellCoords.prototype.isValid = function (instance) {
  //is it a valid cell index (0 or higher)
  if (this.row < 0 || this.col < 0) {
    return false;
  }

  //is selection within total rows and columns
  if (this.row >= instance.getSetting('totalRows') || this.col >= instance.getSetting('totalColumns')) {
    return false;
  }

  return true;
};

/**
 * Returns boolean information if this cell coords are the same as cell coords given as a parameter
 * @param {WalkontableCellCoords} cellCoords
 * @returns {boolean}
 */
WalkontableCellCoords.prototype.isEqual = function (cellCoords) {
  if (cellCoords === this) {
    return true;
  }
  return (this.row === cellCoords.row && this.col === cellCoords.col);
};

WalkontableCellCoords.prototype.isSouthEastOf = function (testedCoords) {
  return this.row >= testedCoords.row && this.col >= testedCoords.col;
};

WalkontableCellCoords.prototype.isNorthWestOf = function (testedCoords) {
  return this.row <= testedCoords.row && this.col <= testedCoords.col;
};

window.WalkontableCellCoords = WalkontableCellCoords; //export
/**
 * A cell range is a set of exactly two WalkontableCellCoords (that can be the same or different)
 */

function WalkontableCellRange(highlight, from, to) {
  this.highlight = highlight; //this property is used to draw bold border around a cell where selection was started and to edit the cell when you press Enter
  this.from = from; //this property is usually the same as highlight, but in Excel there is distinction - one can change highlight within a selection
  this.to = to;
}

WalkontableCellRange.prototype.isValid = function (instance) {
  return (this.from.isValid(instance) && this.to.isValid(instance));
};

WalkontableCellRange.prototype.isSingle = function () {
  return (this.from.row === this.to.row && this.from.col === this.to.col);
};

/**
 * Returns boolean information if given cell coords is within `from` and `to` cell coords of this range
 * @param {WalkontableCellCoords} cellCoords
 * @returns {boolean}
 */
WalkontableCellRange.prototype.includes = function (cellCoords) {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  return (topLeft.row <= cellCoords.row && bottomRight.row >= cellCoords.row && topLeft.col <= cellCoords.col && bottomRight.col >= cellCoords.col);
};

WalkontableCellRange.prototype.includesRange = function (testedRange) {
  return this.includes(testedRange.getTopLeftCorner()) && this.includes(testedRange.getBottomRightCorner());
};

/**
 * Returns true if tested range overlaps with the range.
 * Range A is considered to to be overlapping with range B if intersection of A and B or B and A is not empty.
 * @param testedRange
 * @returns {boolean}
 */
WalkontableCellRange.prototype.overlaps = function (testedRange) {
  return testedRange.isSouthEastOf(this.getTopLeftCorner()) && testedRange.isNorthWestOf(this.getBottomRightCorner());
};

WalkontableCellRange.prototype.isSouthEastOf = function (testedCoords) {
  return this.getTopLeftCorner().isSouthEastOf(testedCoords) || this.getBottomRightCorner().isSouthEastOf(testedCoords);
};

WalkontableCellRange.prototype.isNorthWestOf = function (testedCoords) {
  return this.getTopLeftCorner().isNorthWestOf(testedCoords) || this.getBottomRightCorner().isNorthWestOf(testedCoords);
};

/**
 * Adds a cell to a range (only if exceeds corners of the range). Returns information if range was expanded
 * @param {WalkontableCellCoords} cellCoords
 * @returns {boolean}
 */
WalkontableCellRange.prototype.expand = function (cellCoords) {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  if (cellCoords.row < topLeft.row || cellCoords.col < topLeft.col || cellCoords.row > bottomRight.row || cellCoords.col > bottomRight.col) {
    this.from = new WalkontableCellCoords(Math.min(topLeft.row, cellCoords.row), Math.min(topLeft.col, cellCoords.col));
    this.to = new WalkontableCellCoords(Math.max(bottomRight.row, cellCoords.row), Math.max(bottomRight.col, cellCoords.col));
    return true;
  }
  return false;
};

WalkontableCellRange.prototype.expandByRange = function (expandingRange) {
  if (this.includesRange(expandingRange) || !this.overlaps(expandingRange)){
    return false;
  }

  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();

  var expandingTopLeft = expandingRange.getTopLeftCorner();
  var expandingBottomRight = expandingRange.getBottomRightCorner();

  var resultTopRow = Math.min(topLeft.row, expandingTopLeft.row);
  var resultTopCol = Math.min(topLeft.col, expandingTopLeft.col);
  var resultBottomRow = Math.max(bottomRight.row, expandingBottomRight.row);
  var resultBottomCol = Math.max(bottomRight.col, expandingBottomRight.col);

  this.from = new WalkontableCellCoords(resultTopRow, resultTopCol);
  this.to = new WalkontableCellCoords(resultBottomRow, resultBottomCol);

  return true;


};

WalkontableCellRange.prototype.getTopLeftCorner = function () {
  return new WalkontableCellCoords(Math.min(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
};

WalkontableCellRange.prototype.getBottomRightCorner = function () {
  return new WalkontableCellCoords(Math.max(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
};

WalkontableCellRange.prototype.getInner = function () {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  var out = [];
  for (var r = topLeft.row; r <= bottomRight.row; r++) {
    for (var c = topLeft.col; c <= bottomRight.col; c++) {
      if (!(this.from.row === r && this.from.col === c) && !(this.to.row === r && this.to.col === c)) {
        out.push(new WalkontableCellCoords(r, c));
      }
    }
  }
  return out;
};

WalkontableCellRange.prototype.getAll = function () {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  var out = [];
  for (var r = topLeft.row; r <= bottomRight.row; r++) {
    for (var c = topLeft.col; c <= bottomRight.col; c++) {
      if (topLeft.row === r && topLeft.col === c) {
        out.push(topLeft);
      }
      else if (bottomRight.row === r && bottomRight.col === c) {
        out.push(bottomRight);
      }
      else {
        out.push(new WalkontableCellCoords(r, c));
      }
    }
  }
  return out;
};

/**
 * Runs a callback function against all cells in the range. You can break the iteration by returning false in the callback function
 * @param callback {Function}
 */
WalkontableCellRange.prototype.forAll = function (callback) {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  for (var r = topLeft.row; r <= bottomRight.row; r++) {
    for (var c = topLeft.col; c <= bottomRight.col; c++) {
      var breakIteration = callback(r, c);
      if (breakIteration === false) {
        return;
      }
    }
  }
};

window.WalkontableCellRange = WalkontableCellRange; //export
/**
 * WalkontableClassNameList
 * @constructor
 */
function WalkontableClassNameCache() {
  this.cache = [];
}

WalkontableClassNameCache.prototype.add = function (r, c, cls) {
  if (!this.cache[r]) {
    this.cache[r] = [];
  }
  if (!this.cache[r][c]) {
    this.cache[r][c] = [];
  }
  this.cache[r][c][cls] = true;
};

WalkontableClassNameCache.prototype.test = function (r, c, cls) {
  return (this.cache[r] && this.cache[r][c] && this.cache[r][c][cls]);
};
/**
 * WalkontableColumnFilter
 * @constructor
 */
function WalkontableColumnFilter(offset, total, fixedCount, countTH) {
  this.offset = offset;
  this.total = total;
  this.fixedCount = fixedCount;
  this.countTH = countTH;
}

WalkontableColumnFilter.prototype = new WalkontableAbstractFilter();

WalkontableColumnFilter.prototype.offsettedTH = function (n) {
  return n - this.countTH;
};

WalkontableColumnFilter.prototype.unOffsettedTH = function (n) {
  return n + this.countTH;
};

WalkontableColumnFilter.prototype.visibleRowHeadedColumnToSourceColumn = function (n) {
  return this.visibleToSource(this.offsettedTH(n));
};

WalkontableColumnFilter.prototype.sourceColumnToVisibleRowHeadedColumn = function (n) {
  return this.unOffsettedTH(this.sourceToVisible(n));
};
/**
 * WalkontableColumnStrategy
 * @param containerSizeFn
 * @param sizeAtIndex
 * @param strategy - all, last, none
 * @constructor
 */
function WalkontableColumnStrategy(instance, containerSizeFn, sizeAtIndex, strategy) {
  var size
    , i = 0;

  WalkontableAbstractStrategy.apply(this, arguments);

  this.containerSizeFn = containerSizeFn;
  this.cellSizesSum = 0;
  this.cellSizes = [];
  this.cellStretch = [];
  this.cellCount = 0;
  this.visibleCellCount = 0;
  this.remainingSize = 0;
  this.strategy = strategy;

  //step 1 - determine cells that fit containerSize and cache their widths
  while (true) {
    size = sizeAtIndex(i);
    if (size === void 0) {
      break; //total columns exceeded
    }
    if (this.cellSizesSum < this.getContainerSize(this.cellSizesSum + size)) {
      this.visibleCellCount++;
    }
    this.cellSizes.push(size);
    this.cellSizesSum += size;
    this.cellCount++;

    i++;
  }

  var containerSize = this.getContainerSize(this.cellSizesSum);
  this.remainingSize = this.cellSizesSum - containerSize;
  //negative value means the last cell is fully visible and there is some space left for stretching
  //positive value means the last cell is not fully visible
}

WalkontableColumnStrategy.prototype = new WalkontableAbstractStrategy();

WalkontableColumnStrategy.prototype.getSize = function (index) {
  return this.cellSizes[index] + (this.cellStretch[index] || 0);
};

WalkontableColumnStrategy.prototype.stretch = function () {
  //step 2 - apply stretching strategy
  var containerSize
    , i = 0;

  containerSize = this.instance.wtTable.allRowsInViewport() ? this.getContainerSize() : this.getContainerSize(Infinity);

  this.remainingSize = this.cellSizesSum - containerSize;

  this.cellStretch.length = 0; //clear previous stretch

  if (this.strategy === 'all') {
    if (this.remainingSize < 0) {
      var ratio = containerSize / this.cellSizesSum;
      var newSize;

      while (i < this.cellCount - 1) { //"i < this.cellCount - 1" is needed because last cellSize is adjusted after the loop
        newSize = Math.floor(ratio * this.cellSizes[i]);
        this.remainingSize += newSize - this.cellSizes[i];
        this.cellStretch[i] = newSize - this.cellSizes[i];
        i++;
      }
      this.cellStretch[this.cellCount - 1] = -this.remainingSize;
      this.remainingSize = 0;
    }
  }
  else if (this.strategy === 'last') {
    if (this.remainingSize < 0 && containerSize !== Infinity) { //Infinity is with native scroll when the table is wider than the viewport (TODO: test)
      this.cellStretch[this.cellCount - 1] = -this.remainingSize;
      this.remainingSize = 0;
    }
  }
};

WalkontableColumnStrategy.prototype.countVisible = function () {
  return this.visibleCellCount;
};

WalkontableColumnStrategy.prototype.isLastIncomplete = function () {

  var firstRow = this.instance.wtTable.getFirstVisibleRow();
  var lastCol = this.instance.wtTable.getLastVisibleColumn();
  var cell = this.instance.wtTable.getCell(new WalkontableCellCoords(firstRow, lastCol));
  var cellOffset = Handsontable.Dom.offset(cell);
  var cellWidth = Handsontable.Dom.outerWidth(cell);
  var cellEnd = cellOffset.left + cellWidth;

  var viewportOffsetLeft = this.instance.wtScrollbars.vertical.getScrollPosition();
  var viewportWitdh = this.instance.wtViewport.getViewportWidth();
  var viewportEnd = viewportOffsetLeft + viewportWitdh;


  return viewportEnd >= cellEnd;
};
function Walkontable(settings) {
  var originalHeaders = [];

  this.guid = 'wt_' + walkontableRandomString(); //this is the namespace for global events

  //bootstrap from settings
  if (settings.cloneSource) {
    this.cloneSource = settings.cloneSource;
    this.cloneOverlay = settings.cloneOverlay;
    this.wtSettings = settings.cloneSource.wtSettings;
    this.wtTable = new WalkontableTable(this, settings.table);
    this.wtScroll = new WalkontableScroll(this);
    this.wtViewport = settings.cloneSource.wtViewport;
    this.wtEvent = new WalkontableEvent(this);
    this.selections = this.cloneSource.selections.makeClone(this);
  }
  else {
    this.wtSettings = new WalkontableSettings(this, settings);
    this.wtTable = new WalkontableTable(this, settings.table);
    this.wtScroll = new WalkontableScroll(this);
    this.wtViewport = new WalkontableViewport(this);
    this.wtEvent = new WalkontableEvent(this);
    this.selections = new WalkontableSelections(this, this.getSetting('selections'));

    this.wtScrollbars = new WalkontableScrollbars(this);
  }

  //find original headers
  if (this.wtTable.THEAD.childNodes.length && this.wtTable.THEAD.childNodes[0].childNodes.length) {
    for (var c = 0, clen = this.wtTable.THEAD.childNodes[0].childNodes.length; c < clen; c++) {
      originalHeaders.push(this.wtTable.THEAD.childNodes[0].childNodes[c].innerHTML);
    }
    if (!this.getSetting('columnHeaders').length) {
      this.update('columnHeaders', [function (column, TH) {
        Handsontable.Dom.fastInnerText(TH, originalHeaders[column]);
      }]);
    }
  }



  this.drawn = false;
  this.drawInterrupted = false;
}

Walkontable.prototype.draw = function (selectionsOnly) {
  this.drawInterrupted = false;
  if (!selectionsOnly && !Handsontable.Dom.isVisible(this.wtTable.TABLE)) {
    this.drawInterrupted = true; //draw interrupted because TABLE is not visible
    return;
  }

  selectionsOnly = selectionsOnly && this.getSetting('offsetRow') === this.lastOffsetRow && this.getSetting('offsetColumn') === this.lastOffsetColumn;
  this.lastOffsetRow = this.getSetting('offsetRow');
  this.lastOffsetColumn = this.getSetting('offsetColumn');

  var totalRows = this.getSetting('totalRows');

  if (this.lastOffsetRow > totalRows && totalRows > 0) {
    this.scrollVertical(-Infinity); //TODO: probably very inefficient!
    this.scrollViewport(new WalkontableCellCoords(totalRows - 1, 0));
  }


  this.wtTable.draw(selectionsOnly);
  return this;
};

Walkontable.prototype.update = function (settings, value) {
  return this.wtSettings.update(settings, value);
};

Walkontable.prototype.scrollVertical = function (delta) {
  var result = this.wtScroll.scrollVertical(delta);

  this.getSetting('onScrollVertically');

  return result;
};

Walkontable.prototype.scrollHorizontal = function (delta) {
  var result = this.wtScroll.scrollHorizontal(delta);

  this.getSetting('onScrollHorizontally');

  return result;
};

/**
 * Scrolls the viewport to a cell (rerenders if needed)
 * @param {WalkontableCellCoords} coords
 * @returns {Walkontable}
 */

Walkontable.prototype.scrollViewport = function (coords) {
  this.wtScroll.scrollViewport(coords);
  return this;
};

Walkontable.prototype.getViewport = function () {
  return [
    this.wtTable.getFirstVisibleRow(),
    this.wtTable.getFirstVisibleColumn(),
    this.wtTable.getLastVisibleRow(),
    this.wtTable.getLastVisibleColumn()
  ];
};

Walkontable.prototype.getSetting = function (key, param1, param2, param3, param4) {
  return this.wtSettings.getSetting(key, param1, param2, param3, param4); //this is faster than .apply - https://github.com/handsontable/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
};

Walkontable.prototype.hasSetting = function (key) {
  return this.wtSettings.has(key);
};

Walkontable.prototype.destroy = function () {
  $(window).off('.' + this.guid);
  $(document.body).off('.' + this.guid);
  this.wtScrollbars.destroy();
  this.wtEvent && this.wtEvent.destroy();
};
/**
 * A overlay that renders ALL available rows & columns positioned on top of the original Walkontable instance and all other overlays.
 * Used for debugging purposes to see if the other overlays (that render only part of the rows & columns) are positioned correctly
 * @param instance
 * @constructor
 */
function WalkontableDebugOverlay(instance) {
  this.instance = instance;
  this.init();
  this.clone = this.makeClone('debug');
  this.clone.wtTable.holder.style.opacity = 0.4;
  this.clone.wtTable.holder.style.textShadow = '0 0 2px #ff0000';

  var that = this;
  var lastTimeout;
  var lastX = 0;
  var lastY = 0;
  var overlayContainer = that.clone.wtTable.holder.parentNode;

  $(document.body).on('mousemove.' + this.instance.guid, function (event) {
    if (!that.instance.wtTable.holder.parentNode) {
      return; //removed from DOM
    }
    if ((event.clientX - lastX > -5 && event.clientX - lastX < 5) && (event.clientY - lastY > -5 && event.clientY - lastY < 5)) {
      return; //ignore minor mouse movement
    }
    lastX = event.clientX;
    lastY = event.clientY;
    Handsontable.Dom.addClass(overlayContainer, 'wtDebugHidden');
    Handsontable.Dom.removeClass(overlayContainer, 'wtDebugVisible');
    clearTimeout(lastTimeout);
    lastTimeout = setTimeout(function () {
      Handsontable.Dom.removeClass(overlayContainer, 'wtDebugHidden');
      Handsontable.Dom.addClass(overlayContainer, 'wtDebugVisible');
    }, 1000);
  });
}

WalkontableDebugOverlay.prototype = new WalkontableOverlay();

WalkontableDebugOverlay.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;
  var box = this.instance.wtTable.holder.getBoundingClientRect();
  elem.style.top = Math.ceil(box.top, 10) + 'px';
  elem.style.left = Math.ceil(box.left, 10) + 'px';
};

WalkontableDebugOverlay.prototype.prepare = function () {
};

WalkontableDebugOverlay.prototype.refresh = function (selectionsOnly) {
  this.clone && this.clone.draw(selectionsOnly);
};

WalkontableDebugOverlay.prototype.getScrollPosition = function () {
};

WalkontableDebugOverlay.prototype.getLastCell = function () {
};

WalkontableDebugOverlay.prototype.applyToDOM = function () {
};

WalkontableDebugOverlay.prototype.scrollTo = function () {
};

WalkontableDebugOverlay.prototype.readWindowSize = function () {
};

WalkontableDebugOverlay.prototype.readSettings = function () {
};
function WalkontableEvent(instance) {
  var that = this;

  //reference to instance
  this.instance = instance;

  var dblClickOrigin = [null, null];
  var dblClickTimeout = [null, null];

  var onMouseDown = function (event) {
    var cell = that.parentCell(event.target);
    if (Handsontable.Dom.hasClass(event.target, 'corner')) {
      that.instance.getSetting('onCellCornerMouseDown', event, event.target);
    }
    else if (cell.TD){
//      if(cell.TD.nodeName == 'TD' || cell.TD.nodeName == 'TH'){
        if (that.instance.hasSetting('onCellMouseDown')) {
          that.instance.getSetting('onCellMouseDown', event, cell.coords, cell.TD, that.instance);
        }
//      }
    }

    if (event.button !== 2) { //if not right mouse button
//      if (cell.TD && cell.TD.nodeName === 'TD') {
      if (cell.TD) {
        dblClickOrigin[0] = cell.TD;
        clearTimeout(dblClickTimeout[0]);
        dblClickTimeout[0] = setTimeout(function () {
          dblClickOrigin[0] = null;
        }, 1000);
      }
    }
  };

  var lastMouseOver;
  var onMouseOver = function (event) {
    if (that.instance.hasSetting('onCellMouseOver')) {
      var TABLE = that.instance.wtTable.TABLE;
      var TD = Handsontable.Dom.closest(event.target, ['TD', 'TH'], TABLE);
      if (TD && TD !== lastMouseOver && Handsontable.Dom.isChildOf(TD, TABLE)) {
        lastMouseOver = TD;
        if (TD.nodeName === 'TD') {
          that.instance.getSetting('onCellMouseOver', event, that.instance.wtTable.getCoords(TD), TD, that.instance);
        }
      }
    }
  };

/*  var lastMouseOut;
  var onMouseOut = function (event) {
    if (that.instance.hasSetting('onCellMouseOut')) {
      var TABLE = that.instance.wtTable.TABLE;
      var TD = Handsontable.Dom.closest(event.target, ['TD', 'TH'], TABLE);
      if (TD && TD !== lastMouseOut && Handsontable.Dom.isChildOf(TD, TABLE)) {
        lastMouseOut = TD;
        if (TD.nodeName === 'TD') {
          that.instance.getSetting('onCellMouseOut', event, that.instance.wtTable.getCoords(TD), TD);
        }
      }
    }
  };*/

  var onMouseUp = function (event) {
    if (event.button !== 2) { //if not right mouse button
      var cell = that.parentCell(event.target);

      if (cell.TD === dblClickOrigin[0] && cell.TD === dblClickOrigin[1]) {
        if (Handsontable.Dom.hasClass(event.target, 'corner')) {
          that.instance.getSetting('onCellCornerDblClick', event, cell.coords, cell.TD, that.instance);
        }
//        else if (cell.TD) {
        else {
          that.instance.getSetting('onCellDblClick', event, cell.coords, cell.TD, that.instance);
        }

        dblClickOrigin[0] = null;
        dblClickOrigin[1] = null;
      }
      else if (cell.TD === dblClickOrigin[0]) {
        dblClickOrigin[1] = cell.TD;
        clearTimeout(dblClickTimeout[1]);
        dblClickTimeout[1] = setTimeout(function () {
          dblClickOrigin[1] = null;
        }, 500);
      }
    }
  };

  $(this.instance.wtTable.holder).on('mousedown', onMouseDown);
  $(this.instance.wtTable.TABLE).on('mouseover', onMouseOver);
  $(this.instance.wtTable.holder).on('mouseup', onMouseUp);

}

WalkontableEvent.prototype.parentCell = function (elem) {
  var cell = {};
  var TABLE = this.instance.wtTable.TABLE;
  var TD = Handsontable.Dom.closest(elem, ['TD', 'TH'], TABLE);

  if (TD && Handsontable.Dom.isChildOf(TD, TABLE)) {
    cell.coords = this.instance.wtTable.getCoords(TD);
    cell.TD = TD;
  }
  else if (Handsontable.Dom.hasClass(elem, 'wtBorder') && Handsontable.Dom.hasClass(elem, 'current')) {
    cell.coords = this.instance.selections.current.cellRange.highlight;
    cell.TD = this.instance.wtTable.getCell(cell.coords);
  }
  return cell;
};

WalkontableEvent.prototype.destroy = function () {
  clearTimeout(this.dblClickTimeout0);
  clearTimeout(this.dblClickTimeout1);
};
function walkontableRangesIntersect() {
  var from = arguments[0];
  var to = arguments[1];
  for (var i = 1, ilen = arguments.length / 2; i < ilen; i++) {
    if (from <= arguments[2 * i + 1] && to >= arguments[2 * i]) {
      return true;
    }
  }
  return false;
}

/**
 * Generates a random hex string. Used as namespace for Walkontable instance events.
 * @return {String} - 16 character random string: "92b1bfc74ec4"
 */
function walkontableRandomString() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return s4() + s4() + s4() + s4();
}
/**
 * http://notes.jetienne.com/2011/05/18/cancelRequestAnimFrame-for-paul-irish-requestAnimFrame.html
 */
window.requestAnimFrame = (function () {
  return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (/* function */ callback, /* DOMElement */ element) {
      return window.setTimeout(callback, 1000 / 60);
    };
})();

window.cancelRequestAnimFrame = (function () {
  return window.cancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    window.mozCancelRequestAnimationFrame ||
    window.oCancelRequestAnimationFrame ||
    window.msCancelRequestAnimationFrame ||
    clearTimeout
})();

//http://snipplr.com/view/13523/
//modified for speed
//http://jsperf.com/getcomputedstyle-vs-style-vs-css/8
if (!window.getComputedStyle) {
  (function () {
    var elem;

    var styleObj = {
      getPropertyValue: function getPropertyValue(prop) {
        if (prop == 'float') prop = 'styleFloat';
        return elem.currentStyle[prop.toUpperCase()] || null;
      }
    };

    window.getComputedStyle = function (el) {
      elem = el;
      return styleObj;
    }
  })();
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
 */
if (!String.prototype.trim) {
  var trimRegex = /^\s+|\s+$/g;
  String.prototype.trim = function () {
    return this.replace(trimRegex, '');
  };
}
/**
 * WalkontableRowFilter
 * @constructor
 */
function WalkontableRowFilter(offset, total, fixedCount, countTH) {
  this.offset = offset;
  this.total = total;
  this.fixedCount = fixedCount;
  this.countTH = countTH;
}

WalkontableRowFilter.prototype = new WalkontableAbstractFilter();

WalkontableRowFilter.prototype.offsettedTH = function (n) {
  return n - this.countTH;
};

WalkontableRowFilter.prototype.visibleColHeadedColumnToSourceColumn = function (n) {
  return this.visibleToSource(this.offsettedTH(n));
};

WalkontableRowFilter.prototype.sourceColumnToVisibleColHeadedColumn = function (n) {
  return this.unOffsettedTH(this.sourceToVisible(n));
};

/**
 * WalkontableRowStrategy
 * @param containerSizeFn
 * @param sizeAtIndex
 * @constructor
 */
function WalkontableRowStrategy(instance, containerSizeFn, sizeAtIndex) {

  WalkontableAbstractStrategy.apply(this, arguments);

  this.containerSizeFn = containerSizeFn;
  this.sizeAtIndex = sizeAtIndex;
  this.cellSizesSum = 0;
  this.cellSizes = [];
  this.cellCount = 0;
  this.visiblCellCount = 0;
  this.remainingSize = -Infinity;
  this.maxOuts = 10; //max outs in one direction (before and after table)
  this.curOuts = this.maxOuts;
}

WalkontableRowStrategy.prototype = new WalkontableAbstractStrategy();

WalkontableRowStrategy.prototype.add = function (i, TD) {
  if(!this.canRenderMoreRows()){
    return false;
  }

  var size = this.sizeAtIndex(i, TD);

  if (size === void 0) {
    return false; //total rows exceeded
  }

  var containerSize = this.getContainerSize(this.cellSizesSum + size);
  this.cellSizes.push(size);
  this.cellSizesSum += size;

  this.cellCount++;
  this.remainingSize = this.cellSizesSum - containerSize;

  if (this.remainingSize <= size ){
    this.visiblCellCount++;
  }

  return true;
};

/**
 * Checks whether the number of already rendered rows does not exceeds the number of rows visible in viewport + maximal
 * number of rows rendered above and below viewport
 * @returns {boolean}
 */
WalkontableRowStrategy.prototype.canRenderMoreRows = function () {
  return this.remainingSize <= 0 || this.cellCount - this.visiblCellCount < this.curOuts;
};

WalkontableRowStrategy.prototype.remove = function () {
  var size = this.cellSizes.pop();
  this.cellSizesSum -= size;
  this.cellCount--;
  this.remainingSize -= size;
};

WalkontableRowStrategy.prototype.removeOutstanding = function () {
  while (this.cellCount - this.visiblCellCount > this.curOuts) { //this row is completely off screen!
    this.remove();
  }
};

WalkontableRowStrategy.prototype.countRendered = function () {
  return this.cellCount;
}

WalkontableRowStrategy.prototype.countVisible = function () {
  return this.visiblCellCount;
};

WalkontableRowStrategy.prototype.isLastIncomplete = function () {
  var lastRow = this.instance.wtTable.getLastVisibleRow();
  var firstCol = this.instance.wtTable.getFirstVisibleColumn();
  var cell = this.instance.wtTable.getCell(new WalkontableCellCoords(lastRow, firstCol));
  var cellOffsetTop = Handsontable.Dom.offset(cell).top;
  var cellHeight = Handsontable.Dom.outerHeight(cell);
  var cellEnd = cellOffsetTop + cellHeight;

  var viewportOffsetTop = this.instance.wtScrollbars.horizontal.scrollHandler.offsetTop + this.instance.wtScrollbars.vertical.getScrollPosition();
  var viewportHeight = this.instance.wtViewport.getViewportHeight();
  var viewportEnd = viewportOffsetTop + viewportHeight;


  return viewportEnd < cellEnd;
};
function WalkontableScroll(instance) {
  this.instance = instance;
}

WalkontableScroll.prototype.scrollVertical = function (delta) {
  if (!this.instance.drawn) {
    throw new Error('scrollVertical can only be called after table was drawn to DOM');
  }

  var instance = this.instance
    , newOffset
    , offset = instance.getSetting('offsetRow')
    , fixedCount = instance.getSetting('fixedRowsTop')
    , total = instance.getSetting('totalRows')
    , maxSize = instance.wtViewport.getViewportHeight();

  if (total > 0 && !this.instance.wtTable.isLastRowFullyVisible()) {
    newOffset = this.scrollLogicVertical(delta, offset, total, fixedCount, maxSize, function (row) {
      if (row - offset < fixedCount && row - offset >= 0) {
        return instance.getSetting('rowHeight', row - offset);
      }
      else {
        return instance.getSetting('rowHeight', row);
      }
    });

  } else {
    newOffset = 0;
  }


  if (newOffset !== offset) {
    this.instance.wtScrollbars.vertical.scrollTo(newOffset);
  }
  return instance;
};

WalkontableScroll.prototype.scrollHorizontal = function (delta) {
  if (!this.instance.drawn) {
    throw new Error('scrollHorizontal can only be called after table was drawn to DOM');
  }

  var instance = this.instance
    , newOffset
    , offset = instance.getSetting('offsetColumn')
    , fixedCount = instance.getSetting('fixedColumnsLeft')
    , total = instance.getSetting('totalColumns')
    , maxSize = instance.wtViewport.getViewportWidth();

  if (total > 0) {
    newOffset = this.scrollLogicHorizontal(delta, offset, total, fixedCount, maxSize, function (col) {
      if (col - offset < fixedCount && col - offset >= 0) {
        return instance.getSetting('columnWidth', col - offset);
      }
      else {
        return instance.getSetting('columnWidth', col);
      }
    });
  }
  else {
    newOffset = 0;
  }

  if (newOffset !== offset) {
    this.instance.wtScrollbars.horizontal.scrollTo(newOffset);
  }
  return instance;
};

WalkontableScroll.prototype.scrollLogicVertical = function (delta, offset, total, fixedCount, maxSize, cellSizeFn) {
  var newOffset = offset + delta;

  if (newOffset >= total - fixedCount) {
    newOffset = total - fixedCount - 1;
  }

  if (newOffset < 0) {
    newOffset = 0;
  }

  return newOffset;
};

WalkontableScroll.prototype.scrollLogicHorizontal = function (delta, offset, total, fixedCount, maxSize, cellSizeFn) {
  var newOffset = offset + delta
    , sum = 0
    , col;

  if (newOffset > fixedCount) {
    if (newOffset >= total - fixedCount) {
      newOffset = total - fixedCount - 1;
    }

    col = newOffset;
    while (sum < maxSize && col < total) {
      sum += cellSizeFn(col);
      col++;
    }

    if (sum < maxSize) {
      while (newOffset > 0) {
        //if sum still less than available width, we cannot scroll that far (must move offset to the left)
        sum += cellSizeFn(newOffset - 1);
        if (sum < maxSize) {
          newOffset--;
        }
        else {
          break;
        }
      }
    }
  }
  else if (newOffset < 0) {
    newOffset = 0;
  }

  return newOffset;
};

/**
 * Scrolls viewport to a cell by minimum number of cells
 * @param {WalkontableCellCoords} coords
 */
WalkontableScroll.prototype.scrollViewport = function (coords) {
  if (!this.instance.drawn) {
    return;
  }

  var offsetRow = this.instance.getSetting('offsetRow')
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , fixedRowsTop = this.instance.getSetting('fixedRowsTop')
    , fixedColumnsLeft = this.instance.getSetting('fixedColumnsLeft');


  if (coords.row < 0 || coords.row > totalRows - 1) {
    throw new Error('row ' + coords.row + ' does not exist');
  }

  if (coords.col < 0 || coords.col > totalColumns - 1) {
    throw new Error('column ' + coords.col + ' does not exist');
  }

  var TD = this.instance.wtTable.getCell(coords);
  if (typeof TD === 'object') {
    this.scrollToRenderedCell(TD);
  }  else if (coords.row >= this.instance.wtTable.getLastVisibleRow()) {

    this.scrollVertical(coords.row - this.instance.wtTable.getLastVisibleRow());

    if (coords.row == this.instance.wtTable.getLastVisibleRow() && this.instance.wtTable.getRowStrategy().isLastIncomplete()){
      this.scrollViewport(coords)
    }

  } else if (coords.row >= this.instance.getSetting('fixedColumnsLeft')){
    this.scrollVertical(coords.row - this.instance.wtTable.getFirstVisibleRow());
  }
};

WalkontableScroll.prototype.scrollToRenderedCell = function (TD) {
  var cellOffset = Handsontable.Dom.offset(TD);
  var cellWidth = Handsontable.Dom.outerWidth(TD);
  var cellHeight = Handsontable.Dom.outerHeight(TD);
  var workspaceOffset = Handsontable.Dom.offset(this.instance.wtTable.TABLE);
  var viewportScrollPosition = {
    left: this.instance.wtScrollbars.horizontal.getScrollPosition(),
    top: this.instance.wtScrollbars.vertical.getScrollPosition()
  };

  var workspaceWidth = this.instance.wtViewport.getWorkspaceWidth();
  var workspaceHeight = this.instance.wtViewport.getWorkspaceHeight();
  var leftCloneWidth = Handsontable.Dom.outerWidth(this.instance.wtScrollbars.horizontal.clone.wtTable.TABLE);
  var topCloneHeight = Handsontable.Dom.outerHeight(this.instance.wtScrollbars.vertical.clone.wtTable.TABLE);

  if (this.instance.wtScrollbars.horizontal.scrollHandler !== window) {
    workspaceOffset.left = 0;
    cellOffset.left -= Handsontable.Dom.offset(this.instance.wtScrollbars.horizontal.scrollHandler).left;
  }

  if (this.instance.wtScrollbars.vertical.scrollHandler !== window) {
    workspaceOffset.top = 0;
    cellOffset.top = cellOffset.top - Handsontable.Dom.offset(this.instance.wtScrollbars.vertical.scrollHandler).top;
  }

  if (cellWidth < workspaceWidth) {
    if (cellOffset.left < viewportScrollPosition.left + leftCloneWidth) {
      this.instance.wtScrollbars.horizontal.setScrollPosition(cellOffset.left - leftCloneWidth);
    }
    else if (cellOffset.left + cellWidth > workspaceOffset.left + viewportScrollPosition.left + workspaceWidth) {
      var delta = (cellOffset.left + cellWidth) - (workspaceOffset.left + viewportScrollPosition.left + workspaceWidth);
      this.instance.wtScrollbars.horizontal.setScrollPosition(viewportScrollPosition.left + delta);
    }
  }

  if (cellHeight < workspaceHeight) {
    if (cellOffset.top < viewportScrollPosition.top + topCloneHeight) {
      this.instance.wtScrollbars.vertical.setScrollPosition(cellOffset.top - topCloneHeight);
      this.instance.wtScrollbars.vertical.onScroll();
    }
    else if (cellOffset.top + cellHeight > viewportScrollPosition.top + workspaceHeight) {
      this.instance.wtScrollbars.vertical.setScrollPosition(cellOffset.top - workspaceHeight + cellHeight);
      this.instance.wtScrollbars.vertical.onScroll();
    }
  }

};

function WalkontableCornerScrollbarNative(instance) {
  this.instance = instance;
  this.init();
  this.clone = this.makeClone('corner');
}

WalkontableCornerScrollbarNative.prototype = new WalkontableOverlay();

WalkontableCornerScrollbarNative.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

  var box;
  if (this.scrollHandler === window) {
    box = this.instance.wtTable.hider.getBoundingClientRect();
    var top = Math.ceil(box.top, 10);
    var bottom = Math.ceil(box.bottom, 10);

    if (top < 0 && bottom > 0) {
      elem.style.top = '0';
    }
    else {
      elem.style.top = top + 'px';
    }

    var left = Math.ceil(box.left, 10);
    var right = Math.ceil(box.right, 10);

    if (left < 0 && right > 0) {
      elem.style.left = '0';
    }
    else {
      elem.style.left = left + 'px';
    }
  }
  else {
    box = this.scrollHandler.getBoundingClientRect();
    elem.style.top = Math.ceil(box.top, 10) + 'px';
    elem.style.left = Math.ceil(box.left, 10) + 'px';
  }

  elem.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px';
  elem.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 4 + 'px';
};

WalkontableCornerScrollbarNative.prototype.prepare = function () {
};

WalkontableCornerScrollbarNative.prototype.refresh = function (selectionsOnly) {
  this.measureBefore = 0;
  this.measureAfter = 0;
  this.clone && this.clone.draw(selectionsOnly);
};

WalkontableCornerScrollbarNative.prototype.getScrollPosition = function () {
};

WalkontableCornerScrollbarNative.prototype.getLastCell = function () {
};

WalkontableCornerScrollbarNative.prototype.applyToDOM = function () {
};

WalkontableCornerScrollbarNative.prototype.scrollTo = function () {
};

WalkontableCornerScrollbarNative.prototype.readWindowSize = function () {
};

WalkontableCornerScrollbarNative.prototype.readSettings = function () {
};
function WalkontableHorizontalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.cellSize = 50;
  this.init();
  this.clone = this.makeClone('left');
}

WalkontableHorizontalScrollbarNative.prototype = new WalkontableOverlay();

//resetFixedPosition (in future merge it with this.refresh?)
WalkontableHorizontalScrollbarNative.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

  var box;
  if (this.scrollHandler === window) {
    box = this.instance.wtTable.hider.getBoundingClientRect();
    var left = Math.ceil(box.left, 10);
    var right = Math.ceil(box.right, 10);

    if (left < 0 && right > 0) {
      elem.style.left = '0';
    }
    else {
      elem.style.left = left + 'px';
    }
  }
  else {
    box = this.scrollHandler.getBoundingClientRect();
    elem.style.top = Math.ceil(box.top, 10) + 'px';
    elem.style.left = Math.ceil(box.left, 10) + 'px';
  }

  this.react();
};

//react on movement of the other dimension scrollbar (in future merge it with this.refresh?)
WalkontableHorizontalScrollbarNative.prototype.react = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var overlayContainer = this.clone.wtTable.holder.parentNode;
  if (this.instance.wtScrollbars.vertical.scrollHandler === window) {
    var box = this.instance.wtTable.hider.getBoundingClientRect();
    overlayContainer.style.top = Math.ceil(box.top, 10) + 'px';
    overlayContainer.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 'px';
  }
  else {
    this.clone.wtTable.holder.style.top = -(this.instance.wtScrollbars.vertical.windowScrollPosition - this.instance.wtScrollbars.vertical.measureBefore) + 'px';
    overlayContainer.style.height = this.instance.wtViewport.getWorkspaceHeight() + 'px'
  }
  overlayContainer.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px'; //4 is for the box shadow
};

WalkontableHorizontalScrollbarNative.prototype.prepare = function () {
};

WalkontableHorizontalScrollbarNative.prototype.refresh = function (selectionsOnly) {
  this.measureBefore = 0;
  this.measureAfter = 0;
  this.clone && this.clone.draw(selectionsOnly);
};

WalkontableHorizontalScrollbarNative.prototype.getScrollPosition = function () {
  return Handsontable.Dom.getScrollLeft(this.scrollHandler);
};

WalkontableHorizontalScrollbarNative.prototype.setScrollPosition = function (pos) {
  if (this.scrollHandler === window){
    window.scrollTo(pos, Handsontable.Dom.getWindowScrollTop());
  } else {
    this.scrollHandler.scrollLeft = pos;
  }
};

WalkontableHorizontalScrollbarNative.prototype.onScroll = function () {
  WalkontableOverlay.prototype.onScroll.call(this);

  this.instance.getSetting('onScrollHorizontally');
};

WalkontableHorizontalScrollbarNative.prototype.getLastCell = function () {
  return this.instance.wtTable.getLastVisibleColumn();
};

//applyToDOM (in future merge it with this.refresh?)
WalkontableHorizontalScrollbarNative.prototype.applyToDOM = function () {
  this.fixedContainer.style.paddingLeft = this.measureBefore + 'px';
  this.fixedContainer.style.paddingRight = this.measureAfter + 'px';
};

WalkontableHorizontalScrollbarNative.prototype.scrollTo = function (cell) {
  this.setScrollPosition(this.tableParentOffset + cell * this.cellSize);
};

//readWindowSize (in future merge it with this.prepare?)
WalkontableHorizontalScrollbarNative.prototype.readWindowSize = function () {
  if (this.scrollHandler === window) {
    this.windowSize = document.documentElement.clientWidth;
    this.tableParentOffset = this.instance.wtTable.holderOffset.left;
  }
  else {
    this.windowSize = this.scrollHandler.clientWidth;
    this.tableParentOffset = 0;
  }
  this.windowScrollPosition = this.getScrollPosition();
};

//readSettings (in future merge it with this.prepare?)
WalkontableHorizontalScrollbarNative.prototype.readSettings = function () {
  this.readWindowSize();
  this.offset = this.instance.getSetting('offsetColumn');
  this.total = this.instance.getSetting('totalColumns');
};
function WalkontableVerticalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'vertical';
  this.cellSize = this.instance.wtSettings.settings.defaultRowHeight;
  this.offset;
  this.total;
  this.init();
  this.clone = this.makeClone('top');
}

WalkontableVerticalScrollbarNative.prototype = new WalkontableOverlay();

//resetFixedPosition (in future merge it with this.refresh?)
WalkontableVerticalScrollbarNative.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

  var box;
  if (this.scrollHandler === window) {
    box = this.instance.wtTable.hider.getBoundingClientRect();
    var top = Math.ceil(box.top, 10);
    var bottom = Math.ceil(box.bottom, 10);

    if (top < 0 && bottom > 0) {
      elem.style.top = '0';
    }
    else {
      elem.style.top = top + 'px';
    }
  }
  else {
    box = this.instance.wtScrollbars.horizontal.scrollHandler.getBoundingClientRect();
    elem.style.top = Math.ceil(box.top, 10) + 'px';
    elem.style.left = Math.ceil(box.left, 10) + 'px';
  }

  if (this.instance.wtScrollbars.horizontal.scrollHandler === window) {
    elem.style.width = this.instance.wtViewport.getWorkspaceActualWidth() + 'px';
  }
  else {
    elem.style.width = Handsontable.Dom.outerWidth(this.instance.wtTable.holder.parentNode) + 'px';
  }

  elem.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 4 + 'px';
};

//react on movement of the other dimension scrollbar (in future merge it with this.refresh?)
WalkontableVerticalScrollbarNative.prototype.react = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }

  var overlayContainer = this.clone.wtTable.holder.parentNode;
  if (this.instance.wtScrollbars.horizontal.scrollHandler !== window) {

    overlayContainer.firstChild.style.left = -this.instance.wtScrollbars.horizontal.windowScrollPosition + 'px';
  } else {
      var box = this.instance.wtTable.hider.getBoundingClientRect();
      overlayContainer.style.left = Math.ceil(box.left, 10) + 'px';
      overlayContainer.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 'px';
  }
};

WalkontableVerticalScrollbarNative.prototype.getScrollPosition = function () {
  return Handsontable.Dom.getScrollTop(this.scrollHandler);
};

WalkontableVerticalScrollbarNative.prototype.setScrollPosition = function (pos) {
  if (this.scrollHandler === window){
    window.scrollTo(Handsontable.Dom.getWindowScrollLeft(), pos);
  } else {
    this.scrollHandler.scrollTop = pos;
  }
};

WalkontableVerticalScrollbarNative.prototype.onScroll = function () {
  WalkontableOverlay.prototype.onScroll.call(this);

  this.instance.draw(true);//

  this.instance.getSetting('onScrollVertically');
};

WalkontableVerticalScrollbarNative.prototype.getLastCell = function () {
  return this.instance.getSetting('offsetRow') + this.instance.wtTable.tbodyChildrenLength - 1;
};

WalkontableVerticalScrollbarNative.prototype.sumCellSizes = function (from, length) {
  var sum = 0;
  while (from < length) {
    sum += this.instance.wtSettings.settings.rowHeight(from) || this.instance.wtSettings.settings.defaultRowHeight; //TODO optimize getSetting, because this is MUCH faster then getSetting
    from++;
  }
  return sum;
};

//applyToDOM (in future merge it with this.refresh?)
WalkontableVerticalScrollbarNative.prototype.applyToDOM = function () {
  var headerSize = this.instance.wtViewport.getColumnHeaderHeight();
  this.fixedContainer.style.height = headerSize + this.sumCellSizes(0, this.total) + 4 + 'px'; //+4 is needed, otherwise vertical scroll appears in Chrome (window scroll mode) - maybe because of fill handle in last row or because of box shadow
  this.fixed.style.top = this.measureBefore + 'px';
  this.fixed.style.bottom = '';
};

WalkontableVerticalScrollbarNative.prototype.scrollTo = function (cell) {
  var newY = this.tableParentOffset + cell * this.cellSize;
  this.setScrollPosition(newY);
  this.onScroll();
};

//readWindowSize (in future merge it with this.prepare?)
WalkontableVerticalScrollbarNative.prototype.readWindowSize = function () {
  if (this.scrollHandler === window) {
    this.windowSize = document.documentElement.clientHeight;
    this.tableParentOffset = this.instance.wtTable.holderOffset.top;
  }
  else {
    var elemHeight = Handsontable.Dom.outerHeight(this.scrollHandler);
    this.windowSize = elemHeight > 0 && this.scrollHandler.clientHeight > 0 ? this.scrollHandler.clientHeight : Infinity; //returns height without DIV scrollbar
    this.tableParentOffset = 0;
  }
  this.windowScrollPosition = this.getScrollPosition();
};

//readSettings (in future merge it with this.prepare?)
WalkontableVerticalScrollbarNative.prototype.readSettings = function () {
  this.readWindowSize();

  this.offset = this.instance.getSetting('offsetRow');
  this.total = this.instance.getSetting('totalRows');

  var scrollDelta = this.windowScrollPosition - this.tableParentOffset;

  var sum = 0;
  var last;
  for (var i = 0; i < this.total; i++) {
    last = this.instance.getSetting('rowHeight', i) || this.instance.wtSettings.settings.defaultRowHeight;
    sum += last;
    if (sum - 1 > scrollDelta) {
      break;
    }
  }

  this.offset = Math.min(i, this.total);
  this.instance.update('offsetRow', this.offset);
};
function WalkontableScrollbars(instance) {
  this.instance = instance;
  instance.update('scrollbarWidth', Handsontable.Dom.getScrollbarWidth());
  instance.update('scrollbarHeight', Handsontable.Dom.getScrollbarWidth());
  this.vertical = new WalkontableVerticalScrollbarNative(instance);
  this.horizontal = new WalkontableHorizontalScrollbarNative(instance);
  this.corner = new WalkontableCornerScrollbarNative(instance);
  if (instance.getSetting('debug')) {
    this.debug = new WalkontableDebugOverlay(instance);
  }
  this.registerListeners();
}

WalkontableScrollbars.prototype.registerListeners = function () {
  var that = this;

  var oldVerticalScrollPosition
    , oldHorizontalScrollPosition
    , oldBoxTop
    , oldBoxLeft
    , oldBoxWidth
    , oldBoxHeight;

  function refreshAll() {
    if(!that.instance.drawn) {
      return;
    }

    if (!that.instance.wtTable.holder.parentNode) {
      //Walkontable was detached from DOM, but this handler was not removed
      that.destroy();
      return;
    }

    that.vertical.windowScrollPosition = that.vertical.getScrollPosition();
    that.horizontal.windowScrollPosition = that.horizontal.getScrollPosition();
    that.box = that.instance.wtTable.hider.getBoundingClientRect();

    /*if((that.box.width !== oldBoxWidth || that.box.height !== oldBoxHeight) && that.instance.rowHeightCache) {
      //that.instance.rowHeightCache.length = 0; //at this point the cached row heights may be invalid, but it is better not to reset the cache, which could cause scrollbar jumping when there are multiline cells outside of the rendered part of the table
      oldBoxWidth = that.box.width;
      oldBoxHeight = that.box.height;
      that.instance.draw(true);
    }*/

    if (that.vertical.windowScrollPosition !== oldVerticalScrollPosition || that.horizontal.windowScrollPosition !== oldHorizontalScrollPosition || that.box.top !== oldBoxTop || that.box.left !== oldBoxLeft) {
      that.vertical.onScroll();
      that.horizontal.onScroll(); //it's done here to make sure that all onScroll's are executed before changing styles
      that.corner.onScroll();

      that.vertical.react();
      that.horizontal.react(); //it's done here to make sure that all onScroll's are executed before changing styles

      oldVerticalScrollPosition = that.vertical.windowScrollPosition;
      oldHorizontalScrollPosition = that.horizontal.windowScrollPosition;
      oldBoxTop = that.box.top;
      oldBoxLeft = that.box.left;
    }
  }

  var $window = $(window);
  this.vertical.$scrollHandler.on('scroll.' + this.instance.guid, refreshAll);
  if (this.vertical.scrollHandler !== this.horizontal.scrollHandler) {
    this.horizontal.$scrollHandler.on('scroll.' + this.instance.guid, refreshAll);
  }

  if (this.vertical.scrollHandler !== window && this.horizontal.scrollHandler !== window) {
    $window.on('scroll.' + this.instance.guid, refreshAll);
  }
};

WalkontableScrollbars.prototype.destroy = function () {
  this.vertical && this.vertical.destroy();
  this.horizontal && this.horizontal.destroy();
  this.corner && this.corner.destroy();
};

WalkontableScrollbars.prototype.refresh = function (selectionsOnly) {
  this.horizontal && this.horizontal.readSettings();
  this.vertical && this.vertical.readSettings();
  this.horizontal && this.horizontal.prepare();
  this.vertical && this.vertical.prepare();
  this.horizontal && this.horizontal.refresh(selectionsOnly);
  this.vertical && this.vertical.refresh(selectionsOnly);
  this.corner && this.corner.refresh(selectionsOnly);
  this.debug && this.debug.refresh(selectionsOnly);
};
function WalkontableSelection(instance, settings) {
  this.instance = instance;
  this.settings = settings;
  this.cellRange = null;
  if (settings.border) {
    this.border = new WalkontableBorder(instance, settings);
  }
}

/**
 * Returns boolean information if selection is empty
 * @returns {boolean}
 */
WalkontableSelection.prototype.isEmpty = function () {
  return (this.cellRange === null);
};

/**
 * Adds a cell coords to the selection
 * @param {WalkontableCellCoords} coords
 */
WalkontableSelection.prototype.add = function (coords) {
  if (this.isEmpty()) {
    this.cellRange = new WalkontableCellRange(coords, coords, coords);
  }
  else {
    this.cellRange.expand(coords);
  }
};

/**
 * If selection range from or to property equals oldCoords, replace it with newCoords. Return boolean information about success
 * @param {WalkontableCellCoords} oldCoords
 * @param {WalkontableCellCoords} newCoords
 * @return {boolean}
 */
WalkontableSelection.prototype.replace = function (oldCoords, newCoords) {
  if (!this.isEmpty()) {
    if(this.cellRange.from.isEqual(oldCoords)) {
      this.cellRange.from = newCoords;
      return true;
    }
    if(this.cellRange.to.isEqual(oldCoords)) {
      this.cellRange.to = newCoords;
      return true;
    }
  }
  return false;
};

WalkontableSelection.prototype.clear = function () {
  this.cellRange = null;
};

/**
 * Returns the top left (TL) and bottom right (BR) selection coordinates
 * @returns {Object}
 */
WalkontableSelection.prototype.getCorners = function () {
  var topLeft = this.cellRange.getTopLeftCorner();
  var bottomRight = this.cellRange.getBottomRightCorner();
  return [topLeft.row, topLeft.col, bottomRight.row, bottomRight.col];
};

WalkontableSelection.prototype.draw = function () {
  var corners, r, c, source_r, source_c,
    instance = this.instance,
    visibleRows = instance.wtTable.getRowStrategy().countVisible(),
    renderedColumns = instance.wtTable.getColumnStrategy().cellCount;

  if (!this.isEmpty()) {
    corners = this.getCorners();

    for (r = 0; r < visibleRows; r++) {
      for (c = 0; c < renderedColumns; c++) {
        source_r = instance.wtTable.rowFilter.visibleToSource(r);
        source_c = instance.wtTable.columnFilter.visibleToSource(c);

        if (source_r >= corners[0] && source_r <= corners[2] && source_c >= corners[1] && source_c <= corners[3]) {
          //selected cell
          if (this.settings.className) {
            instance.wtTable.currentCellCache.add(r, c, this.settings.className);
          }
        }
        else if (source_r >= corners[0] && source_r <= corners[2]) {
          //selection is in this row
          if (this.settings.highlightRowClassName) {
            instance.wtTable.currentCellCache.add(r, c, this.settings.highlightRowClassName);
          }
        }
        else if (source_c >= corners[1] && source_c <= corners[3]) {
          //selection is in this column
          if (this.settings.highlightColumnClassName) {
            instance.wtTable.currentCellCache.add(r, c, this.settings.highlightColumnClassName);
          }
        }
      }
    }

    this.border && this.border.appear(corners); //warning! border.appear modifies corners!
  }
  else {
    this.border && this.border.disappear();
  }
};

/*
  Make a clone of a selection by overriding the WOT instance and creating new WalkontableBorder for the new instance
  Method is used for creating selections in overlays
 */
WalkontableSelection.prototype.makeClone = function (instance) {
  function WalkontableSelectionClone(){}
  WalkontableSelectionClone.prototype = this;

  var clone = new WalkontableSelectionClone();

  clone.instance = instance;

  if (clone.border){
    clone.border = new WalkontableBorder(instance, clone.settings);
  }

  return clone;

};

function WalkontableSelections(instance, config){
  if (config) {
    for (var i in config) {
      if (config.hasOwnProperty(i)) {
        this[i] = new WalkontableSelection(instance, config[i]);
      }
    }
  }
}

WalkontableSelections.prototype.makeClone = function (instance) {
  function WalkontableSelectionsClone(){}

  var clone = new WalkontableSelectionsClone();

  for (var selectionName in this){
    if (this.hasOwnProperty(selectionName)){
      clone[selectionName] = this[selectionName].makeClone(instance);
    }
  }

  return clone;

};
function WalkontableSettings(instance, settings) {
  var that = this;
  this.instance = instance;

  //default settings. void 0 means it is required, null means it can be empty
  this.defaults = {
    table: void 0,
    debug: false, //shows WalkontableDebugOverlay

    //presentation mode
    scrollH: 'auto', //values: scroll (always show scrollbar), auto (show scrollbar if table does not fit in the container), none (never show scrollbar)
    scrollV: 'auto', //values: see above
    stretchH: 'none', //values: all, last, none
    currentRowClassName: null,
    currentColumnClassName: null,

    //data source
    data: void 0,
    offsetRow: 0,
    offsetColumn: 0,
    fixedColumnsLeft: 0,
    fixedRowsTop: 0,
    rowHeaders: function () {
      return []
    }, //this must be array of functions: [function (row, TH) {}]
    columnHeaders: function () {
      return []
    }, //this must be array of functions: [function (column, TH) {}]
    totalRows: void 0,
    totalColumns: void 0,
    width: null,
    height: null,
    cellRenderer: function (row, column, TD) {
      var cellData = that.getSetting('data', row, column);
      Handsontable.Dom.fastInnerText(TD, cellData === void 0 || cellData === null ? '' : cellData);
    },
    columnWidth: 50,
    rowHeight: function (row) {
      return 23;
    },
    defaultRowHeight: 23,
    selections: null,
    hideBorderOnMouseDownOver: false,

    //callbacks
    onCellMouseDown: null,
    onCellMouseOver: null,
//    onCellMouseOut: null,
    onCellDblClick: null,
    onCellCornerMouseDown: null,
    onCellCornerDblClick: null,
    beforeDraw: null,
    onDraw: null,
    onScrollVertically: null,
    onScrollHorizontally: null,

    //constants
    scrollbarWidth: 10,
    scrollbarHeight: 10,

    renderAllRows: false
  };

  //reference to settings
  this.settings = {};
  for (var i in this.defaults) {
    if (this.defaults.hasOwnProperty(i)) {
      if (settings[i] !== void 0) {
        this.settings[i] = settings[i];
      }
      else if (this.defaults[i] === void 0) {
        throw new Error('A required setting "' + i + '" was not provided');
      }
      else {
        this.settings[i] = this.defaults[i];
      }
    }
  }
}

/**
 * generic methods
 */

WalkontableSettings.prototype.update = function (settings, value) {
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
  return this.instance;
};

WalkontableSettings.prototype.getSetting = function (key, param1, param2, param3, param4) {
  if (typeof this.settings[key] === 'function') {
    return this.settings[key](param1, param2, param3, param4); //this is faster than .apply - https://github.com/handsontable/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
  }
  else if (param1 !== void 0 && Object.prototype.toString.call(this.settings[key]) === '[object Array]') { //perhaps this can be removed, it is only used in tests
    return this.settings[key][param1];
  }
  else {
    return this.settings[key];
  }
};

WalkontableSettings.prototype.has = function (key) {
  return !!this.settings[key]
};
function WalkontableTable(instance, table) {
  //reference to instance
  this.instance = instance;
  this.TABLE = table;
  Handsontable.Dom.removeTextNodes(this.TABLE);

  //wtSpreader
  var parent = this.TABLE.parentNode;
  if (!parent || parent.nodeType !== 1 || !Handsontable.Dom.hasClass(parent, 'wtHolder')) {
    var spreader = document.createElement('DIV');
    spreader.className = 'wtSpreader';
    if (parent) {
      parent.insertBefore(spreader, this.TABLE); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    spreader.appendChild(this.TABLE);
  }
  this.spreader = this.TABLE.parentNode;

  //wtHider
  parent = this.spreader.parentNode;
  if (!parent || parent.nodeType !== 1 || !Handsontable.Dom.hasClass(parent, 'wtHolder')) {
    var hider = document.createElement('DIV');
    hider.className = 'wtHider';
    if (parent) {
      parent.insertBefore(hider, this.spreader); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    hider.appendChild(this.spreader);
  }
  this.hider = this.spreader.parentNode;
  this.hiderStyle = this.hider.style;
  this.hiderStyle.position = 'relative';

  //wtHolder
  parent = this.hider.parentNode;
  if (!parent || parent.nodeType !== 1 || !Handsontable.Dom.hasClass(parent, 'wtHolder')) {
    var holder = document.createElement('DIV');
    holder.style.position = 'relative';
    holder.className = 'wtHolder';

    if(!instance.cloneSource) {
      holder.className += ' ht_master';
    }

    if (parent) {
      parent.insertBefore(holder, this.hider); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    holder.appendChild(this.hider);
  }
  this.holder = this.hider.parentNode;

  //bootstrap from settings
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
  this.COLGROUP = this.TABLE.getElementsByTagName('COLGROUP')[0];
  if (!this.COLGROUP) {
    this.COLGROUP = document.createElement('COLGROUP');
    this.TABLE.insertBefore(this.COLGROUP, this.THEAD);
  }

  if (this.instance.getSetting('columnHeaders').length) {
    if (!this.THEAD.childNodes.length) {
      var TR = document.createElement('TR');
      this.THEAD.appendChild(TR);
    }
  }

  this.colgroupChildrenLength = this.COLGROUP.childNodes.length;
  this.theadChildrenLength = this.THEAD.firstChild ? this.THEAD.firstChild.childNodes.length : 0;
  this.tbodyChildrenLength = this.TBODY.childNodes.length;

  this.oldCellCache = new WalkontableClassNameCache();
  this.currentCellCache = new WalkontableClassNameCache();

  this.rowFilter = null;
  this.columnFilter = null;

  this.columnWidthCache = [];
}

WalkontableTable.prototype.getRowStrategy = function () {
  return this.isWorkingOnClone() ? this.instance.cloneSource.wtTable.rowStrategy : this.rowStrategy;
};

WalkontableTable.prototype.getColumnStrategy = function () {
  return this.isWorkingOnClone() ? this.instance.cloneSource.wtTable.columnStrategy : this.columnStrategy;
};

WalkontableTable.prototype.isWorkingOnClone = function () {
  return !!this.instance.cloneSource;
};

WalkontableTable.prototype.refreshHiderDimensions = function () {
  var spreaderStyle = this.spreader.style;
  spreaderStyle.position = 'relative';
  spreaderStyle.width = 'auto';
  spreaderStyle.height = 'auto';
};

WalkontableTable.prototype.draw = function (selectionsOnly) {
  if (!selectionsOnly) {
    if (this.isWorkingOnClone()) {
      this.tableOffset = this.instance.cloneSource.wtTable.tableOffset;
    }
    else {
      this.holderOffset = Handsontable.Dom.offset(this.holder);
      this.tableOffset = Handsontable.Dom.offset(this.TABLE);
      this.instance.wtScrollbars.vertical.readSettings();
      this.instance.wtScrollbars.horizontal.readSettings();
      this.instance.wtViewport.resetSettings();
    }
    var offsetRow;
    if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay) {
      offsetRow = 0;
    }
    else {
      offsetRow = this.instance.wtSettings.settings.offsetRow;
    }
    this.rowFilter = new WalkontableRowFilter(
      offsetRow,
      this.instance.getSetting('totalRows'),
      this.instance.getSetting('fixedRowsTop'),
      this.instance.getSetting('columnHeaders').length
    );
    this.columnFilter = new WalkontableColumnFilter(
      this.instance.wtSettings.settings.offsetColumn,
      this.instance.getSetting('totalColumns'),
      this.instance.getSetting('fixedColumnsLeft'),
      this.instance.getSetting('rowHeaders').length
    );
    this._doDraw();
  }
  else {
    this.instance.wtScrollbars && this.instance.wtScrollbars.refresh(true);
  }

  this.refreshPositions(selectionsOnly);

  if (!selectionsOnly) {
    if (!this.isWorkingOnClone()) {
      this.instance.wtScrollbars.vertical.resetFixedPosition();
      this.instance.wtScrollbars.horizontal.resetFixedPosition();
      this.instance.wtScrollbars.corner.resetFixedPosition();
      this.instance.wtScrollbars.debug && this.instance.wtScrollbars.debug.resetFixedPosition();
    }
  }

  this.instance.drawn = true;
  return this;
};

WalkontableTable.prototype._doDraw = function () {
  var wtRenderer = new WalkontableTableRenderer(this);
  wtRenderer.render();
};

WalkontableTable.prototype.refreshPositions = function (selectionsOnly) {
  this.refreshHiderDimensions();
  this.refreshSelections(selectionsOnly);
};

WalkontableTable.prototype.refreshSelections = function (selectionsOnly) {
  var vr
    , r
    , vc
    , c
    , s
    , slen
    , classNames = []
    , visibleRows = this.getRowStrategy().countVisible()
    , renderedCells = this.getColumnStrategy().cellCount;

  this.oldCellCache = this.currentCellCache;
  this.currentCellCache = new WalkontableClassNameCache();

  if (this.instance.selections) {
    for (r in this.instance.selections) {
      if (this.instance.selections.hasOwnProperty(r)) {

        this.instance.selections[r].draw();

        if (this.instance.selections[r].settings.className) {
          classNames.push(this.instance.selections[r].settings.className);
        }
        if (this.instance.selections[r].settings.highlightRowClassName) {
          classNames.push(this.instance.selections[r].settings.highlightRowClassName);
        }
        if (this.instance.selections[r].settings.highlightColumnClassName) {
          classNames.push(this.instance.selections[r].settings.highlightColumnClassName);
        }
      }
    }
  }

  slen = classNames.length;

  for (vr = 0; vr < visibleRows; vr++) {
    for (vc = 0; vc < renderedCells; vc++) {
      r = this.rowFilter.visibleToSource(vr);
      c = this.columnFilter.visibleToSource(vc);
      for (s = 0; s < slen; s++) {
        var cell;
        if (this.currentCellCache.test(vr, vc, classNames[s])) {
          cell = this.getCell(new WalkontableCellCoords(r, c));
          if (typeof cell == 'object' ) Handsontable.Dom.addClass(cell, classNames[s]);
        }
        else if (selectionsOnly && this.oldCellCache.test(vr, vc, classNames[s])) {
          cell = this.getCell(new WalkontableCellCoords(r, c));
          if (typeof cell == 'object' ) Handsontable.Dom.removeClass(cell, classNames[s]);

        }
      }
    }
  }
};

/**
 * getCell
 * @param {WalkontableCellCoords} coords
 * @return {Object} HTMLElement on success or {Number} one of the exit codes on error:
 *  -1 row before viewport
 *  -2 row after viewport
 *
 */
WalkontableTable.prototype.getCell = function (coords) {
  if (this.isRowBeforeViewport(coords.row)) {
    return -1; //row before viewport
  }
  else if (this.isRowAfterViewport(coords.row)) {
    return -2; //row after viewport
  }

  var TR = this.TBODY.childNodes[this.rowFilter.sourceToVisible(coords.row)];

  if (TR) {
    return TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(coords.col)];
  }
};

/**
 * Returns cell coords object for a given TD
 * @param TD
 * @returns {WalkontableCellCoords}
 */
WalkontableTable.prototype.getCoords = function (TD) {
  var TR = TD.parentNode;
  var row = Handsontable.Dom.index(TR);
  if (TR.parentNode === this.THEAD) {
    row = this.rowFilter.visibleColHeadedColumnToSourceColumn(row);
  }
  else {
    row = this.rowFilter.visibleToSource(row);
  }

  return new WalkontableCellCoords(
    row,
    this.columnFilter.visibleRowHeadedColumnToSourceColumn(TD.cellIndex)
  );
};

//returns -1 if no row is visible
WalkontableTable.prototype.getFirstVisibleRow = function () {
  return this.rowFilter.visibleToSource(0 + this.rowFilter.fixedCount);
};

//returns -1 if no column is visible
WalkontableTable.prototype.getFirstVisibleColumn = function () {

  if (this.isWorkingOnClone()){
    if (this.instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative){
      return 0;
    } else {
      return this.instance.cloneSource.wtTable.getFirstVisibleColumn();
    }
  }

  var leftOffset = this.instance.wtScrollbars.horizontal.getScrollPosition();
  var columnCount = this.getColumnStrategy().cellCount;
  var firstTR = this.TBODY.firstChild;

  if (!firstTR){
    return 0;
  }

  for (var colIndex = 0; colIndex < columnCount; colIndex++){
    leftOffset -= firstTR.childNodes[colIndex].offsetWidth;

    if (leftOffset < 0){
      return colIndex;
    }

  }

  return -1;
};

//returns -1 if no row is visible
WalkontableTable.prototype.getLastVisibleRow = function () {
  var lastVisibleRow =  this.rowFilter.visibleToSource(this.getRowStrategy().countVisible() - 1);
  var instance = this.instance;

  if (instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative || instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
    var fixedRowsTop = this.instance.getSetting('fixedRowsTop');

    return Math.min(fixedRowsTop - 1, lastVisibleRow);
  } else {
    return lastVisibleRow;
  }

};

//returns -1 if no column is visible
WalkontableTable.prototype.getLastVisibleColumn = function () {
  var instance = this.instance;

  if (this.isWorkingOnClone()){

    if (instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative || instance.cloneOverlay instanceof WalkontableCornerScrollbarNative){
      var lastVisibleColumn = this.getColumnStrategy().countVisible() - 1;
      var fixedColumnsLeft =  instance.getSetting('fixedColumnsLeft');
      return Math.min(fixedColumnsLeft - 1, lastVisibleColumn);
    } else {
      return this.instance.cloneSource.wtTable.getLastVisibleColumn();
    }

  }


  var leftOffset = this.instance.wtScrollbars.horizontal.getScrollPosition();
  var leftPartOfTable = leftOffset + this.instance.wtViewport.getWorkspaceWidth(Infinity);
  var columnCount = this.getColumnStrategy().cellCount;
  var rowHeaderCount = this.instance.getSetting('rowHeaders').length || 0;
  var firstTR = this.TBODY.firstChild;

  if (!columnCount) {
    return -1;
  }

  for (var colIndex = 0; colIndex < columnCount + rowHeaderCount; colIndex++){
    leftPartOfTable -= firstTR.childNodes[colIndex].offsetWidth;

    if (leftPartOfTable <= 0){
      return colIndex - rowHeaderCount;
    }

  }

  return colIndex - rowHeaderCount - 1;
};

WalkontableTable.prototype.isRowBeforeViewport = function (r) {
  return (this.rowFilter.sourceToVisible(r) < this.rowFilter.fixedCount && r >= this.rowFilter.fixedCount);
};

WalkontableTable.prototype.isRowAfterViewport = function (r) {
  return (r > this.getLastVisibleRow());
};

WalkontableTable.prototype.isColumnBeforeViewport = function (c) {
  return (this.columnFilter.sourceToVisible(c) < this.columnFilter.fixedCount && c >= this.columnFilter.fixedCount);
};

WalkontableTable.prototype.isColumnAfterViewport = function (c) {
  return (c > this.getLastVisibleColumn());
};

WalkontableTable.prototype.isRowInViewport = function (r) {
  return (!this.isRowBeforeViewport(r) && !this.isRowAfterViewport(r));
};

WalkontableTable.prototype.isColumnInViewport = function (c) {
  return (!this.isColumnBeforeViewport(c) && !this.isColumnAfterViewport(c));
};

WalkontableTable.prototype.isLastRowFullyVisible = function () {
  return (this.getLastVisibleRow() === this.instance.getSetting('totalRows') - 1 && !this.getRowStrategy().isLastIncomplete());
};

WalkontableTable.prototype.isLastColumnFullyVisible = function () {
  return (this.getLastVisibleColumn() === this.instance.getSetting('totalColumns') - 1 && !this.getColumnStrategy().isLastIncomplete());
};

WalkontableTable.prototype.getVisibleRowsCount = function () {
  return this.getRowStrategy().countVisible();
};

WalkontableTable.prototype.allRowsInViewport = function () {
  return this.getRowStrategy().cellCount == this.getVisibleRowsCount();
};

function WalkontableTableRenderer(wtTable){
  this.wtTable = wtTable;
  this.instance = wtTable.instance;
  this.rowFilter = wtTable.rowFilter;
  this.columnFilter = wtTable.columnFilter;

  this.TABLE = wtTable.TABLE;
  this.THEAD = wtTable.THEAD;
  this.TBODY = wtTable.TBODY;
  this.COLGROUP = wtTable.COLGROUP;

  this.utils = WalkontableTableRenderer.utils;

}

  WalkontableTableRenderer.prototype.render = function () {
    if (!this.wtTable.isWorkingOnClone()) {
      this.instance.getSetting('beforeDraw', true);
    }

    this.rowHeaders = this.instance.getSetting('rowHeaders');
    this.rowHeaderCount = this.rowHeaders.length;
    this.fixedRowsTop = this.instance.getSetting('fixedRowsTop');
    this.columnHeaders = this.instance.getSetting('columnHeaders');

  var visibleColIndex
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , displayTds
    , TR
    , TD
    , TH
    , adjusted = false
    , workspaceWidth
    , res;

  if (totalColumns > 0) {
    var cloneLimit;
    if (this.wtTable.isWorkingOnClone()) { //must be run after adjustAvailableNodes because otherwise this.rowStrategy is not yet defined
      if (this.instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
        cloneLimit = this.fixedRowsTop;
      }
      else if (this.instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative) {
        cloneLimit = this.wtTable.getRowStrategy().cellCount;
      }
      //else if WalkontableDebugOverlay do nothing. No cloneLimit means render ALL rows
    }

    this.adjustAvailableNodes();
    adjusted = true;

    this.renderColGroups();

    this.renderColumnHeaders();

    displayTds = this.getColumnCount();

    //Render table rows
    this.renderRows(totalRows, cloneLimit, displayTds);

    if (!this.wtTable.isWorkingOnClone()) {
      workspaceWidth = this.instance.wtViewport.getWorkspaceWidth();
      this.wtTable.getColumnStrategy().stretch();
    }

    this.adjustColumnWidths(displayTds);
  }

  if (!adjusted) {
    this.adjustAvailableNodes();
  }

  if (!(this.instance.cloneOverlay instanceof WalkontableDebugOverlay)) {
    this.removeRedundantRows();
  }



  if (!this.wtTable.isWorkingOnClone()) {

    this.instance.wtScrollbars.refresh(false);

    if (workspaceWidth !== this.instance.wtViewport.getWorkspaceWidth()) {
      //workspace width changed though to shown/hidden vertical scrollbar. Let's reapply stretching
      this.wtTable.getColumnStrategy().stretch();
      for (visibleColIndex = 0; visibleColIndex < this.wtTable.getColumnStrategy().cellCount; visibleColIndex++) {
        this.COLGROUP.childNodes[visibleColIndex + this.rowHeaderCount].style.width = this.wtTable.getColumnStrategy().getSize(visibleColIndex) + 'px';
      }
    }
    this.instance.getSetting('onDraw', true);
  }

};

WalkontableTableRenderer.prototype.removeRedundantRows = function () {
  var renderedRowIndex = this.wtTable.getRowStrategy().countRendered();
  while (this.wtTable.tbodyChildrenLength > renderedRowIndex) {
    this.TBODY.removeChild(this.TBODY.lastChild);
    this.wtTable.tbodyChildrenLength--;
  }
};

WalkontableTableRenderer.prototype.renderRows = function (totalRows, cloneLimit, displayTds) {
  var lastTD, TR, res;
  var offsetRow = this.instance.getSetting('offsetRow');
  var visibleRowIndex = 0;
  var sourceRowIndex = this.rowFilter.visibleToSource(visibleRowIndex);
  var isWorkingOnClone = this.wtTable.isWorkingOnClone();

  while (sourceRowIndex < totalRows && sourceRowIndex >= 0) {
    if (visibleRowIndex > 1000) {
      throw new Error('Security brake: Too much TRs. Please define height for your table, which will enforce scrollbars.');
    }

    if (cloneLimit !== void 0 && visibleRowIndex === cloneLimit) {
      break; //we have as much rows as needed for this clone
    }

    TR = this.getTrForRow(visibleRowIndex, TR);

    //Render row headers
    this.renderRowHeaders(sourceRowIndex, TR);

    this.adjustColumns(TR, displayTds + this.rowHeaderCount);

    lastTD = this.renderCells(sourceRowIndex, TR, displayTds);

    offsetRow = this.instance.getSetting('offsetRow'); //refresh the value

    //after last column is rendered, check if last cell is fully displayed
    if (!isWorkingOnClone) {
      res = this.wtTable.getRowStrategy().add(visibleRowIndex, lastTD);

      if (res === false) {
        break;
      }

      if (visibleRowIndex == 0) { //rendering the first row may caused bottom scrollbar to appear, so we need to refresh the window size
        this.instance.wtScrollbars.vertical.readWindowSize();
      }
    }

    if (TR.firstChild) {
      var height = this.instance.getSetting('rowHeight', sourceRowIndex); //if I have 2 fixed columns with one-line content and the 3rd column has a multiline content, this is the way to make sure that the overlay will has same row height
      if(height) {
        TR.firstChild.style.height = height + 'px';
      }
      else {
        TR.firstChild.style.height = '';
      }
    }

    visibleRowIndex++;

    sourceRowIndex = this.rowFilter.visibleToSource(visibleRowIndex);
  }
};


WalkontableTableRenderer.prototype.renderCells = function (sourceRowIndex, TR, displayTds) {
  var TD, sourceColIndex;
  for (var visibleColIndex = 0; visibleColIndex < displayTds; visibleColIndex++) {
    sourceColIndex = this.columnFilter.visibleToSource(visibleColIndex);
    if (visibleColIndex === 0) {
      TD = TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(sourceColIndex)];
    }
    else {
      TD = TD.nextSibling; //http://jsperf.com/nextsibling-vs-indexed-childnodes
    }

    //If the number of headers has been reduced, we need to replace excess TH with TD
    if (TD.nodeName == 'TH') {
      TD = this.utils.replaceThWithTd(TD, TR);
    }

    TD.className = '';
    TD.removeAttribute('style');
    this.instance.getSetting('cellRenderer', sourceRowIndex, sourceColIndex, TD);

  }

  return TD;
};

WalkontableTableRenderer.prototype.adjustColumnWidths = function (displayTds) {
  var cache = this.instance.wtTable.columnWidthCache;
  var cacheChanged = false;
  var width;
  for (var visibleColIndex = 0; visibleColIndex < displayTds; visibleColIndex++) {
    if(this.wtTable.isWorkingOnClone()) {
      width = this.instance.cloneSource.wtTable.columnWidthCache[visibleColIndex];
    }
    else {
      width = this.wtTable.getColumnStrategy().getSize(visibleColIndex);
    }
    if (width !== cache[visibleColIndex]) {
      this.COLGROUP.childNodes[visibleColIndex + this.rowHeaderCount].style.width = width + 'px';
      cache[visibleColIndex] = width;
      cacheChanged = true;
    }
  }
};

WalkontableTableRenderer.prototype.appendToTbody = function (TR) {
  this.TBODY.appendChild(TR);
  this.wtTable.tbodyChildrenLength++;
};

WalkontableTableRenderer.prototype.getTrForRow = function (rowIndex, currentTr) {
  var TR;

  if (rowIndex >= this.wtTable.tbodyChildrenLength) {
    TR = this.createRow();
    this.appendToTbody(TR);
  } else if (rowIndex === 0) {
    TR = this.TBODY.firstChild;
  } else {
    TR = currentTr.nextSibling; //http://jsperf.com/nextsibling-vs-indexed-childnodes
  }

  return TR;
};

WalkontableTableRenderer.prototype.createRow = function() {
  var TR = document.createElement('TR');
  for (var visibleColIndex = 0; visibleColIndex < this.rowHeaderCount; visibleColIndex++) {
    TR.appendChild(document.createElement('TH'));
  }

  return TR;
};

WalkontableTableRenderer.prototype.renderRowHeader = function(row, col, TH){
  this.rowHeaders[col](row, TH);
};

WalkontableTableRenderer.prototype.renderRowHeaders = function(row, TR){
  for (var TH = TR.firstChild, visibleColIndex = 0; visibleColIndex < this.rowHeaderCount; visibleColIndex++) {

    //If the number of row headers increased we need to create TH or replace an existing TD node with TH
    if (!TH){
      TH = document.createElement('TH');
      TR.appendChild(TH);
    } else if (TH.nodeName == 'TD') {
      TH = this.utils.replaceTdWithTh(TH, TR);
    }

    this.renderRowHeader(row, visibleColIndex, TH);
    TH = TH.nextSibling; //http://jsperf.com/nextsibling-vs-indexed-childnodes
  }
};

WalkontableTableRenderer.prototype.adjustAvailableNodes = function () {

  this.refreshStretching(); //actually it is wrong position because it assumes rowHeader would be always 50px wide (because we measure before it is filled with text). TODO: debug

  //adjust COLGROUP
  this.adjustColGroups();

  //adjust THEAD
  this.adjustThead();

};

WalkontableTableRenderer.prototype.renderColumnHeaders = function () {
  if (!this.columnHeaders.length) {
    return;
  }

  var columnCount = this.getColumnCount();

  var TR = this.getTrForColumnHeaders();

  for (var columnIndex = 0; columnIndex < columnCount; columnIndex++) {
    if (this.columnHeaders.length) {
     this.renderColumnHeader( this.columnFilter.visibleToSource(columnIndex), TR.childNodes[this.rowHeaderCount + columnIndex]);
    }
  }
};

WalkontableTableRenderer.prototype.adjustColGroups = function () {
  var columnCount = this.getColumnCount();

  //adjust COLGROUP
  while (this.wtTable.colgroupChildrenLength < columnCount + this.rowHeaderCount) {
    this.COLGROUP.appendChild(document.createElement('COL'));
    this.wtTable.colgroupChildrenLength++;
  }
  while (this.wtTable.colgroupChildrenLength > columnCount + this.rowHeaderCount) {
    this.COLGROUP.removeChild(this.COLGROUP.lastChild);
    this.wtTable.colgroupChildrenLength--;
  }
};

WalkontableTableRenderer.prototype.adjustThead = function () {
  var columnCount = this.getColumnCount();
  var TR = this.THEAD.firstChild;
  if (this.columnHeaders.length) {
    if (!TR) {
      TR = document.createElement('TR');
      this.THEAD.appendChild(TR);
    }

    this.theadChildrenLength = TR.childNodes.length;
    while (this.theadChildrenLength < columnCount + this.rowHeaderCount) {
      TR.appendChild(document.createElement('TH'));
      this.theadChildrenLength++;
    }
    while (this.theadChildrenLength > columnCount + this.rowHeaderCount) {
      TR.removeChild(TR.lastChild);
      this.theadChildrenLength--;
    }
  }
  else if (TR) {
    Handsontable.Dom.empty(TR);
  }
};

WalkontableTableRenderer.prototype.getTrForColumnHeaders = function () {
  var TR = this.THEAD.firstChild;
  if (this.rowHeaderCount) {
    this.renderRowHeaders(-1, TR);
  }

  return TR;
};

WalkontableTableRenderer.prototype.renderColumnHeader = function (col, TR) {
  return this.columnHeaders[0](col, TR);
};

WalkontableTableRenderer.prototype.getColumnCount = function () {
  if (this.wtTable.isWorkingOnClone() && (this.instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative)) {
    return this.instance.getSetting('fixedColumnsLeft');
  }
  else {
    return this.wtTable.getColumnStrategy().cellCount;
  }
};

WalkontableTableRenderer.prototype.renderColGroups = function () {
  for (var colIndex = 0; colIndex < this.wtTable.colgroupChildrenLength; colIndex++) {
    if (colIndex < this.rowHeaderCount) {
      Handsontable.Dom.addClass(this.COLGROUP.childNodes[colIndex], 'rowHeader');
    }
    else {
      Handsontable.Dom.removeClass(this.COLGROUP.childNodes[colIndex], 'rowHeader');
    }
  }
};

WalkontableTableRenderer.prototype.adjustColumns = function (TR, desiredCount) {
  var count = TR.childNodes.length;
  while (count < desiredCount) {
    var TD = document.createElement('TD');
    TR.appendChild(TD);
    count++;
  }
  while (count > desiredCount) {
    TR.removeChild(TR.lastChild);
    count--;
  }
};

WalkontableTableRenderer.prototype.refreshStretching = function () {
  if (this.wtTable.isWorkingOnClone()) {
    return;
  }

  var instance = this.instance
    , stretchH = instance.getSetting('stretchH')
    , totalRows = instance.getSetting('totalRows')
    , totalColumns = instance.getSetting('totalColumns')
    , offsetColumn = instance.getSetting('offsetColumn');

  var containerWidthFn = function (cacheWidth) {
    var viewportWidth = that.instance.wtViewport.getViewportWidth(cacheWidth);
    return viewportWidth;
  };

  var that = this;

  var columnWidthFn = function (i) {
    var source_c = that.columnFilter.visibleToSource(i);
    if (source_c < totalColumns) {
      return instance.getSetting('columnWidth', source_c);
    }
  };

  var containerHeightFn = function (cacheHeight) {
    if (that.instance.cloneOverlay instanceof WalkontableDebugOverlay || instance.wtSettings.settings.renderAllRows) {
      return Infinity;
    }
    else {
      return that.instance.wtViewport.getViewportHeight(cacheHeight);
    }
  };

  var rowHeightFn = function (i, TD) {
    return instance.wtSettings.settings.defaultRowHeight;
  };

  this.wtTable.columnStrategy = new WalkontableColumnStrategy(instance, containerWidthFn, columnWidthFn, stretchH);
  this.wtTable.rowStrategy = new WalkontableRowStrategy(instance, containerHeightFn, rowHeightFn);
};

/*
  Helper functions, which does not have any side effects
 */
WalkontableTableRenderer.utils = {};

WalkontableTableRenderer.utils.replaceTdWithTh = function(TD, TR) {
  var TH;
  TH = document.createElement('TH');
  TR.insertBefore(TH, TD);
  TR.removeChild(TD);

  return TH;
};

WalkontableTableRenderer.utils.replaceThWithTd = function(TH, TR) {
  var TD = document.createElement('TD');
  TR.insertBefore(TD, TH);
  TR.removeChild(TH);

  return TD;
};



function WalkontableViewport(instance) {
  this.instance = instance;
  this.resetSettings();

  var that = this;
  $(window).on('resize.walkontable.' + this.instance.guid, function () {
    that.clientHeight = that.getWorkspaceHeight();
  });
}

//used by scrollbar
WalkontableViewport.prototype.getWorkspaceHeight = function (proposedHeight) {
  return this.instance.wtScrollbars.vertical.windowSize;
};

WalkontableViewport.prototype.getWorkspaceWidth = function (proposedWidth) {
  if (this.instance.wtScrollbars.horizontal.scrollHandler === window){
    return Math.min(document.documentElement.offsetWidth - this.getWorkspaceOffset().left, document.documentElement.offsetWidth);
  }

  return this.instance.wtScrollbars.horizontal.windowSize;

};

WalkontableViewport.prototype.getWorkspaceOffset = function () {
  return Handsontable.Dom.offset(this.instance.wtTable.TABLE);
};

WalkontableViewport.prototype.getWorkspaceActualHeight = function () {
  return Handsontable.Dom.outerHeight(this.instance.wtTable.TABLE);
};

WalkontableViewport.prototype.getWorkspaceActualWidth = function () {
  return Handsontable.Dom.outerWidth(this.instance.wtTable.TABLE) || Handsontable.Dom.outerWidth(this.instance.wtTable.TBODY) || Handsontable.Dom.outerWidth(this.instance.wtTable.THEAD); //IE8 reports 0 as <table> offsetWidth;
};

WalkontableViewport.prototype.getColumnHeaderHeight = function () {
  if (isNaN(this.columnHeaderHeight)) {
    var cellOffset = Handsontable.Dom.offset(this.instance.wtTable.TBODY)
      , tableOffset = this.instance.wtTable.tableOffset;
    this.columnHeaderHeight = cellOffset.top - tableOffset.top;
  }
  return this.columnHeaderHeight;
};

WalkontableViewport.prototype.getViewportHeight = function (proposedHeight) {
  var containerHeight = this.getWorkspaceHeight(proposedHeight);

  if (containerHeight === Infinity) {
    return containerHeight;
  }

  var columnHeaderHeight = this.getColumnHeaderHeight();
  if (columnHeaderHeight > 0) {
    containerHeight -= columnHeaderHeight;
  }

  return containerHeight;

};

WalkontableViewport.prototype.getRowHeaderWidth = function () {
  if (this.instance.cloneSource) {
    return this.instance.cloneSource.wtViewport.getRowHeaderWidth();
  }
  if (isNaN(this.rowHeaderWidth)) {
    var rowHeaders = this.instance.getSetting('rowHeaders');
    if (rowHeaders.length) {
      var TH = this.instance.wtTable.TABLE.querySelector('TH');
      this.rowHeaderWidth = 0;
      for (var i = 0, ilen = rowHeaders.length; i < ilen; i++) {
        if (TH) {
          this.rowHeaderWidth += Handsontable.Dom.outerWidth(TH);
          TH = TH.nextSibling;
        }
        else {
          this.rowHeaderWidth += 50; //yes this is a cheat but it worked like that before, just taking assumption from CSS instead of measuring. TODO: proper fix
        }
      }
    }
    else {
      this.rowHeaderWidth = 0;
    }
  }
  return this.rowHeaderWidth;
};

WalkontableViewport.prototype.getViewportWidth = function (proposedWidth) {
  var containerWidth = this.getWorkspaceWidth(proposedWidth);

  if (containerWidth === Infinity) {
    return containerWidth;
  }

  var rowHeaderWidth = this.getRowHeaderWidth();
  if (rowHeaderWidth > 0) {
    return containerWidth - rowHeaderWidth;
  }
  else {
    return containerWidth;
  }
};

WalkontableViewport.prototype.resetSettings = function () {
  this.rowHeaderWidth = NaN;
  this.columnHeaderHeight = NaN;
};
})(jQuery, window, Handsontable);
/*!
 * numeral.js
 * version : 1.5.3
 * author : Adam Draper
 * license : MIT
 * http://adamwdraper.github.com/Numeral-js/
 */

(function () {

    /************************************
        Constants
    ************************************/

    var numeral,
        VERSION = '1.5.3',
        // internal storage for language config files
        languages = {},
        currentLanguage = 'en',
        zeroFormat = null,
        defaultFormat = '0,0',
        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports);


    /************************************
        Constructors
    ************************************/


    // Numeral prototype object
    function Numeral (number) {
        this._value = number;
    }

    /**
     * Implementation of toFixed() that treats floats more like decimals
     *
     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
     * problems for accounting- and finance-related software.
     */
    function toFixed (value, precision, roundingFunction, optionals) {
        var power = Math.pow(10, precision),
            optionalsRegExp,
            output;
            
        //roundingFunction = (roundingFunction !== undefined ? roundingFunction : Math.round);
        // Multiply up by precision, round accurately, then divide and use native toFixed():
        output = (roundingFunction(value * power) / power).toFixed(precision);

        if (optionals) {
            optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
            output = output.replace(optionalsRegExp, '');
        }

        return output;
    }

    /************************************
        Formatting
    ************************************/

    // determine what type of formatting we need to do
    function formatNumeral (n, format, roundingFunction) {
        var output;

        // figure out what kind of format we are dealing with
        if (format.indexOf('$') > -1) { // currency!!!!!
            output = formatCurrency(n, format, roundingFunction);
        } else if (format.indexOf('%') > -1) { // percentage
            output = formatPercentage(n, format, roundingFunction);
        } else if (format.indexOf(':') > -1) { // time
            output = formatTime(n, format);
        } else { // plain ol' numbers or bytes
            output = formatNumber(n._value, format, roundingFunction);
        }

        // return string
        return output;
    }

    // revert to number
    function unformatNumeral (n, string) {
        var stringOriginal = string,
            thousandRegExp,
            millionRegExp,
            billionRegExp,
            trillionRegExp,
            suffixes = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            bytesMultiplier = false,
            power;

        if (string.indexOf(':') > -1) {
            n._value = unformatTime(string);
        } else {
            if (string === zeroFormat) {
                n._value = 0;
            } else {
                if (languages[currentLanguage].delimiters.decimal !== '.') {
                    string = string.replace(/\./g,'').replace(languages[currentLanguage].delimiters.decimal, '.');
                }

                // see if abbreviations are there so that we can multiply to the correct number
                thousandRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.thousand + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
                millionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.million + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
                billionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.billion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
                trillionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.trillion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');

                // see if bytes are there so that we can multiply to the correct number
                for (power = 0; power <= suffixes.length; power++) {
                    bytesMultiplier = (string.indexOf(suffixes[power]) > -1) ? Math.pow(1024, power + 1) : false;

                    if (bytesMultiplier) {
                        break;
                    }
                }

                // do some math to create our number
                n._value = ((bytesMultiplier) ? bytesMultiplier : 1) * ((stringOriginal.match(thousandRegExp)) ? Math.pow(10, 3) : 1) * ((stringOriginal.match(millionRegExp)) ? Math.pow(10, 6) : 1) * ((stringOriginal.match(billionRegExp)) ? Math.pow(10, 9) : 1) * ((stringOriginal.match(trillionRegExp)) ? Math.pow(10, 12) : 1) * ((string.indexOf('%') > -1) ? 0.01 : 1) * (((string.split('-').length + Math.min(string.split('(').length-1, string.split(')').length-1)) % 2)? 1: -1) * Number(string.replace(/[^0-9\.]+/g, ''));

                // round if we are talking about bytes
                n._value = (bytesMultiplier) ? Math.ceil(n._value) : n._value;
            }
        }
        return n._value;
    }

    function formatCurrency (n, format, roundingFunction) {
        var symbolIndex = format.indexOf('$'),
            openParenIndex = format.indexOf('('),
            minusSignIndex = format.indexOf('-'),
            space = '',
            spliceIndex,
            output;

        // check for space before or after currency
        if (format.indexOf(' $') > -1) {
            space = ' ';
            format = format.replace(' $', '');
        } else if (format.indexOf('$ ') > -1) {
            space = ' ';
            format = format.replace('$ ', '');
        } else {
            format = format.replace('$', '');
        }

        // format the number
        output = formatNumber(n._value, format, roundingFunction);

        // position the symbol
        if (symbolIndex <= 1) {
            if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
                output = output.split('');
                spliceIndex = 1;
                if (symbolIndex < openParenIndex || symbolIndex < minusSignIndex){
                    // the symbol appears before the "(" or "-"
                    spliceIndex = 0;
                }
                output.splice(spliceIndex, 0, languages[currentLanguage].currency.symbol + space);
                output = output.join('');
            } else {
                output = languages[currentLanguage].currency.symbol + space + output;
            }
        } else {
            if (output.indexOf(')') > -1) {
                output = output.split('');
                output.splice(-1, 0, space + languages[currentLanguage].currency.symbol);
                output = output.join('');
            } else {
                output = output + space + languages[currentLanguage].currency.symbol;
            }
        }

        return output;
    }

    function formatPercentage (n, format, roundingFunction) {
        var space = '',
            output,
            value = n._value * 100;

        // check for space before %
        if (format.indexOf(' %') > -1) {
            space = ' ';
            format = format.replace(' %', '');
        } else {
            format = format.replace('%', '');
        }

        output = formatNumber(value, format, roundingFunction);
        
        if (output.indexOf(')') > -1 ) {
            output = output.split('');
            output.splice(-1, 0, space + '%');
            output = output.join('');
        } else {
            output = output + space + '%';
        }

        return output;
    }

    function formatTime (n) {
        var hours = Math.floor(n._value/60/60),
            minutes = Math.floor((n._value - (hours * 60 * 60))/60),
            seconds = Math.round(n._value - (hours * 60 * 60) - (minutes * 60));
        return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
    }

    function unformatTime (string) {
        var timeArray = string.split(':'),
            seconds = 0;
        // turn hours and minutes into seconds and add them all up
        if (timeArray.length === 3) {
            // hours
            seconds = seconds + (Number(timeArray[0]) * 60 * 60);
            // minutes
            seconds = seconds + (Number(timeArray[1]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[2]);
        } else if (timeArray.length === 2) {
            // minutes
            seconds = seconds + (Number(timeArray[0]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[1]);
        }
        return Number(seconds);
    }

    function formatNumber (value, format, roundingFunction) {
        var negP = false,
            signed = false,
            optDec = false,
            abbr = '',
            abbrK = false, // force abbreviation to thousands
            abbrM = false, // force abbreviation to millions
            abbrB = false, // force abbreviation to billions
            abbrT = false, // force abbreviation to trillions
            abbrForce = false, // force abbreviation
            bytes = '',
            ord = '',
            abs = Math.abs(value),
            suffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            min,
            max,
            power,
            w,
            precision,
            thousands,
            d = '',
            neg = false;

        // check if number is zero and a custom zero format has been set
        if (value === 0 && zeroFormat !== null) {
            return zeroFormat;
        } else {
            // see if we should use parentheses for negative number or if we should prefix with a sign
            // if both are present we default to parentheses
            if (format.indexOf('(') > -1) {
                negP = true;
                format = format.slice(1, -1);
            } else if (format.indexOf('+') > -1) {
                signed = true;
                format = format.replace(/\+/g, '');
            }

            // see if abbreviation is wanted
            if (format.indexOf('a') > -1) {
                // check if abbreviation is specified
                abbrK = format.indexOf('aK') >= 0;
                abbrM = format.indexOf('aM') >= 0;
                abbrB = format.indexOf('aB') >= 0;
                abbrT = format.indexOf('aT') >= 0;
                abbrForce = abbrK || abbrM || abbrB || abbrT;

                // check for space before abbreviation
                if (format.indexOf(' a') > -1) {
                    abbr = ' ';
                    format = format.replace(' a', '');
                } else {
                    format = format.replace('a', '');
                }

                if (abs >= Math.pow(10, 12) && !abbrForce || abbrT) {
                    // trillion
                    abbr = abbr + languages[currentLanguage].abbreviations.trillion;
                    value = value / Math.pow(10, 12);
                } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9) && !abbrForce || abbrB) {
                    // billion
                    abbr = abbr + languages[currentLanguage].abbreviations.billion;
                    value = value / Math.pow(10, 9);
                } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6) && !abbrForce || abbrM) {
                    // million
                    abbr = abbr + languages[currentLanguage].abbreviations.million;
                    value = value / Math.pow(10, 6);
                } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3) && !abbrForce || abbrK) {
                    // thousand
                    abbr = abbr + languages[currentLanguage].abbreviations.thousand;
                    value = value / Math.pow(10, 3);
                }
            }

            // see if we are formatting bytes
            if (format.indexOf('b') > -1) {
                // check for space before
                if (format.indexOf(' b') > -1) {
                    bytes = ' ';
                    format = format.replace(' b', '');
                } else {
                    format = format.replace('b', '');
                }

                for (power = 0; power <= suffixes.length; power++) {
                    min = Math.pow(1024, power);
                    max = Math.pow(1024, power+1);

                    if (value >= min && value < max) {
                        bytes = bytes + suffixes[power];
                        if (min > 0) {
                            value = value / min;
                        }
                        break;
                    }
                }
            }

            // see if ordinal is wanted
            if (format.indexOf('o') > -1) {
                // check for space before
                if (format.indexOf(' o') > -1) {
                    ord = ' ';
                    format = format.replace(' o', '');
                } else {
                    format = format.replace('o', '');
                }

                ord = ord + languages[currentLanguage].ordinal(value);
            }

            if (format.indexOf('[.]') > -1) {
                optDec = true;
                format = format.replace('[.]', '.');
            }

            w = value.toString().split('.')[0];
            precision = format.split('.')[1];
            thousands = format.indexOf(',');

            if (precision) {
                if (precision.indexOf('[') > -1) {
                    precision = precision.replace(']', '');
                    precision = precision.split('[');
                    d = toFixed(value, (precision[0].length + precision[1].length), roundingFunction, precision[1].length);
                } else {
                    d = toFixed(value, precision.length, roundingFunction);
                }

                w = d.split('.')[0];

                if (d.split('.')[1].length) {
                    d = languages[currentLanguage].delimiters.decimal + d.split('.')[1];
                } else {
                    d = '';
                }

                if (optDec && Number(d.slice(1)) === 0) {
                    d = '';
                }
            } else {
                w = toFixed(value, null, roundingFunction);
            }

            // format number
            if (w.indexOf('-') > -1) {
                w = w.slice(1);
                neg = true;
            }

            if (thousands > -1) {
                w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + languages[currentLanguage].delimiters.thousands);
            }

            if (format.indexOf('.') === 0) {
                w = '';
            }

            return ((negP && neg) ? '(' : '') + ((!negP && neg) ? '-' : '') + ((!neg && signed) ? '+' : '') + w + d + ((ord) ? ord : '') + ((abbr) ? abbr : '') + ((bytes) ? bytes : '') + ((negP && neg) ? ')' : '');
        }
    }

    /************************************
        Top Level Functions
    ************************************/

    numeral = function (input) {
        if (numeral.isNumeral(input)) {
            input = input.value();
        } else if (input === 0 || typeof input === 'undefined') {
            input = 0;
        } else if (!Number(input)) {
            input = numeral.fn.unformat(input);
        }

        return new Numeral(Number(input));
    };

    // version number
    numeral.version = VERSION;

    // compare numeral object
    numeral.isNumeral = function (obj) {
        return obj instanceof Numeral;
    };

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    numeral.language = function (key, values) {
        if (!key) {
            return currentLanguage;
        }

        if (key && !values) {
            if(!languages[key]) {
                throw new Error('Unknown language : ' + key);
            }
            currentLanguage = key;
        }

        if (values || !languages[key]) {
            loadLanguage(key, values);
        }

        return numeral;
    };
    
    // This function provides access to the loaded language data.  If
    // no arguments are passed in, it will simply return the current
    // global language object.
    numeral.languageData = function (key) {
        if (!key) {
            return languages[currentLanguage];
        }
        
        if (!languages[key]) {
            throw new Error('Unknown language : ' + key);
        }
        
        return languages[key];
    };

    numeral.language('en', {
        delimiters: {
            thousands: ',',
            decimal: '.'
        },
        abbreviations: {
            thousand: 'k',
            million: 'm',
            billion: 'b',
            trillion: 't'
        },
        ordinal: function (number) {
            var b = number % 10;
            return (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        },
        currency: {
            symbol: '$'
        }
    });

    numeral.zeroFormat = function (format) {
        zeroFormat = typeof(format) === 'string' ? format : null;
    };

    numeral.defaultFormat = function (format) {
        defaultFormat = typeof(format) === 'string' ? format : '0.0';
    };

    /************************************
        Helpers
    ************************************/

    function loadLanguage(key, values) {
        languages[key] = values;
    }

    /************************************
        Floating-point helpers
    ************************************/

    // The floating-point helper functions and implementation
    // borrows heavily from sinful.js: http://guipn.github.io/sinful.js/

    /**
     * Array.prototype.reduce for browsers that don't support it
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce#Compatibility
     */
    if ('function' !== typeof Array.prototype.reduce) {
        Array.prototype.reduce = function (callback, opt_initialValue) {
            'use strict';
            
            if (null === this || 'undefined' === typeof this) {
                // At the moment all modern browsers, that support strict mode, have
                // native implementation of Array.prototype.reduce. For instance, IE8
                // does not support strict mode, so this check is actually useless.
                throw new TypeError('Array.prototype.reduce called on null or undefined');
            }
            
            if ('function' !== typeof callback) {
                throw new TypeError(callback + ' is not a function');
            }

            var index,
                value,
                length = this.length >>> 0,
                isValueSet = false;

            if (1 < arguments.length) {
                value = opt_initialValue;
                isValueSet = true;
            }

            for (index = 0; length > index; ++index) {
                if (this.hasOwnProperty(index)) {
                    if (isValueSet) {
                        value = callback(value, this[index], index, this);
                    } else {
                        value = this[index];
                        isValueSet = true;
                    }
                }
            }

            if (!isValueSet) {
                throw new TypeError('Reduce of empty array with no initial value');
            }

            return value;
        };
    }

    
    /**
     * Computes the multiplier necessary to make x >= 1,
     * effectively eliminating miscalculations caused by
     * finite precision.
     */
    function multiplier(x) {
        var parts = x.toString().split('.');
        if (parts.length < 2) {
            return 1;
        }
        return Math.pow(10, parts[1].length);
    }

    /**
     * Given a variable number of arguments, returns the maximum
     * multiplier that must be used to normalize an operation involving
     * all of them.
     */
    function correctionFactor() {
        var args = Array.prototype.slice.call(arguments);
        return args.reduce(function (prev, next) {
            var mp = multiplier(prev),
                mn = multiplier(next);
        return mp > mn ? mp : mn;
        }, -Infinity);
    }        


    /************************************
        Numeral Prototype
    ************************************/


    numeral.fn = Numeral.prototype = {

        clone : function () {
            return numeral(this);
        },

        format : function (inputString, roundingFunction) {
            return formatNumeral(this, 
                  inputString ? inputString : defaultFormat, 
                  (roundingFunction !== undefined) ? roundingFunction : Math.round
              );
        },

        unformat : function (inputString) {
            if (Object.prototype.toString.call(inputString) === '[object Number]') { 
                return inputString; 
            }
            return unformatNumeral(this, inputString ? inputString : defaultFormat);
        },

        value : function () {
            return this._value;
        },

        valueOf : function () {
            return this._value;
        },

        set : function (value) {
            this._value = Number(value);
            return this;
        },

        add : function (value) {
            var corrFactor = correctionFactor.call(null, this._value, value);
            function cback(accum, curr, currI, O) {
                return accum + corrFactor * curr;
            }
            this._value = [this._value, value].reduce(cback, 0) / corrFactor;
            return this;
        },

        subtract : function (value) {
            var corrFactor = correctionFactor.call(null, this._value, value);
            function cback(accum, curr, currI, O) {
                return accum - corrFactor * curr;
            }
            this._value = [value].reduce(cback, this._value * corrFactor) / corrFactor;            
            return this;
        },

        multiply : function (value) {
            function cback(accum, curr, currI, O) {
                var corrFactor = correctionFactor(accum, curr);
                return (accum * corrFactor) * (curr * corrFactor) /
                    (corrFactor * corrFactor);
            }
            this._value = [this._value, value].reduce(cback, 1);
            return this;
        },

        divide : function (value) {
            function cback(accum, curr, currI, O) {
                var corrFactor = correctionFactor(accum, curr);
                return (accum * corrFactor) / (curr * corrFactor);
            }
            this._value = [this._value, value].reduce(cback);            
            return this;
        },

        difference : function (value) {
            return Math.abs(numeral(this._value).subtract(value).value());
        }

    };

    /************************************
        Exposing Numeral
    ************************************/

    // CommonJS module is defined
    if (hasModule) {
        module.exports = numeral;
    }

    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `numeral` as a global object via a string identifier,
        // for Closure Compiler 'advanced' mode
        this['numeral'] = numeral;
    }

    /*global define:false */
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return numeral;
        });
    }
}).call(this);
