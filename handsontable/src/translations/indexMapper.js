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
 * A set of deprecated feature names.
 *
 * @type {Set<string>}
 */
// eslint-disable-next-line no-unused-vars
const deprecationWarns = new Set();

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
 * These are: {@link IndexesSequence}, {@link PhysicalIndexToValueMap}, {@link LinkedPhysicalIndexToValueMap}, {@link HidingMap}, and {@link TrimmingMap}.
 */
export class IndexMapper {
  /**
   * Map for storing the sequence of indexes.
   *
   * It is registered by default and may be used from API methods.
   *
   * @private
   * @type {IndexesSequence}
   */
  indexesSequence = new IndexesSequence();
  /**
   * Collection for different trimming maps. Indexes marked as trimmed in any map WILL NOT be included in
   * the {@link DataMap} and won't be rendered.
   *
   * @private
   * @type {MapCollection}
   */
  trimmingMapsCollection = new AggregatedCollection(
    valuesForIndex => valuesForIndex.some(value => value === true), false);
  /**
   * Collection for different hiding maps. Indexes marked as hidden in any map WILL be included in the {@link DataMap},
   * but won't be rendered.
   *
   * @private
   * @type {MapCollection}
   */
  hidingMapsCollection = new AggregatedCollection(
    valuesForIndex => valuesForIndex.some(value => value === true), false);
  /**
   * Collection for another kind of maps. There are stored mappings from indexes (visual or physical) to values.
   *
   * @private
   * @type {MapCollection}
   */
  variousMapsCollection = new MapCollection();
  /**
   * The class instance collects row and column index changes that happen while the Handsontable
   * is running. The object allows creating observers that you can subscribe. Each event represents
   * the index change (e.g., insert, removing, change index value), which can be consumed by a
   * developer to update its logic.
   *
   * @private
   * @type {ChangesObservable}
   */
  hidingChangesObservable = new ChangesObservable({
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
  notTrimmedIndexesCache = [];
  /**
   * Cache for list of not hidden indexes, respecting the indexes sequence (physical indexes).
   *
   * Note: Please keep in mind that hidden index can be also trimmed.
   *
   * @private
   * @type {Array}
   */
  notHiddenIndexesCache = [];
  /**
   * Flag determining whether actions performed on index mapper have been batched. It's used for cache management.
   *
   * @private
   * @type {boolean}
   */
  isBatched = false;
  /**
   * Flag determining whether any action on indexes sequence has been performed. It's used for cache management.
   *
   * @private
   * @type {boolean}
   */
  indexesSequenceChanged = false;
  /**
   * Flag informing about source of the change.
   *
   * @type {undefined|string}
   */
  indexesChangeSource = undefined;
  /**
   * Flag determining whether any action on trimmed indexes has been performed. It's used for cache management.
   *
   * @private
   * @type {boolean}
   */
  trimmedIndexesChanged = false;
  /**
   * Flag determining whether any action on hidden indexes has been performed. It's used for cache management.
   *
   * @private
   * @type {boolean}
   */
  hiddenIndexesChanged = false;
  /**
   * Physical indexes (respecting the sequence of indexes) which may be rendered (when they are in a viewport).
   *
   * @private
   * @type {Array}
   */
  renderablePhysicalIndexesCache = [];
  /**
   * Visual indexes (native map's value) corresponding to physical indexes (native map's index).
   *
   * @private
   * @type {Map}
   */
  fromPhysicalToVisualIndexesCache = new Map();
  /**
   * Visual indexes (native map's value) corresponding to physical indexes (native map's index).
   *
   * @private
   * @type {Map}
   */
  fromVisualToRenderableIndexesCache = new Map();

  constructor() {
    this.indexesSequence.addLocalHook('change', () => {
      this.indexesSequenceChanged = true;

      // Sequence of stored indexes might change.
      this.updateCache();

      this.runLocalHooks('indexesSequenceChange', this.indexesChangeSource);
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
   * Creates and registers a new `IndexMap` for a specified `IndexMapper` instance.
   *
   * @param {string} indexName A unique index name.
   * @param {string} mapType The index map type (e.g., "hiding", "trimming", "physicalIndexToValue").
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
   * Search for the nearest not-hidden row or column.
   *
   * @param {number} fromVisualIndex The visual index of the row or column from which the search starts.<br><br>
   * If the row or column from which the search starts is not hidden, the method simply returns the `fromVisualIndex` number.
   * @param {number} searchDirection The search direction.<br><br>`1`: search from `fromVisualIndex` to the end of the dataset.<br><br>
   * `-1`: search from `fromVisualIndex` to the beginning of the dataset (i.e., to the row or column at visual index `0`).
   * @param {boolean} searchAlsoOtherWayAround `true`: if a search in a first direction failed, try the opposite direction.<br><br>
   * `false`: search in one direction only.
   *
   * @returns {number|null} A visual index of a row or column, or `null`.
   */
  getNearestNotHiddenIndex(fromVisualIndex, searchDirection, searchAlsoOtherWayAround = false) {
    const physicalIndex = this.getPhysicalFromVisualIndex(fromVisualIndex);

    if (physicalIndex === null) {
      return null;
    }

    if (this.fromVisualToRenderableIndexesCache.has(fromVisualIndex)) {
      return fromVisualIndex;
    }

    const visibleIndexes = Array.from(this.fromVisualToRenderableIndexesCache.keys());
    let index = -1;

    if (searchDirection > 0) {
      index = visibleIndexes.findIndex(visualIndex => visualIndex > fromVisualIndex);
    } else {
      index = visibleIndexes.reverse().findIndex(visualIndex => visualIndex < fromVisualIndex);
    }

    if (index === -1) {
      if (searchAlsoOtherWayAround) {
        return this.getNearestNotHiddenIndex(fromVisualIndex, -searchDirection, false);
      }

      return null;
    }

    return visibleIndexes[index];
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
    this.indexesChangeSource = 'init';
    this.indexesSequence.init(length);
    this.indexesChangeSource = undefined;
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
   * Trim/extend the mappers to fit the desired length.
   *
   * @param {number} length New mapper length.
   */
  fitToLength(length) {
    const currentIndexCount = this.getNumberOfIndexes();

    if (length < currentIndexCount) {
      const indexesToBeRemoved = [
        ...Array(this.getNumberOfIndexes() - length).keys()
      ].map(i => i + length);

      this.removeIndexes(indexesToBeRemoved);

    } else {
      this.insertIndexes(currentIndexCount, length - currentIndexCount);
    }
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
    if (this.indexesChangeSource === undefined) {
      this.indexesChangeSource = 'update';
    }

    this.indexesSequence.setValues(indexes);

    if (this.indexesChangeSource === 'update') {
      this.indexesChangeSource = undefined;
    }
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

    // Removing moved indexes without re-indexing.
    const notMovedIndexes = getListWithRemovedItems(this.getIndexesSequence(), physicalMovedIndexes);
    const notTrimmedNotMovedItems = notMovedIndexes.filter(index => this.isTrimmed(index) === false);

    // When item(s) are moved after the last visible item we assign the last possible index.
    let destinationPosition = notMovedIndexes.indexOf(notTrimmedNotMovedItems[notTrimmedNotMovedItems.length - 1]) + 1;

    // Otherwise, we find proper index for inserted item(s).
    if (finalIndex + movedIndexesLength < notTrimmedIndexesLength) {
      // Physical index at final index position.
      const physicalIndex = notTrimmedNotMovedItems[finalIndex];

      destinationPosition = notMovedIndexes.indexOf(physicalIndex);
    }

    this.indexesChangeSource = 'move';

    // Adding indexes without re-indexing.
    this.setIndexesSequence(getListWithInsertedItems(notMovedIndexes, destinationPosition, physicalMovedIndexes));

    this.indexesChangeSource = undefined;
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
    this.indexesChangeSource = 'insert';
    this.indexesSequence.insert(insertionIndex, insertedIndexes);
    this.indexesChangeSource = undefined;
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
    this.indexesChangeSource = 'remove';
    this.indexesSequence.remove(removedIndexes);
    this.indexesChangeSource = undefined;
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
      this.cacheFromVisualToRenderableIndexes();

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
  cacheFromVisualToRenderableIndexes() {
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
