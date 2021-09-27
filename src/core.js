import { addClass, empty, removeClass } from './helpers/dom/element';
import { isFunction } from './helpers/function';
import { isDefined, isUndefined, isRegExp, _injectProductInfo, isEmpty } from './helpers/mixed';
import { isMobileBrowser, isIpadOS } from './helpers/browser';
import EditorManager from './editorManager';
import EventManager from './eventManager';
import {
  deepClone,
  duckSchema,
  isObjectEqual,
  deepObjectSize,
  hasOwnProperty,
  createObjectPropListener,
  objectEach
} from './helpers/object';
import { arrayMap, arrayEach, arrayReduce, getDifferenceOfArrays, stringToArray } from './helpers/array';
import { instanceToHTML } from './utils/parseTable';
import { getPlugin, getPluginsNames } from './plugins/registry';
import { getRenderer } from './renderers/registry';
import { getValidator } from './validators/registry';
import { randomString, toUpperCaseFirst } from './helpers/string';
import { rangeEach, rangeEachReverse, isNumericLike } from './helpers/number';
import TableView from './tableView';
import DataSource from './dataSource';
import { translateRowsToColumns, cellMethodLookupFactory, spreadsheetColumnLabel } from './helpers/data';
import { IndexMapper } from './translations';
import { registerAsRootInstance, hasValidParameter, isRootInstance } from './utils/rootInstance';
import { CellCoords, ViewportColumnsCalculator } from './3rdparty/walkontable/src';
import Hooks from './pluginHooks';
import { hasLanguageDictionary, getValidLanguageCode, getTranslatedPhrase } from './i18n/registry';
import { warnUserAboutLanguageRegistration, normalizeLanguageCode } from './i18n/utils';
import {
  startObserving as keyStateStartObserving,
  stopObserving as keyStateStopObserving
} from './utils/keyStateObserver';
import { Selection } from './selection';
import { MetaManager, DynamicCellMetaMod, DataMap } from './dataMap';
import { createUniqueMap } from './utils/dataStructures/uniqueMap';

let activeGuid = null;

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * Handsontable constructor.
 *
 * @core
 * @class Core
 * @description
 *
 * The `Handsontable` class to which we refer as to `Core`, allows you to modify the grid's behavior by using one of the available public methods.
 *
 * ## How to call a method
 *
 * ```js
 * // First, let's contruct Handsontable
 * const hot = new Handsontable(document.getElementById('example'), options);
 *
 * // Then, let's use the setDataAtCell method
 * hot.setDataAtCell(0, 0, 'new value');
 * ```
 *
 * @param {HTMLElement} rootElement The element to which the Handsontable instance is injected.
 * @param {object} userSettings The user defined options.
 * @param {boolean} [rootInstanceSymbol=false] Indicates if the instance is root of all later instances created.
 */
