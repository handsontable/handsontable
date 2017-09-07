import moment from 'moment';
import {registerCondition} from './../../conditionRegisterer';

export const CONDITION_NAME = 'date_tomorrow';

export function condition(dataRow) {
  let date = moment(dataRow.value, dataRow.meta.dateFormat);

  if (!date.isValid()) {
    return false;
  }

  return date.isSame(moment().subtract(-1, 'days').startOf('day'), 'd');
}

registerCondition(CONDITION_NAME, condition, {
  name: 'Tomorrow',
  inputsCount: 0
});
