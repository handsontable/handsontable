import { isObject, objectEach, deepClone } from 'handsontable/helpers/object';
import { arrayMap } from 'handsontable/helpers/array';

const inheritedColumnProperties = ['sortEmptyCells', 'indicator', 'headerAction', 'compareFunctionFactory'];

const SORT_EMPTY_CELLS_DEFAULT = false;
const SHOW_SORT_INDICATOR_DEFAULT = true;
const HEADER_ACTION_DEFAULT = true;

/**
 * Store and manages states of sorted columns.
 *
 * @class ColumnStatesManager
 * @plugin MultiColumnSorting
 */
// eslint-disable-next-line import/prefer-default-export
export class ColumnStatesManager {
  constructor() {
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
  updateAllColumnsProperties(allSortSettings) {
    if (!isObject(allSortSettings)) {
      return;
    }

    objectEach(allSortSettings, (newValue, propertyName) => {
      if (inheritedColumnProperties.includes(propertyName)) {
        this[propertyName] = newValue;
      }
    });
  }

  /**
   * Get all column properties which affect the sorting result.
   *
   * @returns {Object}
   */
  getAllColumnsProperties() {
    const columnProperties = {
      sortEmptyCells: this.sortEmptyCells,
      indicator: this.indicator,
      headerAction: this.headerAction
    };

    if (typeof this.compareFunctionFactory !== 'undefined') {
      columnProperties.compareFunctionFactory = this.compareFunctionFactory;
    }

    return columnProperties;
  }

  /**
   * Get index of first sorted column.
   *
   * @returns {Number|undefined}
   */
  getFirstSortedColumn() {
    let firstSortedColumn;

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
  getSortOrderOfColumn(searchedColumn) {
    const searchedState = this.sortedColumnsStates.find(({ column }) => searchedColumn === column);
    let sortOrder;

    if (isObject(searchedState)) {
      sortOrder = searchedState.sortOrder;
    }

    return sortOrder;
  }

  /**
   * Get list of sorted columns.
   *
   * @returns {Array}
   */
  getSortedColumns() {
    return arrayMap(this.sortedColumnsStates, ({ column }) => column);
  }

  /**
   * Get order of particular column in the states queue.
   *
   * @param {Number} column Physical column index.
   * @returns {Number}
   */
  getIndexOfColumnInSortQueue(column) {
    return this.getSortedColumns().indexOf(column);
  }

  /**
   * Get number of sorted columns.
   *
   * @returns {Number}
   */
  getNumberOfSortedColumns() {
    return this.sortedColumnsStates.length;
  }

  /**
   * Get if list of sorted columns is empty.
   *
   * @returns {Boolean}
   */
  isListOfSortedColumnsEmpty() {
    return this.getNumberOfSortedColumns() === 0;
  }

  /**
   * Get if particular column is sorted.
   *
   * @param {Number} column Physical column index.
   * @returns {Boolean}
   */
  isColumnSorted(column) {
    return this.getSortedColumns().includes(column);
  }

  /**
   * Get states for all sorted columns.
   *
   * @returns {Array}
   */
  getSortStates() {
    return deepClone(this.sortedColumnsStates);
  }

  /**
   * Get sort state for particular column. Object contains `column` and `sortOrder` properties.
   *
   * **Note**: Please keep in mind that returned objects expose **physical** column index under the `column` key.
   *
   * @param {Number} column Physical column index.
   * @returns {Object|undefined}
   */
  getColumnSortState(column) {
    if (this.isColumnSorted(column)) {
      return deepClone(this.sortedColumnsStates[this.getIndexOfColumnInSortQueue(column)]);
    }
  }

  /**
   * Set all sorted columns states.
   *
   * @param {Array} sortStates
   */
  setSortStates(sortStates) {
    this.sortedColumnsStates = sortStates;
  }

  /**
   * Destroy the state manager.
   */
  destroy() {
    this.sortedColumnsStates.length = 0;
    this.sortedColumnsStates = null;
  }
}
