import { registerCondition } from '../conditionRegisterer';
import { createArrayAssertion } from '../utils';

export const CONDITION_NAME = 'by_value';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {Function} inputValues."0" A function to compare row's data.
 * @returns {boolean}
 */
export function condition(dataRow, [value]) {
  return value(dataRow.value);
}

registerCondition(CONDITION_NAME, condition, {
  name: 'By value',
  inputsCount: 0,
  inputValuesDecorator([data]) {
    return [createArrayAssertion(data)];
  },
  showOperators: false
});
