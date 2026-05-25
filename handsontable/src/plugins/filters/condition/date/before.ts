import moment from 'moment';
import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';

export const CONDITION_NAME = 'date_before';

type DataRow = {
  value: unknown;
  meta: { type?: string; locale?: string; dateFormat?: string; instance?: unknown; [key: string]: unknown };
};

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {*} inputValues."0" Maximum date of a range.
 * @returns {boolean}
 */
export function condition(dataRow: DataRow, [value]: unknown[]) {
  const date = moment(dataRow.value as string, dataRow.meta.dateFormat as string);
  const inputDate = moment(value, dataRow.meta.dateFormat);

  if (!date.isValid() || !inputDate.isValid()) {
    return false;
  }

  return date.diff(inputDate) < 0;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BEFORE,
  inputsCount: 1,
  showOperators: true
});
