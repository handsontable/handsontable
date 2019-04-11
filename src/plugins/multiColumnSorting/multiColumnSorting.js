import ColumnSorting from '../columnSorting/columnSorting';
import { registerRootComparator } from '../columnSorting/sortService';
import { wasHeaderClickedProperly } from '../columnSorting/utils';
import { registerPlugin } from '../../plugins';
import { isPressedCtrlKey } from '../../utils/keyStateObserver';
import { addClass, removeClass } from '../../helpers/dom/element';
import { rootComparator } from './rootComparator';
import { warnAboutPluginsConflict } from './utils';
import { getClassesToAdd, getClassedToRemove } from './domHelpers';

import './multiColumnSorting.css';

const APPEND_COLUMN_CONFIG_STRATEGY = 'append';
const PLUGIN_KEY = 'multiColumnSorting';
const CONFLICTED_PLUGIN_KEY = 'columnSorting';

registerRootComparator(PLUGIN_KEY, rootComparator);

/**
 * @plugin MultiColumnSorting
 * @dependencies ColumnSorting
 *
 * @description
 * This plugin sorts the view by columns (but does not sort the data source!). To enable the plugin, set the
 * {@link Options#multiColumnSorting} property to the correct value (see the examples below).
 *
 * @example
 * ```js
 * // as boolean
 * multiColumnSorting: true
 *
 * // as an object with initial sort config (sort ascending for column at index 1 and then sort descending for column at index 0)
 * multiColumnSorting: {
 *   initialConfig: [{
 *     column: 1,
 *     sortOrder: 'asc'
 *   }, {
 *     column: 0,
 *     sortOrder: 'desc'
 *   }]
 * }
 *
 * // as an object which define specific sorting options for all columns
 * multiColumnSorting: {
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
 * // please take a look at documentation of `column` property: https://docs.handsontable.com/pro/Options.html#columns
 * columns: [{
 *   multiColumnSorting: {
 *     indicator: false, // disable indicator for the first column,
 *     sortEmptyCells: true,
 *     headerAction: false, // clicks on the first column won't sort
 *     compareFunctionFactory: function(sortOrder, columnMeta) {
 *       return function(value, nextValue) {
 *         return 0; // Custom compare function for the first column (don't sort)
 *       }
 *     }
 *   }
 * }]```
 *
 * @dependencies ObserveChanges
 */
