import { getDecreasedIndexes, getIncreasedIndexes } from './actionsOnIndexes';
import {
  getListWithInsertedItems as sequenceStrategyInsert,
  getListWithRemovedItems as sequenceStrategyRemove
} from './indexesSequence';
import {
  getListWithInsertedItems as physicalStrategyInsert,
  getListWithRemovedItems as physicalStrategyRemove
} from './physicallyIndexed';
import { AlterStrategy, AlterStrategyMapEntry } from './types';

const alterStrategies = new Map<string, AlterStrategyMapEntry>([
  ['indexesSequence', {
    getListWithInsertedItems: sequenceStrategyInsert,
    getListWithRemovedItems: sequenceStrategyRemove
  }],
  ['physicallyIndexed', {
    getListWithInsertedItems: physicalStrategyInsert,
    getListWithRemovedItems: physicalStrategyRemove
  }],
]);

const alterUtilsFactory = (indexationStrategy: string): AlterStrategyMapEntry => {
  if (alterStrategies.has(indexationStrategy) === false) {
    throw new Error(`Alter strategy with ID '${indexationStrategy}' does not exist.`);
  }

  return alterStrategies.get(indexationStrategy) as AlterStrategyMapEntry;
};

export {
  getDecreasedIndexes,
  getIncreasedIndexes,
  alterUtilsFactory
};
