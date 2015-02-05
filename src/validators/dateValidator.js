/**
 * Date cell validator
 * @param {*} value - Value of edited cell
 * @param {*} callback - Callback called with validation result
 */
Handsontable.DateValidator = function (value, callback) {
  var correctedValue = null;

  if (value === null) {
    value = '';
  }

  var isValidDate = !isNaN(moment(new Date(value))._d.getDate()), // is value a valid date string
    isValidFormat = moment(value, this.dateFormat, true).isValid(); // is it in the specified format

  if (!isValidDate) {
    callback(false);
    return;
  } else if (!isValidFormat) {

    if (this.correctFormat === true) { // if format correction is enabled
      correctedValue = correctFormat(value, this.dateFormat);
      this.instance.setDataAtCell(this.row, this.col, correctedValue, 'dateValidator');
      callback(true);
      return;
    }

    callback(false);
    return;
  }

  callback(true);
};

/**
 * Format the given string using moment.js' format feature
 * @param value
 * @param dateFormat
 * @returns {*}
 */
var correctFormat = function (value, dateFormat) {
  value = moment(new Date(value)).format(dateFormat);
  return value;
};

