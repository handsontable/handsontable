import {isObject, objectEach} from '../../helpers/object';
import {arrayMap} from '../../helpers/array';
import {isDefined} from '../../helpers/mixed';

const inheritedColumnProperties = ['sortEmptyCells', 'indicator', 'compareFunctionFactory'];

export const ASC_SORT_STATE = 'asc';
export const DESC_SORT_STATE = 'desc';

const SORT_EMPTY_CELLS_DEFAULT = false;
const SHOW_SORT_INDICATOR_DEFAULT = false;

export function isValidColumnState(columnState) {
  const {column, sortOrder} = columnState;

  return isDefined(column) && [ASC_SORT_STATE, DESC_SORT_STATE].includes(sortOrder);
}

/**
 * Store and manages states of sorted columns.
 *
 * @class ColumnStatesManager
 * @plugin ColumnSorting
 */
export class ColumnStatesManager {
  constructor() {
    /**
     * Queue of states containing sorted columns and their orders. State is an objects containing `column` and `order` properties.
     *
     * @private
     * @type {Array}
     */
    this.sortingStates = [];

    this.sortEmptyCells = SORT_EMPTY_CELLS_DEFAULT;
    this.indicator = SHOW_SORT_INDICATOR_DEFAULT;
    this.compareFunctionFactory = void 0;
  }

  /**
   * Get index of first sorted column.
   *
   * @returns {Number|undefined}
   */
  getFirstSortedColumn() {
    let firstSortedColumn;

    if (this.getNumberOfSortedColumns() > 0) {
      firstSortedColumn = this.sortingStates[0].column;
    }

    return firstSortedColumn;
  }

  /**
   * Get sorting order of column.
   *
   * @param {Number} searchedColumn Physical column index.
   * @returns {String|undefined} Sorting order (`asc` for ascending, `desc` for descending and undefined for not sorted).
   */
  getSortingOrderOfColumn(searchedColumn) {
    const searchedState = this.sortingStates.find(({column}) => searchedColumn === column);
    let sortingOrder;

    if (isObject(searchedState)) {
      sortingOrder = searchedState.sortOrder;
    }

    return sortingOrder;
  }

  /**
   * Get list of sorted columns.
   *
   * @returns {Array}
   */
  getSortedColumns() {
    return arrayMap(this.sortingStates, ({column}) => column);
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
    return this.sortingStates.length;
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

  setState(states) {
    this.sortingStates = states;
  }

  /**
   * Get all states in the form Array<Array<column, sortingOrder>>.
   *
   * @returns {Array}
   */
  getColumnState(column) {
    if (this.isColumnSorted(column)) {
      return this.sortingStates[this.getIndexOfColumnInStatesQueue(column)];
    }

    return void 0;
  }

  getAllStates() {
    return this.sortingStates;
  }

  updateDefaultColumnProperties(configuration) {
    if (!isObject(configuration)) {
      return;
    }

    objectEach(configuration, (newValue, property) => {
      if (inheritedColumnProperties.includes(property)) {
        this[property] = newValue;
      }
    });
  }

  getDefaultColumnProperties() {
    return {
      sortEmptyCells: this.sortEmptyCells,
      indicator: this.indicator,
      compareFunctionFactory: this.compareFunctionFactory
    };
  }

  /**
   * Clear the sorted column states queue.
   */
  clearAllStates() {
    this.sortingStates.length = 0;
  }
}
