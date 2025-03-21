import { rangeEach } from '../../helpers/number';
import { mixin } from '../../helpers/object';
import { isFunction } from '../../helpers/function';
import localHooks from '../../mixins/localHooks';
import { AnyFunction } from '../../helpers/types';
import { IndexValue } from '../types';

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
  indexedValues: IndexValue[] = [];
  /**
   * Initial value or function for each existing index.
   *
   * @private
   * @type {*}
   */
  initValueOrFn: IndexValue | ((index: number) => IndexValue) | null;

  constructor(initValueOrFn: IndexValue | ((index: number) => IndexValue) | null = null) {
    this.initValueOrFn = initValueOrFn;
  }

  /**
   * Get full list of values for particular indexes.
   *
   * @returns {Array}
   */
  getValues(): IndexValue[] {
    return this.indexedValues;
  }

  /**
   * Get value for the particular index.
   *
   * @param {number} index Index for which value is got.
   * @returns {*}
   */
  getValueAtIndex(index: number): IndexValue | undefined {
    const values = this.indexedValues;

    if (index < values.length) {
      return values[index];
    }
  }

  /**
   * Set new values for particular indexes.
   *
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @param {Array} values List of set values.
   */
  setValues(values: IndexValue[]): void {
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
  setValueAtIndex(index: number, value: IndexValue): boolean {
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
  setDefaultValues(length: number = this.indexedValues.length): void {
    this.indexedValues.length = 0;

    if (isFunction(this.initValueOrFn)) {
      rangeEach(length - 1, (index: number): void => {
        this.indexedValues.push((this.initValueOrFn as Function)(index));
      });
    } else {
      rangeEach(length - 1, (): void => {
        this.indexedValues.push(this.initValueOrFn as IndexValue);
      });
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
  init(length: number): IndexMap {
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
   * @param {number} insertionIndex Position inside the actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex?: number, insertedIndexes?: number[]): void {
    this.runLocalHooks('change');
  }

  /**
   * Remove values from the list.
   *
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes?: number[]): void {
    this.runLocalHooks('change');
  }

  /**
   * Destroys the Map instance.
   */
  destroy(): void {
    this.clearLocalHooks();

    this.indexedValues = null as any;
    this.initValueOrFn = null;
  }

  /**
   * Add local hook from the mixin.
   */
  addLocalHook!: (hookName: string, callback: AnyFunction) => void;

  /**
   * Clear local hooks from the mixin.
   */
  clearLocalHooks!: () => void;

  /**
   * Run local hooks from the mixin.
   */
  runLocalHooks!: (...args: any[]) => void;
}

mixin(IndexMap, localHooks);
