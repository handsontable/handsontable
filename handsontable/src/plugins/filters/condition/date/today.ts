import moment from 'moment';
import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';

export const CONDITION_NAME = 'date_today';

type DataRow = {
  value: unknown;
  meta: { type?: string; locale?: string; dateFormat?: string; instance?: unknown; [key: string]: unknown };
};

/**
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @returns {boolean}
 */
export function condition(dataRow: DataRow) {
  const date = moment(dataRow.value as string, dataRow.meta.dateFormat as string);

  if (!date.isValid()) {
    return false;
  }

  return date.isSame(moment().startOf('day'), 'd');
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_TODAY,
  inputsCount: 0
});
