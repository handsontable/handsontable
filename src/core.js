import numbro from 'numbro';
import {addClass, empty, isChildOfWebComponentTable, removeClass} from './helpers/dom/element';
import {columnFactory} from './helpers/setting';
import {isFunction} from './helpers/function';
import {isDefined, isUndefined, isRegExp} from './helpers/mixed';
import {isMobileBrowser} from './helpers/browser';
import DataMap from './dataMap';
import EditorManager from './editorManager';
import EventManager from './eventManager';
import {deepClone, duckSchema, extend, isObject, isObjectEquals, deepObjectSize, hasOwnProperty, createObjectPropListener} from './helpers/object';
import {arrayFlatten, arrayMap} from './helpers/array';
import {getPlugin} from './plugins';
import {getRenderer} from './renderers';
import {getValidator} from './validators';
import {randomString} from './helpers/string';
import {rangeEach} from './helpers/number';
import TableView from './tableView';
import DataSource from './dataSource';
import {translateRowsToColumns, cellMethodLookupFactory, spreadsheetColumnLabel} from './helpers/data';
import {getTranslator} from './utils/recordTranslator';
import {CellCoords, CellRange, ViewportColumnsCalculator} from './3rdparty/walkontable/src';
import Hooks from './pluginHooks';
import DefaultSettings from './defaultSettings';
import {getCellType} from './cellTypes';

let activeGuid = null;

