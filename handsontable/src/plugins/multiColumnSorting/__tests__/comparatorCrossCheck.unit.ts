// The barrel first. `sortService` sits in a module cycle, and a deep import that reaches `registry` or
// `engine` before the barrel leaves every re-export `undefined` - see `../../columnSorting/AGENTS.md`.
import { sort } from 'handsontable/plugins/columnSorting/sortService';
import {
  positionComparator,
  rootComparator,
} from 'handsontable/plugins/multiColumnSorting/rootComparator';
// Imported for the side effect: the plugin module registers the built-in root comparator the engine
// leg sorts with.
import 'handsontable/plugins/multiColumnSorting/multiColumnSorting';

// `rootComparator()` and `positionComparator()` are two implementations of one semantic, and only the
// second one runs by default. The k-deep `DO_NOT_SWAP` tie-break walk is where they can drift apart, so
// the input is generated rather than listed, over k = 1 to 3.
//
// Three legs have to agree on every trial:
//
// 1. the tuple comparator called pairwise, which is the path this replaced;
// 2. the same tuples through `sort()`, which extracts the keys once for every column whose compare
//    function has the seam;
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

// Deliberately small, so ties are common: a tie is what sends the comparison on to the next sorted
// column, which is the part only a multi-column sort has.
const VALUE_POOL: unknown[] = [
  null, undefined, '', ' ', 0, 1, -3, 2.5, '1', '10', '2.5', '3abc', 'alpha', 'Alpha', true, false, NaN,
];

const DATE_POOL: unknown[] = [
  '2020-01-15', '2019-12-31', '2020-01-15', '2021-06-01', '', null, undefined, 'not a date',
];

const ROW_COUNT = 16;

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
function sortThreeWays(
  columnValues: unknown[][], sortingOrders: string[], columnMetas: Record<string, unknown>[]
) {
  const buildTuples = () => columnValues[0].map(
    (_, rowIndex) => [rowIndex, ...columnValues.map(values => values[rowIndex])]
  );

  const pairwiseTuples = buildTuples();

  pairwiseTuples.sort(rootComparator(sortingOrders, columnMetas));

  const engineTuples = buildTuples();

  sort(engineTuples, 'multiColumnSorting', sortingOrders, columnMetas);

  const positions = columnValues[0].map((_, position) => position);

  positions.sort(positionComparator(sortingOrders, columnMetas, columnValues));

  return {
    pairwise: pairwiseTuples.map(tuple => tuple[0]),
    engine: engineTuples.map(tuple => tuple[0]),
    positions,
  };
}

/**
 * Reports a trial whose three legs disagree.
 *
 * @param {Array} mismatches The list collecting the disagreements.
 * @param {string} label What was sorted.
 * @param {Array} columnValues The trial's column values.
 * @param {object} results The three permutations.
 */
function collectMismatch(
  mismatches: string[],
  label: string,
  columnValues: unknown[][],
  results: { pairwise: unknown[], engine: unknown[], positions: number[] }
) {
  const { pairwise, engine, positions } = results;

  if (JSON.stringify(engine) !== JSON.stringify(pairwise) ||
      JSON.stringify(positions) !== JSON.stringify(pairwise)) {
    mismatches.push(
      `${label}: columns ${JSON.stringify(columnValues)} -> pairwise ${JSON.stringify(pairwise)}, ` +
      `engine ${JSON.stringify(engine)}, positions ${JSON.stringify(positions)}`
    );
  }
}

