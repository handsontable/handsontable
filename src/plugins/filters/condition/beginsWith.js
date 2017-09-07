import {stringify} from 'handsontable/helpers/mixed';
import {registerCondition} from './../conditionRegisterer';

export const CONDITION_NAME = 'begins_with';

export function condition(dataRow, [value] = inputValues) {
  return stringify(dataRow.value).toLowerCase().startsWith(stringify(value));
}

registerCondition(CONDITION_NAME, condition, {
  name: 'Begins with',
  inputsCount: 1,
  showOperators: true
});
