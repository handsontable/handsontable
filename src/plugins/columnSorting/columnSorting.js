import {
  addClass,
  hasClass,
  removeClass,
} from './../../helpers/dom/element';
import {isUndefined, isDefined} from './../../helpers/mixed';
import {isObject, objectEach, extend} from './../../helpers/object';
import {arrayMap, arrayEach} from './../../helpers/array';
import {getCompareFunctionFactory} from './utils';
import BasePlugin from './../_base';
import {ASC_SORT_STATE, DESC_SORT_STATE, isValidColumnState, ColumnStatesManager} from './columnStatesManager';
import {DomHelper, HEADER_CLASS, HEADER_SORTING_CLASS} from './domHelper';
import {registerPlugin} from './../../plugins';
import mergeSort from './../../utils/sortingAlgorithms/mergeSort';
import Hooks from './../../pluginHooks';
import RowsMapper from './rowsMapper';

Hooks.getSingleton().register('beforeColumnSort');
Hooks.getSingleton().register('afterColumnSort');

const APPEND_COLUMN_STATE_STRATEGY = 'append';
const REPLACE_COLUMN_STATE_STRATEGY = 'replace';

const SORT_EMPTY_CELLS_DEFAULT = false;
const SHOW_SORT_INDICATOR_DEFAULT = false;

