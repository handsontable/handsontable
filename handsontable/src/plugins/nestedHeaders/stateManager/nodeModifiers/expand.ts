import { arrayEach } from '../../../../helpers/array';
import { collapseNode } from './collapse';
import {
  getFirstChildProperty,
  isNodeReflectsFirstChildColspan,
  traverseHiddenNodeColumnIndexes,
} from './utils/tree';
import type TreeNode from '../../../../utils/dataStructures/tree';

/**
 * Expanding a node is a process where the processing node is expanded to
 * its original colspan width.
 *
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @returns {object} Returns an object with properties.
 */
export function expandNode(nodeToProcess: { data: Record<string, unknown>, childs: TreeNode[] }): { rollbackModification: Function, affectedColumns: unknown[], colspanCompensation: number } {
  const { data: nodeData, childs: nodeChilds } = nodeToProcess;

  if (!nodeData.isCollapsed || nodeData.isHidden || (nodeData.origColspan as number) <= 1) {
    return {
      rollbackModification: () => {},
      affectedColumns: [],
      colspanCompensation: 0,
    };
  }

  const isNodeReflected = isNodeReflectsFirstChildColspan(nodeToProcess as { data: Record<string, unknown>, childs: { data: Record<string, unknown> }[] });

  if (isNodeReflected) {
    return expandNode(nodeChilds[0] as { data: Record<string, unknown>, childs: TreeNode[] });
  }

  nodeData.isCollapsed = false;

  const allLeavesExceptMostLeft = nodeChilds.slice(1);
  const affectedColumns = new Set();
  let colspanCompensation = 0;

  if (allLeavesExceptMostLeft.length > 0) {
    arrayEach(allLeavesExceptMostLeft, (node) => {
      const treeNode = node as TreeNode;

      // Restore original state of the collapsed headers.
      treeNode.replaceTreeWith(treeNode.data.clonedTree);
      treeNode.data.clonedTree = null;

      const leafData = treeNode.data;

      // Calculate by how many colspan it needs to increase the headings.
      colspanCompensation += leafData.colspan;

      traverseHiddenNodeColumnIndexes(treeNode, (gridColumnIndex: number) => {
        affectedColumns.add(gridColumnIndex);
      });
    });

  } else {
    const {
      colspan,
      origColspan,
      columnIndex,
    } = nodeData;

    // In a case when the node doesn't have any children restore the colspan width.
    colspanCompensation = (origColspan as number) - (colspan as number);

    // Add column to "affected" started from 1.
    for (let i = 1; i < (origColspan as number); i++) {
      affectedColumns.add((columnIndex as number) + i);
    }
  }

  (nodeToProcess as TreeNode).walkUp((node: TreeNode) => {
    const { data } = node;

    (data.colspan as number) += colspanCompensation;

    if ((data.colspan as number) >= (data.origColspan as number)) {
      data.colspan = data.origColspan;
      data.isCollapsed = false;

    } else if (isNodeReflectsFirstChildColspan(node as { data: Record<string, unknown>, childs: { data: Record<string, unknown> }[] })) {
      data.isCollapsed = getFirstChildProperty(node as { childs: { data: Record<string, unknown> }[] }, 'isCollapsed');
    }
  });

  return {
    rollbackModification: () => collapseNode(nodeToProcess),
    affectedColumns: Array.from(affectedColumns),
    colspanCompensation,
  };
}
