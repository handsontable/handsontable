'use strict';

exports.__esModule = true;
exports.HEADER_SPAN_CLASS = exports.DESC_SORT_STATE = exports.ASC_SORT_STATE = undefined;
exports.areValidSortStates = areValidSortStates;
exports.getNextSortOrder = getNextSortOrder;
exports.getFullSortConfiguration = getFullSortConfiguration;
exports.warnIfPluginsHaveConflict = warnIfPluginsHaveConflict;
exports.warnAboutNotValidatedConfig = warnAboutNotValidatedConfig;
exports.getHeaderSpanElement = getHeaderSpanElement;
exports.isFirstLevelColumnHeader = isFirstLevelColumnHeader;

var _mixed = require('../../helpers/mixed');

var _object = require('../../helpers/object');

var _console = require('../../helpers/console');

var ASC_SORT_STATE = exports.ASC_SORT_STATE = 'asc';
var DESC_SORT_STATE = exports.DESC_SORT_STATE = 'desc';
var HEADER_SPAN_CLASS = exports.HEADER_SPAN_CLASS = 'colHeader';

/**
 * Get if column state is valid.
 *
 * @param {Number} columnState Particular column state.
 * @returns {Boolean}
 */
function isValidColumnState(columnState) {
  if ((0, _mixed.isUndefined)(columnState)) {
    return false;
  }

  var column = columnState.column,
      sortOrder = columnState.sortOrder;


  return Number.isInteger(column) && [ASC_SORT_STATE, DESC_SORT_STATE].includes(sortOrder);
}

/**
 * Get if all sorted columns states are valid.
 *
 * @param {Array} sortStates
 * @returns {Boolean}
 */
function areValidSortStates(sortStates) {
  if (Array.isArray(sortStates) === false || sortStates.every(function (columnState) {
    return (0, _object.isObject)(columnState);
  }) === false) {
    return false;
  }

  var sortedColumns = sortStates.map(function (_ref) {
    var column = _ref.column;
    return column;
  });
  var indexOccursOnlyOnce = new Set(sortedColumns).size === sortedColumns.length;

  return indexOccursOnlyOnce && sortStates.every(isValidColumnState);
}

/**
 * Get next sort order for particular column. The order sequence looks as follows: 'asc' -> 'desc' -> undefined -> 'asc'
 *
 * @param {String|undefined} sortOrder sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).
 * @returns {String|undefined} Next sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).
 */
function getNextSortOrder(sortOrder) {
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
function getFullSortConfiguration(sortConfig) {
  if ((0, _mixed.isUndefined)(sortConfig)) {
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
function warnIfPluginsHaveConflict(columnSortingSettings) {
  if (columnSortingSettings) {
    // DIFF - MultiColumnSorting & ColumnSorting: Warn will be called from the MultiColumnSorting plugin.
  }
}

/**
 * Warn users about problems with validating sort config.
 */
function warnAboutNotValidatedConfig() {
  (0, _console.warn)('Sort configuration failed to validate properly.');
}

/**
 * Get `span` DOM element inside `th` DOM element.
 *
 * @param {Element} TH th HTML element.
 * @returns {Element | null}
 */
function getHeaderSpanElement(TH) {
  var headerSpanElement = TH.querySelector('.' + HEADER_SPAN_CLASS);

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
function isFirstLevelColumnHeader(column, TH) {
  if (column < 0 || !TH.parentNode) {
    return false;
  }

  var TRs = TH.parentNode.parentNode.childNodes;
  var headerLevel = Array.from(TRs).indexOf(TH.parentNode) - TRs.length;

  if (headerLevel !== -1) {
    return false;
  }

  return true;
}