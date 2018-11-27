import * as C from 'handsontable/i18n/constants';
import { registerCondition } from './../conditionRegisterer';

export const CONDITION_NAME = 'lte';

export function condition(dataRow, [value]) {
  let conditionValue = value;

  if (dataRow.meta.type === 'numeric') {
    conditionValue = parseFloat(conditionValue, 10);
  }

  return dataRow.value <= conditionValue;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_LESS_THAN_OR_EQUAL,
  inputsCount: 1,
  showOperators: true
});
