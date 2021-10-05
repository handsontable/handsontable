import { registerCondition } from '../conditionRegisterer';

export const CONDITION_NAME = 'true';

/**
 * @returns {boolean}
 */
export function condition() {
  return true;
}

registerCondition(CONDITION_NAME, condition, {
  name: 'True'
});
