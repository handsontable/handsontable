import { toSingleLine } from '../../../../helpers/templateLiteralTag';

/**
 * @param {TreeNode} nodeToProcess A tree node to process.
 * @param {number} gridColumnIndex The visual column index that triggers the node modification.
 *                                 The index can be between the root node column index and
 *                                 column index plus node colspan length.
 */
export function hideColumn(nodeToProcess, gridColumnIndex) {
  if (!Number.isInteger(gridColumnIndex)) {
    throw new Error('The passed gridColumnIndex argument has invalid type.');
  }

  if (nodeToProcess.childs.length > 0) {
    throw new Error(toSingleLine`The passed node is not the last node on the tree. Only for\x20
the last node, the hide column modification can be applied.`);
  }

  const {
    isHidden,
    crossHiddenColumns,
  } = nodeToProcess.data;

  if (crossHiddenColumns.includes(gridColumnIndex)) {
    return;
  }

  // console.log('hideColumn', nodeToProcess, gridColumnIndex);

  nodeToProcess.walkUp((node) => {
    const { data } = node;

    data.crossHiddenColumns.push(gridColumnIndex);

    if (data.colspan > 1) {
      data.colspan -= 1;
    } else {
      data.isHidden = true;
    }
  });
}
