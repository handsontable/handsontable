import { arrayEach } from '../../../helpers/array';
import { HEADER_DEFAULT_SETTINGS } from './constants';

export function colspanGenerator(headerRoots) {
  const colspanMatrix = [];

  generateNodesColspan(colspanMatrix, headerRoots);

  return colspanMatrix;
}

function generateNodesColspan(colspanMatrix, nodes, headerLayer = 0) {
  if (nodes.length === 0) {
    return;
  }

  const nodeChilds = [];

  colspanMatrix.push([]);

  arrayEach(nodes, (node) => {
    const { data: nodeData, childs } = node;
    const colspanHeaderLayer = colspanMatrix[headerLayer];

    nodeChilds.push(...childs);
    colspanHeaderLayer.push({ ...nodeData });

    if (nodeData.colspan > 1) {
      for (let i = 0; i < nodeData.colspan - 1; i++) {
        colspanHeaderLayer.push({
          ...HEADER_DEFAULT_SETTINGS,
          hidden: true,
        });
      }
    }
  });

  headerLayer += 1;
  generateNodesColspan(colspanMatrix, nodeChilds, headerLayer);
}
