import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDateTime } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_datetime_before';

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
 * @param inputValues [value] The reference date-time.
 * @returns Whether the cell value is before the given date-time.
 */
export function condition(dataRow: DataRow, [value]: unknown[]): boolean {
  const dataDateTime = parseToLocalDateTime(dataRow.value);
  const inputDateTime = parseToLocalDateTime(value);

  if (dataDateTime === null || inputDateTime === null) {
    return false;
  }

  return dataDateTime < inputDateTime;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BEFORE,
  inputsCount: 1,
  showOperators: true,
  inputType: 'datetime-local',
});
