import { arrayMap } from '../helpers/array';
import {
  createIndexMap,
  getListWithInsertedItems,
  getListWithRemovedItems,
  HidingMap,
  IndexesSequence,
  TrimmingMap,
} from './maps';
import {
  AggregatedCollection,
  MapCollection,
} from './mapCollections';
import localHooks from '../mixins/localHooks';
import { mixin } from '../helpers/object';
import { isDefined } from '../helpers/mixed';
import { ChangesObservable } from './changesObservable/observable';

/**
 * @class IndexMapper
 * @description
 *
 * Index mapper stores, registers and manages the indexes on the basis of calculations collected from the subsidiary maps.
 * It should be seen as a single source of truth (regarding row and column indexes, for example, their sequence, information if they are skipped in the process of rendering (hidden or trimmed), values linked to them)
 * for any operation that considers CRUD actions such as **insertion**, **movement**, **removal** etc, and is used to properly calculate physical and visual indexes translations in both ways.
 * It has a built-in cache that is updated only when the data or structure changes.
 *
 * **Physical index** is a type of an index from the sequence of indexes assigned to the data source rows or columns
 *  (from 0 to n, where n is number of the cells on the axis of data set).
 * **Visual index** is a type of an index from the sequence of indexes assigned to rows or columns existing in {@link DataMap} (from 0 to n, where n is number of the cells on the axis of data set).
 * **Renderable index** is a type of an index from the sequence of indexes assigned to rows or columns whose may be rendered (when they are in a viewport; from 0 to n, where n is number of the cells renderable on the axis).
 *
 * There are different kinds of index maps which may be registered in the collections and can be used by a reference.
 * They also expose public API and trigger two local hooks such as `init` (on initialization) and `change` (on change).
 *
 * These are: {@link IndexesSequence}, {@link PhysicalIndexToValueMap}, {@link HidingMap}, and {@link TrimmingMap}.
 */
