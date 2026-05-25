import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalTime } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_time_before';

type DataRow = {
  value: unknown;
  meta: { type?: string; locale?: string; dateFormat?: string; instance?: unknown; [key: string]: unknown };
};

/**
 *
 */
export function condition(dataRow: DataRow, [value]: unknown[]): boolean {
  const dataTime = parseToLocalTime(dataRow.value);
  const inputTime = parseToLocalTime(value);

  if (dataTime === null || inputTime === null) {
    return false;
  }

  return dataTime < inputTime;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BEFORE,
  inputsCount: 1,
  showOperators: true,
  inputType: 'time',
});
