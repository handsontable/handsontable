import * as C from 'handsontable/i18n/constants';
import {registerCondition} from './../conditionRegisterer';

export const CONDITION_NAME = 'false';

export function condition() {
  return false;
}

registerCondition(CONDITION_NAME, condition, {
  name: 'False'
});
