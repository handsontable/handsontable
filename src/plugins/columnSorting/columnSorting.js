import {
  addClass,
  hasClass,
  removeClass,
} from './../../helpers/dom/element';
import {hasOwnProperty, isObject} from './../../helpers/object';
import {isDefined, isUndefined} from './../../helpers/mixed';
import {getSortFunctionForColumn} from './utils';
import BasePlugin from './../_base';
import {registerPlugin} from './../../plugins';
import mergeSort from './../../utils/sortingAlgorithms/mergeSort';
import Hooks from './../../pluginHooks';
import RowsMapper from './rowsMapper';

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
     * TODO: It could be refactored, it's cache which store information about value of `sortIndicator` property
     * inside meta of first cell from particular column.
     *
     * @private
     * @type {Array}
     */
    this.sortIndicators = [];
    /**
     * Physical index of last sorted column.
     *
     * @type {Number}
     */
    this.sortColumn = void 0;
    /**
     * Order of last sorting. For `asc` ascending order, for `desc` descending order, for `none` the original order.
     *
     * @type {String}
     */
    this.sortOrder = NONE_SORT_STATE;
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
  sort(column, order = this.getNextOrderState(column)) {
    if (isUndefined(column)) {
      return;
    }

    const allowSorting = this.hot.runHooks('beforeColumnSort', column, order);

    if (allowSorting === false) {
      return;
    }

    this.sortColumn = this.hot.toPhysicalColumn(column);
    this.sortOrder = order;

    this.sortByPresetColumnAndOrder();
    this.updateSortIndicator();

    this.hot.runHooks('afterColumnSort', column, order);

    this.hot.render();
    this.hot.view.wt.draw(true);

    this.saveSortingState();
  }

  /**
   * Get new order state for particular column. The states queue looks as follows: 'asc' -> 'desc' -> 'none' -> 'asc'
   *
   * @param {Number} column Visual column index.
   * @returns {String} Sorting order (`asc` for ascending, `desc` for descending and `none` for initial state).
   */
  getNextOrderState(column) {
    const physicalColumn = this.hot.toPhysicalColumn(column);

    if (this.sortColumn === physicalColumn) {
      if (this.sortOrder === DESC_SORT_STATE) {
        return NONE_SORT_STATE;

      } else if (this.sortOrder === ASC_SORT_STATE) {
        return DESC_SORT_STATE;
      }
    }

    return ASC_SORT_STATE;
  }

  /**
   * Checks if any column is in a sorted state.
   *
   * @returns {Boolean}
   */
  isSorted() {
    return this.isEnabled() && this.sortOrder !== NONE_SORT_STATE;
  }

  /**
   * Saves the sorting state. To use this method the {@link Options#persistentState} option has to be enabled.
   *
   * @fires Hooks#persistentStateSave
   * @fires Hooks#columnSorting
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
   * Performs the sorting using a stable sort function.
   *
   * @private
   */
  sortByPresetColumnAndOrder() {
    if (this.sortOrder === NONE_SORT_STATE) {
      this.rowsMapper.clearMap();

      return;
    }

    const indexesWithData = [];
    const visualColumn = this.hot.toVisualColumn(this.sortColumn);
    const columnMeta = this.hot.getCellMeta(0, visualColumn);
    const sortFunction = getSortFunctionForColumn(columnMeta);
    const numberOfRows = this.hot.countRows();
    const settings = this.hot.getSettings();
    let numberOfSortedRows;

    // `maxRows` option doesn't take into account `minSpareRows` option in specific situation.
    if (settings.maxRows <= numberOfRows) {
      numberOfSortedRows = settings.maxRows;

    } else {
      numberOfSortedRows = numberOfRows - settings.minSpareRows;
    }

    if (isUndefined(columnMeta.columnSorting.sortEmptyCells)) {
      columnMeta.columnSorting = {sortEmptyCells: this.sortEmptyCells};
    }

    // Function `getDataAtCell` won't call the indices translation inside `onModifyRow` listener - we check the `blockPluginTranslation` flag
    // (we just want to get data not already modified by `columnSorting` plugin translation).
    this.blockPluginTranslation = true;

    for (let visualIndex = 0; visualIndex < numberOfSortedRows; visualIndex += 1) {
      indexesWithData.push([visualIndex, this.hot.getDataAtCell(visualIndex, visualColumn)]);
    }

    mergeSort(indexesWithData, sortFunction(this.sortOrder, columnMeta));

    // Append spareRows
    for (let visualIndex = indexesWithData.length; visualIndex < numberOfRows; visualIndex += 1) {
      indexesWithData.push([visualIndex, this.hot.getDataAtCell(visualIndex, visualColumn)]);
    }

    // The blockade of the indices translation is released.
    this.blockPluginTranslation = false;

    // Save all indexes to arrayMapper, a completely new sequence is set by the plugin
    this.rowsMapper._arrayMap = indexesWithData.map((indexWithData) => indexWithData[0]);
  }

  /**
   * Updates indicator states.
   *
   * @private
   */
  updateSortIndicator() {
    if (this.sortOrder === NONE_SORT_STATE) {
      return;
    }

    const visualColumn = this.hot.toVisualColumn(this.sortColumn);
    const columnMeta = this.hot.getCellMeta(0, visualColumn);

    this.sortIndicators[this.sortColumn] = columnMeta.sortIndicator;
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

    const headerLink = TH.querySelector('.colHeader');
    const TRs = TH.parentNode.parentNode.childNodes;
    const addedClasses = [];
    const removedClassess = [HEADER_CLASS_DESC_SORT, HEADER_CLASS_ASC_SORT];
    const physicalColumn = this.hot.toPhysicalColumn(column);
    let headerLevel = Array.prototype.indexOf.call(TRs, TH.parentNode);
    headerLevel -= TRs.length;

    if (!headerLink) {
      return;
    }

    if (this.hot.getSettings().columnSorting && column >= 0 && headerLevel === -1) {
      addedClasses.push(HEADER_CLASS_SORTING);
    }

    if (this.sortIndicators[physicalColumn]) {
      if (physicalColumn === this.sortColumn) {
        if (this.sortOrder === ASC_SORT_STATE) {
          addedClasses.push(HEADER_CLASS_ASC_SORT);

        } else if (this.sortOrder === DESC_SORT_STATE) {
          addedClasses.push(HEADER_CLASS_DESC_SORT);
        }
      }
    }

    const notAddedThenClasses = removedClassess.filter((removedClass) => addedClasses.includes(removedClass) === false);

    removeClass(headerLink, notAddedThenClasses);
    addClass(headerLink, addedClasses);
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

    if (hasClass(event.realTarget, HEADER_CLASS_SORTING)) {
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
