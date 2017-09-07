import {stringify} from 'handsontable/helpers/mixed';
import {registerCondition} from './../conditionRegisterer';

export const CONDITION_NAME = 'ends_with';

export function condition(dataRow, [value] = inputValues) {
  return stringify(dataRow.value).toLowerCase().endsWith(stringify(value));
}

registerCondition(CONDITION_NAME, condition, {
  name: 'Ends with',
  inputsCount: 1,
  showOperators: true
});
