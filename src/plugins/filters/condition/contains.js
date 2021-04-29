import * as C from '../../../i18n/constants';
import { stringify } from '../../../helpers/mixed';
import { registerCondition } from '../conditionRegisterer';

export const CONDITION_NAME = 'contains';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {*} inputValues."0" A value to check if it occurs in the row's data.
 * @returns {boolean}
 */
export function condition(dataRow, [value]) {
  return stringify(dataRow.value).toLowerCase().indexOf(stringify(value)) >= 0;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_CONTAINS,
  inputsCount: 1,
  showOperators: true
});
