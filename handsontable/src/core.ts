import { addClass, empty, observeVisibilityChangeOnce, removeClass } from './helpers/dom/element';
import { isFunction } from './helpers/function';
import { isDefined, isUndefined, isRegExp, _injectProductInfo, isEmpty } from './helpers/mixed';
import { isMobileBrowser, isIpadOS } from './helpers/browser';
import EditorManager from './editorManager';
import EventManager from './eventManager';
import {
  deepClone,
  duckSchema,
  isObjectEqual,
  isObject,
  deepObjectSize,
  hasOwnProperty,
  createObjectPropListener,
  objectEach
} from './helpers/object';
import { FocusManager } from './focusManager';
import { arrayMap, arrayEach, arrayReduce, getDifferenceOfArrays, stringToArray, pivot } from './helpers/array';
import { instanceToHTML } from './utils/parseTable';
import { getPlugin, getPluginsNames } from './plugins/registry';
import { getRenderer } from './renderers/registry';
import { getEditor } from './editors/registry';
import { getValidator } from './validators/registry';
import { randomString, toUpperCaseFirst } from './helpers/string';
import { rangeEach, rangeEachReverse, isNumericLike } from './helpers/number';
import TableView from './tableView';
import DataSource from './dataMap/dataSource';
import { spreadsheetColumnLabel } from './helpers/data';
import { IndexMapper } from './translations';
import { registerAsRootInstance, hasValidParameter, isRootInstance } from './utils/rootInstance';
import { CellRange, DEFAULT_COLUMN_WIDTH } from './3rdparty/walkontable/src';
import { Hooks } from './core/hooks';
import { hasLanguageDictionary, getValidLanguageCode, getTranslatedPhrase } from './i18n/registry';
import { warnUserAboutLanguageRegistration, normalizeLanguageCode } from './i18n/utils';
import { Selection } from './selection';
import { MetaManager, DynamicCellMetaMod, ExtendMetaPropertiesMod, replaceData, DataMap } from './dataMap';
import {
  installFocusCatcher,
  createViewportScroller,
} from './core/index';
import { createUniqueMap, UniqueMap } from './utils/dataStructures/uniqueMap';
import { createShortcutManager, ShortcutManager } from './shortcuts';
import { registerAllShortcutContexts } from './shortcutContexts';
import { getThemeClassName } from './helpers/themes';
import coords, { CellCoords } from './3rdparty/walkontable/src/cell/coords';
import { SelectionRange } from './selection/range';
import { GridSettings, HotInstance } from './core.types';
import TableMeta from './dataMap/metaManager/metaLayers/tableMeta';
import CellMeta from './dataMap/metaManager/metaLayers/cellMeta';
import { BaseEditor } from './editors/baseEditor/baseEditor';
import { BasePlugin } from './plugins/base/base';

let activeGuid: string | null = null;

/**
 * Keeps the collection of the all Handsontable instances created on the same page. The
 * list is then used to trigger the "afterUnlisten" hook when the "listen()" method was
 * called on another instance.
 *
 * @type {Map<string, Core>}
 */
const foreignHotInstances: Map<string, Core> = new Map();

/**
 * A set of deprecated feature names.
 *
 * @type {Set<string>}
 */
