import { isObjectEqual, isObject } from '../../helpers/object';
import { isDefined } from '../../helpers/mixed';
import type { CellProperties } from '../../settings';

export const VALIDATOR_TYPE: 'autocomplete' = 'autocomplete';

/**
 * The Autocomplete cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function autocompleteValidator(
  this: CellProperties, value: unknown, callback: (valid: boolean) => void): void {
  const isKeyValueObject = (obj: unknown) => {
    const rec = obj as Record<string, unknown>;

    return isObject(obj) && isDefined(rec.key) && isDefined(rec.value);
  };
  const isNullOrUndefined = (val: unknown): boolean => {
    if (isKeyValueObject(val)) {
      const rec = val as Record<string, unknown>;

      return isNullOrUndefined(rec.key) && isNullOrUndefined(rec.value);
    }

    return val === null || val === undefined;
  };
  let valueToValidate = value;

  if (isNullOrUndefined(valueToValidate)) {
    valueToValidate = '';
  }

  if (valueToValidate === '') {
    callback(!!this.allowEmpty);

    return;
  }

  if (this.strict && this.source) {
    if (typeof this.source === 'function') {
      this.source(valueToValidate, process(valueToValidate, callback));
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
