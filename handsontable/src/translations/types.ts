/**
 * Shared types for translations module
 */

import { IndexMap } from './maps/indexMap';
import { AnyFunction } from '../helpers/types';

/**
 * Type for index values (most commonly boolean in hiding/trimming maps)
 */
export type IndexValue = boolean | any;

/**
 * Type for index changes operations
 */
export type ChangeOp = 'replace' | 'insert' | 'remove';

/**
 * Type for a single index change
 */
export interface IndexChange {
  op: ChangeOp;
  index: number;
  oldValue: IndexValue;
  newValue: IndexValue;
}

/**
 * Type for an aggregation function
 */
export type AggregationFunction = (valuesForIndex: IndexValue[]) => IndexValue;

/**
 * Base options for change observables
 */
export interface ObservableOptions {
  initialIndexValue?: IndexValue;
}

/**
 * Interface for a map registered in a collection
 */
export interface RegisteredMap {
  [name: string]: IndexMap;
} 