export class IndexMapper {
  constructor() {
    /**
     * Map for storing the sequence of indexes.
     *
     * It is registered by default and may be used from API methods.
     *
     * @private
     * @type {IndexesSequence}
     */
    this.indexesSequence = new IndexesSequence();
    /**
     * Collection for different trimming maps. Indexes marked as trimmed in any map WILL NOT be included in
     * the {@link DataMap} and won't be rendered.
     *
     * @private
     * @type {MapCollection}
     */
    this.trimmingMapsCollection = new AggregatedCollection(
      valuesForIndex => valuesForIndex.some(value => value === true), false);
    /**
     * Collection for different hiding maps. Indexes marked as hidden in any map WILL be included in the {@link DataMap},
     * but won't be rendered.
     *
     * @private
     * @type {MapCollection}
     */
    this.hidingMapsCollection = new AggregatedCollection(
      valuesForIndex => valuesForIndex.some(value => value === true), false);
    /**
     * Collection for another kind of maps. There are stored mappings from indexes (visual or physical) to values.
     *
     * @private
     * @type {MapCollection}
     */
    this.variousMapsCollection = new MapCollection();
    /**
     * The class instance collects row and column index changes that happen while the Handsontable
     * is running. The object allows creating observers that you can subscribe. Each event represents
     * the index change (e.g., insert, removing, change index value), which can be consumed by a
     * developer to update its logic.
     *
     * @private
     * @type {ChangesObservable}
     */
    this.hidingChangesObservable = new ChangesObservable({
      initialIndexValue: false,
    });
    /**
     * Cache for list of not trimmed indexes, respecting the indexes sequence (physical indexes).
     *
     * Note: Please keep in mind that trimmed index can be also hidden.
     *
     * @private
     * @type {Array}
     */
    this.notTrimmedIndexesCache = [];
    /**
     * Cache for list of not hidden indexes, respecting the indexes sequence (physical indexes).
     *
     * Note: Please keep in mind that hidden index can be also trimmed.
     *
     * @private
     * @type {Array}
     */
    this.notHiddenIndexesCache = [];
    /**
     * Flag determining whether actions performed on index mapper have been batched. It's used for cache management.
     *
     * @private
     * @type {boolean}
     */
    this.isBatched = false;
    /**
     * Flag determining whether any action on indexes sequence has been performed. It's used for cache management.
     *
     * @private
     * @type {boolean}
     */
    this.indexesSequenceChanged = false;
    /**
     * Flag determining whether any action on trimmed indexes has been performed. It's used for cache management.
     *
     * @private
     * @type {boolean}
     */
    this.trimmedIndexesChanged = false;
    /**
     * Flag determining whether any action on hidden indexes has been performed. It's used for cache management.
     *
     * @private
     * @type {boolean}
     */
    this.hiddenIndexesChanged = false;
    /**
     * Physical indexes (respecting the sequence of indexes) which may be rendered (when they are in a viewport).
     *
     * @private
     * @type {Array}
     */
    this.renderablePhysicalIndexesCache = [];
    /**
     * Visual indexes (native map's value) corresponding to physical indexes (native map's index).
     *
     * @private
     * @type {Map}
     */
    this.fromPhysicalToVisualIndexesCache = new Map();
    /**
     * Visual indexes (native map's value) corresponding to physical indexes (native map's index).
     *
     * @private
     * @type {Map}
     */
    this.fromVisualToRenderableIndexesCache = new Map();

    this.indexesSequence.addLocalHook('change', () => {
      this.indexesSequenceChanged = true;

      // Sequence of stored indexes might change.
      this.updateCache();

      this.runLocalHooks('change', this.indexesSequence, null);
    });

    this.trimmingMapsCollection.addLocalHook('change', (changedMap) => {
      this.trimmedIndexesChanged = true;

      // Number of trimmed indexes might change.
      this.updateCache();

      this.runLocalHooks('change', changedMap, this.trimmingMapsCollection);
    });

    this.hidingMapsCollection.addLocalHook('change', (changedMap) => {
      this.hiddenIndexesChanged = true;

      // Number of hidden indexes might change.
      this.updateCache();

      this.runLocalHooks('change', changedMap, this.hidingMapsCollection);
    });

    this.variousMapsCollection.addLocalHook('change', (changedMap) => {
      this.runLocalHooks('change', changedMap, this.variousMapsCollection);
    });
  }

  /**
   * Suspends the cache update for this map. The method is helpful to group multiple
   * operations, which affects the cache. In this case, the cache will be updated once after
   * calling the `resumeOperations` method.
   */
  suspendOperations() {
    this.isBatched = true;
  }

  /**
   * Resumes the cache update for this map. It recalculates the cache and restores the
   * default behavior where each map modification updates the cache.
   */
  resumeOperations() {
    this.isBatched = false;
    this.updateCache();
  }

  /**
   * It creates and returns the new instance of the ChangesObserver object. The object
   * allows listening to the index changes that happen while the Handsontable is running.
   *
   * @param {string} indexMapType The index map type which we want to observe.
   *                              Currently, only the 'hiding' index map types are observable.
   * @returns {ChangesObserver}
   */
  createChangesObserver(indexMapType) {
    if (indexMapType !== 'hiding') {
      throw new Error(`Unsupported index map type "${indexMapType}".`);
    }

    return this.hidingChangesObservable.createObserver();
  }

  /**
   * Creates and register the new IndexMap for specified IndexMapper instance.
   *
   * @param {string} indexName The uniq index name.
   * @param {string} mapType The index map type (e.q. "hiding, "trimming", "physicalIndexToValue").
   * @param {*} [initValueOrFn] The initial value for the index map.
   * @returns {IndexMap}
   */
  createAndRegisterIndexMap(indexName, mapType, initValueOrFn) {
    return this.registerMap(indexName, createIndexMap(mapType, initValueOrFn));
  }

