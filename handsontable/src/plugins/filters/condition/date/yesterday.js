import dayjs from 'dayjs';
// eslint-disable-next-line import/extensions
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';

dayjs.extend(customParseFormat);

export const CONDITION_NAME = 'date_yesterday';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @returns {boolean}
 */
export function condition(dataRow) {
  const date = dayjs(dataRow.value, dataRow.meta.dateFormat);

  if (!date.isValid()) {
    return false;
  }

  return date.isSame(dayjs().subtract(1, 'day').startOf('day'), 'day');
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_YESTERDAY,
  inputsCount: 0
});
