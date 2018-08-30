import { registerCondition } from './../conditionRegisterer';
import { createArrayAssertion } from './../utils';

export const CONDITION_NAME = 'by_value';

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
