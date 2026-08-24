import { parseToLocalDate, getRelativeLocalDate, isSameLocalDay } from '../../../../helpers/dateTime';
import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';

export const CONDITION_NAME = 'date_tomorrow';

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
 * @returns {boolean}
 */
export function condition(dataRow: DataRow) {
  const date = parseToLocalDate(dataRow.value);

  if (date === null) {
    return false;
  }

  return isSameLocalDay(date, getRelativeLocalDate(1));
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_TOMORROW,
  inputsCount: 0
});
