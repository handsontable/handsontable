import * as C from '../../../i18n/constants';
import { registerCondition } from '../conditionRegisterer';

export const CONDITION_NAME = 'gte';

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
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {*} inputValues."0" Condition value to compare numbers.
 * @returns {boolean}
 */
export function condition(dataRow: DataRow, [value]: unknown[]) {
  let conditionValue = value;

  if (dataRow.meta.type === 'numeric') {
    conditionValue = parseFloat(conditionValue as string);
  }

  return (dataRow.value as number) >= (conditionValue as number);
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_GREATER_THAN_OR_EQUAL,
  inputsCount: 1,
  showOperators: true
});
