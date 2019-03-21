import { arrayFilter, arrayMap, arrayReduce } from './../helpers/array';

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
  createIndexesSequence(length = this.getNumberOfIndexes()) {
    this.setIndexesSequence(new Array(length).fill(0).map((nextIndex, stepsFromStart) => nextIndex + stepsFromStart));
  }

  /**
   * Get all indexes sequence.
   *
   * @returns {Array}
   */
  getIndexesSequence() {
    return this.indexesSequence.slice();
  }

  /**
   * Set completely new indexes sequence.
   *
   * @param {Array} indexes Physical row indexes.
   */
  setIndexesSequence(indexes) {
    this.indexesSequence = indexes.slice();
  }

  /**
   * Get all indexes skipped in the process of rendering.
   *
   * @returns {Array}
   */
  getSkippedIndexes() {
    return this.skippedIndexes.slice();
  }

  /**
   * Set completely new list of indexes skipped in the process of rendering.
   *
   * @param {Array} indexes Physical row indexes.
   */
  setSkippedIndexes(indexes) {
    this.skippedIndexes = indexes.slice();
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
   * Clear all skipped indexes.
   */
  clearSkippedIndexes() {
    this.skippedIndexes.length = 0;
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
   * Fill index mapper to the new length.
   *
   * @private
   * @param {Number} newLength New length for the index mapper.
   */
  fillTo(newLength) {
    const numberOfIndexes = this.getNumberOfIndexes();

    if (numberOfIndexes < newLength) {
      this.insertIndexes(this.getIndexesSequence(), numberOfIndexes, new Array(newLength - numberOfIndexes).fill(
        numberOfIndexes).map((nextIndex, stepsFromStart) => nextIndex + stepsFromStart));
    }
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
    const nthVisibleIndex = this.getNthNotSkippedIndex(firstInsertedVisualIndex);
    const insertionIndex = this.getIndexesSequence().includes(nthVisibleIndex) ? this.getIndexesSequence().indexOf(nthVisibleIndex) : this.getNumberOfIndexes();

    this.setIndexesSequence(this.getIncreasedIndexes(this.getIndexesSequence(), firstInsertedPhysicalIndex, amountOfIndexes));
    this.setIndexesSequence(this.getListWithInsertedIndexes(this.getIndexesSequence(), insertionIndex, new Array(amountOfIndexes)
      .fill(firstInsertedPhysicalIndex).map((nextIndex, stepsFromStart) => nextIndex + stepsFromStart)));
    this.setSkippedIndexes(this.getIncreasedIndexes(this.getSkippedIndexes(), firstInsertedPhysicalIndex, amountOfIndexes));
  }

  /**
   * Get transformed list of indexes after insertion.
   *
   * @private
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
   * Get list with new indexes added to list.
   *
   * @private
   * @param {Array} indexesList List of indexes.
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  getListWithInsertedIndexes(indexesList, insertionIndex, insertedIndexes) {
    return [...indexesList.slice(0, insertionIndex), ...insertedIndexes, ...indexesList.slice(insertionIndex)];
  }

  /**
   * Update indexes after removing some indexes.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  updateIndexesAfterRemoval(removedIndexes) {
    this.setIndexesSequence(this.getFilteredIndexes(this.getIndexesSequence(), removedIndexes));
    this.setIndexesSequence(this.getDecreasedIndexes(this.getIndexesSequence(), removedIndexes));
    this.setSkippedIndexes(this.getFilteredIndexes(this.getSkippedIndexes(), removedIndexes));
    this.setSkippedIndexes(this.getDecreasedIndexes(this.getSkippedIndexes(), removedIndexes));
  }

  /**
   * Get filtered list of indexes.
   *
   * @private
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
   * @private
   * @param {Array} indexesList List of indexes.
   * @param removedIndexes List of removed indexes.
   * @returns {Array}
   */
  getDecreasedIndexes(indexesList, removedIndexes) {
    return arrayMap(indexesList, index => index - removedIndexes.filter(removedRow => removedRow < index).length);
  }
}

export default IndexMapper;
