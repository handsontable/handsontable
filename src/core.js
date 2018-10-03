import { addClass, empty, isChildOfWebComponentTable, removeClass } from './helpers/dom/element';
import { columnFactory } from './helpers/setting';
import { isFunction } from './helpers/function';
import { warn } from './helpers/console';
import { isDefined, isUndefined, isRegExp, _injectProductInfo, isEmpty } from './helpers/mixed';
import { isMobileBrowser } from './helpers/browser';
import DataMap from './dataMap';
import EditorManager from './editorManager';
import EventManager from './eventManager';
import {
  deepClone,
  duckSchema,
  extend, isObject,
  isObjectEqual,
  deepObjectSize,
  hasOwnProperty,
  createObjectPropListener,
  objectEach
} from './helpers/object';
import { arrayFlatten, arrayMap, arrayEach, arrayReduce } from './helpers/array';
import { toSingleLine } from './helpers/templateLiteralTag';
import { getPlugin } from './plugins';
import { getRenderer } from './renderers';
import { getValidator } from './validators';
import { randomString } from './helpers/string';
import { rangeEach, rangeEachReverse } from './helpers/number';
import TableView from './tableView';
import DataSource from './dataSource';
import { translateRowsToColumns, cellMethodLookupFactory, spreadsheetColumnLabel } from './helpers/data';
import { getTranslator } from './utils/recordTranslator';
import { registerAsRootInstance, hasValidParameter, isRootInstance } from './utils/rootInstance';
import { CellCoords, ViewportColumnsCalculator } from './3rdparty/walkontable/src';
import Hooks from './pluginHooks';
import DefaultSettings from './defaultSettings';
import { getCellType } from './cellTypes';
import { getTranslatedPhrase } from './i18n';
import { hasLanguageDictionary } from './i18n/dictionariesManager';
import { warnUserAboutLanguageRegistration, applyLanguageSetting, normalizeLanguageCode } from './i18n/utils';
import { startObserving as keyStateStartObserving, stopObserving as keyStateStopObserving } from './utils/keyStateObserver';
import { Selection } from './selection';

let activeGuid = null;

