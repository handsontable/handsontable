/**
 * Autocomplete cell validator.
 *
 * @private
 * @validator AutocompleteValidator
 * @param {*} value - Value of edited cell
 * @param {Function} callback - Callback called with validation result
 */
export default function autocompleteValidator(value, callback) {
  let valueToValidate = value;

  if (valueToValidate === null || valueToValidate === void 0) {
    valueToValidate = '';
  }

  if (this.allowEmpty && valueToValidate === '') {
    callback(true);

    return;
  }

  if (this.strict && this.source) {
    if (typeof this.source === 'function') {
      this.source(valueToValidate, process(valueToValidate, callback));
    } else {
      process(valueToValidate, callback)(this.source);
    }
  } else {
    callback(true);
  }
}

/**
 * Function responsible for validation of autocomplete value.
 *
 * @param {*} value - Value of edited cell
 * @param {Function} callback - Callback called with validation result
 */
function process(value, callback) {
  const originalVal = value;

  return function(source) {
    let found = false;

    for (let s = 0, slen = source.length; s < slen; s++) {
      if (originalVal === source[s]) {
        found = true; // perfect match
        break;
      }
    }

    callback(found);
  };
}
