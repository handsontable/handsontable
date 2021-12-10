import { arrayEach } from '../../../../helpers/array';
import { expandNode } from './expand';
import {
  getFirstChildProperty,
  isNodeReflectsFirstChildColspan,
  traverseHiddenNodeColumnIndexes,
} from './utils/tree';

/**
 * Collapsing a node is a process where the processing node is collapsed
 * to the colspan width of the first child. All node children, except the
 * first one, are hidden. To prevent losing a current state of node children
 * on the right, all nodes are cloned (and restored while expanding), and
 * only then original nodes are modified (hidden in this case).
 *
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @returns {object} Returns an object with properties:
 *                    - rollbackModification: The function that rollbacks
 *                      the tree to the previous state.
 *                    - affectedColumns: The list of the visual column
 *                      indexes which are affected. That list is passed
 *                      to the hiddens column logic.
 *                    - colspanCompensation: The number of colspan by
 *                      which the processed node colspan was reduced.
 */
export function collapseNode(nodeToProcess) {
  const { data: nodeData, childs: nodeChilds } = nodeToProcess;

  if (nodeData.isCollapsed || nodeData.isHidden || nodeData.origColspan <= 1) {
    return {
      rollbackModification: () => {},
      affectedColumns: [],
      colspanCompensation: 0,
    };
  }

  const isNodeReflected = isNodeReflectsFirstChildColspan(nodeToProcess);

  if (isNodeReflected) {
    return collapseNode(nodeChilds[0]);
  }

  nodeData.isCollapsed = true;

  const allLeavesExceptMostLeft = nodeChilds.slice(1);
  const affectedColumns = new Set();

  if (allLeavesExceptMostLeft.length > 0) {
    arrayEach(allLeavesExceptMostLeft, (node) => {
      traverseHiddenNodeColumnIndexes(node, (gridColumnIndex) => {
        affectedColumns.add(gridColumnIndex);
      });

      // Clone the tree to preserve original tree state after header expanding.
      node.data.clonedTree = node.cloneTree();

      // Hide all leaves except the first leaf on the left (on headers context hide all
      // headers on the right).
      node.walkDown(({ data }) => {
        data.isHidden = true;
      });
    });

  } else {
    const {
      origColspan,
      columnIndex,
    } = nodeData;

    // Add column to "affected" started from 1. The header without children can not be
    // collapsed so the first have to be visible (untouched).
    for (let i = 1; i < origColspan; i++) {
      const gridColumnIndex = columnIndex + i;

      affectedColumns.add(gridColumnIndex);
    }
  }

  // Calculate by how many colspan it needs to reduce the headings to match them to
  // the first child colspan width.
  const colspanCompensation = nodeData.colspan - (getFirstChildProperty(nodeToProcess, 'colspan') ?? 1);

  nodeToProcess.walkUp((node) => {
    const { data } = node;

    data.colspan -= colspanCompensation;

    if (data.colspan <= 1) {
      data.colspan = 1;
      data.isCollapsed = true;

    } else if (isNodeReflectsFirstChildColspan(node)) {
      data.isCollapsed = getFirstChildProperty(node, 'isCollapsed');
    }
  });

  return {
    rollbackModification: () => expandNode(nodeToProcess),
    affectedColumns: Array.from(affectedColumns),
    colspanCompensation,
  };
}
