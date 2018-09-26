import { isUndefined } from '../../helpers/mixed';
import { isObject } from '../../helpers/object';
import { warn } from '../../helpers/console';

export const ASC_SORT_STATE = 'asc';
export const DESC_SORT_STATE = 'desc';
export const HEADER_SPAN_CLASS = 'colHeader';

/**
 * Get if column state is valid.
 *
 * @param {Number} columnState Particular column state.
 * @returns {Boolean}
 */
function isValidColumnState(columnState) {
  if (isUndefined(columnState)) {
    return false;
  }

  const { column, sortOrder } = columnState;

  return Number.isInteger(column) && [ASC_SORT_STATE, DESC_SORT_STATE].includes(sortOrder);
}

/**
 * Get if all sorted columns states are valid.
 *
 * @param {Array} sortStates
 * @returns {Boolean}
 */
export function areValidSortStates(sortStates) {
  if (Array.isArray(sortStates) === false || sortStates.every(columnState => isObject(columnState)) === false) {
    return false;
  }

  const sortedColumns = sortStates.map(({ column }) => column);
  const indexOccursOnlyOnce = new Set(sortedColumns).size === sortedColumns.length;

  return indexOccursOnlyOnce && sortStates.every(isValidColumnState);
}

/**
 * Get next sort order for particular column. The order sequence looks as follows: 'asc' -> 'desc' -> undefined -> 'asc'
 *
 * @param {String|undefined} sortOrder sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).
 * @returns {String|undefined} Next sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).
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
 * Get multiple sorted column configs from sort configs with different data types.
 *
 * @param {undefined|Object|Array} sortConfig Single column sort configuration or full sort configuration (for all sorted columns).
 * The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains
 * sort order (`asc` for ascending, `desc` for descending).
 * @returns {Array}
 */
export function getFullSortConfiguration(sortConfig) {
  if (isUndefined(sortConfig)) {
    return [];
  }

  if (Array.isArray(sortConfig)) {
    return sortConfig;
  }

  return [sortConfig];
}

/**
 * Warn users about problems when using `columnSorting` and `columnSorting` plugins simultaneously.
 *
 * @param {undefined|Boolean|Object} columnSortingSettings
 */
export function warnIfPluginsHaveConflict(columnSortingSettings) {
  if (columnSortingSettings) {
    // DIFF - MultiColumnSorting & ColumnSorting: Warn will be called from the MultiColumnSorting plugin.
  }
}

/**
 * Warn users about problems with validating sort config.
 */
export function warnAboutNotValidatedConfig() {
  warn('Sort configuration failed to validate properly.');
}

/**
 * Get `span` DOM element inside `th` DOM element.
 *
 * @param {Element} TH th HTML element.
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
 * @param {Number} column Visual column index.
 * @param {Element} TH th HTML element.
 * @returns {Boolean}
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
