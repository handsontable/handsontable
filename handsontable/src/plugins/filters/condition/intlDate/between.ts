import * as C from '../../../../i18n/constants';
import { registerCondition, getCondition } from '../../conditionRegisterer';
import { CONDITION_NAME as CONDITION_INTL_DATE_AFTER } from './after';
import { CONDITION_NAME as CONDITION_INTL_DATE_BEFORE } from './before';

export const CONDITION_NAME = 'intl_date_between';

type DataRow = {
  value: unknown;
  meta: Record<string, unknown>;
};

export function condition(dataRow: DataRow, [from, to]: unknown[]): boolean {
  const dateBefore = getCondition(CONDITION_INTL_DATE_BEFORE, [to]);
  const dateAfter = getCondition(CONDITION_INTL_DATE_AFTER, [from]);
  return dateBefore(dataRow) && dateAfter(dataRow);
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BETWEEN,
  inputsCount: 2,
  showOperators: true,
  inputType: 'date',
});
