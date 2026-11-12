import {
  planOrderMoves,
  chooseOrderMoves,
  ORDER_MOVES_MAX,
  ORDER_MOVE_MAX_LINES,
} from '../../indexSyncer/orderMoves';

/**
 * Applies moves the way `moveRows()` takes them and returns the lines in their new order.
 *
 * @param {number} size Number of lines.
 * @param {Array} moves The moves.
 * @returns {number[]}
 */
function applyMoves(size, moves) {
  let lines = Array.from({ length: size }, (_, index) => index);

  moves.forEach(({ start, count, target }) => {
    const block = lines.slice(start, start + count);
    const rest = lines.slice(0, start).concat(lines.slice(start + count));
    const insertAt = target > start ? target - count : target;

    lines = rest.slice(0, insertAt).concat(block, rest.slice(insertAt));
  });

  return lines;
}

/**
 * Turns "line at each place" into the engine order the planner takes (the new place of each line).
 *
 * @param {number[]} lineAtPlace The line each place shows.
 * @returns {number[]}
 */
function toEngineOrder(lineAtPlace) {
  const order = new Array(lineAtPlace.length);

  lineAtPlace.forEach((line, place) => {
    order[line] = place;
  });

  return order;
}

describe('planOrderMoves', () => {
  it('plans nothing for the identity', () => {
    expect(planOrderMoves([0, 1, 2, 3])).toEqual([]);
    expect(planOrderMoves([])).toEqual([]);
  });

  it('moves a block that keeps its order in one move, carrying the fewer lines', () => {
    const lineAtPlace = [2, 3, 4, 0, 1];
    const moves = planOrderMoves(toEngineOrder(lineAtPlace));

    // Lines 0 and 1 go down behind 2, 3 and 4, rather than those three going up.
    expect(moves).toEqual([{ start: 0, count: 2, target: 5 }]);
    expect(applyMoves(5, moves)).toEqual(lineAtPlace);
  });

  it('moves a single line up', () => {
    const lineAtPlace = [0, 2, 1, 3];
    const moves = planOrderMoves(toEngineOrder(lineAtPlace));

    expect(moves).toEqual([{ start: 2, count: 1, target: 1 }]);
    expect(applyMoves(4, moves)).toEqual(lineAtPlace);
  });

  it('reaches any permutation of a short axis', () => {
    const permutations = [[]];

    // Every permutation of 5 lines.
    for (let size = 1; size <= 5; size += 1) {
      const next = [];

      permutations.forEach((permutation) => {
        for (let position = 0; position <= permutation.length; position += 1) {
          next.push(permutation.slice(0, position).concat(size - 1, permutation.slice(position)));
        }
      });
      permutations.splice(0, permutations.length, ...next);
    }

    permutations.forEach((lineAtPlace) => {
      const moves = planOrderMoves(toEngineOrder(lineAtPlace));

      expect(applyMoves(5, moves)).toEqual(lineAtPlace);
      // Every move is one `moveRows()` takes: the target is outside the block and its end.
      moves.forEach(({ start, count, target }) => {
        expect(target < start || target > start + count).toBe(true);
      });
    });
  });

  it('plans as many moves as a few drags made on a long axis', () => {
    const size = 10000;
    let lineAtPlace = Array.from({ length: size }, (_, index) => index);

    // Three drags: a block to the top, a line to the middle, a block to the end.
    lineAtPlace = applyMoves(size, [{ start: 9000, count: 3, target: 0 }]);
    lineAtPlace = lineAtPlace.filter(line => line !== 42);
    lineAtPlace.splice(5000, 0, 42);
    lineAtPlace = lineAtPlace.slice(10).concat(lineAtPlace.slice(0, 10));

    const moves = planOrderMoves(toEngineOrder(lineAtPlace));

    expect(moves.length).toBeLessThanOrEqual(6);
    expect(applyMoves(size, moves)).toEqual(lineAtPlace);
  });

  it('gives up past the most moves it may plan', () => {
    const size = 2000;
    // Every line takes another line's place in a scrambled order: no two lines stay neighbors.
    const lineAtPlace = Array.from({ length: size }, (_, place) => (place * 7) % size);

    expect(planOrderMoves(toEngineOrder(lineAtPlace), ORDER_MOVES_MAX)).toBeNull();
    expect(planOrderMoves(toEngineOrder(lineAtPlace), Infinity).length).toBeGreaterThan(ORDER_MOVES_MAX);
  });
});