export default function Core(rootElement, userSettings, rootInstanceSymbol = false) {
  let preventScrollingToCell = false;
  let instance = this;

  const eventManager = new EventManager(instance);
  let datamap;
  let dataSource;
  let grid;
  let editorManager;
  let firstRun = true;

  userSettings.language = getValidLanguageCode(userSettings.language);

  const metaManager = new MetaManager(instance, userSettings, [DynamicCellMetaMod]);
  const tableMeta = metaManager.getTableMeta();
  const globalMeta = metaManager.getGlobalMeta();
  const pluginsRegistry = createUniqueMap();

  if (hasValidParameter(rootInstanceSymbol)) {
    registerAsRootInstance(this);
  }

  // TODO: check if references to DOM elements should be move to UI layer (Walkontable)
  /**
   * Reference to the container element.
   *
   * @private
   * @type {HTMLElement}
   */
  this.rootElement = rootElement;
  /* eslint-enable jsdoc/require-description-complete-sentence */
  /**
   * The nearest document over container.
   *
   * @private
   * @type {Document}
   */
  this.rootDocument = rootElement.ownerDocument;
  /**
   * Window object over container's document.
   *
   * @private
   * @type {Window}
   */
  this.rootWindow = this.rootDocument.defaultView;
  /**
   * A boolean to tell if the Handsontable has been fully destroyed. This is set to `true`
   * after `afterDestroy` hook is called.
   *
   * @memberof Core#
   * @member isDestroyed
   * @type {boolean}
   */
  this.isDestroyed = false;
  /**
   * The counter determines how many times the render suspending was called. It allows
   * tracking the nested suspending calls. For each render suspend resuming call the
   * counter is decremented. The value equal to 0 means the render suspending feature
   * is disabled.
   *
   * @private
   * @type {number}
   */
  this.renderSuspendedCounter = 0;
  /**
   * The counter determines how many times the execution suspending was called. It allows
   * tracking the nested suspending calls. For each execution suspend resuming call the
   * counter is decremented. The value equal to 0 means the execution suspending feature
   * is disabled.
   *
   * @private
   * @type {number}
   */
  this.executionSuspendedCounter = 0;

  keyStateStartObserving(this.rootDocument);

  this.container = this.rootDocument.createElement('div');
  this.renderCall = false;

  rootElement.insertBefore(this.container, rootElement.firstChild);

  if (isRootInstance(this)) {
    _injectProductInfo(userSettings.licenseKey, rootElement);
  }

  this.guid = `ht_${randomString()}`; // this is the namespace for global events

  /**
   * Instance of index mapper which is responsible for managing the column indexes.
   *
   * @memberof Core#
   * @member columnIndexMapper
   * @type {IndexMapper}
   */
  this.columnIndexMapper = new IndexMapper();
  /**
   * Instance of index mapper which is responsible for managing the row indexes.
   *
   * @memberof Core#
   * @member rowIndexMapper
   * @type {IndexMapper}
   */
  this.rowIndexMapper = new IndexMapper();

  dataSource = new DataSource(instance);

  if (!this.rootElement.id || this.rootElement.id.substring(0, 3) === 'ht_') {
    this.rootElement.id = this.guid; // if root element does not have an id, assign a random id
  }

  const visualToRenderableCoords = (coords) => {
    const { row: visualRow, col: visualColumn } = coords;

    return new CellCoords(
      // We just store indexes for rows and columns without headers.
      visualRow >= 0 ? instance.rowIndexMapper.getRenderableFromVisualIndex(visualRow) : visualRow,
      visualColumn >= 0 ? instance.columnIndexMapper.getRenderableFromVisualIndex(visualColumn) : visualColumn
    );
  };

  const renderableToVisualCoords = (coords) => {
    const { row: renderableRow, col: renderableColumn } = coords;

    return new CellCoords(
      // We just store indexes for rows and columns without headers.
      renderableRow >= 0 ? instance.rowIndexMapper.getVisualFromRenderableIndex(renderableRow) : renderableRow,
      renderableColumn >= 0 ? instance.columnIndexMapper.getVisualFromRenderableIndex(renderableColumn) : renderableColumn // eslint-disable-line max-len
    );
  };

  let selection = new Selection(tableMeta, {
    countCols: () => instance.countCols(),
    countRows: () => instance.countRows(),
    propToCol: prop => datamap.propToCol(prop),
    isEditorOpened: () => (instance.getActiveEditor() ? instance.getActiveEditor().isOpened() : false),
    countColsTranslated: () => this.view.countRenderableColumns(),
    countRowsTranslated: () => this.view.countRenderableRows(),
    visualToRenderableCoords,
    renderableToVisualCoords,
    isDisabledCellSelection: (visualRow, visualColumn) =>
      instance.getCellMeta(visualRow, visualColumn).disableVisualSelection
  });

  this.selection = selection;

  const onIndexMapperCacheUpdate = ({ hiddenIndexesChanged }) => {
    if (hiddenIndexesChanged) {
      this.selection.refresh();
    }
  };

  this.columnIndexMapper.addLocalHook('cacheUpdated', onIndexMapperCacheUpdate);
  this.rowIndexMapper.addLocalHook('cacheUpdated', onIndexMapperCacheUpdate);

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
      from.row, instance.colToProp(from.col), to.row, instance.colToProp(to.col), preventScrolling, selectionLayerLevel); // eslint-disable-line max-len

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
          this.view.scrollViewport(visualToRenderableCoords(currentSelectedRange.from));
        } else {
          this.view.scrollViewport(visualToRenderableCoords(cellCoords));
        }

      } else if (isSelectedByRowHeader) {
        this.view.scrollViewportVertically(instance.rowIndexMapper.getRenderableFromVisualIndex(cellCoords.row));

      } else if (isSelectedByColumnHeader) {
        this.view.scrollViewportHorizontally(instance.columnIndexMapper.getRenderableFromVisualIndex(cellCoords.col));
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
     * @param {string} action Possible values: "insert_row", "insert_col", "remove_row", "remove_col".
     * @param {number|Array} index Row or column visual index which from the alter action will be triggered.
     *                             Alter actions such as "remove_row" and "remove_col" support array indexes in the
     *                             format `[[index, amount], [index, amount]...]` this can be used to remove
     *                             non-consecutive columns or rows in one call.
     * @param {number} [amount=1] Ammount rows or columns to remove.
     * @param {string} [source] Optional. Source of hook runner.
     * @param {boolean} [keepEmptyRows] Optional. Flag for preventing deletion of empty rows.
     */
    alter(action, index, amount = 1, source, keepEmptyRows) {
      let delta;

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

          if (tableMeta.maxRows === numberOfSourceRows) {
            return;
          }
          // eslint-disable-next-line no-param-reassign
          index = (isDefined(index)) ? index : numberOfSourceRows;
          delta = datamap.createRow(index, amount, source);

          if (delta) {
            metaManager.createRow(instance.toPhysicalRow(index), amount);

            const currentSelectedRange = selection.selectedRange.current();
            const currentFromRange = currentSelectedRange?.from;
            const currentFromRow = currentFromRange?.row;

            // Moving down the selection (when it exist). It should be present on the "old" row.
            // TODO: The logic here should be handled by selection module.
            if (isDefined(currentFromRow) && currentFromRow >= index) {
              const { row: currentToRow, col: currentToColumn } = currentSelectedRange.to;
              let currentFromColumn = currentFromRange.col;

              // Workaround: headers are not stored inside selection.
              if (selection.isSelectedByRowHeader()) {
                currentFromColumn = -1;
              }

              // Remove from the stack the last added selection as that selection below will be
              // replaced by new transformed selection.
              selection.getSelectedRange().pop();

              // I can't use transforms as they don't work in negative indexes.
              selection.setRangeStartOnly(new CellCoords(currentFromRow + delta, currentFromColumn), true);
              selection.setRangeEnd(new CellCoords(currentToRow + delta, currentToColumn)); // will call render() internally
            } else {
              instance._refreshBorders(); // it will call render and prepare methods
            }
          }
          break;

        case 'insert_col':
          delta = datamap.createCol(index, amount, source);

          if (delta) {
            metaManager.createColumn(instance.toPhysicalColumn(index), amount);

            if (Array.isArray(tableMeta.colHeaders)) {
              const spliceArray = [index, 0];

              spliceArray.length += delta; // inserts empty (undefined) elements at the end of an array
              Array.prototype.splice.apply(tableMeta.colHeaders, spliceArray); // inserts empty (undefined) elements into the colHeader array
            }

            const currentSelectedRange = selection.selectedRange.current();
            const currentFromRange = currentSelectedRange?.from;
            const currentFromColumn = currentFromRange?.col;

            // Moving right the selection (when it exist). It should be present on the "old" row.
            // TODO: The logic here should be handled by selection module.
            if (isDefined(currentFromColumn) && currentFromColumn >= index) {
              const { row: currentToRow, col: currentToColumn } = currentSelectedRange.to;
              let currentFromRow = currentFromRange.row;

              // Workaround: headers are not stored inside selection.
              if (selection.isSelectedByColumnHeader()) {
                currentFromRow = -1;
              }

              // Remove from the stack the last added selection as that selection below will be
              // replaced by new transformed selection.
              selection.getSelectedRange().pop();

              // I can't use transforms as they don't work in negative indexes.
              selection.setRangeStartOnly(new CellCoords(currentFromRow, currentFromColumn + delta), true);
              selection.setRangeEnd(new CellCoords(currentToRow, currentToColumn + delta)); // will call render() internally
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
              const wasRemoved = datamap.removeRow(groupIndex, groupAmount, source);

              if (!wasRemoved) {
                return;
              }

              metaManager.removeRow(instance.toPhysicalRow(calcIndex), groupAmount);

              const totalRows = instance.countRows();
              const fixedRowsTop = tableMeta.fixedRowsTop;

              if (fixedRowsTop >= calcIndex + 1) {
                tableMeta.fixedRowsTop -= Math.min(groupAmount, fixedRowsTop - calcIndex);
              }

              const fixedRowsBottom = tableMeta.fixedRowsBottom;

              if (fixedRowsBottom && calcIndex >= totalRows - fixedRowsBottom) {
                tableMeta.fixedRowsBottom -= Math.min(groupAmount, fixedRowsBottom);
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
              let physicalColumnIndex = instance.toPhysicalColumn(calcIndex);

              // If the 'index' is an integer decrease it by 'offset' otherwise pass it through to make the value
              // compatible with datamap.removeCol method.
              if (Number.isInteger(groupIndex)) {
                // eslint-disable-next-line no-param-reassign
                groupIndex = Math.max(groupIndex - offset, 0);
              }

              // TODO: for datamap.removeCol index should be passed as it is (with undefined and null values). If not, the logic
              // inside the datamap.removeCol breaks the removing functionality.
              const wasRemoved = datamap.removeCol(groupIndex, groupAmount, source);

              if (!wasRemoved) {
                return;
              }

              metaManager.removeColumn(physicalColumnIndex, groupAmount);

              const fixedColumnsLeft = tableMeta.fixedColumnsLeft;

              if (fixedColumnsLeft >= calcIndex + 1) {
                tableMeta.fixedColumnsLeft -= Math.min(groupAmount, fixedColumnsLeft - calcIndex);
              }

              if (Array.isArray(tableMeta.colHeaders)) {
                if (typeof physicalColumnIndex === 'undefined') {
                  physicalColumnIndex = -1;
                }
                tableMeta.colHeaders.splice(physicalColumnIndex, groupAmount);
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
     * Makes sure there are empty rows at the bottom of the table.
     */
    adjustRowsAndCols() {
      const minRows = tableMeta.minRows;
      const minSpareRows = tableMeta.minSpareRows;
      const minCols = tableMeta.minCols;
      const minSpareCols = tableMeta.minSpareCols;

      if (minRows) {
        // should I add empty rows to data source to meet minRows?
        const nrOfRows = instance.countRows();

        if (nrOfRows < minRows) {
          // The synchronization with cell meta is not desired here. For `minRows` option,
          // we don't want to touch/shift cell meta objects.
          datamap.createRow(nrOfRows, minRows - nrOfRows, 'auto');
        }
      }
      if (minSpareRows) {
        const emptyRows = instance.countEmptyRows(true);

        // should I add empty rows to meet minSpareRows?
        if (emptyRows < minSpareRows) {
          const emptyRowsMissing = minSpareRows - emptyRows;
          const rowsToCreate = Math.min(emptyRowsMissing, tableMeta.maxRows - instance.countSourceRows());

          // The synchronization with cell meta is not desired here. For `minSpareRows` option,
          // we don't want to touch/shift cell meta objects.
          datamap.createRow(instance.countRows(), rowsToCreate, 'auto');
        }
      }
      {
        let emptyCols;

        // count currently empty cols
        if (minCols || minSpareCols) {
          emptyCols = instance.countEmptyCols(true);
        }

        let nrOfColumns = instance.countCols();

        // should I add empty cols to meet minCols?
        if (minCols && !tableMeta.columns && nrOfColumns < minCols) {
          // The synchronization with cell meta is not desired here. For `minSpareRows` option,
          // we don't want to touch/shift cell meta objects.
          const colsToCreate = minCols - nrOfColumns;

          emptyCols += colsToCreate;

          datamap.createCol(nrOfColumns, colsToCreate, 'auto');
        }
        // should I add empty cols to meet minSpareCols?
        if (minSpareCols && !tableMeta.columns && instance.dataType === 'array' &&
          emptyCols < minSpareCols) {
          nrOfColumns = instance.countCols();
          const emptyColsMissing = minSpareCols - emptyCols;
          const colsToCreate = Math.min(emptyColsMissing, tableMeta.maxCols - nrOfColumns);

          // The synchronization with cell meta is not desired here. For `minSpareRows` option,
          // we don't want to touch/shift cell meta objects.
          datamap.createCol(nrOfColumns, colsToCreate, 'auto');
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
        instance.view.adjustElementsSize();
      }
    },

    /**
     * Populate the data from the provided 2d array from the given cell coordinates.
     *
     * @private
     * @param {object} start Start selection position. Visual indexes.
     * @param {Array} input 2d data array.
     * @param {object} [end] End selection position (only for drag-down mode). Visual indexes.
     * @param {string} [source="populateFromArray"] Source information string.
     * @param {string} [method="overwrite"] Populate method. Possible options: `shift_down`, `shift_right`, `overwrite`.
     * @param {string} direction (left|right|up|down) String specifying the direction.
     * @param {Array} deltas The deltas array. A difference between values of adjacent cells.
     *                       Useful **only** when the type of handled cells is `numeric`.
     * @returns {object|undefined} Ending td in pasted area (only if any cell was changed).
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
                (!tableMeta.allowInsertRow && current.row > instance.countRows() - 1) ||
                (current.row >= tableMeta.maxRows)) {
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

            if ((source === 'CopyPaste.paste' || source === 'Autofill.fill') && cellMeta.skipRowOnPaste) {
              skippedRow += 1;
              current.row += 1;
              rlen += 1;
              /* eslint-disable no-continue */
              continue;
            }
            skippedColumn = 0;

            for (c = 0; c < clen; c++) {
              if ((end && current.col > end.col && colSelectionLength > colInputLength) ||
                  (!tableMeta.allowInsertColumn && current.col > instance.countCols() - 1) ||
                  (current.col >= tableMeta.maxCols)) {
                break;
              }
              cellMeta = instance.getCellMeta(current.row, current.col);

              if ((source === 'CopyPaste.paste' || source === 'Autofill.fill') && cellMeta.skipColumnOnPaste) {
                skippedColumn += 1;
                current.col += 1;
                clen += 1;
                continue;
              }
              if (cellMeta.readOnly && source !== 'UndoRedo.undo') {
                current.col += 1;
                /* eslint-disable no-continue */
                continue;
              }
              const visualColumn = c - skippedColumn;
              let value = getInputValue(visualRow, visualColumn);
              let orgValue = instance.getDataAtCell(current.row, current.col);
              const index = {
                row: visualRow,
                col: visualColumn
              };

              if (source === 'Autofill.fill') {
                const result = instance
                  .runHooks('beforeAutofillInsidePopulate', index, direction, input, deltas, {}, selected);

                if (result) {
                  value = isUndefined(result.value) ? value : result.value;
                }
              }
              if (value !== null && typeof value === 'object') {
                // when 'value' is array and 'orgValue' is null, set 'orgValue' to
                // an empty array so that the null value can be compared to 'value'
                // as an empty value for the array context
                if (Array.isArray(value) && orgValue === null) orgValue = [];

                if (orgValue === null || typeof orgValue !== 'object') {
                  pushData = false;

                } else {
                  const orgValueSchema = duckSchema(Array.isArray(orgValue) ? orgValue : (orgValue[0] || orgValue));
                  const valueSchema = duckSchema(Array.isArray(value) ? value : (value[0] || value));

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
   * @param {string} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
   * @fires Hooks#afterLanguageChange
   */
  function setLanguage(languageCode) {
    const normalizedLanguageCode = normalizeLanguageCode(languageCode);

    if (hasLanguageDictionary(normalizedLanguageCode)) {
      instance.runHooks('beforeLanguageChange', normalizedLanguageCode);

      globalMeta.language = normalizedLanguageCode;

      instance.runHooks('afterLanguageChange', normalizedLanguageCode);

    } else {
      warnUserAboutLanguageRegistration(languageCode);
    }
  }

  /**
   * Internal function to set `className` or `tableClassName`, depending on the key from the settings object.
   *
   * @private
   * @param {string} className `className` or `tableClassName` from the key in the settings object.
   * @param {string|string[]} classSettings String or array of strings. Contains class name(s) from settings object.
   */
  function setClassName(className, classSettings) {
    const element = className === 'className' ? instance.rootElement : instance.table;

    if (firstRun) {
      addClass(element, classSettings);

    } else {
      let globalMetaSettingsArray = [];
      let settingsArray = [];

      if (globalMeta[className]) {
        globalMetaSettingsArray = Array.isArray(globalMeta[className]) ?
          globalMeta[className] : stringToArray(globalMeta[className]);
      }

      if (classSettings) {
        settingsArray = Array.isArray(classSettings) ? classSettings : stringToArray(classSettings);
      }

      const classNameToRemove = getDifferenceOfArrays(globalMetaSettingsArray, settingsArray);
      const classNameToAdd = getDifferenceOfArrays(settingsArray, globalMetaSettingsArray);

      if (classNameToRemove.length) {
        removeClass(element, classNameToRemove);
      }

      if (classNameToAdd.length) {
        addClass(element, classNameToAdd);
      }
    }

    globalMeta[className] = classSettings;
  }

  this.init = function() {
    dataSource.setData(tableMeta.data);
    instance.runHooks('beforeInit');

    if (isMobileBrowser() || isIpadOS()) {
      addClass(instance.rootElement, 'mobile');
    }

    this.updateSettings(tableMeta, true);

    this.view = new TableView(this);
    editorManager = EditorManager.getInstance(instance, tableMeta, selection);

    instance.runHooks('init');

    this.forceFullRender = true; // used when data was changed
    this.view.render();

    if (typeof firstRun === 'object') {
      instance.runHooks('afterChange', firstRun[0], firstRun[1]);
      firstRun = false;
    }
    instance.runHooks('afterInit');
  };

  /**
   * @ignore
   * @returns {object}
   */
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
   * @param {string} numericData Float (separated by a dot or a comma) or integer.
   * @returns {number} Number if we get data in parsable format, not changed value otherwise.
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

  /**
   * @ignore
   * @param {Array} changes The 2D array containing information about each of the edited cells.
   * @param {string} source The string that identifies source of validation.
   * @param {Function} callback The callback function fot async validation.
   */
  function validateChanges(changes, source, callback) {
    if (!changes.length) {
      return;
    }

    const activeEditor = instance.getActiveEditor();
    const beforeChangeResult = instance.runHooks('beforeChange', changes, source || 'edit');
    let shouldBeCanceled = true;

    if (beforeChangeResult === false) {

      if (activeEditor) {
        activeEditor.cancelChanges();
      }

      return;
    }

    const waitingForValidator = new ValidatorsQueue();

    waitingForValidator.onQueueEmpty = (isValid) => {
      if (activeEditor && shouldBeCanceled) {
        activeEditor.cancelChanges();
      }

      callback(isValid); // called when async validators are resolved and beforeChange was not async
    };

    for (let i = changes.length - 1; i >= 0; i--) {
      if (changes[i] === null) {
        changes.splice(i, 1);
      } else {
        const [row, prop, , newValue] = changes[i];
        const col = datamap.propToCol(prop);
        const cellProperties = instance.getCellMeta(row, col);

        if (cellProperties.type === 'numeric' && typeof newValue === 'string' && isNumericLike(newValue)) {
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
                shouldBeCanceled = false;
                changes.splice(index, 1); // cancel the change
                cellPropertiesReference.valid = true; // we cancelled the change, so cell value is still valid

                const cell = instance.getCell(cellPropertiesReference.visualRow, cellPropertiesReference.visualCol);

                if (cell !== null) {
                  removeClass(cell, tableMeta.invalidCellClassName);
                }
                // index -= 1;
              }
              waitingForValidator.removeValidatorFormQueue();
            };
          }(i, cellProperties)), source);
        }
      }
    }
    waitingForValidator.checkIfQueueIsEmpty();
  }

  /**
   * Internal function to apply changes. Called after validateChanges.
   *
   * @private
   * @param {Array} changes Array in form of [row, prop, oldValue, newValue].
   * @param {string} source String that identifies how this change will be described in changes array (useful in onChange callback).
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

      if (tableMeta.allowInsertRow) {
        while (changes[i][0] > instance.countRows() - 1) {
          const numberOfCreatedRows = datamap.createRow(void 0, void 0, source);

          if (numberOfCreatedRows >= 1) {
            metaManager.createRow(null, numberOfCreatedRows);
          } else {
            skipThisChange = true;
            break;
          }
        }
      }

      if (instance.dataType === 'array' && (!tableMeta.columns || tableMeta.columns.length === 0) &&
          tableMeta.allowInsertColumn) {
        while (datamap.propToCol(changes[i][1]) > instance.countCols() - 1) {
          const numberOfCreatedColumns = datamap.createCol(void 0, void 0, source);

          if (numberOfCreatedColumns >= 1) {
            metaManager.createColumn(null, numberOfCreatedColumns);
          } else {
            skipThisChange = true;
            break;
          }
        }
      }

      if (skipThisChange) {
        /* eslint-disable no-continue */
        continue;
      }

      datamap.set(changes[i][0], changes[i][1], changes[i][3]);
    }

    instance.forceFullRender = true; // used when data was changed
    grid.adjustRowsAndCols();
    instance.runHooks('beforeChangeRender', changes, source);
    editorManager.lockEditor();
    instance._refreshBorders(null);
    editorManager.unlockEditor();
    instance.view.adjustElementsSize();
    instance.runHooks('afterChange', changes, source || 'edit');

    const activeEditor = instance.getActiveEditor();

    if (activeEditor && isDefined(activeEditor.refreshValue)) {
      activeEditor.refreshValue();
    }
  }

  /**
   * Validate a single cell.
   *
   * @param {string|number} value The value to validate.
   * @param {object} cellProperties The cell meta which corresponds with the value.
   * @param {Function} callback The callback function.
   * @param {string} source The string that identifies source of the validation.
   */
  this.validateCell = function(value, cellProperties, callback, source) {
    let validator = instance.getCellValidator(cellProperties);

    // the `canBeValidated = false` argument suggests, that the cell passes validation by default.
    /**
     * @param {boolean} valid Indicates if the validation was successful.
     * @param {boolean} [canBeValidated=true] Flag which controls the validation process.
     * @private
     */
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
        const renderableRow = instance.rowIndexMapper.getRenderableFromVisualIndex(row);
        const renderableColumn = instance.columnIndexMapper.getRenderableFromVisualIndex(col);

        instance.view.wt.wtSettings.settings.cellRenderer(renderableRow, renderableColumn, td);
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
      instance._registerImmediate(() => {
        validator.call(cellProperties, value, (valid) => {
          if (!instance) {
            return;
          }
          // eslint-disable-next-line no-param-reassign
          valid = instance
            .runHooks('afterValidate', valid, value, cellProperties.visualRow, cellProperties.prop, source);
          cellProperties.valid = valid;

          done(valid);
          instance.runHooks('postAfterValidate', valid, value, cellProperties.visualRow, cellProperties.prop, source);
        });
      });

    } else {
      // resolve callback even if validator function was not found
      instance._registerImmediate(() => {
        cellProperties.valid = true;
        done(cellProperties.valid, false);
      });
    }
  };

  /**
   * @ignore
   * @param {number} row The visual row index.
   * @param {string|number} propOrCol The visual prop or column index.
   * @param {*} value The cell value.
   * @returns {Array}
   */
  function setDataInputToArray(row, propOrCol, value) {
    if (Array.isArray(row)) { // it's an array of changes
      return row;
    }

    return [[row, propOrCol, value]];
  }

  /**
   * @description
   * Set new value to a cell. To change many cells at once (recommended way), pass an array of `changes` in format
   * `[[row, col, value],...]` as the first argument.
   *
   * @memberof Core#
   * @function setDataAtCell
   * @param {number|Array} row Visual row index or array of changes in format `[[row, col, value],...]`.
   * @param {number} [column] Visual column index.
   * @param {string} [value] New value.
   * @param {string} [source] String that identifies how this change will be described in the changes array (useful in afterChange or beforeChange callback). Set to 'edit' if left empty.
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
        throw new Error('Method `setDataAtCell` accepts row and column number as its parameters. If you want to use object property name, use method `setDataAtRowProp`'); // eslint-disable-line max-len
      }

      if (input[i][1] >= this.countCols()) {
        prop = input[i][1];

      } else {
        prop = datamap.colToProp(input[i][1]);
      }

      changes.push([
        input[i][0],
        prop,
        dataSource.getAtCell(this.toPhysicalRow(input[i][0]), input[i][1]),
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
   * @param {number|Array} row Visual row index or array of changes in format `[[row, prop, value], ...]`.
   * @param {string} prop Property name or the source string (e.g. `'first.name'` or `'0'`).
   * @param {string} value Value to be set.
   * @param {string} [source] String that identifies how this change will be described in changes array (useful in onChange callback).
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
        dataSource.getAtCell(this.toPhysicalRow(input[i][0]), input[i][1]),
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
   * @fires Hooks#afterListen
   */
  this.listen = function() {
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
   * @returns {boolean} `true` if the instance is listening, `false` otherwise.
   */
  this.isListening = function() {
    return activeGuid === instance.guid;
  };

  /**
   * Destroys the current editor, render the table and prepares the editor of the newly selected cell.
   *
   * @memberof Core#
   * @function destroyEditor
   * @param {boolean} [revertOriginal=false] If `true`, the previous value will be restored. Otherwise, the edited value will be saved.
   * @param {boolean} [prepareEditorIfNeeded=true] If `true` the editor under the selected cell will be prepared to open.
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
   * @param {number} row Start visual row index.
   * @param {number} column Start visual column index.
   * @param {Array} input 2d array.
   * @param {number} [endRow] End visual row index (use when you want to cut input when certain row is reached).
   * @param {number} [endCol] End visual column index (use when you want to cut input when certain column is reached).
   * @param {string} [source=populateFromArray] Used to identify this call in the resulting events (beforeChange, afterChange).
   * @param {string} [method=overwrite] Populate method, possible values: `'shift_down'`, `'shift_right'`, `'overwrite'`.
   * @param {string} direction Populate direction, possible values: `'left'`, `'right'`, `'up'`, `'down'`.
   * @param {Array} deltas The deltas array. A difference between values of adjacent cells.
   *                       Useful **only** when the type of handled cells is `numeric`.
   * @returns {object|undefined} Ending td in pasted area (only if any cell was changed).
   */
  this.populateFromArray = function(row, column, input, endRow, endCol, source, method, direction, deltas) {
    if (!(typeof input === 'object' && typeof input[0] === 'object')) {
      throw new Error('populateFromArray parameter `input` must be an array of arrays'); // API changed in 0.9-beta2, let's check if you use it correctly
    }

    const c = typeof endRow === 'number' ? new CellCoords(endRow, endCol) : null;

    return grid.populateFromArray(new CellCoords(row, column), input, c, source, method, direction, deltas);
  };

  /**
   * Adds/removes data from the column. This method works the same as Array.splice for arrays.
   *
   * @memberof Core#
   * @function spliceCol
   * @param {number} column Index of the column in which do you want to do splice.
   * @param {number} index Index at which to start changing the array. If negative, will begin that many elements from the end.
   * @param {number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed.
   * @param {...number} [elements] The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array.
   * @returns {Array} Returns removed portion of columns.
   */
  this.spliceCol = function(column, index, amount, ...elements) {
    return datamap.spliceCol(column, index, amount, ...elements);
  };

  /**
   * Adds/removes data from the row. This method works the same as Array.splice for arrays.
   *
   * @memberof Core#
   * @function spliceRow
   * @param {number} row Index of column in which do you want to do splice.
   * @param {number} index Index at which to start changing the array. If negative, will begin that many elements from the end.
   * @param {number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed.
   * @param {...number} [elements] The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array.
   * @returns {Array} Returns removed portion of rows.
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
   * @param {string} [source] String that identifies how this change will be described in the changes array (useful in afterChange or beforeChange callback). Set to 'edit' if left empty.
   * @since 0.36.0
   */
  this.emptySelectedCells = function(source) {
    if (!selection.isSelected() || this.countRows() === 0 || this.countCols() === 0) {
      return;
    }

    const changes = [];

    arrayEach(selection.getSelectedRange(), (cellRange) => {
      const topLeft = cellRange.getTopLeftCorner();
      const bottomRight = cellRange.getBottomRightCorner();

      rangeEach(topLeft.row, bottomRight.row, (row) => {
        rangeEach(topLeft.col, bottomRight.col, (column) => {
          if (!this.getCellMeta(row, column).readOnly) {
            changes.push([row, column, null]);
          }
        });
      });
    });

    if (changes.length > 0) {
      this.setDataAtCell(changes, source);
    }
  };

  /**
   * Checks if the table rendering process was suspended. See explanation in {@link Core#suspendRender}.
   *
   * @memberof Core#
   * @function isRenderSuspended
   * @since 8.3.0
   * @returns {boolean}
   */
  this.isRenderSuspended = function() {
    return this.renderSuspendedCounter > 0;
  };

  /**
   * Suspends the rendering process. It's helpful to wrap the table render
   * cycles triggered by API calls or UI actions (or both) and call the "render"
   * once in the end. As a result, it improves the performance of wrapped operations.
   * When the table is in the suspend state, most operations will have no visual
   * effect until the rendering state is resumed. Resuming the state automatically
   * invokes the table rendering. To make sure that after executing all operations,
   * the table will be rendered, it's highly recommended to use the {@link Core#batchRender}
   * method or {@link Core#batch}, which additionally aggregates the logic execution
   * that happens behind the table.
   *
   * The method is intended to be used by advanced users. Suspending the rendering
   * process could cause visual glitches when wrongly implemented.
   *
   * @memberof Core#
   * @function suspendRender
   * @since 8.3.0
   * @example
   * ```js
   * hot.suspendRender();
   * hot.alter('insert_row', 5, 45);
   * hot.alter('insert_col', 10, 40);
   * hot.setDataAtCell(1, 1, 'John');
   * hot.setDataAtCell(2, 2, 'Mark');
   * hot.setDataAtCell(3, 3, 'Ann');
   * hot.setDataAtCell(4, 4, 'Sophia');
   * hot.setDataAtCell(5, 5, 'Mia');
   * hot.selectCell(0, 0);
   * hot.resumeRender(); // It re-renders the table internally
   * ```
   */
  this.suspendRender = function() {
    this.renderSuspendedCounter += 1;
  };

  /**
   * Resumes the rendering process. In combination with the {@link Core#suspendRender}
   * method it allows aggregating the table render cycles triggered by API calls or UI
   * actions (or both) and calls the "render" once in the end. When the table is in
   * the suspend state, most operations will have no visual effect until the rendering
   * state is resumed. Resuming the state automatically invokes the table rendering.
   *
   * The method is intended to be used by advanced users. Suspending the rendering
   * process could cause visual glitches when wrongly implemented.
   *
   * @memberof Core#
   * @function resumeRender
   * @since 8.3.0
   * @example
   * ```js
   * hot.suspendRender();
   * hot.alter('insert_row', 5, 45);
   * hot.alter('insert_col', 10, 40);
   * hot.setDataAtCell(1, 1, 'John');
   * hot.setDataAtCell(2, 2, 'Mark');
   * hot.setDataAtCell(3, 3, 'Ann');
   * hot.setDataAtCell(4, 4, 'Sophia');
   * hot.setDataAtCell(5, 5, 'Mia');
   * hot.selectCell(0, 0);
   * hot.resumeRender(); // It re-renders the table internally
   * ```
   */
  this.resumeRender = function() {
    const nextValue = this.renderSuspendedCounter - 1;

    this.renderSuspendedCounter = Math.max(nextValue, 0);

    if (!this.isRenderSuspended() && nextValue === this.renderSuspendedCounter) {
      if (this.renderCall) {
        this.render();
      } else {
        this._refreshBorders(null);
      }
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
    if (this.view) {
      this.renderCall = true;
      this.forceFullRender = true; // used when data was changed

      if (!this.isRenderSuspended()) {
        editorManager.lockEditor();
        this._refreshBorders(null);
        editorManager.unlockEditor();
      }
    }
  };

  /**
   * The method aggregates multi-line API calls into a callback and postpones the
   * table rendering process. After the execution of the operations, the table is
   * rendered once. As a result, it improves the performance of wrapped operations.
   * Without batching, a similar case could trigger multiple table render calls.
   *
   * @memberof Core#
   * @function batchRender
   * @param {Function} wrappedOperations Batched operations wrapped in a function.
   * @returns {*} Returns result from the wrappedOperations callback.
   * @since 8.3.0
   * @example
   * ```js
   * hot.batchRender(() => {
   *   hot.alter('insert_row', 5, 45);
   *   hot.alter('insert_col', 10, 40);
   *   hot.setDataAtCell(1, 1, 'John');
   *   hot.setDataAtCell(2, 2, 'Mark');
   *   hot.setDataAtCell(3, 3, 'Ann');
   *   hot.setDataAtCell(4, 4, 'Sophia');
   *   hot.setDataAtCell(5, 5, 'Mia');
   *   hot.selectCell(0, 0);
   *   // The table will be rendered once after executing the callback
   * });
   * ```
   */
  this.batchRender = function(wrappedOperations) {
    this.suspendRender();

    const result = wrappedOperations();

    this.resumeRender();

    return result;
  };

  /**
   * Checks if the table indexes recalculation process was suspended. See explanation
   * in {@link Core#suspendExecution}.
   *
   * @memberof Core#
   * @function isExecutionSuspended
   * @since 8.3.0
   * @returns {boolean}
   */
  this.isExecutionSuspended = function() {
    return this.executionSuspendedCounter > 0;
  };

  /**
   * Suspends the execution process. It's helpful to wrap the table logic changes
   * such as index changes into one call after which the cache is updated. As a result,
   * it improves the performance of wrapped operations.
   *
   * The method is intended to be used by advanced users. Suspending the execution
   * process could cause visual glitches caused by not updated the internal table cache.
   *
   * @memberof Core#
   * @function suspendExecution
   * @since 8.3.0
   * @example
   * ```js
   * hot.suspendExecution();
   * const filters = hot.getPlugin('filters');
   *
   * filters.addCondition(2, 'contains', ['3']);
   * filters.filter();
   * hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
   * hot.resumeExecution(); // It updates the cache internally
   * ```
   */
  this.suspendExecution = function() {
    this.executionSuspendedCounter += 1;
    this.columnIndexMapper.suspendOperations();
    this.rowIndexMapper.suspendOperations();
  };

  /**
   * Resumes the execution process. In combination with the {@link Core#suspendExecution}
   * method it allows aggregating the table logic changes after which the cache is
   * updated. Resuming the state automatically invokes the table cache updating process.
   *
   * The method is intended to be used by advanced users. Suspending the execution
   * process could cause visual glitches caused by not updated the internal table cache.
   *
   * @memberof Core#
   * @function resumeExecution
   * @param {boolean} [forceFlushChanges=false] If `true`, the table internal data cache
   * is recalculated after the execution of the batched operations. For nested
   * {@link Core#batchExecution} calls, it can be desire to recalculate the table
   * after each batch.
   * @since 8.3.0
   * @example
   * ```js
   * hot.suspendExecution();
   * const filters = hot.getPlugin('filters');
   *
   * filters.addCondition(2, 'contains', ['3']);
   * filters.filter();
   * hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
   * hot.resumeExecution(); // It updates the cache internally
   * ```
   */
  this.resumeExecution = function(forceFlushChanges = false) {
    const nextValue = this.executionSuspendedCounter - 1;

    this.executionSuspendedCounter = Math.max(nextValue, 0);

    if ((!this.isExecutionSuspended() && nextValue === this.executionSuspendedCounter) || forceFlushChanges) {
      this.columnIndexMapper.resumeOperations();
      this.rowIndexMapper.resumeOperations();
    }
  };

  /**
   * The method aggregates multi-line API calls into a callback and postpones the
   * table execution process. After the execution of the operations, the internal table
   * cache is recalculated once. As a result, it improves the performance of wrapped
   * operations. Without batching, a similar case could trigger multiple table cache rebuilds.
   *
   * @memberof Core#
   * @function batchExecution
   * @param {Function} wrappedOperations Batched operations wrapped in a function.
   * @param {boolean} [forceFlushChanges=false] If `true`, the table internal data cache
   * is recalculated after the execution of the batched operations. For nested calls,
   * it can be a desire to recalculate the table after each batch.
   * @returns {*} Returns result from the wrappedOperations callback.
   * @since 8.3.0
   * @example
   * ```js
   * hot.batchExecution(() => {
   *   const filters = hot.getPlugin('filters');
   *
   *   filters.addCondition(2, 'contains', ['3']);
   *   filters.filter();
   *   hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
   *   // The table cache will be recalculated once after executing the callback
   * });
   * ```
   */
  this.batchExecution = function(wrappedOperations, forceFlushChanges = false) {
    this.suspendExecution();

    const result = wrappedOperations();

    this.resumeExecution(forceFlushChanges);

    return result;
  };

  /**
   * It batches the rendering process and index recalculations. The method aggregates
   * multi-line API calls into a callback and postpones the table rendering process
   * as well aggregates the table logic changes such as index changes into one call
   * after which the cache is updated. After the execution of the operations, the
   * table is rendered, and the cache is updated once. As a result, it improves the
   * performance of wrapped operations.
   *
   * @memberof Core#
   * @function batch
   * @param {Function} wrappedOperations Batched operations wrapped in a function.
   * @returns {*} Returns result from the wrappedOperations callback.
   * @since 8.3.0
   * @example
   * ```js
   * hot.batch(() => {
   *   hot.alter('insert_row', 5, 45);
   *   hot.alter('insert_col', 10, 40);
   *   hot.setDataAtCell(1, 1, 'x');
   *   hot.setDataAtCell(2, 2, 'c');
   *   hot.setDataAtCell(3, 3, 'v');
   *   hot.setDataAtCell(4, 4, 'b');
   *   hot.setDataAtCell(5, 5, 'n');
   *   hot.selectCell(0, 0);
   *
   *   const filters = hot.getPlugin('filters');
   *
   *   filters.addCondition(2, 'contains', ['3']);
   *   filters.filter();
   *   hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
   *   // The table will be re-rendered and cache will be recalculated once after executing the callback
   * });
   * ```
   */
  this.batch = function(wrappedOperations) {
    this.suspendRender();
    this.suspendExecution();

    const result = wrappedOperations();

    this.resumeExecution();
    this.resumeRender();

    return result;
  };

  /**
   * Updates dimensions of the table. The method compares previous dimensions with the current ones and updates accordingly.
   *
   * @memberof Core#
   * @function refreshDimensions
   * @fires Hooks#beforeRefreshDimensions
   * @fires Hooks#afterRefreshDimensions
   */
  this.refreshDimensions = function() {
    if (!instance.view) {
      return;
    }

    const { width: lastWidth, height: lastHeight } = instance.view.getLastSize();
    const { width, height } = instance.rootElement.getBoundingClientRect();
    const isSizeChanged = width !== lastWidth || height !== lastHeight;
    const isResizeBlocked = instance.runHooks(
      'beforeRefreshDimensions',
      { width: lastWidth, height: lastHeight },
      { width, height },
      isSizeChanged
    ) === false;

    if (isResizeBlocked) {
      return;
    }

    if (isSizeChanged || instance.view.wt.wtOverlays.scrollableElement === instance.rootWindow) {
      instance.view.setLastSize(width, height);
      instance.render();
    }

    instance.runHooks(
      'afterRefreshDimensions',
      { width: lastWidth, height: lastHeight },
      { width, height },
      isSizeChanged
    );
  };

  /**
   * Loads new data to Handsontable. Loading new data resets the cell meta.
   * Since 8.0.0 loading new data also resets states corresponding to rows and columns
   * (for example, row/column sequence, column width, row height, frozen columns etc.).
   *
   * @memberof Core#
   * @function loadData
   * @param {Array} data Array of arrays or array of objects containing data.
   * @param {string} [source] Source of the loadData call.
   * @fires Hooks#beforeLoadData
   * @fires Hooks#afterLoadData
   * @fires Hooks#afterChange
   */
  this.loadData = function(data, source) {
    if (Array.isArray(tableMeta.dataSchema)) {
      instance.dataType = 'array';
    } else if (isFunction(tableMeta.dataSchema)) {
      instance.dataType = 'function';
    } else {
      instance.dataType = 'object';
    }

    if (datamap) {
      datamap.destroy();
    }

    data = instance.runHooks('beforeLoadData', data, firstRun, source);

    datamap = new DataMap(instance, data, tableMeta);

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

      for (r = 0, rlen = tableMeta.startRows; r < rlen; r++) {
        if ((instance.dataType === 'object' || instance.dataType === 'function') && tableMeta.dataSchema) {
          row = deepClone(dataSchema);
          data.push(row);

        } else if (instance.dataType === 'array') {
          row = deepClone(dataSchema[0]);
          data.push(row);

        } else {
          row = [];

          for (let c = 0, clen = tableMeta.startCols; c < clen; c++) {
            row.push(null);
          }

          data.push(row);
        }
      }

    } else {
      throw new Error(`loadData only accepts array of objects or array of arrays (${typeof data} given)`);
    }

    if (Array.isArray(data[0])) {
      instance.dataType = 'array';
    }

    tableMeta.data = data;

    datamap.dataSource = data;
    dataSource.data = data;
    dataSource.dataType = instance.dataType;
    dataSource.colToProp = datamap.colToProp.bind(datamap);
    dataSource.propToCol = datamap.propToCol.bind(datamap);
    dataSource.countCachedColumns = datamap.countCachedColumns.bind(datamap);

    metaManager.clearCellsCache();
    instance.initIndexMappers();

    grid.adjustRowsAndCols();

    instance.runHooks('afterLoadData', data, firstRun, source);

    if (firstRun) {
      firstRun = [null, 'loadData'];
    } else {
      instance.runHooks('afterChange', null, 'loadData');
      instance.render();
    }
  };

  /**
   * Init index mapper which manage indexes assigned to the data.
   *
   * @private
   */
  this.initIndexMappers = function() {
    const columnsSettings = tableMeta.columns;
    let finalNrOfColumns = 0;

    // We will check number of columns when the `columns` property was defined as an array. Columns option may
    // narrow down or expand displayed dataset in that case.
    if (Array.isArray(columnsSettings)) {
      finalNrOfColumns = columnsSettings.length;

    } else if (isFunction(columnsSettings)) {
      if (instance.dataType === 'array') {
        const nrOfSourceColumns = this.countSourceCols();

        for (let columnIndex = 0; columnIndex < nrOfSourceColumns; columnIndex += 1) {
          if (columnsSettings(columnIndex)) {
            finalNrOfColumns += 1;
          }
        }

        // Extended dataset by the `columns` property? Moved code right from the refactored `countCols` method.
      } else if (instance.dataType === 'object' || instance.dataType === 'function') {
        finalNrOfColumns = datamap.colToPropCache.length;
      }

      // In some cases we need to check columns length from the schema, i.e. `data` may be empty.
    } else if (isDefined(tableMeta.dataSchema)) {
      const schema = datamap.getSchema();

      // Schema may be defined as an array of objects. Each object will define column.
      finalNrOfColumns = Array.isArray(schema) ? schema.length : deepObjectSize(schema);

    } else {
      // We init index mappers by length of source data to provide indexes also for skipped indexes.
      finalNrOfColumns = this.countSourceCols();
    }

    this.columnIndexMapper.initToLength(finalNrOfColumns);
    this.rowIndexMapper.initToLength(this.countSourceRows());
  };

  /**
   * Returns the current data object (the same one that was passed by `data` configuration option or `loadData` method,
   * unless some modifications have been applied (i.e. Sequence of rows/columns was changed, some row/column was skipped).
   * If that's the case - use the {@link Core#getSourceData} method.).
   *
   * Optionally you can provide cell range by defining `row`, `column`, `row2`, `column2` to get only a fragment of table data.
   *
   * @memberof Core#
   * @function getData
   * @param {number} [row] From visual row index.
   * @param {number} [column] From visual column index.
   * @param {number} [row2] To visual row index.
   * @param {number} [column2] To visual column index.
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
   * line character.
   *
   * @memberof Core#
   * @function getCopyableText
   * @param {number} startRow From visual row index.
   * @param {number} startCol From visual column index.
   * @param {number} endRow To visual row index.
   * @param {number} endCol To visual column index.
   * @returns {string}
   */
  this.getCopyableText = function(startRow, startCol, endRow, endCol) {
    return datamap.getCopyableText(new CellCoords(startRow, startCol), new CellCoords(endRow, endCol));
  };

  /**
   * Returns the data's copyable value at specified `row` and `column` index.
   *
   * @memberof Core#
   * @function getCopyableData
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {string}
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
   * @returns {object} Schema object.
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
   * Since 8.0.0 passing `columns` or `data` inside `settings` objects will result in resetting states corresponding to rows and columns
   * (for example, row/column sequence, column width, row height, frozen columns etc.).
   *
   * @memberof Core#
   * @function updateSettings
   * @param {object} settings New settings object (see {@link Options}).
   * @param {boolean} [init=false] Internally used for in initialization mode.
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

    if (isDefined(settings.rows)) {
      throw new Error('The "rows" setting is no longer supported. Do you mean startRows, minRows or maxRows?');
    }
    if (isDefined(settings.cols)) {
      throw new Error('The "cols" setting is no longer supported. Do you mean startCols, minCols or maxCols?');
    }
    if (isDefined(settings.ganttChart)) {
      throw new Error('Since 8.0.0 the "ganttChart" setting is no longer supported.');
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

      } else if (i === 'className') {
        setClassName('className', settings.className);

      } else if (i === 'tableClassName' && instance.table) {
        setClassName('tableClassName', settings.tableClassName);

        instance.view.wt.wtOverlays.syncOverlayTableClassNames();

      } else if (Hooks.getSingleton().isRegistered(i) || Hooks.getSingleton().isDeprecated(i)) {

        if (isFunction(settings[i]) || Array.isArray(settings[i])) {
          settings[i].initialHook = true;
          instance.addHook(i, settings[i]);
        }

      } else if (!init && hasOwnProperty(settings, i)) { // Update settings
        globalMeta[i] = settings[i];
      }
    }

    // Load data or create data map
    if (settings.data === void 0 && tableMeta.data === void 0) {
      instance.loadData(null, 'updateSettings'); // data source created just now

    } else if (settings.data !== void 0) {
      instance.loadData(settings.data, 'updateSettings'); // data source given as option

    } else if (settings.columns !== void 0) {
      datamap.createMap();

      // The `column` property has changed - dataset may be expanded or narrowed down. The `loadData` do the same.
      instance.initIndexMappers();
    }

    const clen = instance.countCols();
    const columnSetting = tableMeta.columns;

    // Init columns constructors configuration
    if (columnSetting && isFunction(columnSetting)) {
      columnsAsFunc = true;
    }

    // Clear cell meta cache
    if (settings.cell !== void 0 || settings.cells !== void 0 || settings.columns !== void 0) {
      metaManager.clearCache();
    }

    if (clen > 0) {
      for (i = 0, j = 0; i < clen; i++) {
        // Use settings provided by user
        if (columnSetting) {
          const column = columnsAsFunc ? columnSetting(i) : columnSetting[j];

          if (column) {
            metaManager.updateColumnMeta(j, column);
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
      instance.rootElement.style.height = isNaN(height) ? `${height}` : `${height}px`;
      instance.rootElement.style.overflow = 'hidden';
    }

    if (typeof settings.width !== 'undefined') {
      let width = settings.width;

      if (isFunction(width)) {
        width = width();
      }

      instance.rootElement.style.width = isNaN(width) ? `${width}` : `${width}px`;
    }

    if (!init) {
      if (instance.view) {
        instance.view.wt.wtViewport.resetHasOversizedColumnHeadersMarked();
        instance.view.wt.exportSettingsAsClassNames();
      }

      instance.runHooks('afterUpdateSettings', settings);
    }

    grid.adjustRowsAndCols();

    if (instance.view && !firstRun) {
      instance.forceFullRender = true; // used when data was changed
      editorManager.lockEditor();
      instance._refreshBorders(null);
      instance.view.wt.wtOverlays.adjustElementsSize();
      editorManager.unlockEditor();
    }

    if (!init && instance.view && (currentHeight === '' || height === '' || height === void 0) &&
        currentHeight !== height) {
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

    if (tableMeta.getValue) {
      if (isFunction(tableMeta.getValue)) {
        return tableMeta.getValue.call(instance);
      } else if (sel) {
        return instance.getData()[sel[0][0]][tableMeta.getValue];
      }
    } else if (sel) {
      return instance.getDataAtCell(sel[0], sel[1]);
    }
  };

  /**
   * Returns the object settings.
   *
   * @memberof Core#
   * @function getSettings
   * @returns {object} Object containing the current table settings.
   */
  this.getSettings = function() {
    return tableMeta;
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
   * This method works with an array data structure only.
   *
   * @memberof Core#
   * @function alter
   * @param {string} action Possible alter operations:
   *  <ul>
   *    <li> `'insert_row'` </li>
   *    <li> `'insert_col'` </li>
   *    <li> `'remove_row'` </li>
   *    <li> `'remove_col'` </li>
   * </ul>.
   * @param {number|number[]} index Visual index of the row/column before which the new row/column will be
   *                                inserted/removed or an array of arrays in format `[[index, amount],...]`.
   * @param {number} [amount=1] Amount of rows/columns to be inserted or removed.
   * @param {string} [source] Source indicator.
   * @param {boolean} [keepEmptyRows] Flag for preventing deletion of empty rows.
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
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {boolean} [topmost=false] If set to `true`, it returns the TD element from the topmost overlay. For example,
   * if the wanted cell is in the range of fixed rows, it will return a TD element from the `top` overlay.
   * @returns {HTMLTableCellElement|null} The cell's TD element.
   */
  this.getCell = function(row, column, topmost = false) {
    let renderableColumnIndex = column; // Handling also column headers.
    let renderableRowIndex = row; // Handling also row headers.

    if (column >= 0) {
      if (this.columnIndexMapper.isHidden(this.toPhysicalColumn(column))) {
        return null;
      }

      renderableColumnIndex = this.columnIndexMapper.getRenderableFromVisualIndex(column);
    }

    if (row >= 0) {
      if (this.rowIndexMapper.isHidden(this.toPhysicalRow(row))) {
        return null;
      }

      renderableRowIndex = this.rowIndexMapper.getRenderableFromVisualIndex(row);
    }

    if (renderableRowIndex === null || renderableColumnIndex === null) {
      return null;
    }

    return instance.view.getCellAtCoords(new CellCoords(renderableRowIndex, renderableColumnIndex), topmost);
  };

  /**
   * Returns the coordinates of the cell, provided as a HTML table cell element.
   *
   * @memberof Core#
   * @function getCoords
   * @param {HTMLTableCellElement} element The HTML Element representing the cell.
   * @returns {CellCoords|null} Visual coordinates object.
   * @example
   * ```js
   * hot.getCoords(hot.getCell(1, 1));
   * // it returns CellCoords object instance with props row: 1 and col: 1.
   * ```
   */
  this.getCoords = function(element) {
    const renderableCoords = this.view.wt.wtTable.getCoords(element);

    if (renderableCoords === null) {
      return null;
    }

    const { row: renderableRow, col: renderableColumn } = renderableCoords;

    let visualRow = renderableRow;
    let visualColumn = renderableColumn;

    if (renderableRow >= 0) {
      visualRow = this.rowIndexMapper.getVisualFromRenderableIndex(renderableRow);
    }

    if (renderableColumn >= 0) {
      visualColumn = this.columnIndexMapper.getVisualFromRenderableIndex(renderableColumn);
    }

    return new CellCoords(visualRow, visualColumn);
  };

  /**
   * Returns the property name that corresponds with the given column index.
   * If the data source is an array of arrays, it returns the columns index.
   *
   * @memberof Core#
   * @function colToProp
   * @param {number} column Visual column index.
   * @returns {string|number} Column property or physical column index.
   */
  this.colToProp = function(column) {
    return datamap.colToProp(column);
  };

  /**
   * Returns column index that corresponds with the given property.
   *
   * @memberof Core#
   * @function propToCol
   * @param {string|number} prop Property name or physical column index.
   * @returns {number} Visual column index.
   */
  this.propToCol = function(prop) {
    return datamap.propToCol(prop);
  };

  /**
   * Translate physical row index into visual.
   *
   * This method is useful when you want to retrieve visual row index which can be reordered, moved or trimmed
   * based on a physical index.
   *
   * @memberof Core#
   * @function toVisualRow
   * @param {number} row Physical row index.
   * @returns {number} Returns visual row index.
   */
  this.toVisualRow = row => this.rowIndexMapper.getVisualFromPhysicalIndex(row);

  /**
   * Translate physical column index into visual.
   *
   * This method is useful when you want to retrieve visual column index which can be reordered, moved or trimmed
   * based on a physical index.
   *
   * @memberof Core#
   * @function toVisualColumn
   * @param {number} column Physical column index.
   * @returns {number} Returns visual column index.
   */
  this.toVisualColumn = column => this.columnIndexMapper.getVisualFromPhysicalIndex(column);

  /**
   * Translate visual row index into physical.
   *
   * This method is useful when you want to retrieve physical row index based on a visual index which can be
   * reordered, moved or trimmed.
   *
   * @memberof Core#
   * @function toPhysicalRow
   * @param {number} row Visual row index.
   * @returns {number} Returns physical row index.
   */
  this.toPhysicalRow = row => this.rowIndexMapper.getPhysicalFromVisualIndex(row);

  /**
   * Translate visual column index into physical.
   *
   * This method is useful when you want to retrieve physical column index based on a visual index which can be
   * reordered, moved or trimmed.
   *
   * @memberof Core#
   * @function toPhysicalColumn
   * @param {number} column Visual column index.
   * @returns {number} Returns physical column index.
   */
  this.toPhysicalColumn = column => this.columnIndexMapper.getPhysicalFromVisualIndex(column);

  /**
   * @description
   * Returns the cell value at `row`, `column`.
   *
   * __Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataAtCell
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {*} Data at cell.
   */
  this.getDataAtCell = function(row, column) {
    return datamap.get(row, datamap.colToProp(column));
  };

  /**
   * Returns value at visual `row` and `prop` indexes.
   *
   * __Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataAtRowProp
   * @param {number} row Visual row index.
   * @param {string} prop Property name.
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
   * @param {number} column Visual column index.
   * @returns {Array} Array of cell values.
   */
  this.getDataAtCol = function(column) {
    return [].concat(...datamap.getRange(
      new CellCoords(0, column),
      new CellCoords(tableMeta.data.length - 1, column),
      datamap.DESTINATION_RENDERER
    ));
  };

  /**
   * Given the object property name (e.g. `'first.name'` or `'0'`), returns an array of column's values from the table data.
   * You can also provide a column index as the first argument.
   *
   * @memberof Core#
   * @function getDataAtProp
   * @param {string|number} prop Property name or physical column index.
   * @returns {Array} Array of cell values.
   */
  // TODO: Getting data from `datamap` should work on visual indexes.
  this.getDataAtProp = function(prop) {
    const range = datamap.getRange(
      new CellCoords(0, datamap.propToCol(prop)),
      new CellCoords(tableMeta.data.length - 1, datamap.propToCol(prop)),
      datamap.DESTINATION_RENDERER);

    return [].concat(...range);
  };

  /**
   * Returns a clone of the source data object.
   * Optionally you can provide a cell range by using the `row`, `column`, `row2`, `column2` arguments, to get only a
   * fragment of the table data.
   *
   * __Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
   * sorted or trimmed only physical indexes are correct.
   *
   * @memberof Core#
   * @function getSourceData
   * @param {number} [row] From physical row index.
   * @param {number} [column] From physical column index (or visual index, if data type is an array of objects).
   * @param {number} [row2] To physical row index.
   * @param {number} [column2] To physical column index (or visual index, if data type is an array of objects).
   * @returns {Array[]|object[]} The table data.
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
   * @param {number} [row] From physical row index.
   * @param {number} [column] From physical column index (or visual index, if data type is an array of objects).
   * @param {number} [row2] To physical row index.
   * @param {number} [column2] To physical column index (or visual index, if data type is an array of objects).
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
   * @param {number} column Visual column index.
   * @returns {Array} Array of the column's cell values.
   */
  // TODO: Getting data from `sourceData` should work always on physical indexes.
  this.getSourceDataAtCol = function(column) {
    return dataSource.getAtColumn(column);
  };

  /* eslint-disable jsdoc/require-param */
  /**
   * Set the provided value in the source data set at the provided coordinates.
   *
   * @memberof Core#
   * @function setSourceDataAtCell
   * @param {number|Array} row Physical row index or array of changes in format `[[row, prop, value], ...]`.
   * @param {number|string} column Physical column index / prop name.
   * @param {*} value The value to be set at the provided coordinates.
   * @param {string} [source] Source of the change as a string.
   */
  /* eslint-enable jsdoc/require-param */
  this.setSourceDataAtCell = function(row, column, value, source) {
    const input = setDataInputToArray(row, column, value);
    const isThereAnySetSourceListener = this.hasHook('afterSetSourceDataAtCell');
    const changesForHook = [];

    if (isThereAnySetSourceListener) {
      arrayEach(input, ([changeRow, changeProp, changeValue]) => {
        changesForHook.push([
          changeRow,
          changeProp,
          dataSource.getAtCell(changeRow, changeProp), // The previous value.
          changeValue,
        ]);
      });
    }

    arrayEach(input, ([changeRow, changeProp, changeValue]) => {
      dataSource.setAtCell(changeRow, changeProp, changeValue);
    });

    if (isThereAnySetSourceListener) {
      this.runHooks('afterSetSourceDataAtCell', changesForHook, source);
    }

    this.render();

    const activeEditor = instance.getActiveEditor();

    if (activeEditor && isDefined(activeEditor.refreshValue)) {
      activeEditor.refreshValue();
    }
  };

  /**
   * Returns a single row of the data (array or object, depending on what data format you use).
   *
   * __Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
   * sorted or trimmed only physical indexes are correct.
   *
   * @memberof Core#
   * @function getSourceDataAtRow
   * @param {number} row Physical row index.
   * @returns {Array|object} Single row of data.
   */
  this.getSourceDataAtRow = function(row) {
    return dataSource.getAtRow(row);
  };

  /**
   * Returns a single value from the data source.
   *
   * @memberof Core#
   * @function getSourceDataAtCell
   * @param {number} row Physical row index.
   * @param {number} column Visual column index.
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
   * @param {number} row Visual row index.
   * @returns {Array} Array of row's cell data.
   */
  this.getDataAtRow = function(row) {
    const data = datamap.getRange(
      new CellCoords(row, 0),
      new CellCoords(row, this.countCols() - 1),
      datamap.DESTINATION_RENDERER
    );

    return data[0] || [];
  };

  /**
   * @description
   * Returns a data type defined in the Handsontable settings under the `type` key ({@link Options#type}).
   * If there are cells with different types in the selected range, it returns `'mixed'`.
   *
   * __Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.
   *
   * @memberof Core#
   * @function getDataType
   * @param {number} rowFrom From visual row index.
   * @param {number} columnFrom From visual column index.
   * @param {number} rowTo To visual row index.
   * @param {number} columnTo To visual column index.
   * @returns {string} Cell type (e.q: `'mixed'`, `'text'`, `'numeric'`, `'autocomplete'`).
   */
  this.getDataType = function(rowFrom, columnFrom, rowTo, columnTo) {
    const coords = rowFrom === void 0 ?
      [0, 0, this.countRows(), this.countCols()] : [rowFrom, columnFrom, rowTo, columnTo];
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

    rangeEach(Math.max(Math.min(rowStart, rowEnd), 0), Math.max(rowStart, rowEnd), (row) => {
      let isTypeEqual = true;

      rangeEach(Math.max(Math.min(columnStart, columnEnd), 0), Math.max(columnStart, columnEnd), (column) => {
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
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} key Property name.
   * @fires Hooks#beforeRemoveCellMeta
   * @fires Hooks#afterRemoveCellMeta
   */
  this.removeCellMeta = function(row, column, key) {
    const [physicalRow, physicalColumn] = [this.toPhysicalRow(row), this.toPhysicalColumn(column)];
    let cachedValue = metaManager.getCellMetaKeyValue(physicalRow, physicalColumn, key);

    const hookResult = instance.runHooks('beforeRemoveCellMeta', row, column, key, cachedValue);

    if (hookResult !== false) {
      metaManager.removeCellMeta(physicalRow, physicalColumn, key);

      instance.runHooks('afterRemoveCellMeta', row, column, key, cachedValue);
    }

    cachedValue = null;
  };

  /**
   * Removes or adds one or more rows of the cell meta objects to the cell meta collections.
   *
   * @since 0.30.0
   * @memberof Core#
   * @function spliceCellsMeta
   * @param {number} visualIndex A visual index that specifies at what position to add/remove items.
   * @param {number} [deleteAmount=0] The number of items to be removed. If set to 0, no cell meta objects will be removed.
   * @param {...object} [cellMetaRows] The new cell meta row objects to be added to the cell meta collection.
   */
  this.spliceCellsMeta = function(visualIndex, deleteAmount = 0, ...cellMetaRows) {
    if (cellMetaRows.length > 0 && !Array.isArray(cellMetaRows[0])) {
      throw new Error('The 3rd argument (cellMetaRows) has to be passed as an array of cell meta objects array.');
    }

    if (deleteAmount > 0) {
      metaManager.removeRow(this.toPhysicalRow(visualIndex), deleteAmount);
    }

    if (cellMetaRows.length > 0) {
      arrayEach(cellMetaRows.reverse(), (cellMetaRow) => {
        metaManager.createRow(this.toPhysicalRow(visualIndex));

        arrayEach(cellMetaRow, (cellMeta, columnIndex) => this.setCellMetaObject(visualIndex, columnIndex, cellMeta));
      });
    }

    instance.render();
  };

  /**
   * Set cell meta data object defined by `prop` to the corresponding params `row` and `column`.
   *
   * @memberof Core#
   * @function setCellMetaObject
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} prop Meta object.
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
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} key Property name.
   * @param {string} value Property value.
   * @fires Hooks#beforeSetCellMeta
   * @fires Hooks#afterSetCellMeta
   */
  this.setCellMeta = function(row, column, key, value) {
    const allowSetCellMeta = instance.runHooks('beforeSetCellMeta', row, column, key, value);

    if (allowSetCellMeta === false) {
      return;
    }

    let physicalRow = row;
    let physicalColumn = column;

    if (row < this.countRows()) {
      physicalRow = this.toPhysicalRow(row);
    }

    if (column < this.countCols()) {
      physicalColumn = this.toPhysicalColumn(column);
    }

    metaManager.setCellMeta(physicalRow, physicalColumn, key, value);

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
    return metaManager.getCellsMeta();
  };

  /**
   * Returns the cell properties object for the given `row` and `column` coordinates.
   *
   * @memberof Core#
   * @function getCellMeta
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {object} The cell properties object.
   * @fires Hooks#beforeGetCellMeta
   * @fires Hooks#afterGetCellMeta
   */
  this.getCellMeta = function(row, column) {
    let physicalRow = this.toPhysicalRow(row);
    let physicalColumn = this.toPhysicalColumn(column);

    if (physicalRow === null) {
      physicalRow = row;
    }

    if (physicalColumn === null) {
      physicalColumn = column;
    }

    return metaManager.getCellMeta(physicalRow, physicalColumn, {
      visualRow: row,
      visualColumn: column,
    });
  };

  /**
   * Returns an array of cell meta objects for specified physical row index.
   *
   * @memberof Core#
   * @function getCellMetaAtRow
   * @param {number} row Physical row index.
   * @returns {Array}
   */
  this.getCellMetaAtRow = function(row) {
    return metaManager.getCellsMetaAtRow(row);
  };

  /**
   * Checks if the data format and config allows user to modify the column structure.
   *
   * @memberof Core#
   * @function isColumnModificationAllowed
   * @returns {boolean}
   */
  this.isColumnModificationAllowed = function() {
    return !(instance.dataType === 'object' || tableMeta.columns);
  };

  const rendererLookup = cellMethodLookupFactory('renderer');

  /**
   * Returns the cell renderer function by given `row` and `column` arguments.
   *
   * @memberof Core#
   * @function getCellRenderer
   * @param {number|object} row Visual row index or cell meta object (see {@link Core#getCellMeta}).
   * @param {number} column Visual column index.
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
   * @param {number} row Visual row index or cell meta object (see {@link Core#getCellMeta}).
   * @param {number} column Visual column index.
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
   * @param {number|object} row Visual row index or cell meta object (see {@link Core#getCellMeta}).
   * @param {number} column Visual column index.
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
   * @param {number} [row] Visual row index.
   * @fires Hooks#modifyRowHeader
   * @returns {Array|string|number} Array of header values / single header value.
   */
  this.getRowHeader = function(row) {
    let rowHeader = tableMeta.rowHeaders;
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
   * @returns {boolean} `true` if the instance has the row headers enabled, `false` otherwise.
   */
  this.hasRowHeaders = function() {
    return !!tableMeta.rowHeaders;
  };

  /**
   * Returns information about if this table is configured to display column headers.
   *
   * @memberof Core#
   * @function hasColHeaders
   * @returns {boolean} `true` if the instance has the column headers enabled, `false` otherwise.
   */
  this.hasColHeaders = function() {
    if (tableMeta.colHeaders !== void 0 && tableMeta.colHeaders !== null) { // Polymer has empty value = null
      return !!tableMeta.colHeaders;
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
   * @param {number} [column] Visual column index.
   * @fires Hooks#modifyColHeader
   * @returns {Array|string|number} The column header(s).
   */
  this.getColHeader = function(column) {
    const columnIndex = instance.runHooks('modifyColHeader', column);
    let result = tableMeta.colHeaders;

    if (columnIndex === void 0) {
      const out = [];
      const ilen = instance.countCols();

      for (let i = 0; i < ilen; i++) {
        out.push(instance.getColHeader(i));
      }

      result = out;

    } else {
      const translateVisualIndexToColumns = function(visualColumnIndex) {
        const arr = [];
        const columnsLen = instance.countCols();
        let index = 0;

        for (; index < columnsLen; index++) {
          if (isFunction(tableMeta.columns) && tableMeta.columns(index)) {
            arr.push(index);
          }
        }

        return arr[visualColumnIndex];
      };

      const physicalColumn = instance.toPhysicalColumn(columnIndex);
      const prop = translateVisualIndexToColumns(physicalColumn);

      if (tableMeta.colHeaders === false) {
        result = null;

      } else if (tableMeta.columns && isFunction(tableMeta.columns) && tableMeta.columns(prop) &&
                 tableMeta.columns(prop).title) {
        result = tableMeta.columns(prop).title;

      } else if (tableMeta.columns && tableMeta.columns[physicalColumn] &&
                 tableMeta.columns[physicalColumn].title) {
        result = tableMeta.columns[physicalColumn].title;

      } else if (Array.isArray(tableMeta.colHeaders) && tableMeta.colHeaders[physicalColumn] !== void 0) {
        result = tableMeta.colHeaders[physicalColumn];

      } else if (isFunction(tableMeta.colHeaders)) {
        result = tableMeta.colHeaders(physicalColumn);

      } else if (tableMeta.colHeaders && typeof tableMeta.colHeaders !== 'string' &&
                 typeof tableMeta.colHeaders !== 'number') {
        result = spreadsheetColumnLabel(columnIndex); // see #1458
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
   * @param {number} col Visual col index.
   * @returns {number}
   */
  this._getColWidthFromSettings = function(col) {
    let width;

    // We currently don't support cell meta objects for headers (negative values)
    if (col >= 0) {
      const cellProperties = instance.getCellMeta(0, col);

      width = cellProperties.width;
    }

    if (width === void 0 || width === tableMeta.width) {
      width = tableMeta.colWidths;
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
   * @param {number} column Visual column index.
   * @returns {number} Column width.
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
   * @param {number} row Visual row index.
   * @returns {number}
   */
  this._getRowHeightFromSettings = function(row) {
    // let cellProperties = instance.getCellMeta(row, 0);
    // let height = cellProperties.height;
    //
    // if (height === void 0 || height === tableMeta.height) {
    //  height = cellProperties.rowHeights;
    // }
    let height = tableMeta.rowHeights;

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
   * Mind that this method is different from the [AutoRowSize](@/api/autorowsize.md) plugin's [`getRowHeight()`](@/api/autorowsize.md#getrowheight) method.
   *
   * @memberof Core#
   * @function getRowHeight
   * @param {number} row Visual row index.
   * @returns {number} The given row's height.
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
   * @returns {number} Total number of rows.
   */
  this.countSourceRows = function() {
    return dataSource.countRows();
  };

  /**
   * Returns the total number of columns in the data source.
   *
   * @memberof Core#
   * @function countSourceCols
   * @returns {number} Total number of columns.
   */
  this.countSourceCols = function() {
    return dataSource.countFirstRowKeys();
  };

  /**
   * Returns the total number of visual rows in the table.
   *
   * @memberof Core#
   * @function countRows
   * @returns {number} Total number of rows.
   */
  this.countRows = function() {
    return datamap.getLength();
  };

  /**
   * Returns the total number of visible columns in the table.
   *
   * @memberof Core#
   * @function countCols
   * @returns {number} Total number of columns.
   */
  this.countCols = function() {
    const maxCols = tableMeta.maxCols;
    const dataLen = this.columnIndexMapper.getNotTrimmedIndexesLength();

    return Math.min(maxCols, dataLen);
  };

  /**
   * Returns the number of rendered rows (including rows partially or fully rendered outside viewport).
   *
   * @memberof Core#
   * @function countRenderedRows
   * @returns {number} Returns -1 if table is not visible.
   */
  this.countRenderedRows = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getRenderedRowsCount() : -1;
  };

  /**
   * Returns the number of visible rows (rendered rows that fully fit inside viewport).
   *
   * @memberof Core#
   * @function countVisibleRows
   * @returns {number} Number of visible rows or -1.
   */
  this.countVisibleRows = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getVisibleRowsCount() : -1;
  };

  /**
   * Returns the number of rendered columns (including columns partially or fully rendered outside viewport).
   *
   * @memberof Core#
   * @function countRenderedCols
   * @returns {number} Returns -1 if table is not visible.
   */
  this.countRenderedCols = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getRenderedColumnsCount() : -1;
  };

  /**
   * Returns the number of visible columns. Returns -1 if table is not visible.
   *
   * @memberof Core#
   * @function countVisibleCols
   * @returns {number} Number of visible columns or -1.
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
   * @param {boolean} [ending=false] If `true`, will only count empty rows at the end of the data source.
   * @returns {number} Count empty rows.
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
   * @param {boolean} [ending=false] If `true`, will only count empty columns at the end of the data source row.
   * @returns {number} Count empty cols.
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
   * @param {number} row Visual row index.
   * @returns {boolean} `true` if the row at the given `row` is empty, `false` otherwise.
   */
  this.isEmptyRow = function(row) {
    return tableMeta.isEmptyRow.call(instance, row);
  };

  /**
   * Check if all cells in the the column declared by the `column` argument are empty.
   *
   * @memberof Core#
   * @function isEmptyCol
   * @param {number} column Column index.
   * @returns {boolean} `true` if the column at the given `col` is empty, `false` otherwise.
   */
  this.isEmptyCol = function(column) {
    return tableMeta.isEmptyCol.call(instance, column);
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
   * @param {number} row Visual row index.
   * @param {number|string} column Visual column index or column property.
   * @param {number} [endRow] Visual end row index (if selecting a range).
   * @param {number|string} [endColumn] Visual end column index or column property (if selecting a range).
   * @param {boolean} [scrollToCell=true] If `true`, the viewport will be scrolled to the selection.
   * @param {boolean} [changeListener=true] If `false`, Handsontable will not change keyboard events listener to himself.
   * @returns {boolean} `true` if selection was successful, `false` otherwise.
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
   * @param {boolean} [scrollToCell=true] If `true`, the viewport will be scrolled to the selection.
   * @param {boolean} [changeListener=true] If `false`, Handsontable will not change keyboard events listener to himself.
   * @returns {boolean} `true` if selection was successful, `false` otherwise.
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
   * @param {number} startColumn The visual column index from which the selection starts.
   * @param {number} [endColumn=startColumn] The visual column index to which the selection finishes. If `endColumn`
   *                                         is not defined the column defined by `startColumn` will be selected.
   * @returns {boolean} `true` if selection was successful, `false` otherwise.
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
   * @param {number} startRow The visual row index from which the selection starts.
   * @param {number} [endRow=startRow] The visual row index to which the selection finishes. If `endRow`
   *                                   is not defined the row defined by `startRow` will be selected.
   * @returns {boolean} `true` if selection was successful, `false` otherwise.
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
   * @param {boolean} [includeHeaders=true] `true` If the selection should include the row, column and corner headers,
   * `false` otherwise.
   */
  this.selectAll = function(includeHeaders = true) {
    const includeRowHeaders = includeHeaders && this.hasRowHeaders();
    const includeColumnHeaders = includeHeaders && this.hasColHeaders();

    preventScrollingToCell = true;
    selection.selectAll(includeRowHeaders, includeColumnHeaders);
    preventScrollingToCell = false;
  };

  const getIndexToScroll = (indexMapper, visualIndex) => {
    // Looking for a visual index on the right and then (when not found) on the left.
    return indexMapper.getFirstNotHiddenIndex(visualIndex, 1, true);
  };

  /**
   * Scroll viewport to coordinates specified by the `row` and `column` arguments.
   *
   * @memberof Core#
   * @function scrollViewportTo
   * @param {number} [row] Row index. If the last argument isn't defined we treat the index as a visual row index. Otherwise,
   * we are using the index for numbering only this rows which may be rendered (we don't consider hidden rows).
   * @param {number} [column] Column index. If the last argument isn't defined we treat the index as a visual column index.
   * Otherwise, we are using the index for numbering only this columns which may be rendered (we don't consider hidden columns).
   * @param {boolean} [snapToBottom=false] If `true`, viewport is scrolled to show the cell on the bottom of the table.
   * @param {boolean} [snapToRight=false] If `true`, viewport is scrolled to show the cell on the right side of the table.
   * @param {boolean} [considerHiddenIndexes=true] If `true`, we handle visual indexes, otherwise we handle only indexes which
   * may be rendered when they are in the viewport (we don't consider hidden indexes as they aren't rendered).
   * @returns {boolean} `true` if scroll was successful, `false` otherwise.
   */
  this.scrollViewportTo = function(row, column, snapToBottom = false,
                                   snapToRight = false, considerHiddenIndexes = true) {
    const snapToTop = !snapToBottom;
    const snapToLeft = !snapToRight;
    let renderableRow = row;
    let renderableColumn = column;

    if (considerHiddenIndexes) {
      const isRowInteger = Number.isInteger(row);
      const isColumnInteger = Number.isInteger(column);

      const visualRowToScroll = isRowInteger ? getIndexToScroll(this.rowIndexMapper, row) : void 0;
      const visualColumnToScroll = isColumnInteger ? getIndexToScroll(this.columnIndexMapper, column) : void 0;

      if (visualRowToScroll === null || visualColumnToScroll === null) {
        return false;
      }

      renderableRow = isRowInteger ?
        instance.rowIndexMapper.getRenderableFromVisualIndex(visualRowToScroll) : void 0;
      renderableColumn = isColumnInteger ?
        instance.columnIndexMapper.getRenderableFromVisualIndex(visualColumnToScroll) : void 0;
    }

    const isRowInteger = Number.isInteger(renderableRow);
    const isColumnInteger = Number.isInteger(renderableColumn);

    if (isRowInteger && isColumnInteger) {
      return instance.view.scrollViewport(
        new CellCoords(renderableRow, renderableColumn),
        snapToTop,
        snapToRight,
        snapToBottom,
        snapToLeft
      );
    }

    if (isRowInteger && isColumnInteger === false) {
      return instance.view.scrollViewportVertically(renderableRow, snapToTop, snapToBottom);
    }

    if (isColumnInteger && isRowInteger === false) {
      return instance.view.scrollViewportHorizontally(renderableColumn, snapToRight, snapToLeft);
    }

    return false;
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

    metaManager.clearCache();

    keyStateStopObserving();

    if (isRootInstance(instance)) {
      const licenseInfo = this.rootDocument.querySelector('#hot-display-license-info');

      if (licenseInfo) {
        licenseInfo.parentNode.removeChild(licenseInfo);
      }
    }
    empty(instance.rootElement);
    eventManager.destroy();

    if (editorManager) {
      editorManager.destroy();
    }

    // The plugin's `destroy` method is called as a consequence and it should handle
    // unregistration of plugin's maps. Some unregistered maps reset the cache.
    instance.batchExecution(() => {
      instance.rowIndexMapper.unregisterAll();
      instance.columnIndexMapper.unregisterAll();

      pluginsRegistry
        .getItems()
        .forEach(([, plugin]) => {
          plugin.destroy();
        });
      pluginsRegistry.clear();
      instance.runHooks('afterDestroy');
    }, true);

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

    instance.rowIndexMapper = null;
    instance.columnIndexMapper = null;

    datamap = null;
    grid = null;
    selection = null;
    editorManager = null;
    instance = null;
  };

  /**
   * Replacement for all methods after the Handsontable was destroyed.
   *
   * @private
   * @param {string} method The method name.
   * @returns {Function}
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
   * @param {string} pluginName The plugin name.
   * @returns {BasePlugin|undefined} The plugin instance or undefined if there is no plugin.
   */
  this.getPlugin = function(pluginName) {
    const unifiedPluginName = toUpperCaseFirst(pluginName);

    // Workaround for the UndoRedo plugin which, currently doesn't follow the plugin architecture.
    if (unifiedPluginName === 'UndoRedo') {
      return this.undoRedo;
    }

    return pluginsRegistry.getItem(unifiedPluginName);
  };

  /**
   * Returns name of the passed plugin.
   *
   * @private
   * @memberof Core#
   * @param {BasePlugin} plugin The plugin instance.
   * @returns {string}
   */
  this.getPluginName = function(plugin) {
    // Workaround for the UndoRedo plugin which, currently doesn't follow the plugin architecture.
    if (plugin === this.undoRedo) {
      return this.undoRedo.constructor.PLUGIN_KEY;
    }

    return pluginsRegistry.getId(plugin);
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
   * @param {string} key Hook name (see {@link Hooks}).
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
   * @param {string} key Hook name.
   * @returns {boolean}
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
   * @param {string} key Hook name (see {@link Hooks}).
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
   * @param {string} key Hook name.
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
   * @param {string} key Hook name.
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
   * @param {string} dictionaryKey Constant which is dictionary key.
   * @param {*} extraArguments Arguments which will be handled by formatters.
   * @returns {string}
   */
  this.getTranslatedPhrase = function(dictionaryKey, extraArguments) {
    return getTranslatedPhrase(tableMeta.language, dictionaryKey, extraArguments);
  };

  /**
   * Converts instance into outerHTML of HTMLTableElement.
   *
   * @memberof Core#
   * @function toHTML
   * @since 7.1.0
   * @returns {string}
   */
  this.toHTML = () => instanceToHTML(this);

  /**
   * Converts instance into HTMLTableElement.
   *
   * @memberof Core#
   * @function toTableElement
   * @since 7.1.0
   * @returns {HTMLTableElement}
   */
  this.toTableElement = () => {
    const tempElement = this.rootDocument.createElement('div');

    tempElement.insertAdjacentHTML('afterbegin', instanceToHTML(this));

    return tempElement.firstElementChild;
  };

  this.timeouts = [];

  /**
   * Sets timeout. Purpose of this method is to clear all known timeouts when `destroy` method is called.
   *
   * @param {number|Function} handle Handler returned from setTimeout or function to execute (it will be automatically wraped
   *                                 by setTimeout function).
   * @param {number} [delay=0] If first argument is passed as a function this argument set delay of the execution of that function.
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
   * @param {boolean} [revertOriginal=false] If `true`, the previous value will be restored. Otherwise, the edited value will be saved.
   * @param {boolean} [prepareEditorIfNeeded=true] If `true` the editor under the selected cell will be prepared to open.
   */
  this._refreshBorders = function(revertOriginal = false, prepareEditorIfNeeded = true) {
    editorManager.destroyEditor(revertOriginal);
    instance.view.render();

    if (prepareEditorIfNeeded && selection.isSelected()) {
      editorManager.prepareEditor();
    }
  };

  getPluginsNames().forEach((pluginName) => {
    const PluginClass = getPlugin(pluginName);

    pluginsRegistry.addItem(pluginName, new PluginClass(this));
  });

  Hooks.getSingleton().run(instance, 'construct');
}
