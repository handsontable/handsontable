// The barrel first, exactly as `columnSorting.ts` does. `sortService` sits in a module cycle, and a
// deep import that reaches `registry` or `engine` before the barrel leaves every re-export
// `undefined` - see this plugin's AGENTS.md.
import { sort } from 'handsontable/plugins/columnSorting/sortService';
import { positionComparator, rootComparator } from 'handsontable/plugins/columnSorting/rootComparator';
// Imported for the side effect: the plugin module registers the built-in root comparator the engine
// leg sorts with.
import 'handsontable/plugins/columnSorting/columnSorting';

// `rootComparator()` and `positionComparator()` are two implementations of one semantic, and only the
// second one runs by default. The enumerated cases elsewhere pin today's values; this pins tomorrow's,
// by generating the input instead of listing it.
//
// Three legs have to agree on every trial:
//
// 1. the tuple comparator called pairwise, which is the path this replaced;
// 2. the same tuples through `sort()`, which extracts the keys once when the compare function has the
//    seam;
// 3. the positions sort against parallel value arrays, which is what a default sort takes today.
//
// The generator is seeded and written here, so a failing trial reproduces exactly.

const MINSTD_MULTIPLIER = 16807;
const MINSTD_MODULUS = 2147483647;

/**
 * A seeded pseudo-random generator (MINSTD). `Math.random()` would make a failure unreproducible, and
 * the arithmetic stays in doubles because this package's lint rules ban bitwise operators.
 *
 * @param {number} seed The seed.
 * @returns {Function} A generator returning a float in `[0, 1)`.
 */
function createRandom(seed: number): () => number {
  let state = seed % MINSTD_MODULUS;

  if (state <= 0) {
    state += MINSTD_MODULUS - 1;
  }

  return () => {
    state = (state * MINSTD_MULTIPLIER) % MINSTD_MODULUS;

    return (state - 1) / (MINSTD_MODULUS - 1);
  };
}

// Empties, numbers, numeric strings that are not numbers, plain strings differing only in case,
// booleans, `NaN` and a date object - every branch of the default compare function, and the mixed
// pairs the numeric one treats differently.
const VALUE_POOL: unknown[] = [
  null, undefined, '', ' ', 0, 1, -3, 2.5, 10, '1', '10', '2.5', '0x10', '3abc',
  'alpha', 'Alpha', 'zeta', 'Delta', true, false, NaN, new Date(2020, 0, 1),
];

const DATE_POOL: unknown[] = [
  '2020-01-15', '2019-12-31', '2020-01-15', '2021-06-01', '', null, undefined, 'not a date', '2018-03-09',
];

const ROW_COUNT = 14;

/**
 * Builds one trial's column values.
 *
 * @param {Function} random The seeded generator.
 * @param {Array} pool The values to pick from.
 * @returns {Array} One value per row.
 */
function buildColumn(random: () => number, pool: unknown[]): unknown[] {
  const values: unknown[] = [];

  for (let row = 0; row < ROW_COUNT; row += 1) {
    values.push(pool[Math.floor(random() * pool.length)]);
  }

  return values;
}

/**
 * Sorts one trial three ways and reports the permutation each one produced.
 *
 * @param {Array} columnValues One array of cell values per sorted column, indexed by position.
 * @param {Array} sortingOrders Sort orders, one per sorted column.
 * @param {Array} columnMetas Column meta objects, one per sorted column.
 * @returns {object} The three permutations.
 */
function sortThreeWays(columnValues: unknown[][], sortingOrders: string[], columnMetas: unknown[]) {
  const buildTuples = () => columnValues[0].map(
    (_, rowIndex) => [rowIndex, ...columnValues.map(values => values[rowIndex])]
  );

  const pairwiseTuples = buildTuples();

  pairwiseTuples.sort(rootComparator(sortingOrders, columnMetas));

  const engineTuples = buildTuples();

  sort(engineTuples, 'columnSorting', sortingOrders, columnMetas);

  const positions = columnValues[0].map((_, position) => position);

  positions.sort(positionComparator(sortingOrders, columnMetas, columnValues));

  return {
    pairwise: pairwiseTuples.map(tuple => tuple[0]),
    engine: engineTuples.map(tuple => tuple[0]),
    positions,
  };
}

describe('columnSorting comparator cross-check', () => {
  it.each([
    ['the default compare function', VALUE_POOL, {}],
    ['a `numeric` column', VALUE_POOL, { type: 'numeric' }],
    ['a `date` column, whose compare function memoizes its parses', DATE_POOL, { type: 'date' }],
  ])('should answer identically on all three paths for %s', (_label, pool, typeMeta) => {
    const random = createRandom(987654321);
    const mismatches: string[] = [];

    for (let trial = 0; trial < 60; trial += 1) {
      [true, false].forEach((sortEmptyCells) => {
        ['asc', 'desc'].forEach((sortOrder) => {
          const columnValues = [buildColumn(random, pool)];
          const columnMetas = [{ ...typeMeta, columnSorting: { sortEmptyCells } }];
          const { pairwise, engine, positions } = sortThreeWays(columnValues, [sortOrder], columnMetas);

          if (JSON.stringify(engine) !== JSON.stringify(pairwise) ||
              JSON.stringify(positions) !== JSON.stringify(pairwise)) {
            mismatches.push(
              `trial ${trial} ${sortOrder}/sortEmptyCells=${sortEmptyCells}: ` +
              `values ${JSON.stringify(columnValues[0])} -> pairwise ${JSON.stringify(pairwise)}, ` +
              `engine ${JSON.stringify(engine)}, positions ${JSON.stringify(positions)}`
            );
          }
        });
      });
    }

    expect(mismatches).toEqual([]);
  });

  it('should answer identically on all three paths for a user-supplied compare function', () => {
    const random = createRandom(123456789);
    const mismatches: string[] = [];
    // Outside the seam, so all three paths must reach it pairwise.
    const userCompareFunction = (value: unknown, nextValue: unknown) => {
      const length = String(value).length;
      const nextLength = String(nextValue).length;

      if (length === nextLength) {
        return 0;
      }

      return length < nextLength ? -1 : 1;
    };

    for (let trial = 0; trial < 60; trial += 1) {
      ['asc', 'desc'].forEach((sortOrder) => {
        const columnValues = [buildColumn(random, VALUE_POOL)];
        const columnMetas = [{
          columnSorting: { sortEmptyCells: trial % 2 === 0, compareFunctionFactory: () => userCompareFunction },
        }];
        const { pairwise, engine, positions } = sortThreeWays(columnValues, [sortOrder], columnMetas);

        if (JSON.stringify(engine) !== JSON.stringify(pairwise) ||
            JSON.stringify(positions) !== JSON.stringify(pairwise)) {
          mismatches.push(
            `trial ${trial} ${sortOrder}: values ${JSON.stringify(columnValues[0])} -> ` +
            `pairwise ${JSON.stringify(pairwise)}, engine ${JSON.stringify(engine)}, ` +
            `positions ${JSON.stringify(positions)}`
          );
        }
      });
    }

    expect(mismatches).toEqual([]);
  });

  it('should really reorder the rows, so an agreement on three identity permutations proves nothing', () => {
    const columnValues = [[3, 1, 2]];
    const columnMetas = [{ type: 'numeric', columnSorting: {} }];
    const { pairwise, engine, positions } = sortThreeWays(columnValues, ['asc'], columnMetas);

    expect(pairwise).toEqual([1, 2, 0]);
    expect(engine).toEqual([1, 2, 0]);
    expect(positions).toEqual([1, 2, 0]);
  });
});
