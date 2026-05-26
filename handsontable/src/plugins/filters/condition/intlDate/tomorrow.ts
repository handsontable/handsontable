import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDate } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_date_tomorrow';

type DataRow = {
  value: unknown;
  meta: { type?: string; locale?: string; dateFormat?: string; instance?: unknown; [key: string]: unknown };
};

/**
 * @param dataRow The object which holds and describes the single cell value.
 * @returns Whether the cell value is tomorrow's date.
 */
export function condition(dataRow: DataRow): boolean {
  const dataDate = parseToLocalDate(dataRow.value);

  if (dataDate === null) {
    return false;
  }

  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  return dataDate.getFullYear() === tomorrow.getFullYear() &&
    dataDate.getMonth() === tomorrow.getMonth() &&
    dataDate.getDate() === tomorrow.getDate();
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_TOMORROW,
  inputsCount: 0,
  inputType: 'date',
});
