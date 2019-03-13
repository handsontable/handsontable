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
    const visibleIndexes = arrayFilter(this.indexesSequence, index => this.skippedIndexes.includes(index) === false);
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
    const visibleIndexes = arrayFilter(this.indexesSequence, index => this.skippedIndexes.includes(index) === false);
    let visualIndex = null;

    if (!this.skippedIndexes.includes(physicalIndex) && this.indexesSequence.includes(physicalIndex)) {
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

  getSkippedIndexes() {
    return this.skippedIndexes;
  }

  setSkippedIndexes(indexes) {
    this.skippedIndexes = indexes;
  }

  fillTo(lastIndex) {
    const numberOfIndexes = this.indexesSequence.length;

    if (numberOfIndexes < lastIndex) {
      this.updateIndexesAfterInsertion(numberOfIndexes, numberOfIndexes, lastIndex - numberOfIndexes);
    }
  }

  updateIndexesAfterInsertion(firstVisualInsertedIndex, firstPhysicalInsertedIndex, amountOfIndexes) {
    const visibleIndexes = arrayFilter(this.indexesSequence, index => this.skippedIndexes.includes(index) === false);
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

    this.indexesSequence = this.getRemovedIndexes(this.indexesSequence, physicalMovedIndexes);

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
