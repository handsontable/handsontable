import { expect, test } from '../fixtures/test';
import { DropdownStrictValidationPage } from '../fixtures/pages/DropdownStrictValidationPage';

/**
 * DEV-2911 — a `dropdown` column declared with `strict: false` validated strictly only in the
 * cells the user had clicked.
 *
 * The dropdown is documented as an autocomplete "with strict mode always on", and its editor
 * honors that: preparing the editor writes `strict = true` onto the meta of the one cell it opens
 * for. The validator read the meta's `strict` instead, so a cell nobody had selected kept the
 * column's `strict: false` and accepted any value. A typed value was therefore marked invalid,
 * while the same value pasted, written through the API, or checked by `validateCells()` was not —
 * and an `updateSettings()` that rebuilt the cell meta undid the editor's write again.
 *
 * Column 0 is a flexible autocomplete, column 1 the `strict: false` dropdown, column 2 a default
 * dropdown. Every case that writes into column 1 does so without selecting that cell, because
 * selecting it is exactly what used to hide the bug.
 */
test.describe('dropdown validation with `strict: false` (DEV-2911)', () => {
  let grid: DropdownStrictValidationPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DropdownStrictValidationPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('marks a pasted value outside the source invalid in a cell that was never selected', async() => {
    // The precondition that makes this the unselected path: no editor was prepared for the cell,
    // so its meta still carries the column's `strict: false`.
    expect(await grid.strictAt(1, 1)).toBe('false');

    // Pasting a copied row from column 0 fills column 1 without selecting it.
    await grid.pasteFrom(1, 0, 'bogus\tbogus');

    await expect.poll(() => grid.validState(1, 1)).toBe('invalid');
    await expect(grid.cell(1, 1)).toHaveClass(/htInvalid/);

    // The meta keeps what the user configured: `getCellMeta()` must not start reporting a
    // different `strict` for cells the editor never touched.
    expect(await grid.strictAt(1, 1)).toBe('false');
  });

  test('marks a value filled by autofill invalid in cells that were never selected', async() => {
    // Seed row 1 with a value outside the source, which also leaves the pasted range selected.
    await grid.pasteFrom(1, 0, 'bogus\tbogus');
    await expect.poll(() => grid.selected()).toEqual([[1, 0, 1, 1]]);

    expect(await grid.strictAt(2, 1)).toBe('false');

    await grid.dragFillHandleTo(3, 1);

    await expect.poll(() => grid.validState(2, 1)).toBe('invalid');
    await expect.poll(() => grid.validState(3, 1)).toBe('invalid');
    await expect(grid.cell(3, 1)).toHaveClass(/htInvalid/);

    // The flexible autocomplete column took the same value and stays valid.
    await expect.poll(() => grid.validState(3, 0)).toBe('valid');
  });

  test('marks a loaded value outside the source invalid on validateCells()', async() => {
    expect(await grid.strictAt(0, 1)).toBe('false');

    await grid.validateCells();

    // Column 1 must now match the default dropdown beside it.
    await expect.poll(() => grid.validState(0, 2)).toBe('invalid');
    await expect.poll(() => grid.validState(0, 1)).toBe('invalid');
    await expect(grid.cell(0, 1)).toHaveClass(/htInvalid/);
  });

  test('keeps validating strictly after updateSettings() rebuilds the cell meta', async() => {
    // Clicking the cell is the point: it prepares the cell's editor, which is what used to make
    // this one cell strict. The focus then moves to the flexible autocomplete column, so it
    // leaves the cell under test without preparing another dropdown cell on the way out.
    await grid.clickCell(1, 1);
    await grid.clickCell(3, 0);

    // Rebuilding the cell meta used to undo whatever the editor had written. The React wrapper
    // re-sends `columns` like this on every render of a grid with `HotColumn` children.
    await grid.reapplyColumns();

    await grid.setDataAtCell(1, 1, 'bogus');

    await expect.poll(() => grid.validState(1, 1)).toBe('invalid');
    await expect(grid.cell(1, 1)).toHaveClass(/htInvalid/);
  });

  test('rejects a pasted value outside the source when allowInvalid is false', async() => {
    // Column 3 carries the same declaration plus `allowInvalid: false`, where an invalid value is
    // discarded instead of stored and marked. It is the only path of this change that loses a
    // write, so it is asserted on the stored value, not on the validation flag.
    expect(await grid.strictAt(2, 3)).toBe('false');
    expect(await grid.dataAt(2, 3)).toBe('blue');

    await grid.pasteFrom(2, 0, 'bogus\tbogus\tbogus\tbogus');

    // The flexible column takes the value. That is the proof the paste landed, so the two reads
    // below cannot pass by running before it.
    await expect.poll(() => grid.dataAt(2, 0)).toBe('bogus');

    // The default dropdown stores the value and marks it, because `allowInvalid` is `true` there.
    expect(await grid.dataAt(2, 2)).toBe('bogus');
    await expect(grid.cell(2, 2)).toHaveClass(/htInvalid/);

    expect(await grid.dataAt(2, 3)).toBe('blue');
  });

  test('validates strictly when `strict: false` comes from the `cells` option', async() => {
    // Column 4 declares `strict: false` one cascade level down, through `cells`.
    expect(await grid.strictAt(2, 4)).toBe('false');

    await grid.pasteFrom(2, 0, 'bogus\tbogus\tbogus\tbogus\tbogus');

    await expect.poll(() => grid.validState(2, 4)).toBe('invalid');
    await expect(grid.cell(2, 4)).toHaveClass(/htInvalid/);
  });

  test('keeps a flexible autocomplete value and an in-source dropdown value valid', async() => {
    // The controls. A fix that made every autocomplete strict, or that marked every write to the
    // dropdown invalid, would pass the three cases above.
    await grid.pasteFrom(2, 0, 'bogus\torange');

    await expect.poll(() => grid.validState(2, 0)).toBe('valid');
    await expect.poll(() => grid.validState(2, 1)).toBe('valid');
    await expect(grid.cell(2, 0)).not.toHaveClass(/htInvalid/);
    await expect(grid.cell(2, 1)).not.toHaveClass(/htInvalid/);
  });
});
