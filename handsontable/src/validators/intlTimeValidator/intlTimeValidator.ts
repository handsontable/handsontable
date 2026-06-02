import { timeValidator } from '../timeValidator/timeValidator';

export const VALIDATOR_TYPE = 'intl-time';
export const SOURCE_DATA_WARNING_MESSAGE = 'Source data warning ([itemsCount]). ' +
  'Invalid value for "intl-time" cell type.\n\n' +
  '[affectedCells]\n\n' +
  'Expected a value compatible with the 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS").';

export { sourceDataValidator } from '../timeValidator/timeValidator';

type CellMeta = Record<string, unknown> & { allowEmpty?: boolean };

/**
 * The IntlTime cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function intlTimeValidator(this: CellMeta, value: unknown, callback: (valid: boolean) => void): void {
  timeValidator.call(this, value, callback);
}

intlTimeValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