// eslint-disable-next-line no-unused-vars
const deprecationWarns: Set<string> = new Set();

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * Handsontable constructor.
 *
 * @core
 * @class Core
 * @description
 *
 * The `Handsontable` class (known as the `Core`) lets you modify the grid's behavior by using Handsontable's public API methods.
 *
 * ::: only-for react
 * To use these methods, associate a Handsontable instance with your instance
 * of the [`HotTable` component](@/guides/getting-started/installation/installation.md#_4-use-the-hottable-component),
 * by using React's `ref` feature (read more on the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page).
 * :::
 *
 * ## How to call a method
 *
 * ::: only-for javascript
 * ```js
 * // create a Handsontable instance
 * const hot = new Handsontable(document.getElementById('example'), options);
 *
 * // call a method
 * hot.setDataAtCell(0, 0, 'new value');
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * import { useRef } from 'react';
 *
 * const hotTableComponent = useRef(null);
 *
 * <HotTable
 *   // associate your `HotTable` component with a Handsontable instance
 *   ref={hotTableComponent}
 *   settings={options}
 * />
 *
 * // access the Handsontable instance, under the `.current.hotInstance` property
 * // call a method
 * hotTableComponent.current.hotInstance.setDataAtCell(0, 0, 'new value');
 * ```
 * :::
 *
 * @param {HTMLElement} rootElement The element to which the Handsontable instance is injected.
 * @param {object} userSettings The user defined options.
 * @param {boolean} [rootInstanceSymbol=false] Indicates if the instance is root of all later instances created.
 */
export default class Core {
  constructor(rootElement: HTMLElement, userSettings: GridSettings, rootInstanceSymbol: boolean = false) {
    const eventManager: EventManager = new EventManager(this);
    let datamap: DataMap;
    let dataSource: DataSource;
    let grid: Grid;
    let focusManager: FocusManager;
    let viewportScroller: ViewportScroller;
    let firstRun: boolean | [null, string] = true;

    if (hasValidParameter(rootInstanceSymbol)) {
      registerAsRootInstance(this);
    }

    this.rootElement = rootElement;
    this.rootDocument = rootElement.ownerDocument;
    this.rootWindow = this.rootDocument.defaultView;

    const layoutDirection: string = userSettings?.layoutDirection ?? 'inherit';
    const rootElementDirection: string = ['rtl', 'ltr'].includes(layoutDirection) ?
      layoutDirection : this.rootWindow.getComputedStyle(this.rootElement).direction;
  
    this.rootElement.setAttribute('dir', rootElementDirection);

    userSettings.language = getValidLanguageCode(userSettings.language);

    const metaManager: MetaManager = new MetaManager(this, userSettings, [
      DynamicCellMetaMod,
      ExtendMetaPropertiesMod,
    ]);
    const tableMeta: TableMeta = metaManager.getTableMeta();
    const globalMeta: GlobalMeta = metaManager.getGlobalMeta();
    this.pluginsRegistry = createUniqueMap();

    this.container = this.rootDocument.createElement('div');
    this.renderCall = false;

    rootElement.insertBefore(this.container, rootElement.firstChild);

    if (isRootInstance(this)) {
      _injectProductInfo(userSettings.licenseKey, rootElement);

      addClass(rootElement, 'ht-wrapper');
    }

    this.guid = `ht_${randomString()}`; // this is the namespace for global events

    foreignHotInstances.set(this.guid, this);

    this.columnIndexMapper = new IndexMapper();
    this.rowIndexMapper = new IndexMapper();

    this.columnIndexMapper.addLocalHook('indexesSequenceChange', (source: string) => {
      this.runHooks('afterColumnSequenceChange', source);
    });
  
    this.rowIndexMapper.addLocalHook('indexesSequenceChange', (source: string) => {
      this.runHooks('afterRowSequenceChange', source);
    });
  
    dataSource = new DataSource(this);
  
    if (!this.rootElement.id || this.rootElement.id.substring(0, 3) === 'ht_') {
      this.rootElement.id = this.guid; // if root element does not have an id, assign a random id
    }

    this.selection = new Selection(tableMeta, {
      rowIndexMapper: this.rowIndexMapper,
      columnIndexMapper: this.columnIndexMapper,
      countCols: () => this.countCols(),
      countRows: () => this.countRows(),
      propToCol: prop => datamap.propToCol(prop),
      isEditorOpened: () => (this.getActiveEditor() ? this.getActiveEditor().isOpened() : false),
      countRenderableColumns: () => this.view.countRenderableColumns(),
      countRenderableRows: () => this.view.countRenderableRows(),
      countRowHeaders: () => this.countRowHeaders(),
      countColHeaders: () => this.countColHeaders(),
      countRenderableRowsInRange: (...args) => this.view.countRenderableRowsInRange(...args),
      countRenderableColumnsInRange: (...args) => this.view.countRenderableColumnsInRange(...args),
      getShortcutManager: () => this.getShortcutManager(),
      createCellCoords: (row: number, column: number) => this._createCellCoords(row, column),
      createCellRange: (highlight: CellCoords, from: CellCoords, to: CellCoords) => this._createCellRange(highlight, from, to),
      visualToRenderableCoords: this.visualToRenderableCoords,
      renderableToVisualCoords: this.renderableToVisualCoords,
      findFirstNonHiddenRenderableRow: this.findFirstNonHiddenRenderableRow,
      findFirstNonHiddenRenderableColumn: this.findFirstNonHiddenRenderableColumn,
      isDisabledCellSelection: (visualRow: number, visualColumn: number) => {
        if (visualRow < 0 || visualColumn < 0) {
          return this.getSettings().disableVisualSelection;
        }
  
        return this.getCellMeta(visualRow, visualColumn).disableVisualSelection;
      }
    });

    
    this.columnIndexMapper.addLocalHook('cacheUpdated', onIndexMapperCacheUpdate);
    this.rowIndexMapper.addLocalHook('cacheUpdated', onIndexMapperCacheUpdate);

    this.selection.addLocalHook('afterSetRangeEnd', (cellCoords: CellCoords, isLastSelectionLayer: boolean) => {
      const preventScrolling: ObjectPropListener = createObjectPropListener(false);
      const selectionRange: SelectionRange = this.selection.getSelectedRange();
      const { from, to } = selectionRange.current();
      const selectionLayerLevel: number = selectionRange.size() - 1;

      this.runHooks('afterSelection',
        from.row,
        from.col,
        to.row,
        to.col,
        preventScrolling,
        selectionLayerLevel
      );
      this.runHooks('afterSelectionByProp',
        from.row,
        this.colToProp(from.col),
        to.row,
        this.colToProp(to.col),
        preventScrolling,
        selectionLayerLevel
      );

      if (
        isLastSelectionLayer &&
        (!preventScrolling.isTouched() || preventScrolling.isTouched() && !preventScrolling.value)
      ) {
        viewportScroller.scrollTo(cellCoords);
      }

      const isSelectedByRowHeader: boolean = selection.isSelectedByRowHeader();
      const isSelectedByColumnHeader: boolean = selection.isSelectedByColumnHeader();

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

      if (selection.getSelectionSource() !== 'shift') {
        editorManager.closeEditor(null);
      }

      this.view.render();
      editorManager.prepareEditor();
    });
    
    this.selection.addLocalHook('beforeSetFocus', (cellCoords: CellCoords) => {
      this.runHooks('beforeSelectionFocusSet', cellCoords.row, cellCoords.col);
    });

    this.selection.addLocalHook('afterSetFocus', (cellCoords: CellCoords) => {
      const preventScrolling: ObjectPropListener = createObjectPropListener(false);

      this.runHooks('afterSelectionFocusSet', cellCoords.row, cellCoords.col, preventScrolling);

      if (!preventScrolling.isTouched() || preventScrolling.isTouched() && !preventScrolling.value) {
        viewportScroller.scrollTo(cellCoords);
      }

      editorManager.closeEditor();
      this.view.render();
      editorManager.prepareEditor();
    });

    this.selection.addLocalHook('afterSelectionFinished', (cellRanges: CellRange[]) => {
      const selectionLayerLevel: number = cellRanges.length - 1;
      const { from, to } = cellRanges[selectionLayerLevel];

      this.runHooks('afterSelectionEnd',
        from.row, from.col, to.row, to.col, selectionLayerLevel);
      this.runHooks('afterSelectionEndByProp',
        from.row, this.colToProp(from.col), to.row, this.colToProp(to.col), selectionLayerLevel);
    });

    this.selection.addLocalHook('afterIsMultipleSelection', (isMultiple: ObjectPropListener) => {
      const changedIsMultiple: boolean = this.runHooks('afterIsMultipleSelection', isMultiple.value);

      if (isMultiple.value) {
        isMultiple.value = changedIsMultiple;
      }
    });

    this.selection.addLocalHook('afterDeselect', () => {
      editorManager.closeEditor();
      this.view.render();

      removeClass(this.rootElement, ['ht__selection--rows', 'ht__selection--columns']);

      this.runHooks('afterDeselect');
    });

    this.selection
      .addLocalHook('beforeHighlightSet', () => this.runHooks('beforeSelectionHighlightSet'))
      .addLocalHook('beforeSetRangeStart', (...args) => this.runHooks('beforeSetRangeStart', ...args))
      .addLocalHook('beforeSetRangeStartOnly', (...args) => this.runHooks('beforeSetRangeStartOnly', ...args))
      .addLocalHook('beforeSetRangeEnd', (...args) => this.runHooks('beforeSetRangeEnd', ...args))
      .addLocalHook('beforeSelectColumns', (...args) => this.runHooks('beforeSelectColumns', ...args))
      .addLocalHook('afterSelectColumns', (...args) => this.runHooks('afterSelectColumns', ...args))
      .addLocalHook('beforeSelectRows', (...args) => this.runHooks('beforeSelectRows', ...args))
      .addLocalHook('afterSelectRows', (...args) => this.runHooks('afterSelectRows', ...args))
      .addLocalHook('beforeModifyTransformStart', (...args) => this.runHooks('modifyTransformStart', ...args))
      .addLocalHook('afterModifyTransformStart', (...args) => this.runHooks('afterModifyTransformStart', ...args))
      .addLocalHook('beforeModifyTransformFocus', (...args) => this.runHooks('modifyTransformFocus', ...args))
      .addLocalHook('afterModifyTransformFocus', (...args) => this.runHooks('afterModifyTransformFocus', ...args))
      .addLocalHook('beforeModifyTransformEnd', (...args) => this.runHooks('modifyTransformEnd', ...args))
      .addLocalHook('afterModifyTransformEnd', (...args) => this.runHooks('afterModifyTransformEnd', ...args))
      .addLocalHook('beforeRowWrap', (...args) => this.runHooks('beforeRowWrap', ...args))
      .addLocalHook('beforeColumnWrap', (...args) => this.runHooks('beforeColumnWrap', ...args))
      .addLocalHook('insertRowRequire', totalRows => this.alter('insert_row_above', totalRows, 1, 'auto'))
      .addLocalHook('insertColRequire', totalCols => this.alter('insert_col_start', totalCols, 1, 'auto'));

    grid = {
      /**
       * Inserts or removes rows and columns.
       *
       * @private
       * @param {string} action Possible values: "insert_row_above", "insert_row_below", "insert_col_start", "insert_col_end",
       *                        "remove_row", "remove_col".
       * @param {number|Array} index Row or column visual index which from the alter action will be triggered.
       *                             Alter actions such as "remove_row" and "remove_col" support array indexes in the
       *                             format `[[index, amount], [index, amount]...]` this can be used to remove
       *                             non-consecutive columns or rows in one call.
       * @param {number} [amount=1] Amount of rows or columns to remove.
       * @param {string} [source] Optional. Source of hook runner.
       * @param {boolean} [keepEmptyRows] Optional. Flag for preventing deletion of empty rows.
       */
      alter(action: string, index: number | number[], amount: number = 1, source?: string, keepEmptyRows?: boolean) {
        const normalizeIndexesGroup = (indexes: number[][]): number[][] => {
          if (indexes.length === 0) {
            return [];
          }
  
          const sortedIndexes: number[][] = [...indexes];
  
          // Sort the indexes in ascending order.
          sortedIndexes.sort(([indexA], [indexB]) => {
            if (indexA === indexB) {
              return 0;
            }
  
            return indexA > indexB ? 1 : -1;
          });
  
          // Normalize the {index, amount} groups into bigger groups.
          const normalizedIndexes: number[][] = arrayReduce(sortedIndexes, (acc: number[][], [groupIndex, groupAmount]) => {
            const previousItem: number[] = acc[acc.length - 1];
            const [prevIndex, prevAmount] = previousItem;
            const prevLastIndex: number = prevIndex + prevAmount;
  
            if (groupIndex <= prevLastIndex) {
              const amountToAdd: number = Math.max(groupAmount - (prevLastIndex - groupIndex), 0);
  
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
          case 'insert_row_below':
          case 'insert_row_above':
            const numberOfSourceRows: number = this.countSourceRows();
  
            if (tableMeta.maxRows === numberOfSourceRows) {
              return;
            }
  
            // `above` is the default behavior for creating new rows
            const insertRowMode: 'above' | 'below' = action === 'insert_row_below' ? 'below' : 'above';
  
            // Calling the `insert_row_above` action adds a new row at the beginning of the data set.
            // eslint-disable-next-line no-param-reassign
            index = index ?? (insertRowMode === 'below' ? numberOfSourceRows : 0);
  
            const {
              delta: rowDelta,
              startPhysicalIndex: startRowPhysicalIndex,
            } = datamap.createRow(index, amount, { source, mode: insertRowMode });
  
            selection.shiftRows(this.toVisualRow(startRowPhysicalIndex), rowDelta);
            break;
  
          case 'insert_col_start':
          case 'insert_col_end':
            // "start" is a default behavior for creating new columns
            const insertColumnMode: 'start' | 'end' = action === 'insert_col_end' ? 'end' : 'start';
  
            // Calling the `insert_col_start` action adds a new column to the left of the data set.
            // eslint-disable-next-line no-param-reassign
            index = index ?? (insertColumnMode === 'end' ? this.countSourceCols() : 0);
  
            const {
              delta: colDelta,
              startPhysicalIndex: startColumnPhysicalIndex,
            } = datamap.createCol(index, amount, { source, mode: insertColumnMode });
  
            if (colDelta) {
              if (Array.isArray(tableMeta.colHeaders)) {
                const spliceArray: (number | undefined)[] = [this.toVisualColumn(startColumnPhysicalIndex), 0];
  
                spliceArray.length += colDelta; // inserts empty (undefined) elements at the end of an array
                Array.prototype.splice.apply(tableMeta.colHeaders, spliceArray); // inserts empty (undefined) elements into the colHeader array
              }
  
              selection.shiftColumns(this.toVisualColumn(startColumnPhysicalIndex), colDelta);
            }
            break;
  
          case 'remove_row':
  
            const removeRow = (indexes: number[][]) => {
              let offset: number = 0;
  
              // Normalize the {index, amount} groups into bigger groups.
              arrayEach(indexes, ([groupIndex, groupAmount]) => {
                const calcIndex: number = isEmpty(groupIndex) ? this.countRows() - 1 : Math.max(groupIndex - offset, 0);
  
                // If the 'index' is an integer decrease it by 'offset' otherwise pass it through to make the value
                // compatible with datamap.removeRow method.
                if (Number.isInteger(groupIndex)) {
                  // eslint-disable-next-line no-param-reassign
                  groupIndex = Math.max(groupIndex - offset, 0);
                }
  
                // TODO: for datamap.removeRow index should be passed as it is (with undefined and null values). If not, the logic
                // inside the datamap.removeRow breaks the removing functionality.
                const wasRemoved: boolean = datamap.removeRow(groupIndex, groupAmount, source);
  
                if (!wasRemoved) {
                  return;
                }
  
                if (selection.isSelected()) {
                  const { row } = this.getSelectedRangeLast().highlight;
  
                  if (row >= groupIndex && row <= groupIndex + groupAmount - 1) {
                    editorManager.closeEditor(true);
                  }
                }
  
                const totalRows: number = this.countRows();
  
                if (totalRows === 0) {
                  selection.deselect();
  
                } else if (source === 'ContextMenu.removeRow') {
                  selection.refresh();
  
                } else {
                  selection.shiftRows(groupIndex, -groupAmount);
                }
  
                const fixedRowsTop: number = tableMeta.fixedRowsTop;
  
                if (fixedRowsTop >= calcIndex + 1) {
                  tableMeta.fixedRowsTop -= Math.min(groupAmount, fixedRowsTop - calcIndex);
                }
  
                const fixedRowsBottom: number = tableMeta.fixedRowsBottom;
  
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
            break;
  
          case 'remove_col':
  
            const removeCol = (indexes: number[][]) => {
              let offset: number = 0;
  
              // Normalize the {index, amount} groups into bigger groups.
              arrayEach(indexes, ([groupIndex, groupAmount]) => {
                const calcIndex: number = isEmpty(groupIndex) ? this.countCols() - 1 : Math.max(groupIndex - offset, 0);
                let physicalColumnIndex: number = this.toPhysicalColumn(calcIndex);
  
                // If the 'index' is an integer decrease it by 'offset' otherwise pass it through to make the value
                // compatible with datamap.removeCol method.
                if (Number.isInteger(groupIndex)) {
                  // eslint-disable-next-line no-param-reassign
                  groupIndex = Math.max(groupIndex - offset, 0);
                }
  
                // TODO: for datamap.removeCol index should be passed as it is (with undefined and null values). If not, the logic
                // inside the datamap.removeCol breaks the removing functionality.
                const wasRemoved: boolean = datamap.removeCol(groupIndex, groupAmount, source);
  
                if (!wasRemoved) {
                  return;
                }
  
                if (selection.isSelected()) {
                  const { col } = this.getSelectedRangeLast().highlight;
  
                  if (col >= groupIndex && col <= groupIndex + groupAmount - 1) {
                    editorManager.closeEditor(true);
                  }
                }
  
                const totalColumns: number = this.countCols();
  
                if (totalColumns === 0) {
                  selection.deselect();
  
                } else if (source === 'ContextMenu.removeColumn') {
                  selection.refresh();
  
                } else {
                  selection.shiftColumns(groupIndex, -groupAmount);
                }
  
                const fixedColumnsStart: number = tableMeta.fixedColumnsStart;
  
                if (fixedColumnsStart >= calcIndex + 1) {
                  tableMeta.fixedColumnsStart -= Math.min(groupAmount, fixedColumnsStart - calcIndex);
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
            break;
          default:
            throw new Error(`There is no such action "${action}"`);
        }
  
        if (!keepEmptyRows) {
          grid.adjustRowsAndCols(); // makes sure that we did not add rows that will be removed in next refresh
        }
  
        this.view.render();
        this.view.adjustElementsSize();
      },
  
      /**
       * Makes sure there are empty rows at the bottom of the table.
       *
       * @private
       */
      adjustRowsAndCols() {
        const minRows: number = tableMeta.minRows;
        const minSpareRows: number = tableMeta.minSpareRows;
        const minCols: number = tableMeta.minCols;
        const minSpareCols: number = tableMeta.minSpareCols;
  
        if (minRows) {
          // should I add empty rows to data source to meet minRows?
          const nrOfRows: number = this.countRows();
  
          if (nrOfRows < minRows) {
            // The synchronization with cell meta is not desired here. For `minRows` option,
            // we don't want to touch/shift cell meta objects.
            datamap.createRow(nrOfRows, minRows - nrOfRows, { source: 'auto' });
          }
        }
        if (minSpareRows) {
          const emptyRows: number = this.countEmptyRows(true);
  
          // should I add empty rows to meet minSpareRows?
          if (emptyRows < minSpareRows) {
            const emptyRowsMissing: number = minSpareRows - emptyRows;
            const rowsToCreate: number = Math.min(emptyRowsMissing, tableMeta.maxRows - this.countSourceRows());
  
            // The synchronization with cell meta is not desired here. For `minSpareRows` option,
            // we don't want to touch/shift cell meta objects.
            datamap.createRow(this.countRows(), rowsToCreate, { source: 'auto' });
          }
        }
        {
          let emptyCols: number;
  
          // count currently empty cols
          if (minCols || minSpareCols) {
            emptyCols = this.countEmptyCols(true);
          }
  
          let nrOfColumns: number = this.countCols();
  
          // should I add empty cols to meet minCols?
          if (minCols && !tableMeta.columns && nrOfColumns < minCols) {
            // The synchronization with cell meta is not desired here. For `minCols` option,
            // we don't want to touch/shift cell meta objects.
            const colsToCreate: number = minCols - nrOfColumns;
  
            emptyCols += colsToCreate;
  
            datamap.createCol(nrOfColumns, colsToCreate, { source: 'auto' });
          }
          // should I add empty cols to meet minSpareCols?
          if (minSpareCols && !tableMeta.columns && this.dataType === 'array' &&
            emptyCols < minSpareCols) {
            nrOfColumns = this.countCols();
            const emptyColsMissing: number = minSpareCols - emptyCols;
            const colsToCreate: number = Math.min(emptyColsMissing, tableMeta.maxCols - nrOfColumns);
  
            // The synchronization with cell meta is not desired here. For `minSpareCols` option,
            // we don't want to touch/shift cell meta objects.
            datamap.createCol(nrOfColumns, colsToCreate, { source: 'auto' });
          }
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
       * @returns {object|undefined} Ending td in pasted area (only if any cell was changed).
       */
      populateFromArray(start: CellCoords, input: any[][], end?: CellCoords, source: string = "populateFromArray", method: string = "overwrite"): HTMLTableCellElement | undefined {
        let r: number;
        let rlen: number;
        let c: number;
        let clen: number;
        const setData: any[][] = [];
        const current: { row: number; col: number } = { row: 0, col: 0 };
        const newDataByColumns: any[][] = [];
        const startRow: number = start.row;
        const startColumn: number = start.col;
  
        rlen = input.length;
  
        if (rlen === 0) {
          return undefined;
        }
  
        let columnsPopulationEnd: number = 0;
        let rowsPopulationEnd: number = 0;
  
        if (isObject(end)) {
          columnsPopulationEnd = end.col - startColumn + 1;
          rowsPopulationEnd = end.row - startRow + 1;
        }
  
        // insert data with specified pasteMode method
        switch (method) {
          case 'shift_down':
            // translate data from a list of rows to a list of columns
            const populatedDataByColumns: any[][] = pivot(input);
            const numberOfDataColumns: number = populatedDataByColumns.length;
            // method's argument can extend the range of data population (data would be repeated)
            const numberOfColumnsToPopulate: number = Math.max(numberOfDataColumns, columnsPopulationEnd);
            const pushedDownDataByRows: any[][] = this.getData().slice(startRow);
  
            // translate data from a list of rows to a list of columns
            const pushedDownDataByColumns: any[][] = pivot(pushedDownDataByRows)
              .slice(startColumn, startColumn + numberOfColumnsToPopulate);
  
            for (c = 0; c < numberOfColumnsToPopulate; c += 1) {
              if (c < numberOfDataColumns) {
                for (r = 0, rlen = populatedDataByColumns[c].length; r < rowsPopulationEnd - rlen; r += 1) {
                  // repeating data for rows
                  populatedDataByColumns[c].push(populatedDataByColumns[c][r % rlen]);
                }
  
                if (c < pushedDownDataByColumns.length) {
                  newDataByColumns.push(populatedDataByColumns[c].concat(pushedDownDataByColumns[c]));
  
                } else {
                  // if before data population, there was no data in the column
                  // we fill the required rows' newly-created cells with `null` values
                  newDataByColumns.push(populatedDataByColumns[c].concat(
                    new Array(pushedDownDataByRows.length).fill(null)));
                }
  
              } else {
                // Repeating data for columns.
                newDataByColumns.push(populatedDataByColumns[c % numberOfDataColumns].concat(pushedDownDataByColumns[c]));
              }
            }
  
            this.populateFromArray(startRow, startColumn, pivot(newDataByColumns));
  
            break;
  
          case 'shift_right':
            const numberOfDataRows: number = input.length;
            // method's argument can extend the range of data population (data would be repeated)
            const numberOfRowsToPopulate: number = Math.max(numberOfDataRows, rowsPopulationEnd);
            const pushedRightDataByRows: any[][] = this.getData().slice(startRow).map(rowData => rowData.slice(startColumn));
  
            for (r = 0; r < numberOfRowsToPopulate; r += 1) {
              if (r < numberOfDataRows) {
                for (c = 0, clen = input[r].length; c < columnsPopulationEnd - clen; c += 1) {
                  // repeating data for rows
                  input[r].push(input[r][c % clen]);
                }
  
                if (r < pushedRightDataByRows.length) {
                  for (let i = 0; i < pushedRightDataByRows[r].length; i += 1) {
                    input[r].push(pushedRightDataByRows[r][i]);
                  }
  
                } else {
                  // if before data population, there was no data in the row
                  // we fill the required columns' newly-created cells with `null` values
                  input[r].push(...new Array(pushedRightDataByRows[0].length).fill(null));
                }
  
              } else {
                // Repeating data for columns.
                input.push(input[r % rlen].slice(0, numberOfRowsToPopulate).concat(pushedRightDataByRows[r]));
              }
            }
  
            this.populateFromArray(startRow, startColumn, input);
  
            break;
  
          case 'overwrite':
          default:
            // overwrite and other not specified options
            current.row = start.row;
            current.col = start.col;
  
            let skippedRow: number = 0;
            let skippedColumn: number = 0;
            let pushData: boolean = true;
            let cellMeta: CellMeta;
  
            const getInputValue = function getInputValue(row: number, col: number | null = null): any {
              const rowValue: any[] = input[row % input.length];
  
              if (col !== null) {
                return rowValue[col % rowValue.length];
              }
  
              return rowValue;
            };
            const rowInputLength: number = input.length;
            const rowSelectionLength: number = end ? end.row - start.row + 1 : 0;
  
            if (end) {
              rlen = rowSelectionLength;
            } else {
              rlen = Math.max(rowInputLength, rowSelectionLength);
            }
            for (r = 0; r < rlen; r++) {
              if ((end && current.row > end.row && rowSelectionLength > rowInputLength) ||
                  (!tableMeta.allowInsertRow && current.row > this.countRows() - 1) ||
                  (current.row >= tableMeta.maxRows)) {
                break;
              }
              const visualRow: number = r - skippedRow;
              const colInputLength: number = getInputValue(visualRow).length;
              const colSelectionLength: number = end ? end.col - start.col + 1 : 0;
  
              if (end) {
                clen = colSelectionLength;
              } else {
                clen = Math.max(colInputLength, colSelectionLength);
              }
              current.col = start.col;
              cellMeta = this.getCellMeta(current.row, current.col);
  
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
                    (!tableMeta.allowInsertColumn && current.col > this.countCols() - 1) ||
                    (current.col >= tableMeta.maxCols)) {
                  break;
                }
                cellMeta = this.getCellMeta(current.row, current.col);
  
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
  
                const visualColumn: number = c - skippedColumn;
                let value: any = getInputValue(visualRow, visualColumn);
                let orgValue: any = this.getDataAtCell(current.row, current.col);
  
                if (value !== null && typeof value === 'object') {
                  // when 'value' is array and 'orgValue' is null, set 'orgValue' to
                  // an empty array so that the null value can be compared to 'value'
                  // as an empty value for the array context
                  if (Array.isArray(value) && orgValue === null) {
                    orgValue = [];
                  }
  
                  if (orgValue === null || typeof orgValue !== 'object') {
                    pushData = false;
  
                  } else {
                    const orgValueSchema: any = duckSchema(Array.isArray(orgValue) ? orgValue : (orgValue[0] || orgValue));
                    const valueSchema: any = duckSchema(Array.isArray(value) ? value : (value[0] || value));
  
                    // Allow overwriting values with the same object-based schema or any array-based schema.
                    if (
                      isObjectEqual(orgValueSchema, valueSchema) ||
                      (Array.isArray(orgValueSchema) && Array.isArray(valueSchema))
                    ) {
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
            this.setDataAtCell(setData, null, null, source || 'populateFromArray');
            break;
        }
      },
    };

    this.shortcutManager = createShortcutManager({
      handleEvent() {
        return this.isListening();
      },
      beforeKeyDown: (event) => {
        return this.runHooks('beforeKeyDown', event);
      },
      afterKeyDown: (event) => {
        if (this.isDestroyed) { // Handsontable could be destroyed after performing action (executing a callback).
          return;
        }
  
        this.runHooks('afterDocumentKeyDown', event);
      },
      ownerWindow: this.rootWindow,
    });
  
    this.addHook('beforeOnCellMouseDown', (event) => {
      // Releasing keys as some browser/system shortcuts break events sequence (thus the `keyup` event isn't triggered).
      if (event.ctrlKey === false && event.metaKey === false) {
        shortcutManager.releasePressedKeys();
      }
    });  
  
    getPluginsNames().forEach((pluginName) => {
      const PluginClass = getPlugin(pluginName);
  
      this.pluginsRegistry.addItem(pluginName, new PluginClass(this));
    });
  
    registerAllShortcutContexts(this);
  
    this.shortcutManager.setActiveContextName('grid');
  
    Hooks.getSingleton().run(this, 'construct');
  
  }

  editorManager: EditorManager;
  pluginsRegistry: UniqueMap;
  shortcutManager: ShortcutManager;

  // TODO: check if references to DOM elements should be move to UI layer (Walkontable)
  /**
   * Reference to the container element.
   *
   * @private
   * @type {HTMLElement}
   */
  rootElement: HTMLElement;
  /**
   * The nearest document over container.
   *
   * @private
   * @type {Document}
   */
  rootDocument: Document;
  /**
   * Window object over container's document.
   *
   * @private
   * @type {Window}
   */
  rootWindow: Window;
  /**
   * A boolean to tell if the Handsontable has been fully destroyed. This is set to `true`
   * after `afterDestroy` hook is called.
   *
   * @memberof Core#
   * @member isDestroyed
   * @type {boolean}
   */
  isDestroyed: boolean = false;
  /**
   * The counter determines how many times the render suspending was called. It allows
   * tracking the nested suspending calls. For each render suspend resuming call the
   * counter is decremented. The value equal to 0 means the render suspending feature
   * is disabled.
   *
   * @private
   * @type {number}
   */
  renderSuspendedCounter: number = 0;
  /**
   * The counter determines how many times the execution suspending was called. It allows
   * tracking the nested suspending calls. For each execution suspend resuming call the
   * counter is decremented. The value equal to 0 means the execution suspending feature
   * is disabled.
   *
   * @private
   * @type {number}
   */
  executionSuspendedCounter: number = 0;

  /**
   * Checks if the grid is rendered using the right-to-left layout direction.
   *
   * @since 12.0.0
   * @memberof Core#
   * @function isRtl
   * @returns {boolean} True if RTL.
   */
  isRtl(): boolean {
    return this.rootElementDirection === 'rtl';
  };

  /**
   * Checks if the grid is rendered using the left-to-right layout direction.
   *
   * @since 12.0.0
   * @memberof Core#
   * @function isLtr
   * @returns {boolean} True if LTR.
   */
  isLtr(): boolean {
    return !this.isRtl();
  };

  /**
   * Returns 1 for LTR; -1 for RTL. Useful for calculations.
   *
   * @since 12.0.0
   * @memberof Core#
   * @function getDirectionFactor
   * @returns {number} Returns 1 for LTR; -1 for RTL.
   */
  getDirectionFactor(): number {
    return this.isLtr() ? 1 : -1;
  };

  /**
   * Instance of index mapper which is responsible for managing the column indexes.
   *
   * @memberof Core#
   * @member columnIndexMapper
   * @type {IndexMapper}
   */
  columnIndexMapper: IndexMapper;
  /**
   * Instance of index mapper which is responsible for managing the row indexes.
   *
   * @memberof Core#
   * @member rowIndexMapper
   * @type {IndexMapper}
   */
  rowIndexMapper: IndexMapper;

  visualToRenderableCoords(coords: CellCoords): CellCoords {
    const { row: visualRow, col: visualColumn } = coords;

    return this._createCellCoords(
      // We just store indexes for rows and columns without headers.
      visualRow >= 0 ? this.rowIndexMapper.getRenderableFromVisualIndex(visualRow) : visualRow,
      visualColumn >= 0 ? this.columnIndexMapper.getRenderableFromVisualIndex(visualColumn) : visualColumn
    );
  }

  renderableToVisualCoords(coords: CellCoords): CellCoords {
    const { row: renderableRow, col: renderableColumn } = coords;

    return this._createCellCoords(
      // We just store indexes for rows and columns without headers.
      renderableRow >= 0 ? this.rowIndexMapper.getVisualFromRenderableIndex(renderableRow) : renderableRow,
      renderableColumn >= 0 ? this.columnIndexMapper.getVisualFromRenderableIndex(renderableColumn) : renderableColumn // eslint-disable-line max-len
    );
  }

  findFirstNonHiddenRenderableRow(visualRowFrom: number, visualRowTo: number): number | null {
    const dir: number = visualRowTo > visualRowFrom ? 1 : -1;
    const minIndex: number = Math.min(visualRowFrom, visualRowTo);
    const maxIndex: number = Math.max(visualRowFrom, visualRowTo);
    const rowIndex: number | null = this.rowIndexMapper.getNearestNotHiddenIndex(visualRowFrom, dir);

    if (rowIndex === null || dir === 1 && rowIndex > maxIndex || dir === -1 && rowIndex < minIndex) {
      return null;
    }

    return rowIndex >= 0 ? this.rowIndexMapper.getRenderableFromVisualIndex(rowIndex) : rowIndex;
  }

  findFirstNonHiddenRenderableColumn(visualColumnFrom: number, visualColumnTo: number): number | null {
    const dir: number = visualColumnTo > visualColumnFrom ? 1 : -1;
    const minIndex: number = Math.min(visualColumnFrom, visualColumnTo);
    const maxIndex: number = Math.max(visualColumnFrom, visualColumnTo);
    const columnIndex: number | null = this.columnIndexMapper.getNearestNotHiddenIndex(visualColumnFrom, dir);

    if (columnIndex === null || dir === 1 && columnIndex > maxIndex || dir === -1 && columnIndex < minIndex) {
      return null;
    }

    return columnIndex >= 0 ? this.columnIndexMapper.getRenderableFromVisualIndex(columnIndex) : columnIndex;
  }

  selection: Selection;

  onIndexMapperCacheUpdate({ hiddenIndexesChanged }: { hiddenIndexesChanged: boolean }) {
    if (hiddenIndexesChanged) {
      this.selection.commit();
    }
  }



  /**
   * Internal function to set `language` key of settings.
   *
   * @private
   * @param {string} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
   * @fires Hooks#afterLanguageChange
   */
  setLanguage(languageCode: string) {
    const normalizedLanguageCode: string = normalizeLanguageCode(languageCode);

    if (hasLanguageDictionary(normalizedLanguageCode)) {
      this.runHooks('beforeLanguageChange', normalizedLanguageCode);

      globalMeta.language = normalizedLanguageCode;

      this.runHooks('afterLanguageChange', normalizedLanguageCode);

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
  setClassName(className: string, classSettings: string | string[]) {
    const element: HTMLElement = className === 'className' ? this.rootElement : this.table;

    if (firstRun) {
      addClass(element, classSettings);

    } else {
      let globalMetaSettingsArray: string[] = [];
      let settingsArray: string[] = [];

      if (globalMeta[className]) {
        globalMetaSettingsArray = Array.isArray(globalMeta[className]) ?
          globalMeta[className] : stringToArray(globalMeta[className]);
      }

      if (classSettings) {
        settingsArray = Array.isArray(classSettings) ? classSettings : stringToArray(classSettings);
      }

      const classNameToRemove: string[] = getDifferenceOfArrays(globalMetaSettingsArray, settingsArray);
      const classNameToAdd: string[] = getDifferenceOfArrays(settingsArray, globalMetaSettingsArray);

      if (classNameToRemove.length) {
        removeClass(element, classNameToRemove);
      }

      if (classNameToAdd.length) {
        addClass(element, classNameToAdd);
      }
    }

    globalMeta[className] = classSettings;
  }

  init() {
    dataSource.setData(tableMeta.data);
    this.runHooks('beforeInit');

    if (isMobileBrowser() || isIpadOS()) {
      addClass(this.rootElement, 'mobile');
    }

    this.updateSettings(tableMeta, true);

    this.view = new TableView(this);

    const themeName: string = tableMeta.themeName || getThemeClassName(this.rootElement);

    // Use the theme defined as a root element class or in the settings (in that order).
    this.useTheme(themeName);

    // Add the theme class name to the license info element.
    this.view.addClassNameToLicenseElement(this.getCurrentThemeName());

    editorManager = EditorManager.getInstance(this, tableMeta, selection);

    viewportScroller = createViewportScroller(this);

    focusManager = new FocusManager(this);

    if (isRootInstance(this)) {
      installFocusCatcher(this);
    }

    this.runHooks('init');

    this.forceFullRender = true; // used when data was changed
    this.view.render();

    // Run the logic only if it's the table's initialization and the root element is not visible.
    if (!!firstRun && this.rootElement.offsetParent === null) {
      observeVisibilityChangeOnce(this.rootElement, () => {
        // Update the spreader size cache before rendering.
        this.view._wt.wtOverlays.updateLastSpreaderSize();
        this.render();
        this.view.adjustElementsSize();
      });
    }

    if (typeof firstRun === 'object') {
      this.runHooks('afterChange', firstRun[0], firstRun[1]);

      firstRun = false;
    }

    this.runHooks('afterInit');
  }

  /**
   * @ignore
   * @returns {object}
   */
  ValidatorsQueue() { // moved this one level up so it can be used in any function here. Probably this should be moved to a separate file
    let resolved: boolean = false;

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
  getParsedNumber(numericData: string): number {
    // Unifying "float like" string. Change from value with comma determiner to value with dot determiner,
    // for example from `450,65` to `450.65`.
    const unifiedNumericData: string = numericData.replace(',', '.');

    if (isNaN(parseFloat(unifiedNumericData)) === false) {
      return parseFloat(unifiedNumericData);
    }

    return numericData as unknown as number;
  }

  /**
   * @ignore
   * @param {Array} changes The 2D array containing information about each of the edited cells.
   * @param {string} source The string that identifies source of validation.
   * @param {Function} callback The callback function fot async validation.
   */
  validateChanges(changes: any[][], source: string, callback: Function) {
    if (!changes.length) {
      callback();

      return;
    }

    const activeEditor: BaseEditor = this.getActiveEditor();
    const waitingForValidator: ValidatorsQueue = new ValidatorsQueue();
    let shouldBeCanceled: boolean = true;

    waitingForValidator.onQueueEmpty = () => {
      if (activeEditor && shouldBeCanceled) {
        activeEditor.cancelChanges();
      }

      callback(); // called when async validators are resolved and beforeChange was not async
    };

    for (let i: number = changes.length - 1; i >= 0; i--) {
      const [row, prop] = changes[i];
      const visualCol: number = datamap.propToCol(prop);
      let cellProperties: CellMeta;

      if (Number.isInteger(visualCol)) {
        cellProperties = this.getCellMeta(row, visualCol);

      } else {
        // If there's no requested visual column, we can use the table meta as the cell properties when retrieving
        // the cell validator.
        cellProperties = { ...Object.getPrototypeOf(tableMeta), ...tableMeta };
      }

      /* eslint-disable no-loop-func */
      if (this.getCellValidator(cellProperties)) {
        waitingForValidator.addValidatorToQueue();
        this.validateCell(changes[i][3], cellProperties, (function(index: number, cellPropertiesReference: CellMeta) {
          return function(result: boolean) {
            if (typeof result !== 'boolean') {
              throw new Error('Validation error: result is not boolean');
            }

            if (result === false && cellPropertiesReference.allowInvalid === false) {
              shouldBeCanceled = false;
              changes.splice(index, 1); // cancel the change
              cellPropertiesReference.valid = true; // we cancelled the change, so cell value is still valid
            }
            waitingForValidator.removeValidatorFormQueue();
          };
        }(i, cellProperties)), source);
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
  applyChanges(changes: any[][], source: string) {
    for (let i: number = changes.length - 1; i >= 0; i--) {
      let skipThisChange: boolean = false;

      if (changes[i] === null) {
        changes.splice(i, 1);
        /* eslint-disable no-continue */
        continue;
      }

      if ((changes[i][2] === null || changes[i][2] === undefined)
        && (changes[i][3] === null || changes[i][3] === undefined)) {
        /* eslint-disable no-continue */
        continue;
      }

      if (tableMeta.allowInsertRow) {
        while (changes[i][0] > this.countRows() - 1) {
          const {
            delta: numberOfCreatedRows
          } = datamap.createRow(undefined, undefined, { source: 'auto' });

          if (numberOfCreatedRows === 0) {
            skipThisChange = true;
            break;
          }
        }
      }

      if (this.dataType === 'array' && (!tableMeta.columns || tableMeta.columns.length === 0) &&
          tableMeta.allowInsertColumn) {
        while (datamap.propToCol(changes[i][1]) > this.countCols() - 1) {
          const {
            delta: numberOfCreatedColumns
          } = datamap.createCol(undefined, undefined, { source: 'auto' });

          if (numberOfCreatedColumns === 0) {
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

    const hasChanges: boolean = changes.length > 0;

    this.forceFullRender = true; // used when data was changed or when all cells need to be re-rendered

    if (hasChanges) {
      grid.adjustRowsAndCols();
      this.runHooks('beforeChangeRender', changes, source);
      editorManager.closeEditor();
      this.view.render();
      editorManager.prepareEditor();
      this.view.adjustElementsSize();
      this.runHooks('afterChange', changes, source || 'edit');

      const activeEditor: BaseEditor = this.getActiveEditor();

      if (activeEditor && isDefined(activeEditor.refreshValue)) {
        activeEditor.refreshValue();
      }

    } else {
      this.view.render();
    }
  }

  /**
   * Creates and returns the CellCoords object.
   *
   * @private
   * @memberof Core#
   * @function _createCellCoords
   * @param {number} row The row index.
   * @param {number} column The column index.
   * @returns {CellCoords}
   */
  _createCellCoords(row: number, column: number): CellCoords {
    return this.view._wt.createCellCoords(row, column);
  }

  /**
   * Creates and returns the CellRange object.
   *
   * @private
   * @memberof Core#
   * @function _createCellRange
   * @param {CellCoords} highlight Defines the border around a cell where selection was started and to edit the cell
   *                               when you press Enter. The highlight cannot point to headers (negative values).
   * @param {CellCoords} from Initial coordinates.
   * @param {CellCoords} to Final coordinates.
   * @returns {CellRange}
   */
  _createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords): CellRange {
    return this.view._wt.createCellRange(highlight, from, to);
  }

  /**
   * Validates the provided value against the column's validator rules. You can set the `validator` type directly to the cell using the cell meta API.
   *
   * @memberof Core#
   * @function validateCell
   * @param {string|number} value The value to validate.
   * @param {CellMeta|object} cellMeta The cell meta object.
   * @param {Function} callback The callback function.
   * @param {string} source The string that identifies source of the validation.
   */
  validateCell(value: string | number, cellProperties: CellMeta, callback: Function, source: string): void {
    let validator: Function | RegExp = this.getCellValidator(cellProperties);

    /**
     * @private
     * @function done
     * @param {boolean} valid Indicates if the validation was successful.
     * @param {boolean} [canBeValidated=true] Flag which controls the validation process.
     */
    function done(valid: boolean, canBeValidated: boolean = true) {
      // Fixes GH#3903
      if (!canBeValidated || cellProperties.hidden === true) {
        callback(valid);

        return;
      }

      const col: number = cellProperties.visualCol;
      const row: number = cellProperties.visualRow;
      const td: HTMLTableCellElement = this.getCell(row, col, true);

      if (td && td.nodeName !== 'TH') {
        const renderableRow: number = this.rowIndexMapper.getRenderableFromVisualIndex(row);
        const renderableColumn: number = this.columnIndexMapper.getRenderableFromVisualIndex(col);

        this.view._wt.getSetting('cellRenderer', renderableRow, renderableColumn, td);
      }

      callback(valid);
    }

    if (isRegExp(validator)) {
      validator = (function(expression: RegExp) {
        return function(cellValue: any, validatorCallback: Function) {
          validatorCallback(expression.test(cellValue));
        };
      }(validator));
    }

    if (isFunction(validator)) {
      // eslint-disable-next-line no-param-reassign
      value = this.runHooks('beforeValidate', value, cellProperties.visualRow, cellProperties.prop, source);

      // To provide consistent behaviour, validation should be always asynchronous
      this._registerImmediate(() => {
        validator.call(cellProperties, value, (valid: boolean) => {
          if (!this) {
            return;
          }
          // eslint-disable-next-line no-param-reassign
          valid = this
            .runHooks('afterValidate', valid, value, cellProperties.visualRow, cellProperties.prop, source);
          cellProperties.valid = valid;

          done(valid);
          this.runHooks('postAfterValidate', valid, value, cellProperties.visualRow, cellProperties.prop, source);
        });
      });

    } else {
      // resolve callback even if validator function was not found
      this._registerImmediate(() => {
        cellProperties.valid = true;
        done(cellProperties.valid, false);
      });
    }
  }

  /**
   * @ignore
   * @param {number} row The visual row index.
   * @param {string|number} propOrCol The visual prop or column index.
   * @param {*} value The cell value.
   * @returns {Array}
   */
  setDataInputToArray(row: number | any[][], propOrCol: string | number, value: any): any[][] {
    if (Array.isArray(row)) { // it's an array of changes
      return row;
    }

    return [[row, propOrCol, value]];
  }

  /**
   * Process changes prepared for applying to the dataset (unifying list of changes, closing an editor - when needed,
   * calling a hook).
   *
   * @private
   * @param {Array} changes Array of changes in format `[[row, col, value],...]`.
   * @param {string} [source] String that identifies how this change will be described in the changes array (useful in afterChange or beforeChange callback). Set to 'edit' if left empty.
   * @returns {Array} List of changes finally applied to the dataset.
   */
  processChanges(changes: any[][], source: string = 'edit'): any[][] {
    const beforeChangeResult: any = this.runHooks('beforeChange', changes, source || 'edit');
    // The `beforeChange` hook could add a `null` for purpose of cancelling some dataset's change.
    const filteredChanges: any[][] = changes.filter(change => change !== null);

    if (beforeChangeResult === false || filteredChanges.length === 0) {
      this.getActiveEditor()?.cancelChanges();

      return [];
    }

    for (let i: number = filteredChanges.length - 1; i >= 0; i--) {
      const [row, prop, , newValue] = filteredChanges[i];
      const visualColumn: number = datamap.propToCol(prop);
      let cellProperties: CellMeta;

      if (Number.isInteger(visualColumn)) {
        cellProperties = this.getCellMeta(row, visualColumn);
      } else {
        // If there's no requested visual column, we can use the table meta as the cell properties
        cellProperties = { ...Object.getPrototypeOf(tableMeta), ...tableMeta };
      }

      if (cellProperties.type === 'numeric' && typeof newValue === 'string' && isNumericLike(newValue)) {
        filteredChanges[i][3] = getParsedNumber(newValue);
      }
    }

    return filteredChanges;
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
  setDataAtCell(row: number | any[][], column?: number, value?: string, source?: string) {
    const input: any[][] = setDataInputToArray(row, column, value);
    const changes: any[][] = [];
    let changeSource: string = source;
    let i: number;
    let ilen: number;
    let prop: string | number;

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

    const processedChanges: any[][] = processChanges(changes, changeSource);

    this.runHooks('afterSetDataAtCell', processedChanges, changeSource);

    validateChanges(processedChanges, changeSource, () => {
      applyChanges(processedChanges, changeSource);
    });
  }

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
  setDataAtRowProp(row: number | any[][], prop: string, value: string, source?: string) {
    const input: any[][] = setDataInputToArray(row, prop, value);
    const changes: any[][] = [];
    let changeSource: string = source;
    let i: number;
    let ilen: number;

    for (i = 0, ilen = input.length; i < ilen; i++) {
      changes.push([
        input[i][0],
        input[i][1],
        dataSource.getAtCell(this.toPhysicalRow(input[i][0]), input[i][1]),
        input[i][2],
      ]);
    }

    // TODO: I don't think `prop` should be used as `changeSource` here, but removing it would be a breaking change.
    // We should remove it with the next major release.
    if (!changeSource && typeof row === 'object') {
      changeSource = prop;
    }

    const processedChanges: any[][] = processChanges(changes, source);

    this.runHooks('afterSetDataAtRowProp', processedChanges, changeSource);

    validateChanges(processedChanges, changeSource, () => {
      applyChanges(processedChanges, changeSource);
    });
  }

  /**
   * Listen to the keyboard input on document body. This allows Handsontable to capture keyboard events and respond
   * in the right way.
   *
   * @memberof Core#
   * @function listen
   * @fires Hooks#afterListen
   */
  listen() {
    if (this && !this.isListening()) {
      foreignHotInstances.forEach((foreignHot) => {
        if (this !== foreignHot) {
          foreignHot.unlisten();
        }
      });

      activeGuid = this.guid;
      this.runHooks('afterListen');
    }
  }

  /**
   * Stop listening to keyboard input on the document body. Calling this method makes the Handsontable inactive for
   * any keyboard events.
   *
   * @memberof Core#
   * @function unlisten
   */
  unlisten() {
    if (this.isListening()) {
      activeGuid = null;
      this.runHooks('afterUnlisten');
    }
  }

  /**
   * Returns `true` if the current Handsontable instance is listening to keyboard input on document body.
   *
   * @memberof Core#
   * @function isListening
   * @returns {boolean} `true` if the instance is listening, `false` otherwise.
   */
  isListening(): boolean {
    return activeGuid === this.guid;
  }

  /**
   * Destroys the current editor, render the table and prepares the editor of the newly selected cell.
   *
   * @memberof Core#
   * @function destroyEditor
   * @param {boolean} [revertOriginal=false] If `true`, the previous value will be restored. Otherwise, the edited value will be saved.
   * @param {boolean} [prepareEditorIfNeeded=true] If `true` the editor under the selected cell will be prepared to open.
   */
  destroyEditor(revertOriginal: boolean = false, prepareEditorIfNeeded: boolean = true) {
    editorManager.closeEditor(revertOriginal);
    this.view.render();

    if (prepareEditorIfNeeded && selection.isSelected()) {
      editorManager.prepareEditor();
    }
  }

  /**
   * Populates cells at position with 2D input array (e.g. `[[1, 2], [3, 4]]`). Use `endRow`, `endCol` when you
   * want to cut input when a certain row is reached.
   *
   * The `populateFromArray()` method can't change [`readOnly`](@/api/options.md#readonly) cells.
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
   * @returns {object|undefined} Ending td in pasted area (only if any cell was changed).
   */
  populateFromArray(row: number, column: number, input: any[][], endRow?: number, endCol?: number, source: string = 'populateFromArray', method: string = 'overwrite'): HTMLTableCellElement | undefined {
    const c: CellCoords | null = typeof endRow === 'number' ? this._createCellCoords(endRow, endCol) : null;

    return grid.populateFromArray(this._createCellCoords(row, column), input, c, source, method);
  }

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
  spliceCol(column: number, index: number, amount: number, ...elements: number[]): any[] {
    return datamap.spliceCol(column, index, amount, ...elements);
  }

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
  spliceRow(row: number, index: number, amount: number, ...elements: number[]): any[] {
    return datamap.spliceRow(row, index, amount, ...elements);
  }

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
  getSelected(): number[][] | undefined { // https://github.com/handsontable/handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return arrayMap(selection.getSelectedRange(), ({ from, to }) => [from.row, from.col, to.row, to.col]);
    }
  }

  /**
   * Returns the last coordinates applied to the table as a an array `[startRow, startCol, endRow, endCol]`.
   *
   * @since 0.36.0
   * @memberof Core#
   * @function getSelectedLast
   * @returns {Array|undefined} An array of the selection's coordinates.
   */
  getSelectedLast(): number[] | undefined {
    const selected: number[][] = this.getSelected();
    let result: number[];

    if (selected && selected.length > 0) {
      result = selected[selected.length - 1];
    }

    return result;
  }

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
  getSelectedRange(): CellRange[] | undefined { // https://github.com/handsontable/handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return Array.from(selection.getSelectedRange());
    }
  }

  /**
   * Returns the last coordinates applied to the table as a CellRange object.
   *
   * @memberof Core#
   * @function getSelectedRangeLast
   * @since 0.36.0
   * @returns {CellRange|undefined} Selected range object or undefined` if there is no selection.
   */
  getSelectedRangeLast(): CellRange | undefined {
    const selectedRange: CellRange[] = this.getSelectedRange();
    let result: CellRange;

    if (selectedRange && selectedRange.length > 0) {
      result = selectedRange[selectedRange.length - 1];
    }

    return result;
  }

  /**
   * Erases content from cells that have been selected in the table.
   *
   * @memberof Core#
   * @function emptySelectedCells
   * @param {string} [source] String that identifies how this change will be described in the changes array (useful in afterChange or beforeChange callback). Set to 'edit' if left empty.
   * @since 0.36.0
   */
  emptySelectedCells(source?: string): void {
    if (!selection.isSelected() || this.countRows() === 0 || this.countCols() === 0) {
      return;
    }

    const changes: any[][] = [];

    arrayEach(selection.getSelectedRange(), (cellRange: CellRange) => {
      if (cellRange.isSingleHeader()) {
        return;
      }

      const topStart = cellRange.getTopStartCorner();
      const bottomEnd = cellRange.getBottomEndCorner();

      rangeEach(topStart.row, bottomEnd.row, (row: number) => {
        rangeEach(topStart.col, bottomEnd.col, (column: number) => {
          if (!this.getCellMeta(row, column).readOnly) {
            changes.push([row, column, null]);
          }
        });
      });
    });

    if (changes.length > 0) {
      this.setDataAtCell(changes, source);
    }
  }

  /**
   * Checks if the table rendering process was suspended. See explanation in {@link Core#suspendRender}.
   *
   * @memberof Core#
   * @function isRenderSuspended
   * @since 8.3.0
   * @returns {boolean}
   */
  isRenderSuspended(): boolean {
    return this.renderSuspendedCounter > 0;
  }

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
   * Every [`suspendRender()`](@/api/core.md#suspendrender) call needs to correspond with one [`resumeRender()`](@/api/core.md#resumerender) call.
   * For example, if you call [`suspendRender()`](@/api/core.md#suspendrender) 5 times, you need to call [`resumeRender()`](@/api/core.md#resumerender) 5 times as well.
   *
   * @memberof Core#
   * @function suspendRender
   * @since 8.3.0
   * @example
   * ```js
   * hot.suspendRender();
   * hot.alter('insert_row_above', 5, 45);
   * hot.alter('insert_col_start', 10, 40);
   * hot.setDataAtCell(1, 1, 'John');
   * hot.setDataAtCell(2, 2, 'Mark');
   * hot.setDataAtCell(3, 3, 'Ann');
   * hot.setDataAtCell(4, 4, 'Sophia');
   * hot.setDataAtCell(5, 5, 'Mia');
   * hot.selectCell(0, 0);
   * hot.resumeRender(); // It re-renders the table internally
   * ```
   */
  suspendRender(): void {
    this.renderSuspendedCounter += 1;
  }

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
   * Every [`suspendRender()`](@/api/core.md#suspendrender) call needs to correspond with one [`resumeRender()`](@/api/core.md#resumerender) call.
   * For example, if you call [`suspendRender()`](@/api/core.md#suspendrender) 5 times, you need to call [`resumeRender()`](@/api/core.md#resumerender) 5 times as well.
   *
   * @memberof Core#
   * @function resumeRender
   * @since 8.3.0
   * @example
   * ```js
   * hot.suspendRender();
   * hot.alter('insert_row_above', 5, 45);
   * hot.alter('insert_col_start', 10, 40);
   * hot.setDataAtCell(1, 1, 'John');
   * hot.setDataAtCell(2, 2, 'Mark');
   * hot.setDataAtCell(3, 3, 'Ann');
   * hot.setDataAtCell(4, 4, 'Sophia');
   * hot.setDataAtCell(5, 5, 'Mia');
   * hot.selectCell(0, 0);
   * hot.resumeRender(); // It re-renders the table internally
   * ```
   */
  resumeRender(): void {
    this.renderSuspendedCounter = Math.max(this.renderSuspendedCounter - 1, 0);

    if (this.renderSuspendedCounter === 0 && !this.isDestroyed) {
      if (this.renderCall) {
        this.render();
      }
    }
  }

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
  render() {
    if (this.view) {
      this.renderCall = true;
      this.forceFullRender = true; // used when data was changed or when all cells need to be re-rendered

      if (!this.isRenderSuspended()) {
        this.view.render();
      }
    }
  }

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
   *   hot.alter('insert_row_above', 5, 45);
   *   hot.alter('insert_col_start', 10, 40);
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
  batchRender<T>(wrappedOperations: () => T): T {
    this.suspendRender();

    const result = wrappedOperations();

    this.resumeRender();

    return result;
  }

  /**
   * Checks if the execution of the operations is suspended. It returns `true` when the execution
   * is suspended, `false` otherwise.
   *
   * @memberof Core#
   * @function isExecutionSuspended
   * @returns {boolean}
   * @since 8.3.0
   */
  isExecutionSuspended(): boolean {
    return this.executionSuspendedCounter > 0;
  }

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
  suspendExecution(): void {
    this.executionSuspendedCounter += 1;
    this.columnIndexMapper.suspendOperations();
    this.rowIndexMapper.suspendOperations();
  }

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
   * @param {boolean} [forceFlush=false] If true, the table internal data cache
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
  resumeExecution(forceFlush: boolean = false): void {
    if (this.executionSuspendedCounter <= 0) {
      throw new Error('Execution suspend counter cannot be less than 0');
    }

    this.executionSuspendedCounter -= 1;

    if (this.executionSuspendedCounter === 0 && forceFlush) {
      this.forceFullRender = true;

      datamap.clearLengthCache();
    }
  }

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
  batchExecution<T>(wrappedOperations: () => T, forceFlushChanges: boolean = false): T {
    this.suspendExecution();

    const result = wrappedOperations();

    this.resumeExecution(forceFlushChanges);

    return result;
  }

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
   *   hot.alter('insert_row_above', 5, 45);
   *   hot.alter('insert_col_start', 10, 40);
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
  batch<T>(wrappedOperations: () => T): T {
    this.suspendRender();
    this.suspendExecution();

    const result = wrappedOperations();

    this.resumeExecution();
    this.resumeRender();

    return result;
  }

  /**
   * Updates dimensions of the table. The method compares previous dimensions with the current ones and updates accordingly.
   *
   * @memberof Core#
   * @function refreshDimensions
   * @fires Hooks#beforeRefreshDimensions
   * @fires Hooks#afterRefreshDimensions
   */
  refreshDimensions() {
    if (!this.view) {
      return;
    }

    const view = this.view;
    const { width: lastWidth, height: lastHeight } = view.getLastSize();
    const { width, height } = this.rootElement.getBoundingClientRect();
    const isSizeChanged = width !== lastWidth || height !== lastHeight;
    const isResizeBlocked = this.runHooks(
      'beforeRefreshDimensions',
      { width: lastWidth, height: lastHeight },
      { width, height },
      isSizeChanged
    ) === false;

    if (isResizeBlocked) {
      return;
    }

    if (isSizeChanged || view._wt.wtOverlays.scrollableElement === this.rootWindow) {
      view.setLastSize(width, height);
      this.render();
      view.adjustElementsSize();
    }

    this.runHooks(
      'afterRefreshDimensions',
      { width: lastWidth, height: lastHeight },
      { width, height },
      isSizeChanged
    );
  }

  /**
   * The `updateData()` method replaces Handsontable's [`data`](@/api/options.md#data) with a new dataset.
   *
   * The `updateData()` method:
   * - Keeps cells' states (e.g. cells' [formatting](@/guides/cell-features/formatting-cells/formatting-cells.md) and cells' [`readOnly`](@/api/options.md#readonly) states)
   * - Keeps rows' states (e.g. row order)
   * - Keeps columns' states (e.g. column order)
   *
   * To replace Handsontable's [`data`](@/api/options.md#data) and reset states, use the [`loadData()`](#loaddata) method.
   *
   * Read more:
   * - [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
   * - [Saving data](@/guides/getting-started/saving-data/saving-data.md)
   *
   * @memberof Core#
   * @function updateData
   * @since 11.1.0
   * @param {Array} data An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data
   * @param {string} [source] The source of the `updateData()` call
   * @fires Hooks#beforeUpdateData
   * @fires Hooks#afterUpdateData
   * @fires Hooks#afterChange
   */
  updateData(data: any[], source?: string) {
    replaceData(
      data,
      (newDataMap: DataMap) => {
        datamap = newDataMap;
      },
      (newDataMap: DataMap) => {
        datamap = newDataMap;

        this.columnIndexMapper.fitToLength(this.getInitialColumnCount());
        this.rowIndexMapper.fitToLength(this.countSourceRows());

        grid.adjustRowsAndCols();
        selection.refresh();
      }, {
        hotInstance: this,
        dataMap: datamap,
        dataSource,
        internalSource: 'updateData',
        source,
        metaManager,
        firstRun
      });
  }

  /**
   * The `loadData()` method replaces Handsontable's [`data`](@/api/options.md#data) with a new dataset.
   *
   * Additionally, the `loadData()` method:
   * - Resets cells' states (e.g. cells' [formatting](@/guides/cell-features/formatting-cells/formatting-cells.md) and cells' [`readOnly`](@/api/options.md#readonly) states)
   * - Resets rows' states (e.g. row order)
   * - Resets columns' states (e.g. column order)
   *
   * To replace Handsontable's [`data`](@/api/options.md#data) without resetting states, use the [`updateData()`](#updatedata) method.
   *
   * Read more:
   * - [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
   * - [Saving data](@/guides/getting-started/saving-data/saving-data.md)
   *
   * @memberof Core#
   * @function loadData
   * @param {Array} data An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data
   * @param {string} [source] The source of the `loadData()` call
   * @fires Hooks#beforeLoadData
   * @fires Hooks#afterLoadData
   * @fires Hooks#afterChange
   */
  loadData(data: any[], source?: string) {
    replaceData(
      data,
      (newDataMap: DataMap) => {
        datamap = newDataMap;
      },
      () => {
        metaManager.clearCellsCache();
        this.initIndexMappers();
        grid.adjustRowsAndCols();
        selection.refresh();

        if (firstRun) {
          firstRun = [null, 'loadData'];
        }
      }, {
        hotInstance: this,
        dataMap: datamap,
        dataSource,
        internalSource: 'loadData',
        source,
        metaManager,
        firstRun
      });
  }

  /**
   * Gets the initial column count, calculated based on the `columns` setting.
   *
   * @private
   * @returns {number} The calculated number of columns.
   */
  getInitialColumnCount(): number {
    const columnsSettings = tableMeta.columns;
    let finalNrOfColumns = 0;

    // We will check number of columns when the `columns` property was defined as an array. Columns option may
    // narrow down or expand displayed dataset in that case.
    if (Array.isArray(columnsSettings)) {
      finalNrOfColumns = columnsSettings.length;

    } else if (isFunction(columnsSettings)) {
      if (this.dataType === 'array') {
        const nrOfSourceColumns = this.countSourceCols();

        for (let columnIndex = 0; columnIndex < nrOfSourceColumns; columnIndex += 1) {
          if (columnsSettings(columnIndex)) {
            finalNrOfColumns += 1;
          }
        }

        // Extended dataset by the `columns` property? Moved code right from the refactored `countCols` method.
      } else if (this.dataType === 'object' || this.dataType === 'function') {
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

    return finalNrOfColumns;
  }

  /**
   * Init index mapper which manage indexes assigned to the data.
   *
   * @private
   */
  initIndexMappers() {
    this.columnIndexMapper.initToLength(this.getInitialColumnCount());
    this.rowIndexMapper.initToLength(this.countSourceRows());
  }

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
  getData(row?: number, column?: number, row2?: number, column2?: number): any[][] {
    if (isUndefined(row)) {
      return datamap.getAll();
    }

    return datamap.getRange(this._createCellCoords(row, column),
      this._createCellCoords(row2, column2), datamap.DESTINATION_RENDERER);
  }

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
  getCopyableText(startRow: number, startCol: number, endRow: number, endCol: number): string {
    return datamap.getCopyableText(this._createCellCoords(startRow, startCol),
      this._createCellCoords(endRow, endCol));
  }

  /**
   * Returns single value from the data array (intended for clipboard copy to an external application).
   *
   * @memberof Core#
   * @function getCopyableData
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {string} Cell data.
   */
  getCopyableData(row: number, column: number): string {
    return datamap.getCopyable(row, datamap.colToProp(column));
  }

  /**
   * Returns schema provided by constructor settings. If it doesn't exist then it returns the schema based on the data
   * structure in the first row.
   *
   * @memberof Core#
   * @function getSchema
   * @returns {object} Schema object.
   */
  getSchema(): object {
    return datamap.getSchema();
  }

  /**
   * Use it if you need to change configuration after initialization. The `settings` argument is an object containing the changed
   * settings, declared the same way as in the initial settings object.
   *
   * __Note__, that although the `updateSettings` method doesn't overwrite the previously declared settings, it might reset
   * the settings made post-initialization. (for example - ignore changes made using the columnResize feature).
   *
   * Since 8.0.0 passing `columns` or `data` inside `settings` objects will result in resetting states corresponding to rows and columns
   * (for example, row/column sequence, column width, row height, frozen columns etc.).
   *
   * Since 12.0.0 passing `data` inside `settings` objects no longer results in resetting states corresponding to rows and columns
   * (for example, row/column sequence, column width, row height, frozen columns etc.).
   *
   * @memberof Core#
   * @function updateSettings
   * @param {object} settings A settings object (see {@link Options}). Only provide the settings that are changed, not the whole settings object that was used for initialization.
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
  updateSettings(settings: object, init: boolean = false) {
    const dataUpdateFunction = (firstRun ? this.loadData : this.updateData).bind(this);
    let columnsAsFunc = false;
    let i: number;
    let j: number;

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
        // Do nothing. loadData will be triggered later
      } else if (i === 'language') {
        setLanguage(settings.language);

      } else if (i === 'className') {
        setClassName('className', settings.className);

      } else if (i === 'tableClassName' && this.table) {
        setClassName('tableClassName', settings.tableClassName);

        this.view._wt.wtOverlays.syncOverlayTableClassNames();

      } else if (Hooks.getSingleton().isRegistered(i) || Hooks.getSingleton().isDeprecated(i)) {

        if (isFunction(settings[i])) {
          Hooks.getSingleton().addAsFixed(i, settings[i], this);

        } else if (Array.isArray(settings[i])) {
          Hooks.getSingleton().add(i, settings[i], this);
        }

      } else if (!init && hasOwnProperty(settings, i)) { // Update settings
        globalMeta[i] = settings[i];
      }
    }

    // Load data or create data map
    if (settings.data === undefined && tableMeta.data === undefined) {
      dataUpdateFunction(null, 'updateSettings'); // data source created just now

    } else if (settings.data !== undefined) {
      dataUpdateFunction(settings.data, 'updateSettings'); // data source given as option

    } else if (settings.columns !== undefined) {
      datamap.createMap();

      // The `column` property has changed - dataset may be expanded or narrowed down. The `loadData` do the same.
      this.initIndexMappers();
    }

    const clen = this.countCols();
    const columnSetting = tableMeta.columns;

    // Init columns constructors configuration
    if (columnSetting && isFunction(columnSetting)) {
      columnsAsFunc = true;
    }

    // Clear cell meta cache
    if (settings.cell !== undefined || settings.cells !== undefined || settings.columns !== undefined) {
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
      objectEach(settings.cell, (cell: any) => {
        this.setCellMetaObject(cell.row, cell.col, cell);
      });
    }

    this.runHooks('afterCellMetaReset');

    let currentHeight = this.rootElement.style.height;

    if (currentHeight !== '') {
      currentHeight = parseInt(this.rootElement.style.height, 10);
    }

    let height = settings.height;

    if (isFunction(height)) {
      height = height();
    }

    if (init) {
      const initialStyle = this.rootElement.getAttribute('style');

      if (initialStyle) {
        this.rootElement.setAttribute('data-initialstyle', this.rootElement.getAttribute('style'));
      }
    }

    if (height === null) {
      const initialStyle = this.rootElement.getAttribute('data-initialstyle');

      if (initialStyle && (initialStyle.indexOf('height') > -1 || initialStyle.indexOf('overflow') > -1)) {
        this.rootElement.setAttribute('style', initialStyle);

      } else {
        this.rootElement.style.height = '';
        this.rootElement.style.overflow = '';
      }

    } else if (height !== undefined) {
      this.rootElement.style.height = isNaN(height) ? `${height}` : `${height}px`;
      this.rootElement.style.overflow = 'hidden';
    }

    if (typeof settings.width !== 'undefined') {
      let width = settings.width;

      if (isFunction(width)) {
        width = width();
      }

      this.rootElement.style.width = isNaN(width) ? `${width}` : `${width}px`;
    }

    if (!init) {
      if (this.view) {
        this.view._wt.wtViewport.resetHasOversizedColumnHeadersMarked();
        this.view._wt.exportSettingsAsClassNames();

        const currentThemeName = this.getCurrentThemeName();
        const themeNameOptionExists = hasOwnProperty(settings, 'themeName');

        if (
          currentThemeName &&
          themeNameOptionExists &&
          currentThemeName !== settings.themeName
        ) {
          this.view.getStylesHandler().removeClassNames();
          this.view.removeClassNameFromLicenseElement(currentThemeName);
        }

        const themeName =
          (themeNameOptionExists && settings.themeName) ||
          getThemeClassName(this.rootElement);

        // Use the theme defined as a root element class or in the settings (in that order).
        this.useTheme(themeName);

        // Add the theme class name to the license info element.
        this.view.addClassNameToLicenseElement(this.getCurrentThemeName());
      }

      this.runHooks('afterUpdateSettings', settings);
    }

    grid.adjustRowsAndCols();

    if (this.view && !firstRun) {
      this.forceFullRender = true; // used when data was changed
      this.view.render();
      this.view._wt.wtOverlays.adjustElementsSize();
    }

    if (!init && this.view && (currentHeight === '' || height === '' || height === undefined) &&
        currentHeight !== height) {
      this.view._wt.wtOverlays.updateMainScrollableElements();
    }
  };

  /**
   * Gets the value of the currently focused cell.
   *
   * For column headers and row headers, returns `null`.
   *
   * @memberof Core#
   * @function getValue
   * @returns {*} The value of the focused cell.
   */
  getValue(): any {
    const sel = this.getSelectedLast();

    if (tableMeta.getValue) {
      if (isFunction(tableMeta.getValue)) {
        return tableMeta.getValue.call(this);
      } else if (sel) {
        return this.getData()[sel[0][0]][tableMeta.getValue];
      }
    } else if (sel) {
      return this.getDataAtCell(sel[0], sel[1]);
    }
  }

  /**
   * Returns the object settings.
   *
   * @memberof Core#
   * @function getSettings
   * @returns {TableMeta} Object containing the current table settings.
   */
  getSettings(): TableMeta {
    return tableMeta;
  }

  /**
   * Clears the data from the table (the table settings remain intact).
   *
   * @memberof Core#
   * @function clear
   */
  clear() {
    this.selectAll();
    this.emptySelectedCells();
  }

  /**
   * The `alter()` method lets you alter the grid's structure
   * by adding or removing rows and columns at specified positions.
   *
   * ::: tip
   * If you use an array of objects in your [`data`](@/api/options.md#data), the column-related actions won't work.
   * :::
   *
   * ```js
   * // above row 10 (by visual index), insert 1 new row
   * hot.alter('insert_row_above', 10);
   * ```
   *
   *  | Action               | With `index` | Without `index` |
   *  | -------------------- | ------------ | --------------- |
   *  | `'insert_row_above'` | Inserts rows above the `index` row. | Inserts rows above the first row. |
   *  | `'insert_row_below'` | Inserts rows below the `index` row. | Inserts rows below the last row. |
   *  | `'remove_row'`       | Removes rows, starting from the `index` row. | Removes rows, starting from the last row. |
   *  | `'insert_col_start'` | Inserts columns before the `index` column. | Inserts columns before the first column. |
   *  | `'insert_col_end'`   | Inserts columns after the `index` column. | Inserts columns after the last column. |
   *  | `'remove_col'`       | Removes columns, starting from the `index` column. | Removes columns, starting from the last column. |
   *
   * Additional information about `'insert_col_start'` and `'insert_col_end'`:
   * - Their behavior depends on your [`layoutDirection`](@/api/options.md#layoutdirection).
   * - If the provided `index` is higher than the actual number of columns, Handsontable doesn't generate
   * the columns missing in between. Instead, the new columns are inserted next to the last column.
   *
   * @memberof Core#
   * @function alter
   * @param {string} action Available operations:
   * <ul>
   *    <li> `'insert_row_above'` </li>
   *    <li> `'insert_row_below'` </li>
   *    <li> `'remove_row'` </li> </li>
   *    <li> `'insert_col_start'` </li>
   *    <li> `'insert_col_end'` </li>
   *    <li> `'remove_col'` </li>
   * </ul>
   * @param {number|number[]} [index] A visual index of the row/column before or after which the new row/column will be
   *                                inserted or removed. Can also be an array of arrays, in format `[[index, amount],...]`.
   * @param {number} [amount] The amount of rows or columns to be inserted or removed (default: `1`).
   * @param {string} [source] Source indicator.
   * @param {boolean} [keepEmptyRows] If set to `true`: prevents removing empty rows.
   * @example
   * ```js
   * // above row 10 (by visual index), insert 1 new row
   * hot.alter('insert_row_above', 10);
   *
   * // below row 10 (by visual index), insert 3 new rows
   * hot.alter('insert_row_below', 10, 3);
   *
   * // in the LTR layout direction: to the left of column 10 (by visual index), insert 3 new columns
   * // in the RTL layout direction: to the right of column 10 (by visual index), insert 3 new columns
   * hot.alter('insert_col_start', 10, 3);
   *
   * // in the LTR layout direction: to the right of column 10 (by visual index), insert 1 new column
   * // in the RTL layout direction: to the left of column 10 (by visual index), insert 1 new column
   * hot.alter('insert_col_end', 10);
   *
   * // remove 2 rows, starting from row 10 (by visual index)
   * hot.alter('remove_row', 10, 2);
   *
   * // remove 3 rows, starting from row 1 (by visual index)
   * // remove 2 rows, starting from row 5 (by visual index)
   * hot.alter('remove_row', [[1, 3], [5, 2]]);
   * ```
   */
  alter(action: string, index?: number | number[], amount: number = 1, source?: string, keepEmptyRows?: boolean) {
    grid.alter(action, index, amount, source, keepEmptyRows);
  }

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
  getCell(row: number, column: number, topmost = false): HTMLTableCellElement | null {
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

    if (
      renderableRowIndex === null ||
      renderableColumnIndex === null ||
      renderableRowIndex === undefined ||
      renderableColumnIndex === undefined
    ) {
      return null;
    }

    return this.view
      .getCellAtCoords(this._createCellCoords(renderableRowIndex, renderableColumnIndex), topmost);
  }

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
  getCoords(element: HTMLTableCellElement): CellCoords | null {
    const renderableCoords = this.view._wt.wtTable.getCoords(element);

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

    return this._createCellCoords(visualRow, visualColumn);
  }

  /**
   * Returns the property name that corresponds with the given column index.
   * If the data source is an array of arrays, it returns the columns index.
   *
   * @memberof Core#
   * @function colToProp
   * @param {number} column Visual column index.
   * @returns {string|number} Column property or physical column index.
   */
  colToProp(column: number): string | number {
    return datamap.colToProp(column);
  }

  /**
   * Returns column index that corresponds with the given property.
   *
   * @memberof Core#
   * @function propToCol
   * @param {string|number} prop Property name or physical column index.
   * @returns {number} Visual column index.
   */
  propToCol(prop: string | number): number {
    return datamap.propToCol(prop);
  }

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
  toVisualRow(row: number): number {
    return this.rowIndexMapper.getVisualFromPhysicalIndex(row);
  }

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
  toVisualColumn(column: number): number {
    return this.columnIndexMapper.getVisualFromPhysicalIndex(column);
  }

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
  toPhysicalRow(row: number): number {
    return this.rowIndexMapper.getPhysicalFromVisualIndex(row);
  }

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
  toPhysicalColumn(column: number): number {
    return this.columnIndexMapper.getPhysicalFromVisualIndex(column);
  }

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
  getDataAtCell(row: number, column: number): any {
    return datamap.get(row, datamap.colToProp(column));
  }

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
  getDataAtRowProp(row: number, prop: string): any {
    return datamap.get(row, prop);
  }

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
  getDataAtCol(column: number): any[] {
    const columnData: any[] = [];
    const dataByRows = datamap.getRange(
      this._createCellCoords(0, column),
      this._createCellCoords(tableMeta.data.length - 1, column),
      datamap.DESTINATION_RENDERER
    );

    for (let i = 0; i < dataByRows.length; i += 1) {
      for (let j = 0; j < dataByRows[i].length; j += 1) {
        columnData.push(dataByRows[i][j]);
      }
    }

    return columnData;
  }

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
  getDataAtProp(prop: string | number): any[] {
    const columnData: any[] = [];
    const dataByRows = datamap.getRange(
      this._createCellCoords(0, datamap.propToCol(prop)),
      this._createCellCoords(tableMeta.data.length - 1, datamap.propToCol(prop)),
      datamap.DESTINATION_RENDERER);

    for (let i = 0; i < dataByRows.length; i += 1) {
      for (let j = 0; j < dataByRows[i].length; j += 1) {
        columnData.push(dataByRows[i][j]);
      }
    }

    return columnData;
  }

  /**
   * Returns a clone of the source data object.
   * Optionally you can provide a cell range by using the `row`, `column`, `row2`, `column2` arguments, to get only a
   * fragment of the table data.
   *
   * __Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
   * sorted or trimmed only physical indexes are correct.
   *
   * __Note__: This method may return incorrect values for cells that contain
   * [formulas](@/guides/formulas/formula-calculation/formula-calculation.md). This is because `getSourceData()`
   * operates on source data ([physical indexes](@/api/indexMapper.md)),
   * whereas formulas operate on visual data (visual indexes).
   *
   * @memberof Core#
   * @function getSourceData
   * @param {number} [row] From physical row index.
   * @param {number} [column] From physical column index (or visual index, if data type is an array of objects).
   * @param {number} [row2] To physical row index.
   * @param {number} [column2] To physical column index (or visual index, if data type is an array of objects).
   * @returns {Array[]|object[]} The table data.
   */
  getSourceData(row?: number, column?: number, row2?: number, column2?: number): any[][] {
    let data: any[][];

    if (row === undefined) {
      data = dataSource.getData();
    } else {
      data = dataSource
        .getByRange(this._createCellCoords(row, column), this._createCellCoords(row2, column2));
    }

    return data;
  }

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
  getSourceDataArray(row?: number, column?: number, row2?: number, column2?: number): any[] {
    let data: any[][];

    if (row === undefined) {
      data = dataSource.getData(true);
    } else {
      data = dataSource
        .getByRange(this._createCellCoords(row, column), this._createCellCoords(row2, column2), true);
    }

    return data;
  }

  /**
   * Returns an array of column values from the data source.
   *
   * @memberof Core#
   * @function getSourceDataAtCol
   * @param {number} column Visual column index.
   * @returns {Array} Array of the column's cell values.
   */
  // TODO: Getting data from `sourceData` should work always on physical indexes.
  getSourceDataAtCol(column: number): any[] {
    return dataSource.getAtColumn(column);
  }

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
  setSourceDataAtCell(row: number | any[][], column: number | string, value: any, source: string) {
    const input = setDataInputToArray(row, column, value);
    const isThereAnySetSourceListener = this.hasHook('afterSetSourceDataAtCell');
    const changesForHook: any[][] = [];

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

    const activeEditor = this.getActiveEditor();

    if (activeEditor && isDefined(activeEditor.refreshValue)) {
      activeEditor.refreshValue();
    }
  }

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
  getSourceDataAtRow(row: number): any {
    return dataSource.getAtRow(row);
  }

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
  getSourceDataAtCell(row: number, column: number): any {
    return dataSource.getAtCell(row, column);
  }

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
  getDataAtRow(row: number): any[] {
    const data = datamap.getRange(
      this._createCellCoords(row, 0),
      this._createCellCoords(row, this.countCols() - 1),
      datamap.DESTINATION_RENDERER
    );

    return data[0] || [];
  }

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
  getDataType(rowFrom: number, columnFrom: number, rowTo: number, columnTo: number): string {
    const coords = rowFrom === undefined ?
      [0, 0, this.countRows(), this.countCols()] : [rowFrom, columnFrom, rowTo, columnTo];
    const [rowStart, columnStart] = coords;
    let [,, rowEnd, columnEnd] = coords;
    let previousType = null;
    let currentType = null;

    if (rowEnd === undefined) {
      rowEnd = rowStart;
    }
    if (columnEnd === undefined) {
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
  }

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
  removeCellMeta(row: number, column: number, key: string) {
    const [physicalRow, physicalColumn] = [this.toPhysicalRow(row), this.toPhysicalColumn(column)];
    let cachedValue = metaManager.getCellMetaKeyValue(physicalRow, physicalColumn, key);

    const hookResult = this.runHooks('beforeRemoveCellMeta', row, column, key, cachedValue);

    if (hookResult !== false) {
      metaManager.removeCellMeta(physicalRow, physicalColumn, key);

      this.runHooks('afterRemoveCellMeta', row, column, key, cachedValue);
    }

    cachedValue = null;
  }

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
  spliceCellsMeta(visualIndex: number, deleteAmount = 0, ...cellMetaRows: any[]) {
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

    this.render();
  }

  /**
   * Set cell meta data object defined by `prop` to the corresponding params `row` and `column`.
   *
   * @memberof Core#
   * @function setCellMetaObject
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} prop Meta object.
   */
  setCellMetaObject(row: number, column: number, prop: any) {
    if (typeof prop === 'object') {
      objectEach(prop, (value, key) => {
        this.setCellMeta(row, column, key, value);
      });
    }
  }

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
  setCellMeta(row: number, column: number, key: string, value: string) {
    const allowSetCellMeta = this.runHooks('beforeSetCellMeta', row, column, key, value);

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

    this.runHooks('afterSetCellMeta', row, column, key, value);
  }

  /**
   * Get all the cells meta settings at least once generated in the table (in order of cell initialization).
   *
   * @memberof Core#
   * @function getCellsMeta
   * @returns {Array} Returns an array of ColumnSettings object instances.
   */
  getCellsMeta(): any[] {
    return metaManager.getCellsMeta();
  }

  /**
   * Returns the cell properties object for the given `row` and `column` coordinates.
   *
   * @memberof Core#
   * @function getCellMeta
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} options Execution options for the `getCellMeta` method.
   * @param {boolean} [options.skipMetaExtension=false] If `true`, skips extending the cell meta object. This means, the `cells` function, as well as the `afterGetCellMeta` and `beforeGetCellMeta` hooks, will not be called.
   * @returns {object} The cell properties object.
   * @fires Hooks#beforeGetCellMeta
   * @fires Hooks#afterGetCellMeta
   */
  getCellMeta(row: number, column: number, options = { skipMetaExtension: false }): any {
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
      ...options
    });
  }

  /**
   * Returns the meta information for the provided column.
   *
   * @since 14.5.0
   * @memberof Core#
   * @function getColumnMeta
   * @param {number} column Visual column index.
   * @returns {object}
   */
  getColumnMeta(column: number): any {
    return metaManager.getColumnMeta(this.toPhysicalColumn(column));
  }

  /**
   * Returns an array of cell meta objects for specified physical row index.
   *
   * @memberof Core#
   * @function getCellMetaAtRow
   * @param {number} row Physical row index.
   * @returns {Array}
   */
  getCellMetaAtRow(row: number): any[] {
    return metaManager.getCellsMetaAtRow(row);
  }

  /**
   * Checks if your [data format](@/guides/getting-started/binding-to-data/binding-to-data.md#compatible-data-types)
   * and [configuration options](@/guides/getting-started/configuration-options/configuration-options.md)
   * allow for changing the number of columns.
   *
   * Returns `false` when your data is an array of objects,
   * or when you use the [`columns`](@/api/options.md#columns) option.
   * Otherwise, returns `true`.
   *
   * @memberof Core#
   * @function isColumnModificationAllowed
   * @returns {boolean}
   */
  isColumnModificationAllowed(): boolean {
    return !(this.dataType === 'object' || tableMeta.columns);
  }

  /**
   * Returns the cell renderer function by given `row` and `column` arguments.
   *
   * @memberof Core#
   * @function getCellRenderer
   * @param {number|object} rowOrMeta Visual row index or cell meta object (see {@link Core#getCellMeta}).
   * @param {number} column Visual column index.
   * @returns {Function} Returns the renderer function.
   * @example
   * ```js
   * // Get cell renderer using `row` and `column` coordinates.
   * hot.getCellRenderer(1, 1);
   * // Get cell renderer using cell meta object.
   * hot.getCellRenderer(hot.getCellMeta(1, 1));
   * ```
   */
  getCellRenderer(rowOrMeta: number | any, column: number): Function {
    const cellRenderer = typeof rowOrMeta === 'number' ?
      this.getCellMeta(rowOrMeta, column).renderer : rowOrMeta.renderer;

    if (typeof cellRenderer === 'string') {
      return getRenderer(cellRenderer);
    }

    return isUndefined(cellRenderer) ? getRenderer('text') : cellRenderer;
  }

  /**
   * Returns the cell editor class by the provided `row` and `column` arguments.
   *
   * @memberof Core#
   * @function getCellEditor
   * @param {number} rowOrMeta Visual row index or cell meta object (see {@link Core#getCellMeta}).
   * @param {number} column Visual column index.
   * @returns {Function|boolean} Returns the editor class or `false` is cell editor is disabled.
   * @example
   * ```js
   * // Get cell editor class using `row` and `column` coordinates.
   * hot.getCellEditor(1, 1);
   * // Get cell editor class using cell meta object.
   * hot.getCellEditor(hot.getCellMeta(1, 1));
   * ```
   */
  getCellEditor(rowOrMeta: number | any, column: number): Function | boolean {
    const cellEditor = typeof rowOrMeta === 'number' ?
      this.getCellMeta(rowOrMeta, column).editor : rowOrMeta.editor;

    if (typeof cellEditor === 'string') {
      return getEditor(cellEditor);
    }

    return isUndefined(cellEditor) ? getEditor('text') : cellEditor;
  }

  /**
   * Returns the cell validator by `row` and `column`.
   *
   * @memberof Core#
   * @function getCellValidator
   * @param {number|object} rowOrMeta Visual row index or cell meta object (see {@link Core#getCellMeta}).
   * @param {number} column Visual column index.
   * @returns {Function|RegExp|undefined} The validator function.
   * @example
   * ```js
   * // Get cell validator using `row` and `column` coordinates.
   * hot.getCellValidator(1, 1);
   * // Get cell validator using cell meta object.
   * hot.getCellValidator(hot.getCellMeta(1, 1));
   * ```
   */
  getCellValidator(rowOrMeta: number | any, column: number): Function | RegExp | undefined {
    const cellValidator = typeof rowOrMeta === 'number' ?
      this.getCellMeta(rowOrMeta, column).validator : rowOrMeta.validator;

    if (typeof cellValidator === 'string') {
      return getValidator(cellValidator);
    }

    return cellValidator;
  }

  /**
   * Validates every cell in the data set,
   * using a [validator function](@/guides/cell-functions/cell-validator/cell-validator.md) configured for each cell.
   *
   * Doesn't validate cells that are currently [trimmed](@/guides/rows/row-trimming/row-trimming.md),
   * [hidden](@/guides/rows/row-hiding/row-hiding.md), or [filtered](@/guides/columns/column-filter/column-filter.md),
   * as such cells are not included in the data set until you bring them back again.
   *
   * After the validation, the `callback` function is fired, with the `valid` argument set to:
   * - `true` for valid cells
   * - `false` for invalid cells
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
  validateCells(callback: Function) {
    this._validateCells(callback);
  }

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
  validateRows(rows: number[], callback: Function) {
    if (!Array.isArray(rows)) {
      throw new Error('validateRows parameter `rows` must be an array');
    }
    this._validateCells(callback, rows);
  }

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
  validateColumns(columns: number[], callback: Function) {
    if (!Array.isArray(columns)) {
      throw new Error('validateColumns parameter `columns` must be an array');
    }
    this._validateCells(callback, undefined, columns);
  }

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
  _validateCells(callback: Function, rows?: number[], columns?: number[]) {
    const waitingForValidator = new ValidatorsQueue();

    if (callback) {
      waitingForValidator.onQueueEmpty = callback;
    }

    let i = this.countRows() - 1;

    while (i >= 0) {
      if (rows !== undefined && rows.indexOf(i) === -1) {
        i -= 1;
        continue;
      }
      let j = this.countCols() - 1;

      while (j >= 0) {
        if (columns !== undefined && columns.indexOf(j) === -1) {
          j -= 1;
          continue;
        }
        waitingForValidator.addValidatorToQueue();

        this.validateCell(this.getDataAtCell(i, j), this.getCellMeta(i, j), (result) => {
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
  }

  /**
   * Returns an array of row headers' values (if they are enabled). If param `row` was given, it returns the header of the given row as a string.
   *
   * @memberof Core#
   * @function getRowHeader
   * @param {number} [row] Visual row index.
   * @fires Hooks#modifyRowHeader
   * @returns {Array|string|number} Array of header values / single header value.
   */
  getRowHeader(row: number): Array<string | number> | string | number {
    let rowHeader = tableMeta.rowHeaders;
    let physicalRow = row;

    if (physicalRow !== undefined) {
      physicalRow = this.runHooks('modifyRowHeader', physicalRow);
    }

    if (physicalRow === undefined) {
      rowHeader = [];
      rangeEach(this.countRows() - 1, (i) => {
        rowHeader.push(this.getRowHeader(i));
      });

    } else if (Array.isArray(rowHeader) && rowHeader[physicalRow] !== undefined) {
      rowHeader = rowHeader[physicalRow];

    } else if (isFunction(rowHeader)) {
      rowHeader = rowHeader(physicalRow);

    } else if (rowHeader && typeof rowHeader !== 'string' && typeof rowHeader !== 'number') {
      rowHeader = physicalRow + 1;
    }

    return rowHeader;
  }

  /**
   * Returns information about if this table is configured to display row headers.
   *
   * @memberof Core#
   * @function hasRowHeaders
   * @returns {boolean} `true` if the instance has the row headers enabled, `false` otherwise.
   */
  hasRowHeaders(): boolean {
    return !!tableMeta.rowHeaders;
  }

  /**
   * Returns information about if this table is configured to display column headers.
   *
   * @memberof Core#
   * @function hasColHeaders
   * @returns {boolean} `true` if the instance has the column headers enabled, `false` otherwise.
   */
  hasColHeaders(): boolean {
    if (tableMeta.colHeaders !== undefined && tableMeta.colHeaders !== null) { // Polymer has empty value = null
      return !!tableMeta.colHeaders;
    }
    for (let i = 0, ilen = this.countCols(); i < ilen; i++) {
      if (this.getColHeader(i)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Gets the values of column headers (if column headers are [enabled](@/api/options.md#colheaders)).
   *
   * To get an array with the values of all
   * [bottom-most](@/guides/cell-features/clipboard/clipboard.md#copy-with-headers) column headers,
   * call `getColHeader()` with no arguments.
   *
   * To get the value of the bottom-most header of a specific column, use the `column` parameter.
   *
   * To get the value of a [specific-level](@/guides/columns/column-groups/column-groups.md) header
   * of a specific column, use the `column` and `headerLevel` parameters.
   *
   * Read more:
   * - [Guides: Column groups](@/guides/columns/column-groups/column-groups.md)
   * - [Options: `colHeaders`](@/api/options.md#colheaders)
   * - [Guides: Copy with headers](@/guides/cell-features/clipboard/clipboard.md#copy-with-headers)
   *
   * ```js
   * // get the contents of all bottom-most column headers
   * hot.getColHeader();
   *
   * // get the contents of the bottom-most header of a specific column
   * hot.getColHeader(5);
   *
   * // get the contents of a specific column header at a specific level
   * hot.getColHeader(5, -2);
   * ```
   *
   * @memberof Core#
   * @function getColHeader
   * @param {number} [column] A visual column index.
   * @param {number} [headerLevel=-1] (Since 12.3.0) Header level index. Accepts positive (0 to n)
   *                                  and negative (-1 to -n) values. For positive values, 0 points to the
   *                                  topmost header. For negative values, -1 points to the bottom-most
   *                                  header (the header closest to the cells).
   * @fires Hooks#modifyColHeader
   * @fires Hooks#modifyColumnHeaderValue
   * @returns {Array|string|number} Column header values.
   */
  getColHeader(column: number, headerLevel = -1): Array<string | number> | string | number {
    const columnIndex = this.runHooks('modifyColHeader', column);

    if (columnIndex === undefined) {
      const out: Array<string | number> = [];
      const ilen = this.countCols();

      for (let i = 0; i < ilen; i++) {
        out.push(this.getColHeader(i));
      }

      return out;
    }

    let result = tableMeta.colHeaders;

    function translateVisualIndexToColumns(visualColumnIndex: number): number {
      const arr: number[] = [];
      const columnsLen = this.countCols();
      let index = 0;

      for (; index < columnsLen; index++) {
        if (isFunction(tableMeta.columns) && tableMeta.columns(index)) {
          arr.push(index);
        }
      }

      return arr[visualColumnIndex];
    };

    const physicalColumn = this.toPhysicalColumn(columnIndex);
    const prop = translateVisualIndexToColumns(physicalColumn);

    if (tableMeta.colHeaders === false) {
      result = null;

    } else if (tableMeta.columns && isFunction(tableMeta.columns) && tableMeta.columns(prop) &&
               tableMeta.columns(prop).title) {
      result = tableMeta.columns(prop).title;

    } else if (tableMeta.columns && tableMeta.columns[physicalColumn] &&
               tableMeta.columns[physicalColumn].title) {
      result = tableMeta.columns[physicalColumn].title;

    } else if (Array.isArray(tableMeta.colHeaders) && tableMeta.colHeaders[physicalColumn] !== undefined) {
      result = tableMeta.colHeaders[physicalColumn];

    } else if (isFunction(tableMeta.colHeaders)) {
      result = tableMeta.colHeaders(physicalColumn);

    } else if (tableMeta.colHeaders && typeof tableMeta.colHeaders !== 'string' &&
               typeof tableMeta.colHeaders !== 'number') {
      result = spreadsheetColumnLabel(columnIndex); // see #1458
    }

    result = this.runHooks('modifyColumnHeaderValue', result, column, headerLevel);

    return result;
  }

  /**
   * Return column width from settings (no guessing). Private use intended.
   *
   * @private
   * @memberof Core#
   * @function _getColWidthFromSettings
   * @param {number} col Visual col index.
   * @returns {number}
   */
  _getColWidthFromSettings(col: number): number {
    let width: number;

    // We currently don't support cell meta objects for headers (negative values)
    if (col >= 0) {
      const cellProperties = this.getCellMeta(0, col);

      width = cellProperties.width;
    }

    if (width === undefined || width === tableMeta.width) {
      width = tableMeta.colWidths;
    }

    if (width !== undefined && width !== null) {
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
  }

  /**
   * Returns the width of the requested column.
   *
   * @memberof Core#
   * @function getColWidth
   * @param {number} column Visual column index.
   * @param {string} [source] The source of the call.
   * @returns {number} Column width.
   * @fires Hooks#modifyColWidth
   */
  getColWidth(column: number, source?: string): number {
    let width = this._getColWidthFromSettings(column);

    width = this.runHooks('modifyColWidth', width, column, source);

    if (width === undefined) {
      width = DEFAULT_COLUMN_WIDTH;
    }

    return width;
  }

  /**
   * Return row height from settings (no guessing). Private use intended.
   *
   * @private
   * @memberof Core#
   * @function _getRowHeightFromSettings
   * @param {number} row Visual row index.
   * @returns {number}
   */
  _getRowHeightFromSettings(row: number): number {
    const defaultRowHeight = this.view.getDefaultRowHeight();
    let height = tableMeta.rowHeights;

    if (height !== undefined && height !== null) {
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

    return (height !== undefined && height !== null && height < defaultRowHeight) ? defaultRowHeight : height;
  }

  /**
   * Returns a row's height, as recognized by Handsontable.
   *
   * Depending on your configuration, the method returns (in order of priority):
   *   1. The row height set by the [`ManualRowResize`](@/api/manualRowResize.md) plugin
   *     (if the plugin is enabled).
   *   2. The row height set by the [`rowHeights`](@/api/options.md#rowheights) configuration option
   *     (if the option is set).
   *   3. The row height as measured in the DOM by the [`AutoRowSize`](@/api/autoRowSize.md) plugin
   *     (if the plugin is enabled).
   *   4. `undefined`, if neither [`ManualRowResize`](@/api/manualRowResize.md),
   *     nor [`rowHeights`](@/api/options.md#rowheights),
   *     nor [`AutoRowSize`](@/api/autoRowSize.md) is used.
   *
   * The height returned includes 1 px of the row's bottom border.
   *
   * Mind that this method is different from the
   * [`getRowHeight()`](@/api/autoRowSize.md#getrowheight) method
   * of the [`AutoRowSize`](@/api/autoRowSize.md) plugin.
   *
   * @memberof Core#
   * @function getRowHeight
   * @param {number} row A visual row index.
   * @param {string} [source] The source of the call.
   * @returns {number|undefined} The height of the specified row, in pixels.
   * @fires Hooks#modifyRowHeight
   */
  getRowHeight(row: number, source?: string): number | undefined {
    let height = this._getRowHeightFromSettings(row);

    height = this.runHooks('modifyRowHeight', height, row, source);

    return height;
  }

  /**
   * Returns the total number of rows in the data source.
   *
   * @memberof Core#
   * @function countSourceRows
   * @returns {number} Total number of rows.
   */
  countSourceRows(): number {
    return dataSource.countRows();
  }

  /**
   * Returns the total number of columns in the data source.
   *
   * @memberof Core#
   * @function countSourceCols
   * @returns {number} Total number of columns.
   */
  countSourceCols(): number {
    return dataSource.countFirstRowKeys();
  }

  /**
   * Returns the total number of visual rows in the table.
   *
   * @memberof Core#
   * @function countRows
   * @returns {number} Total number of rows.
   */
  countRows(): number {
    return datamap.getLength();
  }

  /**
   * Returns the total number of visible columns in the table.
   *
   * @memberof Core#
   * @function countCols
   * @returns {number} Total number of columns.
   */
  countCols(): number {
    const maxCols = tableMeta.maxCols;
    const dataLen = this.columnIndexMapper.getNotTrimmedIndexesLength();

    return Math.min(maxCols, dataLen);
  }

  /**
   * Returns the number of rendered rows including rows that are partially or fully rendered
   * outside the table viewport.
   *
   * @memberof Core#
   * @function countRenderedRows
   * @returns {number} Returns -1 if table is not visible.
   */
  countRenderedRows(): number {
    return this.view._wt.drawn ? this.view._wt.wtTable.getRenderedRowsCount() : -1;
  }

  /**
   * Returns the number of rendered rows that are only visible in the table viewport.
   * The rows that are partially visible are not counted.
   *
   * @memberof Core#
   * @function countVisibleRows
   * @returns {number} Number of visible rows or -1.
   */
  countVisibleRows(): number {
    return this.view._wt.drawn ? this.view._wt.wtTable.getVisibleRowsCount() : -1;
  }

  /**
   * Returns the number of rendered rows including columns that are partially or fully rendered
   * outside the table viewport.
   *
   * @memberof Core#
   * @function countRenderedCols
   * @returns {number} Returns -1 if table is not visible.
   */
  countRenderedCols(): number {
    return this.view._wt.drawn ? this.view._wt.wtTable.getRenderedColumnsCount() : -1;
  }

  /**
   * Returns the number of rendered columns that are only visible in the table viewport.
   * The columns that are partially visible are not counted.
   *
   * @memberof Core#
   * @function countVisibleCols
   * @returns {number} Number of visible columns or -1.
   */
  countVisibleCols(): number {
    return this.view._wt.drawn ? this.view._wt.wtTable.getVisibleColumnsCount() : -1;
  }

  /**
   * Returns the number of rendered row headers.
   *
   * @since 14.0.0
   * @memberof Core#
   * @function countRowHeaders
   * @returns {number} Number of row headers.
   */
  countRowHeaders(): number {
    return this.view.getRowHeadersCount();
  }

  /**
   * Returns the number of rendered column headers.
   *
   * @since 14.0.0
   * @memberof Core#
   * @function countColHeaders
   * @returns {number} Number of column headers.
   */
  countColHeaders(): number {
    return this.view.getColumnHeadersCount();
  }

  /**
   * Returns the number of empty rows. If the optional ending parameter is `true`, returns the
   * number of empty rows at the bottom of the table.
   *
   * @memberof Core#
   * @function countEmptyRows
   * @param {boolean} [ending=false] If `true`, will only count empty rows at the end of the data source.
   * @returns {number} Count empty rows.
   */
  countEmptyRows(ending = false): number {
    let emptyRows = 0;

    rangeEachReverse(this.countRows() - 1, (visualIndex) => {
      if (this.isEmptyRow(visualIndex)) {
        emptyRows += 1;

      } else if (ending === true) {
        return false;
      }
    });

    return emptyRows;
  }

  /**
   * Returns the number of empty columns. If the optional ending parameter is `true`, returns the number of empty
   * columns at right hand edge of the table.
   *
   * @memberof Core#
   * @function countEmptyCols
   * @param {boolean} [ending=false] If `true`, will only count empty columns at the end of the data source row.
   * @returns {number} Count empty cols.
   */
  countEmptyCols(ending = false): number {
    let emptyColumns = 0;

    rangeEachReverse(this.countCols() - 1, (visualIndex) => {
      if (this.isEmptyCol(visualIndex)) {
        emptyColumns += 1;

      } else if (ending === true) {
        return false;
      }
    });

    return emptyColumns;
  }

  /**
   * Check if all cells in the row declared by the `row` argument are empty.
   *
   * @memberof Core#
   * @function isEmptyRow
   * @param {number} row Visual row index.
   * @returns {boolean} `true` if the row at the given `row` is empty, `false` otherwise.
   */
  isEmptyRow(row: number): boolean {
    return tableMeta.isEmptyRow.call(this, row);
  }

  /**
   * Check if all cells in the the column declared by the `column` argument are empty.
   *
   * @memberof Core#
   * @function isEmptyCol
   * @param {number} column Column index.
   * @returns {boolean} `true` if the column at the given `col` is empty, `false` otherwise.
   */
  isEmptyCol(column: number): boolean {
    return tableMeta.isEmptyCol.call(this, column);
  }

  /**
   * Select a single cell, or a single range of adjacent cells.
   *
   * To select a cell, pass its visual row and column indexes, for example: `selectCell(2, 4)`.
   *
   * To select a range, pass the visual indexes of the first and last cell in the range, for example: `selectCell(2, 4, 3, 5)`.
   *
   * If your columns have properties, you can pass those properties' values instead of column indexes, for example: `selectCell(2, 'first_name')`.
   *
   * By default, `selectCell()` also:
   *  - Scrolls the viewport to the newly-selected cells.
   *  - Switches the keyboard focus to Handsontable (by calling Handsontable's [`listen()`](#listen) method).
   *
   * @example
   * ```js
   * // select a single cell
   * hot.selectCell(2, 4);
   *
   * // select a range of cells
   * hot.selectCell(2, 4, 3, 5);
   *
   * // select a single cell, using a column property
   * hot.selectCell(2, 'first_name');
   *
   * // select a range of cells, using column properties
   * hot.selectCell(2, 'first_name', 3, 'last_name');
   *
   * // select a range of cells, without scrolling to them
   * hot.selectCell(2, 4, 3, 5, false);
   *
   * // select a range of cells, without switching the keyboard focus to Handsontable
   * hot.selectCell(2, 4, 3, 5, null, false);
   * ```
   *
   * @memberof Core#
   * @function selectCell
   * @param {number} row A visual row index.
   * @param {number|string} column A visual column index (`number`), or a column property's value (`string`).
   * @param {number} [endRow] If selecting a range: the visual row index of the last cell in the range.
   * @param {number|string} [endColumn] If selecting a range: the visual column index (or a column property's value) of the last cell in the range.
   * @param {boolean} [scrollToCell=true] `true`: scroll the viewport to the newly-selected cells. `false`: keep the previous viewport.
   * @param {boolean} [changeListener=true] `true`: switch the keyboard focus to Handsontable. `false`: keep the previous keyboard focus.
   * @returns {boolean} `true`: the selection was successful, `false`: the selection failed.
   */
  selectCell(row: number, column: number, endRow?: number, endColumn?: number, scrollToCell = true, changeListener = true): boolean {
    if (isUndefined(row) || isUndefined(column)) {
      return false;
    }

    return this.selectCells([[row, column, endRow, endColumn]], scrollToCell, changeListener);
  }

  /**
   * Select multiple cells or ranges of cells, adjacent or non-adjacent.
   *
   * You can pass one of the below:
   * - An array of arrays (which matches the output of Handsontable's [`getSelected()`](#getselected) method).
   * - An array of [`CellRange`](@/api/cellRange.md) objects (which matches the output of Handsontable's [`getSelectedRange()`](#getselectedrange) method).
   *
   * To select multiple cells, pass the visual row and column indexes of each cell, for example: `hot.selectCells([[1, 1], [5, 5]])`.
   *
   * To select multiple ranges, pass the visual indexes of the first and last cell in each range, for example: `hot.selectCells([[1, 1, 2, 2], [6, 2, 0, 2]])`.
   *
   * If your columns have properties, you can pass those properties' values instead of column indexes, for example: `hot.selectCells([[1, 'first_name'], [5, 'last_name']])`.
   *
   * By default, `selectCell()` also:
   *  - Scrolls the viewport to the newly-selected cells.
   *  - Switches the keyboard focus to Handsontable (by calling Handsontable's [`listen()`](#listen) method).
   *
   * @example
   * ```js
   * // select non-adjacent cells
   * hot.selectCells([[1, 1], [5, 5], [10, 10]]);
   *
   * // select non-adjacent ranges of cells
   * hot.selectCells([[1, 1, 2, 2], [10, 10, 20, 20]]);
   *
   * // select cells and ranges of cells
   * hot.selectCells([[1, 1, 2, 2], [3, 3], [6, 2, 0, 2]]);
   *
   * // select cells, using column properties
   * hot.selectCells([[1, 'id', 2, 'first_name'], [3, 'full_name'], [6, 'last_name', 0, 'first_name']]);
   *
   * // select multiple ranges, using an array of `CellRange` objects
   * const selected = hot.getSelectedRange();
   *
   * selected[0].from.row = 0;
   * selected[0].from.col = 0;
   * selected[0].to.row = 5;
   * selected[0].to.col = 5;
   *
   * selected[1].from.row = 10;
   * selected[1].from.col = 10;
   * selected[1].to.row = 20;
   * selected[1].to.col = 20;
   *
   * hot.selectCells(selected);
   * ```
   *
   * @memberof Core#
   * @since 0.38.0
   * @function selectCells
   * @param {Array[]|CellRange[]} coords Visual coordinates,
   * passed either as an array of arrays (`[[rowStart, columnStart, rowEnd, columnEnd], ...]`)
   * or as an array of [`CellRange`](@/api/cellRange.md) objects.
   * @param {boolean} [scrollToCell=true] `true`: scroll the viewport to the newly-selected cells. `false`: keep the previous viewport.
   * @param {boolean} [changeListener=true] `true`: switch the keyboard focus to Handsontable. `false`: keep the previous keyboard focus.
   * @returns {boolean} `true`: the selection was successful, `false`: the selection failed.
   */
  selectCells(coords = [[]], scrollToCell = true, changeListener = true): boolean {
    if (scrollToCell === false) {
      viewportScroller.suspend();
    }

    const wasSelected = selection.selectCells(coords);

    if (wasSelected && changeListener) {
      this.listen();
    }
    viewportScroller.resume();

    return wasSelected;
  }

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
   * // Select range of columns using visual indexes and mark the first header as highlighted.
   * hot.selectColumns(1, 2, -1);
   * // Select range of columns using visual indexes and mark the second cell as highlighted.
   * hot.selectColumns(2, 1, 1);
   * // Select range of columns using visual indexes and move the focus position somewhere in the middle of the range.
   * hot.selectColumns(2, 5, { row: 2, col: 3 });
   * // Select range of columns using column properties.
   * hot.selectColumns('id', 'last_name');
   * ```
   *
   * @memberof Core#
   * @since 0.38.0
   * @function selectColumns
   * @param {number} startColumn The visual column index from which the selection starts.
   * @param {number} [endColumn=startColumn] The visual column index to which the selection finishes. If `endColumn`
   * is not defined the column defined by `startColumn` will be selected.
   * @param {number | { row: number, col: number } | CellCoords} [focusPosition=0] The argument allows changing the cell/header focus
   * position. The value can take visual row index from -N to N, where negative values point to the headers and positive
   * values point to the cell range. An object with `row` and `col` properties also can be passed to change the focus
   * position horizontally.
   * @returns {boolean} `true` if selection was successful, `false` otherwise.
   */
  selectColumns(startColumn: number, endColumn = startColumn, focusPosition?: number | { row: number, col: number } | CellCoords): boolean {
    return selection.selectColumns(startColumn, endColumn, focusPosition);
  }

  /**
   * Select row specified by `startRow` visual index or a range of rows finishing at `endRow`.
   *
   * @example
   * ```js
   * // Select row using visual index.
   * hot.selectRows(1);
   * // select a range of rows, using visual indexes.
   * hot.selectRows(1, 4);
   * // select a range of rows, using visual indexes, and mark the header as highlighted.
   * hot.selectRows(1, 2, -1);
   * // Select range of rows using visual indexes and mark the second cell as highlighted.
   * hot.selectRows(2, 1, 1);
   * // Select range of rows using visual indexes and move the focus position somewhere in the middle of the range.
   * hot.selectRows(2, 5, { row: 2, col: 3 });
   * ```
   *
   * @memberof Core#
   * @since 0.38.0
   * @function selectRows
   * @param {number} startRow The visual row index from which the selection starts.
   * @param {number} [endRow=startRow] The visual row index to which the selection finishes. If `endRow`
   * is not defined the row defined by `startRow` will be selected.
   * @param {number | { row: number, col: number } | CellCoords} [focusPosition=0] The argument allows changing the cell/header focus
   * position. The value can take visual row index from -N to N, where negative values point to the headers and positive
   * values point to the cell range. An object with `row` and `col` properties also can be passed to change the focus
   * position vertically.
   * @returns {boolean} `true` if selection was successful, `false` otherwise.
   */
  selectRows(startRow: number, endRow = startRow, focusPosition?: number | { row: number, col: number } | CellCoords): boolean {
    return selection.selectRows(startRow, endRow, focusPosition);
  }

  /**
   * Deselects the current cell selection on the table.
   *
   * @memberof Core#
   * @function deselectCell
   */
  deselectCell() {
    selection.deselect();
  }

  /**
   * Select all cells in the table excluding headers and corner elements.
   *
   * The previous selection is overwritten.
   *
   * ```js
   * // Select all cells in the table along with row headers, including all headers and the corner cell.
   * // Doesn't select column headers and corner elements.
   * hot.selectAll();
   *
   * // Select all cells in the table, including row headers but excluding the corner cell and column headers.
   * hot.selectAll(true, false);
   *
   * // Select all cells in the table, including all headers and the corner cell, but move the focus.
   * // highlight to position 2, 1
   * hot.selectAll(-2, -1, {
   *    focusPosition: { row: 2, col: 1 }
   * });
   *
   * // Select all cells in the table, without headers and corner elements.
   * hot.selectAll(false);
   * ```
   *
   * @since 0.38.2
   * @memberof Core#
   * @function selectAll
   * @param {boolean} [includeRowHeaders=false] `true` If the selection should include the row headers,
   * `false` otherwise.
   * @param {boolean} [includeColumnHeaders=false] `true` If the selection should include the column
   * headers, `false` otherwise.
   *
   * @param {object} [options] Additional object with options. Since 14.0.0
   * @param {{row: number, col: number} | boolean} [options.focusPosition] The argument allows changing the cell/header
   * focus position. The value takes an object with a `row` and `col` properties from -N to N, where
   * negative values point to the headers and positive values point to the cell range. If `false`, the focus
   * position won't be changed. Example:
   * ```js
   * hot.selectAll(0, 0, {
   * focusPosition: { row: 0, col: 1 },
   * disableHeadersHighlight: true
   * })
   * ```
   *
   * @param {boolean} [options.disableHeadersHighlight] If `true`, disables highlighting the headers even when
   * the logical coordinates points on them.
   */
  selectAll(includeRowHeaders = true, includeColumnHeaders = includeRowHeaders, options?: any) {
    viewportScroller.skipNextScrollCycle();
    selection.selectAll(includeRowHeaders, includeColumnHeaders, options);
  }

  getIndexToScroll(indexMapper: IndexMapper, visualIndex: number) {
    // Looking for a visual index on the right and then (when not found) on the left.
    return indexMapper.getNearestNotHiddenIndex(visualIndex, 1, true);
  }

  /**
   * Scroll viewport to coordinates specified by the `row` and/or `col` object properties.
   *
   * ```js
   * // scroll the viewport to the visual row index (leave the horizontal scroll untouched)
   * hot.scrollViewportTo({ row: 50 });
   *
   * // scroll the viewport to the passed coordinates so that the cell at 50, 50 will be snapped to
   * // the bottom-end table's edge.
   * hot.scrollViewportTo({
   *   row: 50,
   *   col: 50,
   *   verticalSnap: 'bottom',
   *   horizontalSnap: 'end',
   * });
   * ```
   *
   * @memberof Core#
   * @function scrollViewportTo
   * @param {object} options A dictionary containing the following parameters:
   * @param {number} [options.row] Specifies the number of visual rows along the Y axis to scroll the viewport.
   * @param {number} [options.col] Specifies the number of visual columns along the X axis to scroll the viewport.
   * @param {'top' | 'bottom'} [options.verticalSnap] Determines to which edge of the table the viewport will be scrolled based on the passed coordinates.
   * This option is a string which must take one of the following values:
   * - `top`: The viewport will be scrolled to a row in such a way that it will be positioned on the top of the viewport;
   * - `bottom`: The viewport will be scrolled to a row in such a way that it will be positioned on the bottom of the viewport;
   * - If the property is not defined the vertical auto-snapping is enabled. Depending on where the viewport is scrolled from, a row will
   * be positioned at the top or bottom of the viewport.
   * @param {'start' | 'end'} [options.horizontalSnap] Determines to which edge of the table the viewport will be scrolled based on the passed coordinates.
   * This option is a string which must take one of the following values:
   * - `start`: The viewport will be scrolled to a column in such a way that it will be positioned on the start (left edge or right, if the layout direction is set to `rtl`) of the viewport;
   * - `end`: The viewport will be scrolled to a column in such a way that it will be positioned on the end (right edge or left, if the layout direction is set to `rtl`) of the viewport;
   * - If the property is not defined the horizontal auto-snapping is enabled. Depending on where the viewport is scrolled from, a column will
   * be positioned at the start or end of the viewport.
   * @param {boolean} [options.considerHiddenIndexes=true] If `true`, we handle visual indexes, otherwise we handle only indexes which
   * may be rendered when they are in the viewport (we don't consider hidden indexes as they aren't rendered).
   * @returns {boolean} `true` if viewport was scrolled, `false` otherwise.
   */
  scrollViewportTo(options: any): boolean {
    // Support for backward compatibility arguments: (row, col, snapToBottom, snapToRight, considerHiddenIndexes)
    if (typeof options === 'number') {
      /* eslint-disable prefer-rest-params */
      options = {
        row: arguments[0],
        col: arguments[1],
        verticalSnap: arguments[2] ? 'bottom' : 'top',
        horizontalSnap: arguments[3] ? 'end' : 'start',
        considerHiddenIndexes: arguments[4] ?? true,
      };
      /* eslint-enable prefer-rest-params */
    }

    const {
      row,
      col,
      considerHiddenIndexes
    } = options ?? {};

    let renderableRow = row;
    let renderableColumn = col;

    if (considerHiddenIndexes === undefined || considerHiddenIndexes) {
      const isValidRowGrid = Number.isInteger(row) && row >= 0;
      const isValidColumnGrid = Number.isInteger(col) && col >= 0;

      const visualRowToScroll = isValidRowGrid ? getIndexToScroll(this.rowIndexMapper, row) : undefined;
      const visualColumnToScroll = isValidColumnGrid ? getIndexToScroll(this.columnIndexMapper, col) : undefined;

      if (visualRowToScroll === null || visualColumnToScroll === null) {
        return false;
      }

      renderableRow = isValidRowGrid ?
        this.rowIndexMapper.getRenderableFromVisualIndex(visualRowToScroll) : row;
      renderableColumn = isValidColumnGrid ?
        this.columnIndexMapper.getRenderableFromVisualIndex(visualColumnToScroll) : col;
    }

    const isRowInteger = Number.isInteger(renderableRow);
    const isColumnInteger = Number.isInteger(renderableColumn);

    if (isRowInteger && renderableRow >= 0 && isColumnInteger && renderableColumn >= 0) {
      return this.view.scrollViewport(
        this._createCellCoords(renderableRow, renderableColumn),
        options.horizontalSnap,
        options.verticalSnap,
      );
    }

    if (isRowInteger && renderableRow >= 0 && (isColumnInteger && renderableColumn < 0 || !isColumnInteger)) {
      return this.view.scrollViewportVertically(renderableRow, options.verticalSnap);
    }

    if (isColumnInteger && renderableColumn >= 0 && (isRowInteger && renderableRow < 0 || !isRowInteger)) {
      return this.view.scrollViewportHorizontally(renderableColumn, options.horizontalSnap);
    }

    return false;
  }

  /**
   * Scrolls the viewport to coordinates specified by the currently focused cell.
   *
   * @since 14.0.0
   * @memberof Core#
   * @fires Hooks#afterScroll
   * @function scrollToFocusedCell
   * @param {Function} callback The callback function to call after the viewport is scrolled.
   */
  scrollToFocusedCell(callback = () => {}) {
    if (!this.selection.isSelected()) {
      return;
    }

    this.addHookOnce('afterScroll', callback);

    const { highlight } = this.getSelectedRangeLast();
    const isScrolled = this.scrollViewportTo(highlight.toObject());

    if (isScrolled) {
      this.view.render();
    } else {
      this.removeHook('afterScroll', callback);
      this._registerImmediate(() => callback());
    }
  }

  /**
   * Removes the table from the DOM and destroys the instance of the Handsontable.
   *
   * @memberof Core#
   * @function destroy
   * @fires Hooks#afterDestroy
   */
  destroy() {
    this._clearTimeouts();
    this._clearImmediates();

    if (this.view) { // in case HT is destroyed before initialization has finished
      this.view.destroy();
    }
    if (dataSource) {
      dataSource.destroy();
    }
    dataSource = null;

    this.getShortcutManager().destroy();
    metaManager.clearCache();
    foreignHotInstances.delete(this.guid);

    if (isRootInstance(this)) {
      const licenseInfo = this.rootDocument.querySelector('.hot-display-license-info');

      if (licenseInfo) {
        licenseInfo.parentNode.removeChild(licenseInfo);
      }
    }
    empty(this.rootElement);
    eventManager.destroy();

    if (editorManager) {
      editorManager.destroy();
    }

    // The plugin's `destroy` method is called as a consequence and it should handle
    // unregistration of plugin's maps. Some unregistered maps reset the cache.
    this.batchExecution(() => {
      this.rowIndexMapper.unregisterAll();
      this.columnIndexMapper.unregisterAll();

      pluginsRegistry
        .getItems()
        .forEach(([, plugin]) => {
          plugin.destroy();
        });
      pluginsRegistry.clear();
      this.runHooks('afterDestroy');
    }, true);

    Hooks.getSingleton().destroy(this);

    objectEach(this, (property, key, obj) => {
      // replace instance methods with post mortem
      if (isFunction(property)) {
        obj[key] = postMortem(key);

      } else if (key !== 'guid') {
        // replace instance properties with null (restores memory)
        // it should not be necessary but this prevents a memory leak side effects that show itself in Jasmine tests
        obj[key] = null;
      }
    });

    this.isDestroyed = true;

    // replace private properties with null (restores memory)
    // it should not be necessary but this prevents a memory leak side effects that show itself in Jasmine tests
    if (datamap) {
      datamap.destroy();
    }

    datamap = null;
    grid = null;
    selection = null;
    editorManager = null;
    this = null;
  }

  /**
   * Replacement for all methods after the Handsontable was destroyed.
   *
   * @private
   * @param {string} method The method name.
   * @returns {Function}
   */
  postMortem(method: string): Function {
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
  getActiveEditor(): BaseEditor {
    return this.editorManager.getActiveEditor();
  }

  /**
   * Returns the first rendered row in the DOM (usually, it is not visible in the table's viewport).
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getFirstRenderedVisibleRow
   * @returns {number | null}
   */
  getFirstRenderedVisibleRow(): number | null {
    return this.view.getFirstRenderedVisibleRow();
  }

  /**
   * Returns the last rendered row in the DOM (usually, it is not visible in the table's viewport).
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getLastRenderedVisibleRow
   * @returns {number | null}
   */
  getLastRenderedVisibleRow(): number | null {
    return this.view.getLastRenderedVisibleRow();
  }

  /**
   * Returns the first rendered column in the DOM (usually, it is not visible in the table's viewport).
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getFirstRenderedVisibleColumn
   * @returns {number | null}
   */
  getFirstRenderedVisibleColumn(): number | null {
    return this.view.getFirstRenderedVisibleColumn();
  }

  /**
   * Returns the last rendered column in the DOM (usually, it is not visible in the table's viewport).
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getLastRenderedVisibleColumn
   * @returns {number | null}
   */
  getLastRenderedVisibleColumn(): number | null {
    return this.view.getLastRenderedVisibleColumn();
  }

  /**
   * Returns the first fully visible row in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getFirstFullyVisibleRow
   * @returns {number | null}
   */
  getFirstFullyVisibleRow(): number | null {
    return this.view.getFirstFullyVisibleRow();
  }

  /**
   * Returns the last fully visible row in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getLastFullyVisibleRow
   * @returns {number | null}
   */
  getLastFullyVisibleRow(): number | null {
    return this.view.getLastFullyVisibleRow();
  }

  /**
   * Returns the first fully visible column in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getFirstFullyVisibleColumn
   * @returns {number | null}
   */
  getFirstFullyVisibleColumn(): number | null {
    return this.view.getFirstFullyVisibleColumn();
  }

  /**
   * Returns the last fully visible column in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getLastFullyVisibleColumn
   * @returns {number | null}
   */
  getLastFullyVisibleColumn(): number | null {
    return this.view.getLastFullyVisibleColumn();
  }

  /**
   * Returns the first partially visible row in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getFirstPartiallyVisibleRow
   * @returns {number | null}
   */
  getFirstPartiallyVisibleRow(): number | null {
    return this.view.getFirstPartiallyVisibleRow();
  }

  /**
   * Returns the last partially visible row in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getLastPartiallyVisibleRow
   * @returns {number | null}
   */
  getLastPartiallyVisibleRow(): number | null {
    return this.view.getLastPartiallyVisibleRow();
  }

  /**
   * Returns the first partially visible column in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getFirstPartiallyVisibleColumn
   * @returns {number | null}
   */
  getFirstPartiallyVisibleColumn(): number | null {
    return this.view.getFirstPartiallyVisibleColumn();
  }

  /**
   * Returns the last partially visible column in the table viewport. When the table has overlays the method returns
   * the first row of the main table that is not overlapped by overlay.
   *
   * @since 14.6.0
   * @memberof Core#
   * @function getLastPartiallyVisibleColumn
   * @returns {number | null}
   */
  getLastPartiallyVisibleColumn(): number | null {
    return this.view.getLastPartiallyVisibleColumn();
  }

  /**
   * Returns plugin instance by provided its name.
   *
   * @memberof Core#
   * @function getPlugin
   * @param {string} pluginName The plugin name.
   * @returns {BasePlugin|undefined} The plugin instance or undefined if there is no plugin.
   */
  getPlugin(pluginName: string): BasePlugin | undefined {
    return this.pluginsRegistry.getItem(toUpperCaseFirst(pluginName));
  }

  /**
   * Returns name of the passed plugin.
   *
   * @private
   * @memberof Core#
   * @param {BasePlugin} plugin The plugin instance.
   * @returns {string}
   */
  getPluginName(plugin: BasePlugin): string {
    // Workaround for the UndoRedo plugin which, currently doesn't follow the plugin architecture.
    if (plugin === this.undoRedo) {
      return this.undoRedo.constructor.PLUGIN_KEY;
    }

    return pluginsRegistry.getId(plugin);
  }

  /**
   * Returns the Handsontable instance.
   *
   * @memberof Core#
   * @function getInstance
   * @returns {HotInstance} The Handsontable instance.
   */
  getInstance(): HotInstance {
    return this;
  }

  /**
   * Adds listener to the specified hook name (only for this Handsontable instance).
   *
   * @memberof Core#
   * @function addHook
   * @see Hooks#add
   * @param {string} key Hook name (see {@link Hooks}).
   * @param {Function|Array} callback Function or array of functions.
   * @param {number} [orderIndex] Order index of the callback.
   *                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.
   *                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.
   *                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes.
   * @example
   * ```js
   * hot.addHook('beforeInit', myCallback);
   * ```
   */
  addHook(key: string, callback: Function | any[], orderIndex?: number) {
    Hooks.getSingleton().add(key, callback, this, orderIndex);
  }

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
  hasHook(key: string): boolean {
    return Hooks.getSingleton().has(key, this) || Hooks.getSingleton().has(key);
  }

  /**
   * Adds listener to specified hook name (only for this Handsontable instance). After the listener is triggered,
   * it will be automatically removed.
   *
   * @memberof Core#
   * @function addHookOnce
   * @see Hooks#once
   * @param {string} key Hook name (see {@link Hooks}).
   * @param {Function|Array} callback Function or array of functions.
   * @param {number} [orderIndex] Order index of the callback.
   *                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.
   *                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.
   *                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes.
   * @example
   * ```js
   * hot.addHookOnce('beforeInit', myCallback);
   * ```
   */
  addHookOnce(key: string, callback: Function | any[], orderIndex?: number) {
    Hooks.getSingleton().once(key, callback, this, orderIndex);
  }

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
  removeHook(key: string, callback: Function) {
    Hooks.getSingleton().remove(key, callback, this);
  }

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
  runHooks(key: string, p1?: any, p2?: any, p3?: any, p4?: any, p5?: any, p6?: any): any {
    return Hooks.getSingleton().run(this, key, p1, p2, p3, p4, p5, p6);
  }

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
  getTranslatedPhrase(dictionaryKey: string, extraArguments: any): string {
    return getTranslatedPhrase(tableMeta.language, dictionaryKey, extraArguments);
  }

  /**
   * Converts instance into outerHTML of HTMLTableElement.
   *
   * @memberof Core#
   * @function toHTML
   * @since 7.1.0
   * @returns {string}
   */
  toHTML(): string {
    return instanceToHTML(this);
  }

  /**
   * Converts instance into HTMLTableElement.
   *
   * @memberof Core#
   * @function toTableElement
   * @since 7.1.0
   * @returns {HTMLTableElement}
   */
  toTableElement(): HTMLTableElement {
    const tempElement = this.rootDocument.createElement('div');

    tempElement.insertAdjacentHTML('afterbegin', instanceToHTML(this));

    return tempElement.firstElementChild as HTMLTableElement;
  }

  timeouts = [];

  /**
   * Use the theme specified by the provided name.
   *
   * @memberof Core#
   * @function useTheme
   * @since 15.0.0
   * @param {string|boolean|undefined} themeName The name of the theme to use.
   */
  useTheme(themeName: string | boolean | undefined): void {
    this.view.getStylesHandler().useTheme(themeName);

    this.runHooks('afterSetTheme', themeName, !!firstRun);
  }

  /**
   * Gets the name of the currently used theme.
   *
   * @memberof Core#
   * @function getCurrentThemeName
   * @since 15.0.0
   * @returns {string|undefined} The name of the currently used theme.
   */
  getCurrentThemeName(): string | undefined {
    return this.view.getStylesHandler().getThemeName();
  }

  /**
   * Sets timeout. Purpose of this method is to clear all known timeouts when `destroy` method is called.
   *
   * @param {number|Function} handle Handler returned from setTimeout or function to execute (it will be automatically wraped
   *                                 by setTimeout function).
   * @param {number} [delay=0] If first argument is passed as a function this argument set delay of the execution of that function.
   * @private
   */
  _registerTimeout(handle: number | Function, delay: number = 0): void {
    let handleFunc = handle;

    if (typeof handleFunc === 'function') {
      handleFunc = setTimeout(handleFunc, delay);
    }

    this.timeouts.push(handleFunc);
  }

  /**
   * Clears all known timeouts.
   *
   * @private
   */
  _clearTimeouts(): void {
    arrayEach(this.timeouts, (handler) => {
      clearTimeout(handler);
    });
  }

  immediates: any[] = [];

  /**
   * Execute function execution to the next event loop cycle. Purpose of this method is to clear all known timeouts when `destroy` method is called.
   *
   * @param {Function} callback Function to be delayed in execution.
   * @private
   */
  _registerImmediate(callback: Function): void {
    this.immediates.push(setImmediate(callback));
  }

  /**
   * Clears all known timeouts.
   *
   * @private
   */
  _clearImmediates(): void {
    arrayEach(this.immediates, (handler) => {
      clearImmediate(handler);
    });
  }

  /**
   * Gets the instance of the EditorManager.
   *
   * @private
   * @returns {EditorManager}
   */
  _getEditorManager(): EditorManager {
    return editorManager;
  }

  /**
   * Returns instance of a manager responsible for handling shortcuts stored in some contexts. It run actions after
   * pressing key combination in active Handsontable instance.
   *
   * @memberof Core#
   * @since 12.0.0
   * @function getShortcutManager
   * @returns {ShortcutManager} Instance of {@link ShortcutManager}
   */
  getShortcutManager(): ShortcutManager {
    return this.shortcutManager;
  };

  /**
   * Return the Focus Manager responsible for managing the browser's focus in the table.
   *
   * @memberof Core#
   * @since 14.0.0
   * @function getFocusManager
   * @returns {FocusManager}
   */
  getFocusManager(): FocusManager {
    return focusManager;
  }

  /**
   * Returns a boolean value indicating if the number of rows is smaller than the number of fixed rows.
   *
   * @memberof Core#
   * @function isRowHeaderOverflow
   * @since 8.4.0
   * @returns {boolean}
   */
  isRowHeaderOverflow(): boolean {
    return this.rowIndexMapper.getNotTrimmedIndexesLength() < tableMeta.fixedRowsTop;
  }

  /**
   * Returns a boolean value indicating if the number of columns is smaller than the number of fixed columns.
   *
   * @memberof Core#
   * @function isColumnHeaderOverflow
   * @since 8.4.0
   * @returns {boolean}
   */
  isColumnHeaderOverflow(): boolean {
    return this.columnIndexMapper.getNotTrimmedIndexesLength() < tableMeta.fixedColumnsStart;
  }

  /**
   * Set the cell's meta data object properties.
   *
   * @memberof Core#
   * @function setCellMetaObject
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} cellProperties Cell meta object properties.
   */
  setCellMetaObject(row: number, column: number, cellProperties: object): void {
    if (isMeta(cellProperties)) {
      metaManager.setCellMeta(row, column, cellProperties);

    } else {
      // Don't `runHooks` inside the `objectEach` to improve performance
      const origRowKey = cellProperties.row;
      const origColumnKey = cellProperties.col;

      objectEach(cellProperties, (value, key) => {
        if (key !== 'row' && key !== 'col') {
          metaManager.setCellMeta(row, column, key, value);
        }
      });

      cellProperties.row = origRowKey;
      cellProperties.col = origColumnKey;
    }

    this.runHooks('afterSetCellMeta', row, column, cellProperties);
  };

  /**
   * Register a custom renderer.
   *
   * @memberof Core#
   * @function addCellRenderer
   * @since 14.0.0
   * @param {string} name The renderer name.
   * @param {Function} func The renderer function.
   */
  addCellRenderer(name: string, func: Function): void {
    if (typeof func !== 'function') {
      throw new Error(`The renderer function must be a function, got ${typeof func}`);
    }

    getRegisteredRenderers().set(name, func);
  }

  /**
   * Registers a custom validator.
   *
   * @memberof Core#
   * @function addValidator
   * @since 14.0.0
   * @param {string} name The validator name.
   * @param {Function|RegExp} func The validator function or regular expression.
   */
  addValidator(name: string, func: Function | RegExp): void {
    getRegisteredValidators().set(name, func);
  }

  /**
   * Handsontable.Core instance to another Handsontable.Core instance. The values of all selected cells will be copied
   * to the destination instance.
   *
   * This method is automatically called by the Copy-Paste plugin when a selection on a table is copied to the OS clipboard and
   * then a new table is opened. If you intend to override it, remember to include the returned value from the original function.
   * It is needed to keep the data export functionality working.
   *
   * @memberof Core#
   * @function getTransferableData
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {string} Cell data.
   */
  getTransferableData(row: number, column: number): string {
    const cellData = datamap.get(row, datamap.colToProp(column));

    return cellData !== null && cellData !== void 0 ? cellData : '';
  }
}
