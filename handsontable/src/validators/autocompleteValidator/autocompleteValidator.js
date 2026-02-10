import { isObjectEqual, isObject } from '../../helpers/object';
import { isDefined } from '../../helpers/mixed';

export const VALIDATOR_TYPE = 'autocomplete';

/**
 * The Autocomplete cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function autocompleteValidator(value, callback) {
  const isKeyValueObject = obj => isObject(obj) && isDefined(obj.key) && isDefined(obj.value);
  const isNullOrUndefined = (val) => {
    if (isKeyValueObject(val)) {
      return isNullOrUndefined(val.key) && isNullOrUndefined(val.value);
    }

    return val === null || val === undefined;
  };
  let valueToValidate = value;

  if (isNullOrUndefined(valueToValidate)) {
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

autocompleteValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;

/**
 * Function responsible for validation of autocomplete value.
 *
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 * @returns {Function}
 */
function process(value, callback) {
  const originalVal = value;

  return function(source) {
    let found = false;

    for (let s = 0, slen = source.length; s < slen; s++) {
      if (isObjectEqual(originalVal, source[s])) {
        found = true; // perfect match
        break;
      }
    }

    callback(found);
  };
}
