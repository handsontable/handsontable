import { arrayEach } from '../../../../helpers/array';
import { collapseNode } from './collapse';
import {
  getFirstChildProperty,
  isNodeReflectsFirstChildColspan,
  traverseHiddenNodeColumnIndexes,
} from './utils/tree';
import type TreeNode from '../../../../utils/dataStructures/tree';
import type { HeaderNodeData } from '../headersTree';

/**
 * Expanding a node is a process where the processing node is expanded to
 * its original colspan width.
 *
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @returns {object} Returns an object with properties.
 */
export function expandNode(
  nodeToProcess: { data: HeaderNodeData, childs: TreeNode[] }
): { rollbackModification: Function, affectedColumns: unknown[], colspanCompensation: number } {
  const { data: nodeData, childs: nodeChilds } = nodeToProcess;

  if (!nodeData.isCollapsed || nodeData.isHidden || nodeData.origColspan <= 1) {
    return {
      rollbackModification: () => {},
      affectedColumns: [],
      colspanCompensation: 0,
    };
  }

  type NodeWithData = { data: Record<string, unknown>, childs: { data: Record<string, unknown> }[] };
  const isNodeReflected = isNodeReflectsFirstChildColspan(nodeToProcess as NodeWithData);

  if (isNodeReflected) {
    return expandNode(nodeChilds[0] as unknown as { data: HeaderNodeData, childs: TreeNode[] });
  }

  nodeData.isCollapsed = false;

  const allLeavesExceptMostLeft = nodeChilds.slice(1);
  const affectedColumns = new Set();
  let colspanCompensation = 0;

  if (allLeavesExceptMostLeft.length > 0) {
    arrayEach(allLeavesExceptMostLeft, (node) => {
      const treeNode = node as TreeNode;

      // Restore original state of the collapsed headers.
      const treeNodeData = treeNode.data as HeaderNodeData;

      treeNode.replaceTreeWith(treeNodeData.clonedTree as TreeNode);
      treeNodeData.clonedTree = null;

      const leafData = treeNodeData;

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
    colspanCompensation = origColspan - colspan;

    // Add column to "affected" started from 1.
    for (let i = 1; i < origColspan; i++) {
      affectedColumns.add(columnIndex + i);
    }
  }

  (nodeToProcess as unknown as TreeNode).walkUp((node: TreeNode) => {
    const data = node.data as HeaderNodeData;

    data.colspan += colspanCompensation;

    if (data.colspan >= data.origColspan) {
      data.colspan = data.origColspan;
      data.isCollapsed = false;

    } else if (isNodeReflectsFirstChildColspan(node as NodeWithData)) {
      type NodeWithChilds = { childs: { data: Record<string, unknown> }[] };
      data.isCollapsed = getFirstChildProperty(node as NodeWithChilds, 'isCollapsed') as boolean;
    }
  });

  return {
    rollbackModification: () => collapseNode(nodeToProcess),
    affectedColumns: Array.from(affectedColumns),
    colspanCompensation,
  };
}
