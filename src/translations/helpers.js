import { arrayMap, arrayReduce } from '../helpers/array';

// eslint-disable-next-line import/prefer-default-export
export function buildIndexToValueList(listLength, mappingFn) {
  return arrayMap(new Array(listLength), (value, physicalIndex) => mappingFn(value, physicalIndex));
}

export function getIndexListByCondition(valueList, condition) {
  return arrayReduce(valueList, (indexList, value, physicalIndex) => {
    if (condition(value, physicalIndex)) {
      return indexList.concat(physicalIndex);
    }

    return indexList;
  }, []);
}
