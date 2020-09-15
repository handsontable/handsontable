import { isObject, objectEach } from '../../helpers/object';
import { arrayMap } from '../../helpers/array';

const inheritedColumnProperties = ['sortEmptyCells', 'indicator', 'headerAction', 'compareFunctionFactory'];

const SORT_EMPTY_CELLS_DEFAULT = false;
const SHOW_SORT_INDICATOR_DEFAULT = true;
const HEADER_ACTION_DEFAULT = true;

/**
 * Store and manages states of sorted columns.
 *
 * @class ColumnStatesManager
 * @plugin ColumnSorting
 */
// eslint-disable-next-line import/prefer-default-export
export class ColumnStatesManager {
  constructor(sortingStates) {
    /**
     * Map storing sorting state for every column.
     *
     * @type {IndexMap}
     */
    this.sortingStates = sortingStates;
    /**
     * Determines whether we should sort empty cells.
     *
     * @type {boolean}
     */
    this.sortEmptyCells = SORT_EMPTY_CELLS_DEFAULT;
    /**
     * Determines whether indicator should be visible (for sorted columns).
     *
     * @type {boolean}
     */
    this.indicator = SHOW_SORT_INDICATOR_DEFAULT;
    /**
     * Determines whether click on the header perform sorting.
     *
     * @type {boolean}
     */
    this.headerAction = HEADER_ACTION_DEFAULT;
    /**
     * Determines compare function factory. Method get as parameters `sortOder` and `columnMeta` and return compare function.
     */
    this.compareFunctionFactory = void 0;
  }

  /**
   * Get states for sorted columns.
   *
   * @returns {* | *[]}
   */
  getSortedColumnsStates() {
    if (this.sortingStates === null) {
      return [];
    }

    return this.sortingStates.getValues().reduce((sortedColumnsStates, sortState, physicalIndex) => {
      if (sortState !== null) {
        return sortedColumnsStates.concat({
          column: physicalIndex,
          ...sortState
        });
      }

      return sortedColumnsStates;
    }, []).sort((sortStateForColumn1, sortStateForColumn2) => {
      // Sort state should be sorted by the priority. Please keep in mind that a lower number has a higher priority.
      return sortStateForColumn1.priority - sortStateForColumn2.priority;
    }).map((sortConfigForColumn) => {
      // Removing the `priority` key, needed just for sorting states.
      return { column: sortConfigForColumn.column, sortOrder: sortConfigForColumn.sortOrder };
    });
  }

  /**
   * Update column properties which affect the sorting result.
   *
   * **Note**: All column properties can be overwritten by [columns](https://handsontable.com/docs/Options.html#columns) option.
   *
   * @param {object} allSortSettings Column sorting plugin's configuration object.
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
   * @returns {object}
   */
  getAllColumnsProperties() {
    const columnProperties = {
      sortEmptyCells: this.sortEmptyCells,
      indicator: this.indicator,
      headerAction: this.headerAction
    };

    if (typeof this.compareFunctionFactory === 'function') {
      columnProperties.compareFunctionFactory = this.compareFunctionFactory;
    }

    return columnProperties;
  }

  /**
   * Get sort order of column.
   *
   * @param {number} searchedColumn Physical column index.
   * @returns {string|undefined} Sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).
   */
  getSortOrderOfColumn(searchedColumn) {
    return this.sortingStates.getValueAtIndex(searchedColumn)?.sortOrder;
  }

  /**
   * Get list of sorted columns.
   *
   * @returns {Array}
   */
  getSortedColumns() {
    return arrayMap(this.getSortedColumnsStates(), ({ column }) => column);
  }

  /**
   * Get order of particular column in the states queue.
   *
   * @param {number} column Physical column index.
   * @returns {number}
   */
  getIndexOfColumnInSortQueue(column) {
    return this.getSortedColumns().indexOf(column);
  }

  /**
   * Get number of sorted columns.
   *
   * @returns {number}
   */
  getNumberOfSortedColumns() {
    return this.getSortedColumnsStates().length;
  }

  /**
   * Get if list of sorted columns is empty.
   *
   * @returns {boolean}
   */
  isListOfSortedColumnsEmpty() {
    return this.sortingStates.getValues().some(sortState => isObject(sortState)) === false;
  }

  /**
   * Get if particular column is sorted.
   *
   * @param {number} column Physical column index.
   * @returns {boolean}
   */
  isColumnSorted(column) {
    return isObject(this.sortingStates.getValueAtIndex(column));
  }

  /**
   * Get states for all sorted columns.
   *
   * @returns {Array}
   */
  getSortStates() {
    return this.getSortedColumnsStates();
  }

  /**
   * Get sort state for particular column. Object contains `column` and `sortOrder` properties.
   *
   * **Note**: Please keep in mind that returned objects expose **physical** column index under the `column` key.
   *
   * @param {number} column Physical column index.
   * @returns {object|undefined}
   */
  getColumnSortState(column) {
    if (this.isColumnSorted(column)) {
      return this.getSortedColumnsStates()[this.getIndexOfColumnInSortQueue(column)];
    }
  }

  /**
   * Set all column states.
   *
   * @param {Array} sortStates Sort states.
   */
  setSortStates(sortStates) {
    this.sortingStates.clear();

    for (let i = 0; i < sortStates.length; i += 1) {
      this.sortingStates.setValueAtIndex(sortStates[i].column, {
        sortOrder: sortStates[i].sortOrder,
        priority: i, // Please keep in mind that a lower number has a higher priority.
      });
    }
  }
}
