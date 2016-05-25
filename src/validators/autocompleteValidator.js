import Handsontable from './../browser';
import {stringify} from './../helpers/mixed';

/**
 * Autocomplete cell validator.
 *
 * @private
 * @validator AutocompleteValidator
 * @param {*} value - Value of edited cell
 * @param {Function} callback - Callback called with validation result
 */
Handsontable.AutocompleteValidator = function(value, callback) {
  if (value == null) {
    value = '';
  }

  if (this.allowEmpty && value === '') {
    callback(true);

    return;
  }

  if (this.strict && this.source) {
    if (typeof this.source === 'function') {
      this.source(value, process(value, callback));
    } else {
      process(value, callback)(this.source);
    }
  } else {
    callback(true);
  }
};

/**
 * Function responsible for validation of autocomplete value.
 *
 * @param {*} value - Value of edited cell
 * @param {Function} callback - Callback called with validation result
 */
function process(value, callback) {
  var originalVal  = value;
  var lowercaseVal = typeof originalVal === 'string' ? originalVal.toLowerCase() : null;

  return function(source) {
    var found = false;

    for (var s = 0, slen = source.length; s < slen; s++) {
      if (originalVal === source[s]) {
        found = true; //perfect match
        break;

      } else if (lowercaseVal === stringify(source[s]).toLowerCase()) {
        // changes[i][3] = source[s]; //good match, fix the case << TODO?
        found = true;
        break;
      }
    }

    callback(found);
  };
}
