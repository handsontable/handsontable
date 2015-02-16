/**
 * Date cell validator
 * @param {*} value - Value of edited cell
 * @param {*} callback - Callback called with validation result
 */
Handsontable.DateValidator = function (value, callback) {
  var correctedValue = null,
    valid = true,
    dateEditor = Handsontable.editors.getEditor('date', this.instance);

  if (value === null) {
    value = '';
  }

  var isValidDate = moment(new Date(value)).isValid(), // is value a valid date string
    isValidFormat = moment(value, this.dateFormat || dateEditor.defaultDateFormat, true).isValid(); // is it in the specified format

  if (!isValidDate) {
    valid = false;
  }

  if (!isValidDate && isValidFormat) {
    valid = true;
  }

  if (isValidDate && !isValidFormat) {
    if (this.correctFormat === true) { // if format correction is enabled
      correctedValue = correctFormat(value, this.dateFormat);
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
 * @param value
 * @param dateFormat
 * @returns {*}
 */
var correctFormat = function (value, dateFormat) {
  value = moment(new Date(value)).format(dateFormat);
  return value;
};

