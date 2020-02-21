import { arrayEach } from '../../../helpers/array';
import { HEADER_DEFAULT_SETTINGS } from './constants';
import { TRAVERSAL_BF } from '../../../utils/dataStructures/tree';

export function colspanGenerator(headerRoots) {
  const colspanMatrix = [];

  arrayEach(headerRoots, (rootNode) => {
    rootNode.walk((node) => {
      const { data: { colspan, label, hidden, headerLevel } } = node;
      const colspanHeaderLayer = createNestedArrayIfNecessary(colspanMatrix, headerLevel);

      colspanHeaderLayer.push({
        colspan,
        label,
        hidden,
      });

      if (colspan > 1) {
        for (let i = 0; i < colspan - 1; i++) {
          colspanHeaderLayer.push({
            ...HEADER_DEFAULT_SETTINGS,
            hidden: true,
          });
        }
      }
    }, TRAVERSAL_BF);
  });

  return colspanMatrix;
}

function createNestedArrayIfNecessary(array, index) {
  let subArray;

  if (Array.isArray(array[index])) {
    subArray = array[index];
  } else {
    subArray = [];
    array[index] = subArray;
  }

  return subArray;
}
