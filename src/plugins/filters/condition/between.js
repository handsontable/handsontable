import * as C from '../../../i18n/constants';
import { registerCondition, getCondition } from '../conditionRegisterer';
import { CONDITION_NAME as CONDITION_DATE_AFTER } from './date/after';
import { CONDITION_NAME as CONDITION_DATE_BEFORE } from './date/before';

export const CONDITION_NAME = 'between';

export function condition(dataRow, [from, to]) {
  let fromValue = from;
  let toValue = to;

  if (dataRow.meta.type === 'numeric') {
    const _from = parseFloat(fromValue, 10);
    const _to = parseFloat(toValue, 10);

    fromValue = Math.min(_from, _to);
    toValue = Math.max(_from, _to);

  } else if (dataRow.meta.type === 'date') {
    const dateBefore = getCondition(CONDITION_DATE_BEFORE, [toValue]);
    const dateAfter = getCondition(CONDITION_DATE_AFTER, [fromValue]);

    return dateBefore(dataRow) && dateAfter(dataRow);
  }

  return dataRow.value >= fromValue && dataRow.value <= toValue;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BETWEEN,
  inputsCount: 2,
  showOperators: true
});