describe('multiColumnSorting comparator cross-check', () => {
  it.each([[1], [2], [3]])('should answer identically on all three paths for %i sorted column(s)', (k) => {
    const random = createRandom(24680 + k);
    const mismatches: string[] = [];

    for (let trial = 0; trial < 50; trial += 1) {
      [true, false].forEach((sortEmptyCells) => {
        const columnValues: unknown[][] = [];
        const columnMetas: Record<string, unknown>[] = [];
        const sortingOrders: string[] = [];

        for (let column = 0; column < k; column += 1) {
          columnValues.push(buildColumn(random, VALUE_POOL));
          columnMetas.push({ multiColumnSorting: { sortEmptyCells } });
          sortingOrders.push(random() < 0.5 ? 'asc' : 'desc');
        }

        collectMismatch(
          mismatches,
          `trial ${trial} k=${k} ${sortingOrders.join()}/sortEmptyCells=${sortEmptyCells}`,
          columnValues,
          sortThreeWays(columnValues, sortingOrders, columnMetas)
        );
      });
    }

    expect(mismatches).toEqual([]);
  });

  it('should answer identically when a prepared column is mixed with a memoizing one', () => {
    // The one combination the rule "a compare function must never both memoize and prepare" is about:
    // column 0 takes the prepared path, column 1 is a `date` column whose compare function keeps its own
    // per-run parse cache and stays pairwise.
    const random = createRandom(13579);
    const mismatches: string[] = [];

    for (let trial = 0; trial < 50; trial += 1) {
      [true, false].forEach((sortEmptyCells) => {
        ['asc', 'desc'].forEach((secondOrder) => {
          const columnValues = [buildColumn(random, VALUE_POOL), buildColumn(random, DATE_POOL)];
          const columnMetas: Record<string, unknown>[] = [
            { multiColumnSorting: { sortEmptyCells } },
            { type: 'date', multiColumnSorting: { sortEmptyCells } },
          ];

          collectMismatch(
            mismatches,
            `trial ${trial} prepared+date asc,${secondOrder}/sortEmptyCells=${sortEmptyCells}`,
            columnValues,
            sortThreeWays(columnValues, ['asc', secondOrder], columnMetas)
          );
        });
      });
    }

    expect(mismatches).toEqual([]);
  });

  it('should answer identically when a prepared, a memoizing and a user column sort together', () => {
    const random = createRandom(97531);
    const mismatches: string[] = [];
    const userCompareFunction = (value: unknown, nextValue: unknown) => {
      const length = String(value).length;
      const nextLength = String(nextValue).length;

      if (length === nextLength) {
        return 0;
      }

      return length < nextLength ? -1 : 1;
    };

    for (let trial = 0; trial < 50; trial += 1) {
      [true, false].forEach((sortEmptyCells) => {
        const columnValues = [
          buildColumn(random, VALUE_POOL),
          buildColumn(random, DATE_POOL),
          buildColumn(random, VALUE_POOL),
        ];
        const columnMetas: Record<string, unknown>[] = [
          { multiColumnSorting: { sortEmptyCells } },
          { type: 'date', multiColumnSorting: { sortEmptyCells } },
          { multiColumnSorting: { sortEmptyCells, compareFunctionFactory: () => userCompareFunction } },
        ];

        collectMismatch(
          mismatches,
          `trial ${trial} prepared+date+user/sortEmptyCells=${sortEmptyCells}`,
          columnValues,
          sortThreeWays(columnValues, ['asc', 'desc', 'asc'], columnMetas)
        );
      });
    }

    expect(mismatches).toEqual([]);
  });

  it('should really reorder the rows, ties included, so an identity agreement proves nothing', () => {
    const columnValues = [[2, 1, 2, 1], [5, 9, 3, 9]];
    const columnMetas: Record<string, unknown>[] = [
      { multiColumnSorting: {} },
      { multiColumnSorting: {} },
    ];
    const { pairwise, engine, positions } = sortThreeWays(columnValues, ['asc', 'desc'], columnMetas);

    // Column 0 ascending puts the two 1s first, and column 1 descending breaks both ties.
    expect(pairwise).toEqual([1, 3, 0, 2]);
    expect(engine).toEqual([1, 3, 0, 2]);
    expect(positions).toEqual([1, 3, 0, 2]);
  });
});
