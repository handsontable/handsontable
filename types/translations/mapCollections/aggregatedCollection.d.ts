/**
 * Collection of maps. This collection aggregate maps with the same type of values. Values from the registered maps
 * can be used to calculate a single result for particular index.
 */
export class AggregatedCollection extends MapCollection {
    constructor(aggregationFunction: any, fallbackValue: any);
    /**
     * List of merged values. Value for each index is calculated using values inside registered maps.
     *
     * @type {Array}
     */
    mergedValuesCache: Array;
    /**
     * Function which do aggregation on the values for particular index.
     */
    aggregationFunction: any;
    /**
     * Fallback value when there is no calculated value for particular index.
     */
    fallbackValue: any;
    /**
     * Get merged values for all indexes.
     *
     * @param {boolean} [readFromCache=true] Determine if read results from the cache.
     * @returns {Array}
     */
    getMergedValues(readFromCache?: boolean): any[];
    /**
     * Get merged value for particular index.
     *
     * @param {number} index Index for which we calculate single result.
     * @param {boolean} [readFromCache=true] Determine if read results from the cache.
     * @returns {*}
     */
    getMergedValueAtIndex(index: number, readFromCache?: boolean): any;
    /**
     * Rebuild cache for the collection.
     */
    updateCache(): void;
}
import { MapCollection } from "./mapCollection";
