import { getDecreasedIndexes, getIncreasedIndexes } from './actionsOnIndexes';
import { getListWithInsertedItems as visualStrategyInsert, getListWithRemovedItems as visualStrategyRemove } from './visuallyIndexed';
import { getListWithInsertedItems as physicalStrategyInsert, getListWithRemovedItems as physicalStrategyRemove } from './physicallyIndexed';

const alterStrategies = new Map([
  ['visually', { getListWithInsertedItems: visualStrategyInsert, getListWithRemovedItems: visualStrategyRemove }],
  ['physically', { getListWithInsertedItems: physicalStrategyInsert, getListWithRemovedItems: physicalStrategyRemove }],
]);

const alterUtilsFactory = (indexationStrategy) => {
  if (alterStrategies.has(indexationStrategy) === false) {
    throw new Error(`Alter strategy for '${indexationStrategy}' indexed map does not exist.`);
  }

  return alterStrategies.get(indexationStrategy);
};

export {
  getDecreasedIndexes,
  getIncreasedIndexes,
  alterUtilsFactory
};
