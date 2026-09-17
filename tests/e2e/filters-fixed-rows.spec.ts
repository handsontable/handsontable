import { test, expect } from '../fixtures/test';
import { FiltersFixedRowsPage } from '../fixtures/pages/FiltersFixedRowsPage';

/**
 * Coverage for DEV-2524 - keeping the rows pinned by `fixedRowsTop` / `fixedRowsBottom` out of the
 * filter, and letting one column opt out of filtering entirely.
 *
 * Two options, on two axes:
 *
 * - `filters: { filterFixedRows: false }` takes the pinned rows out of the filter. They are never
 *   trimmed, and their values never reach the "filter by value" list. The default is `true`, which
 *   is what the plugin has always done.
 * - `columns: [{ filters: false }]` hides the filter UI in one column's dropdown menu.
 *
 * The fixture's two pinned rows carry `Gold` and `Silver` in the Color column. Neither matches the
 * `Red` filter the specs apply - so a missing exemption makes both rows vanish - and neither value
 * appears anywhere else, so "the list no longer offers them" cannot pass by accident.
 *
 * What the data logic does row by row is pinned by the unit suites
 * (`filterFixedRows.unit.js`, `perColumnFilters.unit.js`). These specs cover what the user sees:
 * the list in the open menu, and the frozen panes after the filter lands.
 */
test.describe('filtering with fixedRowsTop / fixedRowsBottom', () => {
  let grid: FiltersFixedRowsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersFixedRowsPage(page, theme, bundle);
    await grid.goto();
  });

  test('offers the pinned rows\' values in the list by default', async() => {
    await grid.openMenu('Color');

    // `Gold` and `Silver` come only from the pinned rows. This pins today's behavior, which the
    // new option must not change on its own.
    await expect.poll(() => grid.listedValues()).toEqual(['Gold', 'Green', 'Red', 'Silver']);

    await grid.escapeMenu();
    expect(grid.pageErrors).toEqual([]);
  });

  test('filters the pinned rows away by default', async() => {
    await grid.openMenu('Color');
    await grid.clearAllValues();
    await grid.checkValue('Red');
    await grid.confirmMenu();

    await expect.poll(() => grid.columnValues(0)).toEqual(['Apple', 'Cherry']);

    expect(grid.pageErrors).toEqual([]);
  });

  test('drops the pinned rows\' values from the list when filterFixedRows is false', async() => {
    await grid.rebuild({ filters: { filterFixedRows: false } });
    await grid.openMenu('Color');

    await expect.poll(() => grid.listedValues()).toEqual(['Green', 'Red']);

    await grid.escapeMenu();
    expect(grid.pageErrors).toEqual([]);
  });

  test('keeps the pinned rows on screen when filterFixedRows is false', async() => {
    await grid.rebuild({ filters: { filterFixedRows: false } });
    await grid.openMenu('Color');
    await grid.clearAllValues();
    await grid.checkValue('Red');
    await grid.confirmMenu();

    // The two data rows that match, with the pinned rows still at either end.
    await expect.poll(() => grid.columnValues(0)).toEqual(['Header', 'Apple', 'Cherry', 'Total']);

    // What the user sees: the frozen panes still show the same two rows they showed before the
    // filter, at the same ends of the grid.
    await expect(grid.topOverlayCell(0, 0)).toHaveText('Header');
    await expect(grid.bottomOverlayCell(3, 0)).toHaveText('Total');

    expect(grid.pageErrors).toEqual([]);
  });

  test('keeps its own filtered value checked when the menu is reopened', async() => {
    // Reopening the menu of a column that carries a condition takes the OTHER list path - the one
    // built from the full column read rather than from the visible rows. The pinned values have to
    // be gone there too, and the user's own tick has to survive.
    await grid.rebuild({ filters: { filterFixedRows: false } });
    await grid.openMenu('Color');
    await grid.clearAllValues();
    await grid.checkValue('Red');
    await grid.confirmMenu();

    await grid.openMenu('Color');

    await expect.poll(() => grid.listedValues()).toEqual(['Green', 'Red']);
    await expect(grid.valueList
      .filter({ hasText: /^Red$/ })
      .locator('input[type="checkbox"]')).toBeChecked();

    await grid.escapeMenu();
    expect(grid.pageErrors).toEqual([]);
  });

  test('keeps the pinned rows when nothing else matches', async() => {
    // Only the pinned rows are left, so the grid is not empty and the selection must survive. The
    // deselect guard used to read "no row matched the conditions", which is no longer the same
    // question.
    await grid.rebuild({ filters: { filterFixedRows: false } });
    await grid.openMenu('Color');
    await grid.clearAllValues();
    await grid.confirmMenu();

    await expect.poll(() => grid.columnValues(0)).toEqual(['Header', 'Total']);
    await expect(grid.topOverlayCell(0, 0)).toHaveText('Header');
    await expect(grid.bottomOverlayCell(1, 0)).toHaveText('Total');

    expect(grid.pageErrors).toEqual([]);
  });

  test('still filters normally when only fixedRowsTop is set', async() => {
    // `slice(-0)` returns the WHOLE array, so an unguarded bottom slice would pin every row here
    // and no filter would ever hide anything.
    await grid.rebuild({ fixedRowsBottom: 0, filters: { filterFixedRows: false } });
    await grid.openMenu('Color');
    await grid.clearAllValues();
    await grid.checkValue('Red');
    await grid.confirmMenu();

    await expect.poll(() => grid.columnValues(0)).toEqual(['Header', 'Apple', 'Cherry']);

    expect(grid.pageErrors).toEqual([]);
  });
});

