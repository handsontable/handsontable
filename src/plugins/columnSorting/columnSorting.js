import {
  addClass,
  removeClass,
} from '../../helpers/dom/element';
import { isUndefined, isDefined } from '../../helpers/mixed';
import { isObject } from '../../helpers/object';
import { arrayMap } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import BasePlugin from '../_base';
import { registerPlugin } from './../../plugins';
import Hooks from '../../pluginHooks';
import { isPressedCtrlKey } from '../../utils/keyStateObserver';
import { ColumnStatesManager } from './columnStatesManager';
import {
  getNextSortOrder,
  areValidSortStates,
  getHeaderSpanElement,
  isFirstLevelColumnHeader,
  wasHeaderClickedProperly
} from './utils';
import { getClassedToRemove, getClassesToAdd } from './domHelpers';
import RowsMapper from './rowsMapper';
import { rootComparator } from './rootComparator';
import { registerRootComparator, sort } from './sortService';

const APPEND_COLUMN_CONFIG_STRATEGY = 'append';
const REPLACE_COLUMN_CONFIG_STRATEGY = 'replace';
const PLUGIN_KEY = 'columnSorting';

registerRootComparator(PLUGIN_KEY, rootComparator);

Hooks.getSingleton().register('beforeColumnSort');
Hooks.getSingleton().register('afterColumnSort');

// DIFF - MultiColumnSorting & ColumnSorting: changed configuration documentation.
/**
 * @plugin ColumnSorting
 *
 * @description
 * This plugin sorts the view by columns (but does not sort the data source!). To enable the plugin, set the
 * {@link Options#columnSorting} property to the correct value (see the examples below).
 *
 * @example
 * ```js
 * // as boolean
 * columnSorting: true
 *
 * // as an object with initial sort config (sort ascending for column at index 1)
 * columnSorting: {
 *   initialConfig: {
 *     column: 1,
 *     sortOrder: 'asc'
 *   }
 * }
 *
 * // as an object which define specific sorting options for all columns
 * columnSorting: {
 *   sortEmptyCells: true, // true = the table sorts empty cells, false = the table moves all empty cells to the end of the table (by default)
 *   indicator: true, // true = shows indicator for all columns (by default), false = don't show indicator for columns
 *   headerAction: true, // true = allow to click on the headers to sort (by default), false = turn off possibility to click on the headers to sort
 *   compareFunctionFactory: function(sortOrder, columnMeta) {
 *     return function(value, nextValue) {
 *       // Some value comparisons which will return -1, 0 or 1...
 *     }
 *   }
 * }
 *
 * // as an object passed to the `column` property, allows specifying a custom options for the desired column.
 * // please take a look at documentation of `column` property: https://docs.handsontable.com/pro/Options.html#columns
 * columns: [{
 *   columnSorting: {
 *     indicator: false, // disable indicator for the first column,
 *     sortEmptyCells: true,
 *     headerAction: false, // clicks on the first column won't sort
 *     compareFunctionFactory: function(sortOrder, columnMeta) {
 *       return function(value, nextValue) {
 *         return 0; // Custom compare function for the first column (don't sort)
 *       }
 *     }
 *   }
 * }]```
 *
 * @dependencies ObserveChanges
 */
