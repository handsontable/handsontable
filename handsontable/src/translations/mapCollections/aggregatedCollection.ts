import { MapCollection } from './mapCollection';
import { arrayMap } from '../../helpers/array';
import { isDefined } from '../../helpers/mixed';

/**
 * Collection of maps. This collection aggregate maps with the same type of values. Values from the registered maps
 * can be used to calculate a single result for particular index.
 */
export class AggregatedCollection extends MapCollection {
  // Mixin-injected properties/methods (added by `mixin(MapCollection, localHooks)`)
  /**
   * Registers a callback function for the given local hook name on this aggregated collection.
   */
  declare addLocalHook: (key: string, callback: Function) => this;

  /**
   * List of merged values. Value for each index is calculated using values inside registered maps.
   *
   * @type {Array}
   */
  mergedValuesCache: unknown[] = [];
  /**
   * Function which do aggregation on the values for particular index.
   */
  aggregationFunction;
  /**
   * Fallback value when there is no calculated value for particular index.
   */
  fallbackValue;

  /**
   * Initializes the aggregated collection with a function that combines per-index values and a fallback value for indexes with no data.
   */
  constructor(aggregationFunction: (valuesForIndex: unknown[]) => unknown, fallbackValue: unknown) {
    super();
    this.aggregationFunction = aggregationFunction;
    this.fallbackValue = fallbackValue;
  }

  /**
   * Get merged values for all indexes.
   *
   * @param {boolean} [readFromCache=true] Determine if read results from the cache.
   * @returns {Array}
   */
  getMergedValues(readFromCache = true): unknown[] {
    if (readFromCache === true) {
      return this.mergedValuesCache;
    }

    const maps = this.get();
    const numberOfMaps = maps.length;

    if (numberOfMaps === 0) {
      return [];
    }

    // Per-map value arrays. For 2 maps of length 5:
    //   maps 0 | [ value, value, value, value, value ]
    //   maps 1 | [ value, value, value, value, value ]
    const mapsValuesMatrix = arrayMap(maps, map => map.getValues());
    const indexesLength = (isDefined(mapsValuesMatrix[0]) && mapsValuesMatrix[0].length) || 0;
    const mergedValues: unknown[] = new Array(indexesLength);
    // A single scratch row, reused for every index, is passed to the aggregation function instead
    // of allocating one `[value, value, ...]` array per index. The previous matrix approach built
    // O(rows) throwaway sub-arrays on every sort/trim/hide rebuild (the dominant cost of updateCache
    // on large datasets). The aggregation functions read this array synchronously and never retain
    // it, so reuse is safe.
    const valuesForIndex: unknown[] = new Array(numberOfMaps);

    for (let index = 0; index < indexesLength; index += 1) {
      for (let mapIndex = 0; mapIndex < numberOfMaps; mapIndex += 1) {
        valuesForIndex[mapIndex] = mapsValuesMatrix[mapIndex][index];
      }

      mergedValues[index] = this.aggregationFunction(valuesForIndex);
    }

    return mergedValues;
  }

  /**
   * Get merged value for particular index.
   *
   * @param {number} index Index for which we calculate single result.
   * @param {boolean} [readFromCache=true] Determine if read results from the cache.
   * @returns {*}
   */
  getMergedValueAtIndex(index: number, readFromCache?: boolean) {
    const valueAtIndex = this.getMergedValues(readFromCache)[index];

    return isDefined(valueAtIndex) ? valueAtIndex : this.fallbackValue;
  }

  /**
   * Rebuild cache for the collection.
   */
  updateCache() {
    this.mergedValuesCache = this.getMergedValues(false);
  }
}
