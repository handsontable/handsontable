import { arrayFilter, arrayMap } from './../helpers/array';
import { getListWithRemovedItems, getListWithInsertedItems } from './maps/utils/visuallyIndexed';
import { rangeEach } from '../helpers/number';
import IndexToIndexMap from './maps/visualIndexToPhysicalIndexMap';
import SkipMap from './maps/skipMap';
import MapCollection from './mapCollection';
import localHooks from '../mixins/localHooks';
import { mixin } from '../helpers/object';
import { isDefined } from '../helpers/mixed';

/**
 * Index mapper stores, registers and manages the indexes on the basis of calculations collected from this class objects.
 * It should be seen as a single source of truth for any operation that considers CRUD actions such as **insertion**, **movement**, **removal** etc, and is used to properly calculate physical and visual indexes translations in both ways.
 *
 * To ensure the calculation is done correctly **index mapper** also registers the skipping process
 * and embeds **cache** which is triggered only when the data or structure changes.
 *
 *
 * Index mapper can be called upon specific properties i.e. **rowIndexMapper**, **columnIndexMapper** which, respectively, manage **rows** and **columns**.
 *
 * **There are 3  main objects on class IndexMapper for storing different types of index information:**
 *
 * **-** Map for the **sequence** of indexes. It is registered by default and may be used from API methods like
 * `getIndexesSequence`, `setIndexesSequence`, `getNumberOfIndexes` etc.
 * ```js
 * // type {VisualIndexToPhysicalIndexMap}
 * this.indexesSequence = new IndexToIndexMap();
 *
 * ```
 * **-** Collection for different **skip maps**. These indexes are bound to be skipped and will not be rendered.
 * Examples of the API methods are: `getNotSkippedIndexes`, `getNotSkippedIndexesLength`, `isSkipped`
 * ``` js
 * // type {MapCollection}
 * this.skipMapsCollection = new MapCollection();
 * ```
 *
 * **-** Collection for any **other** kind of mapping.
 * ``` js
 * // type {MapCollection}
 * this.variousMapsCollection = new MapCollection();
 * ```
 *
 * **Complementary to the above there are 3 main kinds of index maps which may be registered in the collections.**
 * They are registered to collections and can be used by reference. They also expose public API and trigger two local hooks such as `init` (on initialization) and `change` (on change).
 *
 * **-** `VisualIndexToPhysicalIndexMap` which provides mappings **from visual index to physical index** and update the physical index on remove/add row or column action.
 *
 * **-** `PhysicalIndexToValueMap` which provides mappings **from physical index to any value** and doesn't update the value on remove/add row or column action.
 *
 * **-** `SkipMap` - which is like `PhysicalIndexToValueMap` but for **skipping** some indexes inside index maps (values are booleans).
 */
class IndexMapper {
  constructor() {
    /**
     * Map storing the sequence of indexes.
     *
     * @private
     * @type {VisualIndexToPhysicalIndexMap}
     */
    this.indexesSequence = new IndexToIndexMap();
    /**
     * Collection for different skip maps. Indexes marked as skipped in any map won't be rendered.
     *
     * @private
     * @type {MapCollection}
     */
    this.skipMapsCollection = new MapCollection();
    /**
     * Collection for another kind of maps.
     *
     * @private
     * @type {MapCollection}
     */
    this.variousMapsCollection = new MapCollection();
    /**
     * Cache for skip result for particular indexes.
     *
     * @private
     * @type {Array}
     */
    this.flattenSkipList = [];
    /**
     * Cache for list of not skipped indexes, respecting the indexes sequence.
     *
     * @private
     * @type {Array}
     */
    this.notSkippedIndexesCache = [];
    /**
     * Flag determining whether operations performed on index mapper were batched.
     *
     * @private
     * @type {Boolean}
     */
    this.isBatched = false;
    /**
     * Flag determining whether any action on indexes sequence or skipped indexes was performed.
     *
     * @private
     * @type {Boolean}
     */
    this.cachedIndexesChange = false;

    this.indexesSequence.addLocalHook('change', () => {
      this.cachedIndexesChange = true;

      // Sequence of visible indexes might change.
      this.updateCache();

      this.runLocalHooks('change', this.indexesSequence, null);
    });

    this.skipMapsCollection.addLocalHook('change', (changedMap) => {
      this.cachedIndexesChange = true;

      // Number of visible indexes might change.
      this.updateCache();

      this.runLocalHooks('change', changedMap, this.skipMapsCollection);
    });

    this.variousMapsCollection.addLocalHook('change', (changedMap) => {
      this.runLocalHooks('change', changedMap, this.variousMapsCollection);
    });
  }

