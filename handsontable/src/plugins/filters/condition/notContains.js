import * as C from '../../../i18n/constants';
import { registerCondition, getCondition } from '../conditionRegisterer';
import { CONDITION_NAME as CONDITION_CONTAINS } from './contains';

export const CONDITION_NAME = 'not_contains';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @returns {boolean}
 */
export function condition(dataRow, inputValues) {
  return !getCondition(CONDITION_CONTAINS, inputValues)(dataRow);
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_NOT_CONTAIN,
  inputsCount: 1,
  showOperators: true
});
