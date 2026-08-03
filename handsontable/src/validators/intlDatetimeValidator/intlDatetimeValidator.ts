import { datetimeValidator } from '../datetimeValidator/datetimeValidator';

export const VALIDATOR_TYPE = 'intl-datetime';
export const SOURCE_DATA_WARNING_MESSAGE = 'Source data warning ([itemsCount]). ' +
  'Invalid value for "intl-datetime" cell type.\n\n' +
  '[affectedCells]\n\n' +
  'Expected a value compatible with the ISO 8601 date-time format ("YYYY-MM-DDTHH:mm:ss").';

export { sourceDataValidator } from '../datetimeValidator/datetimeValidator';

type CellMeta = Record<string, unknown> & { allowEmpty?: boolean };

/**
 * The IntlDatetime cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function intlDatetimeValidator(this: CellMeta, value: unknown, callback: (valid: boolean) => void): void {
  datetimeValidator.call(this, value, callback);
}

intlDatetimeValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
