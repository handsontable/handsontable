import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalTime } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_time_after_or_equal';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {*} inputValues."0" Minimum time of a range.
 * @returns {boolean}
 */
export function condition(dataRow, [value]) {
  const dataTime = parseToLocalTime(dataRow.value);
  const inputTime = parseToLocalTime(value);

  if (dataTime === null || inputTime === null) {
    return false;
  }

  return dataTime >= inputTime;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_AFTER_OR_EQUAL,
  inputsCount: 1,
  showOperators: true,
  inputType: 'time',
});
