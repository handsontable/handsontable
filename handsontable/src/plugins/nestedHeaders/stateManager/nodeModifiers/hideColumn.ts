import { toSingleLine } from '../../../../helpers/templateLiteralTag';
import { throwWithCause } from '../../../../helpers/errors';
import type TreeNode from '../../../../utils/dataStructures/tree';

interface NestedHeaderNodeData {
  crossHiddenColumns: number[];
  colspan: number;
  collapsible?: boolean;
  isHidden?: boolean;
  [key: string]: unknown;
}

/**
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @param {number} gridColumnIndex The visual column index that triggers the node modification.
 */
export function hideColumn(nodeToProcess: TreeNode, gridColumnIndex: number) {
  if (!Number.isInteger(gridColumnIndex)) {
    throwWithCause('The passed gridColumnIndex argument has invalid type.');
  }

  if (nodeToProcess.childs.length > 0) {
    throwWithCause(toSingleLine`The passed node is not the last node on the tree. Only for\x20
the last node, the hide column modification can be applied.`);
  }

  const {
    crossHiddenColumns,
  } = nodeToProcess.data as NestedHeaderNodeData;

  if (crossHiddenColumns.includes(gridColumnIndex)) {
    return;
  }

  let isCollapsibleNode = false;

  nodeToProcess.walkUp((node: TreeNode) => {
    const { data: { collapsible } } = node as { data: Record<string, unknown> };

    if (collapsible) {
      isCollapsibleNode = true;

      return false; // Cancel tree traversing
    }
  });

  if (isCollapsibleNode) {
    return;
  }

  nodeToProcess.walkUp((node: TreeNode) => {
    const { data } = node as { data: NestedHeaderNodeData };

    data.crossHiddenColumns.push(gridColumnIndex);

    if (data.colspan > 1) {
      data.colspan -= 1;
    } else {
      data.isHidden = true;
    }
  });
}
