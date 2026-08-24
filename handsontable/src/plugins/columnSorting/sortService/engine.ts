import { getRootComparator } from './registry';

export const DO_NOT_SWAP = 0;
export const FIRST_BEFORE_SECOND = -1;
export const FIRST_AFTER_SECOND = 1;

type RootComparator = (...args: unknown[][]) => (a: unknown, b: unknown) => number;

/**
 * Sorts the provided indexes with data using the comparator registered under the given id.
 *
 * @param {Array} indexesWithData The data to sort.
 * @param {string} rootComparatorId The comparator logic to use.
 * @param {Array} argsForRootComparator Additional arguments for comparator function.
 */
export function sort(indexesWithData: unknown[], rootComparatorId: string, ...argsForRootComparator: unknown[][]) {
  const rootComparator = getRootComparator(rootComparatorId) as RootComparator;

  indexesWithData.sort(rootComparator(...argsForRootComparator));
}
