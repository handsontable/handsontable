import {registerCondition} from './../conditionRegisterer';

export const CONDITION_NAME = 'empty';

export function condition(dataRow) {
  return dataRow.value === '' || dataRow.value === null || dataRow.value === void 0;
}

registerCondition(CONDITION_NAME, condition, {
  name: 'Is empty',
  inputsCount: 0,
  showOperators: true
});
