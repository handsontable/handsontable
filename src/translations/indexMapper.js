import { arrayFilter, arrayMap } from './../helpers/array';
import { getListWithRemovedItems, getListWithInsertedItems } from './indexesElements/utils/indexesSequence';
import { rangeEach } from '../helpers/number';
import IndexesSequence from './indexesElements/indexesSequence';
import TrimmingMap from './indexesElements/maps/trimmingMap';
import HidingMap from './indexesElements/maps/hidingMap';
import IndexedElementsCollection from './indexedElementsCollection';
import localHooks from '../mixins/localHooks';
import { mixin } from '../helpers/object';
import { isDefined } from '../helpers/mixed';

/**
 * Index mapper manages the mappings provided by "smaller" maps called index map(s). Those maps provide links from
 * indexes (physical¹ or visual² depending on requirements) to another value. For example, we may link physical column
 * indexes with widths of columns. On every performed CRUD action such as insert column, move column and remove column
 * the value (column width) will stick to the proper index. The index mapper is used as the centralised source of truth
 * regarding row and column indexes (their sequence, information if they are skipped in the process of rendering,
 * values linked to them). It handles CRUD operations on indexes and translate the visual indexes to the physical
 * indexes and the other way round³. It has built in cache. Thus, this way, read operations are as fast as possible.
 * Cache updates are triggered only when the data or structure changes.
 *
 * ¹ Physical index is particular index from the sequence of indexes assigned to the data source rows / columns
 * (from 0 to n, where n is number of the cells on the axis).
 * ² Visual index is particular index from the sequence of indexes assigned to visible rows / columns
 * (from 0 to n, where n is number of the cells on the axis).
 * ³ It maps from visible row / column to its representation in the data source and the other way round.
 * For example, when we sorted data, our 1st visible row can represent 4th row from the original source data,
 * 2nd can be mapped to 3rd, 3rd to 2nd, etc. (keep in mind that indexes are represent from the zero).
 */
