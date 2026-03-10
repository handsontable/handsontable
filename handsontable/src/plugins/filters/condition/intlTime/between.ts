import * as C from '../../../../i18n/constants';
import { registerCondition, getCondition } from '../../conditionRegisterer';
import { CONDITION_NAME as CONDITION_INTL_TIME_AFTER } from './after';
import { CONDITION_NAME as CONDITION_INTL_TIME_BEFORE } from './before';

export const CONDITION_NAME = 'intl_time_between';

type DataRow = {
  value: unknown;
  meta: { type?: string; locale?: string; dateFormat?: string; instance?: unknown; [key: string]: unknown };
};

/**
 * @param dataRow The object which holds and describes the single cell value.
 * @param inputValues [from, to] The minimum and maximum value of the range.
 * @returns Whether the cell value is between the given times.
 */
export function condition(dataRow: DataRow, [from, to]: unknown[]): boolean {
  const timeBefore = getCondition(CONDITION_INTL_TIME_BEFORE, [to]);
  const timeAfter = getCondition(CONDITION_INTL_TIME_AFTER, [from]);

  return timeBefore(dataRow) && timeAfter(dataRow);
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BETWEEN,
  inputsCount: 2,
  showOperators: true,
  inputType: 'time',
});
