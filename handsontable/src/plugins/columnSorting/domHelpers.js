import { isDefined } from '../../helpers/mixed';
import { ASC_SORT_STATE, DESC_SORT_STATE } from './utils';

const HEADER_CLASS_ASC_SORT = 'ascending';
const HEADER_CLASS_DESC_SORT = 'descending';
const HEADER_CLASS_INDICATOR_DISABLED = 'indicatorDisabled';
const HEADER_SORT_CLASS = 'columnSorting';
const HEADER_ACTION_CLASS = 'sortAction';

const orderToCssClass = new Map([
  [ASC_SORT_STATE, HEADER_CLASS_ASC_SORT],
  [DESC_SORT_STATE, HEADER_CLASS_DESC_SORT]
]);

const ACCESSIBILITY_ATTR_SORT = ['aria-sort'];
const ACCESSIBILITY_ATTR_SORT_VALUES = {
  NONE: 'none',
  ASC: 'ascending',
  DESC: 'descending',
  OTHER: 'other'
};

/**
 * Get CSS classes which should be added to particular column header.
 *
 * @param {object} columnStatesManager Instance of column state manager.
 * @param {number} column Visual column index.
 * @param {boolean} showSortIndicator Indicates if indicator should be shown for the particular column.
 * @param {boolean} headerAction Indicates if header click to sort should be possible.
 * @returns {Array} Array of CSS classes.
 */
export function getClassesToAdd(columnStatesManager, column, showSortIndicator, headerAction) {
  const cssClasses = [HEADER_SORT_CLASS];

  if (headerAction) {
    cssClasses.push(HEADER_ACTION_CLASS);
  }

  if (showSortIndicator === false) {
    cssClasses.push(HEADER_CLASS_INDICATOR_DISABLED);

    return cssClasses;
  }

  const columnOrder = columnStatesManager.getSortOrderOfColumn(column);

  if (isDefined(columnOrder)) {
    cssClasses.push(orderToCssClass.get(columnOrder));
  }

  return cssClasses;
}

/**
 * Get CSS classes which should be removed from column header.
 *
 * @returns {Array} Array of CSS classes.
 */
export function getClassesToRemove() {
  return Array.from(orderToCssClass.values())
    .concat(HEADER_ACTION_CLASS, HEADER_CLASS_INDICATOR_DISABLED, HEADER_SORT_CLASS);
}

/**
 * Get the list of accessibility attributes to be applied to the column headers.
 *
 * @param {string} sortOrder The sorting order.
 * @returns {Array[]}
 */
export function getAccessibilityAttributes(sortOrder) {
  return [[
    ACCESSIBILITY_ATTR_SORT, ACCESSIBILITY_ATTR_SORT_VALUES[sortOrder ? sortOrder.toUpperCase() : 'NONE'],
  ]];
}
