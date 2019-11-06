import { getDecreasedIndexes, getIncreasedIndexes } from './actionsOnIndexes';
import { getListWithInsertedItems as visualStrategyInsert, getListWithRemovedItems as visualStrategyRemove } from './visuallyIndexed';
import { getListWithInsertedItems as physicalStrategyInsert, getListWithRemovedItems as physicalStrategyRemove } from './physicallyIndexed';

const alterUtilsFactory = (indexationStrategy) => {
  if (indexationStrategy === 'visually') {
    return {
      getListWithInsertedItems: visualStrategyInsert,
      getListWithRemovedItems: visualStrategyRemove
    };
  }

  return {
    getListWithInsertedItems: physicalStrategyInsert,
    getListWithRemovedItems: physicalStrategyRemove
  };
};

export {
  getDecreasedIndexes,
  getIncreasedIndexes,
  alterUtilsFactory
};