class ColumnSorting extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of column state manager.
     *
     * @private
     * @type {ColumnStatesManager}
     */
    this.columnStatesManager = new ColumnStatesManager();
    /**
     * Object containing visual row indexes mapped to data source indexes.
     *
     * @private
     * @type {RowsMapper}
     */
    this.rowsMapper = new RowsMapper(this);
    /**
     * It blocks the plugin translation, this flag is checked inside `onModifyRow` callback.
     *
     * @private
     * @type {Boolean}
     */
    this.blockPluginTranslation = true;
    /**
     * Cached column properties from plugin like i.e. `indicator`, `headerAction`.
     *
     * @private
     * @type {Map<number, Object>}
     */
    this.columnMetaCache = new Map();
    /**
     * Main settings key designed for the plugin.
     *
     * @private
     * @type {String}
     */
    this.pluginKey = PLUGIN_KEY;
  }

  /**
   * Checks if the plugin is enabled in the Handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ColumnSorting#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!(this.hot.getSettings()[this.pluginKey]);
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    if (isUndefined(this.hot.getSettings().observeChanges)) {
      this.enableObserveChangesPlugin();
    }

    this.addHook('afterTrimRow', () => this.sortByPresetSortStates());
    this.addHook('afterUntrimRow', () => this.sortByPresetSortStates());
    this.addHook('modifyRow', (row, source) => this.onModifyRow(row, source));
    this.addHook('unmodifyRow', (row, source) => this.onUnmodifyRow(row, source));
    this.addHook('afterGetColHeader', (column, TH) => this.onAfterGetColHeader(column, TH));
    this.addHook('beforeOnCellMouseDown', (event, coords, TD, controller) => this.onBeforeOnCellMouseDown(event, coords, TD, controller));
    this.addHook('afterOnCellMouseDown', (event, target) => this.onAfterOnCellMouseDown(event, target));
    this.addHook('afterCreateRow', (index, amount) => this.onAfterCreateRow(index, amount));
    this.addHook('afterRemoveRow', (index, amount) => this.onAfterRemoveRow(index, amount));
    this.addHook('afterInit', () => this.loadOrSortBySettings());
    this.addHook('afterLoadData', initialLoad => this.onAfterLoadData(initialLoad));
    this.addHook('afterCreateCol', () => this.onAfterCreateCol());
    this.addHook('afterRemoveCol', () => this.onAfterRemoveCol());

    // TODO: Workaround? It should be refactored / described.
    if (this.hot.view) {
      this.loadOrSortBySettings();
    }

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    const clearColHeader = (column, TH) => {
      const headerSpanElement = getHeaderSpanElement(TH);

      if (isFirstLevelColumnHeader(column, TH) === false || headerSpanElement === null) {
        return;
      }

      this.updateHeaderClasses(headerSpanElement);
    };

    // Changing header width and removing indicator.
    this.hot.addHook('afterGetColHeader', clearColHeader);
    this.hot.addHookOnce('afterRender', () => {
      this.hot.removeHook('afterGetColHeader', clearColHeader);
    });

    this.rowsMapper.clearMap();

    super.disablePlugin();
  }

  // DIFF - MultiColumnSorting & ColumnSorting: changed function documentation.
  /**
   * Sorts the table by chosen columns and orders.
   *
   * @param {undefined|Object} sortConfig Single column sort configuration. The configuration object contains `column` and `sortOrder` properties.
   * First of them contains visual column index, the second one contains sort order (`asc` for ascending, `desc` for descending).
   *
   * **Note**: Please keep in mind that every call of `sort` function set an entirely new sort order. Previous sort configs aren't preserved.
   *
   * @example
   * ```js
   * // sort ascending first visual column
   * hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
   * ```
   *
   * @fires Hooks#beforeColumnSort
   * @fires Hooks#afterColumnSort
   */
  sort(sortConfig) {
    const currentSortConfig = this.getSortConfig();

    // We always pass configs defined as an array to `beforeColumnSort` and `afterColumnSort` hooks.
    const destinationSortConfigs = this.getNormalizedSortConfigs(sortConfig);

    const sortPossible = this.areValidSortConfigs(destinationSortConfigs);
    const allowSort = this.hot.runHooks('beforeColumnSort', currentSortConfig, destinationSortConfigs, sortPossible);

    if (allowSort === false) {
      return;
    }

    if (sortPossible) {
      const translateColumnToPhysical = ({ column: visualColumn, ...restOfProperties }) =>
        ({ column: this.hot.toPhysicalColumn(visualColumn), ...restOfProperties });
      const internalSortStates = arrayMap(destinationSortConfigs, columnSortConfig => translateColumnToPhysical(columnSortConfig));

      this.columnStatesManager.setSortStates(internalSortStates);
      this.sortByPresetSortStates();
      this.saveAllSortSettings();

      this.hot.render();
      this.hot.view.wt.draw(true); // TODO: Workaround? One test won't pass after removal. It should be refactored / described.
    }

    this.hot.runHooks('afterColumnSort', currentSortConfig, this.getSortConfig(), sortPossible);
  }

  /**
   * Clear the sort performed on the table.
   */
  clearSort() {
    this.sort([]);
  }

  /**
   * Checks if the table is sorted (any column have to be sorted).
   *
   * @returns {Boolean}
   */
  isSorted() {
    return this.enabled && !this.columnStatesManager.isListOfSortedColumnsEmpty();
  }

  /**
   * Get sort configuration for particular column or for all sorted columns. Objects contain `column` and `sortOrder` properties.
   *
   * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key. They are handled by the `sort` function.
   *
   * @param {Number} [column] Visual column index.
   * @returns {undefined|Object|Array}
   */
  getSortConfig(column) {
    const translateColumnToVisual = ({ column: physicalColumn, ...restOfProperties }) =>
      ({ column: this.hot.toVisualColumn(physicalColumn), ...restOfProperties });

    if (isDefined(column)) {
      const physicalColumn = this.hot.toPhysicalColumn(column);
      const columnSortState = this.columnStatesManager.getColumnSortState(physicalColumn);

      if (isDefined(columnSortState)) {
        return translateColumnToVisual(columnSortState);
      }

      return;
    }

    const sortStates = this.columnStatesManager.getSortStates();

    return arrayMap(sortStates, columnState => translateColumnToVisual(columnState));
  }

  /**
   * @description
   * Warn: Useful mainly for providing server side sort implementation (see in the example below). It doesn't sort the data set. It just sets sort configuration for all sorted columns.
   * Note: Please keep in mind that this method doesn't re-render the table.
   *
   * @example
   * ```js
   * beforeColumnSort: function(currentSortConfig, destinationSortConfigs) {
   *   const columnSortPlugin = this.getPlugin('columnSorting');
   *
   *   columnSortPlugin.setSortConfig(destinationSortConfigs);
   *
   *   // const newData = ... // Calculated data set, ie. from an AJAX call.
   *
   *   this.loadData(newData); // Load new data set and re-render the table.
   *
   *   return false; // The blockade for the default sort action.
   * }```
   *
   * @param {undefined|Object|Array} sortConfig Single column sort configuration or full sort configuration (for all sorted columns).
   * The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains
   * sort order (`asc` for ascending, `desc` for descending).
   */
  setSortConfig(sortConfig) {
    // We always set configs defined as an array.
    const destinationSortConfigs = this.getNormalizedSortConfigs(sortConfig);

    if (this.areValidSortConfigs(destinationSortConfigs)) {
      const translateColumnToPhysical = ({ column: visualColumn, ...restOfProperties }) =>
        ({ column: this.hot.toPhysicalColumn(visualColumn), ...restOfProperties });
      const internalSortStates = arrayMap(destinationSortConfigs, columnSortConfig => translateColumnToPhysical(columnSortConfig));

      this.columnStatesManager.setSortStates(internalSortStates);
    }
  }

  /**
   * Get normalized sort configs.
   *
   * @private
   * @param {Object|Array} [sortConfig=[]] Single column sort configuration or full sort configuration (for all sorted columns).
   * The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains
   * sort order (`asc` for ascending, `desc` for descending).
   * @returns {Array}
   */
  getNormalizedSortConfigs(sortConfig = []) {
    if (Array.isArray(sortConfig)) {
      return sortConfig.slice(0, 1);
    }

    return [sortConfig].slice(0, 1);
  }

  /**
   * Get if sort configs are valid.
   *
   * @private
   * @param {Array} sortConfigs Sort configuration for all sorted columns. Objects contain `column` and `sortOrder` properties.
   * @returns {Boolean}
   */
  areValidSortConfigs(sortConfigs) {
    if (Array.isArray(sortConfigs) === false) {
      return false;
    }

    const sortedColumns = sortConfigs.map(({ column }) => column);
    const numberOfColumns = this.hot.countCols();
    const onlyExistingVisualIndexes = sortedColumns.every(visualColumn =>
      visualColumn <= numberOfColumns && visualColumn >= 0);

    return areValidSortStates(sortConfigs) && onlyExistingVisualIndexes; // We don't translate visual indexes to physical indexes.
  }

  /**
   * Saves all sorting settings. Saving works only when {@link Options#persistentState} option is enabled.
   *
   * @private
   * @fires Hooks#persistentStateSave
   */
  saveAllSortSettings() {
    const allSortSettings = this.columnStatesManager.getAllColumnsProperties();

    allSortSettings.initialConfig = this.columnStatesManager.getSortStates();

    this.hot.runHooks('persistentStateSave', 'columnSorting', allSortSettings);
  }

  /**
   * Get all saved sorting settings. Loading works only when {@link Options#persistentState} option is enabled.
   *
   * @private
   * @returns {Object} Previously saved sort settings.
   *
   * @fires Hooks#persistentStateLoad
   */
  getAllSavedSortSettings() {
    const storedAllSortSettings = {};

    this.hot.runHooks('persistentStateLoad', 'columnSorting', storedAllSortSettings);

    const allSortSettings = storedAllSortSettings.value;
    const translateColumnToVisual = ({ column: physicalColumn, ...restOfProperties }) =>
      ({ column: this.hot.toVisualColumn(physicalColumn), ...restOfProperties });

    if (isDefined(allSortSettings) && Array.isArray(allSortSettings.initialConfig)) {
      allSortSettings.initialConfig = arrayMap(allSortSettings.initialConfig, translateColumnToVisual);
    }

    return allSortSettings;
  }

  /**
   * Get next sort configuration for particular column. Object contain `column` and `sortOrder` properties.
   *
   * **Note**: Please keep in mind that returned object expose **visual** column index under the `column` key.
   *
   * @private
   * @param {Number} column Visual column index.
   * @returns {undefined|Object}
   */
  getColumnNextConfig(column) {
    const physicalColumn = this.hot.toPhysicalColumn(column);

    if (this.columnStatesManager.isColumnSorted(physicalColumn)) {
      const columnSortConfig = this.getSortConfig(column);
      const sortOrder = getNextSortOrder(columnSortConfig.sortOrder);

      if (isDefined(sortOrder)) {
        columnSortConfig.sortOrder = sortOrder;

        return columnSortConfig;
      }

      return;
    }

    const nrOfColumns = this.hot.countCols();

    if (Number.isInteger(column) && column >= 0 && column < nrOfColumns) {
      return {
        column,
        sortOrder: getNextSortOrder()
      };
    }
  }

  /**
   * Get sort configuration with "next order" for particular column.
   *
   * @private
   * @param {Number} columnToChange Visual column index of column which order will be changed.
   * @param {String} strategyId ID of strategy. Possible values: 'append' and 'replace'. The first one
   * change order of particular column and change it's position in the sort queue to the last one. The second one
   * just change order of particular column.
   *
   * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key.
   *
   * @returns {Array}
   */
  getNextSortConfig(columnToChange, strategyId = APPEND_COLUMN_CONFIG_STRATEGY) {
    const physicalColumn = this.hot.toPhysicalColumn(columnToChange);
    const indexOfColumnToChange = this.columnStatesManager.getIndexOfColumnInSortQueue(physicalColumn);
    const isColumnSorted = this.columnStatesManager.isColumnSorted(physicalColumn);
    const currentSortConfig = this.getSortConfig();
    const nextColumnConfig = this.getColumnNextConfig(columnToChange);

    if (isColumnSorted) {
      if (isUndefined(nextColumnConfig)) {
        return [...currentSortConfig.slice(0, indexOfColumnToChange), ...currentSortConfig.slice(indexOfColumnToChange + 1)];
      }

      if (strategyId === APPEND_COLUMN_CONFIG_STRATEGY) {
        return [...currentSortConfig.slice(0, indexOfColumnToChange), ...currentSortConfig.slice(indexOfColumnToChange + 1), nextColumnConfig];

      } else if (strategyId === REPLACE_COLUMN_CONFIG_STRATEGY) {
        return [...currentSortConfig.slice(0, indexOfColumnToChange), nextColumnConfig, ...currentSortConfig.slice(indexOfColumnToChange + 1)];
      }
    }

    if (isDefined(nextColumnConfig)) {
      return currentSortConfig.concat(nextColumnConfig);
    }

    return currentSortConfig;
  }

  /**
   * Saves to cache part of plugins related properties, properly merged from cascade settings.
   *
   * @private
   * @param {Number} column Visual column index.
   * @returns {Object}
   */
  // TODO: Workaround. Inheriting of non-primitive cell meta values doesn't work. Using this function we don't count
  // merged properties few times.
  setMergedPluginSettings(column) {
    const physicalColumnIndex = this.hot.toPhysicalColumn(column);
    const pluginMainSettings = this.hot.getSettings()[this.pluginKey];
    const storedColumnProperties = this.columnStatesManager.getAllColumnsProperties();
    const cellMeta = this.hot.getCellMeta(0, column);
    const columnMeta = Object.getPrototypeOf(cellMeta);
    const columnMetaHasPluginSettings = Object.hasOwnProperty.call(columnMeta, this.pluginKey);
    const pluginColumnConfig = columnMetaHasPluginSettings ? columnMeta[this.pluginKey] : {};

    this.columnMetaCache.set(physicalColumnIndex, Object.assign(storedColumnProperties, pluginMainSettings, pluginColumnConfig));
  }

  /**
   * Get copy of settings for first cell in the column.
   *
   * @private
   * @param {Number} column Visual column index.
   * @returns {Object}
   */
  // TODO: Workaround. Inheriting of non-primitive cell meta values doesn't work. Instead of getting properties from
  // column meta we call this function.
  getFirstCellSettings(column) {
    // TODO: Remove test named: "should not break the dataset when inserted new row" (#5431).
    const actualBlockTranslationFlag = this.blockPluginTranslation;

    this.blockPluginTranslation = true;

    if (this.columnMetaCache.size === 0 || this.columnMetaCache.size < this.hot.countCols()) {
      this.rebuildColumnMetaCache();
    }

    const cellMeta = this.hot.getCellMeta(0, column);

    this.blockPluginTranslation = actualBlockTranslationFlag;

    const cellMetaCopy = Object.create(cellMeta);
    cellMetaCopy[this.pluginKey] = this.columnMetaCache.get(this.hot.toPhysicalColumn(column));

    return cellMetaCopy;
  }

  /**
   * Rebuild the column meta cache for all the columns.
   *
   * @private
   */
  rebuildColumnMetaCache() {
    const numberOfColumns = this.hot.countCols();

    if (numberOfColumns === 0) {
      this.columnMetaCache.clear();

    } else {
      rangeEach(numberOfColumns - 1, visualColumnIndex => this.setMergedPluginSettings(visualColumnIndex));
    }
  }

  /**
   * Get number of rows which should be sorted.
   *
   * @private
   * @param {Number} numberOfRows Total number of displayed rows.
   * @returns {Number}
   */
  getNumberOfRowsToSort(numberOfRows) {
    const settings = this.hot.getSettings();

    // `maxRows` option doesn't take into account `minSpareRows` option in this case.
    if (settings.maxRows <= numberOfRows) {
      return settings.maxRows;
    }

    return numberOfRows - settings.minSpareRows;
  }

  /**
   * Performs the sorting using a stable sort function basing on internal state of sorting.
   *
   * @private
   */
  sortByPresetSortStates() {
    if (this.columnStatesManager.isListOfSortedColumnsEmpty()) {
      this.rowsMapper.clearMap();

      return;
    }

    const indexesWithData = [];
    const sortedColumnsList = this.columnStatesManager.getSortedColumns();
    const numberOfRows = this.hot.countRows();

    // Function `getDataAtCell` won't call the indices translation inside `onModifyRow` callback - we check the `blockPluginTranslation`
    // flag inside it (we just want to get data not already modified by `columnSorting` plugin translation).
    this.blockPluginTranslation = true;

    const getDataForSortedColumns = visualRowIndex =>
      arrayMap(sortedColumnsList, physicalColumn => this.hot.getDataAtCell(visualRowIndex, this.hot.toVisualColumn(physicalColumn)));

    for (let visualRowIndex = 0; visualRowIndex < this.getNumberOfRowsToSort(numberOfRows); visualRowIndex += 1) {
      indexesWithData.push([visualRowIndex].concat(getDataForSortedColumns(visualRowIndex)));
    }

    sort(
      indexesWithData,
      this.pluginKey,
      arrayMap(sortedColumnsList, physicalColumn => this.columnStatesManager.getSortOrderOfColumn(physicalColumn)),
      arrayMap(sortedColumnsList, physicalColumn => this.getFirstCellSettings(this.hot.toVisualColumn(physicalColumn)))
    );

    // Append spareRows
    for (let visualRowIndex = indexesWithData.length; visualRowIndex < numberOfRows; visualRowIndex += 1) {
      indexesWithData.push([visualRowIndex].concat(getDataForSortedColumns(visualRowIndex)));
    }

    // The blockade of the indices translation is released.
    this.blockPluginTranslation = false;

    // Save all indexes to arrayMapper, a completely new sequence is set by the plugin
    this.rowsMapper._arrayMap = arrayMap(indexesWithData, indexWithData => indexWithData[0]);
  }

  /**
   * Load saved settings or sort by predefined plugin configuration.
   *
   * @private
   */
  loadOrSortBySettings() {
    this.columnMetaCache.clear();

    const storedAllSortSettings = this.getAllSavedSortSettings();

    if (isObject(storedAllSortSettings)) {
      this.sortBySettings(storedAllSortSettings);

    } else {
      const allSortSettings = this.hot.getSettings()[this.pluginKey];

      this.sortBySettings(allSortSettings);
    }
  }

  /**
   * Sort the table by provided configuration.
   *
   * @private
   * @param {Object} allSortSettings All sort config settings. Object may contain `initialConfig`, `indicator`,
   * `sortEmptyCells`, `headerAction` and `compareFunctionFactory` properties.
   */
  sortBySettings(allSortSettings) {
    if (isObject(allSortSettings)) {
      this.columnStatesManager.updateAllColumnsProperties(allSortSettings);

      const initialConfig = allSortSettings.initialConfig;

      if (Array.isArray(initialConfig) || isObject(initialConfig)) {
        this.sort(initialConfig);
      }

    } else {
      // Extra render for headers. Their width may change.
      this.hot.render();
    }
  }

  /**
   * Enables the ObserveChanges plugin.
   *
   * @private
   */
  enableObserveChangesPlugin() {
    const _this = this;

    this.hot._registerTimeout(
      setTimeout(() => {
        _this.hot.updateSettings({
          observeChanges: true
        });
      }, 0));
  }

  /**
   * Callback for `modifyRow` hook. Translates visual row index to the sorted row index.
   *
   * @private
   * @param {Number} row Visual row index.
   * @returns {Number} Physical row index.
   */
  onModifyRow(row, source) {
    if (this.blockPluginTranslation === false && source !== this.pluginName && this.isSorted()) {
      const rowInMapper = this.rowsMapper.getValueByIndex(row);
      row = rowInMapper === null ? row : rowInMapper;
    }

    return row;
  }

  /**
   * Callback for `unmodifyRow` hook. Translates sorted row index to visual row index.
   *
   * @private
   * @param {Number} row Physical row index.
   * @returns {Number} Visual row index.
   */
  onUnmodifyRow(row, source) {
    if (this.blockPluginTranslation === false && source !== this.pluginName && this.isSorted()) {
      row = this.rowsMapper.getIndexByValue(row);
    }

    return row;
  }

  /**
   * Callback for the `onAfterGetColHeader` hook. Adds column sorting CSS classes.
   *
   * @private
   * @param {Number} column Visual column index.
   * @param {Element} TH TH HTML element.
   */
  onAfterGetColHeader(column, TH) {
    const headerSpanElement = getHeaderSpanElement(TH);

    if (isFirstLevelColumnHeader(column, TH) === false || headerSpanElement === null) {
      return;
    }

    const physicalColumn = this.hot.toPhysicalColumn(column);
    const pluginSettingsForColumn = this.getFirstCellSettings(column)[this.pluginKey];
    const showSortIndicator = pluginSettingsForColumn.indicator;
    const headerActionEnabled = pluginSettingsForColumn.headerAction;

    this.updateHeaderClasses(headerSpanElement, this.columnStatesManager, physicalColumn, showSortIndicator, headerActionEnabled);
  }

  /**
   * Update header classes.
   *
   * @private
   * @param {HTMLElement} headerSpanElement Header span element.
   * @param {...*} args Extra arguments for helpers.
   */
  updateHeaderClasses(headerSpanElement, ...args) {
    removeClass(headerSpanElement, getClassedToRemove(headerSpanElement));

    if (this.enabled !== false) {
      addClass(headerSpanElement, getClassesToAdd(...args));
    }
  }

  /**
   * Overwriting base plugin's `onUpdateSettings` method. Please keep in mind that `onAfterUpdateSettings` isn't called
   * for `updateSettings` in specific situations.
   *
   * @private
   * @param {Object} newSettings New settings object.
   */
  onUpdateSettings(newSettings) {
    super.onUpdateSettings();

    this.columnMetaCache.clear();

    if (isDefined(newSettings[this.pluginKey])) {
      this.sortBySettings(newSettings[this.pluginKey]);
    }
  }

  /**
   * Callback for the `afterLoadData` hook.
   *
   * @private
   * @param {Boolean} initialLoad flag that determines whether the data has been loaded during the initialization.
   */
  onAfterLoadData(initialLoad) {
    this.rowsMapper.clearMap();
    this.columnMetaCache.clear();

    if (initialLoad === true) {
      // TODO: Workaround? It should be refactored / described.
      if (this.hot.view) {
        this.loadOrSortBySettings();
      }
    }
  }

  /**
   * Callback for the `afterCreateRow` hook.
   *
   * @private
   * @param {Number} index Visual index of the created row.
   * @param {Number} amount Amount of created rows.
   */
  onAfterCreateRow(index, amount) {
    this.rowsMapper.shiftItems(index, amount);
  }

  /**
   * Callback for the `afterRemoveRow` hook.
   *
   * @private
   * @param {Number} index Visual index of the removed row.
   * @param {Number} amount Amount of removed rows.
   */
  onAfterRemoveRow(index, amount) {
    this.rowsMapper.unshiftItems(index, amount);
  }

  // TODO: Workaround. Inheriting of non-primitive cell meta values doesn't work. We clear the cache after action which reorganize sequence of columns.
  // TODO: Remove test named: "should add new columns properly when the `columnSorting` plugin is enabled (inheriting of non-primitive cell meta values)".
  /**
   * Callback for the `afterCreateCol` hook.
   *
   * @private
   */
  onAfterCreateCol() {
    this.columnMetaCache.clear();
  }

  // TODO: Workaround. Inheriting of non-primitive cell meta values doesn't work. We clear the cache after action which reorganize sequence of columns.
  // TODO: Remove test named: "should add new columns properly when the `columnSorting` plugin is enabled (inheriting of non-primitive cell meta values)".
  /**
   * Callback for the `afterRemoveCol` hook.
   *
   * @private
   */
  onAfterRemoveCol() {
    this.columnMetaCache.clear();
  }

  /**
   * Indicates if clickable header was clicked.
   *
   * @private
   * @param {MouseEvent} event The `mousedown` event.
   * @param {Number} column Visual column index.
   * @returns {Boolean}
   */
  wasClickableHeaderClicked(event, column) {
    const pluginSettingsForColumn = this.getFirstCellSettings(column)[this.pluginKey];
    const headerActionEnabled = pluginSettingsForColumn.headerAction;

    return headerActionEnabled && event.realTarget.nodeName === 'SPAN';
  }

  /**
   * Changes the behavior of selection / dragging.
   *
   * @private
   * @param {MouseEvent} event The `mousedown` event.
   * @param {CellCoords} coords Visual coordinates.
   * @param {HTMLElement} TD
   * @param {Object} blockCalculations
   */
  onBeforeOnCellMouseDown(event, coords, TD, blockCalculations) {
    if (wasHeaderClickedProperly(coords.row, coords.col, event) === false) {
      return;
    }

    if (this.wasClickableHeaderClicked(event, coords.col) && isPressedCtrlKey()) {
      blockCalculations.column = true;
    }
  }

  /**
   * Callback for the `onAfterOnCellMouseDown` hook.
   *
   * @private
   * @param {Event} event Event which are provided by hook.
   * @param {CellCoords} coords Visual coords of the selected cell.
   */
  onAfterOnCellMouseDown(event, coords) {
    if (wasHeaderClickedProperly(coords.row, coords.col, event) === false) {
      return;
    }

    if (this.wasClickableHeaderClicked(event, coords.col)) {
      if (isPressedCtrlKey()) {
        this.hot.deselectCell();
        this.hot.selectColumns(coords.col);
      }

      this.sort(this.getColumnNextConfig(coords.col));
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.rowsMapper.destroy();
    this.columnStatesManager.destroy();

    super.destroy();
  }
}

registerPlugin(PLUGIN_KEY, ColumnSorting);

export default ColumnSorting;
