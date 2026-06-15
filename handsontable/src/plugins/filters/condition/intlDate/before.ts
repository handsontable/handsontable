import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDate } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_date_before';

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
 * @param inputValues An array of values to compare with; inputValues[0] is maximum date of a range.
 * @returns Whether the cell value is before or equal to the given date.
 */
export function condition(dataRow: DataRow, [value]: unknown[]): boolean {
  const dataDate = parseToLocalDate(dataRow.value);
  const inputDate = parseToLocalDate(value);

  if (dataDate === null || inputDate === null) {
    return false;
  }

  return dataDate < inputDate;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BEFORE,
  inputsCount: 1,
  showOperators: true,
  inputType: 'date',
});