const inheritedColumnProperties = ['sortEmptyCells', 'indicator', 'compareFunctionFactory'];

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
 *  sortOrder: 'asc', // 'asc' = ascending, 'desc' = descending
 *  sortEmptyCells: true // true = the table sorts empty cells, false = the table moves all empty cells to the end of the table
 * }
 * ```
 * @dependencies ObserveChanges moment
 */
class ColumnSorting extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of column destinationState manager.
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
     * Object containing visual row indexes mapped to data source indexes.
     *
     * @private
     * @type {RowsMapper}
     */
    this.rowsMapper = new RowsMapper(this);
    this.sortEmptyCells = SORT_EMPTY_CELLS_DEFAULT;
    this.indicator = SHOW_SORT_INDICATOR_DEFAULT;
    this.compareFunctionFactory = void 0;
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

    this.setPluginOptions();

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
   * Sorts the table by chosen columns and orders.
   *
   * @param {Array|Object} stateOrStates State or list of states. State object contains `column` and `order` properties. First of them contains visual column index, the second one
   * contains sorting order (`asc` for ascending, `desc` for descending).
   *
   * @fires Hooks#beforeColumnSort
   * @fires Hooks#afterColumnSort
   */
  sort(stateOrStates) {
    const startingState = this.getSortingState();
    let destinationState = stateOrStates;

    if (isUndefined(stateOrStates)) {
      destinationState = [];

    } else if (Array.isArray(destinationState) === false) {
      destinationState = [stateOrStates];
    }

    const allowSorting = this.hot.runHooks('beforeColumnSort', startingState, destinationState);

    destinationState = arrayMap(destinationState, (columnState) => this.translateColumnToPhysical(columnState));

    if (allowSorting === false) {
      return;
    }
    this.columnStatesManager.setState(destinationState);
    this.sortByPresetColumnAndOrder();

    this.hot.runHooks('afterColumnSort', startingState, this.getSortingState());

    this.hot.render();
    this.hot.view.wt.draw(true);

    this.saveSortingState();
  }

  getSortingState(column) {
    if (isDefined(column)) {
      const physicalColumn = this.hot.toPhysicalColumn(column);
      const state = this.columnStatesManager.getColumnState(physicalColumn);

      if (isDefined(state)) {
        return this.translateColumnToVisual(state);
      }

      return void 0;
    }

    const state = this.columnStatesManager.getAllStates();
    return arrayMap(state, (columnState) => this.translateColumnToVisual(columnState));
  }

  getNextColumnState(column) {
    const columnState = this.getSortingState(column);
    const nrOfColumns = this.hot.countCols();

    if (isDefined(columnState)) {
      const sortingOrder = this.getNextSortingOrder(columnState.sortOrder);

      if (isDefined(sortingOrder)) {
        columnState.sortOrder = sortingOrder;

        return columnState;
      }

      return void 0;
    }

    if (Number.isInteger(column) && column >= 0 && column < nrOfColumns) {
      return {
        column,
        sortOrder: this.getNextSortingOrder(void 0)
      };
    }

    return void 0;
  }

  getNextSortingState(columnToChange, strategy = APPEND_COLUMN_STATE_STRATEGY) {
    const physicalColumn = this.hot.toPhysicalColumn(columnToChange);
    const indexOfColumnToChange = this.columnStatesManager.getIndexOfColumnInStatesQueue(physicalColumn);
    const isColumnSorted = this.columnStatesManager.isColumnSorted(physicalColumn);
    const currentSortingState = this.getSortingState();
    const nextColumnState = this.getNextColumnState(columnToChange);

    if (isColumnSorted) {
      if (isUndefined(nextColumnState)) {
        return [...currentSortingState.slice(0, indexOfColumnToChange), ...currentSortingState.slice(indexOfColumnToChange + 1)];
      }

      if (strategy === APPEND_COLUMN_STATE_STRATEGY) {
        return [...currentSortingState.slice(0, indexOfColumnToChange), ...currentSortingState.slice(indexOfColumnToChange + 1), nextColumnState];

      } else if (strategy === REPLACE_COLUMN_STATE_STRATEGY) {
        return [...currentSortingState.slice(0, indexOfColumnToChange), nextColumnState, ...currentSortingState.slice(indexOfColumnToChange + 1)];
      }
    }

    if (isDefined(nextColumnState)) {
      return currentSortingState.concat(nextColumnState);
    }

    return currentSortingState;
  }

  /**
   * Get next sorting order for particular column. The order sequence looks as follows: 'asc' -> 'desc' -> undefined -> 'asc'
   *
   * @private
   * @param {String|undefined} sortingOrder Sorting order (`asc` for ascending, `desc` for descending and undefined for not sorted).
   * @returns {String|undefined} Next sorting order (`asc` for ascending, `desc` for descending and undefined for not sorted).
   */
  getNextSortingOrder(sortingOrder) {
    if (sortingOrder === DESC_SORT_STATE) {
      return void 0;

    } else if (sortingOrder === ASC_SORT_STATE) {
      return DESC_SORT_STATE;
    }

    return ASC_SORT_STATE;
  }

  translateColumnToVisual({column, ...restOfProperties}) {
    return {column: this.hot.toVisualColumn(column), ...restOfProperties};
  }

  translateColumnToPhysical({column, ...restOfProperties}) {
    return {column: this.hot.toVisualColumn(column), ...restOfProperties};
  }

  join(state) {
    return extend(this.getPluginOptions(), state);
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
      const settings = this.getPluginOptions();

      settings.columns = this.columnStatesManager.getAllStates();

      this.hot.runHooks('persistentStateSave', 'columnSorting', settings);
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
    const sortFunctionForFirstColumn = this.getSortingState(visualColumn).compareFunctionFactory || getCompareFunctionFactory(columnMeta);
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

    mergeSort(indexesWithData, sortFunctionForFirstColumn(arrayMap(this.getSortingState(), (columnState) => this.join(columnState)),
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
      objectEach(columnSorting, (value, property) => {
        if (inheritedColumnProperties.includes(property)) {
          this[property] = value;
        }
      });
    }
  }

  getPluginOptions() {
    const options = {};

    arrayEach(inheritedColumnProperties, (property) => {
      if (isDefined(this[property])) {
        options[property] = this[property];
      }
    });

    return options;
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
   * @param {Number} column Visual column index.
   * @returns {Boolean}
   */
  getColumnSortIndicator(column) {
    let { indicator: sortIndicator } = this.getPluginOptions();
    const columnState = this.getSortingState(column);

    // console.log(columnState);

    if (isObject(columnState) && isDefined(columnState.indicator)) {
      sortIndicator = columnState.indicator;
    }

    return sortIndicator;
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

    // if (column === 0) {
    //   console.log(this.getColumnSortIndicator(column));
    // }

    addClass(headerLink, this.domHelper.getAddedClasses(physicalColumn, this.getColumnSortIndicator(column)));
  }

  /**
   * afterUpdateSettings callback.
   *
   * @private
   */
  onAfterUpdateSettings() {
    this.setPluginOptions();
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

    if (isObject(loadedSortingState)) {
      this.sort(loadedSortingState.columns);

    } else if (isObject(sortingSettings) && Array.isArray(sortingSettings.columns) && sortingSettings.columns.every(isValidColumnState)) {
      this.sort(sortingSettings.columns);
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
      this.sort(this.getNextColumnState(coords.col));
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
