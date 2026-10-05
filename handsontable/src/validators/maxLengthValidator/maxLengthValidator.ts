import type { CellProperties } from '../../settings';
import { isRegExp } from '../../helpers/mixed';
import { getCharacterLength } from '../../helpers/string';
import { regExpValidator } from '../regExpValidator';

type ValidatorFunction = (this: CellProperties, value: unknown, callback: (valid: boolean) => void) => void;

/**
 * Checks whether a `maxLength` setting is a limit that can be enforced.
 * `Infinity` (the default) and any non-numeric value mean that there is no limit.
 *
 * @param {*} maxLength The value of the `maxLength` option.
 * @returns {boolean}
 */
export function isMaxLengthActive(maxLength: unknown): maxLength is number {
  return typeof maxLength === 'number' && maxLength >= 0 && Number.isFinite(maxLength);
}

/**
 * Narrows a validator to a regular expression.
 *
 * @param {*} validator The validator to check.
 * @returns {boolean}
 */
function isRegExpValidator(validator: unknown): validator is RegExp {
  return isRegExp(validator);
}

/**
 * The cell validator behind the `maxLength` option. Counts the length of a string value in the characters a reader sees (grapheme clusters),
 * so a flag or an emoji with a skin tone counts as one. Values that are not strings are always valid.
 *
 * @private
 * @param {*} value Value of the validated cell.
 * @param {Function} callback Callback called with the validation result.
 */
export function maxLengthValidator(
  this: CellProperties, value: unknown, callback: (valid: boolean) => void
): void {
  const { maxLength } = this;

  callback(typeof value !== 'string' || !isMaxLengthActive(maxLength) || getCharacterLength(value) <= maxLength);
}

/**
 * Combines the `maxLength` check with the validator configured for the cell. A value is valid only
 * when it passes both. The length check runs first, and the configured validator is skipped for a
 * value that is too long.
 *
 * @private
 * @param {Function|RegExp|boolean} [validator] The validator configured for the cell, if there is one.
 * `false` is how a cell turns its validator off, so it counts as no validator, and only the length
 * check runs.
 * @returns {Function} The validator function to use for the cell.
 */
export function withMaxLength(validator?: ValidatorFunction | RegExp | false): ValidatorFunction {
  if (!validator) {
    return maxLengthValidator;
  }

  const configuredValidator: ValidatorFunction = isRegExpValidator(validator) ? regExpValidator(validator) : validator;

  return function(this: CellProperties, value: unknown, callback: (valid: boolean) => void): void {
    maxLengthValidator.call(this, value, (withinLimit) => {
      if (withinLimit) {
        configuredValidator.call(this, value, callback);

      } else {
        callback(false);
      }
    });
  };
}
