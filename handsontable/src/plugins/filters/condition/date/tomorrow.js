import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';

export const CONDITION_NAME = 'date_tomorrow';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @returns {boolean}
 */
export function condition(dataRow) {
  const date = new Date(dataRow.value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  return date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_TOMORROW,
  inputsCount: 0
});