  /**
   * Execute batch operations with updating cache.
   *
   * @param {Function} wrappedOperations Batched operations wrapped in a function.
   */
  executeBatchOperations(wrappedOperations) {
    const actualFlag = this.isBatched;

    this.isBatched = true;

    wrappedOperations();

    this.isBatched = actualFlag;

    this.updateCache();
  }

  /**
   * Register map which provide some index mappings.
   *
   * @param {String} uniqueName Name of the index map. It should be unique.
   * @param {IndexMap} indexMap Registered index map updated on items removal and insertion.
   * @returns {IndexMap}
   */
  registerMap(uniqueName, indexMap) {
    if (this.skipMapsCollection.get(uniqueName) || this.variousMapsCollection.get(uniqueName)) {
      throw Error(`Map with name "${uniqueName}" has been already registered.`);
    }

    if (indexMap instanceof SkipMap) {
      this.skipMapsCollection.register(uniqueName, indexMap);

    } else {
      this.variousMapsCollection.register(uniqueName, indexMap);
    }

    const numberOfIndexes = this.getNumberOfIndexes();
    /*
      We initialize map ony when we have full information about number of indexes and the dataset is not empty.
      Otherwise it's unnecessary. Initialization of empty array would not give any positive changes. After initializing
      it with number of indexes equal to 0 the map would be still empty. What's more there would be triggered
      not needed hook (no real change have occurred). Number of indexes is known after loading data (the `loadData`
      function from the `Core`).
     */
    if (numberOfIndexes > 0) {
      indexMap.init(numberOfIndexes);
    }

    return indexMap;
  }

  /**
   * Unregister a map with given name.
   *
   * @param {String} name Name of the index map.
   */
  unregisterMap(name) {
    this.skipMapsCollection.unregister(name);
    this.variousMapsCollection.unregister(name);
  }

  /**
   * Get physical index by its visual index.
   *
   * @param {Number} visualIndex Visual index.
   * @return {Number|null} Returns translated index mapped by passed visual index.
   */
  getPhysicalIndex(visualIndex) {
    const visibleIndexes = this.getNotSkippedIndexes();
    const numberOfVisibleIndexes = visibleIndexes.length;
    let physicalIndex = null;

    if (visualIndex < numberOfVisibleIndexes) {
      physicalIndex = visibleIndexes[visualIndex];
    }

    return physicalIndex;
  }

  /**
   * Get visual index by its physical index.
   *
   * @param {Number} physicalIndex Physical index to search.
   * @returns {Number|null} Returns a visual index of the index mapper.
   */
  getVisualIndex(physicalIndex) {
    const visibleIndexes = this.getNotSkippedIndexes();
    const visualIndex = visibleIndexes.indexOf(physicalIndex);

    if (visualIndex !== -1) {
      return visualIndex;
    }

    return null;
  }

  /**
   * Set default values for all stored index maps.
   *
   * @param {Number} [length] Destination length for all stored index maps.
   */
  initToLength(length = this.getNumberOfIndexes()) {
    this.flattenSkipList = [];
    this.notSkippedIndexesCache = [...new Array(length).keys()];

    this.executeBatchOperations(() => {
      this.indexesSequence.init(length);
      this.skipMapsCollection.initEvery(length);
      this.variousMapsCollection.initEvery(length);
    });

    this.runLocalHooks('init');
  }

  /**
   * Get all indexes sequence.
   *
   * @returns {Array} Physical indexes.
   */
  getIndexesSequence() {
    return this.indexesSequence.getValues();
  }

  /**
   * Set completely new indexes sequence.
   *
   * @param {Array} indexes Physical indexes.
   */
  setIndexesSequence(indexes) {
    this.indexesSequence.setValues(indexes);
  }

  /**
   * Get all indexes NOT skipped in the process of rendering.
   *
   * @param {Boolean} [readFromCache=true] Determine if read indexes from cache.
   * @returns {Array} Physical indexes.
   */
  getNotSkippedIndexes(readFromCache = true) {
    if (readFromCache === true) {
      return this.notSkippedIndexesCache;
    }

    return arrayFilter(this.getIndexesSequence(), index => this.isSkipped(index) === false);
  }

  /**
   * Get length of all indexes NOT skipped in the process of rendering.
   *
   * @returns {Number}
   */
  getNotSkippedIndexesLength() {
    return this.getNotSkippedIndexes().length;
  }

  /**
   * Get number of all indexes.
   *
   * @returns {Number}
   */
  getNumberOfIndexes() {
    return this.getIndexesSequence().length;
  }

