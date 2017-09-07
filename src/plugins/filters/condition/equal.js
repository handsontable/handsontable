import {stringify} from 'handsontable/helpers/mixed';
import {registerCondition} from './../conditionRegisterer';

export const CONDITION_NAME = 'eq';

export function condition(dataRow, [value] = inputValues) {
  return stringify(dataRow.value).toLowerCase() === stringify(value);
}

registerCondition(CONDITION_NAME, condition, {
  name: 'Is equal to',
  inputsCount: 1,
  showOperators: true
});
