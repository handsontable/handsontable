import BasePlugin from './../_base';
import SearchCellDecorator from './cellDecorator';
import {registerPlugin} from './../../plugins';
import {registerRenderer, getRenderer} from './../../renderers';
import {isObject} from './../../helpers/object';
import {rangeEach} from './../../helpers/number';
import {isUndefined} from './../../helpers/mixed';

const DEFAULT_SEARCH_RESULT_CLASS = 'htSearchResult';

const DEFAULT_CALLBACK = function(instance, row, col, data, testResult) {
  instance.getCellMeta(row, col).isSearchResult = testResult;
};

const DEFAULT_QUERY_METHOD = function(query, value) {
  if (isUndefined(query) || query === null || !query.toLowerCase || query.length === 0) {
    return false;
  }
  if (isUndefined(value) || value === null) {
    return false;
  }

  return value.toString().toLowerCase().indexOf(query.toLowerCase()) !== -1;
};

const originalBaseRenderer = getRenderer('base');

/**
 * @plugin Search
 *
 * @example
 *
 * ```js
 * ...
 *  // as boolean
 *  search: true
 *
 *  // as a object with one or more options
 *  search: {
 *    callback: myNewCallbackFunction,
 *    queryMethod: myNewQueryMethod,
 *    searchResultClass: 'customClass'
 *  }
 *
 * // Access to search plugin instance:
 * var searchPlugin = hot.getPlugin('search');
 *
 * // Set callback programmatically:
 * searchPlugin.setCallback(myNewCallbackFunction);
 * // Set query method programmatically:
 * searchPlugin.setQueryMethod(myNewQueryMethod);
 * // Set search result cells class programmatically:
 * searchPlugin.setSearchResultClass(customClass);
 * ...
 * ```
 */
class Search extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Callback function is responsible for setting the cell's `isSearchResult` property.
     *
     * @type {Function}
     */
    this.callback = DEFAULT_CALLBACK;
    /**
     * Query function is responsible for determining whether a query matches the value stored in a cell.
     *
     * @type {Function}
     */
    this.queryMethod = DEFAULT_QUERY_METHOD;
    /**
     *  Class added to every cell which `isSearchResult` property is true.
     *
     * @type {String}
     */
    this.searchResultClass = DEFAULT_SEARCH_RESULT_CLASS;
  }

  /**
   * Check if the plugin is enabled in the Handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().search;
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const searchSettings = this.hot.getSettings().search;
    this.checkPluginSettings(searchSettings);

    this.addHook('afterInit', () => this.onAfterInit());

    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Query method - used inside search input listener.
   *
   * @param {String} queryStr Searched value.
   * @param {Function} [callback=DEFAULT_CALLBACK] Callback function responsible for setting the cell's `isSearchResult` property.
   * @param {Function} [queryMethod=DEFAULT_QUERY_METHOD] Query function responsible for determining whether a query matches the value stored in a cell.
   *
   * @returns {Array} Return array of objects with `row`, `col`, `data` properties or empty array.
   */
  query(queryStr, callback = this.getCallback(), queryMethod = this.getQueryMethod()) {
    const rowCount = this.hot.countRows();
    const colCount = this.hot.countCols();
    const queryResult = [];
    const instance = this.hot;

    rangeEach(0, rowCount - 1, (rowIndex) => {
      rangeEach(0, colCount - 1, (colIndex) => {
        const cellData = this.hot.getDataAtCell(rowIndex, colIndex);
        const cellProperties = this.hot.getCellMeta(rowIndex, colIndex);
        const cellCallback = cellProperties.search.callback || callback;
        const cellQueryMethod = cellProperties.search.queryMethod || queryMethod;
        const testResult = cellQueryMethod(queryStr, cellData);

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
  };

  /**
   * Get callback function.
   *
   * @returns {Function} Return the callback function.
   */
  getCallback() {
    return this.callback;
  }

  /**
   * Set callback function.
   *
   * @param {Function} newCallback
   */
  setCallback(newCallback) {
    this.callback = newCallback;
  }

  /**
   * Get queryMethod function.
   *
   * @returns {Function} Return the query method.
   */
  getQueryMethod() {
    return this.queryMethod;
  }

  /**
   * Set queryMethod function.
   *
   * @param {Function} newQueryMethod
   */
  setQueryMethod(newQueryMethod) {
    this.queryMethod = newQueryMethod;
  }

  /**
   * Get search result cells class.
   *
   * @returns {Function} Return the cell class.
   */
  getSearchResultClass() {
    return this.searchResultClass;
  }

  /**
   * Set search result cells class.
   *
   * @param {String} newElementClass
   */
  setSearchResultClass(newElementClass) {
    this.searchResultClass = newElementClass;
  }

  /**
   * Checks the settings of the plugin.
   *
   * @param {Object} searchSettings The plugin settings, taken from Handsontable configuration.
   * @private
   */
  checkPluginSettings(searchSettings) {
    if (isObject(searchSettings)) {
      if (searchSettings.searchResultClass) {
        this.setSearchResultClass(searchSettings.searchResultClass);
      }

      if (searchSettings.queryMethod) {
        this.setQueryMethod(searchSettings.queryMethod);
      }

      if (searchSettings.callback) {
        this.setCallback(searchSettings.callback);
      }
    }
  }

  /**
   * On `afterInit` hook callback.
   *
   * @private
   */
  onAfterInit() {
    registerRenderer('base', (instance, ...params) => {
      originalBaseRenderer(instance, ...params);
      SearchCellDecorator(instance, ...params);
    });
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    super.destroy();
  }
}

registerPlugin('search', Search);

export default Search;
