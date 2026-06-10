import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDate } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_date_yesterday';

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
 *
 */
export function condition(dataRow: DataRow): boolean {
  const dataDate = parseToLocalDate(dataRow.value);

  if (dataDate === null) {
    return false;
  }

  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  return dataDate.getFullYear() === yesterday.getFullYear() &&
    dataDate.getMonth() === yesterday.getMonth() &&
    dataDate.getDate() === yesterday.getDate();
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_YESTERDAY,
  inputsCount: 0,
  inputType: 'date',
});
