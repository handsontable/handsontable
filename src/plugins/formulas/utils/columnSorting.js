/**
 * Translate the provided index sequence arrays to a list of row moves, to be passed to the HF API.
 *
 * @param {number[]} currentOrder Current order of row indexes.
 * @param {number[]} nextOrder Next order of row indexes.
 * @returns {{ baseIndex: number, targetIndex: number }[]} Array of objects containing the information for the move actions.
 */
export default function sequenceToMoveOperations(currentOrder, nextOrder) {
  const moveElement = function(array, baseIndex, targetIndex) {
    array.splice(targetIndex, 0, array.splice(baseIndex, 1)[0]);
  };
  const workingOrder = currentOrder.slice();
  const moveList = [];
  let identicalToNext = false;

  while (!identicalToNext) {
    for (let i = 0; i < workingOrder.length; i++) {
      if (workingOrder[i] !== nextOrder[i]) {
        moveList.push({
          baseIndex: i,
          targetIndex: nextOrder.indexOf(workingOrder[i])
        });

        moveElement(workingOrder, i, nextOrder.indexOf(workingOrder[i]));
      }
    }

    if (JSON.stringify(workingOrder) === JSON.stringify(nextOrder)) {
      identicalToNext = true;
    }
  }

  return moveList.filter(move => move.baseIndex !== move.targetIndex);
}
