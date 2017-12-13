import BasePlugin from './../_base';
import SearchCellDecorator from './cellDecorator';
import {registerPlugin} from './../../plugins';
import {registerRenderer, getRenderer} from './../../renderers';
import {isObject} from './../../helpers/object';
import {rangeEach} from './../../helpers/number';

const DEFAULT_SEARCH_RESULT_CLASS = 'htSearchResult';

const DEFAULT_CALLBACK = function(instance, row, col, data, testResult) {
  instance.getCellMeta(row, col).isSearchResult = testResult;
};

const DEFAULT_QUERY_METHOD = function(query, value) {
  if (typeof query === 'undefined' || query === null || !query.toLowerCase || query.length === 0) {
    return false;
  }
  if (typeof value === 'undefined' || value === null) {
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
     * Query method.
     *
     * @type {Function}
     */
    this.query = void 0;
    /**
     * Callback function - by default DEFAULT_CALLBACK.
     *
     * @type {Function}
     */
    this.callback = DEFAULT_CALLBACK;
    /**
     * Query function - by default DEFAULT_QUERY_METHOD.
     *
     * @type {Function}
     */
    this.queryMethod = DEFAULT_QUERY_METHOD;
    /**
     * Search class - by default DEFAULT_SEARCH_RESULT_CLASS.
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

    this.query = function(queryStr, callback, queryMethod) {
      const rowCount = this.hot.countRows();
      const colCount = this.hot.countCols();
      const queryResult = [];
      const instance = this.hot;

      if (!callback) {
        callback = this.getCallback();
      }

      if (!queryMethod) {
        queryMethod = this.getQueryMethod();
      }

      rangeEach(0, rowCount - 1, (rowIndex) => {
        rangeEach(0, colCount - 1, (colIndex) => {
          let cellData = this.hot.getDataAtCell(rowIndex, colIndex);
          let cellProperties = this.hot.getCellMeta(rowIndex, colIndex);
          let cellCallback = cellProperties.search.callback || callback;
          let cellQueryMethod = cellProperties.search.queryMethod || queryMethod;
          let testResult = cellQueryMethod(queryStr, cellData);

          if (testResult) {
            let singleResult = {
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
   * Get searchResultClass class.
   *
   */
  getSearchResultClass() {
    return this.searchResultClass;
  }

  /**
   * Set searchResultClass class.
   *
   * @param {String} newSearchResultClass
   */
  setSearchResultClass(newSearchResultClass) {
    this.searchResultClass = newSearchResultClass;
  }

  /**
   * On `afterInit` hook callback.
   *
   * @private
   */
  onAfterInit(TD, row, col, prop, value, cellProperties) {
    registerRenderer('base', function(instance, TD, row, col, prop, value, cellProperties) {
      originalBaseRenderer.apply(instance, arguments);
      SearchCellDecorator.apply(instance, arguments);
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