  /**
   * Register map which provide some index mappings. Type of map determining to which collection it will be added.
   *
   * @param {string} uniqueName Name of the index map. It should be unique.
   * @param {IndexMap} indexMap Registered index map updated on items removal and insertion.
   * @returns {IndexMap}
   */
  registerMap(uniqueName, indexMap) {
    if (this.trimmingMapsCollection.get(uniqueName) ||
        this.hidingMapsCollection.get(uniqueName) ||
        this.variousMapsCollection.get(uniqueName)) {
      throw Error(`Map with name "${uniqueName}" has been already registered.`);
    }

    if (indexMap instanceof TrimmingMap) {
      this.trimmingMapsCollection.register(uniqueName, indexMap);

    } else if (indexMap instanceof HidingMap) {
      this.hidingMapsCollection.register(uniqueName, indexMap);

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
   * @param {string} name Name of the index map.
   */
  unregisterMap(name) {
    this.trimmingMapsCollection.unregister(name);
    this.hidingMapsCollection.unregister(name);
    this.variousMapsCollection.unregister(name);
  }

  /**
   * Unregisters all collected index map instances from all map collection types.
   */
  unregisterAll() {
    this.trimmingMapsCollection.unregisterAll();
    this.hidingMapsCollection.unregisterAll();
    this.variousMapsCollection.unregisterAll();
  }

  /**
   * Get a physical index corresponding to the given visual index.
   *
   * @param {number} visualIndex Visual index.
   * @returns {number|null} Returns translated index mapped by passed visual index.
   */
  getPhysicalFromVisualIndex(visualIndex) {
    // Index in the table boundaries provided by the `DataMap`.
    const physicalIndex = this.notTrimmedIndexesCache[visualIndex];

    if (isDefined(physicalIndex)) {
      return physicalIndex;
    }

    return null;
  }

  /**
   * Get a physical index corresponding to the given renderable index.
   *
   * @param {number} renderableIndex Renderable index.
   * @returns {null|number}
   */
  getPhysicalFromRenderableIndex(renderableIndex) {
    const physicalIndex = this.renderablePhysicalIndexesCache[renderableIndex];

    // Index in the renderable table boundaries.
    if (isDefined(physicalIndex)) {
      return physicalIndex;
    }

    return null;
  }

  /**
   * Get a visual index corresponding to the given physical index.
   *
   * @param {number} physicalIndex Physical index to search.
   * @returns {number|null} Returns a visual index of the index mapper.
   */
  getVisualFromPhysicalIndex(physicalIndex) {
    const visualIndex = this.fromPhysicalToVisualIndexesCache.get(physicalIndex);

    // Index in the table boundaries provided by the `DataMap`.
    if (isDefined(visualIndex)) {
      return visualIndex;
    }

    return null;
  }

  /**
   * Get a visual index corresponding to the given renderable index.
   *
   * @param {number} renderableIndex Renderable index.
   * @returns {null|number}
   */
  getVisualFromRenderableIndex(renderableIndex) {
    return this.getVisualFromPhysicalIndex(this.getPhysicalFromRenderableIndex(renderableIndex));
  }

  /**
   * Get a renderable index corresponding to the given visual index.
   *
   * @param {number} visualIndex Visual index.
   * @returns {null|number}
   */
  getRenderableFromVisualIndex(visualIndex) {
    const renderableIndex = this.fromVisualToRenderableIndexesCache.get(visualIndex);

    // Index in the renderable table boundaries.
    if (isDefined(renderableIndex)) {
      return renderableIndex;
    }

    return null;
  }

  /**
   * Search for the first visible, not hidden index (represented by a visual index).
   *
   * @param {number} fromVisualIndex Visual start index. Starting point for finding destination index. Start point may be destination
   * point when handled index is NOT hidden.
   * @param {number} incrementBy We are searching for a next visible indexes by increasing (to be precise, or decreasing) indexes.
   * This variable represent indexes shift. We are looking for an index:
   * - for rows: from the left to the right (increasing indexes, then variable should have value 1) or
   * other way around (decreasing indexes, then variable should have the value -1)
   * - for columns: from the top to the bottom (increasing indexes, then variable should have value 1)
   * or other way around (decreasing indexes, then variable should have the value -1).
   * @param {boolean} searchAlsoOtherWayAround The argument determine if an additional other way around search should be
   * performed, when the search in the first direction had no effect in finding visual index.
   * @param {number} indexForNextSearch Visual index for next search, when the flag is truthy.
   *
   * @returns {number|null} Visual column index or `null`.
   */
  getFirstNotHiddenIndex(fromVisualIndex, incrementBy, searchAlsoOtherWayAround = false,
                         indexForNextSearch = fromVisualIndex - incrementBy) {
    const physicalIndex = this.getPhysicalFromVisualIndex(fromVisualIndex);

    // First or next (it may be end of the table) index is beyond the table boundaries.
    if (physicalIndex === null) {
      // Looking for the next index in the opposite direction. This conditional won't be fulfilled when we STARTED
      // the search from the index beyond the table boundaries.
      if (searchAlsoOtherWayAround === true && indexForNextSearch !== fromVisualIndex - incrementBy) {
        return this.getFirstNotHiddenIndex(indexForNextSearch, -incrementBy, false, indexForNextSearch);
      }

      return null;
    }

    if (this.isHidden(physicalIndex) === false) {
      return fromVisualIndex;
    }

    // Looking for the next index, as the current isn't visible.
    return this.getFirstNotHiddenIndex(
      fromVisualIndex + incrementBy,
      incrementBy,
      searchAlsoOtherWayAround,
      indexForNextSearch
    );
  }

  /**
   * Set default values for all indexes in registered index maps.
   *
   * @param {number} [length] Destination length for all stored index maps.
   */
  initToLength(length = this.getNumberOfIndexes()) {
    this.notTrimmedIndexesCache = [...new Array(length).keys()];
    this.notHiddenIndexesCache = [...new Array(length).keys()];

    this.suspendOperations();
    this.indexesSequence.init(length);
    this.trimmingMapsCollection.initEvery(length);
    this.resumeOperations();

    // We move initialization of hidden collection to next batch for purpose of working on sequence of already trimmed indexes.
    this.suspendOperations();
    this.hidingMapsCollection.initEvery(length);

    // It shouldn't reset the cache.
    this.variousMapsCollection.initEvery(length);
    this.resumeOperations();

    this.runLocalHooks('init');
  }

  /**
   * Get sequence of indexes.
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
   * Get all NOT trimmed indexes.
   *
   * Note: Indexes marked as trimmed aren't included in a {@link DataMap} and aren't rendered.
   *
   * @param {boolean} [readFromCache=true] Determine if read indexes from cache.
   * @returns {Array} List of physical indexes. Index of this native array is a "visual index",
   * value of this native array is a "physical index".
   */
  getNotTrimmedIndexes(readFromCache = true) {
    if (readFromCache === true) {
      return this.notTrimmedIndexesCache;
    }

    const indexesSequence = this.getIndexesSequence();

    return indexesSequence.filter(physicalIndex => this.isTrimmed(physicalIndex) === false);
  }

  /**
   * Get length of all NOT trimmed indexes.
   *
   * Note: Indexes marked as trimmed aren't included in a {@link DataMap} and aren't rendered.
   *
   * @returns {number}
   */
  getNotTrimmedIndexesLength() {
    return this.getNotTrimmedIndexes().length;
  }

  /**
   * Get all NOT hidden indexes.
   *
   * Note: Indexes marked as hidden are included in a {@link DataMap}, but aren't rendered.
   *
   * @param {boolean} [readFromCache=true] Determine if read indexes from cache.
   * @returns {Array} List of physical indexes. Please keep in mind that index of this native array IS NOT a "visual index".
   */
  getNotHiddenIndexes(readFromCache = true) {
    if (readFromCache === true) {
      return this.notHiddenIndexesCache;
    }

    const indexesSequence = this.getIndexesSequence();

    return indexesSequence.filter(physicalIndex => this.isHidden(physicalIndex) === false);
  }

  /**
   * Get length of all NOT hidden indexes.
   *
   * Note: Indexes marked as hidden are included in a {@link DataMap}, but aren't rendered.
   *
   * @returns {number}
   */
  getNotHiddenIndexesLength() {
    return this.getNotHiddenIndexes().length;
  }

  /**
   * Get list of physical indexes (respecting the sequence of indexes) which may be rendered (when they are in a viewport).
   *
   * @param {boolean} [readFromCache=true] Determine if read indexes from cache.
   * @returns {Array} List of physical indexes. Index of this native array is a "renderable index",
   * value of this native array is a "physical index".
   */
  getRenderableIndexes(readFromCache = true) {
    if (readFromCache === true) {
      return this.renderablePhysicalIndexesCache;
    }

    const notTrimmedIndexes = this.getNotTrimmedIndexes();

    return notTrimmedIndexes.filter(physicalIndex => this.isHidden(physicalIndex) === false);
  }

  /**
   * Get length of all NOT trimmed and NOT hidden indexes.
   *
   * @returns {number}
   */
  getRenderableIndexesLength() {
    return this.getRenderableIndexes().length;
  }

  /**
   * Get number of all indexes.
   *
   * @returns {number}
   */
  getNumberOfIndexes() {
    return this.getIndexesSequence().length;
  }

  /**
   * Move indexes in the index mapper.
   *
   * @param {number|Array} movedIndexes Visual index(es) to move.
   * @param {number} finalIndex Visual index being a start index for the moved elements.
   */
  moveIndexes(movedIndexes, finalIndex) {
    if (typeof movedIndexes === 'number') {
      movedIndexes = [movedIndexes];
    }

    const physicalMovedIndexes = arrayMap(movedIndexes, visualIndex => this.getPhysicalFromVisualIndex(visualIndex));
    const notTrimmedIndexesLength = this.getNotTrimmedIndexesLength();
    const movedIndexesLength = movedIndexes.length;

    // Removing indexes without re-indexing.
    const listWithRemovedItems = getListWithRemovedItems(this.getIndexesSequence(), physicalMovedIndexes);

    // When item(s) are moved after the last visible item we assign the last possible index.
    let destinationPosition = notTrimmedIndexesLength - movedIndexesLength;

    // Otherwise, we find proper index for inserted item(s).
    if (finalIndex + movedIndexesLength < notTrimmedIndexesLength) {
      // Physical index at final index position.
      const physicalIndex = listWithRemovedItems.filter(index => this.isTrimmed(index) === false)[finalIndex];

      destinationPosition = listWithRemovedItems.indexOf(physicalIndex);
    }

    // Adding indexes without re-indexing.
    this.setIndexesSequence(getListWithInsertedItems(listWithRemovedItems, destinationPosition, physicalMovedIndexes));
  }

  /**
   * Get whether index is trimmed. Index marked as trimmed isn't included in a {@link DataMap} and isn't rendered.
   *
   * @param {number} physicalIndex Physical index.
   * @returns {boolean}
   */
  isTrimmed(physicalIndex) {
    return this.trimmingMapsCollection.getMergedValueAtIndex(physicalIndex);
  }

  /**
   * Get whether index is hidden. Index marked as hidden is included in a {@link DataMap}, but isn't rendered.
   *
   * @param {number} physicalIndex Physical index.
   * @returns {boolean}
   */
  isHidden(physicalIndex) {
    return this.hidingMapsCollection.getMergedValueAtIndex(physicalIndex);
  }

  /**
   * Insert new indexes and corresponding mapping and update values of the others, for all stored index maps.
   *
   * @private
   * @param {number} firstInsertedVisualIndex First inserted visual index.
   * @param {number} amountOfIndexes Amount of inserted indexes.
   */
  insertIndexes(firstInsertedVisualIndex, amountOfIndexes) {
    const nthVisibleIndex = this.getNotTrimmedIndexes()[firstInsertedVisualIndex];
    const firstInsertedPhysicalIndex = isDefined(nthVisibleIndex) ? nthVisibleIndex : this.getNumberOfIndexes();
    const insertionIndex = this.getIndexesSequence().includes(nthVisibleIndex) ?
      this.getIndexesSequence().indexOf(nthVisibleIndex) : this.getNumberOfIndexes();
    const insertedIndexes = arrayMap(new Array(amountOfIndexes).fill(firstInsertedPhysicalIndex),
      (nextIndex, stepsFromStart) => nextIndex + stepsFromStart);

    this.suspendOperations();
    this.indexesSequence.insert(insertionIndex, insertedIndexes);
    this.trimmingMapsCollection.insertToEvery(insertionIndex, insertedIndexes);
    this.hidingMapsCollection.insertToEvery(insertionIndex, insertedIndexes);
    this.variousMapsCollection.insertToEvery(insertionIndex, insertedIndexes);
    this.resumeOperations();
  }

  /**
   * Remove some indexes and corresponding mappings and update values of the others, for all stored index maps.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  removeIndexes(removedIndexes) {
    this.suspendOperations();
    this.indexesSequence.remove(removedIndexes);
    this.trimmingMapsCollection.removeFromEvery(removedIndexes);
    this.hidingMapsCollection.removeFromEvery(removedIndexes);
    this.variousMapsCollection.removeFromEvery(removedIndexes);
    this.resumeOperations();
  }

  /**
   * Rebuild cache for some indexes. Every action on indexes sequence or indexes skipped in the process of rendering
   * by default reset cache, thus batching some index maps actions is recommended.
   *
   * @private
   * @param {boolean} [force=false] Determine if force cache update.
   */
  updateCache(force = false) {
    const anyCachedIndexChanged = this.indexesSequenceChanged ||
      this.trimmedIndexesChanged || this.hiddenIndexesChanged;

    if (force === true || (this.isBatched === false && anyCachedIndexChanged === true)) {
      this.trimmingMapsCollection.updateCache();
      this.hidingMapsCollection.updateCache();
      this.notTrimmedIndexesCache = this.getNotTrimmedIndexes(false);
      this.notHiddenIndexesCache = this.getNotHiddenIndexes(false);
      this.renderablePhysicalIndexesCache = this.getRenderableIndexes(false);
      this.cacheFromPhysicalToVisualIndexes();
      this.cacheFromVisualToRenderabIendexes();

      // Currently there's support only for the "hiding" map type.
      if (this.hiddenIndexesChanged) {
        this.hidingChangesObservable.emit(this.hidingMapsCollection.getMergedValues());
      }

      this.runLocalHooks('cacheUpdated', {
        indexesSequenceChanged: this.indexesSequenceChanged,
        trimmedIndexesChanged: this.trimmedIndexesChanged,
        hiddenIndexesChanged: this.hiddenIndexesChanged,
      });

      this.indexesSequenceChanged = false;
      this.trimmedIndexesChanged = false;
      this.hiddenIndexesChanged = false;
    }
  }

  /**
   * Update cache for translations from physical to visual indexes.
   *
   * @private
   */
  cacheFromPhysicalToVisualIndexes() {
    const nrOfNotTrimmedIndexes = this.getNotTrimmedIndexesLength();

    this.fromPhysicalToVisualIndexesCache.clear();

    for (let visualIndex = 0; visualIndex < nrOfNotTrimmedIndexes; visualIndex += 1) {
      const physicalIndex = this.getPhysicalFromVisualIndex(visualIndex);

      // Every visual index have corresponding physical index, but some physical indexes may don't have
      // corresponding visual indexes (physical indexes may represent trimmed indexes, beyond the table boundaries)
      this.fromPhysicalToVisualIndexesCache.set(physicalIndex, visualIndex);
    }
  }

  /**
   * Update cache for translations from visual to renderable indexes.
   *
   * @private
   */
  cacheFromVisualToRenderabIendexes() {
    const nrOfRenderableIndexes = this.getRenderableIndexesLength();

    this.fromVisualToRenderableIndexesCache.clear();

    for (let renderableIndex = 0; renderableIndex < nrOfRenderableIndexes; renderableIndex += 1) {
      // Can't use getRenderableFromVisualIndex here because we're building the cache here
      const physicalIndex = this.getPhysicalFromRenderableIndex(renderableIndex);
      const visualIndex = this.getVisualFromPhysicalIndex(physicalIndex);

      this.fromVisualToRenderableIndexesCache.set(visualIndex, renderableIndex);
    }
  }
}

mixin(IndexMapper, localHooks);
