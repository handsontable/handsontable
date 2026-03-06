import * as C from '../../../../i18n/constants';
import { registerCondition, getCondition } from '../../conditionRegisterer';
import { CONDITION_NAME as CONDITION_INTL_DATE_AFTER } from './after';
import { CONDITION_NAME as CONDITION_INTL_DATE_BEFORE } from './before';

export const CONDITION_NAME = 'intl_date_between';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {number} inputValues."0" The minimum value of the range.
 * @param {number} inputValues."1" The maximum value of the range.
 * @returns {boolean}
 */
export function condition(dataRow, [from, to]) {
  const dateBefore = getCondition(CONDITION_INTL_DATE_BEFORE, [to]);
  const dateAfter = getCondition(CONDITION_INTL_DATE_AFTER, [from]);

  return dateBefore(dataRow) && dateAfter(dataRow);
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BETWEEN,
  inputsCount: 2,
  showOperators: true,
  inputType: 'date',
});
