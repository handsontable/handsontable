/**
 * @param {TreeNode} nodeToProcess A tree node to process.
 */
export function showColumn(nodeToProcess) {
  const { columnIndex: processedColumnIndex } = nodeToProcess.data;

  nodeToProcess.walkUp((node) => {
    const { data } = node;

    if (!data.isHidden && data.colspan < data.origColspan) {
      data.colspan += 1;
    }

    data.offset = Math.min(data.offset, processedColumnIndex - data.columnIndex);
    data.isHidden = false;
  });
}
