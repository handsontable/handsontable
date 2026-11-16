import { test, expect } from '../fixtures/test';
import { ColumnHeaderCornerMarkupPage, type CornerFixturePlugin } from '../fixtures/pages/ColumnHeaderCornerMarkupPage';

/**
 * The plugins that left their markup in a header cell that became the corner, with the settings that
 * turn each one off.
 */
const KEPT_MARKUP_IN_NEW_CORNER: Array<{ plugin: CornerFixturePlugin; off: Record<string, unknown> }> = [
  { plugin: 'dropdownMenu', off: { dropdownMenu: false } },
  { plugin: 'columnSorting', off: { columnSorting: false } },
  { plugin: 'multiColumnSorting', off: { multiColumnSorting: false } },
];

/**
 * The plugins that drew into the corner of a grid scrolled horizontally.
 */
const DREW_INTO_SCROLLED_CORNER: CornerFixturePlugin[] = [
  'dropdownMenu', 'filters', 'columnSorting', 'multiColumnSorting', 'hiddenColumns', 'checkboxHeader',
  'rowSelectionColumn',
];

test.describe('Plugin markup and the column header corner', () => {
  for (const { plugin, off } of KEPT_MARKUP_IN_NEW_CORNER) {
    test(`${plugin}: the header that becomes the corner when row headers turn on keeps no markup`, async({ page, theme, bundle }) => {
      const grid = new ColumnHeaderCornerMarkupPage(page, theme, bundle);

      await grid.goto(plugin, { rowHeaders: false });

      expect(await grid.columnHeaderMarkupCount()).toBeGreaterThan(0);

      await grid.updateSettings({ rowHeaders: true });

      expect(await grid.cornerMarkup()).toEqual([]);
      expect(await grid.columnHeaderMarkupCount()).toBeGreaterThan(0);
    });

    test(`${plugin}: the header that becomes the corner keeps no markup when the plugin turns off in the same update`, async({ page, theme, bundle }) => {
      const grid = new ColumnHeaderCornerMarkupPage(page, theme, bundle);

      await grid.goto(plugin, { rowHeaders: false });
      await grid.updateSettings({ ...off, rowHeaders: true });

      expect(await grid.cornerMarkup()).toEqual([]);
      expect(await grid.columnHeaderMarkupCount()).toBe(0);
    });
  }

  test('rowSelection: the corner that becomes column A when the plugin turns off loses the corner class', async({ page, theme, bundle }) => {
    const grid = new ColumnHeaderCornerMarkupPage(page, theme, bundle);

    await grid.goto('rowSelection');
    await grid.updateSettings({ rowSelection: false });

    await expect(grid.grid().locator('.ht_clone_top thead th').nth(1)).toHaveText('A');
    expect(await grid.columnLabelsMarkedAsCorner()).toEqual([]);
  });

  for (const plugin of DREW_INTO_SCROLLED_CORNER) {
    test(`${plugin}: the corner of a grid scrolled horizontally gets no markup`, async({ page, theme, bundle }) => {
      const grid = new ColumnHeaderCornerMarkupPage(page, theme, bundle);

      await grid.goto(plugin);

      const steps = await grid.cornerMarkupWhileScrolledTo([3, 4, 5, 6]);

      for (const { firstRendered, markup } of steps) {
        expect(firstRendered, 'the grid is scrolled past its first column').toBeGreaterThan(0);
        expect(markup).toEqual([]);
      }

      const [back] = await grid.cornerMarkupWhileScrolledTo([0]);

      expect(back.firstRendered).toBe(0);
      expect(back.markup).toEqual([]);
      expect(await grid.columnHeaderMarkupCount()).toBeGreaterThan(0);
    });
  }

  test('collapsibleColumns: the corner of a grid scrolled past a collapsed group gets no indicator', async({ page, theme, bundle }) => {
    const grid = new ColumnHeaderCornerMarkupPage(page, theme, bundle);

    await grid.goto('collapsibleColumns');
    await grid.collapseSection(-2, 1);

    const [step] = await grid.cornerMarkupWhileScrolledTo([7]);

    expect(step.firstRendered, 'the grid is scrolled past the collapsed group').toBeGreaterThan(3);
    expect(step.markup).toEqual([]);
    expect(await grid.columnHeaderMarkupCount()).toBeGreaterThan(0);
  });

  test('rowSelection: the "select all" checkbox stays in its own corner of a grid scrolled horizontally', async({ page, theme, bundle }) => {
    const grid = new ColumnHeaderCornerMarkupPage(page, theme, bundle);

    await grid.goto('rowSelection');

    expect(await grid.rowSelectionCheckboxCornerPositions()).toEqual([1]);

    for (const column of [2, 3, 4]) {
      await grid.cornerMarkupWhileScrolledTo([column]);

      expect(await grid.rowSelectionCheckboxCornerPositions(), `scrolled to column ${column}`).toEqual([1]);
    }
  });
});
