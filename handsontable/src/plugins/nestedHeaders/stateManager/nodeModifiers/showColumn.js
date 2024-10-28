import { toSingleLine } from '../../../../helpers/templateLiteralTag';

/**
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @param {number} gridColumnIndex The visual column index that triggers the node modification.
 *                                 The index can be between the root node column index and
 *                                 column index plus node colspan length.
 */
export function showColumn(nodeToProcess, gridColumnIndex) {
  if (!Number.isInteger(gridColumnIndex)) {
    throw new Error('The passed gridColumnIndex argument has invalid type.');
  }

  if (nodeToProcess.childs.length > 0) {
    throw new Error(toSingleLine`The passed node is not the last node on the tree. Only for\x20
the last node, the show column modification can be applied.`);
  }

  const {
    crossHiddenColumns,
  } = nodeToProcess.data;

  if (!crossHiddenColumns.includes(gridColumnIndex)) {
    return;
  }

  let isCollapsibleNode = false;

  nodeToProcess.walkUp((node) => {
    const { data: { collapsible } } = node;

    if (collapsible) {
      isCollapsibleNode = true;

      return false; // Cancel tree traversing
    }
  });

  // TODO: When the node is collapsible do not show the column. Currently collapsible headers
  // does not work with hidden columns (hidden index map types).
  if (isCollapsibleNode) {
    return;
  }

  nodeToProcess.walkUp((node) => {
    const { data } = node;

    data.crossHiddenColumns.splice(data.crossHiddenColumns.indexOf(gridColumnIndex), 1);

    if (!data.isHidden && data.colspan < data.origColspan) {
      data.colspan += 1;
    }

    data.isHidden = false;
  });
}
