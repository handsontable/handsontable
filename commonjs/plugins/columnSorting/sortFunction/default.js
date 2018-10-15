'use strict';

exports.__esModule = true;
exports.default = defaultSort;

var _mixed = require('../../../helpers/mixed');

var _comparatorEngine = require('../comparatorEngine');

/**
 * Default sorting compare function factory. Method get as parameters `sortOrder` and `columnMeta` and return compare function.
 *
 * @param {String} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {Object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
function defaultSort(sortOrder, columnMeta) {
  return function (value, nextValue) {
    var sortEmptyCells = columnMeta.columnSorting.sortEmptyCells;


    if (typeof value === 'string') {
      value = value.toLowerCase();
    }

    if (typeof nextValue === 'string') {
      nextValue = nextValue.toLowerCase();
    }

    if (value === nextValue) {
      return _comparatorEngine.DO_NOT_SWAP;
    }

    if ((0, _mixed.isEmpty)(value)) {
      if ((0, _mixed.isEmpty)(nextValue)) {
        return _comparatorEngine.DO_NOT_SWAP;
      }

      // Just fist value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? _comparatorEngine.FIRST_BEFORE_SECOND : _comparatorEngine.FIRST_AFTER_SECOND;
      }

      return _comparatorEngine.FIRST_AFTER_SECOND;
    }

    if ((0, _mixed.isEmpty)(nextValue)) {
      // Just second value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? _comparatorEngine.FIRST_AFTER_SECOND : _comparatorEngine.FIRST_BEFORE_SECOND;
      }

      return _comparatorEngine.FIRST_BEFORE_SECOND;
    }

    if (isNaN(value) && !isNaN(nextValue)) {
      return sortOrder === 'asc' ? _comparatorEngine.FIRST_AFTER_SECOND : _comparatorEngine.FIRST_BEFORE_SECOND;
    } else if (!isNaN(value) && isNaN(nextValue)) {
      return sortOrder === 'asc' ? _comparatorEngine.FIRST_BEFORE_SECOND : _comparatorEngine.FIRST_AFTER_SECOND;
    } else if (!(isNaN(value) || isNaN(nextValue))) {
      value = parseFloat(value);
      nextValue = parseFloat(nextValue);
    }

    if (value < nextValue) {
      return sortOrder === 'asc' ? _comparatorEngine.FIRST_BEFORE_SECOND : _comparatorEngine.FIRST_AFTER_SECOND;
    }

    if (value > nextValue) {
      return sortOrder === 'asc' ? _comparatorEngine.FIRST_AFTER_SECOND : _comparatorEngine.FIRST_BEFORE_SECOND;
    }

    return _comparatorEngine.DO_NOT_SWAP;
  };
}