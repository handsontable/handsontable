import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { FormulasSheetBuiltGridSortPage } from '../fixtures/pages/FormulasSheetBuiltGridSortPage';

/**
 * A grid built from an engine sheet without `data` and sorted by a header click. The index syncer
 * was not pointed at the bound sheet, so the first sort threw
 * `Cannot read properties of null (reading 'getSheetDimensions')` and the rows stayed unsorted.
 */
test.describe('Formulas: sorting a grid built from an engine sheet', { tag: BUNDLES_TAG }, () => {
  test('sorts by a header click without throwing', async ({ page, theme, bundle }) => {
    const grid = new FormulasSheetBuiltGridSortPage(page, theme, bundle);
    const pageErrors: string[] = [];

    page.on('pageerror', (error) => pageErrors.push(error.message));

    await grid.goto();
    await expect(grid.cell(0, 0)).toHaveText('b');

    await grid.sortByHeader(1);

    await expect(grid.cell(0, 0)).toHaveText('a');
    await expect(grid.cell(0, 2)).toHaveText('2');
    await expect.poll(() => grid.dataAtCol(1)).toEqual([1, 2, 3]);
    expect(pageErrors).toEqual([]);
  });

  test('keeps an array manual row move across updateSettings() calls', async ({ page, theme, bundle }) => {
    const grid = new FormulasSheetBuiltGridSortPage(page, theme, bundle);
    const pageErrors: string[] = [];

    page.on('pageerror', (error) => pageErrors.push(error.message));

    await grid.goto('array');
    await expect(grid.cell(0, 0)).toHaveText('c');

    // Checked after every call: the order used to move once per call, and three rows come back after three.
    for (let update = 0; update < 3; update += 1) {
      await grid.updateSettingsWithNothing();

      await expect(grid.cell(0, 0)).toHaveText('c');
      await expect(grid.cell(2, 0)).toHaveText('a');
      // `=B*2` of the row's own number: a formula that read another row shows here.
      await expect(grid.cell(0, 2)).toHaveText('6');
      await expect.poll(() => grid.dataAtCol(0)).toEqual(['c', 'b', 'a']);
      await expect.poll(() => grid.dataAtCol(2)).toEqual([6, 4, 2]);
    }

    expect(pageErrors).toEqual([]);
  });

  // Every `updateSettings()` reloads a sheet-built grid from its sheet. A `loadData()` there reset the sort state
  // while the rows stayed sorted, so the indicator went away and `clearSort()` could not bring the manual order back.
  test('keeps the sort indicator and clears back to the manual order across re-renders', async ({ page, theme, bundle }) => {
    const grid = new FormulasSheetBuiltGridSortPage(page, theme, bundle);
    const pageErrors: string[] = [];

    page.on('pageerror', (error) => pageErrors.push(error.message));

    await grid.goto('array');
    await expect(grid.cell(0, 0)).toHaveText('c');

    await grid.sortByHeader(0);

    await expect(grid.cell(0, 0)).toHaveText('a');
    await expect(grid.sortLabel(0)).toHaveClass(/ascending/);

    for (let update = 0; update < 3; update += 1) {
      await grid.updateSettingsWithNothing();

      await expect(grid.sortLabel(0)).toHaveClass(/ascending/);
      await expect.poll(() => grid.sortConfig()).toEqual([{ column: 0, sortOrder: 'asc' }]);
      await expect.poll(() => grid.dataAtCol(0)).toEqual(['a', 'b', 'c']);
      await expect.poll(() => grid.dataAtCol(2)).toEqual([2, 4, 6]);
    }

    await grid.clearSort();

    await expect(grid.sortLabel(0)).not.toHaveClass(/ascending/);
    await expect(grid.cell(0, 0)).toHaveText('c');
    await expect.poll(() => grid.dataAtCol(0)).toEqual(['c', 'b', 'a']);
    await expect.poll(() => grid.dataAtCol(2)).toEqual([6, 4, 2]);
    expect(pageErrors).toEqual([]);
  });

  // A `loadData()` drops every change still waiting for its validator, so an edit made right before a re-render
  // never landed.
  test('lands an edit that waits for its async validator across a re-render', async ({ page, theme, bundle }) => {
    const grid = new FormulasSheetBuiltGridSortPage(page, theme, bundle);
    const pageErrors: string[] = [];

    page.on('pageerror', (error) => pageErrors.push(error.message));

    await grid.goto('none', 'held');
    await expect(grid.cell(0, 1)).toHaveText('2');

    await grid.cell(0, 1).click();
    await page.keyboard.type('5');
    await page.keyboard.press('Enter');
    await expect.poll(() => grid.heldValidationCount()).toBe(1);

    await grid.updateSettingsWithNothing();
    await grid.answerValidations(true);

    await expect(grid.cell(0, 1)).toHaveText('5');
    // `=B1*2` reads the edited cell, so the engine holds the edit too.
    await expect(grid.cell(0, 2)).toHaveText('10');

    await grid.updateSettingsWithNothing();

    await expect(grid.cell(0, 1)).toHaveText('5');
    await expect(grid.cell(0, 2)).toHaveText('10');
    expect(pageErrors).toEqual([]);
  });

  // A re-render reloads the sheet with `updateData()`, which runs no AutoColumnSize sweep where `loadData()` did.
  // The column still fits a value the host wrote into the engine sheet, longer and then shorter again.
  test('fits a column to a value the host wrote into the engine sheet after a re-render', async ({ page, theme, bundle }) => {
    const grid = new FormulasSheetBuiltGridSortPage(page, theme, bundle);
    const pageErrors: string[] = [];

    page.on('pageerror', (error) => pageErrors.push(error.message));

    await grid.goto();
    await expect(grid.cell(2, 1)).toHaveText('3');

    const initialWidth = await grid.headerWidth(1);

    await grid.writeEngineCell(2, 1, 'a long value the host wrote into the engine sheet');
    await grid.updateSettingsWithNothing();

    await expect(grid.cell(2, 1)).toHaveText('a long value the host wrote into the engine sheet');
    await expect.poll(() => grid.headerWidth(1)).toBeGreaterThan(initialWidth * 2);

    await grid.writeEngineCell(2, 1, 'x');
    await grid.updateSettingsWithNothing();

    await expect(grid.cell(2, 1)).toHaveText('x');
    await expect.poll(() => grid.headerWidth(1)).toBe(initialWidth);
    expect(pageErrors).toEqual([]);
  });
});
