import { isNumeric } from '../../helpers/number';

export const VALIDATOR_TYPE: 'numeric' = 'numeric';

/**
 * The Numeric cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function numericValidator(
  this: Record<string, unknown>, value: unknown, callback: (valid: boolean) => void): void {
  let valueToValidate = value;

  if (valueToValidate === null || valueToValidate === undefined) {
    valueToValidate = '';
  }
  if (this.allowEmpty && valueToValidate === '') {
    callback(true);

  } else if (valueToValidate === '') {
    callback(false);

  } else {
    callback(isNumeric(value));
  }
}

numericValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
