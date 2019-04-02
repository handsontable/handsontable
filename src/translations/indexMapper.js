import { arrayFilter, arrayMap, arrayReduce } from './../helpers/array';
import IndexesList from './indexesList';

const INDEXES_SEQUENCE_KEY = 'sequence';
const SKIPPED_INDEXES_KEY = 'skipped';

class IndexMapper {
  constructor() {
    this.indexesLists = new Map([
      [INDEXES_SEQUENCE_KEY, new IndexesList(0)],
      [SKIPPED_INDEXES_KEY, new IndexesList(false)],
    ]);
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
   * Register custom indexes list.
   *
   * @param {String} name Unique name of the indexes list.
   * @param {*} initValue Initial value for the list.
   * @param {Function} initFn Initial function for all elements of the list.
   * @returns {IndexesList}
   */
  registerIndexesList(name, initValue, initFn) {
    if (this.indexesLists.has(name) === false) {
      this.indexesLists.set(name, new IndexesList(initValue, initFn));
    }

    return this.indexesLists.get(name);
  }

  /**
   * Get indexes list by it's name.
   *
   * @param {String} name Name of the indexes list.
   * @returns {IndexesList}
   */
  getIndexesList(name) {
    return this.indexesLists.get(name);
  }

  /**
   * Reset current index map and create new one.
   *
   * @param {Number} [length] Custom generated map length.
   */
  createIndexesSequence(length = this.getNumberOfIndexes()) {
    this.indexesLists.forEach((listOfIndexes) => {
      if (listOfIndexes.getLength() === 0) {
        listOfIndexes.init(length);
      }
    });
  }

  /**
   * Get all indexes sequence.
   *
   * @returns {Array}
   */
  getIndexesSequence() {
    return this.indexesLists.get(INDEXES_SEQUENCE_KEY).getIndexes();
  }

  /**
   * Set completely new indexes sequence.
   *
   * @param {Array} indexes Physical row indexes.
   */
  setIndexesSequence(indexes) {
    return this.indexesLists.get(INDEXES_SEQUENCE_KEY).setIndexes(indexes);
  }

  /**
   * Get all indexes skipped in the process of rendering.
   *
   * @returns {Array}
   */
  getSkippedIndexes() {
    return this.indexesLists.get(SKIPPED_INDEXES_KEY).getIndexes().reduce((accu, skipped, index) => {
      if (skipped === true) {
        return accu.concat(index);
      }

      return accu;
    }, []);
  }

  /**
   * Set completely new list of indexes skipped in the process of rendering.
   *
   * @param {Array} indexes Physical row indexes.
   */
  setSkippedIndexes(indexes) {
    let indexesSequence = this.getIndexesSequence();

    if (indexesSequence.length === 0) {
      const theHighestIndex = Math.max(...indexes);
      const tmpIndexesList = new IndexesList(0).init(theHighestIndex + 1);

      indexesSequence = tmpIndexesList.getIndexes();
    }

    const skippedIndexes = arrayMap(indexesSequence, index => indexes.includes(index));

    this.indexesLists.get(SKIPPED_INDEXES_KEY).setIndexes(skippedIndexes);
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
  clearSkippedIndexes() {
    this.setSkippedIndexes([]);
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
    const sequenceOfIndexes = this.indexesLists.get(INDEXES_SEQUENCE_KEY);

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

    Array.from(this.indexesLists).forEach(([key, list]) => {
      if (key === SKIPPED_INDEXES_KEY) {
        list.increaseIndexes(insertionIndex, insertedIndexes);

      } else {
        list.addIndexesAndReorganize(insertionIndex, insertedIndexes);
      }
    });
  }

  /**
   * Update indexes after removing some indexes.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  updateIndexesAfterRemoval(removedIndexes) {
    this.indexesLists.forEach((list) => {
      list.removeIndexesAndReorganize(removedIndexes);
    });
  }
}

export default IndexMapper;
