import { getRootComparator } from './registry';
import { isPreparingRootCompareFn } from './preparedComparator';

export const DO_NOT_SWAP = 0;
export const FIRST_BEFORE_SECOND = -1;
export const FIRST_AFTER_SECOND = 1;

type RootComparator = (...args: unknown[][]) => (a: unknown, b: unknown) => number;

/**
 * Sorts the provided indexes with data using the comparator registered under the given id.
 *
 * When the root comparator exposes the decorate-sort-undecorate seam — which happens only when a
 * built-in compare function handles a sorted column — every row's comparison key is extracted once
 * here, before the sort starts, instead of being re-derived from both operands of every single
 * comparison. A comparator without the seam, which is every custom root comparator and every
 * user-supplied compare function, is handed the rows exactly as it is today.
 *
 * @param {Array} indexesWithData The data to sort.
 * @param {string} rootComparatorId The comparator logic to use.
 * @param {Array} argsForRootComparator Additional arguments for comparator function.
 */
export function sort(indexesWithData: unknown[], rootComparatorId: string, ...argsForRootComparator: unknown[][]) {
  const rootComparator = getRootComparator(rootComparatorId) as RootComparator;
  const comparator = rootComparator(...argsForRootComparator);

  if (isPreparingRootCompareFn(comparator)) {
    const keyComparator = comparator.prepare(indexesWithData as unknown[][]);

    if (keyComparator !== null) {
      indexesWithData.sort(keyComparator as (a: unknown, b: unknown) => number);
      comparator.cleanup(indexesWithData as unknown[][]);

      return;
    }
  }

  // Anything else is handed to `Array.prototype.sort` exactly as the registered comparator factory
  // returned it, including nothing at all - a factory that returns `undefined` still sorts in the
  // default order rather than throwing.
  indexesWithData.sort(comparator as (a: unknown, b: unknown) => number);
}
