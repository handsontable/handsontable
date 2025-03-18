import { assert, isUnsignedNumber, isNullish } from './utils';

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @class LazyFactoryMap
 *
 * The LazyFactoryMap object holds key-value pairs in the structure similar to the
 * regular Map. Once created, items can be moved around a grid depending on the operations
 * performed on that grid - adding or removing rows. The collection requires "key"
 * to be a zero-based index.
 *
 * It's essential to notice that the "key" index under which the item was created
 * is volatile. After altering the grid, the "key" index can change.
 *
 * Having created N items with corresponding example data where the data has 10
 * holes (`undefined` values) within (that's why internal storage index counts from 10).
 * +------+------+------+------+------+.
 * | 0/10 | 1/11 | 2/12 | 3/13 | 4/14 |  Keys (volatile zero-based index / internal storage index)
 * +------+------+------+------+------+.
 *    │      │      │      │      │
 * +------+------+------+------+------+.
 * | AAA  | BBB  | CCC  | DDD  | EEE  |  Data
 * +------+------+------+------+------+.
 *
 * Map.obtain(0) // returns "AAA"
 * map.obtain(2) // returns "CCC".
 *
 * After inserting 2 new rows, keys that hold the data positioned after the place
 * where the new rows are added are upshifted by 2.
 *               │
 *               │ Insert 2 rows
 *              \│/
 * +------+------+------+------+------+.
 * | 0/10 | 1/11 | 2/12 | 3/13 | 4/14 |  Keys before
 * +------+------+------+------+------+.
 *
 *                / 2 new rows \
 * +------+------+------+------+------+------+------+.
 * | 0/10 | 1/11 | 2/15 | 3/16 | 4/12 | 5/13 | 6/14 |  Keys after
 * +------+------+------+------+------+------+------+.
 *    │       │      │      │      │      │     │
 *    │       │      └──────┼──────┼──────┼┐    │
 *    │       │             └──────┼──────┼┼────┼┐
 *    │       │      ┌─────────────┘      ││    ││
 *    │       │      │      ┌─────────────┘│    ││
 *    │       │      │      │      ┌───────┼────┘│
 *    │       │      │      │      │       │     │
 * +------+------+------+------+------+------+------+.
 * | AAA  | BBB  | CCC  | DDD  | EEE  | FFF  | GGG  |  Data
 * +------+------+------+------+------+------+------+
 *
 * Now at index 2 and 3 we have access to new items.
 *
 * map.obtain(2) // returns new value "FFF" for newly created row.
 * map.obtain(4) // index shifted by 2 has access to the old "CCC" value, as before inserting.
 *
 * after removing 4 rows, keys that hold the data positioned after the place where the
 * rows are removed are downshifted by 4.
 *        │
 *        │ Remove 4 rows
 *        ├───────────────────────────┐
 *       \│/                          │
 * +------+------+------+------+------+------+------+
 * | 0/10 | 1/11 | 2/15 | 3/16 | 4/12 | 5/13 | 6/14 |  Keys after
 * +------+------+------+------+------+------+------+
 *    │       │      │      │      │      │     │
 *    │       │      └──────┼──────┼──────┼┐    │
 *    │       │             └──────┼──────┼┼────┼┐
 *    │       │      ┌─────────────┘      ││    ││
 *    │       │      │      ┌─────────────┘│    ││
 *    │       │      │      │      ┌───────┼────┘│
 *    │       │      │      │      │       │     │
 * +------+------+------+------+------+------+------+
 * | AAA  | BBB  | CCC  | DDD  | EEE  | FFF  | GGG  |  Data
 * +------+------+------+------+------+------+------+
 *
 * +------+------+------+
 * | 0/10 | 1/13 | 2/14 |  Keys after
 * +------+------+------+
 *    │       │      │
 *    │       │      └─────────────┐
 *    │       └────────────┐       │
 *    │                    │       │
 *    │                    │       │
 *    │                    │       │
 *    │                    │       │
 * +------+------+------+------+------+------+------+
 * | AAA  | BBB  | CCC  | DDD  | EEE  | FFF  | GGG  |  Data
 * +------+------+------+------+------+------+------+
 *           /│\   /│\                   /│\   /│\
 *            └──┬──┘                     └──┬──┘
 *           This data is marked as "hole" which
 *           means that can be replaced by new item
 *           when that will be created.
 *
 * map.obtain(2) // returns the value ("EEE") as it should. Access to the value is
 *               // changed (the key was downshifted). However, the internal index has not changed,
 *               // which means that the data does not need to be changed (spliced) too.
 *
 * After previous remove operation which creates some "holes" obtaining new
 * items replaces that "holes" as follows:
 *
 * // Obtains new item
 * map.obtain(90) // Returns "NEW" value
 *
 * +------+------+------+...+------+
 * | 0/10 | 1/13 | 2/14 |   | 90/0 |  Keys after
 * +------+------+------+...+------+
 *    │       │      │          │
 *    │       │      └──────────┼────────────┐
 *    │       └─────────────────┼─────┐      │
 *    └──────────┐              │     │      │
 *               │              │     │      │
 *    ┌──────────┼──────────────┘     │      │
 *    │          │                    │      │
 * +------+...+------+------+------+------+------+-----+
 * | NEW  |   | AAA  | BBB  | CCC  | DDD  | EEE  | FFF |  Data
 * +------+...+------+------+------+------+------+-----+
 *   /│\
 *    │
 * The first "hole" (at index 0) item is permanently removed and replaced by a new item.
 * The hole index is taken from the hole collection which act as FIFO (First In First Out).
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
export default class LazyFactoryMap {
  /**
   * The data factory function.
   *
   * @type {Function}
   */
  valueFactory;
  /**
   * An array which contains data.
   *
   * @type {Array}
   */
  data = [];
  /**
   * An array of indexes where the key of the array is mapped to the value which points to the
   * specific position of the data array.
   *
   * @type {number[]}
   */
  index = [];
  /**
   * The collection of indexes that points to the data items which can be replaced by obtaining new
   * ones. The "holes" are an intended effect of deleting entries.
   *
   * The idea of "holes" generally allows us to not modify the "data" structure while removing
   * items from the collection.
   *
   * @type {Set<number>}
   */
  holes = new Set();

  constructor(valueFactory) {
    this.valueFactory = valueFactory;
  }

  /**
   * Gets or if data not exist creates and returns new data.
   *
   * @param {number} key The item key as zero-based index.
   * @returns {*}
   */
  obtain(key) {
    assert(() => isUnsignedNumber(key), 'Expecting an unsigned number.');

    const dataIndex = this._getStorageIndexByKey(key);
    let result;

    if (dataIndex >= 0) {
      result = this.data[dataIndex];

      if (result === undefined) {
        result = this.valueFactory(key);
        this.data[dataIndex] = result;
      }
    } else {
      result = this.valueFactory(key);

      if (this.holes.size > 0) {
        const reuseIndex = this.holes.values().next().value; // Gets first item from the collection

        this.holes.delete(reuseIndex);

        this.data[reuseIndex] = result;
        this.index[key] = reuseIndex;
      } else {
        this.data.push(result);
        this.index[key] = this.data.length - 1;
      }
    }

    return result;
  }

  /**
   * Inserts an empty data to the map. This method creates an empty space for obtaining
   * new data.
   *
   * @param {number} key The key as volatile zero-based index at which to begin inserting space for new data.
   * @param {number} [amount=1] Amount of data to insert.
   */
  insert(key, amount = 1) {
    assert(() => (isUnsignedNumber(key) || isNullish(key)), 'Expecting an unsigned number or null/undefined argument.');

    const newIndexes = [];
    const dataLength = this.data.length;

    for (let i = 0; i < amount; i++) {
      newIndexes.push(dataLength + i);
      this.data.push(undefined);
    }

    const insertionIndex = isNullish(key) ? this.index.length : key;

    this.index = [...this.index.slice(0, insertionIndex), ...newIndexes, ...this.index.slice(insertionIndex)];
  }

  /**
   * Removes (soft remove) data from "index" and according to the amount of data.
   *
   * @param {number} key The key as volatile zero-based index at which to begin removing the data.
   * @param {number} [amount=1] Amount data to remove.
   */
  remove(key, amount = 1) {
    assert(() => (isUnsignedNumber(key) || isNullish(key)), 'Expecting an unsigned number or null/undefined argument.');

    const removed = this.index.splice(isNullish(key) ? this.index.length - amount : key, amount);

    for (let i = 0; i < removed.length; i++) {
      const removedIndex = removed[i];

      if (typeof removedIndex === 'number') {
        this.holes.add(removedIndex);
      }
    }
  }

  /**
   * Returns the size of the data which this map holds.
   *
   * @returns {number}
   */
  size() {
    return this.data.length - this.holes.size;
  }

  /**
   * Returns a new Iterator object that contains the values for each item in the LazyMap object.
   *
   * @returns {Iterator}
   */
  values() {
    return this.data.filter((meta, index) => {
      return meta !== undefined && !this.holes.has(index);
    })[Symbol.iterator]();
  }

  /**
   * Returns a new Iterator object that contains an array of `[index, value]` for each item in the LazyMap object.
   *
   * @returns {Iterator}
   */
  entries() {
    const validEntries = [];

    for (let i = 0; i < this.data.length; i++) {
      const keyIndex = this._getKeyByStorageIndex(i);

      if (keyIndex !== -1 && this.data[i] !== undefined) {
        validEntries.push([keyIndex, this.data[i]]);
      }
    }

    let dataIndex = 0;

    return {
      next: () => {
        if (dataIndex < validEntries.length) {
          const value = validEntries[dataIndex];

          dataIndex += 1;

          return { value, done: false };
        }

        return { done: true };
      }
    };
  }

  /**
   * Clears the map.
   */
  clear() {
    this.data = [];
    this.index = [];
    this.holes.clear();
  }

  /**
   * Gets storage index calculated from the key associated with the specified value.
   *
   * @param {number} key Volatile zero-based index.
   * @returns {number} Returns index 0-N or -1 if no storage index found.
   */
  _getStorageIndexByKey(key) {
    return this.index.length > key ? this.index[key] : -1;
  }

  /**
   * Gets the key associated with the specified value calculated from storage index.
   *
   * @param {number} dataIndex Zero-based storage index.
   * @returns {number} Returns index 0-N or -1 if no key found.
   */
  _getKeyByStorageIndex(dataIndex) {
    return this.index.indexOf(dataIndex);
  }

  /**
   * Makes this object iterable.
   *
   * @returns {Iterator}
   */
  [Symbol.iterator]() {
    return this.entries();
  }
}
