import { PhysicalIndexToValueMap } from './physicalIndexToValueMap';
import { arrayReduce } from '../../helpers/array';
import { IndexValue } from '../types';

/**
 * Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
 * NOT included in a dataset and skipped in the process of rendering.
 *
 * @class TrimmingMap
 */
export class TrimmingMap extends PhysicalIndexToValueMap {
  constructor(initValueOrFn: boolean | ((index: number) => boolean) = false) {
    super(initValueOrFn);
  }

  /**
   * Get physical indexes which are trimmed.
   *
   * Note: Indexes marked as trimmed aren't included in a {@link DataMap} and aren't rendered.
   *
   * @returns {Array}
   */
  getTrimmedIndexes(): number[] {
    return arrayReduce(this.getValues(), (indexesList: number[], isTrimmed: IndexValue, physicalIndex: number) => {
      if (isTrimmed) {
        indexesList.push(physicalIndex);
      }

      return indexesList;
    }, [] as number[]);
  }
}
