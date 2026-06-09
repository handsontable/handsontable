import type { HotInstance } from '../../core/types';
import { BasePlugin } from '../base';
import { isObject } from '../../helpers/object';
import { rangeEach } from '../../helpers/number';
import { isUndefined } from '../../helpers/mixed';

/**
 * Local type-guard narrowing `unknown` to `Record<string, unknown>`.
 * `isObject` is intentionally non-narrowing in the public API.
 *
 * @param {unknown} v The value to check.
 * @returns {boolean}
 */
function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return isObject(v);
}

export const PLUGIN_KEY = 'search';
export const PLUGIN_PRIORITY = 190;
const DEFAULT_SEARCH_RESULT_CLASS = 'htSearchResult';

const DEFAULT_CALLBACK = function(instance: HotInstance, row: number, col: number, data: unknown, testResult: boolean) {
  instance.getCellMeta(row, col).isSearchResult = testResult;
};

const DEFAULT_QUERY_METHOD = function(query: string, value: unknown, cellProperties: Record<string, unknown>) {
  if (isUndefined(query) || query === null || !query.toLocaleLowerCase || query.length === 0) {
    return false;
  }
  if (isUndefined(value) || value === null) {
    return false;
  }

  return String(value).toLocaleLowerCase(cellProperties.locale as string | undefined)
    .indexOf(query.toLocaleLowerCase(cellProperties.locale as string | undefined)) !== -1;
};

/**
 * Per-cell overrides stored in the `search` meta property.
 */
interface CellSearchMeta {
  callback?: typeof DEFAULT_CALLBACK;
  queryMethod?: typeof DEFAULT_QUERY_METHOD;
}

/**
 * @plugin Search
 * @class Search
 *
 * @description
 * The search plugin provides an easy interface to search data across Handsontable.
 *
 * In order to enable search mechanism, {@link Options#search} option must be set to `true`.
 *
 * @example
 * ```js
 * // as boolean
 * search: true
 * // as a object with one or more options
 * search: {
 *   callback: myNewCallbackFunction,
 *   queryMethod: myNewQueryMethod,
 *   searchResultClass: 'customClass'
 * }
 *
 * // Access to search plugin instance:
 * const searchPlugin = hot.getPlugin('search');
 *
 * // Set callback programmatically:
 * searchPlugin.setCallback(myNewCallbackFunction);
 * // Set query method programmatically:
 * searchPlugin.setQueryMethod(myNewQueryMethod);
 * // Set search result cells class programmatically:
 * searchPlugin.setSearchResultClass(customClass);
 * ```
 */
export class Search extends BasePlugin {
  /**
   * Returns the plugin key used to identify and access this plugin within Handsontable.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority value that determines the plugin's initialization order relative to other plugins.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Function called during querying for each cell from the {@link DataMap}.
   *
   * @private
   * @type {Function}
   */
  callback = DEFAULT_CALLBACK;
  /**
   * Query function is responsible for determining whether a query matches the value stored in a cell.
   *
   * @private
   * @type {Function}
   */
  queryMethod = DEFAULT_QUERY_METHOD;
  /**
   * Class name added to each cell that belongs to the searched query.
   *
   * @private
   * @type {string}
   */
  searchResultClass = DEFAULT_SEARCH_RESULT_CLASS;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link AutoRowSize#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const searchSettings = this.hot.getSettings()[PLUGIN_KEY];

    this.updatePluginSettings(searchSettings as Record<string, unknown>);