test.describe('turning filtering off for one column', () => {
  let grid: FiltersFixedRowsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FiltersFixedRowsPage(page, theme, bundle);
    await grid.goto();
    await grid.rebuild({ columns: [{}, {}, { filters: false }] });
  });

  test('hides the filter UI in that column\'s menu', async() => {
    await grid.openMenu('Color');

    // The menu still opens - it carries the other dropdown items - but none of the filter blocks
    // render in it.
    await expect(grid.conditionBlock).toHaveCount(0);
    await expect(grid.valueList).toHaveCount(0);
    await expect(grid.actionBar).toHaveCount(0);

    await grid.escapeMenu();
    expect(grid.pageErrors).toEqual([]);
  });

  test('leaves the other columns filterable', async() => {
    await grid.openMenu('Fruit');

    await expect(grid.conditionBlock.first()).toBeVisible();
    await expect(grid.valueList.first()).toBeVisible();
    await expect(grid.actionBar).toHaveCount(1);

    await grid.escapeMenu();
    expect(grid.pageErrors).toEqual([]);
  });

  test('still filters the other columns', async() => {
    // Turning one column off must not disturb the rest of the plugin.
    await grid.openMenu('Fruit');
    await grid.clearAllValues();
    await grid.checkValue('Apple');
    await grid.confirmMenu();

    await expect.poll(() => grid.columnValues(0)).toEqual(['Apple']);

    expect(grid.pageErrors).toEqual([]);
  });

  test('keeps the Tab focus inside a menu that has no filter controls', async({ page }) => {
    // The menu's Tab focus navigator is built once, when the plugin is enabled, and it holds every
    // filter component's elements. In an opted-out column none of them render, so Tab could hand the
    // focus to an element that is not on screen - which fails silently, with no page error.
    // The first assertion is what fails when the column switch is removed; the Tab walk is the
    // safety net that the switch did not break keyboard navigation.
    await grid.openMenuWithKeyboard(1, 2);

    await expect(grid.conditionBlock).toHaveCount(0);
    await expect(grid.actionBar).toHaveCount(0);

    for (let press = 0; press < 4; press += 1) {
      await page.keyboard.press('Tab');

      // Never 'detached', never 'nowhere', and never out of the menu into the page behind it.
      await expect.poll(() => grid.focusLocation()).toBe('menu');
    }

    expect(grid.pageErrors).toEqual([]);
  });
});
