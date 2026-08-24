import { getDecreasedIndexes, getIncreasedIndexes } from './actionsOnIndexes';
import { throwWithCause } from '../../../helpers/errors';
import {
  getListWithInsertedItems as sequenceStrategyInsert,
  getListWithRemovedItems as sequenceStrategyRemove
} from './indexesSequence';
import {
  getListWithInsertedItems as physicalStrategyInsert,
  getListWithRemovedItems as physicalStrategyRemove
} from './physicallyIndexed';

const alterStrategies = new Map([
  ['indexesSequence', {
    getListWithInsertedItems: sequenceStrategyInsert,
    getListWithRemovedItems: sequenceStrategyRemove
  }],
  ['physicallyIndexed', {
    getListWithInsertedItems: physicalStrategyInsert,
    getListWithRemovedItems: physicalStrategyRemove
  }],
]);

const alterUtilsFactory = (indexationStrategy: string) => {
  if (alterStrategies.has(indexationStrategy) === false) {
    throwWithCause(`Alter strategy with ID '${indexationStrategy}' does not exist.`);
  }

  return alterStrategies.get(indexationStrategy);
};

export {
  getDecreasedIndexes,
  getIncreasedIndexes,
  alterUtilsFactory
};
