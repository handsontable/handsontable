
import numeral from 'numeral';
import {addClass, empty, isChildOfWebComponentTable, removeClass} from './helpers/dom/element';
import {columnFactory} from './helpers/setting';
import {DataMap} from './dataMap';
import {EditorManager} from './editorManager';
import {eventManager as eventManagerObject} from './eventManager';
import {extend, duckSchema, isObjectEquals, deepClone} from './helpers/object';
import {getPlugin} from './plugins';
import {getRenderer} from './renderers';
import {randomString} from './helpers/string';
import {TableView} from './tableView';
import {translateRowsToColumns, cellMethodLookupFactory, spreadsheetColumnLabel} from './helpers/data';
import {WalkontableCellCoords} from './3rdparty/walkontable/src/cell/coords';
import {WalkontableCellRange} from './3rdparty/walkontable/src/cell/range';
import {WalkontableSelection} from './3rdparty/walkontable/src/selection';
import {WalkontableViewportColumnsCalculator} from './3rdparty/walkontable/src/calculator/viewportColumns';

Handsontable.activeGuid = null;

/**
 * Handsontable constructor
 *
 * @core
 * @dependencies numeral
 * @constructor Core
 * @description
 *
 * After Handsontable is constructed, you can modify the grid behavior using the available public methods.
 *
 * ---
 * ## How to call methods
 *
 * These are 2 equal ways to call a Handsontable method:
 *
 * ```js
 * // all following examples assume that you constructed Handsontable like this
 * var ht = new Handsontable(document.getElementById('example1'), options);
 *
 * // now, to use setDataAtCell method, you can either:
 * ht.setDataAtCell(0, 0, 'new value');
 * ```
 *
 * Alternatively, you can call the method using jQuery wrapper (__obsolete__, requires initialization using our jQuery guide
 * ```js
 *   $('#example1').handsontable('setDataAtCell', 0, 0, 'new value');
 * ```
 * ---
 */
