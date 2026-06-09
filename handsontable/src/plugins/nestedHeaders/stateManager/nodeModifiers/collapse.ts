import { arrayEach } from '../../../../helpers/array';
import { expandNode } from './expand';
import {
  getFirstChildProperty,
  isNodeReflectsFirstChildColspan,
  traverseHiddenNodeColumnIndexes,
} from './utils/tree';
import type TreeNode from '../../../../utils/dataStructures/tree';
import type { HeaderNodeData } from '../headersTree';

/**
 * Collapsing a node is a process where the processing node is collapsed
 * to the colspan width of the first child.
 *
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @returns {object} Returns an object with properties.
 */
export function collapseNode(
  nodeToProcess: { data: HeaderNodeData, childs: TreeNode[] }
): { rollbackModification: Function, affectedColumns: unknown[], colspanCompensation: number } {
  const { data: nodeData, childs: nodeChilds } = nodeToProcess;

  if (nodeData.isCollapsed || nodeData.isHidden || nodeData.origColspan <= 1) {
    return {
      rollbackModification: () => {},
      affectedColumns: [],
      colspanCompensation: 0,
    };
  }

  type NodeWithData = { data: Record<string, unknown>, childs: { data: Record<string, unknown> }[] };
  const isNodeReflected = isNodeReflectsFirstChildColspan(nodeToProcess as NodeWithData);

  if (isNodeReflected) {
    return collapseNode(nodeChilds[0] as unknown as { data: HeaderNodeData, childs: TreeNode[] });
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
    for (let i = 1; i < origColspan; i++) {
      const gridColumnIndex = columnIndex + i;

      affectedColumns.add(gridColumnIndex);
    }
  }

  // Calculate by how many colspan it needs to reduce the headings.
  type NodeWithChilds = { childs: { data: Record<string, unknown> }[] };
  const firstChildColspan = getFirstChildProperty(
    nodeToProcess as NodeWithChilds, 'colspan'
  ) as number | undefined;
  const colspanCompensation = nodeData.colspan - (firstChildColspan ?? 1);

  (nodeToProcess as unknown as TreeNode).walkUp((node: TreeNode) => {
    const data = node.data as HeaderNodeData;

    data.colspan -= colspanCompensation;

    if (data.colspan <= 1) {
      data.colspan = 1;
      data.isCollapsed = true;

    } else if (isNodeReflectsFirstChildColspan(node as NodeWithData)) {
      data.isCollapsed = getFirstChildProperty(node as NodeWithChilds, 'isCollapsed') as boolean;
    }
  });

  return {
    rollbackModification: () => expandNode(nodeToProcess),
    affectedColumns: Array.from(affectedColumns),
    colspanCompensation,
  };
}
