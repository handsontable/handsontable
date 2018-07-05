import {isDefined} from '../../helpers/mixed';

export const ASC_SORT_STATE = 'asc';
export const DESC_SORT_STATE = 'desc';
export const NONE_SORT_STATE = 'none';

// TODO: Add comment, check that in displaySwitch.js

export class SortedColumnStates {
  constructor() {
    this.states = new Map();
  }

  getFirstColumn() {
    return this.states.keys().next().value;
  }

  getByColumn(physicalSortedColumn) {
    return this.states.get(physicalSortedColumn);
  }

  getColumnList() {
    return Array.from(this.states.keys());
  }

  getOrdersList() {
    return Array.from(this.states.values());
  }

  getSize() {
    return this.states.size;
  }

  getAll() {
    return Array.from(this.states);
  }

  /**
   * Get new order state for particular column. The states queue looks as follows: 'asc' -> 'desc' -> 'none' -> 'asc'
   *
   * @param {String} columnOrder Column order.
   * @returns {String} Sorting order (`asc` for ascending, `desc` for descending and `none` for initial state).
   */
  getNextOrder(columnOrder) {
    if (columnOrder === DESC_SORT_STATE) {
      return void 0;

    } else if (columnOrder === ASC_SORT_STATE) {
      return DESC_SORT_STATE;
    }

    return ASC_SORT_STATE;
  }

  set(column, order = this.getNextOrder(this.getByColumn(column)), clearPrevious = true) {
    if (clearPrevious) {
      this.clear();

    } else {
      // remove particular column from the stack
      this.states.delete(column);
    }

    if (isDefined(order) && order !== NONE_SORT_STATE) {
      // add column to the stack (at the end of the list)
      this.states.set(column, order);
    }
  }

  indexOf(column) {
    return this.getColumnList().indexOf(column);
  }

  isEmpty() {
    return this.states.size === 0;
  }

  isSorted(physicalSortedColumn) {
    return this.states.has(physicalSortedColumn);
  }

  clear() {
    this.states.clear();
  }
}
