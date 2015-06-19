
import moment from 'moment';
import {getEditor} from './../editors.js';

/**
 * Date cell validator
 *
 * @private
 * @validator DateValidator
 * @dependencies moment
 * @param {*} value - Value of edited cell
 * @param {Function} callback - Callback called with validation result
 */
Handsontable.DateValidator = function(value, callback) {
  let valid = true;
  let dateEditor = getEditor('date', this.instance);

  if (value === null) {
    value = '';
  }
  let isValidDate = moment(new Date(value)).isValid();
  // is it in the specified format
  let isValidFormat = moment(value, this.dateFormat || dateEditor.defaultDateFormat, true).isValid();

  if (!isValidDate) {
    valid = false;
  }
  if (!isValidDate && isValidFormat) {
    valid = true;
  }

  if (isValidDate && !isValidFormat) {
    if (this.correctFormat === true) { // if format correction is enabled
      let correctedValue = correctFormat(value, this.dateFormat);

      this.instance.setDataAtCell(this.row, this.col, correctedValue, 'dateValidator');
      valid = true;
    } else {
      valid = false;
    }
  }

  callback(valid);
};

/**
 * Format the given string using moment.js' format feature
 *
 * @param {String} value
 * @param {String} dateFormat
 * @returns {String}
 */
let correctFormat = function correctFormat(value, dateFormat) {
  let date = moment(new Date(value));

  // Ugly fix for moment bug which can not format 5-digits year using YYYY
  if (date.format('YYYY').length > 4) {
    date.year((date.year() + '').substr(0, 4));
  }

  return date.format(dateFormat);
};

