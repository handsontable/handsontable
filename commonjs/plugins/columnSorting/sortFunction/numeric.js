'use strict';

exports.__esModule = true;
exports.default = numericSort;

var _mixed = require('../../../helpers/mixed');

var _comparatorEngine = require('../comparatorEngine');

/**
 * Numeric sorting compare function factory. Method get as parameters `sortOrder` and `columnMeta` and return compare function.
 *
 * @param {String} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {Object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
function numericSort(sortOrder, columnMeta) {
  return function (value, nextValue) {
    var parsedFirstValue = parseFloat(value);
    var parsedSecondValue = parseFloat(nextValue);
    var sortEmptyCells = columnMeta.columnSorting.sortEmptyCells;

    // Watch out when changing this part of code! Check below returns 0 (as expected) when comparing empty string, null, undefined

    if (parsedFirstValue === parsedSecondValue || isNaN(parsedFirstValue) && isNaN(parsedSecondValue)) {
      return _comparatorEngine.DO_NOT_SWAP;
    }

    if (sortEmptyCells) {
      if ((0, _mixed.isEmpty)(value)) {
        return sortOrder === 'asc' ? _comparatorEngine.FIRST_BEFORE_SECOND : _comparatorEngine.FIRST_AFTER_SECOND;
      }

      if ((0, _mixed.isEmpty)(nextValue)) {
        return sortOrder === 'asc' ? _comparatorEngine.FIRST_AFTER_SECOND : _comparatorEngine.FIRST_BEFORE_SECOND;
      }
    }

    if (isNaN(parsedFirstValue)) {
      return _comparatorEngine.FIRST_AFTER_SECOND;
    }

    if (isNaN(parsedSecondValue)) {
      return _comparatorEngine.FIRST_BEFORE_SECOND;
    }

    if (parsedFirstValue < parsedSecondValue) {
      return sortOrder === 'asc' ? _comparatorEngine.FIRST_BEFORE_SECOND : _comparatorEngine.FIRST_AFTER_SECOND;
    } else if (parsedFirstValue > parsedSecondValue) {
      return sortOrder === 'asc' ? _comparatorEngine.FIRST_AFTER_SECOND : _comparatorEngine.FIRST_BEFORE_SECOND;
    }

    return _comparatorEngine.DO_NOT_SWAP;
  };
}