/**
 * Handsontable constructor
 *
 * @core
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
 * const hot = new Handsontable(document.getElementById('example1'), options);
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
export default function Core(rootElement, userSettings, rootInstanceSymbol = false) {
  let preventScrollingToCell = false;
  let instance = this;
  let GridSettings = function() {};
  const eventManager = new EventManager(instance);
  let priv;
  let datamap;
  let dataSource;
  let grid;
  let editorManager;

  extend(GridSettings.prototype, DefaultSettings.prototype); // create grid settings as a copy of default settings
  extend(GridSettings.prototype, userSettings); // overwrite defaults with user settings
  extend(GridSettings.prototype, expandType(userSettings));

  applyLanguageSetting(GridSettings.prototype, userSettings.language);

  if (hasValidParameter(rootInstanceSymbol)) {
    registerAsRootInstance(this);
  }

  keyStateStartObserving();

  this.isDestroyed = false;
  this.rootElement = rootElement;
  this.isHotTableEnv = isChildOfWebComponentTable(this.rootElement);
  EventManager.isHotTableEnv = this.isHotTableEnv;

  this.container = document.createElement('div');
  this.renderCall = false;

  rootElement.insertBefore(this.container, rootElement.firstChild);

  if (process.env.HOT_PACKAGE_TYPE !== '\x63\x65' && isRootInstance(this)) {
    _injectProductInfo(userSettings.licenseKey, rootElement);
  }

  this.guid = `ht_${randomString()}`; // this is the namespace for global events

  const recordTranslator = getTranslator(instance);

  dataSource = new DataSource(instance);

  if (!this.rootElement.id || this.rootElement.id.substring(0, 3) === 'ht_') {
    this.rootElement.id = this.guid; // if root element does not have an id, assign a random id
  }
  priv = {
    cellSettings: [],
    columnSettings: [],
    columnsSettingConflicts: ['data', 'width', 'language'],
    settings: new GridSettings(), // current settings instance
    selRange: null, // exposed by public method `getSelectedRange`
    isPopulated: null,
    scrollable: null,
    firstRun: true
  };

  let selection = new Selection(priv.settings, {
    countCols: () => instance.countCols(),
    countRows: () => instance.countRows(),
    propToCol: prop => datamap.propToCol(prop),
    isEditorOpened: () => (instance.getActiveEditor() ? instance.getActiveEditor().isOpened() : false),
  });

  this.selection = selection;

  this.selection.addLocalHook('beforeSetRangeStart', (cellCoords) => {
    this.runHooks('beforeSetRangeStart', cellCoords);
  });

  this.selection.addLocalHook('beforeSetRangeStartOnly', (cellCoords) => {
    this.runHooks('beforeSetRangeStartOnly', cellCoords);
  });

  this.selection.addLocalHook('beforeSetRangeEnd', (cellCoords) => {
    this.runHooks('beforeSetRangeEnd', cellCoords);

    if (cellCoords.row < 0) {
      cellCoords.row = this.view.wt.wtTable.getFirstVisibleRow();
    }
    if (cellCoords.col < 0) {
      cellCoords.col = this.view.wt.wtTable.getFirstVisibleColumn();
    }
  });

  this.selection.addLocalHook('afterSetRangeEnd', (cellCoords) => {
    const preventScrolling = createObjectPropListener(false);
    const selectionRange = this.selection.getSelectedRange();
    const { from, to } = selectionRange.current();
    const selectionLayerLevel = selectionRange.size() - 1;

    this.runHooks('afterSelection',
      from.row, from.col, to.row, to.col, preventScrolling, selectionLayerLevel);
    this.runHooks('afterSelectionByProp',
      from.row, instance.colToProp(from.col), to.row, instance.colToProp(to.col), preventScrolling, selectionLayerLevel);

    const isSelectedByAnyHeader = this.selection.isSelectedByAnyHeader();
    const currentSelectedRange = this.selection.selectedRange.current();

    let scrollToCell = true;

    if (preventScrollingToCell) {
      scrollToCell = false;
    }

    if (preventScrolling.isTouched()) {
      scrollToCell = !preventScrolling.value;
    }

    const isSelectedByRowHeader = this.selection.isSelectedByRowHeader();
    const isSelectedByColumnHeader = this.selection.isSelectedByColumnHeader();

    if (scrollToCell !== false) {
      if (!isSelectedByAnyHeader) {
        if (currentSelectedRange && !this.selection.isMultiple()) {
          this.view.scrollViewport(currentSelectedRange.from);
        } else {
          this.view.scrollViewport(cellCoords);
        }

      } else if (isSelectedByRowHeader) {
        this.view.scrollViewportVertically(cellCoords.row);

      } else if (isSelectedByColumnHeader) {
        this.view.scrollViewportHorizontally(cellCoords.col);
      }
    }

    // @TODO: These CSS classes are no longer needed anymore. They are used only as a indicator of the selected
    // rows/columns in the MergedCells plugin (via border.js#L520 in the walkontable module). After fixing
    // the Border class this should be removed.
    if (isSelectedByRowHeader && isSelectedByColumnHeader) {
      addClass(this.rootElement, ['ht__selection--rows', 'ht__selection--columns']);

    } else if (isSelectedByRowHeader) {
      removeClass(this.rootElement, 'ht__selection--columns');
      addClass(this.rootElement, 'ht__selection--rows');

    } else if (isSelectedByColumnHeader) {
      removeClass(this.rootElement, 'ht__selection--rows');
      addClass(this.rootElement, 'ht__selection--columns');

    } else {
      removeClass(this.rootElement, ['ht__selection--rows', 'ht__selection--columns']);
    }

    this._refreshBorders(null);
  });

  this.selection.addLocalHook('afterSelectionFinished', (cellRanges) => {
    const selectionLayerLevel = cellRanges.length - 1;
    const { from, to } = cellRanges[selectionLayerLevel];

    this.runHooks('afterSelectionEnd',
      from.row, from.col, to.row, to.col, selectionLayerLevel);
    this.runHooks('afterSelectionEndByProp',
      from.row, instance.colToProp(from.col), to.row, instance.colToProp(to.col), selectionLayerLevel);
  });

  this.selection.addLocalHook('afterIsMultipleSelection', (isMultiple) => {
    const changedIsMultiple = this.runHooks('afterIsMultipleSelection', isMultiple.value);

    if (isMultiple.value) {
      isMultiple.value = changedIsMultiple;
    }
  });

  this.selection.addLocalHook('beforeModifyTransformStart', (cellCoordsDelta) => {
    this.runHooks('modifyTransformStart', cellCoordsDelta);
  });
  this.selection.addLocalHook('afterModifyTransformStart', (coords, rowTransformDir, colTransformDir) => {
    this.runHooks('afterModifyTransformStart', coords, rowTransformDir, colTransformDir);
  });
  this.selection.addLocalHook('beforeModifyTransformEnd', (cellCoordsDelta) => {
    this.runHooks('modifyTransformEnd', cellCoordsDelta);
  });
  this.selection.addLocalHook('afterModifyTransformEnd', (coords, rowTransformDir, colTransformDir) => {
    this.runHooks('afterModifyTransformEnd', coords, rowTransformDir, colTransformDir);
  });
  this.selection.addLocalHook('afterDeselect', () => {
    editorManager.destroyEditor();

    this._refreshBorders();
    removeClass(this.rootElement, ['ht__selection--rows', 'ht__selection--columns']);

    this.runHooks('afterDeselect');
  });
  this.selection.addLocalHook('insertRowRequire', (totalRows) => {
    this.alter('insert_row', totalRows, 1, 'auto');
  });
  this.selection.addLocalHook('insertColRequire', (totalCols) => {
    this.alter('insert_col', totalCols, 1, 'auto');
  });

  grid = {
    /**
     * Inserts or removes rows and columns.
     *
     * @memberof Core#
     * @function alter
     * @private
     * @param {String} action Possible values: "insert_row", "insert_col", "remove_row", "remove_col".
     * @param {Number|Array} index Row or column visual index which from the alter action will be triggered.
     *                             Alter actions such as "remove_row" and "remove_col" support array indexes in the
     *                             format `[[index, amount], [index, amount]...]` this can be used to remove
     *                             non-consecutive columns or rows in one call.
     * @param {Number} [amount=1] Ammount rows or columns to remove.
     * @param {String} [source] Optional. Source of hook runner.
     * @param {Boolean} [keepEmptyRows] Optional. Flag for preventing deletion of empty rows.
     */
    alter(action, index, amount = 1, source, keepEmptyRows) {
      let delta;

      function spliceWith(data, startIndex, count, toInject) {
        const valueFactory = () => {
          let result;

          if (toInject === 'array') {
            result = [];

          } else if (toInject === 'object') {
            result = {};
          }

          return result;
        };
        const spliceArgs = arrayMap(new Array(count), () => valueFactory());

        spliceArgs.unshift(startIndex, 0);
        data.splice(...spliceArgs);
      }

      const normalizeIndexesGroup = (indexes) => {
        if (indexes.length === 0) {
          return [];
        }

        const sortedIndexes = [...indexes];

        // Sort the indexes in ascending order.
        sortedIndexes.sort(([indexA], [indexB]) => {
          if (indexA === indexB) {
            return 0;
          }

          return indexA > indexB ? 1 : -1;
        });

        // Normalize the {index, amount} groups into bigger groups.
        const normalizedIndexes = arrayReduce(sortedIndexes, (acc, [groupIndex, groupAmount]) => {
          const previousItem = acc[acc.length - 1];
          const [prevIndex, prevAmount] = previousItem;
          const prevLastIndex = prevIndex + prevAmount;

          if (groupIndex <= prevLastIndex) {
            const amountToAdd = Math.max(groupAmount - (prevLastIndex - groupIndex), 0);

            previousItem[1] += amountToAdd;
          } else {
            acc.push([groupIndex, groupAmount]);
          }

          return acc;
        }, [sortedIndexes[0]]);

        return normalizedIndexes;
      };

      /* eslint-disable no-case-declarations */
      switch (action) {
        case 'insert_row':

          const numberOfSourceRows = instance.countSourceRows();

          if (instance.getSettings().maxRows === numberOfSourceRows) {
            return;
          }
          // eslint-disable-next-line no-param-reassign
          index = (isDefined(index)) ? index : numberOfSourceRows;

          delta = datamap.createRow(index, amount, source);
          spliceWith(priv.cellSettings, index, amount, 'array');

          if (delta) {
            if (selection.isSelected() && selection.selectedRange.current().from.row >= index) {
              selection.selectedRange.current().from.row += delta;
              selection.transformEnd(delta, 0); // will call render() internally
            } else {
              instance._refreshBorders(); // it will call render and prepare methods
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
              const spliceArray = [index, 0];
              spliceArray.length += delta; // inserts empty (undefined) elements at the end of an array
              Array.prototype.splice.apply(instance.getSettings().colHeaders, spliceArray); // inserts empty (undefined) elements into the colHeader array
            }

            if (selection.isSelected() && selection.selectedRange.current().from.col >= index) {
              selection.selectedRange.current().from.col += delta;
              selection.transformEnd(0, delta); // will call render() internally
            } else {
              instance._refreshBorders(); // it will call render and prepare methods
            }
          }
          break;

        case 'remove_row':

          const removeRow = (indexes) => {
            let offset = 0;

            // Normalize the {index, amount} groups into bigger groups.
            arrayEach(indexes, ([groupIndex, groupAmount]) => {
              const calcIndex = isEmpty(groupIndex) ? instance.countRows() - 1 : Math.max(groupIndex - offset, 0);

              // If the 'index' is an integer decrease it by 'offset' otherwise pass it through to make the value
              // compatible with datamap.removeCol method.
              if (Number.isInteger(groupIndex)) {
                // eslint-disable-next-line no-param-reassign
                groupIndex = Math.max(groupIndex - offset, 0);
              }

              // TODO: for datamap.removeRow index should be passed as it is (with undefined and null values). If not, the logic
              // inside the datamap.removeRow breaks the removing functionality.
              datamap.removeRow(groupIndex, groupAmount, source);
              priv.cellSettings.splice(calcIndex, amount);

              const totalRows = instance.countRows();
              const fixedRowsTop = instance.getSettings().fixedRowsTop;

              if (fixedRowsTop >= calcIndex + 1) {
                instance.getSettings().fixedRowsTop -= Math.min(groupAmount, fixedRowsTop - calcIndex);
              }

              const fixedRowsBottom = instance.getSettings().fixedRowsBottom;

              if (fixedRowsBottom && calcIndex >= totalRows - fixedRowsBottom) {
                instance.getSettings().fixedRowsBottom -= Math.min(groupAmount, fixedRowsBottom);
              }

              offset += groupAmount;
            });
          };

          if (Array.isArray(index)) {
            removeRow(normalizeIndexesGroup(index));
          } else {
            removeRow([[index, amount]]);
          }

          grid.adjustRowsAndCols();
          instance._refreshBorders(); // it will call render and prepare methods
          break;

        case 'remove_col':

          const removeCol = (indexes) => {
            let offset = 0;

            // Normalize the {index, amount} groups into bigger groups.
            arrayEach(indexes, ([groupIndex, groupAmount]) => {
              const calcIndex = isEmpty(groupIndex) ? instance.countCols() - 1 : Math.max(groupIndex - offset, 0);

              let visualColumnIndex = recordTranslator.toPhysicalColumn(calcIndex);

              // If the 'index' is an integer decrease it by 'offset' otherwise pass it through to make the value
              // compatible with datamap.removeCol method.
              if (Number.isInteger(groupIndex)) {
                // eslint-disable-next-line no-param-reassign
                groupIndex = Math.max(groupIndex - offset, 0);
              }

              // TODO: for datamap.removeCol index should be passed as it is (with undefined and null values). If not, the logic
              // inside the datamap.removeCol breaks the removing functionality.
              datamap.removeCol(groupIndex, groupAmount, source);

              for (let row = 0, len = instance.countSourceRows(); row < len; row++) {
                if (priv.cellSettings[row]) { // if row hasn't been rendered it wouldn't have cellSettings
                  priv.cellSettings[row].splice(visualColumnIndex, groupAmount);
                }
              }
              const fixedColumnsLeft = instance.getSettings().fixedColumnsLeft;

              if (fixedColumnsLeft >= calcIndex + 1) {
                instance.getSettings().fixedColumnsLeft -= Math.min(groupAmount, fixedColumnsLeft - calcIndex);
              }

              if (Array.isArray(instance.getSettings().colHeaders)) {
                if (typeof visualColumnIndex === 'undefined') {
                  visualColumnIndex = -1;
                }
                instance.getSettings().colHeaders.splice(visualColumnIndex, groupAmount);
              }

              offset += groupAmount;
            });
          };

          if (Array.isArray(index)) {
            removeCol(normalizeIndexesGroup(index));
          } else {
            removeCol([[index, amount]]);
          }

          grid.adjustRowsAndCols();
          instance._refreshBorders(); // it will call render and prepare methods

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
        const rows = instance.countRows();

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
      const rowCount = instance.countRows();
      const colCount = instance.countCols();

      if (rowCount === 0 || colCount === 0) {
        selection.deselect();
      }

      if (selection.isSelected()) {
        arrayEach(selection.selectedRange, (range) => {
          let selectionChanged = false;
          let fromRow = range.from.row;
          let fromCol = range.from.col;
          let toRow = range.to.row;
          let toCol = range.to.col;

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
        });
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
      let r;
      let rlen;
      let c;
      let clen;
      const setData = [];
      const current = {};

      rlen = input.length;

      if (rlen === 0) {
        return false;
      }

      let repeatCol;
      let repeatRow;
      let cmax;
      let rmax;

      /* eslint-disable no-case-declarations */
      // insert data with specified pasteMode method
      switch (method) {
        case 'shift_down' :
          repeatCol = end ? end.col - start.col + 1 : 0;
          repeatRow = end ? end.row - start.row + 1 : 0;
          // eslint-disable-next-line no-param-reassign
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

          const selected = { // selected range
            row: (end && start) ? (end.row - start.row + 1) : 1,
            col: (end && start) ? (end.col - start.col + 1) : 1
          };
          let skippedRow = 0;
          let skippedColumn = 0;
          let pushData = true;
          let cellMeta;

          const getInputValue = function getInputValue(row, col = null) {
            const rowValue = input[row % input.length];

            if (col !== null) {
              return rowValue[col % rowValue.length];
            }

            return rowValue;
          };
          const rowInputLength = input.length;
          const rowSelectionLength = end ? end.row - start.row + 1 : 0;

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
            const visualRow = r - skippedRow;
            const colInputLength = getInputValue(visualRow).length;
            const colSelectionLength = end ? end.col - start.col + 1 : 0;

            if (end) {
              clen = colSelectionLength;
            } else {
              clen = Math.max(colInputLength, colSelectionLength);
            }
            current.col = start.col;
            cellMeta = instance.getCellMeta(current.row, current.col);

            if ((source === 'CopyPaste.paste' || source === 'Autofill.autofill') && cellMeta.skipRowOnPaste) {
              skippedRow += 1;
              current.row += 1;
              rlen += 1;
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
                skippedColumn += 1;
                current.col += 1;
                clen += 1;
                continue;
              }
              if (cellMeta.readOnly) {
                current.col += 1;
                /* eslint-disable no-continue */
                continue;
              }
              const visualColumn = c - skippedColumn;
              let value = getInputValue(visualRow, visualColumn);
              const orgValue = instance.getDataAtCell(current.row, current.col);
              const index = {
                row: visualRow,
                col: visualColumn
              };

              if (source === 'Autofill.fill') {
                const result = instance.runHooks('beforeAutofillInsidePopulate', index, direction, input, deltas, {}, selected);

                if (result) {
                  value = isUndefined(result.value) ? value : result.value;
                }
              }
              if (value !== null && typeof value === 'object') {
                if (orgValue === null || typeof orgValue !== 'object') {
                  pushData = false;

                } else {
                  const orgValueSchema = duckSchema(orgValue[0] || orgValue);
                  const valueSchema = duckSchema(value[0] || value);

                  /* eslint-disable max-depth */
                  if (isObjectEqual(orgValueSchema, valueSchema)) {
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
              current.col += 1;
            }
            current.row += 1;
          }
          instance.setDataAtCell(setData, null, null, source || 'populateFromArray');
          break;
      }
    },
  };

  /**
   * Internal function to set `language` key of settings.
   *
   * @private
   * @param {String} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'
   * @fires Hooks#afterLanguageChange
   */
  function setLanguage(languageCode) {
    const normalizedLanguageCode = normalizeLanguageCode(languageCode);

    if (hasLanguageDictionary(normalizedLanguageCode)) {
      instance.runHooks('beforeLanguageChange', normalizedLanguageCode);

      GridSettings.prototype.language = normalizedLanguageCode;

      instance.runHooks('afterLanguageChange', normalizedLanguageCode);

    } else {
      warnUserAboutLanguageRegistration(languageCode);
    }
  }

  this.init = function() {
    dataSource.setData(priv.settings.data);
    instance.runHooks('beforeInit');

    if (isMobileBrowser()) {
      addClass(instance.rootElement, 'mobile');
    }

    this.updateSettings(priv.settings, true);

    this.view = new TableView(this);
    editorManager = EditorManager.getInstance(instance, priv, selection, datamap);

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
    let resolved = false;

    return {
      validatorsInQueue: 0,
      valid: true,
      addValidatorToQueue() {
        this.validatorsInQueue += 1;
        resolved = false;
      },
      removeValidatorFormQueue() {
        this.validatorsInQueue = this.validatorsInQueue - 1 < 0 ? 0 : this.validatorsInQueue - 1;
        this.checkIfQueueIsEmpty();
      },
      onQueueEmpty() { },
      checkIfQueueIsEmpty() {
        if (this.validatorsInQueue === 0 && resolved === false) {
          resolved = true;
          this.onQueueEmpty(this.valid);
        }
      }
    };
  }

  /**
   * Get parsed number from numeric string.
   *
   * @private
   * @param {String} numericData Float (separated by a dot or a comma) or integer.
   * @returns {Number} Number if we get data in parsable format, not changed value otherwise.
   */
  function getParsedNumber(numericData) {
    // Unifying "float like" string. Change from value with comma determiner to value with dot determiner,
    // for example from `450,65` to `450.65`.
    const unifiedNumericData = numericData.replace(',', '.');

    if (isNaN(parseFloat(unifiedNumericData)) === false) {
      return parseFloat(unifiedNumericData);
    }

    return numericData;
  }

  function validateChanges(changes, source, callback) {
    const waitingForValidator = new ValidatorsQueue();
    const isNumericData = value => value.length > 0 && /^-?[\d\s]*(\.|,)?\d*$/.test(value);

    waitingForValidator.onQueueEmpty = resolve;

    for (let i = changes.length - 1; i >= 0; i--) {
      if (changes[i] === null) {
        changes.splice(i, 1);
      } else {
        const [row, prop, , newValue] = changes[i];
        const col = datamap.propToCol(prop);
        const cellProperties = instance.getCellMeta(row, col);

        if (cellProperties.type === 'numeric' && typeof newValue === 'string' && isNumericData(newValue)) {
          changes[i][3] = getParsedNumber(newValue);
        }

        /* eslint-disable no-loop-func */
        if (instance.getCellValidator(cellProperties)) {
          waitingForValidator.addValidatorToQueue();
          instance.validateCell(changes[i][3], cellProperties, (function(index, cellPropertiesReference) {
            return function(result) {
              if (typeof result !== 'boolean') {
                throw new Error('Validation error: result is not boolean');
              }
              if (result === false && cellPropertiesReference.allowInvalid === false) {
                changes.splice(index, 1); // cancel the change
                cellPropertiesReference.valid = true; // we cancelled the change, so cell value is still valid
                const cell = instance.getCell(cellPropertiesReference.visualRow, cellPropertiesReference.visualCol);
                removeClass(cell, instance.getSettings().invalidCellClassName);
                // index -= 1;
              }
              waitingForValidator.removeValidatorFormQueue();
            };
          }(i, cellProperties)), source);
        }
      }
    }
    waitingForValidator.checkIfQueueIsEmpty();

    function resolve() {
      let beforeChangeResult;

      if (changes.length) {
        beforeChangeResult = instance.runHooks('beforeChange', changes, source || 'edit');
        if (isFunction(beforeChangeResult)) {
          warn('Your beforeChange callback returns a function. It\'s not supported since Handsontable 0.12.1 (and the returned function will not be executed).');
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

      if ((changes[i][2] === null || changes[i][2] === void 0)
        && (changes[i][3] === null || changes[i][3] === void 0)) {
        /* eslint-disable no-continue */
        continue;
      }

      if (priv.settings.allowInsertRow) {
        while (changes[i][0] > instance.countRows() - 1) {
          const numberOfCreatedRows = datamap.createRow(void 0, void 0, source);

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
    editorManager.lockEditor();
    instance._refreshBorders(null);
    editorManager.unlockEditor();
    instance.view.wt.wtOverlays.adjustElementsSize();
    instance.runHooks('afterChange', changes, source || 'edit');

    const activeEditor = instance.getActiveEditor();

    if (activeEditor && isDefined(activeEditor.refreshValue)) {
      activeEditor.refreshValue();
    }
  }

  /**
   * Validate a single cell.
   *
   * @param {String|Number} value
   * @param cellProperties
   * @param callback
   * @param source
   */
  this.validateCell = function(value, cellProperties, callback, source) {
    let validator = instance.getCellValidator(cellProperties);

    // the `canBeValidated = false` argument suggests, that the cell passes validation by default.
    function done(valid, canBeValidated = true) {
      // Fixes GH#3903
      if (!canBeValidated || cellProperties.hidden === true) {
        callback(valid);
        return;
      }

      const col = cellProperties.visualCol;
      const row = cellProperties.visualRow;
      const td = instance.getCell(row, col, true);

      if (td && td.nodeName !== 'TH') {
        instance.view.wt.wtSettings.settings.cellRenderer(row, col, td);
      }
      callback(valid);
    }

    if (isRegExp(validator)) {
      validator = (function(expression) {
        return function(cellValue, validatorCallback) {
          validatorCallback(expression.test(cellValue));
        };
      }(validator));
    }

    if (isFunction(validator)) {
      // eslint-disable-next-line no-param-reassign
      value = instance.runHooks('beforeValidate', value, cellProperties.visualRow, cellProperties.prop, source);

      // To provide consistent behaviour, validation should be always asynchronous
      instance._registerTimeout(setTimeout(() => {
        validator.call(cellProperties, value, (valid) => {
          // eslint-disable-next-line no-param-reassign
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
        done(cellProperties.valid, false);
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
   * Set new value to a cell. To change many cells at once (recommended way), pass an array of `changes` in format
   * `[[row, col, value],...]` as the first argument.
   *
   * @memberof Core#
   * @function setDataAtCell
   * @param {Number|Array} row Visual row index or array of changes in format `[[row, col, value],...]`.
   * @param {Number} [column] Visual column index.
   * @param {String} [value] New value.
   * @param {String} [source] String that identifies how this change will be described in the changes array (useful in onAfterChange or onBeforeChange callback).
   */
  this.setDataAtCell = function(row, column, value, source) {
    const input = setDataInputToArray(row, column, value);
    const changes = [];
    let changeSource = source;
    let i;
    let ilen;
    let prop;

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

    if (!changeSource && typeof row === 'object') {
      changeSource = column;
    }

    instance.runHooks('afterSetDataAtCell', changes, changeSource);

    validateChanges(changes, changeSource, () => {
      applyChanges(changes, changeSource);
    });
  };

  /**
   * @description
   * Set new value to a cell. To change many cells at once (recommended way), pass an array of `changes` in format
   * `[[row, prop, value],...]` as the first argument.
   *
   * @memberof Core#
   * @function setDataAtRowProp
   * @param {Number|Array} row Visual row index or array of changes in format `[[row, prop, value], ...]`.
   * @param {String} prop Property name or the source string (e.g. `'first.name'` or `'0'`).
   * @param {String} value Value to be set.
   * @param {String} [source] String that identifies how this change will be described in changes array (useful in onChange callback).
   */
  this.setDataAtRowProp = function(row, prop, value, source) {
    const input = setDataInputToArray(row, prop, value);
    const changes = [];
    let changeSource = source;
    let i;
    let ilen;

    for (i = 0, ilen = input.length; i < ilen; i++) {
      changes.push([
        input[i][0],
        input[i][1],
        dataSource.getAtCell(recordTranslator.toPhysicalRow(input[i][0]), input[i][1]),
        input[i][2],
      ]);
    }

    if (!changeSource && typeof row === 'object') {
      changeSource = prop;
    }

    instance.runHooks('afterSetDataAtRowProp', changes, changeSource);

    validateChanges(changes, changeSource, () => {
      applyChanges(changes, changeSource);
    });
  };

  /**
   * Listen to the keyboard input on document body. This allows Handsontable to capture keyboard events and respond
   * in the right way.
   *
   * @memberof Core#
   * @function listen
   * @param {Boolean} [modifyDocumentFocus=true] If `true`, currently focused element will be blured (which returns focus
   *                                             to the document.body). Otherwise the active element does not lose its focus.
   * @fires Hooks#afterListen
   */
  this.listen = function(modifyDocumentFocus = true) {
    if (modifyDocumentFocus) {
      const invalidActiveElement = !document.activeElement || (document.activeElement && document.activeElement.nodeName === void 0);

      if (document.activeElement && document.activeElement !== document.body && !invalidActiveElement) {
        document.activeElement.blur();

      } else if (invalidActiveElement) { // IE
        document.body.focus();
      }
    }

    if (instance && !instance.isListening()) {
      activeGuid = instance.guid;
      instance.runHooks('afterListen');
    }
  };

  /**
   * Stop listening to keyboard input on the document body. Calling this method makes the Handsontable inactive for
   * any keyboard events.
   *
   * @memberof Core#
   * @function unlisten
   */
  this.unlisten = function() {
    if (this.isListening()) {
      activeGuid = null;
      instance.runHooks('afterUnlisten');
    }
  };

  /**
   * Returns `true` if the current Handsontable instance is listening to keyboard input on document body.
   *
   * @memberof Core#
   * @function isListening
   * @returns {Boolean} `true` if the instance is listening, `false` otherwise.
   */
  this.isListening = function() {
    return activeGuid === instance.guid;
  };

  /**
   * Destroys the current editor, render the table and prepares the editor of the newly selected cell.
   *
   * @memberof Core#
   * @function destroyEditor
   * @param {Boolean} [revertOriginal=false] If `true`, the previous value will be restored. Otherwise, the edited value will be saved.
   * @param {Boolean} [prepareEditorIfNeeded=true] If `true` the editor under the selected cell will be prepared to open.
   */
  this.destroyEditor = function(revertOriginal = false, prepareEditorIfNeeded = true) {
    instance._refreshBorders(revertOriginal, prepareEditorIfNeeded);
  };

  /**
   * Populate cells at position with 2D input array (e.g. `[[1, 2], [3, 4]]`). Use `endRow`, `endCol` when you
   * want to cut input when a certain row is reached.
   *
   * Optional `method` argument has the same effect as pasteMode option (see {@link Options#pasteMode}).
   *
   * @memberof Core#
   * @function populateFromArray
   * @param {Number} row Start visual row index.
   * @param {Number} column Start visual column index.
   * @param {Array} input 2d array
   * @param {Number} [endRow] End visual row index (use when you want to cut input when certain row is reached).
   * @param {Number} [endCol] End visual column index (use when you want to cut input when certain column is reached).
   * @param {String} [source=populateFromArray] Used to identify this call in the resulting events (beforeChange, afterChange).
   * @param {String} [method=overwrite] Populate method, possible values: `'shift_down'`, `'shift_right'`, `'overwrite'`.
   * @param {String} direction Populate direction, possible values: `'left'`, `'right'`, `'up'`, `'down'`.
   * @param {Array} deltas The deltas array. A difference between values of adjacent cells.
   *                       Useful **only** when the type of handled cells is `numeric`.
   */
  this.populateFromArray = function(row, column, input, endRow, endCol, source, method, direction, deltas) {
    if (!(typeof input === 'object' && typeof input[0] === 'object')) {
      throw new Error('populateFromArray parameter `input` must be an array of arrays'); // API changed in 0.9-beta2, let's check if you use it correctly
    }

    const c = typeof endRow === 'number' ? new CellCoords(endRow, endCol) : null;

    return grid.populateFromArray(new CellCoords(row, column), input, c, source, method, direction, deltas);
  };

  /**
   * Adds/removes data from the column. This method works the same as Array.splice for arrays (see {@link DataMap#spliceCol}).
   *
   * @memberof Core#
   * @function spliceCol
   * @param {Number} column Index of the column in which do you want to do splice.
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end.
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed.
   * @param {...Number} [elements] The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array.
   */
  this.spliceCol = function(column, index, amount, ...elements) {
    return datamap.spliceCol(column, index, amount, ...elements);
  };

  /**
   * Adds/removes data from the row. This method works the same as Array.splice for arrays (see {@link DataMap#spliceRow}).
   *
   * @memberof Core#
   * @function spliceRow
   * @param {Number} row Index of column in which do you want to do splice.
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end.
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed.
   * @param {...Number} [elements] The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array.
   */
  this.spliceRow = function(row, index, amount, ...elements) {
    return datamap.spliceRow(row, index, amount, ...elements);
  };

  /**
   * Returns indexes of the currently selected cells as an array of arrays `[[startRow, startCol, endRow, endCol],...]`.
   *
   * Start row and start column are the coordinates of the active cell (where the selection was started).
   *
   * The version 0.36.0 adds a non-consecutive selection feature. Since this version, the method returns an array of arrays.
   * Additionally to collect the coordinates of the currently selected area (as it was previously done by the method)
   * you need to use `getSelectedLast` method.
   *
   * @memberof Core#
   * @function getSelected
   * @returns {Array[]|undefined} An array of arrays of the selection's coordinates.
   */
  this.getSelected = function() { // https://github.com/handsontable/handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return arrayMap(selection.getSelectedRange(), ({ from, to }) => [from.row, from.col, to.row, to.col]);
    }
  };

  /**
   * Returns the last coordinates applied to the table as a an array `[startRow, startCol, endRow, endCol]`.
   *
   * @since 0.36.0
   * @memberof Core#
   * @function getSelectedLast
   * @returns {Array|undefined} An array of the selection's coordinates.
   */
  this.getSelectedLast = function() {
    const selected = this.getSelected();
    let result;

    if (selected && selected.length > 0) {
      result = selected[selected.length - 1];
    }

    return result;
  };

  /**
   * Returns the current selection as an array of CellRange objects.
   *
   * The version 0.36.0 adds a non-consecutive selection feature. Since this version, the method returns an array of arrays.
   * Additionally to collect the coordinates of the currently selected area (as it was previously done by the method)
   * you need to use `getSelectedRangeLast` method.
   *
   * @memberof Core#
   * @function getSelectedRange
   * @returns {CellRange[]|undefined} Selected range object or undefined if there is no selection.
   */
  this.getSelectedRange = function() { // https://github.com/handsontable/handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return Array.from(selection.getSelectedRange());
    }
  };

  /**
  * Returns the last coordinates applied to the table as a CellRange object.
  *
  * @memberof Core#
  * @function getSelectedRangeLast
  * @since 0.36.0
  * @returns {CellRange|undefined} Selected range object or undefined` if there is no selection.
   */
  this.getSelectedRangeLast = function() {
    const selectedRange = this.getSelectedRange();
    let result;

    if (selectedRange && selectedRange.length > 0) {
      result = selectedRange[selectedRange.length - 1];
    }

    return result;
  };

  /**
   * Erases content from cells that have been selected in the table.
   *
   * @memberof Core#
   * @function emptySelectedCells
   * @since 0.36.0
   */
  this.emptySelectedCells = function() {
    if (!selection.isSelected()) {
      return;
    }
    const changes = [];

    arrayEach(selection.getSelectedRange(), (cellRange) => {
      const topLeft = cellRange.getTopLeftCorner();
      const bottomRight = cellRange.getBottomRightCorner();

      rangeEach(topLeft.row, bottomRight.row, (row) => {
        rangeEach(topLeft.col, bottomRight.col, (column) => {
          if (!this.getCellMeta(row, column).readOnly) {
            changes.push([row, column, '']);
          }
        });
      });
    });

    if (changes.length > 0) {
      this.setDataAtCell(changes);
    }
  };

  /**
   * Rerender the table. Calling this method starts the process of recalculating, redrawing and applying the changes
   * to the DOM. While rendering the table all cell renderers are recalled.
   *
   * Calling this method manually is not recommended. Handsontable tries to render itself by choosing the most
   * optimal moments in its lifecycle.
   *
   * @memberof Core#
   * @function render
   */
  this.render = function() {
    if (instance.view) {
      instance.renderCall = true;
      instance.forceFullRender = true; // used when data was changed
      editorManager.lockEditor();
      instance._refreshBorders(null);
      editorManager.unlockEditor();
    }
  };

  /**
   * Loads new data to Handsontable. Loading new data resets the cell meta.
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
        // eslint-disable-next-line no-param-reassign
        data = [data];
      }

    } else if (data === null) {
      const dataSchema = datamap.getSchema();
      // eslint-disable-next-line no-param-reassign
      data = [];
      let row;
      let r = 0;
      let rlen = 0;

      for (r = 0, rlen = priv.settings.startRows; r < rlen; r++) {
        if ((instance.dataType === 'object' || instance.dataType === 'function') && priv.settings.dataSchema) {
          row = deepClone(dataSchema);
          data.push(row);

        } else if (instance.dataType === 'array') {
          row = deepClone(dataSchema[0]);
          data.push(row);

        } else {
          row = [];

          for (let c = 0, clen = priv.settings.startCols; c < clen; c++) {
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
   *
   * Optionally you can provide cell range by defining `row`, `column`, `row2`, `column2` to get only a fragment of table data.
   *
   * @memberof Core#
   * @function getData
   * @param {Number} [row] From visual row index.
   * @param {Number} [column] From visual column index.
   * @param {Number} [row2] To visual row index.
   * @param {Number} [column2] To visual column index.
   * @returns {Array[]} Array with the data.
   * @example
   * ```js
   * // Get all data (in order how it is rendered in the table).
   * hot.getData();
   * // Get data fragment (from top-left 0, 0 to bottom-right 3, 3).
   * hot.getData(3, 3);
   * // Get data fragment (from top-left 2, 1 to bottom-right 3, 3).
   * hot.getData(2, 1, 3, 3);
   * ```
   */
  this.getData = function(row, column, row2, column2) {
    if (isUndefined(row)) {
      return datamap.getAll();
    }

    return datamap.getRange(new CellCoords(row, column), new CellCoords(row2, column2), datamap.DESTINATION_RENDERER);
  };

  /**
   * Returns a string value of the selected range. Each column is separated by tab, each row is separated by a new
   * line character (see {@link DataMap#getCopyableText}).
   *
   * @memberof Core#
   * @function getCopyableText
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
   * Returns the data's copyable value at specified `row` and `column` index (see {@link DataMap#getCopyable}).
   *
   * @memberof Core#
   * @function getCopyableData
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
   * @returns {Object} Schema object.
   */
  this.getSchema = function() {
    return datamap.getSchema();
  };

  /**
   * Use it if you need to change configuration after initialization. The `settings` argument is an object containing the new
   * settings, declared the same way as in the initial settings object.
   *
   * __Note__, that although the `updateSettings` method doesn't overwrite the previously declared settings, it might reset
   * the settings made post-initialization. (for example - ignore changes made using the columnResize feature).
   *
   * @memberof Core#
   * @function updateSettings
   * @param {Object} settings New settings object (see {@link Options}).
   * @param {Boolean} [init=false] Internally used for in initialization mode.
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
  this.updateSettings = function(settings, init = false) {
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

    // eslint-disable-next-line no-restricted-syntax
    for (i in settings) {
      if (i === 'data') {
        /* eslint-disable-next-line no-continue */
        continue; // loadData will be triggered later

      } else if (i === 'language') {
        setLanguage(settings.language);

        /* eslint-disable-next-line no-continue */
        continue;

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

        j += 1;
      }
    }

    if (isDefined(settings.cell)) {
      objectEach(settings.cell, (cell) => {
        instance.setCellMetaObject(cell.row, cell.col, cell);
      });
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
      const initialStyle = instance.rootElement.getAttribute('style');

      if (initialStyle) {
        instance.rootElement.setAttribute('data-initialstyle', instance.rootElement.getAttribute('style'));
      }
    }

    if (height === null) {
      const initialStyle = instance.rootElement.getAttribute('data-initialstyle');

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
      let width = settings.width;

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
      editorManager.lockEditor();
      instance._refreshBorders(null);
      editorManager.unlockEditor();
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
   * @returns {*} Value of selected cell.
   */
  this.getValue = function() {
    const sel = instance.getSelectedLast();

    if (GridSettings.prototype.getValue) {
      if (isFunction(GridSettings.prototype.getValue)) {
        return GridSettings.prototype.getValue.call(instance);
      } else if (sel) {
        return instance.getData()[sel[0][0]][GridSettings.prototype.getValue];
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

    const expandedType = {};
    let type;

    if (typeof obj.type === 'object') {
      type = obj.type;
    } else if (typeof obj.type === 'string') {
      type = getCellType(obj.type);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const i in type) {
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
   * @returns {Object} Object containing the current table settings.
   */
  this.getSettings = function() {
    return priv.settings;
  };

  /**
   * Clears the data from the table (the table settings remain intact).
   *
   * @memberof Core#
   * @function clear
   */
  this.clear = function() {
    this.selectAll();
    this.emptySelectedCells();
  };

  /**
   * Allows altering the table structure by either inserting/removing rows or columns.
   *
   * @memberof Core#
   * @function alter
   * @param {String} action Possible alter operations:
   *  * `'insert_row'`
   *  * `'insert_col'`
   *  * `'remove_row'`
   *  * `'remove_col'`
   * @param {Number|Number[]} index Visual index of the row/column before which the new row/column will be
   *                                inserted/removed or an array of arrays in format `[[index, amount],...]`.
   * @param {Number} [amount=1] Amount of rows/columns to be inserted or removed.
   * @param {String} [source] Source indicator.
   * @param {Boolean} [keepEmptyRows] Flag for preventing deletion of empty rows.
   * @example
   * ```js
   * // Insert new row above the row at given visual index.
   * hot.alter('insert_row', 10);
   * // Insert 3 new columns before 10th column.
   * hot.alter('insert_col', 10, 3);
   * // Remove 2 rows starting from 10th row.
   * hot.alter('remove_row', 10, 2);
   * // Remove 5 non-contiquous rows (it removes 3 rows from visual index 1 and 2 rows from visual index 5).
   * hot.alter('remove_row', [[1, 3], [5, 2]]);
   * ```
   */
  this.alter = function(action, index, amount, source, keepEmptyRows) {
    grid.alter(action, index, amount, source, keepEmptyRows);
  };

  /**
   * Returns a TD element for the given `row` and `column` arguments, if it is rendered on screen.
   * Returns `null` if the TD is not rendered on screen (probably because that part of the table is not visible).
   *
   * @memberof Core#
   * @function getCell
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {Boolean} [topmost=false] If set to `true`, it returns the TD element from the topmost overlay. For example,
   * if the wanted cell is in the range of fixed rows, it will return a TD element from the `top` overlay.
   * @returns {HTMLTableCellElement|null} The cell's TD element.
   */
  this.getCell = function(row, column, topmost = false) {
    return instance.view.getCellAtCoords(new CellCoords(row, column), topmost);
  };

  /**
   * Returns the coordinates of the cell, provided as a HTML table cell element.
   *
   * @memberof Core#
   * @function getCoords
   * @param {HTMLTableCellElement} element The HTML Element representing the cell.
   * @returns {CellCoords} Visual coordinates object.
   * @example
   * ```js
   * hot.getCoords(hot.getCell(1, 1));
   * // it returns CellCoords object instance with props row: 1 and col: 1.
   * ```
   */
  this.getCoords = function(element) {
    return this.view.wt.wtTable.getCoords.call(this.view.wt.wtTable, element);
  };

  /**
   * Returns the property name that corresponds with the given column index (see {@link DataMap#colToProp}).
   * If the data source is an array of arrays, it returns the columns index.
   *
   * @memberof Core#
   * @function colToProp
   * @param {Number} column Visual column index.
   * @returns {String|Number} Column property or physical column index.
   */
  this.colToProp = function(column) {
    return datamap.colToProp(column);
  };

  /**
   * Returns column index that corresponds with the given property (see {@link DataMap#propToCol}).
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
   * This method is useful when you want to retrieve visual row index which can be reordered, moved or trimmed
   * based on a physical index
   *
   * @memberof Core#
   * @function toVisualRow
   * @param {Number} row Physical row index.
   * @returns {Number} Returns visual row index.
   */
  this.toVisualRow = row => recordTranslator.toVisualRow(row);

  /**
   * Translate physical column index into visual.
   *
   * This method is useful when you want to retrieve visual column index which can be reordered, moved or trimmed
   * based on a physical index
   *
   * @memberof Core#
   * @function toVisualColumn
   * @param {Number} column Physical column index.
   * @returns {Number} Returns visual column index.
   */
  this.toVisualColumn = column => recordTranslator.toVisualColumn(column);

  /**
   * Translate visual row index into physical.
   *
   * This method is useful when you want to retrieve physical row index based on a visual index which can be
   * reordered, moved or trimmed.
   *
   * @memberof Core#
   * @function toPhysicalRow
   * @param {Number} row Visual row index.
   * @returns {Number} Returns physical row index.
   */
  this.toPhysicalRow = row => recordTranslator.toPhysicalRow(row);

  /**
   * Translate visual column index into physical.
   *
   * This method is useful when you want to retrieve physical column index based on a visual index which can be
   * reordered, moved or trimmed.
   *
   * @memberof Core#
   * @function toPhysicalColumn
   * @param {Number} column Visual column index.
   * @returns {Number} Returns physical column index.
   */
  this.toPhysicalColumn = column => recordTranslator.toPhysicalColumn(column);

  /**
   * @description
   * Returns the cell value at `row`, `column`.
   *
   * __Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataAtCell
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @returns {*} Data at cell.
   */
  this.getDataAtCell = function(row, column) {
    return datamap.get(row, datamap.colToProp(column));
  };

  /**
   * Returns value at visual `row` and `prop` indexes (see {@link DataMap#get}).
   *
   * __Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.
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
   * Returns array of column values from the data source.
   *
   * __Note__: If columns were reordered or sorted, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataAtCol
   * @param {Number} column Visual column index.
   * @returns {Array} Array of cell values.
   */
  this.getDataAtCol = function(column) {
    return [].concat(...datamap.getRange(new CellCoords(0, column), new CellCoords(priv.settings.data.length - 1, column), datamap.DESTINATION_RENDERER));
  };

  /**
   * Given the object property name (e.g. `'first.name'` or `'0'`), returns an array of column's values from the table data.
   * You can also provide a column index as the first argument.
   *
   * @memberof Core#
   * @function getDataAtProp
   * @param {String|Number} prop Property name or physical column index.
   * @returns {Array} Array of cell values.
   */
  // TODO: Getting data from `datamap` should work on visual indexes.
  this.getDataAtProp = function(prop) {
    const range = datamap.getRange(
      new CellCoords(0, datamap.propToCol(prop)),
      new CellCoords(priv.settings.data.length - 1, datamap.propToCol(prop)),
      datamap.DESTINATION_RENDERER);

    return [].concat(...range);
  };

  /**
   * Returns the source data object (the same that was passed by `data` configuration option or `loadData` method).
   * Optionally you can provide a cell range by using the `row`, `column`, `row2`, `column2` arguments, to get only a
   * fragment of the table data.
   *
   * __Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
   * sorted or trimmed only physical indexes are correct.
   *
   * @memberof Core#
   * @function getSourceData
   * @param {Number} [row] From physical row index.
   * @param {Number} [column] From physical column index (or visual index, if data type is an array of objects).
   * @param {Number} [row2] To physical row index.
   * @param {Number} [column2] To physical column index (or visual index, if data type is an array of objects).
   * @returns {Array[]|Object[]} The table data.
   */
  this.getSourceData = function(row, column, row2, column2) {
    let data;

    if (row === void 0) {
      data = dataSource.getData();
    } else {
      data = dataSource.getByRange(new CellCoords(row, column), new CellCoords(row2, column2));
    }

    return data;
  };

  /**
   * Returns the source data object as an arrays of arrays format even when source data was provided in another format.
   * Optionally you can provide a cell range by using the `row`, `column`, `row2`, `column2` arguments, to get only a
   * fragment of the table data.
   *
   * __Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
   * sorted or trimmed only physical indexes are correct.
   *
   * @memberof Core#
   * @function getSourceDataArray
   * @param {Number} [row] From physical row index.
   * @param {Number} [column] From physical column index (or visual index, if data type is an array of objects).
   * @param {Number} [row2] To physical row index.
   * @param {Number} [column2] To physical column index (or visual index, if data type is an array of objects).
   * @returns {Array} An array of arrays.
   */
  this.getSourceDataArray = function(row, column, row2, column2) {
    let data;

    if (row === void 0) {
      data = dataSource.getData(true);
    } else {
      data = dataSource.getByRange(new CellCoords(row, column), new CellCoords(row2, column2), true);
    }

    return data;
  };

  /**
   * Returns an array of column values from the data source.
   *
   * @memberof Core#
   * @function getSourceDataAtCol
   * @param {Number} column Visual column index.
   * @returns {Array} Array of the column's cell values.
   */
  // TODO: Getting data from `sourceData` should work always on physical indexes.
  this.getSourceDataAtCol = function(column) {
    return dataSource.getAtColumn(column);
  };

  /**
   * Returns a single row of the data (array or object, depending on what data format you use).
   *
   * __Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
   * sorted or trimmed only physical indexes are correct.
   *
   * @memberof Core#
   * @function getSourceDataAtRow
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
   */
  // TODO: Getting data from `sourceData` should work always on physical indexes.
  this.getSourceDataAtCell = function(row, column) {
    return dataSource.getAtCell(row, column);
  };

  /**
   * @description
   * Returns a single row of the data.
   *
   * __Note__: If rows were reordered, sorted or trimmed, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataAtRow
   * @param {Number} row Visual row index.
   * @returns {Array} Array of row's cell data.
   */
  this.getDataAtRow = function(row) {
    const data = datamap.getRange(new CellCoords(row, 0), new CellCoords(row, this.countCols() - 1), datamap.DESTINATION_RENDERER);

    return data[0] || [];
  };

  /**
   * @description
   * Returns a data type defined in the Handsontable settings under the `type` key ([Options#type](http://docs.handsontable.com/Options.html#type)).
   * If there are cells with different types in the selected range, it returns `'mixed'`.
   *
   * __Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataType
   * @param {Number} rowFrom From visual row index.
   * @param {Number} columnFrom From visual column index.
   * @param {Number} rowTo To visual row index.
   * @param {Number} columnTo To visual column index.
   * @returns {String} Cell type (e.q: `'mixed'`, `'text'`, `'numeric'`, `'autocomplete'`).
   */
  this.getDataType = function(rowFrom, columnFrom, rowTo, columnTo) {
    const coords = rowFrom === void 0 ? [0, 0, this.countRows(), this.countCols()] : [rowFrom, columnFrom, rowTo, columnTo];
    const [rowStart, columnStart] = coords;
    let [,, rowEnd, columnEnd] = coords;
    let previousType = null;
    let currentType = null;

    if (rowEnd === void 0) {
      rowEnd = rowStart;
    }
    if (columnEnd === void 0) {
      columnEnd = columnStart;
    }
    let type = 'mixed';

    rangeEach(Math.min(rowStart, rowEnd), Math.max(rowStart, rowEnd), (row) => {
      let isTypeEqual = true;

      rangeEach(Math.min(columnStart, columnEnd), Math.max(columnStart, columnEnd), (column) => {
        const cellType = this.getCellMeta(row, column);

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
   * Remove a property defined by the `key` argument from the cell meta object for the provided `row` and `column` coordinates.
   *
   * @memberof Core#
   * @function removeCellMeta
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {String} key Property name.
   * @fires Hooks#beforeRemoveCellMeta
   * @fires Hooks#afterRemoveCellMeta
   */
  this.removeCellMeta = function(row, column, key) {
    const [physicalRow, physicalColumn] = recordTranslator.toPhysical(row, column);
    let cachedValue = priv.cellSettings[physicalRow][physicalColumn][key];

    const hookResult = instance.runHooks('beforeRemoveCellMeta', row, column, key, cachedValue);

    if (hookResult !== false) {
      delete priv.cellSettings[physicalRow][physicalColumn][key];

      instance.runHooks('afterRemoveCellMeta', row, column, key, cachedValue);
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
   * Set cell meta data object defined by `prop` to the corresponding params `row` and `column`.
   *
   * @memberof Core#
   * @function setCellMetaObject
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {Object} prop Meta object.
   */
  this.setCellMetaObject = function(row, column, prop) {
    if (typeof prop === 'object') {
      objectEach(prop, (value, key) => {
        this.setCellMeta(row, column, key, value);
      });
    }
  };

  /**
   * Sets a property defined by the `key` property to the meta object of a cell corresponding to params `row` and `column`.
   *
   * @memberof Core#
   * @function setCellMeta
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @param {String} key Property name.
   * @param {String} value Property value.
   * @fires Hooks#afterSetCellMeta
   */
  this.setCellMeta = function(row, column, key, value) {
    const [physicalRow, physicalColumn] = recordTranslator.toPhysical(row, column);

    if (!priv.columnSettings[physicalColumn]) {
      priv.columnSettings[physicalColumn] = columnFactory(GridSettings, priv.columnsSettingConflicts);
    }

    if (!priv.cellSettings[physicalRow]) {
      priv.cellSettings[physicalRow] = [];
    }
    if (!priv.cellSettings[physicalRow][physicalColumn]) {
      priv.cellSettings[physicalRow][physicalColumn] = new priv.columnSettings[physicalColumn]();
    }
    priv.cellSettings[physicalRow][physicalColumn][key] = value;
    instance.runHooks('afterSetCellMeta', row, column, key, value);
  };

  /**
   * Get all the cells meta settings at least once generated in the table (in order of cell initialization).
   *
   * @memberof Core#
   * @function getCellsMeta
   * @returns {Array} Returns an array of ColumnSettings object instances.
   */
  this.getCellsMeta = function() {
    return arrayFlatten(priv.cellSettings);
  };

  /**
   * Returns the cell properties object for the given `row` and `column` coordinates.
   *
   * @memberof Core#
   * @function getCellMeta
   * @param {Number} row Visual row index.
   * @param {Number} column Visual column index.
   * @returns {Object} The cell properties object.
   * @fires Hooks#beforeGetCellMeta
   * @fires Hooks#afterGetCellMeta
   */
  this.getCellMeta = function(row, column) {
    const prop = datamap.colToProp(column);
    const [potentialPhysicalRow, physicalColumn] = recordTranslator.toPhysical(row, column);
    let physicalRow = potentialPhysicalRow;

    // Workaround for #11. Connected also with #3849. It should be fixed within #4497.
    if (physicalRow === null) {
      physicalRow = row;
    }

    if (!priv.columnSettings[physicalColumn]) {
      priv.columnSettings[physicalColumn] = columnFactory(GridSettings, priv.columnsSettingConflicts);
    }

    if (!priv.cellSettings[physicalRow]) {
      priv.cellSettings[physicalRow] = [];
    }
    if (!priv.cellSettings[physicalRow][physicalColumn]) {
      priv.cellSettings[physicalRow][physicalColumn] = new priv.columnSettings[physicalColumn]();
    }

    const cellProperties = priv.cellSettings[physicalRow][physicalColumn]; // retrieve cellProperties from cache

    cellProperties.row = physicalRow;
    cellProperties.col = physicalColumn;
    cellProperties.visualRow = row;
    cellProperties.visualCol = column;
    cellProperties.prop = prop;
    cellProperties.instance = instance;

    instance.runHooks('beforeGetCellMeta', row, column, cellProperties);
    extend(cellProperties, expandType(cellProperties)); // for `type` added in beforeGetCellMeta

    if (cellProperties.cells) {
      const settings = cellProperties.cells.call(cellProperties, physicalRow, physicalColumn, prop);

      if (settings) {
        extend(cellProperties, settings);
        extend(cellProperties, expandType(settings)); // for `type` added in cells
      }
    }

    instance.runHooks('afterGetCellMeta', row, column, cellProperties);

    return cellProperties;
  };

  /**
   * Returns an array of cell meta objects for specyfied physical row index.
   *
   * @memberof Core#
   * @function getCellMetaAtRow
   * @param {Number} row Physical row index.
   * @returns {Array}
   */
  this.getCellMetaAtRow = function(row) {
    return priv.cellSettings[row];
  };

  /**
   * Checks if the data format and config allows user to modify the column structure.
   *
   * @memberof Core#
   * @function isColumnModificationAllowed
   * @returns {Boolean}
   */
  this.isColumnModificationAllowed = function() {
    return !(instance.dataType === 'object' || instance.getSettings().columns);
  };

  const rendererLookup = cellMethodLookupFactory('renderer');

  /**
   * Returns the cell renderer function by given `row` and `column` arguments.
   *
   * @memberof Core#
   * @function getCellRenderer
   * @param {Number|Object} row Visual row index or cell meta object (see {@link Core#getCellMeta}).
   * @param {Number} column Visual column index.
   * @returns {Function} The renderer function.
   * @example
   * ```js
   * // Get cell renderer using `row` and `column` coordinates.
   * hot.getCellRenderer(1, 1);
   * // Get cell renderer using cell meta object.
   * hot.getCellRenderer(hot.getCellMeta(1, 1));
   * ```
   */
  this.getCellRenderer = function(row, column) {
    return getRenderer(rendererLookup.call(this, row, column));
  };

  /**
   * Returns the cell editor class by the provided `row` and `column` arguments.
   *
   * @memberof Core#
   * @function getCellEditor
   * @param {Number} row Visual row index or cell meta object (see {@link Core#getCellMeta}).
   * @param {Number} column Visual column index.
   * @returns {Function} The editor class.
   * @example
   * ```js
   * // Get cell editor class using `row` and `column` coordinates.
   * hot.getCellEditor(1, 1);
   * // Get cell editor class using cell meta object.
   * hot.getCellEditor(hot.getCellMeta(1, 1));
   * ```
   */
  this.getCellEditor = cellMethodLookupFactory('editor');

  const validatorLookup = cellMethodLookupFactory('validator');

  /**
   * Returns the cell validator by `row` and `column`.
   *
   * @memberof Core#
   * @function getCellValidator
   * @param {Number|Object} row Visual row index or cell meta object (see {@link Core#getCellMeta}).
   * @param {Number} column Visual column index.
   * @returns {Function|RegExp|undefined} The validator function.
   * @example
   * ```js
   * // Get cell valiator using `row` and `column` coordinates.
   * hot.getCellValidator(1, 1);
   * // Get cell valiator using cell meta object.
   * hot.getCellValidator(hot.getCellMeta(1, 1));
   * ```
   */
  this.getCellValidator = function(row, column) {
    let validator = validatorLookup.call(this, row, column);

    if (typeof validator === 'string') {
      validator = getValidator(validator);
    }

    return validator;
  };

  /**
   * Validates all cells using their validator functions and calls callback when finished.
   *
   * If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it
   * would equal `true`.
   *
   * @memberof Core#
   * @function validateCells
   * @param {Function} [callback] The callback function.
   * @example
   * ```js
   * hot.validateCells((valid) => {
   *   if (valid) {
   *     // ... code for validated cells
   *   }
   * })
   * ```
   */
  this.validateCells = function(callback) {
    this._validateCells(callback);
  };

  /**
   * Validates rows using their validator functions and calls callback when finished.
   *
   * If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it
   *  would equal `true`.
   *
   * @memberof Core#
   * @function validateRows
   * @param {Array} [rows] Array of validation target visual row indexes.
   * @param {Function} [callback] The callback function.
   * @example
   * ```js
   * hot.validateRows([3, 4, 5], (valid) => {
   *   if (valid) {
   *     // ... code for validated rows
   *   }
   * })
   * ```
   */
  this.validateRows = function(rows, callback) {
    if (!Array.isArray(rows)) {
      throw new Error('validateRows parameter `rows` must be an array');
    }
    this._validateCells(callback, rows);
  };

  /**
   * Validates columns using their validator functions and calls callback when finished.
   *
   * If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it
   *  would equal `true`.
   *
   * @memberof Core#
   * @function validateColumns
   * @param {Array} [columns] Array of validation target visual columns indexes.
   * @param {Function} [callback] The callback function.
   * @example
   * ```js
   * hot.validateColumns([3, 4, 5], (valid) => {
   *   if (valid) {
   *     // ... code for validated columns
   *   }
   * })
   * ```
   */
  this.validateColumns = function(columns, callback) {
    if (!Array.isArray(columns)) {
      throw new Error('validateColumns parameter `columns` must be an array');
    }
    this._validateCells(callback, undefined, columns);
  };

  /**
   * Validates all cells using their validator functions and calls callback when finished.
   *
   * If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it would equal `true`.
   *
   * Private use intended.
   *
   * @private
   * @memberof Core#
   * @function _validateCells
   * @param {Function} [callback] The callback function.
   * @param {Array} [rows] An array of validation target visual row indexes.
   * @param {Array} [columns] An array of validation target visual column indexes.
   */
  this._validateCells = function(callback, rows, columns) {
    const waitingForValidator = new ValidatorsQueue();

    if (callback) {
      waitingForValidator.onQueueEmpty = callback;
    }

    let i = instance.countRows() - 1;

    while (i >= 0) {
      if (rows !== undefined && rows.indexOf(i) === -1) {
        i -= 1;
        continue;
      }
      let j = instance.countCols() - 1;

      while (j >= 0) {
        if (columns !== undefined && columns.indexOf(j) === -1) {
          j -= 1;
          continue;
        }
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
        j -= 1;
      }
      i -= 1;
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
   * @returns {Array|String|Number} Array of header values / single header value.
   */
  this.getRowHeader = function(row) {
    let rowHeader = priv.settings.rowHeaders;
    let physicalRow = row;

    if (physicalRow !== void 0) {
      physicalRow = instance.runHooks('modifyRowHeader', physicalRow);
    }
    if (physicalRow === void 0) {
      rowHeader = [];
      rangeEach(instance.countRows() - 1, (i) => {
        rowHeader.push(instance.getRowHeader(i));
      });

    } else if (Array.isArray(rowHeader) && rowHeader[physicalRow] !== void 0) {
      rowHeader = rowHeader[physicalRow];

    } else if (isFunction(rowHeader)) {
      rowHeader = rowHeader(physicalRow);

    } else if (rowHeader && typeof rowHeader !== 'string' && typeof rowHeader !== 'number') {
      rowHeader = physicalRow + 1;
    }

    return rowHeader;
  };

  /**
   * Returns information about if this table is configured to display row headers.
   *
   * @memberof Core#
   * @function hasRowHeaders
   * @returns {Boolean} `true` if the instance has the row headers enabled, `false` otherwise.
   */
  this.hasRowHeaders = function() {
    return !!priv.settings.rowHeaders;
  };

  /**
   * Returns information about if this table is configured to display column headers.
   *
   * @memberof Core#
   * @function hasColHeaders
   * @returns {Boolean} `true` if the instance has the column headers enabled, `false` otherwise.
   */
  this.hasColHeaders = function() {
    if (priv.settings.colHeaders !== void 0 && priv.settings.colHeaders !== null) { // Polymer has empty value = null
      return !!priv.settings.colHeaders;
    }
    for (let i = 0, ilen = instance.countCols(); i < ilen; i++) {
      if (instance.getColHeader(i)) {
        return true;
      }
    }

    return false;
  };

  /**
   * Returns an array of column headers (in string format, if they are enabled). If param `column` is given, it
   * returns the header at the given column.
   *
   * @memberof Core#
   * @function getColHeader
   * @param {Number} [column] Visual column index.
   * @fires Hooks#modifyColHeader
   * @returns {Array|String|Number} The column header(s).
   */
  this.getColHeader = function(column) {
    const columnsAsFunc = priv.settings.columns && isFunction(priv.settings.columns);
    const columnIndex = instance.runHooks('modifyColHeader', column);
    let result = priv.settings.colHeaders;

    if (columnIndex === void 0) {
      const out = [];
      const ilen = columnsAsFunc ? instance.countSourceCols() : instance.countCols();

      for (let i = 0; i < ilen; i++) {
        out.push(instance.getColHeader(i));
      }

      result = out;

    } else {
      const translateVisualIndexToColumns = function(visualColumnIndex) {
        const arr = [];
        const columnsLen = instance.countSourceCols();
        let index = 0;

        for (; index < columnsLen; index++) {
          if (isFunction(instance.getSettings().columns) && instance.getSettings().columns(index)) {
            arr.push(index);
          }
        }

        return arr[visualColumnIndex];
      };
      const baseCol = columnIndex;
      const physicalColumn = instance.runHooks('modifyCol', baseCol);

      const prop = translateVisualIndexToColumns(physicalColumn);

      if (priv.settings.colHeaders === false) {
        result = null;

      } else if (priv.settings.columns && isFunction(priv.settings.columns) && priv.settings.columns(prop) && priv.settings.columns(prop).title) {
        result = priv.settings.columns(prop).title;

      } else if (priv.settings.columns && priv.settings.columns[physicalColumn] && priv.settings.columns[physicalColumn].title) {
        result = priv.settings.columns[physicalColumn].title;

      } else if (Array.isArray(priv.settings.colHeaders) && priv.settings.colHeaders[physicalColumn] !== void 0) {
        result = priv.settings.colHeaders[physicalColumn];

      } else if (isFunction(priv.settings.colHeaders)) {
        result = priv.settings.colHeaders(physicalColumn);

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
    const cellProperties = instance.getCellMeta(0, col);
    let width = cellProperties.width;

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
   * @param {Number} column Visual column index.
   * @returns {Number} Column width.
   * @fires Hooks#modifyColWidth
   */
  this.getColWidth = function(column) {
    let width = instance._getColWidthFromSettings(column);

    width = instance.runHooks('modifyColWidth', width, column);

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
    let height = priv.settings.rowHeights;

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
   * @param {Number} row Visual row index.
   * @returns {Number} The given row's height.
   * @fires Hooks#modifyRowHeight
   */
  this.getRowHeight = function(row) {
    let height = instance._getRowHeightFromSettings(row);

    height = instance.runHooks('modifyRowHeight', height, row);

    return height;
  };

  /**
   * Returns the total number of rows in the data source.
   *
   * @memberof Core#
   * @function countSourceRows
   * @returns {Number} Total number of rows.
   */
  this.countSourceRows = function() {
    const sourceLength = instance.runHooks('modifySourceLength');
    return sourceLength || (instance.getSourceData() ? instance.getSourceData().length : 0);
  };

  /**
   * Returns the total number of columns in the data source.
   *
   * @memberof Core#
   * @function countSourceCols
   * @returns {Number} Total number of columns.
   */
  this.countSourceCols = function() {
    let len = 0;
    const obj = instance.getSourceData() && instance.getSourceData()[0] ? instance.getSourceData()[0] : [];

    if (isObject(obj)) {
      len = deepObjectSize(obj);

    } else {
      len = obj.length || 0;
    }

    return len;
  };

  /**
   * Returns the total number of visual rows in the table.
   *
   * @memberof Core#
   * @function countRows
   * @returns {Number} Total number of rows.
   */
  this.countRows = function() {
    return datamap.getLength();
  };

  /**
   * Returns the total number of visible columns in the table.
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
      const columnsIsFunction = isFunction(priv.settings.columns);

      if (columnsIsFunction) {
        if (instance.dataType === 'array') {
          let columnLen = 0;

          for (let i = 0; i < dataLen; i++) {
            if (priv.settings.columns(i)) {
              columnLen += 1;
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
   * @param {Boolean} [ending=false] If `true`, will only count empty rows at the end of the data source.
   * @returns {Number} Count empty rows.
   */
  this.countEmptyRows = function(ending = false) {
    let emptyRows = 0;

    rangeEachReverse(instance.countRows() - 1, (visualIndex) => {
      if (instance.isEmptyRow(visualIndex)) {
        emptyRows += 1;

      } else if (ending === true) {
        return false;
      }
    });

    return emptyRows;
  };

  /**
   * Returns the number of empty columns. If the optional ending parameter is `true`, returns the number of empty
   * columns at right hand edge of the table.
   *
   * @memberof Core#
   * @function countEmptyCols
   * @param {Boolean} [ending=false] If `true`, will only count empty columns at the end of the data source row.
   * @returns {Number} Count empty cols.
   */
  this.countEmptyCols = function(ending = false) {
    if (instance.countRows() < 1) {
      return 0;
    }

    let emptyColumns = 0;

    rangeEachReverse(instance.countCols() - 1, (visualIndex) => {
      if (instance.isEmptyCol(visualIndex)) {
        emptyColumns += 1;

      } else if (ending === true) {
        return false;
      }
    });

    return emptyColumns;
  };

  /**
   * Check if all cells in the row declared by the `row` argument are empty.
   *
   * @memberof Core#
   * @function isEmptyRow
   * @param {Number} row Visual row index.
   * @returns {Boolean} `true` if the row at the given `row` is empty, `false` otherwise.
   */
  this.isEmptyRow = function(row) {
    return priv.settings.isEmptyRow.call(instance, row);
  };

  /**
   * Check if all cells in the the column declared by the `column` argument are empty.
   *
   * @memberof Core#
   * @function isEmptyCol
   * @param {Number} column Column index.
   * @returns {Boolean} `true` if the column at the given `col` is empty, `false` otherwise.
   */
  this.isEmptyCol = function(column) {
    return priv.settings.isEmptyCol.call(instance, column);
  };

  /**
   * Select cell specified by `row` and `column` values or a range of cells finishing at `endRow`, `endCol`. If the table
   * was configured to support data column properties that properties can be used to making a selection.
   *
   * By default, viewport will be scrolled to the selection. After the `selectCell` method had finished, the instance
   * will be listening to keyboard input on the document.
   *
   * @example
   * ```js
   * // select a single cell
   * hot.selectCell(2, 4);
   * // select a single cell using column property
   * hot.selectCell(2, 'address');
   * // select a range of cells
   * hot.selectCell(2, 4, 3, 5);
   * // select a range of cells using column properties
   * hot.selectCell(2, 'address', 3, 'phone_number');
   * // select a range of cells without scrolling to them
   * hot.selectCell(2, 'address', 3, 'phone_number', false);
   * ```
   *
   * @memberof Core#
   * @function selectCell
   * @param {Number} row Visual row index.
   * @param {Number|String} column Visual column index or column property.
   * @param {Number} [endRow] Visual end row index (if selecting a range).
   * @param {Number|String} [endColumn] Visual end column index or column property (if selecting a range).
   * @param {Boolean} [scrollToCell=true] If `true`, the viewport will be scrolled to the selection.
   * @param {Boolean} [changeListener=true] If `false`, Handsontable will not change keyboard events listener to himself.
   * @returns {Boolean} `true` if selection was successful, `false` otherwise.
   */
  this.selectCell = function(row, column, endRow, endColumn, scrollToCell = true, changeListener = true) {
    if (isUndefined(row) || isUndefined(column)) {
      return false;
    }

    return this.selectCells([[row, column, endRow, endColumn]], scrollToCell, changeListener);
  };

  /**
   * Make multiple, non-contiguous selection specified by `row` and `column` values or a range of cells
   * finishing at `endRow`, `endColumn`. The method supports two input formats which are the same as that
   * produces by `getSelected` and `getSelectedRange` methods.
   *
   * By default, viewport will be scrolled to selection. After the `selectCells` method had finished, the instance
   * will be listening to keyboard input on the document.
   *
   * @example
   * ```js
   * // Using an array of arrays.
   * hot.selectCells([[1, 1, 2, 2], [3, 3], [6, 2, 0, 2]]);
   * // Using an array of arrays with defined columns as props.
   * hot.selectCells([[1, 'id', 2, 'first_name'], [3, 'full_name'], [6, 'last_name', 0, 'first_name']]);
   * // Using an array of CellRange objects (produced by `.getSelectedRange()` method).
   * const selected = hot.getSelectedRange();
   *
   * selected[0].from.row = 0;
   * selected[0].from.col = 0;
   *
   * hot.selectCells(selected);
   * ```
   *
   * @memberof Core#
   * @since 0.38.0
   * @function selectCells
   * @param {Array[]|CellRange[]} coords Visual coords passed as an array of array (`[[rowStart, columnStart, rowEnd, columnEnd], ...]`)
   *                                     the same format as `getSelected` method returns or as an CellRange objects
   *                                     which is the same format what `getSelectedRange` method returns.
   * @param {Boolean} [scrollToCell=true] If `true`, the viewport will be scrolled to the selection.
   * @param {Boolean} [changeListener=true] If `false`, Handsontable will not change keyboard events listener to himself.
   * @returns {Boolean} `true` if selection was successful, `false` otherwise.
   */
  this.selectCells = function(coords = [[]], scrollToCell = true, changeListener = true) {
    if (scrollToCell === false) {
      preventScrollingToCell = true;
    }

    const wasSelected = selection.selectCells(coords);

    if (wasSelected && changeListener) {
      instance.listen();
    }
    preventScrollingToCell = false;

    return wasSelected;
  };

  /**
   * Select the cell specified by the `row` and `prop` arguments, or a range finishing at `endRow`, `endProp`.
   * By default, viewport will be scrolled to selection.
   *
   * @deprecated
   * @memberof Core#
   * @function selectCellByProp
   * @param {Number} row Visual row index.
   * @param {String} prop Property name.
   * @param {Number} [endRow] visual end row index (if selecting a range).
   * @param {String} [endProp] End property name (if selecting a range).
   * @param {Boolean} [scrollToCell=true] If `true`, viewport will be scrolled to the selection.
   * @param {Boolean} [changeListener=true] If `false`, Handsontable will not change keyboard events listener to himself.
   * @returns {Boolean} `true` if selection was successful, `false` otherwise.
   */
  this.selectCellByProp = function(row, prop, endRow, endProp, scrollToCell = true, changeListener = true) {
    warn(toSingleLine`Deprecation warning: This method is going to be removed in the next release.
      If you want to select a cell using props, please use the \`selectCell\` method.`);

    return this.selectCells([[row, prop, endRow, endProp]], scrollToCell, changeListener);
  };

  /**
   * Select column specified by `startColumn` visual index, column property or a range of columns finishing at `endColumn`.
   *
   * @example
   * ```js
   * // Select column using visual index.
   * hot.selectColumns(1);
   * // Select column using column property.
   * hot.selectColumns('id');
   * // Select range of columns using visual indexes.
   * hot.selectColumns(1, 4);
   * // Select range of columns using column properties.
   * hot.selectColumns('id', 'last_name');
   * ```
   *
   * @memberof Core#
   * @since 0.38.0
   * @function selectColumns
   * @param {Number} startColumn The visual column index from which the selection starts.
   * @param {Number} [endColumn=startColumn] The visual column index to which the selection finishes. If `endColumn`
   *                                         is not defined the column defined by `startColumn` will be selected.
   * @returns {Boolean} `true` if selection was successful, `false` otherwise.
   */
  this.selectColumns = function(startColumn, endColumn = startColumn) {
    return selection.selectColumns(startColumn, endColumn);
  };

  /**
   * Select row specified by `startRow` visual index or a range of rows finishing at `endRow`.
   *
   * @example
   * ```js
   * // Select row using visual index.
   * hot.selectRows(1);
   * // Select range of rows using visual indexes.
   * hot.selectRows(1, 4);
   * ```
   *
   * @memberof Core#
   * @since 0.38.0
   * @function selectRows
   * @param {Number} startRow The visual row index from which the selection starts.
   * @param {Number} [endRow=startRow] The visual row index to which the selection finishes. If `endRow`
   *                                   is not defined the row defined by `startRow` will be selected.
   * @returns {Boolean} `true` if selection was successful, `false` otherwise.
   */
  this.selectRows = function(startRow, endRow = startRow) {
    return selection.selectRows(startRow, endRow);
  };

  /**
   * Deselects the current cell selection on the table.
   *
   * @memberof Core#
   * @function deselectCell
   */
  this.deselectCell = function() {
    selection.deselect();
  };

  /**
   * Select the whole table. The previous selection will be overwritten.
   *
   * @since 0.38.2
   * @memberof Core#
   * @function selectAll
   */
  this.selectAll = function() {
    preventScrollingToCell = true;
    selection.selectAll();
    preventScrollingToCell = false;
  };

  /**
   * Scroll viewport to coordinates specified by the `row` and `column` arguments.
   *
   * @memberof Core#
   * @function scrollViewportTo
   * @param {Number} [row] Visual row index.
   * @param {Number} [column] Visual column index.
   * @param {Boolean} [snapToBottom = false] If `true`, viewport is scrolled to show the cell on the bottom of the table.
   * @param {Boolean} [snapToRight = false] If `true`, viewport is scrolled to show the cell on the right side of the table.
   * @returns {Boolean} `true` if scroll was successful, `false` otherwise.
   */
  this.scrollViewportTo = function(row, column, snapToBottom = false, snapToRight = false) {
    const snapToTop = !snapToBottom;
    const snapToLeft = !snapToRight;
    let result = false;

    if (row !== void 0 && column !== void 0) {
      result = instance.view.scrollViewport(new CellCoords(row, column), snapToTop, snapToRight, snapToBottom, snapToLeft);
    }
    if (typeof row === 'number' && typeof column !== 'number') {
      result = instance.view.scrollViewportVertically(row, snapToTop, snapToBottom);
    }
    if (typeof column === 'number' && typeof row !== 'number') {
      result = instance.view.scrollViewportHorizontally(column, snapToRight, snapToLeft);
    }

    return result;
  };

  /**
   * Removes the table from the DOM and destroys the instance of the Handsontable.
   *
   * @memberof Core#
   * @function destroy
   * @fires Hooks#afterDestroy
   */
  this.destroy = function() {
    instance._clearTimeouts();
    instance._clearImmediates();

    if (instance.view) { // in case HT is destroyed before initialization has finished
      instance.view.destroy();
    }
    if (dataSource) {
      dataSource.destroy();
    }
    dataSource = null;

    keyStateStopObserving();

    if (process.env.HOT_PACKAGE_TYPE !== '\x63\x65' && isRootInstance(instance)) {
      const licenseInfo = document.querySelector('#hot-display-license-info');

      if (licenseInfo) {
        licenseInfo.parentNode.removeChild(licenseInfo);
      }
    }
    empty(instance.rootElement);
    eventManager.destroy();

    if (editorManager) {
      editorManager.destroy();
    }

    instance.runHooks('afterDestroy');
    Hooks.getSingleton().destroy(instance);

    objectEach(instance, (property, key, obj) => {
      // replace instance methods with post mortem
      if (isFunction(property)) {
        obj[key] = postMortem(key);

      } else if (key !== 'guid') {
        // replace instance properties with null (restores memory)
        // it should not be necessary but this prevents a memory leak side effects that show itself in Jasmine tests
        obj[key] = null;
      }
    });

    instance.isDestroyed = true;

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
  function postMortem(method) {
    return () => {
      throw new Error(`The "${method}" method cannot be called because this Handsontable instance has been destroyed`);
    };
  }

  /**
   * Returns the active editor class instance.
   *
   * @memberof Core#
   * @function getActiveEditor
   * @returns {BaseEditor} The active editor instance.
   */
  this.getActiveEditor = function() {
    return editorManager.getActiveEditor();
  };

  /**
   * Returns plugin instance by provided its name.
   *
   * @memberof Core#
   * @function getPlugin
   * @param {String} pluginName The plugin name.
   * @returns {BasePlugin} The plugin instance.
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
   * @param {String} key Hook name (see {@link Hooks}).
   * @param {Function|Array} callback Function or array of functions.
   * @example
   * ```js
   * hot.addHook('beforeInit', myCallback);
   * ```
   */
  this.addHook = function(key, callback) {
    Hooks.getSingleton().add(key, callback, instance);
  };

  /**
   * Check if for a specified hook name there are added listeners (only for this Handsontable instance). All available
   * hooks you will find {@link Hooks}.
   *
   * @memberof Core#
   * @function hasHook
   * @see Hooks#has
   * @param {String} key Hook name
   * @return {Boolean}
   *
   * @example
   * ```js
   * const hasBeforeInitListeners = hot.hasHook('beforeInit');
   * ```
   */
  this.hasHook = function(key) {
    return Hooks.getSingleton().has(key, instance);
  };

  /**
   * Adds listener to specified hook name (only for this Handsontable instance). After the listener is triggered,
   * it will be automatically removed.
   *
   * @memberof Core#
   * @function addHookOnce
   * @see Hooks#once
   * @param {String} key Hook name (see {@link Hooks}).
   * @param {Function|Array} callback Function or array of functions.
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
   * @param {Function} callback Reference to the function which has been registered using {@link Core#addHook}.
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
   * // Run built-in hook
   * hot.runHooks('beforeInit');
   * // Run custom hook
   * hot.runHooks('customAction', 10, 'foo');
   * ```
   */
  this.runHooks = function(key, p1, p2, p3, p4, p5, p6) {
    return Hooks.getSingleton().run(instance, key, p1, p2, p3, p4, p5, p6);
  };

  /**
   * Get language phrase for specified dictionary key.
   *
   * @memberof Core#
   * @function getTranslatedPhrase
   * @since 0.35.0
   * @param {String} dictionaryKey Constant which is dictionary key.
   * @param {*} extraArguments Arguments which will be handled by formatters.
   * @returns {String}
   */
  this.getTranslatedPhrase = function(dictionaryKey, extraArguments) {
    return getTranslatedPhrase(priv.settings.language, dictionaryKey, extraArguments);
  };

  this.timeouts = [];

  /**
   * Sets timeout. Purpose of this method is to clear all known timeouts when `destroy` method is called.
   *
   * @param {Number|Function} handle Handler returned from setTimeout or function to execute (it will be automatically wraped
   *                                 by setTimeout function).
   * @param {Number} [delay=0] If first argument is passed as a function this argument set delay of the execution of that function.
   * @private
   */
  this._registerTimeout = function(handle, delay = 0) {
    let handleFunc = handle;

    if (typeof handleFunc === 'function') {
      handleFunc = setTimeout(handleFunc, delay);
    }

    this.timeouts.push(handleFunc);
  };

  /**
   * Clears all known timeouts.
   *
   * @private
   */
  this._clearTimeouts = function() {
    arrayEach(this.timeouts, (handler) => {
      clearTimeout(handler);
    });
  };

  this.immediates = [];

  /**
   * Execute function execution to the next event loop cycle. Purpose of this method is to clear all known timeouts when `destroy` method is called.
   *
   * @param {Function} callback Function to be delayed in execution.
   * @private
   */
  this._registerImmediate = function(callback) {
    this.immediates.push(setImmediate(callback));
  };

  /**
   * Clears all known timeouts.
   *
   * @private
   */
  this._clearImmediates = function() {
    arrayEach(this.immediates, (handler) => {
      clearImmediate(handler);
    });
  };

  /**
   * Refresh selection borders. This is temporary method relic after selection rewrite.
   *
   * @private
   * @param {Boolean} [revertOriginal=false] If `true`, the previous value will be restored. Otherwise, the edited value will be saved.
   * @param {Boolean} [prepareEditorIfNeeded=true] If `true` the editor under the selected cell will be prepared to open.
   */
  this._refreshBorders = function(revertOriginal = false, prepareEditorIfNeeded = true) {
    editorManager.destroyEditor(revertOriginal);
    instance.view.render();

    if (prepareEditorIfNeeded && selection.isSelected()) {
      editorManager.prepareEditor();
    }
  };

  Hooks.getSingleton().run(instance, 'construct');
}
