import { FixedPageSizeStrategy } from './fixedPageSize';
import { throwWithCause } from '../../../helpers/errors';
import { AutoPageSizeStrategy } from './autoPageSize';

const strategies = new Map([
  ['fixed', FixedPageSizeStrategy],
  ['auto', AutoPageSizeStrategy],
]);

/**
 * Create a pagination calculation strategy based on the provided type.
 *
 * @param {string} strategyType The type of pagination strategy to create.
 * @returns {FixedPageSizeStrategy | AutoPageSizeStrategy}
 */
export function createPaginatorStrategy(strategyType) {
  if (!strategies.has(strategyType)) {
    throwWithCause(`Unknown pagination strategy type: ${strategyType}`);
  }

  const Strategy = strategies.get(strategyType);

  return new Strategy();
}
