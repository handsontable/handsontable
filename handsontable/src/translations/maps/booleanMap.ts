import { IndexMap } from './indexMap';

/**
 * Map from a physical index to a boolean (hidden/trimmed flags).
 *
 * Representation, mirroring `IndexesSequence`'s identity fast path:
 * - While every value equals the default (the common case — nothing hidden/trimmed) the store is a
 *   single `length`, not an array. Insert/remove then run in O(1)/O(k) (length change only) instead of
 *   rebuilding an n-element array, and nothing is retained between operations.
 * - On the first non-default write the store materializes as a `boolean[]`, kept and returned by
 *   reference so the merge does not allocate per `updateCache`.
 *
 * `getValues()` still returns a plain `boolean[]`, so the merge predicate (`value === true`) and every
 * other consumer are unchanged.
 *
 * (A `Uint8Array` store would cut the materialized footprint ~8×, but exposing it from `getValues()`
 * forces the same generic-`IndexMap` refactor + contract break as the rejected typed-sequence change,
 * so the store stays `boolean[]` when populated.)
 *
 * @class BooleanMap
 */
export class BooleanMap extends IndexMap {
  /**
   * Whether every value currently equals the default (no materialized array).
   *
   * @type {boolean}
   */
  #allDefault = true;
  /**
   * Number of indexes in the map.
   *
   * @type {number}
   */
  #length = 0;
  /**
   * Materialized store, or `null` while every value is the default.
   *
   * @type {boolean[] | null}
   */
  #store: boolean[] | null = null;
  /**
   * The default boolean value (`false` for hiding/trimming). Unused when a default function is given.
   *
   * @type {boolean}
   */
  #defaultValue;
  /**
   * Default factory when one is provided instead of a constant (then the all-default fast path is off).
   *
   * @type {Function | null}
   */
  #defaultFn: ((index: number, ordinalNumber: number) => unknown) | null;

  /**
   * Initializes the boolean map with a default value or factory (defaults to `false`).
   */
  constructor(initValueOrFn: boolean | ((index: number, ordinalNumber: number) => unknown) = false) {
    super(initValueOrFn);
    this.#defaultFn = typeof initValueOrFn === 'function' ? initValueOrFn : null;
    this.#defaultValue = initValueOrFn === true;
  }

  /**
   * Returns the default flag for a position — constant, or from the factory when one is set.
   *
   * @private
   * @param {number} index Physical index.
   * @param {number} ordinalNumber Ordinal of the inserted item.
   * @returns {boolean}
   */
  #defaultFlagAt(index: number, ordinalNumber: number): boolean {
    if (this.#defaultFn !== null) {
      return this.#defaultFn(index, ordinalNumber) === true;
    }

