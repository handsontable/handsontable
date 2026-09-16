import { test, expect } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

const PASSWORD_FIXTURE = 'filters-password-value-list.html';

/**
 * Regression coverage for DEV-1021.
 *
 * A password column hashes in the cell renderer, but Filter-by-value used to
 * list the source plaintext because `PasswordCellType` did not export
 * `valueFormatter` (the same gap numeric closed in #10756). The list must
 * show hashes — including a custom `hashLength` / `hashSymbol` — while
 * Contains and unchecking a hash still match the source values.
 *
 * Source values have unique lengths so each default hash is distinct:
 * `ab` → `**`, `xyz` → `***`, `secret` → `******`. Unify sorts them as
 * `''`, `ab`, `secret`, `xyz`, so the listed labels are `(Blank cells)`,
 * `**`, `******`, `***`. The empty row must stay `(Blank cells)` — the
 * password formatter would otherwise hash that label.
 */
test.describe('Filters — password Filter-by-value display', () => {
  test('lists hashed password values, not the source plaintext', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, PASSWORD_FIXTURE);

    await grid.goto();
    await grid.openMenu('Password');

    expect(await grid.listedValues()).toEqual([
      { checked: true, label: '(Blank cells)' },
      { checked: true, label: '**' },
      { checked: true, label: '******' },
      { checked: true, label: '***' },
    ]);
  });

  test('respects hashLength and hashSymbol on the Filter-by-value list',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle, PASSWORD_FIXTURE);

      await grid.goto();
      await grid.openMenu('PIN');

      // unifyColumnValues uniques on source values, then hashes each one, so
      // three distinct PINs become three identical `####` rows. The empty
      // cell stays `(Blank cells)` instead of a fourth `####`.
      expect(await grid.listedValues()).toEqual([
        { checked: true, label: '(Blank cells)' },
        { checked: true, label: '####' },
        { checked: true, label: '####' },
        { checked: true, label: '####' },
      ]);
    });

  test('still formats a numeric column in the same menu', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, PASSWORD_FIXTURE);

    await grid.goto();
    await grid.openMenu('Amount');

    expect(await grid.listedValues()).toEqual([
      { checked: true, label: '$10.00' },
      { checked: true, label: '$20.00' },
      { checked: true, label: '$30.00' },
      { checked: true, label: '$40.00' },
    ]);
  });

  test('Contains matches the source password, not the hash', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, PASSWORD_FIXTURE);

    await grid.goto();
    await grid.openMenu('Password');
    await grid.applyCondition('Contains', 'secret');
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual(['******']);
    expect(await grid.visibleRowCount()).toBe(1);
  });

  test('unchecking a unique hash hides the matching source row', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, PASSWORD_FIXTURE);

    await grid.goto();
    await grid.openMenu('Password');
    // First listed item (`**` ← source `ab`) stays inside the first three rows
    // so the click does not scroll the virtualized list and miss the menu.
    await grid.uncheckValue('**');
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual(['***', '******', '']);
    expect(await grid.visibleRowCount()).toBe(3);
  });
});
