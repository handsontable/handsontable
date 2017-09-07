import {registerCondition, getCondition} from './../conditionRegisterer';
import {CONDITION_NAME as CONDITION_EQUAL} from './equal';

export const CONDITION_NAME = 'neq';

export function condition(dataRow, inputValues) {
  return !getCondition(CONDITION_EQUAL, inputValues)(dataRow);
}

registerCondition(CONDITION_NAME, condition, {
  name: 'Is not equal to',
  inputsCount: 1,
  showOperators: true
});
