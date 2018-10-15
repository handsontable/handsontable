'use strict';

exports.__esModule = true;
exports.ColumnStatesManager = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object = require('../../helpers/object');

var _array = require('../../helpers/array');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var inheritedColumnProperties = ['sortEmptyCells', 'indicator', 'headerAction', 'compareFunctionFactory'];

var SORT_EMPTY_CELLS_DEFAULT = false;
var SHOW_SORT_INDICATOR_DEFAULT = true;
var HEADER_ACTION_DEFAULT = true;

/**
 * Store and manages states of sorted columns.
 *
 * @class ColumnStatesManager
 * @plugin ColumnSorting
 */
// eslint-disable-next-line import/prefer-default-export

var ColumnStatesManager = exports.ColumnStatesManager = function () {
  function ColumnStatesManager() {
    _classCallCheck(this, ColumnStatesManager);

    /**
     * Queue of sort states containing sorted columns and their orders (Array of objects containing `column` and `sortOrder` properties).
     *
     * @type {Array}
     */
    this.sortedColumnsStates = [];
    /**
     * Determines whether we should sort empty cells.
     *
     * @type {Boolean}
     */
    this.sortEmptyCells = SORT_EMPTY_CELLS_DEFAULT;
    /**
     * Determines whether indicator should be visible (for sorted columns).
     *
     * @type {Boolean}
     */
    this.indicator = SHOW_SORT_INDICATOR_DEFAULT;
    /**
     * Determines whether click on the header perform sorting.
     *
     * @type {Boolean}
     */
    this.headerAction = HEADER_ACTION_DEFAULT;
    /**
     * Determines compare function factory. Method get as parameters `sortOder` and `columnMeta` and return compare function.
     */
    this.compareFunctionFactory = void 0;
  }

  /**
   * Update column properties which affect the sorting result.
   *
   * **Note**: All column properties can be overwritten by [columns](https://docs.handsontable.com/pro/Options.html#columns) option.
   *
   * @param {Object} allSortSettings Column sorting plugin's configuration object.
   */


  _createClass(ColumnStatesManager, [{
    key: 'updateAllColumnsProperties',
    value: function updateAllColumnsProperties(allSortSettings) {
      var _this = this;

      if (!(0, _object.isObject)(allSortSettings)) {
        return;
      }

      (0, _object.objectEach)(allSortSettings, function (newValue, propertyName) {
        if (inheritedColumnProperties.includes(propertyName)) {
          _this[propertyName] = newValue;
        }
      });
    }

    /**
     * Get all column properties which affect the sorting result.
     *
     * @returns {Object}
     */

  }, {
    key: 'getAllColumnsProperties',
    value: function getAllColumnsProperties() {
      var columnProperties = {
        sortEmptyCells: this.sortEmptyCells,
        indicator: this.indicator,
        headerAction: this.headerAction
      };

      if (typeof this.compareFunctionFactory === 'function') {
        columnProperties.compareFunctionFactory = this.compareFunctionFactory;
      }

      return columnProperties;
    }

    /**
     * Get index of first sorted column.
     *
     * @returns {Number|undefined}
     */

  }, {
    key: 'getFirstSortedColumn',
    value: function getFirstSortedColumn() {
      var firstSortedColumn = void 0;

      if (this.getNumberOfSortedColumns() > 0) {
        firstSortedColumn = this.sortedColumnsStates[0].column;
      }

      return firstSortedColumn;
    }

    /**
     * Get sort order of column.
     *
     * @param {Number} searchedColumn Physical column index.
     * @returns {String|undefined} Sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).
     */

  }, {
    key: 'getSortOrderOfColumn',
    value: function getSortOrderOfColumn(searchedColumn) {
      var searchedState = this.sortedColumnsStates.find(function (_ref) {
        var column = _ref.column;
        return searchedColumn === column;
      });
      var sortOrder = void 0;

      if ((0, _object.isObject)(searchedState)) {
        sortOrder = searchedState.sortOrder;
      }

      return sortOrder;
    }

    /**
     * Get list of sorted columns.
     *
     * @returns {Array}
     */

  }, {
    key: 'getSortedColumns',
    value: function getSortedColumns() {
      return (0, _array.arrayMap)(this.sortedColumnsStates, function (_ref2) {
        var column = _ref2.column;
        return column;
      });
    }

    /**
     * Get order of particular column in the states queue.
     *
     * @param {Number} column Physical column index.
     * @returns {Number}
     */

  }, {
    key: 'getIndexOfColumnInSortQueue',
    value: function getIndexOfColumnInSortQueue(column) {
      return this.getSortedColumns().indexOf(column);
    }

    /**
     * Get number of sorted columns.
     *
     * @returns {Number}
     */

  }, {
    key: 'getNumberOfSortedColumns',
    value: function getNumberOfSortedColumns() {
      return this.sortedColumnsStates.length;
    }

    /**
     * Get if list of sorted columns is empty.
     *
     * @returns {Boolean}
     */

  }, {
    key: 'isListOfSortedColumnsEmpty',
    value: function isListOfSortedColumnsEmpty() {
      return this.getNumberOfSortedColumns() === 0;
    }

    /**
     * Get if particular column is sorted.
     *
     * @param {Number} column Physical column index.
     * @returns {Boolean}
     */

  }, {
    key: 'isColumnSorted',
    value: function isColumnSorted(column) {
      return this.getSortedColumns().includes(column);
    }

    /**
     * Get states for all sorted columns.
     *
     * @returns {Array}
     */

  }, {
    key: 'getSortStates',
    value: function getSortStates() {
      return (0, _object.deepClone)(this.sortedColumnsStates);
    }

    /**
     * Get sort state for particular column. Object contains `column` and `sortOrder` properties.
     *
     * **Note**: Please keep in mind that returned objects expose **physical** column index under the `column` key.
     *
     * @param {Number} column Physical column index.
     * @returns {Object|undefined}
     */

  }, {
    key: 'getColumnSortState',
    value: function getColumnSortState(column) {
      if (this.isColumnSorted(column)) {
        return (0, _object.deepClone)(this.sortedColumnsStates[this.getIndexOfColumnInSortQueue(column)]);
      }
    }

    /**
     * Set all sorted columns states.
     *
     * @param {Array} sortStates
     */

  }, {
    key: 'setSortStates',
    value: function setSortStates(sortStates) {
      this.sortedColumnsStates = sortStates;
    }

    /**
     * Destroy the state manager.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.sortedColumnsStates.length = 0;
      this.sortedColumnsStates = null;
    }
  }]);

  return ColumnStatesManager;
}();