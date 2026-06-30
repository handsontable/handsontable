import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalTime } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_time_between';

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
 * @param inputValues [from, to] The minimum and maximum value of the range.
 * @returns Whether the cell value is between the given times.
 */
export function condition(dataRow: DataRow, [from, to]: unknown[]): boolean {
  const dataTime = parseToLocalTime(dataRow.value);
  const fromTime = parseToLocalTime(from);
  const toTime = parseToLocalTime(to);

  if (dataTime === null || fromTime === null || toTime === null) {
    return false;
  }

  return dataTime >= fromTime && dataTime <= toTime;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BETWEEN,
  inputsCount: 2,
  showOperators: true,
  inputType: 'time',
});