class IndexMapper {
  constructor() {
    /**
     * Map storing the sequence of indexes.
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
     * @type {IndexedElementsCollection}
     */
    this.trimmingMapsCollection = new IndexedElementsCollection();
    /**
     * Collection for different hiding maps. Indexes marked as hidden in any map WILL be included in the {@link DataMap},
     * but won't be rendered.
     *
     * @private
     * @type {IndexedElementsCollection}
     */
    this.hidingMapsCollection = new IndexedElementsCollection();
    /**
     * Collection for another kind of indexed elements. There are stored mappings from indexes to values or just
     * indexes sequences.
     *
     * @private
     * @type {IndexedElementsCollection}
     */
    this.variousIndexedElementsCollection = new IndexedElementsCollection();
    /**
     * Cache for trimming result for particular physical indexes.
     *
     * @private
     * @type {Array}
     */
    this.flattenTrimmingResult = [];
    /**
     * Cache for list of not trimmed indexes, respecting the indexes sequence (physical indexes).
     *
     * @private
     * @type {Array}
     */
    this.notTrimmedIndexesCache = [];
    /**
     * Cache for hiding result for particular physical indexes.
     *
     * @private
     * @type {Array}
     */
    this.flattenHidingResult = [];
    /**
     * Cache for list of not hidden indexes, respecting the indexes sequence (physical indexes).
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

    this.variousIndexedElementsCollection.addLocalHook('change', (changedMap) => {
      this.runLocalHooks('change', changedMap, this.variousIndexedElementsCollection);
    });
  }

  /**
   * Execute batch operations with updating cache when necessary. As effect, wrapped operations will be executed and
   * cache will be updated at most once (cache is updated only when any cached index has been changed).
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
   * Register indexed element which provide some index mappings or indexes sequence. Type of the element determining
   * to which collection it will be added.
   *
   * @param {string} uniqueName Name of the indexed element. It should be unique.
   * @param {IndexedElement} indexedElement Registered indexed element. It may be map which provide mappings from index
   * to value or just indexes sequence. It is updated on items removal and insertion.
   * @returns {IndexedElement} Already registered indexed element.
   */
  registerIndexedElement(uniqueName, indexedElement) {
    if (this.trimmingMapsCollection.get(uniqueName) || this.hidingMapsCollection.get(uniqueName)
      || this.variousIndexedElementsCollection.get(uniqueName)) {
      throw Error(`Indexed element with name "${uniqueName}" has been already registered.`);
    }

    if (indexedElement instanceof TrimmingMap) {
      this.trimmingMapsCollection.register(uniqueName, indexedElement);

    } else if (indexedElement instanceof HidingMap) {
      this.hidingMapsCollection.register(uniqueName, indexedElement);

    } else {
      this.variousIndexedElementsCollection.register(uniqueName, indexedElement);
    }

    const numberOfIndexes = this.getNumberOfIndexes();
    /*
      We initialize indexed element ony when we have full information about number of indexes and the dataset is not empty.
      Otherwise it's unnecessary. Initialization of empty array would not give any positive changes. After initializing
      it with number of indexes equal to 0 the element would be still empty. What's more there would be triggered
      not needed hook (no real change have occurred). Number of indexes is known after loading data (the `loadData`
      function from the `Core`).
     */
    if (numberOfIndexes > 0) {
      indexedElement.init(numberOfIndexes);
    }

    return indexedElement;
  }

  /**
   * Unregister an indexed element with given name.
   *
   * @param {string} name Name of the indexed element.
   */
  unregisterIndexedElement(name) {
    this.trimmingMapsCollection.unregister(name);
    this.hidingMapsCollection.unregister(name);
    this.variousIndexedElementsCollection.unregister(name);
  }

  /**
   * Get a physical index corresponding to the given visual index.
   *
   * @param {number} visualIndex Visual index.
   * @returns {number|null} Returns translated index mapped by passed visual index.
   */
  getPhysicalFromVisualIndex(visualIndex) {
    const visibleIndexes = this.getNotTrimmedIndexes();
    const numberOfVisibleIndexes = visibleIndexes.length;
    let physicalIndex = null;

    if (visualIndex < numberOfVisibleIndexes) {
      physicalIndex = visibleIndexes[visualIndex];
    }

    return physicalIndex;
  }

  /**
   * Get a physical index corresponding to the given renderable index.
   *
   * @param {number} renderableIndex Renderable index.
   * @returns {null|number}
   */
  getPhysicalFromRenderableIndex(renderableIndex) {
    const renderablePhysicalIndexes = this.getRenderablePhysicalIndexes();
    const numberOfVisibleIndexes = renderablePhysicalIndexes.length;
    let physicalIndex = null;

    if (renderableIndex < numberOfVisibleIndexes) {
      physicalIndex = renderablePhysicalIndexes[renderableIndex];
    }

    return physicalIndex;
  }

  /**
   * Get a visual index corresponding to the given physical index.
   *
   * @param {number} physicalIndex Physical index to search.
   * @returns {number|null} Returns a visual index of the index mapper.
   */
  getVisualFromPhysicalIndex(physicalIndex) {
    const visibleIndexes = this.getNotTrimmedIndexes();
    const visualIndex = visibleIndexes.indexOf(physicalIndex);

    if (visualIndex !== -1) {
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
    if (visualIndex >= this.getNotTrimmedIndexesLength()) {
      return null;
    }

    const physicalIndex = this.getPhysicalFromVisualIndex(visualIndex);

    if (this.isHidden(physicalIndex)) {
      return null;
    }

    const notTrimmedIndexes = this.getNotTrimmedIndexes(); // Mappings from visual to physical indexes.
    const isHiddenForVisualIndexes = notTrimmedIndexes.map(
      physicalIndexForVisualIndex => this.isHidden(physicalIndexForVisualIndex));

    return visualIndex - isHiddenForVisualIndexes.slice(0, visualIndex + 1).filter(isHidden => isHidden).length;
  }

  /**
   * Search for the first visible, not hidden index (represented by a visual index).
   *
   * @param {number} fromVisualIndex Start index. Starting point for finding destination index. Start point may be destination
   * point when handled index is NOT hidden.
   * @param {number} incrementBy We are searching for a next visible indexes by increasing (to be precise, or decreasing) indexes.
   * This variable represent indexes shift. We are looking for an index:
   * - for rows: from the left to the right (increasing indexes, then variable should have value 1) or
   * other way around (decreasing indexes, then variable should have the value -1)
   * - for columns: from the top to the bottom (increasing indexes, then variable should have value 1)
   * or other way around (decreasing indexes, then variable should have the value -1).
   * @returns {number|null} Visual column index or `null`.
   */
  getFirstNotHiddenIndex(fromVisualIndex, incrementBy) {
    const physicalIndex = this.getPhysicalFromVisualIndex(fromVisualIndex);

    if (physicalIndex === null) {
      return null;
    }

    if (this.isHidden(physicalIndex) === false) {
      return fromVisualIndex;
    }

    return this.getFirstNotHiddenIndex(fromVisualIndex + incrementBy, incrementBy);
  }

  /**
   * Set default values for all indexes in registered index maps.
   *
   * @param {number} [length] Destination length for all stored index maps.
   */
  initToLength(length = this.getNumberOfIndexes()) {
    this.flattenTrimmingResult = [];
    this.notTrimmedIndexesCache = [...new Array(length).keys()];
    this.flattenHidingResult = [];
    this.notHiddenIndexesCache = [...new Array(length).keys()];

    this.executeBatchOperations(() => {
      this.indexesSequence.init(length);
      this.trimmingMapsCollection.initEvery(length);
    });

    // We move initialization of hidden collection to next batch for purpose of working on sequence of already trimmed indexes.
    this.executeBatchOperations(() => {
      this.hidingMapsCollection.initEvery(length);

      // It shouldn't reset the cache.
      this.variousIndexedElementsCollection.initEvery(length);
    });

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

    return arrayFilter(this.getIndexesSequence(), index => this.isTrimmed(index) === false);
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
   * @returns {Array} List of physical indexes. Index of this native array is a "visual index",
   * value of this native array is a "physical index".
   */
  getNotHiddenIndexes(readFromCache = true) {
    if (readFromCache === true) {
      return this.notHiddenIndexesCache;
    }

    return arrayFilter(this.getIndexesSequence(), index => this.isHidden(index) === false);
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
    return this.getFlattenTrimmingResult()[physicalIndex] || false;
  }

  /**
   * Get whether index is hidden. Index marked as hidden is included in a {@link DataMap}, but isn't rendered.
   *
   * @param {number} physicalIndex Physical index.
   * @returns {boolean}
   */
  isHidden(physicalIndex) {
    return this.getFlattenHidingResult()[physicalIndex] || false;
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
    const insertionIndex = this.getIndexesSequence().includes(nthVisibleIndex) ? this.getIndexesSequence().indexOf(nthVisibleIndex) : this.getNumberOfIndexes();
    const insertedIndexes = arrayMap(new Array(amountOfIndexes).fill(firstInsertedPhysicalIndex), (nextIndex, stepsFromStart) => nextIndex + stepsFromStart);

    this.executeBatchOperations(() => {
      this.indexesSequence.insert(insertionIndex, insertedIndexes);
      this.trimmingMapsCollection.insertToEvery(insertionIndex, insertedIndexes);
      this.hidingMapsCollection.insertToEvery(insertionIndex, insertedIndexes);
      this.variousIndexedElementsCollection.insertToEvery(insertionIndex, insertedIndexes);
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
      this.trimmingMapsCollection.removeFromEvery(removedIndexes);
      this.hidingMapsCollection.removeFromEvery(removedIndexes);
      this.variousIndexedElementsCollection.removeFromEvery(removedIndexes);
    });
  }

  /**
   * Rebuild cache for some indexes. Every action on indexes sequence or indexes skipped in the process of rendering
   * by default reset cache, thus batching some index maps actions is recommended.
   *
   * @private
   * @param {boolean} [force=false] Determine if force cache update.
   */
  updateCache(force = false) {
    const anyCachedIndexChanged = this.indexesSequenceChanged || this.trimmedIndexesChanged || this.hiddenIndexesChanged;

    if (force === true || (this.isBatched === false && anyCachedIndexChanged === true)) {
      this.flattenTrimmingResult = this.getFlattenTrimmingResult(false);
      this.flattenHidingResult = this.getFlattenHidingResult(false);
      this.notTrimmedIndexesCache = this.getNotTrimmedIndexes(false);
      this.notHiddenIndexesCache = this.getNotHiddenIndexes(false);
      this.renderablePhysicalIndexesCache = this.getRenderablePhysicalIndexes(false);

      this.runLocalHooks('cacheUpdated', this.indexesSequenceChanged, this.trimmedIndexesChanged, this.hiddenIndexesChanged);

      this.indexesSequenceChanged = false;
      this.trimmedIndexesChanged = false;
      this.hiddenIndexesChanged = false;
    }
  }

  /**
   * Get flat list of values, which are result whether index has been hidden in any registered trimming maps.
   *
   * @private
   * @param {boolean} [readFromCache=true] Determine if read indexes from cache.
   * @returns {Array}
   */
  getFlattenTrimmingResult(readFromCache = true) {
    if (readFromCache === true) {
      return this.flattenTrimmingResult;
    }

    if (this.trimmingMapsCollection.getLength() === 0) {
      return [];
    }

    const result = [];
    // Below variable stores results of trimming (boolean values) for every particular trimming map.
    // [
    //   [true, true, true], // first trimming map
    //   [false, true, true] // second trimming map
    // ]
    const allTrimmingValues = arrayMap(this.trimmingMapsCollection.get(), trimmingMap => trimmingMap.getValues());

    rangeEach(this.indexesSequence.getLength() - 1, (physicalIndex) => {
      result[physicalIndex] = allTrimmingValues.some(nextTrimmingValues => nextTrimmingValues[physicalIndex]);
    });

    return result;
  }

  /**
   * Get flat list of values, which are result whether index has been hidden in any registered hiding maps.
   *
   * @private
   * @param {boolean} [readFromCache=true] Determine if read indexes from cache.
   * @returns {Array}
   */
  getFlattenHidingResult(readFromCache = true) {
    if (readFromCache === true) {
      return this.flattenHidingResult;
    }

    if (this.hidingMapsCollection.getLength() === 0) {
      return [];
    }

    const result = [];
    // Below variable stores results of hiding (boolean values) for every particular hiding map.
    // [
    //   [true, true, true], // first trimming map
    //   [false, true, true] // second trimming map
    // ]
    const allHidingValues = arrayMap(this.hidingMapsCollection.get(), list => list.getValues());

    rangeEach(this.indexesSequence.getLength() - 1, (physicalIndex) => {
      result[physicalIndex] = allHidingValues.some(nextHidingValues => nextHidingValues[physicalIndex]);
    });

    return result;
  }

  /**
   * Get list of physical indexes (respecting the sequence of indexes) which may be rendered (when they are in a viewport).
   *
   * @private
   * @param {boolean} [readFromCache=true] Determine if read indexes from cache.
   * @returns {Array}
   */
  getRenderablePhysicalIndexes(readFromCache = true) {
    if (readFromCache === true) {
      return this.renderablePhysicalIndexesCache;
    }

    return arrayFilter(this.getNotTrimmedIndexes(), (physicalIndex) => {
      return this.isHidden(physicalIndex) === false;
    });
  }
}

mixin(IndexMapper, localHooks);

export default IndexMapper;
