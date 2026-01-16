import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';

export const CONDITION_NAME = 'date_after';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {*} inputValues."0" Minimum date of a range.
 * @returns {boolean}
 */
export function condition(dataRow, [value]) {
  const dateTime = new Date(dataRow.value).getTime();
  const inputDateTime = new Date(value).getTime();

  if (Number.isNaN(dateTime) || Number.isNaN(inputDateTime)) {
    return false;
  }

  return dateTime >= inputDateTime;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_AFTER,
  inputsCount: 1,
  showOperators: true
});
