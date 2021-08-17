import {
  addClass,
  removeClass,
} from '../../helpers/dom/element';
import { isUndefined, isDefined } from '../../helpers/mixed';
import { isObject } from '../../helpers/object';
import { isFunction } from '../../helpers/function';
import { arrayMap } from '../../helpers/array';
import { BasePlugin } from '../base';
import { IndexesSequence, PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';
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
import { getClassesToRemove, getClassesToAdd } from './domHelpers';
import { rootComparator } from './rootComparator';
import { registerRootComparator, sort } from './sortService';

export const PLUGIN_KEY = 'columnSorting';
export const PLUGIN_PRIORITY = 50;
const APPEND_COLUMN_CONFIG_STRATEGY = 'append';
const REPLACE_COLUMN_CONFIG_STRATEGY = 'replace';

registerRootComparator(PLUGIN_KEY, rootComparator);

Hooks.getSingleton().register('beforeColumnSort');
Hooks.getSingleton().register('afterColumnSort');

// DIFF - MultiColumnSorting & ColumnSorting: changed configuration documentation.
/**
 * @plugin ColumnSorting
 * @class ColumnSorting
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
 * // please take a look at documentation of `column` property: https://handsontable.com/docs/Options.html#columns
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
 * }]
 * ```
 */
export class ColumnSorting extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of column state manager.
     *
     * @private
     * @type {null|ColumnStatesManager}
     */
    this.columnStatesManager = null;
    /**
     * Cached column properties from plugin like i.e. `indicator`, `headerAction`.
     *
     * @private
     * @type {null|PhysicalIndexToValueMap}
     */
    this.columnMetaCache = null;
    /**
     * Main settings key designed for the plugin.
     *
     * @private
     * @type {string}
     */
    this.pluginKey = PLUGIN_KEY;
    /**
     * Plugin indexes cache.
     *
     * @private
     * @type {null|IndexesSequence}
     */
    this.indexesSequenceCache = null;
  }

  /**
   * Checks if the plugin is enabled in the Handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ColumnSorting#enablePlugin} method is called.
   *
   * @returns {boolean}
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

    this.columnStatesManager = new ColumnStatesManager(this.hot, `${this.pluginKey}.sortingStates`);

    this.columnMetaCache = new IndexToValueMap((physicalIndex) => {
      let visualIndex = this.hot.toVisualColumn(physicalIndex);

      if (visualIndex === null) {
        visualIndex = physicalIndex;
      }

      return this.getMergedPluginSettings(visualIndex);
    });
    this.hot.columnIndexMapper.registerMap(`${this.pluginKey}.columnMeta`, this.columnMetaCache);

    this.addHook('afterGetColHeader', (column, TH) => this.onAfterGetColHeader(column, TH));
    this.addHook('beforeOnCellMouseDown', (...args) => this.onBeforeOnCellMouseDown(...args));
    this.addHook('afterOnCellMouseDown', (event, target) => this.onAfterOnCellMouseDown(event, target));
    this.addHook('afterInit', () => this.loadOrSortBySettings());
    this.addHook('afterLoadData', (sourceData, initialLoad) => this.onAfterLoadData(initialLoad));

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
    this.hot.addHookOnce('afterViewRender', () => {
      this.hot.removeHook('afterGetColHeader', clearColHeader);
    });

    this.hot.batchExecution(() => {
      if (this.indexesSequenceCache !== null) {
        this.hot.rowIndexMapper.setIndexesSequence(this.indexesSequenceCache.getValues());
        this.hot.rowIndexMapper.unregisterMap(this.pluginKey);
      }
    }, true);

    this.hot.columnIndexMapper.unregisterMap(`${this.pluginKey}.columnMeta`);
    this.columnStatesManager.destroy();
    this.columnMetaCache = null;
    this.columnStatesManager = null;

    super.disablePlugin();
  }

  // DIFF - MultiColumnSorting & ColumnSorting: changed function documentation.
  /**
   * Sorts the table by chosen columns and orders.
   *
   * @param {undefined|object} sortConfig Single column sort configuration. The configuration object contains `column` and `sortOrder` properties.
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

    if (currentSortConfig.length === 0 && this.indexesSequenceCache === null) {
      this.indexesSequenceCache = this.hot.rowIndexMapper.registerMap(this.pluginKey, new IndexesSequence());
      this.indexesSequenceCache.setValues(this.hot.rowIndexMapper.getIndexesSequence());
    }

    if (sortPossible) {
      this.columnStatesManager.setSortStates(destinationSortConfigs);
      this.sortByPresetSortStates(destinationSortConfigs);
      this.saveAllSortSettings(destinationSortConfigs);
    }

    this.hot.runHooks('afterColumnSort',
      currentSortConfig, sortPossible ? destinationSortConfigs : currentSortConfig, sortPossible);

    if (sortPossible) {
      this.hot.render();
      // TODO: Workaround? This triggers fast redraw. One test won't pass after removal.
      // It should be refactored / described.
      this.hot.forceFullRender = false;
      this.hot.view.render();
    }
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
   * @returns {boolean}
   */
  isSorted() {
    return this.enabled && !this.columnStatesManager.isListOfSortedColumnsEmpty();
  }

  /**
   * Get sort configuration for particular column or for all sorted columns. Objects contain `column` and `sortOrder` properties.
   *
   * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key. They are handled by the `sort` function.
   *
   * @param {number} [column] Visual column index.
   * @returns {undefined|object|Array}
   */
  getSortConfig(column) {
    if (isDefined(column)) {
      return this.columnStatesManager.getColumnSortState(column);
    }

    return this.columnStatesManager.getSortStates();
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
   * }
   * ```
   *
   * @param {undefined|object|Array} sortConfig Single column sort configuration or full sort configuration (for all sorted columns).
   * The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains
   * sort order (`asc` for ascending, `desc` for descending).
   */
  setSortConfig(sortConfig) {
    // We always set configs defined as an array.
    const destinationSortConfigs = this.getNormalizedSortConfigs(sortConfig);

    if (this.areValidSortConfigs(destinationSortConfigs)) {
      this.columnStatesManager.setSortStates(destinationSortConfigs);
    }
  }

  /**
   * Get normalized sort configs.
   *
   * @private
   * @param {object|Array} [sortConfig=[]] Single column sort configuration or full sort configuration (for all sorted columns).
   * The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains
   * sort order (`asc` for ascending, `desc` for descending).
   * @returns {Array}
   */
  getNormalizedSortConfigs(sortConfig = []) {
    if (Array.isArray(sortConfig)) {
      return sortConfig.slice(0, 1);
    }

    return [sortConfig];
  }

  /**
   * Get if sort configs are valid.
   *
   * @private
   * @param {Array} sortConfigs Sort configuration for all sorted columns. Objects contain `column` and `sortOrder` properties.
   * @returns {boolean}
   */
  areValidSortConfigs(sortConfigs) {
    const numberOfColumns = this.hot.countCols();

    // We don't translate visual indexes to physical indexes.
    return areValidSortStates(sortConfigs) && sortConfigs.every(({ column }) =>
      column <= numberOfColumns && column >= 0);
  }

  /**
   * Saves all sorting settings. Saving works only when {@link Options#persistentState} option is enabled.
   *
   * @param {Array} sortConfigs Sort configuration for all sorted columns. Objects contain `column` and `sortOrder` properties.
   *
   * @private
   * @fires Hooks#persistentStateSave
   */
  saveAllSortSettings(sortConfigs) {
    const allSortSettings = this.columnStatesManager.getAllColumnsProperties();
    const translateColumnToPhysical = ({ column: visualColumn, ...restOfProperties }) =>
      ({ column: this.hot.toPhysicalColumn(visualColumn), ...restOfProperties });

    allSortSettings.initialConfig = arrayMap(sortConfigs, translateColumnToPhysical);

    this.hot.runHooks('persistentStateSave', 'columnSorting', allSortSettings);
  }

  /**
   * Get all saved sorting settings. Loading works only when {@link Options#persistentState} option is enabled.
   *
   * @private
   * @returns {object} Previously saved sort settings.
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
   * @param {number} column Visual column index.
   * @returns {undefined|object}
   */
  getColumnNextConfig(column) {
    const sortOrder = this.columnStatesManager.getSortOrderOfColumn(column);

    if (isDefined(sortOrder)) {
      const nextSortOrder = getNextSortOrder(sortOrder);

      if (isDefined(nextSortOrder)) {
        return {
          column,
          sortOrder: nextSortOrder,
        };
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
   * @param {number} columnToChange Visual column index of column which order will be changed.
   * @param {string} strategyId ID of strategy. Possible values: 'append' and 'replace'. The first one
   * change order of particular column and change it's position in the sort queue to the last one. The second one
   * just change order of particular column.
   *
   * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key.
   *
   * @returns {Array}
   */
  getNextSortConfig(columnToChange, strategyId = APPEND_COLUMN_CONFIG_STRATEGY) {
    const indexOfColumnToChange = this.columnStatesManager.getIndexOfColumnInSortQueue(columnToChange);
    const isColumnSorted = indexOfColumnToChange !== -1;
    const currentSortConfig = this.getSortConfig();
    const nextColumnConfig = this.getColumnNextConfig(columnToChange);

    if (isColumnSorted) {
      if (isUndefined(nextColumnConfig)) {
        return [
          ...currentSortConfig.slice(0, indexOfColumnToChange),
          ...currentSortConfig.slice(indexOfColumnToChange + 1)
        ];
      }

      if (strategyId === APPEND_COLUMN_CONFIG_STRATEGY) {
        return [
          ...currentSortConfig.slice(0, indexOfColumnToChange),
          ...currentSortConfig.slice(indexOfColumnToChange + 1),
          nextColumnConfig
        ];

      } else if (strategyId === REPLACE_COLUMN_CONFIG_STRATEGY) {
        return [
          ...currentSortConfig.slice(0, indexOfColumnToChange),
          nextColumnConfig,
          ...currentSortConfig.slice(indexOfColumnToChange + 1)
        ];
      }
    }

    if (isDefined(nextColumnConfig)) {
      return currentSortConfig.concat(nextColumnConfig);
    }

    return currentSortConfig;
  }

  /**
   * Get plugin's column config for the specified column index.
   *
   * @private
   * @param {object} columnConfig Configuration inside `columns` property for the specified column index.
   * @returns {object}
   */
  getPluginColumnConfig(columnConfig) {
    if (isObject(columnConfig)) {
      const pluginColumnConfig = columnConfig[this.pluginKey];

      if (isObject(pluginColumnConfig)) {
        return pluginColumnConfig;
      }
    }

    return {};
  }

  /**
   * Get plugin settings related properties, properly merged from cascade settings.
   *
   * @private
   * @param {number} column Visual column index.
   * @returns {object}
   */
  getMergedPluginSettings(column) {
    const pluginMainSettings = this.hot.getSettings()[this.pluginKey];
    const storedColumnProperties = this.columnStatesManager.getAllColumnsProperties();
    const cellMeta = this.hot.getCellMeta(0, column);
    const columnMeta = Object.getPrototypeOf(cellMeta);

    if (Array.isArray(columnMeta.columns)) {
      return Object
        .assign(storedColumnProperties, pluginMainSettings, this.getPluginColumnConfig(columnMeta.columns[column]));

    } else if (isFunction(columnMeta.columns)) {
      return Object
        .assign(storedColumnProperties, pluginMainSettings, this.getPluginColumnConfig(columnMeta.columns(column)));
    }

    return Object.assign(storedColumnProperties, pluginMainSettings);
  }

  /**
   * Get copy of settings for first cell in the column.
   *
   * @private
   * @param {number} column Visual column index.
   * @returns {object}
   */
  // TODO: Workaround. Inheriting of non-primitive cell meta values doesn't work. Instead of getting properties from column meta we call this function.
  // TODO: Remove test named: "should not break the dataset when inserted new row" (#5431).
  getFirstCellSettings(column) {
    const cellMeta = this.hot.getCellMeta(0, column);

    const cellMetaCopy = Object.create(cellMeta);

    cellMetaCopy[this.pluginKey] = this.columnMetaCache.getValueAtIndex(this.hot.toPhysicalColumn(column));

    return cellMetaCopy;
  }

  /**
   * Get number of rows which should be sorted.
   *
   * @private
   * @param {number} numberOfRows Total number of displayed rows.
   * @returns {number}
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
   * @param {Array} sortConfigs Sort configuration for all sorted columns. Objects contain `column` and `sortOrder` properties.
   * @private
   */
  sortByPresetSortStates(sortConfigs) {
    if (sortConfigs.length === 0) {
      this.hot.rowIndexMapper.setIndexesSequence(this.indexesSequenceCache.getValues());

      return;
    }

    const indexesWithData = [];
    const numberOfRows = this.hot.countRows();

    const getDataForSortedColumns = visualRowIndex =>
      arrayMap(sortConfigs, sortConfig => this.hot.getDataAtCell(visualRowIndex, sortConfig.column));

    for (let visualRowIndex = 0; visualRowIndex < this.getNumberOfRowsToSort(numberOfRows); visualRowIndex += 1) {
      indexesWithData.push([this.hot.toPhysicalRow(visualRowIndex)].concat(getDataForSortedColumns(visualRowIndex)));
    }

    const indexesBefore = arrayMap(indexesWithData, indexWithData => indexWithData[0]);

    sort(
      indexesWithData,
      this.pluginKey,
      arrayMap(sortConfigs, sortConfig => sortConfig.sortOrder),
      arrayMap(sortConfigs, sortConfig => this.getFirstCellSettings(sortConfig.column))
    );

    // Append spareRows
    for (let visualRowIndex = indexesWithData.length; visualRowIndex < numberOfRows; visualRowIndex += 1) {
      indexesWithData.push([visualRowIndex].concat(getDataForSortedColumns(visualRowIndex)));
    }

    const indexesAfter = arrayMap(indexesWithData, indexWithData => indexWithData[0]);

    const indexMapping = new Map(
      arrayMap(indexesBefore, (indexBefore, indexInsideArray) => [indexBefore, indexesAfter[indexInsideArray]])
    );

    const newIndexesSequence = arrayMap(this.hot.rowIndexMapper.getIndexesSequence(), (physicalIndex) => {
      if (indexMapping.has(physicalIndex)) {
        return indexMapping.get(physicalIndex);
      }

      return physicalIndex;
    });

    this.hot.rowIndexMapper.setIndexesSequence(newIndexesSequence);
  }

  /**
   * Load saved settings or sort by predefined plugin configuration.
   *
   * @private
   */
  loadOrSortBySettings() {
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
   * @param {object} allSortSettings All sort config settings. Object may contain `initialConfig`, `indicator`,
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
   * Callback for the `onAfterGetColHeader` hook. Adds column sorting CSS classes.
   *
   * @private
   * @param {number} column Visual column index.
   * @param {Element} TH TH HTML element.
   */
  onAfterGetColHeader(column, TH) {
    const headerSpanElement = getHeaderSpanElement(TH);

    if (isFirstLevelColumnHeader(column, TH) === false || headerSpanElement === null) {
      return;
    }

    const pluginSettingsForColumn = this.getFirstCellSettings(column)[this.pluginKey];
    const showSortIndicator = pluginSettingsForColumn.indicator;
    const headerActionEnabled = pluginSettingsForColumn.headerAction;

    this.updateHeaderClasses(
      headerSpanElement,
      this.columnStatesManager,
      column,
      showSortIndicator,
      headerActionEnabled
    );
  }

  /**
   * Update header classes.
   *
   * @private
   * @param {HTMLElement} headerSpanElement Header span element.
   * @param {...*} args Extra arguments for helpers.
   */
  updateHeaderClasses(headerSpanElement, ...args) {
    removeClass(headerSpanElement, getClassesToRemove(headerSpanElement));

    if (this.enabled !== false) {
      addClass(headerSpanElement, getClassesToAdd(...args));
    }
  }

  /**
   * Overwriting base plugin's `onUpdateSettings` method. Please keep in mind that `onAfterUpdateSettings` isn't called
   * for `updateSettings` in specific situations.
   *
   * @private
   * @param {object} newSettings New settings object.
   */
  onUpdateSettings(newSettings) {
    super.onUpdateSettings();

    if (this.columnMetaCache !== null) {
      // Column meta cache base on settings, thus we should re-init the map.
      this.columnMetaCache.init(this.hot.columnIndexMapper.getNumberOfIndexes());
    }

    if (isDefined(newSettings[this.pluginKey])) {
      this.sortBySettings(newSettings[this.pluginKey]);
    }
  }

  /**
   * Callback for the `afterLoadData` hook.
   *
   * @private
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded during the initialization.
   */
  onAfterLoadData(initialLoad) {
    if (initialLoad === true) {
      // TODO: Workaround? It should be refactored / described.
      if (this.hot.view) {
        this.loadOrSortBySettings();
      }
    }
  }

  /**
   * Indicates if clickable header was clicked.
   *
   * @private
   * @param {MouseEvent} event The `mousedown` event.
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  wasClickableHeaderClicked(event, column) {
    const pluginSettingsForColumn = this.getFirstCellSettings(column)[this.pluginKey];
    const headerActionEnabled = pluginSettingsForColumn.headerAction;

    return headerActionEnabled && event.target.nodeName === 'SPAN';
  }

  /**
   * Changes the behavior of selection / dragging.
   *
   * @private
   * @param {MouseEvent} event The `mousedown` event.
   * @param {CellCoords} coords Visual coordinates.
   * @param {HTMLElement} TD The cell element.
   * @param {object} controller An object with properties `row`, `column` and `cell`. Each property contains
   *                            a boolean value that allows or disallows changing the selection for that particular area.
   */
  onBeforeOnCellMouseDown(event, coords, TD, controller) {
    if (wasHeaderClickedProperly(coords.row, coords.col, event) === false) {
      return;
    }

    if (this.wasClickableHeaderClicked(event, coords.col) && isPressedCtrlKey()) {
      controller.column = true;
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
    // TODO: Probably not supported yet by ESLint: https://github.com/eslint/eslint/issues/11045
    // eslint-disable-next-line no-unused-expressions
    this.columnStatesManager?.destroy();

    super.destroy();
  }
}
