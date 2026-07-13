import { isNullish } from './utils';
import { throwWithCause } from '../../helpers/errors';
import { isUnsignedNumber } from '../../helpers/number';

/**
 * Throws when the key is not an unsigned integer. A plain function call instead of `assert()` -
 * `assert` takes a condition closure, and allocating one per `obtain` call is measurable on the
 * render path (the method runs twice per cell per draw).
 *
 * @param {*} key The key to validate.
 */
function assertUnsignedKey(key: unknown): asserts key is number {
  if (!isUnsignedNumber(key)) {
    throwWithCause('Assertion failed: Expecting an unsigned number.');
  }
}

/**
 * Throws when the key is neither an unsigned integer nor null/undefined.
 *
 * @param {*} key The key to validate.
 */
function assertUnsignedKeyOrNullish(key: unknown): asserts key is number | null | undefined {
  if (!isUnsignedNumber(key) && !isNullish(key)) {
    throwWithCause('Assertion failed: Expecting an unsigned number or null/undefined argument.');
  }
}

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
 * Values live in a single native Map keyed by the CURRENT volatile key. Lookups are a
 * single integer-keyed `Map.get` - a native Map is always a hash table, so far-apart keys
 * (for example, physical row 999990 on a million-row grid) cannot push the storage into a
 * slow mode, unlike a sparse array. Insert and remove re-key the affected entries in
 * O(materialized) time by rebuilding the map in its original iteration order, which keeps
 * `values()` returning items in order of initialization. The materialized size is normally
 * viewport-bound thanks to the render-derived cell meta eviction.
 */
export default class LazyFactoryMap<V = Record<string, unknown>> {
  /**
   * The data factory function.
   *
   * @type {Function}
   */
  declare valueFactory: (key: number) => V;
  /**
   * Materialized values keyed by the CURRENT volatile key. Native Map iteration order is
   * insertion order; `insert`/`remove` rebuild the map preserving that relative order, so
   * iteration stays in order of value initialization.
   */
  #data = new Map<number, V>();
  /**
   * The logical length of the collection: slots created by `insert` plus slots implied by
   * obtaining a key at or past the current end. It only backs the "append"/"remove at end"
   * semantics of nullish `insert`/`remove` keys - it does not bound `obtain`. Every key
   * stored in the map is smaller than this value.
   */
  #length = 0;

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
    assertUnsignedKey(key);

    let value = this.#data.get(key);

    if (value === undefined) {
      value = this.valueFactory(key);
      this.#data.set(key, value);

      if (key >= this.#length) {
        this.#length = key + 1;
      }
    }

