import * as C from 'handsontable/i18n/constants';
import { stringify } from 'handsontable/helpers/mixed';
import { registerCondition } from './../conditionRegisterer';

export const CONDITION_NAME = 'begins_with';

export function condition(dataRow, [value]) {
  return stringify(dataRow.value).toLowerCase().startsWith(stringify(value));
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BEGINS_WITH,
  inputsCount: 1,
  showOperators: true
});
