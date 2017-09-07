import {registerCondition, getCondition} from './../conditionRegisterer';
import {CONDITION_NAME as CONDITION_EMPTY} from './empty';

export const CONDITION_NAME = 'not_empty';

export function condition(dataRow, inputValues) {
  return !getCondition(CONDITION_EMPTY, inputValues)(dataRow);
}

registerCondition(CONDITION_NAME, condition, {
  name: 'Is not empty',
  inputsCount: 0,
  showOperators: true
});
