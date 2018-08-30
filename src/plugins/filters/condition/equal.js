import * as C from 'handsontable/i18n/constants';
import { stringify } from 'handsontable/helpers/mixed';
import { registerCondition } from './../conditionRegisterer';

export const CONDITION_NAME = 'eq';

export function condition(dataRow, [value]) {
  return stringify(dataRow.value).toLowerCase() === stringify(value);
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_EQUAL,
  inputsCount: 1,
  showOperators: true
});