  /**
   * Move indexes in the index mapper.
   *
   * @param {Number|Array} movedIndexes Visual index(es) to move.
   * @param {Number} finalIndex Visual index index being a start index for the moved element.
   */
  moveIndexes(movedIndexes, finalIndex) {
    if (typeof movedIndexes === 'number') {
      movedIndexes = [movedIndexes];
    }

    const physicalMovedIndexes = arrayMap(movedIndexes, visualIndex => this.getPhysicalIndex(visualIndex));
    const notSkippedIndexesLength = this.getNotSkippedIndexesLength();
    const movedIndexesLength = movedIndexes.length;

    // Removing indexes without re-indexing.
    const listWithRemovedItems = getListWithRemovedItems(this.getIndexesSequence(), physicalMovedIndexes);

    // When item(s) are moved after the last visible item we assign the last possible index.
    let destinationPosition = notSkippedIndexesLength - movedIndexesLength;

    // Otherwise, we find proper index for inserted item(s).
    if (finalIndex + movedIndexesLength < notSkippedIndexesLength) {
      // Physical index at final index position.
      const physicalIndex = listWithRemovedItems.filter(index => this.isSkipped(index) === false)[finalIndex];
      destinationPosition = listWithRemovedItems.indexOf(physicalIndex);
    }

    // Adding indexes without re-indexing.
    this.setIndexesSequence(getListWithInsertedItems(listWithRemovedItems, destinationPosition, physicalMovedIndexes));
  }

  /**
   * Get whether index is skipped in the process of rendering.
   *
   * @param {Number} physicalIndex Physical index.
   * @returns {Boolean}
   */
  isSkipped(physicalIndex) {
    return this.getFlattenSkipList()[physicalIndex] || false;
  }

  /**
   * Insert new indexes and corresponding mapping and update values of the others, for all stored index maps.
   *
   * @private
   * @param {Number} firstInsertedVisualIndex First inserted visual index.
   * @param {Number} amountOfIndexes Amount of inserted indexes.
   */
  insertIndexes(firstInsertedVisualIndex, amountOfIndexes) {
    const nthVisibleIndex = this.getNotSkippedIndexes()[firstInsertedVisualIndex];
    const firstInsertedPhysicalIndex = isDefined(nthVisibleIndex) ? nthVisibleIndex : this.getNumberOfIndexes();
    const insertionIndex = this.getIndexesSequence().includes(nthVisibleIndex) ? this.getIndexesSequence().indexOf(nthVisibleIndex) : this.getNumberOfIndexes();
    const insertedIndexes = arrayMap(new Array(amountOfIndexes).fill(firstInsertedPhysicalIndex), (nextIndex, stepsFromStart) => nextIndex + stepsFromStart);

    this.executeBatchOperations(() => {
      this.indexesSequence.insert(insertionIndex, insertedIndexes);
      this.skipMapsCollection.insertToEvery(insertionIndex, insertedIndexes);
      this.variousMapsCollection.insertToEvery(insertionIndex, insertedIndexes);
    });
  }

  /**
   * Remove some indexes and corresponding mappings and update values of the others, for all stored index maps.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  removeIndexes(removedIndexes) {
    this.executeBatchOperations(() => {
      this.indexesSequence.remove(removedIndexes);
      this.skipMapsCollection.removeFromEvery(removedIndexes);
      this.variousMapsCollection.removeFromEvery(removedIndexes);
    });
  }

  /**
   * Get list of values, which represent result if index was skipped in any of skip collections.
   *
   * @private
   * @param {Boolean} [readFromCache=true] Determine if read indexes from cache.
   * @returns {Array}
   */
  getFlattenSkipList(readFromCache = true) {
    if (readFromCache === true) {
      return this.flattenSkipList;
    }

    if (this.skipMapsCollection.getLength() === 0) {
      return [];
    }

    const result = [];
    const particularSkipsLists = arrayMap(this.skipMapsCollection.get(), skipList => skipList.getValues());

    rangeEach(this.indexesSequence.getLength(), (physicalIndex) => {
      result[physicalIndex] = particularSkipsLists.some(particularSkipsList => particularSkipsList[physicalIndex]);
    });

    return result;
  }

  /**
   * Rebuild cache for some indexes. Every action on indexes sequence or skipped indexes by default reset cache,
   * thus batching some index maps actions is recommended.
   *
   * @param {Boolean} [force=false] Determine if force cache update.
   * @private
   */
  updateCache(force = false) {
    if (force === true || (this.isBatched === false && this.cachedIndexesChange === true)) {
      this.flattenSkipList = this.getFlattenSkipList(false);
      this.notSkippedIndexesCache = this.getNotSkippedIndexes(false);
      this.cachedIndexesChange = false;

      this.runLocalHooks('cacheUpdated');
    }
  }
}

mixin(IndexMapper, localHooks);

export default IndexMapper;
