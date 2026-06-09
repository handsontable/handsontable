import type { CellProperties } from '../../settings';
import { isValidTime } from '../../helpers/dateTime';
import { isEmpty } from '../../helpers/mixed';

export const VALIDATOR_TYPE = 'intl-time';
export const SOURCE_DATA_WARNING_MESSAGE = 'Source data warning ([itemsCount]). ' +
  'Invalid value for "intl-time" cell type.\n\n' +
  '[affectedCells]\n\n' +
  'Expected a value compatible with the 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS").';

/**
 *
 */
export function sourceDataValidator(value: unknown, cellMeta: CellProperties): boolean {
  if (cellMeta.allowEmpty && isEmpty(value)) {
    return true;
  }

  return isValidTime(value);
}

/**
 *
 */
export function intlTimeValidator(this: CellProperties, value: unknown, callback: (valid: boolean) => void): void {
  if (this.allowEmpty && isEmpty(value)) {
    callback(true);

    return;
  }

  callback(isValidTime(value));
}

intlTimeValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
