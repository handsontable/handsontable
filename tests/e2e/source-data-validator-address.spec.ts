import { test, expect } from '../fixtures/test';
import { SourceDataValidatorPage } from '../fixtures/pages/SourceDataValidatorPage';

/**
 * `sourceDataValidator` used to READ its value through `dataSource.getAtCell()`, which resolves a
 * VISUAL column index, but BLANK it through `dataSource.setAtCell()`, which takes the source
 * address. Wherever the two disagree — a moved column, or `columns[].data` remapping the source
 * indexes — the validator judged one cell and cleared another, destroying data the user never
 * asked it to touch (DEV-2722).
 *
 * The validator in the fixture rejects everything and the column sets `allowInvalid: false`, so
 * exactly the cell it was handed must come back `null`. Values are `r<row>c<col>`, so the value the
 * validator saw names the column it really came from.
 */
test.describe('sourceDataValidator cell address', () => {
  let grid: SourceDataValidatorPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SourceDataValidatorPage(page, theme, bundle);
    await grid.goto();
  });

  test('blanks the column it validated when columns[].data remaps the source indexes', async () => {
    // Column 0 is declared as source index 2, so both the read and the blanking belong there.
    const result = await grid.run({
      columns: [{ data: 2 }, { data: 3 }, { data: 4 }, { data: 5 }],
      targetColumn: 0,
    });

    expect(result.seenValues).toEqual(['r0c2', 'r1c2', 'r2c2']);
    expect(result.sourceRow0).toEqual([ 'r0c0', 'r0c1', null, 'r0c3', 'r0c4', 'r0c5' ]);
  });

  test('blanks the column it validated when columns are moved', async () => {
    // `columns[0]` is the meta of PHYSICAL column 0, whose value lives at source index 0 however the
    // move shuffles the display. Reading it as a visual index instead reached source 4 — the column
    // that merely happens to be shown first — and then blanked index 0 anyway.
    const result = await grid.run({
      manualColumnMove: [4, 3, 2, 1, 0],
      targetColumn: 0,
    });

    expect(result.seenValues).toEqual(['r0c0', 'r1c0', 'r2c0']);
    expect(result.sourceRow0).toEqual([ null, 'r0c1', 'r0c2', 'r0c3', 'r0c4', 'r0c5' ]);
  });

  test('blanks the column it validated when `columns[].data` is an accessor function', async () => {
    // An accessor function is the third address shape: `colToProp()` returns the function itself,
    // and it owns both the read and the write. Column 2 rejects, so only `c2` may be cleared.
    const result = await grid.run({ accessors: true, targetColumn: 2 });

    expect(result.seenValues).toEqual(['r0c2', 'r1c2', 'r2c2']);
    expect(result.sourceRow0).toEqual({
      c0: 'r0c0', c1: 'r0c1', c2: null, c3: 'r0c3', c4: 'r0c4', c5: 'r0c5',
    });
  });

  test('blanks the validated column when nothing remaps the source indexes', async () => {
    const result = await grid.run({ targetColumn: 2 });

    expect(result.seenValues).toEqual(['r0c2', 'r1c2', 'r2c2']);
    expect(result.sourceRow0).toEqual([ 'r0c0', 'r0c1', null, 'r0c3', 'r0c4', 'r0c5' ]);
  });
});
