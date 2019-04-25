import { arrayFilter, arrayMap, arrayReduce, pivot } from './../helpers/array';
import IndexMap from './maps/indexMap';
import MapCollection from './mapCollection';

class IndexMapper {
  constructor() {
    this.indexesSequence = new IndexMap();
    this.skipCollection = new MapCollection();
    this.variousMappingsCollection = new MapCollection();

    this.notSkippedIndexesCache = null;
    this.skippedIndexesCache = null;

    this.skipCollection.addLocalHook('collectionChanged', () => this.updateCache());
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
    this.indexesSequence.init(length);
    this.skipCollection.initToLength(length);
    this.variousMappingsCollection.initToLength(length);

    this.updateCache();
  }

  /**
   * Get all indexes sequence.
   *
   * @returns {Array}
   */
  getIndexesSequence() {
    return this.indexesSequence.getValues();
  }

  /**
   * Set completely new indexes sequence.
   *
   * @param {Array} indexes Physical row indexes.
   */
  setIndexesSequence(indexes) {
    this.indexesSequence.setValues(indexes);

    this.updateCache();
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
   * @param {Number} finalIndex Visual row index being a start index for the moved rows.
   */
  moveIndexes(movedIndexes, finalIndex) {
    if (typeof movedIndexes === 'number') {
      movedIndexes = [movedIndexes];
    }

    const physicalMovedIndexes = arrayMap(movedIndexes, row => this.getPhysicalIndex(row));
    const sequenceOfIndexes = this.indexesSequence;

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

    this.updateCache();
  }

  /**
   * Get all indexes skipped in the process of rendering.
   *
   * @private
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
   * @private
   * @param {Number} physicalIndex Physical index.
   * @returns {Boolean}
   */
  isSkipped(physicalIndex) {
    return this.getSkippedIndexes().includes(physicalIndex);
  }

  /**
   * Insert new indexes and corresponding mapping and update values of the previous ones.
   *
   * @private
   * @param {Number} firstInsertedVisualIndex First inserted visual index.
   * @param {Number} firstInsertedPhysicalIndex First inserted physical index.
   * @param {Number} amountOfIndexes Amount of inserted indexes.
   */
  insertIndexes(firstInsertedVisualIndex, firstInsertedPhysicalIndex, amountOfIndexes) {
    const nthVisibleIndex = this.getNotSkippedIndexes()[firstInsertedVisualIndex];
    const insertionIndex = this.getIndexesSequence().includes(nthVisibleIndex) ? this.getIndexesSequence().indexOf(nthVisibleIndex) : this.getNumberOfIndexes();
    const insertedIndexes = arrayMap(new Array(amountOfIndexes).fill(firstInsertedPhysicalIndex), (nextIndex, stepsFromStart) => nextIndex + stepsFromStart);

    this.indexesSequence.addValueAndReorganize(insertionIndex, insertedIndexes);
    this.skipCollection.addIndexes(insertionIndex, insertedIndexes);
    this.variousMappingsCollection.addIndexes(insertionIndex, insertedIndexes);

    this.updateCache();
  }

  /**
   * Remove some indexes and corresponding mappings and update values of the previous ones.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  removeIndexes(removedIndexes) {
    this.indexesSequence.removeValuesAndReorganize(removedIndexes);
    this.skipCollection.removeIndexes(removedIndexes);
    this.variousMappingsCollection.removeIndexes(removedIndexes);

    this.updateCache();
  }

  /**
   * Rebuild cache for all indexes.
   *
   * @private
   */
  updateCache() {
    this.skippedIndexesCache = this.getSkippedIndexes(false);
    this.notSkippedIndexesCache = this.getNotSkippedIndexes(false);
  }
}

export default IndexMapper;