Handsontable.Core = function Core(rootElement, userSettings) {
  var priv
    , datamap
    , grid
    , selection
    , editorManager
    , instance = this
    , GridSettings = function() {}
    , eventManager = eventManagerObject(instance);

  extend(GridSettings.prototype, DefaultSettings.prototype); //create grid settings as a copy of default settings
  extend(GridSettings.prototype, userSettings); //overwrite defaults with user settings
  extend(GridSettings.prototype, expandType(userSettings));

  this.rootElement = rootElement;
  this.isHotTableEnv = isChildOfWebComponentTable(this.rootElement);
  Handsontable.eventManager.isHotTableEnv = this.isHotTableEnv;

  this.container = document.createElement('DIV');
  this.renderCall = false;

  rootElement.insertBefore(this.container, rootElement.firstChild);

  this.guid = 'ht_' + randomString(); //this is the namespace for global events

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
     *
     * @memberof Core#
     * @function alter
     * @private
     * @param {String} action Possible values: "insert_row", "insert_col", "remove_row", "remove_col"
     * @param {Number} index
     * @param {Number} amount
     * @param {String} [source] Optional. Source of hook runner.
     * @param {Boolean} [keepEmptyRows] Optional. Flag for preventing deletion of empty rows.
     */
    alter: function(action, index, amount, source, keepEmptyRows) {
      var delta;

      amount = amount || 1;

      switch (action) {
        case "insert_row":

          if (instance.getSettings().maxRows === instance.countRows()) {
            return;
          }

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

            if (Array.isArray(instance.getSettings().colHeaders)) {
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

          var fixedRowsTop = instance.getSettings().fixedRowsTop;
          if (fixedRowsTop >= index + 1) {
            instance.getSettings().fixedRowsTop -= Math.min(amount, fixedRowsTop - index);
          }

          grid.adjustRowsAndCols();
          selection.refreshBorders(); //it will call render and prepare methods
          break;

        case "remove_col":
          datamap.removeCol(index, amount);

          for (var row = 0, len = datamap.getAll().length; row < len; row++) {
            if (row in priv.cellSettings) {  //if row hasn't been rendered it wouldn't have cellSettings
              priv.cellSettings[row].splice(index, amount);
            }
          }

          var fixedColumnsLeft = instance.getSettings().fixedColumnsLeft;
          if (fixedColumnsLeft >= index + 1) {
            instance.getSettings().fixedColumnsLeft -= Math.min(amount, fixedColumnsLeft - index);
          }

          if (Array.isArray(instance.getSettings().colHeaders)) {
            if (typeof index == 'undefined') {
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
    adjustRowsAndCols: function() {
      if (priv.settings.minRows) {
        // should I add empty rows to data source to meet minRows?
        let rows = instance.countRows();

        if (rows < priv.settings.minRows) {
          for (let r = 0, minRows = priv.settings.minRows; r < minRows - rows; r++) {
            datamap.createRow(instance.countRows(), 1, true);
          }
        }
      }
      if (priv.settings.minSpareRows) {
        let emptyRows = instance.countEmptyRows(true);

        // should I add empty rows to meet minSpareRows?
        if (emptyRows < priv.settings.minSpareRows) {
          for (; emptyRows < priv.settings.minSpareRows && instance.countRows() < priv.settings.maxRows; emptyRows++) {
            datamap.createRow(instance.countRows(), 1, true);
          }
        }
      }
      {
        let emptyCols;

        // count currently empty cols
        if (priv.settings.minCols || priv.settings.minSpareCols) {
          emptyCols = instance.countEmptyCols(true);
        }

        // should I add empty cols to meet minCols?
        if (priv.settings.minCols && !priv.settings.columns && instance.countCols() < priv.settings.minCols) {
          for (; instance.countCols() < priv.settings.minCols; emptyCols++) {
            datamap.createCol(instance.countCols(), 1, true);
          }
        }
        // should I add empty cols to meet minSpareCols?
        if (priv.settings.minSpareCols && !priv.settings.columns && instance.dataType === 'array' &&
            emptyCols < priv.settings.minSpareCols) {
          for (; emptyCols < priv.settings.minSpareCols && instance.countCols() < priv.settings.maxCols; emptyCols++) {
            datamap.createCol(instance.countCols(), 1, true);
          }
        }
      }
      let rowCount = instance.countRows();
      let colCount = instance.countCols();

      if (rowCount === 0 || colCount === 0) {
        selection.deselect();
      }

      if (selection.isSelected()) {
        let selectionChanged = false;
        let fromRow = priv.selRange.from.row;
        let fromCol = priv.selRange.from.col;
        let toRow = priv.selRange.to.row;
        let toCol = priv.selRange.to.col;

        // if selection is outside, move selection to last row
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
        // if selection is outside, move selection to last row
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
      if (instance.view) {
        instance.view.wt.wtOverlays.adjustElementsSize();
      }
    },

    /**
     * Populate cells at position with 2d array
     *
     * @private
     * @param {Object} start Start selection position
     * @param {Array} input 2d array
     * @param {Object} [end] End selection position (only for drag-down mode)
     * @param {String} [source="populateFromArray"]
     * @param {String} [method="overwrite"]
     * @param {String} direction (left|right|up|down)
     * @param {Array} deltas array
     * @returns {Object|undefined} ending td in pasted area (only if any cell was changed)
     */
    populateFromArray: function(start, input, end, source, method, direction, deltas) {
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
          input = translateRowsToColumns(input);
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
            },
            pushData = true;

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
                  orgValue = instance.getDataAtCell(current.row, current.col),
                  index = {
                    row: r,
                    col: c
                  },
                  valueSchema,
                  orgValueSchema;

                if (source === 'autofill') {
                  result = instance.runHooks('beforeAutofillInsidePopulate', index, direction, input, deltas, iterators, selected);

                  if (result) {
                    iterators = typeof(result.iterators) !== 'undefined' ? result.iterators : iterators;
                    value = typeof(result.value) !== 'undefined' ? result.value : value;
                  }
                }
                if (value !== null && typeof value === 'object') {
                  if (orgValue === null || typeof orgValue !== 'object') {
                    pushData = false;

                  } else {
                    orgValueSchema = duckSchema(orgValue[0] || orgValue);
                    valueSchema = duckSchema(value[0] || value);

                    /* jshint -W073 */
                    if (isObjectEquals(orgValueSchema, valueSchema)) {
                      value = deepClone(value);
                    } else {
                      pushData = false;
                    }
                  }

                } else if (orgValue !== null && typeof orgValue === 'object') {
                  pushData = false;
                }
                if (pushData) {
                  setData.push([current.row, current.col, value]);
                }
                pushData = true;
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

    /**
     * @param {Boolean} rows
     * @param {Boolean} cols
     */
    setSelectedHeaders: function(rows, cols) {
      instance.selection.selectedHeader.rows = rows;
      instance.selection.selectedHeader.cols = cols;
    },

    /**
     * Sets inProgress to `true`. This enables onSelectionEnd and onSelectionEndByProp to function as desired.
     */
    begin: function() {
      instance.selection.inProgress = true;
    },

    /**
     * Sets inProgress to `false`. Triggers onSelectionEnd and onSelectionEndByProp.
     */
    finish: function() {
      var sel = instance.getSelected();
      Handsontable.hooks.run(instance, "afterSelectionEnd", sel[0], sel[1], sel[2], sel[3]);
      Handsontable.hooks.run(instance, "afterSelectionEndByProp", sel[0], instance.colToProp(sel[1]), sel[2], instance.colToProp(sel[3]));
      instance.selection.inProgress = false;
    },

    /**
     * @returns {Boolean}
     */
    isInProgress: function() {
      return instance.selection.inProgress;
    },

    /**
     * Starts selection range on given td object.
     *
     * @param {WalkontableCellCoords} coords
     * @param keepEditorOpened
     */
    setRangeStart: function(coords, keepEditorOpened) {
      Handsontable.hooks.run(instance, "beforeSetRangeStart", coords);
      priv.selRange = new WalkontableCellRange(coords, coords, coords);
      selection.setRangeEnd(coords, null, keepEditorOpened);
    },

    /**
     * Ends selection range on given td object.
     *
     * @param {WalkontableCellCoords} coords
     * @param {Boolean} [scrollToCell=true] If `true`, viewport will be scrolled to range end
     * @param {Boolean} [keepEditorOpened] If `true`, cell editor will be still opened after changing selection range
     */
    setRangeEnd: function(coords, scrollToCell, keepEditorOpened) {
      if (priv.selRange === null) {
        return;
      }
      var disableVisualSelection,
        isHeaderSelected = false,
        areCoordsPositive = true;

      var firstVisibleRow = instance.view.wt.wtTable.getFirstVisibleRow();
      var firstVisibleColumn = instance.view.wt.wtTable.getFirstVisibleColumn();
      var newRangeCoords = {
        row: null,
        col: null
      };

      //trigger handlers
      Handsontable.hooks.run(instance, "beforeSetRangeEnd", coords);
      instance.selection.begin();

      newRangeCoords.row = coords.row < 0 ? firstVisibleRow : coords.row;
      newRangeCoords.col = coords.col < 0 ? firstVisibleColumn : coords.col;

      priv.selRange.to = new WalkontableCellCoords(newRangeCoords.row, newRangeCoords.col);

      if (!priv.settings.multiSelect) {
        priv.selRange.from = coords;
      }
      // set up current selection
      instance.view.wt.selections.current.clear();

      disableVisualSelection = instance.getCellMeta(priv.selRange.highlight.row, priv.selRange.highlight.col).disableVisualSelection;

      if (typeof disableVisualSelection === 'string') {
        disableVisualSelection = [disableVisualSelection];
      }

      if (disableVisualSelection === false ||
          Array.isArray(disableVisualSelection) && disableVisualSelection.indexOf('current') === -1) {
        instance.view.wt.selections.current.add(priv.selRange.highlight);
      }
      // set up area selection
      instance.view.wt.selections.area.clear();

      if ((disableVisualSelection === false ||
          Array.isArray(disableVisualSelection) && disableVisualSelection.indexOf('area') === -1) &&
          selection.isMultiple()) {
        instance.view.wt.selections.area.add(priv.selRange.from);
        instance.view.wt.selections.area.add(priv.selRange.to);
      }
      // set up highlight
      if (priv.settings.currentRowClassName || priv.settings.currentColClassName) {
        instance.view.wt.selections.highlight.clear();
        instance.view.wt.selections.highlight.add(priv.selRange.from);
        instance.view.wt.selections.highlight.add(priv.selRange.to);
      }

      // trigger handlers
      Handsontable.hooks.run(instance, "afterSelection",
        priv.selRange.from.row, priv.selRange.from.col, priv.selRange.to.row, priv.selRange.to.col);
      Handsontable.hooks.run(instance, "afterSelectionByProp",
        priv.selRange.from.row, datamap.colToProp(priv.selRange.from.col), priv.selRange.to.row, datamap.colToProp(priv.selRange.to.col));

      if ((priv.selRange.from.row === 0 && priv.selRange.to.row === instance.countRows() - 1 && instance.countRows() > 1) ||
          (priv.selRange.from.col === 0 && priv.selRange.to.col === instance.countCols() - 1 && instance.countCols() > 1)) {
        isHeaderSelected = true;
      }

      if (coords.row < 0 || coords.col < 0) {
        areCoordsPositive = false;
      }

      if (scrollToCell !== false && !isHeaderSelected && areCoordsPositive) {
        if (priv.selRange.from && !selection.isMultiple()) {
          instance.view.scrollViewport(priv.selRange.from);
        } else {
          instance.view.scrollViewport(coords);
        }
      }
      selection.refreshBorders(null, keepEditorOpened);
    },

    /**
     * Destroys editor, redraws borders around cells, prepares editor.
     *
     * @param {Boolean} [revertOriginal]
     * @param {Boolean} [keepEditor]
     */
    refreshBorders: function(revertOriginal, keepEditor) {
      if (!keepEditor) {
        editorManager.destroyEditor(revertOriginal);
      }
      instance.view.render();

      if (selection.isSelected() && !keepEditor) {
        editorManager.prepareEditor();
      }
    },

    /**
     * Returns information if we have a multiselection.
     *
     * @returns {Boolean}
     */
    isMultiple: function() {
      var isMultiple = !(priv.selRange.to.col === priv.selRange.from.col && priv.selRange.to.row === priv.selRange.from.row)
        , modifier = Handsontable.hooks.run(instance, 'afterIsMultipleSelection', isMultiple);

      if (isMultiple) {
        return modifier;
      }
    },

    /**
     * Selects cell relative to current cell (if possible).
     */
    transformStart: function(rowDelta, colDelta, force, keepEditorOpened) {
      var delta = new WalkontableCellCoords(rowDelta, colDelta),
        rowTransformDir = 0,
        colTransformDir = 0,
        totalRows,
        totalCols,
        coords;

      instance.runHooks('modifyTransformStart', delta);
      totalRows = instance.countRows();
      totalCols = instance.countCols();

      /* jshint ignore:start */
      if (priv.selRange.highlight.row + rowDelta > totalRows - 1) {
        if (force && priv.settings.minSpareRows > 0) {
          instance.alter("insert_row", totalRows);
          totalRows = instance.countRows();

        } else if (priv.settings.autoWrapCol) {
          delta.row = 1 - totalRows;
          delta.col = priv.selRange.highlight.col + delta.col == totalCols - 1 ? 1 - totalCols : 1;
        }
      } else if (priv.settings.autoWrapCol && priv.selRange.highlight.row + delta.row < 0 && priv.selRange.highlight.col + delta.col >= 0) {
        delta.row = totalRows - 1;
        delta.col = priv.selRange.highlight.col + delta.col == 0 ? totalCols - 1 : -1;
      }

      if (priv.selRange.highlight.col + delta.col > totalCols - 1) {
        if (force && priv.settings.minSpareCols > 0) {
          instance.alter("insert_col", totalCols);
          totalCols = instance.countCols();

        } else if (priv.settings.autoWrapRow) {
          delta.row = priv.selRange.highlight.row + delta.row == totalRows - 1 ? 1 - totalRows : 1;
          delta.col = 1 - totalCols;
        }
      } else if (priv.settings.autoWrapRow && priv.selRange.highlight.col + delta.col < 0 && priv.selRange.highlight.row + delta.row >= 0) {
        delta.row = priv.selRange.highlight.row + delta.row == 0 ? totalRows - 1 : -1;
        delta.col = totalCols - 1;
      }
      /* jshint ignore:end */

      coords = new WalkontableCellCoords(priv.selRange.highlight.row + delta.row, priv.selRange.highlight.col + delta.col);

      if (coords.row < 0) {
        rowTransformDir = -1;
        coords.row = 0;

      } else if (coords.row > 0 && coords.row >= totalRows) {
        rowTransformDir = 1;
        coords.row = totalRows - 1;
      }

      if (coords.col < 0) {
        colTransformDir = -1;
        coords.col = 0;

      } else if (coords.col > 0 && coords.col >= totalCols) {
        colTransformDir = 1;
        coords.col = totalCols - 1;
      }
      instance.runHooks('afterModifyTransformStart', coords, rowTransformDir, colTransformDir);
      selection.setRangeStart(coords, keepEditorOpened);
    },

    /**
     * Sets selection end cell relative to current selection end cell (if possible).
     */
    transformEnd: function(rowDelta, colDelta) {
      var delta = new WalkontableCellCoords(rowDelta, colDelta),
        rowTransformDir = 0,
        colTransformDir = 0,
        totalRows,
        totalCols,
        coords;

      instance.runHooks('modifyTransformEnd', delta);

      totalRows = instance.countRows();
      totalCols = instance.countCols();
      coords = new WalkontableCellCoords(priv.selRange.to.row + delta.row, priv.selRange.to.col + delta.col);

      if (coords.row < 0) {
        rowTransformDir = -1;
        coords.row = 0;

      } else if (coords.row > 0 && coords.row >= totalRows) {
        rowTransformDir = 1;
        coords.row = totalRows - 1;
      }

      if (coords.col < 0) {
        colTransformDir = -1;
        coords.col = 0;

      } else if (coords.col > 0 && coords.col >= totalCols) {
        colTransformDir = 1;
        coords.col = totalCols - 1;
      }
      instance.runHooks('afterModifyTransformEnd', coords, rowTransformDir, colTransformDir);
      selection.setRangeEnd(coords, true);
    },

    /**
     * Returns `true` if currently there is a selection on screen, `false` otherwise.
     *
     * @returns {Boolean}
     */
    isSelected: function() {
      return (priv.selRange !== null);
    },

    /**
     * Returns `true` if coords is within current selection coords.
     *
     * @param {WalkontableCellCoords} coords
     * @returns {Boolean}
     */
    inInSelection: function(coords) {
      if (!selection.isSelected()) {
        return false;
      }
      return priv.selRange.includes(coords);
    },

    /**
     * Deselects all selected cells
     */
    deselect: function() {
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
    selectAll: function() {
      if (!priv.settings.multiSelect) {
        return;
      }
      selection.setRangeStart(new WalkontableCellCoords(0, 0));
      selection.setRangeEnd(new WalkontableCellCoords(instance.countRows() - 1, instance.countCols() - 1), false);
    },

    /**
     * Deletes data from selected cells
     */
    empty: function() {
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

  this.init = function() {
    Handsontable.hooks.run(instance, 'beforeInit');

    if (Handsontable.mobileBrowser) {
      addClass(instance.rootElement, 'mobile');
    }

    this.updateSettings(priv.settings, true);

    this.view = new TableView(this);
    editorManager = new EditorManager(instance, priv, selection, datamap);

    this.forceFullRender = true; //used when data was changed

    Handsontable.hooks.run(instance, 'init');
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
      valid: true,
      addValidatorToQueue: function() {
        this.validatorsInQueue++;
        resolved = false;
      },
      removeValidatorFormQueue: function() {
        this.validatorsInQueue = this.validatorsInQueue - 1 < 0 ? 0 : this.validatorsInQueue - 1;
        this.checkIfQueueIsEmpty();
      },
      onQueueEmpty: function(valid) {
      },
      checkIfQueueIsEmpty: function() {
        /* jshint ignore:start */
        if (this.validatorsInQueue == 0 && resolved == false) {
          resolved = true;
          this.onQueueEmpty(this.valid);
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
        //column order may have changes, so we need to translate physical col index (stored in datasource) to logical (displayed to user)
        var logicalCol = instance.runHooks('modifyCol', col);
        var cellProperties = instance.getCellMeta(row, logicalCol);

        if (cellProperties.type === 'numeric' && typeof changes[i][3] === 'string') {
          if (changes[i][3].length > 0 && (/^-?[\d\s]*(\.|\,)?\d*$/.test(changes[i][3]) || cellProperties.format )) {
            var len = changes[i][3].length;
            if (typeof cellProperties.language == 'undefined') {
              numeral.language('en');
            }
            //this input in format XXXX.XX is likely to come from paste. Let's parse it using international rules
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
          instance.validateCell(changes[i][3], cellProperties, (function(i, cellProperties) {
              return function(result) {
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
   *
   * @private
   * @param {Array} changes Array in form of [row, prop, oldValue, newValue]
   * @param {String} source String that identifies how this change will be described in changes array (useful in onChange callback)
   * @fires Hooks#beforeChangeRender
   * @fires Hooks#afterChange
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

      if (changes[i][2] == null && changes[i][3] == null) {
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
    instance.view.wt.wtOverlays.adjustElementsSize();
    Handsontable.hooks.run(instance, 'afterChange', changes, source || 'edit');
  }

  this.validateCell = function(value, cellProperties, callback, source) {
    var validator = instance.getCellValidator(cellProperties);

    function done(valid) {
      var col = cellProperties.col,
        row = cellProperties.row,
        td = instance.getCell(row, col, true);

      if (td) {
        instance.view.wt.wtSettings.settings.cellRenderer(row, col, td);
      }
      callback(valid);
    }

    if (Object.prototype.toString.call(validator) === '[object RegExp]') {
      validator = (function(validator) {
        return function(value, callback) {
          callback(validator.test(value));
        };
      })(validator);
    }

    if (typeof validator == 'function') {

      value = Handsontable.hooks.run(instance, "beforeValidate", value, cellProperties.row, cellProperties.prop, source);

      // To provide consistent behaviour, validation should be always asynchronous
      instance._registerTimeout(setTimeout(function() {
        validator.call(cellProperties, value, function(valid) {
          valid = Handsontable.hooks.run(instance, "afterValidate", valid, value, cellProperties.row, cellProperties.prop, source);
          cellProperties.valid = valid;

          done(valid);
          Handsontable.hooks.run(instance, "postAfterValidate", valid, value, cellProperties.row, cellProperties.prop, source);
        });
      }, 0));

    } else {
      //resolve callback even if validator function was not found
      cellProperties.valid = true;
      done(cellProperties.valid);
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
   * @description
   * Set new value to a cell. To change many cells at once, pass an array of `changes` in format `[[row, col, value], ...]` as
   * the only parameter. `col` is the index of __visible__ column (note that if columns were reordered,
   * the current order will be used). `source` is a flag for before/afterChange events. If you pass only array of
   * changes then `source` could be set as second parameter.
   *
   * @memberof Core#
   * @function setDataAtCell
   * @param {Number|Array} row or array of changes in format `[[row, col, value], ...]`
   * @param {Number|String} col or source String
   * @param {String} value
   * @param {String} [source] String that identifies how this change will be described in changes array (useful in onChange callback)
   */
  this.setDataAtCell = function(row, col, value, source) {
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

    validateChanges(changes, source, function() {
      applyChanges(changes, source);
    });
  };


  /**
   * Same as above, except instead of `col`, you provide name of the object property (e.g. `[0, 'first.name', 'Jennifer']`).
   *
   * @memberof Core#
   * @function setDataAtRowProp
   * @param {Number|Array} row or array of changes in format `[[row, prop, value], ...]`
   * @param {String} prop or source String
   * @param {String} value
   * @param {String} [source] String that identifies how this change will be described in changes array (useful in onChange callback)
   */
  this.setDataAtRowProp = function(row, prop, value, source) {
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

    validateChanges(changes, source, function() {
      applyChanges(changes, source);
    });
  };

  /**
   * Listen to keyboard input on document body.
   *
   * @memberof Core#
   * @function listen
   * @since 0.11
   */
  this.listen = function() {
    Handsontable.activeGuid = instance.guid;

    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    else if (!document.activeElement) { //IE
      document.body.focus();
    }
  };

  /**
   * Stop listening to keyboard input on document body.
   *
   * @memberof Core#
   * @function unlisten
   * @since 0.11
   */
  this.unlisten = function() {
    Handsontable.activeGuid = null;
  };

  /**
   * Returns `true` if current Handsontable instance is listening to keyboard input on document body.
   *
   * @memberof Core#
   * @function isListening
   * @since 0.11
   * @returns {Boolean}
   */
  this.isListening = function() {
    return Handsontable.activeGuid === instance.guid;
  };

  /**
   * Destroys current editor, renders and selects current cell.
   *
   * @memberof Core#
   * @function destroyEditor
   * @param {Boolean} [revertOriginal] If != `true`, edited data is saved. Otherwise previous value is restored
   */
  this.destroyEditor = function(revertOriginal) {
    selection.refreshBorders(revertOriginal);
  };

  /**
   * Populate cells at position with 2D input array (e.g. `[[1, 2], [3, 4]]`).
   * Use `endRow`, `endCol` when you want to cut input when certain row is reached.
   * Optional `source` parameter (default value "populateFromArray") is used to identify this call in the resulting events (beforeChange, afterChange).
   * Optional `populateMethod` parameter (default value "overwrite", possible values "shift_down" and "shift_right")
   * has the same effect as pasteMethod option (see Options page)
   *
   * @memberof Core#
   * @function populateFromArray
   * @since 0.9.0
   * @param {Number} row Start row
   * @param {Number} col Start column
   * @param {Array} input 2d array
   * @param {Number} [endRow] End row (use when you want to cut input when certain row is reached)
   * @param {Number} [endCol] End column (use when you want to cut input when certain column is reached)
   * @param {String} [source="populateFromArray"]
   * @param {String} [method="overwrite"]
   * @param {String} direction edit (left|right|up|down)
   * @param {Array} deltas array
   * @returns {Object|undefined} ending td in pasted area (only if any cell was changed)
   */
  this.populateFromArray = function(row, col, input, endRow, endCol, source, method, direction, deltas) {
    var c;

    if (!(typeof input === 'object' && typeof input[0] === 'object')) {
      throw new Error("populateFromArray parameter `input` must be an array of arrays"); //API changed in 0.9-beta2, let's check if you use it correctly
    }
    c = typeof endRow === 'number' ? new WalkontableCellCoords(endRow, endCol) : null;

    return grid.populateFromArray(new WalkontableCellCoords(row, col), input, c, source, method, direction, deltas);
  };

  /**
   * Adds/removes data from the column. This function works is modelled after Array.splice.
   * Parameter `col` is the index of column in which do you want to do splice.
   * Parameter `index` is the row index at which to start changing the array.
   * If negative, will begin that many elements from the end. Parameter `amount`, is the number of old array elements to remove.
   * If the amount is 0, no elements are removed. Fourth and further parameters are the `elements` to add to the array.
   * If you don't specify any elements, spliceCol simply removes elements from the array.
   * {@link DataMap#spliceCol}
   *
   * @memberof Core#
   * @function spliceCol
   * @since 0.9-beta2
   * @param {Number} col Index of column in which do you want to do splice.
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
   * @param {*} [elements] The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array
   */
  this.spliceCol = function(col, index, amount/*, elements... */) {
    return datamap.spliceCol.apply(datamap, arguments);
  };

  /**
   * Adds/removes data from the row. This function works is modelled after Array.splice.
   * Parameter `row` is the index of row in which do you want to do splice.
   * Parameter `index` is the column index at which to start changing the array.
   * If negative, will begin that many elements from the end. Parameter `amount`, is the number of old array elements to remove.
   * If the amount is 0, no elements are removed. Fourth and further parameters are the `elements` to add to the array.
   * If you don't specify any elements, spliceCol simply removes elements from the array.
   * {@link DataMap#spliceRow}
   *
   * @memberof Core#
   * @function spliceRow
   * @since 0.11
   * @param {Number} row Index of column in which do you want to do splice.
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
   * @param {*} [elements] The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array
   */
  this.spliceRow = function(row, index, amount/*, elements... */) {
    return datamap.spliceRow.apply(datamap, arguments);
  };

  /**
   * Return index of the currently selected cells as an array `[startRow, startCol, endRow, endCol]`.
   *
   * Start row and start col are the coordinates of the active cell (where the selection was started).
   *
   * @memberof Core#
   * @function getSelected
   * @returns {Array}
   */
  this.getSelected = function() { //https://github.com/handsontable/handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return [priv.selRange.from.row, priv.selRange.from.col, priv.selRange.to.row, priv.selRange.to.col];
    }
  };

  /**
   * Returns current selection as a WalkontableCellRange object.
   *
   * @memberof Core#
   * @function getSelectedRange
   * @since 0.11
   * @returns {WalkontableCellRange} Returns `undefined` if there is no selection.
   */
  this.getSelectedRange = function() { //https://github.com/handsontable/handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return priv.selRange;
    }
  };


  /**
   * Rerender the table.
   *
   * @memberof Core#
   * @function render
   */
  this.render = function() {
    if (instance.view) {
      instance.renderCall = true;
      instance.forceFullRender = true; //used when data was changed
      selection.refreshBorders(null, true);
    }
  };

  /**
   * Reset all cells in the grid to contain data from the data array.
   *
   * @memberof Core#
   * @function loadData
   * @param {Array} data
   * @fires Hooks#afterLoadData
   * @fires Hooks#afterChange
   */
  this.loadData = function(data) {
    if (typeof data === 'object' && data !== null) {
      if (!(data.push && data.splice)) { //check if data is array. Must use duck-type check so Backbone Collections also pass it
        //when data is not an array, attempt to make a single-row array of it
        data = [data];
      }
    }
    else if (data === null) {
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

    datamap = new DataMap(instance, priv, GridSettings);

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
   * Return the current data object (the same that was passed by `data` configuration option or `loadData` method).
   * Optionally you can provide cell range `row`, `col`, `row2`, `col2` to get only a fragment of grid data.
   *
   * @memberof Core#
   * @function getData
   * @param {Number} [r] From row
   * @param {Number} [c] From col
   * @param {Number} [r2] To row
   * @param {Number} [c2] To col
   * @returns {Array|Object}
   */
  this.getData = function(r, c, r2, c2) {
    if (typeof r === 'undefined') {
      return datamap.getAll();
    } else {
      return datamap.getRange(new WalkontableCellCoords(r, c), new WalkontableCellCoords(r2, c2), datamap.DESTINATION_RENDERER);
    }
  };

  /**
   * Get value of selected range. Each column is separated by tab, each row is separated by new line character.
   * {@link DataMap#getCopyableText}
   *
   * @memberof Core#
   * @function getCopyableData
   * @since 0.11
   * @param {Number} startRow From row
   * @param {Number} startCol From col
   * @param {Number} endRow To row
   * @param {Number} endCol To col
   * @returns {Array|Object}
   */
  this.getCopyableData = function(startRow, startCol, endRow, endCol) {
    return datamap.getCopyableText(new WalkontableCellCoords(startRow, startCol), new WalkontableCellCoords(endRow, endCol));
  };

  /**
   * Get schema provided by constructor settings or if it doesn't exist return schema based on data
   * structure on the first row.
   *
   * @memberof Core#
   * @function getSchema
   * @since 0.13.2
   * @returns {Object}
   */
  this.getSchema = function() {
    return datamap.getSchema();
  };

  /**
   * Use it if you need to change configuration after initialization.
   *
   * @memberof Core#
   * @function updateSettings
   * @param {Object} settings Settings to update
   * @param {Boolean} init
   * @fires Hooks#afterCellMetaReset
   * @fires Hooks#afterUpdateSettings
   */
  this.updateSettings = function(settings, init) {
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
        if (Handsontable.hooks.getRegistered().indexOf(i) > -1) {
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
        priv.columnSettings[i] = columnFactory(GridSettings, priv.columnsSettingConflicts);

        // shortcut for prototype
        proto = priv.columnSettings[i].prototype;

        // Use settings provided by user
        if (GridSettings.prototype.columns) {
          column = GridSettings.prototype.columns[i];
          extend(proto, column);
          extend(proto, expandType(column));
        }
      }
    }

    if (typeof settings.cell !== 'undefined') {
      for (i in settings.cell) {
        if (settings.cell.hasOwnProperty(i)) {
          var cell = settings.cell[i];
          instance.setCellMetaObject(cell.row, cell.col, cell);
        }
      }
    }

    Handsontable.hooks.run(instance, 'afterCellMetaReset');

    if (typeof settings.className !== "undefined") {
      if (GridSettings.prototype.className) {
        removeClass(instance.rootElement, GridSettings.prototype.className);
//        instance.rootElement.removeClass(GridSettings.prototype.className);
      }
      if (settings.className) {
        addClass(instance.rootElement, settings.className);
//        instance.rootElement.addClass(settings.className);
      }
    }

    if (typeof settings.height != 'undefined') {
      var height = settings.height;

      if (typeof height == 'function') {
        height = height();
      }

      instance.rootElement.style.height = height + 'px';
    }

    if (typeof settings.width != 'undefined') {
      var width = settings.width;

      if (typeof width == 'function') {
        width = width();
      }

      instance.rootElement.style.width = width + 'px';
    }

    /* jshint ignore:start */
    if (height) {
      instance.rootElement.style.overflow = 'hidden';
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

  /**
   * Get value from selected cell.
   *
   * @memberof Core#
   * @function getValue
   * @since 0.11
   * @returns {*} Returns value of selected cell
   */
  this.getValue = function() {
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
      //ignore obj.prototype.type
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
   * Get object settings.
   *
   * @memberof Core#
   * @function getSettings
   * @returns {Object} Returns an object containing the current grid settings
   */
  this.getSettings = function() {
    return priv.settings;
  };

  /**
   * Clears grid.
   *
   * @memberof Core#
   * @function clear
   * @since 0.11
   */
  this.clear = function() {
    selection.selectAll();
    selection.empty();
  };

  /**
   * @memberof Core#
   * @function alter
   * @param {String} action See grid.alter for possible values: `"insert_row"`, `"insert_col"`, `"remove_row"`, `"remove_col"`
   * @param {Number} index
   * @param {Number} amount
   * @param {String} [source] Source of hook runner
   * @param {Boolean} [keepEmptyRows] Flag for preventing deletion of empty rows
   * @description
   *
   * Insert new row(s) above the row at given `index`. If index is `null` or `undefined`, the new row will be
   * added after the current last row. Default `amount` equals 1.
   * ```js
   * var hot = new Handsontable(document.getElementById('example'));
   * hot.alter('insert_row', 10);
   * ```
   *
   * Insert new column(s) before the column at given `index`. If index is `null` or `undefined`, the new column
   * will be added after the current last column. Default `amount` equals 1
   * ```js
   * var hot = new Handsontable(document.getElementById('example'));
   * hot.alter('insert_col', 10);
   * ```
   *
   * Remove the row(s) at given `index`. Default `amount` equals 1
   * ```js
   * var hot = new Handsontable(document.getElementById('example'));
   * hot.alter('remove_row', 10);
   * ```
   *
   * Remove the column(s) at given `index`. Default `amount` equals 1
   * ```js
   * var hot = new Handsontable(document.getElementById('example'));
   * hot.alter('remove_col', 10);
   * ```
   */
  this.alter = function(action, index, amount, source, keepEmptyRows) {
    grid.alter(action, index, amount, source, keepEmptyRows);
  };

  /**
   * Returns TD element for given `row`, `col` if it is rendered on screen.
   * Returns `null` if the TD is not rendered on screen (probably because that part of table is not visible).
   *
   * @memberof Core#
   * @function getCell
   * @param {Number} row
   * @param {Number} col
   * @param {Boolean} topmost
   * @returns {Element}
   */
  this.getCell = function(row, col, topmost) {
    return instance.view.getCellAtCoords(new WalkontableCellCoords(row, col), topmost);
  };

  /**
   * Returns coordinates for the provided element.
   *
   * @memberof Core#
   * @function getCoords
   * @param {Element} elem
   * @returns {WalkontableCellCoords}
   */
  this.getCoords = function(elem) {
    return this.view.wt.wtTable.getCoords.call(this.view.wt.wtTable, elem);
  };

  /**
   * Returns property name that corresponds with the given column index. {@link DataMap#colToProp}
   *
   * @memberof Core#
   * @function colToProp
   * @param {Number} col Column index
   * @returns {String}
   */
  this.colToProp = function(col) {
    return datamap.colToProp(col);
  };

  /**
   * Returns column index that corresponds with the given property. {@link DataMap#propToCol}
   *
   * @memberof Core#
   * @function propToCol
   * @param {String} prop
   * @returns {Number}
   */
  this.propToCol = function(prop) {
    return datamap.propToCol(prop);
  };

  /**
   * @description
   * Return cell value at `row`, `col`. `row` and `col` are the __visible__ indexes (note that if columns were reordered or sorted,
   * the current order will be used).
   *
   * @memberof Core#
   * @function getDataAtCell
   * @param {Number} row
   * @param {Number} col
   * @returns {*}
   */
  this.getDataAtCell = function(row, col) {
    return datamap.get(row, datamap.colToProp(col));
  };

  /**
   * Return value at `row`, `prop`. {@link DataMap#get}
   *
   * @memberof Core#
   * @function getDataAtRowProp
   * @param {Number} row
   * @param {String} prop
   * @returns {*}
   */
  this.getDataAtRowProp = function(row, prop) {
    return datamap.get(row, prop);
  };

  /**
   * @description
   * Returns array of column values from the data source. `col` is the __visible__ index of the column.
   *
   * @memberof Core#
   * @function getDataAtCol
   * @since 0.9-beta2
   * @param {Number} col
   * @returns {Array}
   */
  this.getDataAtCol = function(col) {
    var out = [];
    return out.concat.apply(out, datamap.getRange(
      new WalkontableCellCoords(0, col), new WalkontableCellCoords(priv.settings.data.length - 1, col), datamap.DESTINATION_RENDERER));
  };

  /**
   * Given the object property name (e.g. `'first.name'`), returns array of column values from the data source.
   *
   * @memberof Core#
   * @function getDataAtProp
   * @since 0.9-beta2
   * @param {String} prop
   * @returns {*}
   */
  this.getDataAtProp = function(prop) {
    var out = [],
      range;

    range = datamap.getRange(
      new WalkontableCellCoords(0, datamap.propToCol(prop)),
      new WalkontableCellCoords(priv.settings.data.length - 1, datamap.propToCol(prop)),
      datamap.DESTINATION_RENDERER);

    return out.concat.apply(out, range);
  };

  /**
   * Returns array of column values from the data source. `col` is the index of the row in the data source.
   *
   * @memberof Core#
   * @function getSourceDataAtCol
   * @since 0.11.0-beta3
   * @param {Number} col
   * @returns {Array}
   */
  this.getSourceDataAtCol = function(col) {
    var out = [],
      data = priv.settings.data;

    for (var i = 0; i < data.length; i++) {
      out.push(data[i][col]);
    }

    return out;
  };

  /**
   * Returns a single row of the data (array or object, depending on what you have). `row` is the index of the row in the data source.
   *
   * @memberof Core#
   * @function getSourceDataAtRow
   * @since 0.11.0-beta3
   * @param {Number} row
   * @returns {Array|Object}
   */
  this.getSourceDataAtRow = function(row) {
    return priv.settings.data[row];
  };

  /**
   * @description
   * Returns a single row of the data (array or object, depending on what you have). `row` is the __visible__ index of the row.
   *
   * @memberof Core#
   * @function getDataAtRow
   * @param {Number} row
   * @returns {*}
   * @since 0.9-beta2
   */
  this.getDataAtRow = function(row) {
    var data = datamap.getRange(new WalkontableCellCoords(row, 0), new WalkontableCellCoords(row, this.countCols() - 1), datamap.DESTINATION_RENDERER);

    return data[0];
  };

  /**
   * Remove `key` property object from cell meta data corresponding to params `row`, `col`.
   *
   * @memberof Core#
   * @function removeCellMeta
   * @param {Number} row
   * @param {Number} col
   * @param {String} key
   */
  this.removeCellMeta = function(row, col, key) {
    var cellMeta = instance.getCellMeta(row, col);
    /* jshint ignore:start */
    if (cellMeta[key] != undefined) {
      delete priv.cellSettings[row][col][key];
    }
    /* jshint ignore:end */
  };

  /**
   * Set cell meta data object `prop` to corresponding params `row`, `col`
   *
   * @memberof Core#
   * @function setCellMetaObject
   * @since 0.11
   * @param {Number} row
   * @param {Number} col
   * @param {Object} prop
   */
  this.setCellMetaObject = function(row, col, prop) {
    if (typeof prop === 'object') {
      for (var key in prop) {
        if (prop.hasOwnProperty(key)) {
          var value = prop[key];
          this.setCellMeta(row, col, key, value);
        }
      }
    }
  };

  /**
   * Sets cell meta data object `key` corresponding to params `row`, `col`.
   *
   * @memberof Core#
   * @function setCellMeta
   * @since 0.11
   * @param {Number} row
   * @param {Number} col
   * @param {String} key
   * @param {String} val
   * @fires Hooks#afterSetCellMeta
   */
  this.setCellMeta = function(row, col, key, val) {
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
   * Return cell properties for given `row`, `col` coordinates.
   *
   * @memberof Core#
   * @function getCellMeta
   * @param {Number} row
   * @param {Number} col
   * @returns {Object}
   * @fires Hooks#beforeGetCellMeta
   * @fires Hooks#afterGetCellMeta
   */
  this.getCellMeta = function(row, col) {
    var prop = datamap.colToProp(col)
      , cellProperties;

    row = translateRowIndex(row);
    col = translateColIndex(col);

    if (!priv.columnSettings[col]) {
      priv.columnSettings[col] = columnFactory(GridSettings, priv.columnsSettingConflicts);
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
    extend(cellProperties, expandType(cellProperties)); //for `type` added in beforeGetCellMeta

    if (cellProperties.cells) {
      var settings = cellProperties.cells.call(cellProperties, row, col, prop);

      if (settings) {
        extend(cellProperties, settings);
        extend(cellProperties, expandType(settings)); //for `type` added in cells
      }
    }

    Handsontable.hooks.run(instance, 'afterGetCellMeta', row, col, cellProperties);

    return cellProperties;
  };

  /**
   * Checks if the data format and config allows user to modify the column structure.
   * @returns {boolean}
   */
  this.isColumnModificationAllowed = function() {
    return !(instance.dataType === 'object' || instance.getSettings().columns);
  };

  /**
   * If displayed rows order is different than the order of rows stored in memory (i.e. sorting is applied)
   * we need to translate logical (stored) row index to physical (displayed) index.
   *
   * @memberof Core#
   * @function translateRowIndex
   * @param {Number} row Original row index
   * @returns {Number} Translated row index
   * @fires Hooks#modifyRow
   */
  function translateRowIndex(row) {
    return Handsontable.hooks.run(instance, 'modifyRow', row);
  }

  /**
   * If displayed columns order is different than the order of columns stored in memory (i.e. column were moved using manualColumnMove plugin)
   * we need to translate logical (stored) column index to physical (displayed) index.
   *
   * @memberof Core#
   * @function translateColIndex
   * @param {Number} col Original column index
   * @returns {Number} Translated column index
   * @fires Hooks#modifyCol
   */
  function translateColIndex(col) {
    // warning: this must be done after datamap.colToProp
    return Handsontable.hooks.run(instance, 'modifyCol', col);
  }

  var rendererLookup = cellMethodLookupFactory('renderer');

  /**
   * Get cell renderer type by `row` and `col`.
   *
   * @memberof Core#
   * @function getCellRenderer
   * @since 0.11
   * @param {Number} row
   * @param {Number} col
   * @returns {Function} Returns rederer type
   */
  this.getCellRenderer = function(row, col) {
    var renderer = rendererLookup.call(this, row, col);

    return getRenderer(renderer);
  };

  /**
   * Get cell editor by `row` and `col`.
   *
   * @memberof Core#
   * @function getCellEditor
   * @returns {*}
   */
  this.getCellEditor = cellMethodLookupFactory('editor');

  /**
   * Get cell validator by `row` and `col`
   *
   * @memberof Core#
   * @function getCellValidator
   * @returns {*}
   */
  this.getCellValidator = cellMethodLookupFactory('validator');


  /**
   * Validates all cells using their validator functions and calls callback when finished. Does not render the view.
   *
   * If one of cells is invalid callback will be fired with `'valid'` arguments as `false` otherwise `true`.
   *
   * @memberof Core#
   * @function validateCells
   * @param {Function} callback
   */
  this.validateCells = function(callback) {
    var waitingForValidator = new ValidatorsQueue();
    waitingForValidator.onQueueEmpty = callback;

    /* jshint ignore:start */
    var i = instance.countRows() - 1;
    while (i >= 0) {
      var j = instance.countCols() - 1;
      while (j >= 0) {
        waitingForValidator.addValidatorToQueue();
        instance.validateCell(instance.getDataAtCell(i, j), instance.getCellMeta(i, j), function(result) {
          if (typeof result !== 'boolean') {
            throw new Error("Validation error: result is not boolean");
          }
          if (result === false) {
            waitingForValidator.valid = false;
          }
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
   * Returns array of row headers (if they are enabled). If param `row` given, return header at given row as string.
   *
   * @memberof Core#
   * @function getRowHeader
   * @param {Number} [row]
   * @returns {Array|String}
   */
  this.getRowHeader = function(row) {
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
   * Returns information of this table is configured to display row headers.
   *
   * @memberof Core#
   * @function hasRowHeaders
   * @returns {Boolean}
   * @since 0.11
   */
  this.hasRowHeaders = function() {
    return !!priv.settings.rowHeaders;
  };

  /**
   * Returns information of this table is configured to display column headers.
   *
   * @memberof Core#
   * @function hasColHeaders
   * @since 0.11
   * @returns {Boolean}
   */
  this.hasColHeaders = function() {
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
   *
   * @memberof Core#
   * @function getColHeader
   * @param {Number} [col] Column index
   * @returns {Array|String}
   */
  this.getColHeader = function(col) {
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
        return spreadsheetColumnLabel(baseCol); //see #1458
      }
      else {
        return priv.settings.colHeaders;
      }
    }
  };

  /**
   * Return column width from settings (no guessing). Private use intended.
   *
   * @private
   * @memberof Core#
   * @function _getColWidthFromSettings
   * @param {Number} col
   * @returns {Number}
   */
  this._getColWidthFromSettings = function(col) {
    var cellProperties = instance.getCellMeta(0, col);
    var width = cellProperties.width;

    if (width === void 0 || width === priv.settings.width) {
      width = cellProperties.colWidths;
    }
    if (width !== void 0 && width !== null) {
      switch (typeof width) {
        case 'object': // array
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
   *
   * @memberof Core#
   * @function getColWidth
   * @since 0.11
   * @param {Number} col
   * @returns {Number}
   * @fires Hooks#modifyColWidth
   */
  this.getColWidth = function(col) {
    let width = instance._getColWidthFromSettings(col);

    width = Handsontable.hooks.run(instance, 'modifyColWidth', width, col);

    if (width === void 0) {
      width = WalkontableViewportColumnsCalculator.DEFAULT_WIDTH;
    }

    return width;
  };

  /**
   * Return row height from settings (no guessing). Private use intended.
   *
   * @private
   * @memberof Core#
   * @function _getRowHeightFromSettings
   * @param {Number} row
   * @returns {Number}
   */
  this._getRowHeightFromSettings = function(row) {
    //let cellProperties = instance.getCellMeta(row, 0);
    //let height = cellProperties.height;
    //
    //if (height === void 0 || height === priv.settings.height) {
    //  height = cellProperties.rowHeights;
    //}
    var height = priv.settings.rowHeights;

    if (height !== void 0 && height !== null) {
      switch (typeof height) {
        case 'object': // array
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
   * Return row height.
   *
   * @memberof Core#
   * @function getRowHeight
   * @since 0.11
   * @param {Number} row
   * @returns {Number}
   * @fires Hooks#modifyRowHeight
   */
  this.getRowHeight = function(row) {
    var height = instance._getRowHeightFromSettings(row);

    height = Handsontable.hooks.run(instance, 'modifyRowHeight', height, row);

    return height;
  };

  /**
   * Returns total number of rows in the grid.
   *
   * @memberof Core#
   * @function countRows
   * @returns {Number} Total number in rows the grid
   */
  this.countRows = function() {
    return priv.settings.data.length;
  };

  /**
   * Returns total number of columns in the grid.
   *
   * @memberof Core#
   * @function countCols
   * @returns {Number} Total number of columns
   */
  this.countCols = function() {
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
   * Get index of first visible row.
   *
   * @memberof Core#
   * @function rowOffset
   * @returns {Number} Returns index of first visible row
   */
  this.rowOffset = function() {
    return instance.view.wt.wtTable.getFirstRenderedRow();
  };

  /**
   * Get index of first visible column.
   *
   * @memberof Core#
   * @function colOffset
   * @returns {Number} Return index of first visible column.
   */
  this.colOffset = function() {
    return instance.view.wt.wtTable.getFirstRenderedColumn();
  };

  /**
   * Return number of rendered rows (including rows partially or fully rendered outside viewport).
   *
   * @memberof Core#
   * @function countRenderedRows
   * @returns {Number} Returns -1 if table is not visible
   */
  this.countRenderedRows = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getRenderedRowsCount() : -1;
  };

  /**
   * Return number of visible rows (rendered rows that fully fit inside viewport).
   *
   * @memberof Core#
   * @function countVisibleRows
   * @returns {Number} Returns -1 if table is not visible
   */
  this.countVisibleRows = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getVisibleRowsCount() : -1;
  };

  /**
   * Return number of visible columns.
   *
   * @memberof Core#
   * @function countRenderedCols
   * @returns {Number} Returns -1 if table is not visible
   */
  this.countRenderedCols = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getRenderedColumnsCount() : -1;
  };

  /**
   * Return number of visible columns. Returns -1 if table is not visible
   *
   * @memberof Core#
   * @function countVisibleCols
   * @return {Number}
   */
  this.countVisibleCols = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getVisibleColumnsCount() : -1;
  };

  /**
   * Returns number of empty rows. If the optional ending parameter is `true`, returns
   * number of empty rows at the bottom of the table.
   *
   * @memberof Core#
   * @function countEmptyRows
   * @param {Boolean} [ending] If `true`, will only count empty rows at the end of the data source
   * @returns {Number} Count empty rows
   * @fires Hooks#modifyRow
   */
  this.countEmptyRows = function(ending) {
    var i = instance.countRows() - 1,
      empty = 0,
      row;

    while (i >= 0) {
      row = Handsontable.hooks.run(this, 'modifyRow', i);

      if (instance.isEmptyRow(row)) {
        empty++;

      } else if (ending) {
        break;
      }
      i--;
    }

    return empty;
  };

  /**
   * Returns number of empty columns. If the optional ending parameter is `true`, returns number of empty
   * columns at right hand edge of the table.
   *
   * @memberof Core#
   * @function countEmptyCols
   * @param {Boolean} [ending] If `true`, will only count empty columns at the end of the data source row
   * @returns {Number} Count empty cols
   */
  this.countEmptyCols = function(ending) {
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
   * Check is `row` is empty.
   *
   * @memberof Core#
   * @function isEmptyRow
   * @param {Number} row Row index
   * @returns {Boolean} Return `true` if the row at the given `row` is empty, `false` otherwise.
   */
  this.isEmptyRow = function(row) {
    return priv.settings.isEmptyRow.call(instance, row);
  };

  /**
   * Check is `col` is empty.
   *
   * @memberof Core#
   * @function isEmptyCol
   * @param {Number} col Column index
   * @returns {Boolean} Return `true` if the column at the given `col` is empty, `false` otherwise.
   */
  this.isEmptyCol = function(col) {
    return priv.settings.isEmptyCol.call(instance, col);
  };

  /**
   * Select cell `row`, `col` or range of cells finishing at `endRow`, `endCol`.
   * By default, viewport will be scrolled to selection and after `selectCell` call instance will be listening
   * to keyboard input on document.
   *
   * @memberof Core#
   * @function selectCell
   * @param {Number} row
   * @param {Number} col
   * @param {Number} [endRow]
   * @param {Number} [endCol]
   * @param {Boolean} [scrollToCell=true] If `true`, viewport will be scrolled to the selection
   * @param {Boolean} [changeListener=true] If `false`, Handsontable will not change keyboard events listener to
   *                                        himself (default `true`)
   * @returns {Boolean}
   */
  this.selectCell = function(row, col, endRow, endCol, scrollToCell, changeListener) {
    var coords;

    changeListener = typeof changeListener === 'undefined' || changeListener === true;

    if (typeof row !== 'number' || row < 0 || row >= instance.countRows()) {
      return false;
    }
    if (typeof col !== 'number' || col < 0 || col >= instance.countCols()) {
      return false;
    }
    if (typeof endRow !== 'undefined') {
      if (typeof endRow !== 'number' || endRow < 0 || endRow >= instance.countRows()) {
        return false;
      }
      if (typeof endCol !== 'number' || endCol < 0 || endCol >= instance.countCols()) {
        return false;
      }
    }
    coords = new WalkontableCellCoords(row, col);
    priv.selRange = new WalkontableCellRange(coords, coords, coords);

    if (document.activeElement && document.activeElement !== document.documentElement &&
      document.activeElement !== document.body) {
      // needed or otherwise prepare won't focus the cell. selectionSpec tests this (should move focus to selected cell)
      document.activeElement.blur();
    }
    if (changeListener) {
      instance.listen();
    }

    if (typeof endRow === 'undefined') {
      selection.setRangeEnd(priv.selRange.from, scrollToCell);

    } else {
      selection.setRangeEnd(new WalkontableCellCoords(endRow, endCol), scrollToCell);
    }
    instance.selection.finish();

    return true;
  };

  /**
   * Select cell `row`, `prop` or range finishing at `endRow`, `endProp`. By default, viewport will be scrolled to selection.
   *
   * @memberof Core#
   * @function selectCellByProp
   * @param {Number} row
   * @param {Object} prop
   * @param {Number} [endRow]
   * @param {Object} [endProp]
   * @param {Boolean} [scrollToCell=true] If `true`, viewport will be scrolled to the selection
   * @returns {Boolean}
   */
  this.selectCellByProp = function(row, prop, endRow, endProp, scrollToCell) {
    /* jshint ignore:start */
    arguments[1] = datamap.propToCol(arguments[1]);
    if (typeof arguments[3] !== "undefined") {
      arguments[3] = datamap.propToCol(arguments[3]);
    }
    return instance.selectCell.apply(instance, arguments);
    /* jshint ignore:end */
  };

  /**
   * Deselects current cell selection on grid.
   *
   * @memberof Core#
   * @function deselectCell
   */
  this.deselectCell = function() {
    selection.deselect();
  };

  /**
   * Remove grid from DOM.
   *
   * @memberof Core#
   * @function destroy
   * @fires Hooks#afterDestroy
   */
  this.destroy = function() {

    instance._clearTimeouts();
    if (instance.view) { //in case HT is destroyed before initialization has finished
      instance.view.destroy();
    }
    empty(instance.rootElement);
    eventManager.destroy();

    Handsontable.hooks.run(instance, 'afterDestroy');
    Handsontable.hooks.destroy(instance);

    for (var i in instance) {
      if (instance.hasOwnProperty(i)) {
        //replace instance methods with post mortem
        if (typeof instance[i] === "function") {
          instance[i] = postMortem;
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
   * Replacement for all methods after Handsotnable was destroyed.
   *
   * @private
   */
  function postMortem() {
    throw new Error("This method cannot be called because this Handsontable instance has been destroyed");
  }

  /**
   * Returns active editor object. {@link Handsontable.EditorManager#getActiveEditor}
   *
   * @memberof Core#
   * @function getActiveEditor
   * @returns {Object}
   */
  this.getActiveEditor = function() {
    return editorManager.getActiveEditor();
  };

  /**
   * Returns plugin instance by plugin name
   *
   * @memberof Core#
   * @function getPlugin
   * @param {String} pluginName
   * @returns {*}
   * @since 0.15.0
   */
  this.getPlugin = function(pluginName) {
    return getPlugin(this, pluginName);
  };

  /**
   * Return Handsontable instance.
   *
   * @memberof Core#
   * @function getInstance
   * @returns {Handsontable}
   */
  this.getInstance = function() {
    return instance;
  };

  /**
   * Adds listener to specified hook name and only for this Handsontable instance.
   *
   * @memberof Core#
   * @function addHook
   * @see Hooks#add
   * @param {String} key Hook name
   * @param {Function|Array} callback Function or array of Functions
   *
   * @example
   * ```js
   * hot.addHook('beforeInit', myCallback);
   * ```
   */
  this.addHook = function(key, callback) {
    Handsontable.hooks.add(key, callback, instance);
  };

  /**
   * Adds listener to specified hook name and only for this Handsontable instance. After hook runs this
   * listener will be automatically removed.
   *
   * @memberof Core#
   * @function addHookOnce
   * @see Hooks#once
   * @param {String} key Hook name
   * @param {Function|Array} callback Function or array of Functions
   *
   * @example
   * ```js
   * hot.addHookOnce('beforeInit', myCallback);
   * ```
   */
  this.addHookOnce = function(key, callback) {
    Handsontable.hooks.once(key, callback, instance);
  };

  /**
   * Removes the hook listener previously registered with {@link Core#addHook}.
   *
   * @memberof Core#
   * @function removeHook
   * @see Hooks#remove
   * @param {String} key Hook name
   * @param {Function} callback Function which have been registered via {@link Core#addHook}
   *
   * @example
   * ```js
   * hot.removeHook('beforeInit', myCallback);
   * ```
   */
  this.removeHook = function(key, callback) {
    Handsontable.hooks.remove(key, callback, instance);
  };

  /**
   * @memberof Core#
   * @function runHooks
   * @see Hooks#run
   * @param {String} key Hook name
   * @param {*} [p1]
   * @param {*} [p2]
   * @param {*} [p3]
   * @param {*} [p4]
   * @param {*} [p5]
   * @param {*} [p6]
   * @returns {*}
   *
   * @example
   * ```js
   * hot.runHooks('beforeInit');
   * ```
   */
  this.runHooks = function(key, p1, p2, p3, p4, p5, p6) {
    return Handsontable.hooks.run(instance, key, p1, p2, p3, p4, p5, p6);
  };

  this.timeouts = [];

  /**
   * Sets timeout. Purpose of this method is to clear all known timeouts when `destroy` method is called.
   *
   * @param {*} handle
   * @private
   */
  this._registerTimeout = function(handle) {
    this.timeouts.push(handle);
  };

  /**
   * Clears all known timeouts.
   *
   * @private
   */
  this._clearTimeouts = function() {
    for (var i = 0, ilen = this.timeouts.length; i < ilen; i++) {
      clearTimeout(this.timeouts[i]);
    }
  };

  /**
   * Handsontable version
   *
   * @type {String}
   */
  this.version = Handsontable.version;

  Handsontable.hooks.run(instance, 'construct');
};

/**
 * @alias Options
 * @constructor
 * @description

 * ## Constructor options
 *
 * Constructor options are applied using an object literal passed as a first argument to the Handsontable constructor.
 *
 * ```js
 * var hot = new Handsontable(document.getElementById('example1'), {
 *   data: myArray,
 *   width: 400,
 *   height: 300
 * })
 * ```
 *
 * ---
 * ## Cascading configuration
 *
 * Handsontable 0.9 and newer is using *Cascading Configuration*, which is fast way to provide configuration options
 * for whole table, its columns and particular cells.
 *
 * Consider the following example:
 * ```js
 * var hot = new Handsontable(document.getElementById('example'), {
 *   readOnly: true,
 *   columns: [
 *     {readOnly: false},
 *     {},
 *     {}
 *   ],
 *   cells: function (row, col, prop) {
 *     var cellProperties = {};
 *
 *     if (row === 0 && col === 0) {
 *       cellProperties.readOnly = true;
 *     }
 *
 *     return cellProperties;
 *   }
 * });
 * ```
 *
 * The above notation will result in all TDs being *read only*, except for first column TDs which will be *editable*, except for the TD in top left corner which will still be *read only*.
 *
 * ### The Cascading Configuration model
 *
 * ##### 1. Constructor
 *
 * Configuration options that are provided using first-level `handsontable(container, {option: "value"})` and `updateSettings` method.
 *
 * ##### 2. Columns
 *
 * Configuration options that are provided using second-level object `handsontable(container, {columns: {option: "value"}]})`
 *
 * ##### 3. Cells
 *
 * Configuration options that are provided using second-level function `handsontable(container, {cells: function: (row, col, prop){ }})`
 *
 * ---
 * ## Architecture performance
 *
 * The Cascading Configuration model is based on prototypical inheritance. It is much faster and memory efficient compared
 * to the previous model that used jQuery extend. See: [http://jsperf.com/extending-settings](http://jsperf.com/extending-settings).
 *
 * ---
 * __Important notice:__ In order for the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.
 */
var DefaultSettings = function() {
};

DefaultSettings.prototype = {
  /**
   * @description
   * Initial data source that will be bound to the data grid __by reference__ (editing data grid alters the data source).
   * Can be Array of Array, Array of Objects or Function.
   *
   * See [Understanding binding as reference](http://handsontable.com/demo/understanding_reference.html).
   *
   * @type {Array|Function}
   * @default undefined
   */
  data: void 0,

  /**
   * @description
   * Defines the structure of a new row when data source is an object.
   * Default like the first data row Array or Object.
   *
   *  See [demo/datasources.html](http://handsontable.com/demo/datasources.html) for examples.
   *
   * @type {Object}
   * @default undefined
   */
  dataSchema: void 0,

  /**
   * Width of the grid. Can be a number or a function that returns a number.
   *
   * @type {Number|Function}
   * @default undefined
   */
  width: void 0,

  /**
   * Height of the grid. Can be a number or a function that returns a number.
   *
   * @type {Number|Function}
   * @default undefined
   */
  height: void 0,

  /**
   * @description
   * Initial number of rows.
   *
   * __Notice:__ This option only has effect in Handsontable constructor and only if `data` option is not provided
   *
   * @type {Number}
   * @default 5
   */
  startRows: 5,

  /**
   * @description
   * Initial number of columns.
   *
   * __Notice:__ This option only has effect in Handsontable constructor and only if `data` option is not provided
   *
   * @type {Number}
   * @default 5
   */
  startCols: 5,

  /**
   * Setting `true` or `false` will enable or disable the default row headers (1, 2, 3).
   * You can also define an array `['One', 'Two', 'Three', ...]` or a function to define the headers.
   * If a function is set the index of the row is passed as a parameter.
   *
   * @type {Boolean|Array|Function}
   * @default null
   * @example
   * ```js
   * ...
   * // as boolean
   * rowHeaders: true,
   * ...
   *
   * ...
   * // as array
   * rowHeaders: [1, 2, 3],
   * ...
   *
   * ...
   * // as function
   * rowHeaders: function(index) {
   *   return index + ': AB';
   * },
   * ...
   * ```
   */
  rowHeaders: null,

  /**
   * Setting `true` or `false` will enable or disable the default column headers (A, B, C).
   * You can also define an array `['One', 'Two', 'Three', ...]` or a function to define the headers.
   * If a function is set the index of the column is passed as a parameter.
   *
   * @type {Boolean|Array|Function}
   * @default null
   * @example
   * ```js
   * ...
   * // as boolean
   * colHeaders: true,
   * ...
   *
   * ...
   * // as array
   * colHeaders: ['A', 'B', 'C'],
   * ...
   *
   * ...
   * // as function
   * colHeaders: function(index) {
   *   return index + ': AB';
   * },
   * ...
   * ```
   */
  colHeaders: null,

  /**
   * Defines column widths in pixels. Accepts number, string (that will be converted to number),
   * array of numbers (if you want to define column width separately for each column) or a
   * function (if you want to set column width dynamically on each render).
   *
   * @type {Array|Function|Number|String}
   * @default undefined
   */
  colWidths: void 0,

  /**
   * @description
   * Defines the cell properties and data binding for certain columns.
   *
   * __Notice:__ Using this option sets a fixed number of columns (options `startCols`, `minCols`, `maxCols` will be ignored).
   *
   * See [demo/datasources.html](http://handsontable.com/demo/datasources.html) for examples.
   *
   * @type {Array}
   * @default undefined
   * @example
   * ```js
   * ...
   * var exampleContainer = document.getElementById('example');
   * var hot = new Handsontable(exampleContainer, {
   *   columns: [
   *     {
   *       // column options for the first column
   *       type: 'numeric',
   *       format: '0,0.00 $'
   *     },
   *     {
   *       // column options for the second column
   *       type: 'text',
   *       readOnly: true
   *     }
   *   ]
   * });
   * ...
   * ```
   */
  columns: void 0,

  /**
   * @description
   * Defines the cell properties for given `row`, `col`, `prop` coordinates.
   * Any constructor or column option may be overwritten for a particular cell (row/column combination), using `cell`
   * array passed to the Handsontable constructor. Or using `cells` function property to the Handsontable constructor.
   *
   * @type {Function}
   * @default undefined
   * @example
   * ```js
   * ...
   * var hot = new Handsontable(document.getElementById('example'), {
   *   cells: function (row, col, prop) {
   *     var cellProperties = {};
   *
   *     if (row === 0 && col === 0) {
   *       cellProperties.readOnly = true;
   *     }
   *
   *     return cellProperties;
   *   }
   * });
   * ...
   * ```
   */
  cells: void 0,

  /**
   * Any constructor or column option may be overwritten for a particular cell (row/column combination), using `cell`
   * array passed to the Handsontable constructor.
   *
   * @type {Array}
   * @default []
   * @example
   * ```js
   * ...
   * var hot = new Handsontable(document.getElementById('example'), {
   *   cell: [
   *     {row: 0, col: 0, readOnly: true}
   *   ]
   * });
   * ...
   * ```
   */
  cell: [],

  /**
   * @description
   * If `true`, enables {@link Comments} plugin, which enables applying cell comments through the context menu
   * (configurable with context menu keys commentsAddEdit, commentsRemove).
   *
   * To initialize Handsontable with predefined comments, provide cell coordinates and comment texts in form of an array.
   *
   * See [Comments](http://handsontable.com/demo/comments.html) demo for examples.
   *
   * @since 0.11.0
   * @type {Boolean|Array}
   * @default false
   * @example
   * ```js
   * ...
   * var hot = new Handsontable(document.getElementById('example'), {
   *   comments: [{row: 1, col: 1, comment: "Test comment"}]
   * });
   * ...
   * ```
   */
  comments: false,

  /**
   * @description
   * If `true`, enables Custom Borders plugin, which enables applying custom borders through the context menu (configurable with context menu key borders).
   *
   * To initialize Handsontable with predefined custom borders, provide cell coordinates and border styles in form of an array.
   *
   * See [Custom Borders](http://handsontable.com/demo/custom_borders.html) demo for examples.
   *
   * @since 0.11.0
   * @type {Boolean|Array}
   * @default false
   * @example
   * ```js
   * ...
   * var hot = new Handsontable(document.getElementById('example'), {
   *   customBorders: [
   *     {range: {
   *       from: {row: 1, col: 1},
   *       to: {row: 3, col: 4}},
   *       left: {},
   *       right: {},
   *       top: {},
   *       bottom: {}
   *     }
   *   ],
   * });
   * ...
   *
   * // or
   * ...
   * var hot = new Handsontable(document.getElementById('example'), {
   *   customBorders: [
   *     {row: 2, col: 2, left: {width: 2, color: 'red'},
   *       right: {width: 1, color: 'green'}, top: '', bottom: ''}
   *   ],
   * });
   * ...
   * ```
   */
  customBorders: false,

  /**
   * Minimum number of rows. At least that amount of rows will be created during initialization.
   *
   * @type {Number}
   * @default 0
   */
  minRows: 0,

  /**
   * Minimum number of columns. At least that many of columns will be created during initialization.
   *
   * @type {Number}
   * @default 0
   */
  minCols: 0,

  /**
   * Maximum number of rows.
   *
   * @type {Number}
   * @default Infinity
   */
  maxRows: Infinity,

  /**
   * Maximum number of cols.
   *
   * @type {Number}
   * @default Infinity
   */
  maxCols: Infinity,

  /**
   * When set to 1 (or more), Handsontable will add a new row at the end of grid if there are no more empty rows.
   *
   * @type {Number}
   * @default 0
   */
  minSpareRows: 0,

  /**
   * When set to 1 (or more), Handsontable will add a new column at the end of grid if there are no more empty columns.
   *
   * @type {Number}
   * @default 0
   */
  minSpareCols: 0,

  /**
   * @type {Boolean}
   * @default true
   */
  allowInsertRow: true,

  /**
   * @type {Boolean}
   * @default true
   */
  allowInsertColumn: true,

  /**
   * @type {Boolean}
   * @default true
   */
  allowRemoveRow: true,

  /**
   * @type {Boolean}
   * @default true
   */
  allowRemoveColumn: true,

  /**
   * If true, selection of multiple cells using keyboard or mouse is allowed.
   *
   * @type {Boolean}
   * @default true
   */
  multiSelect: true,

  /**
   * Enables the fill handle (drag-down and copy-down) functionality, which shows the small rectangle in bottom
   * right corner of the selected area, that let's you expand values to the adjacent cells.
   *
   * Possible values: `true` (to enable in all directions), `"vertical"` or `"horizontal"` (to enable in one direction),
   * `false` (to disable completely). Setting to `true` enables the fillHandle plugin.
   *
   * @type {Boolean|String}
   * @default true
   */
  fillHandle: true,

  /**
   * Allows to specify the number of rows fixed (aka freezed) on the top of the table.
   *
   * @type {Number}
   * @default 0
   */
  fixedRowsTop: 0,

  /**
   * Allows to specify the number of columns fixed (aka freezed) on the left side of the table.
   *
   * @type {Number}
   * @default 0
   */
  fixedColumnsLeft: 0,

  /**
   * If `true`, mouse click outside the grid will deselect the current selection.
   *
   * @type {Boolean}
   * @default true
   */
  outsideClickDeselects: true,

  /**
   * If `true`, <kbd>ENTER</kbd> begins editing mode (like Google Docs). If `false`, <kbd>ENTER</kbd> moves to next
   * row (like Excel) and adds new row if necessary. <kbd>TAB</kbd> adds new column if necessary.
   *
   * @type {Boolean}
   * @default true
   */
  enterBeginsEditing: true,

  /**
   * Defines cursor move after <kbd>ENTER</kbd> is pressed (<kbd>SHIFT</kbd> + <kbd>ENTER</kbd> uses negative vector).
   * Can be an object or a function that returns an object. The event argument passed to the function
   * is a DOM Event object received after a <kbd>ENTER</kbd> key has been pressed. This event object can be used to check
   * whether user pressed <kbd>ENTER</kbd> or <kbd>SHIFT</kbd> + <kbd>ENTER</kbd>.
   *
   * @type {Object|Function}
   * @default {row: 1, col: 0}
   */
  enterMoves: {row: 1, col: 0},

  /**
   * Defines cursor move after <kbd>TAB</kbd> is pressed (<kbd>SHIFT</kbd> + <kbd>TAB</kbd> uses negative vector).
   * Can be an object or a function that returns an object. The event argument passed to the function
   * is a DOM Event object received after a <kbd>TAB</kbd> key has been pressed. This event object can be used to check
   * whether user pressed <kbd>TAB</kbd> or <kbd>SHIFT</kbd> + <kbd>TAB</kbd>.
   *
   * @type {Object}
   * @default {row: 0, col: 1}
   */
  tabMoves: {row: 0, col: 1},

  /**
   * If `true`, pressing <kbd>TAB</kbd> or right arrow in the last column will move to first column in next row
   *
   * @type {Boolean}
   * @default false
   */
  autoWrapRow: false,

  /**
   * If `true`, pressing <kbd>ENTER</kbd> or down arrow in the last row will move to first row in next column
   *
   * @type {Boolean}
   * @default false
   */
  autoWrapCol: false,

  /**
   * Maximum number of rows than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.
   *
   * @type {Number}
   * @default 1000
   */
  copyRowsLimit: 1000,

  /**
   * Maximum number of columns than can be copied to clipboard using <kbd>CTRL</kbd> + <kbd>C</kbd>.
   *
   * @type {Number}
   * @default 1000
   */
  copyColsLimit: 1000,

  /**
   * Defines paste (<kbd>CTRL</kbd> + <kbd>V</kbd>) behavior. Default value `"overwrite"` will paste clipboard value over current selection.
   * When set to `"shift_down"`, clipboard data will be pasted in place of current selection, while all selected cells are moved down.
   * When set to `"shift_right"`, clipboard data will be pasted in place of current selection, while all selected cells are moved right.
   *
   * @type {String}
   * @default 'overwrite'
   */
  pasteMode: 'overwrite',

  /**
   * @description
   * Turn on saving the state of column sorting, columns positions and columns sizes in local storage.
   *
   * You can save any sort of data in local storage in to preserve table state between page reloads.
   * In order to enable data storage mechanism, `persistentState` option must be set to `true` (you can set it
   * either during Handsontable initialization or using the `updateSettings` method). When `persistentState` is enabled it exposes 3 hooks:
   *
   * __persistentStateSave__ (key: String, value: Mixed)
   *
   *   * Saves value under given key in browser local storage.
   *
   * __persistentStateLoad__ (key: String, valuePlaceholder: Object)
   *
   *   * Loads `value`, saved under given key, form browser local storage. The loaded `value` will be saved in `valuePlaceholder.value`
   *     (this is due to specific behaviour of `Hooks.run()` method). If no value have been saved under key `valuePlaceholder.value`
   *     will be `undefined`.
   *
   * __persistentStateReset__ (key: String)
   *
   *   * Clears the value saved under `key`. If no `key` is given, all values associated with table will be cleared.
   *
   * __Note:__ The main reason behind using `persistentState` hooks rather than regular LocalStorage API is that it
   * ensures separation of data stored by multiple Handsontable instances. In other words, if you have two (or more)
   * instances of Handsontable on one page, data saved by one instance won't be accessible by the second instance.
   * Those two instances can store data under the same key and no data would be overwritten.
   *
   * __Important:__ In order for the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.
   *
   * @type {Boolean}
   * @default false
   */
  persistentState: false,

  /**
   * Class name for all visible rows in current selection.
   *
   * @type {String}
   * @default undefined
   */
  currentRowClassName: void 0,

  /**
   * Class name for all visible columns in current selection.
   *
   * @type {String}
   * @default undefined
   */
  currentColClassName: void 0,

  /**
   * Class name for all handsontable container element.
   *
   * @type {String|Array}
   * @default undefined
   */
  className: void 0,

  /**
   * Class name for all tables inside container element.
   *
   * @since 0.17.0
   * @type {String|Array}
   * @default undefined
   */
  tableClassName: void 0,

  /**
   * @description
   * [Column stretching](http://handsontable.com/demo/scroll.html) mode. Possible values: `"none"`, `"last"`, `"all"`.
   *
   * @type {String}
   * @default 'none'
   */
  stretchH: 'none',

  /**
   * Lets you overwrite the default `isEmptyRow` method.
   *
   * @type {Function}
   * @param {Number} row
   * @returns {Boolean}
   */
  isEmptyRow: function(row) {
    var col, colLen, value, meta;

    for (col = 0, colLen = this.countCols(); col < colLen; col++) {
      value = this.getDataAtCell(row, col);

      if (value !== '' && value !== null && typeof value !== 'undefined') {
        if (typeof value === 'object') {
          meta = this.getCellMeta(row, col);

          return isObjectEquals(this.getSchema()[meta.prop], value);
        }
        return false;
      }
    }

    return true;
  },

  /**
   * Lets you overwrite the default `isEmptyCol` method.
   *
   * @type {Function}
   * @param {Number} col
   * @returns {Boolean}
   */
  isEmptyCol: function(col) {
    var row, rowLen, value;

    for (row = 0, rowLen = this.countRows(); row < rowLen; row++) {
      value = this.getDataAtCell(row, col);

      if (value !== '' && value !== null && typeof value !== 'undefined') {
        return false;
      }
    }

    return true;
  },

  /**
   * When set to `true`, the table is rerendered when it is detected that it was made visible in DOM.
   *
   * @type {Boolean}
   * @default true
   */
  observeDOMVisibility: true,

  /**
   * If set to `true`, cells will accept value that is marked as invalid by cell `validator`, with a background color
   * automatically applied using CSS class `htInvalid`. If set to `false`, cells will not accept invalid value.
   *
   * @type {Boolean}
   * @default true
   * @since 0.9.5
   */
  allowInvalid: true,

  /**
   * CSS class name for cells that did not pass validation.
   *
   * @type {String}
   * @default 'htInvalid'
   */
  invalidCellClassName: 'htInvalid',

  /**
   * When set to an non-empty string, displayed as the cell content for empty cells.
   *
   * @type {Boolean|String}
   * @default false
   */
  placeholder: false,

  /**
   * CSS class name for cells that have a placeholder in use.
   *
   * @type {String}
   * @default 'htPlaceholder'
   */
  placeholderCellClassName: 'htPlaceholder',

  /**
   * CSS class name for read-only cells.
   *
   * @type {String}
   * @default 'htDimmed'
   */
  readOnlyCellClassName: 'htDimmed',

  /**
   * String may be one of the following predefined values: `autocomplete`, `checkbox`, `text`, `numeric`. Function will
   * receive the following arguments: `function(instance, TD, row, col, prop, value, cellProperties) {}`.
   * You can map your own function to a string like this: `Handsontable.cellLookup.renderer.myRenderer = myRenderer;`
   *
   * @type {String|Function}
   * @default undefined
   */
  renderer: void 0,

  /**
   * @type {String}
   * @default 'htCommentCell'
   */
  commentedCellClassName: 'htCommentCell',

  /**
   * Setting to `true` enables selecting just a fragment of the text within a single cell or between adjacent cells.
   *
   * @type {Boolean}
   * @default false
   */
  fragmentSelection: false,

  /**
   * @description
   * Make cell [read only](http://handsontable.com/demo/readonly.html).
   *
   * @type {Boolean}
   * @default false
   */
  readOnly: false,

  /**
   * @description
   * Setting to true enables the search plugin (see [demo](http://handsontable.com/demo/search.html)).
   *
   * @type {Boolean}
   * @default false
   */
  search: false,

  /**
   * @description
   * Shortcut to define combination of cell renderer and editor for the column.
   *
   * Possible values:
   *  * text
   *  * [numeric](http://handsontable.com/demo/numeric.html)
   *  * [date](http://handsontable.com/demo/date.html)
   *  * [checkbox](http://handsontable.com/demo/checkbox.html)
   *  * [autocomplete](http://handsontable.com/demo/autocomplete.html)
   *  * [handsontable](http://handsontable.com/demo/handsontable.html)
   *
   * @type {String}
   * @default 'text'
   */
  type: 'text',

  /**
   * @description
   * Make cell copyable (pressing <kbd>CTRL</kbd> + <kbd>C</kbd> on your keyboard moves its value to system clipboard).
   *
   * __Note:__ this setting is `false` by default for cells with type `password`.
   *
   * @type {Boolean}
   * @default true
   * @since 0.10.2
   */
  copyable: true,

  /**
   * String, rendering function or boolean.
   *
   * String may be one of the following predefined values:
   *  * [autocomplete](http://handsontable.com/demo/autocomplete.html)
   *  * [checkbox](http://handsontable.com/demo/checkbox.html)
   *  * [date](http://handsontable.com/demo/date.html)
   *  * [dropdown](http://handsontable.com/demo/dropdown.html)
   *  * [handsontable](http://handsontable.com/demo/handsontable.html)
   *  * [mobile](http://docs.handsontable.com/demo-mobiles-and-tablets.html)
   *  * [password](http://handsontable.com/demo/password.html)
   *  * [select](http://handsontable.com/demo/selectEditor.html)
   *  * text
   *
   * Or you can disable cell editing passing `false`.
   *
   * @type {String|Function|Boolean}
   * @default 'text'
   */
  editor: void 0,

  /**
   * @description
   * Autocomplete definitions. See [demo/autocomplete.html](http://handsontable.com/demo/autocomplete.html) for examples and definitions.
   *
   * @type {Array}
   * @default undefined
   */
  autoComplete: void 0,

  /**
   * Control number of choices for autocomplete (or dropdown) cells. After exceeding it scrollbar for dropdown list of choices will be visible.
   *
   * @since 0.18.0
   * @type {Number}
   * @default 10
   */
  visibleRows : 10,

  /**
   * Makes autocomplete or dropdown width the same as the edited cell width. If `false` then editor will be scaled
   * according to its content.
   *
   * @since 0.17.0
   * @type {Boolean}
   * @default true
   */
  trimDropdown : true,

  /**
   * Setting to true enables the debug mode, currently used to test the correctness of the row and column
   * header fixed positioning on a layer above the master table.
   *
   * @type {Boolean}
   * @default false
   */
  debug: false,

  /**
   * When set to `true`, the text of the cell content is wrapped if it does not fit in the fixed column width.
   *
   * @type {Boolean}
   * @default true
   * @since 0.11.0
   */
  wordWrap: true,

  /**
   * CSS class name added to cells with cell meta `wordWrap: false`.
   *
   * @type {String}
   * @default 'htNoWrap'
   * @since 0.11.0
   */
  noWordWrapClassName: 'htNoWrap',

  /**
   * @description
   * Defines if the right-click context menu should be enabled. Context menu allows to create new row or
   * column at any place in the grid. Possible values: `true` (to enable basic options), `false` (to disable completely)
   * or array of any available strings: `["row_above", "row_below", "col_left", "col_right",
   * "remove_row", "remove_col", "undo", "redo", "sep1", "sep2", "sep3"]`.
   *
   * See [demo/contextmenu.html](http://handsontable.com/demo/contextmenu.html) for examples.
   *
   * @type {Boolean|Array|Object}
   * @default undefined
   */
  contextMenu: void 0,

  /**
   * @description
   * Defines if the dropdown menu in headers should be enabled. Dropdown menu allows to put custom or predefined actions
   * which can intreact with selected column.
   * Possible values: `true` (to enable basic options), `false` (to disable completely)
   * or array of any available strings: `["row_above", "row_below", "col_left", "col_right",
   * "remove_row", "remove_col", "undo", "redo", "clear_column", "sep1", "sep2", "sep3"]`.
   *
   * See [demo/dropdownmenu.html](http://handsontable.com/demo/dropdownmenu.html) for examples.
   *
   * @type {Boolean|Array|Object}
   * @default undefined
   */
  dropdownMenu: void 0,

  /**
   * If `true`, undo/redo functionality is enabled.
   *
   * @type {Boolean}
   * @default undefined
   */
  undo: void 0,

  /**
   * @description
   * Turn on [Column sorting](http://handsontable.com/demo/sorting.html).
   *
   * @type {Boolean|Object}
   * @default undefined
   */
  columnSorting: void 0,

  /**
   * @description
   * Turn on [Manual column move](http://docs.handsontable.com/demo-resizing.html), if set to a boolean or define initial
   * column order, if set to an array of column indexes.
   *
   * @type {Boolean|Array}
   * @default undefined
   */
  manualColumnMove: void 0,

  /**
   * @description
   * Turn on [Manual column resize](http://docs.handsontable.com/demo-resizing.html), if set to a boolean or define initial
   * column resized widths, if set to an array of numbers.
   *
   * @type {Boolean|Array}
   * @default undefined
   */
  manualColumnResize: void 0,

  /**
   * @description
   * Turn on [Manual row move](http://docs.handsontable.com/demo-resizing.html), if set to a boolean or define initial
   * row order, if set to an array of row indexes.
   *
   * @type {Boolean|Array}
   * @default undefined
   * @since 0.11.0
   */
  manualRowMove: void 0,

  /**
   * @description
   * Turn on [Manual row resize](http://docs.handsontable.com/demo-resizing.html), if set to a boolean or define initial
   * row resized heights, if set to an array of numbers.
   *
   * @type {Boolean|Array}
   * @default undefined
   * @since 0.11.0
   */
  manualRowResize: void 0,

  /**
   * @description
   * Setting to true or array enables the mergeCells plugin, which enables the merging of the cells. (see [demo](http://handsontable.com/demo/merge_cells.html)).
   * You can provide the merged cells on the pageload if you feed the mergeCells option with an array.
   *
   * @type {Boolean|Array}
   * @default false
   */
  mergeCells: false,

  /**
   * Number of rows to be prerendered before and after the viewport is changed. Default value is `'auto'` which means
   * that Handsontable tries to calculates offset for best performance.
   *
   * @type {Number|String}
   * @default 'auto'
   */
  viewportRowRenderingOffset: 'auto',

  /**
   * Number of columns to be prerendered before and after the viewport is changed. Default value is `'auto'` which means
   * that Handsontable tries to calculates offset for best performance.
   *
   * @type {Number|String}
   * @default 'auto'
   */
  viewportColumnRenderingOffset: 'auto',

  /**
   * @description
   * If `true`, enables Grouping plugin, which enables applying expandable row and column groups.
   * To initialize Handsontable with predefined groups, provide row or column group start and end coordinates in form of an array.
   *
   * See [Grouping](http://handsontable.com/demo/grouping.html) demo for examples.
   *
   * @type {Boolean|Array}
   * @default undefined
   * @since 0.11.4
   * @example
   * ```js
   * ...
   * // as boolean
   * groups: true,
   * ...
   *
   * ...
   * // as array
   * groups: [{cols: [0, 2]}, {cols: [5, 15], rows: [0, 5]}],
   * ...
   * ```
   */
  groups: void 0,

  /**
   * A usually small function or regular expression that validates the input.
   * After you determine if the input is valid, execute `callback(true)` or `callback(false)` to proceed with the execution.
   * In function, `this` binds to cellProperties.
   *
   * @type {Function|RegExp}
   * @default undefined
   * @since 0.9.5
   */
  validator: void 0,

  /**
   * @description
   * Disable visual cells selection.
   *
   * Possible values:
   *  * `true` - Disables any type of visual selection (current and area selection),
   *  * `false` - Enables any type of visual selection. This is default value.
   *  * `current` - Disables to appear only current selected cell.
   *  * `area` - Disables to appear only multiple selected cells.
   *
   * @type {Boolean|String|Array}
   * @default false
   * @since 0.13.2
   * @example
   * ```js
   * ...
   * // as boolean
   * disableVisualSelection: true,
   * ...
   *
   * ...
   * // as string ('current' or 'area')
   * disableVisualSelection: 'current',
   * ...
   *
   * ...
   * // as array
   * disableVisualSelection: ['current', 'area'],
   * ...
   * ```
   */
  disableVisualSelection: false,

  /**
   * @description
   * Set whether to display the current sorting indicator (a triangle icon in the column header, specifying the sorting order).
   *
   * @type {Boolean}
   * @default false
   * @since 0.15.0-beta3
   */
  sortIndicator: false,
  manualColumnFreeze: void 0,

  /**
   * @description
   * Defines whether Handsontable should trim the whitespace at the begging and the end of the cell contents
   *
   * @type {Boolean}
   * @default true
   */
  trimWhitespace: true,
  settings: void 0,
  source: void 0,
  title: void 0,

  /**
   * Data template for `'checkbox'` type when checkbox is checked.
   *
   * Option desired for cell which `'checkbox'` type.
   *
   * @type {Boolean|String}
   * @default true
   */
  checkedTemplate: void 0,

  /**
   * Data template for `'checkbox'` type when checkbox is unchecked.
   *
   * Option desired for cell which `'checkbox'` type.
   *
   * @type {Boolean|String}
   * @default false
   */
  uncheckedTemplate: void 0,

  /**
   * Display format. See http://numeric.com.
   *
   * Option desired for cell which `'numeric'` type.
   */
  format: void 0,

  /**
   * Language display format. See http://numeric.com.
   *
   * Option desired for cell which `'numeric'` type.
   *
   * @type {String}
   * @default 'en'
   */
  language: void 0,

  /**
   * Data source for cell with `'select'` type.
   *
   * @type {Array}
   */
  selectOptions: void 0,

  /**
   * Enables or disables autoColumnSize plugin. Default value is `undefined` which is the same effect as `true`.
   * Disable this plugin can increase performance.
   *
   * Column width calculations are divided into sync and async part. Each of this part has own advantages and
   * disadvantages. Synchronous counting is faster but it blocks browser UI and asynchronous is slower but it does not
   * block Browser UI.
   *
   * To configure this sync/async line you can pass absolute value (columns) or percentage.
   * @example
   * ```js
   * ...
   * // as number (300 columns in sync, rest async)
   * autoColumnSize: {syncLimit: 300},
   * ...
   *
   * ...
   * // as string (percent)
   * autoColumnSize: {syncLimit: '40%'},
   * ...
   * ```
   *
   * `syncLimit` options is available since 0.16.0.
   *
   * @type {Object|Boolean}
   * @default {syncLimit: 50}
   */
  autoColumnSize: void 0,

  /**
   * Enables or disables autoRowSize plugin. Default value is `undefined` which is the same effect as `true`.
   * Disable this plugin can increase performance.
   *
   * Row height calculations are divided into sync and async part. Each of this part has own advantages and
   * disadvantages. Synchronous counting is faster but it blocks browser UI and asynchronous is slower but it does not
   * block Browser UI.
   *
   * To configure this sync/async line you can pass absolute value (rows) or percentage.
   * @example
   * ```js
   * ...
   * // as number (300 columns in sync, rest async)
   * autoRowSize: {syncLimit: 300},
   * ...
   *
   * ...
   * // as string (percent)
   * autoRowSize: {syncLimit: '40%'},
   * ...
   * ```
   *
   * `syncLimit` options is available since 0.16.0.
   *
   * @type {Object|Boolean}
   * @default {syncLimit: 1000}
   */
  autoRowSize: void 0,

  /**
   * Date validation format.
   *
   * Option desired for cell which `'date'` type.
   *
   * @type {String}
   * @default 'DD/MM/YYYY'
   */
  dateFormat: void 0,

  /**
   * If `true` then dates will be automatically formatted to match the desired format.
   *
   * Option desired for cell which `'date'` type.
   *
   * @type {Boolean}
   * @default false
   */
  correctFormat: false,

  /**
   * Definition of default value which will fill empty cells.
   *
   * Option desired for cell which `'date'` type.
   *
   * @type {String}
   */
  defaultDate: void 0,

  /**
   * If typed `true` value entered into cell must match to the autocomplete source. Otherwise cell will be invalid.
   *
   * Option desired for cell which `'autocomplete'` type.
   *
   * @type {Boolean}
   */
  strict: void 0,
};
Handsontable.DefaultSettings = DefaultSettings;
