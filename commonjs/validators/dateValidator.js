'use strict';

exports.__esModule = true;
exports.default = dateValidator;
exports.correctFormat = correctFormat;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _date = require('../helpers/date');

var _editors = require('../editors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Date cell validator
 *
 * @private
 * @validator DateValidator
 * @dependencies moment
 * @param {*} value - Value of edited cell
 * @param {Function} callback - Callback called with validation result
 */
function dateValidator(value, callback) {
  var dateEditor = (0, _editors.getEditorInstance)('date', this.instance);
  var valueToValidate = value;
  var valid = true;

  if (valueToValidate === null || valueToValidate === void 0) {
    valueToValidate = '';
  }
  var isValidDate = (0, _moment2.default)(new Date(valueToValidate)).isValid() || (0, _moment2.default)(valueToValidate, dateEditor.defaultDateFormat).isValid();
  // is it in the specified format
  var isValidFormat = (0, _moment2.default)(valueToValidate, this.dateFormat || dateEditor.defaultDateFormat, true).isValid();

  if (this.allowEmpty && valueToValidate === '') {
    isValidDate = true;
    isValidFormat = true;
  }
  if (!isValidDate) {
    valid = false;
  }
  if (!isValidDate && isValidFormat) {
    valid = true;
  }

  if (isValidDate && !isValidFormat) {
    if (this.correctFormat === true) {
      // if format correction is enabled
      var correctedValue = correctFormat(valueToValidate, this.dateFormat);
      var row = this.instance.runHooks('unmodifyRow', this.row);
      var column = this.instance.runHooks('unmodifyCol', this.col);

      this.instance.setDataAtCell(row, column, correctedValue, 'dateValidator');
      valid = true;
    } else {
      valid = false;
    }
  }

  callback(valid);
}

/**
 * Format the given string using moment.js' format feature
 *
 * @param {String} value
 * @param {String} dateFormat
 * @returns {String}
 */
function correctFormat(value, dateFormat) {
  var dateFromDate = (0, _moment2.default)((0, _date.getNormalizedDate)(value));
  var dateFromMoment = (0, _moment2.default)(value, dateFormat);
  var isAlphanumeric = value.search(/[A-z]/g) > -1;
  var date = void 0;

  if (dateFromDate.isValid() && dateFromDate.format('x') === dateFromMoment.format('x') || !dateFromMoment.isValid() || isAlphanumeric) {
    date = dateFromDate;
  } else {
    date = dateFromMoment;
  }

  return date.format(dateFormat);
}