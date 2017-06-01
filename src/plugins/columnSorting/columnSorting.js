import moment from 'moment';
import {
  addClass,
  hasClass,
  removeClass,
} from './../../helpers/dom/element';
import {arrayMap, arrayReduce} from './../../helpers/array';
import {isEmpty} from './../../helpers/mixed';
import {hasOwnProperty} from './../../helpers/object';
import BasePlugin from './../_base';
import {registerPlugin} from './../../plugins';
import mergeSort from './../../utils/sortingAlgorithms/mergeSort';
import Hooks from './../../pluginHooks';

Hooks.getSingleton().register('beforeColumnSort');
Hooks.getSingleton().register('afterColumnSort');

// TODO: Implement mixin arrayMapper to ColumnSorting plugin.

/**
 * @plugin ColumnSorting
 *
 * @description
 * This plugin sorts the view by a column (but does not sort the data source!).
 * To enable the plugin, set the `columnSorting` property to either:
 * * a boolean value (`true`/`false`),
 * * an object defining the initial sorting order (see the example below).
 *
 * @example
 * ```js
 * ...
 * // as boolean
 * columnSorting: true
 * ...
 * // as a object with initial order (sort ascending column at index 2)
 * columnSorting: {
 *  column: 2,
 *  sortOrder: true, // true = ascending, false = descending, undefined = original order
 *  sortEmptyCells: true // true = the table sorts empty cells, false = the table moves all empty cells to the end of the table
 * }
 * ...
 * ```
 * @dependencies ObserveChanges
 */