    return value;
  }

  /**
   * Checks whether a value for the given key has already been created, without creating one.
   * Unlike `obtain`, this never triggers the value factory.
   *
   * @param {number} key The item key as zero-based index.
   * @returns {boolean}
   */
  has(key: number): boolean {
    return this.#data.get(key) !== undefined;
  }

  /**
   * Inserts an empty space for new data. Materialized values stored under keys at or after
   * the insertion point are re-keyed upwards by `amount`; the inserted keys themselves stay
   * unmaterialized until the first `obtain` call. When no materialized key falls at or after
   * the insertion point (the common case on a large grid, where only the viewport band is
   * materialized), the operation is a key scan with no allocation.
   *
   * @param {number} key The key as volatile zero-based index at which to begin inserting space for new data.
   * @param {number} [amount=1] Amount of data to insert.
   */
  insert(key: number | null | undefined, amount = 1) {
    assertUnsignedKeyOrNullish(key);

    const insertionIndex = isNullish(key) ? this.#length : key;

    this.#length += amount;

    if (!this.#hasKeyAtOrAbove(insertionIndex)) {
      return;
    }

    const shifted = new Map<number, V>();

    // Rebuilding (rather than re-keying in place with delete+set) preserves the map's
    // iteration order, and with it the `values()` initialization-order contract.
    for (const [itemKey, value] of this.#data) {
      shifted.set(itemKey >= insertionIndex ? itemKey + amount : itemKey, value);
    }

    this.#data = shifted;
  }

  /**
   * Removes (soft remove) data from the map. Materialized values stored under the removed keys
   * are dropped (freed for garbage collection) and values under higher keys are re-keyed
   * downwards by `amount`. When no materialized key falls at or after the removal point, the
   * operation is a key scan with no allocation.
   *
   * @param {number} key The key as volatile zero-based index at which to begin removing the data.
   * @param {number} [amount=1] Amount data to remove.
   */
  remove(key: number | null | undefined, amount = 1) {
    assertUnsignedKeyOrNullish(key);

    let start: number;

    if (isNullish(key)) {
      // Reproduces `index.splice(length - amount, amount)`: a negative start counts back from
      // the end (never below zero), exactly like `Array.prototype.splice`.
      const rawStart = this.#length - amount;

      start = rawStart < 0 ? Math.max(this.#length + rawStart, 0) : rawStart;
    } else {
      start = key;
    }

    const removedCount = Math.max(Math.min(this.#length - start, amount), 0);

    this.#length -= removedCount;

    if (!this.#hasKeyAtOrAbove(start)) {
      return;
    }

    const end = start + amount;
    const shifted = new Map<number, V>();

    for (const [itemKey, value] of this.#data) {
      if (itemKey < start) {
        shifted.set(itemKey, value);
      } else if (itemKey >= end) {
        shifted.set(itemKey - amount, value);
      }
    }

    this.#data = shifted;
  }

  /**
   * Returns the number of materialized values this map currently holds. Keys reserved through
   * `insert` but never obtained, and keys released through `evict` or `remove`, are not counted.
   *
   * @returns {number}
   */
  size() {
    return this.#data.size;
  }

  /**
   * Returns a new Iterator object that contains the values for each item in the LazyMap object,
   * in order of value initialization.
   *
   * @returns {Iterator}
   */
  values(): IterableIterator<V> {
    return this.#data.values();
  }

  /**
   * Returns a new Iterator object that contains an array of `[index, value]` for each item in
   * the LazyMap object, in order of value initialization. The iterator is live: releasing the
   * currently visited key during iteration (as `CellMeta.evictRow` does through `evict`) is safe.
   *
   * @returns {Iterator}
   */
  entries(): IterableIterator<[number, V]> {
    return this.#data.entries();
  }

  /**
   * Releases the value stored under the given key. The next `obtain` call for that key
   * re-creates the value through the factory (with a new identity). Unlike `remove`, the
   * surrounding keys do not shift, so this is safe for values that can be reconstructed
   * deterministically - for example render-derived cell meta for rows scrolled out of the
   * viewport. The entry is genuinely deleted, so its memory is freed - there is no leftover
   * slot. Does nothing when the key has no materialized value.
   *
   * @param {number} key The item key as zero-based index.
   */
  evict(key: number) {
    this.#data.delete(key);
  }

  /**
   * Returns the value stored under the given key, or `undefined` when the key has no materialized
   * value. Unlike `obtain`, it never creates a value through the factory, so it is safe for
   * read-only existence checks against the current contents.
   *
   * @param {number} key The item key as zero-based index.
   * @returns {*}
   */
  getIfExists(key: number): V | undefined {
    return this.#data.get(key);
  }

  /**
   * Clears the map.
   */
  clear() {
    this.#data.clear();
    this.#length = 0;
  }

  /**
   * Checks whether any materialized key is greater than or equal to the given bound. Used as
   * the fast no-op gate for `insert`/`remove`: when every materialized key sits below the
   * shift point, no re-keying is needed. Early-exits on the first hit.
   *
   * @param {number} bound The zero-based key bound (inclusive).
   * @returns {boolean}
   */
  #hasKeyAtOrAbove(bound: number): boolean {
    for (const itemKey of this.#data.keys()) {
      if (itemKey >= bound) {
        return true;
      }
    }

    return false;
  }

  /**
   * Makes this object iterable.
   *
   * @returns {Iterator}
   */
  [Symbol.iterator](): IterableIterator<[number, V]> {
    return this.entries();
  }
}
