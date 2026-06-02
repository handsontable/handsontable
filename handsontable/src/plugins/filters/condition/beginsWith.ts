import * as C from '../../../i18n/constants';
import { stringify } from '../../../helpers/mixed';
import { registerCondition } from '../conditionRegisterer';

export const CONDITION_NAME = 'begins_with';

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
 * @param {*} inputValues."0" Value to check if it occurs at the beginning.
 * @returns {boolean}
 */
export function condition(dataRow: DataRow, [value]: unknown[]) {
  return stringify(dataRow.value).toLocaleLowerCase(dataRow.meta.locale).startsWith(stringify(value));
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BEGINS_WITH,
  inputsCount: 1,
  showOperators: true
});
