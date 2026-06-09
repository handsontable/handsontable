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
  getMergedValues(readFromCache = true) {
    if (readFromCache === true) {
      return this.mergedValuesCache;
    }

    if (this.getLength() === 0) {
      return [];
    }

    // Below variable stores values for every particular map. Example describing situation when we have 2 registered maps,
    // with length equal to 5.
    //
    // +---------+---------------------------------------------+
    // |         |                  indexes                    |
    // +---------+---------------------------------------------+
    // |   maps  |     0    |   1   |    2  |   3   |    4     |
    // +---------+----------+-------+-------+-------+----------+
    // |    0    | [[ value,  value,  value,  value,  value ], |
    // |    1    | [  value,  value,  value,  value,  value ]] |
    // +---------+----------+-------+-------+-------+----------+
    const mapsValuesMatrix = arrayMap(this.get() as unknown[], (map: unknown) =>
      (map as { getValues(): unknown[] }).getValues());
    // Below variable stores values for every particular index. Example describing situation when we have 2 registered maps,
    // with length equal to 5.
    //
    // +---------+---------------------+
    // |         |         maps        |
    // +---------+---------------------+
    // | indexes |     0    |    1     |
    // +---------+----------+----------+
    // |    0    | [[ value,  value ], |
    // |    1    | [  value,  value ], |
    // |    2    | [  value,  value ], |
    // |    3    | [  value,  value ], |
    // |    4    | [  value,  value ]] |
    // +---------+----------+----------+
    const indexesValuesMatrix = [];
    const mapsLength = (isDefined(mapsValuesMatrix[0]) && (mapsValuesMatrix[0] as unknown[]).length) || 0;

    for (let index = 0; index < mapsLength; index += 1) {
      const valuesForIndex = [];

      for (let mapIndex = 0; mapIndex < this.getLength(); mapIndex += 1) {
        valuesForIndex.push((mapsValuesMatrix[mapIndex] as unknown[])[index]);
      }

      indexesValuesMatrix.push(valuesForIndex);
    }

    return arrayMap(indexesValuesMatrix, this.aggregationFunction);
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
