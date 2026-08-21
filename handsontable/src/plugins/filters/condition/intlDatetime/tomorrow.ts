import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDateTime } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_datetime_tomorrow';

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
 * @returns Whether the cell value falls on tomorrow's date.
 */
export function condition(dataRow: DataRow): boolean {
  const dataDateTime = parseToLocalDateTime(dataRow.value);

  if (dataDateTime === null) {
    return false;
  }

  const reference = new Date();

  reference.setDate(reference.getDate() + 1);

  return dataDateTime.getFullYear() === reference.getFullYear() &&
    dataDateTime.getMonth() === reference.getMonth() &&
    dataDateTime.getDate() === reference.getDate();
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_TOMORROW,
  inputsCount: 0,
  inputType: 'datetime-local',
});
