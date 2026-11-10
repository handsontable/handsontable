/**
 * One move of a block of engine lines: `count` lines from `start` go in front of the line at `target`,
 * as `moveRows()`/`moveColumns()` take it.
 */
export interface OrderMove {
  start: number;
  count: number;
  target: number;
}

/**
 * How much a reorder sent as moves may cost, in cells moved: the number of moves times the cells the sheet
 * holds (lines on the moved axis times lines on the other axis). The engine rewrites the sheet on every move,
 * so a move costs about as much as the sheet is large. Measured on HyperFormula 3.3.0 (Node, one formula per
 * cell, the worst-case move of the last line to the front): 60 to 660 ns per cell and move, with outliers of
 * up to 3 us in long batches (250 moves of 2,000 x 4 took 5.0 s, 50 moves of 10,000 x 4 took 5.9 s). At this
 * budget a 2,000 x 4 sheet takes up to 25 moves (23 ms), a 10,000 x 4 sheet 5 (26 to 71 ms), and a
 * 5,000 x 30 or a 10,000 x 20 sheet 1 (11 ms and 24 ms). Past it the reorder is sent as one order.
 */
export const ORDER_MOVES_BUDGET = 200000;

/**
 * Plans the moves that put each engine line at its new place, or returns `null` when they would cost more
 * than the budget allows.
 *
 * Walking the places from the start, the line due at a place is moved up to it together with the lines that
 * follow it in both the current and the new order, so an order a few moves produced (a `manualRowMove` array,
 * a user's drags) takes about as many moves again. The lines in front of the place are settled, so a block
 * always moves up and its `target` is the place itself.
 *
 * @param {number[]} engineOrder The new place of each engine line, a permutation of `0..n - 1`.
 * @param {number} [lineSize=1] How many cells one line holds (the sheet's size along the other axis).
 * @param {number} [budget=ORDER_MOVES_BUDGET] The most the moves may cost (moves times cells).
 * @returns {OrderMove[]|null}
 */
export function planOrderMoves(
  engineOrder: number[],
  lineSize: number = 1,
  budget: number = ORDER_MOVES_BUDGET,
): OrderMove[] | null {
  const size = engineOrder.length;
  const maxMoves = size === 0 ? 0 : Math.floor(budget / (size * Math.max(lineSize, 1)));
  const lineAtPlace = new Array<number>(size);
  const moves: OrderMove[] = [];
  let currentLines = Array.from({ length: size }, (_, place) => place);
  let place = 0;

  engineOrder.forEach((newPlace, line) => {
    lineAtPlace[newPlace] = line;
  });

  while (place < size) {
    const from = currentLines.indexOf(lineAtPlace[place], place);
    let count = 1;

    while (place + count < size && currentLines[from + count] === lineAtPlace[place + count]) {
      count += 1;
    }

    if (from !== place) {
      if (moves.length === maxMoves) {
        return null;
      }

      moves.push({ start: from, count, target: place });
      currentLines = currentLines.slice(0, place).concat(
        currentLines.slice(from, from + count),
        currentLines.slice(place, from),
        currentLines.slice(from + count),
      );
    }

    place += count;
  }

  return moves;
}
