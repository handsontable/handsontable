import { dateValidator } from '../dateValidator/dateValidator';

export const VALIDATOR_TYPE = 'intl-date';
export const SOURCE_DATA_WARNING_MESSAGE = 'Source data warning ([itemsCount]). ' +
  'Invalid value for "intl-date" cell type.\n\n' +
  '[affectedCells]\n\n' +
  'Expected a value compatible with the ISO 8601 date format ("YYYY-MM-DD").';

export { sourceDataValidator } from '../dateValidator/dateValidator';

type CellMeta = Record<string, unknown> & { allowEmpty?: boolean };

/**
 * The IntlDate cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function intlDateValidator(this: CellMeta, value: unknown, callback: (valid: boolean) => void): void {
  dateValidator.call(this, value, callback);
}

intlDateValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
