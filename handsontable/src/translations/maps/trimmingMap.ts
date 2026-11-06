import { BooleanMap } from './booleanMap';
import type { IndexMapOptions } from './indexMap';
import { arrayReduce } from '../../helpers/array';

/**
 * Configuration options for a `TrimmingMap`. The map enables `skipUnchangedWrites` itself, whatever
 * the passed value.
 *
 * @private
 */
export interface TrimmingMapOptions extends IndexMapOptions {
  /**
   * When `true`, the rows this map trims still count as rows a filter works on: the Filters plugin
   * keeps listing their values in the "Filter by value" list. A collapsed `nestedRows` parent is the
   * case it exists for - its children are trimmed, yet the filter still evaluates them.
   *
   * @private
   */
  keepsRowsInFilterScope?: boolean;
}

/**
 * Map for storing mappings from an physical index to a boolean value. It stores information whether physical index is
 * NOT included in a dataset and skipped in the process of rendering.
 *
 * @class TrimmingMap
 */
export class TrimmingMap extends BooleanMap {
  /**
   * Whether the rows this map trims stay in the Filters plugin's scope. See
   * `TrimmingMapOptions#keepsRowsInFilterScope`.
   *
   * @private
   * @type {boolean}
   */
  keepsRowsInFilterScope: boolean;

  /**
   * Initializes the trimming map with an optional default value, defaulting to `false` (not trimmed).
   *
   * The map stores flags coerced to booleans, so a write of an unchanged flag is provably a no-op —
   * `skipUnchangedWrites` is always on, keeping no-op writes from rebuilding the index caches.
   *
   * @param {*} [initValueOrFn=false] Initial value or function for the map.
   * @param {object} [options] Map options (see `TrimmingMapOptions`). `keepsRowsInFilterScope` is
   * internal.
   */
  constructor(
    initValueOrFn: ConstructorParameters<typeof BooleanMap>[0] = false,
    { keepsRowsInFilterScope = false }: TrimmingMapOptions = {},
  ) {
    super(initValueOrFn, { skipUnchangedWrites: true });

    this.keepsRowsInFilterScope = keepsRowsInFilterScope;
  }

  /**
   * Get physical indexes which are trimmed.
   *
   * Note: Indexes marked as trimmed aren't included in a {@link DataMap} and aren't rendered.
   *
   * @returns {Array}
   */
  getTrimmedIndexes() {
    return arrayReduce(this.getValues(), (indexesList: number[], isTrimmed, physicalIndex) => {
      if (isTrimmed) {
        indexesList.push(physicalIndex as number);
      }

      return indexesList;
    }, [] as number[]);
  }
}
