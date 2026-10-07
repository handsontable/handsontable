export {
  registerRootComparator,
  getRootComparator,
  markBuiltInRootComparator,
  getBuiltInPositionComparator,
  getCompareFunctionFactory,
} from './registry';
export type { PositionComparatorFactory } from './registry';
export { FIRST_AFTER_SECOND, FIRST_BEFORE_SECOND, DO_NOT_SWAP, sort } from './engine';