class MultiColumnSorting extends ColumnSorting {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Main settings key designed for the plugin.
     *
     * @private
     * @type {String}
     */
    this.pluginKey = PLUGIN_KEY;
  }

  /**
   * Checks if the plugin is enabled in the Handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link MultiColumnSorting#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return super.isEnabled();
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (!this.enabled && this.hot.getSettings()[this.pluginKey] && this.hot.getSettings()[CONFLICTED_PLUGIN_KEY]) {
      warnAboutPluginsConflict();
    }

    return super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    return super.disablePlugin();
  }

  /**
   * Sorts the table by chosen columns and orders.
   *
   * @param {undefined|Object|Array} sortConfig Single column sort configuration or full sort configuration (for all sorted columns).
   * The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains
   * sort order (`asc` for ascending, `desc` for descending).
   *
   * **Note**: Please keep in mind that every call of `sort` function set an entirely new sort order. Previous sort configs aren't preserved.
   *
   * @example
   * ```js
   * // sort ascending first visual column
   * hot.getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });
   *
   * // sort first two visual column in the defined sequence
   * hot.getPlugin('multiColumnSorting').sort([{
   *   column: 1, sortOrder: 'asc'
   * }, {
   *   column: 0, sortOrder: 'desc'
   * }]);
   * ```
   *
   * @fires Hooks#beforeColumnSort
   * @fires Hooks#afterColumnSort
   */
  sort(sortConfig) {
    return super.sort(sortConfig);
  }

  /**
   * Clear the sort performed on the table.
   */
  clearSort() {
    return super.clearSort();
  }

  /**
   * Checks if the table is sorted (any column have to be sorted).
   *
   * @returns {Boolean}
   */
  isSorted() {
    return super.isSorted();
  }

  /**
   * Get sort configuration for particular column or for all sorted columns. Objects contain `column` and `sortOrder` properties.
   *
   * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key. They are handled by the `sort` function.
   *
   * @param {Number} [column] Visual column index.
   * @returns {undefined|Object|Array}
   */
  getSortConfig(column) {
    return super.getSortConfig(column);
  }

  /**
   * @description
   * Warn: Useful mainly for providing server side sort implementation (see in the example below). It doesn't sort the data set. It just sets sort configuration for all sorted columns.
   * Note: Please keep in mind that this method doesn't re-render the table.
   *
   * @example
   * ```js
   * beforeColumnSort: function(currentSortConfig, destinationSortConfigs) {
   *   const columnSortPlugin = this.getPlugin('multiColumnSorting');
   *
   *   columnSortPlugin.setSortConfig(destinationSortConfigs);
   *
   *   // const newData = ... // Calculated data set, ie. from an AJAX call.
   *
   *   this.loadData(newData); // Load new data set and re-render the table.
   *
   *   return false; // The blockade for the default sort action.
   * }```
   *
   * @param {undefined|Object|Array} sortConfig Single column sort configuration or full sort configuration (for all sorted columns).
   * The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains
   * sort order (`asc` for ascending, `desc` for descending).
   */
  setSortConfig(sortConfig) {
    return super.setSortConfig(sortConfig);
  }

  /**
   * Get normalized sort configs.
   *
   * @private
   * @param {Object|Array} [sortConfig=[]] Single column sort configuration or full sort configuration (for all sorted columns).
   * The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains
   * sort order (`asc` for ascending, `desc` for descending).
   * @returns {Array}
   */
  getNormalizedSortConfigs(sortConfig = []) {
    if (Array.isArray(sortConfig)) {
      return sortConfig;
    }

    return [sortConfig];
  }

  /**
   * Update header classes.
   *
   * @private
   * @param {HTMLElement} headerSpanElement Header span element.
   * @param {...*} args Extra arguments for helpers.
   */
  updateHeaderClasses(headerSpanElement, ...args) {
    super.updateHeaderClasses(headerSpanElement, ...args);

    removeClass(headerSpanElement, getClassedToRemove(headerSpanElement));

    if (this.enabled !== false) {
      addClass(headerSpanElement, getClassesToAdd(...args));
    }
  }

  /**
   * Overwriting base plugin's `onUpdateSettings` method. Please keep in mind that `onAfterUpdateSettings` isn't called
   * for `updateSettings` in specific situations.
   *
   * @private
   * @param {Object} newSettings New settings object.
   */
  onUpdateSettings(newSettings) {
    if (this.hot.getSettings()[this.pluginKey] && this.hot.getSettings()[CONFLICTED_PLUGIN_KEY]) {
      warnAboutPluginsConflict();
    }

    return super.onUpdateSettings(newSettings);
  }

  /**
   * Callback for the `onAfterOnCellMouseDown` hook.
   *
   * @private
   * @param {Event} event Event which are provided by hook.
   * @param {CellCoords} coords Visual coords of the selected cell.
   */
  onAfterOnCellMouseDown(event, coords) {
    if (wasHeaderClickedProperly(coords.row, coords.col, event) === false) {
      return;
    }

    if (this.wasClickableHeaderClicked(event, coords.col)) {
      if (isPressedCtrlKey()) {
        this.hot.deselectCell();
        this.hot.selectColumns(coords.col);

        this.sort(this.getNextSortConfig(coords.col, APPEND_COLUMN_CONFIG_STRATEGY));

      } else {
        this.sort(this.getColumnNextConfig(coords.col));
      }
    }
  }
}

registerPlugin(PLUGIN_KEY, MultiColumnSorting);

export default MultiColumnSorting;
