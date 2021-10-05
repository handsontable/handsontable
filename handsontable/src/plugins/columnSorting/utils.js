import { isObject } from '../../helpers/object';
import { isRightClick } from '../../helpers/dom/event';

export const ASC_SORT_STATE = 'asc';
export const DESC_SORT_STATE = 'desc';
export const HEADER_SPAN_CLASS = 'colHeader';

/**
 * Get if column state is valid.
 *
 * @param {number} columnState Particular column state.
 * @returns {boolean}
 */
function isValidColumnState(columnState) {
  if (isObject(columnState) === false) {
    return false;
  }

  const { column, sortOrder } = columnState;

  return Number.isInteger(column) && [ASC_SORT_STATE, DESC_SORT_STATE].includes(sortOrder);
}

/**
 * Get if all sorted columns states are valid.
 *
 * @param {Array} sortStates The sort state collection.
 * @returns {boolean}
 */
export function areValidSortStates(sortStates) {
  if (sortStates.some(columnState => isValidColumnState(columnState) === false)) {
    return false;
  }

  const sortedColumns = sortStates.map(({ column }) => column);

  // Indexes occurs only once.
  return new Set(sortedColumns).size === sortedColumns.length;
}

/**
 * Get next sort order for particular column. The order sequence looks as follows: 'asc' -> 'desc' -> undefined -> 'asc'.
 *
 * @param {string|undefined} sortOrder Sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).
 * @returns {string|undefined} Next sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).
 */
export function getNextSortOrder(sortOrder) {
  if (sortOrder === DESC_SORT_STATE) {
    return;

  } else if (sortOrder === ASC_SORT_STATE) {
    return DESC_SORT_STATE;
  }

  return ASC_SORT_STATE;
}

/**
 * Get `span` DOM element inside `th` DOM element.
 *
 * @param {Element} TH Th HTML element.
 * @returns {Element | null}
 */
export function getHeaderSpanElement(TH) {
  const headerSpanElement = TH.querySelector(`.${HEADER_SPAN_CLASS}`);

  return headerSpanElement;
}

/**
 *
 * Get if handled header is first level column header.
 *
 * @param {number} column Visual column index.
 * @param {Element} TH Th HTML element.
 * @returns {boolean}
 */
export function isFirstLevelColumnHeader(column, TH) {
  if (column < 0 || !TH.parentNode) {
    return false;
  }

  const TRs = TH.parentNode.parentNode.childNodes;
  const headerLevel = Array.from(TRs).indexOf(TH.parentNode) - TRs.length;

  if (headerLevel !== -1) {
    return false;
  }

  return true;
}

/**
 *  Get if header was clicked properly. Click on column header and NOT done by right click return `true`.
 *
 * @param {number} row Visual row index.
 * @param {number} column Visual column index.
 * @param {Event} clickEvent Click event.
 * @returns {boolean}
 */
export function wasHeaderClickedProperly(row, column, clickEvent) {
  return row === -1 && column >= 0 && isRightClick(clickEvent) === false;
}
