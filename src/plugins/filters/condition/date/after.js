import moment from 'moment';
import {registerCondition} from './../../conditionRegisterer';

export const CONDITION_NAME = 'date_after';

export function condition(dataRow, [value] = inputValues) {
  let date = moment(dataRow.value, dataRow.meta.dateFormat);
  let inputDate = moment(value, dataRow.meta.dateFormat);

  if (!date.isValid() || !inputDate.isValid()) {
    return false;
  }

  return date.diff(inputDate) >= 0;
}

registerCondition(CONDITION_NAME, condition, {
  name: 'After',
  inputsCount: 1
});
