import { registerCondition } from '../conditionRegisterer';
import { createArrayAssertion } from '../utils';

export const CONDITION_NAME = 'by_value';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {Function} inputValues."0" A function to compare row's data.
 * @returns {boolean}
 */
export function condition(dataRow: { value: unknown; meta: { type?: string; locale?: string; dateFormat?: string; instance?: unknown; [key: string]: unknown } }, [value]: unknown[]) {
  return (value as Function)(dataRow.value);
}

registerCondition(CONDITION_NAME, condition, {
  name: 'By value',
  inputsCount: 0,
  inputValuesDecorator([data]: [unknown[]]) {
    return [createArrayAssertion(data)];
  },
  showOperators: false
});
