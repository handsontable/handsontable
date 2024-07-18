import dayjs from 'dayjs';
// eslint-disable-next-line import/extensions
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';

dayjs.extend(customParseFormat);

export const CONDITION_NAME = 'date_after';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {*} inputValues."0" Minimum date of a range.
 * @returns {boolean}
 */
export function condition(dataRow, [value]) {
  const date = dayjs(dataRow.value, dataRow.meta.dateFormat);
  const inputDate = dayjs(value, dataRow.meta.dateFormat);

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