/**
 * The grid order after one-row drags: the line `(drag + 1) * gap` moved to place `drag`, for each drag.
 *
 * @param {number} size Number of lines.
 * @param {number} drags Number of drags.
 * @param {number} gap Lines between the dragged lines.
 * @returns {number[]} The line at each place.
 */
function afterDrags(size, drags, gap) {
  const lineAtPlace = Array.from({ length: size }, (_, index) => index);

  for (let drag = 0; drag < drags; drag += 1) {
    const [line] = lineAtPlace.splice((drag + 1) * gap, 1);

    lineAtPlace.splice(drag, 0, line);
  }

  return lineAtPlace;
}

describe('chooseOrderMoves', () => {
  it('sends moves where one order would shift far more lines than the moves cost', () => {
    // 100,000 rows, six drags 10,000 rows apart: 60,001 lines change place (2.9 s as one order, 65 ms as moves).
    const lineAtPlace = afterDrags(100000, 6, 10000);
    const moves = chooseOrderMoves(toEngineOrder(lineAtPlace));

    expect(moves.length).toBe(6);
    expect(applyMoves(100000, moves)).toEqual(lineAtPlace);
  });

  it('sends a single drag on a very long axis as a move', () => {
    const lineAtPlace = afterDrags(600000, 1, 300000);

    expect(chooseOrderMoves(toEngineOrder(lineAtPlace)).length).toBe(1);
  });

  it('sends one order where the moves would cost more than the order', () => {
    // 2,000 rows, 20 drags 10 rows apart: 20 moves of the whole sheet against 220 lines that change place.
    expect(chooseOrderMoves(toEngineOrder(afterDrags(2000, 20, 10)))).toBeNull();
  });

  it('sends one order past the most moves a batch takes without slowing down', () => {
    expect(chooseOrderMoves(toEngineOrder(afterDrags(100000, ORDER_MOVES_MAX + 1, 1000)))).toBeNull();
  });

  it('moves a line dragged down a long way as that line, not as the block it passed', () => {
    // Row 0 dragged to the middle of 200,000 rows. Moving the 100,000 rows it passed up in one block makes
    // HyperFormula's `moveRows()` overflow the stack.
    const lineAtPlace = Array.from({ length: 200000 }, (_, index) => index);
    const [line] = lineAtPlace.splice(0, 1);

    lineAtPlace.splice(100000, 0, line);

    const moves = chooseOrderMoves(toEngineOrder(lineAtPlace));

    expect(moves).toEqual([{ start: 0, count: 1, target: 100001 }]);
    expect(applyMoves(200000, moves)).toEqual(lineAtPlace);
  });

  it('sends one order when a move would carry more lines than a move can take', () => {
    // Two halves of 100,000 rows swapped: either way, one block of 100,000 rows has to move.
    const half = Array.from({ length: 100000 }, (_, index) => index);
    const lineAtPlace = half.map(line => line + 100000).concat(half);

    expect(planOrderMoves(toEngineOrder(lineAtPlace), Infinity)).toBeNull();
    expect(ORDER_MOVE_MAX_LINES).toBeLessThan(100000);
  });

  it('sends a few moves however tall the axis is', () => {
    // One row nudged by one place on 100,000 rows: two lines change place, and one move carries one line.
    const lineAtPlace = Array.from({ length: 100000 }, (_, index) => index);

    lineAtPlace.splice(50000, 2, 50001, 50000);

    expect(chooseOrderMoves(toEngineOrder(lineAtPlace))).toEqual([{ start: 50001, count: 1, target: 50000 }]);
  });
});
