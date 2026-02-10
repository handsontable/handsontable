import { isObjectEqual, isObject } from '../../helpers/object';
import { isDefined } from '../../helpers/mixed';

export const VALIDATOR_TYPE: 'autocomplete' = 'autocomplete';

/**
 * The Autocomplete cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function autocompleteValidator(this: Record<string, unknown>, value: unknown, callback: (valid: boolean) => void): void {
  const isKeyValueObject = (obj: unknown) => isObject(obj) && isDefined((obj as Record<string, unknown>).key) && isDefined((obj as Record<string, unknown>).value);
  const isNullOrUndefined = (val: unknown): boolean => {
    if (isKeyValueObject(val)) {
      return isNullOrUndefined((val as Record<string, unknown>).key) && isNullOrUndefined((val as Record<string, unknown>).value);
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
      (this.source as Function)(valueToValidate, process(valueToValidate, callback));
    } else {
      process(valueToValidate, callback)(this.source as unknown[]);
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
function process(value: unknown, callback: (valid: boolean) => void) {
  const originalVal = value;

  return function(source: unknown[]) {
    let found = false;

    for (let s = 0, slen = source.length; s < slen; s++) {
      if (isObjectEqual(originalVal as Record<string, unknown>, source[s] as Record<string, unknown>)) {
        found = true; // perfect match
        break;
      }
    }

    callback(found);
  };
}
