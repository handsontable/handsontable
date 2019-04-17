import { arrayFilter, arrayMap, arrayReduce, pivot } from './../helpers/array';
import IndexMap from './maps/indexMap';
import MapCollection from './mapCollection';

const INDEXES_SEQUENCE_KEY = 'sequence';

class IndexMapper {
  constructor() {
    this.indexToIndexCollection = new MapCollection([
      [INDEXES_SEQUENCE_KEY, new IndexMap()],
    ]);

    this.skipCollection = new MapCollection([], () => this.rebuildCache());
    this.notSkippedIndexesCache = null;
    this.skippedIndexesCache = null;
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
    let visualIndex = null;

    if (!this.isSkipped(physicalIndex) && this.getIndexesSequence().includes(physicalIndex)) {
      visualIndex = visibleIndexes.indexOf(physicalIndex);
    }

    return visualIndex;
  }

  /**
   * Reset current index map and create new one.
   *
   * @param {Number} [length] Custom generated map length.
   */
  initToLength(length = this.getNumberOfIndexes()) {
    this.indexToIndexCollection.initToLength(length);
    this.skipCollection.initToLength(length);

    this.rebuildCache();
  }

  /**
   * Get all indexes sequence.
   *
   * @returns {Array}
   */
  getIndexesSequence() {
    return this.indexToIndexCollection.get(INDEXES_SEQUENCE_KEY).getValues();
  }

  /**
   * Set completely new indexes sequence.
   *
   * @param {Array} indexes Physical row indexes.
   */
  setIndexesSequence(indexes) {
    this.indexToIndexCollection.get(INDEXES_SEQUENCE_KEY).setValues(indexes);

    this.rebuildNotSkippedIndexesCache();
  }

  /**
   * Get all indexes skipped in the process of rendering.
   *
   * @param {Boolean} [readFromCache=true] Determine if read indexes from cache.
   * @returns {Array}
   */
  getSkippedIndexes(readFromCache = true) {
    if (readFromCache === true) {
      return this.skippedIndexesCache;
    }

    const particularSkipsLists = arrayMap(this.skipCollection.get(), skipList => skipList.getValues());
    const skipBooleansForIndex = pivot(particularSkipsLists);

    return arrayReduce(skipBooleansForIndex, (skippedIndexesResult, skipIndexesAtIndex, physicalIndex) => {
      if (skipIndexesAtIndex.some(isSkipped => isSkipped === true)) {
        return skippedIndexesResult.concat(physicalIndex);
      }

      return skippedIndexesResult;
    }, []);
  }

  /**
   * Get whether index is skipped in the process of rendering.
   *
   * @param {Number} physicalIndex Physical index.
   * @returns {Boolean}
   */
  isSkipped(physicalIndex) {
    return this.getSkippedIndexes().includes(physicalIndex);
  }

  /**
   * Get all indexes NOT skipped in the process of rendering.
   *
   * @param {Boolean} [readFromCache=true] Determine if read indexes from cache.
   * @returns {Array}
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
   * @returns {Array}
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
   * @param {Number} finalIndex Visual row index being a start index for the moved rows.
   */
  moveIndexes(movedIndexes, finalIndex) {
    if (typeof movedIndexes === 'number') {
      movedIndexes = [movedIndexes];
    }

    const physicalMovedIndexes = arrayMap(movedIndexes, row => this.getPhysicalIndex(row));
    const sequenceOfIndexes = this.indexToIndexCollection.get(INDEXES_SEQUENCE_KEY);

    sequenceOfIndexes.filterIndexes(physicalMovedIndexes);

    // When item(s) are moved after the last item we assign new index.
    let indexNumber = this.getNumberOfIndexes();

    // Otherwise, we find proper index for inserted item(s).
    if (finalIndex < this.getNotSkippedIndexesLength()) {
      const physicalIndex = this.getPhysicalIndex(finalIndex);
      indexNumber = this.getIndexesSequence().indexOf(physicalIndex);
    }

    // We count number of skipped rows from the start to the position of inserted item(s).
    const skippedRowsToTargetIndex = arrayReduce(this.getIndexesSequence().slice(0, indexNumber), (skippedRowsSum, currentValue) => {
      if (this.isSkipped(currentValue)) {
        return skippedRowsSum + 1;
      }

      return skippedRowsSum;
    }, 0);

    sequenceOfIndexes.insertIndexes(finalIndex + skippedRowsToTargetIndex, physicalMovedIndexes);
  }

  /**
   * Update indexes after inserting new indexes.
   *
   * @private
   * @param {Number} firstInsertedVisualIndex First inserted visual index.
   * @param {Number} firstInsertedPhysicalIndex First inserted physical index.
   * @param {Number} amountOfIndexes Amount of inserted indexes.
   */
  updateIndexesAfterInsertion(firstInsertedVisualIndex, firstInsertedPhysicalIndex, amountOfIndexes) {
    const nthVisibleIndex = this.getNotSkippedIndexes()[firstInsertedVisualIndex];
    const insertionIndex = this.getIndexesSequence().includes(nthVisibleIndex) ? this.getIndexesSequence().indexOf(nthVisibleIndex) : this.getNumberOfIndexes();
    const insertedIndexes = arrayMap(new Array(amountOfIndexes).fill(firstInsertedPhysicalIndex), (nextIndex, stepsFromStart) => nextIndex + stepsFromStart);

    this.indexToIndexCollection.updateIndexesAfterInsertion(insertionIndex, insertedIndexes);
    this.skipCollection.updateIndexesAfterInsertion(insertionIndex, insertedIndexes);

    this.rebuildCache();
  }

  /**
   * Update indexes after removing some indexes.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  updateIndexesAfterRemoval(removedIndexes) {
    this.indexToIndexCollection.updateIndexesAfterRemoval(removedIndexes);
    this.skipCollection.updateIndexesAfterRemoval(removedIndexes);

    this.rebuildCache();
  }

  /**
   * Rebuild cache for skipped indexes.
   */
  rebuildSkippedIndexesCache() {
    this.skippedIndexesCache = this.getSkippedIndexes(false);
  }

  /**
   * Rebuild cache for not skipped indexes.
   */
  rebuildNotSkippedIndexesCache() {
    this.notSkippedIndexesCache = this.getNotSkippedIndexes(false);
  }

  /**
   * Rebuild cache for all indexes.
   */
  rebuildCache() {
    this.rebuildSkippedIndexesCache();
    this.rebuildNotSkippedIndexesCache();
  }
}

export default IndexMapper;
