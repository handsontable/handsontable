import { isObjectEqual } from '../../helpers/object';
import { isKeyValueEntry } from '../../utils/cellSource';
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
  // The shared guard, not a local copy. A fourth definition of "what is a key/value entry" lived
  // here and it is the same rule the setter and the editor resolve labels with - drift between them
  // is what let a pasted label reach this validator as a bare string (DEV-57).
  const isNullOrUndefined = (val: unknown): boolean => {
    if (isKeyValueEntry(val)) {
      return isNullOrUndefined(val.key) && isNullOrUndefined(val.value);
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
      // The `source` option declares its query parameter as `string`; the validator forwards the
      // raw cell value unchanged (a number stays a number), matching the long-standing runtime
      // behavior, so the value is cast rather than coerced.
      this.source(valueToValidate as string, process(valueToValidate, callback));
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
