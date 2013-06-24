/**
 * Function responsible for validation of autocomplete value
 * @param {*} value - Value of edited cell
 * @param {*} calback - Callback called with validation result
 */
var process = function (value, callback) {

  var originalVal  = value;
  var lowercaseVal = typeof originalVal === 'string' ? originalVal.toLowerCase() : null;

  return function (source) {
    var found = false;
    for (var s = 0, slen = source.length; s < slen; s++) {
      if (originalVal === source[s]) {
        found = true; //perfect match
        break;
      }
      else if (lowercaseVal === source[s].toLowerCase()) {
        // changes[i][3] = source[s]; //good match, fix the case << TODO?
        found = true;
        break;
      }
    }

    callback(found);
  }
};

/**
 * Autocomplete cell validator
 * @param {*} value - Value of edited cell
 * @param {*} calback - Callback called with validation result
 */
Handsontable.AutocompleteValidator = function (value, callback) {
  if (this.strict && this.source) {
    $.isFunction(this.source) ? this.source(value, process(value, callback)) : process(value, callback)(this.source);
  } else {
    callback(true);
  }
}
