import { arrayEach } from '../../../../helpers/array';
import { collapseNode } from './collapse';
import {
  getFirstChildProperty,
  isNodeReflectsFirstChildColspan,
  traverseHiddenNodeColumnIndexes,
} from './utils/tree';

/**
 * Expanding a node is a process where the processing node is expanded to
 * its original colspan width. To restore an original state of all node
 * children on the right, the modified nodes are replaced with the cloned
 * nodes (they were cloned while collapsing).
 *
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @returns {object} Returns an object with properties:
 *                    - rollbackModification: The function that rollbacks
 *                      the tree to the previous state.
 *                    - affectedColumns: The list of the visual column
 *                      indexes which are affected. That list is passed
 *                      to the hiddens column logic.
 *                    - colspanCompensation: The number of colspan by
 *                      which the processed node colspan was increased.
 */
export function expandNode(nodeToProcess) {
  const { data: nodeData, childs: nodeChilds } = nodeToProcess;

  if (!nodeData.isCollapsed || nodeData.isHidden || nodeData.origColspan <= 1) {
    return {
      rollbackModification: () => {},
      affectedColumns: [],
      colspanCompensation: 0,
    };
  }

  const isNodeReflected = isNodeReflectsFirstChildColspan(nodeToProcess);

  if (isNodeReflected) {
    return expandNode(nodeChilds[0]);
  }

  nodeData.isCollapsed = false;

  const allLeavesExceptMostLeft = nodeChilds.slice(1);
  const affectedColumns = new Set();
  let colspanCompensation = 0;

  if (allLeavesExceptMostLeft.length > 0) {
    arrayEach(allLeavesExceptMostLeft, (node) => {
      // Restore original state of the collapsed headers.
      node.replaceTreeWith(node.data.clonedTree);
      node.data.clonedTree = null;

      const leafData = node.data;

      // Calculate by how many colspan it needs to increase the headings to match them to
      // the colspan width of all its children.
      colspanCompensation += leafData.colspan;

      traverseHiddenNodeColumnIndexes(node, (gridColumnIndex) => {
        affectedColumns.add(gridColumnIndex);
      });
    });

  } else {
    const {
      colspan,
      origColspan,
      columnIndex,
    } = nodeData;

    // In a case when the node doesn't have any children restore the colspan width to
    // its original state.
    colspanCompensation = origColspan - colspan;

    // Add column to "affected" started from 1. The header without children can not be
    // collapsed so the first column is already visible and we shouldn't touch it.
    for (let i = 1; i < origColspan; i++) {
      affectedColumns.add(columnIndex + i);
    }
  }

  nodeToProcess.walkUp((node) => {
    const { data } = node;

    data.colspan += colspanCompensation;

    if (data.colspan >= data.origColspan) {
      data.colspan = data.origColspan;
      data.isCollapsed = false;

    } else if (isNodeReflectsFirstChildColspan(node)) {
      data.isCollapsed = getFirstChildProperty(node, 'isCollapsed');
    }
  });

  return {
    rollbackModification: () => collapseNode(nodeToProcess),
    affectedColumns: Array.from(affectedColumns),
    colspanCompensation,
  };
}
