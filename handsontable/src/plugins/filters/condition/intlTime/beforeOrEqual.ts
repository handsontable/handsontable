import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalTime } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_time_before_or_equal';

type DataRow = {
  value: unknown;
  meta: {
    type?: string;
    locale?: string;
    dateFormat?: Intl.DateTimeFormatOptions;
    instance?: unknown;
    [key: string]: unknown
  };
};

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {*} inputValues."0" Maximum time of a range.
 * @returns {boolean}
 */
export function condition(dataRow: DataRow, [value]: unknown[]): boolean {
  const dataTime = parseToLocalTime(dataRow.value);
  const inputTime = parseToLocalTime(value);

  if (dataTime === null || inputTime === null) {
    return false;
  }

  return dataTime <= inputTime;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BEFORE_OR_EQUAL,
  inputsCount: 1,
  showOperators: true,
  inputType: 'time',
});
