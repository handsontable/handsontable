import {
  addClass,
  hasClass,
  removeClass,
} from './../../helpers/dom/element';
import {hasOwnProperty, isObject} from './../../helpers/object';
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

const HEADER_CLASS_SORTING = 'columnSorting';
const HEADER_CLASS_ASC_SORT = 'ascending';
const HEADER_CLASS_DESC_SORT = 'descending';

const ASC_SORT_STATE = 'asc';
const DESC_SORT_STATE = 'desc';
const NONE_SORT_STATE = 'none';

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
 *  sortOrder: 'asc', // 'asc' = ascending, 'desc' = descending, 'none' = original order
 *  sortEmptyCells: true // true = the table sorts empty cells, false = the table moves all empty cells to the end of the table
 * }
 * ...
 * ```
 * @dependencies ObserveChanges moment
 */
class ColumnSorting extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    // TODO: It could be refactored, it's cache which store information about value of `sortIndicator` property
    // inside meta of first cell from particular column.
    this.sortIndicators = [];
    /**
     * Visual index of last sorted column.
     */
    this.sortColumn = void 0;
    /**
     * Order of last sorting. For `asc` ascending order, for `desc` descending order, for `none` the original order.
     *
     * @type {String}
     */
    this.sortOrder = NONE_SORT_STATE;
    /**
     * Object containing visual row indexes mapped to data source indexes.
     *
     * @type {RowsMapper}
     */
    this.rowsMapper = new RowsMapper(this);
    /**
     * Sorting empty cells.
     *
     * @type {Boolean}
     */
    this.sortEmptyCells = false;
    /**
     * It blocks the plugin translation, this flag is checked inside `onModifyRow` listener.
     *
     * @private
     * @type {boolean}
     */
    this.blockPluginTranslation = true;
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

    this.addHook('afterTrimRow', () => this.sortByPresetColumnAndOrder());
    this.addHook('afterUntrimRow', () => this.sortByPresetColumnAndOrder());
    this.addHook('modifyRow', (row, source) => this.onModifyRow(row, source));
    this.addHook('unmodifyRow', (row, source) => this.onUnmodifyRow(row, source));
    this.addHook('afterUpdateSettings', () => this.onAfterUpdateSettings());
    this.addHook('afterGetColHeader', (column, TH) => this.onAfterGetColHeader(column, TH));
    this.addHook('afterOnCellMouseDown', (event, target) => this.onAfterOnCellMouseDown(event, target));
    this.addHook('afterCreateRow', (index, amount) => this.onAfterCreateRow(index, amount));
    this.addHook('afterRemoveRow', (index, amount) => this.onAfterRemoveRow(index, amount));
    this.addHook('afterInit', () => this.sortBySettings());
    this.addHook('afterLoadData', () => {
      this.rowsMapper.clearMap();

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
   * Sorting the table by chosen column and order.
   *
   * @param {Number} column Visual column index.
   * @param {undefined|String} order Sorting order (`asc` for ascending, `desc` for descending and `none` for initial state).
   */
  sort(column, order) {
    this.setSortingColumn(column, order);

    if (isUndefined(this.sortColumn)) {
      return;
    }

    const allowSorting = this.hot.runHooks('beforeColumnSort', this.sortColumn, this.sortOrder);

    if (allowSorting === false) {
      return;
    }

    this.sortByPresetColumnAndOrder();
    this.updateSortIndicator();

    this.hot.runHooks('afterColumnSort', this.sortColumn, this.sortOrder);

    this.hot.render();
    this.saveSortingState();
  }

  /**
   * Check if any column is in a sorted state.
   *
   * @returns {Boolean}
   */
  isSorted() {
    return this.isEnabled() && this.sortOrder !== NONE_SORT_STATE;
  }

  /**
   * Save the sorting state.
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
   * Set sorted column and order info
   *
   * @private
   * @param {Number} column Sorted visual column index.
   * @param {undefined|String} order Sorting order (`asc` for ascending, `desc` for descending and `none` for initial state).
   */
  setSortingColumn(column, order) {
    if (isUndefined(column)) {
      this.sortColumn = void 0;
      this.sortOrder = NONE_SORT_STATE;

      return;
    } else if (this.sortColumn === column && isUndefined(order)) {
      switch (this.sortOrder) {
        case DESC_SORT_STATE:
          this.sortOrder = NONE_SORT_STATE;

          break;

        case ASC_SORT_STATE:
          this.sortOrder = DESC_SORT_STATE;

          break;

        default:
          this.sortOrder = ASC_SORT_STATE;

          break;
      }

    } else {
      this.sortOrder = isUndefined(order) ? ASC_SORT_STATE : order;
    }

    this.sortColumn = column;
  }

  /**
   * Enable the ObserveChanges plugin.
   *
   * @private
   */
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
   * Perform the sorting using a stable sort function.
   *
   * @private
   */
  sortByPresetColumnAndOrder() {
    if (this.sortOrder === NONE_SORT_STATE) {
      this.rowsMapper.clearMap();

      return;
    }

    const indexesWithData = [];
    const columnMeta = this.hot.getCellMeta(0, this.sortColumn);
    const sortFunction = this.getSortFunctionForColumn(columnMeta);
    const emptyRows = this.hot.countEmptyRows();
    let nrOfRows;

    if (isUndefined(columnMeta.columnSorting.sortEmptyCells)) {
      columnMeta.columnSorting = {sortEmptyCells: this.sortEmptyCells};
    }

    if (this.hot.getSettings().maxRows === Number.POSITIVE_INFINITY) {
      nrOfRows = this.hot.countRows() - this.hot.getSettings().minSpareRows;
    } else {
      nrOfRows = this.hot.countRows() - emptyRows;
    }

    // Function `getDataAtCell` won't call the indices translation inside `onModifyRow` listener - we check the `blockPluginTranslation` flag
    // (we just want to get data not already modified by `columnSorting` plugin translation).
    this.blockPluginTranslation = true;

    for (let visualIndex = 0; visualIndex < nrOfRows; visualIndex += 1) {
      indexesWithData.push([visualIndex, this.hot.getDataAtCell(visualIndex, this.sortColumn)]);
    }

    mergeSort(indexesWithData, sortFunction(this.sortOrder === ASC_SORT_STATE, columnMeta));

    // Append spareRows
    for (let visualIndex = indexesWithData.length; visualIndex < this.hot.countRows(); visualIndex += 1) {
      indexesWithData.push([visualIndex, this.hot.getDataAtCell(visualIndex, this.sortColumn)]);
    }

    // The blockade of the indices translation is released.
    this.blockPluginTranslation = false;

    // Save all indexes to arrayMapper, a completely new sequence is set by the plugin
    this.rowsMapper._arrayMap = indexesWithData.map((indexWithData) => indexWithData[0]);
  }

  /**
   * Get sort function for the particular column basing on its column meta.
   *
   * @private
   * @param {Object} columnMeta
   * @returns {Function}
   */
  getSortFunctionForColumn(columnMeta) {
    if (columnMeta.sortFunction) {
      return columnMeta.sortFunction;

    } else if (columnMeta.type === 'date') {
      return dateSort;

    } else if (columnMeta.type === 'numeric') {
      return numericSort;
    }

    return defaultSort;
  }

  /**
   * Update indicator states.
   *
   * @private
   */
  updateSortIndicator() {
    if (this.sortOrder === NONE_SORT_STATE) {
      return;
    }
    const columnMeta = this.hot.getCellMeta(0, this.sortColumn);

    this.sortIndicators[this.sortColumn] = columnMeta.sortIndicator;
  }

  /**
   * Set options by passed settings
   *
   * @private
   */
  setPluginOptions() {
    const columnSorting = this.hot.getSettings().columnSorting;

    if (isObject(columnSorting)) {
      this.sortEmptyCells = columnSorting.sortEmptyCells || false;

    } else {
      this.sortEmptyCells = false;
    }
  }

  /**
   * `modifyRow` hook callback. Translates visual row index to the sorted row index.
   *
   * @private
   * @param {Number} row Visual Row index.
   * @returns {Number} Physical row index.
   */
  onModifyRow(row, source) {
    if (this.blockPluginTranslation === false && source !== this.pluginName) {
      let rowInMapper = this.rowsMapper.getValueByIndex(row);
      row = rowInMapper === null ? row : rowInMapper;
    }

    return row;
  }

  /**
   * Translates sorted row index to visual row index.
   *
   * @private
   * @param {Number} row Physical row index.
   * @returns {Number} Visual row index.
   */
  onUnmodifyRow(row, source) {
    if (this.blockPluginTranslation === false && source !== this.pluginName) {
      row = this.rowsMapper.getIndexByValue(row);
    }

    return row;
  }

  /**
   * `onAfterGetColHeader` callback. Adds column sorting css classes to clickable headers.
   *
   * @private
   * @param {Number} column Visual column index.
   * @param {Element} TH TH HTML element.
   */
  onAfterGetColHeader(column, TH) {
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
      addClass(headerLink, HEADER_CLASS_SORTING);
    }
    removeClass(headerLink, HEADER_CLASS_DESC_SORT);
    removeClass(headerLink, HEADER_CLASS_ASC_SORT);

    if (this.sortIndicators[column]) {
      if (column === this.sortColumn) {
        if (this.sortOrder === ASC_SORT_STATE) {
          addClass(headerLink, HEADER_CLASS_ASC_SORT);

        } else if (this.sortOrder === DESC_SORT_STATE) {
          addClass(headerLink, HEADER_CLASS_DESC_SORT);
        }
      }
    }
  }

  /**
   * afterUpdateSettings callback.
   *
   * @private
   */
  onAfterUpdateSettings() {
    this.sortBySettings();
  }

  /**
   * Sort the table by provided configuration.
   *
   * @private
   */
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
      this.sort(sortingColumn, sortingOrder);
    }
  }

  /**
   * `afterCreateRow` callback. Updates the sorting state after a row have been created.
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

    if (hasClass(event.realTarget, HEADER_CLASS_SORTING)) {
      // reset order state on every new column header click
      if (coords.col !== this.sortColumn) {
        this.sortOrder = ASC_SORT_STATE;
      }

      this.sort(coords.col);
    }
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.rowsMapper.destroy();

    super.destroy();
  }
}

registerPlugin('columnSorting', ColumnSorting);

export default ColumnSorting;
