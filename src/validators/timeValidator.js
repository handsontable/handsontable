import moment from 'moment';
import {getEditor} from './../editors';

// Formats which are correctly parsed to time (supported by momentjs)
const STRICT_FORMATS = [
  'YYYY-MM-DDTHH:mm:ss.SSSZ',
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

  if (typeof value === 'number') {
    value = `${value}`;
  }
  if (/^\d{9,10}$/.test(value)) { // timestamp
    value = new Date(parseInt(`${value}000`, 10));

  } else if (/^\d{13}$/.test(value)) { // micro timestamp
    value = new Date(parseInt(value, 10));
  }

  let date = moment(value, STRICT_FORMATS, true).isValid() ? moment(new Date(value)) : moment(value, timeFormat);
  let isValidTime = date.isValid();

  // is it in the specified format
  let isValidFormat = moment(value, timeFormat, true).isValid();

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
