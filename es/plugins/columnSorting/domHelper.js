var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable import/prefer-default-export */

import { ASC_SORT_STATE, DESC_SORT_STATE } from './utils';

var HEADER_CLASS_ASC_SORT = 'ascending';
var HEADER_CLASS_DESC_SORT = 'descending';
var HEADER_CLASS_INDICATOR_DISABLED = 'indicatorDisabled';
// DIFF - MultiColumnSorting & ColumnSorting: removed CSS class definition related to the number indicators.

export var HEADER_SORT_CLASS = 'columnSorting';
export var HEADER_ACTION_CLASS = 'sortAction';

var orderToCssClass = new Map([[ASC_SORT_STATE, HEADER_CLASS_ASC_SORT], [DESC_SORT_STATE, HEADER_CLASS_DESC_SORT]]);

/**
 * Helper for the column sorting plugin. Manages the added and removed classes to DOM elements basing on state of sorting.
 *
 * @class DomHelper
 * @plugin ColumnSorting
 */
export var DomHelper = function () {
  function DomHelper(columnStatesManager) {
    _classCallCheck(this, DomHelper);

    /**
     * Instance of column states manager.
     *
     * @private
     */
    this.columnStatesManager = columnStatesManager;
  }

  /**
   * Get CSS classes which should be added to particular column header.
   *
   * @param {Number} column Physical column index.
   * @param {Boolean} showSortIndicator Indicates if indicator should be shown for the particular column.
   * @param {Boolean} headerAction Indicates if header click to sort should be possible.
   * @returns {Array} Array of CSS classes.
   */


  _createClass(DomHelper, [{
    key: 'getAddedClasses',
    value: function getAddedClasses(column, showSortIndicator, headerAction) {
      var cssClasses = [HEADER_SORT_CLASS];

      if (headerAction) {
        cssClasses.push(HEADER_ACTION_CLASS);
      }

      if (showSortIndicator === false) {
        cssClasses.push(HEADER_CLASS_INDICATOR_DISABLED);
      } else if (this.columnStatesManager.isColumnSorted(column)) {
        var columnOrder = this.columnStatesManager.getSortOrderOfColumn(column);

        cssClasses.push(orderToCssClass.get(columnOrder));

        // DIFF - MultiColumnSorting & ColumnSorting: removed manipulation on CSS classes related to the number indicators.
      }

      return cssClasses;
    }

    /**
     * Get CSS classes which should be removed from column header.
     *
     * @returns {Array} Array of CSS classes.
     */

  }, {
    key: 'getRemovedClasses',
    value: function getRemovedClasses() {
      // DIFF - MultiColumnSorting & ColumnSorting: removed manipulation on CSS classes related to the number indicators, removed function argument.

      return Array.from(orderToCssClass.values()).concat(HEADER_ACTION_CLASS, HEADER_CLASS_INDICATOR_DISABLED, HEADER_SORT_CLASS);
    }

    /**
     * Destroy the helper.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.columnStatesManager = null;
    }
  }]);

  return DomHelper;
}();