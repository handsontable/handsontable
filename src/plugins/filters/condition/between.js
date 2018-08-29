import * as C from 'handsontable/i18n/constants';
import { registerCondition, getCondition } from './../conditionRegisterer';
import { CONDITION_NAME as CONDITION_DATE_AFTER } from './date/after';
import { CONDITION_NAME as CONDITION_DATE_BEFORE } from './date/before';

export const CONDITION_NAME = 'between';

export function condition(dataRow, [from, to] = inputValues) {
  if (dataRow.meta.type === 'numeric') {
    const _from = parseFloat(from, 10);
    const _to = parseFloat(to, 10);

    from = Math.min(_from, _to);
    to = Math.max(_from, _to);

  } else if (dataRow.meta.type === 'date') {
    const dateBefore = getCondition(CONDITION_DATE_BEFORE, [to]);
    const dateAfter = getCondition(CONDITION_DATE_AFTER, [from]);

    return dateBefore(dataRow) && dateAfter(dataRow);
  }

  return dataRow.value >= from && dataRow.value <= to;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BETWEEN,
  inputsCount: 2,
  showOperators: true
});
