import { test, expect } from '../fixtures/test';
import { EditorTrimmedRowPage } from '../fixtures/pages/EditorTrimmedRowPage';

/**
 * The selection shapes a trim can strand, enumerated rather than sampled.
 *
 * `selection-trimmed-row.spec.ts` pins the MECHANISM one case at a time - the record test, the
 * corner test, the permutation recapture. This file pins the DECISION TABLE instead: every shape a
 * user can select, with headers and without, restored from an export or not, against a trim that
 * shortens the grid. A run of defects in this area were all narrowing errors in that table which no
 * single-shape case could see, because each of them exercised the one shape it was written for.
 *
 * Two outcomes are asserted, and which one a shape gets is the whole rule:
 *
 * - DROPPED: the selection named particular records and a trim left it addressing something else.
 *   Keeping it lets a paste write to the wrong record; clamping it does the same, quieter.
 * - CLAMPED: the selection spans a whole axis by construction - a full column, a full row,
 *   select-all - so its far corner tracks the grid rather than naming a record. A shorter grid
 *   means a shorter selection, and the user keeps what they were working in.
 *
 * Every case also asserts that a paste through whatever survived appends nothing, because that is
 * the corruption the repair exists to stop and it is what both outcomes have to deliver.
 */
interface ShapeCase {
  readonly name: string;
  readonly select: (grid: EditorTrimmedRowPage) => Promise<void>;
  readonly trim: number[];
  readonly outcome: 'dropped' | 'kept' | 'clamped';
}

const SHAPES: ShapeCase[] = [
  {
    name: 'a single cell a trim left untouched',
    select: grid => grid.selectCell(2, 0),
    trim: [0],
    outcome: 'kept',
  },
  {
    name: 'a single cell a trim stranded past the last row',
    select: grid => grid.selectCell(3, 0),
    trim: [0, 1, 3],
    outcome: 'dropped',
  },
  {
    name: 'a single cell whose own record a trim removed',
    select: grid => grid.selectCell(1, 0),
    trim: [1],
    outcome: 'dropped',
  },
  {
    name: 'a cell range a trim left wholly in range',
    select: grid => grid.selectRanges([[0, 0, 1, 0]]),
    trim: [4],
    outcome: 'kept',
  },
  {
    name: 'a cell range whose far corner a trim stranded',
    select: grid => grid.selectRanges([[0, 0, 4, 0]]),
    trim: [2, 3, 4],
    outcome: 'dropped',
  },
  {
    name: 'a full column',
    select: grid => grid.selectWholeColumn(0),
    trim: [0],
    outcome: 'clamped',
  },
  {
    name: 'a full row whose own record survives',
    select: grid => grid.selectWholeRow(3),
    trim: [4],
    outcome: 'kept',
  },
  {
    name: 'a full row whose own record a trim removed',
    select: grid => grid.selectWholeRow(3),
    trim: [0, 1, 3],
    outcome: 'dropped',
  },
  {
    name: 'a select-all',
    select: grid => grid.selectEverything(),
    trim: [0],
    outcome: 'clamped',
  },
];

/**
 * The ways a selection can reach the trim. `none` is the user's own selection; the other two are
 * the stash-deselect-restore trip that `dialog` and `emptyDataState` perform, taken at the two
 * levels it can break at.
 *
 * `export` drives the Selection API directly, handing the exported object straight back.
 * `dialog` drives the PLUGIN, which builds its own argument - and a plugin that rebuilds the object
 * field by field can drop part of it while the API-level trip stays green. That is not
 * hypothetical: the `dialog` restore lost the grid-span flags this way, turning every clamp below
 * into a deselect, with the `export` column passing throughout.
 */
const ROUND_TRIPS = [
  { mode: 'none', suffix: '' },
  { mode: 'export', suffix: ', restored from an export' },
  { mode: 'dialog', suffix: ', restored by the dialog plugin' },
] as const;

/**
 * The permutations that reach a branch of their own. Every shape runs once, on the user's own selection
 * with headers on. Both restore trips go through the same repair; what a trip can lose on the way is the
 * grid-span flag (the full column), the stranded far corner, and - on the export trip, which hands the
 * captured record back itself - the record. Headers only move the clamp's lower bound, and the one shape
 * whose clamp has no header state to fall back on is the select-all.
 */
const PERMUTATIONS: { headers: boolean, roundTrip: (typeof ROUND_TRIPS)[number]['mode'], shapes: 'all' | string[] }[] = [
  { headers: true, roundTrip: 'none', shapes: 'all' },
  {
    headers: true,
    roundTrip: 'export',
    shapes: ['a single cell whose own record a trim removed', 'a cell range whose far corner a trim stranded', 'a full column'],
  },
  { headers: true, roundTrip: 'dialog', shapes: ['a cell range whose far corner a trim stranded', 'a full column'] },
  { headers: false, roundTrip: 'none', shapes: ['a select-all'] },
];

for (const { headers, roundTrip, shapes } of PERMUTATIONS) {
  const { suffix } = ROUND_TRIPS.find(({ mode }) => mode === roundTrip)!;

  test.describe(`selection shapes against a trim, headers ${headers ? 'on' : 'off'}${suffix}`, () => {
    for (const shape of SHAPES.filter(({ name }) => shapes === 'all' || shapes.includes(name))) {
      test(`${shape.outcome}: ${shape.name}`, async({ page, theme, bundle }) => {
        const grid = new EditorTrimmedRowPage(page, theme, bundle, { headers });

        await grid.goto();
        await shape.select(grid);

        expect(await grid.selected()).toBeDefined();

        if (roundTrip !== 'none') {
          // `dialog` and `emptyDataState` stash the selection, deselect, and put it back. Whatever
          // the repair relies on has to survive that trip, or a restored selection gets judged by
          // a different rule than the one the user made.
          if (roundTrip === 'dialog') {
            await grid.roundTripSelectionThroughDialog();
          } else {
            await grid.roundTripSelectionThroughExport();
          }

          expect(await grid.selected()).toBeDefined();
        }

        await grid.trimRows(shape.trim);

        const selected = await grid.selected();

        if (shape.outcome === 'dropped') {
          expect(selected).toBeUndefined();
        } else {
          expect(selected).toBeDefined();

          const visibleRows = await grid.visibleRowCount();

          // Whatever survived has to be addressable: nothing may reach past the last visible row,
          // which is the coordinate a write would grow the data set through.
          for (const [fromRow, , toRow] of selected!) {
            expect(fromRow).toBeLessThan(visibleRows);
            expect(toRow).toBeLessThan(visibleRows);
          }

          if (shape.outcome === 'clamped') {
            // A clamped extent still spans the axis it was created to span - it shrank with the
            // grid rather than being cut back to some inner row.
            expect(Math.max(...selected!.map(([, , toRow]) => toRow))).toBe(visibleRows - 1);
          }
        }

        await grid.pasteIntoSelection('PASTED');

        expect(await grid.sourceRowCount()).toBe(5);
      });
    }
  });
}
