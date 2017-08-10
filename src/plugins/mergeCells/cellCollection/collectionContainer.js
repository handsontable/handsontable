import Collection from './collection';
import {CellCoords, CellRange} from './../../../3rdparty/walkontable/src';
import {rangeEach} from '../../../helpers/number';
import {arrayEach} from './../../../helpers/array';

/**
 * Defines a container object for the collections of merged cells.
 *
 * @class CollectionContainer
 * @plugin MergeCells
 */
class CollectionContainer {
  constructor(plugin) {
    /**
     * Reference to the Merge Cells plugin.
     *
     * @type {MergeCells}
     */
    this.plugin = plugin;
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
    this.hot = plugin.hot;
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
    let result = false;

    arrayEach(collections, (collection) => {
      if (collection.row <= row && collection.row + collection.rowspan - 1 >= row &&
        collection.col <= column && collection.col + collection.colspan - 1 >= column) {
        result = collection;
        return false;
      }
    });

    return result;
  }

  /**
   * Get a merged collection containing the provided range.
   *
   * @param {CellRange|Object} range The range to search collections for.
   * @return {Collection|Boolean}
   */
  getByRange(range) {
    const collections = this.collections;
    let result = false;

    arrayEach(collections, (collection) => {
      if (collection.row <= range.from.row && collection.row + collection.rowspan - 1 >= range.to.row &&
        collection.col <= range.from.col && collection.col + collection.colspan - 1 >= range.to.col) {
        result = collection;
        return result;
      }
    });

    return result;
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

    arrayEach(collections, (collection) => {
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
    });

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
    const newCollection = new Collection(row, column, rowspan, colspan);

    if (!this.get(row, column) && !this.checkIfOverlaps(newCollection)) {

      if (this.hot) {
        newCollection.normalize(this.hot);
      }

      collections.push(newCollection);

      return newCollection;

    }

    console.warn(`The declared merged cell collection at [${newCollection.row}, ${newCollection.col}] overlaps with the other declared collections. 
    The overlapping collection was not added to the table, please fix your setup.`);

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
    const collections = this.collections;
    const collectionParentsToClear = [];
    const hiddenCollectionElements = [];

    arrayEach(collections, (collection) => {
      collectionParentsToClear.push([this.hot.getCell(collection.row, collection.col), this.get(collection.row, collection.col), collection.row, collection.col]);
    });

    this.collections.length = 0;

    arrayEach(collectionParentsToClear, (collection, i) => {
      rangeEach(0, collection.rowspan - 1, (j) => {
        rangeEach(0, collection.colspan - 1, (k) => {
          if (k !== 0 || j !== 0) {
            hiddenCollectionElements.push([this.hot.getCell(collection.row + j, collection.col + k), null, null, null]);
          }
        });
      });

      collectionParentsToClear[i][1] = null;
    });

    arrayEach(collectionParentsToClear, (collectionParents) => {
      this.plugin.dom.applySpanProperties(...collectionParents);
    });

    arrayEach(hiddenCollectionElements, (hiddenCollectionElement) => {
      this.plugin.dom.applySpanProperties(...hiddenCollectionElement);
    });
  }

  /**
   * Check if the provided collection overlaps with the others in the container.
   *
   * @param {Collection} collection The collection to check against all others in the container.
   */
  checkIfOverlaps(collection) {
    const collectionRange = new CellRange(null, new CellCoords(collection.row, collection.col),
      new CellCoords(collection.row + collection.rowspan - 1, collection.col + collection.colspan - 1));
    let result = false;

    arrayEach(this.collections, (col) => {
      let currentRange = new CellRange(null, new CellCoords(col.row, col.col), new CellCoords(col.row + col.rowspan - 1, col.col + col.colspan - 1));

      if (currentRange.overlaps(collectionRange)) {
        result = true;
        return false;
      }
    });

    return result;
  }

  /**
   * Shift the collection in the direction and by an offset defined in the arguments.
   *
   * @private
   * @param {String} direction `right`, `left`, `up` or `down`.
   * @param {Number} index Index where the change, which caused the shifting took place.
   * @param {Number} count Number of rows/columns added/removed in the preceding action.
   */
  shiftCollections(direction, index, count) {
    const shiftVector = [0, 0];

    switch (direction) {
      case 'right':
        shiftVector[0] += count;

        break;
      case 'left':
        shiftVector[0] -= count;

        break;
      case 'down':
        shiftVector[1] += count;

        break;
      case 'up':
        shiftVector[1] -= count;

        break;
      default:
        break;
    }

    arrayEach(this.collections, (currentMerge) => {
      currentMerge.shift(shiftVector, index);
    });

    arrayEach(this.collections, (currentMerge) => {
      if (currentMerge.removed) {
        this.collections.splice(this.collections.indexOf(currentMerge), 1);
      }
    });
  }
}

export default CollectionContainer;
