import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDate } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_date_yesterday';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @returns {boolean}
 */
export function condition(dataRow) {
  const dataDate = parseToLocalDate(dataRow.value);

  if (dataDate === null) {
    return false;
  }

  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  return dataDate.getFullYear() === yesterday.getFullYear() &&
    dataDate.getMonth() === yesterday.getMonth() &&
    dataDate.getDate() === yesterday.getDate();
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_YESTERDAY,
  inputsCount: 0,
  inputType: 'date',
});
