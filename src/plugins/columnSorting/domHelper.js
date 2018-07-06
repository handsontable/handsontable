/* eslint-disable import/prefer-default-export */

import {ASC_SORT_STATE, DESC_SORT_STATE} from './columnStatesManager';

const HEADER_CLASS_ASC_SORT = 'ascending';
const HEADER_CLASS_DESC_SORT = 'descending';
export const HEADER_CLASS = 'colHeader';
export const HEADER_SORTING_CLASS = 'columnSorting';

const orderToCssClass = new Map([
  [ASC_SORT_STATE, HEADER_CLASS_ASC_SORT],
  [DESC_SORT_STATE, HEADER_CLASS_DESC_SORT]
]);

const sequenceToCssClass = new Map([
  [0, 'first'],
  [1, 'second'],
  [2, 'third'],
  [3, 'fourth'],
  [4, 'fifth'],
  [5, 'sixth'],
  [6, 'seventh']
]);

/**
 * Helper for the column sorting plugin. Manages the added and removed classes to DOM elements basing on state of sorting.
 *
 * @class DomHelper
 * @plugin ColumnSorting
 */
export class DomHelper {
  constructor(columnStatesManager) {
    this.columnStatesManager = columnStatesManager;
  }

  /**
   * Get CSS classes which should be added to particular column header.
   *
   * @param {Number} column Physical column index.
   * @param {Boolean} showSortIndicator Indicates if indicator should be shown for the particular column.
   * @returns {Array} Array of CSS classes.
   */
  getAddedClasses(column, showSortIndicator) {
    const cssClasses = [HEADER_SORTING_CLASS];

    if (this.columnStatesManager.isColumnSorted(column) && showSortIndicator) {
      const columnOrder = this.columnStatesManager.getSortingOrderOfColumn(column);

      cssClasses.push(orderToCssClass.get(columnOrder));

      if (this.columnStatesManager.getNumberOfSortedColumns() > 1) {
        cssClasses.push(sequenceToCssClass.get(this.columnStatesManager.getIndexOfColumnInStatesQueue(column)));
      }
    }

    return cssClasses;
  }

  /**
   * Get CSS classes which should be removed from column header.
   *
   * @returns {Array} Array of CSS classes.
   */
  getRemovedClasses() {
    const cssClasses = Array.from(orderToCssClass.values()).concat(Array.from((sequenceToCssClass.values())));

    return cssClasses;
  }
}
