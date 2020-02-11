import moment from 'moment';
import { getNormalizedDate } from '../helpers/date';
import { getEditorInstance } from '../editors';

/**
 * The Date cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export default function dateValidator(value, callback) {
  const dateEditor = getEditorInstance('date', this.instance);
  let valueToValidate = value;
  let valid = true;

  if (valueToValidate === null || valueToValidate === void 0) {
    valueToValidate = '';
  }

  let isValidFormat = moment(valueToValidate, this.dateFormat || dateEditor.defaultDateFormat, true).isValid();
  let isValidDate = moment(new Date(valueToValidate)).isValid() || isValidFormat;

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
    if (this.correctFormat === true) { // if format correction is enabled
      const correctedValue = correctFormat(valueToValidate, this.dateFormat);
      const row = this.instance.toVisualRow(this.row);
      const column = this.instance.toVisualColumn(this.col);

      this.instance.setDataAtCell(row, column, correctedValue, 'dateValidator');
      valid = true;
    } else {
      valid = false;
    }
  }

  callback(valid);
}

/**
 * Format the given string using moment.js' format feature.
 *
 * @param {string} value The value to format.
 * @param {string} dateFormat The date pattern to format to.
 * @returns {string}
 */
export function correctFormat(value, dateFormat) {
  const dateFromDate = moment(getNormalizedDate(value));
  const dateFromMoment = moment(value, dateFormat);
  const isAlphanumeric = value.search(/[A-z]/g) > -1;
  let date;

  if ((dateFromDate.isValid() && dateFromDate.format('x') === dateFromMoment.format('x')) ||
      !dateFromMoment.isValid() ||
      isAlphanumeric) {
    date = dateFromDate;

  } else {
    date = dateFromMoment;
  }

  return date.format(dateFormat);
}
