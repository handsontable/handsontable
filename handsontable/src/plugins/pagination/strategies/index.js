import { FixedPageSizeStrategy } from './fixedPageSize';
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
    throw new Error(`Unknown pagination strategy type: ${strategyType}`, { cause: { handsontable: true } });
  }

  const Strategy = strategies.get(strategyType);

  return new Strategy();
}
