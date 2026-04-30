import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDate } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_date_before_or_equal';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {*} inputValues."0" Maximum date of a range.
 * @returns {boolean}
 */
export function condition(dataRow, [value]) {
  const dataDate = parseToLocalDate(dataRow.value);
  const inputDate = parseToLocalDate(value);

  if (dataDate === null || inputDate === null) {
    return false;
  }

  return dataDate <= inputDate;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BEFORE_OR_EQUAL,
  inputsCount: 1,
  showOperators: true,
  inputType: 'date',
});
