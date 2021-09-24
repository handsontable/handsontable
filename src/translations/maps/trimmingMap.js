import { PhysicalIndexToValueMap } from './physicalIndexToValueMap';
import { arrayReduce } from '../../helpers/array';

/**
 * Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
 * NOT included in a dataset and skipped in the process of rendering.
 */
export class TrimmingMap extends PhysicalIndexToValueMap {
  constructor(initValueOrFn = false) {
    super(initValueOrFn);
  }

  /**
   * Get physical indexes which are trimmed.
   *
   * Note: Indexes marked as trimmed aren't included in a {@link DataMap} and aren't rendered.
   *
   * @returns {Array}
   */
  getTrimmedIndexes() {
    return arrayReduce(this.getValues(), (indexesList, isTrimmed, physicalIndex) => {
      if (isTrimmed) {
        indexesList.push(physicalIndex);
      }

      return indexesList;
    }, []);
  }
}
