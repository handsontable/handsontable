import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDateTime } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_datetime_between';

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
 * @param inputValues [from, to] The minimum and maximum date-time of the range.
 * @returns Whether the cell value is between the given date-times.
 */
export function condition(dataRow: DataRow, [from, to]: unknown[]): boolean {
  const dataDateTime = parseToLocalDateTime(dataRow.value);
  const fromDateTime = parseToLocalDateTime(from);
  const toDateTime = parseToLocalDateTime(to);

  if (dataDateTime === null || fromDateTime === null || toDateTime === null) {
    return false;
  }

  return dataDateTime >= fromDateTime && dataDateTime <= toDateTime;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BETWEEN,
  inputsCount: 2,
  showOperators: true,
  inputType: 'datetime-local',
});
