/**
 * Translates an initial order of indexes (starting with the first position) and translates it into a series of moves.
 *
 * @param {number[]} order Initial order of indexes.
 * @returns {{from: number, to: number}[]} Array of objects defining the separate moves.
 */
export function getMovesFromInitialOrder(order) {
  const moved = [];
  const moveList = [];

  for (let i = order.length - 1; i >= 0; i--) {
    const sourceIndex = moved.length ? order[i] + calculateIndexOffset(moved, order[i]) : order[i];

    if (sourceIndex !== i) {
      moveList.push({
        from: sourceIndex,
        to: 0
      });

      moved.push(order[i]);
    }
  }

  return moveList;
}

/**
 * Translates an array of moved elements and their final position into a series of separate moves and performns them.
 *
 * @param {number[]} movedIndexes Array of indexes of the elements to be moved.
 * @param {number} finalIndex Final index of the operation (the index on which the changes will be staying after the
 * action's finished).
 * @param {number} lastIndex The last possible index of the table.
 * @param {Function} isItPossibleToMoveFunction The function used to check if the move's possible.
 * @param {Function} moveFunction The function to be used to perform a move action.
 * @returns {boolean} `true` if the move was performed, `false` otherwise.
 */
export function moveElementsIntoFinalIndex(
  movedIndexes,
  finalIndex,
  lastIndex,
  isItPossibleToMoveFunction,
  moveFunction
) {
  const consecutiveIndexSets = splitIndexesIntoConsecutiveParts(movedIndexes);
  const movedColumnsCount = movedIndexes.length;
  let movePerformed = false;

  /*
    Because of the differences between moving and setting an order on the HF's side, we have to translate the
    array of moved elements into separate moves.
    The logic below moves all the moved elements to the end of the table (in the correct order) and then moves a chunk
    of all of them into `finalIndex` (so the worst-case complexity of the algorithm should equal O(n + 1), where n is
    the number of moved elements.)
 */

  if (consecutiveIndexSets.length === 1) {
    const onlySet = consecutiveIndexSets[0];
    const destination = finalIndex < onlySet[0] ? finalIndex : finalIndex + onlySet.length;

    if (isItPossibleToMoveFunction(onlySet[0], onlySet.length, destination)) {
      moveFunction(onlySet[0], onlySet.length, destination);

      movePerformed = true;
    }

  } else {
    const alreadyMoved = [];
    const consecutiveIndexSetsSortedDescending = [...consecutiveIndexSets].sort((setA, setB) => {
      return setA[0] > setB[0] ? -1 : 1;
    });

    consecutiveIndexSetsSortedDescending.forEach((columnsToBeMoved) => {
      const columnCount = columnsToBeMoved.length;
      const orderOffset = alreadyMoved.reduce((lowerInIndexCount, movedElement) => {
        const indexOfAlreadyMovedElement = consecutiveIndexSets.indexOf(movedElement);
        const indexOfElement = consecutiveIndexSets.indexOf(columnsToBeMoved);

        return lowerInIndexCount + ((indexOfElement < indexOfAlreadyMovedElement) * movedElement.length);
      }, 0);

      if (isItPossibleToMoveFunction(columnsToBeMoved[0], columnCount, lastIndex - orderOffset)) {
        moveFunction(columnsToBeMoved[0], columnCount, lastIndex - orderOffset);

        alreadyMoved.push(columnsToBeMoved);
      }
    });

    if (isItPossibleToMoveFunction(lastIndex - movedColumnsCount, movedColumnsCount, finalIndex)) {
      moveFunction(lastIndex - movedColumnsCount, movedColumnsCount, finalIndex);

      movePerformed = true;
    }
  }

  return movePerformed;
}

/**
 * Splits an array of indexes into separate arrays of consecutive indexes.
 *
 * @private
 * @param {number[]} indexes Array of indexes.
 * @returns {number[][]} Array of arrays of consecutive indexes.
 */
function splitIndexesIntoConsecutiveParts(indexes) {
  const consecutiveParts = [];

  indexes.forEach((tableIndex, listIndex, indexesList) => {
    if (listIndex === 0 || tableIndex !== indexesList[listIndex - 1] + 1) {
      consecutiveParts.push([tableIndex]);

    } else {
      consecutiveParts[consecutiveParts.length - 1].push(tableIndex);
    }
  });

  return consecutiveParts;
}

/**
 * Calculates the index offset caused by moving indexes lower than the index in question.
 *
 * @private
 * @param {number[]} alreadyMoved Array of already moved indexes.
 * @param {number} currentIndex Current index in question.
 * @returns {number} The offset.
 */
function calculateIndexOffset(alreadyMoved, currentIndex) {
  let offset = 0;

  alreadyMoved.forEach((movedIndex) => {
    if (movedIndex > currentIndex) {
      offset += 1;
    }
  });

  return offset;
}
