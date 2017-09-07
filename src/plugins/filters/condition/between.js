import {registerCondition, getCondition} from './../conditionRegisterer';
import {CONDITION_NAME as CONDITION_DATE_AFTER} from './date/after';
import {CONDITION_NAME as CONDITION_DATE_BEFORE} from './date/before';

export const CONDITION_NAME = 'between';

export function condition(dataRow, [from, to] = inputValues) {
  if (dataRow.meta.type === 'numeric') {
    let _from = parseFloat(from, 10);
    let _to = parseFloat(to, 10);

    from = Math.min(_from, _to);
    to = Math.max(_from, _to);

  } else if (dataRow.meta.type === 'date') {
    let dateBefore = getCondition(CONDITION_DATE_BEFORE, [to]);
    let dateAfter = getCondition(CONDITION_DATE_AFTER, [from]);

    return dateBefore(dataRow) && dateAfter(dataRow);
  }

  return dataRow.value >= from && dataRow.value <= to;
}

registerCondition(CONDITION_NAME, condition, {
  name: 'Is between',
  inputsCount: 2,
  showOperators: true
});
