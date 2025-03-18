/**
 * Gets first position where to move element (respecting the fact that some element will be sooner or later
 * taken out of the dataset in order to move them).
 *
 * @param {Array<number>} movedIndexes Sequence of moved indexes for certain axis.
 * @param {number} finalIndex Final place where to move rows.
 * @param {number} numberOfIndexes Number of indexes in a dataset.
 * @returns {number} Index informing where to move the first element.
 */
function getMoveLine(movedIndexes, finalIndex, numberOfIndexes) {
  const notMovedElements = Array.from(Array(numberOfIndexes).keys())
    .filter(index => movedIndexes.includes(index) === false);

  if (finalIndex === 0) {
    return notMovedElements[finalIndex] ?? 0; // Moving before the first dataset's element.
  }

  return notMovedElements[finalIndex - 1] + 1; // Moving before another element.
}

/**
 * Gets initially calculated move positions.
 *
 * @param {Array<number>} movedIndexes Sequence of moved indexes for certain axis.
 * @param {number} moveLine Final place where to move rows.
 * @returns {Array<{from: number, to: number}>} Initially calculated move positions.
 */
function getInitiallyCalculatedMoves(movedIndexes, moveLine) {
  const moves = [];

  movedIndexes.forEach((movedIndex) => {
    const move = {
      from: movedIndex,
      to: moveLine,
    };

    moves.forEach((previouslyMovedIndex) => {
      const isMovingFromEndToStart = previouslyMovedIndex.from > previouslyMovedIndex.to;
      const isMovingElementBefore = previouslyMovedIndex.to <= move.from;
      const isMovingAfterElement = previouslyMovedIndex.from > move.from;

      if (isMovingAfterElement && isMovingElementBefore && isMovingFromEndToStart) {
        move.from += 1;
      }
    });

    // Moved element from right to left (or bottom to top).
    if (move.from >= moveLine) {
      moveLine += 1;
    }

    moves.push(move);
  });

  return moves;
}

/**
 * Gets finally calculated move positions (after adjusting).
 *
 * @param {Array<{from: number, to: number}>} moves Initially calculated move positions.
 * @returns {Array<{from: number, to: number}>} Finally calculated move positions (after adjusting).
 */
function adjustedCalculatedMoves(moves) {
  moves.forEach((move, index) => {
    const nextMoved = moves.slice(index + 1);

    nextMoved.forEach((nextMovedIndex) => {
      const isMovingFromStartToEnd = nextMovedIndex.from < nextMovedIndex.to;

      if (nextMovedIndex.from > move.from && isMovingFromStartToEnd) {
        nextMovedIndex.from -= 1;
      }
    });
  });

  return moves;
}

/**
 * Get list of move positions.
 *
 * @param {Array<number>} movedIndexes Sequence of moved indexes for certain axis.
 * @param {number} finalIndex Final place where to move rows.
 * @param {number} numberOfIndexes Number of indexes in a dataset.
 * @returns {Array<{from: number, to: number}>}
 */
export function getMoves(movedIndexes, finalIndex, numberOfIndexes) {
  const moves = getInitiallyCalculatedMoves(movedIndexes, getMoveLine(movedIndexes, finalIndex, numberOfIndexes));

  return adjustedCalculatedMoves(moves);
}
