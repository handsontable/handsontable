import { arrayFilter, arrayMap } from './../helpers/array';
import { getListWithRemovedItems, getListWithInsertedItems } from './maps/utils/visuallyIndexed';
import { rangeEach } from '../helpers/number';
import IndexMap from './maps/indexMap';
import SkipMap from './maps/skipMap';
import MapCollection from './mapCollection';
import localHooks from '../mixins/localHooks';
import { mixin } from '../helpers/object';
import { isDefined } from '../helpers/mixed';

class IndexMapper {
  constructor() {
    /**
     * Map storing the sequence of indexes.
     *
     * @type {IndexMap}
     */
    this.indexesSequence = new IndexMap();
    /**
     * Collection for different skip maps. Indexes marked as skipped in any map won't be rendered.
     *
     * @type {MapCollection}
     */
    this.skipCollection = new MapCollection();
    /**
     * Collection for another kind of mappings.
     *
     * @type {MapCollection}
     */
    this.variousMappingsCollection = new MapCollection();
    /**
     * Cache for skip result for particular indexes.
     *
     * @type {Array}
     */
    this.flattenSkipList = [];
    /**
     * Cache for list of not skipped indexes, respecting the indexes sequence.
     *
     * @type {Array}
     */
    this.notSkippedIndexesCache = [];
    /**
     * Flag determining whether operations performed on index mapper were batched.
     *
     * @type {Boolean}
     */
    this.isBatched = false;
    /**
     * Flag determining whether any action on indexes sequence or skipped indexes was performed.
     *
     * @type {Boolean}
     */
    this.cachedIndexesChange = false;

    this.indexesSequence.addLocalHook('change', () => {
      this.cachedIndexesChange = true;

      // Sequence of visible indexes might change.
      this.updateCache();

      this.runLocalHooks('change', this.indexesSequence, null);
    });

    this.skipCollection.addLocalHook('change', (changedMap) => {
      this.cachedIndexesChange = true;

      // Number of visible indexes might change.
      this.updateCache();

      this.runLocalHooks('change', changedMap, this.skipCollection);
    });

    this.variousMappingsCollection.addLocalHook('change', (changedMap) => {
      this.runLocalHooks('change', changedMap, this.variousMappingsCollection);
    });
  }

  /**
   * Execute batch operations with updating cache.
   *
   * @param {Function} curriedBatchOperations Batched operations curried in a function.
   */
  executeBatchOperations(curriedBatchOperations) {
    const actualFlag = this.isBatched;

    this.isBatched = true;

    curriedBatchOperations(this);

    this.isBatched = actualFlag;

    this.updateCache();
  }

  /**
   * Register map which provide some index mappings.
   *
   * @param {String} uniqueName Name of the map. It should be unique.
   * @param {ValueMap|IndexMap|SkipMap} mapper Register mapper updated on items removal and insertion.
   * @returns {ValueMap|IndexMap|SkipMap}
   */
  registerMap(uniqueName, map) {
    if (this.skipCollection.get(uniqueName) || this.variousMappingsCollection.get(uniqueName)) {
      throw Error(`Mapper with name "${uniqueName}" is already registered.`);
    }

    if (map instanceof SkipMap === true) {
      this.skipCollection.register(uniqueName, map);

    } else {
      this.variousMappingsCollection.register(uniqueName, map);
    }

    const numberOfIndexes = this.getNumberOfIndexes();
    /*
      We initialize map ony when we have full information about number of indexes and the dataset is not empty. Otherwise it's unnecessary. Initialization of empty array
      would not give any positive changes. After initializing it with number of indexes equal to 0 the map would be still empty. What's more there would be triggered
      not needed hook (no real change have occurred). Number of indexes is known after loading data (the `loadData` function from the `Core`).
     */
    if (numberOfIndexes > 0) {
      map.init(numberOfIndexes);
    }

    return map;
  }

  /**
   * Unregister a map with given name.
   *
   * @param {String} name Name of the map.
   */
  unregisterMap(name) {
    this.skipCollection.unregister(name);
    this.variousMappingsCollection.unregister(name);
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
      this.skipCollection.initEvery(length);
      this.variousMappingsCollection.initEvery(length);
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

    if (this.skipCollection.getLength() === 0) {
      return [];
    }

    const result = [];
    const particularSkipsLists = arrayMap(this.skipCollection.get(), skipList => skipList.getValues());

    rangeEach(this.indexesSequence.getLength(), (physicalIndex) => {
      result[physicalIndex] = particularSkipsLists.some(particularSkipsList => particularSkipsList[physicalIndex]);
    });

    return result;
  }

  /**
   * Get whether index is skipped in the process of rendering.
   *
   * @private
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
      this.skipCollection.insertToEvery(insertionIndex, insertedIndexes);
      this.variousMappingsCollection.insertToEvery(insertionIndex, insertedIndexes);
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
      this.skipCollection.removeFromEvery(removedIndexes);
      this.variousMappingsCollection.removeFromEvery(removedIndexes);
    });
  }

  /**
   * Rebuild cache for some indexes. Every action on indexes sequence or skipped indexes by default reset cache, thus batching some index maps actions is recommended.
   *
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
