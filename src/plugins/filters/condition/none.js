import {registerCondition} from './../conditionRegisterer';

export const CONDITION_NAME = 'none';

export function condition() {
  return true;
}

registerCondition(CONDITION_NAME, condition, {
  name: 'None',
  inputsCount: 0,
  showOperators: false
});
