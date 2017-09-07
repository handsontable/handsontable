import {registerCondition, getCondition} from './../conditionRegisterer';
import {CONDITION_NAME as CONDITION_BETWEEN} from './between';

export const CONDITION_NAME = 'not_between';

export function condition(dataRow, inputValues) {
  return !getCondition(CONDITION_BETWEEN, inputValues)(dataRow);
}

registerCondition(CONDITION_NAME, condition, {
  name: 'Is not between',
  inputsCount: 2,
  showOperators: true
});
