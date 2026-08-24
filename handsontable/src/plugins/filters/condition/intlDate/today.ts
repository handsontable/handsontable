import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDate } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_date_today';

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
 * @param dataRow The object which holds and describes the single cell value.
 * @returns Whether the cell value is today's date.
 */
export function condition(dataRow: DataRow): boolean {
  const dataDate = parseToLocalDate(dataRow.value);

  if (dataDate === null) {
    return false;
  }

  const now = new Date();

  return dataDate.getFullYear() === now.getFullYear() &&
    dataDate.getMonth() === now.getMonth() &&
    dataDate.getDate() === now.getDate();
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_TODAY,
  inputsCount: 0,
  inputType: 'date',
});