/**
 * Handsontable constructor
 *
 * @core
 * @dependencies numbro
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
export default function Core(rootElement, userSettings) {
  var priv,
    datamap,
    dataSource,
    grid,
    selection,
    editorManager,
    instance = this,
    GridSettings = function() {
    },
    eventManager = new EventManager(instance);

  extend(GridSettings.prototype, DefaultSettings.prototype); // create grid settings as a copy of default settings
  extend(GridSettings.prototype, userSettings); // overwrite defaults with user settings
  extend(GridSettings.prototype, expandType(userSettings));

  this.rootElement = rootElement;
  this.isHotTableEnv = isChildOfWebComponentTable(this.rootElement);
  EventManager.isHotTableEnv = this.isHotTableEnv;

  this.container = document.createElement('DIV');
  this.renderCall = false;

  rootElement.insertBefore(this.container, rootElement.firstChild);

  this.guid = `ht_${randomString()}`; // this is the namespace for global events

  const recordTranslator = getTranslator(instance);

  dataSource = new DataSource(instance);

  if (!this.rootElement.id || this.rootElement.id.substring(0, 3) === 'ht_') {
    this.rootElement.id = this.guid; // if root element does not have an id, assign a random id
  }
  priv = {
    cellSettings: [],
    columnSettings: [],
    columnsSettingConflicts: ['data', 'width'],
    settings: new GridSettings(), // current settings instance
    selRange: null, // exposed by public method `getSelectedRange`
    isPopulated: null,
    scrollable: null,
    firstRun: true,
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
    alter(action, index, amount, source, keepEmptyRows) {
      var delta;

      amount = amount || 1;

      function spliceWith(data, index, count, toInject) {
        let valueFactory = () => {
          let result;

          if (toInject === 'array') {
            result = [];

          } else if (toInject === 'object') {
            result = {};
          }

          return result;
        };
        let spliceArgs = arrayMap(new Array(count), () => valueFactory());

        spliceArgs.unshift(index, 0);
        data.splice(...spliceArgs);
      }

      /* eslint-disable no-case-declarations */
      switch (action) {
        case 'insert_row':

          const numberOfSourceRows = instance.countSourceRows();

          if (instance.getSettings().maxRows === numberOfSourceRows) {
            return;
          }

          index = (isDefined(index)) ? index : numberOfSourceRows;

          delta = datamap.createRow(index, amount, source);
          spliceWith(priv.cellSettings, index, amount, 'array');

          if (delta) {
            if (selection.isSelected() && priv.selRange.from.row >= index) {
              priv.selRange.from.row += delta;
              selection.transformEnd(delta, 0); // will call render() internally
            } else {
              selection.refreshBorders(); // it will call render and prepare methods
            }
          }
          break;

        case 'insert_col':
          delta = datamap.createCol(index, amount, source);

          for (let row = 0, len = instance.countSourceRows(); row < len; row++) {
            if (priv.cellSettings[row]) {
              spliceWith(priv.cellSettings[row], index, amount);
            }
          }

          if (delta) {
            if (Array.isArray(instance.getSettings().colHeaders)) {
              var spliceArray = [index, 0];
              spliceArray.length += delta; // inserts empty (undefined) elements at the end of an array
              Array.prototype.splice.apply(instance.getSettings().colHeaders, spliceArray); // inserts empty (undefined) elements into the colHeader array
            }

            if (selection.isSelected() && priv.selRange.from.col >= index) {
              priv.selRange.from.col += delta;
              selection.transformEnd(0, delta); // will call render() internally
            } else {
              selection.refreshBorders(); // it will call render and prepare methods
            }
          }
          break;

        case 'remove_row':
          datamap.removeRow(index, amount, source);
          priv.cellSettings.splice(index, amount);

          var totalRows = instance.countRows();
          var fixedRowsTop = instance.getSettings().fixedRowsTop;
          if (fixedRowsTop >= index + 1) {
            instance.getSettings().fixedRowsTop -= Math.min(amount, fixedRowsTop - index);
          }

          var fixedRowsBottom = instance.getSettings().fixedRowsBottom;
          if (fixedRowsBottom && index >= totalRows - fixedRowsBottom) {
            instance.getSettings().fixedRowsBottom -= Math.min(amount, fixedRowsBottom);
          }

          grid.adjustRowsAndCols();
          selection.refreshBorders(); // it will call render and prepare methods
          break;

        case 'remove_col':
          let visualColumnIndex = recordTranslator.toPhysicalColumn(index);

          datamap.removeCol(index, amount, source);

          for (let row = 0, len = instance.countSourceRows(); row < len; row++) {
            if (priv.cellSettings[row]) { // if row hasn't been rendered it wouldn't have cellSettings
              priv.cellSettings[row].splice(visualColumnIndex, amount);
            }
          }
          var fixedColumnsLeft = instance.getSettings().fixedColumnsLeft;

          if (fixedColumnsLeft >= index + 1) {
            instance.getSettings().fixedColumnsLeft -= Math.min(amount, fixedColumnsLeft - index);
          }

          if (Array.isArray(instance.getSettings().colHeaders)) {
            if (typeof visualColumnIndex === 'undefined') {
              visualColumnIndex = -1;
            }
            instance.getSettings().colHeaders.splice(visualColumnIndex, amount);
          }

          grid.adjustRowsAndCols();
          selection.refreshBorders(); // it will call render and prepare methods

          break;
        default:
          throw new Error(`There is no such action "${action}"`);
      }

      if (!keepEmptyRows) {
        grid.adjustRowsAndCols(); // makes sure that we did not add rows that will be removed in next refresh
      }
    },

    /**
     * Makes sure there are empty rows at the bottom of the table
     */
    adjustRowsAndCols() {
      if (priv.settings.minRows) {
        // should I add empty rows to data source to meet minRows?
        let rows = instance.countRows();

        if (rows < priv.settings.minRows) {
          for (let r = 0, minRows = priv.settings.minRows; r < minRows - rows; r++) {
            datamap.createRow(instance.countRows(), 1, 'auto');
          }
        }
      }
      if (priv.settings.minSpareRows) {
        let emptyRows = instance.countEmptyRows(true);

        // should I add empty rows to meet minSpareRows?
        if (emptyRows < priv.settings.minSpareRows) {
          for (; emptyRows < priv.settings.minSpareRows && instance.countSourceRows() < priv.settings.maxRows; emptyRows++) {
            datamap.createRow(instance.countRows(), 1, 'auto');
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
            datamap.createCol(instance.countCols(), 1, 'auto');
          }
        }
        // should I add empty cols to meet minSpareCols?
        if (priv.settings.minSpareCols && !priv.settings.columns && instance.dataType === 'array' &&
            emptyCols < priv.settings.minSpareCols) {
          for (; emptyCols < priv.settings.minSpareCols && instance.countCols() < priv.settings.maxCols; emptyCols++) {
            datamap.createCol(instance.countCols(), 1, 'auto');
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
     * Populate the data from the provided 2d array from the given cell coordinates.
     *
     * @private
     * @param {Object} start Start selection position. Visual indexes.
     * @param {Array} input 2d data array.
     * @param {Object} [end] End selection position (only for drag-down mode). Visual indexes.
     * @param {String} [source="populateFromArray"] Source information string.
     * @param {String} [method="overwrite"] Populate method. Possible options: `shift_down`, `shift_right`, `overwrite`.
     * @param {String} direction (left|right|up|down) String specifying the direction.
     * @param {Array} deltas The deltas array. A difference between values of adjacent cells.
     *                       Useful **only** when the type of handled cells is `numeric`.
     * @returns {Object|undefined} ending td in pasted area (only if any cell was changed).
     */
    populateFromArray(start, input, end, source, method, direction, deltas) {
      // TODO: either remove or implement the `direction` argument. Currently it's not working at all.
      var r,
        rlen,
        c,
        clen,
        setData = [],
        current = {};

      rlen = input.length;

      if (rlen === 0) {
        return false;
      }

      var repeatCol,
        repeatRow,
        cmax,
        rmax,
        baseEnd = {
          row: end === null ? null : end.row,
          col: end === null ? null : end.col
        };

      /* eslint-disable no-case-declarations */
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
              instance.spliceCol(...input[c]);
            } else {
              input[c % clen][0] = start.col + c;
              instance.spliceCol(...input[c % clen]);
            }
          }
          break;

        case 'shift_right':
          repeatCol = end ? end.col - start.col + 1 : 0;
          repeatRow = end ? end.row - start.row + 1 : 0;
          for (r = 0, rlen = input.length, rmax = Math.max(rlen, repeatRow); r < rmax; r++) {
            if (r < rlen) {
              for (c = 0, clen = input[r].length; c < repeatCol - clen; c++) {
                input[r].push(input[r][c % clen]);
              }
              input[r].unshift(start.row + r, start.col, 0);
              instance.spliceRow(...input[r]);
            } else {
              input[r % rlen][0] = start.row + r;
              instance.spliceRow(...input[r % rlen]);
            }
          }
          break;

        case 'overwrite':
        default:
          // overwrite and other not specified options
          current.row = start.row;
          current.col = start.col;

          let selected = { // selected range
            row: (end && start) ? (end.row - start.row + 1) : 1,
            col: (end && start) ? (end.col - start.col + 1) : 1
          };
          let skippedRow = 0;
          let skippedColumn = 0;
          let pushData = true;
          let cellMeta;

          let getInputValue = function getInputValue(row, col = null) {
            let rowValue = input[row % input.length];

            if (col !== null) {
              return rowValue[col % rowValue.length];
            }

            return rowValue;
          };
          let rowInputLength = input.length;
          let rowSelectionLength = end ? end.row - start.row + 1 : 0;

          if (end) {
            rlen = rowSelectionLength;
          } else {
            rlen = Math.max(rowInputLength, rowSelectionLength);
          }
          for (r = 0; r < rlen; r++) {
            if ((end && current.row > end.row && rowSelectionLength > rowInputLength) ||
                (!priv.settings.allowInsertRow && current.row > instance.countRows() - 1) ||
                (current.row >= priv.settings.maxRows)) {
              break;
            }
            let visualRow = r - skippedRow;
            let colInputLength = getInputValue(visualRow).length;
            let colSelectionLength = end ? end.col - start.col + 1 : 0;

            if (end) {
              clen = colSelectionLength;
            } else {
              clen = Math.max(colInputLength, colSelectionLength);
            }
            current.col = start.col;
            cellMeta = instance.getCellMeta(current.row, current.col);

            if ((source === 'CopyPaste.paste' || source === 'Autofill.autofill') && cellMeta.skipRowOnPaste) {
              skippedRow++;
              current.row++;
              rlen++;
              /* eslint-disable no-continue */
              continue;
            }
            skippedColumn = 0;

            for (c = 0; c < clen; c++) {
              if ((end && current.col > end.col && colSelectionLength > colInputLength) ||
                  (!priv.settings.allowInsertColumn && current.col > instance.countCols() - 1) ||
                  (current.col >= priv.settings.maxCols)) {
                break;
              }
              cellMeta = instance.getCellMeta(current.row, current.col);

              if ((source === 'CopyPaste.paste' || source === 'Autofill.fill') && cellMeta.skipColumnOnPaste) {
                skippedColumn++;
                current.col++;
                clen++;
                continue;
              }
              if (cellMeta.readOnly) {
                current.col++;
                /* eslint-disable no-continue */
                continue;
              }
              let visualColumn = c - skippedColumn;
              let value = getInputValue(visualRow, visualColumn);
              let orgValue = instance.getDataAtCell(current.row, current.col);
              let index = {
                row: visualRow,
                col: visualColumn
              };

              if (source === 'Autofill.fill') {
                let result = instance.runHooks('beforeAutofillInsidePopulate', index, direction, input, deltas, {}, selected);

                if (result) {
                  value = isUndefined(result.value) ? value : result.value;
                }
              }
              if (value !== null && typeof value === 'object') {
                if (orgValue === null || typeof orgValue !== 'object') {
                  pushData = false;

                } else {
                  let orgValueSchema = duckSchema(orgValue[0] || orgValue);
                  let valueSchema = duckSchema(value[0] || value);

                  /* eslint-disable max-depth */
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
              current.col++;
            }
            current.row++;
          }
          instance.setDataAtCell(setData, null, null, source || 'populateFromArray');
          break;
      }
    },
  };

  /* eslint-disable no-multi-assign */
  this.selection = selection = { // this public assignment is only temporary
    inProgress: false,

    selectedHeader: {
      cols: false,
      rows: false,
    },

    /**
     * @param {Boolean} [rows=false]
     * @param {Boolean} [cols=false]
     * @param {Boolean} [corner=false]
     */
    setSelectedHeaders(rows = false, cols = false, corner = false) {
      instance.selection.selectedHeader.rows = rows;
      instance.selection.selectedHeader.cols = cols;
      instance.selection.selectedHeader.corner = corner;
    },

    /**
     * Sets inProgress to `true`. This enables onSelectionEnd and onSelectionEndByProp to function as desired.
     */
    begin() {
      instance.selection.inProgress = true;
    },

    /**
     * Sets inProgress to `false`. Triggers onSelectionEnd and onSelectionEndByProp.
     */
    finish() {
      var sel = instance.getSelected();
      instance.runHooks('afterSelectionEnd', sel[0], sel[1], sel[2], sel[3]);
      instance.runHooks('afterSelectionEndByProp', sel[0], instance.colToProp(sel[1]), sel[2], instance.colToProp(sel[3]));
      instance.selection.inProgress = false;
    },

    /**
     * @returns {Boolean}
     */
    isInProgress() {
      return instance.selection.inProgress;
    },

    /**
     * Starts selection range on given td object.
     *
     * @param {CellCoords} coords Visual coords.
     * @param keepEditorOpened
     */
    setRangeStart(coords, keepEditorOpened) {
      instance.runHooks('beforeSetRangeStart', coords);
      priv.selRange = new CellRange(coords, coords, coords);
      selection.setRangeEnd(coords, null, keepEditorOpened);
    },

    /**
     * Starts selection range on given td object.
     *
     * @param {CellCoords} coords Visual coords.
     * @param keepEditorOpened
     */
    setRangeStartOnly(coords) {
      instance.runHooks('beforeSetRangeStartOnly', coords);
      priv.selRange = new CellRange(coords, coords, coords);
    },

    /**
     * Ends selection range on given td object.
     *
     * @param {CellCoords} coords Visual coords.
     * @param {Boolean} [scrollToCell=true] If `true`, viewport will be scrolled to range end
     * @param {Boolean} [keepEditorOpened] If `true`, cell editor will be still opened after changing selection range
     */
    setRangeEnd(coords, scrollToCell, keepEditorOpened) {
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
        col: null,
      };

      // trigger handlers
      instance.runHooks('beforeSetRangeEnd', coords);
      instance.selection.begin();

      newRangeCoords.row = coords.row < 0 ? firstVisibleRow : coords.row;
      newRangeCoords.col = coords.col < 0 ? firstVisibleColumn : coords.col;

      priv.selRange.to = new CellCoords(newRangeCoords.row, newRangeCoords.col);

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
      if (priv.settings.currentHeaderClassName || priv.settings.currentRowClassName || priv.settings.currentColClassName) {
        instance.view.wt.selections.highlight.clear();
        instance.view.wt.selections.highlight.add(priv.selRange.from);
        instance.view.wt.selections.highlight.add(priv.selRange.to);
      }

      const preventScrolling = createObjectPropListener('value');

      // trigger handlers
      instance.runHooks('afterSelection',
        priv.selRange.from.row, priv.selRange.from.col, priv.selRange.to.row, priv.selRange.to.col, preventScrolling);
      instance.runHooks('afterSelectionByProp',
        priv.selRange.from.row, datamap.colToProp(priv.selRange.from.col), priv.selRange.to.row, datamap.colToProp(priv.selRange.to.col), preventScrolling);

      if ((priv.selRange.from.row === 0 && priv.selRange.to.row === instance.countRows() - 1 && instance.countRows() > 1) ||
        (priv.selRange.from.col === 0 && priv.selRange.to.col === instance.countCols() - 1 && instance.countCols() > 1)) {
        isHeaderSelected = true;
      }

      if (coords.row < 0 || coords.col < 0) {
        areCoordsPositive = false;
      }

      if (preventScrolling.isTouched()) {
        scrollToCell = !preventScrolling.value;
      }

      if (scrollToCell !== false && !isHeaderSelected && areCoordsPositive) {
        if (priv.selRange.from && !selection.isMultiple()) {
          instance.view.scrollViewport(priv.selRange.from);
        } else {
          instance.view.scrollViewport(coords);
        }
      }

      if (selection.selectedHeader.rows && selection.selectedHeader.cols) {
        addClass(instance.rootElement, ['ht__selection--rows', 'ht__selection--columns']);

      } else if (selection.selectedHeader.rows) {
        removeClass(instance.rootElement, 'ht__selection--columns');
        addClass(instance.rootElement, 'ht__selection--rows');

      } else if (selection.selectedHeader.cols) {
        removeClass(instance.rootElement, 'ht__selection--rows');
        addClass(instance.rootElement, 'ht__selection--columns');

      } else {
        removeClass(instance.rootElement, ['ht__selection--rows', 'ht__selection--columns']);
      }

      selection.refreshBorders(null, keepEditorOpened);
    },

    /**
     * Destroys editor, redraws borders around cells, prepares editor.
     *
     * @param {Boolean} [revertOriginal]
     * @param {Boolean} [keepEditor]
     */
    refreshBorders(revertOriginal, keepEditor) {
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
    isMultiple() {
      var
        isMultiple = !(priv.selRange.to.col === priv.selRange.from.col && priv.selRange.to.row === priv.selRange.from.row),
        modifier = instance.runHooks('afterIsMultipleSelection', isMultiple);

      if (isMultiple) {
        return modifier;
      }
    },

    /**
     * Selects cell relative to current cell (if possible).
     */
    transformStart(rowDelta, colDelta, force, keepEditorOpened) {
      var delta = new CellCoords(rowDelta, colDelta),
        rowTransformDir = 0,
        colTransformDir = 0,
        totalRows,
        totalCols,
        coords,
        fixedRowsBottom;

      instance.runHooks('modifyTransformStart', delta);
      totalRows = instance.countRows();
      totalCols = instance.countCols();
      fixedRowsBottom = instance.getSettings().fixedRowsBottom;

      if (priv.selRange.highlight.row + rowDelta > totalRows - 1) {
        if (force && priv.settings.minSpareRows > 0 && !(fixedRowsBottom && priv.selRange.highlight.row >= totalRows - fixedRowsBottom - 1)) {
          instance.alter('insert_row', totalRows);
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
          instance.alter('insert_col', totalCols);
          totalCols = instance.countCols();

        } else if (priv.settings.autoWrapRow) {
          delta.row = priv.selRange.highlight.row + delta.row == totalRows - 1 ? 1 - totalRows : 1;
          delta.col = 1 - totalCols;
        }
      } else if (priv.settings.autoWrapRow && priv.selRange.highlight.col + delta.col < 0 && priv.selRange.highlight.row + delta.row >= 0) {
        delta.row = priv.selRange.highlight.row + delta.row == 0 ? totalRows - 1 : -1;
        delta.col = totalCols - 1;
      }

      coords = new CellCoords(priv.selRange.highlight.row + delta.row, priv.selRange.highlight.col + delta.col);

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
    transformEnd(rowDelta, colDelta) {
      var delta = new CellCoords(rowDelta, colDelta),
        rowTransformDir = 0,
        colTransformDir = 0,
        totalRows,
        totalCols,
        coords;

      instance.runHooks('modifyTransformEnd', delta);

      totalRows = instance.countRows();
      totalCols = instance.countCols();
      coords = new CellCoords(priv.selRange.to.row + delta.row, priv.selRange.to.col + delta.col);

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
    isSelected() {
      return (priv.selRange !== null);
    },

    /**
     * Returns `true` if coords is within current selection coords.
     *
     * @param {CellCoords} coords
     * @returns {Boolean}
     */
    inInSelection(coords) {
      if (!selection.isSelected()) {
        return false;
      }

      return priv.selRange.includes(coords);
    },

    /**
     * Deselects all selected cells
     */
    deselect() {
      if (!selection.isSelected()) {
        return;
      }
      instance.selection.inProgress = false; // needed by HT inception
      priv.selRange = null;
      instance.view.wt.selections.current.clear();
      instance.view.wt.selections.area.clear();
      if (priv.settings.currentHeaderClassName || priv.settings.currentRowClassName || priv.settings.currentColClassName) {
        instance.view.wt.selections.highlight.clear();
      }
      editorManager.destroyEditor();
      selection.refreshBorders();
      removeClass(instance.rootElement, ['ht__selection--rows', 'ht__selection--columns']);
      instance.runHooks('afterDeselect');
    },

    /**
     * Select all cells
     */
    selectAll() {
      if (!priv.settings.multiSelect) {
        return;
      }
      selection.setSelectedHeaders(true, true, true);
      selection.setRangeStart(new CellCoords(0, 0));
      selection.setRangeEnd(new CellCoords(instance.countRows() - 1, instance.countCols() - 1), false);
    },

    /**
     * Deletes data from selected cells
     */
    empty() {
      if (!selection.isSelected()) {
        return;
      }
      var topLeft = priv.selRange.getTopLeftCorner();
      var bottomRight = priv.selRange.getBottomRightCorner();
      var r,
        c,
        changes = [];

      for (r = topLeft.row; r <= bottomRight.row; r++) {
        for (c = topLeft.col; c <= bottomRight.col; c++) {
          if (!instance.getCellMeta(r, c).readOnly) {
            changes.push([r, c, '']);
          }
        }
      }
      instance.setDataAtCell(changes);
    },
  };

  this.init = function() {
    dataSource.setData(priv.settings.data);
    instance.runHooks('beforeInit');

    if (isMobileBrowser()) {
      addClass(instance.rootElement, 'mobile');
    }

    this.updateSettings(priv.settings, true);

    this.view = new TableView(this);
    editorManager = new EditorManager(instance, priv, selection, datamap);

    this.forceFullRender = true; // used when data was changed

    instance.runHooks('init');
    this.view.render();

    if (typeof priv.firstRun === 'object') {
      instance.runHooks('afterChange', priv.firstRun[0], priv.firstRun[1]);
      priv.firstRun = false;
    }
    instance.runHooks('afterInit');
  };

  function ValidatorsQueue() { // moved this one level up so it can be used in any function here. Probably this should be moved to a separate file
    var resolved = false;

    return {
      validatorsInQueue: 0,
      valid: true,
      addValidatorToQueue() {
        this.validatorsInQueue++;
        resolved = false;
      },
      removeValidatorFormQueue() {
        this.validatorsInQueue = this.validatorsInQueue - 1 < 0 ? 0 : this.validatorsInQueue - 1;
        this.checkIfQueueIsEmpty();
      },
      onQueueEmpty(valid) {
      },
      checkIfQueueIsEmpty() {
        if (this.validatorsInQueue == 0 && resolved == false) {
          resolved = true;
          this.onQueueEmpty(this.valid);
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
      } else {
        var row = changes[i][0];
        var col = datamap.propToCol(changes[i][1]);

        var cellProperties = instance.getCellMeta(row, col);

        if (cellProperties.type === 'numeric' && typeof changes[i][3] === 'string') {
          if (changes[i][3].length > 0 && (/^-?[\d\s]*(\.|,)?\d*$/.test(changes[i][3]) || cellProperties.format)) {
            var len = changes[i][3].length;

            if (isUndefined(cellProperties.language)) {
              numbro.culture('en-US');

            } else if (changes[i][3].indexOf('.') === len - 3 && changes[i][3].indexOf(',') === -1) {
              // this input in format XXXX.XX is likely to come from paste. Let's parse it using international rules
              numbro.culture('en-US');
            } else {

              numbro.culture(cellProperties.language);
            }

            const {delimiters} = numbro.cultureData(numbro.culture());

            // try to parse to float - https://github.com/foretagsplatsen/numbro/pull/183
            if (numbro.validate(changes[i][3]) && !isNaN(changes[i][3])) {
              changes[i][3] = parseFloat(changes[i][3]);

            } else {
              changes[i][3] = numbro().unformat(changes[i][3]) || changes[i][3];
            }
          }
        }

        /* eslint-disable no-loop-func */
        if (instance.getCellValidator(cellProperties)) {
          waitingForValidator.addValidatorToQueue();
          instance.validateCell(changes[i][3], cellProperties, (function(i, cellProperties) {
            return function(result) {
              if (typeof result !== 'boolean') {
                throw new Error('Validation error: result is not boolean');
              }
              if (result === false && cellProperties.allowInvalid === false) {
                changes.splice(i, 1); // cancel the change
                cellProperties.valid = true; // we cancelled the change, so cell value is still valid
                const cell = instance.getCell(cellProperties.row, cellProperties.col);
                removeClass(cell, instance.getSettings().invalidCellClassName);
                --i;
              }
              waitingForValidator.removeValidatorFormQueue();
            };
          }(i, cellProperties)), source);
        }
      }
    }
    waitingForValidator.checkIfQueueIsEmpty();

    function resolve() {
      var beforeChangeResult;

      if (changes.length) {
        beforeChangeResult = instance.runHooks('beforeChange', changes, source);
        if (isFunction(beforeChangeResult)) {
          console.warn('Your beforeChange callback returns a function. It\'s not supported since Handsontable 0.12.1 (and the returned function will not be executed).');
        } else if (beforeChangeResult === false) {
          changes.splice(0, changes.length); // invalidate all changes (remove everything from array)
        }
      }
      callback(); // called when async validators are resolved and beforeChange was not async
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
    let i = changes.length - 1;

    if (i < 0) {
      return;
    }

    for (; i >= 0; i--) {
      let skipThisChange = false;

      if (changes[i] === null) {
        changes.splice(i, 1);
        /* eslint-disable no-continue */
        continue;
      }

      if (changes[i][2] == null && changes[i][3] == null) {
        /* eslint-disable no-continue */
        continue;
      }

      if (priv.settings.allowInsertRow) {
        while (changes[i][0] > instance.countRows() - 1) {
          let numberOfCreatedRows = datamap.createRow(void 0, void 0, source);

          if (numberOfCreatedRows === 0) {
            skipThisChange = true;
            break;
          }
        }
      }

      if (skipThisChange) {
        /* eslint-disable no-continue */
        continue;
      }

      if (instance.dataType === 'array' && (!priv.settings.columns || priv.settings.columns.length === 0) && priv.settings.allowInsertColumn) {
        while (datamap.propToCol(changes[i][1]) > instance.countCols() - 1) {
          datamap.createCol(void 0, void 0, source);
        }
      }

      datamap.set(changes[i][0], changes[i][1], changes[i][3]);
    }

    instance.forceFullRender = true; // used when data was changed
    grid.adjustRowsAndCols();
    instance.runHooks('beforeChangeRender', changes, source);
    selection.refreshBorders(null, true);
    instance.view.wt.wtOverlays.adjustElementsSize();
    instance.runHooks('afterChange', changes, source || 'edit');

    let activeEditor = instance.getActiveEditor();

    if (activeEditor && isDefined(activeEditor.refreshValue)) {
      activeEditor.refreshValue();
    }
  }

  this.validateCell = function(value, cellProperties, callback, source) {
    var validator = instance.getCellValidator(cellProperties);

    function done(valid) {
      var col = cellProperties.visualCol,
        row = cellProperties.visualRow,
        td = instance.getCell(row, col, true);

      if (td && td.nodeName != 'TH') {
        instance.view.wt.wtSettings.settings.cellRenderer(row, col, td);
      }
      callback(valid);
    }

    if (isRegExp(validator)) {
      validator = (function(validator) {
        return function(value, callback) {
          callback(validator.test(value));
        };
      }(validator));
    }

    if (isFunction(validator)) {

      value = instance.runHooks('beforeValidate', value, cellProperties.visualRow, cellProperties.prop, source);

      // To provide consistent behaviour, validation should be always asynchronous
      instance._registerTimeout(setTimeout(() => {
        validator.call(cellProperties, value, (valid) => {
          valid = instance.runHooks('afterValidate', valid, value, cellProperties.visualRow, cellProperties.prop, source);
          cellProperties.valid = valid;

          done(valid);
          instance.runHooks('postAfterValidate', valid, value, cellProperties.visualRow, cellProperties.prop, source);
        });
      }, 0));

    } else {
      // resolve callback even if validator function was not found
      instance._registerTimeout(setTimeout(() => {
        cellProperties.valid = true;
        done(cellProperties.valid);
      }, 0));
    }
  };

  function setDataInputToArray(row, propOrCol, value) {
    if (typeof row === 'object') { // is it an array of changes
      return row;
    }
    return [
      [row, propOrCol, value]
    ];
  }

  /**
   * @description
   * Set new value to a cell. To change many cells at once, pass an array of `changes` in format `[[row, col, value], ...]` as
   * the only parameter. `col` is the index of a __visible__ column (note that if columns were reordered,
   * the current visible order will be used). `source` is a flag for before/afterChange events. If you pass only array of
   * changes then `source` could be set as second parameter.
   *
   * @memberof Core#
   * @function setDataAtCell
   * @param {Number|Array} row Visual row index or array of changes in format `[[row, col, value], ...]`.
   * @param {Number} col Visual column index.
   * @param {String} value New value.
   * @param {String} [source] String that identifies how this change will be described in the changes array (useful in onAfterChange or onBeforeChange callback).
   */
  this.setDataAtCell = function(row, col, value, source) {
    var
      input = setDataInputToArray(row, col, value),
      i,
      ilen,
      changes = [],
      prop;

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
        dataSource.getAtCell(recordTranslator.toPhysicalRow(input[i][0]), input[i][1]),
        input[i][2],
      ]);
    }

    if (!source && typeof row === 'object') {
      source = col;
    }

    instance.runHooks('afterSetDataAtCell', changes, source);

    validateChanges(changes, source, () => {
      applyChanges(changes, source);
    });
  };

  /**
   * @description
   * Set new value to a cell. To change many cells at once, pass an array of `changes` in format `[[row, prop, value], ...]` as
   * the only parameter. `prop` is the name of the object property (e.g. `first.name`). `source` is a flag for before/afterChange events.
   * If you pass only array of changes then `source` could be set as second parameter.
   *
   * @memberof Core#
   * @function setDataAtRowProp
   * @param {Number|Array} row Visual row index or array of changes in format `[[row, prop, value], ...]`.
   * @param {String} prop Property name or the source string.
   * @param {String} value Value to be set.
   * @param {String} [source] String that identifies how this change will be described in changes array (useful in onChange callback).
   */
  this.setDataAtRowProp = function(row, prop, value, source) {
    var input = setDataInputToArray(row, prop, value),
      i,
      ilen,
      changes = [];

    for (i = 0, ilen = input.length; i < ilen; i++) {
      changes.push([
        input[i][0],
        input[i][1],
        dataSource.getAtCell(recordTranslator.toPhysicalRow(input[i][0]), input[i][1]),
        input[i][2],
      ]);
    }

    if (!source && typeof row === 'object') {
      source = prop;
    }

    instance.runHooks('afterSetDataAtRowProp', changes, source);

    validateChanges(changes, source, () => {
      applyChanges(changes, source);
    });
  };

  /**
   * Listen to the keyboard input on document body.
   *
   * @memberof Core#
   * @function listen
   * @since 0.11
   */
  this.listen = function() {
    let invalidActiveElement = !document.activeElement || (document.activeElement && document.activeElement.nodeName === void 0);

    if (document.activeElement && document.activeElement !== document.body && !invalidActiveElement) {
      document.activeElement.blur();

    } else if (invalidActiveElement) { // IE
      document.body.focus();
    }

    activeGuid = instance.guid;
  };

  /**
   * Stop listening to keyboard input on the document body.
   *
   * @memberof Core#
   * @function unlisten
   * @since 0.11
   */
  this.unlisten = function() {
    if (this.isListening()) {
      activeGuid = null;
    }
  };

  /**
   * Returns `true` if the current Handsontable instance is listening to keyboard input on document body.
   *
   * @memberof Core#
   * @function isListening
   * @since 0.11
   * @returns {Boolean} `true` if the instance is listening, `false` otherwise.
   */
  this.isListening = function() {
    return activeGuid === instance.guid;
  };

  /**
   * Destroys the current editor, renders and selects the current cell.
   *
   * @memberof Core#
   * @function destroyEditor
   * @param {Boolean} [revertOriginal] If != `true`, edited data is saved. Otherwise the previous value is restored.
   */
  this.destroyEditor = function(revertOriginal) {
    selection.refreshBorders(revertOriginal);
  };

  /**
   * Populate cells at position with 2D input array (e.g. `[[1, 2], [3, 4]]`).
   * Use `endRow`, `endCol` when you want to cut input when a certain row is reached.
   * Optional `source` parameter (default value "populateFromArray") is used to identify this call in the resulting events (beforeChange, afterChange).
   * Optional `populateMethod` parameter (default value "overwrite", possible values "shift_down" and "shift_right")
   * has the same effect as pasteMode option {@link Options#pasteMode}
   *
   * @memberof Core#
   * @function populateFromArray
   * @since 0.9.0
   * @param {Number} row Start visual row index.
   * @param {Number} col Start visual column index.
   * @param {Array} input 2d array
   * @param {Number} [endRow] End visual row index (use when you want to cut input when certain row is reached).
   * @param {Number} [endCol] End visual column index (use when you want to cut input when certain column is reached).
   * @param {String} [source="populateFromArray"] Source string.
   * @param {String} [method="overwrite"] Populate method. Possible options: `shift_down`, `shift_right`, `overwrite`.
   * @param {String} direction Populate direction. (left|right|up|down)
   * @param {Array} deltas Deltas array.
   * @returns {Object|undefined} The ending TD element in pasted area (only if any cells were changed).
   */
  this.populateFromArray = function(row, col, input, endRow, endCol, source, method, direction, deltas) {
    var c;

    if (!(typeof input === 'object' && typeof input[0] === 'object')) {
      throw new Error('populateFromArray parameter `input` must be an array of arrays'); // API changed in 0.9-beta2, let's check if you use it correctly
    }
    c = typeof endRow === 'number' ? new CellCoords(endRow, endCol) : null;

    return grid.populateFromArray(new CellCoords(row, col), input, c, source, method, direction, deltas);
  };

  /**
   * Adds/removes data from the column. This function is modelled after Array.splice.
   * Parameter `col` is the index of the column in which do you want to do splice.
   * Parameter `index` is the row index at which to start changing the array.
   * If negative, will begin that many elements from the end. Parameter `amount`, is the number of the old array elements to remove.
   * If the amount is 0, no elements are removed. Fourth and further parameters are the `elements` to add to the array.
   * If you don't specify any elements, spliceCol simply removes elements from the array.
   * {@link DataMap#spliceCol}
   *
   * @memberof Core#
   * @function spliceCol
   * @since 0.9-beta2
   * @param {Number} col Index of the column in which do you want to do splice.
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end.
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed.
   * @param {*} [elements] The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array.
   */
  this.spliceCol = function(col, index, amount/* , elements... */) {
    return datamap.spliceCol(...arguments);
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
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end.
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed.
   * @param {*} [elements] The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array.
   */
  this.spliceRow = function(row, index, amount/* , elements... */) {
    return datamap.spliceRow(...arguments);
  };

  /**
   * Returns indexes of the currently selected cells as an array `[startRow, startCol, endRow, endCol]`.
   *
   * Start row and start col are the coordinates of the active cell (where the selection was started).
   *
   * @memberof Core#
   * @function getSelected
   * @returns {Array} Array of the selection's indexes.
   */
  this.getSelected = function() { // https://github.com/handsontable/handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return [priv.selRange.from.row, priv.selRange.from.col, priv.selRange.to.row, priv.selRange.to.col];
    }
  };

  /**
   * Returns the current selection as a CellRange object.
   *
   * @memberof Core#
   * @function getSelectedRange
   * @since 0.11
   * @returns {CellRange} Selected range object or undefined` if there is no selection.
   */
  this.getSelectedRange = function() { // https://github.com/handsontable/handsontable/issues/44  //cjl
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
      instance.forceFullRender = true; // used when data was changed
      selection.refreshBorders(null, true);
    }
  };

  /**
   * Reset all cells in the grid to contain data from the data array.
   *
   * @memberof Core#
   * @function loadData
   * @param {Array} data Array of arrays or array of objects containing data.
   * @fires Hooks#afterLoadData
   * @fires Hooks#afterChange
   */
  this.loadData = function(data) {
    if (Array.isArray(priv.settings.dataSchema)) {
      instance.dataType = 'array';
    } else if (isFunction(priv.settings.dataSchema)) {
      instance.dataType = 'function';
    } else {
      instance.dataType = 'object';
    }

    if (datamap) {
      datamap.destroy();
    }
    datamap = new DataMap(instance, priv, GridSettings);

    if (typeof data === 'object' && data !== null) {
      if (!(data.push && data.splice)) { // check if data is array. Must use duck-type check so Backbone Collections also pass it
        // when data is not an array, attempt to make a single-row array of it
        data = [data];
      }

    } else if (data === null) {
      data = [];
      var row;
      var r = 0;
      var rlen = 0;
      var dataSchema = datamap.getSchema();

      for (r = 0, rlen = priv.settings.startRows; r < rlen; r++) {
        if ((instance.dataType === 'object' || instance.dataType === 'function') && priv.settings.dataSchema) {
          row = deepClone(dataSchema);
          data.push(row);

        } else if (instance.dataType === 'array') {
          row = deepClone(dataSchema[0]);
          data.push(row);

        } else {
          row = [];

          for (var c = 0, clen = priv.settings.startCols; c < clen; c++) {
            row.push(null);
          }

          data.push(row);
        }
      }

    } else {
      throw new Error(`loadData only accepts array of objects or array of arrays (${typeof data} given)`);
    }

    priv.isPopulated = false;
    GridSettings.prototype.data = data;

    if (Array.isArray(data[0])) {
      instance.dataType = 'array';
    }

    datamap.dataSource = data;
    dataSource.data = data;
    dataSource.dataType = instance.dataType;
    dataSource.colToProp = datamap.colToProp.bind(datamap);
    dataSource.propToCol = datamap.propToCol.bind(datamap);

    clearCellSettingCache();

    grid.adjustRowsAndCols();
    instance.runHooks('afterLoadData', priv.firstRun);

    if (priv.firstRun) {
      priv.firstRun = [null, 'loadData'];
    } else {
      instance.runHooks('afterChange', null, 'loadData');
      instance.render();
    }
    priv.isPopulated = true;

    function clearCellSettingCache() {
      priv.cellSettings.length = 0;
    }
  };

  /**
   * Returns the current data object (the same one that was passed by `data` configuration option or `loadData` method,
   * unless the `modifyRow` hook was used to trim some of the rows. If that's the case - use the {@link Core#getSourceData} method.).
   * Optionally you can provide cell range by defining `row`, `col`, `row2`, `col2` to get only a fragment of grid data.
   *
   * Note: getData functionality changed with the release of version 0.20. If you're looking for the previous functionality,
   * you should use the {@link Core#getSourceData} method.
   *
   * @memberof Core#
   * @function getData
   * @param {Number} [r] From visual row index.
   * @param {Number} [c] From visual column index.
   * @param {Number} [r2] To visual row index.
   * @param {Number} [c2] To visual column index.
   * @returns {Array} Array with the data.
   */
  this.getData = function(r, c, r2, c2) {
    if (isUndefined(r)) {
      return datamap.getAll();
    }
    return datamap.getRange(new CellCoords(r, c), new CellCoords(r2, c2), datamap.DESTINATION_RENDERER);

  };

  /**
   * Returns a string value of the selected range. Each column is separated by tab, each row is separated by a new line character.
   * {@link DataMap#getCopyableText}
   *
   * @memberof Core#
   * @function getCopyableText
   * @since 0.11
   * @param {Number} startRow From visual row index.
   * @param {Number} startCol From visual column index.
   * @param {Number} endRow To visual row index.
   * @param {Number} endCol To visual column index.
   * @returns {String}
   */
  this.getCopyableText = function(startRow, startCol, endRow, endCol) {
    return datamap.getCopyableText(new CellCoords(startRow, startCol), new CellCoords(endRow, endCol));
  };

  /**
   * Returns the data's copyable value at specified row and column index ({@link DataMap#getCopyable}).
   *
   * @memberof Core#
   * @function getCopyableData
   * @since 0.19.0
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @returns {String}
   */
  this.getCopyableData = function(row, column) {
    return datamap.getCopyable(row, datamap.colToProp(column));
  };

  /**
   * Returns schema provided by constructor settings. If it doesn't exist then it returns the schema based on the data
   * structure in the first row.
   *
   * @memberof Core#
   * @function getSchema
   * @since 0.13.2
   * @returns {Object} Schema object.
   */
  this.getSchema = function() {
    return datamap.getSchema();
  };

  /**
   * Use it if you need to change configuration after initialization. The `settings` parameter is an object containing the new
   * settings, declared the same way as in the initial settings object.
   * Note, that although the `updateSettings` method doesn't overwrite the previously declared settings, it might reset
   * the settings made post-initialization. (for example - ignore changes made using the columnResize feature).
   *
   * @memberof Core#
   * @function updateSettings
   * @param {Object} settings New settings object.
   * @param {Boolean} init Calls this method in the initialization mode. Internal use only.
   *                       Used by API could be cause of the unexpected behaviour of the Handsontable.
   * @example
   * ```js
   * hot.updateSettings({
   *    contextMenu: true,
   *    colHeaders: true,
   *    fixedRowsTop: 2
   * });
   * ```
   * @fires Hooks#afterCellMetaReset
   * @fires Hooks#afterUpdateSettings
   */
  this.updateSettings = function(settings, init) {
    let columnsAsFunc = false;
    let i;
    let j;
    let clen;

    if (isDefined(settings.rows)) {
      throw new Error('"rows" setting is no longer supported. do you mean startRows, minRows or maxRows?');
    }
    if (isDefined(settings.cols)) {
      throw new Error('"cols" setting is no longer supported. do you mean startCols, minCols or maxCols?');
    }

    for (i in settings) {
      if (i === 'data') {
        /* eslint-disable no-continue */
        continue; // loadData will be triggered later

      } else if (Hooks.getSingleton().getRegistered().indexOf(i) > -1) {
        if (isFunction(settings[i]) || Array.isArray(settings[i])) {
          settings[i].initialHook = true;
          instance.addHook(i, settings[i]);
        }

      } else if (!init && hasOwnProperty(settings, i)) { // Update settings
        GridSettings.prototype[i] = settings[i];
      }
    }

    // Load data or create data map
    if (settings.data === void 0 && priv.settings.data === void 0) {
      instance.loadData(null); // data source created just now

    } else if (settings.data !== void 0) {
      instance.loadData(settings.data); // data source given as option

    } else if (settings.columns !== void 0) {
      datamap.createMap();
    }

    clen = instance.countCols();

    const columnSetting = settings.columns || GridSettings.prototype.columns;

    // Init columns constructors configuration
    if (columnSetting && isFunction(columnSetting)) {
      clen = instance.countSourceCols();
      columnsAsFunc = true;
    }

    // Clear cellSettings cache
    if (settings.cell !== void 0 || settings.cells !== void 0 || settings.columns !== void 0) {
      priv.cellSettings.length = 0;
    }

    if (clen > 0) {
      let proto;
      let column;

      for (i = 0, j = 0; i < clen; i++) {
        if (columnsAsFunc && !columnSetting(i)) {
          /* eslint-disable no-continue */
          continue;
        }
        priv.columnSettings[j] = columnFactory(GridSettings, priv.columnsSettingConflicts);

        // shortcut for prototype
        proto = priv.columnSettings[j].prototype;

        // Use settings provided by user
        if (columnSetting) {
          if (columnsAsFunc) {
            column = columnSetting(i);

          } else {
            column = columnSetting[j];
          }

          if (column) {
            extend(proto, column);
            extend(proto, expandType(column));
          }
        }

        j++;
      }
    }

    if (isDefined(settings.cell)) {
      for (let key in settings.cell) {
        if (hasOwnProperty(settings.cell, key)) {
          let cell = settings.cell[key];

          instance.setCellMetaObject(cell.row, cell.col, cell);
        }
      }
    }

    instance.runHooks('afterCellMetaReset');

    if (isDefined(settings.className)) {
      if (GridSettings.prototype.className) {
        removeClass(instance.rootElement, GridSettings.prototype.className);
      }
      if (settings.className) {
        addClass(instance.rootElement, settings.className);
      }
    }

    let currentHeight = instance.rootElement.style.height;
    if (currentHeight !== '') {
      currentHeight = parseInt(instance.rootElement.style.height, 10);
    }

    let height = settings.height;
    if (isFunction(height)) {
      height = height();
    }

    if (init) {
      let initialStyle = instance.rootElement.getAttribute('style');

      if (initialStyle) {
        instance.rootElement.setAttribute('data-initialstyle', instance.rootElement.getAttribute('style'));
      }
    }

    if (height === null) {
      let initialStyle = instance.rootElement.getAttribute('data-initialstyle');

      if (initialStyle && (initialStyle.indexOf('height') > -1 || initialStyle.indexOf('overflow') > -1)) {
        instance.rootElement.setAttribute('style', initialStyle);

      } else {
        instance.rootElement.style.height = '';
        instance.rootElement.style.overflow = '';
      }

    } else if (height !== void 0) {
      instance.rootElement.style.height = `${height}px`;
      instance.rootElement.style.overflow = 'hidden';
    }

    if (typeof settings.width !== 'undefined') {
      var width = settings.width;

      if (isFunction(width)) {
        width = width();
      }

      instance.rootElement.style.width = `${width}px`;
    }

    if (!init) {
      datamap.clearLengthCache(); // force clear cache length on updateSettings() #3416

      if (instance.view) {
        instance.view.wt.wtViewport.resetHasOversizedColumnHeadersMarked();
      }

      instance.runHooks('afterUpdateSettings', settings);
    }

    grid.adjustRowsAndCols();
    if (instance.view && !priv.firstRun) {
      instance.forceFullRender = true; // used when data was changed
      selection.refreshBorders(null, true);
    }

    if (!init && instance.view && (currentHeight === '' || height === '' || height === void 0) && currentHeight !== height) {
      instance.view.wt.wtOverlays.updateMainScrollableElements();
    }
  };

  /**
   * Get value from the selected cell.
   *
   * @memberof Core#
   * @function getValue
   * @since 0.11
   * @returns {*} Value of selected cell.
   */
  this.getValue = function() {
    var sel = instance.getSelected();
    if (GridSettings.prototype.getValue) {
      if (isFunction(GridSettings.prototype.getValue)) {
        return GridSettings.prototype.getValue.call(instance);
      } else if (sel) {
        return instance.getData()[sel[0]][GridSettings.prototype.getValue];
      }
    } else if (sel) {
      return instance.getDataAtCell(sel[0], sel[1]);
    }
  };

  function expandType(obj) {
    if (!hasOwnProperty(obj, 'type')) {
      // ignore obj.prototype.type
      return;
    }

    var type,
      expandedType = {};

    if (typeof obj.type === 'object') {
      type = obj.type;
    } else if (typeof obj.type === 'string') {
      type = getCellType(obj.type);
    }

    for (var i in type) {
      if (hasOwnProperty(type, i) && !hasOwnProperty(obj, i)) {
        expandedType[i] = type[i];
      }
    }

    return expandedType;

  }

  /**
   * Returns the object settings.
   *
   * @memberof Core#
   * @function getSettings
   * @returns {Object} Object containing the current grid settings.
   */
  this.getSettings = function() {
    return priv.settings;
  };

  /**
   * Clears the data from the grid. (The table settings remain intact.)
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
   * @param {Number} index Visual index of the row/column before which the new row/column will be inserted/removed.
   * @param {Number} [amount = 1] Amound of rows/columns to be inserted/removed.
   * @param {String} [source] Source indicator.
   * @param {Boolean} [keepEmptyRows] Flag for preventing deletion of empty rows.
   * @description
   *
   * Allows altering the table structure by either inserting/removing rows or inserting/removing columns:
   *
   * Insert new row(s) above the row with a given `index`. If index is `null` or `undefined`, the new row will be
   * added after the last row.
   * ```js
   * var hot = new Handsontable(document.getElementById('example'));
   * hot.alter('insert_row', 10);
   * ```
   *
   * Insert new column(s) before the column with a given `index`. If index is `null` or `undefined`, the new column
   * will be added after the last column.
   * ```js
   * var hot = new Handsontable(document.getElementById('example'));
   * hot.alter('insert_col', 10);
   * ```
   *
   * Remove the row(s) at the given `index`.
   * ```js
   * var hot = new Handsontable(document.getElementById('example'));
   * hot.alter('remove_row', 10);
   * ```
   *
   * Remove the column(s) at the given `index`.
   * ```js
   * var hot = new Handsontable(document.getElementById('example'));
   * hot.alter('remove_col', 10);
   * ```
   */
  this.alter = function(action, index, amount, source, keepEmptyRows) {
    grid.alter(action, index, amount, source, keepEmptyRows);
  };

  /**
   * Returns a TD element for the given `row` and `col` arguments, if it is rendered on screen.
   * Returns `null` if the TD is not rendered on screen (probably because that part of the table is not visible).
   *
   * @memberof Core#
   * @function getCell
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @param {Boolean} topmost If set to true, it returns the TD element from the topmost overlay. For example,
   * if the wanted cell is in the range of fixed rows, it will return a TD element from the `top` overlay.
   * @returns {Element} The cell's TD element.
   */
  this.getCell = function(row, col, topmost) {
    return instance.view.getCellAtCoords(new CellCoords(row, col), topmost);
  };

  /**
   * Returns the coordinates of the cell, provided as a HTML Element.
   *
   * @memberof Core#
   * @function getCoords
   * @param {Element} elem The HTML Element representing the cell.
   * @returns {CellCoords} Visual coordinates object.
   */
  this.getCoords = function(elem) {
    return this.view.wt.wtTable.getCoords.call(this.view.wt.wtTable, elem);
  };

  /**
   * Returns the property name that corresponds with the given column index. {@link DataMap#colToProp}
   * If the data source is an array of arrays, it returns the columns index.
   *
   * @memberof Core#
   * @function colToProp
   * @param {Number} col Visual column index.
   * @returns {String|Number} Column property or physical column index.
   */
  this.colToProp = function(col) {
    return datamap.colToProp(col);
  };

  /**
   * Returns column index that corresponds with the given property. {@link DataMap#propToCol}
   *
   * @memberof Core#
   * @function propToCol
   * @param {String|Number} prop Property name or physical column index.
   * @returns {Number} Visual column index.
   */
  this.propToCol = function(prop) {
    return datamap.propToCol(prop);
  };

  /**
   * Translate physical row index into visual.
   *
   * @since 0.29.0
   * @memberof Core#
   * @function toVisualRow
   * @param {Number} row Physical row index.
   * @returns {Number} Returns visual row index.
   */
  this.toVisualRow = (row) => recordTranslator.toVisualRow(row);

  /**
   * Translate physical column index into visual.
   *
   * @since 0.29.0
   * @memberof Core#
   * @function toVisualColumn
   * @param {Number} column Physical column index.
   * @returns {Number} Returns visual column index.
   */
  this.toVisualColumn = (column) => recordTranslator.toVisualColumn(column);

  /**
   * Translate visual row index into physical.
   * If displayed rows order is different than the order of rows stored in memory (i.e. sorting is applied)
   * to retrieve valid physical row index you can use this method.
   *
   * @since 0.29.0
   * @memberof Core#
   * @function toPhysicalRow
   * @param {Number} row Visual row index.
   * @returns {Number} Returns physical row index.
   */
  this.toPhysicalRow = (row) => recordTranslator.toPhysicalRow(row);

  /**
   * Translate visual column index into physical.
   * If displayed columns order is different than the order of columns stored in memory (i.e. manual column move is applied)
   * to retrieve valid physical column index you can use this method.
   *
   * @since 0.29.0
   * @memberof Core#
   * @function toPhysicalColumn
   * @param {Number} column Visual column index.
   * @returns {Number} Returns physical column index.
   */
  this.toPhysicalColumn = (column) => recordTranslator.toPhysicalColumn(column);

  /**
   * @description
   * Returns the cell value at `row`, `col`. `row` and `col` are the __visible__ indexes (note, that if columns were reordered or sorted,
   * the currently visible order will be used).
   *
   * @memberof Core#
   * @function getDataAtCell
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @returns {String|Boolean|null} Data at cell.
   */
  this.getDataAtCell = function(row, col) {
    return datamap.get(row, datamap.colToProp(col));
  };

  /**
   * Return value at `row`, `prop`. (Uses {@link DataMap#get})
   *
   * @memberof Core#
   * @function getDataAtRowProp
   * @param {Number} row Visual row index.
   * @param {String} prop Property name.
   * @returns {*} Cell value.
   */
  this.getDataAtRowProp = function(row, prop) {
    return datamap.get(row, prop);
  };

  /**
   * @description
   * Returns array of column values from the data source. `col` is the __visible__ index of the column.
   * Note, that if columns were reordered or sorted, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataAtCol
   * @since 0.9-beta2
   * @param {Number} col Visual column index.
   * @returns {Array} Array of cell values.
   */
  this.getDataAtCol = function(col) {
    var out = [];
    return out.concat(...datamap.getRange(
      new CellCoords(0, col), new CellCoords(priv.settings.data.length - 1, col), datamap.DESTINATION_RENDERER));
  };

  /**
   * Given the object property name (e.g. `'first.name'`), returns an array of column's values from the data source.
   * You can also provide a column index as the first argument.
   *
   * @memberof Core#
   * @function getDataAtProp
   * @since 0.9-beta2
   * @param {String|Number} prop Property name / physical column index.
   * @returns {Array} Array of cell values.
   */
  // TODO: Getting data from `datamap` should work on visual indexes.
  this.getDataAtProp = function(prop) {
    var out = [],
      range;

    range = datamap.getRange(
      new CellCoords(0, datamap.propToCol(prop)),
      new CellCoords(priv.settings.data.length - 1, datamap.propToCol(prop)),
      datamap.DESTINATION_RENDERER);

    return out.concat(...range);
  };

  /**
   * Returns the source data object (the same that was passed by `data` configuration option or `loadData` method).
   * Optionally you can provide a cell range by using the `row`, `col`, `row2`, `col2` arguments, to get only a fragment of grid data.
   *
   * @memberof Core#
   * @function getSourceData
   * @since 0.20.0
   * @param {Number} [r] From physical row index.
   * @param {Number} [c] From physical column index (or visual index, if data type is an array of objects).
   * @param {Number} [r2] To physical row index.
   * @param {Number} [c2] To physical column index (or visual index, if data type is an array of objects).
   * @returns {Array} Array of grid data.
   */
  this.getSourceData = function(r, c, r2, c2) {
    let data;

    if (r === void 0) {
      data = dataSource.getData();
    } else {
      data = dataSource.getByRange(new CellCoords(r, c), new CellCoords(r2, c2));
    }

    return data;
  };

  /**
   * Returns the source data object as an arrays of arrays format even when source data was provided in another format.
   * Optionally you can provide a cell range by using the `row`, `col`, `row2`, `col2` arguments, to get only a fragment of grid data.
   *
   * @memberof Core#
   * @function getSourceDataArray
   * @since 0.28.0
   * @param {Number} [r] From physical row index.
   * @param {Number} [c] From physical column index (or visual index, if data type is an array of objects).
   * @param {Number} [r2] To physical row index.
   * @param {Number} [c2] To physical column index (or visual index, if data type is an array of objects).
   * @returns {Array} An array of arrays.
   */
  this.getSourceDataArray = function(r, c, r2, c2) {
    let data;

    if (r === void 0) {
      data = dataSource.getData(true);
    } else {
      data = dataSource.getByRange(new CellCoords(r, c), new CellCoords(r2, c2), true);
    }

    return data;
  };

  /**
   * Returns an array of column values from the data source. `col` is the index of the row in the data source.
   *
   * @memberof Core#
   * @function getSourceDataAtCol
   * @since 0.11.0-beta3
   * @param {Number} column Visual column index.
   * @returns {Array} Array of the column's cell values.
   */
  // TODO: Getting data from `sourceData` should work always on physical indexes.
  this.getSourceDataAtCol = function(column) {
    return dataSource.getAtColumn(column);
  };

  /**
   * Returns a single row of the data (array or object, depending on what you have). `row` is the index of the row in the data source.
   *
   * @memberof Core#
   * @function getSourceDataAtRow
   * @since 0.11.0-beta3
   * @param {Number} row Physical row index.
   * @returns {Array|Object} Single row of data.
   */
  this.getSourceDataAtRow = function(row) {
    return dataSource.getAtRow(row);
  };

  /**
   * Returns a single value from the data source.
   *
   * @memberof Core#
   * @function getSourceDataAtCell
   * @param {Number} row Physical row index.
   * @param {Number} column Visual column index.
   * @returns {*} Cell data.
   * @since 0.20.0
   */
  // TODO: Getting data from `sourceData` should work always on physical indexes.
  this.getSourceDataAtCell = function(row, column) {
    return dataSource.getAtCell(row, column);
  };

  /**
   * @description
   * Returns a single row of the data. The `row` argument is the __visible__ index of the row.
   *
   * @memberof Core#
   * @function getDataAtRow
   * @param {Number} row Visual row index.
   * @returns {Array} Array of row's cell data.
   * @since 0.9-beta2
   */
  this.getDataAtRow = function(row) {
    var data = datamap.getRange(new CellCoords(row, 0), new CellCoords(row, this.countCols() - 1), datamap.DESTINATION_RENDERER);

    return data[0] || [];
  };

  /**
   * @description
   * Returns a data type defined in the Handsontable settings under the `type` key ([Options#type](http://docs.handsontable.com/Options.html#type)).
   * If there are cells with different types in the selected range, it returns `'mixed'`.
   *
   * @since 0.18.1
   * @memberof Core#
   * @function getDataType
   * @param {Number} rowFrom From visual row index.
   * @param {Number} columnFrom From visual column index.
   * @param {Number} rowTo To visual row index.
   * @param {Number} columnTo To visual column index.
   * @returns {String} Cell type (e.q: `'mixed'`, `'text'`, `'numeric'`, `'autocomplete'`).
   */
  this.getDataType = function(rowFrom, columnFrom, rowTo, columnTo) {
    let previousType = null;
    let currentType = null;

    if (rowFrom === void 0) {
      rowFrom = 0;
      rowTo = this.countRows();
      columnFrom = 0;
      columnTo = this.countCols();
    }
    if (rowTo === void 0) {
      rowTo = rowFrom;
    }
    if (columnTo === void 0) {
      columnTo = columnFrom;
    }
    let type = 'mixed';

    rangeEach(Math.min(rowFrom, rowTo), Math.max(rowFrom, rowTo), (row) => {
      let isTypeEqual = true;

      rangeEach(Math.min(columnFrom, columnTo), Math.max(columnFrom, columnTo), (column) => {
        let cellType = this.getCellMeta(row, column);

        currentType = cellType.type;

        if (previousType) {
          isTypeEqual = previousType === currentType;
        } else {
          previousType = currentType;
        }

        return isTypeEqual;
      });
      type = isTypeEqual ? currentType : 'mixed';

      return isTypeEqual;
    });

    return type;
  };

  /**
   * Remove a property defined by the `key` argument from the cell meta object for the provided `row` and `col` coordinates.
   *
   * @memberof Core#
   * @function removeCellMeta
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @param {String} key Property name.
   * @fires Hooks#beforeRemoveCellMeta
   * @fires Hooks#afterRemoveCellMeta
   */
  this.removeCellMeta = function(row, col, key) {
    const [physicalRow, physicalColumn] = recordTranslator.toPhysical(row, col);
    let cachedValue = priv.cellSettings[physicalRow][physicalColumn][key];

    const hookResult = instance.runHooks('beforeRemoveCellMeta', row, col, key, cachedValue);

    if (hookResult !== false) {
      delete priv.cellSettings[physicalRow][physicalColumn][key];

      instance.runHooks('afterRemoveCellMeta', row, col, key, cachedValue);
    }

    cachedValue = null;
  };

  /**
   * Remove one or more rows from the cell meta object.
   *
   * @since 0.30.0
   * @param {Number} index An integer that specifies at what position to add/remove items, Use negative values to specify the position from the end of the array.
   * @param {Number} deleteAmount The number of items to be removed. If set to 0, no items will be removed.
   * @param {Array} items The new items to be added to the array.
   */
  this.spliceCellsMeta = function(index, deleteAmount, ...items) {
    priv.cellSettings.splice(index, deleteAmount, ...items);
  };

  /**
   * Set cell meta data object defined by `prop` to the corresponding params `row` and `col`.
   *
   * @memberof Core#
   * @function setCellMetaObject
   * @since 0.11
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @param {Object} prop Meta object.
   */
  this.setCellMetaObject = function(row, col, prop) {
    if (typeof prop === 'object') {
      for (var key in prop) {
        if (hasOwnProperty(prop, key)) {
          var value = prop[key];
          this.setCellMeta(row, col, key, value);
        }
      }
    }
  };

  /**
   * Sets a property defined by the `key` object to the meta object of a cell corresponding to params `row` and `col`.
   *
   * @memberof Core#
   * @function setCellMeta
   * @since 0.11
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @param {String} key Property name.
   * @param {String} val Property value.
   * @fires Hooks#afterSetCellMeta
   */
  this.setCellMeta = function(row, col, key, val) {
    const [physicalRow, physicalColumn] = recordTranslator.toPhysical(row, col);

    if (!priv.columnSettings[physicalColumn]) {
      priv.columnSettings[physicalColumn] = columnFactory(GridSettings, priv.columnsSettingConflicts);
    }

    if (!priv.cellSettings[physicalRow]) {
      priv.cellSettings[physicalRow] = [];
    }
    if (!priv.cellSettings[physicalRow][physicalColumn]) {
      priv.cellSettings[physicalRow][physicalColumn] = new priv.columnSettings[physicalColumn]();
    }
    priv.cellSettings[physicalRow][physicalColumn][key] = val;
    instance.runHooks('afterSetCellMeta', row, col, key, val);
  };

  /**
   * Get all the cells meta settings at least once generated in the table (in order of cell initialization).
   *
   * @since 0.19.0
   * @returns {Array} Returns Array of ColumnSettings object.
   */
  this.getCellsMeta = function() {
    return arrayFlatten(priv.cellSettings);
  };

  /**
   * Returns the cell properties object for the given `row` and `col` coordinates.
   *
   * @memberof Core#
   * @function getCellMeta
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @returns {Object} The cell properties object.
   * @fires Hooks#beforeGetCellMeta
   * @fires Hooks#afterGetCellMeta
   */
  this.getCellMeta = function(row, col) {
    const prop = datamap.colToProp(col);
    let cellProperties;

    const [physicalRow, physicalColumn] = recordTranslator.toPhysical(row, col);

    if (!priv.columnSettings[physicalColumn]) {
      priv.columnSettings[physicalColumn] = columnFactory(GridSettings, priv.columnsSettingConflicts);
    }

    if (!priv.cellSettings[physicalRow]) {
      priv.cellSettings[physicalRow] = [];
    }
    if (!priv.cellSettings[physicalRow][physicalColumn]) {
      priv.cellSettings[physicalRow][physicalColumn] = new priv.columnSettings[physicalColumn]();
    }

    cellProperties = priv.cellSettings[physicalRow][physicalColumn]; // retrieve cellProperties from cache

    cellProperties.row = physicalRow;
    cellProperties.col = physicalColumn;
    cellProperties.visualRow = row;
    cellProperties.visualCol = col;
    cellProperties.prop = prop;
    cellProperties.instance = instance;

    instance.runHooks('beforeGetCellMeta', row, col, cellProperties);
    extend(cellProperties, expandType(cellProperties)); // for `type` added in beforeGetCellMeta

    if (cellProperties.cells) {
      const settings = cellProperties.cells.call(cellProperties, physicalRow, physicalColumn, prop);

      if (settings) {
        extend(cellProperties, settings);
        extend(cellProperties, expandType(settings)); // for `type` added in cells
      }
    }

    instance.runHooks('afterGetCellMeta', row, col, cellProperties);

    return cellProperties;
  };

  /**
   * Returns a row off the cell meta array.
   *
   * @memberof Core#
   * @function getCellMetaAtRow
   * @since 0.30.0
   * @param {Number} row Physical index of the row to return cell meta for.
   * @returns {Array}
   */
  this.getCellMetaAtRow = function(row) {
    return priv.cellSettings[row];
  };

  /**
   * Checks if the data format and config allows user to modify the column structure.
   * @returns {boolean}
   */
  this.isColumnModificationAllowed = function() {
    return !(instance.dataType === 'object' || instance.getSettings().columns);
  };

  const rendererLookup = cellMethodLookupFactory('renderer');

  /**
   * Returns the cell renderer function by given `row` and `col` arguments.
   *
   * @memberof Core#
   * @function getCellRenderer
   * @since 0.11
   * @param {Number|Object} row Visual row index or cell meta object.
   * @param {Number} [col] Visual column index.
   * @returns {Function} The renderer function.
   */
  this.getCellRenderer = function(row, col) {
    return getRenderer(rendererLookup.call(this, row, col));
  };

  /**
   * Returns the cell editor by the provided `row` and `col` arguments.
   *
   * @memberof Core#
   * @function getCellEditor
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @returns {Object} The Editor object.
   */
  this.getCellEditor = cellMethodLookupFactory('editor');

  const validatorLookup = cellMethodLookupFactory('validator');

  /**
   * Returns the cell validator by `row` and `col`, provided a validator is defined. If not - it doesn't return anything.
   *
   * @memberof Core#
   * @function getCellValidator
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @returns {Function|RegExp|undefined} The validator function.
   */
  this.getCellValidator = function(row, col) {
    let validator = validatorLookup.call(this, row, col);

    if (typeof validator === 'string') {
      validator = getValidator(validator);
    }

    return validator;
  };

  /**
   * Validates all cells using their validator functions and calls callback when finished.
   *
   * If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it would equal `true`.
   *
   * @memberof Core#
   * @function validateCells
   * @param {Function} [callback] The callback function.
   */
  this.validateCells = function(callback) {
    var waitingForValidator = new ValidatorsQueue();

    if (callback) {
      waitingForValidator.onQueueEmpty = callback;
    }

    let i = instance.countRows() - 1;

    while (i >= 0) {
      let j = instance.countCols() - 1;

      while (j >= 0) {
        waitingForValidator.addValidatorToQueue();

        instance.validateCell(instance.getDataAtCell(i, j), instance.getCellMeta(i, j), (result) => {
          if (typeof result !== 'boolean') {
            throw new Error('Validation error: result is not boolean');
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
    waitingForValidator.checkIfQueueIsEmpty();
  };

  /**
   * Returns an array of row headers' values (if they are enabled). If param `row` was given, it returns the header of the given row as a string.
   *
   * @memberof Core#
   * @function getRowHeader
   * @param {Number} [row] Visual row index.
   * @fires Hooks#modifyRowHeader
   * @returns {Array|String} Array of header values / single header value.
   */
  this.getRowHeader = function(row) {
    let rowHeader = priv.settings.rowHeaders;

    if (row !== void 0) {
      row = instance.runHooks('modifyRowHeader', row);
    }
    if (row === void 0) {
      rowHeader = [];
      rangeEach(instance.countRows() - 1, (i) => {
        rowHeader.push(instance.getRowHeader(i));
      });

    } else if (Array.isArray(rowHeader) && rowHeader[row] !== void 0) {
      rowHeader = rowHeader[row];

    } else if (isFunction(rowHeader)) {
      rowHeader = rowHeader(row);

    } else if (rowHeader && typeof rowHeader !== 'string' && typeof rowHeader !== 'number') {
      rowHeader = row + 1;
    }

    return rowHeader;
  };

  /**
   * Returns information about if this table is configured to display row headers.
   *
   * @memberof Core#
   * @function hasRowHeaders
   * @returns {Boolean} `true` if the instance has the row headers enabled, `false` otherwise.
   * @since 0.11
   */
  this.hasRowHeaders = function() {
    return !!priv.settings.rowHeaders;
  };

  /**
   * Returns information about if this table is configured to display column headers.
   *
   * @memberof Core#
   * @function hasColHeaders
   * @since 0.11
   * @returns {Boolean} `True` if the instance has the column headers enabled, `false` otherwise.
   */
  this.hasColHeaders = function() {
    if (priv.settings.colHeaders !== void 0 && priv.settings.colHeaders !== null) { // Polymer has empty value = null
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
   * Returns an array of column headers (in string format, if they are enabled). If param `col` is given, it returns the header at the given column as a string.
   *
   * @memberof Core#
   * @function getColHeader
   * @param {Number} [col] Visual column index.
   * @fires Hooks#modifyColHeader
   * @returns {Array|String} The column header(s).
   */
  this.getColHeader = function(col) {
    let columnsAsFunc = priv.settings.columns && isFunction(priv.settings.columns);
    let result = priv.settings.colHeaders;

    col = instance.runHooks('modifyColHeader', col);

    if (col === void 0) {
      let out = [];
      let ilen = columnsAsFunc ? instance.countSourceCols() : instance.countCols();

      for (let i = 0; i < ilen; i++) {
        out.push(instance.getColHeader(i));
      }

      result = out;

    } else {
      let translateVisualIndexToColumns = function(col) {
        let arr = [];
        let columnsLen = instance.countSourceCols();
        let index = 0;

        for (; index < columnsLen; index++) {
          if (isFunction(instance.getSettings().columns) && instance.getSettings().columns(index)) {
            arr.push(index);
          }
        }

        return arr[col];
      };
      let baseCol = col;
      col = instance.runHooks('modifyCol', col);

      let prop = translateVisualIndexToColumns(col);

      if (priv.settings.columns && isFunction(priv.settings.columns) && priv.settings.columns(prop) && priv.settings.columns(prop).title) {
        result = priv.settings.columns(prop).title;

      } else if (priv.settings.columns && priv.settings.columns[col] && priv.settings.columns[col].title) {
        result = priv.settings.columns[col].title;

      } else if (Array.isArray(priv.settings.colHeaders) && priv.settings.colHeaders[col] !== void 0) {
        result = priv.settings.colHeaders[col];

      } else if (isFunction(priv.settings.colHeaders)) {
        result = priv.settings.colHeaders(col);

      } else if (priv.settings.colHeaders && typeof priv.settings.colHeaders !== 'string' && typeof priv.settings.colHeaders !== 'number') {
        result = spreadsheetColumnLabel(baseCol); // see #1458

      }
    }

    return result;
  };

  /**
   * Return column width from settings (no guessing). Private use intended.
   *
   * @private
   * @memberof Core#
   * @function _getColWidthFromSettings
   * @param {Number} col Visual col index.
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
        default:
          break;
      }
      if (typeof width === 'string') {
        width = parseInt(width, 10);
      }
    }

    return width;
  };

  /**
   * Returns the width of the requested column.
   *
   * @memberof Core#
   * @function getColWidth
   * @since 0.11
   * @param {Number} col Visual column index.
   * @returns {Number} Column width.
   * @fires Hooks#modifyColWidth
   */
  this.getColWidth = function(col) {
    let width = instance._getColWidthFromSettings(col);

    width = instance.runHooks('modifyColWidth', width, col);

    if (width === void 0) {
      width = ViewportColumnsCalculator.DEFAULT_WIDTH;
    }

    return width;
  };

  /**
   * Return row height from settings (no guessing). Private use intended.
   *
   * @private
   * @memberof Core#
   * @function _getRowHeightFromSettings
   * @param {Number} row Visual row index.
   * @returns {Number}
   */
  this._getRowHeightFromSettings = function(row) {
    // let cellProperties = instance.getCellMeta(row, 0);
    // let height = cellProperties.height;
    //
    // if (height === void 0 || height === priv.settings.height) {
    //  height = cellProperties.rowHeights;
    // }
    var height = priv.settings.rowHeights;

    if (height !== void 0 && height !== null) {
      switch (typeof height) {
        case 'object': // array
          height = height[row];
          break;

        case 'function':
          height = height(row);
          break;
        default:
          break;
      }
      if (typeof height === 'string') {
        height = parseInt(height, 10);
      }
    }

    return height;
  };

  /**
   * Returns the row height.
   *
   * @memberof Core#
   * @function getRowHeight
   * @since 0.11
   * @param {Number} row Visual row index.
   * @returns {Number} The given row's height.
   * @fires Hooks#modifyRowHeight
   */
  this.getRowHeight = function(row) {
    var height = instance._getRowHeightFromSettings(row);

    height = instance.runHooks('modifyRowHeight', height, row);

    return height;
  };

  /**
   * Returns the total number of rows in the data source.
   *
   * @memberof Core#
   * @function countSourceRows
   * @since 0.20.0
   * @returns {Number} Total number in rows in data source.
   */
  this.countSourceRows = function() {
    let sourceLength = instance.runHooks('modifySourceLength');
    return sourceLength || (instance.getSourceData() ? instance.getSourceData().length : 0);
  };

  /**
   * Returns the total number of columns in the data source.
   *
   * @memberof Core#
   * @function countSourceCols
   * @since 0.26.1
   * @returns {Number} Total number in columns in data source.
   */
  this.countSourceCols = function() {
    let len = 0;
    let obj = instance.getSourceData() && instance.getSourceData()[0] ? instance.getSourceData()[0] : [];

    if (isObject(obj)) {
      len = deepObjectSize(obj);

    } else {
      len = obj.length || 0;
    }

    return len;
  };

  /**
   * Returns the total number of rows in the grid.
   *
   * @memberof Core#
   * @function countRows
   * @returns {Number} Total number in rows the grid.
   */
  this.countRows = function() {
    return datamap.getLength();
  };

  /**
   * Returns the total number of columns in the grid.
   *
   * @memberof Core#
   * @function countCols
   * @returns {Number} Total number of columns.
   */
  this.countCols = function() {
    const maxCols = this.getSettings().maxCols;
    let dataHasLength = false;
    let dataLen = 0;

    if (instance.dataType === 'array') {
      dataHasLength = priv.settings.data && priv.settings.data[0] && priv.settings.data[0].length;
    }

    if (dataHasLength) {
      dataLen = priv.settings.data[0].length;
    }

    if (priv.settings.columns) {
      let columnsIsFunction = isFunction(priv.settings.columns);

      if (columnsIsFunction) {
        if (instance.dataType === 'array') {
          let columnLen = 0;

          for (let i = 0; i < dataLen; i++) {
            if (priv.settings.columns(i)) {
              columnLen++;
            }
          }

          dataLen = columnLen;
        } else if (instance.dataType === 'object' || instance.dataType === 'function') {
          dataLen = datamap.colToPropCache.length;
        }

      } else {
        dataLen = priv.settings.columns.length;
      }

    } else if (instance.dataType === 'object' || instance.dataType === 'function') {
      dataLen = datamap.colToPropCache.length;
    }

    return Math.min(maxCols, dataLen);
  };

  /**
   * Returns an visual index of the first rendered row.
   *
   * @memberof Core#
   * @function rowOffset
   * @returns {Number} Visual index of first rendered row.
   */
  this.rowOffset = function() {
    return instance.view.wt.wtTable.getFirstRenderedRow();
  };

  /**
   * Returns the visual index of the first rendered column.
   *
   * @memberof Core#
   * @function colOffset
   * @returns {Number} Visual index of the first visible column.
   */
  this.colOffset = function() {
    return instance.view.wt.wtTable.getFirstRenderedColumn();
  };

  /**
   * Returns the number of rendered rows (including rows partially or fully rendered outside viewport).
   *
   * @memberof Core#
   * @function countRenderedRows
   * @returns {Number} Returns -1 if table is not visible.
   */
  this.countRenderedRows = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getRenderedRowsCount() : -1;
  };

  /**
   * Returns the number of visible rows (rendered rows that fully fit inside viewport).
   *
   * @memberof Core#
   * @function countVisibleRows
   * @returns {Number} Number of visible rows or -1.
   */
  this.countVisibleRows = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getVisibleRowsCount() : -1;
  };

  /**
   * Returns the number of rendered columns (including columns partially or fully rendered outside viewport).
   *
   * @memberof Core#
   * @function countRenderedCols
   * @returns {Number} Returns -1 if table is not visible.
   */
  this.countRenderedCols = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getRenderedColumnsCount() : -1;
  };

  /**
   * Returns the number of visible columns. Returns -1 if table is not visible
   *
   * @memberof Core#
   * @function countVisibleCols
   * @return {Number} Number of visible columns or -1.
   */
  this.countVisibleCols = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getVisibleColumnsCount() : -1;
  };

  /**
   * Returns the number of empty rows. If the optional ending parameter is `true`, returns the
   * number of empty rows at the bottom of the table.
   *
   * @memberof Core#
   * @function countEmptyRows
   * @param {Boolean} [ending] If `true`, will only count empty rows at the end of the data source.
   * @returns {Number} Count empty rows
   * @fires Hooks#modifyRow
   */
  this.countEmptyRows = function(ending) {
    var i = instance.countRows() - 1,
      empty = 0,
      row;

    while (i >= 0) {
      row = instance.runHooks('modifyRow', i);

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
   * Returns the number of empty columns. If the optional ending parameter is `true`, returns the number of empty
   * columns at right hand edge of the table.
   *
   * @memberof Core#
   * @function countEmptyCols
   * @param {Boolean} [ending] If `true`, will only count empty columns at the end of the data source row.
   * @returns {Number} Count empty cols
   */
  this.countEmptyCols = function(ending) {
    if (instance.countRows() < 1) {
      return 0;
    }
    var i = instance.countCols() - 1,
      empty = 0;

    while (i >= 0) {
      if (instance.isEmptyCol(i)) {
        empty++;
      } else if (ending) {
        break;
      }
      i--;
    }

    return empty;
  };

  /**
   * Check if all cells in the row declared by the `row` argument are empty.
   *
   * @memberof Core#
   * @function isEmptyRow
   * @param {Number} row Row index.
   * @returns {Boolean} `true` if the row at the given `row` is empty, `false` otherwise.
   */
  this.isEmptyRow = function(row) {
    return priv.settings.isEmptyRow.call(instance, row);
  };

  /**
   * Check if all cells in the the column declared by the `col` argument are empty.
   *
   * @memberof Core#
   * @function isEmptyCol
   * @param {Number} col Column index.
   * @returns {Boolean} `true` if the column at the given `col` is empty, `false` otherwise.
   */
  this.isEmptyCol = function(col) {
    return priv.settings.isEmptyCol.call(instance, col);
  };

  /**
   * Select cell specified by `row` and `col` values or a range of cells finishing at `endRow`, `endCol`.
   * By default, viewport will be scrolled to selection.
   * After the `selectCell` method had finished, the instance will be listening to keyboard input on the document.
   *
   * @memberof Core#
   * @function selectCell
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @param {Number} [endRow] Visual end row index (if selecting a range).
   * @param {Number} [endCol] Visual end column index (if selecting a range).
   * @param {Boolean} [scrollToCell=true] If `true`, the viewport will be scrolled to the selection.
   * @param {Boolean} [changeListener=true] If `false`, Handsontable will not change keyboard events listener to himself.
   * @returns {Boolean} `true` if selection was successful, `false` otherwise.
   */
  this.selectCell = function(row, col, endRow, endCol, scrollToCell, changeListener) {
    var coords;

    changeListener = isUndefined(changeListener) || changeListener === true;

    if (typeof row !== 'number' || row < 0 || row >= instance.countRows()) {
      return false;
    }
    if (typeof col !== 'number' || col < 0 || col >= instance.countCols()) {
      return false;
    }
    if (isDefined(endRow)) {
      if (typeof endRow !== 'number' || endRow < 0 || endRow >= instance.countRows()) {
        return false;
      }
      if (typeof endCol !== 'number' || endCol < 0 || endCol >= instance.countCols()) {
        return false;
      }
    }
    coords = new CellCoords(row, col);
    priv.selRange = new CellRange(coords, coords, coords);

    if (changeListener) {
      instance.listen();
    }

    if (isUndefined(endRow)) {
      selection.setRangeEnd(priv.selRange.from, scrollToCell);

    } else {
      selection.setRangeEnd(new CellCoords(endRow, endCol), scrollToCell);
    }
    instance.selection.finish();

    return true;
  };

  /**
   * Select the cell specified by the `row` and `prop` arguments, or a range finishing at `endRow`, `endProp`.
   * By default, viewport will be scrolled to selection.
   *
   * @memberof Core#
   * @function selectCellByProp
   * @param {Number} row Visual row index.
   * @param {String} prop Property name.
   * @param {Number} [endRow] visual end row index (if selecting a range).
   * @param {String} [endProp] End property name (if selecting a range).
   * @param {Boolean} [scrollToCell=true] If `true`, viewport will be scrolled to the selection.
   * @returns {Boolean} `true` if selection was successful, `false` otherwise.
   */
  this.selectCellByProp = function(row, prop, endRow, endProp, scrollToCell) {
    arguments[1] = datamap.propToCol(arguments[1]);

    if (isDefined(arguments[3])) {
      arguments[3] = datamap.propToCol(arguments[3]);
    }

    return instance.selectCell(...arguments);
  };

  /**
   * Deselects the current cell selection on grid.
   *
   * @memberof Core#
   * @function deselectCell
   */
  this.deselectCell = function() {
    selection.deselect();
  };

  /**
   * Scroll viewport to coords specified by the `row` and `column` arguments.
   *
   * @since 0.24.3
   * @memberof Core#
   * @function scrollViewportTo
   * @param {Number} [row] Visual row index.
   * @param {Number} [column] Visual column index.
   * @param {Boolean} [snapToBottom = false] If `true`, viewport is scrolled to show the cell on the bottom of the table.
   * @param {Boolean} [snapToRight = false] If `true`, viewport is scrolled to show the cell on the right side of the table.
   * @returns {Boolean} `true` if scroll was successful, `false` otherwise.
   */
  this.scrollViewportTo = function(row, column, snapToBottom = false, snapToRight = false) {
    if (row !== void 0 && (row < 0 || row >= instance.countRows())) {
      return false;
    }
    if (column !== void 0 && (column < 0 || column >= instance.countCols())) {
      return false;
    }

    let result = false;

    if (row !== void 0 && column !== void 0) {
      instance.view.wt.wtOverlays.topOverlay.scrollTo(row, snapToBottom);
      instance.view.wt.wtOverlays.leftOverlay.scrollTo(column, snapToRight);

      result = true;
    }
    if (typeof row === 'number' && typeof column !== 'number') {
      instance.view.wt.wtOverlays.topOverlay.scrollTo(row, snapToBottom);

      result = true;
    }
    if (typeof column === 'number' && typeof row !== 'number') {
      instance.view.wt.wtOverlays.leftOverlay.scrollTo(column, snapToRight);

      result = true;
    }

    return result;
  };

  /**
   * Removes grid from the DOM.
   *
   * @memberof Core#
   * @function destroy
   * @fires Hooks#afterDestroy
   */
  this.destroy = function() {

    instance._clearTimeouts();
    if (instance.view) { // in case HT is destroyed before initialization has finished
      instance.view.destroy();
    }
    if (dataSource) {
      dataSource.destroy();
    }
    dataSource = null;

    empty(instance.rootElement);
    eventManager.destroy();

    instance.runHooks('afterDestroy');
    Hooks.getSingleton().destroy(instance);

    for (var i in instance) {
      if (hasOwnProperty(instance, i)) {
        // replace instance methods with post mortem
        if (isFunction(instance[i])) {
          instance[i] = postMortem;

        } else if (i !== 'guid') {
          // replace instance properties with null (restores memory)
          // it should not be necessary but this prevents a memory leak side effects that show itself in Jasmine tests
          instance[i] = null;
        }
      }
    }

    // replace private properties with null (restores memory)
    // it should not be necessary but this prevents a memory leak side effects that show itself in Jasmine tests
    if (datamap) {
      datamap.destroy();
    }
    datamap = null;
    priv = null;
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
    throw new Error('This method cannot be called because this Handsontable instance has been destroyed');
  }

  /**
   * Returns the active editor object.
   *
   * @memberof Core#
   * @function getActiveEditor
   * @returns {Object} The active editor object.
   */
  this.getActiveEditor = function() {
    return editorManager.getActiveEditor();
  };

  /**
   * Returns plugin instance using the plugin name provided.
   *
   * @memberof Core#
   * @function getPlugin
   * @param {String} pluginName The plugin name.
   * @returns {*} The plugin instance.
   * @since 0.15.0
   */
  this.getPlugin = function(pluginName) {
    return getPlugin(this, pluginName);
  };

  /**
   * Returns the Handsontable instance.
   *
   * @memberof Core#
   * @function getInstance
   * @returns {Handsontable} The Handsontable instance.
   */
  this.getInstance = function() {
    return instance;
  };

  /**
   * Adds listener to the specified hook name (only for this Handsontable instance).
   *
   * @memberof Core#
   * @function addHook
   * @see Hooks#add
   * @param {String} key Hook name.
   * @param {Function|Array} callback Function or array of Functions.
   *
   * @example
   * ```js
   * hot.addHook('beforeInit', myCallback);
   * ```
   */
  this.addHook = function(key, callback) {
    Hooks.getSingleton().add(key, callback, instance);
  };

  /**
   * Check if for a specified hook name there are added listeners (only for this Handsontable instance).
   *
   * @memberof Core#
   * @function hasHook
   * @see Hooks#has
   * @param {String} key Hook name
   * @return {Boolean}
   *
   * @example
   * ```js
   * var hasBeforeInitListeners = hot.hasHook('beforeInit');
   * ```
   */
  this.hasHook = function(key) {
    return Hooks.getSingleton().has(key, instance);
  };

  /**
   * Adds listener to specified hook name (only for this Handsontable instance).
   * After the listener is triggered, it will be automatically removed.
   *
   * @memberof Core#
   * @function addHookOnce
   * @see Hooks#once
   * @param {String} key Hook name.
   * @param {Function|Array} callback Function or array of Functions.
   *
   * @example
   * ```js
   * hot.addHookOnce('beforeInit', myCallback);
   * ```
   */
  this.addHookOnce = function(key, callback) {
    Hooks.getSingleton().once(key, callback, instance);
  };

  /**
   * Removes the hook listener previously registered with {@link Core#addHook}.
   *
   * @memberof Core#
   * @function removeHook
   * @see Hooks#remove
   * @param {String} key Hook name.
   * @param {Function} callback Function which have been registered via {@link Core#addHook}.
   *
   * @example
   * ```js
   * hot.removeHook('beforeInit', myCallback);
   * ```
   */
  this.removeHook = function(key, callback) {
    Hooks.getSingleton().remove(key, callback, instance);
  };

  /**
   * Run the callbacks for the hook provided in the `key` argument using the parameters given in the other arguments.
   *
   * @memberof Core#
   * @function runHooks
   * @see Hooks#run
   * @param {String} key Hook name.
   * @param {*} [p1] Argument passed to the callback.
   * @param {*} [p2] Argument passed to the callback.
   * @param {*} [p3] Argument passed to the callback.
   * @param {*} [p4] Argument passed to the callback.
   * @param {*} [p5] Argument passed to the callback.
   * @param {*} [p6] Argument passed to the callback.
   * @returns {*}
   *
   * @example
   * ```js
   * hot.runHooks('beforeInit');
   * ```
   */
  this.runHooks = function(key, p1, p2, p3, p4, p5, p6) {
    return Hooks.getSingleton().run(instance, key, p1, p2, p3, p4, p5, p6);
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
  // this.version = Handsontable.version;

  Hooks.getSingleton().run(instance, 'construct');
};
