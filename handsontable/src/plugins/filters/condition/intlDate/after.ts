import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDate } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_date_after';

type DataRow = {
  value: unknown;
  meta: { type?: string; locale?: string; dateFormat?: string; instance?: unknown; [key: string]: unknown };
};

/**
 *
 */
export function condition(dataRow: DataRow, [value]: unknown[]): boolean {
  const dataDate = parseToLocalDate(dataRow.value);
  const inputDate = parseToLocalDate(value);

  if (dataDate === null || inputDate === null) {
    return false;
  }

  return dataDate > inputDate;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_AFTER,
  inputsCount: 1,
  showOperators: true,
  inputType: 'date',
});
