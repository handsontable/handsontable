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

  updateIndexesAfterInsertion(firstInsertedIndex, amountOfIndexes) {
    this.indexesSequence = this.getIncreasedIndexes(this.indexesSequence, firstInsertedIndex, amountOfIndexes);
    this.skippedIndexes = this.getIncreasedIndexes(this.skippedIndexes, firstInsertedIndex, amountOfIndexes);
    this.insertIndexes(this.indexesSequence, firstInsertedIndex, amountOfIndexes);
  }

  getIncreasedIndexes(indexesList, firstInsertedIndex, amountOfIndexes) {
    return indexesList.map((index) => {
      if (index >= firstInsertedIndex) {
        return index + amountOfIndexes;
      }

      return index;
    });
  }

  insertIndexes(indexesList, firstInsertedIndex, amountOfIndexes) {
    indexesList.splice(firstInsertedIndex, 0, ...new Array(amountOfIndexes)
      .fill(firstInsertedIndex).map((indexFromList, stepsFromStartIndex) => indexFromList + stepsFromStartIndex));
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
