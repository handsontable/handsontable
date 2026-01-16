import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';

export const CONDITION_NAME = 'date_today';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @returns {boolean}
 */
export function condition(dataRow) {
  const date = new Date(dataRow.value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();

  return date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_TODAY,
  inputsCount: 0
});
