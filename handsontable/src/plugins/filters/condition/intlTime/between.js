import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalTime } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_time_between';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {number} inputValues."0" The minimum value of the range.
 * @param {number} inputValues."1" The maximum value of the range.
 * @returns {boolean}
 */
export function condition(dataRow, [from, to]) {
  const dataTime = parseToLocalTime(dataRow.value);
  const fromTime = parseToLocalTime(from);
  const toTime = parseToLocalTime(to);

  if (dataTime === null || fromTime === null || toTime === null) {
    return false;
  }

  return dataTime >= fromTime && dataTime <= toTime;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BETWEEN,
  inputsCount: 2,
  showOperators: true,
  inputType: 'time',
});
