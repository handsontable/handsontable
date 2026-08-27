import { test, expect } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

/**
 * Regression coverage for issue #6471.
 *
 * Editing a cell in a column filtered by value used to add the typed value to that column's
 * condition, re-checking a box the user had explicitly cleared. The damage went past the checkbox:
 * once every listed value was checked, the component reported "no condition at all", so the next
 * confirmation of the menu — touching nothing — dropped the filter and brought every row back.
 *
 * The typed value must join the list unchecked, and the condition must survive the edit untouched.
 *
 * The fixture's Color column holds Red, Green, Blue with repeats, so unchecking one value still
 * leaves several rows to edit.
 */
test.describe('Filters — editing a cell in a column filtered by value', () => {
  test('lists the typed value without checking it', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();

    await grid.openMenu('Color');
    await grid.uncheckValue('Green');
    await grid.confirmMenu();

    expect(await grid.columnValues(1)).toEqual(['Red', 'Blue', 'Red']);

    // Type the value that was just excluded into one of the rows that survived the filter.
    await grid.typeIntoCell(0, 1, 'Green');

    await grid.openMenu('Color');

    // "Green" is back in the data, so it belongs in the list - but the user unchecked it, and a
    // data change must not select it on their behalf.
    expect(await grid.listedValues()).toEqual([
      { checked: true, label: 'Blue' },
      { checked: false, label: 'Green' },
      { checked: true, label: 'Red' },
    ]);
  });

  test('confirming the menu afterwards keeps the filter instead of dropping it',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle);

      await grid.goto();

      await grid.openMenu('Color');
      await grid.uncheckValue('Green');
      await grid.confirmMenu();

      await grid.typeIntoCell(0, 1, 'Green');

      // The reporter's workflow: reopen the menu and confirm it without changing anything.
      await grid.openMenu('Color');
      await grid.confirmMenu();

      // Only the Blue and Red rows may remain. Before the fix every value counted as selected,
      // which the component reported as "no condition", so all five rows came back.
      expect(await grid.columnValues(1)).toEqual(['Blue', 'Red']);
    });

  test('leaves the edited row on screen until the filter is applied again', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();

    await grid.openMenu('Color');
    await grid.uncheckValue('Green');
    await grid.confirmMenu();

    await grid.typeIntoCell(0, 1, 'Green');

    // The edit alone must not re-run the filter - the row the user is working on stays put.
    expect(await grid.columnValues(1)).toEqual(['Green', 'Blue', 'Red']);

    // Calling `filter()` is the recipe the guide gives for applying the filter to edited data, so
    // it has to actually remove the row that no longer matches.
    await page.evaluate(() => (window as unknown as {
      hot: { getPlugin(name: string): { filter(): void } };
    }).hot.getPlugin('filters').filter());

    expect(await grid.columnValues(1)).toEqual(['Blue', 'Red']);
  });
});
