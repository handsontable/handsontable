import {
  addClass,
  hasClass,
  removeClass,
} from './../../helpers/dom/element';
import {isObject} from './../../helpers/object';
import {isUndefined} from './../../helpers/mixed';
import {getSortFunctionForColumn} from './utils';
import BasePlugin from './../_base';
import {ColumnStatesManager} from './columnStatesManager';
import {DomHelper, HEADER_CLASS, HEADER_SORTING_CLASS} from './domHelper';
import {registerPlugin} from './../../plugins';
import mergeSort from './../../utils/sortingAlgorithms/mergeSort';
import Hooks from './../../pluginHooks';
import RowsMapper from './rowsMapper';

Hooks.getSingleton().register('beforeColumnSort');
Hooks.getSingleton().register('afterColumnSort');

/**
 * @plugin ColumnSorting
 *
 * @description
 * This plugin sorts the view by a column (but does not sort the data source!). To enable the plugin, set the
 * {@link Options#columnSorting} property to an object defining the initial sorting order (see the example below).
 *
 * @example
 * ```js
 * // as boolean
 * columnSorting: true
 *
 * // as a object with initial order (sort ascending column at index 2)
 * columnSorting: {
 *  column: 2,
 *  sortOrder: 'asc', // 'asc' = ascending, 'desc' = descending, 'none' = original order
 *  sortEmptyCells: true // true = the table sorts empty cells, false = the table moves all empty cells to the end of the table
 * }
 * ```
 * @dependencies ObserveChanges moment
 */
