import { arrayFilter, arrayMap, arrayReduce, pivot } from './../helpers/array';
import { isDefined } from './../helpers/mixed';
import IndexMap from './maps/indexMap';
import MapCollection from './mapCollection';

const INDEXES_SEQUENCE_KEY = 'sequence';

class IndexMapper {
  constructor() {
    this.indexToIndexCollection = new MapCollection([
      [INDEXES_SEQUENCE_KEY, new IndexMap()],
    ]);

    this.skipCollection = new MapCollection();
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
    return this.indexToIndexCollection.get(INDEXES_SEQUENCE_KEY).setValues(indexes);
  }

  /**
   * Get all indexes skipped in the process of rendering.
   *
   * @returns {Array}
   */
  getSkippedIndexes(skipMap) {
    let skipResults;

    if (isDefined(skipMap)) {
      skipResults = skipMap.getValues();

    } else {
      /**
         Array of arrays in form:
         [
           [ skip0_boolean(index: 0), skip0_boolean(index: 1), ..., skip0_boolean(index: n)],
           [ skip1_boolean(index: 0), skip1_boolean(index: 1), ..., skip1_boolean(index: n)],
           ...
         ]
       */
      const particularSkipsLists = arrayMap(this.skipCollection.get(), map => map.getValues());
      /**
         Array of arrays in form:
         [
           [ skip0_boolean(index: 0), skip1_boolean(index: 0), ..., skipn_boolean(index: 0)],
           [ skip0_boolean(index: 1), skip1_boolean(index: 1), ..., skipn_boolean(index: 1)],
           ...
         ]

         where: `skip0`, `skip1` are particular types of skipped indexes i.e. skipped indexes by the `TrimRows` or by the `Filters` plugin.
       */
      const skipBooleansForIndex = pivot(particularSkipsLists);
      skipResults = arrayReduce(skipBooleansForIndex,
        (accumulator, skipIndexesAtIndex) => accumulator.concat(skipIndexesAtIndex.some(value => value === true)), []);
    }

    return arrayReduce(skipResults, (skippedIndexes, isSkipped, index) => {
      if (isSkipped === true) {
        return skippedIndexes.concat(index);
      }

      return skippedIndexes;
    }, []);
  }

  /**
   * Set completely new list of indexes skipped in the process of rendering.
   *
   * @param {ValueMap} skipMap Skip map.
   * @param {Array} indexes Physical row indexes.
   */
  setSkippedIndexes(skipMap, indexes) {
    const skippedIndexes = arrayMap(this.getIndexesSequence(), index => indexes.includes(index));

    skipMap.setValues(skippedIndexes);
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
   * Clear all skipped indexes.
   */
  clearSkippedIndexes(skipMap) {
    this.setSkippedIndexes(skipMap, []);
  }

  /**
   * Get all indexes NOT skipped in the process of rendering.
   *
   * @returns {Array}
   */
  getNotSkippedIndexes() {
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
  }
}

export default IndexMapper;
