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
import RowsMapper from './rowsMapper';
import {rangeEach} from '../../helpers/number';

Hooks.getSingleton().register('beforeColumnSort');
Hooks.getSingleton().register('afterColumnSort');

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
    this.sortColumn = void 0;
    this.sortOrder = void 0;
    this.sortEmptyCells = false;
    this.rowsMapper = new RowsMapper(this);
    this.removedRows = [];
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

    if (typeof this.hot.getSettings().observeChanges === 'undefined') {
      this.enableObserveChangesPlugin();
    }

    this.addHook('afterTrimRow', (row) => this.sort());
    this.addHook('afterUntrimRow', (row) => this.sort());
    this.addHook('modifyRow', (row, source) => this.onModifyRow(row, source));
    this.addHook('unmodifyRow', (row, source) => this.onUnmodifyRow(row, source));
    this.addHook('afterUpdateSettings', () => this.onAfterUpdateSettings());
    this.addHook('afterGetColHeader', (col, TH) => this.getColHeader(col, TH));
    this.addHook('afterOnCellMouseDown', (event, target) => this.onAfterOnCellMouseDown(event, target));
    this.addHook('beforeRemoveRow', (index, amount) => this.onBeforeRemoveRow(index, amount));
    this.addHook('afterRemoveRow', () => this.onAfterRemoveRow());
    this.addHook('afterCreateRow', (index, amount) => this.onAfterCreateRow(index, amount));
    this.addHook('afterInit', () => this.sortBySettings());
    this.addHook('afterLoadData', () => {
      this.rowsMapper._arrayMap = [...Array(this.hot.countRows()).keys()];

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
      this.sortColumn = void 0;
      this.sortOrder = void 0;

      return;
    } else if (this.sortColumn === col && typeof order == 'undefined') {
      if (this.sortOrder === false) {
        this.sortOrder = void 0;
      } else {
        this.sortOrder = !this.sortOrder;
      }

    } else {
      this.sortOrder = typeof order === 'undefined' ? true : order;
    }

    this.sortColumn = col;
  }

  sortByColumn(col, order) {
    this.setSortingColumn(col, order);

    if (typeof this.sortColumn == 'undefined') {
      return;
    }

    let allowSorting = this.hot.runHooks('beforeColumnSort', this.sortColumn, this.sortOrder);

    if (allowSorting !== false) {
      this.sort();
    }
    this.updateOrderClass();
    this.updateSortIndicator();

    this.hot.runHooks('afterColumnSort', this.sortColumn, this.sortOrder);

    this.hot.render();
    this.saveSortingState();
  }

  /**
   * Save the sorting state
   */
  saveSortingState() {
    let sortingState = {};

    if (typeof this.sortColumn != 'undefined') {
      sortingState.sortColumn = this.sortColumn;
    }

    if (typeof this.sortOrder != 'undefined') {
      sortingState.sortOrder = this.sortOrder;
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

    if (this.sortOrder === true) {
      orderClass = 'ascending';

    } else if (this.sortOrder === false) {
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
    if (typeof this.sortOrder == 'undefined') {
      this.rowsMapper._arrayMap = [...Array(this.hot.countRows()).keys()];

      return;
    }

    const colMeta = this.hot.getCellMeta(0, this.sortColumn);
    const emptyRows = this.hot.countEmptyRows();
    let sortFunction;
    let nrOfRows;

    const indexesWithData = [];

    if (typeof colMeta.columnSorting.sortEmptyCells === 'undefined') {
      colMeta.columnSorting = {sortEmptyCells: this.sortEmptyCells};
    }

    if (this.hot.getSettings().maxRows === Number.POSITIVE_INFINITY) {
      nrOfRows = this.hot.countRows() - this.hot.getSettings().minSpareRows;
    } else {
      nrOfRows = this.hot.countRows() - emptyRows;
    }

    for (let i = 0, ilen = nrOfRows; i < ilen; i++) {
      indexesWithData.push([i, this.hot.getDataAtCell(this.rowsMapper.getIndexByValue(i), this.sortColumn)]);
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

    mergeSort(indexesWithData, sortFunction(this.sortOrder, colMeta));

    // Append spareRows
    for (let i = indexesWithData.length; i < this.hot.countRows(); i++) {
      indexesWithData.push([i, this.hot.getDataAtCell(this.rowsMapper.getIndexByValue(i), this.sortColumn)]);
    }

    const sortedIndexes = indexesWithData.map((indexWithData) => indexWithData[0]);
    this.rowsMapper._arrayMap = sortedIndexes;
  }

  /**
   * Update indicator states.
   */
  updateSortIndicator() {
    if (typeof this.sortOrder == 'undefined') {
      return;
    }
    const colMeta = this.hot.getCellMeta(0, this.sortColumn);

    this.sortIndicators[this.sortColumn] = colMeta.sortIndicator;
  }

  /**
   * 'modifyRow' hook callback.
   *
   * @private
   * @param {Number} row Visual Row index.
   * @returns {Number} Physical row index.
   */
  onModifyRow(row, source) {
    if (source !== this.pluginName) {
      let rowInMapper = this.rowsMapper.getValueByIndex(row);
      row = rowInMapper === null ? row : rowInMapper;
    }

    return row;
  }

  /**
   * 'unmodifyRow' hook callback.
   *
   * @private
   * @param {Number} row Physical row index.
   * @returns {Number} Visual row index.
   */
  onUnmodifyRow(row, source) {
    if (source !== this.pluginName) {
      row = this.rowsMapper.getIndexByValue(row);
    }

    return row;
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
      if (col === this.sortColumn) {
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
    return typeof this.sortColumn != 'undefined';
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @private
   * @param {Number} index Visual index of the created row.
   * @param {Number} amount Amount of created rows.
   */
  onAfterCreateRow(index, amount) {
    this.rowsMapper.shiftItems(index, amount);
  }

  /**
   * On before remove row listener.
   *
   * @private
   * @param {Number} index Visual row index.
   * @param {Number} amount Defines how many rows removed.
   */
  onBeforeRemoveRow(index, amount) {
    this.removedRows.length = 0;

    if (index !== false) {
      // Collect physical row index.
      rangeEach(index, index + amount - 1, (removedIndex) => {
        this.removedRows.push(this.hot.runHooks('modifyRow', removedIndex, this.pluginName));
      });
    }
  }

  /**
   * `afterRemoveRow` hook callback.
   *
   * @private
   */
  onAfterRemoveRow() {
    this.rowsMapper.unshiftItems(this.removedRows);
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
        this.sortOrder = true;
      }

      this.lastSortedColumn = coords.col;

      this.sortByColumn(coords.col);
    }
  }
}

registerPlugin('columnSorting', ColumnSorting);

export default ColumnSorting;
