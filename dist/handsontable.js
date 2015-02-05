/*!
 * Handsontable 0.12.5
 * Handsontable is a JavaScript library for editable tables with basic copy-paste compatibility with Excel and Google Docs
 *
 * Copyright 2012-2015 Marcin Warpechowski
 * Licensed under the MIT license.
 * http://handsontable.com/
 *
 * Date: Thu Feb 05 2015 11:24:27 GMT+0100 (CET)
 */
/*jslint white: true, browser: true, plusplus: true, indent: 4, maxerr: 50 */

//var Handsontable = { //class namespace
//  plugins: {}, //plugin namespace
//  helper: {} //helper namespace
//};

var Handsontable = function (rootElement, userSettings) {
  userSettings = userSettings || {};
  var instance = new Handsontable.Core(rootElement, userSettings);
  instance.init();
  return instance;
};
Handsontable.plugins = {};

(function (window, Handsontable) {
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

if (!Array.isArray) {
  Array.isArray = function(obj) {
    return toString.call(obj) == '[object Array]';
  };
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
// License CC-BY-SA v2.5
if (!Object.keys) {
  Object.keys = (function() {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
      hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
      dontEnums = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
      ],
      dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
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
 * @param rootElement The DOM element in which Handsontable DOM will be inserted
 * @param userSettings
 * @constructor
 */
Handsontable.Core = function (rootElement, userSettings) {
  var priv
    , datamap
    , grid
    , selection
    , editorManager
    , instance = this
    , GridSettings = function () {}
    , eventManager = Handsontable.eventManager(instance);

  Handsontable.helper.extend(GridSettings.prototype, DefaultSettings.prototype); //create grid settings as a copy of default settings
  Handsontable.helper.extend(GridSettings.prototype, userSettings); //overwrite defaults with user settings
  Handsontable.helper.extend(GridSettings.prototype, expandType(userSettings));

  this.rootElement = rootElement;

  this.container = document.createElement('DIV');
  this.container.className = 'htContainer';

  rootElement.insertBefore(this.container, rootElement.firstChild);

  this.guid = 'ht_' + Handsontable.helper.randomString(); //this is the namespace for global events

  if (!this.rootElement.id || this.rootElement.id.substring(0, 3) === "ht_") {
    this.rootElement.id = this.guid; //if root element does not have an id, assign a random id
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
          // //column order may have changes, so we need to translate the selection column index -> source array index
          // index = instance.runHooksAndReturn('modifyCol', index);
            delta = datamap.createCol(index, amount);

          if (delta) {

            if(Array.isArray(instance.getSettings().colHeaders)){
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
          //column order may have changes, so we need to translate the selection column index -> source array index
          index = instance.runHooks('modifyCol', index);

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

          if(Array.isArray(instance.getSettings().colHeaders)){
            if(typeof index == 'undefined'){
              index = -1;
            }
            instance.getSettings().colHeaders.splice(index, amount);
          }

          //priv.columnSettings.splice(index, amount);

          grid.adjustRowsAndCols();
          selection.refreshBorders(); //it will call render and prepare methods
          break;

        /* jshint ignore:start */
        default:
          throw new Error('There is no such action "' + action + '"');
          break;
        /* jshint ignore:end */
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
      //   for (; (((priv.settings.minRows || priv.settings.minSpareRows) &&
      //        instance.countRows() > priv.settings.minRows) && (priv.settings.minSpareRows && emptyRows > priv.settings.minSpareRows)); emptyRows--) {
      //     datamap.removeRow();
      //   }
      // }

      // if (priv.settings.enterBeginsEditing && !priv.settings.columns) {
      //   for (; (((priv.settings.minCols || priv.settings.minSpareCols) &&
      //        instance.countCols() > priv.settings.minCols) && (priv.settings.minSpareCols && emptyCols > priv.settings.minSpareCols)); emptyCols--) {
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
     * @param {String} direction (left|right|up|down)
     * @param {Array} deltas array
     * @return {Object|undefined} ending td in pasted area (only if any cell was changed)
     */
    populateFromArray: function (start, input, end, source, method, direction, deltas) {
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

        /* jshint ignore:start */
        case 'overwrite':
        default:
        /* jshint ignore:end */
          // overwrite and other not specified options
          current.row = start.row;
          current.col = start.col;

          var iterators = {row: 0, col: 0}, // number of packages
              selected = { // selected range
                row: (end && start) ? (end.row - start.row + 1) : 1,
                col: (end && start) ? (end.col - start.col + 1) : 1
              };

          if (['up', 'left'].indexOf(direction) !== -1) {
            iterators = {
              row: Math.ceil(selected.row / rlen) || 1,
              col: Math.ceil(selected.col / input[0].length) || 1
            };
          } else if (['down', 'right'].indexOf(direction) !== -1) {
            iterators = {
              row: 1,
              col: 1
            };
          }


          for (r = 0; r < rlen; r++) {
            if ((end && current.row > end.row) || (!priv.settings.allowInsertRow && current.row > instance.countRows() - 1) || (current.row >= priv.settings.maxRows)) {
              break;
            }
            current.col = start.col;
            clen = input[r] ? input[r].length : 0;
            for (c = 0; c < clen; c++) {
              if ((end && current.col > end.col) || (!priv.settings.allowInsertColumn && current.col > instance.countCols() - 1) || (current.col >= priv.settings.maxCols)) {
                break;
              }

              if (!instance.getCellMeta(current.row, current.col).readOnly) {
                var result,
                    value = input[r][c],
                    index = {
                      row: r,
                      col: c
                    };

                if (source === 'autofill') {
                  result = instance.runHooks('beforeAutofillInsidePopulate', index, direction, input, deltas, iterators, selected);

                  if (result) {
                    iterators = typeof(result.iterators) !== 'undefined' ? result.iterators : iterators;
                    value = typeof(result.value) !== 'undefined' ? result.value : value;
                  }
                }

                setData.push([current.row, current.col, value]);
              }

              current.col++;

              if (end && c === clen - 1) {
                c = -1;

                if (['down', 'right'].indexOf(direction) !== -1) {
                  iterators.col++;
                } else if (['up', 'left'].indexOf(direction) !== -1) {
                  if (iterators.col > 1) {
                    iterators.col--;
                  }
                }

              }
            }

            current.row++;
            iterators.col = 1;

            if (end && r === rlen - 1) {
              r = -1;

              if (['down', 'right'].indexOf(direction) !== -1) {
                iterators.row++;
              } else if (['up', 'left'].indexOf(direction) !== -1) {
                if (iterators.row > 1) {
                  iterators.row--;
                }
              }

            }
          }
          instance.setDataAtCell(setData, null, null, source || 'populateFromArray');
          break;
      }
    }
  };

  this.selection = selection = { //this public assignment is only temporary
    inProgress: false,

    selectedHeader: {
      cols: false,
      rows: false
    },

    setSelectedHeaders: function (rows, cols) {
      instance.selection.selectedHeader.rows = rows;
      instance.selection.selectedHeader.cols = cols;
    },

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
    setRangeStart: function (coords, keepEditorOpened) {
      Handsontable.hooks.run(instance, "beforeSetRangeStart", coords);
      priv.selRange = new WalkontableCellRange(coords, coords, coords);
      selection.setRangeEnd(coords, null, keepEditorOpened);
    },

    /**
     * Ends selection range on given td object
     * @param {WalkontableCellCoords} coords
     * @param {Boolean} [scrollToCell=true] If true, viewport will be scrolled to range end
     */
    setRangeEnd: function (coords, scrollToCell, keepEditorOpened) {
      //trigger handlers
      Handsontable.hooks.run(instance, "beforeSetRangeEnd", coords);

      instance.selection.begin();

      priv.selRange.to = new WalkontableCellCoords(coords.row, coords.col);
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
      Handsontable.hooks.run(instance, "afterSelection",
        priv.selRange.from.row, priv.selRange.from.col, priv.selRange.to.row, priv.selRange.to.col);
      Handsontable.hooks.run(instance, "afterSelectionByProp",
        priv.selRange.from.row, datamap.colToProp(priv.selRange.from.col), priv.selRange.to.row, datamap.colToProp(priv.selRange.to.col));

      if (scrollToCell !== false && instance.view.mainViewIsActive()) {
        if(priv.selRange.from) {
          instance.view.scrollViewport(priv.selRange.from);
        } else {
          instance.view.scrollViewport(coords);
        }

      }
      selection.refreshBorders(null, keepEditorOpened);
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
      var isMultiple = !(priv.selRange.to.col === priv.selRange.from.col && priv.selRange.to.row === priv.selRange.from.row)
        , modifier = Handsontable.hooks.run(instance, 'afterIsMultipleSelection', isMultiple);

      if(isMultiple) {
        return modifier;
      }
    },

    /**
     * Selects cell relative to current cell (if possible)
     */
    transformStart: function (rowDelta, colDelta, force, keepEditorOpened) {
      var delta = new WalkontableCellCoords(rowDelta, colDelta);
      instance.runHooks('modifyTransformStart', delta);

      /* jshint ignore:start */
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
      /* jshint ignore:end */

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

      selection.setRangeStart(coords, keepEditorOpened);
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
      if (priv.settings.currentRowClassName || priv.settings.currentColClassName) {
        instance.view.wt.selections.highlight.clear();
      }
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

  this.init = function () {
    Handsontable.hooks.run(instance, 'beforeInit');

    if(Handsontable.mobileBrowser) {
      Handsontable.Dom.addClass(instance.rootElement, 'mobile');
    }

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
        /* jshint ignore:start */
        if (this.validatorsInQueue == 0 && resolved == false) {
          resolved = true;
          this.onQueueEmpty();
        }
        /* jshint ignore:end */
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
        // column order may have changes, so we need to translate physical col index (stored in datasource) to logical (displayed to user)
        var logicalCol = instance.runHooks('modifyCol', col);
        var cellProperties = instance.getCellMeta(row, logicalCol);

        if (cellProperties.type === 'numeric' && typeof changes[i][3] === 'string') {
          if (changes[i][3].length > 0 && (/^-?[\d\s]*(\.|\,)?\d*$/.test(changes[i][3]) || cellProperties.format )) {
            var len = changes[i][3].length;
            if (typeof cellProperties.language == 'undefined') {
              numeral.language('en');
            }
            // this input in format XXXX.XX is likely to come from paste. Let's parse it using international rules
            else if (changes[i][3].indexOf(".") === len - 3 && changes[i][3].indexOf(",") === -1) {
              numeral.language('en');
            }
            else {
              numeral.language(cellProperties.language);
            }
            if (numeral.validate(changes[i][3])) {
              changes[i][3] = numeral().unformat(changes[i][3]);
            }
          }
        }

        /* jshint ignore:start */
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
            };
          })(i, cellProperties)
            , source);
        }
        /* jshint ignore:end */
      }
    }
    waitingForValidator.checkIfQueueIsEmpty();

    function resolve() {
      var beforeChangeResult;

      if (changes.length) {
        beforeChangeResult = Handsontable.hooks.run(instance, "beforeChange", changes, source);
        if (typeof beforeChangeResult === 'function') {
          console.warn("Your beforeChange callback returns a function. It's not supported since Handsontable 0.12.1 (and the returned function will not be executed).");
        } else if (beforeChangeResult === false) {
          changes.splice(0, changes.length); //invalidate all changes (remove everything from array)
        }
      }
        callback(); //called when async validators are resolved and beforeChange was not async
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

      if (priv.settings.allowInsertRow) {
        while (changes[i][0] > instance.countRows() - 1) {
          datamap.createRow();
        }
      }

      if (instance.dataType === 'array' && priv.settings.allowInsertColumn) {
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
        };
      })(validator);
    }

    if (typeof validator == 'function') {

      value = Handsontable.hooks.run(instance, "beforeValidate", value, cellProperties.row, cellProperties.prop, source);

      // To provide consistent behaviour, validation should be always asynchronous
      instance._registerTimeout(setTimeout(function () {
        validator.call(cellProperties, value, function (valid) {
          valid = Handsontable.hooks.run(instance, "afterValidate", valid, value, cellProperties.row, cellProperties.prop, source);
          cellProperties.valid = valid;

          callback(valid);
          Handsontable.hooks.run(instance, "postAfterValidate", valid, value, cellProperties.row, cellProperties.prop, source);
        });
      }, 0));

    } else {
      //resolve callback even if validator function was not found
      cellProperties.valid = true;
      callback(true);
    }
  };

  function setDataInputToArray(row, propOrCol, value) {
    if (typeof row === "object") { //is it an array of changes
      return row;
    }
    else {
      return [
        [row, propOrCol, value]
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
   * @param {String} direction edit (left|right|up|down)
   * @param {Array} deltas array
   * @return {Object|undefined} ending td in pasted area (only if any cell was changed)
   */
  this.populateFromArray = function (row, col, input, endRow, endCol, source, method, direction, deltas) {
    var c;

    if (!(typeof input === 'object' && typeof input[0] === 'object')) {
      throw new Error("populateFromArray parameter `input` must be an array of arrays"); //API changed in 0.9-beta2, let's check if you use it correctly
    }
    c = typeof endRow === 'number' ? new WalkontableCellCoords(endRow, endCol) : null;

    return grid.populateFromArray(new WalkontableCellCoords(row, col), input, c, source, method, direction, deltas);
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
  this.getSelected = function () { //https://github.com/handsontable/handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return [priv.selRange.from.row, priv.selRange.from.col, priv.selRange.to.row, priv.selRange.to.col];
    }
  };

  /**
   * Returns current selection as a WalkontableCellRange object. Returns undefined if there is no selection.
   * @public
   * @return {WalkontableCellRange}
   */
  this.getSelectedRange = function () { //https://github.com/handsontable/handsontable/issues/44  //cjl
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

    if (Array.isArray(priv.settings.dataSchema) || Array.isArray(data[0])) {
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
   * Return the current data object (the same that was passed by `data` configuration option
   * or `loadData` method). Optionally you can provide cell range `r`, `c`, `r2`, `c2` to get only a fragment of grid data
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
    } else {
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
          if (typeof settings[i] === 'function' || Array.isArray(settings[i])) {
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

    if (typeof settings.cell !== 'undefined') {
      /* jshint -W089 */
      for (i in settings.cell) {
        var cell = settings.cell[i];
        instance.setCellMetaObject(cell.row, cell.col, cell);
      }
    }

    Handsontable.hooks.run(instance, 'afterCellMetaReset');

    if (typeof settings.className !== "undefined") {
      if (GridSettings.prototype.className) {
        Handsontable.Dom.removeClass(instance.rootElement,GridSettings.prototype.className);
//        instance.rootElement.removeClass(GridSettings.prototype.className);
      }
      if (settings.className) {
        Handsontable.Dom.addClass(instance.rootElement,settings.className);
//        instance.rootElement.addClass(settings.className);
      }
    }

    if (typeof settings.height != 'undefined'){
      var height = settings.height;

      if (typeof height == 'function'){
        height = height();
      }

      instance.rootElement.style.height = height + 'px';
    }

    if (typeof settings.width != 'undefined'){
      var width = settings.width;

      if (typeof width == 'function'){
        width = width();
      }

      instance.rootElement.style.width = width + 'px';
    }

    /* jshint ignore:start */
    if (height){
      instance.rootElement.style.overflow = 'auto';
    }
    /* jshint ignore:end */

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
    if (!obj.hasOwnProperty('type')) {
      // ignore obj.prototype.type
      return;
    }

    var type, expandedType = {};

    if (typeof obj.type === 'object') {
      type = obj.type;
    }
    else if (typeof obj.type === 'string') {
      type = Handsontable.cellTypes[obj.type];
      if (type === void 0) {
        throw new Error('You declared cell type "' + obj.type +
            '" as a string that is not mapped to a known object. Cell type must be an object or a string mapped to an object in Handsontable.cellTypes');
      }
    }


    for (var i in type) {
      if (type.hasOwnProperty(i) && !obj.hasOwnProperty(i)) {
        expandedType[i] = type[i];
      }
    }

    return expandedType;

  }

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
   * @param {Boolean} topmost
   * @public
   * @return {Element}
   */
  this.getCell = function (row, col, topmost) {
    return instance.view.getCellAtCoords(new WalkontableCellCoords(row, col), topmost);
  };

  /**
   * Returns coordinates for the provided element
   * @param elem
   * @returns {WalkontableCellCoords|*}
   */
  this.getCoords = function(elem) {
    return this.view.wt.wtTable.getCoords.call(this.view.wt.wtTable, elem);
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
   * Return value at `col`, where `col` is the visible index of the column
   * @param {Number} col
   * @public
   * @return {Array} value (mixed data type)
   */
  this.getDataAtCol = function (col) {
    var out = [];
    return out.concat.apply(out, datamap.getRange(new WalkontableCellCoords(0, col), new WalkontableCellCoords(priv.settings.data.length - 1, col), datamap.DESTINATION_RENDERER));
  };

  /**
   * Return value at `prop`
   * @param {String} prop
   * @public
   * @return {Array} value (mixed data type)
   */
  this.getDataAtProp = function (prop) {
    var out = [],
      range;

    range = datamap.getRange(
      new WalkontableCellCoords(0, datamap.propToCol(prop)),
      new WalkontableCellCoords(priv.settings.data.length - 1, datamap.propToCol(prop)),
      datamap.DESTINATION_RENDERER);

    return out.concat.apply(out, range);
  };

  /**
   * Return original source values at 'col'
   * @param {Number} col
   * @public
   * @returns value (mixed data type)
   */
  this.getSourceDataAtCol = function (col) {
    var out = [],
        data = priv.settings.data;

    for (var i = 0; i < data.length; i++) {
      out.push(data[i][col]);
    }

    return out;
  };

  /**
   * Return original source values at 'row'
   * @param {Number} row
   * @public
   * @returns value {mixed data type}
   */
  this.getSourceDataAtRow = function (row) {
    return priv.settings.data[row];
  };

  /**
   * Return value at `row`
   * @param {Number} row
   * @public
   * @return value (mixed data type)
   */
  this.getDataAtRow = function (row) {
    var data = datamap.getRange(new WalkontableCellCoords(row, 0), new WalkontableCellCoords(row, this.countCols() - 1), datamap.DESTINATION_RENDERER);
    return data[0];
  };

  /***
   *  Remove "key" property object from cell meta data corresponding to params row,col
   * @param {Number} row
   * @param {Number} col
   * @param {String} key
   */
  this.removeCellMeta = function(row, col, key) {
    var cellMeta = instance.getCellMeta(row, col);
    /* jshint ignore:start */
    if(cellMeta[key] != undefined){
      delete priv.cellSettings[row][col][key];
    }
    /* jshint ignore:end */
  };

  /**
   * Set cell meta data object to corresponding params row, col
   * @param {Number} row
   * @param {Number} col
   * @param {Object} prop
   */
  this.setCellMetaObject = function (row, col, prop) {
    if (typeof prop === 'object') {
      /* jshint -W089 */
      for (var key in prop) {
        var value = prop[key];
        this.setCellMeta(row, col, key, value);
      }
    }
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
    return Handsontable.hooks.run(instance, 'modifyRow', row);
  }

  /**
   * If displayed columns order is different than the order of columns stored in memory (i.e. column were moved using manualColumnMove plugin)
   * we need to translate logical (stored) column index to physical (displayed) index.
   * @param col - original column index
   * @returns {int} - translated column index
   */
  function translateColIndex(col){
    // warning: this must be done after datamap.colToProp
    return Handsontable.hooks.run(instance, 'modifyCol', col);
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

    /* jshint ignore:start */
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
    /* jshint ignore:end */
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
    else if (Array.isArray(priv.settings.rowHeaders) && priv.settings.rowHeaders[row] !== void 0) {
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

      col = Handsontable.hooks.run(instance, 'modifyCol', col);

      if (priv.settings.columns && priv.settings.columns[col] && priv.settings.columns[col].title) {
        return priv.settings.columns[col].title;
      }
      else if (Array.isArray(priv.settings.colHeaders) && priv.settings.colHeaders[col] !== void 0) {
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
    width = Handsontable.hooks.run(instance, 'modifyColWidth', width, col);

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

    height = Handsontable.hooks.run(instance, 'modifyRowHeight', height, row);

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
   * Return index of first rendered row
   * @return {Number}
   */
  this.rowOffset = function () {
    return instance.view.wt.wtTable.getFirstRenderedRow();
  };

  /**
   * Return index of first visible column
   * @return {Number}
   */
  this.colOffset = function () {
    return instance.view.wt.wtTable.getFirstRenderedColumn();
  };

  /**
   * Return number of rendered rows (including rows partially or fully rendered outside viewport). Returns -1 if table is not visible
   * @return {Number}
   */
  this.countRenderedRows = function () {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getRenderedRowsCount() : -1;
  };

  /**
   * Return number of visible rows (rendered rows that fully fit inside viewport)). Returns -1 if table is not visible
   * @return {Number}
   */
  this.countVisibleRows = function () {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getVisibleRowsCount() : -1;
  };

  /**
   * Return number of rendered columns (including columns partially or fully rendered outside viewport). Returns -1 if table is not visible
   * @return {Number}
   */
  this.countRenderedCols = function () {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getRenderedColumnsCount() : -1;
  };

  /**
   * Return number of visible columns. Returns -1 if table is not visible
   * @return {Number}
   */
  this.countVisibleCols = function () {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getVisibleColumnsCount() : - 1;
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
      row = Handsontable.hooks.run(this, 'modifyRow', i);
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
    /* jshint ignore:start */
    arguments[1] = datamap.propToCol(arguments[1]);
    if (typeof arguments[3] !== "undefined") {
      arguments[3] = datamap.propToCol(arguments[3]);
    }
    return instance.selectCell.apply(instance, arguments);
    /* jshint ignore:end */
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
      instance.view.destroy();
    }


    Handsontable.Dom.empty(instance.rootElement);
    eventManager.clear();

    Handsontable.hooks.run(instance, 'afterDestroy');
    Handsontable.hooks.destroy(instance);

    for (var i in instance) {
      if (instance.hasOwnProperty(i)) {
        //replace instance methods with post mortem
        if (typeof instance[i] === "function") {
          if (i !== "runHooks") {
            instance[i] = postMortem;
          }
        }
        //replace instance properties with null (restores memory)
        //it should not be necessary but this prevents a memory leak side effects that show itself in Jasmine tests
        else if (i !== "guid") {
          instance[i] = null;
        }
      }
    }


    //replace private properties with null (restores memory)
    //it should not be necessary but this prevents a memory leak side effects that show itself in Jasmine tests
    priv = null;
    datamap = null;
    grid = null;
    selection = null;
    editorManager = null;
    instance = null;
    GridSettings = null;
  };

  /**
   * Replacement for all methods after Handsotnable was destroyed
   */
  function postMortem() {
    throw new Error("This method cannot be called because this Handsontable instance has been destroyed");
  }

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

  this.runHooks = function (key, p1, p2, p3, p4, p5, p6) {
    return Handsontable.hooks.run(instance, key, p1, p2, p3, p4, p5, p6);
  };

  this.timeouts = [];

  /**
   * Sets timeout. Purpose of this method is to clear all known timeouts when `destroy` method is called
   * @public
   */
  this._registerTimeout = function (handle) {
    this.timeouts.push(handle);
  };

  /**
   * Clears all known timeouts
   * @public
   */
  this._clearTimeouts = function () {
    for(var i = 0, ilen = this.timeouts.length; i<ilen; i++) {
      clearTimeout(this.timeouts[i]);
    }
  };

  /**
   * Handsontable version
   */
  this.version = '0.12.5'; //inserted by grunt from package.json
};

var DefaultSettings = function () {};

DefaultSettings.prototype = {
  data: void 0,
  dataSchema: void 0,
  width: void 0,
  height: void 0,
  startRows: 5,
  startCols: 5,
  rowHeaders: null,
  colHeaders: null,
  colWidths: void 0,
  columns: void 0,
  cells: void 0,
  cell: [],
  minRows: 0,
  minCols: 0,
  maxRows: Infinity,
  maxCols: Infinity,
  minSpareRows: 0,
  minSpareCols: 0,
  allowInsertRow:true,
  allowInsertColumn: true,
  allowRemoveRow: true,
  allowRemoveColumn: true,
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
  stretchH: 'none',
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
  placeholder: false,
  placeholderCellClassName: 'htPlaceholder',
  readOnlyCellClassName: 'htDimmed',
  commentedCellClassName: 'htCommentCell',
  fragmentSelection: false,
  readOnly: false,
  type: 'text',
  copyable: true,
  debug: false, //shows debug overlays in Walkontable
  wordWrap: true,
  noWordWrapClassName: 'htNoWrap',
  contextMenu: void 0,
  undo: void 0,
  columnSorting: void 0,
  manualColumnMove: void 0,
  manualColumnResize: void 0,
  manualRowMove: void 0,
  manualRowResize: void 0,
  manualColumnFreeze: void 0,
  viewportRowRenderingOffset: 10, //number of rows to be prerendered before and after the viewport
  viewportColumnRenderingOffset: 10, // number of columns to be prerendered before and after the viewport
  groups: void 0
};
Handsontable.DefaultSettings = DefaultSettings;

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


Handsontable.Dom.enableImmediatePropagation = function (event) {
  if (event != null && event.isImmediatePropagationEnabled == null) {
    event.stopImmediatePropagation = function () {
      this.isImmediatePropagationEnabled = false;
      this.cancelBubble = true;
    };
    event.isImmediatePropagationEnabled = true;
    event.isImmediatePropagationStopped = function () {
      return !this.isImmediatePropagationEnabled;
    };
  }
};

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

/**
 * Goes up the DOM tree and checks if element is child of another element
 * @param child Child element
 * @param {Object|string} parent Parent element OR selector of the parent element. If classname provided, function returns true for the first occurance of element with that class.
 * @returns {boolean}
 */
Handsontable.Dom.isChildOf = function (child, parent) {
  var node = child.parentNode;
  var queriedParents = [];
  if(typeof parent === "string") {
    queriedParents = Array.prototype.slice.call(document.querySelectorAll(parent), 0);
  } else {
    queriedParents.push(parent);
  }

  while (node != null) {
    if (queriedParents.indexOf(node) > - 1) {
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
  if (elem.previousSibling) {
    /* jshint ignore:start */
    while (elem = elem.previousSibling) {
      ++i;
    }
    /* jshint ignore:end */
  }
  return i;
};

if (document.documentElement.classList) {
  // HTML5 classList API
  Handsontable.Dom.hasClass = function (ele, cls) {
    return ele.classList.contains(cls);
  };

  Handsontable.Dom.addClass = function (ele, cls) {
    if (cls) {
      ele.classList.add(cls);
    }
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
    if (ele.className === "") {
      ele.className = cls;
    }
    else if (!this.hasClass(ele, cls)) {
      ele.className += " " + cls;
    }
  };

  Handsontable.Dom.removeClass = function (ele, cls) {
    if (this.hasClass(ele, cls)) { //is this really needed?
      var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
      ele.className = ele.className.replace(reg, ' ').trim(); //String.prototype.trim is defined in polyfill.js
    }
  };
}

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
  /* jshint ignore:start */
  while (child = element.lastChild) {
    element.removeChild(child);
  }
  /* jshint ignore:end */
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
 * Returns true if element is attached to the DOM and visible, false otherwise
 * @param elem
 * @returns {boolean}
 */
Handsontable.Dom.isVisible = function (elem) {
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
 * Returns elements top and left offset relative to the document. Function is not compatible with jQuery offset.
 *
 * @param {HTMLElement} elem
 * @return {Object} Returns object with `top` and `left` props
 */
Handsontable.Dom.offset = function (elem) {
  var offsetLeft,
    offsetTop,
    lastElem,
    docElem,
    box;

  docElem = document.documentElement;

  if (this.hasCaptionProblem() && elem.firstChild && elem.firstChild.nodeName === 'CAPTION') {
    // fixes problem with Firefox ignoring <caption> in TABLE offset (see also Handsontable.Dom.outerHeight)
    // http://jsperf.com/offset-vs-getboundingclientrect/8
    box = elem.getBoundingClientRect();

    return {
      top: box.top + (window.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
      left: box.left + (window.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
    };
  }
  offsetLeft = elem.offsetLeft;
  offsetTop = elem.offsetTop;
  lastElem = elem;

  /* jshint ignore:start */
  while (elem = elem.offsetParent) {
    // from my observation, document.body always has scrollLeft/scrollTop == 0
    if (elem === document.body) {
      break;
    }
    offsetLeft += elem.offsetLeft;
    offsetTop += elem.offsetTop;
    lastElem = elem;
  }
  /* jshint ignore:end */

  //slow - http://jsperf.com/offset-vs-getboundingclientrect/6
  if (lastElem && lastElem.style.position === 'fixed') {
    //if(lastElem !== document.body) { //faster but does gives false positive in Firefox
    offsetLeft += window.pageXOffset || docElem.scrollLeft;
    offsetTop += window.pageYOffset || docElem.scrollTop;
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

Handsontable.Dom.getScrollableElement = function (element) {
  var el = element.parentNode,
    props = ['auto', 'scroll'],
    overflow, overflowX, overflowY;

  while (el && el.style) {
    overflow = el.style.overflow;
    overflowX = el.style.overflowX;
    overflowY = el.style.overflowY;

    if (overflow == 'scroll' || overflowX == 'scroll' || overflowY == 'scroll') {
      return el;
    }
    if (el.clientHeight < el.scrollHeight && (props.indexOf(overflowY) !== -1 || props.indexOf(overflow) !== -1)) {
      return el;
    }
    if (el.clientWidth < el.scrollWidth && (props.indexOf(overflowX) !== -1 || props.indexOf(overflow) !== -1)) {
      return el;
    }
    el = el.parentNode;
  }

  return window;
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

Handsontable.Dom.innerHeight = function (elem) {
  return elem.clientHeight || elem.innerHeight;
};

Handsontable.Dom.innerWidth = function (elem) {
  return elem.clientWidth || elem.innerWidth;
};

Handsontable.Dom.addEvent = function(element, event, callback) {
  if (window.addEventListener) {
    element.addEventListener(event, callback, false);
  } else {
    element.attachEvent('on' + event, callback);
  }
};

Handsontable.Dom.removeEvent = function(element, event, callback) {
  if (window.removeEventListener) {
    element.removeEventListener(event, callback, false);
  } else {
    element.detachEvent('on' + event, callback);
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
   * Returns end of the selection in text input
   * @return {Number}
   */
  Handsontable.Dom.getSelectionEndPosition = function (el) {
    if(el.selectionEnd) {
      return el.selectionEnd;
    } else if(document.selection) { //IE8
      var r = document.selection.createRange();
      if(r == null) {
        return 0;
      }
      var re = el.createTextRange();

      return re.text.indexOf(r.text) + r.text.length;
    }
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
    if (w1 == w2) {
      w2 = outer.clientWidth;
    }

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
  };

  var isIE8 = !(document.createTextNode('test').textContent);
  Handsontable.Dom.isIE8 = function () {
    return isIE8;
  };

  var isIE9 = !!(document.documentMode);
  Handsontable.Dom.isIE9 = function () {
    return isIE9;
  };

  var isSafari = (/Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor));
  Handsontable.Dom.isSafari = function () {
    return isSafari;
  };

  /**
   * Sets overlay position depending on it's type and used browser
   */
  Handsontable.Dom.setOverlayPosition = function (overlayElem, left, top) {
    if (isIE8 || isIE9) {
      overlayElem.style.top = top;
      overlayElem.style.left = left;
    } else if (isSafari) {
      overlayElem.style['-webkit-transform'] = 'translate3d(' + left + ',' + top + ',0)';
    } else {
      overlayElem.style['transform'] = 'translate3d(' + left + ',' + top + ',0)';
    }
  };

  Handsontable.Dom.getCssTransform = function (elem) {
    var transform;

    /* jshint ignore:start */
    if(elem.style['transform'] && (transform = elem.style['transform']) != "") {
      return ['transform', transform];
    } else if (elem.style['-webkit-transform'] && (transform = elem.style['-webkit-transform']) != "") {
      return ['-webkit-transform', transform];
    } else {
      return -1;
    }
    /* jshint ignore:end */
  };

  Handsontable.Dom.resetCssTransform = function (elem) {
    /* jshint ignore:start */
    if(elem['transform'] && elem['transform'] != "") {
      elem['transform'] = "";
    } else if(elem['-webkit-transform'] && elem['-webkit-transform'] != "") {
      elem['-webkit-transform'] = "";
    }
    /* jshint ignore:end */
  };

})();


if(!window.Handsontable){
  var Handsontable = {};
}

Handsontable.countEventManagerListeners = 0; //used to debug memory leaks

Handsontable.eventManager = function (instance) {
  var
    addEvent,
    removeEvent,
    clearEvents,
    fireEvent;

  if (!instance) {
    throw new Error ('instance not defined');
  }
  if (!instance.eventListeners) {
    instance.eventListeners = [];
  }

  /**
   * Add Event
   *
   * @param {Element} element
   * @param {String} event
   * @param {Function} callback
   * @returns {Function} Returns function which you can easily call to remove that event
   */
  addEvent = function (element, event, callback) {
    var callbackProxy;

    callbackProxy = function (event) {
      if (event.target == void 0 && event.srcElement != void 0) {
        if (event.definePoperty) {
          event.definePoperty('target', {
            value: event.srcElement
          });
        } else {
          event.target = event.srcElement;
        }
      }

      if (event.preventDefault == void 0) {
        if (event.definePoperty) {
          event.definePoperty('preventDefault', {
            value: function() {
              this.returnValue = false;
            }
          });
        } else {
          event.preventDefault = function () {
            this.returnValue = false;
          };
        }
      }
      callback.call(this, event);
    };

    instance.eventListeners.push({
      element: element,
      event: event,
      callback: callback,
      callbackProxy: callbackProxy
    });

    if (window.addEventListener) {
      element.addEventListener(event, callbackProxy, false);
    } else {
      element.attachEvent('on' + event, callbackProxy);
    }
    Handsontable.countEventManagerListeners ++;

    return function _removeEvent() {
      removeEvent(element, event, callback);
    };
  };

  /**
   * Remove event
   *
   * @param {Element} element
   * @param {String} event
   * @param {Function} callback
   */
  removeEvent = function (element, event, callback) {
    var len = instance.eventListeners.length,
      tmpEvent;

    while (len--) {
      tmpEvent = instance.eventListeners[len];

      if (tmpEvent.event == event && tmpEvent.element == element) {
        if (callback && callback != tmpEvent.callback) {
          continue;
        }
        instance.eventListeners.splice(len, 1);

        if (tmpEvent.element.removeEventListener) {
          tmpEvent.element.removeEventListener(tmpEvent.event, tmpEvent.callbackProxy, false);
        } else {
          tmpEvent.element.detachEvent('on' + tmpEvent.event, tmpEvent.callbackProxy);
        }
        Handsontable.countEventManagerListeners --;
      }
    }
  };

  /**
   * Clear all events
   */
  clearEvents = function () {
    var len = instance.eventListeners.length,
      event;

    while (len--) {
      event = instance.eventListeners[len];

      if (event) {
        removeEvent(event.element, event.event, event.callback);
      }
    }
  };

  /**
   * Trigger event
   *
   * @param {Element} element
   * @param {String} type
   */
  fireEvent = function (element, type) {
    var options, event;

    options = {
      bubbles: true,
      cancelable: (type !== "mousemove"),
      view: window,
      detail: 0,
      screenX: 0,
      screenY: 0,
      clientX: 1,
      clientY: 1,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0,
      relatedTarget: undefined
    };

    if (document.createEvent) {
      event = document.createEvent("MouseEvents");
      event.initMouseEvent(type, options.bubbles, options.cancelable,
        options.view, options.detail,
        options.screenX, options.screenY, options.clientX, options.clientY,
        options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
        options.button, options.relatedTarget || document.body.parentNode);

    } else {
      event = document.createEventObject();
    }

    if (element.dispatchEvent) {
      element.dispatchEvent(event);
    } else {
      element.fireEvent('on' + type, event);
    }
  };

  return {
    addEventListener: addEvent,
    removeEventListener: removeEvent,
    clear: clearEvents,
    fireEvent: fireEvent
  };
};

/**
 * Handsontable TableView constructor
 * @param {Object} instance
 */
Handsontable.TableView = function (instance) {
  var that = this;

  this.eventManager = Handsontable.eventManager(instance);
  this.instance = instance;
  this.settings = instance.getSettings();


  var originalStyle = instance.rootElement.getAttribute('style');
  if(originalStyle) {
    instance.rootElement.setAttribute('data-originalstyle', originalStyle); //needed to retrieve original style in jsFiddle link generator in HT examples. may be removed in future versions
  }

  Handsontable.Dom.addClass(instance.rootElement,'handsontable');
//  instance.rootElement.addClass('handsontable');

  var table = document.createElement('TABLE');
  table.className = 'htCore';
  this.THEAD = document.createElement('THEAD');
  table.appendChild(this.THEAD);
  this.TBODY = document.createElement('TBODY');
  table.appendChild(this.TBODY);

  instance.table = table;


  instance.container.insertBefore(table, instance.container.firstChild);

  this.eventManager.addEventListener(instance.rootElement,'mousedown', function (event) {
    if (!that.isTextSelectionAllowed(event.target)) {
      clearTextSelection();
      event.preventDefault();
      window.focus(); //make sure that window that contains HOT is active. Important when HOT is in iframe.
    }
  });

  this.eventManager.addEventListener(document.documentElement, 'keyup',function (event) {
    if (instance.selection.isInProgress() && !event.shiftKey) {
      instance.selection.finish();
    }
  });

  var isMouseDown;
  this.isMouseDown = function () {
    return isMouseDown;
  };

  this.eventManager.addEventListener(document.documentElement, 'mouseup', function (event) {
    if (instance.selection.isInProgress() && event.which === 1) { //is left mouse button
      instance.selection.finish();
    }

    isMouseDown = false;

    if (Handsontable.helper.isOutsideInput(document.activeElement)) {
      instance.unlisten();
    }
  });

  this.eventManager.addEventListener(document.documentElement, 'mousedown',function (event) {
    var next = event.target;

    if (isMouseDown) {
      return; //it must have been started in a cell
    }

    if (next !== that.instance.container) { //immediate click on "spreader" means click on the right side of vertical scrollbar
      while (next !== document.documentElement) {
        if (next === null) {
          return; //click on something that was a row but now is detached (possibly because your click triggered a rerender)
        }
       if (next === instance.rootElement) {
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



  this.eventManager.addEventListener(table, 'selectstart', function (event) {
    if (that.settings.fragmentSelection) {
      return;
    }

    //https://github.com/handsontable/handsontable/issues/160
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

  var selections = [
    new WalkontableSelection({
      className: 'current',
      border: {
        width: 2,
        color: '#5292F7',
        //style: 'solid', //not used
        cornerVisible: function () {
          return that.settings.fillHandle && !that.isCellEdited() && !instance.selection.isMultiple();
        },
        multipleSelectionHandlesVisible: function () {
          return !that.isCellEdited() && !instance.selection.isMultiple();
        }
      }
    }),
    new WalkontableSelection({
      className: 'area',
      border: {
        width: 1,
        color: '#89AFF9',
        //style: 'solid', // not used
        cornerVisible: function () {
          return that.settings.fillHandle && !that.isCellEdited() && instance.selection.isMultiple();
        },
          multipleSelectionHandlesVisible: function () {
          return !that.isCellEdited() && instance.selection.isMultiple();
        }
      }
    }),
    new WalkontableSelection({
      className: 'highlight',
      highlightRowClassName: that.settings.currentRowClassName,
      highlightColumnClassName: that.settings.currentColClassName
    }),
    new WalkontableSelection({
      className: 'fill',
      border: {
        width: 1,
        color: 'red'
        //style: 'solid' // not used
      }
    })
  ];
  selections.current = selections[0];
  selections.area = selections[1];
  selections.highlight = selections[2];
  selections.fill = selections[3];

  var walkontableConfig = {
    debug: function () {
      return that.settings.debug;
    },
    table: table,
    stretchH: this.settings.stretchH,
    data: instance.getDataAtCell,
    totalRows: instance.countRows,
    totalColumns: instance.countCols,
    fixedColumnsLeft: function () {
      return that.settings.fixedColumnsLeft;
    },
    fixedRowsTop: function () {
      return that.settings.fixedRowsTop;
    },
    renderAllRows: that.settings.renderAllRows,
    rowHeaders: function () {
      var arr = [];
      if(instance.hasRowHeaders()) {
        arr.push(function (index, TH) {
          that.appendRowHeader(index, TH);
        });
      }
      Handsontable.hooks.run(instance, 'afterGetRowHeaderRenderers', arr);
      return arr;
    },
    columnHeaders: function () {

      var arr = [];
      if(instance.hasColHeaders()) {
        arr.push(function (index, TH) {
          that.appendColHeader(index, TH);
        });
      }
      Handsontable.hooks.run(instance, 'afterGetColumnHeaderRenderers', arr);
      return arr;
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
    selections: selections,
    hideBorderOnMouseDownOver: function () {
      return that.settings.fragmentSelection;
    },
    onCellMouseDown: function (event, coords, TD, wt) {
      instance.listen();
      that.activeWt = wt;

      isMouseDown = true;

      Handsontable.Dom.enableImmediatePropagation(event);

      Handsontable.hooks.run(instance, 'beforeOnCellMouseDown', event, coords, TD);

      if (!event.isImmediatePropagationStopped()) {

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
              instance.selection.setSelectedHeaders(false, true);
            }
            if (coords.col < 0) {
              instance.selectCell(coords.row, 0, coords.row, instance.countCols() - 1);
              instance.selection.setSelectedHeaders(true, false);
            }
          }
          else {
            instance.selection.setRangeStart(coords);
          }
        }

        Handsontable.hooks.run(instance, 'afterOnCellMouseDown', event, coords, TD);

        that.activeWt = that.wt;
      }
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
      } else {
        if (isMouseDown) {
          // multi select columns
          if (coords.row < 0) {
            instance.selection.setRangeEnd(new WalkontableCellCoords(instance.countRows() - 1, coords.col));
            instance.selection.setSelectedHeaders(false, true);
          }

          // multi select rows
          if (coords.col < 0) {
            instance.selection.setRangeEnd(new WalkontableCellCoords(coords.row, instance.countCols() - 1));
            instance.selection.setSelectedHeaders(true, false);
          }
        }
      }

      Handsontable.hooks.run(instance, 'afterOnCellMouseOver', event, coords, TD);
      that.activeWt = that.wt;
    },
    onCellCornerMouseDown: function (event) {
      event.preventDefault();
      Handsontable.hooks.run(instance, 'afterOnCellCornerMouseDown', event);
    },
    beforeDraw: function (force) {
      that.beforeRender(force);
    },
    onDraw: function (force) {
      that.onDraw(force);
    },
    onScrollVertically: function () {
      instance.runHooks('afterScrollVertically');
    },
    onScrollHorizontally: function () {
      instance.runHooks('afterScrollHorizontally');
    },
    onBeforeDrawBorders: function (corners, borderClassName) {
      instance.runHooks('beforeDrawBorders', corners, borderClassName);
    },
    onBeforeTouchScroll: function () {
      instance.runHooks('beforeTouchScroll');
    },
    onAfterMomentumScroll: function () {
      instance.runHooks('afterMomentumScroll');
    },
    viewportRowCalculatorOverride: function (calc) {
      if (that.settings.viewportRowRenderingOffset) {
        calc.startRow = Math.max(calc.startRow - that.settings.viewportRowRenderingOffset, 0);
        calc.endRow = Math.min(calc.endRow + that.settings.viewportRowRenderingOffset, instance.countRows() - 1);
      }
      instance.runHooks('afterViewportRowCalculatorOverride', calc);
    },
    viewportColumnCalculatorOverride: function (calc) {
      if (that.settings.viewportColumnRenderingOffset) {
        calc.startColumn = Math.max(calc.startColumn - that.settings.viewportColumnRenderingOffset, 0);
        calc.endColumn = Math.min(calc.endColumn + that.settings.viewportColumnRenderingOffset, instance.countCols() - 1);
      }
      instance.runHooks('afterViewportColumnCalculatorOverride', calc);
    }
  };

  Handsontable.hooks.run(instance, 'beforeInitWalkontable', walkontableConfig);

  this.wt = new Walkontable(walkontableConfig);
  this.activeWt = this.wt;

  this.eventManager.addEventListener(that.wt.wtTable.spreader, 'mousedown', function (event) {
    if (event.target === that.wt.wtTable.spreader && event.which === 3) { //right mouse button exactly on spreader means right clickon the right hand side of vertical scrollbar
      Handsontable.helper.stopPropagation(event);
      //event.stopPropagation();
    }
  });

  this.eventManager.addEventListener(that.wt.wtTable.spreader, 'contextmenu', function (event) {
    if (event.target === that.wt.wtTable.spreader && event.which === 3) { //right mouse button exactly on spreader means right clickon the right hand side of vertical scrollbar
      Handsontable.helper.stopPropagation(event);
      //event.stopPropagation();
    }
  });


  this.eventManager.addEventListener(document.documentElement, 'click', function () {
    if (that.settings.observeDOMVisibility) {
      if (that.wt.drawInterrupted) {
        that.instance.forceFullRender = true;
        that.render();
      }
    }
  });
};

Handsontable.TableView.prototype.isTextSelectionAllowed = function (el) {
  if (Handsontable.helper.isInput(el)) {
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

Handsontable.TableView.prototype.beforeRender = function (force) {
  if (force) { //force = did Walkontable decide to do full render
    Handsontable.hooks.run(this.instance, 'beforeRender', this.instance.forceFullRender); //this.instance.forceFullRender = did Handsontable request full render?
  }
};

Handsontable.TableView.prototype.onDraw = function (force) {
  if (force) { //force = did Walkontable decide to do full render
    Handsontable.hooks.run(this.instance, 'afterRender', this.instance.forceFullRender); //this.instance.forceFullRender = did Handsontable request full render?
  }
};

Handsontable.TableView.prototype.render = function () {
  this.wt.draw(!this.instance.forceFullRender);
  this.instance.forceFullRender = false;
//  this.instance.rootElement.triggerHandler('render.handsontable');
};

/**
 * Returns td object given coordinates
 * @param {WalkontableCellCoords} coords
 * @param {Boolean} topmost
 */
Handsontable.TableView.prototype.getCellAtCoords = function (coords, topmost) {
  var td = this.wt.getCell(coords, topmost);
  //var td = this.wt.wtTable.getCell(coords);
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
  var DIV = document.createElement('DIV'),
    SPAN = document.createElement('SPAN');

  DIV.className = 'relative';
  SPAN.className = 'rowHeader';

  if (row > -1) {
    Handsontable.Dom.fastInnerHTML(SPAN, this.instance.getRowHeader(row));
  } else {
    Handsontable.Dom.fastInnerText(SPAN, String.fromCharCode(160)); // workaround for https://github.com/handsontable/handsontable/issues/1946
  }

  DIV.appendChild(SPAN);
  Handsontable.Dom.empty(TH);

  TH.appendChild(DIV);

  Handsontable.hooks.run(this.instance, 'afterGetRowHeader', row, TH);
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

  if (col > -1) {
    Handsontable.Dom.fastInnerHTML(SPAN, this.instance.getColHeader(col));
  } else {
    Handsontable.Dom.fastInnerText(SPAN, String.fromCharCode(160)); // workaround for https://github.com/handsontable/handsontable/issues/1946
    Handsontable.Dom.addClass(SPAN, 'cornerHeader');
  }
  DIV.appendChild(SPAN);

  Handsontable.Dom.empty(TH);
  TH.appendChild(DIV);
  Handsontable.hooks.run(this.instance, 'afterGetColHeader', col, TH);
};

/**
 * Given a element's left position relative to the viewport, returns maximum element width until the right edge of the viewport (before scrollbar)
 * @param {Number} leftOffset
 * @return {Number}
 */
Handsontable.TableView.prototype.maximumVisibleElementWidth = function (leftOffset) {
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
  var workspaceHeight = this.wt.wtViewport.getWorkspaceHeight();
  var maxHeight = workspaceHeight - topOffset;
  return maxHeight > 0 ? maxHeight : 0;
};

Handsontable.TableView.prototype.mainViewIsActive = function () {
  return this.wt === this.activeWt;
};

Handsontable.TableView.prototype.destroy = function () {
  this.wt.destroy();
  this.eventManager.clear();
};

/**
 * Utility to register editors and common namespace for keeping reference to all editor classes
 */
(function (Handsontable) {
  'use strict';

  function RegisteredEditor(editorClass) {
    var Clazz, instances;

    instances = {};
    Clazz = editorClass;

    this.getInstance = function (hotInstance) {
      if (!(hotInstance.guid in instances)) {
        instances[hotInstance.guid] = new Clazz(hotInstance);
      }

      return instances[hotInstance.guid];
    };

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
    var keyCodes = Handsontable.helper.keyCode;
    var destroyed = false;

    var eventManager = Handsontable.eventManager(instance);

    var activeEditor;

    var init = function () {

      function onKeyDown(event) {

        if (!instance.isListening()) {
          return;
        }

        Handsontable.hooks.run(instance, 'beforeKeyDown', event);

        if(destroyed) {
          return;
        }

        Handsontable.Dom.enableImmediatePropagation(event);

        if (!event.isImmediatePropagationStopped()) {

          priv.lastKeyCode = event.keyCode;
          if (selection.isSelected()) {
            var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)

            if (!activeEditor.isWaiting()) {
              if (!Handsontable.helper.isMetaKey(event.keyCode) && !ctrlDown && !that.isEditorOpened()) {
                that.openEditor("");
                return;
              }
            }

            var rangeModifier = event.shiftKey ? selection.setRangeEnd : selection.setRangeStart;

              switch (event.keyCode) {

                case keyCodes.A:
                  if (ctrlDown) {
                    selection.selectAll(); //select all cells

                    event.preventDefault();
                    Handsontable.helper.stopPropagation(event);
                    //event.stopPropagation();
                  }
                  break;

                case keyCodes.ARROW_UP:

                  if (that.isEditorOpened() && !activeEditor.isWaiting()){
                    that.closeEditorAndSaveChanges(ctrlDown);
                  }

                  moveSelectionUp(event.shiftKey);

                  event.preventDefault();
                  Handsontable.helper.stopPropagation(event);
                  //event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.ARROW_DOWN:
                  if (that.isEditorOpened() && !activeEditor.isWaiting()){
                    that.closeEditorAndSaveChanges(ctrlDown);
                  }

                  moveSelectionDown(event.shiftKey);

                  event.preventDefault();
                  Handsontable.helper.stopPropagation(event);
                  //event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.ARROW_RIGHT:
                  if(that.isEditorOpened()  && !activeEditor.isWaiting()){
                    that.closeEditorAndSaveChanges(ctrlDown);
                  }

                  moveSelectionRight(event.shiftKey);

                  event.preventDefault();
                  Handsontable.helper.stopPropagation(event);
                  //event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.ARROW_LEFT:
                  if(that.isEditorOpened() && !activeEditor.isWaiting()){
                    that.closeEditorAndSaveChanges(ctrlDown);
                  }

                  moveSelectionLeft(event.shiftKey);

                  event.preventDefault();
                  Handsontable.helper.stopPropagation(event);
                  //event.stopPropagation(); //required by HandsontableEditor
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
                  Handsontable.helper.stopPropagation(event);
                  //event.stopPropagation(); //required by HandsontableEditor
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
                  Handsontable.helper.stopPropagation(event);
                  //event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.END:
                  if (event.ctrlKey || event.metaKey) {
                    rangeModifier(new WalkontableCellCoords(instance.countRows() - 1, priv.selRange.from.col));
                  }
                  else {
                    rangeModifier(new WalkontableCellCoords(priv.selRange.from.row, instance.countCols() - 1));
                  }
                  event.preventDefault(); //don't scroll the window
                  Handsontable.helper.stopPropagation(event);
                  //event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.PAGE_UP:
                  selection.transformStart(-instance.countVisibleRows(), 0);
                  event.preventDefault(); //don't page up the window
                  Handsontable.helper.stopPropagation(event);
                  //event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.PAGE_DOWN:
                  selection.transformStart(instance.countVisibleRows(), 0);
                  event.preventDefault(); //don't page down the window
                  Handsontable.helper.stopPropagation(event);
                  //event.stopPropagation(); //required by HandsontableEditor
                  break;
              }

          }
        }
      }

      instance.addHook('afterDocumentKeyDown', function(originalEvent){
        onKeyDown(originalEvent);
      });

      eventManager.addEventListener(document, 'keydown', function (ev){
        instance.runHooks('afterDocumentKeyDown', ev);
      });

      function onDblClick(event, coords, elem) {
        if(elem.nodeName == "TD") { //may be TD or TH
          that.openEditor();
        }
      }

      instance.view.wt.update('onCellDblClick', onDblClick);

      instance.addHook('afterDestroy', function(){
        destroyed = true;
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
      registeredRenderers[rendererName] = rendererFunction;
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

Handsontable.helper = {};

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
 * Creates 2D array of Excel-like values "A1", "A2", ...
 * @param rowCount
 * @param colCount
 * @returns {Array}
 */
Handsontable.helper.createSpreadsheetData = function(rowCount, colCount) {
  rowCount = typeof rowCount === 'number' ? rowCount : 100;
  colCount = typeof colCount === 'number' ? colCount : 4;

  var rows = []
    , i
    , j;

  for (i = 0; i < rowCount; i++) {
    var row = [];
    for (j = 0; j < colCount; j++) {
      row.push(Handsontable.helper.spreadsheetColumnLabel(j) + (i + 1));
    }
    rows.push(row);
  }
  return rows;
};

Handsontable.helper.createSpreadsheetObjectData = function(rowCount, colCount) {
  rowCount = typeof rowCount === 'number' ? rowCount : 100;
  colCount = typeof colCount === 'number' ? colCount : 4;

  var rows = []
    , i
    , j;

  for (i = 0; i < rowCount; i++) {
    var row = {};
    for (j = 0; j < colCount; j++) {
      row['prop' + j] = Handsontable.helper.spreadsheetColumnLabel(j) + (i + 1);
    }
    rows.push(row);
  }
  return rows;
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
 * Described in ticket: https://github.com/handsontable/handsontable/pull/516
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

/**
 * Perform deep extend of a target object with extension's own properties
 * @param {Object} target An object that will receive the new properties
 * @param {Object} extension An object containing additional properties to merge into the target
 */
Handsontable.helper.deepExtend = function (target, extension) {
  for (var key in extension) {
    if (extension.hasOwnProperty(key)) {
      if (extension[key] && typeof extension[key] === 'object') {
        if (!target[key]) {
          if (Array.isArray(extension[key])) {
            target[key] = [];
          }
          else {
            target[key] = {};
          }
        }
        Handsontable.helper.deepExtend(target[key], extension[key]);
      }
      else {
        target[key] = extension[key];
      }
    }
  }
};

/**
 * Perform deep clone of an object
 * WARNING! Only clones JSON properties. Will cause error when `obj` contains a function, Date, etc
 * @param {Object} obj An object that will be cloned
 * @return {Object}
 */
Handsontable.helper.deepClone = function (obj) {
  if (typeof obj === "object") {
    return JSON.parse(JSON.stringify(obj));
  }
  else {
    return obj;
  }
};

Handsontable.helper.getPrototypeOf = function (obj) {
  var prototype;

  /* jshint ignore:start */
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
  /* jshint ignore:end */

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
      output[j].push(input[i][j]);
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
};

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
  INSERT: 45,
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

Handsontable.helper.pivot = function (arr) {
  var pivotedArr = [];

  if(!arr || arr.length === 0 || !arr[0] || arr[0].length === 0){
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
      throw new Error('You declared cell type "' + typeName + '" as a string that is not mapped to a known object. ' +
                      'Cell type must be an object or a string mapped to an object in Handsontable.cellTypes');
    }

    return type;
  }

};

Handsontable.helper.isMobileBrowser = function (userAgent) {
  if(!userAgent) {
    userAgent = navigator.userAgent;
  }
  return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));

  // Logic for checking the specific mobile browser
  //
  /* var type = type != void 0 ? type.toLowerCase() : ''
    , result;
  switch(type) {
    case '':
      result = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      return result;
      break;
    case 'ipad':
      return navigator.userAgent.indexOf('iPad') > -1;
      break;
    case 'android':
      return navigator.userAgent.indexOf('Android') > -1;
      break;
    case 'windows':
      return navigator.userAgent.indexOf('IEMobile') > -1;
      break;
    default:
      throw new Error('Invalid isMobileBrowser argument');
      break;
  } */
};

Handsontable.helper.isTouchSupported = function () {
  return ('ontouchstart' in window);
};

Handsontable.helper.stopPropagation = function (event) {
  // ie8
  //http://msdn.microsoft.com/en-us/library/ie/ff975462(v=vs.85).aspx
  if (typeof (event.stopPropagation) === 'function') {
    event.stopPropagation();
  }
  else {
    event.cancelBubble = true;
  }
};

Handsontable.helper.pageX = function (event) {
  if (event.pageX) {
    return event.pageX;
  }

  var scrollLeft = Handsontable.Dom.getWindowScrollLeft();
  var cursorX = event.clientX + scrollLeft;

  return cursorX;
};

Handsontable.helper.pageY = function (event) {
  if (event.pageY) {
    return event.pageY;
  }

  var scrollTop = Handsontable.Dom.getWindowScrollTop();
  var cursorY = event.clientY + scrollTop;

  return cursorY;
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
    if (!Array.isArray(obj)){
      schema = {};
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (typeof obj[i] === "object" && !Array.isArray(obj[i])) {
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
    if (typeof schema === "object" && !Array.isArray(schema)) {
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
    var i, ilen, schema = this.getSchema();
    if (typeof schema === "undefined") {
      throw new Error("trying to create `columns` definition but you didnt' provide `schema` nor `data`");
    }
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
    col = Handsontable.hooks.run(this.instance, 'modifyCol', col);

    if (this.colToPropCache && typeof this.colToPropCache[col] !== 'undefined') {
      return this.colToPropCache[col];
    }

    return col;
  };

  Handsontable.DataMap.prototype.propToCol = function (prop) {
    var col;

    if (typeof this.propToColCache.get(prop) !== 'undefined') {
      col = this.propToColCache.get(prop);
    } else {
      col = prop;
    }
    col = Handsontable.hooks.run(this.instance, 'modifyCol', col);

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
        row = {};
        Handsontable.helper.deepExtend(row, this.getSchema());
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

    var actionWasNotCancelled = Handsontable.hooks.run(this.instance, 'beforeRemoveRow', index, amount);

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

    var actionWasNotCancelled = Handsontable.hooks.run(this.instance, 'beforeRemoveCol', index, amount);

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

    var rowData = this.instance.getSourceDataAtRow(row);
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
    row = Handsontable.hooks.run(this.instance, 'modifyRow', row);

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
    row = Handsontable.hooks.run(this.instance, 'modifyRow', row, source || "datamapGet");

    if (typeof prop === 'string' && prop.indexOf('.') > -1) {
      var sliced = prop.split(".");
      var out = this.dataSource[row];
      for (var i = 0, ilen = sliced.length - 1; i < ilen; i++) {

        if (typeof out[sliced[i]] === 'undefined'){
          out[sliced[i]] = {};
        }
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
      row = Handsontable.hooks.run(this.instance, 'modifyRow', physicRow);
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
      if(TD.className) {
        TD.className = TD.className + " " + cellProperties.className;
      } else {
        TD.className = cellProperties.className;
      }

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
  };

})(Handsontable);

/**
 * Default text renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properties (shared by cell renderer and editor)
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
      TEMPLATE.model = instance.getSourceDataAtRow(row);
      TD.appendChild(TEMPLATE);
    }
    else {
      Handsontable.Dom.fastInnerText(TD, escaped); //this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
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
  clonableARROW.appendChild(document.createTextNode(String.fromCharCode(9660))); // workaround for https://github.com/handsontable/handsontable/issues/1946
//this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips

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
      TD.appendChild(document.createTextNode(String.fromCharCode(160))); // workaround for https://github.com/handsontable/handsontable/issues/1946
      //this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
    }



    if (!instance.acArrowListener) {
      var eventManager = Handsontable.eventManager(instance);

      //not very elegant but easy and fast
      instance.acArrowListener = function (event) {
        if (Handsontable.Dom.hasClass(event.target,'htAutocompleteArrow')) {
          instance.view.wt.getSetting('onCellDblClick', null, new WalkontableCellCoords(row, col), TD);
        }
      };

      eventManager.addEventListener(instance.rootElement,'mousedown',instance.acArrowListener);

      //We need to unbind the listener after the table has been destroyed
      instance.addHookOnce('afterDestroy', function () {
        eventManager.clear();
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

    var eventManager = Handsontable.eventManager(instance);

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
      Handsontable.Dom.fastInnerText(TD, '#bad value#'); //this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
    }

    if (cellProperties.readOnly) {
      eventManager.addEventListener(INPUT,'click',function (event) {
        event.preventDefault();
      });
    }
    else {
      eventManager.addEventListener(INPUT,'mousedown',function (event) {
        Handsontable.helper.stopPropagation(event);
        //event.stopPropagation(); //otherwise can confuse cell mousedown handler
      });

      eventManager.addEventListener(INPUT,'mouseup',function (event) {
        Handsontable.helper.stopPropagation(event);
        //event.stopPropagation(); //otherwise can confuse cell dblclick handler
      });

      eventManager.addEventListener(INPUT,'change',function () {
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

        Handsontable.Dom.enableImmediatePropagation(event);

        if(event.keyCode == Handsontable.helper.keyCode.SPACE || event.keyCode == Handsontable.helper.keyCode.ENTER){

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
                  eventManager.fireEvent(checkbox[i], 'change');
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
 * @param {Object} cellProperties Cell properties (shared by cell renderer and editor)
 */
(function (Handsontable) {

  'use strict';

  var NumericRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
    if (Handsontable.helper.isNumeric(value)) {
      if (typeof cellProperties.language !== 'undefined') {
        numeral.language(cellProperties.language);
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

(function(Handsontable){

  'use strict';

  var PasswordRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
    Handsontable.renderers.TextRenderer.apply(this, arguments);

    value = TD.innerHTML;

    var hash;
    var hashLength = cellProperties.hashLength || value.length;
    var hashSymbol = cellProperties.hashSymbol || '*';

    for (hash = ''; hash.split(hashSymbol).length - 1 < hashLength; hash += hashSymbol) {}

    Handsontable.Dom.fastInnerHTML(TD, hash);

  };

  Handsontable.PasswordRenderer = PasswordRenderer;
  Handsontable.renderers.PasswordRenderer = PasswordRenderer;
  Handsontable.renderers.registerRenderer('password', PasswordRenderer);

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
  };

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
      var sel = this.instance.getSelected()
        , tmp;

      if(sel[0] > sel[2]) {
        tmp = sel[0];
        sel[0] = sel[2];
        sel[2] = tmp;
      }
      if(sel[1] > sel[3]) {
        tmp = sel[1];
        sel[1] = sel[3];
        sel[3] = tmp;
      }

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
    var _this = this;

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
      this.instance._registerTimeout(setTimeout(function () {
        _this._fireCallbacks(true);
      }, 0));

      return;
    }

    if (this.state == Handsontable.EditorState.EDITING) {
      if (restoreOriginalValue) {
        this.cancelChanges();
        this.instance.view.render();

        return;
      }
      var val = [
        [String.prototype.trim.call(this.getValue())] // String.prototype.trim is defined in Walkontable polyfill.js
      ];

      this.state = Handsontable.EditorState.WAITING;
      this.saveValue(val, ctrlDown);

      if (this.instance.getCellValidator(this.cellProperties)) {
        this.instance.addHookOnce('postAfterValidate', function (result) {
          _this.state = Handsontable.EditorState.FINISHED;
          _this.discardEditor(result);
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
    // validator was defined and failed
    if (result === false && this.cellProperties.allowInvalid !== true) {
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
    var that = this;
    this.createElements();
    this.eventManager = new Handsontable.eventManager(this);
    this.bindEvents();
    this.autoResize = autoResize();

    this.instance.addHook('afterDestroy', function () {
      that.destroy();
    });
  };

  TextEditor.prototype.getValue = function(){
    return this.TEXTAREA.value;
  };

  TextEditor.prototype.setValue = function(newValue){
    this.TEXTAREA.value = newValue;
  };

  var onBeforeKeyDown =  function onBeforeKeyDown(event){

    var instance = this;
    var that = instance.getActiveEditor();

    var keyCodes = Handsontable.helper.keyCode;
    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)

    Handsontable.Dom.enableImmediatePropagation(event);

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
            that.beginEditing(that.originalValue + '\n');
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
        }
        break;

      case keyCodes.BACKSPACE:
      case keyCodes.DELETE:
      case keyCodes.HOME:
      case keyCodes.END:
        event.stopImmediatePropagation(); //backspace, delete, home, end should only work locally when cell is edited (not in table context)
        break;
    }

    that.autoResize.resize(String.fromCharCode(event.keyCode));
  };



  TextEditor.prototype.open = function(){
    this.refreshDimensions(); //need it instantly, to prevent https://github.com/handsontable/handsontable/issues/348

    this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
  };

  TextEditor.prototype.close = function(){
    this.textareaParentStyle.display = 'none';

    this.autoResize.unObserve();

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
//    this.$body = $(document.body);

    this.TEXTAREA = document.createElement('TEXTAREA');

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

    this.instance.rootElement.appendChild(this.TEXTAREA_PARENT);

    var that = this;
    this.instance._registerTimeout(setTimeout(function () {
      that.refreshDimensions();
    }, 0));
  };

  TextEditor.prototype.checkEditorSection = function () {
    if(this.row < this.instance.getSettings().fixedRowsTop) {
      if(this.col < this.instance.getSettings().fixedColumnsLeft) {
        return 'corner';
      } else {
        return 'top';
      }
    } else {
      if(this.col < this.instance.getSettings().fixedColumnsLeft) {
        return 'left';
      }
    }
  };

  TextEditor.prototype.getEditedCell = function () {
    var editorSection = this.checkEditorSection()
      , editedCell;

    switch (editorSection) {
      case 'top':
        editedCell = this.instance.view.wt.wtScrollbars.vertical.clone.wtTable.getCell({row: this.row, col: this.col});
        this.textareaParentStyle.zIndex = 101;
        break;
      case 'corner':
        editedCell = this.instance.view.wt.wtScrollbars.corner.clone.wtTable.getCell({row: this.row, col: this.col});
        this.textareaParentStyle.zIndex = 103;
        break;
      case 'left':
        editedCell = this.instance.view.wt.wtScrollbars.horizontal.clone.wtTable.getCell({row: this.row, col: this.col});
        this.textareaParentStyle.zIndex = 102;
        break;
      default :
        editedCell = this.instance.getCell(this.row, this.col);
        this.textareaParentStyle.zIndex = "";
        break;
    }

    return editedCell != -1 && editedCell != -2 ? editedCell : void 0;
  };


  TextEditor.prototype.refreshDimensions = function () {
    if (this.state !== Handsontable.EditorState.EDITING) {
      return;
    }

    ///start prepare textarea position
//    this.TD = this.instance.getCell(this.row, this.col);
    this.TD = this.getEditedCell();

    if (!this.TD) {
      //TD is outside of the viewport. Otherwise throws exception when scrolling the table while a cell is edited
      return;
    }
    //var $td = $(this.TD); //because old td may have been scrolled out with scrollViewport

    var currentOffset = Handsontable.Dom.offset(this.TD);
    var containerOffset = Handsontable.Dom.offset(this.instance.rootElement);
    var editTop = currentOffset.top - containerOffset.top - 1;
    var editLeft = currentOffset.left - containerOffset.left - 1;

    var settings = this.instance.getSettings();
    var rowHeadersCount = settings.rowHeaders === false ? 0 : 1;
    var colHeadersCount = settings.colHeaders === false ? 0 : 1;
    var editorSection = this.checkEditorSection();
    var cssTransformOffset;

    // TODO: Refactor this to the new instance.getCell method (from #ply-59), after 0.12.1 is released
    switch(editorSection) {
      case 'top':
        cssTransformOffset = Handsontable.Dom.getCssTransform(this.instance.view.wt.wtScrollbars.vertical.clone.wtTable.holder.parentNode);
        break;
      case 'left':
        cssTransformOffset = Handsontable.Dom.getCssTransform(this.instance.view.wt.wtScrollbars.horizontal.clone.wtTable.holder.parentNode);
        break;
      case 'corner':
        cssTransformOffset = Handsontable.Dom.getCssTransform(this.instance.view.wt.wtScrollbars.corner.clone.wtTable.holder.parentNode);
        break;
    }

    if (editTop < 0) {
      editTop = 0;
    }
    if (editLeft < 0) {
      editLeft = 0;
    }
    if (rowHeadersCount > 0 && parseInt(this.TD.style.borderTopWidth, 10) > 0) {
      editTop += 1;
    }
    if (colHeadersCount > 0 && parseInt(this.TD.style.borderLeftWidth, 10) > 0) {
      editLeft += 1;
    }


    if(cssTransformOffset && cssTransformOffset != -1) {
      this.textareaParentStyle[cssTransformOffset[0]] = cssTransformOffset[1];
    } else {
      Handsontable.Dom.resetCssTransform(this.textareaParentStyle);
    }

    this.textareaParentStyle.top = editTop + 'px';
    this.textareaParentStyle.left = editLeft + 'px';

    ///end prepare textarea position


    var cellTopOffset = this.TD.offsetTop - this.instance.view.wt.wtScrollbars.vertical.getScrollPosition(),
        cellLeftOffset = this.TD.offsetLeft - this.instance.view.wt.wtScrollbars.horizontal.getScrollPosition();

    var width = Handsontable.Dom.innerWidth(this.TD) - 8  //$td.width()
      , maxWidth = this.instance.view.maximumVisibleElementWidth(cellLeftOffset) - 10 //10 is TEXTAREAs border and padding
      , height = Handsontable.Dom.outerHeight(this.TD) - 4  //$td.outerHeight() - 4
      , maxHeight = this.instance.view.maximumVisibleElementHeight(cellTopOffset) - 2; //10 is TEXTAREAs border and padding

    if (parseInt(this.TD.style.borderTopWidth, 10) > 0) {
      height -= 1;
    }
    if (parseInt(this.TD.style.borderLeftWidth, 10) > 0) {
      if (rowHeadersCount > 0) {
        width -= 1;
      }
    }

    this.TEXTAREA.style.fontSize = Handsontable.Dom.getComputedStyle(this.TD).fontSize;
    this.TEXTAREA.style.fontFamily = Handsontable.Dom.getComputedStyle(this.TD).fontFamily;

    this.autoResize.init(this.TEXTAREA, {
      minHeight: Math.min(height, maxHeight),
      maxHeight: maxHeight, //TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
      minWidth: Math.min(width, maxWidth),
      maxWidth: maxWidth //TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
    }, true);

    this.textareaParentStyle.display = 'block';
  };

  TextEditor.prototype.bindEvents = function () {
    var editor = this;

    this.eventManager.addEventListener(this.TEXTAREA, 'cut',function (event){
      Handsontable.helper.stopPropagation(event);
      //event.stopPropagation();
    });

    this.eventManager.addEventListener(this.TEXTAREA, 'paste', function (event){
      Handsontable.helper.stopPropagation(event);
      //event.stopPropagation();
    });

    this.instance.addHook('afterScrollVertically', function () {
      editor.refreshDimensions();
    });

    this.instance.addHook('afterColumnResize', function () {
      editor.refreshDimensions();
      editor.focus();
    });

    this.instance.addHook('afterRowResize', function () {
      editor.refreshDimensions();
      editor.focus();
    });

    this.instance.addHook('afterDestroy', function () {
      editor.eventManager.clear();
    });
  };

  TextEditor.prototype.destroy = function () {
    this.eventManager.clear();
  };


  Handsontable.editors.TextEditor = TextEditor;
  Handsontable.editors.registerEditor('text', Handsontable.editors.TextEditor);

})(Handsontable);

(function (Handsontable) {

  var MobileTextEditor = Handsontable.editors.BaseEditor.prototype.extend();

  var domDimensionsCache = {};

  var createControls = function () {
    this.controls = {};

    this.controls.leftButton = document.createElement('DIV');
    this.controls.leftButton.className = 'leftButton';
    this.controls.rightButton = document.createElement('DIV');
    this.controls.rightButton.className = 'rightButton';
    this.controls.upButton = document.createElement('DIV');
    this.controls.upButton.className = 'upButton';
    this.controls.downButton = document.createElement('DIV');
    this.controls.downButton.className = 'downButton';

    for (var button in this.controls) {
      if (this.controls.hasOwnProperty(button)) {
        this.positionControls.appendChild(this.controls[button]);
      }
    }
  };

  MobileTextEditor.prototype.valueChanged = function () {
    return this.initValue != this.getValue();
  };

  MobileTextEditor.prototype.init = function () {
    var that = this;
    this.eventManager = new Handsontable.eventManager(this.instance);

    this.createElements();
    this.bindEvents();

    this.instance.addHook('afterDestroy', function () {
      that.destroy();
    });

  };

  MobileTextEditor.prototype.getValue = function () {
    return this.TEXTAREA.value;
  };

  MobileTextEditor.prototype.setValue = function (newValue) {
    this.initValue = newValue;

    this.TEXTAREA.value = newValue;
  };

  MobileTextEditor.prototype.createElements = function () {
    this.editorContainer = document.createElement('DIV');
    this.editorContainer.className = "htMobileEditorContainer";

    this.cellPointer = document.createElement('DIV');
    this.cellPointer.className = "cellPointer";

    this.moveHandle = document.createElement('DIV');
    this.moveHandle.className = "moveHandle";

    this.inputPane = document.createElement('DIV');
    this.inputPane.className = "inputs";

    this.positionControls = document.createElement('DIV');
    this.positionControls.className = "positionControls";

    this.TEXTAREA = document.createElement('TEXTAREA');
    Handsontable.Dom.addClass(this.TEXTAREA, 'handsontableInput');

    this.inputPane.appendChild(this.TEXTAREA);

    this.editorContainer.appendChild(this.cellPointer);
    this.editorContainer.appendChild(this.moveHandle);
    this.editorContainer.appendChild(this.inputPane);
    this.editorContainer.appendChild(this.positionControls);

    createControls.call(this);

    document.body.appendChild(this.editorContainer);
  };

  MobileTextEditor.prototype.onBeforeKeyDown = function (event) {
    var instance = this;
    var that = instance.getActiveEditor();

    Handsontable.Dom.enableImmediatePropagation(event);

    if (event.target !== that.TEXTAREA || event.isImmediatePropagationStopped()){
      return;
    }

    var keyCodes = Handsontable.helper.keyCode;

    switch(event.keyCode) {
      case keyCodes.ENTER:
        that.close();
        event.preventDefault(); //don't add newline to field
        break;
      case keyCodes.BACKSPACE:
        event.stopImmediatePropagation(); //backspace, delete, home, end should only work locally when cell is edited (not in table context)
        break;
    }
  };

  MobileTextEditor.prototype.open = function () {
    this.instance.addHook('beforeKeyDown', this.onBeforeKeyDown);

    Handsontable.Dom.addClass(this.editorContainer, 'active');
    //this.updateEditorDimensions();
    //this.scrollToView();
    Handsontable.Dom.removeClass(this.cellPointer, 'hidden');

    this.updateEditorPosition();
  };

  MobileTextEditor.prototype.focus = function(){
    this.TEXTAREA.focus();
    Handsontable.Dom.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
  };

  MobileTextEditor.prototype.close = function () {
    this.TEXTAREA.blur();
    this.instance.removeHook('beforeKeyDown', this.onBeforeKeyDown);

    Handsontable.Dom.removeClass(this.editorContainer, 'active');
  };

  MobileTextEditor.prototype.scrollToView = function () {
    var coords = this.instance.getSelectedRange().highlight;
    this.instance.view.scrollViewport(coords);
  };

  MobileTextEditor.prototype.hideCellPointer = function () {
    if(!Handsontable.Dom.hasClass(this.cellPointer, 'hidden')) {
      Handsontable.Dom.addClass(this.cellPointer, 'hidden');
    }
  };

  MobileTextEditor.prototype.updateEditorPosition = function (x, y) {
    if(x && y) {
      x = parseInt(x, 10);
      y = parseInt(y, 10);

      this.editorContainer.style.top = y + "px";
      this.editorContainer.style.left = x + "px";

    } else {
      var selection = this.instance.getSelected()
        , selectedCell = this.instance.getCell(selection[0],selection[1]);

      //cache sizes
      if(!domDimensionsCache.cellPointer) {
        domDimensionsCache.cellPointer = {
          height: Handsontable.Dom.outerHeight(this.cellPointer),
          width: Handsontable.Dom.outerWidth(this.cellPointer)
        };
      }
      if(!domDimensionsCache.editorContainer) {
        domDimensionsCache.editorContainer = {
          width: Handsontable.Dom.outerWidth(this.editorContainer)
        };
      }

      if(selectedCell !== undefined) {
        var scrollLeft = this.instance.view.wt.wtScrollbars.horizontal.scrollHandler == window ?
              0 : Handsontable.Dom.getScrollLeft(this.instance.view.wt.wtScrollbars.horizontal.scrollHandler);
        var scrollTop = this.instance.view.wt.wtScrollbars.vertical.scrollHandler == window ?
              0 : Handsontable.Dom.getScrollTop(this.instance.view.wt.wtScrollbars.vertical.scrollHandler);

        var selectedCellOffset = Handsontable.Dom.offset(selectedCell)
          , selectedCellWidth = Handsontable.Dom.outerWidth(selectedCell)
          , currentScrollPosition = {
            x: scrollLeft,
            y: scrollTop
          };

        this.editorContainer.style.top = parseInt(selectedCellOffset.top + Handsontable.Dom.outerHeight(selectedCell) -
            currentScrollPosition.y + domDimensionsCache.cellPointer.height, 10) + "px";
        this.editorContainer.style.left = parseInt((window.innerWidth / 2) -
            (domDimensionsCache.editorContainer.width / 2) ,10) + "px";

        if(selectedCellOffset.left + selectedCellWidth / 2 > parseInt(this.editorContainer.style.left,10) + domDimensionsCache.editorContainer.width) {
          this.editorContainer.style.left = window.innerWidth - domDimensionsCache.editorContainer.width + "px";
        } else if(selectedCellOffset.left + selectedCellWidth / 2 < parseInt(this.editorContainer.style.left,10) + 20) {
          this.editorContainer.style.left = 0 + "px";
        }

        this.cellPointer.style.left = parseInt(selectedCellOffset.left - (domDimensionsCache.cellPointer.width / 2) -
            Handsontable.Dom.offset(this.editorContainer).left + (selectedCellWidth / 2) - currentScrollPosition.x ,10) + "px";
      }
    }
  };


  // For the optional dont-affect-editor-by-zooming feature:

  //MobileTextEditor.prototype.updateEditorDimensions = function () {
  //  if(!this.beginningWindowWidth) {
  //    this.beginningWindowWidth = window.innerWidth;
  //    this.beginningEditorWidth = Handsontable.Dom.outerWidth(this.editorContainer);
  //    this.scaleRatio = this.beginningEditorWidth / this.beginningWindowWidth;
  //
  //    this.editorContainer.style.width = this.beginningEditorWidth + "px";
  //    return;
  //  }
  //
  //  var currentScaleRatio = this.beginningEditorWidth / window.innerWidth;
  //  //if(currentScaleRatio > this.scaleRatio + 0.2 || currentScaleRatio < this.scaleRatio - 0.2) {
  //  if(currentScaleRatio != this.scaleRatio) {
  //    this.editorContainer.style["zoom"] = (1 - ((currentScaleRatio * this.scaleRatio) - this.scaleRatio)) * 100 + "%";
  //  }
  //
  //};

  MobileTextEditor.prototype.updateEditorData = function () {
    var selected = this.instance.getSelected()
      , selectedValue = this.instance.getDataAtCell(selected[0], selected[1]);

    this.row = selected[0];
    this.col = selected[1];
    this.setValue(selectedValue);
    this.updateEditorPosition();
  };

  MobileTextEditor.prototype.prepareAndSave = function () {

    if(!this.valueChanged()) {
      return true;
    }

    var val = [
      [String.prototype.trim.call(this.getValue())]
    ];

    this.saveValue(val);
  };

  MobileTextEditor.prototype.bindEvents = function () {
    var that = this;

    this.eventManager.addEventListener(this.controls.leftButton, "touchend", function (event) {
      that.prepareAndSave();
      that.instance.selection.transformStart(0, -1, null, true);
      that.updateEditorData();
      event.preventDefault();
    });
    this.eventManager.addEventListener(this.controls.rightButton, "touchend", function (event) {
      that.prepareAndSave();
      that.instance.selection.transformStart(0, 1, null, true);
      that.updateEditorData();
      event.preventDefault();
    });
    this.eventManager.addEventListener(this.controls.upButton, "touchend", function (event) {
      that.prepareAndSave();
      that.instance.selection.transformStart(-1, 0, null, true);
      that.updateEditorData();
      event.preventDefault();
    });
    this.eventManager.addEventListener(this.controls.downButton, "touchend", function (event) {
      that.prepareAndSave();
      that.instance.selection.transformStart(1, 0, null, true);
      that.updateEditorData();
      event.preventDefault();
    });

    this.eventManager.addEventListener(this.moveHandle, "touchstart", function (event) {
      if (event.touches.length == 1) {
        var touch = event.touches[0]
          , onTouchPosition = {
          x: that.editorContainer.offsetLeft,
          y: that.editorContainer.offsetTop
        }
          , onTouchOffset = {
          x: touch.pageX - onTouchPosition.x,
          y: touch.pageY - onTouchPosition.y
        };

        that.eventManager.addEventListener(this, "touchmove", function (event) {
          var touch = event.touches[0];
          that.updateEditorPosition(touch.pageX - onTouchOffset.x, touch.pageY - onTouchOffset.y);
          that.hideCellPointer();
          event.preventDefault();
        });

      }
    });

    this.eventManager.addEventListener(document.body, "touchend", function (event) {
      if(!Handsontable.Dom.isChildOf(event.target, that.editorContainer) && !Handsontable.Dom.isChildOf(event.target, that.instance.rootElement)) {
        that.close();
      }
    });

    this.eventManager.addEventListener(this.instance.view.wt.wtScrollbars.horizontal.scrollHandler, "scroll", function (event) {
      if(that.instance.view.wt.wtScrollbars.horizontal.scrollHandler != window) {
        that.hideCellPointer();
      }
    });

    this.eventManager.addEventListener(this.instance.view.wt.wtScrollbars.vertical.scrollHandler, "scroll", function (event) {
      if(that.instance.view.wt.wtScrollbars.vertical.scrollHandler != window) {
        that.hideCellPointer();
      }
    });

  };

  MobileTextEditor.prototype.destroy = function () {
    this.eventManager.clear();

    this.editorContainer.parentNode.removeChild(this.editorContainer);
  };

  Handsontable.editors.MobileTextEditor = MobileTextEditor;
  Handsontable.editors.registerEditor('mobile', Handsontable.editors.MobileTextEditor);



})(Handsontable);

(function(Handsontable){

  //Blank editor, because all the work is done by renderer
  var CheckboxEditor = Handsontable.editors.BaseEditor.prototype.extend();

  CheckboxEditor.prototype.beginEditing = function () {
    var checkbox = this.TD.querySelector('input[type="checkbox"]');

    if (checkbox) {
      checkbox.click();
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

  var $;

  DateEditor.prototype.init = function () {
    if (typeof jQuery != 'undefined') {
      $ = jQuery;
    } else {
      throw new Error("You need to include jQuery to your project in order to use the jQuery UI Datepicker.");
    }

    if (!$.datepicker) {
      throw new Error("jQuery UI Datepicker dependency not found. Did you forget to include jquery-ui.custom.js or its substitute?");
    }

    Handsontable.editors.TextEditor.prototype.init.apply(this, arguments);

    this.isCellEdited = false;
    var that = this;

    this.instance.addHook('afterDestroy', function () {
      that.destroyElements();
    });

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

    var eventManager = Handsontable.eventManager(this);

    /**
     * Prevent recognizing clicking on jQuery Datepicker as clicking outside of table
     */
    eventManager.addEventListener(this.datePicker, 'mousedown', function (event) {
      Handsontable.helper.stopPropagation(event);
      //event.stopPropagation();
    });

    this.hideDatepicker();
  };

  DateEditor.prototype.destroyElements = function () {
    this.$datePicker.datepicker('destroy');
    this.$datePicker.remove();
    //var eventManager = Handsontable.eventManager(this);
    //eventManager.removeEventListener(this.datePicker, 'mousedown');
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
    var offset = this.TD.getBoundingClientRect(),
      DatepickerSettings,
      datepickerSettings;

    this.datePickerStyle.top = (window.pageYOffset + offset.top + Handsontable.Dom.outerHeight(this.TD)) + 'px';
    this.datePickerStyle.left = (window.pageXOffset + offset.left) + 'px';

    DatepickerSettings = function () {};
    DatepickerSettings.prototype = this.cellProperties;
    datepickerSettings = new DatepickerSettings();
    datepickerSettings.defaultDate = this.originalValue || void 0;
    this.$datePicker.datepicker('option', datepickerSettings);

    if (this.originalValue) {
      this.$datePicker.datepicker('setDate', this.originalValue);
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

    this.htContainer = DIV;
    this.htEditor = new Handsontable(DIV);

    this.assignHooks();
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
        };
      },
      fillHandle: false,
      afterOnCellMouseDown: function () {
        var value = this.getValue();
        if (value !== void 0) { //if the value is undefined then it means we don't want to set the value
          parent.setValue(value);
        }
        parent.instance.destroyEditor();
      }
    };

    if (this.cellProperties.handsontable) {
      Handsontable.helper.extend(options, cellProperties.handsontable);
    }
    if (this.htEditor) {
      this.htEditor.destroy();
    }

    this.htEditor = new Handsontable(this.htContainer, options);

    //this.$htContainer.handsontable('destroy');
    //this.$htContainer.handsontable(options);
  };

  var onBeforeKeyDown = function (event) {

    if (event != null && event.isImmediatePropagationEnabled == null) {
      event.stopImmediatePropagation = function () {
        this.isImmediatePropagationEnabled = false;
        this.cancelBubble = true;
      };
      event.isImmediatePropagationEnabled = true;
      event.isImmediatePropagationStopped = function () {
        return !this.isImmediatePropagationEnabled;
      };
    }

    if (event.isImmediatePropagationStopped()) {
      return;
    }

    var editor = this.getActiveEditor();

    var innerHOT = editor.htEditor.getInstance(); //Handsontable.tmpHandsontable(editor.htContainer, 'getInstance');

    var rowToSelect;

    if (event.keyCode == Handsontable.helper.keyCode.ARROW_DOWN) {
      if (!innerHOT.getSelected()) {
        rowToSelect = 0;
      }
      else {
        var selectedRow = innerHOT.getSelected()[0];
        var lastRow = innerHOT.countRows() - 1;
        rowToSelect = Math.min(lastRow, selectedRow + 1);
      }
    }
    else if (event.keyCode == Handsontable.helper.keyCode.ARROW_UP) {
      if (innerHOT.getSelected()) {
        var selectedRow = innerHOT.getSelected()[0];
        rowToSelect = selectedRow - 1;
      }
    }

    if (rowToSelect !== void 0) {
      if (rowToSelect < 0) {
        innerHOT.deselectCell();
      }
      else {
        innerHOT.selectCell(rowToSelect, 0);
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      editor.instance.listen();
      editor.TEXTAREA.focus();
    }
  };

  HandsontableEditor.prototype.open = function () {

    this.instance.addHook('beforeKeyDown', onBeforeKeyDown);

    Handsontable.editors.TextEditor.prototype.open.apply(this, arguments);

    //this.$htContainer.handsontable('render');

    //Handsontable.tmpHandsontable(this.htContainer, 'render');
    this.htEditor.render();

    if (this.cellProperties.strict) {
      this.htEditor.selectCell(0,0);
      this.TEXTAREA.style.visibility = 'hidden';
    } else {
      this.htEditor.deselectCell();
      this.TEXTAREA.style.visibility = 'visible';
    }

    Handsontable.Dom.setCaretPosition(this.TEXTAREA, 0, this.TEXTAREA.value.length);

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
    if (this.htEditor.isListening()) { //if focus is still in the HOT editor

      //if (Handsontable.tmpHandsontable(this.htContainer,'isListening')) { //if focus is still in the HOT editor
    //if (this.$htContainer.handsontable('isListening')) { //if focus is still in the HOT editor
      this.instance.listen(); //return the focus to the parent HOT instance
    }

    if(this.htEditor.getSelected()){
    //if (Handsontable.tmpHandsontable(this.htContainer,'getSelected')) {
    //if (this.$htContainer.handsontable('getSelected')) {
    //  var value = this.$htContainer.handsontable('getInstance').getValue();
      var value = this.htEditor.getInstance().getValue();
      //var value = Handsontable.tmpHandsontable(this.htContainer,'getInstance').getValue();
      if (value !== void 0) { //if the value is undefined then it means we don't want to set the value
        this.setValue(value);
      }
    }

    return Handsontable.editors.TextEditor.prototype.finishEditing.apply(this, arguments);
  };

  HandsontableEditor.prototype.assignHooks = function () {
  var that = this;
    this.instance.addHook('afterDestroy', function () {
      if (that.htEditor) {
        that.htEditor.destroy();
      }
    });

  };

  Handsontable.editors.HandsontableEditor = HandsontableEditor;
  Handsontable.editors.registerEditor('handsontable', HandsontableEditor);



})(Handsontable);






(function (Handsontable) {
  var AutocompleteEditor = Handsontable.editors.HandsontableEditor.prototype.extend();

  AutocompleteEditor.prototype.init = function () {
    Handsontable.editors.HandsontableEditor.prototype.init.apply(this, arguments);

    // set choices list initial height, so Walkontable can assign it's scroll handler
    var choicesListHot = this.htEditor.getInstance();
    choicesListHot.updateSettings({
      height: 1
    });

    this.query = null;
    this.choices = [];
  };

  AutocompleteEditor.prototype.createElements = function(){
    Handsontable.editors.HandsontableEditor.prototype.createElements.apply(this, arguments);

    var getSystemSpecificPaddingClass = function () {
      if(window.navigator.platform.indexOf('Mac') != -1) {
        return "htMacScroll";
      } else {
        return "";
      }
    };

    Handsontable.Dom.addClass(this.htContainer, 'autocompleteEditor');
    Handsontable.Dom.addClass(this.htContainer, getSystemSpecificPaddingClass());

  };

  var skipOne = false;
  var onBeforeKeyDown = function (event) {
    skipOne = false;
    var editor = this.getActiveEditor();
    var keyCodes = Handsontable.helper.keyCode;

    if (Handsontable.helper.isPrintableChar(event.keyCode) || event.keyCode === keyCodes.BACKSPACE || event.keyCode === keyCodes.DELETE  || event.keyCode === keyCodes.INSERT) {
      var timeOffset = 0;

      // on ctl+c / cmd+c don't update suggestion list
      if(event.keyCode === keyCodes.C && (event.ctrlKey || event.metaKey)) {
        return;
      }

      if(!editor.isOpened()) {
        timeOffset += 10;
      }

      editor.instance._registerTimeout(setTimeout(function () {
        editor.queryChoices(editor.TEXTAREA.value);
        skipOne = true;
      }, timeOffset));
    }
  };

  AutocompleteEditor.prototype.prepare = function () {
    this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
    Handsontable.editors.HandsontableEditor.prototype.prepare.apply(this, arguments);
  };

  AutocompleteEditor.prototype.open = function () {
    Handsontable.editors.HandsontableEditor.prototype.open.apply(this, arguments);

    this.TEXTAREA.style.visibility = 'visible';
    this.focus();

    this.htContainer.style.overflow = 'hidden'; // small hack to prevent vertical scrollbar causing a horizontal scrollbar

    var choicesListHot = this.htEditor.getInstance();
    var that = this;

    choicesListHot.updateSettings({
      'colWidths': [Handsontable.Dom.outerWidth(this.TEXTAREA) - 2],
      afterRenderer: function (TD, row, col, prop, value) {
        var caseSensitive = this.getCellMeta(row, col).filteringCaseSensitive === true;

        if(value){
          var indexOfMatch =  caseSensitive ? value.indexOf(this.query) : value.toLowerCase().indexOf(that.query.toLowerCase());

          if(indexOfMatch != -1){
            var match = value.substr(indexOfMatch, that.query.length);
            TD.innerHTML = value.replace(match, '<strong>' + match + '</strong>');
          }
        }
      }
    });

    if(skipOne) {
      skipOne = false;
    }
    that.instance._registerTimeout(setTimeout(function () {
      that.queryChoices(that.TEXTAREA.value);
      that.htContainer.style.overflow = 'auto'; // small hack to prevent vertical scrollbar causing a horizontal scrollbar
    }, 0));

  };

  AutocompleteEditor.prototype.close = function () {
    Handsontable.editors.HandsontableEditor.prototype.close.apply(this, arguments);
  };

  AutocompleteEditor.prototype.queryChoices = function(query){
    this.query = query;

    if (typeof this.cellProperties.source == 'function'){
      var that = this;

      this.cellProperties.source(query, function(choices){
        that.updateChoicesList(choices);
      });

    } else if (Array.isArray(this.cellProperties.source)) {

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

      this.updateChoicesList(choices);

    } else {
      this.updateChoicesList([]);
    }

  };

  AutocompleteEditor.prototype.updateChoicesList = function (choices) {
    var pos = Handsontable.Dom.getCaretPosition(this.TEXTAREA),
        endPos = Handsontable.Dom.getSelectionEndPosition(this.TEXTAREA);

    var orderByRelevance = AutocompleteEditor.sortByRelevance(this.getValue(), choices, this.cellProperties.filteringCaseSensitive);
    var highlightIndex;

    /* jshint ignore:start */
    if (this.cellProperties.filter != false) {
      var sorted = [];
      for(var i = 0, choicesCount = orderByRelevance.length; i < choicesCount; i++) {
        sorted.push(choices[orderByRelevance[i]]);
      }
      highlightIndex = 0;
      choices = sorted;
    }
    else {
      highlightIndex = orderByRelevance[0];
    }
    /* jshint ignore:end */

    this.choices = choices;

    this.htEditor.loadData(Handsontable.helper.pivot([choices]));
    this.htEditor.updateSettings({height: this.getDropdownHeight()});
    //Handsontable.tmpHandsontable(this.htContainer,'loadData', Handsontable.helper.pivot([choices]));
    //Handsontable.tmpHandsontable(this.htContainer,'updateSettings', {height: this.getDropdownHeight()});

    if (this.cellProperties.strict === true) {
      this.highlightBestMatchingChoice(highlightIndex);
    }

    this.instance.listen();
    this.TEXTAREA.focus();
    Handsontable.Dom.setCaretPosition(this.TEXTAREA, pos, (pos != endPos ? endPos : void 0));
  };

  AutocompleteEditor.prototype.finishEditing = function (restoreOriginalValue) {
    if (!restoreOriginalValue) {
      this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
    }
    Handsontable.editors.HandsontableEditor.prototype.finishEditing.apply(this, arguments);
  };

  AutocompleteEditor.prototype.highlightBestMatchingChoice = function (index) {
    if (typeof index === "number") {
       this.htEditor.selectCell(index, 0);
    } else {
      this.htEditor.deselectCell();
    }
  };

  /**
   * Filters and sorts by relevance
   * @param value
   * @param choices
   * @param caseSensitive
   * @returns {Array} array of indexes in original choices array
   */
  AutocompleteEditor.sortByRelevance = function(value, choices, caseSensitive) {

    var choicesRelevance = []
      , currentItem
      , valueLength = value.length
      , valueIndex
      , charsLeft
      , result = []
      , i
      , choicesCount;

    if(valueLength === 0) {
      for(i = 0, choicesCount = choices.length; i < choicesCount; i++) {
        result.push(i);
      }
      return result;
    }

    for(i = 0, choicesCount = choices.length; i < choicesCount; i++) {
      currentItem = choices[i];

      if(caseSensitive) {
        valueIndex = currentItem.indexOf(value);
      } else {
        valueIndex = currentItem.toLowerCase().indexOf(value.toLowerCase());
      }


      if(valueIndex == -1) { continue; }
      charsLeft =  currentItem.length - valueIndex - valueLength;

      choicesRelevance.push({
        baseIndex: i,
        index: valueIndex,
        charsLeft: charsLeft,
        value: currentItem
      });
    }

    choicesRelevance.sort(function(a, b) {

      if(b.index === -1) {
        return -1;
      }
      if(a.index === -1) {
        return 1;
      }

      if(a.index < b.index) {
        return -1;
      } else if(b.index < a.index) {
        return 1;
      } else if(a.index === b.index) {
        if(a.charsLeft < b.charsLeft) {
          return -1;
        } else if(a.charsLeft > b.charsLeft) {
          return 1;
        } else {
          return 0;
        }
      }
    });

    for(i = 0, choicesCount = choicesRelevance.length; i < choicesCount; i++) {
      result.push(choicesRelevance[i].baseIndex);
    }

    return result;
  };

  AutocompleteEditor.prototype.getDropdownHeight = function(){
    //var firstRowHeight = this.$htContainer.handsontable('getInstance').getRowHeight(0) || 23;
    var firstRowHeight = this.htEditor.getInstance().getRowHeight(0) || 23;
    //var firstRowHeight = Handsontable.tmpHandsontable(this.htContainer,'getInstance').getRowHeight(0) || 23;
    return this.choices.length >= 10 ? 10 * firstRowHeight : this.choices.length * firstRowHeight + 8;
    //return 10 * this.$htContainer.handsontable('getInstance').getRowHeight(0);
    //sorry, we can't measure row height before it was rendered. Let's use fixed height for now
    //return 230;
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
    this.instance.rootElement.appendChild(this.select);
  };

  SelectEditor.prototype.prepare = function(){
    Handsontable.editors.BaseEditor.prototype.prepare.apply(this, arguments);


    var selectOptions = this.cellProperties.selectOptions;
    var options;

    if (typeof selectOptions == 'function'){
      options =  this.prepareOptions(selectOptions(this.row, this.col, this.prop));
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

    if (Array.isArray(optionsToPrepare)){
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

  // TODO: Refactor this with the use of new getCell() after 0.12.1
  SelectEditor.prototype.checkEditorSection = function () {
    if(this.row < this.instance.getSettings().fixedRowsTop) {
      if(this.col < this.instance.getSettings().fixedColumnsLeft) {
        return 'corner';
      } else {
        return 'top';
      }
    } else {
      if(this.col < this.instance.getSettings().fixedColumnsLeft) {
        return 'left';
      }
    }
  };

  SelectEditor.prototype.open = function () {
    var width = Handsontable.Dom.outerWidth(this.TD); //important - group layout reads together for better performance
    var height = Handsontable.Dom.outerHeight(this.TD);
    var rootOffset = Handsontable.Dom.offset(this.instance.rootElement);
    var tdOffset = Handsontable.Dom.offset(this.TD);
    var editorSection = this.checkEditorSection();
    var cssTransformOffset;

    switch(editorSection) {
      case 'top':
        cssTransformOffset = Handsontable.Dom.getCssTransform(this.instance.view.wt.wtScrollbars.vertical.clone.wtTable.holder.parentNode);
        break;
      case 'left':
        cssTransformOffset = Handsontable.Dom.getCssTransform(this.instance.view.wt.wtScrollbars.horizontal.clone.wtTable.holder.parentNode);
        break;
      case 'corner':
        cssTransformOffset = Handsontable.Dom.getCssTransform(this.instance.view.wt.wtScrollbars.corner.clone.wtTable.holder.parentNode);
        break;
    }

    var selectStyle = this.select.style;

    if(cssTransformOffset && cssTransformOffset != -1) {
      selectStyle[cssTransformOffset[0]] = cssTransformOffset[1];
    } else {
      Handsontable.Dom.resetCssTransform(this.select);
    }

    selectStyle.height = height + 'px';
    selectStyle.minWidth = width + 'px';
    selectStyle.top = tdOffset.top - rootOffset.top + 'px';
    selectStyle.left = tdOffset.left - rootOffset.left + 'px';
    selectStyle.margin = '0px';
    selectStyle.display = '';

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
(function (Handsontable) {

  'use strict';

  var NumericEditor = Handsontable.editors.TextEditor.prototype.extend();

  NumericEditor.prototype.beginEditing = function (initialValue) {

    var BaseEditor = Handsontable.editors.TextEditor.prototype;

    if (typeof (initialValue) === 'undefined' && this.originalValue) {

      var value = '' + this.originalValue;

      if (typeof this.cellProperties.language !== 'undefined') {
        numeral.language(this.cellProperties.language);
      }

      var decimalDelimiter = numeral.languageData().delimiters.decimal;
      value = value.replace('.', decimalDelimiter);

      BaseEditor.beginEditing.apply(this, [value]);
    } else {
      BaseEditor.beginEditing.apply(this, arguments);
    }

  };

  Handsontable.editors.NumericEditor = NumericEditor;
  Handsontable.editors.registerEditor('numeric', NumericEditor);

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
  };
};

/**
 * Autocomplete cell validator
 * @param {*} value - Value of edited cell
 * @param {*} callback - Callback called with validation result
 */
Handsontable.AutocompleteValidator = function (value, callback) {
  if (this.strict && this.source) {
    if ( typeof this.source === 'function' ) {
      this.source(value, process(value, callback));
    } else {
      process(value, callback)(this.source);
    }
  } else {
    callback(true);
  }
};

/**
 * Cell type is just a shortcut for setting bunch of cellProperties (used in getCellMeta)
 */

Handsontable.mobileBrowser = Handsontable.helper.isMobileBrowser();  // check if viewed on a mobile device

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
  editor: Handsontable.mobileBrowser ? Handsontable.editors.MobileTextEditor : Handsontable.editors.TextEditor,
  renderer: Handsontable.renderers.TextRenderer
};

Handsontable.NumericCell = {
  editor: Handsontable.editors.NumericEditor,
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

/**
 * autoResize - resizes a DOM element to the width and height of another DOM element
 *
 * Copyright 2014, Marcin Warpechowski
 * Licensed under the MIT license
 */
var autoResize = function () {
  var defaults = {
      minHeight: 200,
      maxHeight: 300,
      minWidth: 100,
      maxWidth: 300
    },
    el,
    body = document.body,
    text = document.createTextNode(''),
    span = document.createElement('SPAN'),
    observe = function (element, event, handler) {
      if (window.attachEvent) {
        element.attachEvent('on' + event, handler);
      } else {
        element.addEventListener(event, handler, false);
      }
    },
    unObserve = function (element, event, handler) {
      if (window.removeEventListener) {
        element.removeEventListener(event, handler, false);
      } else {
        element.detachEvent('on' + event, handler);
      }
    },
    resize = function (newChar) {
      var width, scrollHeight;

      if (!newChar) {
        newChar = "";
      } else if (!/^[a-zA-Z \.,\\\/\|0-9]$/.test(newChar)) {
        newChar = ".";
      }

      if (text.textContent !== void 0) {
        text.textContent = el.value + newChar;
      }
      else {
        text.data = el.value + newChar; //IE8
      }
      span.style.fontSize = Handsontable.Dom.getComputedStyle(el).fontSize;
      span.style.fontFamily = Handsontable.Dom.getComputedStyle(el).fontFamily;
      span.style.whiteSpace = "pre";

      body.appendChild(span);
      width = span.clientWidth + 2;
      body.removeChild(span);

      el.style.height = defaults.minHeight + 'px';

      if (defaults.minWidth > width) {
        el.style.width = defaults.minWidth + 'px';

      } else if (width > defaults.maxWidth) {
        el.style.width = defaults.maxWidth + 'px';

      } else {
        el.style.width = width + 'px';
      }
      scrollHeight = el.scrollHeight ? el.scrollHeight - 1 : 0;

      if (defaults.minHeight > scrollHeight) {
        el.style.height = defaults.minHeight + 'px';

      } else if (defaults.maxHeight < scrollHeight) {
        el.style.height = defaults.maxHeight + 'px';
        el.style.overflowY = 'visible';

      } else {
        el.style.height = scrollHeight + 'px';
      }
    },
    delayedResize = function () {
      window.setTimeout(resize, 0);
    },
    extendDefaults = function (config) {

      if (config && config.minHeight) {
        if (config.minHeight == 'inherit') {
          defaults.minHeight = el.clientHeight;
        } else {
          var minHeight = parseInt(config.minHeight);
          if (!isNaN(minHeight)) {
            defaults.minHeight = minHeight;
          }
        }
      }

      if (config && config.maxHeight) {
        if (config.maxHeight == 'inherit') {
          defaults.maxHeight = el.clientHeight;
        } else {
          var maxHeight = parseInt(config.maxHeight);
          if (!isNaN(maxHeight)) {
            defaults.maxHeight = maxHeight;
          }
        }
      }

      if (config && config.minWidth) {
        if (config.minWidth == 'inherit') {
          defaults.minWidth = el.clientWidth;
        } else {
          var minWidth = parseInt(config.minWidth);
          if (!isNaN(minWidth)) {
            defaults.minWidth = minWidth;
          }
        }
      }

      if (config && config.maxWidth) {
        if (config.maxWidth == 'inherit') {
          defaults.maxWidth = el.clientWidth;
        } else {
          var maxWidth = parseInt(config.maxWidth);
          if (!isNaN(maxWidth)) {
            defaults.maxWidth = maxWidth;
          }
        }
      }

      if(!span.firstChild) {
        span.className = "autoResize";
        span.style.display = 'inline-block';
        span.appendChild(text);
      }
    },
    init = function (el_, config, doObserve) {
      el = el_;
      extendDefaults(config);

      if (el.nodeName == 'TEXTAREA') {

        el.style.resize = 'none';
        el.style.overflowY = '';
        el.style.height = defaults.minHeight + 'px';
        el.style.minWidth = defaults.minWidth + 'px';
        el.style.maxWidth = defaults.maxWidth + 'px';
        el.style.overflowY = 'hidden';
      }

      if(doObserve) {
        observe(el, 'change', resize);
        observe(el, 'cut', delayedResize);
        observe(el, 'paste', delayedResize);
        observe(el, 'drop', delayedResize);
        observe(el, 'keydown', delayedResize);
      }

      resize();
    };

  return {
    init: function (el_, config, doObserve) {
      init(el_, config, doObserve);
    },
    unObserve: function () {
      unObserve(el, 'change', resize);
      unObserve(el, 'cut', delayedResize);
      unObserve(el, 'paste', delayedResize);
      unObserve(el, 'drop', delayedResize);
      unObserve(el, 'keydown', delayedResize);
    },
    resize: resize
  };

};

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
    /**
     * Decode spreadsheet string into array
     *
     * @param {String} str
     * @returns {Array}
     */
    parse: function (str) {
      var r, rLen, rows, arr = [], a = 0, c, cLen, multiline, last;

      rows = str.split('\n');

      if (rows.length > 1 && rows[rows.length - 1] === '') {
        rows.pop();
      }
      for (r = 0, rLen = rows.length; r < rLen; r += 1) {
        rows[r] = rows[r].split('\t');

        for (c = 0, cLen = rows[r].length; c < cLen; c += 1) {
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
            if (c === cLen - 1 && rows[r][c].indexOf('"') === 0) {
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

    /**
     * Encode array into valid spreadsheet string
     *
     * @param arr
     * @returns {String}
     */
    stringify: function (arr) {
      var r, rLen, c, cLen, str = '', val;

      for (r = 0, rLen = arr.length; r < rLen; r += 1) {
        cLen = arr[r].length;

        for (c = 0; c < cLen; c += 1) {
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
          else if (val === null || val === void 0) { // void 0 resolves to undefined
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
 * Creates a textarea that stays hidden on the page and gets focused when user presses CTRL while not having a form
 * input focused.
 * In future we may implement a better driver when better APIs are available.
 *
 * @constructor
 */
var CopyPaste = (function () {
  var instance;

  return {
    getInstance: function () {
      if (!instance) {
        instance = new CopyPasteClass();

      } else if (instance.hasBeenDestroyed()) {
        instance.init();
      }
      instance.refCounter ++;

      return instance;
    }
  };
})();

function CopyPasteClass() {
  this.refCounter = 0;
  this.init();
}

/**
 * Initialize CopyPaste class
 */
CopyPasteClass.prototype.init = function () {
  var
    style,
    parent;

  this.copyCallbacks = [];
  this.cutCallbacks = [];
  this.pasteCallbacks = [];
  this._eventManager = Handsontable.eventManager(this);

  // this.listenerElement = document.documentElement;
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
    this.elTextarea.onpaste = function (event) {
      if('WebkitAppearance' in document.documentElement.style) { // chrome and safari
        this.value = event.clipboardData.getData("Text");

        return false;
      }
    };
    style = this.elTextarea.style;
    style.width = '10000px';
    style.height = '10000px';
    style.overflow = 'hidden';
    this.elDiv.appendChild(this.elTextarea);

    if (typeof style.opacity !== 'undefined') {
      style.opacity = 0;
    }
  }
  this.keyDownRemoveEvent = this._eventManager.addEventListener(document.documentElement, 'keydown', this.onKeyDown.bind(this), false);
};

/**
 * Call method on every key down event
 *
 * @param {DOMEvent} event
 */
CopyPasteClass.prototype.onKeyDown = function (event) {
  var _this = this,
    isCtrlDown = false;

  // mac
  if (event.metaKey) {
    isCtrlDown = true;
  }
  // pc
  else if (event.ctrlKey && navigator.userAgent.indexOf('Mac') === -1) {
    isCtrlDown = true;
  }
  if (isCtrlDown) {
    // this is needed by fragmentSelection in Handsontable. Ignore copypaste.js behavior if fragment of cell text is selected
    if (document.activeElement !== this.elTextarea && (this.getSelectionText() !== '' ||
        ['INPUT', 'SELECT', 'TEXTAREA'].indexOf(document.activeElement.nodeName) !== -1)) {
      return;
    }

    this.selectNodeText(this.elTextarea);
    setTimeout(function () {
      _this.selectNodeText(_this.elTextarea);
    }, 0);
  }

  /* 67 = c
   * 86 = v
   * 88 = x
   */
  if (isCtrlDown && (event.keyCode === 67 || event.keyCode === 86 || event.keyCode === 88)) {
    // that.selectNodeText(that.elTextarea);

    // works in all browsers, incl. Opera < 12.12
    if (event.keyCode === 88) {
      setTimeout(function () {
        _this.triggerCut(event);
      }, 0);
    }
    else if (event.keyCode === 86) {
      setTimeout(function () {
        _this.triggerPaste(event);
      }, 0);
    }
  }
};

//http://jsperf.com/textara-selection
//http://stackoverflow.com/questions/1502385/how-can-i-make-this-code-work-in-ie
/**
 * Select all text contains in passed node element
 *
 * @param {Element} el
 */
CopyPasteClass.prototype.selectNodeText = function (el) {
  if (el) {
    el.select();
  }
};

//http://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
/**
 * Get selection text
 *
 * @returns {String}
 */
CopyPasteClass.prototype.getSelectionText = function () {
  var text = "";

  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type != "Control") {
    text = document.selection.createRange().text;
  }

  return text;
};

/**
 * Make string copyable
 *
 * @param {String} str
 */
CopyPasteClass.prototype.copyable = function (str) {
  if (typeof str !== 'string' && str.toString === void 0) {
    throw new Error('copyable requires string parameter');
  }
  this.elTextarea.value = str;
};

/*CopyPasteClass.prototype.onCopy = function (fn) {
  this.copyCallbacks.push(fn);
};*/

/**
 * Add function callback to onCut event
 *
 * @param {Function} fn
 */
CopyPasteClass.prototype.onCut = function (fn) {
  this.cutCallbacks.push(fn);
};

/**
 * Add function callback to onPaste event
 *
 * @param {Function} fn
 */
CopyPasteClass.prototype.onPaste = function (fn) {
  this.pasteCallbacks.push(fn);
};

/**
 * Remove callback from all events
 *
 * @param {Function} fn
 * @returns {Boolean}
 */
CopyPasteClass.prototype.removeCallback = function (fn) {
  var i, len;

  for (i = 0, len = this.copyCallbacks.length; i < len; i++) {
    if (this.copyCallbacks[i] === fn) {
      this.copyCallbacks.splice(i, 1);

      return true;
    }
  }
  for (i = 0, len = this.cutCallbacks.length; i < len; i++) {
    if (this.cutCallbacks[i] === fn) {
      this.cutCallbacks.splice(i, 1);

      return true;
    }
  }
  for (i = 0, len = this.pasteCallbacks.length; i < len; i++) {
    if (this.pasteCallbacks[i] === fn) {
      this.pasteCallbacks.splice(i, 1);

      return true;
    }
  }

  return false;
};

/**
 * Trigger cut event
 *
 * @param {DOMEvent} event
 */
CopyPasteClass.prototype.triggerCut = function (event) {
  var _this = this;

  if (_this.cutCallbacks) {
    setTimeout(function () {
      for (var i = 0, len = _this.cutCallbacks.length; i < len; i++) {
        _this.cutCallbacks[i](event);
      }
    }, 50);
  }
};

/**
 * Trigger paste event
 *
 * @param {DOMEvent} event
 * @param {String} str
 */
CopyPasteClass.prototype.triggerPaste = function (event, str) {
  var _this = this;

  if (_this.pasteCallbacks) {
    setTimeout(function () {
      var val = str || _this.elTextarea.value;

      for (var i = 0, len = _this.pasteCallbacks.length; i < len; i++) {
        _this.pasteCallbacks[i](val, event);
      }
    }, 50);
  }
};

/**
 * Destroy instance
 */
CopyPasteClass.prototype.destroy = function () {
  if(!this.hasBeenDestroyed() && --this.refCounter === 0){
    if (this.elDiv && this.elDiv.parentNode) {
      this.elDiv.parentNode.removeChild(this.elDiv);
      this.elDiv = null;
      this.elTextarea = null;
    }
    this.keyDownRemoveEvent();
  }
};

/**
 * Check if instance has been destroyed
 *
 * @returns {Boolean}
 */
CopyPasteClass.prototype.hasBeenDestroyed = function () {
  return !this.refCounter;
};



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
        if (str.indexOf('/') === -1 && str.indexOf('~') === -1) {
            return str;
        }

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
                    /* jshint ignore:start */
                    if (found != '') {
                        return escapePathComponent(key) + '/' + found;
                    }
                    /* jshint ignore:end */
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
    /* jshint ignore:start */
    jsonpatch.intervals;
    /* jshint ignore:end */
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
                /* jshint ignore:start */
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
                /* jshint ignore:end */

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
                    if (currentInterval == intervals.length) {
                        currentInterval = intervals.length - 1;
                    }
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
                    if (key.indexOf('~') != -1) {
                        key = key.replace(/~1/g, '/').replace(/~0/g, '~');
                    }
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
      beforeDrawBorders: [],
      beforeChange: [],
      beforeChangeRender: [],
      beforeRemoveCol: [],
      beforeRemoveRow: [],
      beforeValidate: [],
      beforeGetCellMeta: [],
      beforeAutofill: [],
      beforeKeyDown: [],
      beforeOnCellMouseDown: [],
      beforeTouchScroll: [],
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
      afterGetRowHeader: [],
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
      afterCellMetaReset: [],
      afterIsMultipleSelectionCheck: [],
      afterDocumentKeyDown: [],
      afterMomentumScroll: [],
      beforeCellAlignment: [],

      // Modifiers
      modifyColWidth: [],
      modifyRowHeight: [],
      modifyRow: [],
      modifyCol: []
    };
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
    /* jshint ignore:start */
    this.hooks = Hooks();
    /* jshint ignore:end */
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
    if (Array.isArray(fn)) {
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
        bucket[key].push(fn); //only add a hook if it has not already been added (adding the same hook twice is now silently ignored)
      }
    }
    return this;
  };

  PluginHookClass.prototype.once = function(key, fn, instance){

    if(Array.isArray(fn)){

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

  PluginHookClass.prototype.destroy = function (instance) {
    var bucket = this.getBucket(instance);
    for (var key in bucket) {
      if (bucket.hasOwnProperty(key)) {
        for (var i = 0, leni = bucket[key].length; i < leni; i++) {
          this.remove(key, bucket[key], instance);
        }
      }
    }
  };

  PluginHookClass.prototype.run = function (instance, key, p1, p2, p3, p4, p5, p6) {
    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }
    p1 = this._runBucket(this.globalBucket, instance, key, p1, p2, p3, p4, p5, p6);
    p1 = this._runBucket(this.getBucket(instance), instance, key, p1, p2, p3, p4, p5, p6);

    return p1;
  };

  PluginHookClass.prototype._runBucket = function (bucket, instance, key, p1, p2, p3, p4, p5, p6) {
    var handlers = bucket[key],
        res, i, len;

    // performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
    if (handlers) {
      for (i = 0, len = handlers.length; i < len; i++) {
        if (!handlers[i].skip) {
          res = handlers[i].call(instance, p1, p2, p3, p4, p5, p6);

          if (res !== void 0) {
            p1 = res;
          }

          if (handlers[i].runOnce) {
            this.remove(key, handlers[i], bucket === this.globalBucket ? null : instance);
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

      tmp.container.className = instance.rootElement.className + ' htAutoColumnSize';
      tmp.table.className = instance.table.className;

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

      var parent = instance.rootElement.parentNode;
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
      tmp.container.className = instance.rootElement.className + ' hidden';
//      tmp.container.className = instance.rootElement[0].className + ' hidden';
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

        return plugin.sortByColumn.apply(instance, args);
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

    var eventManager = Handsontable.eventManager(instance);
    eventManager.addEventListener(instance.rootElement, 'click', function (e){
      if(Handsontable.Dom.hasClass(e.target, 'columnSorting')) {
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
    instance._registerTimeout(setTimeout(function(){
      instance.updateSettings({
        observeChanges: true
      });
    }, 0));
  }

  function defaultSort(sortOrder) {
    return function (a, b) {
      if(typeof a[1] == "string") {
        a[1] = a[1].toLowerCase();
      }
      if(typeof b[1] == "string") {
        b[1] = b[1].toLowerCase();
      }

      if (a[1] === b[1]) {
        return 0;
      }
      if (a[1] === null || a[1] === "") {
        return 1;
      }
      if (b[1] === null || b[1] === "") {
        return -1;
      }
      if (a[1] < b[1]) {
        return sortOrder ? -1 : 1;
      }
      if (a[1] > b[1]) {
        return sortOrder ? 1 : -1;
      }
      return 0;
    };
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

      if (aDate < bDate) {
        return sortOrder ? -1 : 1;
      }
      if (aDate > bDate) {
        return sortOrder ? 1 : -1;
      }

      return 0;
    };
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
    if (this.getSettings().columnSorting && col >= 0) {
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
      instance._registerTimeout(setTimeout(function () {
        plugin.sort.call(instance);
        instance.render();
        instance.selectCell(plugin.untranslateRow.call(instance, selection.row), selection.col);
      }, 0));
    }
  };
}
var htSortColumn = new HandsontableColumnSorting();

Handsontable.hooks.add('afterInit', function () {
  htSortColumn.init.call(this, 'afterInit');
});
Handsontable.hooks.add('afterUpdateSettings', function () {
  htSortColumn.init.call(this, 'afterUpdateSettings');
});
Handsontable.hooks.add('modifyRow', htSortColumn.translateRow);
Handsontable.hooks.add('afterGetColHeader', htSortColumn.getColHeader);

Handsontable.hooks.register('beforeColumnSort');
Handsontable.hooks.register('afterColumnSort');


(function (Handsontable) {
  'use strict';

  function prepareVerticalAlignClass(className, alignment) {
    if (className.indexOf(alignment) != -1) {
      return className;
    }

    className = className
      .replace('htTop', '')
      .replace('htMiddle', '')
      .replace('htBottom', '')
      .replace('  ', '');

    className += " " + alignment;
    return className;
  }

  function prepareHorizontalAlignClass(className, alignment) {
    if (className.indexOf(alignment) != -1) {
      return className;
    }

    className = className
      .replace('htLeft', '')
      .replace('htCenter', '')
      .replace('htRight', '')
      .replace('htJustify', '')
      .replace('  ', '');

    className += " " + alignment;
    return className;
  }

  function getAlignmentClasses(range) {
    var classesArray = {};
    /* jshint ignore:start */
    for (var row = range.from.row; row <= range.to.row; row++) {
      for (var col = range.from.col; col <= range.to.col; col++) {

        if(!classesArray[row]) {
          classesArray[row] = [];
        }
        classesArray[row][col] = this.getCellMeta(row,col).className;
      }
    }
    /* jshint ignore:end */

    return classesArray;
  }

  function doAlign(row, col, type, alignment) {
    /* jshint ignore:start */
    var cellMeta = this.getCellMeta(row, col),
      className = alignment;

    if (cellMeta.className) {
      if (type === 'vertical') {
        className = prepareVerticalAlignClass(cellMeta.className, alignment);
      } else {
        className = prepareHorizontalAlignClass(cellMeta.className, alignment);
      }
    }

    this.setCellMeta(row, col, 'className', className);
    /* jshint ignore:end */
  }

  function align(range, type, alignment) {
    /* jshint ignore:start */

    var stateBefore = getAlignmentClasses.call(this, range);
    this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);

    if (range.from.row == range.to.row && range.from.col == range.to.col) {
      doAlign.call(this, range.from.row, range.from.col, type, alignment);
    } else {
      for (var row = range.from.row; row <= range.to.row; row++) {
        for (var col = range.from.col; col <= range.to.col; col++) {
          doAlign.call(this, row, col, type, alignment);
        }
      }
    }

    this.render();

    /* jshint ignore:end */
  }

  function ContextMenu(instance, customOptions) {
    this.instance = instance;
    var contextMenu = this;
    contextMenu.menus = [];
    contextMenu.htMenus = {};
    contextMenu.triggerRows = [];

    contextMenu.eventManager = Handsontable.eventManager(contextMenu);


    this.enabled = true;

    this.instance.addHook('afterDestroy', function () {
      contextMenu.destroy();
    });

    this.defaultOptions = {
      items: [
        {
          key: 'row_above',
          name: 'Insert row above',
          callback: function (key, selection) {
            this.alter("insert_row", selection.start.row);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireColumnSelection = [0, selected[1], this.countRows() - 1, selected[1]],
              columnSelected = entireColumnSelection.join(',') == selected.join(',');

            return selected[0] < 0 || this.countRows() >= this.getSettings().maxRows || columnSelected;
          }
        },
        {
          key: 'row_below',
          name: 'Insert row below',
          callback: function (key, selection) {
            this.alter("insert_row", selection.end.row + 1);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireColumnSelection = [0, selected[1], this.countRows() - 1, selected[1]],
              columnSelected = entireColumnSelection.join(',') == selected.join(',');

            return this.getSelected()[0] < 0 || this.countRows() >= this.getSettings().maxRows || columnSelected;
          }
        },
        ContextMenu.SEPARATOR,
        {
          key: 'col_left',
          name: 'Insert column on the left',
          callback: function (key, selection) {
            this.alter("insert_col", selection.start.col);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1],
              rowSelected = entireRowSelection.join(',') == selected.join(',');

            return this.getSelected()[1] < 0 || this.countCols() >= this.getSettings().maxCols || rowSelected;
          }
        },
        {
          key: 'col_right',
          name: 'Insert column on the right',
          callback: function (key, selection) {
            this.alter("insert_col", selection.end.col + 1);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1],
              rowSelected = entireRowSelection.join(',') == selected.join(',');

            return selected[1] < 0 || this.countCols() >= this.getSettings().maxCols || rowSelected;
          }
        },
        ContextMenu.SEPARATOR,
        {
          key: 'remove_row',
          name: 'Remove row',
          callback: function (key, selection) {
            var amount = selection.end.row - selection.start.row + 1;
            this.alter("remove_row", selection.start.row, amount);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireColumnSelection = [0, selected[1], this.countRows() - 1, selected[1]],
              columnSelected = entireColumnSelection.join(',') == selected.join(',');
            return (selected[0] < 0 || columnSelected);
          }
        },
        {
          key: 'remove_col',
          name: 'Remove column',
          callback: function (key, selection) {
            var amount = selection.end.col - selection.start.col + 1;
            this.alter("remove_col", selection.start.col, amount);
          },
          disabled: function () {
            var selected = this.getSelected(),
              entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1],
              rowSelected = entireRowSelection.join(',') == selected.join(',');
            return (selected[1] < 0 || rowSelected);
          }
        },
        ContextMenu.SEPARATOR,
        {
          key: 'undo',
          name: 'Undo',
          callback: function () {
            this.undo();
          },
          disabled: function () {
            return this.undoRedo && !this.undoRedo.isUndoAvailable();
          }
        },
        {
          key: 'redo',
          name: 'Redo',
          callback: function () {
            this.redo();
          },
          disabled: function () {
            return this.undoRedo && !this.undoRedo.isRedoAvailable();
          }
        },
        ContextMenu.SEPARATOR,
        {
          key: 'make_read_only',
          name: function () {
            var label = "Read only";
            var atLeastOneReadOnly = contextMenu.checkSelectionReadOnlyConsistency(this);
            if (atLeastOneReadOnly) {
              label = contextMenu.markSelected(label);
            }
            return label;
          },
          callback: function () {
            var atLeastOneReadOnly = contextMenu.checkSelectionReadOnlyConsistency(this);

            var that = this;
            this.getSelectedRange().forAll(function (r, c) {
              that.getCellMeta(r, c).readOnly = atLeastOneReadOnly ? false : true;
            });

            this.render();
          }
        },
        ContextMenu.SEPARATOR,
        {
          key: 'alignment',
          name: 'Alignment',
          submenu: {
            items: [
              {
                name: function () {
                  var label = "Left";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htLeft');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'horizontal', 'htLeft');
                },
                disabled: false
              },
              {
                name: function () {
                  var label = "Center";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htCenter');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'horizontal', 'htCenter');
                },
                disabled: false
              },
              {
                name: function () {
                  var label = "Right";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htRight');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'horizontal', 'htRight');
                },
                disabled: false
              },
              {
                name: function () {
                  var label = "Justify";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htJustify');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'horizontal', 'htJustify');
                },
                disabled: false
              },
              ContextMenu.SEPARATOR,
              {
                name: function () {
                  var label = "Top";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htTop');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'vertical', 'htTop');
                },
                disabled: false
              },
              {
                name: function () {
                  var label = "Middle";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htMiddle');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'vertical', 'htMiddle');
                },
                disabled: false
              },
              {
                name: function () {
                  var label = "Bottom";
                  var hasClass = contextMenu.checkSelectionAlignment(this, 'htBottom');

                  if (hasClass) {
                    label = contextMenu.markSelected(label);
                  }
                  return label;
                },
                callback: function () {
                  align.call(this, this.getSelectedRange(), 'vertical', 'htBottom');
                },
                disabled: false
              }
            ]
          }
        }
      ]
    };

    contextMenu.options = {};

    Handsontable.helper.extend(contextMenu.options, this.options);

    this.bindMouseEvents();

    this.markSelected = function (label) {
      return "<span class='selected'>" + String.fromCharCode(10003) + "</span>" + label; // workaround for https://github.com/handsontable/handsontable/issues/1946
    };

    this.checkSelectionAlignment = function (hot, className) {
      var hasAlignment = false;

      hot.getSelectedRange().forAll(function (r, c) {
        var metaClassName = hot.getCellMeta(r, c).className;
        if (metaClassName && metaClassName.indexOf(className) != -1) {
          hasAlignment = true;
          return false;
        }
      });

      return hasAlignment;
    };

		if(!this.instance.getSettings().allowInsertRow) {
      var rowAboveIndex = findIndexByKey(this.defaultOptions.items, 'row_above');
      this.defaultOptions.items.splice(rowAboveIndex,1);
      var rowBelowIndex = findIndexByKey(this.defaultOptions.items, 'row_above');
      this.defaultOptions.items.splice(rowBelowIndex,1);
      this.defaultOptions.items.splice(rowBelowIndex,1); // FOR SEPARATOR

		}

		if(!this.instance.getSettings().allowInsertColumn) {
      var colLeftIndex = findIndexByKey(this.defaultOptions.items, 'col_left');
      this.defaultOptions.items.splice(colLeftIndex,1);
      var colRightIndex = findIndexByKey(this.defaultOptions.items, 'col_right');
      this.defaultOptions.items.splice(colRightIndex,1);
      this.defaultOptions.items.splice(colRightIndex,1); // FOR SEPARATOR

    }

		var removeRow = false;
		var removeCol = false;
    var removeRowIndex, removeColumnIndex;

		if(!this.instance.getSettings().allowRemoveRow) {
      removeRowIndex = findIndexByKey(this.defaultOptions.items, 'remove_row');
      this.defaultOptions.items.splice(removeRowIndex,1);
			removeRow = true;
		}

		if(!this.instance.getSettings().allowRemoveColumn) {
      removeColumnIndex = findIndexByKey(this.defaultOptions.items, 'remove_col');
      this.defaultOptions.items.splice(removeColumnIndex,1);
      removeCol = true;
		}

		if (removeRow && removeCol) {
      this.defaultOptions.items.splice(removeColumnIndex,1); // SEPARATOR
		}

    this.checkSelectionReadOnlyConsistency = function (hot) {
      var atLeastOneReadOnly = false;

      hot.getSelectedRange().forAll(function (r, c) {
        if (hot.getCellMeta(r, c).readOnly) {
          atLeastOneReadOnly = true;
          return false; //breaks forAll
        }
      });

      return atLeastOneReadOnly;
    };

    Handsontable.hooks.run(instance, 'afterContextMenuDefaultOptions', this.defaultOptions);

  }

  /***
   * Create DOM instance of contextMenu
   * @param menuName
   * @param row
   * @return {*}
   */
  ContextMenu.prototype.createMenu = function (menuName, row) {
    if (menuName) {
      menuName = menuName.replace(/ /g, '_'); // replace all spaces in name
      menuName = 'htContextSubMenu_' + menuName;
    }

    var menu;
    if (menuName) {
      menu = document.querySelector('.htContextMenu.' + menuName);
    } else {
      menu = document.querySelector('.htContextMenu');
    }


    if (!menu) {
      menu = document.createElement('DIV');
      Handsontable.Dom.addClass(menu, 'htContextMenu');
      if (menuName) {
        Handsontable.Dom.addClass(menu, menuName);
      }
      document.getElementsByTagName('body')[0].appendChild(menu);
    }

    if (this.menus.indexOf(menu) < 0) {
      this.menus.push(menu);
      row = row || 0;
      this.triggerRows.push(row);
    }

    return menu;
  };

  ContextMenu.prototype.bindMouseEvents = function () {
    /* jshint ignore:start */
    function contextMenuOpenListener(event) {
      var settings = this.instance.getSettings();

      this.closeAll();

      event.preventDefault();
      Handsontable.helper.stopPropagation(event);

      var showRowHeaders = this.instance.getSettings().rowHeaders,
        showColHeaders = this.instance.getSettings().colHeaders;

      if (!(showRowHeaders || showColHeaders)) {
        if (event.target.nodeName != 'TD' && !(Handsontable.Dom.hasClass(event.target, 'current') && Handsontable.Dom.hasClass(event.target, 'wtBorder'))) {
          return;
        }
      } else if(showRowHeaders && showColHeaders) {

        // do nothing after right-click on corner header
        var containsCornerHeader = event.target.parentNode.querySelectorAll('.cornerHeader').length > 0;
        if (containsCornerHeader) {
          return;
        }
      }

      var menu = this.createMenu();
      var items = this.getItems(settings.contextMenu);

      this.show(menu, items);

      this.setMenuPosition(event, menu);

      this.eventManager.addEventListener(document.documentElement, 'mousedown', Handsontable.helper.proxy(ContextMenu.prototype.closeAll, this));
    }
    /* jshint ignore:end */
    var eventManager = Handsontable.eventManager(this.instance);

    eventManager.addEventListener(this.instance.rootElement, 'contextmenu', Handsontable.helper.proxy(contextMenuOpenListener, this));
  };

  ContextMenu.prototype.bindTableEvents = function () {
    this._afterScrollCallback = function () {};
    this.instance.addHook('afterScrollVertically', this._afterScrollCallback);
    this.instance.addHook('afterScrollHorizontally', this._afterScrollCallback);
  };

  ContextMenu.prototype.unbindTableEvents = function () {
    if (this._afterScrollCallback) {
      this.instance.removeHook('afterScrollVertically', this._afterScrollCallback);
      this.instance.removeHook('afterScrollHorizontally', this._afterScrollCallback);
      this._afterScrollCallback = null;
    }
  };

  ContextMenu.prototype.performAction = function (event, hot) {
    var contextMenu = this;

    var selectedItemIndex = hot.getSelected()[0];
    var selectedItem = hot.getData()[selectedItemIndex];

    if (selectedItem.disabled === true || (typeof selectedItem.disabled == 'function' && selectedItem.disabled.call(this.instance) === true)) {
      return;
    }

    if (!selectedItem.hasOwnProperty('submenu')) {
      if (typeof selectedItem.callback != 'function') {
        return;
      }
      var selRange = this.instance.getSelectedRange();
      var normalizedSelection = ContextMenu.utils.normalizeSelection(selRange);

      selectedItem.callback.call(this.instance, selectedItem.key, normalizedSelection, event);
      contextMenu.closeAll();
    }
  };

  ContextMenu.prototype.unbindMouseEvents = function () {
    this.eventManager.clear();
    var eventManager = Handsontable.eventManager(this.instance);
    eventManager.removeEventListener(this.instance.rootElement, 'contextmenu');
  };

  ContextMenu.prototype.show = function (menu, items) {
    var that = this;

    menu.removeAttribute('style');
    menu.style.display = 'block';

    var settings = {
      data: items,
      colHeaders: false,
      colWidths: [200],
      readOnly: true,
      copyPaste: false,
      columns: [
        {
          data: 'name',
          renderer: Handsontable.helper.proxy(this.renderer, this)
        }
      ],
      renderAllRows: true,
      beforeKeyDown: function (event) {
        that.onBeforeKeyDown(event, htContextMenu);
      },
      afterOnCellMouseOver: function (event, coords, TD) {
        that.onCellMouseOver(event, coords, TD, htContextMenu);
      }
    };

    var htContextMenu = new Handsontable(menu, settings);


    this.eventManager.removeEventListener(menu, 'mousedown');
    this.eventManager.addEventListener(menu,'mousedown', function (event) {
      that.performAction(event, htContextMenu);
    });

    this.bindTableEvents();
    htContextMenu.listen();

    this.htMenus[htContextMenu.guid] = htContextMenu;
  };

  ContextMenu.prototype.close = function (menu) {
    this.hide(menu);
    this.eventManager.clear();
    this.unbindTableEvents();
    this.instance.listen();
  };

  ContextMenu.prototype.closeAll = function () {
    while (this.menus.length > 0) {
      var menu = this.menus.pop();
      if (menu) {
        this.close(menu);
      }

    }
    this.triggerRows = [];
  };

  ContextMenu.prototype.closeLastOpenedSubMenu = function () {
    var menu = this.menus.pop();
    if (menu) {
      this.hide(menu);
    }

  };

  ContextMenu.prototype.hide = function (menu) {
    menu.style.display = 'none';
    var instance =this.htMenus[menu.id];

    instance.destroy();
    delete this.htMenus[menu.id];
  };

  ContextMenu.prototype.renderer = function (instance, TD, row, col, prop, value) {
    var contextMenu = this;
    var item = instance.getData()[row];
    var wrapper = document.createElement('DIV');

    if (typeof value === 'function') {
      value = value.call(this.instance);
    }

    Handsontable.Dom.empty(TD);
    TD.appendChild(wrapper);

    if (itemIsSeparator(item)) {
      Handsontable.Dom.addClass(TD, 'htSeparator');
    } else {
      Handsontable.Dom.fastInnerHTML(wrapper, value);
    }

    if (itemIsDisabled(item)) {
      Handsontable.Dom.addClass(TD, 'htDisabled');

      this.eventManager.addEventListener(wrapper, 'mouseenter', function () {
        instance.deselectCell();
      });

    } else {
      if (isSubMenu(item)) {
        Handsontable.Dom.addClass(TD, 'htSubmenu');


        this.eventManager.addEventListener(wrapper, 'mouseenter', function () {
          instance.selectCell(row, col);
        });

      } else {
        Handsontable.Dom.removeClass(TD, 'htSubmenu');
        Handsontable.Dom.removeClass(TD, 'htDisabled');

        this.eventManager.addEventListener(wrapper, 'mouseenter', function () {
          instance.selectCell(row, col);
        });
      }
    }


    function isSubMenu(item) {
      return item.hasOwnProperty('submenu');
    }

    function itemIsSeparator(item) {
      return new RegExp(ContextMenu.SEPARATOR.name, 'i').test(item.name);
    }

    function itemIsDisabled(item) {
      return item.disabled === true || (typeof item.disabled == 'function' && item.disabled.call(contextMenu.instance) === true);
    }


  };

  ContextMenu.prototype.onCellMouseOver = function (event, coords, TD, hot) {
    var menusLength = this.menus.length;

    if (menusLength > 0) {
      var lastMenu = this.menus[menusLength - 1];
      if (lastMenu.id != hot.guid) {
        this.closeLastOpenedSubMenu();
      }
    } else {
      this.closeLastOpenedSubMenu();
    }

    if (TD.className.indexOf('htSubmenu') != -1) {
      var selectedItem = hot.getData()[coords.row];
      var items = this.getItems(selectedItem.submenu);

      var subMenu = this.createMenu(selectedItem.name, coords.row);
      var tdCoords = TD.getBoundingClientRect();

      this.show(subMenu, items);
      this.setSubMenuPosition(tdCoords, subMenu);

    }
  };

  ContextMenu.prototype.onBeforeKeyDown = function (event, instance) {

    Handsontable.Dom.enableImmediatePropagation(event);
    var contextMenu = this;

    var selection = instance.getSelected();

    switch (event.keyCode) {

      case Handsontable.helper.keyCode.ESCAPE:
        contextMenu.closeAll();
        event.preventDefault();
        event.stopImmediatePropagation();
        break;

      case Handsontable.helper.keyCode.ENTER:
        if (selection) {
          contextMenu.performAction(event, instance);
        }
        break;

      case Handsontable.helper.keyCode.ARROW_DOWN:

        if (!selection) {

          selectFirstCell(instance, contextMenu);

        } else {

          selectNextCell(selection[0], selection[1], instance, contextMenu);

        }

        event.preventDefault();
        event.stopImmediatePropagation();

        break;

      case Handsontable.helper.keyCode.ARROW_UP:
        if (!selection) {

          selectLastCell(instance, contextMenu);

        } else {

          selectPrevCell(selection[0], selection[1], instance, contextMenu);

        }

        event.preventDefault();
        event.stopImmediatePropagation();

        break;
      case Handsontable.helper.keyCode.ARROW_RIGHT:
        if (selection) {
          var row = selection[0];
          var cell = instance.getCell(selection[0], 0);

          if (ContextMenu.utils.hasSubMenu(cell)) {
            openSubMenu(instance, contextMenu, cell, row);
          }
        }
        event.preventDefault();
        event.stopImmediatePropagation();

        break;

      case Handsontable.helper.keyCode.ARROW_LEFT:
        if (selection) {

          if (instance.rootElement.className.indexOf('htContextSubMenu_') != -1) {
            contextMenu.closeLastOpenedSubMenu();
            var index = contextMenu.menus.length;

            if (index > 0) {
              var menu = contextMenu.menus[index - 1];

              var triggerRow = contextMenu.triggerRows.pop();
              instance = this.htMenus[menu.id];
              instance.selectCell(triggerRow, 0);
            }
          }
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        break;
    }

    function selectFirstCell(instance) {

      var firstCell = instance.getCell(0, 0);

      if (ContextMenu.utils.isSeparator(firstCell) || ContextMenu.utils.isDisabled(firstCell)) {
        selectNextCell(0, 0, instance);
      } else {
        instance.selectCell(0, 0);
      }

    }


    function selectLastCell(instance) {

      var lastRow = instance.countRows() - 1;
      var lastCell = instance.getCell(lastRow, 0);

      if (ContextMenu.utils.isSeparator(lastCell) || ContextMenu.utils.isDisabled(lastCell)) {
        selectPrevCell(lastRow, 0, instance);
      } else {
        instance.selectCell(lastRow, 0);
      }

    }

    function selectNextCell(row, col, instance) {
      var nextRow = row + 1;
      var nextCell = nextRow < instance.countRows() ? instance.getCell(nextRow, col) : null;

      if (!nextCell) {
        return;
      }

      if (ContextMenu.utils.isSeparator(nextCell) || ContextMenu.utils.isDisabled(nextCell)) {
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

      if (ContextMenu.utils.isSeparator(prevCell) || ContextMenu.utils.isDisabled(prevCell)) {
        selectPrevCell(prevRow, col, instance);
      } else {
        instance.selectCell(prevRow, col);
      }

    }

    function openSubMenu(instance, contextMenu, cell, row) {
      var selectedItem = instance.getData()[row];
      var items = contextMenu.getItems(selectedItem.submenu);
      var subMenu = contextMenu.createMenu(selectedItem.name, row);
      var coords = cell.getBoundingClientRect();
      var subMenuInstance = contextMenu.show(subMenu, items);

      contextMenu.setSubMenuPosition(coords, subMenu);
      subMenuInstance.selectCell(0, 0);
    }
  };

  function findByKey(items, key) {
    for (var i = 0, ilen = items.length; i < ilen; i++) {
      if (items[i].key === key) {
        return items[i];
      }
    }
  }

  function findIndexByKey(items, key) {
    for (var i = 0, ilen = items.length; i < ilen; i++) {
      if (items[i].key === key) {
        return i;
      }
    }
  }

  ContextMenu.prototype.getItems = function (items) {
    var menu, item;

    function ContextMenuItem(rawItem) {
      if (typeof rawItem == 'string') {
        this.name = rawItem;
      } else {
        Handsontable.helper.extend(this, rawItem);
      }
    }

    ContextMenuItem.prototype = items;

    if (items && items.items) {
      items = items.items;
    }

    if (items === true) {
      items = this.defaultOptions.items;
    }

    if (1 == 1) {
      menu = [];
      for (var key in items) {
        if (items.hasOwnProperty(key)) {
          if (typeof items[key] === 'string') {
            item = findByKey(this.defaultOptions.items, items[key]);
          }
          else {
            item = findByKey(this.defaultOptions.items, key);
          }
          if (!item) {
            item = items[key];
          }
          item = new ContextMenuItem(item);
          if (typeof items[key] === 'object') {
            Handsontable.helper.extend(item, items[key]);
          }
          if (!item.key) {
            item.key = key;
          }
          menu.push(item);
        }
      }
    }

    return menu;
  };

  ContextMenu.prototype.setSubMenuPosition = function (coords, menu) {
    var scrollTop = Handsontable.Dom.getWindowScrollTop();
    var scrollLeft = Handsontable.Dom.getWindowScrollLeft();

    var cursor = {
      top: scrollTop + coords.top,
      topRelative: coords.top,
      left: coords.left,
      leftRelative: coords.left - scrollLeft,
      scrollTop: scrollTop,
      scrollLeft: scrollLeft,
      cellHeight: coords.height,
      cellWidth: coords.width
    };

    if (this.menuFitsBelowCursor(cursor, menu, document.body.clientWidth)) {
      this.positionMenuBelowCursor(cursor, menu, true);
    } else {
      if (this.menuFitsAboveCursor(cursor, menu)) {
        this.positionMenuAboveCursor(cursor, menu, true);
      } else {
        this.positionMenuBelowCursor(cursor, menu, true);
      }
    }

    if (this.menuFitsOnRightOfCursor(cursor, menu, document.body.clientWidth)) {
      this.positionMenuOnRightOfCursor(cursor, menu, true);
    } else {
      this.positionMenuOnLeftOfCursor(cursor, menu, true);
    }
  };

  ContextMenu.prototype.setMenuPosition = function (event, menu) {
    // for ie8
    // http://msdn.microsoft.com/en-us/library/ie/ff974655(v=vs.85).aspx
    var scrollTop = Handsontable.Dom.getWindowScrollTop();
    var scrollLeft = Handsontable.Dom.getWindowScrollLeft();
    var cursorY = event.pageY || (event.clientY + scrollTop);
    var cursorX = event.pageX || (event.clientX + scrollLeft);

    var cursor = {
      top: cursorY,
      topRelative: cursorY - scrollTop,
      left: cursorX,
      leftRelative: cursorX - scrollLeft,
      scrollTop: scrollTop,
      scrollLeft: scrollLeft,
      cellHeight: event.target.clientHeight,
      cellWidth: event.target.clientWidth
    };

    if (this.menuFitsBelowCursor(cursor, menu, document.body.clientHeight)) {
      this.positionMenuBelowCursor(cursor, menu);
    } else {
      if (this.menuFitsAboveCursor(cursor, menu)) {
        this.positionMenuAboveCursor(cursor, menu);
      } else {
        this.positionMenuBelowCursor(cursor, menu);
      }
    }

    if (this.menuFitsOnRightOfCursor(cursor, menu, document.body.clientWidth)) {
      this.positionMenuOnRightOfCursor(cursor, menu);
    } else {
      this.positionMenuOnLeftOfCursor(cursor, menu);
    }

  };

  ContextMenu.prototype.menuFitsAboveCursor = function (cursor, menu) {
    return cursor.topRelative >= menu.offsetHeight;
  };

  ContextMenu.prototype.menuFitsBelowCursor = function (cursor, menu, viewportHeight) {
    return cursor.topRelative + menu.offsetHeight <= viewportHeight;
  };

  ContextMenu.prototype.menuFitsOnRightOfCursor = function (cursor, menu, viewportHeight) {
    return cursor.leftRelative + menu.offsetWidth <= viewportHeight;
  };

  ContextMenu.prototype.positionMenuBelowCursor = function (cursor, menu) {

    menu.style.top = cursor.top + 'px';
  };

  ContextMenu.prototype.positionMenuAboveCursor = function (cursor, menu, subMenu) {
    if (subMenu) {
      menu.style.top = (cursor.top + cursor.cellHeight - menu.offsetHeight) + 'px';
    } else {
      menu.style.top = (cursor.top - menu.offsetHeight) + 'px';
    }
  };

  ContextMenu.prototype.positionMenuOnRightOfCursor = function (cursor, menu, subMenu) {
    if (subMenu) {
      menu.style.left = 1 + cursor.left + cursor.cellWidth + 'px';
    } else {
      menu.style.left = 1 + cursor.left + 'px';
    }
  };

  ContextMenu.prototype.positionMenuOnLeftOfCursor = function (cursor, menu, subMenu) {
    if (subMenu) {
      menu.style.left = (cursor.left - menu.offsetWidth) + 'px';
    } else {
      menu.style.left = (cursor.left - menu.offsetWidth) + 'px';
    }
  };

  ContextMenu.utils = {};

  ContextMenu.utils.normalizeSelection = function (selRange) {
    return {
      start: selRange.getTopLeftCorner(),
      end: selRange.getBottomRightCorner()
    };
  };

  ContextMenu.utils.isSeparator = function (cell) {
    return Handsontable.Dom.hasClass(cell, 'htSeparator');
  };

  ContextMenu.utils.hasSubMenu = function (cell) {
    return Handsontable.Dom.hasClass(cell, 'htSubmenu');
  };

  ContextMenu.utils.isDisabled = function (cell) {
    return Handsontable.Dom.hasClass(cell, 'htDisabled');
  };

  ContextMenu.prototype.enable = function () {
    if (!this.enabled) {
      this.enabled = true;
      this.bindMouseEvents();
    }
  };

  ContextMenu.prototype.disable = function () {
    if (this.enabled) {
      this.enabled = false;
      this.closeAll();
      this.unbindMouseEvents();
      this.unbindTableEvents();
    }
  };

  ContextMenu.prototype.destroy = function () {
    this.closeAll();
    while (this.menus.length > 0) {
      var menu = this.menus.pop();
      this.triggerRows.pop();
      if (menu) {
        this.close(menu);
        if (!this.isMenuEnabledByOtherHotInstance()) {
          this.removeMenu(menu);
        }
      }
    }

    this.unbindMouseEvents();
    this.unbindTableEvents();

  };

  ContextMenu.prototype.isMenuEnabledByOtherHotInstance = function () {
    var hotContainers = document.querySelectorAll('.handsontable');
    var menuEnabled = false;

    for (var i = 0, len = hotContainers.length; i < len; i++) {
      var instance = this.htMenus[hotContainers[i].id];
      if (instance && instance.getSettings().contextMenu) {
        menuEnabled = true;
        break;
      }
    }

    return menuEnabled;
  };

  ContextMenu.prototype.removeMenu = function (menu) {
    if (menu.parentNode) {
      this.menu.parentNode.removeChild(menu);
    }
  };

  ContextMenu.prototype.align = function(range, type, alignment) {
    align.call(this, range, type, alignment);
  };

  ContextMenu.SEPARATOR = {name: "---------"};

  function updateHeight() {
    /* jshint ignore:start */
    if (this.rootElement.className.indexOf('htContextMenu')) {
      return;
    }

    var realSeparatorHeight = 0,
      realEntrySize = 0,
      dataSize = this.getSettings().data.length;

    for (var i = 0; i < dataSize; i++) {
      if (this.getSettings().data[i].name == ContextMenu.SEPARATOR.name) {
        realSeparatorHeight += 2;
      } else {
        realEntrySize += 26;
      }
    }

    this.view.wt.wtScrollbars.vertical.fixedContainer.style.height = realEntrySize + realSeparatorHeight + "px";
    /* jshint ignore:end */
  }

  function init() {
    /* jshint ignore:start */
    var instance = this;
    /* jshint ignore:end */
    var contextMenuSetting = instance.getSettings().contextMenu;
    var customOptions = Handsontable.helper.isObject(contextMenuSetting) ? contextMenuSetting : {};

    if (contextMenuSetting) {
      if (!instance.contextMenu) {
        instance.contextMenu = new ContextMenu(instance, customOptions);
      }
      instance.contextMenu.enable();
    } else if (instance.contextMenu) {
      instance.contextMenu.destroy();
      delete instance.contextMenu;
    }
  }

  Handsontable.hooks.add('afterInit', init);
  Handsontable.hooks.add('afterUpdateSettings', init);
  Handsontable.hooks.add('afterInit', updateHeight);

  Handsontable.PluginHooks.register('afterContextMenuDefaultOptions');

  Handsontable.ContextMenu = ContextMenu;

})(Handsontable);

function Comments(instance) {

  var eventManager = Handsontable.eventManager(instance),
    doSaveComment = function (row, col, comment, instance) {
      instance.setCellMeta(row, col, 'comment', comment);
      instance.render();
    },
    saveComment = function (range, comment, instance) {
		 //LIKE IN EXCEL (TOP LEFT CELL)
      doSaveComment(range.from.row, range.from.col, comment, instance);
    },
    hideCommentTextArea = function () {
      var commentBox = createCommentBox();
      commentBox.style.display = 'none';
      commentBox.value = '';
    },
    bindMouseEvent = function (range) {

			function commentsListener(event) {
        eventManager.removeEventListener(document, 'mouseover');
        if (!(event.target.className == 'htCommentTextArea' || event.target.innerHTML.indexOf('Comment') != -1)) {
          var value = document.querySelector('.htCommentTextArea').value;
          if (value.trim().length > 1) {
            saveComment(range, value, instance);
          }
		      unBindMouseEvent();
          hideCommentTextArea();
        }
      }

      eventManager.addEventListener(document, 'mousedown',Handsontable.helper.proxy(commentsListener));
    },
    unBindMouseEvent = function () {
      eventManager.removeEventListener(document, 'mousedown');
      eventManager.addEventListener(document, 'mousedown', Handsontable.helper.proxy(commentsMouseOverListener));
    },
    placeCommentBox = function (range, commentBox) {
      var TD = instance.view.wt.wtTable.getCell(range.from),
        offset = Handsontable.Dom.offset(TD),
        lastColWidth = instance.getColWidth(range.from.col);

      commentBox.style.position = 'absolute';
      commentBox.style.left = offset.left + lastColWidth + 'px';
      commentBox.style.top = offset.top + 'px';
      commentBox.style.zIndex = 2;
      bindMouseEvent(range, commentBox);
    },
    createCommentBox = function (value) {
      var comments = document.querySelector('.htComments');

      if (!comments) {
        comments = document.createElement('DIV');

        var textArea = document.createElement('TEXTAREA');
        Handsontable.Dom.addClass(textArea, 'htCommentTextArea');
        comments.appendChild(textArea);

        Handsontable.Dom.addClass(comments, 'htComments');
        document.getElementsByTagName('body')[0].appendChild(comments);
      }

			value = value ||'';

      document.querySelector('.htCommentTextArea').value = value;

      //var tA = document.getElementsByClassName('htCommentTextArea')[0];
      //tA.focus();
      return comments;
    },
    commentsMouseOverListener = function (event) {
        if(event.target.className.indexOf('htCommentCell') != -1) {
						unBindMouseEvent();
            var coords = instance.view.wt.wtTable.getCoords(event.target);
            var range = {
                from: new WalkontableCellCoords(coords.row, coords.col)
            };

            Handsontable.Comments.showComment(range);
        }
        else if(event.target.className !='htCommentTextArea'){
            hideCommentTextArea();
        }
    };

  return {
    init: function () {
      eventManager.addEventListener(document, 'mouseover', Handsontable.helper.proxy(commentsMouseOverListener));
    },
    showComment: function (range) {
			var meta = instance.getCellMeta(range.from.row, range.from.col),
        value = '';

      if (meta.comment) {
        value = meta.comment;
      }
      var commentBox = createCommentBox(value);
      commentBox.style.display = 'block';
      placeCommentBox(range, commentBox);
    },
    removeComment: function (row, col) {
      instance.removeCellMeta(row, col, 'comment');
      instance.render();
    },
    checkSelectionCommentsConsistency : function () {
      var hasComment = false;
      // IN EXCEL THERE IS COMMENT ONLY FOR TOP LEFT CELL IN SELECTION
      var cell = instance.getSelectedRange().from;

      if(instance.getCellMeta(cell.row,cell.col).comment) {
        hasComment = true;
      }
      return hasComment;
    }


  };
}


var init = function () {
    var instance = this;
    var commentsSetting = instance.getSettings().comments;

    if (commentsSetting) {
      Handsontable.Comments = new Comments(instance);
        Handsontable.Comments.init();
    }
  },
  afterRenderer = function (TD, row, col, prop, value, cellProperties) {
    if(cellProperties.comment) {
      Handsontable.Dom.addClass(TD, cellProperties.commentedCellClassName);
    }
  },
  addCommentsActionsToContextMenu = function (defaultOptions) {
    var instance = this;
    if (!instance.getSettings().comments) {
      return;
    }

    defaultOptions.items.push(Handsontable.ContextMenu.SEPARATOR);

    defaultOptions.items.push({
      key: 'commentsAddEdit',
      name: function () {
        var hasComment = Handsontable.Comments.checkSelectionCommentsConsistency();
        return hasComment ? "Edit Comment" : "Add Comment";

      },
      callback: function (key, selection, event) {
          Handsontable.Comments.showComment(this.getSelectedRange());
      },
      disabled: function () {
        return false;
      }
    });

    defaultOptions.items.push({
      key: 'commentsRemove',
      name: function () {
        return "Delete Comment";
      },
      callback: function (key, selection, event) {
        Handsontable.Comments.removeComment(selection.start.row, selection.start.col);
      },
      disabled: function () {
        var hasComment = Handsontable.Comments.checkSelectionCommentsConsistency();
        return !hasComment;
      }
    });
  };

Handsontable.hooks.add('beforeInit', init);
Handsontable.hooks.add('afterContextMenuDefaultOptions', addCommentsActionsToContextMenu);
Handsontable.hooks.add('afterRenderer', afterRenderer);


/**
 * HandsontableManualColumnMove
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired position of the column
 * - guide - the helper guide that shows the desired position as a vertical guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowMove.js
 * @constructor
 */
(function (Handsontable) {
function HandsontableManualColumnMove() {
  var startCol
    , endCol
    , startX
    , startOffset
    , currentCol
    , instance
    , currentTH
    , handle = document.createElement('DIV')
    , guide = document.createElement('DIV')
    , eventManager = Handsontable.eventManager(this);

  handle.className = 'manualColumnMover';
  guide.className = 'manualColumnMoverGuide';

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

  function setupHandlePosition(TH) {
    instance = this;
    currentTH = TH;

    var col = this.view.wt.wtTable.getCoords(TH).col; //getCoords returns WalkontableCellCoords
    if (col >= 0) { //if not row header
      currentCol = col;
      var box = currentTH.getBoundingClientRect();
      startOffset = box.left;
      handle.style.top = box.top + 'px';
      handle.style.left = startOffset + 'px';
      instance.rootElement.appendChild(handle);
    }
  }

  function refreshHandlePosition(TH, delta) {
    var box = TH.getBoundingClientRect();
    var handleWidth = 6;
    if (delta > 0) {
      handle.style.left = (box.left + box.width - handleWidth) + 'px';
    }
    else {
      handle.style.left = box.left + 'px';
    }
  }

  function setupGuidePosition() {
    var instance = this;
    Handsontable.Dom.addClass(handle, 'active');
    Handsontable.Dom.addClass(guide, 'active');
    var box = currentTH.getBoundingClientRect();
    guide.style.width = box.width + 'px';
    guide.style.height = instance.view.maximumVisibleElementHeight(0) + 'px';
    guide.style.top = handle.style.top;
    guide.style.left = startOffset + 'px';
    instance.rootElement.appendChild(guide);
  }

  function refreshGuidePosition(diff) {
    guide.style.left = startOffset + diff + 'px';
  }

  function hideHandleAndGuide() {
    Handsontable.Dom.removeClass(handle, 'active');
    Handsontable.Dom.removeClass(guide, 'active');
  }

  var checkColumnHeader = function (element) {
    if (element.tagName != 'BODY') {
      if (element.parentNode.tagName == 'THEAD') {
        return true;
      } else {
        element = element.parentNode;
        return checkColumnHeader(element);
      }
    }
    return false;
  };

  var getTHFromTargetElement = function (element) {
    if (element.tagName != 'TABLE') {
      if (element.tagName == 'TH') {
        return element;
      } else {
        return getTHFromTargetElement(element.parentNode);
      }
    }
    return null;
  };

  var bindEvents = function () {

    var instance = this;
    var pressed;

    eventManager.addEventListener(instance.rootElement,'mouseover',function (e) {
        if (checkColumnHeader(e.target)){
          var th = getTHFromTargetElement(e.target);
          if (th) {
            if (pressed) {
              var col = instance.view.wt.wtTable.getCoords(th).col;
        		if(col >= 0) { //not TH above row header
          			endCol = col;
          			refreshHandlePosition(e.target, endCol - startCol);
        		}
            }
            else {
              setupHandlePosition.call(instance, th);
            }
          }
        }
    });

    eventManager.addEventListener(instance.rootElement,'mousedown', function (e) {
      if (Handsontable.Dom.hasClass(e.target, 'manualColumnMover')){
        startX = Handsontable.helper.pageX(e);
        setupGuidePosition.call(instance);
        pressed = instance;

        startCol = currentCol;
        endCol = currentCol;
      }
    });

    eventManager.addEventListener(window,'mousemove',function (e) {
      if (pressed) {
        refreshGuidePosition(Handsontable.helper.pageX(e) - startX);
      }
    });


    eventManager.addEventListener(window,'mouseup',function (e) {
      if (pressed) {
        hideHandleAndGuide();
        pressed = false;

        createPositionData(instance.manualColumnPositions, instance.countCols());
        instance.manualColumnPositions.splice(endCol, 0, instance.manualColumnPositions.splice(startCol, 1)[0]);

        instance.forceFullRender = true;
        instance.view.render(); //updates all

        saveManualColumnPositions.call(instance);

        Handsontable.hooks.run(instance, 'afterColumnMove', startCol, endCol);

        setupHandlePosition.call(instance, currentTH);
      }
    });

    instance.addHook('afterDestroy', unbindEvents);
  };

  var unbindEvents = function(){
    eventManager.clear();
  };

  var createPositionData = function (positionArr, len) {
    if (positionArr.length < len) {
      for (var i = positionArr.length; i < len; i++) {
        positionArr[i] = i;
      }
    }
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
      } else if (Array.isArray(initialManualColumnPositions)) {
        this.manualColumnPositions = initialManualColumnPositions;
      } else {
        this.manualColumnPositions = [];
      }

      if (source == 'afterInit') {

        // update plugin usages count for manualColumnPositions
        if (typeof instance.manualColumnPositionsPluginUsages != 'undefined') {
          instance.manualColumnPositionsPluginUsages.push('manualColumnMove');
        } else {
          instance.manualColumnPositionsPluginUsages = ['manualColumnMove'];
        }

        bindEvents.call(this);
        if (this.manualColumnPositions.length > 0) {
          this.forceFullRender = true;
          this.render();
        }
      }

    } else {
      var pluginUsagesIndex = instance.manualColumnPositionsPluginUsages ? instance.manualColumnPositionsPluginUsages.indexOf('manualColumnMove') : -1;
      if (pluginUsagesIndex > -1) {
        unbindEvents.call(this);
        this.manualColumnPositions = [];
        instance.manualColumnPositionsPluginUsages[pluginUsagesIndex] = void 0;
      }
    }
  };

  this.modifyCol = function (col) {
    //TODO test performance: http://jsperf.com/object-wrapper-vs-primitive/2
    if (this.getSettings().manualColumnMove) {
      if (typeof this.manualColumnPositions[col] === 'undefined') {
        createPositionData(this.manualColumnPositions, col + 1);
      }
      return this.manualColumnPositions[col];
    }
    return col;
  };

  // need to reconstruct manualcolpositions after removing columns
  this.afterRemoveCol = function (index, amount) {
    if (!this.getSettings().manualColumnMove) {
      return;
    }

    var rmindx,
        colpos = this.manualColumnPositions;

      // We have removed columns, we also need to remove the indicies from manual column array
      rmindx = colpos.splice(index, amount);

      // We need to remap manualColPositions so it remains constant linear from 0->ncols
      colpos = colpos.map(function (colpos) {
        var i, newpos = colpos;

       for (i = 0; i < rmindx.length; i++) {
         if (colpos > rmindx[i]) {
           newpos--;
         }
       }

       return newpos;
     });

      this.manualColumnPositions = colpos;
    };

    // need to reconstruct manualcolpositions after adding columns
    this.afterCreateCol = function (index, amount) {
      if (!this.getSettings().manualColumnMove) {
        return;
      }

      var colpos = this.manualColumnPositions;
      if (!colpos.length) {
        return;
      }

      var addindx = [];
      for (var i = 0; i < amount; i++) {
        addindx.push(index + i);
      }

      if (index >= colpos.length) {
        colpos.concat(addindx);
      }
      else {
        // We need to remap manualColPositions so it remains constant linear from 0->ncols
        colpos = colpos.map(function (colpos) {
          return (colpos >= index) ? (colpos + amount) : colpos;
        });

        // We have added columns, we also need to add new indicies to manualcolumn position array
        colpos.splice.apply(colpos, [index, 0].concat(addindx));
      }

      this.manualColumnPositions = colpos;
    };
}
var htManualColumnMove = new HandsontableManualColumnMove();

Handsontable.hooks.add('beforeInit', htManualColumnMove.beforeInit);
Handsontable.hooks.add('afterInit', function () {
  htManualColumnMove.init.call(this, 'afterInit');
});

Handsontable.hooks.add('afterUpdateSettings', function () {
  htManualColumnMove.init.call(this, 'afterUpdateSettings');
});
Handsontable.hooks.add('modifyCol', htManualColumnMove.modifyCol);

Handsontable.hooks.add('afterRemoveCol', htManualColumnMove.afterRemoveCol);
Handsontable.hooks.add('afterCreateCol', htManualColumnMove.afterCreateCol);
Handsontable.hooks.register('afterColumnMove');

})(Handsontable);



/**
 * HandsontableManualColumnResize
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired width of the column
 * - guide - the helper guide that shows the desired width as a vertical guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowResize.js
 * @constructor
 */
(function (Handsontable) {
  function HandsontableManualColumnResize() {
    var currentTH
      , currentCol
      , currentWidth
      , instance
      , newSize
      , startX
      , startWidth
      , startOffset
      , handle = document.createElement('DIV')
      , guide = document.createElement('DIV')
      , eventManager = Handsontable.eventManager(this);


    handle.className = 'manualColumnResizer';
    guide.className = 'manualColumnResizerGuide';

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

    function setupHandlePosition(TH) {
      instance = this;
      currentTH = TH;

      var col = this.view.wt.wtTable.getCoords(TH).col; //getCoords returns WalkontableCellCoords
      if (col >= 0) { //if not row header
        currentCol = col;
        var box = currentTH.getBoundingClientRect();
        startOffset = box.left - 6;
        startWidth = parseInt(box.width, 10);
        handle.style.top = box.top + 'px';
        handle.style.left = startOffset + startWidth + 'px';
        instance.rootElement.appendChild(handle);
      }
    }

    function refreshHandlePosition() {
      handle.style.left = startOffset + currentWidth + 'px';
    }

    function setupGuidePosition() {
      var instance = this;
      Handsontable.Dom.addClass(handle, 'active');
      Handsontable.Dom.addClass(guide, 'active');
      guide.style.top = handle.style.top;
      guide.style.left = handle.style.left;
      guide.style.height = instance.view.maximumVisibleElementHeight(0) + 'px';
      instance.rootElement.appendChild(guide);
    }

    function refreshGuidePosition() {
      guide.style.left = handle.style.left;
    }

    function hideHandleAndGuide() {
      Handsontable.Dom.removeClass(handle, 'active');
      Handsontable.Dom.removeClass(guide, 'active');
    }

    var checkColumnHeader = function (element) {
      if (element.tagName != 'BODY') {
        if (element.parentNode.tagName == 'THEAD') {
          return true;
        } else {
          element = element.parentNode;
          return checkColumnHeader(element);
        }
      }
      return false;
    };

    var getTHFromTargetElement = function (element) {
      if (element.tagName != 'TABLE') {
        if (element.tagName == 'TH') {
          return element;
        } else {
          return getTHFromTargetElement(element.parentNode);
        }
      }
      return null;
    };

    var bindEvents = function () {
      var instance = this;
      var pressed;
      var dblclick = 0;
      var autoresizeTimeout = null;

      eventManager.addEventListener(instance.rootElement, 'mouseover', function (e) {
        if (checkColumnHeader(e.target)) {
          var th = getTHFromTargetElement(e.target);
          if (th) {
            if (!pressed) {
              setupHandlePosition.call(instance, th);
            }
          }
        }
      });

      eventManager.addEventListener(instance.rootElement, 'mousedown', function (e) {
        if (Handsontable.Dom.hasClass(e.target, 'manualColumnResizer')) {
          setupGuidePosition.call(instance);
          pressed = instance;

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
            instance._registerTimeout(autoresizeTimeout);
          }
          dblclick++;

          startX = Handsontable.helper.pageX(e);
          newSize = startWidth;
        }
      });

      eventManager.addEventListener(window, 'mousemove', function (e) {
        if (pressed) {
          currentWidth = startWidth + (Handsontable.helper.pageX(e) - startX);
          newSize = setManualSize(currentCol, currentWidth); //save col width
          refreshHandlePosition();
          refreshGuidePosition();
        }
      });

      eventManager.addEventListener(window, 'mouseup', function () {
        if (pressed) {
          hideHandleAndGuide();
          pressed = false;

          if (newSize != startWidth) {
            instance.forceFullRender = true;
            instance.view.render(); //updates all

            saveManualColumnWidths.call(instance);

            Handsontable.hooks.run(instance, 'afterColumnResize', currentCol, newSize);
          }

          setupHandlePosition.call(instance, currentTH);
        }
      });

      instance.addHook('afterDestroy', unbindEvents);
    };

    var unbindEvents = function () {
      eventManager.clear();
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

        // update plugin usages count for manualColumnPositions
        if (typeof instance.manualColumnWidthsPluginUsages != 'undefined') {
          instance.manualColumnWidthsPluginUsages.push('manualColumnResize');
        } else {
          instance.manualColumnWidthsPluginUsages = ['manualColumnResize'];
        }

        if (typeof loadedManualColumnWidths != 'undefined') {
          this.manualColumnWidths = loadedManualColumnWidths;
        } else if (Array.isArray(initialColumnWidths)) {
          this.manualColumnWidths = initialColumnWidths;
        } else {
          this.manualColumnWidths = [];
        }

        if (source == 'afterInit') {
          bindEvents.call(this);
          if (this.manualColumnWidths.length > 0) {
            this.forceFullRender = true;
            this.render();
          }
        }
      }
      else {
        var pluginUsagesIndex = instance.manualColumnWidthsPluginUsages ? instance.manualColumnWidthsPluginUsages.indexOf('manualColumnResize') : -1;
        if (pluginUsagesIndex > -1) {
          unbindEvents.call(this);
          this.manualColumnWidths = [];
        }
      }
    };


    var setManualSize = function (col, width) {
      width = Math.max(width, 20);

      /**
       *  We need to run col through modifyCol hook, in case the order of displayed columns is different than the order
       *  in data source. For instance, this order can be modified by manualColumnMove plugin.
       */
      col = Handsontable.hooks.run(instance, 'modifyCol', col);
      instance.manualColumnWidths[col] = width;

      return width;
    };

    this.modifyColWidth = function (width, col) {
      col = this.runHooks('modifyCol', col);

      if (this.getSettings().manualColumnResize && this.manualColumnWidths[col]) {
        return this.manualColumnWidths[col];
      }

      return width;
    };
  }

  var htManualColumnResize = new HandsontableManualColumnResize();

  Handsontable.hooks.add('beforeInit', htManualColumnResize.beforeInit);
  Handsontable.hooks.add('afterInit', function () {
    htManualColumnResize.init.call(this, 'afterInit');
  });
  Handsontable.hooks.add('afterUpdateSettings', function () {
    htManualColumnResize.init.call(this, 'afterUpdateSettings');
  });
  Handsontable.hooks.add('modifyColWidth', htManualColumnResize.modifyColWidth);

  Handsontable.hooks.register('afterColumnResize');

})(Handsontable);

/**
 * HandsontableManualRowResize
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired height of the row
 * - guide - the helper guide that shows the desired height as a horizontal guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowResize.js
 * @constructor
 */
(function (Handsontable) {
  function HandsontableManualRowResize() {

    var currentTH
      , currentRow
      , currentHeight
      , instance
      , newSize
      , startY
      , startHeight
      , startOffset
      , handle = document.createElement('DIV')
      , guide = document.createElement('DIV')
      , eventManager = Handsontable.eventManager(this);

    handle.className = 'manualRowResizer';
    guide.className = 'manualRowResizerGuide';

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

    function setupHandlePosition(TH) {
      instance = this;
      currentTH = TH;

      var row = this.view.wt.wtTable.getCoords(TH).row; //getCoords returns WalkontableCellCoords
      if (row >= 0) { //if not col header
        currentRow = row;
        var box = currentTH.getBoundingClientRect();
        startOffset = box.top - 6;
        startHeight = parseInt(box.height, 10);
        handle.style.left = box.left + 'px';
        handle.style.top = startOffset + startHeight + 'px';
        instance.rootElement.appendChild(handle);
      }
    }

    function refreshHandlePosition() {
      handle.style.top = startOffset + currentHeight + 'px';
    }

    function setupGuidePosition() {
      var instance = this;
      Handsontable.Dom.addClass(handle, 'active');
      Handsontable.Dom.addClass(guide, 'active');
      guide.style.top = handle.style.top;
      guide.style.left = handle.style.left;
      guide.style.width = instance.view.maximumVisibleElementWidth(0) + 'px';
      instance.rootElement.appendChild(guide);
    }

    function refreshGuidePosition() {
      guide.style.top = handle.style.top;
    }

    function hideHandleAndGuide() {
      Handsontable.Dom.removeClass(handle, 'active');
      Handsontable.Dom.removeClass(guide, 'active');
    }

    var checkRowHeader = function (element) {
      if (element.tagName != 'BODY') {
        if (element.parentNode.tagName == 'TBODY') {
          return true;
        } else {
          element = element.parentNode;
          return checkRowHeader(element);
        }
      }
      return false;
    };

    var getTHFromTargetElement = function (element) {
      if (element.tagName != 'TABLE') {
        if (element.tagName == 'TH') {
          return element;
        } else {
          return getTHFromTargetElement(element.parentNode);
        }
      }
      return null;
    };

    var bindEvents = function () {
      var instance = this;
      var pressed;
      var dblclick = 0;
      var autoresizeTimeout = null;

      eventManager.addEventListener(instance.rootElement, 'mouseover', function (e) {
        if (checkRowHeader(e.target)) {
          var th = getTHFromTargetElement(e.target);
          if (th) {
            if (!pressed) {
              setupHandlePosition.call(instance, th);
            }
          }
        }
      });

      eventManager.addEventListener(instance.rootElement, 'mousedown', function (e) {
        if (Handsontable.Dom.hasClass(e.target, 'manualRowResizer')) {
          setupGuidePosition.call(instance);
          pressed = instance;

          if (autoresizeTimeout == null) {
            autoresizeTimeout = setTimeout(function () {
              if (dblclick >= 2) {
                setManualSize(currentRow, null); //double click sets auto row size
                instance.forceFullRender = true;
                instance.view.render(); //updates all
                Handsontable.hooks.run(instance, 'afterRowResize', currentRow, newSize);
              }
              dblclick = 0;
              autoresizeTimeout = null;
            }, 500);
            instance._registerTimeout(autoresizeTimeout);
          }
          dblclick++;

          startY = Handsontable.helper.pageY(e);
          newSize = startHeight;
        }
      });

      eventManager.addEventListener(window, 'mousemove', function (e) {
        if (pressed) {
          currentHeight = startHeight + (Handsontable.helper.pageY(e) - startY);
          newSize = setManualSize(currentRow, currentHeight);
          refreshHandlePosition();
          refreshGuidePosition();
        }
      });

      eventManager.addEventListener(window, 'mouseup', function (e) {
        if (pressed) {
          hideHandleAndGuide();
          pressed = false;

          if (newSize != startHeight) {
            instance.forceFullRender = true;
            instance.view.render(); //updates all

            saveManualRowHeights.call(instance);

            Handsontable.hooks.run(instance, 'afterRowResize', currentRow, newSize);
          }

          setupHandlePosition.call(instance, currentTH);
        }
      });

      instance.addHook('afterDestroy', unbindEvents);
    };

    var unbindEvents = function () {
      eventManager.clear();
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

        // update plugin usages count for manualColumnPositions
        if (typeof instance.manualRowHeightsPluginUsages != 'undefined') {
          instance.manualRowHeightsPluginUsages.push('manualRowResize');
        } else {
          instance.manualRowHeightsPluginUsages = ['manualRowResize'];
        }

        if (typeof loadedManualRowHeights != 'undefined') {
          this.manualRowHeights = loadedManualRowHeights;
        } else if (Array.isArray(initialRowHeights)) {
          this.manualRowHeights = initialRowHeights;
        } else {
          this.manualRowHeights = [];
        }

        if (source === 'afterInit') {
          bindEvents.call(this);
          if (this.manualRowHeights.length > 0) {
            this.forceFullRender = true;
            this.render();
          }
        }
        else {
          this.forceFullRender = true;
          this.render();

        }
      }
      else {
        var pluginUsagesIndex = instance.manualRowHeightsPluginUsages ? instance.manualRowHeightsPluginUsages.indexOf('manualRowResize') : -1;
        if (pluginUsagesIndex > -1) {
          unbindEvents.call(this);
          this.manualRowHeights = [];
          instance.manualRowHeightsPluginUsages[pluginUsagesIndex] = void 0;
        }
      }
    };

    var setManualSize = function (row, height) {
      row = Handsontable.hooks.run(instance, 'modifyRow', row);
      instance.manualRowHeights[row] = height;

      return height;
    };

    this.modifyRowHeight = function (height, row) {
      if (this.getSettings().manualRowResize) {
        row = this.runHooks('modifyRow', row);

        if (this.manualRowHeights[row] !== void 0) {
          return this.manualRowHeights[row];
        }
      }

      return height;
    };
  }

  var htManualRowResize = new HandsontableManualRowResize();

  Handsontable.hooks.add('beforeInit', htManualRowResize.beforeInit);
  Handsontable.hooks.add('afterInit', function () {
    htManualRowResize.init.call(this, 'afterInit');
  });

  Handsontable.hooks.add('afterUpdateSettings', function () {
    htManualRowResize.init.call(this, 'afterUpdateSettings');
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
      });
    }

    function parsePath(path){
      var match = path.match(/^\/(\d+)\/?(.*)?$/);
      return {
        row: parseInt(match[1], 10),
        col: /^\d*$/.test(match[2]) ? parseInt(match[2], 10) : match[2]
      };
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
        instance.storage = new StorageClass(instance.rootElement.id);
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
      if(Array.isArray(instance.getSettings().colHeaders)){
        headers = instance.getSettings().colHeaders.slice(index, index + removedData.length);
      }

      var action = new Handsontable.UndoRedo.RemoveColumnAction(index, removedData, headers);
      plugin.done(action);
    });

    instance.addHook("beforeCellAlignment", function (stateBefore, range, type, alignment) {
      var action = new Handsontable.UndoRedo.CellAlignmentAction(stateBefore, range, type, alignment);
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
    var data = Handsontable.helper.deepClone(this.changes),
        emptyRowsAtTheEnd = instance.countEmptyRows(true),
        emptyColsAtTheEnd = instance.countEmptyCols(true);

    for (var i = 0, len = data.length; i < len; i++) {
      data[i].splice(3, 1);
    }

    instance.addHookOnce('afterChange', undoneCallback);

    instance.setDataAtRowProp(data, null, null, 'undo');

    for (var i = 0, len = data.length; i < len; i++) {
     if (instance.getSettings().minSpareRows &&
        data[i][0] + 1 + instance.getSettings().minSpareRows === instance.countRows() &&
        emptyRowsAtTheEnd == instance.getSettings().minSpareRows) {

       instance.alter('remove_row', parseInt(data[i][0]+1,10), instance.getSettings().minSpareRows);
       instance.undoRedo.doneActions.pop();

     }

     if (instance.getSettings().minSpareCols &&
        data[i][1] + 1 + instance.getSettings().minSpareCols === instance.countCols() &&
        emptyColsAtTheEnd == instance.getSettings().minSpareCols) {

        instance.alter('remove_col', parseInt(data[i][1]+1,10), instance.getSettings().minSpareCols);
        instance.undoRedo.doneActions.pop();
      }
    }

  };
  Handsontable.UndoRedo.ChangeAction.prototype.redo = function (instance, onFinishCallback) {
    var data = Handsontable.helper.deepClone(this.changes);

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

  Handsontable.UndoRedo.CellAlignmentAction = function (stateBefore, range, type, alignment) {
    this.stateBefore = stateBefore;
    this.range = range;
    this.type = type;
    this.alignment = alignment;
  };
  Handsontable.UndoRedo.CellAlignmentAction.prototype.undo = function(instance, undoneCallback) {
    if (!instance.contextMenu) {
      return;
    }

    for (var row = this.range.from.row; row <= this.range.to.row; row++) {
      for (var col = this.range.from.col; col <= this.range.to.col; col++) {
        instance.setCellMeta(row, col, 'className', this.stateBefore[row][col] || ' htLeft');
      }
    }

    instance.addHookOnce('afterRender', undoneCallback);
    instance.render();
  };
  Handsontable.UndoRedo.CellAlignmentAction.prototype.redo = function(instance, undoneCallback) {
    if (!instance.contextMenu) {
      return;
    }

    for (var row = this.range.from.row; row <= this.range.to.row; row++) {
      for (var col = this.range.from.col; col <= this.range.to.col; col++) {
        instance.contextMenu.align.call(instance, this.range, this.type, this.alignment);
      }
    }

    instance.addHookOnce('afterRender', undoneCallback);
    instance.render();
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
      row = instance.getSourceDataAtRow(i);

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
    else {
      dragToScroll.setBoundaries(scrollHandler.getBoundingClientRect());
    }

    dragToScroll.setCallback(function (scrollX, scrollY) {
      if (scrollX < 0) {
          scrollHandler.scrollLeft -= 50;
      }
      else if (scrollX > 0) {
          scrollHandler.scrollLeft += 50;
      }

      if (scrollY < 0) {
          scrollHandler.scrollTop -= 20;
      }
      else if (scrollY > 0) {
          scrollHandler.scrollTop += 20;
      }
    });

    instance.dragToScrollListening = true;
  };

  Handsontable.hooks.add('afterInit', function () {
    var instance = this;
    var eventManager = Handsontable.eventManager(this);

    eventManager.addEventListener(document,'mouseup', function () {
      instance.dragToScrollListening = false;
    });

    eventManager.addEventListener(document,'mousemove', function (event) {
      if (instance.dragToScrollListening) {
        dragToScroll.check(event.clientX, event.clientY);
      }
    });
  });

  Handsontable.hooks.add('afterDestroy', function () {
    var eventManager = Handsontable.eventManager(this);
    eventManager.clear();
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
    var _this = this;

    this.copyPasteInstance = CopyPaste.getInstance();
    this.copyPasteInstance.onCut(onCut);
    this.copyPasteInstance.onPaste(onPaste);

    instance.addHook('beforeKeyDown', onBeforeKeyDown);

    function onCut() {
      if (!instance.isListening()) {
        return;
      }
      instance.selection.empty();
    }

    function onPaste(str) {
      var
        input,
        inputArray,
        selected,
        coordsFrom,
        coordsTo,
        cellRange,
        topLeftCorner,
        bottomRightCorner,
        areaStart,
        areaEnd;

      if (!instance.isListening() || !instance.selection.isSelected()) {
        return;
      }
      input = str;
      inputArray = SheetClip.parse(input);
      selected = instance.getSelected();
      coordsFrom = new WalkontableCellCoords(selected[0], selected[1]);
      coordsTo = new WalkontableCellCoords(selected[2], selected[3]);
      cellRange = new WalkontableCellRange(coordsFrom, coordsFrom, coordsTo);
      topLeftCorner = cellRange.getTopLeftCorner();
      bottomRightCorner = cellRange.getBottomRightCorner();
      areaStart = topLeftCorner;
      areaEnd = new WalkontableCellCoords(
        Math.max(bottomRightCorner.row, inputArray.length - 1 + topLeftCorner.row),
        Math.max(bottomRightCorner.col, inputArray[0].length - 1 + topLeftCorner.col)
      );

      instance.addHookOnce('afterChange', function (changes, source) {
        if (changes && changes.length) {
          this.selectCell(areaStart.row, areaStart.col, areaEnd.row, areaEnd.col);
        }
      });

      instance.populateFromArray(areaStart.row, areaStart.col, inputArray, areaEnd.row, areaEnd.col, 'paste', instance.getSettings().pasteMode);
    }

    function onBeforeKeyDown (event) {
      var ctrlDown;

      if (instance.getSelected()) {
        if (Handsontable.helper.isCtrlKey(event.keyCode)) {
          // when CTRL is pressed, prepare selectable text in textarea
          // http://stackoverflow.com/questions/3902635/how-does-one-capture-a-macs-command-key-via-javascript
          _this.setCopyableText();
          event.stopImmediatePropagation();

          return;
        }
        // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
        ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

        if (event.keyCode == Handsontable.helper.keyCode.A && ctrlDown) {
          instance._registerTimeout(setTimeout(Handsontable.helper.proxy(_this.setCopyableText, _this), 0));
        }
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
    var instance  = this,
      pluginEnabled = instance.getSettings().copyPaste !== false;

    if (pluginEnabled && !instance.copyPaste) {
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

    if (typeof query == 'undefined' || query == null || !query.toLowerCase || query.length === 0){
      return false;
    }

    if(typeof value == 'undefined' || value == null) {
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
    };

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
    /* jshint ignore:start */
    var instance = this;
    /* jshint ignore:end */

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

  if (Array.isArray(mergeCellsSetting)) {
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
      TD.removeAttribute('rowspan');
      TD.removeAttribute('colspan');

      TD.style.display = "none";
    }
  }
  else {
    TD.removeAttribute('rowspan');
    TD.removeAttribute('colspan');
  }
};

MergeCells.prototype.modifyTransform = function (hook, currentSelectedRange, delta) {
  var sameRowspan = function (merged, coords) {
      if (coords.row >= merged.row && coords.row <= (merged.row + merged.rowspan - 1)) {
        return true;
      }
      return false;
    }
    , sameColspan = function (merged, coords) {
      if (coords.col >= merged.col && coords.col <= (merged.col + merged.colspan - 1)) {
        return true;
      }
      return false;
    }
    , getNextPosition = function (newDelta) {
      return new WalkontableCellCoords(currentSelectedRange.to.row + newDelta.row, currentSelectedRange.to.col + newDelta.col);
    };

  var newDelta = {
    row: delta.row,
    col: delta.col
  };


  if (hook == 'modifyTransformStart') {

    if (!this.lastDesiredCoords) {
      this.lastDesiredCoords = new WalkontableCellCoords(null, null);
    }
    var currentPosition = new WalkontableCellCoords(currentSelectedRange.highlight.row, currentSelectedRange.highlight.col)
      , mergedParent = this.mergedCellInfoCollection.getInfo(currentPosition.row, currentPosition.col)// if current position's parent is a merged range, returns it
      , currentRangeContainsMerge; // if current range contains a merged range

    for (var i = 0, mergesLength = this.mergedCellInfoCollection.length; i < mergesLength; i++) {
      var range = this.mergedCellInfoCollection[i];
      range = new WalkontableCellCoords(range.row + range.rowspan - 1, range.col + range.colspan - 1);
      if (currentSelectedRange.includes(range)) {
        currentRangeContainsMerge = true;
        break;
      }
    }

    if (mergedParent) { // only merge selected
      var mergeTopLeft = new WalkontableCellCoords(mergedParent.row, mergedParent.col)
        , mergeBottomRight = new WalkontableCellCoords(mergedParent.row + mergedParent.rowspan - 1, mergedParent.col + mergedParent.colspan - 1)
        , mergeRange = new WalkontableCellRange(mergeTopLeft, mergeTopLeft, mergeBottomRight);

      if (!mergeRange.includes(this.lastDesiredCoords)) {
        this.lastDesiredCoords = new WalkontableCellCoords(null, null); // reset outdated version of lastDesiredCoords
      }

      newDelta.row = this.lastDesiredCoords.row ? this.lastDesiredCoords.row - currentPosition.row : newDelta.row;
      newDelta.col = this.lastDesiredCoords.col ? this.lastDesiredCoords.col - currentPosition.col : newDelta.col;

      if (delta.row > 0) { // moving down
        newDelta.row = mergedParent.row + mergedParent.rowspan - 1 - currentPosition.row + delta.row;
      } else if (delta.row < 0) { //moving up
        newDelta.row = currentPosition.row - mergedParent.row + delta.row;
      }
      if (delta.col > 0) { // moving right
        newDelta.col = mergedParent.col + mergedParent.colspan - 1 - currentPosition.col + delta.col;
      } else if (delta.col < 0) { // moving left
        newDelta.col = currentPosition.col - mergedParent.col + delta.col;
      }
    }

    var nextPosition = new WalkontableCellCoords(currentSelectedRange.highlight.row + newDelta.row, currentSelectedRange.highlight.col + newDelta.col)
      , nextParentIsMerged = this.mergedCellInfoCollection.getInfo(nextPosition.row, nextPosition.col);

    if (nextParentIsMerged) { // skipping the invisible cells in the merge range
      this.lastDesiredCoords = nextPosition;
      newDelta = {
        row: nextParentIsMerged.row - currentPosition.row,
        col: nextParentIsMerged.col - currentPosition.col
      };
    }
  } else if (hook == 'modifyTransformEnd') {
    for (var i = 0, mergesLength = this.mergedCellInfoCollection.length; i < mergesLength; i++) {
      var currentMerge = this.mergedCellInfoCollection[i]
        , mergeTopLeft = new WalkontableCellCoords(currentMerge.row, currentMerge.col)
        , mergeBottomRight = new WalkontableCellCoords(currentMerge.row + currentMerge.rowspan - 1, currentMerge.col + currentMerge.colspan - 1)
        , mergedRange = new WalkontableCellRange(mergeTopLeft, mergeTopLeft, mergeBottomRight)
        , sharedBorders = currentSelectedRange.getBordersSharedWith(mergedRange);

      if (mergedRange.isEqual(currentSelectedRange)) { // only the merged range is selected
        currentSelectedRange.setDirection("NW-SE");
      }
      else if (sharedBorders.length > 0) {
        var mergeHighlighted = (currentSelectedRange.highlight.isEqual(mergedRange.from));

        if (sharedBorders.indexOf('top') > -1) { // if range shares a border with the merged section, change range direction accordingly
          if (currentSelectedRange.to.isSouthEastOf(mergedRange.from) && mergeHighlighted) {
            currentSelectedRange.setDirection("NW-SE");
          } else if (currentSelectedRange.to.isSouthWestOf(mergedRange.from) && mergeHighlighted) {
            currentSelectedRange.setDirection("NE-SW");
          }
        } else if (sharedBorders.indexOf('bottom') > -1) {
          if (currentSelectedRange.to.isNorthEastOf(mergedRange.from) && mergeHighlighted) {
            currentSelectedRange.setDirection("SW-NE");
          } else if (currentSelectedRange.to.isNorthWestOf(mergedRange.from) && mergeHighlighted) {
            currentSelectedRange.setDirection("SE-NW");
          }
        }
      }

      var nextPosition = getNextPosition(newDelta)
        , withinRowspan = sameRowspan(currentMerge, nextPosition)
        , withinColspan = sameColspan(currentMerge, nextPosition);

      if (currentSelectedRange.includesRange(mergedRange) && (mergedRange.includes(nextPosition) || withinRowspan || withinColspan)) { // if next step overlaps a merged range, jump past it
        if (withinRowspan) {
          if (newDelta.row < 0) {
            newDelta.row -= currentMerge.rowspan - 1;
          } else if (newDelta.row > 0) {
            newDelta.row += currentMerge.rowspan - 1;
          }
        }
        if (withinColspan) {
          if (newDelta.col < 0) {
            newDelta.col -= currentMerge.colspan - 1;
          } else if (newDelta.col > 0) {
            newDelta.col += currentMerge.colspan - 1;
          }
        }
      }
    }
  }

  if (newDelta.row !== 0) {
    delta.row = newDelta.row;
  }
  if (newDelta.col !== 0) {
    delta.col = newDelta.col;
  }
};

if (typeof Handsontable == 'undefined') {
  throw new Error('Handsontable is not defined');
}

var beforeInit = function () {
  var instance = this;
  var mergeCellsSetting = instance.getSettings().mergeCells;

  if (mergeCellsSetting) {
    if (!instance.mergeCells) {
      instance.mergeCells = new MergeCells(mergeCellsSetting);
    }
  }
};

var afterInit = function () {
  var instance = this;
  if (instance.mergeCells) {
    /**
     * Monkey patch WalkontableTable.prototype.getCell to return TD for merged cell parent if asked for TD of a cell that is
     * invisible due to the merge. This is not the cleanest solution but there is a test case for it (merged cells scroll) so feel free to refactor it!
     */
    instance.view.wt.wtTable.getCell = function (coords) {
      if (instance.getSettings().mergeCells) {
        var mergeParent = instance.mergeCells.mergedCellInfoCollection.getInfo(coords.row, coords.col);
        if (mergeParent) {
          coords = mergeParent;
        }
      }
      return WalkontableTable.prototype.getCell.call(this, coords);
    };
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

  defaultOptions.items.push(Handsontable.ContextMenu.SEPARATOR);

  defaultOptions.items.push({
    key: 'mergeCells',
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
  });
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
  };
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

    var rangeExpanded = false;
    do {
      rangeExpanded = false;

      for (var i = 0, ilen = this.mergeCells.mergedCellInfoCollection.length; i < ilen; i++) {
        var cellInfo = this.mergeCells.mergedCellInfoCollection[i];
        var mergedCellTopLeft = new WalkontableCellCoords(cellInfo.row, cellInfo.col);
        var mergedCellBottomRight = new WalkontableCellCoords(cellInfo.row + cellInfo.rowspan - 1, cellInfo.col + cellInfo.colspan - 1);

        var mergedCellRange = new WalkontableCellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);
        if (selRange.expandByRange(mergedCellRange)) {
          coords.row = selRange.to.row;
          coords.col = selRange.to.col;

          rangeExpanded = true;
        }
      }
    } while (rangeExpanded);

  }
};

/**
 * Returns correct coordinates for merged start / end cells in selection for area borders
 * @param corners
 * @param className
 */
var beforeDrawAreaBorders = function (corners, className) {
  if (className && className == 'area') {
    var mergeCellsSetting = this.getSettings().mergeCells;
    if (mergeCellsSetting) {
      var selRange = this.getSelectedRange();
      var startRange = new WalkontableCellRange(selRange.from, selRange.from, selRange.from);
      var stopRange = new WalkontableCellRange(selRange.to, selRange.to, selRange.to);

      for (var i = 0, ilen = this.mergeCells.mergedCellInfoCollection.length; i < ilen; i++) {
        var cellInfo = this.mergeCells.mergedCellInfoCollection[i];
        var mergedCellTopLeft = new WalkontableCellCoords(cellInfo.row, cellInfo.col);
        var mergedCellBottomRight = new WalkontableCellCoords(cellInfo.row + cellInfo.rowspan - 1, cellInfo.col + cellInfo.colspan - 1);
        var mergedCellRange = new WalkontableCellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);

        if (startRange.expandByRange(mergedCellRange)) {
          corners[0] = startRange.from.row;
          corners[1] = startRange.from.col;
        }

        if (stopRange.expandByRange(mergedCellRange)) {
          corners[2] = stopRange.from.row;
          corners[3] = stopRange.from.col;
        }
      }
    }
  }
};

var afterGetCellMeta = function (row, col, cellProperties) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(row, col);
    if (mergeParent && (mergeParent.row != row || mergeParent.col != col)) {
      cellProperties.copyable = false;
    }
  }
};

var afterViewportRowCalculatorOverride = function (calc) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var colCount = this.countCols();
    var mergeParent;
    for (var c = 0; c < colCount; c++) {
      mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(calc.startRow, c);
      if (mergeParent) {
        if (mergeParent.row < calc.startRow) {
          calc.startRow = mergeParent.row;
          return afterViewportRowCalculatorOverride.call(this, calc); //recursively search upwards
        }
      }
      mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(calc.endRow, c);
      if (mergeParent) {
        var mergeEnd = mergeParent.row + mergeParent.rowspan - 1;
        if (mergeEnd > calc.endRow) {
          calc.endRow = mergeEnd;
          return afterViewportRowCalculatorOverride.call(this, calc); //recursively search upwards
        }
      }
    }
  }
};

var afterViewportColumnCalculatorOverride = function (calc) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var rowCount = this.countRows();
    var mergeParent;
    for (var r = 0; r < rowCount; r++) {
      mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(r, calc.startColumn);

      if (mergeParent) {
        if (mergeParent.col < calc.startColumn) {
          calc.startColumn = mergeParent.col;
          return afterViewportColumnCalculatorOverride.call(this, calc); //recursively search upwards
        }
      }
      mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(r, calc.endColumn);
      if (mergeParent) {
        var mergeEnd = mergeParent.col + mergeParent.colspan - 1;
        if (mergeEnd > calc.endColumn) {
          calc.endColumn = mergeEnd;
          return afterViewportColumnCalculatorOverride.call(this, calc); //recursively search upwards
        }
      }
    }
  }
};

var isMultipleSelection = function (isMultiple) {
  if (isMultiple && this.mergeCells) {
    var mergedCells = this.mergeCells.mergedCellInfoCollection
      , selectionRange = this.getSelectedRange();

    for (var group in mergedCells) {
      if (selectionRange.highlight.row == mergedCells[group].row && selectionRange.highlight.col == mergedCells[group].col &&
          selectionRange.to.row == mergedCells[group].row + mergedCells[group].rowspan - 1 &&
          selectionRange.to.col == mergedCells[group].col + mergedCells[group].colspan - 1) {
        return false;
      }
    }
  }
  return isMultiple;
};

Handsontable.hooks.add('beforeInit', beforeInit);
Handsontable.hooks.add('afterInit', afterInit);
Handsontable.hooks.add('beforeKeyDown', onBeforeKeyDown);
Handsontable.hooks.add('modifyTransformStart', modifyTransformFactory('modifyTransformStart'));
Handsontable.hooks.add('modifyTransformEnd', modifyTransformFactory('modifyTransformEnd'));
Handsontable.hooks.add('beforeSetRangeEnd', beforeSetRangeEnd);
Handsontable.hooks.add('beforeDrawBorders', beforeDrawAreaBorders);
Handsontable.hooks.add('afterIsMultipleSelection', isMultipleSelection);
Handsontable.hooks.add('afterRenderer', afterRenderer);
Handsontable.hooks.add('afterContextMenuDefaultOptions', addMergeActionsToContextMenu);
Handsontable.hooks.add('afterGetCellMeta', afterGetCellMeta);
Handsontable.hooks.add('afterViewportRowCalculatorOverride', afterViewportRowCalculatorOverride);
Handsontable.hooks.add('afterViewportColumnCalculatorOverride', afterViewportColumnCalculatorOverride);

Handsontable.MergeCells = MergeCells;


(function () {

  function CustomBorders () {

  }

//  /***
//   * Array for all custom border objects (for redraw)
//   * @type {{}}
//   */
//  var bordersArray = {},
        /***
     * Current instance (table where borders should be placed)
     */
  var instance;


  /***
   * Check if plugin should be enabled
   */
  var checkEnable = function (customBorders) {
    if(typeof customBorders === "boolean"){
      if (customBorders === true){
        return true;
      }
    }

    if(typeof customBorders === "object"){
      if(customBorders.length > 0) {
        return true;
      }
    }
    return false;
  };


  /***
   * Initialize plugin
    */
  var init = function () {

    if(checkEnable(this.getSettings().customBorders)){
      if(!this.customBorders){
        instance = this;
        this.customBorders = new CustomBorders();
      }
    }
  };

	/***
	 * get index of border setting
	 * @param className
	 * @returns {number}
	 */
	var getSettingIndex = function (className) {
		for (var i = 0; i < instance.view.wt.selections.length; i++){
			if (instance.view.wt.selections[i].settings.className == className){
				return i;
			}
		}
		return -1;
	};

  /***
   * Insert WalkontableSelection instance into Walkontable.settings
   * @param border
   */
  var insertBorderIntoSettings = function (border) {
    var coordinates = {
      row: border.row,
      col: border.col
    };
    var selection = new WalkontableSelection(border, new WalkontableCellRange(coordinates, coordinates, coordinates));
		var index = getSettingIndex(border.className);

		if(index >=0) {
			instance.view.wt.selections[index] = selection;
		} else {
			instance.view.wt.selections.push(selection);
		}
  };

  /***
   * Prepare borders from setting (single cell)
   *
   * @param row
   * @param col
   * @param borderObj
   */
  var prepareBorderFromCustomAdded = function (row, col, borderObj){
    var border = createEmptyBorders(row, col);
    border = extendDefaultBorder(border, borderObj);
    this.setCellMeta(row, col, 'borders', border);

    insertBorderIntoSettings(border);
  };

  /***
   * Prepare borders from setting (object)
   * @param rowObj
   */
  var prepareBorderFromCustomAddedRange = function (rowObj) {
    var range = rowObj.range;

    for (var row = range.from.row; row <= range.to.row; row ++) {
      for (var col = range.from.col; col<= range.to.col; col++){

        var border = createEmptyBorders(row, col);
        var add = 0;

        if(row == range.from.row) {
          add++;
          if(rowObj.hasOwnProperty('top')){
            border.top = rowObj.top;
          }
        }

        if(row == range.to.row){
          add++;
          if(rowObj.hasOwnProperty('bottom')){
            border.bottom = rowObj.bottom;
          }
        }

        if(col == range.from.col) {
          add++;
          if(rowObj.hasOwnProperty('left')){
            border.left = rowObj.left;
          }
        }


        if (col == range.to.col) {
          add++;
          if(rowObj.hasOwnProperty('right')){
            border.right = rowObj.right;
          }
        }


        if(add>0){
          this.setCellMeta(row, col, 'borders', border);
          insertBorderIntoSettings(border);
        }
      }
    }
  };

  /***
   * Create separated class name for borders for each cell
   * @param row
   * @param col
   * @returns {string}
   */
  var createClassName = function (row, col) {
    return "border_row" + row + "col" + col;
  };


  /***
   * Create default single border for each position (top/right/bottom/left)
   * @returns {{width: number, color: string}}
   */
  var createDefaultCustomBorder = function () {
    return {
      width: 1,
      color: '#000'
    };
  };


  /***
   * Create default object for empty border
   * @returns {{hide: boolean}}
   */
  var createSingleEmptyBorder = function () {
    return {
      hide: true
    };
  };


  /***
   * Create default Handsontable border object
   * @returns {{width: number, color: string, cornerVisible: boolean}}
   */
  var createDefaultHtBorder = function () {
    return {
      width: 1,
      color: '#000',
      cornerVisible: false
    };
  };

  /***
   * Prepare empty border for each cell with all custom borders hidden
   *
   * @param row
   * @param col
   * @returns {{className: *, border: *, row: *, col: *, top: {hide: boolean}, right: {hide: boolean}, bottom: {hide: boolean}, left: {hide: boolean}}}
   */
  var createEmptyBorders = function (row, col){
    return {
      className: createClassName(row, col),
      border: createDefaultHtBorder(),
      row: row,
      col: col,
      top: createSingleEmptyBorder(),
      right: createSingleEmptyBorder(),
      bottom: createSingleEmptyBorder(),
      left: createSingleEmptyBorder()
    };
  };


  var extendDefaultBorder = function (defaultBorder, customBorder){

    if(customBorder.hasOwnProperty('border')){
      defaultBorder.border = customBorder.border;
    }

    if(customBorder.hasOwnProperty('top')){
      defaultBorder.top = customBorder.top;
    }

    if(customBorder.hasOwnProperty('right')){
      defaultBorder.right = customBorder.right;
    }

    if(customBorder.hasOwnProperty('bottom')){
      defaultBorder.bottom = customBorder.bottom;
    }

    if(customBorder.hasOwnProperty('left')){
      defaultBorder.left = customBorder.left;
    }
    return defaultBorder;
  };

  /***
   * Remove borders divs from DOM
   *
   * @param borderClassName
   */
  var removeBordersFromDom = function (borderClassName) {
	  var borders = document.querySelectorAll("." + borderClassName);

		for(var i = 0; i< borders.length; i++) {
			if (borders[i]) {
				if(borders[i].nodeName != 'TD') {
					var parent = borders[i].parentNode;
          if(parent.parentNode) {
            parent.parentNode.removeChild(parent);
          }
				}
			}
		}
  };


  /***
   * Remove border (triggered from context menu)
   *
   * @param row
   * @param col
   */
  var removeAllBorders = function(row,col) {
    var borderClassName = createClassName(row,col);
    removeBordersFromDom(borderClassName);
    this.removeCellMeta(row, col, 'borders');
  };

  /***
   * Set borders for each cell re. to border position
   *
   * @param row
   * @param col
   * @param place
   * @param remove
   */
  var setBorder = function (row, col,place, remove){

    var bordersMeta = this.getCellMeta(row, col).borders;
    /* jshint ignore:start */
    if (!bordersMeta || bordersMeta.border == undefined){
      bordersMeta = createEmptyBorders(row, col);
    }
    /* jshint ignore:end */

    if (remove) {
      bordersMeta[place] = createSingleEmptyBorder();
    } else {
      bordersMeta[place] = createDefaultCustomBorder();
    }

    this.setCellMeta(row, col, 'borders', bordersMeta);

    var borderClassName = createClassName(row,col);
    removeBordersFromDom(borderClassName);
		insertBorderIntoSettings(bordersMeta);

    this.render();
  };


  /***
   * Prepare borders based on cell and border position
   *
   * @param range
   * @param place
   * @param remove
   */
  var prepareBorder = function (range, place, remove) {

		if (range.from.row == range.to.row && range.from.col == range.to.col){
      if(place == "noBorders"){
        removeAllBorders.call(this, range.from.row, range.from.col);
      } else {
        setBorder.call(this, range.from.row, range.from.col, place, remove);
      }
    } else {
      switch (place) {
        case "noBorders":
          for(var column = range.from.col; column <= range.to.col; column++){
            for(var row = range.from.row; row <= range.to.row; row++) {
              removeAllBorders.call(this, row, column);
            }
          }
          break;
        case "top":
          for(var topCol = range.from.col; topCol <= range.to.col; topCol++){
            setBorder.call(this, range.from.row, topCol, place, remove);
          }
          break;
        case "right":
          for(var rowRight = range.from.row; rowRight <=range.to.row; rowRight++){
            setBorder.call(this,rowRight, range.to.col, place);
          }
          break;
        case "bottom":
          for(var bottomCol = range.from.col; bottomCol <= range.to.col; bottomCol++){
            setBorder.call(this, range.to.row, bottomCol, place);
          }
          break;
        case "left":
          for(var rowLeft = range.from.row; rowLeft <=range.to.row; rowLeft++){
            setBorder.call(this,rowLeft, range.from.col, place);
          }
          break;
      }
    }
  };

  /***
   * Check if selection has border by className
   *
   * @param hot
   * @param direction
   */
  var checkSelectionBorders = function (hot, direction) {
    var atLeastOneHasBorder = false;

    hot.getSelectedRange().forAll(function(r, c) {
      var metaBorders = hot.getCellMeta(r,c).borders;

      if (metaBorders) {
        if(direction) {
          if (!metaBorders[direction].hasOwnProperty('hide')){
            atLeastOneHasBorder = true;
            return false; //breaks forAll
          }
        } else {
          atLeastOneHasBorder = true;
          return false; //breaks forAll
        }
      }
    });
    return atLeastOneHasBorder;
  };


  /***
   * Mark label in contextMenu as selected
   *
   * @param label
   * @returns {string}
   */
  var markSelected = function (label) {
    return "<span class='selected'>" + String.fromCharCode(10003) + "</span>" + label; // workaround for https://github.com/handsontable/handsontable/issues/1946
  };

  /***
   * Add border options to context menu
   *
   * @param defaultOptions
   */
  var addBordersOptionsToContextMenu = function (defaultOptions) {
    if(!this.getSettings().customBorders){
      return;
    }

    defaultOptions.items.push(Handsontable.ContextMenu.SEPARATOR);

    defaultOptions.items.push({
      key: 'borders',
      name: 'Borders',
      submenu: {
        items: {
          top: {
            name: function () {
              var label = "Top";
              var hasBorder = checkSelectionBorders(this, 'top');
              if(hasBorder) {
                label = markSelected(label);
              }

              return label;
            },
            callback: function () {
              var hasBorder = checkSelectionBorders(this, 'top');
              prepareBorder.call(this, this.getSelectedRange(), 'top', hasBorder);
            },
            disabled: false
          },
          right: {
            name: function () {
              var label = 'Right';
              var hasBorder = checkSelectionBorders(this, 'right');
              if(hasBorder) {
                label = markSelected(label);
              }
              return label;
            },
            callback: function () {
              var hasBorder = checkSelectionBorders(this, 'right');
              prepareBorder.call(this, this.getSelectedRange(), 'right', hasBorder);
            },
            disabled: false
          },
          bottom: {
            name: function () {
              var label = 'Bottom';
              var hasBorder = checkSelectionBorders(this, 'bottom');
              if(hasBorder) {
                label = markSelected(label);
              }
              return label;
            },
            callback: function () {
              var hasBorder = checkSelectionBorders(this, 'bottom');
              prepareBorder.call(this, this.getSelectedRange(), 'bottom', hasBorder);
            },
            disabled: false
          },
          left: {
            name: function () {
              var label = 'Left';
              var hasBorder = checkSelectionBorders(this, 'left');
              if(hasBorder) {
                label = markSelected(label);
              }

              return label;
            },
            callback: function () {
              var hasBorder = checkSelectionBorders(this, 'left');
              prepareBorder.call(this, this.getSelectedRange(), 'left', hasBorder);
            },
            disabled: false
          },
          remove: {
            name: 'Remove border(s)',
            callback: function () {
              prepareBorder.call(this, this.getSelectedRange(), 'noBorders');
            },
            disabled: function () {
              return !checkSelectionBorders(this);
            }
          }
        }
      }
    });
  };

  Handsontable.hooks.add('beforeInit', init);
  Handsontable.hooks.add('afterContextMenuDefaultOptions', addBordersOptionsToContextMenu);


  Handsontable.hooks.add('afterInit', function () {
    var customBorders = this.getSettings().customBorders;

    if (customBorders){

      for(var i = 0; i< customBorders.length; i++) {
        if(customBorders[i].range){
          prepareBorderFromCustomAddedRange.call(this,customBorders[i]);
        } else {
          prepareBorderFromCustomAdded.call(this,customBorders[i].row, customBorders[i].col, customBorders[i]);
        }
      }

			this.render();
      this.view.wt.draw(true);
    }

  });

  Handsontable.CustomBorders = CustomBorders;

}());

/**
 * HandsontableManualRowMove
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired position of the row
 * - guide - the helper guide that shows the desired position as a horizontal guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowMove.js
 * @constructor
 */
(function (Handsontable) {
  function HandsontableManualRowMove() {

    var startRow,
      endRow,
      startY,
      startOffset,
      currentRow,
      currentTH,
      handle = document.createElement('DIV'),
      guide = document.createElement('DIV'),
      eventManager = Handsontable.eventManager(this);

    handle.className = 'manualRowMover';
    guide.className = 'manualRowMoverGuide';

    var saveManualRowPositions = function () {
      var instance = this;
      Handsontable.hooks.run(instance, 'persistentStateSave', 'manualRowPositions', instance.manualRowPositions);
    };

    var loadManualRowPositions = function () {
      var instance = this,
        storedState = {};
      Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualRowPositions', storedState);
      return storedState.value;
    };

    function setupHandlePosition(TH) {
      instance = this;
      currentTH = TH;

      var row = this.view.wt.wtTable.getCoords(TH).row; //getCoords returns WalkontableCellCoords
      if (row >= 0) { //if not row header
        currentRow = row;
        var box = currentTH.getBoundingClientRect();
        startOffset = box.top;
        handle.style.top = startOffset + 'px';
        handle.style.left = box.left + 'px';
        instance.rootElement.appendChild(handle);
      }
    }

    function refreshHandlePosition(TH, delta) {
      var box = TH.getBoundingClientRect();
      var handleHeight = 6;
      if (delta > 0) {
        handle.style.top = (box.top + box.height - handleHeight) + 'px';
      }
      else {
        handle.style.top = box.top + 'px';
      }
    }

    function setupGuidePosition() {
      var instance = this;
      Handsontable.Dom.addClass(handle, 'active');
      Handsontable.Dom.addClass(guide, 'active');
      var box = currentTH.getBoundingClientRect();
      guide.style.width = instance.view.maximumVisibleElementWidth(0) + 'px';
      guide.style.height = box.height + 'px';
      guide.style.top = startOffset + 'px';
      guide.style.left = handle.style.left;
      instance.rootElement.appendChild(guide);
    }

    function refreshGuidePosition(diff) {
      guide.style.top = startOffset + diff + 'px';
    }

    function hideHandleAndGuide() {
      Handsontable.Dom.removeClass(handle, 'active');
      Handsontable.Dom.removeClass(guide, 'active');
    }

    var checkRowHeader = function (element) {
      if (element.tagName != 'BODY') {
        if (element.parentNode.tagName == 'TBODY') {
          return true;
        } else {
          element = element.parentNode;
          return checkRowHeader(element);
        }
      }
      return false;
    };

    var getTHFromTargetElement = function (element) {
      if (element.tagName != 'TABLE') {
        if (element.tagName == 'TH') {
          return element;
        } else {
          return getTHFromTargetElement(element.parentNode);
        }
      }
      return null;
    };

    var bindEvents = function () {
      var instance = this;
      var pressed;


      eventManager.addEventListener(instance.rootElement, 'mouseover', function (e) {
        if (checkRowHeader(e.target)) {
          var th = getTHFromTargetElement(e.target);
          if (th) {
            if (pressed) {
              endRow = instance.view.wt.wtTable.getCoords(th).row;
              refreshHandlePosition(th, endRow - startRow);
            }
            else {
              setupHandlePosition.call(instance, th);
            }
          }
        }
      });

      eventManager.addEventListener(instance.rootElement, 'mousedown', function (e) {
        if (Handsontable.Dom.hasClass(e.target, 'manualRowMover')) {
          startY = Handsontable.helper.pageY(e);
          setupGuidePosition.call(instance);
          pressed = instance;

          startRow = currentRow;
          endRow = currentRow;
        }
      });

      eventManager.addEventListener(window, 'mousemove', function (e) {
        if (pressed) {
          refreshGuidePosition(Handsontable.helper.pageY(e) - startY);
        }
      });

      eventManager.addEventListener(window, 'mouseup', function (e) {
        if (pressed) {
          hideHandleAndGuide();
          pressed = false;

          createPositionData(instance.manualRowPositions, instance.countRows());
          instance.manualRowPositions.splice(endRow, 0, instance.manualRowPositions.splice(startRow, 1)[0]);

          instance.forceFullRender = true;
          instance.view.render(); //updates all

          saveManualRowPositions.call(instance);

          Handsontable.hooks.run(instance, 'afterRowMove', startRow, endRow);

          setupHandlePosition.call(instance, currentTH);
        }
      });

      instance.addHook('afterDestroy', unbindEvents);
    };

    var unbindEvents = function () {
      eventManager.clear();
    };

    var createPositionData = function (positionArr, len) {
      if (positionArr.length < len) {
        for (var i = positionArr.length; i < len; i++) {
          positionArr[i] = i;
        }
      }
    };

    this.beforeInit = function () {
      this.manualRowPositions = [];
    };

    this.init = function (source) {
      var instance = this;
      var manualRowMoveEnabled = !!(instance.getSettings().manualRowMove);

      if (manualRowMoveEnabled) {
        var initialManualRowPositions = instance.getSettings().manualRowMove;
        var loadedManualRowPostions = loadManualRowPositions.call(instance);

        // update plugin usages count for manualColumnPositions
        if (typeof instance.manualRowPositionsPluginUsages != 'undefined') {
          instance.manualRowPositionsPluginUsages.push('manualColumnMove');
        } else {
          instance.manualRowPositionsPluginUsages = ['manualColumnMove'];
        }

        if (typeof loadedManualRowPostions != 'undefined') {
          this.manualRowPositions = loadedManualRowPostions;
        } else if (Array.isArray(initialManualRowPositions)) {
          this.manualRowPositions = initialManualRowPositions;
        } else {
          this.manualRowPositions = [];
        }

        if (source === 'afterInit') {
          bindEvents.call(this);
          if (this.manualRowPositions.length > 0) {
            instance.forceFullRender = true;
            instance.render();
          }
        }
      } else {
        var pluginUsagesIndex = instance.manualRowPositionsPluginUsages ? instance.manualRowPositionsPluginUsages.indexOf('manualColumnMove') : -1;
        if (pluginUsagesIndex > -1) {
          unbindEvents.call(this);
          instance.manualRowPositions = [];
          instance.manualRowPositionsPluginUsages[pluginUsagesIndex] = void 0;
        }
      }

    };

    this.modifyRow = function (row) {
      var instance = this;
      if (instance.getSettings().manualRowMove) {
        if (typeof instance.manualRowPositions[row] === 'undefined') {
          createPositionData(this.manualRowPositions, row + 1);
        }
        return instance.manualRowPositions[row];
      }

      return row;
    };
  }

  var htManualRowMove = new HandsontableManualRowMove();

  Handsontable.hooks.add('beforeInit', htManualRowMove.beforeInit);
  Handsontable.hooks.add('afterInit', function () {
    htManualRowMove.init.call(this, 'afterInit');
  });

  Handsontable.hooks.add('afterUpdateSettings', function () {
    htManualRowMove.init.call(this, 'afterUpdateSettings');
  });

  Handsontable.hooks.add('modifyRow', htManualRowMove.modifyRow);
  Handsontable.hooks.register('afterRowMove');

})(Handsontable);

/**
 * This plugin provides "drag-down" and "copy-down" functionalities, both operated
 * using the small square in the right bottom of the cell selection.
 *
 * "Drag-down" expands the value of the selected cells to the neighbouring
 * cells when you drag the small square in the corner.
 *
 * "Copy-down" copies the value of the selection to all empty cells
 * below when you double click the small square.
 */
(function (Handsontable) {
  'use strict';

  function Autofill(instance) {
    this.instance = instance;
    this.addingStarted = false;

    var  wtOnCellCornerMouseDown,
      wtOnCellMouseOver,
      mouseDownOnCellCorner = false,
      plugin = this,
      eventManager = Handsontable.eventManager(instance);


    var mouseUpCallback = function (event) {
      if (!instance.autofill) {
        return true;
      }

      if (instance.autofill.handle && instance.autofill.handle.isDragged) {
        if (instance.autofill.handle.isDragged > 1) {
          instance.autofill.apply();
        }
        instance.autofill.handle.isDragged = 0;
        mouseDownOnCellCorner = false;
      }
    };

    eventManager.addEventListener(document, 'mouseup', function (event) {
      mouseUpCallback(event);
    });

    eventManager.addEventListener(document,'mousemove', function (event){
      if (!plugin.instance.autofill) {
        return 0;
      }

      var tableBottom = Handsontable.Dom.offset(plugin.instance.table).top - (window.pageYOffset || document.documentElement.scrollTop) + Handsontable.Dom.outerHeight(plugin.instance.table)
        , tableRight = Handsontable.Dom.offset(plugin.instance.table).left - (window.pageXOffset || document.documentElement.scrollLeft) + Handsontable.Dom.outerWidth(plugin.instance.table);


      if (plugin.addingStarted === false && plugin.instance.autofill.handle.isDragged > 0 && event.clientY > tableBottom && event.clientX <= tableRight) { // dragged outside bottom
        this.mouseDragOutside = true;
        plugin.addingStarted = true;
      } else {
        this.mouseDragOutside = false;
      }

      if (this.mouseDragOutside) {
        setTimeout(function () {
          plugin.addingStarted = false;
          plugin.instance.alter('insert_row');
        }, 200);
      }
    });

    /*
     * Appeding autofill-specific methods to walkontable event settings
     */
    wtOnCellCornerMouseDown = this.instance.view.wt.wtSettings.settings.onCellCornerMouseDown;
    this.instance.view.wt.wtSettings.settings.onCellCornerMouseDown = function (event) {
      instance.autofill.handle.isDragged = 1;
      mouseDownOnCellCorner = true;

      wtOnCellCornerMouseDown(event);
    };

    wtOnCellMouseOver = this.instance.view.wt.wtSettings.settings.onCellMouseOver;
    this.instance.view.wt.wtSettings.settings.onCellMouseOver = function (event, coords, TD, wt) {

      if (instance.autofill && (mouseDownOnCellCorner && !instance.view.isMouseDown() && instance.autofill.handle && instance.autofill.handle.isDragged)) {
        instance.autofill.handle.isDragged++;
        instance.autofill.showBorder(coords);
        instance.autofill.checkIfNewRowNeeded();
      }

      wtOnCellMouseOver(event, coords, TD, wt);
    };

    this.instance.view.wt.wtSettings.settings.onCellCornerDblClick = function () {
      instance.autofill.selectAdjacent();
    };

  }

  /**
   * Create fill handle and fill border objects
   */
  Autofill.prototype.init = function () {
    this.handle = {};
  };

  /**
   * Hide fill handle and fill border permanently
   */
    Autofill.prototype.disable = function () {
      this.handle.disabled = true;
    };

  /**
   * Selects cells down to the last row in the left column, then fills down to that cell
   */
    Autofill.prototype.selectAdjacent = function () {
      var select, data, r, maxR, c;

      if (this.instance.selection.isMultiple()) {
        select = this.instance.view.wt.selections.area.getCorners();
      }
      else {
        select = this.instance.view.wt.selections.current.getCorners();
      }

      data = this.instance.getData();
      rows : for (r = select[2] + 1; r < this.instance.countRows(); r++) {
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
        this.instance.view.wt.selections.fill.clear();
        this.instance.view.wt.selections.fill.add(new WalkontableCellCoords(select[0], select[1]));
        this.instance.view.wt.selections.fill.add(new WalkontableCellCoords(maxR, select[3]));
        this.apply();
      }
    };

  /**
   * Apply fill values to the area in fill border, omitting the selection border
   */
    Autofill.prototype.apply = function () {
      var drag, select, start, end, _data;

      this.handle.isDragged = 0;

      drag = this.instance.view.wt.selections.fill.getCorners();
      if (!drag) {
        return;
      }

      var getDeltas = function (start, end, data, direction) {
        var rlength = data.length, // rows
            clength = data ? data[0].length : 0; // cols

        var deltas = [];

        var diffRow = end.row - start.row,
            diffCol = end.col - start.col;

        var startValue, endValue, delta;

        var arr = [];

        if (['down', 'up'].indexOf(direction) !== -1) {
          for (var col = 0; col <= diffCol; col++) {

            startValue = parseInt(data[0][col], 10);
            endValue = parseInt(data[rlength-1][col], 10);
            delta = (direction === 'down' ? (endValue - startValue) : (startValue - endValue))  / (rlength - 1) || 0;

            arr.push(delta);
          }

          deltas.push(arr);
        }

        if (['right', 'left'].indexOf(direction) !== -1) {
          for (var row = 0; row <= diffRow; row++) {

            startValue = parseInt(data[row][0], 10);
            endValue = parseInt(data[row][clength-1], 10);
            delta = (direction === 'right' ? (endValue - startValue) : (startValue - endValue)) / (clength - 1) || 0;

            arr = [];
            arr.push(delta);

            deltas.push(arr);
          }
        }

        return deltas;
      };

      this.instance.view.wt.selections.fill.clear();

      if (this.instance.selection.isMultiple()) {
        select = this.instance.view.wt.selections.area.getCorners();
      }
      else {
        select = this.instance.view.wt.selections.current.getCorners();
      }

      var direction;

      if (drag[0] === select[0] && drag[1] < select[1]) {
        direction = 'left';

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
        direction = 'right';

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
        direction = 'up';

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
        direction = 'down';

        start = new WalkontableCellCoords(
          select[2] + 1,
          drag[1]
        );
        end = new WalkontableCellCoords(
          drag[2],
          drag[3]
        );
      }

      if (start && start.row > -1 && start.col > -1) {
        var selRange = {from: this.instance.getSelectedRange().from, to: this.instance.getSelectedRange().to};

        _data = this.instance.getData(selRange.from.row, selRange.from.col, selRange.to.row, selRange.to.col);

        var deltas = getDeltas(start, end, _data, direction);

        Handsontable.hooks.run(this.instance, 'beforeAutofill', start, end, _data);

        this.instance.populateFromArray(start.row, start.col, _data, end.row, end.col, 'autofill', null, direction, deltas);

        this.instance.selection.setRangeStart(new WalkontableCellCoords(drag[0], drag[1]));
        this.instance.selection.setRangeEnd(new WalkontableCellCoords(drag[2], drag[3]));
      } else {
       //reset to avoid some range bug
       this.instance.selection.refreshBorders();
     }
    };

  /**
   * Show fill border
   * @param {WalkontableCellCoords} coords
   */
    Autofill.prototype.showBorder = function (coords) {
      var topLeft = this.instance.getSelectedRange().getTopLeftCorner();
      var bottomRight = this.instance.getSelectedRange().getBottomRightCorner();
      if (this.instance.getSettings().fillHandle !== 'horizontal' && (bottomRight.row < coords.row || topLeft.row > coords.row)) {
        coords = new WalkontableCellCoords(coords.row, bottomRight.col);
      }
      else if (this.instance.getSettings().fillHandle !== 'vertical') {
        coords = new WalkontableCellCoords(bottomRight.row, coords.col);
      }
      else {
        return; //wrong direction
      }

      this.instance.view.wt.selections.fill.clear();
      this.instance.view.wt.selections.fill.add(this.instance.getSelectedRange().from);
      this.instance.view.wt.selections.fill.add(this.instance.getSelectedRange().to);
      this.instance.view.wt.selections.fill.add(coords);
      this.instance.view.render();
    };

  Autofill.prototype.checkIfNewRowNeeded = function () {
    var fillCorners,
      selection,
      tableRows = this.instance.countRows(),
      that = this;

    if (this.instance.view.wt.selections.fill.cellRange && this.addingStarted === false) {
      selection = this.instance.getSelected();
      fillCorners = this.instance.view.wt.selections.fill.getCorners();

      if (selection[2] < tableRows - 1 && fillCorners[2] === tableRows - 1) {
        this.addingStarted = true;

        this.instance._registerTimeout(setTimeout(function () {
          that.instance.alter('insert_row');
          that.addingStarted = false;
        }, 200));
      }
    }

  };


  Handsontable.hooks.add('afterInit', function () {
    var autofill = new Autofill(this);

    if (typeof this.getSettings().fillHandle !== "undefined") {
      if (autofill.handle && this.getSettings().fillHandle === false) {
        autofill.disable();
      }
      else if (!autofill.handle && this.getSettings().fillHandle !== false) {
        this.autofill = autofill;
        this.autofill.init();
      }
    }

  });

  Handsontable.Autofill = Autofill;

})(Handsontable);

var Grouping = function (instance) {
  /**
   * array of items
   * @type {Array}
   */
  var groups = [];

  /**
   * group definition
   * @type {{id: String, level: Number, rows: Array, cols: Array, hidden: Number}}
   */
  var item = {
    id: '',
    level: 0,
    hidden: 0,
    rows: [],
    cols: []
  };

  /**
   * total rows and cols merged in groups
   * @type {{rows: number, cols: number}}
   */
  var counters = {
    rows: 0,
    cols: 0
  };

  /**
   * Number of group levels in each dimension
   * @type {{rows: number, cols: number}}
   */
  var levels = {
    rows: 0,
    cols: 0
  };

  /**
   * List of hidden rows
   * @type {Array}
   */
  var hiddenRows = [];

  /**
   * List of hidden columns
   * @type {Array}
   */
  var hiddenCols = [];

  /**
   * Classes used
   */
  var classes = {
    'groupIndicatorContainer': 'htGroupIndicatorContainer',
    'groupIndicator': function (direction) {
      return 'ht' + direction + 'Group';
    },
    'groupStart': 'htGroupStart',
    'collapseButton': 'htCollapseButton',
    'expandButton': 'htExpandButton',
    'collapseGroupId': function (id) {
      return 'htCollapse-' + id;
    },
    'collapseFromLevel': function (direction, level) {
      return 'htCollapse' + direction + 'FromLevel-' + level;
    },
    'clickable': 'clickable',
    'levelTrigger': 'htGroupLevelTrigger'
  };

  /**
   * compare object properties
   * @param {String} property
   * @param {String} orderDirection
   * @returns {Function}
   */
  var compare = function (property, orderDirection) {
    return function (item1, item2) {
      return typeof (orderDirection) === 'undefined' || orderDirection === 'asc' ? item1[property] - item2[property] : item2[property] - item1[property];
    };
  };

  /**
   * Create range array between from and to
   * @param {Number} from
   * @param {Number} to
   * @returns {Array}
   */
  var range = function (from, to) {
    var arr = [];
    while (from <= to) {
      arr.push(from++);
    }

    return arr;
  };

  /**
   * * Get groups for range
   * @param from
   * @param to
   * @returns {{total: {rows: number, cols: number}, groups: Array}}
   */
  var getRangeGroups = function (dataType, from, to) {
    var cells = [],
      cell = {
        row: null,
        col: null
      };

    if (dataType == "cols") {
      // get all rows for selected columns
      while (from <= to) {
        cell = {
          row: -1,
          col: from++
        };
        cells.push(cell);
      }

    } else {
      // get all columns for selected rows
      while (from <= to) {
        cell = {
          row: from++,
          col: -1
        };
        cells.push(cell);
      }
    }

    var cellsGroups = getCellsGroups(cells),
      totalRows = 0,
      totalCols = 0;

    // for selected cells, calculate total groups divided into rows and columns
    for (var i = 0; i < cellsGroups.length; i++) {
      totalRows += cellsGroups[i].filter(function (item) {
        return item['rows'];
      }).length;

      totalCols += cellsGroups[i].filter(function (item) {
        return item['cols'];
      }).length;
    }

    return {
      total: {
        rows: totalRows,
        cols: totalCols
      },
      groups: cellsGroups
    };
  };

  /**
   * Get all groups for cells
   * @param {Array} cells [{row:0, col:0}, {row:0, col:1}, {row:1, col:2}]
   * @returns {Array}
   */
  var getCellsGroups = function (cells) {
    var _groups = [];

    for (var i = 0; i < cells.length; i++) {
      _groups.push(getCellGroups(cells[i]));
    }

    return _groups;
  };

  /**
   * Get all groups for cell
   * @param {Object} coords {row:1, col:2}
   * @param {Number} groupLevel Optional
   * @param {String} groupType Optional
   * @returns {Array}
   */
  var getCellGroups = function (coords, groupLevel, groupType) {
    var row = coords.row,
      col = coords.col;

    // for row = -1 and col = -1, get all columns and rows
    var tmpRow = (row === -1 ? 0 : row),
      tmpCol = (col === -1 ? 0 : col);

    var _groups = [];

    for (var i = 0; i < groups.length; i++) {
      var group = groups[i],
        id = group['id'],
        level = group['level'],
        rows = group['rows'] || [],
        cols = group['cols'] || [];

      if (_groups.indexOf(id) === -1) {
        if (rows.indexOf(tmpRow) !== -1 || cols.indexOf(tmpCol) !== -1) {
          _groups.push(group);
        }
      }
    }

    // add col groups
    if (col === -1) {
      _groups = _groups.concat(getColGroups());
    } else if (row === -1) {
      // add row groups
      _groups = _groups.concat(getRowGroups());
    }

    if (groupLevel) {
      _groups = _groups.filter(function (item) {
        return item['level'] === groupLevel;
      });
    }

    if (groupType) {
      if (groupType === 'cols') {
        _groups = _groups.filter(function (item) {
          return item['cols'];
        });
      } else if (groupType === 'rows') {
        _groups = _groups.filter(function (item) {
          return item['rows'];
        });
      }
    }

    // remove duplicates
    var tmp = [];
    return _groups.filter(function (item) {
      if (tmp.indexOf(item.id) === -1) {
        tmp.push(item.id);
        return item;
      }
    });
  };

  /**
   * get group by id
   * @param id
   * @returns {Object} group
   */
  var getGroupById = function (id) {
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i].id == id) {
        return groups[i];
      }
    }
    return false;
  };

  /**
   * get group by row and level
   * @param row
   * @param level
   * @returns {Object} group
   */
  var getGroupByRowAndLevel = function (row, level) {
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i].level == level && groups[i].rows && groups[i].rows.indexOf(row) > -1) {
        return groups[i];
      }
    }
    return false;
  };

  /**
   * get group by row and level
   * @param row
   * @param level
   * @returns {Object} group
   */
  var getGroupByColAndLevel = function (col, level) {
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i].level == level && groups[i].cols && groups[i].cols.indexOf(col) > -1) {
        return groups[i];
      }
    }
    return false;
  };

  /**
   * get total column groups
   * @returns {*|Array}
   */
  var getColGroups = function () {
    var result = [];
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (Array.isArray(groups[i]['cols'])) {
        result.push(groups[i]);
      }
    }
    return result;
  };

  /**
   * get total col groups by level
   * @param {Number} level
   * @returns {*|Array}
   */
  var getColGroupsByLevel = function (level) {
    var result = [];
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i]['cols'] && groups[i]['level'] === level) {
        result.push(groups[i]);
      }
    }
    return result;
  };

  /**
   * get total row groups
   * @returns {*|Array}
   */
  var getRowGroups = function () {
    var result = [];
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (Array.isArray(groups[i]['rows'])) {
        result.push(groups[i]);
      }
    }
    return result;
  };

  /**
   * get total row groups by level
   * @param {Number} level
   * @returns {*|Array}
   */
  var getRowGroupsByLevel = function (level) {
    var result = [];
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i]['rows'] && groups[i]['level'] === level) {
        result.push(groups[i]);
      }
    }
    return result;
  };

  /**
   * get last inserted range level in columns
   * @param {Array} rangeGroups
   * @returns {number}
   */
  var getLastLevelColsInRange = function (rangeGroups) {
    var level = 0;

    if (rangeGroups.length) {
      rangeGroups.forEach(function (items) {
        items = items.filter(function (item) {
          return item['cols'];
        });

        if (items.length) {
          var sortedGroup = items.sort(compare('level', 'desc')),
            lastLevel = sortedGroup[0].level;

          if (level < lastLevel) {
            level = lastLevel;
          }
        }
      });
    }

    return level;
  };

  /**
   * get last inserted range level in rows
   * @param {Array} rangeGroups
   * @returns {number}
   */
  var getLastLevelRowsInRange = function (rangeGroups) {
    var level = 0;

    if (rangeGroups.length) {
      rangeGroups.forEach(function (items) {
        items = items.filter(function (item) {
          return item['rows'];
        });

        if (items.length) {
          var sortedGroup = items.sort(compare('level', 'desc')),
            lastLevel = sortedGroup[0].level;

          if (level < lastLevel) {
            level = lastLevel;
          }
        }
      });
    }

    return level;
  };

  /**
   * create group for cols
   * @param {Number} from
   * @param {Number} to
   */
  var groupCols = function (from, to) {
    var rangeGroups = getRangeGroups("cols", from, to),
      lastLevel = getLastLevelColsInRange(rangeGroups.groups);

    if (lastLevel === levels.cols) {
      levels.cols++;
    } else if (lastLevel > levels.cols) {
      levels.cols = lastLevel + 1;
    }

    if (!counters.cols) {
      counters.cols = getColGroups().length;
    }

    counters.cols++;
    groups.push({
      id: 'c' + counters.cols,
      level: lastLevel + 1,
      cols: range(from, to),
      hidden: 0
    });
  };

  /**
   * create group for rows
   * @param {Number} from
   * @param {Number} to
   */
  var groupRows = function (from, to) {
    var rangeGroups = getRangeGroups("rows", from, to),
      lastLevel = getLastLevelRowsInRange(rangeGroups.groups);

    levels.rows = Math.max(levels.rows, lastLevel + 1);


    if (!counters.rows) {
      counters.rows = getRowGroups().length;
    }

    counters.rows++;
    groups.push({
      id: 'r' + counters.rows,
      level: lastLevel + 1,
      rows: range(from, to),
      hidden: 0
    });
  };

  /**
   * show or hide groups
   * @param showHide
   * @param groups
   */
  var showHideGroups = function (hidden, groups) {
    var level;
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      groups[i].hidden = hidden;
      level = groups[i].level;

      if (!hiddenRows[level]) {
        hiddenRows[level] = [];
      }
      if (!hiddenCols[level]) {
        hiddenCols[level] = [];
      }

      if (groups[i].rows) {
        for (var j = 0, rowsLength = groups[i].rows.length; j < rowsLength; j++) {
          if (hidden > 0) {
            hiddenRows[level][groups[i].rows[j]] = true;
          } else {
            hiddenRows[level][groups[i].rows[j]] = void 0;
          }
        }
      } else if (groups[i].cols) {
        for (var j = 0, colsLength = groups[i].cols.length; j < colsLength; j++) {
          if (hidden > 0) {
            hiddenCols[level][groups[i].cols[j]] = true;
          } else {
            hiddenCols[level][groups[i].cols[j]] = void 0;
          }
        }
      }
    }
  };

  /**
   * Check if the next cell of the dimension (row / column) contains a group at the same level
   * @param dimension
   * @param currentPosition
   * @param level
   * @param currentGroupId
   * @returns {boolean}
   */
  var nextIndexSharesLevel = function (dimension, currentPosition, level, currentGroupId) {
    var nextCellGroupId
      , levelsByOrder;

    switch (dimension) {
      case 'rows':
        nextCellGroupId = getGroupByRowAndLevel(currentPosition + 1, level).id;
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByRows();
        break;
      case 'cols':
        nextCellGroupId = getGroupByColAndLevel(currentPosition + 1, level).id;
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByCols();
        break;
    }

    return !!(levelsByOrder[currentPosition + 1] && levelsByOrder[currentPosition + 1].indexOf(level) > -1 && currentGroupId == nextCellGroupId);

  };

  /**
   * Check if the previous cell of the dimension (row / column) contains a group at the same level
   * @param dimension
   * @param currentPosition
   * @param level
   * @param currentGroupId
   * @returns {boolean}
   */
  var previousIndexSharesLevel = function (dimension, currentPosition, level, currentGroupId) {
    var previousCellGroupId
      , levelsByOrder;

    switch (dimension) {
      case 'rows':
        previousCellGroupId = getGroupByRowAndLevel(currentPosition - 1, level).id;
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByRows();
        break;
      case 'cols':
        previousCellGroupId = getGroupByColAndLevel(currentPosition - 1, level).id;
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByCols();
        break;
    }

    return !!(levelsByOrder[currentPosition - 1] && levelsByOrder[currentPosition - 1].indexOf(level) > -1 && currentGroupId == previousCellGroupId);

  };

  /**
   * Check if the provided index is at the end of the group indicator line
   * @param dimension
   * @param index
   * @param level
   * @param currentGroupId
   * @returns {boolean}
   */
  var isLastIndexOfTheLine = function (dimension, index, level, currentGroupId) {
    if (index === 0) {
      return false;
    }
    var levelsByOrder
      , entriesLength
      , previousSharesLevel = previousIndexSharesLevel(dimension, index, level, currentGroupId)
      , nextSharesLevel = nextIndexSharesLevel(dimension, index, level, currentGroupId)
      , nextIsHidden = false;

    switch (dimension) {
      case 'rows':
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByRows();
        entriesLength = instance.countRows();
        for (var i = 0; i <= levels.rows; i++) {
          if (hiddenRows[i] && hiddenRows[i][index + 1]) {
            nextIsHidden = true;
            break;
          }
        }
        break;
      case 'cols':
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByCols();
        entriesLength = instance.countCols();
        for (var i = 0; i <= levels.cols; i++) {
          if (hiddenCols[i] && hiddenCols[i][index + 1]) {
            nextIsHidden = true;
            break;
          }
        }
        break;
    }

    if (previousSharesLevel) {
      if (index == entriesLength - 1) {
        return true;
      } else if (!nextSharesLevel || (nextSharesLevel && nextIsHidden)) {
        return true;
      } else if (!levelsByOrder[index + 1]) {
        return true;
      }
    }
    return false;
  };

  /**
   * Check if all rows/cols are hidden
   * @param dataType
   */
  var isLastHidden = function (dataType) {
    var levelAmount;

    switch (dataType) {
      case 'rows':
        levelAmount = levels.rows;
        for (var j = 0; j <= levelAmount; j++) {
          if (hiddenRows[j] && hiddenRows[j][instance.countRows() - 1]) {
            return true;
          }
        }

        break;
      case 'cols':
        levelAmount = levels.cols;
        for (var j = 0; j <= levelAmount; j++) {
          if (hiddenCols[j] && hiddenCols[j][instance.countCols() - 1]) {
            return true;
          }
        }
        break;
    }

    return false;
  };

  /**
   * Check if the provided index is at the beginning of the group indicator line
   * @param dimension
   * @param index
   * @param level
   * @param currentGroupId
   * @returns {boolean}
   */
  var isFirstIndexOfTheLine = function (dimension, index, level, currentGroupId) {
    var levelsByOrder
      , entriesLength
      , currentGroup = getGroupById(currentGroupId)
      , previousAreHidden = false
      , arePreviousHidden = function (dimension) {
        var hidden = false
          , hiddenArr = dimension == 'rows' ? hiddenRows : hiddenCols;
        for (var i = 0; i <= levels[dimension]; i++) {
          tempInd = index;
          while (currentGroup[dimension].indexOf(tempInd) > -1) {
            hidden = !!(hiddenArr[i] && hiddenArr[i][tempInd]);
            tempInd--;
          }
          if (hidden) {
            break;
          }
        }
        return hidden;
      }
      , previousSharesLevel = previousIndexSharesLevel(dimension, index, level, currentGroupId)
      , nextSharesLevel = nextIndexSharesLevel(dimension, index, level, currentGroupId)
      , tempInd;

    switch (dimension) {
      case 'rows':
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByRows();
        entriesLength = instance.countRows();
        previousAreHidden = arePreviousHidden(dimension);
        break;
      case 'cols':
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByCols();
        entriesLength = instance.countCols();
        previousAreHidden = arePreviousHidden(dimension);
        break;
    }

    if (index == entriesLength - 1) {
      return false;
    }
    else if (index === 0) {
      if (nextSharesLevel) {
        return true;
      }
    } else if (!previousSharesLevel || (previousSharesLevel && previousAreHidden)) {
      if (nextSharesLevel) {
        return true;
      }
    } else if (!levelsByOrder[index - 1]) {
      if (nextSharesLevel) {
        return true;
      }
    }
    return false;
  };

  /**
   * Add group expander button
   * @param dimension
   * @param index
   * @param level
   * @param id
   * @param elem
   * @returns {*}
   */
  var addGroupExpander = function (dataType, index, level, id, elem) {
    var previousIndexGroupId;

    switch (dataType) {
      case 'rows':
        previousIndexGroupId = getGroupByRowAndLevel(index - 1, level).id;
        break;
      case 'cols':
        previousIndexGroupId = getGroupByColAndLevel(index - 1, level).id;
        break;
    }

    if (!previousIndexGroupId) {
      return null;
    }

    if (index > 0) {
      if (previousIndexSharesLevel(dataType, index - 1, level, previousIndexGroupId) && previousIndexGroupId != id) {

        var expanderButton = document.createElement('DIV');
        Handsontable.Dom.addClass(expanderButton, classes.expandButton);
        expanderButton.id = 'htExpand-' + previousIndexGroupId;
        expanderButton.appendChild(document.createTextNode('+'));
        expanderButton.setAttribute('data-level', level);
        expanderButton.setAttribute('data-type', dataType);
        expanderButton.setAttribute('data-hidden', "1");

        elem.appendChild(expanderButton);

        return expanderButton;
      }
    }
    return null;
  };

  /**
   * Check if provided cell is collapsed (either by rows or cols)
   * @param currentPosition
   * @returns {boolean}
   */
  var isCollapsed = function (currentPosition) {
    var rowGroups = getRowGroups()
      , colGroups = getColGroups();

    for (var i = 0, rowGroupsCount = rowGroups.length; i < rowGroupsCount; i++) {
      if (rowGroups[i].rows.indexOf(currentPosition.row) > -1 && rowGroups[i].hidden) {
        return true;
      }
    }

    if (currentPosition.col === null) { // if col is set to null, check only rows
      return false;
    }

    for (var i = 0, colGroupsCount = colGroups.length; i < colGroupsCount; i++) {
      if (colGroups[i].cols.indexOf(currentPosition.col) > -1 && colGroups[i].hidden) {
        return true;
      }
    }

    return false;
  };

  return {

    /**
     * all groups for ht instance
     */
    getGroups: function () {
      return groups;
    },
    /**
     * All levels for rows and cols respectively
     */
    getLevels: function () {
      return levels;
    },
    /**
     * Current instance
     */
    instance: instance,
    /**
     * Initial setting for minSpareRows
     */
    baseSpareRows: instance.getSettings().minSpareRows,
    /**
     * Initial setting for minSpareCols
     */
    baseSpareCols: instance.getSettings().minSpareCols,

    getRowGroups: getRowGroups,
    getColGroups: getColGroups,
    /**
     * init group
     * @param {Object} settings, could be an array of objects [{cols: [0,1,2]}, {cols: [3,4,5]}, {rows: [0,1]}]
     */
    init: function () {
      var groupsSetting = instance.getSettings().groups;
      if (groupsSetting) {
        if (Array.isArray(groupsSetting)) {
          Handsontable.Grouping.initGroups(groupsSetting);
        }
      }
    },

    /**
     * init groups from configuration on startup
     */
    initGroups: function (initialGroups) {
      var that = this;

      groups = [];

      initialGroups.forEach(function (item) {
        var _group = [],
          isRow = false,
          isCol = false;

        if (Array.isArray(item.rows)) {
          _group = item.rows;
          isRow = true;
        } else if (Array.isArray(item.cols)) {
          _group = item.cols;
          isCol = true;
        }

        var from = _group[0],
          to = _group[_group.length - 1];

        if (isRow) {
          groupRows(from, to);
        } else if (isCol) {
          groupCols(from, to);
        }
      });
//      this.render();
    },

    /**
     * Remove all existing groups
     */
    resetGroups: function () {
      groups = [];
      counters = {
        rows: 0,
        cols: 0
      };
      levels = {
        rows: 0,
        cols: 0
      };

      var allOccurrences;
      for (var i in classes) {
        if (typeof classes[i] != 'function') {
          allOccurrences = document.querySelectorAll('.' + classes[i]);
          for (var j = 0, occurrencesLength = allOccurrences.length; j < occurrencesLength; j++) {
            Handsontable.Dom.removeClass(allOccurrences[j], classes[i]);
          }
        }
      }

      var otherClasses = ['htGroupColClosest', 'htGroupCol'];
      for (var i = 0, otherClassesLength = otherClasses.length; i < otherClassesLength; i++) {
        allOccurrences = document.querySelectorAll('.' + otherClasses[i]);
        for (var j = 0, occurrencesLength = allOccurrences.length; j < occurrencesLength; j++) {
          Handsontable.Dom.removeClass(allOccurrences[j], otherClasses[i]);
        }
      }
    },
    /**
     * Update groups from the instance settings
     */
    updateGroups: function () {
      var groupSettings = this.getSettings().groups;

      Handsontable.Grouping.resetGroups();
      Handsontable.Grouping.initGroups(groupSettings);
    },
    afterGetRowHeader: function (row, TH) {
      var currentRowHidden = false;
      for (var i = 0, levels = hiddenRows.length; i < levels; i++) {
        if (hiddenRows[i] && hiddenRows[i][row] === true) {
          currentRowHidden = true;
        }
      }

      if (currentRowHidden) {
        Handsontable.Dom.addClass(TH.parentNode, 'hidden');
      } else if (!currentRowHidden && Handsontable.Dom.hasClass(TH.parentNode, 'hidden')) {
        Handsontable.Dom.removeClass(TH.parentNode, 'hidden');
      }

    },
    afterGetColHeader: function (col, TH) {
      var rowHeaders = this.view.wt.wtSettings.getSetting('rowHeaders').length
        , thisColgroup = instance.rootElement.querySelectorAll('colgroup col:nth-child(' + parseInt(col + rowHeaders + 1, 10) + ')');

      if (thisColgroup.length === 0) {
        return;
      }

      var currentColHidden = false;
      for (var i = 0, levels = hiddenCols.length; i < levels; i++) {
        if (hiddenCols[i] && hiddenCols[i][col] === true) {
          currentColHidden = true;
        }
      }

      if (currentColHidden) {
        for (var i = 0, colsAmount = thisColgroup.length; i < colsAmount; i++) {
          Handsontable.Dom.addClass(thisColgroup[i], 'hidden');
        }
      } else if (!currentColHidden && Handsontable.Dom.hasClass(thisColgroup[0], 'hidden')) {
        for (var i = 0, colsAmount = thisColgroup.length; i < colsAmount; i++) {
          Handsontable.Dom.removeClass(thisColgroup[i], 'hidden');
        }
      }
    },
    /**
     * Create a renderer for additional row/col headers, acting as group indicators
     * @param walkontableConfig
     * @param direction
     */
    groupIndicatorsFactory: function (renderersArr, direction) {
      var groupsLevelsList
        , getCurrentLevel
        , getCurrentGroupId
        , dataType
        , getGroupByIndexAndLevel
        , headersType
        , currentHeaderModifier
        , createLevelTriggers;

      switch (direction) {
        case 'horizontal':
          groupsLevelsList = Handsontable.Grouping.getGroupLevelsByCols();
          getCurrentLevel = function (elem) {
            return Array.prototype.indexOf.call(elem.parentNode.parentNode.childNodes, elem.parentNode) + 1;
          };
          getCurrentGroupId = function (col, level) {
            return getGroupByColAndLevel(col, level).id;
          };
          dataType = 'cols';
          getGroupByIndexAndLevel = function (col, level) {
            return getGroupByColAndLevel(col - 1, level);
          };
          headersType = "columnHeaders";
          currentHeaderModifier = function (headerRenderers) {
            if (headerRenderers.length === 1) {
              var oldFn = headerRenderers[0];

              headerRenderers[0] = function (index, elem, level) {

                if (index < -1) {
                  makeGroupIndicatorsForLevel()(index, elem, level);
                } else {
                  Handsontable.Dom.removeClass(elem, classes.groupIndicatorContainer);
                  oldFn(index, elem, level);
                }
              };
            }
            return function () {
              return headerRenderers;
            };
          };
          createLevelTriggers = true;
          break;
        case 'vertical':
          groupsLevelsList = Handsontable.Grouping.getGroupLevelsByRows();
          getCurrentLevel = function (elem) {
            return Handsontable.Dom.index(elem) + 1;
          };
          getCurrentGroupId = function (row, level) {
            return getGroupByRowAndLevel(row, level).id;
          };
          dataType = 'rows';
          getGroupByIndexAndLevel = function (row, level) {
            return getGroupByRowAndLevel(row - 1, level);
          };
          headersType = "rowHeaders";
          currentHeaderModifier = function (headerRenderers) {
            return headerRenderers;
          };
          break;
      }

      var createButton = function (parent) {
        var button = document.createElement('div');

        parent.appendChild(button);

        return {
          button: button,
          addClass: function (className) {
            Handsontable.Dom.addClass(button, className);
          }
        };
      };

      var makeGroupIndicatorsForLevel = function () {
        var directionClassname = direction.charAt(0).toUpperCase() + direction.slice(1); // capitalize the first letter

        return function (index, elem, level) { // header rendering function

          level++;
          var child
            , collapseButton;

          /* jshint -W084 */
          while (child = elem.lastChild) {
            elem.removeChild(child);
          }

          Handsontable.Dom.addClass(elem, classes.groupIndicatorContainer);

          var currentGroupId = getCurrentGroupId(index, level);

          if (index > -1 && (groupsLevelsList[index] && groupsLevelsList[index].indexOf(level) > -1)) {

            collapseButton = createButton(elem);
            collapseButton.addClass(classes.groupIndicator(directionClassname));

            if (isFirstIndexOfTheLine(dataType, index, level, currentGroupId)) { // add a little thingy and the top of the group indicator
              collapseButton.addClass(classes.groupStart);
            }

            if (isLastIndexOfTheLine(dataType, index, level, currentGroupId)) { // add [+]/[-] button at the end of the line
              collapseButton.button.appendChild(document.createTextNode('-'));
              collapseButton.addClass(classes.collapseButton);
              collapseButton.button.id = classes.collapseGroupId(currentGroupId);
              collapseButton.button.setAttribute('data-level', level);
              collapseButton.button.setAttribute('data-type', dataType);
            }

          }

          if (createLevelTriggers) {
            var rowInd = Handsontable.Dom.index(elem.parentNode);
            if (index === -1 || (index < -1 && rowInd === Handsontable.Grouping.getLevels().cols + 1) ||
                (rowInd === 0 && Handsontable.Grouping.getLevels().cols === 0)) {
              collapseButton = createButton(elem);
              collapseButton.addClass(classes.levelTrigger);

              if (index === -1) {
                collapseButton.button.id = classes.collapseFromLevel("Cols", level);
                collapseButton.button.appendChild(document.createTextNode(level));
              } else if (index < -1 && rowInd === Handsontable.Grouping.getLevels().cols + 1 ||
                  (rowInd === 0 && Handsontable.Grouping.getLevels().cols === 0)) {
                var colInd = Handsontable.Dom.index(elem) + 1;
                collapseButton.button.id = classes.collapseFromLevel("Rows", colInd);
                collapseButton.button.appendChild(document.createTextNode(colInd));
              }
            }
          }

          // add group expending button
          var expanderButton = addGroupExpander(dataType, index, level, currentGroupId, elem);
          if (index > 0) {
            var previousGroupObj = getGroupByIndexAndLevel(index - 1, level);

            if (expanderButton && previousGroupObj.hidden) {
              Handsontable.Dom.addClass(expanderButton, classes.clickable);
            }
          }

          updateHeaderWidths();

        };
      };


      renderersArr = currentHeaderModifier(renderersArr);


      if (counters[dataType] > 0) {
        for (var i = 0; i < levels[dataType] + 1; i++) { // for each level of col groups add a header renderer
          if (!Array.isArray(renderersArr)) {
            renderersArr = typeof renderersArr === 'function' ? renderersArr() : new Array(renderersArr);
          }
          renderersArr.unshift(makeGroupIndicatorsForLevel());
        }
      }
    },
    /**
     * Get group levels array arranged by rows
     * @returns {Array}
     */
    getGroupLevelsByRows: function () {
      var rowGroups = getRowGroups()
        , result = [];

      for (var i = 0, groupsLength = rowGroups.length; i < groupsLength; i++) {
        if (rowGroups[i].rows) {
          for (var j = 0, groupRowsLength = rowGroups[i].rows.length; j < groupRowsLength; j++) {
            if (!result[rowGroups[i].rows[j]]) {
              result[rowGroups[i].rows[j]] = [];
            }
            result[rowGroups[i].rows[j]].push(rowGroups[i].level);
          }
        }
      }
      return result;
    },
    /**
     * Get group levels array arranged by cols
     * @returns {Array}
     */
    getGroupLevelsByCols: function () {
      var colGroups = getColGroups()
        , result = [];

      for (var i = 0, groupsLength = colGroups.length; i < groupsLength; i++) {
        if (colGroups[i].cols) {
          for (var j = 0, groupColsLength = colGroups[i].cols.length; j < groupColsLength; j++) {
            if (!result[colGroups[i].cols[j]]) {
              result[colGroups[i].cols[j]] = [];
            }
            result[colGroups[i].cols[j]].push(colGroups[i].level);
          }
        }
      }
      return result;
    },
    /**
     * Toggle the group visibility ( + / - event handler)
     * @param event
     * @param coords
     * @param TD
     */
    toggleGroupVisibility: function (event, coords, TD) {
      if (Handsontable.Dom.hasClass(event.target, classes.expandButton) ||
          Handsontable.Dom.hasClass(event.target, classes.collapseButton) ||
          Handsontable.Dom.hasClass(event.target, classes.levelTrigger)) {
        var element = event.target
          , elemIdSplit = element.id.split('-');

        var groups = []
          , id
          , level
          , type
          , hidden;

        var prepareGroupData = function (componentElement) {
          if (componentElement) {
            element = componentElement;
          }

          elemIdSplit = element.id.split('-');

          id = elemIdSplit[1];
          level = parseInt(element.getAttribute('data-level'), 10);
          type = element.getAttribute('data-type');
          hidden = parseInt(element.getAttribute('data-hidden'));

          if (isNaN(hidden)) {
            hidden = 1;
          } else {
            hidden = (hidden ? 0 : 1);
          }

          element.setAttribute('data-hidden', hidden.toString());


          groups.push(getGroupById(id));
        };

        if (element.className.indexOf(classes.levelTrigger) > -1) { // show levels below, hide all above
          var groupsInLevel
            , groupsToExpand = []
            , groupsToCollapse = []
            , levelType = element.id.indexOf("Rows") > -1 ? "rows" : "cols";

          for (var i = 1, levelsCount = levels[levelType]; i <= levelsCount; i++) {
            groupsInLevel = levelType == "rows" ? getRowGroupsByLevel(i) : getColGroupsByLevel(i);

            if (i >= parseInt(elemIdSplit[1], 10)) {
              for (var j = 0, groupCount = groupsInLevel.length; j < groupCount; j++) {
                groupsToCollapse.push(groupsInLevel[j]);
              }
            } else {
              for (var j = 0, groupCount = groupsInLevel.length; j < groupCount; j++) {
                groupsToExpand.push(groupsInLevel[j]);
              }
            }
          }

          showHideGroups(true, groupsToCollapse);
          showHideGroups(false, groupsToExpand);

        } else {
          prepareGroupData();
          showHideGroups(hidden, groups);
        }

        // add the expander button to a dummy spare row/col, if no longer needed -> remove it
        /* jshint -W038 */
        type = type || levelType;

        var lastHidden = isLastHidden(type)
          , typeUppercase = type.charAt(0).toUpperCase() + type.slice(1)
          , spareElements = Handsontable.Grouping['baseSpare' + typeUppercase];

        if (lastHidden) {
          /* jshint -W041 */
          if (spareElements == 0) {
            instance.alter('insert_' + type.slice(0, -1), instance['count' + typeUppercase]());
            Handsontable.Grouping["dummy" + type.slice(0, -1)] = true;
          }
        } else {
          /* jshint -W041 */
          if (spareElements == 0) {
            if (Handsontable.Grouping["dummy" + type.slice(0, -1)]) {
              instance.alter('remove_' + type.slice(0, -1), instance['count' + typeUppercase]() - 1);
              Handsontable.Grouping["dummy" + type.slice(0, -1)] = false;
            }
          }
        }

        instance.render();

        event.stopImmediatePropagation();
      }
    },
    /**
     * Modify the delta when changing cells using keyobard
     * @param position
     * @returns {Function}
     */
    modifySelectionFactory: function (position) {
      var instance = this.instance;
      var currentlySelected
        , nextPosition = new WalkontableCellCoords(0, 0)
        , nextVisible = function (direction, currentPosition) { // updates delta to skip to the next visible cell
          var updateDelta = 0;

          switch (direction) {
            case 'down':
              while (isCollapsed(currentPosition)) {
                updateDelta++;
                currentPosition.row += 1;
              }
              break;
            case 'up':
              while (isCollapsed(currentPosition)) {
                updateDelta--;
                currentPosition.row -= 1;
              }
              break;
            case 'right':
              while (isCollapsed(currentPosition)) {
                updateDelta++;
                currentPosition.col += 1;
              }
              break;
            case 'left':
              while (isCollapsed(currentPosition)) {
                updateDelta--;
                currentPosition.col -= 1;
              }
              break;
          }

          return updateDelta;
        }
        , updateDelta = function (delta, nextPosition) {
          if (delta.row > 0) { // moving down
            if (isCollapsed(nextPosition)) {
              delta.row += nextVisible('down', nextPosition);
            }
          } else if (delta.row < 0) { // moving up
            if (isCollapsed(nextPosition)) {
              delta.row += nextVisible('up', nextPosition);
            }
          }

          if (delta.col > 0) { // moving right
            if (isCollapsed(nextPosition)) {
              delta.col += nextVisible('right', nextPosition);
            }
          } else if (delta.col < 0) { // moving left
            if (isCollapsed(nextPosition)) {
              delta.col += nextVisible('left', nextPosition);
            }
          }
        };

      /* jshint -W027 */
      switch (position) {
        case 'start':
          return function (delta) {
            currentlySelected = instance.getSelected();
            nextPosition.row = currentlySelected[0] + delta.row;
            nextPosition.col = currentlySelected[1] + delta.col;

            updateDelta(delta, nextPosition);
          };
          break;
        case 'end':
          return function (delta) {
            currentlySelected = instance.getSelected();
            nextPosition.row = currentlySelected[2] + delta.row;
            nextPosition.col = currentlySelected[3] + delta.col;

            updateDelta(delta, nextPosition);
          };
          break;
      }
    },
    modifyRowHeight: function (height, row) {
      if (instance.view.wt.wtTable.rowFilter && isCollapsed({row: row, col: null})) {
        return 0;
      }
    },
    validateGroups: function () {

      var areRangesOverlapping = function (a, b) {
        if ((a[0] < b[0] && a[1] < b[1] && b[0] <= a[1]) ||
            (a[0] > b[0] && b[1] < a[1] && a[0] <= b[1])) {
          return true;
        }
      };

      var configGroups = instance.getSettings().groups
        , cols = []
        , rows = [];

      for (var i = 0, groupsLength = configGroups.length; i < groupsLength; i++) {
        if (configGroups[i].rows) {
          /* jshint -W027 */
          if(configGroups[i].rows.length === 1) { // single-entry group
            throw new Error("Grouping error:  Group {" + configGroups[i].rows[0] + "} is invalid. Cannot define single-entry groups.");
            return false;
          } else if(configGroups[i].rows.length === 0) {
            throw new Error("Grouping error:  Cannot define empty groups.");
            return false;
          }

          rows.push(configGroups[i].rows);

          for (var j = 0, rowsLength = rows.length; j < rowsLength; j++) {
            if (areRangesOverlapping(configGroups[i].rows, rows[j])) {

              throw new Error("Grouping error:  ranges {" + configGroups[i].rows[0] + ", " + configGroups[i].rows[1] + "} and {" + rows[j][0] + ", " + rows[j][1] + "} are overlapping.");
              return false;
            }
          }
        } else if (configGroups[i].cols) {

          if(configGroups[i].cols.length === 1) { // single-entry group
            throw new Error("Grouping error:  Group {" + configGroups[i].cols[0] + "} is invalid. Cannot define single-entry groups.");
            return false;
          } else if(configGroups[i].cols.length === 0) {
            throw new Error("Grouping error:  Cannot define empty groups.");
            return false;
          }

          cols.push(configGroups[i].cols);

          for (var j = 0, colsLength = cols.length; j < colsLength; j++) {
            if (areRangesOverlapping(configGroups[i].cols, cols[j])) {

              throw new Error("Grouping error:  ranges {" + configGroups[i].cols[0] + ", " + configGroups[i].cols[1] + "} and {" + cols[j][0] + ", " + cols[j][1] + "} are overlapping.");
              return false;
            }
          }
        }
      }

      return true;
    },
    afterGetRowHeaderRenderers: function (arr) {
      Handsontable.Grouping.groupIndicatorsFactory(arr, 'vertical');
    },
    afterGetColumnHeaderRenderers: function (arr) {
      Handsontable.Grouping.groupIndicatorsFactory(arr, 'horizontal');
    },
    hookProxy: function (fn, arg) {
      return function () {
        if (instance.getSettings().groups) {
          return arg ? Handsontable.Grouping[fn](arg).apply(this, arguments) : Handsontable.Grouping[fn].apply(this, arguments);
        } else {
          return void 0;
        }
      };
    }
  };
};

/**
 * create new instance
 */
var init = function () {
  var instance = this,
    groupingSetting = !!(instance.getSettings().groups);


  if (groupingSetting) {
    var headerUpdates = {};

    Handsontable.Grouping = new Grouping(instance);

    if (!instance.getSettings().rowHeaders) { // force using rowHeaders  --  needs to be changed later
      headerUpdates.rowHeaders = true;
    }
    if (!instance.getSettings().colHeaders) { // force using colHeaders  --  needs to be changed later
      headerUpdates.colHeaders = true;
    }
    if (headerUpdates.colHeaders || headerUpdates.rowHeaders) {
      instance.updateSettings(headerUpdates);
    }

    var groupConfigValid = Handsontable.Grouping.validateGroups();
    if (!groupConfigValid) {
      return;
    }

    instance.addHook('beforeInit', Handsontable.Grouping.hookProxy('init'));
    instance.addHook('afterUpdateSettings', Handsontable.Grouping.hookProxy('updateGroups'));
    instance.addHook('afterGetColumnHeaderRenderers', Handsontable.Grouping.hookProxy('afterGetColumnHeaderRenderers'));
    instance.addHook('afterGetRowHeaderRenderers', Handsontable.Grouping.hookProxy('afterGetRowHeaderRenderers'));
    instance.addHook('afterGetRowHeader', Handsontable.Grouping.hookProxy('afterGetRowHeader'));
    instance.addHook('afterGetColHeader', Handsontable.Grouping.hookProxy('afterGetColHeader'));
    instance.addHook('beforeOnCellMouseDown', Handsontable.Grouping.hookProxy('toggleGroupVisibility'));
    instance.addHook('modifyTransformStart', Handsontable.Grouping.hookProxy('modifySelectionFactory', 'start'));
    instance.addHook('modifyTransformEnd', Handsontable.Grouping.hookProxy('modifySelectionFactory', 'end'));
    instance.addHook('modifyRowHeight', Handsontable.Grouping.hookProxy('modifyRowHeight'));
  }
};

/**
 * Update headers widths for the group indicators
 */
// TODO: this needs cleaning up
var updateHeaderWidths = function () {
  var colgroups = document.querySelectorAll('colgroup');
  for (var i = 0, colgroupsLength = colgroups.length; i < colgroupsLength; i++) {
    var rowHeaders = colgroups[i].querySelectorAll('col.rowHeader');
    if (rowHeaders.length === 0) {
      return;
    }
    for (var j = 0, rowHeadersLength = rowHeaders.length + 1; j < rowHeadersLength; j++) {
      if (rowHeadersLength == 2) {
        return;
      }
      if (j < Handsontable.Grouping.getLevels().rows + 1) {
        if (j == Handsontable.Grouping.getLevels().rows) {
          Handsontable.Dom.addClass(rowHeaders[j], 'htGroupColClosest');
        } else {
          Handsontable.Dom.addClass(rowHeaders[j], 'htGroupCol');
        }
      }
    }
  }
};

Handsontable.hooks.add('beforeInit', init);

Handsontable.hooks.add('afterUpdateSettings', function () {

  if (this.getSettings().groups && !Handsontable.Grouping) {
    init.call(this, arguments);
  } else if (!this.getSettings().groups && Handsontable.Grouping) {
    Handsontable.Grouping.resetGroups();
    Handsontable.Grouping = void 0;
  }
});

Handsontable.plugins.Grouping = Grouping;

(function (Handsontable) {
  /**
   * Plugin used to allow user to copy and paste from the context menu
   * Currently uses ZeroClipboard due to browser limitations
   * @constructor
   */
  function ContextMenuCopyPaste() {
    this.zeroClipboardInstance = null;
    this.instance = null;
  }

  /**
   * Configure ZeroClipboard
   */
  ContextMenuCopyPaste.prototype.prepareZeroClipboard = function () {
    if(this.swfPath) {
      ZeroClipboard.config({
        swfPath: this.swfPath
      });
    }
  };

  /**
   * Copy action
   * @returns {CopyPasteClass.elTextarea.value|*}
   */
  ContextMenuCopyPaste.prototype.copy = function () {
    this.instance.copyPaste.setCopyableText();
    return this.instance.copyPaste.copyPasteInstance.elTextarea.value;
  };

  /**
   * Adds copy/paste items to context menu
   */
  ContextMenuCopyPaste.prototype.addToContextMenu = function (defaultOptions) {
    if (!this.getSettings().contextMenuCopyPaste) {
      return;
    }

    defaultOptions.items.unshift(
      {
        key: 'copy',
        name: 'Copy'
      },
      {
        key: 'paste',
        name: 'Paste',
        callback: function () {
          this.copyPaste.triggerPaste();
        }
      },
      Handsontable.ContextMenu.SEPARATOR
    );
  };

  /**
   * Setup ZeroClipboard swf clip position and event handlers
   * @param cmInstance Current context menu instance
   */
  ContextMenuCopyPaste.prototype.setupZeroClipboard = function (cmInstance) {
    var plugin = this;
    this.cmInstance = cmInstance;

    if (!Handsontable.Dom.hasClass(this.cmInstance.rootElement, 'htContextMenu')) {
      return;
    }

    var data = cmInstance.getData();
    for (var i = 0, ilen = data.length; i < ilen; i++) { //find position of 'copy' option
      /*jshint -W083 */
      if (data[i].key === 'copy') {
        this.zeroClipboardInstance = new ZeroClipboard(cmInstance.getCell(i, 0));

        this.zeroClipboardInstance.off();
        this.zeroClipboardInstance.on("copy", function (event) {
          var clipboard = event.clipboardData;
          clipboard.setData("text/plain", plugin.copy());
          plugin.instance.getSettings().outsideClickDeselects = plugin.outsideClickDeselectsCache;
        });

        cmCopyPaste.bindEvents();
        break;
      }
    }
  };

  /**
   * Bind all the standard events
   */
  ContextMenuCopyPaste.prototype.bindEvents = function () {
    var plugin = this;

    // Workaround for 'current' and 'zeroclipboard-is-hover' classes being stuck when moving the cursor over the context menu
    if (plugin.cmInstance) {

      var eventManager = new Handsontable.eventManager(this.instance);

      var removeCurrenClass = function (event) {
        var hadClass = plugin.cmInstance.rootElement.querySelector('td.current');
        if (hadClass) {
          Handsontable.Dom.removeClass(hadClass, 'current');
        }
        plugin.outsideClickDeselectsCache = plugin.instance.getSettings().outsideClickDeselects;
        plugin.instance.getSettings().outsideClickDeselects = false;
      };

      var removeZeroClipboardClass = function (event) {
        var hadClass = plugin.cmInstance.rootElement.querySelector('td.zeroclipboard-is-hover');
        if (hadClass) {
          Handsontable.Dom.removeClass(hadClass, 'zeroclipboard-is-hover');
        }
        plugin.instance.getSettings().outsideClickDeselects = plugin.outsideClickDeselectsCache;
      };

      eventManager.removeEventListener(document,'mouseenter', function () {
        removeCurrenClass();
      });
      eventManager.addEventListener(document, 'mouseenter', function (e) {
        removeCurrenClass();
      });

      eventManager.removeEventListener(document,'mouseleave', function () {
        removeZeroClipboardClass();
      });
      eventManager.addEventListener(document, 'mouseleave', function (e) {
        removeZeroClipboardClass();
      });


    }
  };

  /**
   * Initialize plugin
   * @returns {boolean} Returns false if ZeroClipboard is not properly included
   */
  ContextMenuCopyPaste.prototype.init = function () {
    if (!this.getSettings().contextMenuCopyPaste) {
      return;
    } else if (typeof this.getSettings().contextMenuCopyPaste == "object") {
      cmCopyPaste.swfPath = this.getSettings().contextMenuCopyPaste.swfPath;
    }

    /* jshint ignore:start */
    if (typeof ZeroClipboard === 'undefined') {
      throw new Error("To be able to use the Copy/Paste feature from the context menu, you need to manualy include ZeroClipboard.js file to your website.");

      return false;
    }
    try {
      var flashTest = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
    } catch(exception) {
      if (!('undefined' != typeof navigator.mimeTypes['application/x-shockwave-flash'])) {
        throw new Error("To be able to use the Copy/Paste feature from the context menu, your browser needs to have Flash Plugin installed.");

        return false;
      }
    }
    /* jshint ignore:end */

    cmCopyPaste.instance = this;
    cmCopyPaste.prepareZeroClipboard();
  };

  var cmCopyPaste = new ContextMenuCopyPaste();

  Handsontable.hooks.add('afterRender', function () {
    cmCopyPaste.setupZeroClipboard(this);
  });

  Handsontable.hooks.add('afterInit', cmCopyPaste.init);
  Handsontable.hooks.add('afterContextMenuDefaultOptions', cmCopyPaste.addToContextMenu);
  Handsontable.ContextMenuCopyPaste = ContextMenuCopyPaste;

})(Handsontable);

(function (Handsontable) {
  'use strict';

  function MultipleSelectionHandles(instance) {
    this.instance = instance;
    this.dragged = [];

    this.eventManager = Handsontable.eventManager(instance);

    this.bindTouchEvents();
  }

  MultipleSelectionHandles.prototype.getCurrentRangeCoords = function (selectedRange, currentTouch, touchStartDirection, currentDirection, draggedHandle) {
    var topLeftCorner = selectedRange.getTopLeftCorner()
      , bottomRightCorner = selectedRange.getBottomRightCorner()
      , bottomLeftCorner = selectedRange.getBottomLeftCorner()
      , topRightCorner = selectedRange.getTopRightCorner();

    var newCoords = {
      start: null,
      end: null
    };

    switch (touchStartDirection) {
      case "NE-SW":
        switch (currentDirection) {
          case "NE-SW":
          case "NW-SE":
            if (draggedHandle == "topLeft") {
              newCoords = {
                start: new WalkontableCellCoords(currentTouch.row, selectedRange.highlight.col),
                end: new WalkontableCellCoords(bottomLeftCorner.row, currentTouch.col)
              };
            } else {
              newCoords = {
                start: new WalkontableCellCoords(selectedRange.highlight.row, currentTouch.col),
                end: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col)
              };
            }
            break;
          case "SE-NW":
            if (draggedHandle == "bottomRight") {
              newCoords = {
                start: new WalkontableCellCoords(bottomRightCorner.row, currentTouch.col),
                end: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col)
              };
            }
            break;
          //case "SW-NE":
          //  break;
        }
        break;
      case "NW-SE":
        switch (currentDirection) {
          case "NE-SW":
            if (draggedHandle == "topLeft") {
              newCoords = {
                start: currentTouch,
                end: bottomLeftCorner
              };
            } else {
              newCoords.end  = currentTouch;
            }
            break;
          case "NW-SE":
            if (draggedHandle == "topLeft") {
              newCoords = {
                start: currentTouch,
                end: bottomRightCorner
              };
            } else {
              newCoords.end  = currentTouch;
            }
            break;
          case "SE-NW":
            if (draggedHandle == "topLeft") {
              newCoords = {
                start: currentTouch,
                end: topLeftCorner
              };
            } else {
              newCoords.end  = currentTouch;
            }
            break;
          case "SW-NE":
            if (draggedHandle == "topLeft") {
              newCoords = {
                start: currentTouch,
                end: topRightCorner
              };
            } else {
              newCoords.end  = currentTouch;
            }
            break;
        }
        break;
      case "SW-NE":
        switch (currentDirection) {
          case "NW-SE":
            if (draggedHandle == "bottomRight") {
              newCoords = {
                start: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col),
                end: new WalkontableCellCoords(bottomLeftCorner.row, currentTouch.col)
              };
            } else {
              newCoords = {
                start: new WalkontableCellCoords(topLeftCorner.row, currentTouch.col),
                end: new WalkontableCellCoords(currentTouch.row, bottomRightCorner.col)
              };
            }
            break;
          //case "NE-SW":
          //
          //  break;
          case "SW-NE":
            if (draggedHandle == "topLeft") {
              newCoords = {
                start: new WalkontableCellCoords(selectedRange.highlight.row, currentTouch.col),
                end: new WalkontableCellCoords(currentTouch.row, bottomRightCorner.col)
              };
            } else {
              newCoords = {
                start: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col),
                end: new WalkontableCellCoords(topLeftCorner.row, currentTouch.col)
              };
            }
            break;
          case "SE-NW":
            if (draggedHandle == "bottomRight") {
              newCoords = {
                start: new WalkontableCellCoords(currentTouch.row, topRightCorner.col),
                end: new WalkontableCellCoords(topLeftCorner.row, currentTouch.col)
              };
            } else if (draggedHandle == "topLeft") {
              newCoords = {
                start: bottomLeftCorner,
                end: currentTouch
              };
            }
            break;
        }
        break;
      case "SE-NW":
        switch (currentDirection) {
          case "NW-SE":
          case "NE-SW":
          case "SW-NE":
            if (draggedHandle == "topLeft") {
              newCoords.end = currentTouch;
            }
            break;
          case "SE-NW":
            if (draggedHandle == "topLeft") {
              newCoords.end = currentTouch;
            } else {
              newCoords = {
                start: currentTouch,
                end: topLeftCorner
              };
            }
            break;
        }
        break;
    }

    return newCoords;
  };

  MultipleSelectionHandles.prototype.bindTouchEvents = function () {
    var that = this;
    var removeFromDragged = function (query) {

      if (this.dragged.length == 1) {
        this.dragged = [];
        return true;
      }

      var entryPosition = this.dragged.indexOf(query);

      if (entryPosition == -1) {
        return false;
      } else if (entryPosition === 0) {
        this.dragged = this.dragged.slice(0, 1);
      } else if (entryPosition == 1) {
        this.dragged = this.dragged.slice(-1);
      }
    };

    this.eventManager.addEventListener(this.instance.rootElement,'touchstart', function (event) {
      if(Handsontable.Dom.hasClass(event.target, "topLeftSelectionHandle-HitArea")) {
        that.dragged.push("topLeft");
        var selectedRange = that.instance.getSelectedRange();
        that.touchStartRange = {
          width: selectedRange.getWidth(),
          height: selectedRange.getHeight(),
          direction: selectedRange.getDirection()
        };
        event.preventDefault();

        return false;
      } else if (Handsontable.Dom.hasClass(event.target, "bottomRightSelectionHandle-HitArea")) {
        that.dragged.push("bottomRight");
        var selectedRange = that.instance.getSelectedRange();
        that.touchStartRange = {
          width: selectedRange.getWidth(),
          height: selectedRange.getHeight(),
          direction: selectedRange.getDirection()
        };
        event.preventDefault();

        return false;
      }
    });

    this.eventManager.addEventListener(this.instance.rootElement,'touchend', function (event) {
      if(Handsontable.Dom.hasClass(event.target, "topLeftSelectionHandle-HitArea")) {
        removeFromDragged.call(that, "topLeft");
        that.touchStartRange = void 0;
        event.preventDefault();

        return false;
      } else if (Handsontable.Dom.hasClass(event.target, "bottomRightSelectionHandle-HitArea")) {
        removeFromDragged.call(that, "bottomRight");
        that.touchStartRange = void 0;
        event.preventDefault();

        return false;
      }
    });

    this.eventManager.addEventListener(this.instance.rootElement,'touchmove', function (event) {
      var scrollTop = Handsontable.Dom.getWindowScrollTop()
        , scrollLeft = Handsontable.Dom.getWindowScrollLeft();

      if (that.dragged.length > 0) {
        var endTarget = document.elementFromPoint(
          event.touches[0].screenX - scrollLeft,
          event.touches[0].screenY - scrollTop
        );

        if(!endTarget) {
          return;
        }

        if (endTarget.nodeName == "TD" || endTarget.nodeName == "TH") {
          var targetCoords = that.instance.getCoords(endTarget);

          if(targetCoords.col == -1) {
            targetCoords.col = 0;
          }

          var selectedRange = that.instance.getSelectedRange()
            , rangeWidth = selectedRange.getWidth()
            , rangeHeight = selectedRange.getHeight()
            , rangeDirection = selectedRange.getDirection();

          if (rangeWidth == 1 && rangeHeight == 1) {
            that.instance.selection.setRangeEnd(targetCoords);
          }

          var newRangeCoords = that.getCurrentRangeCoords(selectedRange, targetCoords, that.touchStartRange.direction, rangeDirection, that.dragged[0]);

          if(newRangeCoords.start != null) {
            that.instance.selection.setRangeStart(newRangeCoords.start);
          }
          that.instance.selection.setRangeEnd(newRangeCoords.end);

        }

        event.preventDefault();
      }
    });

  };

  MultipleSelectionHandles.prototype.isDragged = function () {
    if (this.dragged.length === 0) {
      return false;
    } else {
      return true;
    }
  };

  var init = function () {
    var instance = this;

    Handsontable.plugins.multipleSelectionHandles = new MultipleSelectionHandles(instance);
  };

  Handsontable.hooks.add('afterInit', init);

})(Handsontable);

var TouchScroll = (function(instance) {

  function TouchScroll(instance) {}

  TouchScroll.prototype.init = function(instance) {
    this.instance = instance;
    this.bindEvents();

    this.scrollbars = [
      this.instance.view.wt.wtScrollbars.vertical,
      this.instance.view.wt.wtScrollbars.horizontal,
      this.instance.view.wt.wtScrollbars.corner
    ];

    this.clones = [
      this.instance.view.wt.wtScrollbars.vertical.clone.wtTable.holder.parentNode,
      this.instance.view.wt.wtScrollbars.horizontal.clone.wtTable.holder.parentNode,
      this.instance.view.wt.wtScrollbars.corner.clone.wtTable.holder.parentNode
    ];
  };

  TouchScroll.prototype.bindEvents = function () {
  var that = this;

    this.instance.addHook('beforeTouchScroll', function () {
      Handsontable.freezeOverlays = true;

      for(var i = 0, cloneCount = that.clones.length; i < cloneCount ; i++) {
        Handsontable.Dom.addClass(that.clones[i], 'hide-tween');
      }
    });

    this.instance.addHook('afterMomentumScroll', function () {
      Handsontable.freezeOverlays = false;

      for(var i = 0, cloneCount = that.clones.length; i < cloneCount ; i++) {
        Handsontable.Dom.removeClass(that.clones[i], 'hide-tween');
      }

      for(var i = 0, cloneCount = that.clones.length; i < cloneCount ; i++) {
        Handsontable.Dom.addClass(that.clones[i], 'show-tween');
      }

      setTimeout(function () {
        for(var i = 0, cloneCount = that.clones.length; i < cloneCount ; i++) {
          Handsontable.Dom.removeClass(that.clones[i], 'show-tween');
        }
      },400);

      for(var i = 0, cloneCount = that.scrollbars.length; i < cloneCount ; i++) {
        that.scrollbars[i].refresh();
        that.scrollbars[i].resetFixedPosition();
      }

    });

  };

  return TouchScroll;
}());

var touchScrollHandler = new TouchScroll();

Handsontable.hooks.add('afterInit', function() {
  touchScrollHandler.init.call(touchScrollHandler, this);
});

(function (Handsontable) {
  function ManualColumnFreeze(instance) {
    var fixedColumnsCount = instance.getSettings().fixedColumnsLeft;

    var init = function () {
      // update plugin usages count for manualColumnPositions
      if (typeof instance.manualColumnPositionsPluginUsages != 'undefined') {
        instance.manualColumnPositionsPluginUsages.push('manualColumnFreeze');
      } else {
        instance.manualColumnPositionsPluginUsages = ['manualColumnFreeze'];
      }

      bindHooks();
    };

    /**
     * Modifies the default Context Menu entry list to consist 'freeze/unfreeze this column' entries
     * @param {Object} defaultOptions
     */
    function addContextMenuEntry(defaultOptions) {
      defaultOptions.items.push(
        Handsontable.ContextMenu.SEPARATOR,
        {
          key: 'freeze_column',
          name: function () {
            var selectedColumn = instance.getSelected()[1];
            if (selectedColumn > fixedColumnsCount - 1) {
              return 'Freeze this column';
            } else {
              return 'Unfreeze this column';
            }
          },
          disabled: function () {
            var selection = instance.getSelected();
            return selection[1] !== selection[3];
          },
          callback: function () {
            var selectedColumn = instance.getSelected()[1];
            if (selectedColumn > fixedColumnsCount - 1) {
              freezeColumn(selectedColumn);
            } else {
              unfreezeColumn(selectedColumn);
            }
          }
        }
      );
    }

    /**
     * Increments the fixed columns count by one
     */
    function addFixedColumn() {
      instance.updateSettings({
        fixedColumnsLeft: fixedColumnsCount + 1
      });
      fixedColumnsCount++;
    }

    /**
     * Decrements the fixed columns count by one
     */
    function removeFixedColumn() {
      instance.updateSettings({
        fixedColumnsLeft: fixedColumnsCount - 1
      });
      fixedColumnsCount--;
    }

    /**
     * Checks whether 'manualColumnPositions' array needs creating and/or initializing
     * @param {Number} [col]
     */
    function checkPositionData(col) {
      if (!instance.manualColumnPositions || instance.manualColumnPositions.length === 0) {
        if (!instance.manualColumnPositions) {
          instance.manualColumnPositions = [];
        }
      }
      if (col) {
        if (!instance.manualColumnPositions[col]) {
          createPositionData(col + 1);
        }
      } else {
        createPositionData(instance.countCols());
      }
    }

    /**
     * Fills the 'manualColumnPositions' array with consecutive column indexes
     * @param {Number} len
     */
    function createPositionData(len) {
      if (instance.manualColumnPositions.length < len) {
        for (var i = instance.manualColumnPositions.length; i < len; i++) {
          instance.manualColumnPositions[i] = i;
        }
      }
    }

    /**
     * Updates the column order array used by modifyCol callback
     * @param {Number} col
     * @param {Number} actualCol column index of the currently selected cell
     * @param {Number|null} returnCol suggested return slot for the unfreezed column (can be null)
     * @param {String} action 'freeze' or 'unfreeze'
     */
    function modifyColumnOrder(col, actualCol, returnCol, action) {
      if (returnCol == null) {
        returnCol = col;
      }

      if (action === 'freeze') {
        instance.manualColumnPositions.splice(fixedColumnsCount, 0, instance.manualColumnPositions.splice(actualCol, 1)[0]);
      } else if (action === 'unfreeze') {
        instance.manualColumnPositions.splice(returnCol, 0, instance.manualColumnPositions.splice(actualCol, 1)[0]);
      }
    }

    /**
     * Estimates the most fitting return position for unfreezed column
     * @param {Number} col
     */
    function getBestColumnReturnPosition(col) {
      var i = fixedColumnsCount,
        j = getModifiedColumnIndex(i),
        initialCol = getModifiedColumnIndex(col);
      while (j < initialCol) {
        i++;
        j = getModifiedColumnIndex(i);
      }
      return i - 1;
    }

    /**
     * Freeze the given column (add it to fixed columns)
     * @param {Number} col
     */
    function freezeColumn(col) {
      if (col <= fixedColumnsCount - 1) {
        return; // already fixed
      }

      var modifiedColumn = getModifiedColumnIndex(col) || col;
      checkPositionData(modifiedColumn);
      modifyColumnOrder(modifiedColumn, col, null, 'freeze');

      addFixedColumn();
    }

    /**
     * Unfreeze the given column (remove it from fixed columns and bring to it's previous position)
     * @param {Number} col
     */
    function unfreezeColumn(col) {
      if (col > fixedColumnsCount - 1) {
        return; // not fixed
      }

      var returnCol = getBestColumnReturnPosition(col);

      var modifiedColumn = getModifiedColumnIndex(col) || col;
      checkPositionData(modifiedColumn);
      modifyColumnOrder(modifiedColumn, col, returnCol, 'unfreeze');
      removeFixedColumn();
    }

    function getModifiedColumnIndex(col) {
      return instance.manualColumnPositions[col];
    }

    /**
     * 'modiftyCol' callback
     * @param {Number} col
     */
    function onModifyCol(col) {
      if (this.manualColumnPositionsPluginUsages.length > 1) { // if another plugin is using manualColumnPositions to modify column order, do not double the translation
        return col;
      }
      return getModifiedColumnIndex(col);
    }

    function bindHooks() {
      //instance.addHook('afterGetColHeader', onAfterGetColHeader);
      instance.addHook('modifyCol', onModifyCol);
      instance.addHook('afterContextMenuDefaultOptions', addContextMenuEntry);
    }

    return {
      init: init,
      freezeColumn: freezeColumn,
      unfreezeColumn: unfreezeColumn,
      helpers: {
        addFixedColumn: addFixedColumn,
        removeFixedColumn: removeFixedColumn,
        checkPositionData: checkPositionData,
        modifyColumnOrder: modifyColumnOrder,
        getBestColumnReturnPosition: getBestColumnReturnPosition
      }
    };
  }

  var init = function init() {
    if (!this.getSettings().manualColumnFreeze) {
      return;
    }

    var mcfPlugin;

    Handsontable.plugins.manualColumnFreeze = ManualColumnFreeze;
    this.manualColumnFreeze = new ManualColumnFreeze(this);

    mcfPlugin = this.manualColumnFreeze;
    mcfPlugin.init.call(this);
  };

  Handsontable.hooks.add('beforeInit', init);

})(Handsontable);



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
  this.scrollHandler = this.getScrollableElement(this.TABLE);
};

WalkontableOverlay.prototype.makeClone = function (direction) {
  var clone = document.createElement('DIV');
  clone.className = 'ht_clone_' + direction + ' handsontable';
  clone.style.position = 'absolute';
  clone.style.top = 0;
  clone.style.left = 0;
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
  while (el && el.style && document.body !== el) {
    if (el.style.overflow !== 'visible' && el.style.overflow !== '') {
      return el;
    } else if(window.getComputedStyle) {
      var computedStyle = window.getComputedStyle(el);
      if(computedStyle.getPropertyValue('overflow') !== 'visible' && computedStyle.getPropertyValue('overflow') !== '') {
        return el;
      }
    }

    if (this instanceof WalkontableHorizontalScrollbarNative && el.style.overflowX !== 'visible' && el.style.overflowX !== '') {
      return el;
    }
    el = el.parentNode;
  }
  return window;
};

WalkontableOverlay.prototype.refresh = function (fastDraw) {
  if (this.clone) {
    this.clone.draw(fastDraw);
  }
};

WalkontableOverlay.prototype.destroy = function () {
  var eventManager = Handsontable.eventManager(this.clone);

  eventManager.clear();
};

function WalkontableBorder(instance, settings) {
  var style;
  var createMultipleSelectorHandles = function () {
    this.selectionHandles = {
      topLeft: document.createElement('DIV'),
      topLeftHitArea: document.createElement('DIV'),
      bottomRight: document.createElement('DIV'),
      bottomRightHitArea: document.createElement('DIV')
    };
    var width = 10
      , hitAreaWidth = 40;

    this.selectionHandles.topLeft.className = 'topLeftSelectionHandle';
    this.selectionHandles.topLeftHitArea.className = 'topLeftSelectionHandle-HitArea';
    this.selectionHandles.bottomRight.className = 'bottomRightSelectionHandle';
    this.selectionHandles.bottomRightHitArea.className = 'bottomRightSelectionHandle-HitArea';

    this.selectionHandles.styles = {
      topLeft: this.selectionHandles.topLeft.style,
      topLeftHitArea: this.selectionHandles.topLeftHitArea.style,
      bottomRight: this.selectionHandles.bottomRight.style,
      bottomRightHitArea: this.selectionHandles.bottomRightHitArea.style
    };

    var hitAreaStyle = {
      'position': 'absolute',
      'height': hitAreaWidth + 'px',
      'width': hitAreaWidth + 'px',
      'border-radius': parseInt(hitAreaWidth/1.5,10) + 'px'
    };

    for (var prop in hitAreaStyle) {
      if (hitAreaStyle.hasOwnProperty(prop)) {
        this.selectionHandles.styles.bottomRightHitArea[prop] = hitAreaStyle[prop];
        this.selectionHandles.styles.topLeftHitArea[prop] = hitAreaStyle[prop];
      }
    }

    var handleStyle = {
      'position': 'absolute',
      'height': width + 'px',
      'width': width + 'px',
      'border-radius': parseInt(width/1.5,10) + 'px',
      'background': '#F5F5FF',
      'border': '1px solid #4285c8'
    };

    for (var prop in handleStyle) {
      if (handleStyle.hasOwnProperty(prop)) {
        this.selectionHandles.styles.bottomRight[prop] = handleStyle[prop];
        this.selectionHandles.styles.topLeft[prop] = handleStyle[prop];
      }
    }

    this.main.appendChild(this.selectionHandles.topLeft);
    this.main.appendChild(this.selectionHandles.bottomRight);
    this.main.appendChild(this.selectionHandles.topLeftHitArea);
    this.main.appendChild(this.selectionHandles.bottomRightHitArea);
  };

  if(!settings){
    return;
  }

  var eventManager = Handsontable.eventManager(instance);

  //reference to instance
  this.instance = instance;
  this.settings = settings;

  this.main = document.createElement("div");
  style = this.main.style;
  style.position = 'absolute';
  style.top = 0;
  style.left = 0;

  var borderDivs = ['top','left','bottom','right','corner'];

  for (var i = 0; i < 5; i++) {
    var position = borderDivs[i];

    var DIV = document.createElement('DIV');
    DIV.className = 'wtBorder ' + (this.settings.className || ''); // + borderDivs[i];
    if(this.settings[position] && this.settings[position].hide){
      DIV.className += " hidden";
    }

    style = DIV.style;
    style.backgroundColor = (this.settings[position] && this.settings[position].color) ? this.settings[position].color : settings.border.color;
    style.height = (this.settings[position] && this.settings[position].width) ? this.settings[position].width + 'px' : settings.border.width + 'px';
    style.width = (this.settings[position] && this.settings[position].width) ? this.settings[position].width + 'px' : settings.border.width + 'px';

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

  this.cornerDefaultStyle = {
    width: '5px',
    height: '5px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#FFF'
  };

  this.corner = this.main.childNodes[4];
  this.corner.className += ' corner';
  this.cornerStyle = this.corner.style;
  this.cornerStyle.width = this.cornerDefaultStyle.width;
  this.cornerStyle.height = this.cornerDefaultStyle.height;
  this.cornerStyle.border = [
    this.cornerDefaultStyle.borderWidth,
    this.cornerDefaultStyle.borderStyle,
    this.cornerDefaultStyle.borderColor
  ].join(' ');

  if(Handsontable.mobileBrowser) {
    createMultipleSelectorHandles.call(this);
  }

  this.disappear();
  if (!instance.wtTable.bordersHolder) {
    instance.wtTable.bordersHolder = document.createElement('div');
    instance.wtTable.bordersHolder.className = 'htBorders';
    instance.wtTable.hider.appendChild(instance.wtTable.bordersHolder);

  }
  instance.wtTable.bordersHolder.insertBefore(this.main, instance.wtTable.bordersHolder.firstChild);

  var down = false;



  eventManager.addEventListener(document.body, 'mousedown', function () {
    down = true;
  });


  eventManager.addEventListener(document.body, 'mouseup', function () {
    down = false;
  });

  /* jshint ignore:start */
  for (var c = 0, len = this.main.childNodes.length; c < len; c++) {

    eventManager.addEventListener(this.main.childNodes[c], 'mouseenter', function (event) {
      if (!down || !instance.getSetting('hideBorderOnMouseDownOver')) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();

      var bounds = this.getBoundingClientRect();

      this.style.display = 'none';

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

      var handler = function (event) {
        if (isOutside(event)) {
          eventManager.removeEventListener(document.body, 'mousemove', handler);
          this.style.display = 'block';
        }
      };
      eventManager.addEventListener(document.body, 'mousemove', handler);
    });
  }
  /* jshint ignore:end */
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
    , i
    , ilen
    , s;

  var isPartRange = function () {
    if(this.instance.selections.area.cellRange) {

      if (toRow != this.instance.selections.area.cellRange.to.row ||
          toColumn != this.instance.selections.area.cellRange.to.col) {
        return true;
      }
    }

    return false;
  };

  var updateMultipleSelectionHandlesPosition = function (top, left, width, height) {
    var handleWidth = parseInt(this.selectionHandles.styles.topLeft.width, 10)
      , hitAreaWidth = parseInt(this.selectionHandles.styles.topLeftHitArea.width, 10);

    this.selectionHandles.styles.topLeft.top = parseInt(top - handleWidth,10) + "px";
    this.selectionHandles.styles.topLeft.left = parseInt(left - handleWidth,10) + "px";

    this.selectionHandles.styles.topLeftHitArea.top = parseInt(top - (hitAreaWidth/4)*3,10) + "px";
    this.selectionHandles.styles.topLeftHitArea.left = parseInt(left - (hitAreaWidth/4)*3,10) + "px";

    this.selectionHandles.styles.bottomRight.top = parseInt(top + height,10) + "px";
    this.selectionHandles.styles.bottomRight.left = parseInt(left + width,10) + "px";

    this.selectionHandles.styles.bottomRightHitArea.top = parseInt(top + height - hitAreaWidth/4,10) + "px";
    this.selectionHandles.styles.bottomRightHitArea.left = parseInt(left + width - hitAreaWidth/4,10) + "px";

    if(this.settings.border.multipleSelectionHandlesVisible && this.settings.border.multipleSelectionHandlesVisible()) {
      this.selectionHandles.styles.topLeft.display = "block";
      this.selectionHandles.styles.topLeftHitArea.display = "block";
      if(!isPartRange.call(this)) {
        this.selectionHandles.styles.bottomRight.display = "block";
        this.selectionHandles.styles.bottomRightHitArea.display = "block";
      } else {
        this.selectionHandles.styles.bottomRight.display = "none";
        this.selectionHandles.styles.bottomRightHitArea.display = "none";
      }
    } else {
      this.selectionHandles.styles.topLeft.display = "none";
      this.selectionHandles.styles.bottomRight.display = "none";
      this.selectionHandles.styles.topLeftHitArea.display = "none";
      this.selectionHandles.styles.bottomRightHitArea.display = "none";
    }

    if(fromRow == this.instance.wtSettings.getSetting('fixedRowsTop') || fromColumn == this.instance.wtSettings.getSetting('fixedColumnsLeft')) {
      this.selectionHandles.styles.topLeft.zIndex = "9999";
      this.selectionHandles.styles.topLeftHitArea.zIndex = "9999";
    } else {
      this.selectionHandles.styles.topLeft.zIndex = "";
      this.selectionHandles.styles.topLeftHitArea.zIndex = "";
    }

  };

  if (instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative || instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
    ilen = instance.getSetting('fixedRowsTop');
  }
  else {
    ilen = instance.wtTable.getRenderedRowsCount();
  }

  for (i = 0; i < ilen; i++) {
    s = instance.wtTable.rowFilter.renderedToSource(i);
    if (s >= corners[0] && s <= corners[2]) {
      fromRow = s;
      break;
    }
  }

  for (i = ilen - 1; i >= 0; i--) {
    s = instance.wtTable.rowFilter.renderedToSource(i);
    if (s >= corners[0] && s <= corners[2]) {
      toRow = s;
      break;
    }
  }

  ilen = instance.wtTable.getRenderedColumnsCount();

  for (i = 0; i < ilen; i++) {
    s = instance.wtTable.columnFilter.renderedToSource(i);
    if (s >= corners[1] && s <= corners[3]) {
      fromColumn = s;
      break;
    }
  }

  for (i = ilen - 1; i >= 0; i--) {
    s = instance.wtTable.columnFilter.renderedToSource(i);
    if (s >= corners[1] && s <= corners[3]) {
      toColumn = s;
      break;
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

  this.topStyle.top = top + 'px';
  this.topStyle.left = left + 'px';
  this.topStyle.width = width + 'px';
  this.topStyle.display = 'block';

  this.leftStyle.top = top + 'px';
  this.leftStyle.left = left + 'px';
  this.leftStyle.height = height + 'px';
  this.leftStyle.display = 'block';

  var delta = Math.floor(this.settings.border.width / 2);

  this.bottomStyle.top = top + height - delta + 'px';
  this.bottomStyle.left = left + 'px';
  this.bottomStyle.width = width + 'px';
  this.bottomStyle.display = 'block';

  this.rightStyle.top = top + 'px';
  this.rightStyle.left = left + width - delta + 'px';
  this.rightStyle.height = height + 1 + 'px';
  this.rightStyle.display = 'block';

  if (Handsontable.mobileBrowser || (!this.hasSetting(this.settings.border.cornerVisible) || isPartRange.call(this))) {
    this.cornerStyle.display = 'none';
  }
  else {
    this.cornerStyle.top = top + height - 4 + 'px';
    this.cornerStyle.left = left + width - 4 + 'px';
    this.cornerStyle.borderRightWidth = this.cornerDefaultStyle.borderWidth;
    this.cornerStyle.width = this.cornerDefaultStyle.width;
    this.cornerStyle.display = 'block';

    if (!instance.cloneOverlay && toColumn === instance.wtTable.getRenderedColumnsCount() - 1) {
      var scrollableElement = Handsontable.Dom.getScrollableElement(instance.wtTable.TABLE),
        needShrinkCorner = toTD.offsetLeft + Handsontable.Dom.outerWidth(toTD) >= Handsontable.Dom.innerWidth(scrollableElement);

      if (needShrinkCorner) {
        this.cornerStyle.borderRightWidth = '0px';
        this.cornerStyle.width = Math.ceil(parseInt(this.cornerDefaultStyle.width, 10) / 2) + 'px';
      }
    }
  }

  if (Handsontable.mobileBrowser) {
    updateMultipleSelectionHandlesPosition.call(this, top, left, width, height);
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

  if(Handsontable.mobileBrowser) {
    this.selectionHandles.styles.topLeft.display = 'none';
    this.selectionHandles.styles.bottomRight.display = 'none';
  }


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

WalkontableCellCoords.prototype.isSouthWestOf = function (testedCoords) {
  return this.row >= testedCoords.row && this.col <= testedCoords.col;
};

WalkontableCellCoords.prototype.isNorthEastOf = function (testedCoords) {
  return this.row <= testedCoords.row && this.col >= testedCoords.col;
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
 * Returns selected range height (in number of rows)
 * @returns {number}
 */
WalkontableCellRange.prototype.getHeight = function () {
  return Math.max(this.from.row, this.to.row) - Math.min(this.from.row, this.to.row) + 1;
};

/**
 * Returns selected range width (in number of columns)
 * @returns {number}
 */
WalkontableCellRange.prototype.getWidth = function () {
  return Math.max(this.from.col, this.to.col) - Math.min(this.from.col, this.to.col) + 1;
};

/**
 * Returns boolean information if given cell coords is within `from` and `to` cell coords of this range
 * @param {WalkontableCellCoords} cellCoords
 * @returns {boolean}
 */
WalkontableCellRange.prototype.includes = function (cellCoords) {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();

  if (cellCoords.row < 0) {
    cellCoords.row = 0;
  }

  if (cellCoords.col < 0) {
    cellCoords.col = 0;
  }

  return (topLeft.row <= cellCoords.row && bottomRight.row >= cellCoords.row && topLeft.col <= cellCoords.col && bottomRight.col >= cellCoords.col);
};

WalkontableCellRange.prototype.includesRange = function (testedRange) {
  return this.includes(testedRange.getTopLeftCorner()) && this.includes(testedRange.getBottomRightCorner());
};

WalkontableCellRange.prototype.isEqual = function (testedRange) {
  return (Math.min(this.from.row, this.to.row) == Math.min(testedRange.from.row, testedRange.to.row)) &&
         (Math.max(this.from.row, this.to.row) == Math.max(testedRange.from.row, testedRange.to.row)) &&
         (Math.min(this.from.col, this.to.col) == Math.min(testedRange.from.col, testedRange.to.col)) &&
         (Math.max(this.from.col, this.to.col) == Math.max(testedRange.from.col, testedRange.to.col));
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
  if (this.includesRange(expandingRange) || !this.overlaps(expandingRange)) {
    return false;
  }

  var topLeft = this.getTopLeftCorner()
    , bottomRight = this.getBottomRightCorner()
    , topRight = this.getTopRightCorner()
    , bottomLeft = this.getBottomLeftCorner();

  var expandingTopLeft = expandingRange.getTopLeftCorner();
  var expandingBottomRight = expandingRange.getBottomRightCorner();

  var resultTopRow = Math.min(topLeft.row, expandingTopLeft.row);
  var resultTopCol = Math.min(topLeft.col, expandingTopLeft.col);
  var resultBottomRow = Math.max(bottomRight.row, expandingBottomRight.row);
  var resultBottomCol = Math.max(bottomRight.col, expandingBottomRight.col);

  var finalFrom = new WalkontableCellCoords(resultTopRow, resultTopCol)
    , finalTo = new WalkontableCellCoords(resultBottomRow, resultBottomCol);
  var isCorner = new WalkontableCellRange(finalFrom, finalFrom, finalTo).isCorner(this.from, expandingRange)
    , onlyMerge = expandingRange.isEqual(new WalkontableCellRange(finalFrom, finalFrom, finalTo));

  if (isCorner && !onlyMerge) {
    if (this.from.col > finalFrom.col) {
      finalFrom.col = resultBottomCol;
      finalTo.col = resultTopCol;
    }
    if (this.from.row > finalFrom.row) {
      finalFrom.row = resultBottomRow;
      finalTo.row = resultTopRow;
    }
  }

  this.from = finalFrom;
  this.to = finalTo;

  return true;
};

WalkontableCellRange.prototype.getDirection = function () {
  if (this.from.isNorthWestOf(this.to)) {        // NorthWest - SouthEast
    return "NW-SE";
  } else if (this.from.isNorthEastOf(this.to)) { // NorthEast - SouthWest
    return "NE-SW";
  } else if (this.from.isSouthEastOf(this.to)) { // SouthEast - NorthWest
    return "SE-NW";
  } else if (this.from.isSouthWestOf(this.to)) { // SouthWest - NorthEast
    return "SW-NE";
  }
};

WalkontableCellRange.prototype.setDirection = function (direction) {
  switch (direction) {
    case "NW-SE" :
      this.from = this.getTopLeftCorner();
      this.to = this.getBottomRightCorner();
      break;
    case "NE-SW" :
      this.from = this.getTopRightCorner();
      this.to = this.getBottomLeftCorner();
      break;
    case "SE-NW" :
      this.from = this.getBottomRightCorner();
      this.to = this.getTopLeftCorner();
      break;
    case "SW-NE" :
      this.from = this.getBottomLeftCorner();
      this.to = this.getTopRightCorner();
      break;
  }
};

WalkontableCellRange.prototype.getTopLeftCorner = function () {
  return new WalkontableCellCoords(Math.min(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
};

WalkontableCellRange.prototype.getBottomRightCorner = function () {
  return new WalkontableCellCoords(Math.max(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
};

WalkontableCellRange.prototype.getTopRightCorner = function () {
  return new WalkontableCellCoords(Math.min(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
};

WalkontableCellRange.prototype.getBottomLeftCorner = function () {
  return new WalkontableCellCoords(Math.max(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
};

WalkontableCellRange.prototype.isCorner = function (coords, expandedRange) {
  if (expandedRange) {
    if (expandedRange.includes(coords)) {
      if (this.getTopLeftCorner().isEqual(new WalkontableCellCoords(expandedRange.from.row, expandedRange.from.col)) ||
          this.getTopRightCorner().isEqual(new WalkontableCellCoords(expandedRange.from.row, expandedRange.to.col)) ||
          this.getBottomLeftCorner().isEqual(new WalkontableCellCoords(expandedRange.to.row, expandedRange.from.col)) ||
          this.getBottomRightCorner().isEqual(new WalkontableCellCoords(expandedRange.to.row, expandedRange.to.col))) {
        return true;
      }
    }
  }
  return coords.isEqual(this.getTopLeftCorner()) || coords.isEqual(this.getTopRightCorner()) || coords.isEqual(this.getBottomLeftCorner()) || coords.isEqual(this.getBottomRightCorner());
};

WalkontableCellRange.prototype.getOppositeCorner = function (coords, expandedRange) {
  if (!(coords instanceof WalkontableCellCoords)) {
    return false;
  }

  if (expandedRange) {
    if (expandedRange.includes(coords)) {
      if (this.getTopLeftCorner().isEqual(new WalkontableCellCoords(expandedRange.from.row, expandedRange.from.col))) {
        return this.getBottomRightCorner();
      }
      if (this.getTopRightCorner().isEqual(new WalkontableCellCoords(expandedRange.from.row, expandedRange.to.col))) {
        return this.getBottomLeftCorner();
      }
      if (this.getBottomLeftCorner().isEqual(new WalkontableCellCoords(expandedRange.to.row, expandedRange.from.col))) {
        return this.getTopRightCorner();
      }
      if (this.getBottomRightCorner().isEqual(new WalkontableCellCoords(expandedRange.to.row, expandedRange.to.col))) {
        return this.getTopLeftCorner();
      }
    }
  }

  if (coords.isEqual(this.getBottomRightCorner())) {
    return this.getTopLeftCorner();
  } else if (coords.isEqual(this.getTopLeftCorner())) {
    return this.getBottomRightCorner();
  } else if (coords.isEqual(this.getTopRightCorner())) {
    return this.getBottomLeftCorner();
  } else if (coords.isEqual(this.getBottomLeftCorner())) {
    return  this.getTopRightCorner();
  }
};

WalkontableCellRange.prototype.getBordersSharedWith = function (range) {
  if (!this.includesRange(range)) {
    return [];
  }

  var thisBorders = {
      top: Math.min(this.from.row, this.to.row),
      bottom: Math.max(this.from.row, this.to.row),
      left: Math.min(this.from.col, this.to.col),
      right: Math.max(this.from.col, this.to.col)
    }
    , rangeBorders = {
      top: Math.min(range.from.row, range.to.row),
      bottom: Math.max(range.from.row, range.to.row),
      left: Math.min(range.from.col, range.to.col),
      right: Math.max(range.from.col, range.to.col)
    }
    , result = [];

  if (thisBorders.top == rangeBorders.top) {
    result.push('top');
  }
  if (thisBorders.right == rangeBorders.right) {
    result.push('right');
  }
  if (thisBorders.bottom == rangeBorders.bottom) {
    result.push('bottom');
  }
  if (thisBorders.left == rangeBorders.left) {
    result.push('left');
  }

  return result;
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
 * WalkontableColumnFilter
 * @constructor
 */
function WalkontableColumnFilter(offset,total, countTH) {
  this.offset = offset;
  this.total = total;
  this.countTH = countTH;
}

WalkontableColumnFilter.prototype.offsetted = function (n) {
  return n + this.offset;
};

WalkontableColumnFilter.prototype.unOffsetted = function (n) {
  return n - this.offset;
};

WalkontableColumnFilter.prototype.renderedToSource = function (n) {
  return this.offsetted(n);
};

WalkontableColumnFilter.prototype.sourceToRendered = function (n) {
  return this.unOffsetted(n);
};

WalkontableColumnFilter.prototype.offsettedTH = function (n) {
  return n - this.countTH;
};

WalkontableColumnFilter.prototype.unOffsettedTH = function (n) {
  return n + this.countTH;
};

WalkontableColumnFilter.prototype.visibleRowHeadedColumnToSourceColumn = function (n) {
  return this.renderedToSource(this.offsettedTH(n));
};

WalkontableColumnFilter.prototype.sourceColumnToVisibleRowHeadedColumn = function (n) {
  return this.unOffsettedTH(this.sourceToRendered(n));
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

  this.instance = instance;
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
    if (this.cellSizesSum < this.getContainerSize()) {
      this.visibleCellCount++;
    }
    this.cellSizes.push(size);
    this.cellSizesSum += size;
    this.cellCount++;

    i++;
  }

  var containerSize = this.getContainerSize();
  this.remainingSize = this.cellSizesSum - containerSize;
  //negative value means the last cell is fully visible and there is some space left for stretching
  //positive value means the last cell is not fully visible
}

WalkontableColumnStrategy.prototype.getContainerSize = function () {
  return typeof this.containerSizeFn === 'function' ? this.containerSizeFn() : this.containerSizeFn;
};

WalkontableColumnStrategy.prototype.getSize = function (index) {
  return this.cellSizes[index] + (this.cellStretch[index] || 0);
};

WalkontableColumnStrategy.prototype.stretch = function () {
  //step 2 - apply stretching strategy
  var containerSize = this.getContainerSize()
    , i = 0;

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
    this.selections = this.cloneSource.selections;
  }
  else {
    this.wtSettings = new WalkontableSettings(this, settings);
    this.wtTable = new WalkontableTable(this, settings.table);
    this.wtScroll = new WalkontableScroll(this);
    this.wtViewport = new WalkontableViewport(this);
    this.wtEvent = new WalkontableEvent(this);
    this.selections = this.getSetting('selections');

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

/**
 * Force rerender of Walkontable
 * @param fastDraw {Boolean} When TRUE, try to refresh only the positions of borders without rerendering the data.
 *                           It will only work if WalkontableTable.draw() does not force rendering anyway
 * @returns {Walkontable}
 */
Walkontable.prototype.draw = function (fastDraw) {
  this.drawInterrupted = false;
  if (!fastDraw && !Handsontable.Dom.isVisible(this.wtTable.TABLE)) {
    this.drawInterrupted = true; //draw interrupted because TABLE is not visible
    return;
  }

  this.wtTable.draw(fastDraw);

  return this;
};

/**
 * Returns the TD at coords. If topmost is set to true, returns TD from the topmost overlay layer,
 * if not set or set to false, returns TD from the master table.
 * @param {WalkontableCellCoords} coords
 * @param {Boolean} topmost
 * @returns {Object}
 */
Walkontable.prototype.getCell = function (coords, topmost) {
  if(!topmost) {
    return this.wtTable.getCell(coords);
  } else {
    var fixedRows = this.wtSettings.getSetting('fixedRowsTop')
      , fixedColumns = this.wtSettings.getSetting('fixedColumnsLeft');

    if(coords.row < fixedRows && coords.col < fixedColumns) {
      return this.wtScrollbars.corner.clone.wtTable.getCell(coords);
    } else if(coords.row < fixedRows) {
      return this.wtScrollbars.vertical.clone.wtTable.getCell(coords);
    } else if (coords.col < fixedColumns) {
      return this.wtScrollbars.horizontal.clone.wtTable.getCell(coords);
    } else {
      return this.wtTable.getCell(coords);
    }
  }
};

Walkontable.prototype.update = function (settings, value) {
  return this.wtSettings.update(settings, value);
};

/**
 * Scroll the viewport to a row at the given index in the data source
 * @param row
 * @returns {Walkontable}
 */
Walkontable.prototype.scrollVertical = function (row) {
  this.wtScrollbars.vertical.scrollTo(row);
  this.getSetting('onScrollVertically');
  return this;
};

/**
 * Scroll the viewport to a column at the given index in the data source
 * @param row
 * @returns {Walkontable}
 */
Walkontable.prototype.scrollHorizontal = function (column) {
  this.wtScrollbars.horizontal.scrollTo(column);
  this.getSetting('onScrollHorizontally');
  return this;
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
  return this.wtSettings.getSetting(key, param1, param2, param3, param4); //this is faster than .apply - https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
};

Walkontable.prototype.hasSetting = function (key) {
  return this.wtSettings.has(key);
};

Walkontable.prototype.destroy = function () {
  this.wtScrollbars.destroy();

  if ( this.wtEvent ) {
    this.wtEvent.destroy();
  }
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
  this.lastTimeout = null;

  Handsontable.Dom.addClass(this.clone.wtTable.holder.parentNode, 'wtDebugVisible');

  /*var that = this;
  var lastX = 0;
  var lastY = 0;
  var overlayContainer = that.clone.wtTable.holder.parentNode;

  var eventManager = Handsontable.eventManager(instance);

  eventManager.addEventListener(document.body, 'mousemove', function (event) {
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
    clearTimeout(this.lastTimeout);
    this.lastTimeout = setTimeout(function () {
      Handsontable.Dom.removeClass(overlayContainer, 'wtDebugHidden');
      Handsontable.Dom.addClass(overlayContainer, 'wtDebugVisible');
    }, 1000);
  });*/
}

WalkontableDebugOverlay.prototype = new WalkontableOverlay();

WalkontableDebugOverlay.prototype.destroy = function () {
  WalkontableOverlay.prototype.destroy.call(this);
  clearTimeout(this.lastTimeout);
};

function WalkontableEvent(instance) {
  var that = this;

  var eventManager = Handsontable.eventManager(instance);

  //reference to instance
  this.instance = instance;

  var dblClickOrigin = [null, null];
  this.dblClickTimeout = [null, null];

  var onMouseDown = function (event) {
    var cell = that.parentCell(event.target);
    if (Handsontable.Dom.hasClass(event.target, 'corner')) {
      that.instance.getSetting('onCellCornerMouseDown', event, event.target);
    }
    else if (cell.TD) {
      if (that.instance.hasSetting('onCellMouseDown')) {
        that.instance.getSetting('onCellMouseDown', event, cell.coords, cell.TD, that.instance);
      }
    }

    if (event.button !== 2) { //if not right mouse button
      if (cell.TD) {
        dblClickOrigin[0] = cell.TD;
        clearTimeout(that.dblClickTimeout[0]);
        that.dblClickTimeout[0] = setTimeout(function () {
          dblClickOrigin[0] = null;
        }, 1000);
      }
    }
  };

  var onTouchMove = function (event) {
    that.instance.touchMoving = true;
  };

  var longTouchTimeout;

  ///**
  // * Update touch event target - if user taps on resize handle 'hit area', update the target to the cell itself
  // * @param event
  // */
  /*
  var adjustTapTarget = function (event) {
    var currentSelection
      , properTarget;

    if(Handsontable.Dom.hasClass(event.target,'SelectionHandle')) {
      if(that.instance.selections[0].cellRange) {
        currentSelection = that.instance.selections[0].cellRange.highlight;

        properTarget = that.instance.getCell(currentSelection, true);
      }
    }

    if(properTarget) {
      Object.defineProperty(event,'target',{
        value: properTarget
      });
    }

    return event;
  };*/

  var onTouchStart = function (event) {
    var container = this;

    eventManager.addEventListener(this, 'touchmove', onTouchMove);

    //this.addEventListener("touchmove", onTouchMove, false);

    // touch-and-hold event
    //longTouchTimeout = setTimeout(function () {
    //  if(!that.instance.touchMoving) {
    //    that.instance.longTouch = true;
    //
    //    var targetCoords = Handsontable.Dom.offset(event.target);
    //    var contextMenuEvent = new MouseEvent('contextmenu', {
    //      clientX: targetCoords.left + event.target.offsetWidth,
    //      clientY: targetCoords.top + event.target.offsetHeight,
    //      button: 2
    //    });
    //
    //    that.instance.wtTable.holder.parentNode.parentNode.dispatchEvent(contextMenuEvent);
    //  }
    //},200);

      // Prevent cell selection when scrolling with touch event - not the best solution performance-wise
      that.checkIfTouchMove = setTimeout(function () {
        if (that.instance.touchMoving === true) {
          that.instance.touchMoving = void 0;

          eventManager.removeEventListener("touchmove", onTouchMove, false);

          return;
        } else {
          //event = adjustTapTarget(event);

          onMouseDown(event);
        }
      }, 30);

    //eventManager.removeEventListener(that.instance.wtTable.holder, "mousedown", onMouseDown);
  };

  var lastMouseOver;
  var onMouseOver = function (event) {
    if (that.instance.hasSetting('onCellMouseOver')) {
      var TABLE = that.instance.wtTable.TABLE;
      var TD = Handsontable.Dom.closest(event.target, ['TD', 'TH'], TABLE);
      if (TD && TD !== lastMouseOver && Handsontable.Dom.isChildOf(TD, TABLE)) {
        lastMouseOver = TD;
        that.instance.getSetting('onCellMouseOver', event, that.instance.wtTable.getCoords(TD), TD, that.instance);
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
        else {
          that.instance.getSetting('onCellDblClick', event, cell.coords, cell.TD, that.instance);
        }

        dblClickOrigin[0] = null;
        dblClickOrigin[1] = null;
      }
      else if (cell.TD === dblClickOrigin[0]) {
        dblClickOrigin[1] = cell.TD;
        clearTimeout(that.dblClickTimeout[1]);
        that.dblClickTimeout[1] = setTimeout(function () {
          dblClickOrigin[1] = null;
        }, 500);
      }
    }
  };


  var onTouchEnd = function (event) {
    clearTimeout(longTouchTimeout);
    //that.instance.longTouch == void 0;

    event.preventDefault();

    onMouseUp(event);

    //eventManager.removeEventListener(that.instance.wtTable.holder, "mouseup", onMouseUp);
  };

  eventManager.addEventListener(this.instance.wtTable.holder, 'mousedown', onMouseDown);

  eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseover', onMouseOver);

  eventManager.addEventListener(this.instance.wtTable.holder, 'mouseup', onMouseUp);


  if(this.instance.wtTable.holder.parentNode.parentNode && Handsontable.mobileBrowser) { // check if full HOT instance, or detached WOT AND run on mobile device
    var classSelector = "." + this.instance.wtTable.holder.parentNode.className.split(" ").join(".");

    eventManager.addEventListener(this.instance.wtTable.holder.parentNode.parentNode, 'touchstart', function (event) {
      that.instance.touchApplied = true;
      if (Handsontable.Dom.isChildOf(event.target, classSelector)) {
        onTouchStart.call(event.target, event);
      }
    });
    eventManager.addEventListener(this.instance.wtTable.holder.parentNode.parentNode, 'touchend', function (event) {
      that.instance.touchApplied = false;
      if (Handsontable.Dom.isChildOf(event.target, classSelector)) {
        onTouchEnd.call(event.target, event);
      }
    });

    if(!that.instance.momentumScrolling) {
      that.instance.momentumScrolling = {};
    }
    eventManager.addEventListener(this.instance.wtTable.holder.parentNode.parentNode, 'scroll', function (event) {
      clearTimeout(that.instance.momentumScrolling._timeout);

      if(!that.instance.momentumScrolling.ongoing) {
        that.instance.getSetting('onBeforeTouchScroll');
      }
      that.instance.momentumScrolling.ongoing = true;

      that.instance.momentumScrolling._timeout = setTimeout(function () {
        if(!that.instance.touchApplied) {
          that.instance.momentumScrolling.ongoing = false;

          that.instance.getSetting('onAfterMomentumScroll');
        }
      },200);
    });
  }

  eventManager.addEventListener(window, 'resize', function () {
    that.instance.draw();
  });

  this.destroy = function () {
    clearTimeout(this.dblClickTimeout[0]);
    clearTimeout(this.dblClickTimeout[1]);

    eventManager.clear();
  };
}

WalkontableEvent.prototype.parentCell = function (elem) {
  var cell = {};
  var TABLE = this.instance.wtTable.TABLE;
  var TD = Handsontable.Dom.closest(elem, ['TD', 'TH'], TABLE);

  if (TD && Handsontable.Dom.isChildOf(TD, TABLE)) {
    cell.coords = this.instance.wtTable.getCoords(TD);
    cell.TD = TD;
  } else if (Handsontable.Dom.hasClass(elem, 'wtBorder') && Handsontable.Dom.hasClass(elem, 'current')) {
    cell.coords = this.instance.selections.current.cellRange.highlight; //selections.current is current selected cell
    cell.TD = this.instance.wtTable.getCell(cell.coords);
  } else if (Handsontable.Dom.hasClass(elem, 'wtBorder') && Handsontable.Dom.hasClass(elem, 'area')) {
    if (this.instance.selections.area.cellRange) {
      cell.coords = this.instance.selections.area.cellRange.to; //selections.area is area selected cells
      cell.TD = this.instance.wtTable.getCell(cell.coords);
    }
  }

  return cell;
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
    clearTimeout;
})();

//http://snipplr.com/view/13523/
//modified for speed
//http://jsperf.com/getcomputedstyle-vs-style-vs-css/8
if (!window.getComputedStyle) {
  (function () {
    var elem;

    var styleObj = {
      getPropertyValue: function getPropertyValue(prop) {
        if (prop == 'float') {
          prop = 'styleFloat';
        }
        return elem.currentStyle[prop.toUpperCase()] || null;
      }
    };

    window.getComputedStyle = function (el) {
      elem = el;
      return styleObj;
    };
  })();
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
 */
if (!String.prototype.trim) {
  var trimRegex = /^\s+|\s+$/g;
  /* jshint -W121 */
  String.prototype.trim = function () {
    return this.replace(trimRegex, '');
  };
}

/**
 * WalkontableRowFilter
 * @constructor
 */
function WalkontableRowFilter(offset, total, countTH) {
  this.offset = offset;
  this.total = total;
  this.countTH = countTH;
}

WalkontableRowFilter.prototype.offsetted = function (n) {
  return n + this.offset;
};

WalkontableRowFilter.prototype.unOffsetted = function (n) {
  return n - this.offset;
};

WalkontableRowFilter.prototype.renderedToSource = function (n) {
  return this.offsetted(n);
};

WalkontableRowFilter.prototype.sourceToRendered = function (n) {
  return this.unOffsetted(n);
};

WalkontableRowFilter.prototype.offsettedTH = function (n) {
  return n - this.countTH;
};

WalkontableRowFilter.prototype.visibleColHeadedRowToSourceRow = function (n) {
  return this.renderedToSource(this.offsettedTH(n));
};

WalkontableRowFilter.prototype.sourceRowToVisibleColHeadedRow = function (n) {
  return this.unOffsettedTH(this.sourceToRendered(n));
};

function WalkontableScroll(instance) {
  this.instance = instance;
}

/**
 * Scrolls viewport to a cell by minimum number of cells
 * @param {WalkontableCellCoords} coords
 */
WalkontableScroll.prototype.scrollViewport = function (coords) {
  if (!this.instance.drawn) {
    return;
  }

  var totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns');

  if (coords.row < 0 || coords.row > totalRows - 1) {
    throw new Error('row ' + coords.row + ' does not exist');
  }

  if (coords.col < 0 || coords.col > totalColumns - 1) {
    throw new Error('column ' + coords.col + ' does not exist');
  }

    if (coords.row > this.instance.wtTable.getLastVisibleRow()) {
      this.instance.wtScrollbars.vertical.scrollTo(coords.row, true);
    } else if (coords.row >= this.instance.getSetting('fixedRowsTop') && coords.row < this.instance.wtTable.getFirstVisibleRow()){
      this.instance.wtScrollbars.vertical.scrollTo(coords.row);
    }

    if (coords.col > this.instance.wtTable.getLastVisibleColumn()) {
      this.instance.wtScrollbars.horizontal.scrollTo(coords.col, true);
    } else if (coords.col > this.instance.getSetting('fixedColumnsLeft') && coords.col < this.instance.wtTable.getFirstVisibleColumn()){
      this.instance.wtScrollbars.horizontal.scrollTo(coords.col);
    }

  //}
};

function WalkontableCornerScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'corner';
  this.init();
  this.clone = this.makeClone('corner');
}

WalkontableCornerScrollbarNative.prototype = new WalkontableOverlay();

WalkontableCornerScrollbarNative.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode,
    finalLeft,
    finalTop;

  if (this.scrollHandler === window) {
    var box = this.instance.wtTable.holder.getBoundingClientRect();
    var top = Math.ceil(box.top);
    var left = Math.ceil(box.left);
    var bottom = Math.ceil(box.bottom);
    var right = Math.ceil(box.right);

    if (left < 0 && (right - elem.offsetWidth) > 0) {
      finalLeft = -left + 'px';
    } else {
      finalLeft = '0';
    }

    if (top < 0 && (bottom - elem.offsetHeight) > 0) {
      finalTop = -top + "px";
    } else {
      finalTop = "0";
    }
  }
  else if(!Handsontable.freezeOverlays) {
    finalLeft = this.instance.wtScrollbars.horizontal.getScrollPosition() + "px";
    finalTop = this.instance.wtScrollbars.vertical.getScrollPosition() + "px";
  }

  Handsontable.Dom.setOverlayPosition(elem, finalLeft, finalTop);

  elem.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px';
  elem.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 4 + 'px';
};

function WalkontableHorizontalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.offset = 0;
  this.init();
  this.clone = this.makeClone('left');
}

WalkontableHorizontalScrollbarNative.prototype = new WalkontableOverlay();

//resetFixedPosition (in future merge it with this.refresh?)
WalkontableHorizontalScrollbarNative.prototype.resetFixedPosition = function () {
  var finalLeft, finalTop;

  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

  if (this.scrollHandler === window) {

    var box = this.instance.wtTable.holder.getBoundingClientRect();
    var left = Math.ceil(box.left);
    var right = Math.ceil(box.right);

    if (left < 0 && (right - elem.offsetWidth) > 0) {
      finalLeft = -left + 'px';
    } else {
      finalLeft = '0';
    }

    finalTop = this.instance.wtTable.hider.style.top;
  }
  else if(!Handsontable.freezeOverlays) {
    finalLeft = this.getScrollPosition() + "px";
    finalTop = this.instance.wtTable.hider.style.top;
  }

  Handsontable.Dom.setOverlayPosition(elem, finalLeft, finalTop);

  elem.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 'px';
  elem.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px';// + 4 + 'px';
};

WalkontableHorizontalScrollbarNative.prototype.refresh = function (fastDraw) {
  this.applyToDOM();
  WalkontableOverlay.prototype.refresh.call(this, fastDraw);
};

WalkontableHorizontalScrollbarNative.prototype.getScrollPosition = function () {
  return Handsontable.Dom.getScrollLeft(this.scrollHandler);
};

WalkontableHorizontalScrollbarNative.prototype.setScrollPosition = function (pos) {
  if (this.scrollHandler === window) {
    window.scrollTo(pos, Handsontable.Dom.getWindowScrollTop());
  } else {
    this.scrollHandler.scrollLeft = pos;
  }
};

WalkontableHorizontalScrollbarNative.prototype.onScroll = function () {
  this.instance.getSetting('onScrollHorizontally');
};

WalkontableHorizontalScrollbarNative.prototype.sumCellSizes = function (from, length) {
  var sum = 0;
  while(from < length) {
    sum += this.instance.wtTable.getStretchedColumnWidth(from) || this.instance.wtSettings.defaultColumnWidth;
    from++;
  }
  return sum;
};

//applyToDOM (in future merge it with this.refresh?)
WalkontableHorizontalScrollbarNative.prototype.applyToDOM = function () {
  var total = this.instance.getSetting('totalColumns');
  var headerSize = this.instance.wtViewport.getRowHeaderWidth();

  this.fixedContainer.style.width = headerSize + this.sumCellSizes(0, total) + 'px';// + 4 + 'px';

  if (typeof this.instance.wtViewport.columnsRenderCalculator.startPosition === 'number'){
    this.fixed.style.left = this.instance.wtViewport.columnsRenderCalculator.startPosition + 'px';
  }
  else if (total === 0) {
    this.fixed.style.left = '0';
  } else {
    throw  new Error('Incorrect value of the columnsRenderCalculator');
  }
  this.fixed.style.right = '';
};

/**
 * Scrolls horizontally to a column at the left edge of the viewport
 * @param sourceCol {Number}
 * @param beyondRendered {Boolean} if TRUE, scrolls according to the bottom edge (top edge is by default)
 */
WalkontableHorizontalScrollbarNative.prototype.scrollTo = function (sourceCol, beyondRendered) {
  var newX = this.getTableParentOffset();

  if (beyondRendered) {
    newX += this.sumCellSizes(0, sourceCol + 1);
    newX -= this.instance.wtViewport.getViewportWidth();
  }
  else {
    var fixedColumnsLeft = this.instance.getSetting('fixedColumnsLeft');
    newX += this.sumCellSizes(fixedColumnsLeft, sourceCol);
  }

  this.setScrollPosition(newX);
};

WalkontableHorizontalScrollbarNative.prototype.getTableParentOffset = function () {
  if (this.scrollHandler === window) {
    return this.instance.wtTable.holderOffset.left;
  }
  else {
    return 0;
  }
};

function WalkontableVerticalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'vertical';
  this.init();
  this.clone = this.makeClone('top');
}

WalkontableVerticalScrollbarNative.prototype = new WalkontableOverlay();

//resetFixedPosition (in future merge it with this.refresh?)
WalkontableVerticalScrollbarNative.prototype.resetFixedPosition = function () {
  var finalLeft, finalTop;

  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

  if (this.scrollHandler === window) {
    var box = this.instance.wtTable.holder.getBoundingClientRect();
    var top = Math.ceil(box.top);
    var bottom = Math.ceil(box.bottom);

    finalLeft = this.instance.wtTable.hider.style.left;

    if (top < 0 && (bottom - elem.offsetHeight) > 0) {
      finalTop = -top + "px";
    } else {
      finalTop = "0";
    }
  }
  else if(!Handsontable.freezeOverlays) {
    finalTop = this.getScrollPosition() + "px";
    finalLeft = this.instance.wtTable.hider.style.left;
  }

  Handsontable.Dom.setOverlayPosition(elem, finalLeft, finalTop);

  if (this.instance.wtScrollbars.horizontal.scrollHandler === window) {
    elem.style.width = this.instance.wtViewport.getWorkspaceActualWidth() + 'px';
  }
  else {
    elem.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 'px';
  }

  elem.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 4 + 'px';// + 4 + 'px';
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
  this.instance.getSetting('onScrollVertically');
};

WalkontableVerticalScrollbarNative.prototype.sumCellSizes = function (from, length) {
  var sum = 0;
  while (from < length) {
    sum += this.instance.wtTable.getRowHeight(from) || this.instance.wtSettings.settings.defaultRowHeight; //TODO optimize getSetting, because this is MUCH faster then getSetting
    from++;
  }
  return sum;
};

WalkontableVerticalScrollbarNative.prototype.refresh = function (fastDraw) {
  this.applyToDOM();
  WalkontableOverlay.prototype.refresh.call(this, fastDraw);
};

//applyToDOM (in future merge it with this.refresh?)
WalkontableVerticalScrollbarNative.prototype.applyToDOM = function () {
  var total = this.instance.getSetting('totalRows');
  var headerSize = this.instance.wtViewport.getColumnHeaderHeight();

  this.fixedContainer.style.height = headerSize + this.sumCellSizes(0, total) +  'px';
  if (typeof this.instance.wtViewport.rowsRenderCalculator.startPosition === 'number') {
    this.fixed.style.top = this.instance.wtViewport.rowsRenderCalculator.startPosition + 'px';
  }
  else if (total === 0) {
    this.fixed.style.top = '0'; //can happen if there are 0 rows
  }
  else {
    throw new Error("Incorrect value of the rowsRenderCalculator");
  }
  this.fixed.style.bottom = '';
};

/**
 * Scrolls vertically to a row
 *
 * @param sourceRow {Number}
 * @param bottomEdge {Boolean} if TRUE, scrolls according to the bottom edge (top edge is by default)
 */
WalkontableVerticalScrollbarNative.prototype.scrollTo = function (sourceRow, bottomEdge) {
  var newY = this.getTableParentOffset();

  if (bottomEdge) {
    newY += this.sumCellSizes(0, sourceRow + 1);
    newY -= this.instance.wtViewport.getViewportHeight();
    // Fix 1 pixel offset when cell is selected
    newY += 1;
  }
  else {
    var fixedRowsTop = this.instance.getSetting('fixedRowsTop');
    newY += this.sumCellSizes(fixedRowsTop, sourceRow);
  }

  this.setScrollPosition(newY);
};

WalkontableVerticalScrollbarNative.prototype.getTableParentOffset = function () {
  if (this.scrollHandler === window) {
    return this.instance.wtTable.holderOffset.top;
  }
  else {
    return 0;
  }
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

  this.refreshAll = function refreshAll() {
    if(!that.instance.drawn) {
      return;
    }

    if (!that.instance.wtTable.holder.parentNode) {
      //Walkontable was detached from DOM, but this handler was not removed
      that.destroy();
      return;
    }

    that.instance.draw(true);
    that.vertical.onScroll();
    that.horizontal.onScroll();
  };

  var eventManager = Handsontable.eventManager(that.instance);

  eventManager.addEventListener(this.vertical.scrollHandler, 'scroll', this.refreshAll);
  if (this.vertical.scrollHandler !== this.horizontal.scrollHandler) {
    eventManager.addEventListener(this.horizontal.scrollHandler, 'scroll', this.refreshAll);
  }

  if (this.vertical.scrollHandler !== window && this.horizontal.scrollHandler !== window) {
    eventManager.addEventListener(window,'scroll', this.refreshAll);
  }
};

WalkontableScrollbars.prototype.destroy = function () {
  var eventManager = Handsontable.eventManager(this.instance);

  if (this.vertical) {
    this.vertical.destroy();
    eventManager.removeEventListener(this.vertical.scrollHandler,'scroll', this.refreshAll);
  }
  if (this.horizontal) {
    this.horizontal.destroy();
    eventManager.removeEventListener(this.horizontal.scrollHandler,'scroll', this.refreshAll);
  }
  eventManager.removeEventListener(window,'scroll', this.refreshAll);
  if (this.corner ) {
    this.corner.destroy();
  }
  if (this.debug) {
    this.debug.destroy();
  }
};

WalkontableScrollbars.prototype.refresh = function (fastDraw) {
  if (this.horizontal) {
    this.horizontal.refresh(fastDraw);
  }
  if (this.vertical) {
    this.vertical.refresh(fastDraw);
  }
  if (this.corner) {
    this.corner.refresh(fastDraw);
  }
  if (this.debug) {
    this.debug.refresh(fastDraw);
  }
};

WalkontableScrollbars.prototype.applyToDOM = function () {
  if (this.horizontal) {
    this.horizontal.applyToDOM();
  }
  if (this.vertical) {
    this.vertical.applyToDOM();
  }
};

function WalkontableSelection(settings, cellRange) {
  this.settings = settings;
  this.cellRange = cellRange || null;
  this.instanceBorders = {};
}

/**
 * Each Walkontable clone requires it's own border for every selection. This method creates and returns selection borders per instance
 * @param {Walkontable} instance
 * @returns {WalkontableBorder}
 */
WalkontableSelection.prototype.getBorder = function (instance) {
  if (this.instanceBorders[instance.guid]) {
    return this.instanceBorders[instance.guid];
  }
  //where is this returned?
  this.instanceBorders[instance.guid] = new WalkontableBorder(instance, this.settings);
};

/**
 * Returns boolean information if selection is empty
 * @returns {boolean}
 */
WalkontableSelection.prototype.isEmpty = function () {
  return this.cellRange === null;
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
    if (this.cellRange.from.isEqual(oldCoords)) {
      this.cellRange.from = newCoords;

      return true;
    }
    if (this.cellRange.to.isEqual(oldCoords)) {
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
  var
    topLeft = this.cellRange.getTopLeftCorner(),
    bottomRight = this.cellRange.getBottomRightCorner();

  return [topLeft.row, topLeft.col, bottomRight.row, bottomRight.col];
};

WalkontableSelection.prototype.addClassAtCoords = function (instance, sourceRow, sourceColumn, cls) {
  var TD = instance.wtTable.getCell(new WalkontableCellCoords(sourceRow, sourceColumn));

  if (typeof TD === 'object') {
    Handsontable.Dom.addClass(TD, cls);
  }
};

WalkontableSelection.prototype.draw = function (instance) {
  var
    _this = this,
    renderedRows = instance.wtTable.getRenderedRowsCount(),
    renderedColumns = instance.wtTable.getRenderedColumnsCount(),
    corners, sourceRow, sourceCol, border, TH;

  if (this.isEmpty()) {
    if (this.settings.border) {
      border = this.getBorder(instance);

      if (border) {
        border.disappear();
      }
    }

    return;
  }

  corners = this.getCorners();

  for (var column = 0; column < renderedColumns; column++) {
    sourceCol = instance.wtTable.columnFilter.renderedToSource(column);

    if (sourceCol >= corners[1] && sourceCol <= corners[3]) {
      TH = instance.wtTable.getColumnHeader(sourceCol);

      if (TH && _this.settings.highlightColumnClassName) {
        Handsontable.Dom.addClass(TH, _this.settings.highlightColumnClassName);
      }
    }
  }

  for (var row = 0; row < renderedRows; row++) {
    sourceRow = instance.wtTable.rowFilter.renderedToSource(row);

    if (sourceRow >= corners[0] && sourceRow <= corners[2]) {
      TH = instance.wtTable.getRowHeader(sourceRow);

      if (TH && _this.settings.highlightRowClassName) {
        Handsontable.Dom.addClass(TH, _this.settings.highlightRowClassName);
      }
    }

    for (var column = 0; column < renderedColumns; column++) {
      sourceCol = instance.wtTable.columnFilter.renderedToSource(column);

      if (sourceRow >= corners[0] && sourceRow <= corners[2] && sourceCol >= corners[1] && sourceCol <= corners[3]) {
        // selected cell
        if (_this.settings.className) {
          _this.addClassAtCoords(instance, sourceRow, sourceCol, _this.settings.className);
        }
      }
      else if (sourceRow >= corners[0] && sourceRow <= corners[2]) {
        // selection is in this row
        if (_this.settings.highlightRowClassName) {
          _this.addClassAtCoords(instance, sourceRow, sourceCol, _this.settings.highlightRowClassName);
        }
      }
      else if (sourceCol >= corners[1] && sourceCol <= corners[3]) {
        // selection is in this column
        if (_this.settings.highlightColumnClassName) {
          _this.addClassAtCoords(instance, sourceRow, sourceCol, _this.settings.highlightColumnClassName);
        }
      }
    }
  }

  instance.getSetting('onBeforeDrawBorders', corners, this.settings.className);

  if (this.settings.border) {
    border = this.getBorder(instance);

    if (border) {
      // warning! border.appear modifies corners!
      border.appear(corners);
    }
  }
};

function WalkontableSettings(instance, settings) {
  var that = this;
  this.instance = instance;

  //default settings. void 0 means it is required, null means it can be empty
  this.defaults = {
    table: void 0,
    debug: false, //shows WalkontableDebugOverlay

    //presentation mode
    stretchH: 'none', //values: all, last, none
    currentRowClassName: null,
    currentColumnClassName: null,

    //data source
    data: void 0,
    fixedColumnsLeft: 0,
    fixedRowsTop: 0,
    rowHeaders: function () {
      return [];
    }, //this must be array of functions: [function (row, TH) {}]
    columnHeaders: function () {
      return [];
    }, //this must be array of functions: [function (column, TH) {}]
    totalRows: void 0,
    totalColumns: void 0,
    cellRenderer: function (row, column, TD) {
      var cellData = that.getSetting('data', row, column);
      Handsontable.Dom.fastInnerText(TD, cellData === void 0 || cellData === null ? '' : cellData);
    },
    //columnWidth: 50,
    columnWidth: function (col) {
      return; //return undefined means use default size for the rendered cell content
    },
    rowHeight: function (row) {
      return; //return undefined means use default size for the rendered cell content
    },
    defaultRowHeight: 23,
    defaultColumnWidth: 50,
    selections: null,
    hideBorderOnMouseDownOver: false,
    viewportRowCalculatorOverride: null,
    viewportColumnCalculatorOverride: null,

    //callbacks
    onCellMouseDown: null,
    onCellMouseOver: null,
//    onCellMouseOut: null,
    onCellDblClick: null,
    onCellCornerMouseDown: null,
    onCellCornerDblClick: null,
    beforeDraw: null,
    onDraw: null,
    onBeforeDrawBorders: null,
    onScrollVertically: null,
    onScrollHorizontally: null,
    onBeforeTouchScroll: null,
    onAfterMomentumScroll: null,

    //constants
    scrollbarWidth: 10,
    scrollbarHeight: 10,

    renderAllRows: false,
    groups: false
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
    return this.settings[key](param1, param2, param3, param4); //this is faster than .apply - https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
  }
  else if (param1 !== void 0 && Array.isArray(this.settings[key])) { //perhaps this can be removed, it is only used in tests
    return this.settings[key][param1];
  }
  else {
    return this.settings[key];
  }
};

WalkontableSettings.prototype.has = function (key) {
  return !!this.settings[key];
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

  if (!this.isWorkingOnClone()) {
    this.holder.parentNode.style.position = "relative";
  }

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

  this.rowFilter = null;
  this.columnFilter = null;
}

WalkontableTable.prototype.isWorkingOnClone = function () {
  return !!this.instance.cloneSource;
};

/**
 * Redraws the table
 * @param fastDraw {Boolean} If TRUE, will try to avoid full redraw and only update the border positions. If FALSE or UNDEFINED, will perform a full redraw
 * @returns {WalkontableTable}
 */
WalkontableTable.prototype.draw = function (fastDraw) {
  if (!this.isWorkingOnClone()) {
    this.holderOffset = Handsontable.Dom.offset(this.holder);
    fastDraw = this.instance.wtViewport.createRenderCalculators(fastDraw);
  }

  if (!fastDraw) {
    if (this.isWorkingOnClone()) {
      this.tableOffset = this.instance.cloneSource.wtTable.tableOffset;
    }
    else {
      this.tableOffset = Handsontable.Dom.offset(this.TABLE);
    }
    var startRow;
    if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay ||
        this.instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative ||
        this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
      startRow = 0;
    }
    else {
      startRow = this.instance.wtViewport.rowsRenderCalculator.startRow;
    }


    var startColumn;
    if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay ||
        this.instance.cloneOverlay instanceof  WalkontableHorizontalScrollbarNative ||
        this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
      startColumn = 0;
    } else {
      startColumn = this.instance.wtViewport.columnsRenderCalculator.startColumn;
    }

    this.rowFilter = new WalkontableRowFilter(
      startRow,
      this.instance.getSetting('totalRows'),
      this.instance.getSetting('columnHeaders').length
    );
    this.columnFilter = new WalkontableColumnFilter(
      startColumn,
      this.instance.getSetting('totalColumns'),
      this.instance.getSetting('rowHeaders').length
    );
    this._doDraw(); //creates calculator after draw
  }
  else {
    if (!this.isWorkingOnClone()) {
      //in case we only scrolled without redraw, update visible rows information in oldRowsCalculator
      this.instance.wtViewport.createVisibleCalculators();
    }
    if (this.instance.wtScrollbars) {
      this.instance.wtScrollbars.refresh(true);
    }
  }

  this.refreshSelections(fastDraw);

  if (!this.isWorkingOnClone()) {
    this.instance.wtScrollbars.vertical.resetFixedPosition();
    this.instance.wtScrollbars.horizontal.resetFixedPosition();
    this.instance.wtScrollbars.corner.resetFixedPosition();
  }

  this.instance.drawn = true;
  return this;
};

WalkontableTable.prototype._doDraw = function () {
  var wtRenderer = new WalkontableTableRenderer(this);
  wtRenderer.render();
};

WalkontableTable.prototype.removeClassFromCells = function (className) {
  var nodes = this.TABLE.querySelectorAll('.' + className);
  for (var i = 0, ilen = nodes.length; i < ilen; i++) {
    Handsontable.Dom.removeClass(nodes[i], className);
  }
};

WalkontableTable.prototype.refreshSelections = function (fastDraw) {
  var i, len;

  if (!this.instance.selections) {
    return;
  }
  len = this.instance.selections.length;

  if (fastDraw) {
    for (i = 0; i < len; i++) {
      // there was no rerender, so we need to remove classNames by ourselves
      if (this.instance.selections[i].settings.className) {
        this.removeClassFromCells(this.instance.selections[i].settings.className);
      }
      if (this.instance.selections[i].settings.highlightRowClassName) {
        this.removeClassFromCells(this.instance.selections[i].settings.highlightRowClassName);
      }
      if (this.instance.selections[i].settings.highlightColumnClassName) {
        this.removeClassFromCells(this.instance.selections[i].settings.highlightColumnClassName);
      }
    }
  }
  for (i = 0; i < len; i++) {
    this.instance.selections[i].draw(this.instance, fastDraw);
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
  if (this.isRowBeforeRenderedRows(coords.row)) {
    return -1; //row before rendered rows
  }
  else if (this.isRowAfterRenderedRows(coords.row)) {
    return -2; //row after rendered rows
  }

    var TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(coords.row)];

    if (TR) {
      return TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(coords.col)];
    }
};

/**
 * getColumnHeader
 * @param col
 * @param level Header level (0 = most distant to the table)
 * @return {Object} HTMLElement on success or undefined on error
 *
 */
WalkontableTable.prototype.getColumnHeader = function(col, level) {
  if(!level) {
    level = 0;
  }

  var TR = this.THEAD.childNodes[level];
  if (TR) {
    return TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(col)];
  }
};

/**
 * getRowHeader
 * @param row
 * @return {Object} HTMLElement on success or {Number} one of the exit codes on error:
 *  null table doesn't have row headers
 *
 */
WalkontableTable.prototype.getRowHeader = function(row) {
  if(this.columnFilter.sourceColumnToVisibleRowHeadedColumn(0) === 0) {
    return null;
  }

  var TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];

  if (TR) {
    return TR.childNodes[0];
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
    row = this.rowFilter.visibleColHeadedRowToSourceRow(row);
  }
  else {
    row = this.rowFilter.renderedToSource(row);
  }

  return new WalkontableCellCoords(
    row,
    this.columnFilter.visibleRowHeadedColumnToSourceColumn(TD.cellIndex)
  );
};

WalkontableTable.prototype.getTrForRow = function (row) {
  return this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];
};

WalkontableTable.prototype.getFirstRenderedRow = function () {
  return this.instance.wtViewport.rowsRenderCalculator.startRow;
};

WalkontableTable.prototype.getFirstVisibleRow = function () {
  return this.instance.wtViewport.rowsVisibleCalculator.startRow;
};

WalkontableTable.prototype.getFirstRenderedColumn = function () {
  return this.instance.wtViewport.columnsRenderCalculator.startColumn;
};

//returns -1 if no column is visible
WalkontableTable.prototype.getFirstVisibleColumn = function () {
  return this.instance.wtViewport.columnsVisibleCalculator.startColumn;
};

//returns -1 if no row is visible
WalkontableTable.prototype.getLastRenderedRow = function () {
  return this.instance.wtViewport.rowsRenderCalculator.endRow;
};

WalkontableTable.prototype.getLastVisibleRow = function () {
  return this.instance.wtViewport.rowsVisibleCalculator.endRow;
};

WalkontableTable.prototype.getLastRenderedColumn = function () {
  return this.instance.wtViewport.columnsRenderCalculator.endColumn;
};

//returns -1 if no column is visible
WalkontableTable.prototype.getLastVisibleColumn = function () {
  return this.instance.wtViewport.columnsVisibleCalculator.endColumn;
};

WalkontableTable.prototype.isRowBeforeRenderedRows = function (r) {
  return (this.rowFilter.sourceToRendered(r) < 0 && r >= 0);
};

WalkontableTable.prototype.isRowAfterViewport = function (r) {
  return (r > this.getLastVisibleRow());
};

WalkontableTable.prototype.isRowAfterRenderedRows = function (r) {
  return (r > this.getLastRenderedRow());
};

WalkontableTable.prototype.isColumnBeforeViewport = function (c) {
  return (this.columnFilter.sourceToRendered(c) < 0 && c >= 0);
};

WalkontableTable.prototype.isColumnAfterViewport = function (c) {
  return (c > this.getLastVisibleColumn());
};

WalkontableTable.prototype.isLastRowFullyVisible = function () {
  return (this.getLastVisibleRow() === this.getLastRenderedRow());
};

WalkontableTable.prototype.isLastColumnFullyVisible = function () {
  return (this.getLastVisibleColumn() === this.getLastRenderedColumn);
};

WalkontableTable.prototype.getRenderedColumnsCount = function () {
  if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay) {
    return this.instance.getSetting('totalColumns');
  }
  else if (this.instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
    return this.instance.getSetting('fixedColumnsLeft');
  }
  else {
    return this.instance.wtViewport.columnsRenderCalculator.count;
  }
};

WalkontableTable.prototype.getRenderedRowsCount = function () {
  if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay) {
    return this.instance.getSetting('totalRows');
  }
  else if (this.instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
    return this.instance.getSetting('fixedRowsTop');
  }
  return this.instance.wtViewport.rowsRenderCalculator.count;
};

WalkontableTable.prototype.getVisibleRowsCount = function () {
  return this.instance.wtViewport.rowsVisibleCalculator.count;
};

WalkontableTable.prototype.allRowsInViewport = function () {
  return this.instance.getSetting('totalRows') == this.getVisibleRowsCount();
};

/**
 * Checks if any of the row's cells content exceeds its initial height, and if so, returns the oversized height
 * @param {Number} sourceRow
 * @return {Number}
 */
WalkontableTable.prototype.getRowHeight = function (sourceRow) {
  var height = this.instance.wtSettings.settings.rowHeight(sourceRow);
  var oversizedHeight = this.instance.wtViewport.oversizedRows[sourceRow];
  if (oversizedHeight !== void 0) {
    height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
  }
  return height;
};

WalkontableTable.prototype.getColumnHeaderHeight = function (level) {
  var height = this.instance.wtSettings.settings.defaultRowHeight,
    oversizedHeight = this.instance.wtViewport.oversizedColumnHeaders[level];
  if (oversizedHeight !== void 0) {
    height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
  }
  return height;
};

WalkontableTable.prototype.getVisibleColumnsCount = function () {
  return this.instance.wtViewport.columnsVisibleCalculator.count;
};


WalkontableTable.prototype.allColumnsInViewport = function () {
  return this.instance.getSetting('totalColumns') == this.getVisibleColumnsCount();
};



WalkontableTable.prototype.getColumnWidth = function (sourceColumn) {
  var width = this.instance.wtSettings.settings.columnWidth;
  if(typeof width === 'function') {
    width = width(sourceColumn);
  } else if(typeof width === 'object') {
    width = width[sourceColumn];
  }

  var oversizedWidth = this.instance.wtViewport.oversizedCols[sourceColumn];
  if (oversizedWidth !== void 0) {
    width = width ? Math.max(width, oversizedWidth) : oversizedWidth;
  }
  return width;
};

WalkontableTable.prototype.getStretchedColumnWidth = function (sourceColumn) {
  var
    width = this.getColumnWidth(sourceColumn) || this.instance.wtSettings.settings.defaultColumnWidth,
    calculator = this.instance.wtViewport.columnsRenderCalculator,
    stretchedWidth;

  if (calculator) {
    stretchedWidth = calculator.getStretchedColumnWidth(sourceColumn, width);

    if (stretchedWidth) {
      width = stretchedWidth;
    }
  }

  return width;
};


function WalkontableTableRenderer(wtTable) {
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
  this.columnHeaderCount = this.columnHeaders.length;

  var visibleColIndex
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , displayTds
    , adjusted = false
    , workspaceWidth
    , cloneLimit = this.wtTable.getRenderedRowsCount();

  if (totalColumns > 0) {
    this.adjustAvailableNodes();
    adjusted = true;

    this.renderColGroups();

    this.renderColumnHeaders();

    displayTds = this.wtTable.getRenderedColumnsCount();

    //Render table rows
    this.renderRows(totalRows, cloneLimit, displayTds);

    if (!this.wtTable.isWorkingOnClone()) {
      workspaceWidth = this.instance.wtViewport.getWorkspaceWidth();
      this.instance.wtViewport.containerWidth = null;
    } else {
      this.adjustColumnHeaderHeights();
    }

    this.adjustColumnWidths(displayTds);
  }

  if (!adjusted) {
    this.adjustAvailableNodes();
  }

  this.removeRedundantRows(cloneLimit);

  if (!this.wtTable.isWorkingOnClone()) {
    this.markOversizedRows();

    this.instance.wtViewport.createVisibleCalculators();

    this.instance.wtScrollbars.applyToDOM();

    if (workspaceWidth !== this.instance.wtViewport.getWorkspaceWidth()) {
      //workspace width changed though to shown/hidden vertical scrollbar. Let's reapply stretching
      this.instance.wtViewport.containerWidth = null;

      var firstRendered = this.wtTable.getFirstRenderedColumn();
      var lastRendered = this.wtTable.getLastRenderedColumn();

      for (var i = firstRendered ; i < lastRendered; i++) {
        var width = this.wtTable.getStretchedColumnWidth(i);
        var renderedIndex = this.columnFilter.sourceToRendered(i);
        this.COLGROUP.childNodes[renderedIndex + this.rowHeaderCount].style.width = width + 'px';
      }
    }

    this.instance.wtScrollbars.refresh(false);

    this.instance.getSetting('onDraw', true);
  }

};

WalkontableTableRenderer.prototype.removeRedundantRows = function (renderedRowsCount) {
  while (this.wtTable.tbodyChildrenLength > renderedRowsCount) {
    this.TBODY.removeChild(this.TBODY.lastChild);
    this.wtTable.tbodyChildrenLength--;
  }
};

WalkontableTableRenderer.prototype.renderRows = function (totalRows, cloneLimit, displayTds) {
  var lastTD, TR;
  var visibleRowIndex = 0;
  var sourceRowIndex = this.rowFilter.renderedToSource(visibleRowIndex);
  var isWorkingOnClone = this.wtTable.isWorkingOnClone();

  while (sourceRowIndex < totalRows && sourceRowIndex >= 0) {
    if (visibleRowIndex > 1000) {
      throw new Error('Security brake: Too much TRs. Please define height for your table, which will enforce scrollbars.');
    }

    if (cloneLimit !== void 0 && visibleRowIndex === cloneLimit) {
      break; //we have as much rows as needed for this clone
    }

    TR = this.getOrCreateTrForRow(visibleRowIndex, TR);

    //Render row headers
    this.renderRowHeaders(sourceRowIndex, TR);

    this.adjustColumns(TR, displayTds + this.rowHeaderCount);

    lastTD = this.renderCells(sourceRowIndex, TR, displayTds);

    //after last column is rendered, check if last cell is fully displayed
    if (!isWorkingOnClone) {
      this.resetOversizedRow(sourceRowIndex);
    }


    if (TR.firstChild) {
      //if I have 2 fixed columns with one-line content and the 3rd column has a multiline content, this is the way to make sure that the overlay will has same row height
      var height = this.instance.wtTable.getRowHeight(sourceRowIndex);
      if (height) {
        TR.firstChild.style.height = height + 'px';
      }
      else {
        TR.firstChild.style.height = '';
      }
    }

    visibleRowIndex++;

    sourceRowIndex = this.rowFilter.renderedToSource(visibleRowIndex);
  }
};

WalkontableTableRenderer.prototype.resetOversizedRow = function (sourceRow) {
  if (this.instance.wtViewport.oversizedRows && this.instance.wtViewport.oversizedRows[sourceRow]) {
    this.instance.wtViewport.oversizedRows[sourceRow] = void 0;  //void 0 is faster than delete, see http://jsperf.com/delete-vs-undefined-vs-null/16
  }
};

WalkontableTableRenderer.prototype.markOversizedRows = function () {
  var previousRowHeight
    , trInnerHeight
    , sourceRowIndex
    , currentTr;

  var rowCount = this.instance.wtTable.TBODY.childNodes.length;
  while (rowCount) {
    rowCount--;
    sourceRowIndex = this.instance.wtTable.rowFilter.renderedToSource(rowCount);
    previousRowHeight = this.instance.wtTable.getRowHeight(sourceRowIndex);
    currentTr = this.instance.wtTable.getTrForRow(sourceRowIndex);

    trInnerHeight = Handsontable.Dom.innerHeight(currentTr) - 1;

    if ((!previousRowHeight && this.instance.wtSettings.settings.defaultRowHeight < trInnerHeight || previousRowHeight < trInnerHeight)) {
      this.instance.wtViewport.oversizedRows[sourceRowIndex] = trInnerHeight;
    }
  }

};

WalkontableTableRenderer.prototype.adjustColumnHeaderHeights = function () {
  var columnHeaders = this.instance.getSetting('columnHeaders');
  for(var i = 0, columnHeadersCount = columnHeaders.length; i < columnHeadersCount; i++) {
    if(this.instance.wtViewport.oversizedColumnHeaders[i]) {
      if(this.instance.wtTable.THEAD.childNodes[i].childNodes.length === 0) {
        return;
      }
      this.instance.wtTable.THEAD.childNodes[i].childNodes[0].style.height = this.instance.wtViewport.oversizedColumnHeaders[i] + "px";
    }
  }
};

WalkontableTableRenderer.prototype.markIfOversizedColumnHeader = function (col) {
  var colCount = this.instance.wtTable.THEAD.childNodes.length !== 0 ? this.instance.wtTable.THEAD.childNodes[0].childNodes.length : 0,
    sourceColIndex,
    previousColHeaderHeight,
    currentHeader,
    currentHeaderHeight,
    columnHeaders = this.instance.getSetting('columnHeaders'),
    columnHeaderCount = columnHeaders.length,
    level = columnHeaderCount;

    sourceColIndex = this.instance.wtTable.columnFilter.renderedToSource(col);

    while(level) {
      level--;

      previousColHeaderHeight = this.instance.wtTable.getColumnHeaderHeight(level);
      currentHeader = this.instance.wtTable.getColumnHeader(sourceColIndex, level);

      if(!currentHeader) {
        continue;
      }

      currentHeaderHeight = Handsontable.Dom.innerHeight(currentHeader) - 1;

      if ((!previousColHeaderHeight && this.instance.wtSettings.settings.defaultRowHeight < currentHeaderHeight || previousColHeaderHeight < currentHeaderHeight)) {
        this.instance.wtViewport.oversizedColumnHeaders[level] = currentHeaderHeight;
      }
    }
};

WalkontableTableRenderer.prototype.renderCells = function (sourceRowIndex, TR, displayTds) {
  var TD, sourceColIndex;

  for (var visibleColIndex = 0; visibleColIndex < displayTds; visibleColIndex++) {
    sourceColIndex = this.columnFilter.renderedToSource(visibleColIndex);
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

    if (!Handsontable.Dom.hasClass(TD, 'hide')) {
      TD.className = '';
    }

    TD.removeAttribute('style');

    this.instance.wtSettings.settings.cellRenderer(sourceRowIndex, sourceColIndex, TD);

  }

  return TD;
};

WalkontableTableRenderer.prototype.adjustColumnWidths = function (displayTds) {
  var width;

  this.instance.wtViewport.columnsRenderCalculator.refreshStretching(this.instance.wtViewport.getViewportWidth());

  for (var renderedColIndex = 0; renderedColIndex < displayTds; renderedColIndex++) {
    width = this.wtTable.getStretchedColumnWidth(this.columnFilter.renderedToSource(renderedColIndex));
    this.COLGROUP.childNodes[renderedColIndex + this.rowHeaderCount].style.width = width + 'px';
  }
};

WalkontableTableRenderer.prototype.appendToTbody = function (TR) {
  this.TBODY.appendChild(TR);
  this.wtTable.tbodyChildrenLength++;
};

WalkontableTableRenderer.prototype.getOrCreateTrForRow = function (rowIndex, currentTr) {
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

WalkontableTableRenderer.prototype.createRow = function () {
  var TR = document.createElement('TR');
  for (var visibleColIndex = 0; visibleColIndex < this.rowHeaderCount; visibleColIndex++) {
    TR.appendChild(document.createElement('TH'));
  }

  return TR;
};

WalkontableTableRenderer.prototype.renderRowHeader = function(row, col, TH){
  TH.className = '';
  TH.removeAttribute('style');
  this.rowHeaders[col](row, TH, col);
};

WalkontableTableRenderer.prototype.renderRowHeaders = function (row, TR) {
  for (var TH = TR.firstChild, visibleColIndex = 0; visibleColIndex < this.rowHeaderCount; visibleColIndex++) {

    //If the number of row headers increased we need to create TH or replace an existing TD node with TH
    if (!TH) {
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
  //adjust COLGROUP
  this.adjustColGroups();

  //adjust THEAD
  this.adjustThead();
};

WalkontableTableRenderer.prototype.renderColumnHeaders = function () {
  if (!this.columnHeaderCount) {
    return;
  }

  var columnCount = this.wtTable.getRenderedColumnsCount(),
    TR,
    renderedColumnIndex;

  for (var i = 0; i < this.columnHeaderCount; i++) {
    TR = this.getTrForColumnHeaders(i);

    for (renderedColumnIndex = (-1) * this.rowHeaderCount; renderedColumnIndex < columnCount; renderedColumnIndex++) {
      var sourceCol = this.columnFilter.renderedToSource(renderedColumnIndex);
      this.renderColumnHeader(i, sourceCol, TR.childNodes[renderedColumnIndex + this.rowHeaderCount]);

      if(!this.wtTable.isWorkingOnClone()) {
        this.markIfOversizedColumnHeader(renderedColumnIndex);
      }
    }
  }
};

WalkontableTableRenderer.prototype.adjustColGroups = function () {
  var columnCount = this.wtTable.getRenderedColumnsCount();

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
  var columnCount = this.wtTable.getRenderedColumnsCount();
  var TR = this.THEAD.firstChild;
  if (this.columnHeaders.length) {

    for (var i = 0, columnHeadersLength = this.columnHeaders.length; i < columnHeadersLength; i++) {
      TR = this.THEAD.childNodes[i];
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

    var theadChildrenLength = this.THEAD.childNodes.length;
    if(theadChildrenLength > this.columnHeaders.length) {
      for(var i = this.columnHeaders.length; i < theadChildrenLength; i++ ) {
        this.THEAD.removeChild(this.THEAD.lastChild);
      }
    }
  }

  else if (TR) {
    Handsontable.Dom.empty(TR);
  }
};

WalkontableTableRenderer.prototype.getTrForColumnHeaders = function (index) {
  var TR = this.THEAD.childNodes[index];
  return TR;
};

WalkontableTableRenderer.prototype.renderColumnHeader = function (row, col, TH) {
  TH.className = '';
  TH.removeAttribute('style');
  return this.columnHeaders[row](col, TH, row);
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

WalkontableTableRenderer.prototype.removeRedundantColumns = function (renderedColumnsCount) {
  while (this.wtTable.tbodyChildrenLength > renderedColumnsCount) {
    this.TBODY.removeChild(this.TBODY.lastChild);
    this.wtTable.tbodyChildrenLength--;
  }
};

/*
 Helper functions, which does not have any side effects
 */
WalkontableTableRenderer.utils = {};

WalkontableTableRenderer.utils.replaceTdWithTh = function (TD, TR) {
  var TH;
  TH = document.createElement('TH');
  TR.insertBefore(TH, TD);
  TR.removeChild(TD);

  return TH;
};

WalkontableTableRenderer.utils.replaceThWithTd = function (TH, TR) {
  var TD = document.createElement('TD');
  TR.insertBefore(TD, TH);
  TR.removeChild(TH);

  return TD;
};



function WalkontableViewport(instance) {
  this.instance = instance;
  this.oversizedRows = [];
  this.oversizedCols = [];
  this.oversizedColumnHeaders = [];

  var that = this;

  var eventManager = Handsontable.eventManager(instance);
  eventManager.addEventListener(window,'resize',function () {
    that.clientHeight = that.getWorkspaceHeight();
  });
}

WalkontableViewport.prototype.getWorkspaceHeight = function () {
  var scrollHandler = this.instance.wtScrollbars.vertical.scrollHandler;
  if (scrollHandler === window) {
    return document.documentElement.clientHeight;
  }
  else {
    var elemHeight = Handsontable.Dom.outerHeight(scrollHandler);
    var height = (elemHeight > 0 && scrollHandler.clientHeight > 0) ? scrollHandler.clientHeight : Infinity; //returns height without DIV scrollbar
    return height;
  }
};


WalkontableViewport.prototype.getWorkspaceWidth = function () {
  var width,
    totalColumns = this.instance.getSetting("totalColumns"),
    scrollHandler = this.instance.wtScrollbars.horizontal.scrollHandler,
    overflow,
    stretchSetting = this.instance.getSetting('stretchH');

  if(Handsontable.freezeOverlays) {
    width = Math.min(document.documentElement.offsetWidth - this.getWorkspaceOffset().left, document.documentElement.offsetWidth);
  } else {
    width = Math.min(this.getContainerFillWidth(), document.documentElement.offsetWidth - this.getWorkspaceOffset().left, document.documentElement.offsetWidth);
  }

  if (scrollHandler === window && totalColumns > 0 && this.sumColumnWidths(0, totalColumns - 1) > width) {
    //in case sum of column widths is higher than available stylesheet width, let's assume using the whole window
    //otherwise continue below, which will allow stretching
    //this is used in `scroll_window.html`
    //TODO test me
    return document.documentElement.clientWidth;
  }

  if (scrollHandler !== window){
      overflow = this.instance.wtScrollbars.horizontal.scrollHandler.style.overflow;

    if (overflow == "scroll" || overflow == "hidden" || overflow == "auto") {
      //this is used in `scroll.html`
      //TODO test me
      return Math.max(width, scrollHandler.clientWidth);
    }
  }

  if(stretchSetting === 'none' || !stretchSetting) {
    // if no stretching is used, return the maximum used workspace width
    return Math.max(width, Handsontable.Dom.outerWidth(this.instance.wtTable.TABLE));
  } else {
    // if stretching is used, return the actual container width, so the columns can fit inside it
    return width;
  }
};

WalkontableViewport.prototype.sumColumnWidths = function (from, length) {
  var sum = 0;
  while(from < length) {
    sum += this.instance.wtTable.getColumnWidth(from) || this.instance.wtSettings.defaultColumnWidth;
    from++;
  }
  return sum;
};
WalkontableViewport.prototype.getContainerFillWidth = function() {

  if(this.containerWidth) {
    return this.containerWidth;
  }

  var mainContainer = this.instance.wtTable.holder,
      fillWidth,
      dummyElement;

  while(mainContainer.parentNode != document.body && mainContainer.parentNode != null && mainContainer.className.indexOf('handsontable') === -1) {
    mainContainer = mainContainer.parentNode;
  }

  dummyElement = document.createElement("DIV");
  dummyElement.style.width = "100%";
  dummyElement.style.height = "1px";
  mainContainer.appendChild(dummyElement);
  fillWidth = dummyElement.offsetWidth;

  this.containerWidth = fillWidth;

  mainContainer.removeChild(dummyElement);

  return fillWidth;
};

WalkontableViewport.prototype.getWorkspaceOffset = function () {
  return Handsontable.Dom.offset(this.instance.wtTable.TABLE);
};

WalkontableViewport.prototype.getWorkspaceActualHeight = function () {
  return Handsontable.Dom.outerHeight(this.instance.wtTable.TABLE);
};

WalkontableViewport.prototype.getWorkspaceActualWidth = function () {
  return Handsontable.Dom.outerWidth(this.instance.wtTable.TABLE) ||
    Handsontable.Dom.outerWidth(this.instance.wtTable.TBODY) ||
    Handsontable.Dom.outerWidth(this.instance.wtTable.THEAD); //IE8 reports 0 as <table> offsetWidth;
};

WalkontableViewport.prototype.getColumnHeaderHeight = function () {
  if (isNaN(this.columnHeaderHeight)) {
    this.columnHeaderHeight = Handsontable.Dom.outerHeight(this.instance.wtTable.THEAD);
  }
  return this.columnHeaderHeight;
};

WalkontableViewport.prototype.getViewportHeight = function () {

  var containerHeight = this.getWorkspaceHeight();

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

// Viewport width = Workspace width - Row Headers width
WalkontableViewport.prototype.getViewportWidth = function () {
  var containerWidth = this.getWorkspaceWidth(),
    rowHeaderWidth;

  if (containerWidth === Infinity) {
    return containerWidth;
  }
  rowHeaderWidth = this.getRowHeaderWidth();

  if (rowHeaderWidth > 0) {
    return containerWidth - rowHeaderWidth;
  }

  return containerWidth;
};

/**
 * Creates:
 *  - rowsRenderCalculator (before draw, to qualify rows for rendering)
 *  - rowsVisibleCalculator (after draw, to measure which rows are actually visible)
 * @returns {WalkontableViewportRowsCalculator}
 */
WalkontableViewport.prototype.createRowsCalculator = function (visible) {
  this.rowHeaderWidth = NaN;

  var height;
  if (this.instance.wtSettings.settings.renderAllRows) {
    height = Infinity;
  }
  else {
    height = this.getViewportHeight();
  }

  var pos = this.instance.wtScrollbars.vertical.getScrollPosition() - this.instance.wtScrollbars.vertical.getTableParentOffset();
  if (pos < 0) {
    pos = 0;
  }

  var fixedRowsTop = this.instance.getSetting('fixedRowsTop');
  if(fixedRowsTop) {
    var fixedRowsHeight = this.instance.wtScrollbars.vertical.sumCellSizes(0, fixedRowsTop);
    pos += fixedRowsHeight;
    height -= fixedRowsHeight;
  }

  var that = this;
  return new WalkontableViewportRowsCalculator(
    height,
    pos,
    this.instance.getSetting('totalRows'),
    function(sourceRow) {
      return that.instance.wtTable.getRowHeight(sourceRow);
    },
    visible ? null : this.instance.wtSettings.settings.viewportRowCalculatorOverride,
    visible ? true : false
  );
};

/**
 * Creates:
 *  - columnsRenderCalculator (before draw, to qualify columns for rendering)
 *  - columnsVisibleCalculator (after draw, to measure which columns are actually visible)
 * @returns {WalkontableViewportRowsCalculator}
 */
WalkontableViewport.prototype.createColumnsCalculator = function (visible) {
  this.columnHeaderHeight = NaN;

  var width = this.getViewportWidth();

  var pos = this.instance.wtScrollbars.horizontal.getScrollPosition() - this.instance.wtScrollbars.vertical.getTableParentOffset();
  if (pos < 0) {
    pos = 0;
  }

  var fixedColumnsLeft = this.instance.getSetting('fixedColumnsLeft');
  if(fixedColumnsLeft) {
    var fixedColumnsWidth = this.instance.wtScrollbars.horizontal.sumCellSizes(0, fixedColumnsLeft);
    pos += fixedColumnsWidth;
    width -= fixedColumnsWidth;
  }

  var that = this;
  return new WalkontableViewportColumnsCalculator(
    width,
    pos,
    this.instance.getSetting('totalColumns'),
    function (sourceCol) {
      return that.instance.wtTable.getColumnWidth(sourceCol);
    },
    visible ? null : this.instance.wtSettings.settings.viewportColumnCalculatorOverride,
    visible ? true : false,
    this.instance.getSetting('stretchH')
  );
};


/**
 * Creates rowsRenderCalculator and columnsRenderCalculator (before draw, to determine what rows and cols should be rendered)
 * @param fastDraw {Boolean} If TRUE, will try to avoid full redraw and only update the border positions. If FALSE or UNDEFINED, will perform a full redraw
 */
WalkontableViewport.prototype.createRenderCalculators = function (fastDraw) {
  if (fastDraw) {
    var proposedRowsVisibleCalculator = this.createRowsCalculator(true);
    var proposedColumnsVisibleCalculator = this.createColumnsCalculator(true);
    if (!(this.areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator) && this.areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator) ) ) {
      fastDraw = false;
    }
  }

  if(!fastDraw) {
    this.rowsRenderCalculator = this.createRowsCalculator();
    this.columnsRenderCalculator = this.createColumnsCalculator();
  }

  this.rowsVisibleCalculator = null; //delete temporarily to make sure that renderers always use rowsRenderCalculator, not rowsVisibleCalculator
  this.columnsVisibleCalculator = null;

  return fastDraw;
};

/**
 * Creates rowsVisibleCalculator and columnsVisibleCalculator (after draw, to determine what are the actually visible rows and columns)
 */
WalkontableViewport.prototype.createVisibleCalculators = function () {
  this.rowsVisibleCalculator = this.createRowsCalculator(true);
  this.columnsVisibleCalculator = this.createColumnsCalculator(true);
};

/**
 * Returns information whether proposedRowsVisibleCalculator viewport
 * is contained inside rows rendered in previous draw (cached in rowsRenderCalculator)
 *
 * Returns TRUE if all proposed visible rows are already rendered (meaning: redraw is not needed)
 * Returns FALSE if at least one proposed visible row is not already rendered (meaning: redraw is needed)
 *
 * @returns {boolean}
 */
WalkontableViewport.prototype.areAllProposedVisibleRowsAlreadyRendered = function (proposedRowsVisibleCalculator) {
  if (this.rowsVisibleCalculator) {
    if (proposedRowsVisibleCalculator.startRow < this.rowsRenderCalculator.startRow ||
        (proposedRowsVisibleCalculator.startRow === this.rowsRenderCalculator.startRow &&
        proposedRowsVisibleCalculator.startRow > 0)) {
      return false;
    }
    else if (proposedRowsVisibleCalculator.endRow > this.rowsRenderCalculator.endRow ||
        (proposedRowsVisibleCalculator.endRow === this.rowsRenderCalculator.endRow &&
        proposedRowsVisibleCalculator.endRow < this.instance.getSetting('totalRows') - 1)) {
      return false;
    }
    else {
      return true;
    }
  }
  return false;
};

/**
 * Returns information whether proposedColumnsVisibleCalculator viewport
 * is contained inside column rendered in previous draw (cached in columnsRenderCalculator)
 *
 * Returns TRUE if all proposed visible columns are already rendered (meaning: redraw is not needed)
 * Returns FALSE if at least one proposed visible column is not already rendered (meaning: redraw is needed)
 *
 * @returns {boolean}
 */
WalkontableViewport.prototype.areAllProposedVisibleColumnsAlreadyRendered = function (proposedColumnsVisibleCalculator) {
  if (this.columnsVisibleCalculator) {
    if (proposedColumnsVisibleCalculator.startColumn < this.columnsRenderCalculator.startColumn ||
        (proposedColumnsVisibleCalculator.startColumn === this.columnsRenderCalculator.startColumn &&
        proposedColumnsVisibleCalculator.startColumn > 0)) {
      return false;
    }
    else if (proposedColumnsVisibleCalculator.endColumn > this.columnsRenderCalculator.endColumn ||
        (proposedColumnsVisibleCalculator.endColumn === this.columnsRenderCalculator.endColumn &&
        proposedColumnsVisibleCalculator.endColumn < this.instance.getSetting('totalColumns') - 1)) {
      return false;
    }
    else {
      return true;
    }
  }
  return false;
};

function WalkontableViewportColumnsCalculator (width, scrollOffset, totalColumns, columnWidthFn, overrideFn, onlyFullyVisible, stretchH) {
  var
    _this = this,
    ratio = 1,
    sum = 0,
    needReverse = true,
    defaultColumnWidth = 50,
    startPositions = [],
    getColumnWidth,
    columnWidth, i;

  this.scrollOffset = scrollOffset;
  this.startColumn = null;
  this.endColumn = null;
  this.startPosition = null;
  this.count = 0;
  this.stretchAllRatio = 0;
  this.stretchLastWidth = 0;
  this.stretch = stretchH;
  this.totalTargetWidth = 0;
  this.needVerifyLastColumnWidth = true;
  this.stretchAllColumnsWidth = [];


  function getStretchedAllColumnWidth(column, baseWidth) {
    var sumRatioWidth = 0;

    if (!_this.stretchAllColumnsWidth[column]) {
      _this.stretchAllColumnsWidth[column] = Math.round(baseWidth * _this.stretchAllRatio);
    }
    if (_this.stretchAllColumnsWidth.length === totalColumns && _this.needVerifyLastColumnWidth) {
      _this.needVerifyLastColumnWidth = false;

      for (var i = 0; i < _this.stretchAllColumnsWidth.length; i++) {
        sumRatioWidth += _this.stretchAllColumnsWidth[i];
      }
      if (sumRatioWidth != _this.totalTargetWidth) {
        _this.stretchAllColumnsWidth[_this.stretchAllColumnsWidth.length - 1] += _this.totalTargetWidth - sumRatioWidth;
      }
    }

    return _this.stretchAllColumnsWidth[column];
  }

  function getStretchedLastColumnWidth(column, baseWidth) {
    if (column === totalColumns - 1) {
      return _this.stretchLastWidth;
    }

    return null;
  }

  getColumnWidth = function getColumnWidth(i) {
    var width = columnWidthFn(i);

    ratio = ratio || 1;

    if (width === undefined) {
      width = defaultColumnWidth;
    }

    return width;
  };

  /**
   * Recalculate columns stretching.
   *
   * @param {Number} totalWidth
   */
  this.refreshStretching = function (totalWidth) {
    var sumAll = 0,
      columnWidth,
      remainingSize;

    for (var i = 0; i < totalColumns; i++) {
      columnWidth = getColumnWidth(i);
      sumAll += columnWidth;
    }
    this.totalTargetWidth = totalWidth;
    remainingSize = sumAll - totalWidth;

    if (this.stretch === 'all' && remainingSize < 0) {
      this.stretchAllRatio = totalWidth / sumAll;
      this.stretchAllColumnsWidth = [];
      this.needVerifyLastColumnWidth = true;
    }
    else if (this.stretch === 'last' && totalWidth !== Infinity) {
      this.stretchLastWidth = -remainingSize + getColumnWidth(totalColumns - 1);
    }
  };

  /**
   * Get stretched column width based on stretchH (all or last) setting passed in handsontable instance.
   *
   * @param {Number} column
   * @param {Number} baseWidth
   * @returns {Number|null}
   */
  this.getStretchedColumnWidth = function(column, baseWidth) {
    var result = null;

    if (this.stretch === 'all' && this.stretchAllRatio !== 0) {
      result = getStretchedAllColumnWidth(column, baseWidth);
    }
    else if (this.stretch === 'last' && this.stretchLastWidth !== 0) {
      result = getStretchedLastColumnWidth(column, baseWidth);
    }

    return result;
  };


  for (i = 0; i < totalColumns; i++) {
    columnWidth = getColumnWidth(i);

    if (sum <= scrollOffset && !onlyFullyVisible) {
      this.startColumn = i;
    }

    if (sum >= scrollOffset && sum + columnWidth <= scrollOffset + width) {
      if (this.startColumn == null) {
        this.startColumn = i;
      }
      this.endColumn = i;
    }
    startPositions.push(sum);
    sum += columnWidth;

    if (!onlyFullyVisible) {
      this.endColumn = i;
    }
    if (sum >= scrollOffset + width) {
      needReverse = false;
      break;
    }
  }

  if (this.endColumn == totalColumns - 1 && needReverse) {
    this.startColumn = this.endColumn;

    while (this.startColumn > 0) {
      var viewportSum = startPositions[this.endColumn] + columnWidth - startPositions[this.startColumn - 1];

      if (viewportSum <= width || !onlyFullyVisible) {
        this.startColumn--;
      }
      if (viewportSum > width) {
        break;
      }
    }
  }

  if (this.startColumn !== null && overrideFn) {
    overrideFn(this);
  }
  this.startPosition = startPositions[this.startColumn];

  if (this.startPosition == void 0) {
    this.startPosition = null;
  }
  if (this.startColumn != null) {
    this.count = this.endColumn - this.startColumn + 1;
  }
}


/**
 * Viewport calculator constructor. Calculates indexes of rows to render OR rows that are visible.
 * To redo the calculation, you need to create a new calculator.
 *
 * Object properties:
 *   this.scrollOffset - position of vertical scroll (in px)
 *   this.startRow - index of the first rendered/visible row (can be overwritten using overrideFn)
 *   this.startPosition - position of the first rendered/visible row (in px)
 *   this.endRow - index of the last rendered/visible row (can be overwritten using overrideFn)
 *   this.count - number of rendered/visible rows
 *
 * @param height - height of the viewport
 * @param scrollOffset - current vertical scroll position of the viewport
 * @param totalRows - total number of rows
 * @param rowHeightFn - function that returns the height of the row at a given index (in px)
 * @param overrideFn - function that changes calculated this.startRow, this.endRow (used by mergeCells.js plugin)
 * @param onlyFullyVisible {bool} - if TRUE, only startRow and endRow will be indexes of rows that are FULLY in viewport
 * @constructor
 */
function WalkontableViewportRowsCalculator(height, scrollOffset, totalRows, rowHeightFn, overrideFn, onlyFullyVisible) {
  this.scrollOffset = scrollOffset;
  this.startRow = null;
  this.startPosition = null;
  this.endRow = null;
  this.count = 0;
  var sum = 0;
  var rowHeight;
  var needReverse = true;
  var defaultRowHeight = 23;
  var startPositions = [];
  for (var i = 0; i < totalRows; i++) {
    rowHeight = rowHeightFn(i);
    if (rowHeight === undefined) {
      rowHeight = defaultRowHeight;
    }
    if (sum <= scrollOffset && !onlyFullyVisible) {
      this.startRow = i;
    }
    if (sum >= scrollOffset && sum + rowHeight <= scrollOffset + height) {
      if (this.startRow == null) {
        this.startRow = i;
      }
      this.endRow = i;
    }
    startPositions.push(sum);
    sum += rowHeight;
    if(!onlyFullyVisible) {
      this.endRow = i;
    }
    if (sum >= scrollOffset + height) {
      needReverse = false;
      break;
    }
  }

  //If the rendering has reached the last row and there is still some space available in the viewport, we need to render in reverse in order to fill the whole viewport with rows
  if (this.endRow == totalRows - 1 && needReverse) {
    this.startRow = this.endRow;
    while(this.startRow > 0) {
      var viewportSum = startPositions[this.endRow] + rowHeight - startPositions[this.startRow - 1]; //rowHeight is the height of the last row
      if (viewportSum <= height || !onlyFullyVisible)
      {
        this.startRow--;
      }
      if (viewportSum >= height)
      {
       break;
      }
    }
  }

  if (this.startRow !== null && overrideFn) {
    overrideFn(this);
  }

  this.startPosition = startPositions[this.startRow];
  if (this.startPosition == void 0) {
    this.startPosition = null;
  }

  if (this.startRow != null) {
    this.count = this.endRow - this.startRow + 1;
  }
}

if (window.jQuery) {
  (function (window, $, Handsontable) {
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
          instance = new Handsontable.Core($this[0], userSettings);
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

            if (action === 'destroy'){
              $this.removeData();
            }
          }
          else {
            throw new Error('Handsontable do not provide action: ' + action);
          }
        }

        return output;
      }
    };
  })(window, jQuery, Handsontable);
}



})(window, Handsontable);
