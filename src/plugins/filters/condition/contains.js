import * as C from '../../../i18n/constants';
import { stringify } from '../../../helpers/mixed';
import { registerCondition } from '../conditionRegisterer';

export const CONDITION_NAME = 'contains';

export function condition(dataRow, [value]) {
  return stringify(dataRow.value).toLowerCase().indexOf(stringify(value)) >= 0;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_CONTAINS,
  inputsCount: 1,
  showOperators: true
});
