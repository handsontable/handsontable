import moment from 'moment';
import * as C from 'handsontable/i18n/constants';
import { registerCondition } from './../../conditionRegisterer';

export const CONDITION_NAME = 'date_after';

export function condition(dataRow, [value]) {
  const date = moment(dataRow.value, dataRow.meta.dateFormat);
  const inputDate = moment(value, dataRow.meta.dateFormat);

  if (!date.isValid() || !inputDate.isValid()) {
    return false;
  }

  return date.diff(inputDate) >= 0;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_AFTER,
  inputsCount: 1,
  showOperators: true
});
