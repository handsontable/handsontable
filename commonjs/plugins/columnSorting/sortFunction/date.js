'use strict';

exports.__esModule = true;
exports.default = dateSort;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _mixed = require('../../../helpers/mixed');

var _comparatorEngine = require('../comparatorEngine');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Date sorting compare function factory. Method get as parameters `sortOrder` and `columnMeta` and return compare function.
 *
 * @param {String} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {Object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
function dateSort(sortOrder, columnMeta) {
  return function (value, nextValue) {
    var sortEmptyCells = columnMeta.columnSorting.sortEmptyCells;


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

    var dateFormat = columnMeta.dateFormat;
    var firstDate = (0, _moment2.default)(value, dateFormat);
    var nextDate = (0, _moment2.default)(nextValue, dateFormat);

    if (!firstDate.isValid()) {
      return _comparatorEngine.FIRST_AFTER_SECOND;
    }

    if (!nextDate.isValid()) {
      return _comparatorEngine.FIRST_BEFORE_SECOND;
    }

    if (nextDate.isAfter(firstDate)) {
      return sortOrder === 'asc' ? _comparatorEngine.FIRST_BEFORE_SECOND : _comparatorEngine.FIRST_AFTER_SECOND;
    }

    if (nextDate.isBefore(firstDate)) {
      return sortOrder === 'asc' ? _comparatorEngine.FIRST_AFTER_SECOND : _comparatorEngine.FIRST_BEFORE_SECOND;
    }

    return _comparatorEngine.DO_NOT_SWAP;
  };
}