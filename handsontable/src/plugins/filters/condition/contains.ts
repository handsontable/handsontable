import * as C from '../../../i18n/constants';
import { stringify } from '../../../helpers/mixed';
import { localeLowerCase } from '../../../helpers/string';
import { registerCondition } from '../conditionRegisterer';

export const CONDITION_NAME = 'contains';

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
 * @param {*} inputValues."0" A value to check if it occurs in the row's data.
 * @returns {boolean}
 */
export function condition(dataRow: DataRow, [value]: unknown[]) {
  return localeLowerCase(stringify(dataRow.value), dataRow.meta.locale).indexOf(stringify(value)) >= 0;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_CONTAINS,
  inputsCount: 1,
  showOperators: true
});
