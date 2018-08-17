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
export default function timeValidator(value, callback) {
  let valid = true;
  const timeFormat = this.timeFormat || 'h:mm:ss a';

  if (value === null) {
    value = '';
  }

  value = /^\d{3,}$/.test(value) ? parseInt(value, 10) : value;

  const twoDigitValue = /^\d{1,2}$/.test(value);

  if (twoDigitValue) {
    value += ':00';
  }

  const date = moment(value, STRICT_FORMATS, true).isValid() ? moment(value) : moment(value, timeFormat);
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
      const correctedValue = date.format(timeFormat);
      const row = this.instance.runHooks('unmodifyRow', this.row);
      const column = this.instance.runHooks('unmodifyCol', this.col);

      this.instance.setDataAtCell(row, column, correctedValue, 'timeValidator');
      valid = true;
    } else {
      valid = false;
    }
  }

  callback(valid);
}
