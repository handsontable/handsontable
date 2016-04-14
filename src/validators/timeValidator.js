import Handsontable from './../browser';
import moment from 'moment';

// Formats which are correctly parsed to time (supported by momentjs)
const STRICT_FORMATS = [
  'YYYY-MM-DDTHH:mm:ss.SSSZ',
  'X', // Unix timestamp
  'x' // Unix ms timestamp
];

/**
 * Time cell validator
 *
 * @private
 * @validator TimeValidator
 * @dependencies moment
 * @param {*} value - Value of edited cell
 * @param {Function} callback - Callback called with validation result
 */
Handsontable.TimeValidator = function(value, callback) {
  let valid = true;
  let timeFormat = this.timeFormat || 'h:mm:ss a';

  if (value === null) {
    value = '';
  }

  value = /^\d{3,}$/.test(value) ? parseInt(value, 10) : value;

  let twoDigitValue = /^\d{1,2}$/.test(value);

  if (twoDigitValue) {
    value = value + ':00';
  }

  let date = moment(value, STRICT_FORMATS, true).isValid() ? moment(value) : moment(value, timeFormat);
  let isValidTime = date.isValid();

  // is it in the specified format
  let isValidFormat = moment(value, timeFormat, true).isValid() && !twoDigitValue;

  if (this.allowEmpty && value === '') {
    isValidTime = true;
    isValidFormat = true;
  }
  if (!isValidTime) {
    valid = false;
  }
  if (!isValidTime && isValidFormat) {
    valid = true;
  }
  if (isValidTime && !isValidFormat) {
    if (this.correctFormat === true) { // if format correction is enabled

      let correctedValue = date.format(timeFormat);

      this.instance.setDataAtCell(this.row, this.col, correctedValue, 'timeValidator');
      valid = true;
    } else {
      valid = false;
    }
  }

  callback(valid);
};
