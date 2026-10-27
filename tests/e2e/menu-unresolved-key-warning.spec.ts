import { test, expect } from '../fixtures/test';
import { MenuUnresolvedKeyPage } from '../fixtures/pages/MenuUnresolvedKeyPage';

/**
 * The "does not match any available menu item" warning must fire for a key that names nothing, and
 * only then.
 *
 * `DropdownMenu` (priority 230) enables before `Filters` (250). Its enable-time build resolved the
 * item keys before Filters had registered its items, so an explicit `dropdownMenu` list naming the
 * Filters items warned once per key although Filters was on and the menu rendered every item.
 *
 * A negative assertion cannot prove itself, so each test that expects silence also builds a grid
 * that must warn, and waits for that warning: the console delivers messages in order, so once the
 * control's warning has arrived, an earlier false positive would have arrived too.
 */
test.describe('unresolved menu item key warning', () => {
  let grid: MenuUnresolvedKeyPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new MenuUnresolvedKeyPage(page, theme, bundle);
    await grid.goto();
  });

  test('does not warn for Filters items listed in dropdownMenu while Filters is on', async () => {
    await grid.build('filters');
    // The positive control: a misspelled key on a second grid, which must still warn.
    await grid.build('typo-only');

    await expect.poll(() => grid.warnings.join('\n')).toContain('col_lfet');

    expect(grid.warnings.filter(warning => !warning.includes('col_lfet'))).toEqual([]);
  });

  test('still renders every listed Filters item', async () => {
    await grid.build('filters');

    const items = await grid.openDropdownMenuItems();

    // The warning is only a false positive if the items are there. Matched on a prefix because the
    // Filters rows are composite: the "Filter by value" cell carries its whole nested list.
    expect(items.some(item => item.startsWith('Filter by condition'))).toBe(true);
    expect(items.some(item => item.startsWith('Filter by value'))).toBe(true);
  });

  test('does not warn when the menu is opened with Filters on', async () => {
    await grid.build('filters');
    await grid.openDropdownMenuItems();
    // The positive control, built after the open so its warning arrives after anything the open
    // could have logged.
    await grid.build('typo-only');

    await expect.poll(() => grid.warnings.join('\n')).toContain('col_lfet');

    expect(grid.warnings.filter(warning => !warning.includes('col_lfet'))).toEqual([]);
  });

  test('warns once for a key that is misspelled', async () => {
    await grid.build('filters-typo');

    await expect.poll(() => grid.warnings.join('\n')).toContain('filter_by_valeu');

    // Opening the menu rebuilds the list, which must not repeat the warning.
    await grid.openDropdownMenuItems();

    await grid.flushWarnings();

    // Exactly one: the typo. `filter_by_condition` sits in the same list and resolves.
    expect(grid.warnings).toHaveLength(1);
    expect(grid.warnings[0]).toContain('filter_by_valeu');
  });

  test('warns for the keys of a plugin that is off', async () => {
    await grid.build('filters-off');

    await expect.poll(() => grid.warnings.join('\n')).toContain('filter_by_condition');
  });

  test('does not warn for contextMenu keys of plugins that enable after it', async () => {
    await grid.build('context-menu');

    const items = await grid.openContextMenuItems();
    // The positive control, built after the open.
    await grid.build('typo-only');

    await expect.poll(() => grid.warnings.join('\n')).toContain('col_lfet');

    expect(grid.warnings.filter(warning => !warning.includes('col_lfet'))).toEqual([]);
    // Silence is only meaningful if a key resolved: the merge entry is offered. The hiding entry is
    // not asserted, because it shows for a selected column only and this opens on a cell. This test
    // also passes without the fix, since the context menu never built its list at enable time; it
    // guards that the shared change leaves that menu alone.
    expect(items).toContain('Merge cells');
  });

  test.describe('when the settings change after the grid is built', () => {
    // Plugins enable in priority order inside one `updateSettings()` pass too, so the dropdown menu
    // (230) can still enable before Filters (250) there. The build made while it enables skips an
    // unresolved key without reporting it, and the first open reports.
    test('does not warn when one update turns Filters on and lists its items', async () => {
      await grid.build('bare');
      await grid.update('filters');
      await grid.flushWarnings();

      expect(grid.warnings).toEqual([]);

      const items = await grid.openDropdownMenuItems();

      await grid.flushWarnings();

      expect(items.some(item => item.startsWith('Filter by condition'))).toBe(true);
      expect(grid.warnings).toEqual([]);
    });

    test('reports a misspelled key on the first open, not at the call', async () => {
      await grid.build('bare');
      await grid.update('typo-only');
      await grid.flushWarnings();

      expect(grid.warnings).toEqual([]);

      await grid.openDropdownMenuItems();
      await grid.flushWarnings();

      expect(grid.warnings).toHaveLength(1);
      expect(grid.warnings[0]).toContain('col_lfet');
    });
  });
});
