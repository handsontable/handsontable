import {
  addClass,
  eventTargetEl,
  hasClass,
  isBottomMostColumnHeader,
  removeClass,
  setAttribute,
} from '../../helpers/dom/element';
import { isUndefined, isDefined } from '../../helpers/mixed';
import { isObject, isPlainObject } from '../../helpers/object';
import { isFunction } from '../../helpers/function';
import { arrayMap } from '../../helpers/array';
import { BasePlugin } from '../base';
import type { IndexesSequence, PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';
import { Hooks } from '../../core/hooks';
import { ColumnStatesManager } from './columnStatesManager';
import { EDITOR_EDIT_GROUP as SHORTCUTS_GROUP_EDITOR } from '../../shortcuts/contexts';
import {
  HEADER_SPAN_CLASS,
  getNextSortOrder,
  areValidSortStates,
  getHeaderSpanElement,
  isFirstLevelColumnHeader,
  wasHeaderClickedProperly,
  warnAboutPluginsConflict,
} from './utils';
import {
  HEADER_ACTION_CLASS,
  HEADER_CLASS_ASC_SORT,
  HEADER_CLASS_DESC_SORT,
  getClassesToRemove,
  getClassesToAdd
} from './domHelpers';
import { rootComparator } from './rootComparator';
import { registerRootComparator, sort } from './sortService';
import { A11Y_SORT } from '../../helpers/a11y';

export interface ColumnSortingConfig {
  column: number;
  sortOrder: 'asc' | 'desc' | 'none';
}

interface ColumnSortingPluginColumnSettings {
  indicator: boolean;
  headerAction: boolean;
  sortEmptyCells: boolean;
  compareFunctionFactory?: unknown;
  [key: string]: unknown;
}

export const PLUGIN_KEY = 'columnSorting';
export const PLUGIN_PRIORITY = 50;
export const APPEND_COLUMN_CONFIG_STRATEGY = 'append';
export const REPLACE_COLUMN_CONFIG_STRATEGY = 'replace';
const SHORTCUTS_GROUP = PLUGIN_KEY;
/**
 * Marks the header container of a column that is showing a sort indicator. The indicator is
 * positioned against that container, so the room it needs is reserved there rather than as padding
 * on the label - padding on the label would enlarge the area that sorts on click, which is exactly
 * what it must not do. A class rather than a `:has()` selector, which is banned in this package.
 */
const CONTAINER_WITH_INDICATOR_CLASS = 'has-sort-indicator';

registerRootComparator(PLUGIN_KEY, rootComparator);

/**
 * A press on a sortable column header, waiting to be resolved on mouse up.
 */
export interface HeaderSortPress {
  column: number;
  isCtrlPressed: boolean;
  /**
   * Settles once the cell that was being edited at press time has finished validating, or `null`
   * when nothing was being edited.
   */
  validation: Promise<void> | null;
}

export interface SortConfig {
  column: number;
  sortOrder: string;
}

Hooks.getSingleton().register('beforeColumnSort');
Hooks.getSingleton().register('afterColumnSort');

/**
 * Tracks the conflicts between `columnSorting` and `multiColumnSorting` options.
 * Only one plugin can be enabled for Handsontable instance. Once one of them is enabled,
 * the other should remain disabled even if it's set to `true`.
 */
const pluginConflictsState = new WeakMap();

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
 * // see the `columns` option documentation: @/api/options.md#columns
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
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Instance of column state manager.
   *
   * @private
   * @type {null|ColumnStatesManager}
   */
  columnStatesManager: ColumnStatesManager | null = null;
  /**
   * Cached column properties from plugin like i.e. `indicator`, `headerAction`.
   *
   * @private
   * @type {null|PhysicalIndexToValueMap}
   */
  columnMetaCache: IndexToValueMap | null = null;
  /**
   * Sort queued by a header press, applied on mouse up unless the press became a column drag.
   */
  #pendingHeaderSort: HeaderSortPress | null = null;
  /**
   * Main settings key designed for the plugin.
   *
   * @private
   * @type {string}
   */
  pluginKey = PLUGIN_KEY;
  /**
   * Plugin indexes cache.
   *
   * @private
   * @type {null|IndexesSequence}
   */
  indexesSequenceCache: IndexesSequence | null = null;

  /**
   * Checks if the plugin is enabled in the Handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ColumnSorting#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!(this.hot.getSettings()[this.pluginKey]);
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    if (
      pluginConflictsState.has(this.hot) &&
      pluginConflictsState.get(this.hot) !== this.pluginKey
    ) {
      this.hot.updateSettings({
        [this.pluginKey]: false
      });
      warnAboutPluginsConflict(pluginConflictsState.get(this.hot), this.pluginKey);

      return;
    }

    if (this.enabled) {
      return;
    }

    pluginConflictsState.set(this.hot, this.pluginKey);

    this.columnStatesManager = new ColumnStatesManager(this.hot, `${this.pluginKey}.sortingStates`);
    this.columnMetaCache = this.hot.columnIndexMapper.createAndRegisterIndexMap(
      `${this.pluginKey}.columnMeta`,
      'physicalIndexToValue',
      (physicalIndex: number) => {
        let visualIndex: number = this.hot.toVisualColumn(physicalIndex);

        if (visualIndex === null) {
          visualIndex = physicalIndex;
        }

        return this.getMergedPluginSettings(visualIndex);
      },
    );

    this.addHook('afterGetColHeader', this.#onAfterGetColHeader);
    this.addHook('beforeOnCellMouseDown', this.#onBeforeOnCellMouseDown);
    this.addHook('afterOnCellMouseDown',
      (event: Event, target: { row: number, col: number }) => this.onAfterOnCellMouseDown(event, target));
    // Primary release signal. On touch devices Walkontable calls its `onMouseUp` directly from
    // `touchend` instead of dispatching a DOM `mouseup`, so a document listener alone would never
    // fire and tapping a header would stop sorting.
    this.addHook('afterOnCellMouseUp', this.#resolvePendingSort);
    // Fallback for a release that lands outside any cell - that is the drag case, and the queued
    // sort still has to be cleared rather than left pending for the next release.
    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'mouseup',
      () => this.#resolvePendingSort());

    this.addHook('afterInit', this.#loadOrSortBySettings);
    this.addHook('afterLoadData', this.#onAfterLoadData);
    this.addHook('afterDataProviderFetch', this.#onAfterDataProviderFetch, -1);

    // TODO: Workaround? It should be refactored / described.
    if (this.hot.view) {
      this.#loadOrSortBySettings();
    }

    this.registerShortcuts();
    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    const clearColHeader = (column: number, TH: HTMLTableCellElement) => {
      const headerSpanElement = getHeaderSpanElement(TH);

      if (isFirstLevelColumnHeader(column, TH) === false || headerSpanElement === null) {
        return;
      }

      this.updateHeaderClasses(headerSpanElement);
      this.#syncIndicatorReserve(headerSpanElement);
    };

    pluginConflictsState.delete(this.hot);

    // Changing header width and removing indicator.
    this.hot.addHook('afterGetColHeader', clearColHeader);
    this.hot.addHookOnce('afterViewRender', () => {
      this.hot.removeHook('afterGetColHeader', clearColHeader);
    });

    this.hot.batchExecution(() => {
      if (this.indexesSequenceCache !== null) {
        this.hot.rowIndexMapper.setIndexesSequence(this.indexesSequenceCache!.getValues());
        this.hot.rowIndexMapper.unregisterMap(this.pluginKey);

        this.indexesSequenceCache = null;
      }
    }, true);

    this.hot.columnIndexMapper.unregisterMap(`${this.pluginKey}.columnMeta`);
    this.columnStatesManager?.destroy();
    this.columnMetaCache = null;
    this.columnStatesManager = null;
    this.#pendingHeaderSort = null;

    this.unregisterShortcuts();
    super.disablePlugin();
  }

  /**
   * Register shortcuts responsible for toggling column sorting functionality.
   *
   * @private
   */
  registerShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      ?.addShortcut({
        keys: [['Enter']],
        callback: () => {
          const activeRange = this.hot.getSelectedRangeActive();

          if (!activeRange) {
            return false;
          }

          const { highlight } = activeRange;

          this.sort(this.getColumnNextConfig(highlight.col ?? 0));

          // prevent default Enter behavior (move to the next row within a selection range)
          return false;
        },
        runOnlyIf: (): boolean => {
          const highlight = this.hot.getSelectedRangeActive()?.highlight;
          const highlightedHeaderElement = (highlight && highlight.row !== null && highlight.col !== null)
            ? this.hot.getCell(highlight.row, highlight.col, true)
            : null;

          return !!(highlight && this.hot.getSelectedRangeActive()?.isSingle() &&
            this.hot.selection.isCellVisible(highlight) && highlight.row !== null &&
            highlight.row < 0 && highlight.col !== null && highlight.col >= 0 &&
            highlightedHeaderElement && isBottomMostColumnHeader(highlightedHeaderElement));
        },
        relativeToGroup: SHORTCUTS_GROUP_EDITOR,
        position: 'before',
        group: SHORTCUTS_GROUP,
      });
  }

  /**
   * Unregister shortcuts responsible for toggling column sorting functionality.
   *
   * @private
   */
  unregisterShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      ?.removeShortcutsByGroup(SHORTCUTS_GROUP);
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
  sort(sortConfig?: SortConfig | SortConfig[]): void {
    const currentSortConfig = this.columnStatesManager!.getSortStates();

    // We always pass configs defined as an array to `beforeColumnSort` and `afterColumnSort` hooks.
    const destinationSortConfigs = this.getNormalizedSortConfigs(sortConfig);

    const sortPossible = this.areValidSortConfigs(destinationSortConfigs);
    const allowSort = this.hot.runHooks('beforeColumnSort', currentSortConfig, destinationSortConfigs, sortPossible);

    if (allowSort === false) {
      return;
    }

    if (currentSortConfig.length === 0 && this.indexesSequenceCache === null) {
      this.indexesSequenceCache =
        this.hot.rowIndexMapper.createAndRegisterIndexMap(this.pluginKey, 'indexesSequence');
      this.indexesSequenceCache.setValues(this.hot.rowIndexMapper.getIndexesSequence());
    }

    if (sortPossible) {
      this.columnStatesManager?.setSortStates(destinationSortConfigs);
      this.sortByPresetSortStates(destinationSortConfigs);
    }

    this.hot.runHooks('afterColumnSort',
      currentSortConfig, sortPossible ? destinationSortConfigs : currentSortConfig, sortPossible);

    if (sortPossible) {
      this.hot.render();
    }
  }

  /**
   * Clear the sort performed on the table.
   */
  clearSort(): void {
    this.sort([]);
  }

  /**
   * Checks if the table is sorted (any column have to be sorted).
   *
   * @returns {boolean}
   */
  isSorted(): boolean {
    return this.enabled && !this.columnStatesManager?.isListOfSortedColumnsEmpty();
  }

  /**
   * Get sort configuration for particular column or for all sorted columns. Objects contain `column` and `sortOrder` properties.
   *
   * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key. They are handled by the `sort` function.
   *
   * @param {number} [column] Visual column index.
   * @returns {undefined|object|Array}
   */
  getSortConfig(column?: number): SortConfig | SortConfig[] | undefined {
    if (column !== undefined) {
      return this.columnStatesManager?.getColumnSortState(column);
    }

    return this.columnStatesManager?.getSortStates() as SortConfig[];
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
   *   this.updateData(newData); // Update data set and re-render the table.
   *
   *   return false; // The blockade for the default sort action.
   * }
   * ```
   *
   * @param {undefined|object|Array} sortConfig Single column sort configuration or full sort configuration (for all sorted columns).
   * The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains
   * sort order (`asc` for ascending, `desc` for descending).
   */
  setSortConfig(sortConfig?: SortConfig | SortConfig[]): void {
    // We always set configs defined as an array.
    const destinationSortConfigs = this.getNormalizedSortConfigs(sortConfig);

    if (this.areValidSortConfigs(destinationSortConfigs)) {
      this.columnStatesManager?.setSortStates(destinationSortConfigs);
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
  getNormalizedSortConfigs(sortConfig: SortConfig | SortConfig[] = []): SortConfig[] {
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
  areValidSortConfigs(sortConfigs: SortConfig[]) {
    const numberOfColumns = this.hot.countCols();

    // We don't translate visual indexes to physical indexes.
    return areValidSortStates(sortConfigs) && sortConfigs.every(({ column }: { column: number }) =>
      column <= numberOfColumns && column >= 0);
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
  getColumnNextConfig(column: number): SortConfig | undefined {
    const sortOrder = this.columnStatesManager?.getSortOrderOfColumn(column);

    if (isDefined(sortOrder)) {
      const nextSortOrder = getNextSortOrder(sortOrder);

      if (nextSortOrder !== undefined) {
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
        sortOrder: getNextSortOrder() ?? 'asc'
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
  getNextSortConfig(columnToChange: number, strategyId = APPEND_COLUMN_CONFIG_STRATEGY) {
    const indexOfColumnToChange = this.columnStatesManager!.getIndexOfColumnInSortQueue(columnToChange);
    const isColumnSorted = indexOfColumnToChange !== -1;
    const currentSortConfig = this.columnStatesManager!.getSortStates();
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

    if (nextColumnConfig !== undefined) {
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
  getPluginColumnConfig(columnConfig: Record<string, unknown>) {
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
  getMergedPluginSettings(column: number): Record<string, unknown> {
    const pluginMainSettings = this.hot.getSettings()[this.pluginKey] as Record<string, unknown>;
    const storedColumnProperties = this.columnStatesManager?.getAllColumnsProperties() ?? {};
    const cellMeta = this.hot.getCellMetaTransient(0, column);
    const columnMeta = Object.getPrototypeOf(cellMeta) as Record<string, unknown>;

    if (Array.isArray(columnMeta.columns)) {
      return Object
        .assign(storedColumnProperties, pluginMainSettings, this.getPluginColumnConfig(columnMeta.columns[column]));

    } else if (isFunction(columnMeta.columns)) {
      const columnConfig = (columnMeta.columns as (col: number) => Record<string, unknown>)(column);

      return Object.assign(storedColumnProperties, pluginMainSettings, this.getPluginColumnConfig(columnConfig));
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
  getFirstCellSettings(column: number): Record<string, unknown> {
    const cellMeta = this.hot.getCellMetaTransient(0, column);

    const cellMetaCopy = Object.create(cellMeta) as Record<string, unknown>;

    cellMetaCopy[this.pluginKey] = this.columnMetaCache?.getValueAtIndex(this.hot.toPhysicalColumn(column));

    return cellMetaCopy;
  }

  /**
   * Get number of rows which should be sorted.
   *
   * @private
   * @param {number} numberOfRows Total number of displayed rows.
   * @returns {number}
   */
  getNumberOfRowsToSort(numberOfRows: number) {
    const settings = this.hot.getSettings();
    const fixedRowsBottom = settings.fixedRowsBottom || 0;

    // `maxRows` option doesn't take into account `minSpareRows` option in this case.
    // `fixedRowsBottom` is excluded from the sort range so footer rows (e.g. SUM formulas)
    // stay pinned and keep their absolute-address references intact.
    if ((settings.maxRows ?? Infinity) <= numberOfRows) {
      return Math.max(0, (settings.maxRows ?? 0) - fixedRowsBottom);
    }

    return Math.max(0, numberOfRows - (settings.minSpareRows ?? 0) - fixedRowsBottom);
  }

  /**
   * Performs the sorting using a stable sort function basing on internal state of sorting.
   *
   * @param {Array} sortConfigs Sort configuration for all sorted columns. Objects contain `column` and `sortOrder` properties.
   * @private
   */
  sortByPresetSortStates(sortConfigs: SortConfig[]) {
    this.hot.rowIndexMapper.setIndexesSequence(this.indexesSequenceCache!.getValues());

    if (sortConfigs.length === 0) {
      return;
    }

    const indexesWithData: [number, ...unknown[]][] = [];
    const numberOfRows = this.hot.countRows();
    const settings = this.hot.getSettings();
    const fixedRowsTop = settings.fixedRowsTop || 0;
    const upperBound = this.getNumberOfRowsToSort(numberOfRows);

    const getDataForSortedColumns = (visualRowIndex: number) =>
      arrayMap(sortConfigs, (sortConfig: SortConfig) => this.hot.getDataAtCell(visualRowIndex, sortConfig.column));

    for (let visualRowIndex = fixedRowsTop; visualRowIndex < upperBound; visualRowIndex += 1) {
      indexesWithData.push([this.hot.toPhysicalRow(visualRowIndex), ...getDataForSortedColumns(visualRowIndex)]);
    }

    const indexesBefore = arrayMap(indexesWithData, (indexWithData: [number, ...unknown[]]) => indexWithData[0]);

    sort(
      indexesWithData,
      this.pluginKey,
      arrayMap(sortConfigs, (sortConfig: SortConfig) => sortConfig.sortOrder),
      arrayMap(sortConfigs, (sortConfig: SortConfig) => this.getFirstCellSettings(sortConfig.column))
    );

    // Append fixedRowsBottom + spareRows (everything between upperBound and numberOfRows)
    for (let visualRowIndex = upperBound; visualRowIndex < numberOfRows; visualRowIndex += 1) {
      indexesWithData.push([visualRowIndex, ...getDataForSortedColumns(visualRowIndex)]);
    }

    const indexesAfter = arrayMap(indexesWithData, (indexWithData: [number, ...unknown[]]) => indexWithData[0]);

    const indexMapping: Map<number, number> = new Map(
      arrayMap(indexesBefore, (indexBefore: number, indexInsideArray: number): [number, number] =>
        [indexBefore, indexesAfter[indexInsideArray]])
    );

    const newIndexesSequence = arrayMap(this.hot.rowIndexMapper.getIndexesSequence(), (physicalIndex: number) => {
      return indexMapping.get(physicalIndex) ?? physicalIndex;
    });

    this.hot.rowIndexMapper.setIndexesSequence(newIndexesSequence);
  }

  /**
   * Sort by predefined plugin configuration.
   */
  #loadOrSortBySettings = () => {
    const allSortSettings = (this.hot.getSettings() as Record<string, unknown>)[this.pluginKey];

    this.sortBySettings(allSortSettings);
  };

  /**
   * Sort the table by provided configuration.
   *
   * @private
   * @param {object} allSortSettings All sort config settings. Object may contain `initialConfig`, `indicator`,
   * `sortEmptyCells`, `headerAction` and `compareFunctionFactory` properties.
   */
  sortBySettings(allSortSettings: unknown) {
    if (isPlainObject(allSortSettings)) {
      this.columnStatesManager!.updateAllColumnsProperties(allSortSettings);

      const { initialConfig } = allSortSettings;

      if (Array.isArray(initialConfig) || isPlainObject(initialConfig)) {
        this.sort(initialConfig as SortConfig | SortConfig[]);
      }

    } else {
      // Extra render for headers. Their width may change.
      this.hot.render();
    }
  }

  /**
   * Callback for the `onAfterGetColHeader` hook. Adds column sorting CSS classes.
   *
   * @param {number} column Visual column index.
   * @param {Element} TH TH HTML element.
   */
  #onAfterGetColHeader = (column: number, TH: HTMLTableCellElement) => {
    const headerSpanElement = getHeaderSpanElement(TH);

    if (isFirstLevelColumnHeader(column, TH) === false || headerSpanElement === null) {
      return;
    }

    const columnSettings = this.getFirstCellSettings(column);
    const pluginSettingsForColumn = columnSettings[this.pluginKey] as ColumnSortingPluginColumnSettings;
    const showSortIndicator = pluginSettingsForColumn.indicator;
    const headerActionEnabled = pluginSettingsForColumn.headerAction;

    this.updateHeaderClasses(
      headerSpanElement,
      this.columnStatesManager ?? undefined,
      column,
      showSortIndicator,
      headerActionEnabled
    );
    this.#syncIndicatorReserve(headerSpanElement);

    if (this.hot.getSettings().ariaTags) {
      const currentSortState = this.columnStatesManager?.getSortOrderOfColumn(column);

      setAttribute(TH, ...A11Y_SORT(currentSortState ? `${currentSortState}ending` : 'none'));
    }
  };

  /**
   * Update header classes.
   *
   * @private
   * @param {HTMLElement} headerSpanElement Header span element.
   * @param {...*} args Extra arguments for helpers.
   */
  updateHeaderClasses(
    headerSpanElement: HTMLElement,
    columnStatesManager?: ColumnStatesManager,
    column?: number,
    showSortIndicator?: boolean,
    headerActionEnabled?: boolean
  ) {
    removeClass(headerSpanElement, getClassesToRemove(headerSpanElement));

    if (this.enabled !== false && columnStatesManager !== undefined && column !== undefined) {
      addClass(headerSpanElement, getClassesToAdd(
        columnStatesManager,
        column,
        showSortIndicator ?? false,
        headerActionEnabled ?? false
      ));
    }
  }

  /**
   * Reserves room for the sort indicator on the header container, matching the state the label
   * was just given.
   *
   * Called from the header render paths, not from `updateHeaderClasses`, so it runs after any
   * subclass override has finished adding its classes. `TableView` rebuilds the container's class
   * list on every render, so this has to run per render.
   *
   * @param {HTMLElement} headerSpanElement The header label element.
   */
  #syncIndicatorReserve(headerSpanElement: HTMLElement) {
    const container = headerSpanElement.parentElement;

    if (container === null) {
      return;
    }

    // `sortAction` is required: the CSS that pulls the indicator out of the flex row is keyed on
    // it. With `headerAction: false` the label shows an indicator but keeps its full width, so
    // reserving would just push it inwards.
    const showsIndicator = hasClass(headerSpanElement, HEADER_ACTION_CLASS) && (
      hasClass(headerSpanElement, HEADER_CLASS_ASC_SORT) ||
      hasClass(headerSpanElement, HEADER_CLASS_DESC_SORT)
    );

    if (showsIndicator) {
      addClass(container, CONTAINER_WITH_INDICATOR_CLASS);
    } else {
      removeClass(container, CONTAINER_WITH_INDICATOR_CLASS);
    }
  }

  /**
   * Overwriting base plugin's `onUpdateSettings` method. Please keep in mind that `onAfterUpdateSettings` isn't called
   * for `updateSettings` in specific situations.
   *
   * @private
   * @param {object} newSettings New settings object.
   */
  onUpdateSettings(newSettings: Record<string, unknown>) {
    super.onUpdateSettings(newSettings);

    if (this.columnMetaCache !== null) {
      // Column meta cache base on settings, thus we should re-init the map.
      this.columnMetaCache.init(this.hot.columnIndexMapper.getNumberOfIndexes());
    }

    const pluginSettings = newSettings[this.pluginKey];

    if (isDefined(pluginSettings)) {
      this.sortBySettings(pluginSettings);
    }
  }

  /**
   * Callback for the `afterLoadData` hook.
   *
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded during the initialization.
   */
  #onAfterLoadData = (initialLoad: boolean) => {
    if (initialLoad === true) {
      // TODO: Workaround? It should be refactored / described.
      if (this.hot.view) {
        this.#loadOrSortBySettings();
      }
    }
  };

  /**
   * Callback for the `afterDataProviderFetch` hook.
   * Keeps header sort state in sync with query `sort` after server-backed `loadData` (same timing as Pagination).
   *
   * @param {object} result [[Hooks#afterDataProviderFetch]] payload; reads `columnSortConfig` only.
   */
  readonly #onAfterDataProviderFetch = (result: { columnSortConfig?: Record<string, unknown>[] }) => {
    this.setSortConfig((result?.columnSortConfig ?? []) as unknown as SortConfig[]);
  };

  /**
   * Indicates if clickable header was clicked.
   *
   * @private
   * @param {MouseEvent} event The `mousedown` event.
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  wasClickableHeaderClicked(event: Event, column: number): boolean {
    const columnSettings = this.getFirstCellSettings(column);
    const pluginSettingsForColumn = columnSettings[this.pluginKey] as ColumnSortingPluginColumnSettings;
    const headerActionEnabled = pluginSettingsForColumn.headerAction;

    return (
      headerActionEnabled && hasClass(eventTargetEl(event)!, HEADER_SPAN_CLASS)
    );
  }

  /**
   * Changes the behavior of selection / dragging.
   *
   * @param {MouseEvent} event The `mousedown` event.
   * @param {CellCoords} coords Visual coordinates.
   * @param {HTMLElement} TD The cell element.
   * @param {object} controller An object with properties `row`, `column` and `cell`. Each property contains
   *                            a boolean value that allows or disallows changing the selection for that particular area.
   */
  #onBeforeOnCellMouseDown = (
    event: Event, coords: { row: number, col: number }, TD: HTMLTableCellElement,
    controller: { column: boolean }
  ) => {
    // Drop any press whose release never arrived - e.g. the window lost focus while the button
    // was held. Without this a stale press would resolve on the next unrelated release and sort
    // a column out of nowhere.
    this.#pendingHeaderSort = null;

    if (wasHeaderClickedProperly(coords.row, coords.col, event) === false) {
      return;
    }

    if (this.wasClickableHeaderClicked(event, coords.col) && this.hot.getShortcutManager().isCtrlPressed()) {
      controller.column = true;
    }
  };

  /**
   * Callback for the `onAfterOnCellMouseDown` hook.
   *
   * Queues the sort rather than running it. The header is also the surface ManualColumnMove
   * drags a column by, so which action the user meant is only known once the button is
   * released: a press that stays put is a click to sort, a press that travels is a drag.
   * Selection changes stay here so the header still reacts the moment it is pressed.
   *
   * @private
   * @param {Event} event Event which are provided by hook.
   * @param {CellCoords} coords Visual coords of the selected cell.
   */
  onAfterOnCellMouseDown(event: Event, coords: { row: number, col: number }) {
    if (wasHeaderClickedProperly(coords.row, coords.col, event) === false) {
      return;
    }

    if (this.wasClickableHeaderClicked(event, coords.col) === false) {
      return;
    }

    const isCtrlPressed = this.hot.getShortcutManager().isCtrlPressed();

    if (isCtrlPressed) {
      this.hot.deselectCell();
      this.hot.selectColumns(coords.col);
    }

    const activeEditor = this.hot.getActiveEditor();
    const awaitsValidation = !!(
      activeEditor?.isOpened() &&
      this.hot.getCellValidator(activeEditor.row!, activeEditor.col!)
    );

    this.#pendingHeaderSort = {
      column: coords.col,
      isCtrlPressed,
      // Subscribed on press, not on release: selecting the column closes the editor and its
      // validation runs in a microtask, so it is already over before mouse up. Reading
      // `awaitsValidation` on release is wrong too - by then the new selection has opened an
      // editor on the highlighted cell.
      validation: awaitsValidation ? new Promise<void>((resolve) => {
        this.hot.addHookOnce('postAfterValidate', () => resolve());
      }) : null,
    };
  }

  /**
   * Applies the sort queued by a header press.
   *
   * Kept separate from the press handler so `MultiColumnSorting` can choose a different sort
   * configuration for the same gesture without repeating the click-versus-drag handling.
   *
   * @private
   * @param {object} press The press that queued this sort.
   */
  applyHeaderClickSort(press: HeaderSortPress) {
    this.sort(this.getColumnNextConfig(press.column));
  }

  /**
   * Resolves a header press on release: sorts, unless ManualColumnMove turned the press into a
   * drag.
   *
   * Safe to call more than once for the same gesture - the queued press is taken first, so
   * whichever release signal arrives first wins and the rest are no-ops.
   */
  #resolvePendingSort = () => {
    const pending = this.#pendingHeaderSort;

    if (pending === null) {
      return;
    }

    this.#pendingHeaderSort = null;

    // Ask ManualColumnMove whether it turned this press into a drag, rather than measuring pointer
    // travel here. Only that plugin knows whether a drag was ever armed - it needs the column
    // selected by its header - so a travel test here would silence the sort on every grid where
    // nothing can consume the gesture. Its state is still set at this point; it resets on its own
    // `mouseup` listener, which runs later in the same dispatch.
    if (this.#isColumnBeingDragged()) {
      return;
    }

    // A cell that was mid-edit must finish validating before the rows move under it. Waited on
    // here, not in `applyHeaderClickSort`, so subclasses that override that seam still get it.
    if (pending.validation === null) {
      this.applyHeaderClickSort(pending);

      return;
    }

    void pending.validation.then(() => this.applyHeaderClickSort(pending));
  };

  /**
   * Whether ManualColumnMove is mid-drag. False when that plugin is absent or disabled.
   */
  #isColumnBeingDragged(): boolean {
    const manualColumnMove = this.hot.getPlugin('manualColumnMove');

    return manualColumnMove?.isDragging() === true;
  }

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    // `BasePlugin.destroy` nulls enumerable own properties, which cannot reach a `#private`
    // field, so drop the queued press here.
    this.#pendingHeaderSort = null;

    // TODO: Probably not supported yet by ESLint: https://github.com/eslint/eslint/issues/11045
    // eslint-disable-next-line no-unused-expressions
    this.columnStatesManager?.destroy();

    super.destroy();
  }
}
