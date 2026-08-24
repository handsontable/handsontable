import * as C from '../../../i18n/constants';
import { registerCondition } from '../conditionRegisterer';
import { isEmpty } from '../../../helpers/mixed';

export const CONDITION_NAME = 'empty';

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
 * @returns {boolean}
 */
export function condition(dataRow: DataRow) {
  return isEmpty(dataRow.value);
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_EMPTY,
  inputsCount: 0,
  showOperators: true
});
