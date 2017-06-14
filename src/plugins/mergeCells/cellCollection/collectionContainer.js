import Collection from './collection';
import {CellCoords, CellRange} from './../../../3rdparty/walkontable/src';

/**
 * Defines a container object for the collections of merged cells.
 *
 * @class CollectionContainer
 * @plugin MergeCells
 */
class CollectionContainer {
  constructor(hotInstance) {
    /**
     * Array of merged collections.
     *
     * @type {Array}
     */
    this.collections = [];
    /**
     * The Handsontable instance.
     *
     * @type {Handsontable}
     */
    this.hot = hotInstance;
  }

  /**
   * Get a collection from the container, based on the provided arguments. You can provide either the "starting coordinates"
   * of a collection, or any coordinates from the body of the merged collection.
   *
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @returns {Collection|Boolean} Returns a wanted collection on success and `false` on failure.
   */
  get(row, column) {
    const collections = this.collections;

    for (let i = 0, ilen = collections.length; i < ilen; i++) {
      const collection = collections[i];

      if (collection.row <= row && collection.row + collection.rowspan - 1 >= row &&
        collection.col <= column && collection.col + collection.colspan - 1 >= column) {
        return collection;
      }
    }

    return false;
  }

  /**
   * Get a merged collection containing the provided range.
   *
   * @param {CellRange|Object} range The range to search collections for.
   * @return {Collection|Boolean}
   */
  getByRange(range) {
    const collections = this.collections;

    for (let i = 0, ilen = collections.length; i < ilen; i++) {
      const collection = collections[i];

      if (collection.row <= range.from.row && collection.row + collection.rowspan - 1 >= range.to.row &&
        collection.col <= range.from.col && collection.col + collection.colspan - 1 >= range.to.col) {
        return collection;
      }
    }

    return false;
  }

  /**
   * Get a merged collection contained in the provided range.
   *
   * @param {CellRange|Object} range The range to search collections in.
   * @param [countPartials=false] If set to `true`, all the collections overlapping the range will be taken into calculation.
   * @return {*}
   */
  getWithinRange(range, countPartials = false) {
    const collections = this.collections;
    const foundCollections = [];

    if (!range.includesRange) {
      let from = new CellCoords(range.from.row, range.from.col);
      let to = new CellCoords(range.to.row, range.to.col);
      range = new CellRange(from, from, to);
    }

    for (let i = 0, ilen = collections.length; i < ilen; i++) {
      const collection = collections[i];
      let collectionTopLeft = new CellCoords(collection.row, collection.col);
      let collectionBottomRight = new CellCoords(collection.row + collection.rowspan - 1, collection.col + collection.colspan - 1);
      let collectionRange = new CellRange(collectionTopLeft, collectionTopLeft, collectionBottomRight);

      if (countPartials) {
        if (range.overlaps(collectionRange)) {
          foundCollections.push(collection);
        }

      } else if (range.includesRange(collectionRange)) {
        foundCollections.push(collection);
      }
    }

    return foundCollections.length ? foundCollections : false;
  }

  /**
   * Add a merged collection to the container.
   *
   * @param {Object} collectionInfo The collection information object. Has to contain `row`, `col`, `colspan` and `rowspan` properties.
   * @return {*} Returns the new collection of success and `false` on failure.
   */
  add(collectionInfo) {
    const collections = this.collections;
    const row = collectionInfo.row;
    const column = collectionInfo.col;
    const rowspan = collectionInfo.rowspan;
    const colspan = collectionInfo.colspan;

    if (!this.get(row, column)) {
      const newCollection = new Collection(row, column, rowspan, colspan);

      if (this.hot) {
        newCollection.normalize(this.hot);
      }

      collections.push(newCollection);

      return newCollection;
    }

    return false;
  }

  /**
   * Remove a merged collection from the container. You can provide either the "starting coordinates"
   * of a collection, or any coordinates from the body of the merged collection.
   *
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @return {Collection|Boolean} Returns the removed collection on success and `false` on failure.
   */
  remove(row, column) {
    const collections = this.collections;
    const wantedCollection = this.get(row, column);
    const wantedCollectionIndex = wantedCollection ? this.collections.indexOf(wantedCollection) : null;

    if (wantedCollection && wantedCollectionIndex != null) {
      collections.splice(wantedCollectionIndex, 1);
      return wantedCollection;
    }

    return false;
  }

  /**
   * Clear all the merged cell collections.
   */
  clear() {
    this.collections.length = 0;
  }
}

export default CollectionContainer;
