import { registerCondition } from './../conditionRegisterer';

export const CONDITION_NAME = 'true';

export function condition() {
  return true;
}

registerCondition(CONDITION_NAME, condition, {
  name: 'True'
});
