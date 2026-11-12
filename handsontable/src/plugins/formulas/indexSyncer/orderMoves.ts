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
 * The most moves a reorder is sent as. HyperFormula slows down sharply past a few dozen moves in one batch
 * (measured on 3.3.0: 40 moves of a 2,000 x 4 sheet took 21 ms, 50 took 216 to 988 ms; 30 moves of 10,000 x 4
 * took 178 ms, 50 took 5.9 s), so a reorder that needs more goes as one order.
 */
export const ORDER_MOVES_MAX = 30;

/**
 * The most lines one move may carry. HyperFormula adds the lines a move carries in one call that spreads them
 * as arguments, so a block of about 100,000 lines can overflow the stack inside `moveRows()` (`RangeError`, seen
 * on 3.3.0 through the grid, depending on how deep the call stack already is), and a batch of moves is not rolled
 * back when one throws.
 */
export const ORDER_MOVE_MAX_LINES = 10000;

/**
 * How many moves a reorder is always sent as, however tall the axis is. Moves are only ever sent right after a
 * full write of the sheet (init, a reload whose data changed, a hold released over one), and a move costs
 * about a sixtieth of that write on HyperFormula 3.3.0 (a one-line move of 10,000 x 4 took 5 ms after a 210 ms
 * write, of 200,000 x 2 31 ms after 1,962 ms, of 10,000 x 20 17 ms after 1,178 ms). So a handful of moves adds
 * at most about a tenth to the reload, and a one-row `manualRowMove` array or a short drag on a tall grid never
 * falls back to the order that gives `#REF!`.
 */
export const ORDER_MOVES_WITHIN_WRITE = 4;

/**
 * How many lines a move may shift for the price of one line changing place in one order. A move rewrites the
 * lines it shifts, about 0.05 to 0.2 us per cell on HyperFormula 3.3.0; one order rewrites every line that
 * changes place, about 4 to 8 us per cell, and more per line as more lines change place (100,000 x 2 with a
 * formula per row: 6,001 lines in 72 ms, 60,001 in 2.9 s; 200,000 x 2, 100,001 lines in 8.0 s). Both scale with
 * the other axis, so the comparison does not depend on it. The ratio is set below the measured one (20 to 100),
 * so a reorder goes as moves only where they are clearly the cheaper call.
 */
export const LINES_PER_CHANGED_LINE = 40;

/**
 * Plans the moves that put each engine line at its new place, or returns `null` when more than `maxMoves`
 * moves are needed.
 *
 * Walking the places from the start, the line due at a place and the lines that follow it in both the current
 * and the new order form a block, and either that block moves up to the place, or the lines between the place
 * and the block move down behind it: both end in the same order, and the move that carries fewer lines is
 * planned. So an order a few drags produced (a `manualRowMove` array, a user's drags) takes about as many moves
 * again, and a line dragged down a long way is moved as that line, not as the block it passed. A plan that
 * needs a move of more than `ORDER_MOVE_MAX_LINES` lines gives up.
 *
 * @param {number[]} engineOrder The new place of each engine line, a permutation of `0..n - 1`.
 * @param {number} [maxMoves=ORDER_MOVES_MAX] The most moves to plan.
 * @returns {OrderMove[]|null}
 */
export function planOrderMoves(engineOrder: number[], maxMoves: number = ORDER_MOVES_MAX): OrderMove[] | null {
  const size = engineOrder.length;
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

      const passed = from - place;
      const carried = Math.min(count, passed);

      if (carried > ORDER_MOVE_MAX_LINES) {
        return null;
      }

      moves.push(count <= passed
        ? { start: from, count, target: place }
        : { start: place, count: passed, target: from + count });
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

/**
 * Plans the moves for a reorder, or returns `null` when one order (`setRowOrder()`/`setColumnOrder()`) is to
 * be sent instead. A move costs about what a pass over the sheet costs, whatever lines it carries, so it is
 * priced against two things it follows or replaces: the full write of the sheet every reorder sent as moves
 * comes right after (`ORDER_MOVES_WITHIN_WRITE` moves fit in it), and one order, which rewrites every line
 * that changes place (`LINES_PER_CHANGED_LINE` axis lengths per changed line). So up to
 * `ORDER_MOVES_WITHIN_WRITE` plus `LINES_PER_CHANGED_LINE` times the changed lines over the axis length moves
 * go as moves, never past `ORDER_MOVES_MAX`.
 *
 * @param {number[]} engineOrder The new place of each engine line, a permutation of `0..n - 1`.
 * @returns {OrderMove[]|null}
 */
export function chooseOrderMoves(engineOrder: number[]): OrderMove[] | null {
  const size = engineOrder.length;
  let changedLines = 0;

  engineOrder.forEach((place, line) => {
    if (place !== line) {
      changedLines += 1;
    }
  });

  if (size === 0 || changedLines === 0) {
    return [];
  }

  const maxMoves = Math.min(
    ORDER_MOVES_MAX,
    ORDER_MOVES_WITHIN_WRITE + Math.floor((LINES_PER_CHANGED_LINE * changedLines) / size),
  );

  return planOrderMoves(engineOrder, maxMoves);
}
