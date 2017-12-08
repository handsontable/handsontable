import BasePlugin from './../_base';
import SearchCellDecorator from './cellDecorator';
import {registerPlugin} from './../../plugins';
import {registerRenderer, getRenderer} from './../../renderers';

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
     * Default Callback function.
     *
     * @type {Function}
     */
    this.defaultCallback = DEFAULT_CALLBACK;
    /**
     * Default Query function.
     *
     * @type {Function}
     */
    this.defaultQueryMethod = DEFAULT_QUERY_METHOD;
    /**
     * Default search class.
     *
     * @type {String}
     */
    this.defaultSearchResultClass = DEFAULT_SEARCH_RESULT_CLASS;
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

    if (typeof searchSettings === 'object') {
      if (searchSettings.searchResultClass) {
        this.setDefaultSearchResultClass(searchSettings.searchResultClass);
      }
    }

    this.addHook('beforeRenderer', () => this.onBeforeRenderer());

    this.query = function(queryStr, callback, queryMethod) {
      const rowCount = this.hot.countRows();
      const colCount = this.hot.countCols();
      const queryResult = [];
      const instance = this.hot;

      if (!callback) {
        callback = this.getDefaultCallback();
      }

      if (!queryMethod) {
        queryMethod = this.getDefaultQueryMethod();
      }

      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        for (let colIndex = 0; colIndex < colCount; colIndex++) {
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
        }
      }

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
   * Get defaultCallback function.
   *
   */
  getDefaultCallback() {
    return this.defaultCallback;
  }

  /**
   * Set defaultCallback function.
   *
   * @param {Function} newDefaultCallback
   */
  setDefaultCallback(newDefaultCallback) {
    this.defaultCallback = newDefaultCallback;
  }

  /**
   * Get defaultQueryMethod function.
   *
   */
  getDefaultQueryMethod() {
    return this.defaultQueryMethod;
  }

  /**
   * Set defaultQueryMethod function.
   *
   * @param {Function} newDefaultQueryMethod
   */
  setDefaultQueryMethod(newDefaultQueryMethod) {
    this.defaultQueryMethod = newDefaultQueryMethod;
  }

  /**
   * Get defaultSearchResultClass class.
   *
   */
  getDefaultSearchResultClass() {
    return this.defaultSearchResultClass;
  }

  /**
   * Set defaultSearchResultClass class.
   *
   * @param {String} newSearchResultClass
   */
  setDefaultSearchResultClass(newSearchResultClass) {
    this.defaultSearchResultClass = newSearchResultClass;
  }

  /**
   * On before renderer.
   *
   * @private
   */
  onBeforeRenderer(TD, row, col, prop, value, cellProperties) {
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
