import { BooleanMap } from './booleanMap';
import { arrayReduce } from '../../helpers/array';

/**
 * Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
 * included in a dataset, but skipped in the process of rendering.
 *
 * @class HidingMap
 */
export class HidingMap extends BooleanMap {
  /**
   * Initializes the hiding map with an optional default value, defaulting to `false` (not hidden).
   */
  constructor(initValueOrFn = false) {
    super(initValueOrFn);
  }

  /**
   * Get physical indexes which are hidden.
   *
   * Note: Indexes marked as hidden are included in a {@link DataMap}, but aren't rendered.
   *
   * @returns {Array}
   */
  getHiddenIndexes() {
    return arrayReduce(this.getValues(), (indexesList: number[], isHidden, physicalIndex) => {
      if (isHidden) {
        indexesList.push(physicalIndex as number);
      }

      return indexesList;
    }, [] as number[]);
  }
}
