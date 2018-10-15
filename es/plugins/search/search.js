var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import BasePlugin from './../_base';
import { registerPlugin } from './../../plugins';
import { isObject } from './../../helpers/object';
import { rangeEach } from './../../helpers/number';
import { isUndefined } from './../../helpers/mixed';

var DEFAULT_SEARCH_RESULT_CLASS = 'htSearchResult';

var DEFAULT_CALLBACK = function DEFAULT_CALLBACK(instance, row, col, data, testResult) {
  instance.getCellMeta(row, col).isSearchResult = testResult;
};

var DEFAULT_QUERY_METHOD = function DEFAULT_QUERY_METHOD(query, value) {
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

var Search = function (_BasePlugin) {
  _inherits(Search, _BasePlugin);

  function Search(hotInstance) {
    _classCallCheck(this, Search);

    /**
     * Function called during querying for each cell from the {@link DataMap}.
     *
     * @private
     * @type {Function}
     */
    var _this = _possibleConstructorReturn(this, (Search.__proto__ || Object.getPrototypeOf(Search)).call(this, hotInstance));

    _this.callback = DEFAULT_CALLBACK;
    /**
     * Query function is responsible for determining whether a query matches the value stored in a cell.
     *
     * @private
     * @type {Function}
     */
    _this.queryMethod = DEFAULT_QUERY_METHOD;
    /**
     * Class name added to each cell that belongs to the searched query.
     *
     * @private
     * @type {String}
     */
    _this.searchResultClass = DEFAULT_SEARCH_RESULT_CLASS;
    return _this;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link AutoRowSize#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */


  _createClass(Search, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return this.hot.getSettings().search;
    }

    /**
     * Enables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'enablePlugin',
    value: function enablePlugin() {
      var _this2 = this;

      if (this.enabled) {
        return;
      }

      var searchSettings = this.hot.getSettings().search;
      this.updatePluginSettings(searchSettings);

      this.addHook('beforeRenderer', function () {
        return _this2.onBeforeRenderer.apply(_this2, arguments);
      });

      _get(Search.prototype.__proto__ || Object.getPrototypeOf(Search.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Disables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      var _this3 = this;

      var beforeRendererCallback = function beforeRendererCallback() {
        return _this3.onBeforeRenderer.apply(_this3, arguments);
      };

      this.hot.addHook('beforeRenderer', beforeRendererCallback);
      this.hot.addHookOnce('afterRender', function () {
        _this3.hot.removeHook('beforeRenderer', beforeRendererCallback);
      });

      _get(Search.prototype.__proto__ || Object.getPrototypeOf(Search.prototype), 'disablePlugin', this).call(this);
    }

    /**
     * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
     */

  }, {
    key: 'updatePlugin',
    value: function updatePlugin() {
      this.disablePlugin();
      this.enablePlugin();

      _get(Search.prototype.__proto__ || Object.getPrototypeOf(Search.prototype), 'updatePlugin', this).call(this);
    }

    /**
     * Makes the query.
     *
     * @param {String} queryStr Value to be search.
     * @param {Function} [callback] Callback function performed on cells with values which matches to the searched query.
     * @param {Function} [queryMethod] Query function responsible for determining whether a query matches the value stored in a cell.
     * @returns {Object[]} Return an array of objects with `row`, `col`, `data` properties or empty array.
     */

  }, {
    key: 'query',
    value: function query(queryStr) {
      var _this4 = this;

      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.getCallback();
      var queryMethod = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.getQueryMethod();

      var rowCount = this.hot.countRows();
      var colCount = this.hot.countCols();
      var queryResult = [];
      var instance = this.hot;

      rangeEach(0, rowCount - 1, function (rowIndex) {
        rangeEach(0, colCount - 1, function (colIndex) {
          var cellData = _this4.hot.getDataAtCell(rowIndex, colIndex);
          var cellProperties = _this4.hot.getCellMeta(rowIndex, colIndex);
          var cellCallback = cellProperties.search.callback || callback;
          var cellQueryMethod = cellProperties.search.queryMethod || queryMethod;
          var testResult = cellQueryMethod(queryStr, cellData);

          if (testResult) {
            var singleResult = {
              row: rowIndex,
              col: colIndex,
              data: cellData
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

  }, {
    key: 'getCallback',
    value: function getCallback() {
      return this.callback;
    }

    /**
     * Sets the callback function. This function will be called during querying for each cell.
     *
     * @param {Function} newCallback
     */

  }, {
    key: 'setCallback',
    value: function setCallback(newCallback) {
      this.callback = newCallback;
    }

    /**
     * Gets the query method function.
     *
     * @returns {Function} Return the query method.
     */

  }, {
    key: 'getQueryMethod',
    value: function getQueryMethod() {
      return this.queryMethod;
    }

    /**
     * Sets the query method function. The function is responsible for determining whether a query matches the value stored in a cell.
     *
     * @param {Function} newQueryMethod
     */

  }, {
    key: 'setQueryMethod',
    value: function setQueryMethod(newQueryMethod) {
      this.queryMethod = newQueryMethod;
    }

    /**
     * Gets search result cells class name.
     *
     * @returns {String} Return the cell class name.
     */

  }, {
    key: 'getSearchResultClass',
    value: function getSearchResultClass() {
      return this.searchResultClass;
    }

    /**
     * Sets search result cells class name. This class name will be added to each cell that belongs to the searched query.
     *
     * @param {String} newElementClass
     */

  }, {
    key: 'setSearchResultClass',
    value: function setSearchResultClass(newElementClass) {
      this.searchResultClass = newElementClass;
    }

    /**
     * Updates the settings of the plugin.
     *
     * @param {Object} searchSettings The plugin settings, taken from Handsontable configuration.
     * @private
     */

  }, {
    key: 'updatePluginSettings',
    value: function updatePluginSettings(searchSettings) {
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

  }, {
    key: 'onBeforeRenderer',
    value: function onBeforeRenderer(TD, row, col, prop, value, cellProperties) {
      // TODO: #4972
      var className = cellProperties.className || [];
      var classArray = [];

      if (typeof className === 'string') {
        classArray = className.split(' ');
      } else {
        var _classArray;

        (_classArray = classArray).push.apply(_classArray, _toConsumableArray(className));
      }

      if (this.isEnabled() && cellProperties.isSearchResult) {
        if (!classArray.includes(this.searchResultClass)) {
          classArray.push('' + this.searchResultClass);
        }
      } else if (classArray.includes(this.searchResultClass)) {
        classArray.splice(classArray.indexOf(this.searchResultClass), 1);
      }

      cellProperties.className = classArray.join(' ');
    }

    /**
     * Destroys the plugin instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      _get(Search.prototype.__proto__ || Object.getPrototypeOf(Search.prototype), 'destroy', this).call(this);
    }
  }]);

  return Search;
}(BasePlugin);

registerPlugin('search', Search);

export default Search;