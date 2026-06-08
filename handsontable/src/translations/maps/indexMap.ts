import { rangeEach } from '../../helpers/number';
import { mixin } from '../../helpers/object';
import { isFunction } from '../../helpers/function';
import localHooks from '../../mixins/localHooks';

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
   * Initializes the index map with an optional default value or factory function applied to each index.
   */
  constructor(initValueOrFn: unknown = null) {
    this.initValueOrFn = initValueOrFn;
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
    this.indexedValues.length = 0;

    if (isFunction(this.initValueOrFn)) {
      rangeEach(0, length - 1,
        index => this.indexedValues.push((this.initValueOrFn as (index: number) => unknown)(index)));

    } else {
      rangeEach(0, length - 1, () => this.indexedValues.push(this.initValueOrFn));
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
