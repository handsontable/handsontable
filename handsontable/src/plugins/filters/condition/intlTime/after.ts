import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalTime } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_time_after';

type DataRow = {
  value: unknown;
  meta: { type?: string; locale?: string; dateFormat?: string; instance?: unknown; [key: string]: unknown };
};

/**
 * @param dataRow The object which holds and describes the single cell value.
 * @param inputValues An array of values to compare with; inputValues[0] is minimum time of a range.
 * @returns Whether the cell value is after or equal to the given time.
 */
export function condition(dataRow: DataRow, [value]: unknown[]): boolean {
  const dataTime = parseToLocalTime(dataRow.value);
  const inputTime = parseToLocalTime(value);

  if (dataTime === null || inputTime === null) {
    return false;
  }

  return dataTime > inputTime;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_AFTER,
  inputsCount: 1,
  showOperators: true,
  inputType: 'time',
});
