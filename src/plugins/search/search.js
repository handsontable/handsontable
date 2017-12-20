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
 * @private
 * @plugin Search
 */
class Search extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Query method - query(queryStr, [callback], [queryMethod]),
     * where queryStr is a string to find within the table.
     * Use the query() method inside search input listener.
     *
     * @type {Function}
     */
    this.query = void 0;
    /**
     * Callback function is responsible for setting the isSearchResult property
     * - by default DEFAULT_CALLBACK.
     *
     * @type {Function}
     */
    this.callback = DEFAULT_CALLBACK;
    /**
     * Query function is responsible for determining
     * whether a queryStr matches the value stored in a cell
     * - by default DEFAULT_QUERY_METHOD.
     *
     * @type {Function}
     */
    this.queryMethod = DEFAULT_QUERY_METHOD;
    /**
     *  Adds htSearchResult class (or custom) to every cell which isSearchResult property is true
     * - by default DEFAULT_SEARCH_RESULT_CLASS.
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

    this.addHook('afterInit', () => this.onAfterInit());

    this.query = function(queryStr, callback = this.getCallback(), queryMethod = this.getQueryMethod()) {
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
   * The change can be done in two ways: in the configuration object -
   * hot.updateSettings(id,
   *   search: {
   *     callback: myNewCallbackFunction
   *   }
   * ),
   * or by calling it itself - hot.getPlugin('search').setCallback(myNewCallbackFunction).
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
   * The change can be done in two ways: in the configuration object -
   * hot.updateSettings(id,
   *   search: {
   *     queryMethod: myNewQueryMethod
   *   }
   * ),
   * or by calling it itself - hot.getPlugin('search').setQueryMethod(myNewQueryMethod).
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
   * The change can be done in two ways: in the configuration object -
   * hot.updateSettings(id,
   *   search: {
   *     searchResultClass: 'customClass'
   *   }
   * ),
   * or by calling it itself - hot.getPlugin('search').setSearchResultClass(myNewQueryMethod).
   *
   * @param {String} newElementClass
   */
  setSearchResultClass(newElementClass) {
    this.searchResultClass = newElementClass;
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
