import {registerCondition} from './../conditionRegisterer';

export const CONDITION_NAME = 'gt';

export function condition(dataRow, [value] = inputValues) {
  if (dataRow.meta.type === 'numeric') {
    value = parseFloat(value, 10);
  }

  return dataRow.value > value;
}

registerCondition(CONDITION_NAME, condition, {
  name: 'Greater than',
  inputsCount: 1,
  showOperators: true
});
