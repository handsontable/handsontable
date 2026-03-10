import { FixedPageSizeStrategy } from './fixedPageSize';
import { throwWithCause } from '../../../helpers/errors';
import { AutoPageSizeStrategy } from './autoPageSize';

export interface PaginatorStrategy {
  getTotalPages(): number;
  getState(currentPage: number): { startIndex: number; pageSize: number } | undefined;
  calculate(options: Record<string, unknown>): void;
}

const strategies = new Map<string, Function>([
  ['fixed', FixedPageSizeStrategy],
  ['auto', AutoPageSizeStrategy],
]);

/**
 * Create a pagination calculation strategy based on the provided type.
 *
 * @param {string} strategyType The type of pagination strategy to create.
 * @returns {PaginatorStrategy}
 */
export function createPaginatorStrategy(strategyType: string): PaginatorStrategy {
  if (!strategies.has(strategyType)) {
    throwWithCause(`Unknown pagination strategy type: ${strategyType}`);
  }

  const Strategy = strategies.get(strategyType);

  return new (Strategy as new () => PaginatorStrategy)();
}
