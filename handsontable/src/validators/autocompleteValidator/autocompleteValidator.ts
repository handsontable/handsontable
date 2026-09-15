import { isObjectEqual } from '../../helpers/object';
import { isKeyValueEntry } from '../../utils/cellSource';
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
  validateAgainstSource(this, value, callback, !!this.strict);
}

autocompleteValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;

/**
 * Validates a value against the cell's `source`. An empty value is checked against `allowEmpty`.
 * Any other value must match a source entry in strict mode, and is always valid otherwise.
 *
 * Strict mode is passed in rather than read from the cell meta, because the dropdown cell type is
 * strict whatever its meta says (DEV-2911).
 *
 * @private
 * @param {object} cellProperties The cell meta object. A function `source` is called on it.
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 * @param {boolean} strict Whether the value must match a source entry.
 */
export function validateAgainstSource(
  cellProperties: CellProperties,
  value: unknown,
  callback: (valid: boolean) => void,
  strict: boolean
): void {
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
    callback(!!cellProperties.allowEmpty);

    return;
  }

  if (strict && cellProperties.source) {
    if (typeof cellProperties.source === 'function') {
      // The `source` option declares its query parameter as `string`; the validator forwards the
      // raw cell value unchanged (a number stays a number), matching the long-standing runtime
      // behavior, so the value is cast rather than coerced.
      cellProperties.source(valueToValidate as string, process(valueToValidate, callback));
    } else {
      process(valueToValidate, callback)(cellProperties.source as unknown[]);
    }
  } else {
    callback(true);
  }
}

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
