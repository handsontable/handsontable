import { mixin } from '../../helpers/object';
import { isFunction } from '../../helpers/function';
import localHooks from '../../mixins/localHooks';

/**
 * Configuration options for an {@link IndexMap}.
 */
export interface IndexMapOptions {
  /**
   * When `true`, `setValueAtIndex` treats a write of a strictly-equal (`===`) value as a no-op:
   * nothing is stored and the `change` hook does not run. Opt in only for maps that hold scalar
   * values (numbers, strings, booleans, `null`) — for maps holding objects, reference equality
   * would swallow the change event of a caller that mutates the stored object and re-sets the
   * same reference. The option is honored only by maps whose `setValueAtIndex` delegates to the
   * `IndexMap` implementation.
   */
  skipUnchangedWrites?: boolean;
}

/**
 * Map for storing mappings from an index to a value.
 *
 * @class IndexMap
 */
export class IndexMap {
  /**
   * List of values for particular indexes.
   *
   * @private
   * @type {Array}
   */
  indexedValues: unknown[] = [];
  /**
   * Initial value or function for each existing index.
   *
   * @private
   * @type {*}
   */
  initValueOrFn;
  /**
   * Whether `setValueAtIndex` skips the write and the `change` hook when the new value is
   * strictly equal to the stored one. See {@link IndexMapOptions#skipUnchangedWrites}.
   *
   * @type {boolean}
   */
  readonly #skipUnchangedWrites: boolean;

  // Mixin declarations for localHooks (signature must match mixin for subclass assignability)
  /**
   * Triggers all callbacks registered under the given local hook name, returning any results.
   */
  declare runLocalHooks: (key: string, ...args: unknown[]) => unknown;
  /**
   * Registers a callback function for the given local hook name on this map instance.
   */
  declare addLocalHook: (key: string, callback: Function) => unknown;
  /**
   * Removes all locally registered hook callbacks from this map instance.
   */
  declare clearLocalHooks: () => void;

  /**
   * Initializes the index map with an optional default value or factory function applied to each
   * index, and optional map behavior options.
   */
  constructor(initValueOrFn: unknown = null, { skipUnchangedWrites = false }: IndexMapOptions = {}) {
    this.initValueOrFn = initValueOrFn;
    this.#skipUnchangedWrites = skipUnchangedWrites;
  }

  /**
   * Whether `setValueAtIndex` treats a write of a strictly-equal value as a no-op. Read-only;
   * configured through the constructor. Exposed so subclasses that fully override
   * `setValueAtIndex` (e.g. `BooleanMap`) can honor the same contract.
   *
   * @returns {boolean}
   */
  get skipUnchangedWrites(): boolean {
    return this.#skipUnchangedWrites;
  }

  /**
   * Get full list of values for particular indexes.
   *
   * @param {*} [unused] Unused parameter for TypeScript compatibility.
   * @returns {Array}
   */
  getValues(unused?: unknown) {
    return this.indexedValues;
  }

  /**
   * Get value for the particular index.
   *
   * @param {number} index Index for which value is got.
   * @returns {T | undefined}
   */
  getValueAtIndex<T = unknown>(index: number): T | undefined {
    const values = this.indexedValues;

    if (index < values.length) {
      return values[index] as T;
    }
  }

  /**
   * Set new values for particular indexes.
   *
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @param {Array} values List of set values.
   */
  setValues(values: unknown[]): void {
    this.indexedValues = values.slice();

    this.runLocalHooks('change');
  }

  /**
   * Set new value for the particular index.
   *
   * @param {number} index The index.
   * @param {*} value The value to save.
   *
   * Note: Please keep in mind that it is not possible to set value beyond the map (not respecting already set
   * map's size). Please use the `setValues` method when you would like to extend the map.
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @returns {boolean}
   */
  setValueAtIndex(index: number, value: unknown): boolean {
    if (index < this.indexedValues.length) {
      // A no-op write on an opted-in scalar map: the postcondition already holds, so skip the
      // store and the `change` hook (each `change` rebuilds consumer caches).
      if (this.skipUnchangedWrites && this.indexedValues[index] === value) {
        return true;
      }

      this.indexedValues[index] = value;

      this.runLocalHooks('change');

      return true;
    }

    return false;
  }

  /**
   * Clear all values to the defaults.
   */
  clear(): void {
    this.setDefaultValues();
  }

  /**
   * Get length of the index map.
   *
   * @returns {number}
   */
  getLength(): number {
    return this.getValues().length;
  }

  /**
   * Set default values for elements from `0` to `n`, where `n` is equal to the handled variable.
   *
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @private
   * @param {number} [length] Length of list.
   */
  setDefaultValues(length = this.indexedValues.length) {
    // Build the backing array presized instead of growing it with `push` per index. On large
    // datasets the repeated array-growth reallocation dominated load time (~106 ms to seed 1M
    // values); a presized fill/assignment is a tight native loop. Same element type and values.
    if (isFunction(this.initValueOrFn)) {
      const values = new Array(length);
      const initFn = this.initValueOrFn as (index: number) => unknown;

      for (let index = 0; index < length; index += 1) {
        values[index] = initFn(index);
      }

      this.indexedValues = values;

    } else {
      this.indexedValues = new Array(length).fill(this.initValueOrFn);
    }

    this.runLocalHooks('change');
  }

  /**
   * Initialize list with default values for particular indexes.
   *
   * @private
   * @param {number} length New length of indexed list.
   * @returns {IndexMap}
   */
  init(length: number) {
    this.setDefaultValues(length);

    this.runLocalHooks('init');

    return this;
  }

  /**
   * Add values to the list.
   *
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @private
   * @param {number} [insertionIndex] Position inside the list.
   * @param {Array} [insertedIndexes] List of inserted indexes.
   */
  insert(insertionIndex?: number, insertedIndexes?: number[]) {
    this.runLocalHooks('change');
  }

  /**
   * Remove values from the list.
   *
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @private
   * @param {Array} [removedIndexes] List of removed indexes.
   */
  remove(removedIndexes?: number[]) {
    this.runLocalHooks('change');
  }

  /**
   * Destroys the Map instance.
   */
  destroy(): void {
    this.clearLocalHooks();

    this.indexedValues = [];
    this.initValueOrFn = null;
  }
}

mixin(IndexMap, localHooks);
