import BasePlugin from './../_base';
import {registerPlugin} from './../../plugins';
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
     * Function called during querying for each cell from the {@link DataMap}.
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
     * Class name added to each cell that belongs to the searched query.
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
    this.updatePluginSettings(searchSettings);

    this.addHook('beforeRenderer', (...args) => this.onBeforeRenderer(...args));

    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    const beforeRendererCallback = (...args) => this.onBeforeRenderer(...args);

    this.hot.addHook('beforeRenderer', beforeRendererCallback);
    this.hot.addHookOnce('afterRender', () => {
      this.hot.removeHook('beforeRenderer', beforeRendererCallback);
    });

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
   * @param {Function} [callback] Callback function performed on cells with values which matches to the searched query.
   * @param {Function} [queryMethod] Query function responsible for determining whether a query matches the value stored in a cell.
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
   * @returns {String} Return the cell class.
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
   * Updates the settings of the plugin.
   *
   * @param {Object} searchSettings The plugin settings, taken from Handsontable configuration.
   * @private
   */
  updatePluginSettings(searchSettings) {
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

  /** *
   * The `beforeRenderer` hook callback.
   *
   * @private
   * @param {HTMLTableCellElement} TD The rendered `TD` element.
   * @param {Number} row Visual row index.
   * @param {Number} col Visual column index.
   * @param {String | Number} prop Column property name or a column index, if datasource is an array of arrays.
   * @param {String} value Value of the rendered cell.
   * @param {Object} cellProperties Object containing the cell's properties.
   */
  onBeforeRenderer(TD, row, col, prop, value, cellProperties) {
    // TODO: #4972
    const className = cellProperties.className || [];
    let classArray = [];

    if (typeof className === 'string') {
      classArray = className.split(' ');

    } else {
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
