import { planOrderMoves, ORDER_MOVES_BUDGET } from '../../indexSyncer/orderMoves';

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

  it('moves a block that keeps its order in one move', () => {
    const lineAtPlace = [2, 3, 4, 0, 1];
    const moves = planOrderMoves(toEngineOrder(lineAtPlace));

    expect(moves).toEqual([{ start: 2, count: 3, target: 0 }]);
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
      moves.forEach(({ start, target }) => {
        expect(target).toBeLessThan(start);
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

  it('gives up when the moves would cost more than the budget', () => {
    const size = 2000;
    // Every line takes another line's place in a scrambled order: no two lines stay neighbors.
    const lineAtPlace = Array.from({ length: size }, (_, place) => (place * 7) % size);

    expect(planOrderMoves(toEngineOrder(lineAtPlace))).toBeNull();
    expect(planOrderMoves(toEngineOrder(lineAtPlace), 1, Infinity).length).toBeGreaterThan(ORDER_MOVES_BUDGET / size);
  });

  it('weighs the lines of the other axis into the cost of a move', () => {
    const size = 10000;
    // Two drags: a block to the top, a line to the middle.
    let lineAtPlace = applyMoves(size, [{ start: 9000, count: 3, target: 0 }]);

    lineAtPlace = lineAtPlace.filter(line => line !== 42);
    lineAtPlace.splice(5000, 0, 42);

    expect(planOrderMoves(toEngineOrder(lineAtPlace), 1)).not.toBeNull();
    // Twenty columns make each move cost the whole budget.
    expect(planOrderMoves(toEngineOrder(lineAtPlace), 20)).toBeNull();
  });
});
