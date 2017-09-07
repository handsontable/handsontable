import {registerCondition} from './../conditionRegisterer';
import {createArrayAssertion} from './../utils';

export const CONDITION_NAME = 'by_value';

export function condition(dataRow, [value] = inputValues) {
  return value(dataRow.value);
}

registerCondition(CONDITION_NAME, condition, {
  name: 'By value',
  inputsCount: 0,
  inputValuesDecorator: function([data] = inputValues) {
    return [createArrayAssertion(data)];
  },
  showOperators: false
});
