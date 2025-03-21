import { PhysicalIndexToValueMap } from './physicalIndexToValueMap';
import { arrayReduce } from '../../helpers/array';
import { IndexValue } from '../types';

/**
 * Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
 * included in a dataset, but skipped in the process of rendering.
 *
 * @class HidingMap
 */
export class HidingMap extends PhysicalIndexToValueMap {
  constructor(initValueOrFn: boolean | ((index: number) => boolean) = false) {
    super(initValueOrFn);
  }

  /**
   * Get physical indexes which are hidden.
   *
   * Note: Indexes marked as hidden are included in a {@link DataMap}, but aren't rendered.
   *
   * @returns {Array}
   */
  getHiddenIndexes(): number[] {
    return arrayReduce(this.getValues(), (indexesList: number[], isHidden: IndexValue, physicalIndex: number) => {
      if (isHidden) {
        indexesList.push(physicalIndex);
      }

      return indexesList;
    }, [] as number[]);
  }
}
