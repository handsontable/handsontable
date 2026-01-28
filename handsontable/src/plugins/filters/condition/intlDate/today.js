import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDate } from '../../../../helpers/date';

export const CONDITION_NAME = 'intl_date_today';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @returns {boolean}
 */
export function condition(dataRow) {
  const dataDate = parseToLocalDate(dataRow.value);

  if (dataDate === null) {
    return false;
  }

  const now = new Date();

  return dataDate.getFullYear() === now.getFullYear() &&
    dataDate.getMonth() === now.getMonth() &&
    dataDate.getDate() === now.getDate();
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_TODAY,
  inputsCount: 0,
  inputType: 'date',
});
