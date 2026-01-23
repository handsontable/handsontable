import { isObjectEqual, isKeyValueObject } from '../../helpers/object';

export const VALIDATOR_TYPE = 'multiSelect';

/**
 * The MultiSelect cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function multiSelectValidator(value, callback) {
  let valueToValidate = value;

  if (valueToValidate === null || valueToValidate === undefined) {
    valueToValidate = '';
  }

  // Handle allowEmpty option
  if (this.allowEmpty && valueToValidate === '') {
    callback(true);

    return;

  } else if (!this.allowEmpty && valueToValidate === '') {
    callback(false);

    return;
  }

  // Fail if value is not an array
  if (!Array.isArray(valueToValidate)) {
    callback(false);

    return;
  }

  // Empty array is valid
  if (Array.isArray(valueToValidate) && valueToValidate.length === 0) {
    callback(true);

    return;
  }

  if (this.source) {
    if (typeof this.source === 'function') {
      this.source(valueToValidate, process(valueToValidate, callback));
    } else {
      process(valueToValidate, callback)(this.source);
    }
  } else {
    callback(true);
  }
}

multiSelectValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;

/**
 * Function responsible for validation of multiSelect value.
 *
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 * @returns {Function}
 */
function process(value, callback) {
  const originalVal = value;

  return function(source) {
    let allValid = true;

    for (let i = 0, len = originalVal.length; i < len; i++) {
      let found = false;

      for (let s = 0, slen = source.length; s < slen; s++) {
        if (
          (isKeyValueObject(originalVal[i]) && !isKeyValueObject(source[s])) ||
          (!isKeyValueObject(originalVal[i]) && isKeyValueObject(source[s]))
        ) {
          // Type mismatch - fail validation.
          found = false;

          break;

        } else if (
          isKeyValueObject(originalVal[i]) && isKeyValueObject(source[s]) &&
          isObjectEqual(originalVal[i], source[s])
        ) {
          found = true;

        } else if (
          typeof originalVal[i] === 'string' &&
          typeof source[s] === 'string' &&
          originalVal[i] === source[s]
        ) {
          found = true;
        }
      }

      if (!found) {
        allValid = false;
        break;
      }
    }

    callback(allValid);
  };
}
