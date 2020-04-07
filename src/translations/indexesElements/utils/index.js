import { getDecreasedIndexes, getIncreasedIndexes } from './actionsOnIndexes';
import { getListWithInsertedItems as sequenceStrategyInsert, getListWithRemovedItems as sequenceStrategyRemove } from './indexesSequence';
import { getListWithInsertedItems as physicalStrategyInsert, getListWithRemovedItems as physicalStrategyRemove } from './physicallyIndexedElement';

const alterStrategies = new Map([
  ['INDEXES_SEQUENCE', { getListWithInsertedItems: sequenceStrategyInsert, getListWithRemovedItems: sequenceStrategyRemove }],
  ['PHYSICALLY_INDEXED', { getListWithInsertedItems: physicalStrategyInsert, getListWithRemovedItems: physicalStrategyRemove }],
]);

const alterUtilsFactory = (indexedElementStrategy) => {
  if (alterStrategies.has(indexedElementStrategy) === false) {
    throw new Error(`Alter strategy with name '${indexedElementStrategy}' for an indexed element does not exist.`);
  }

  return alterStrategies.get(indexedElementStrategy);
};

export {
  getDecreasedIndexes,
  getIncreasedIndexes,
  alterUtilsFactory
};
