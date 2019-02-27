import { arrayFilter, arrayMap } from './../helpers/array';
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
    const visualIndexes = arrayFilter(this.indexesSequence, physicalIndex => this.skippedIndexes.includes(physicalIndex) === false);
    const length = visualIndexes.length;
    let physicalIndex = null;

    if (visualIndex < length) {
      physicalIndex = visualIndexes[visualIndex];
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
    let visualIndex = null;

    if (!this.skippedIndexes.includes(physicalIndex) && this.indexesSequence.includes(physicalIndex)) {
      visualIndex = this.indexesSequence.indexOf(physicalIndex);
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

  getSkippedIndexes() {
    return this.skippedIndexes;
  }

  setSkippedIndexes(indexes) {
    this.skippedIndexes = indexes;
  }

  updateIndexesAfterInsertion(firstVisualInsertedIndex, firstPhysicalInsertedIndex, amountOfIndexes) {
    const visibleIndexes = this.indexesSequence.filter(index => this.skippedIndexes.includes(index) === false);
    const nthVisibleIndex = visibleIndexes[firstVisualInsertedIndex];
    const insetionIndex = this.indexesSequence.includes(nthVisibleIndex) ? this.indexesSequence.indexOf(nthVisibleIndex) : this.indexesSequence.length;

    this.indexesSequence = this.getIncreasedIndexes(this.indexesSequence, firstPhysicalInsertedIndex, amountOfIndexes);
    this.skippedIndexes = this.getIncreasedIndexes(this.skippedIndexes, firstPhysicalInsertedIndex, amountOfIndexes);

    this.insertIndexes(this.indexesSequence, insetionIndex, new Array(amountOfIndexes)
      .fill(firstPhysicalInsertedIndex).map((nextIndex, stepsFromStart) => nextIndex + stepsFromStart));
  }

  getIncreasedIndexes(indexesList, firstInsertedIndex, amountOfIndexes) {
    return indexesList.map((index) => {
      if (index >= firstInsertedIndex) {
        return index + amountOfIndexes;
      }

      return index;
    });
  }

  insertIndexes(indexesList, firstInsertedIndex, insertedIndexes) {
    indexesList.splice(firstInsertedIndex, 0, ...insertedIndexes);
  }

  updateIndexesAfterRemoval(removedIndexes) {
    this.indexesSequence = this.getRemovedIndexes(this.indexesSequence, removedIndexes);
    this.skippedIndexes = this.getRemovedIndexes(this.skippedIndexes, removedIndexes);
    this.indexesSequence = this.getDecreasedIndexes(this.indexesSequence, removedIndexes);
    this.skippedIndexes = this.getDecreasedIndexes(this.skippedIndexes, removedIndexes);
  }

  getRemovedIndexes(indexesList, removedIndexes) {
    return arrayFilter(indexesList, index => removedIndexes.includes(index) === false);
  }

  getDecreasedIndexes(indexesList, removedIndexes) {
    return arrayMap(indexesList, index => index - removedIndexes.filter(removedRow => removedRow < index).length);
  }
}

export default IndexMapper;
