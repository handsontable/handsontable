import { toSingleLine } from '../../../../helpers/templateLiteralTag';
import { throwWithCause } from '../../../../helpers/errors';
import type TreeNode from '../../../../utils/dataStructures/tree';

/**
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @param {number} gridColumnIndex The visual column index that triggers the node modification.
 */
export function showColumn(nodeToProcess: TreeNode, gridColumnIndex: number) {
  if (!Number.isInteger(gridColumnIndex)) {
    throwWithCause('The passed gridColumnIndex argument has invalid type.');
  }

  if (nodeToProcess.childs.length > 0) {
    throwWithCause(toSingleLine`The passed node is not the last node on the tree. Only for\x20
the last node, the show column modification can be applied.`);
  }

  const {
    crossHiddenColumns,
  } = nodeToProcess.data as Record<string, unknown>;

  if (!(crossHiddenColumns as number[]).includes(gridColumnIndex)) {
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
    const { data } = node as { data: Record<string, unknown> };

    (data.crossHiddenColumns as number[]).splice((data.crossHiddenColumns as number[]).indexOf(gridColumnIndex), 1);

    if (!data.isHidden && (data.colspan as number) < (data.origColspan as number)) {
      data.colspan = (data.colspan as number) + 1;
    }

    data.isHidden = false;
  });
}