    return this.#defaultValue;
  }

  /**
   * Get the full list of boolean values. Returns the materialized array by reference (no per-call copy).
   *
   * @returns {boolean[]}
   */
  getValues(): boolean[] {
    if (this.#allDefault) {
      return new Array<boolean>(this.#length).fill(this.#defaultValue);
    }

    return this.#store as boolean[];
  }

  /**
   * Get the boolean value at a physical index.
   *
   * @param {number} index Physical index.
   * @returns {T | undefined}
   */
  getValueAtIndex<T = unknown>(index: number): T | undefined {
    if (index < 0 || index >= this.#length) {
      return undefined;
    }

    if (this.#allDefault) {
      return this.#defaultValue as unknown as T;
    }

    return (this.#store as boolean[])[index] as unknown as T;
  }

  /**
   * Get the number of indexes.
   *
   * @returns {number}
   */
  getLength(): number {
    return this.#length;
  }

  /**
   * Set new boolean values. Keeps the compact representation when all values equal the default.
   *
   * @param {Array} values List of boolean values.
   */
  setValues(values: unknown[]): void {
    this.#length = values.length;

    let allDefault = true;

    for (let index = 0; index < values.length; index += 1) {
      if ((values[index] === true) !== this.#defaultValue) {
        allDefault = false;
        break;
      }
    }

    if (allDefault) {
      this.#allDefault = true;
      this.#store = null;

    } else {
      const store = new Array<boolean>(values.length);

      for (let index = 0; index < values.length; index += 1) {
        store[index] = values[index] === true;
      }

      this.#allDefault = false;
      this.#store = store;
    }

    this.runLocalHooks('change');
  }

  /**
   * Set the boolean value at a single physical index. Materializes the store on the first non-default write.
   *
   * @param {number} index Physical index.
   * @param {*} value The value to set (coerced to boolean).
   * @returns {boolean}
   */
  setValueAtIndex(index: number, value: unknown): boolean {
    if (index < 0 || index >= this.#length) {
      return false;
    }

    const flag = value === true;

    if (this.#allDefault) {
      if (flag === this.#defaultValue) {
        this.runLocalHooks('change');

        return true;
      }

      this.#materialize();
    }

    (this.#store as boolean[])[index] = flag;

    this.runLocalHooks('change');

    return true;
  }

  /**
   * Reset to the all-default state of the given length. O(1) for a constant default — no array is built.
   *
   * @private
   * @param {number} [length] Length of the map.
   */
  setDefaultValues(length = this.#length) {
    this.#length = length;

    if (this.#defaultFn !== null) {
      // A factory default has no single value, so materialize it (no all-default fast path).
      const store = new Array<boolean>(length);

      for (let index = 0; index < length; index += 1) {
        store[index] = this.#defaultFlagAt(index, index);
      }

      this.#store = store;
      this.#allDefault = false;

    } else {
      this.#allDefault = true;
      this.#store = null;
    }

    this.runLocalHooks('change');
  }

  /**
   * Add values to the map and reorganize.
   *
   * @private
   * @param {number} insertionIndex Position inside the list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex: number, insertedIndexes: number[]) {
    const amount = insertedIndexes.length;

    if (amount > 0) {
      if (this.#allDefault) {
        // Inserting defaults into an all-default map stays all-default; only the length grows.
        this.#length += amount;

      } else {
        // Mirror `getListWithInsertedItems`: splice the default block at `insertedIndexes[0]`.
        const at = insertedIndexes[0];
        const inserted = new Array<boolean>(amount);

        for (let ordinalNumber = 0; ordinalNumber < amount; ordinalNumber += 1) {
          inserted[ordinalNumber] = this.#defaultFlagAt(insertedIndexes[ordinalNumber], ordinalNumber);
        }

        const store = this.#store as boolean[];

        this.#store = store.slice(0, at).concat(inserted, store.slice(at));
        this.#length += amount;
      }
    }

    super.insert(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the map and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes: number[]) {
    if (this.#allDefault) {
      // Removing from an all-default map stays all-default; only the length shrinks.
      const seen = new Set<number>();

      for (let i = 0; i < removedIndexes.length; i += 1) {
        const removedIndex = removedIndexes[i];

        if (removedIndex >= 0 && removedIndex < this.#length) {
          seen.add(removedIndex);
        }
      }

      this.#length -= seen.size;

    } else {
      const removed = new Set(removedIndexes);
      const store = this.#store as boolean[];
      const next: boolean[] = [];

      for (let i = 0; i < this.#length; i += 1) {
        if (removed.has(i) === false) {
          next.push(store[i]);
        }
      }

      this.#store = next;
      this.#length = next.length;
    }

    super.remove(removedIndexes);
  }

  /**
   * Destroys the map instance.
   */
  destroy(): void {
    this.#allDefault = true;
    this.#length = 0;
    this.#store = null;

    super.destroy();
  }

  /**
   * Materializes the all-default state into a `boolean[]` so per-index writes can run.
   *
   * @private
   */
  #materialize() {
    if (this.#allDefault) {
      this.#store = new Array<boolean>(this.#length).fill(this.#defaultValue);
      this.#allDefault = false;
    }
  }
}
