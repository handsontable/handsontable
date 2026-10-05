import { test, expect } from '../fixtures/test';
import { FixedColumnsEndReviewPage } from '../fixtures/pages/FixedColumnsEndReviewPage';

/**
 * Review follow-ups for `fixedColumnsEnd` and the column plugins:
 *
 * - ManualColumnFreeze moves a column with the index mapper directly, so it must not freeze a column of the end
 *   band (that would slide the column in front of the band into it) and must hide its menu entries there.
 * - NestedHeaders draws the part of a group that lies in the end band as a continuation cell. That cell is a
 *   placeholder in the state, so it has to take the `headerClassName` and the `rowspan` of the group, not its own.
 *
 * Grid of the fixture: 500 x 300 px viewport, 72 px columns, row and column headers.
 */
const ORIGINAL_ORDER = Array.from({ length: 10 }, (_, c) => `R1C${c + 1}`);

test.describe('fixedColumnsEnd and ManualColumnFreeze', { tag: '@core' }, () => {
  let grid: FixedColumnsEndReviewPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FixedColumnsEndReviewPage(page, theme, bundle);
  });

  test('refuses to freeze a column of the end band through the API', async () => {
    await grid.goto({ scenario: 'freeze', fixedColumnsEnd: 2 });
    await grid.freezeByApi(9);
    await grid.freezeByApi(8);

    expect(await grid.columnOrder()).toEqual(ORIGINAL_ORDER);
    expect(await grid.frozenStartCount()).toBe(0);
  });

  test('still freezes a scrolling column and leaves the columns of the end band where they are', async () => {
    await grid.goto({ scenario: 'freeze', fixedColumnsEnd: 2 });
    await grid.freezeByApi(7);

    expect(await grid.columnOrder()).toEqual(['R1C8', ...ORIGINAL_ORDER.slice(0, 7), 'R1C9', 'R1C10']);
    expect(await grid.frozenStartCount()).toBe(1);
    // The end clone still draws the last two columns.
    await expect(grid.grid.locator('.ht_clone_inline_end [data-testid="cell-0-8"]')).toHaveText('R1C9');
    await expect(grid.grid.locator('.ht_clone_inline_end [data-testid="cell-0-9"]')).toHaveText('R1C10');
  });

  test('offers no "Freeze column" entry on a column of the end band', async () => {
    await grid.goto({ scenario: 'freeze', fixedColumnsEnd: 2 });
    await grid.openContextMenu(2, 9, 'end');

    // The menu is open and has entries of its own, so an absent entry is not an absent menu.
    await expect(grid.menuItem('Insert column left')).toBeVisible();
    await expect(grid.menuItem('Freeze column')).toHaveCount(0);
  });

  test('freezes a scrolling column from the menu and keeps the end band', async () => {
    await grid.goto({ scenario: 'freeze', fixedColumnsEnd: 2 });
    await grid.openContextMenu(2, 1, 'master');
    await grid.menuItem('Freeze column').click();

    await expect.poll(() => grid.frozenStartCount()).toBe(1);
    expect(await grid.columnOrder()).toEqual(['R1C2', 'R1C1', ...ORIGINAL_ORDER.slice(2)]);
  });
});

for (const direction of ['ltr', 'rtl'] as const) {
  const rtl = direction === 'rtl';

  test.describe(`fixedColumnsEnd and a NestedHeaders group continuation (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndReviewPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndReviewPage(page, theme, bundle);
    });

    test('applies the headerClassName of the group to its continuation cell', async () => {
      // The band holds columns 8 to 11. Q1 spans 5 to 10, so the end clone continues it over 8 to 10.
      await grid.goto({ scenario: 'group', rtl, fixedColumnsEnd: 4 });

      const continuation = (await grid.endGroups(0)).find(group => group.text === 'Q1');

      expect(continuation, 'the end clone draws the group').toBeDefined();
      expect(continuation?.colspan).toBe(3);
      expect(continuation?.innerClasses).toContain('htRight');
    });

    test('keeps the hidden-column indicator on a continuation cell of a group with a rowspan', async () => {
      // Column 7 is hidden, so the first end column (8) sits next to it. The group reaches the cells through its
      // rowspan of 2, not through the continuation cell's own (placeholder) rowspan.
      await grid.goto({ scenario: 'group', rtl, fixedColumnsEnd: 4, hiddenColumn: 7, groupRowspan: 2 });

      const continuation = (await grid.endGroups(0)).find(group => group.text === 'Q1');

      expect(continuation, 'the end clone draws the group').toBeDefined();
      expect(continuation?.cellClasses).toContain('afterHiddenColumn');
      expect(continuation?.innerClasses).toContain('htRight');
    });
  });
}
