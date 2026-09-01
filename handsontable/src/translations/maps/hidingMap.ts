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
   *
   * The map stores flags coerced to booleans, so a write of an unchanged flag is provably a no-op —
   * `skipUnchangedWrites` is always on, keeping no-op writes from rebuilding the index caches.
   */
  constructor(initValueOrFn = false) {
    super(initValueOrFn, { skipUnchangedWrites: true });
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