class ColumnSorting extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of column states manager.
     *
     * @type {SortedColumnStates}
     */
    this.columnStatesManager = new ColumnStatesManager();
    /**
     * Instance of DOM helper.
     *
     * @type {DomHelper}
     */
    this.domHelper = new DomHelper(this.columnStatesManager);
    /**
     * Sorting empty cells.
     *
     * @type {Boolean}
     */
    this.sortEmptyCells = false;
    /**
     * Object containing visual row indexes mapped to data source indexes.
     *
     * @private
     * @type {RowsMapper}
     */
    this.rowsMapper = new RowsMapper(this);
    /**
     * It blocks the plugin translation, this flag is checked inside `onModifyRow` listener.
     *
     * @private
     * @type {boolean}
     */
    this.blockPluginTranslation = true;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ColumnSorting#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!(this.hot.getSettings().columnSorting);
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
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
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Sorts the table by chosen column and order.
   *
   * @param {Number} column Visual column index.
   * @param {String} [order] Sorting order (`asc` for ascending, `desc` for descending and `none` for initial state).
   *
   * @fires Hooks#beforeColumnSort
   * @fires Hooks#afterColumnSort
   */
  sort(column, order) {
    if (isUndefined(column)) {
      return;
    }

    const allowSorting = this.hot.runHooks('beforeColumnSort', column, order);

    if (allowSorting === false) {
      return;
    }

    this.columnStatesManager.setSortingOrder(this.hot.toPhysicalColumn(column), order);
    this.sortByPresetColumnAndOrder();

    this.hot.runHooks('afterColumnSort', column, order);

    this.hot.render();
    this.hot.view.wt.draw(true);

    this.saveSortingState();
  }

  /**
   * Checks if any column is in a sorted state.
   *
   * @returns {Boolean}
   */
  isSorted() {
    return this.isEnabled() && !this.columnStatesManager.isListOfSortedColumnsEmpty();
  }

  /**
   * Saves the sorting state. To use this method the {@link Options#persistentState} option has to be enabled.
   *
   * @fires Hooks#persistentStateSave
   * @fires Hooks#columnSorting
   */
  saveSortingState() {
    if (this.columnStatesManager.isListOfSortedColumnsEmpty() === false) {
      this.hot.runHooks('persistentStateSave', 'columnSorting', this.columnStatesManager.getAllStates());
    }
  }

  /**
   * Loads the sorting state. To use this method the {@link Options#persistentState} option has to be enabled.
   *
   * @returns {*} Previously saved sorting state.
   *
   * @fires Hooks#persistentStateLoad
   */
  loadSortingState() {
    let storedState = {};
    this.hot.runHooks('persistentStateLoad', 'columnSorting', storedState);

    return storedState.value;
  }

  /**
   * Enables the ObserveChanges plugin.
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
   * Get number of rows which should be sorted.
   *
   * @private
   * @param {Number} numberOfRows Total number of displayed rows.
   * @returns {Number}
   */
  getNumberOfSortedRows(numberOfRows) {
    const settings = this.hot.getSettings();

    // `maxRows` option doesn't take into account `minSpareRows` option in specific situation.
    if (settings.maxRows <= numberOfRows) {
      return settings.maxRows;
    }

    return numberOfRows - settings.minSpareRows;
  }

  /**
   * Performs the sorting using a stable sort function.
   *
   * @private
   */
  sortByPresetColumnAndOrder() {
    if (this.columnStatesManager.isListOfSortedColumnsEmpty()) {
      this.rowsMapper.clearMap();

      return;
    }

    const indexesWithData = [];
    const visualColumn = this.hot.toVisualColumn(this.columnStatesManager.getFirstSortedColumn());
    const columnMeta = this.hot.getCellMeta(0, visualColumn);
    const sortFunctionForFirstColumn = getSortFunctionForColumn(columnMeta);
    const sortedColumnList = this.columnStatesManager.getSortedColumns();
    const numberOfRows = this.hot.countRows();

    // Function `getDataAtCell` won't call the indices translation inside `onModifyRow` listener - we check the `blockPluginTranslation` flag
    // (we just want to get data not already modified by `columnSorting` plugin translation).
    this.blockPluginTranslation = true;

    const getDataForSortedColumns = (visualRowIndex) =>
      sortedColumnList.map((physicalColumn) => this.hot.getDataAtCell(visualRowIndex, this.hot.toVisualColumn(physicalColumn)));

    for (let visualRowIndex = 0; visualRowIndex < this.getNumberOfSortedRows(numberOfRows); visualRowIndex += 1) {
      indexesWithData.push([visualRowIndex].concat(getDataForSortedColumns(visualRowIndex)));
    }

    mergeSort(indexesWithData, sortFunctionForFirstColumn(this.columnStatesManager.getOrdersOfSortedColumns(),
      sortedColumnList.map((column) => this.hot.getCellMeta(0, this.hot.toVisualColumn(column)))));

    // Append spareRows
    for (let visualRowIndex = indexesWithData.length; visualRowIndex < numberOfRows; visualRowIndex += 1) {
      indexesWithData.push([visualRowIndex].concat(getDataForSortedColumns(visualRowIndex)));
    }

    // The blockade of the indices translation is released.
    this.blockPluginTranslation = false;

    // Save all indexes to arrayMapper, a completely new sequence is set by the plugin
    this.rowsMapper._arrayMap = indexesWithData.map((indexWithData) => indexWithData[0]);
  }

  /**
   * Sets options by passed settings
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
   * Get if sort indicator is enabled for particular column.
   *
   * @private
   * @param {Number} visualColumn
   * @returns {Boolean}
   */
  getColumnSortIndicator(visualColumn) {
    const columnMeta = this.hot.getCellMeta(0, visualColumn);

    return columnMeta.sortIndicator;
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
      return;
    }

    const headerLink = TH.querySelector(`.${HEADER_CLASS}`);

    if (!headerLink) {
      return;
    }

    if (this.enabled === false) {
      return;
    }

    const TRs = TH.parentNode.parentNode.childNodes;
    const headerLevel = Array.from(TRs).indexOf(TH.parentNode) - TRs.length;

    if (headerLevel !== -1) {
      return;
    }

    const physicalColumn = this.hot.toPhysicalColumn(column);

    removeClass(headerLink, this.domHelper.getRemovedClasses());
    addClass(headerLink, this.domHelper.getAddedClasses(physicalColumn, this.getColumnSortIndicator(column)));
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
    if (coords.row >= 0) {
      return;
    }

    // Click on the header
    if (hasClass(event.realTarget, HEADER_SORTING_CLASS)) {
      this.sort(coords.col);
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.rowsMapper.destroy();

    super.destroy();
  }
}

registerPlugin('columnSorting', ColumnSorting);

export default ColumnSorting;
