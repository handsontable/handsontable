import { parseToLocalDate } from '../../../helpers/dateTime';
import * as C from '../../../i18n/constants';
import { registerCondition } from '../conditionRegisterer';

export const CONDITION_NAME = 'between';

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
 * @param {number} inputValues."0" The minimum value of the range.
 * @param {number} inputValues."1" The maximum value of the range.
 * @returns {boolean}
 */
export function condition(dataRow: DataRow, [from, to]: (string | number | undefined)[]) {
  let fromValue = from;
  let toValue = to;

  if (dataRow.meta.type === 'numeric') {
    const _from = parseFloat(fromValue as string);
    const _to = parseFloat(toValue as string);

    fromValue = Math.min(_from, _to);
    toValue = Math.max(_from, _to);

  } else if (dataRow.meta.type === 'date') {
    const date = parseToLocalDate(dataRow.value);
    const fromDate = parseToLocalDate(fromValue);
    const toDate = parseToLocalDate(toValue);

    if (date === null || fromDate === null || toDate === null) {
      return false;
    }

    return date.getTime() >= fromDate.getTime() && date.getTime() <= toDate.getTime();
  }

  return (dataRow.value as number) >= (fromValue as number) && (dataRow.value as number) <= (toValue as number);
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BETWEEN,
  inputsCount: 2,
  showOperators: true
});
