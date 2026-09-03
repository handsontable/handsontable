import { test, expect } from '../fixtures/test';
import { InvalidMarkUpdateSettingsPage } from '../fixtures/pages/InvalidMarkUpdateSettingsPage';

/**
 * GH #7553 - a cell marked invalid lost its highlight while keeping the invalid value.
 *
 * `updateSettings` clears the cell meta cache whenever its payload carries `cell`, `cells` or
 * `columns`. Meta written through `setCellMeta` is snapshotted and replayed around that clear (the
 * #4446 fix), but the failed-validation flag is written straight onto the meta object, so it was
 * dropped. In React this fires on every re-render of a grid with `HotColumn` children, because the
 * wrapper re-sends `columns` unconditionally; Angular re-sends on every `settings` change.
 *
 * The fixture's validator resolves on demand, so these tests can hold a cell mid-validation and
 * land an `updateSettings` in that exact window - which is what a server-side validator does in
 * practice, and the case the first cut of the fix missed in both directions.
 */
test.describe('invalid mark across updateSettings', () => {
  let grid: InvalidMarkUpdateSettingsPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new InvalidMarkUpdateSettingsPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  for (const kind of ['cells', 'cell', 'columns'] as const) {
    test(`keeps the mark when updateSettings carries \`${kind}\``, async () => {
      await grid.setDataAtCell(0, 0, 'nope');
      await grid.resolveValidation();

      await expect(grid.cell(0, 0)).toHaveClass(/htInvalid/);

      await grid.updateSettingsWith(kind);

      await expect(grid.cell(0, 0)).toHaveClass(/htInvalid/);
      expect(await grid.cellValidFlag(0, 0)).toBe('false');
      // The mark must not spread to any other cell.
      await expect(grid.invalidCells()).toHaveCount(1);
    });
  }

  test('keeps the mark when the validator resolves after the cache was cleared', async () => {
    // The stored meta is handed to the validator by reference; the clear detaches it, so the
    // failure has to be written through to whatever object is stored now.
    await grid.setDataAtCell(0, 0, 'nope');
    await grid.updateSettings({ columns: [{}, {}, {}, {}, {}] });
    await grid.resolveValidation();

    await expect(grid.cell(0, 0)).toHaveClass(/htInvalid/);
    expect(await grid.cellValidFlag(0, 0)).toBe('false');
  });

  test('clears the mark when a correction resolves after the cache was cleared', async () => {
    // The cell is already invalid, so the clear re-applies `valid === false` to the fresh meta.
    // A passing result that only reached the detached object would leave a corrected value red.
    await grid.setDataAtCell(0, 0, 'nope');
    await grid.resolveValidation();
    await expect(grid.cell(0, 0)).toHaveClass(/htInvalid/);

    await grid.setDataAtCell(0, 0, 42);
    await grid.updateSettings({ columns: [{}, {}, {}, {}, {}] });
    await grid.resolveValidation();

    await expect(grid.cell(0, 0)).not.toHaveClass(/htInvalid/);
    expect(await grid.cellValidFlag(0, 0)).toBe('true');
    expect(await grid.cellValue(0, 0)).toBe(42);
  });

  test('does not mark a rejected `allowInvalid: false` edit', async () => {
    // The change is cancelled, so the cell keeps its previous - valid - value. The cancel path
    // writes `valid = true` on the object the validator was handed, which the clear detached.
    await grid.initGrid({ allowInvalid: false });

    const originalValue = await grid.cellValue(0, 0);

    await grid.setDataAtCell(0, 0, 'nope');
    await grid.updateSettings({ columns: [{}, {}, {}, {}, {}] });
    await grid.resolveValidation();

    await expect(grid.cell(0, 0)).not.toHaveClass(/htInvalid/);
    expect(await grid.cellValue(0, 0)).toBe(originalValue);
    expect(await grid.cellValidFlag(0, 0)).not.toBe('false');
  });

  test('does not mark another cell when rows shift while the validator runs', async () => {
    // A row insert re-keys the stored meta objects, but the `row`/`col` fields stamped on them are
    // not rewritten. Writing the result through on those stale coordinates would flag a cell the
    // user never touched - so a result whose coordinates can no longer be trusted is dropped.
    await grid.setDataAtCell(2, 0, 'nope');
    await grid.insertRowAbove(0, 1);
    await grid.updateSettings({ columns: [{}, {}, {}, {}, {}] });
    await grid.resolveValidation();

    // Row 3 now holds what row 2 held. Whatever happens to the mark, no OTHER cell may wear it,
    // and in particular not one holding a value that always passed.
    await expect(grid.invalidCells()).toHaveCount(0);
    expect(await grid.cellValidFlag(3, 0)).not.toBe('false');
  });

  test('does not treat a `valid` flag inherited from the column layer as a cell failure', async () => {
    // `valid` is an ordinary meta key, so it can be declared above the cell layer. Reading it
    // through the prototype chain would report every materialized cell and stamp the flag on as an
    // own property that outlives the setting.
    await grid.initGrid({ columns: [{ valid: false }, {}, {}, {}, {}] });

    await grid.updateSettings({ columns: [{ valid: false }, {}, {}, {}, {}] });
    await grid.updateSettings({ columns: [{}, {}, {}, {}, {}] });

    expect(await grid.cellValidFlag(0, 0)).toBe('undefined');
    await expect(grid.invalidCells()).toHaveCount(0);
  });
});