    this.addHook('beforeRenderer', this.#onBeforeRenderer);

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    const beforeRendererCallback = (
      td: HTMLTableCellElement, row: number, col: number, prop: string | number,
      value: string, cellProperties: Record<string, unknown>
    ) => this.#onBeforeRenderer(td, row, col, prop, value, cellProperties);

    this.hot.addHook('beforeRenderer', beforeRendererCallback);
    this.hot.addHookOnce('afterViewRender', () => {
      this.hot.removeHook('beforeRenderer', beforeRendererCallback);
    });

    super.disablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`search`](@/api/options.md#search)
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Makes the query.
   *
   * @param {string} queryStr Value to be search.
   * @param {Function} [callback] Callback function performed on cells with values which matches to the searched query.
   * @param {Function} [queryMethod] Query function responsible for determining whether a query matches the value stored in a cell.
   * @returns {object[]} Return an array of objects with `row`, `col`, `data` properties or empty array.
   */
  query(queryStr: string, callback = this.getCallback(), queryMethod = this.getQueryMethod()): unknown[] {
    const rowCount = this.hot.countRows();
    const colCount = this.hot.countCols();
    const queryResult: unknown[] = [];
    const instance = this.hot;

    rangeEach(0, rowCount - 1, (rowIndex) => {
      rangeEach(0, colCount - 1, (colIndex) => {
        const cellData = this.hot.getDataAtCell(rowIndex, colIndex);
        const cellProperties = this.hot.getCellMeta(rowIndex, colIndex);
        // cellProperties.search is unknown in CellMeta; assert once to the known shape
        const cellSearch = cellProperties.search as CellSearchMeta | undefined;
        const cellCallback = cellSearch?.callback ?? callback;
        const cellQueryMethod = cellSearch?.queryMethod ?? queryMethod;
        const testResult = cellQueryMethod(queryStr, cellData, cellProperties);

        if (testResult) {
          const singleResult = {
            row: rowIndex,
            col: colIndex,
            data: cellData,
          };

          queryResult.push(singleResult);
        }

        if (cellCallback) {
          cellCallback(instance, rowIndex, colIndex, cellData, testResult);
        }
      });
    });

    return queryResult;
  }

  /**
   * Gets the callback function.
   *
   * @returns {Function} Return the callback function.
   */
  getCallback(): typeof DEFAULT_CALLBACK {
    return this.callback;
  }

  /**
   * Sets the callback function. This function will be called during querying for each cell.
   *
   * @param {Function} newCallback A callback function.
   */
  setCallback(newCallback: typeof DEFAULT_CALLBACK): void {
    this.callback = newCallback;
  }

  /**
   * Gets the query method function.
   *
   * @returns {Function} Return the query method.
   */
  getQueryMethod(): typeof DEFAULT_QUERY_METHOD {
    return this.queryMethod;
  }

  /**
   * Sets the query method function. The function is responsible for determining whether a query matches the value stored in a cell.
   *
   * @param {Function} newQueryMethod A function with specific match logic.
   */
  setQueryMethod(newQueryMethod: typeof DEFAULT_QUERY_METHOD): void {
    this.queryMethod = newQueryMethod;
  }

  /**
   * Gets search result cells class name.
   *
   * @returns {string} Return the cell class name.
   */
  getSearchResultClass(): string {
    return this.searchResultClass;
  }

  /**
   * Sets search result cells class name. This class name will be added to each cell that belongs to the searched query.
   *
   * @param {string} newElementClass CSS class name.
   */
  setSearchResultClass(newElementClass: string): void {
    this.searchResultClass = newElementClass;
  }

  /**
   * Updates the settings of the plugin.
   *
   * @param {object} searchSettings The plugin settings, taken from Handsontable configuration.
   * @private
   */
  updatePluginSettings(searchSettings: Record<string, unknown>) {
    if (isObject(searchSettings)) {
      if (searchSettings.searchResultClass) {
        this.setSearchResultClass(String(searchSettings.searchResultClass));
      }

      if (searchSettings.queryMethod) {
        this.setQueryMethod(searchSettings.queryMethod as typeof DEFAULT_QUERY_METHOD);
      }

      if (searchSettings.callback) {
        this.setCallback(searchSettings.callback as typeof DEFAULT_CALLBACK);
      }
    }
  }

  /**
   * The `beforeRenderer` hook callback.
   *
   * @param {HTMLTableCellElement} TD The rendered `TD` element.
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @param {string|number} prop Column property name or a column index, if datasource is an array of arrays.
   * @param {string} value Value of the rendered cell.
   * @param {object} cellProperties Object containing the cell's properties.
   */
  #onBeforeRenderer = (
    TD: HTMLTableCellElement, row: number, col: number, prop: string | number,
    value: string, cellProperties: Record<string, unknown>
  ) => {
    // TODO: #4972
    const className = cellProperties.className || [];
    let classArray = [];

    if (typeof className === 'string') {
      classArray = className.split(' ');

    } else if (Array.isArray(className)) {
      classArray.push(...className);
    }

    if (this.isEnabled() && cellProperties.isSearchResult) {
      if (!classArray.includes(this.searchResultClass)) {
        classArray.push(`${this.searchResultClass}`);
      }

    } else if (classArray.includes(this.searchResultClass)) {
      classArray.splice(classArray.indexOf(this.searchResultClass), 1);
    }

    cellProperties.className = classArray.join(' ');
  };

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
