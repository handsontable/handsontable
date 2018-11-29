import mergeSort from '../../../utils/sortingAlgorithms/mergeSort';
import { getRootComparator } from './registry';

export const DO_NOT_SWAP = 0;
export const FIRST_BEFORE_SECOND = -1;
export const FIRST_AFTER_SECOND = 1;

export function sort(indexesWithData, rootComparatorId, ...argsForRootComparator) {
  const rootComparator = getRootComparator(rootComparatorId);

  mergeSort(indexesWithData, rootComparator(...argsForRootComparator));
}
