import { arrayEach } from '../../../../helpers/array';
import { expandNode } from './expand';
import {
  getFirstChildProperty,
  isNodeReflectsFirstChildColspan,
  traverseHiddenNodeColumnIndexes,
} from './utils/tree';
import type TreeNode from '../../../../utils/dataStructures/tree';

/**
 * Collapsing a node is a process where the processing node is collapsed
 * to the colspan width of the first child.
 *
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @returns {object} Returns an object with properties.
 */
export function collapseNode(nodeToProcess: { data: Record<string, unknown>, childs: TreeNode[] }): { rollbackModification: Function, affectedColumns: unknown[], colspanCompensation: number } {
  const { data: nodeData, childs: nodeChilds } = nodeToProcess;

  if (nodeData.isCollapsed || nodeData.isHidden || (nodeData.origColspan as number) <= 1) {
    return {
      rollbackModification: () => {},
      affectedColumns: [],
      colspanCompensation: 0,
    };
  }

  const isNodeReflected = isNodeReflectsFirstChildColspan(nodeToProcess as { data: Record<string, unknown>, childs: { data: Record<string, unknown> }[] });

  if (isNodeReflected) {
    return collapseNode(nodeChilds[0] as { data: Record<string, unknown>, childs: TreeNode[] });
  }

  nodeData.isCollapsed = true;

  const allLeavesExceptMostLeft = nodeChilds.slice(1);
  const affectedColumns = new Set();

  if (allLeavesExceptMostLeft.length > 0) {
    arrayEach(allLeavesExceptMostLeft, (node) => {
      const treeNode = node as TreeNode;

      traverseHiddenNodeColumnIndexes(treeNode, (gridColumnIndex: number) => {
        affectedColumns.add(gridColumnIndex);
      });

      // Clone the tree to preserve original tree state after header expanding.
      treeNode.data.clonedTree = treeNode.cloneTree();

      // Hide all leaves except the first leaf on the left.
      treeNode.walkDown(({ data }: { data: Record<string, unknown> }) => {
        data.isHidden = true;
      });
    });

  } else {
    const {
      origColspan,
      columnIndex,
    } = nodeData;

    // Add column to "affected" started from 1.
    for (let i = 1; i < (origColspan as number); i++) {
      const gridColumnIndex = (columnIndex as number) + i;

      affectedColumns.add(gridColumnIndex);
    }
  }

  // Calculate by how many colspan it needs to reduce the headings.
  const colspanCompensation = (nodeData.colspan as number) - ((getFirstChildProperty(nodeToProcess as { childs: { data: Record<string, unknown> }[] }, 'colspan') as number | undefined) ?? 1);

  (nodeToProcess as TreeNode).walkUp((node: TreeNode) => {
    const { data } = node;

    (data.colspan as number) -= colspanCompensation;

    if ((data.colspan as number) <= 1) {
      data.colspan = 1;
      data.isCollapsed = true;

    } else if (isNodeReflectsFirstChildColspan(node as { data: Record<string, unknown>, childs: { data: Record<string, unknown> }[] })) {
      data.isCollapsed = getFirstChildProperty(node as { childs: { data: Record<string, unknown> }[] }, 'isCollapsed');
    }
  });

  return {
    rollbackModification: () => expandNode(nodeToProcess),
    affectedColumns: Array.from(affectedColumns),
    colspanCompensation,
  };
}
