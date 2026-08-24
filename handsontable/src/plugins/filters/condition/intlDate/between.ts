import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDate } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_date_between';

type DataRow = {
  value: unknown;
  meta: Record<string, unknown>;
};

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {number} inputValues."0" The minimum value of the range.
 * @param {number} inputValues."1" The maximum value of the range.
 * @returns {boolean}
 */
export function condition(dataRow: DataRow, [from, to]: unknown[]): boolean {
  const dataDate = parseToLocalDate(dataRow.value);
  const fromDate = parseToLocalDate(from);
  const toDate = parseToLocalDate(to);

  if (dataDate === null || fromDate === null || toDate === null) {
    return false;
  }

  return dataDate >= fromDate && dataDate <= toDate;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BETWEEN,
  inputsCount: 2,
  showOperators: true,
  inputType: 'date',
});
