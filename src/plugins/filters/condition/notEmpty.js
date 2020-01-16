import * as C from '../../../i18n/constants';
import { registerCondition, getCondition } from '../conditionRegisterer';
import { CONDITION_NAME as CONDITION_EMPTY } from './empty';

export const CONDITION_NAME = 'not_empty';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @returns {boolean}
 */
export function condition(dataRow, inputValues) {
  return !getCondition(CONDITION_EMPTY, inputValues)(dataRow);
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_NOT_EMPTY,
  inputsCount: 0,
  showOperators: true
});
