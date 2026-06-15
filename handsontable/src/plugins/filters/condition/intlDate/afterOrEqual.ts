import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDate } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_date_after_or_equal';

type DataRow = {
  value: unknown;
  meta: Record<string, unknown>;
};

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {*} inputValues."0" Minimum date of a range.
 * @returns {boolean}
 */
export function condition(dataRow: DataRow, [value]: unknown[]): boolean {
  const dataDate = parseToLocalDate(dataRow.value);
  const inputDate = parseToLocalDate(value);

  if (dataDate === null || inputDate === null) {
    return false;
  }

  return dataDate >= inputDate;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_AFTER_OR_EQUAL,
  inputsCount: 1,
  showOperators: true,
  inputType: 'date',
});
