import { assert, isNullish } from './utils';
import { isUnsignedNumber } from '../../helpers/number';

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
 */
export default class LazyFactoryMap<V = Record<string, unknown>> {
  /**
   * The data factory function.
   *
   * @type {Function}
   */
  declare valueFactory: (key: number) => V;
  /**
   * An array which contains data.
   *
   * @type {Array}
   */
  data: (V | undefined)[] = [];
  /**
   * An array of indexes where the key of the array is mapped to the value which points to the
   * specific position of the data array.
   *
   * @type {number[]}
   */
  index: number[] = [];
  /**
   * The collection of indexes that points to the data items which can be replaced by obtaining new
   * ones. The "holes" are an intended effect of deleting entries.
   *
   * @type {Set<number>}
   */
  holes = new Set<number>();

  /**
   * Initializes the map with the given factory function used to create values for new keys on first access.
   */
  constructor(valueFactory: (key: number) => V) {
    this.valueFactory = valueFactory;
  }

  /**
   * Gets or if data not exist creates and returns new data.
   *
   * @param {number} key The item key as zero-based index.
   * @returns {*}
   */
  obtain(key: number): V {
    assert(() => isUnsignedNumber(key), 'Expecting an unsigned number.');

    const dataIndex = this._getStorageIndexByKey(key);
    let result: V | undefined;

    if (dataIndex >= 0) {
      result = this.data[dataIndex];

      if (result === undefined) {
        result = this.valueFactory(key);
        this.data[dataIndex] = result;
      }
    } else {
      result = this.valueFactory(key);

      const reuseIndex: number | undefined = this.holes.size > 0 ? this.holes.values().next().value : undefined;

      if (reuseIndex !== undefined) {
        this.holes.delete(reuseIndex);

        this.data[reuseIndex] = result;
        this.index[key] = reuseIndex;
      } else {
        this.data.push(result);
        this.index[key] = this.data.length - 1;
      }
    }

    return result!;
  }

  /**
   * Inserts an empty data to the map. This method creates an empty space for obtaining
   * new data.
   *
   * @param {number} key The key as volatile zero-based index at which to begin inserting space for new data.
   * @param {number} [amount=1] Amount of data to insert.
   */
  insert(key: number | null | undefined, amount = 1) {
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
  remove(key: number | null | undefined, amount = 1) {
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
  values(): IterableIterator<V> {
    return (this.data.filter(
      (meta, index): meta is V => meta !== undefined && !this.holes.has(index)
    ))[Symbol.iterator]();
  }

  /**
   * Returns a new Iterator object that contains an array of `[index, value]` for each item in the LazyMap object.
   *
   * @returns {Iterator}
   */
  entries() {
    const validEntries: [number, V][] = [];

    for (let i = 0; i < this.data.length; i++) {
      const keyIndex = this._getKeyByStorageIndex(i);
      const item = this.data[i];

      if (keyIndex !== -1 && item !== undefined) {
        validEntries.push([keyIndex, item]);
      }
    }

    let dataIndex = 0;

    type SelfIterator = Iterator<[number, V]> & { [Symbol.iterator](): SelfIterator };
    const iterator: SelfIterator = {
      next(): IteratorResult<[number, V]> {
        if (dataIndex < validEntries.length) {
          const value = validEntries[dataIndex];

          dataIndex += 1;

          return { value, done: false };
        }

        return { done: true, value: undefined as unknown as [number, V] };
      },
      [Symbol.iterator](): SelfIterator {
        return iterator;
      },
    };

    return iterator;
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
  _getStorageIndexByKey(key: number) {
    return this.index.length > key ? this.index[key] : -1;
  }

  /**
   * Gets the key associated with the specified value calculated from storage index.
   *
   * @param {number} dataIndex Zero-based storage index.
   * @returns {number} Returns index 0-N or -1 if no key found.
   */
  _getKeyByStorageIndex(dataIndex: number) {
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
