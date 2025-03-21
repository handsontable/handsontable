/**
 * Shared types for translation utils
 */

import { IndexValue } from '../../types';

/**
 * Interface for the index sequence strategy
 */
export interface IndexSequenceStrategy {
  getListWithInsertedItems: (
    indexedValues: number[],
    insertionIndex: number,
    insertedIndexes: number[]
  ) => number[];
  getListWithRemovedItems: (
    indexedValues: number[],
    removedIndexes: number[]
  ) => number[];
}

/**
 * Interface for the physical indexing strategy
 */
export interface PhysicalIndexStrategy {
  getListWithInsertedItems: <T>(
    indexedValues: T[],
    insertionIndex: number,
    insertedIndexes: number[],
    insertedValuesMapping: ((insertedIndex: number, ordinalNumber: number) => T) | T
  ) => T[];
  getListWithRemovedItems: <T>(
    indexedValues: T[],
    removedIndexes: number[]
  ) => T[];
}

/**
 * Type for an alter strategy
 */
export type AlterStrategy = IndexSequenceStrategy | PhysicalIndexStrategy;

/**
 * Interface for a map entry in alterStrategies
 */
export interface AlterStrategyMapEntry {
  getListWithInsertedItems: any;
  getListWithRemovedItems: any;
} 