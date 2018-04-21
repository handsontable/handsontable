import {
  addClass,
  hasClass,
  removeClass,
} from './../../helpers/dom/element';
import {hasOwnProperty} from './../../helpers/object';
import {isDefined, isUndefined} from './../../helpers/mixed';
import BasePlugin from './../_base';
import {registerPlugin} from './../../plugins';
import mergeSort from './../../utils/sortingAlgorithms/mergeSort';
import Hooks from './../../pluginHooks';
import RowsMapper from './rowsMapper';
import dateSort from './sortFunction/date';
import numericSort from './sortFunction/numeric';
import defaultSort from './sortFunction/default';

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
 * @dependencies ObserveChanges moment
 */
class ColumnSorting extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    this.sortIndicators = [];
    this.lastSortedColumn = null;
    this.sortColumn = void 0;
    this.sortOrder = void 0;
    this.rowsMapper = new RowsMapper(this);
    this.sortingEnabled = false;
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

    if (isUndefined(this.hot.getSettings().observeChanges)) {
      this.enableObserveChangesPlugin();
    }

    this.addHook('afterTrimRow', () => this.sort());
    this.addHook('afterUntrimRow', () => this.sort());
    this.addHook('modifyRow', (row, source) => this.onModifyRow(row, source));
    this.addHook('unmodifyRow', (row, source) => this.onUnmodifyRow(row, source));
    this.addHook('afterUpdateSettings', () => this.onAfterUpdateSettings());
    this.addHook('afterGetColHeader', (column, TH) => this.getColHeader(column, TH));
    this.addHook('afterOnCellMouseDown', (event, target) => this.onAfterOnCellMouseDown(event, target));
    this.addHook('afterCreateRow', (index, amount) => this.onAfterCreateRow(index, amount));
    this.addHook('afterRemoveRow', (index, amount) => this.onAfterRemoveRow(index, amount));
    this.addHook('afterInit', () => this.sortBySettings());
    this.addHook('afterLoadData', () => {
      this.rowsMapper._arrayMap = [];

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

    if (isUndefined(loadedSortingState)) {
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
   * @param {number} column Sorted visual column index.
   * @param {boolean|undefined} order Sorting order (`true` for ascending, `false` for descending).
   */
  setSortingColumn(column, order) {
    if (isUndefined(column)) {
      this.sortColumn = void 0;
      this.sortOrder = void 0;

      return;
    } else if (this.sortColumn === column && isUndefined(order)) {
      if (this.sortOrder === false) {
        this.sortOrder = void 0;
      } else {
        this.sortOrder = !this.sortOrder;
      }

    } else {
      this.sortOrder = isUndefined(order) ? true : order;
    }

    this.sortColumn = column;
  }

  sortByColumn(column, order) {
    this.setSortingColumn(column, order);

    if (isUndefined(this.sortColumn)) {
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

    if (isDefined(this.sortColumn)) {
      sortingState.sortColumn = this.sortColumn;
    }

    if (isDefined(this.sortOrder)) {
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
   * Perform the sorting.
   */
  sort() {
    if (isUndefined(this.sortOrder)) {
      this.rowsMapper._arrayMap = [];

      return;
    }

    const colMeta = this.hot.getCellMeta(0, this.sortColumn);
    const emptyRows = this.hot.countEmptyRows();
    let sortFunction;
    let nrOfRows;

    this.sortingEnabled = false; // this is required by translateRow plugin hook
    const sortIndex = [];

    if (isUndefined(colMeta.columnSorting.sortEmptyCells)) {
      colMeta.columnSorting = {sortEmptyCells: this.sortEmptyCells};
    }

    if (this.hot.getSettings().maxRows === Number.POSITIVE_INFINITY) {
      nrOfRows = this.hot.countRows() - this.hot.getSettings().minSpareRows;
    } else {
      nrOfRows = this.hot.countRows() - emptyRows;
    }

    for (let i = 0, ilen = nrOfRows; i < ilen; i++) {
      sortIndex.push([i, this.hot.getDataAtCell(i, this.sortColumn)]);
    }

    if (colMeta.sortFunction) {
      sortFunction = colMeta.sortFunction;

    } else {
      switch (colMeta.type) {
        case 'date':
          sortFunction = dateSort;
          break;
        case 'numeric':
          sortFunction = numericSort;
          break;
        default:
          sortFunction = defaultSort;
      }
    }

    mergeSort(sortIndex, sortFunction(this.sortOrder, colMeta));

    // Append spareRows
    for (let i = sortIndex.length; i < this.hot.countRows(); i++) {
      sortIndex.push([i, this.hot.getDataAtCell(i, this.sortColumn)]);
    }

    this.rowsMapper._arrayMap = sortIndex.map((indexWithData) => indexWithData[0]);
    this.sortingEnabled = true; // this is required by translateRow plugin hook
  }

  /**
   * Update indicator states.
   */
  updateSortIndicator() {
    if (isUndefined(this.sortOrder)) {
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
    if (this.sortingEnabled && source !== this.pluginName) {
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
    if (this.sortingEnabled && source !== this.pluginName) {
      row = this.rowsMapper.getIndexByValue(row);
    }

    return row;
  }

  /**
   * `afterGetColHeader` callback. Adds column sorting css classes to clickable headers.
   *
   * @private
   * @param {Number} column Visual column index.
   * @param {Element} TH TH HTML element.
   */
  getColHeader(column, TH) {
    if (column < 0 || !TH.parentNode) {
      return false;
    }

    let headerLink = TH.querySelector('.colHeader');
    let TRs = TH.parentNode.parentNode.childNodes;
    let headerLevel = Array.prototype.indexOf.call(TRs, TH.parentNode);
    headerLevel -= TRs.length;

    if (!headerLink) {
      return;
    }

    if (this.hot.getSettings().columnSorting && column >= 0 && headerLevel === -1) {
      addClass(headerLink, 'columnSorting');
    }
    removeClass(headerLink, 'descending');
    removeClass(headerLink, 'ascending');

    if (this.sortIndicators[column]) {
      if (column === this.sortColumn) {
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
    return isDefined(this.sortColumn);
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
   * `afterRemoveRow` hook callback.
   *
   * @private
   * @param {Number} removedRows Visual indexes of the removed row.
   * @param {Number} amount  Amount of removed rows.
   */
  onAfterRemoveRow(removedRows, amount) {
    this.rowsMapper.unshiftItems(removedRows, amount);
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
