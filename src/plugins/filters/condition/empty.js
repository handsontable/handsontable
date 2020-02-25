import * as C from '../../../i18n/constants';
import { registerCondition } from '../conditionRegisterer';

export const CONDITION_NAME = 'empty';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @returns {boolean}
 */
export function condition(dataRow) {
  return dataRow.value === '' || dataRow.value === null || dataRow.value === void 0;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_EMPTY,
  inputsCount: 0,
  showOperators: true
});
