import { isValidISODate } from '../../helpers/dateTime';
import { isEmpty } from '../../helpers/mixed';
import type { CellProperties } from '../../settings';

export const VALIDATOR_TYPE = 'intl-date';
export const SOURCE_DATA_WARNING_MESSAGE = 'Source data warning ([itemsCount]). ' +
  'Invalid value for "intl-date" cell type.\n\n' +
  '[affectedCells]\n\n' +
  'Expected a value compatible with the ISO 8601 date format ("YYYY-MM-DD").';

/**
 *
 */
export function sourceDataValidator(value: unknown, cellMeta: CellProperties): boolean {
  if (cellMeta.allowEmpty && isEmpty(value)) {
    return true;
  }

  return isValidISODate(value);
}

/**
 *
 */
export function intlDateValidator(this: CellProperties, value: unknown, callback: (valid: boolean) => void): void {
  if (this.allowEmpty && isEmpty(value)) {
    callback(true);

    return;
  }

  callback(isValidISODate(value));
}

intlDateValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
