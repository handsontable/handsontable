import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDate } from '../../../../helpers/date';

export const CONDITION_NAME = 'intl_date_tomorrow';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @returns {boolean}
 */
export function condition(dataRow) {
  const dataDate = parseToLocalDate(dataRow.value);

  if (dataDate === null) {
    return false;
  }

  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  return dataDate.getFullYear() === tomorrow.getFullYear() &&
    dataDate.getMonth() === tomorrow.getMonth() &&
    dataDate.getDate() === tomorrow.getDate();
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_TOMORROW,
  inputsCount: 0,
  inputType: 'date',
});
