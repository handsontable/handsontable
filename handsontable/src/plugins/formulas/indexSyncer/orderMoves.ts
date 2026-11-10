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
 * How many moved lines a reorder sent as moves may cost: the number of moves times the number of lines
 * the sheet holds on that axis. The engine rewrites the sheet's references on every move, so a move costs
 * about as much as the sheet is long (measured on HyperFormula 3: 1,991 moves of a 2,000-row sheet took
 * 4.6 s, against one order of a few milliseconds). Past this budget the reorder is sent as one order.
 */
export const ORDER_MOVES_BUDGET = 500000;

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
 * @param {number} [budget=ORDER_MOVES_BUDGET] The most the moves may cost (moves times lines).
 * @returns {OrderMove[]|null}
 */
export function planOrderMoves(engineOrder: number[], budget: number = ORDER_MOVES_BUDGET): OrderMove[] | null {
  const size = engineOrder.length;
  const maxMoves = size === 0 ? 0 : Math.floor(budget / size);
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