class ColumnSorting extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);
    this.sortIndicators = [];
    this.lastSortedColumn = null;
    this.sortEmptyCells = false;
  }

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!(this.hot.getSettings().columnSorting);
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.setPluginOptions();

    const _this = this;
    this.hot.sortIndex = [];

    this.hot.sort = function() {
      let args = Array.prototype.slice.call(arguments);

      return _this.sortByColumn(...args);
    };

    if (typeof this.hot.getSettings().observeChanges === 'undefined') {
      this.enableObserveChangesPlugin();
    }

    this.addHook('afterTrimRow', (row) => this.sort());
    this.addHook('afterUntrimRow', (row) => this.sort());
    this.addHook('modifyRow', (row) => this.translateRow(row));
    this.addHook('unmodifyRow', (row) => this.untranslateRow(row));
    this.addHook('afterUpdateSettings', () => this.onAfterUpdateSettings());
    this.addHook('afterGetColHeader', (col, TH) => this.getColHeader(col, TH));
    this.addHook('afterOnCellMouseDown', (event, target) => this.onAfterOnCellMouseDown(event, target));
    this.addHook('afterCreateRow', function() {
      _this.afterCreateRow(...arguments);
    });
    this.addHook('afterRemoveRow', function() {
      _this.afterRemoveRow(...arguments);
    });
    this.addHook('afterInit', () => this.sortBySettings());
    this.addHook('afterLoadData', () => {
      this.hot.sortIndex = [];

      if (this.hot.view) {
        this.sortBySettings();
      }
    });
    if (this.hot.view) {
      this.sortBySettings();
    }
    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.sort = void 0;
    super.disablePlugin();
  }

  /**
   * afterUpdateSettings callback.
   *
   * @private
   */
  onAfterUpdateSettings() {
    this.sortBySettings();
  }

  sortBySettings() {
    let sortingSettings = this.hot.getSettings().columnSorting;
    let loadedSortingState = this.loadSortingState();
    let sortingColumn;
    let sortingOrder;

    if (typeof loadedSortingState === 'undefined') {
      sortingColumn = sortingSettings.column;
      sortingOrder = sortingSettings.sortOrder;
    } else {
      sortingColumn = loadedSortingState.sortColumn;
      sortingOrder = loadedSortingState.sortOrder;
    }
    if (typeof sortingColumn === 'number') {
      this.lastSortedColumn = sortingColumn;
      this.sortByColumn(sortingColumn, sortingOrder);
    }
  }

  /**
   * Set sorted column and order info
   *
   * @param {number} col Sorted visual column index.
   * @param {boolean|undefined} order Sorting order (`true` for ascending, `false` for descending).
   */
  setSortingColumn(col, order) {
    if (typeof col == 'undefined') {
      this.hot.sortColumn = void 0;
      this.hot.sortOrder = void 0;

      return;
    } else if (this.hot.sortColumn === col && typeof order == 'undefined') {
      if (this.hot.sortOrder === false) {
        this.hot.sortOrder = void 0;
      } else {
        this.hot.sortOrder = !this.hot.sortOrder;
      }

    } else {
      this.hot.sortOrder = typeof order === 'undefined' ? true : order;
    }

    this.hot.sortColumn = col;
  }

  sortByColumn(col, order) {
    this.setSortingColumn(col, order);

    if (typeof this.hot.sortColumn == 'undefined') {
      return;
    }

    let allowSorting = this.hot.runHooks('beforeColumnSort', this.hot.sortColumn, this.hot.sortOrder);

    if (allowSorting !== false) {
      this.sort();
    }
    this.updateOrderClass();
    this.updateSortIndicator();

    this.hot.runHooks('afterColumnSort', this.hot.sortColumn, this.hot.sortOrder);

    this.hot.render();
    this.saveSortingState();
  }

  /**
   * Save the sorting state
   */
  saveSortingState() {
    let sortingState = {};

    if (typeof this.hot.sortColumn != 'undefined') {
      sortingState.sortColumn = this.hot.sortColumn;
    }

    if (typeof this.hot.sortOrder != 'undefined') {
      sortingState.sortOrder = this.hot.sortOrder;
    }

    if (hasOwnProperty(sortingState, 'sortColumn') || hasOwnProperty(sortingState, 'sortOrder')) {
      this.hot.runHooks('persistentStateSave', 'columnSorting', sortingState);
    }

  }

  /**
   * Load the sorting state.
   *
   * @returns {*} Previously saved sorting state.
   */
  loadSortingState() {
    let storedState = {};
    this.hot.runHooks('persistentStateLoad', 'columnSorting', storedState);

    return storedState.value;
  }

  /**
   * Update sorting class name state.
   */
  updateOrderClass() {
    let orderClass;

    if (this.hot.sortOrder === true) {
      orderClass = 'ascending';

    } else if (this.hot.sortOrder === false) {
      orderClass = 'descending';
    }
    this.sortOrderClass = orderClass;
  }

  enableObserveChangesPlugin() {
    let _this = this;

    this.hot._registerTimeout(
      setTimeout(() => {
        _this.hot.updateSettings({
          observeChanges: true
        });
      }, 0));
  }

  /**
   * Default sorting algorithm.
   *
   * @param {Boolean} sortOrder Sorting order - `true` for ascending, `false` for descending.
   * @param {Object} columnMeta Column meta object.
   * @returns {Function} The comparing function.
   */
  defaultSort(sortOrder, columnMeta) {
    return function(a, b) {
      if (typeof a[1] == 'string') {
        a[1] = a[1].toLowerCase();
      }
      if (typeof b[1] == 'string') {
        b[1] = b[1].toLowerCase();
      }

      if (a[1] === b[1]) {
        return 0;
      }

      if (isEmpty(a[1])) {
        if (isEmpty(b[1])) {
          return 0;
        }

        if (columnMeta.columnSorting.sortEmptyCells) {
          return sortOrder ? -1 : 1;
        }

        return 1;
      }
      if (isEmpty(b[1])) {
        if (isEmpty(a[1])) {
          return 0;
        }

        if (columnMeta.columnSorting.sortEmptyCells) {
          return sortOrder ? 1 : -1;
        }

        return -1;
      }

      if (isNaN(a[1]) && !isNaN(b[1])) {
        return sortOrder ? 1 : -1;

      } else if (!isNaN(a[1]) && isNaN(b[1])) {
        return sortOrder ? -1 : 1;

      } else if (!(isNaN(a[1]) || isNaN(b[1]))) {
        a[1] = parseFloat(a[1]);
        b[1] = parseFloat(b[1]);
      }
      if (a[1] < b[1]) {
        return sortOrder ? -1 : 1;
      }
      if (a[1] > b[1]) {
        return sortOrder ? 1 : -1;
      }

      return 0;
    };
  }

  /**
   * Date sorting algorithm
   * @param {Boolean} sortOrder Sorting order (`true` for ascending, `false` for descending).
   * @param {Object} columnMeta Column meta object.
   * @returns {Function} The compare function.
   */
  dateSort(sortOrder, columnMeta) {
    return function(a, b) {
      if (a[1] === b[1]) {
        return 0;
      }

      if (isEmpty(a[1])) {
        if (isEmpty(b[1])) {
          return 0;
        }

        if (columnMeta.columnSorting.sortEmptyCells) {
          return sortOrder ? -1 : 1;
        }

        return 1;
      }

      if (isEmpty(b[1])) {
        if (isEmpty(a[1])) {
          return 0;
        }

        if (columnMeta.columnSorting.sortEmptyCells) {
          return sortOrder ? 1 : -1;
        }

        return -1;
      }

      var aDate = moment(a[1], columnMeta.dateFormat);
      var bDate = moment(b[1], columnMeta.dateFormat);

      if (!aDate.isValid()) {
        return 1;
      }
      if (!bDate.isValid()) {
        return -1;
      }

      if (bDate.isAfter(aDate)) {
        return sortOrder ? -1 : 1;
      }
      if (bDate.isBefore(aDate)) {
        return sortOrder ? 1 : -1;
      }

      return 0;
    };
  }

  /**
   * Numeric sorting algorithm.
   *
   * @param {Boolean} sortOrder Sorting order (`true` for ascending, `false` for descending).
   * @param {Object} columnMeta Column meta object.
   * @returns {Function} The compare function.
   */
  numericSort(sortOrder, columnMeta) {
    return function(a, b) {
      const parsedA = parseFloat(a[1]);
      const parsedB = parseFloat(b[1]);

      // Watch out when changing this part of code!
      // Check below returns 0 (as expected) when comparing empty string, null, undefined
      if (parsedA === parsedB || (isNaN(parsedA) && isNaN(parsedB))) {
        return 0;
      }

      if (columnMeta.columnSorting.sortEmptyCells) {
        if (isEmpty(a[1])) {
          return sortOrder ? -1 : 1;
        }

        if (isEmpty(b[1])) {
          return sortOrder ? 1 : -1;
        }
      }

      if (isNaN(parsedA)) {
        return 1;
      }

      if (isNaN(parsedB)) {
        return -1;
      }

      if (parsedA < parsedB) {
        return sortOrder ? -1 : 1;

      } else if (parsedA > parsedB) {
        return sortOrder ? 1 : -1;
      }

      return 0;
    };
  }

  /**
   * Perform the sorting.
   */
  sort() {
    if (typeof this.hot.sortOrder == 'undefined') {
      this.hot.sortIndex.length = 0;

      return;
    }

    const colMeta = this.hot.getCellMeta(0, this.hot.sortColumn);
    const emptyRows = this.hot.countEmptyRows();
    let sortFunction;
    let nrOfRows;

    this.hot.sortingEnabled = false; // this is required by translateRow plugin hook
    this.hot.sortIndex.length = 0;

    if (typeof colMeta.columnSorting.sortEmptyCells === 'undefined') {
      colMeta.columnSorting = {sortEmptyCells: this.sortEmptyCells};
    }

    if (this.hot.getSettings().maxRows === Number.POSITIVE_INFINITY) {
      nrOfRows = this.hot.countRows() - this.hot.getSettings().minSpareRows;
    } else {
      nrOfRows = this.hot.countRows() - emptyRows;
    }

    for (let i = 0, ilen = nrOfRows; i < ilen; i++) {
      this.hot.sortIndex.push([i, this.hot.getDataAtCell(i, this.hot.sortColumn)]);
    }

    if (colMeta.sortFunction) {
      sortFunction = colMeta.sortFunction;

    } else {
      switch (colMeta.type) {
        case 'date':
          sortFunction = this.dateSort;
          break;
        case 'numeric':
          sortFunction = this.numericSort;
          break;
        default:
          sortFunction = this.defaultSort;
      }
    }

    mergeSort(this.hot.sortIndex, sortFunction(this.hot.sortOrder, colMeta));

    // Append spareRows
    for (let i = this.hot.sortIndex.length; i < this.hot.countRows(); i++) {
      this.hot.sortIndex.push([i, this.hot.getDataAtCell(i, this.hot.sortColumn)]);
    }

    this.hot.sortingEnabled = true; // this is required by translateRow plugin hook
  }

  /**
   * Update indicator states.
   */
  updateSortIndicator() {
    if (typeof this.hot.sortOrder == 'undefined') {
      return;
    }
    const colMeta = this.hot.getCellMeta(0, this.hot.sortColumn);

    this.sortIndicators[this.hot.sortColumn] = colMeta.sortIndicator;
  }

  /**
   * `modifyRow` hook callback. Translates physical row index to the sorted row index.
   *
   * @param {Number} row Row index.
   * @returns {Number} Sorted row index.
   */
  translateRow(row) {
    if (this.hot.sortingEnabled && (typeof this.hot.sortOrder !== 'undefined') && this.hot.sortIndex && this.hot.sortIndex.length && this.hot.sortIndex[row]) {
      return this.hot.sortIndex[row][0];
    }

    return row;
  }

  /**
   * Translates sorted row index to physical row index.
   *
   * @param {Number} row Sorted (visual) row index.
   * @returns {number} Physical row index.
   */
  untranslateRow(row) {
    if (this.hot.sortingEnabled && this.hot.sortIndex && this.hot.sortIndex.length) {
      for (var i = 0; i < this.hot.sortIndex.length; i++) {
        if (this.hot.sortIndex[i][0] == row) {
          return i;
        }
      }
    }
  }

  /**
   * `afterGetColHeader` callback. Adds column sorting css classes to clickable headers.
   *
   * @private
   * @param {Number} col Visual column index.
   * @param {Element} TH TH HTML element.
   */
  getColHeader(col, TH) {
    if (col < 0 || !TH.parentNode) {
      return false;
    }

    let headerLink = TH.querySelector('.colHeader');
    let colspan = TH.getAttribute('colspan');
    let TRs = TH.parentNode.parentNode.childNodes;
    let headerLevel = Array.prototype.indexOf.call(TRs, TH.parentNode);
    headerLevel -= TRs.length;

    if (!headerLink) {
      return;
    }

    if (this.hot.getSettings().columnSorting && col >= 0 && headerLevel === -1) {
      addClass(headerLink, 'columnSorting');
    }
    removeClass(headerLink, 'descending');
    removeClass(headerLink, 'ascending');

    if (this.sortIndicators[col]) {
      if (col === this.hot.sortColumn) {
        if (this.sortOrderClass === 'ascending') {
          addClass(headerLink, 'ascending');

        } else if (this.sortOrderClass === 'descending') {
          addClass(headerLink, 'descending');
        }
      }
    }
  }

  /**
   * Check if any column is in a sorted state.
   *
   * @returns {Boolean}
   */
  isSorted() {
    return typeof this.hot.sortColumn != 'undefined';
  }

  /**
   * `afterCreateRow` callback. Updates the sorting state after a row have been created.
   *
   * @private
   * @param {Number} index Visual row index.
   * @param {Number} amount
   */
  afterCreateRow(index, amount) {
    if (!this.isSorted()) {
      return;
    }

    for (let i = 0; i < this.hot.sortIndex.length; i++) {
      if (this.hot.sortIndex[i][0] >= index) {
        this.hot.sortIndex[i][0] += amount;
      }
    }

    for (let i = 0; i < amount; i++) {
      this.hot.sortIndex.splice(index + i, 0, [index + i, this.hot.getSourceData()[index + i][this.hot.sortColumn + this.hot.colOffset()]]);
    }

    this.saveSortingState();
  }

  /**
   * `afterRemoveRow` hook callback.
   *
   * @private
   * @param {Number} index Visual row index.
   * @param {Number} amount
   */
  afterRemoveRow(index, amount) {
    if (!this.isSorted()) {
      return;
    }
    let removedRows = this.hot.sortIndex.splice(index, amount);

    removedRows = arrayMap(removedRows, (row) => row[0]);

    function countRowShift(logicalRow) {
      // Todo: compare perf between reduce vs sort->each->brake
      return arrayReduce(removedRows, (count, removedLogicalRow) => {
        if (logicalRow > removedLogicalRow) {
          count++;
        }

        return count;
      }, 0);
    }

    this.hot.sortIndex = arrayMap(this.hot.sortIndex, (logicalRow, physicalRow) => {
      let rowShift = countRowShift(logicalRow[0]);

      if (rowShift) {
        logicalRow[0] -= rowShift;
      }

      return logicalRow;
    });

    this.saveSortingState();
  }

  /**
   * Set options by passed settings
   *
   * @private
   */
  setPluginOptions() {
    const columnSorting = this.hot.getSettings().columnSorting;

    if (typeof columnSorting === 'object') {
      this.sortEmptyCells = columnSorting.sortEmptyCells || false;

    } else {
      this.sortEmptyCells = false;
    }
  }

  /**
   * `onAfterOnCellMouseDown` hook callback.
   *
   * @private
   * @param {Event} event Event which are provided by hook.
   * @param {CellCoords} coords Visual coords of the selected cell.
   */
  onAfterOnCellMouseDown(event, coords) {
    if (coords.row > -1) {
      return;
    }

    if (hasClass(event.realTarget, 'columnSorting')) {
      // reset order state on every new column header click
      if (coords.col !== this.lastSortedColumn) {
        this.hot.sortOrder = true;
      }

      this.lastSortedColumn = coords.col;

      this.sortByColumn(coords.col);
    }
  }
}

registerPlugin('columnSorting', ColumnSorting);

export default ColumnSorting;
