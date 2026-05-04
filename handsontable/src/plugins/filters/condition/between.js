import moment from 'moment';
import * as C from '../../../i18n/constants';
import { registerCondition } from '../conditionRegisterer';

export const CONDITION_NAME = 'between';

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {number} inputValues."0" The minimum value of the range.
 * @param {number} inputValues."1" The maximum value of the range.
 * @returns {boolean}
 */
export function condition(dataRow, [from, to]) {
  let fromValue = from;
  let toValue = to;

  if (dataRow.meta.type === 'numeric') {
    const _from = parseFloat(fromValue, 10);
    const _to = parseFloat(toValue, 10);

    fromValue = Math.min(_from, _to);
    toValue = Math.max(_from, _to);

  } else if (dataRow.meta.type === 'date') {
    const date = moment(dataRow.value, dataRow.meta.dateFormat);
    const fromDate = moment(fromValue, dataRow.meta.dateFormat);
    const toDate = moment(toValue, dataRow.meta.dateFormat);

    if (!date.isValid() || !fromDate.isValid() || !toDate.isValid()) {
      return false;
    }

    return date.diff(fromDate) >= 0 && date.diff(toDate) <= 0;
  }

  return dataRow.value >= fromValue && dataRow.value <= toValue;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BETWEEN,
  inputsCount: 2,
  showOperators: true
});
