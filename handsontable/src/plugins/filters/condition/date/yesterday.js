import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';

export const CONDITION_NAME = 'date_yesterday';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @returns {boolean}
 */
export function condition(dataRow) {
  const date = new Date(dataRow.value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  return date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_YESTERDAY,
  inputsCount: 0
});
