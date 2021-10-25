/**
 * @returns {number}
 */
export function getRegisteredMapsCounter(): number;
/**
 * Collection of index maps having unique names. It allow us to perform bulk operations such as init, remove, insert on all index maps that have been registered in the collection.
 */
export class MapCollection {
    /**
     * Collection of index maps.
     *
     * @type {Map<string, IndexMap>}
     */
    collection: Map<string, IndexMap>;
    /**
     * Register custom index map.
     *
     * @param {string} uniqueName Unique name of the index map.
     * @param {IndexMap} indexMap Index map containing miscellaneous (i.e. Meta data, indexes sequence), updated after remove and insert data actions.
     */
    register(uniqueName: string, indexMap: any): void;
    /**
     * Unregister custom index map.
     *
     * @param {string} name Name of the index map.
     */
    unregister(name: string): void;
    /**
     * Unregisters and destroys all collected index map instances.
     */
    unregisterAll(): void;
    /**
     * Get index map for the provided name.
     *
     * @param {string} [name] Name of the index map.
     * @returns {Array|IndexMap}
     */
    get(name?: string): any;
    /**
     * Get collection size.
     *
     * @returns {number}
     */
    getLength(): number;
    /**
     * Remove some indexes and corresponding mappings and update values of the others within all collection's index maps.
     *
     * @private
     * @param {Array} removedIndexes List of removed indexes.
     */
    private removeFromEvery;
    /**
     * Insert new indexes and corresponding mapping and update values of the others all collection's index maps.
     *
     * @private
     * @param {number} insertionIndex Position inside the actual list.
     * @param {Array} insertedIndexes List of inserted indexes.
     */
    private insertToEvery;
    /**
     * Set default values to index maps within collection.
     *
     * @param {number} length Destination length for all stored maps.
     */
    initEvery(length: number): void;
}
