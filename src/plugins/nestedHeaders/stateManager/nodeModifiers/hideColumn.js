/**
 * @param {TreeNode} nodeToProcess A tree node to process.
 */
export function hideColumn(nodeToProcess) {
  const { columnIndex: processedColumnIndex } = nodeToProcess.data;

  nodeToProcess.walkUp((node) => {
    const { data } = node;

    if (data.colspan > 1) {
      data.colspan -= 1;

      if (processedColumnIndex === data.columnIndex + data.offset) {
        data.offset += 1;
      }

    } else {
      data.isHidden = true;
    }
  });
}
