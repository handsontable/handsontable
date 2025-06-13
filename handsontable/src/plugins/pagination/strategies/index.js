import { FixedPageSizeStrategy } from './fixedPageSize';
import { AutoPageSizeStrategy } from './autoPageSize';

/**
 * Create a pagination calculation strategy based on the provided type.
 *
 * @param {string} strategyType The type of pagination strategy to create.
 * @returns {FixedPageSizeStrategy | AutoPageSizeStrategy}
 */
export function createPaginatorStrategy(strategyType) {
  switch (strategyType) {
    case 'fixed':
      return new FixedPageSizeStrategy();
    case 'auto':
      return new AutoPageSizeStrategy();
    default:
      throw new Error(`Unknown pagination strategy type: ${strategyType}`);
  }
}
