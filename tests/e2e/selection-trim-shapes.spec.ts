import { test, expect } from '../fixtures/test';
import { EditorTrimmedRowPage } from '../fixtures/pages/EditorTrimmedRowPage';

/**
 * The selection shapes a trim can strand, enumerated rather than sampled.
 *
 * `selection-trimmed-row.spec.ts` pins the MECHANISM one case at a time - the record test, the
 * corner test, the permutation recapture. This file pins the DECISION TABLE instead: every shape a
 * user can select, with headers and without, against a trim that shortens the grid. Four defects in
 * a row were narrowing errors in that table which no single-shape case could see, because each of
 * them exercised the one shape it was written for.
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

for (const headers of [true, false]) {
  test.describe(`selection shapes against a trim, headers ${headers ? 'on' : 'off'}`, () => {
    for (const shape of SHAPES) {
      test(`${shape.outcome}: ${shape.name}`, async({ page, theme, bundle }) => {
        const grid = new EditorTrimmedRowPage(page, theme, bundle, { headers });

        await grid.goto();
        await shape.select(grid);

        expect(await grid.selected()).toBeDefined();

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
