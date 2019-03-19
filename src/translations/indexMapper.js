import { arrayFilter, arrayMap, arrayReduce } from './../helpers/array';
import { rangeEach } from './../helpers/number';

class IndexMapper {
  constructor() {
    this.indexesSequence = [];
    this.skippedIndexes = [];
  }

  /**
   * Get physical index by its visual index.
   *
   * @param {Number} visualIndex Visual index.
   * @return {Number|null} Returns translated index mapped by passed visual index.
   */
  getPhysicalIndex(visualIndex) {
    const visibleIndexes = arrayFilter(this.indexesSequence, index => this.isSkipped(index) === false);
    const length = visibleIndexes.length;
    let physicalIndex = null;

    if (visualIndex < length) {
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
    const visibleIndexes = arrayFilter(this.indexesSequence, index => this.isSkipped(index) === false);
    let visualIndex = null;

    if (!this.isSkipped(physicalIndex) && this.has(physicalIndex)) {
      visualIndex = visibleIndexes.indexOf(physicalIndex);
    }

    return visualIndex;
  }

  /**
   * Reset current map array and create new one.
   *
   * @param {Number} [length] Custom generated map length.
   */
  createSimpleSequence(length = this.indexesSequence.length) {
    this.indexesSequence.length = 0;

    rangeEach(length - 1, (itemIndex) => {
      this.indexesSequence[itemIndex] = itemIndex;
    });
  }

  /**
   * Get all indexes sequence.
   *
   * @returns {Array}
   */
  getIndexesSequence() {
    return this.indexesSequence;
  }

  /**
   * Set completely new indexes sequence.
   *
   * @param {Array} Physical row indexes.
   */
  setIndexesSequence(indexes) {
    this.indexesSequence = indexes;
  }

  /**
   * Get whether index mapper contains passed index.
   *
   * @param {Number} physicalIndex Physical index.
   * @returns {Boolean}
   */
  has(physicalIndex) {
    return this.indexesSequence.includes(physicalIndex);
  }

  /**
   * Get all indexes skipped in the process of rendering.
   *
   * @returns {Array}
   */
  getSkippedIndexes() {
    return this.skippedIndexes;
  }

  /**
   * Set completely new list of indexes skipped in the process of rendering.
   *
   * @param {Array} Physical row indexes.
   */
  setSkippedIndexes(indexes) {
    this.skippedIndexes = indexes;
  }

  /**
   * Get whether index is skipped in the process of rendering.
   *
   * @param {Number} physicalIndex Physical index.
   * @returns {Boolean}
   */
  isSkipped(physicalIndex) {
    return this.skippedIndexes.includes(physicalIndex);
  }

  /**
   * Fill index mapper to the new length.
   *
   * @param {Number} newLength New length for the index mapper.
   */
  fillTo(newLength) {
    const numberOfIndexes = this.indexesSequence.length;

    if (numberOfIndexes < newLength) {
      this.insertIndexes(this.getIndexesSequence(), numberOfIndexes, new Array(newLength - numberOfIndexes).fill(
        numberOfIndexes).map((nextIndex, stepsFromStart) => nextIndex + stepsFromStart));
    }
  }

  /**
   * Update indexes after inserting new indexes operation.
   *
   * @param {Number} firstInsertedVisualIndex First inserted visual index.
   * @param {Number} firstInsertedPhysicalIndex First inserted physical index.
   * @param {Number} amountOfIndexes Amount of inserted indexes.
   */
  updateIndexesAfterInsertion(firstInsertedVisualIndex, firstInsertedPhysicalIndex, amountOfIndexes) {
    const visibleIndexes = arrayFilter(this.indexesSequence, index => this.skippedIndexes.includes(index) === false);
    const nthVisibleIndex = visibleIndexes[firstInsertedVisualIndex];
    const insertionIndex = this.indexesSequence.includes(nthVisibleIndex) ? this.indexesSequence.indexOf(nthVisibleIndex) : this.indexesSequence.length;

    this.setIndexesSequence(this.getIncreasedIndexes(this.getIndexesSequence(), firstInsertedPhysicalIndex, amountOfIndexes));
    this.setSkippedIndexes(this.getIncreasedIndexes(this.getSkippedIndexes(), firstInsertedPhysicalIndex, amountOfIndexes));

    this.insertIndexes(this.getIndexesSequence(), insertionIndex, new Array(amountOfIndexes)
      .fill(firstInsertedPhysicalIndex).map((nextIndex, stepsFromStart) => nextIndex + stepsFromStart));
  }

  /**
   * Get transformed list of indexes after insertion.
   *
   * @param {Array} indexesList List of indexes.
   * @param {Number} firstInsertedIndex First inserted index.
   * @param {Number} amountOfIndexes Amount of inserted indexes.
   * @returns {Array}
   */
  getIncreasedIndexes(indexesList, firstInsertedIndex, amountOfIndexes) {
    return indexesList.map((index) => {
      if (index >= firstInsertedIndex) {
        return index + amountOfIndexes;
      }

      return index;
    });
  }

  /**
   * Insert new indexes to list of indexes.
   *
   * @param {Array} indexesList List of indexes.
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insertIndexes(indexesList, insertionIndex, insertedIndexes) {
    indexesList.splice(insertionIndex, 0, ...insertedIndexes);
  }

  /**
   * Update indexes after removing some indexes operation.
   *
   * @param {Array} removedIndexes List of removed indexes.
   */
  updateIndexesAfterRemoval(removedIndexes) {
    this.setIndexesSequence(this.getFilteredIndexes(this.getIndexesSequence(), removedIndexes));
    this.setSkippedIndexes(this.getFilteredIndexes(this.getSkippedIndexes(), removedIndexes));
    this.setIndexesSequence(this.getDecreasedIndexes(this.getIndexesSequence(), removedIndexes));
    this.setSkippedIndexes(this.getDecreasedIndexes(this.getSkippedIndexes(), removedIndexes));
  }

  /**
   * Get filtered list of indexes.
   *
   * @param {Array} indexesList List of indexes.
   * @param {Array} removedIndexes List of removed indexes.
   * @returns {Array}
   */
  getFilteredIndexes(indexesList, removedIndexes) {
    return arrayFilter(indexesList, index => removedIndexes.includes(index) === false);
  }

  /**
   * Get transformed list of indexes after removal.
   *
   * @param {Array} indexesList List of indexes.
   * @param removedIndexes List of removed indexes.
   * @returns {Array}
   */
  getDecreasedIndexes(indexesList, removedIndexes) {
    return arrayMap(indexesList, index => index - removedIndexes.filter(removedRow => removedRow < index).length);
  }

  /**
   * Move indexes in the index mapper.
   *
   * @param {Number|Array} movedIndexes Visual index(es) to move.
   * @param {Number} finalIndex Visual row index being a start index for the moved rows.
   */
  moveItems(movedIndexes, finalIndex) {
    if (typeof movedIndexes === 'number') {
      movedIndexes = [movedIndexes];
    }

    const physicalMovedIndexes = arrayMap(movedIndexes, row => this.getPhysicalIndex(row));

    this.indexesSequence = this.getFilteredIndexes(this.indexesSequence, physicalMovedIndexes);

    const visibleIndexes = arrayFilter(this.indexesSequence, index => this.skippedIndexes.includes(index) === false);

    // When item(s) are moved after the last item we assign new index.
    let indexNumber = this.indexesSequence.length;

    // Otherwise, we find proper index for inserted item(s).
    if (finalIndex < visibleIndexes.length) {
      const physicalIndex = this.getPhysicalIndex(finalIndex);
      indexNumber = this.indexesSequence.indexOf(physicalIndex);
    }

    // We count number of skipped rows from the start to the position of inserted item(s).
    const skippedRowsToTargetIndex = arrayReduce(this.indexesSequence.slice(0, indexNumber), (skippedRowsSum, currentValue) => {
      if (this.skippedIndexes.includes(currentValue)) {
        return skippedRowsSum + 1;
      }
      return skippedRowsSum;
    }, 0);

    this.insertIndexes(this.indexesSequence, finalIndex + skippedRowsToTargetIndex, physicalMovedIndexes);
  }
}

export default IndexMapper;
