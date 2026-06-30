import { IndexMap } from './indexMap';
import { getListWithRemovedItems, getListWithInsertedItems } from './utils/indexesSequence';
import { getDecreasedIndexes, getIncreasedIndexes } from './utils';

/**
 * Map for storing mappings from an index to a physical index.
 *
 * It also updates the physical indexes (remaining in the map) on remove/add row or column action.
 *
 * Representation: while the sequence is the identity (`0, 1, …, n-1` — the state of an unsorted,
 * unmoved grid) it is kept as a single `length` number, not a materialized array. Insert, remove,
 * and init then run in O(1)/O(k) instead of rebuilding an n-element array, because inserting a
 * contiguous block at its own position or removing any subset of an identity sequence yields another
 * identity sequence. The array is materialized lazily only when a real reorder (sort/move) sets a
 * non-identity sequence. `getValues()` still returns a plain `number[]`, so the public contract is
 * unchanged.
 *
 * @class IndexesSequence
 */
export class IndexesSequence extends IndexMap {
  /**
   * Whether the sequence is currently the identity (`0..#length-1`). When `true`, `indexedValues` is
   * not materialized and `#length` is the source of truth.
   *
   * @type {boolean}
   */
  #isIdentity = true;
  /**
   * Length of the sequence while it is the identity. Ignored once materialized.
   *
   * @type {number}
   */
  #length = 0;

  /**
   * Initializes the sequence map with an identity function so each index maps to its own physical value.
   */
  constructor() {
    // Not handling custom init function or init value.
    super((index: number) => index);
  }

  /**
   * Get sequence of physical indexes.
   *
   * @returns {number[]} Physical indexes.
   */
  getValues(): number[] {
    if (this.#isIdentity) {
      const values = new Array<number>(this.#length);

      for (let index = 0; index < this.#length; index += 1) {
        values[index] = index;
      }

      return values;
    }

    return this.indexedValues as number[];
  }

  /**
   * Get the physical index at the given position.
   *
   * @param {number} index Position in the sequence.
   * @returns {T | undefined}
   */
  getValueAtIndex<T = unknown>(index: number): T | undefined {
    if (this.#isIdentity) {
      if (index >= 0 && index < this.#length) {
        return index as unknown as T;
      }

      return undefined;
    }

    return super.getValueAtIndex<T>(index);
  }

  /**
   * Get length of the sequence.
   *
   * @returns {number}
   */
  getLength(): number {
    return this.#isIdentity ? this.#length : this.indexedValues.length;
  }

  /**
   * Set a completely new sequence. Detects the identity case to keep the compact representation.
   *
   * @param {Array} values List of physical indexes.
   */
  setValues(values: unknown[]): void {
    if (this.#isIdentitySequence(values)) {
      this.#isIdentity = true;
      this.#length = values.length;
      this.indexedValues = [];

    } else {
      this.#isIdentity = false;
      this.indexedValues = values.slice();
    }

    this.runLocalHooks('change');
  }

  /**
   * Set the physical index at a single position. Materializes the sequence first.
   *
   * @param {number} index The position.
   * @param {*} value The physical index to store.
   * @returns {boolean}
   */
  setValueAtIndex(index: number, value: unknown): boolean {
    if (index < this.getLength()) {
      this.#materialize();

      return super.setValueAtIndex(index, value);
    }

    return false;
  }

  /**
   * Reset to the identity sequence of the given length. O(1) — no array is built.
   *
   * @private
   * @param {number} [length] Length of the sequence.
   */
  setDefaultValues(length = this.getLength()) {
    this.#isIdentity = true;
    this.#length = length;
    this.indexedValues = [];

    this.runLocalHooks('change');
  }

  /**
   * Add values to the sequence and reorganize.
   *
   * @private
   * @param {number} insertionIndex Position inside the list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex: number, insertedIndexes: number[]) {
    // Fast path: inserting a contiguous physical block at its own position into an identity sequence
    // yields another identity sequence, so only the length changes.
    if (this.#isIdentity && this.#isContiguousBlockAt(insertionIndex, insertedIndexes)) {
      this.#length += insertedIndexes.length;

      super.insert(insertionIndex, insertedIndexes);

      return;
    }

    this.#materialize();

    const listAfterUpdate = getIncreasedIndexes(this.getValues(), insertedIndexes);

    this.indexedValues = getListWithInsertedItems(listAfterUpdate, insertionIndex, insertedIndexes);

    super.insert(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the sequence and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes: number[]) {
    // Fast path: removing any subset of an identity sequence and reindexing the survivors yields
    // another identity sequence, so only the length changes.
    if (this.#isIdentity) {
      this.#length -= this.#countInRange(removedIndexes);

      super.remove(removedIndexes);

      return;
    }

    const listAfterUpdate = getListWithRemovedItems(this.getValues(), removedIndexes);

    this.indexedValues = getDecreasedIndexes(listAfterUpdate, removedIndexes);

    super.remove(removedIndexes);
  }

  /**
   * Destroys the map instance.
   */
  destroy(): void {
    this.#isIdentity = true;
    this.#length = 0;

    super.destroy();
  }

  /**
   * Materializes the identity sequence into `indexedValues` so the array-based paths can run.
   *
   * @private
   */
  #materialize() {
    if (this.#isIdentity) {
      this.indexedValues = this.getValues();
      this.#isIdentity = false;
    }
  }

  /**
   * Checks whether the given values are the identity sequence (`0, 1, …, length-1`).
   *
   * @private
   * @param {Array} values Candidate sequence.
   * @returns {boolean}
   */
  #isIdentitySequence(values: unknown[]): boolean {
    for (let index = 0; index < values.length; index += 1) {
      if (values[index] !== index) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks whether `insertedIndexes` is the contiguous block `[insertionIndex, …]` — the only shape
   * that keeps an identity sequence identity after an insert.
   *
   * @private
   * @param {number} insertionIndex Position inside the list.
   * @param {Array} insertedIndexes List of inserted indexes.
   * @returns {boolean}
   */
  #isContiguousBlockAt(insertionIndex: number, insertedIndexes: number[]): boolean {
    for (let offset = 0; offset < insertedIndexes.length; offset += 1) {
      if (insertedIndexes[offset] !== insertionIndex + offset) {
        return false;
      }
    }

    return true;
  }

  /**
   * Counts how many distinct removed indexes fall inside the current identity range `[0, #length)`.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   * @returns {number}
   */
  #countInRange(removedIndexes: number[]): number {
    const seen = new Set<number>();

    for (let i = 0; i < removedIndexes.length; i += 1) {
      const removedIndex = removedIndexes[i];

      if (removedIndex >= 0 && removedIndex < this.#length) {
        seen.add(removedIndex);
      }
    }

    return seen.size;
  }
}
