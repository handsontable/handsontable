import {isDefined} from '../../helpers/mixed';

export const ASC_SORT_STATE = 'asc';
export const DESC_SORT_STATE = 'desc';
export const NONE_SORT_STATE = 'none';

/**
 * Store and manages states of sorted columns.
 *
 * @class ColumnStatesManager
 * @plugin ColumnSorting
 */
export class ColumnStatesManager {
  constructor() {
    /**
     * Queue of tuples containing sorted columns and their orders.
     *
     * @type {Map<Number, String>}
     */
    this.states = new Map();
  }

  /**
   * Get index of first sorted column.
   *
   * @returns {Number}
   */
  getFirstSortedColumn() {
    return this.states.keys().next().value;
  }

  /**
   * Get sorting order of column.
   *
   * @param {Number} column Physical column index.
   * @returns {String|undefined} Sorting order (`asc` for ascending, `desc` for descending and undefined for not sorted).
   */
  getSortingOrderOfColumn(column) {
    return this.states.get(column);
  }

  /**
   * Get list of sorted columns.
   *
   * @returns {Array}
   */
  getSortedColumns() {
    return Array.from(this.states.keys());
  }

  /**
   * Get list of sorting orders for sorted columns.
   *
   * @returns {Array} Array of sorting orders (`asc` for ascending and `desc` for descending).
   */
  getOrdersOfSortedColumns() {
    return Array.from(this.states.values());
  }

  /**
   * Get next sorting order for particular column. The order sequence looks as follows: 'asc' -> 'desc' -> undefined -> 'asc'
   *
   * @param {String|undefined} sortingOrder Sorting order (`asc` for ascending, `desc` for descending and undefined for not sorted).
   * @returns {String|undefined} Next sorting order (`asc` for ascending, `desc` for descending and undefined for not sorted).
   */
  getNextSortingOrderForColumn(sortingOrder) {
    if (sortingOrder === DESC_SORT_STATE) {
      return void 0;

    } else if (sortingOrder === ASC_SORT_STATE) {
      return DESC_SORT_STATE;
    }

    return ASC_SORT_STATE;
  }

  /**
   *
   * Set sorting order for particular column.
   *
   * @param {Number} column Physical column index.
   * @param {String} sortingOrder Sorting order (`asc` for ascending, `desc` for descending and `none` for initial state).
   * @param {Boolean} [clearAllStates=true] Clear already set states before operation.
   */
  setSortingOrder(column, sortingOrder = this.getNextSortingOrderForColumn(this.getSortingOrderOfColumn(column)), clearAllStates = true) {
    if (clearAllStates) {
      this.clearAllStates();

    } else {
      // remove particular column from the stack
      this.states.delete(column);
    }

    if (isDefined(sortingOrder) && sortingOrder !== NONE_SORT_STATE) {
      // add column to the stack (at the end of the list)
      this.states.set(column, sortingOrder);
    }
  }

  /**
   * Get order of particular column in the states queue.
   *
   * @param {Number} column Physical column index.
   * @returns {Number}
   */
  getIndexOfColumnInStatesQueue(column) {
    return this.getSortedColumns().indexOf(column);
  }

  /**
   * Get number of sorted columns.
   *
   * @returns {Number}
   */
  getNumberOfSortedColumns() {
    return this.states.size;
  }

  /**
   * Get if list of sorted columns is empty.
   *
   * @returns {Boolean}
   */
  isListOfSortedColumnsEmpty() {
    return this.states.size === 0;
  }

  /**
   * Get if particular column is sorted.
   *
   * @param {Number} column Physical column index.
   * @returns {Boolean}
   */
  isColumnSorted(column) {
    return this.states.has(column);
  }

  /**
   * Get all states in the form Array<Array<column, sortingOrder>>.
   *
   * @returns {Array}
   */
  getAllStates() {
    return Array.from(this.states);
  }

  /**
   * Clear the sorted column states queue.
   */
  clearAllStates() {
    this.states.clear();
  }
}
