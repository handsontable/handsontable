import {stringify} from 'handsontable/helpers/mixed';
import {registerCondition} from './../conditionRegisterer';

export const CONDITION_NAME = 'contains';

export function condition(dataRow, [value] = inputValues) {
  return stringify(dataRow.value).toLowerCase().indexOf(stringify(value)) >= 0;
}

registerCondition(CONDITION_NAME, condition, {
  name: 'Contains',
  inputsCount: 1,
  showOperators: true
});
