import { test, expect } from '../fixtures/test';
import { DropdownMenuFreezeColumnPage } from '../fixtures/pages/DropdownMenuFreezeColumnPage';

/**
 * GitHub #5429. `freeze_column` and `unfreeze_column` worked as `contextMenu` keys but did nothing
 * as `dropdownMenu` keys.
 *
 * The two menus build their item lists from separate hooks — `afterContextMenuDefaultOptions` and
 * `afterDropdownMenuDefaultOptions` — and ManualColumnFreeze registered only the first. A key the
 * dropdown menu had never heard of raised nothing: `ItemsFactory` turned it into a bare
 * `{ name, key }` placeholder. So the menu rendered a row labeled with the RAW KEY, carrying no
 * callback and no `hidden()`, and clicking it closed the menu without freezing anything.
 *
 * That placeholder is gone as of DEV-2758 — an unresolvable key is skipped and warned about
 * instead — so the `manualColumnFreeze disabled` block at the bottom now pins the skip.
 *
 * That failure mode is why the label assertions below check the translated text rather than just
 * "a row is there" — the broken build rendered a row too.
 */
test.describe('freeze_column / unfreeze_column as dropdown menu keys', () => {
  let grid: DropdownMenuFreezeColumnPage;

  const {
    CUSTOM_KEYS, DEFAULT_MENU, CONTEXT_CONTROL, PLUGIN_OFF, TOGGLE, TOGGLE_OFF_START,
    FILTERS_ORDER, OTHER_KEYS, FREEZE_LABEL, UNFREEZE_LABEL,
  } = DropdownMenuFreezeColumnPage;

  /** How many rows carry exactly this label. */
  const countOf = (items: string[], label: string) => items.filter(item => item === label).length;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new DropdownMenuFreezeColumnPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('the keys listed explicitly in dropdownMenu', () => {
    test('renders the translated label, not the raw key', async () => {
      await grid.openColumnMenu(CUSTOM_KEYS, 'Charlie');

      const items = await grid.visibleDropdownMenuItems();

      expect(items).toContain(FREEZE_LABEL);
      // The exact string the broken build showed. Asserted separately from the positive check
      // because a build that rendered BOTH would still pass the `toContain` above.
      expect(items).not.toContain('freeze_column');
    });

    test('offers the entry exactly once', async () => {
      await grid.openColumnMenu(CUSTOM_KEYS, 'Charlie');

      // One handler now serves two hooks, and the list is rebuilt on every open. A membership
      // check alone would pass just as happily with the entry added twice.
      expect(countOf(await grid.visibleDropdownMenuItems(), FREEZE_LABEL)).toBe(1);
    });

    test('stays at one entry after the menu is reopened', async () => {
      await grid.openColumnMenu(CUSTOM_KEYS, 'Charlie');
      await grid.closeDropdownMenu();
      await grid.openColumnMenu(CUSTOM_KEYS, 'Charlie');

      // Rebuilding per open is what makes the plugin state track the menu. It must not also
      // accumulate rows each time.
      expect(countOf(await grid.visibleDropdownMenuItems(), FREEZE_LABEL)).toBe(1);
    });

    test('offers unfreeze only once the column is frozen', async () => {
      // Nothing is frozen yet, so `unfreeze_column`'s `hidden()` must suppress it. This doubles as
      // proof that `hidden()` ran against a real selection: the placeholder the broken build
      // produced had no `hidden()` at all, so it always showed.
      await grid.openColumnMenu(CUSTOM_KEYS, 'Charlie');

      const items = await grid.visibleDropdownMenuItems();

      expect(items).not.toContain(UNFREEZE_LABEL);
      // The raw key has to be checked too. Absent the entry entirely — the broken build — the
      // label assertion above passes on its own, because what showed was `unfreeze_column`.
      expect(items).not.toContain('unfreeze_column');
    });

    test('freezes the picked column', async () => {
      await grid.openColumnMenu(CUSTOM_KEYS, 'Charlie');
      await grid.clickDropdownMenuItem(FREEZE_LABEL);

      expect(await grid.fixedColumnsStart(CUSTOM_KEYS)).toBe(1);
      expect(await grid.columnHeaders(CUSTOM_KEYS)).toEqual(
        ['Charlie', 'Alpha', 'Bravo', 'Delta', 'Echo', 'Foxtrot']
      );
    });

    test('leaves the columns past the freeze point where they were', async () => {
      await grid.openColumnMenu(CUSTOM_KEYS, 'Charlie');
      await grid.clickDropdownMenuItem(FREEZE_LABEL);

      // Freezing Charlie shifts only Alpha and Bravo, which sat before it. Delta onwards must keep
      // both their data and their index — a move that dragged them along would still satisfy a
      // "Charlie is first" assertion on its own.
      const row = await grid.rowData(CUSTOM_KEYS, 0);

      expect(row.slice(3)).toEqual(['d1', 'e1', 'f1']);
      expect(row).toEqual(['c1', 'a1', 'b1', 'd1', 'e1', 'f1']);
    });

    test('unfreezes the column again from the frozen area', async () => {
      await grid.openColumnMenu(CUSTOM_KEYS, 'Charlie');
      await grid.clickDropdownMenuItem(FREEZE_LABEL);

      // The frozen column's header is drawn by a different overlay clone, which is the part of the
      // round trip most likely to break silently.
      await grid.openColumnMenu(CUSTOM_KEYS, 'Charlie');

      const items = await grid.visibleDropdownMenuItems();

      expect(items).toContain(UNFREEZE_LABEL);
      expect(items).not.toContain(FREEZE_LABEL);

      await grid.clickDropdownMenuItem(UNFREEZE_LABEL);

      expect(await grid.fixedColumnsStart(CUSTOM_KEYS)).toBe(0);
    });
  });

  test.describe('dropdownMenu: true', () => {
    test('offers the entry alongside the built-in items', async () => {
      await grid.openColumnMenu(DEFAULT_MENU, 'Charlie');

      const items = await grid.visibleDropdownMenuItems();

      // The plugin contributes to the default list the same way it always has for the context
      // menu. The built-in entry is asserted too, so a regression that replaced the default list
      // rather than appending to it is visible here.
      expect(items).toContain(FREEZE_LABEL);
      expect(items).toContain('Insert column left');
    });

    test('freezes the picked column', async () => {
      await grid.openColumnMenu(DEFAULT_MENU, 'Charlie');
      await grid.clickDropdownMenuItem(FREEZE_LABEL);

      expect(await grid.fixedColumnsStart(DEFAULT_MENU)).toBe(1);
      expect(await grid.columnHeaders(DEFAULT_MENU)).toEqual(
        ['Charlie', 'Alpha', 'Bravo', 'Delta', 'Echo', 'Foxtrot']
      );
    });
  });

  test.describe('toggling manualColumnFreeze after the menu was built', () => {
    // The menu rebuilds its item list on every open, the same way the context menu does, so a
    // plugin switched on or off through `updateSettings` is picked up the next time it opens.
    // The entries carry their own enabled check as well: `CommandExecutor` never evicts a command
    // it registered, so the rebuild alone does not close the `executeCommand()` path.
    test('drops the entry when the plugin is turned off', async () => {
      await grid.openColumnMenu(TOGGLE, 'Charlie');
      expect(await grid.visibleDropdownMenuItems()).toContain(FREEZE_LABEL);
      await grid.clickDropdownMenuItem(FREEZE_LABEL);
      expect(await grid.fixedColumnsStart(TOGGLE)).toBe(1);

      await grid.setManualColumnFreeze(TOGGLE, false);
      await grid.openColumnMenu(TOGGLE, 'Alpha');

      const items = await grid.visibleDropdownMenuItems();

      // Both entries have to go. A stale row is not merely cosmetic: freezeColumn() has no
      // enabled-guard, so clicking one used to freeze a column through a plugin that was off.
      expect(items).not.toContain(FREEZE_LABEL);
      expect(items).not.toContain(UNFREEZE_LABEL);
      // Turning the plugin off drops its menu entries, but must not undo what it already did.
      expect(await grid.fixedColumnsStart(TOGGLE)).toBe(1);
    });

    test('refuses the command through the API once the plugin is off', async () => {
      await grid.setManualColumnFreeze(TOGGLE, false);

      // The menu no longer offers the entry, but the command executor keeps every command it was
      // ever given, so this path stays reachable. `execute()` gates on `disabled`, not `hidden`,
      // which is why the guard has to sit on both.
      const error = await grid.executeDropdownCommand(TOGGLE, 'freeze_column', 2);

      // A throw would also leave the grid unfrozen, so the command must be refused, not broken.
      expect(error).toBeNull();
      expect(await grid.fixedColumnsStart(TOGGLE)).toBe(0);
      expect(await grid.columnHeaders(TOGGLE)).toEqual(
        ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot']
      );
    });

    test('still runs the command through the API while the plugin is on', async () => {
      // The other half of the guard: it must refuse only when the plugin is off.
      const error = await grid.executeDropdownCommand(TOGGLE, 'freeze_column', 2);

      expect(error).toBeNull();
      expect(await grid.fixedColumnsStart(TOGGLE)).toBe(1);
    });

    test('runs the command through the API without the menu ever being opened', async () => {
      // Commands are registered when the list is built, which happens on open. A caller that
      // enables the plugin and goes straight to the API would otherwise hit "command not exists",
      // so whether this works must not depend on the user having opened the menu first.
      await grid.setManualColumnFreeze(TOGGLE_OFF_START, true);

      const error = await grid.executeDropdownCommand(TOGGLE_OFF_START, 'freeze_column', 2);

      expect(error).toBeNull();
      expect(await grid.fixedColumnsStart(TOGGLE_OFF_START)).toBe(1);
    });

    test('leaves an already open menu alone', async () => {
      await grid.openColumnMenu(TOGGLE, 'Charlie');
      // A real transition, not a write of the value it already holds: this grid starts enabled.
      await grid.setManualColumnFreeze(TOGGLE, false);

      // The earlier design rebuilt the whole DropdownMenu from this plugin, which destroyed the
      // menu DOM under the user. Rebuilding on open instead leaves an open menu untouched — the
      // entry it already shows goes stale until the next open, which is the accepted trade.
      expect(await grid.isDropdownMenuOpen()).toBe(true);
      expect(await grid.visibleDropdownMenuItems()).toContain(FREEZE_LABEL);

      await grid.closeDropdownMenu();
      await grid.openColumnMenu(TOGGLE, 'Charlie');

      expect(await grid.visibleDropdownMenuItems()).not.toContain(FREEZE_LABEL);
    });

    test('picks the entry up when a plugin that started off is turned on', async () => {
      // This grid was built with the plugin disabled, so the hook never ran and the entry is not
      // in the list at all. Only rebuilding the list on open can produce it — a `hidden()` guard
      // has nothing to reveal here, which is what separates this case from the one above.
      await grid.openColumnMenu(TOGGLE_OFF_START, 'Charlie');
      expect(await grid.visibleDropdownMenuItems()).not.toContain(FREEZE_LABEL);

      await grid.setManualColumnFreeze(TOGGLE_OFF_START, true);
      await grid.openColumnMenu(TOGGLE_OFF_START, 'Charlie');

      expect(await grid.visibleDropdownMenuItems()).toContain(FREEZE_LABEL);

      await grid.clickDropdownMenuItem(FREEZE_LABEL);

      expect(await grid.fixedColumnsStart(TOGGLE_OFF_START)).toBe(1);
      expect(await grid.columnHeaders(TOGGLE_OFF_START)).toEqual(
        ['Charlie', 'Alpha', 'Bravo', 'Delta', 'Echo', 'Foxtrot']
      );
    });
  });

  test.describe('alongside the Filters interface', () => {
    test('puts the entry after the filter items', async () => {
      await grid.openColumnMenu(FILTERS_ORDER, 'Charlie');

      const items = await grid.visibleDropdownMenuItems();

      // Filters makes up the bulk of the column menu, so the freeze entry belongs at the end.
      // Registration order follows plugin priority, and ManualColumnFreeze (110) would otherwise
      // run before Filters (250) and push the whole filter interface down.
      //
      // Matched on a prefix because the filter rows are composite: the "Filter by value" cell
      // carries its whole nested list in its text.
      const freezeIndex = items.indexOf(FREEZE_LABEL);
      const filterByValueIndex = items.findIndex(item => item.startsWith('Filter by value'));
      const filterByConditionIndex = items.findIndex(item => item.startsWith('Filter by condition'));

      expect(freezeIndex).toBeGreaterThan(-1);
      expect(filterByConditionIndex).toBeGreaterThan(-1);
      expect(filterByValueIndex).toBeGreaterThan(-1);
      expect(freezeIndex).toBeGreaterThan(filterByValueIndex);
      expect(freezeIndex).toBeGreaterThan(filterByConditionIndex);
    });
  });

  test.describe('a custom list that does not name the keys', () => {
    test('is left exactly as the developer wrote it', async () => {
      await grid.openColumnMenu(OTHER_KEYS, 'Charlie');

      // The entries reach `dropdownMenu: true` through the default pattern. A user-supplied item
      // list is not that pattern, so nothing may be injected into it.
      expect(await grid.visibleDropdownMenuItems()).toEqual(
        ['Insert column left', 'Insert column right']
      );
    });
  });

  test.describe('the contextMenu path', () => {
    test('still freezes the column', async () => {
      await grid.openContextMenu(CONTEXT_CONTROL, 0, 2);

      const items = await grid.visibleContextMenuItems();

      expect(items).toContain(FREEZE_LABEL);

      await grid.clickContextMenuItem(FREEZE_LABEL);

      expect(await grid.fixedColumnsStart(CONTEXT_CONTROL)).toBe(1);
      expect(await grid.columnHeaders(CONTEXT_CONTROL)).toEqual(
        ['Charlie', 'Alpha', 'Bravo', 'Delta', 'Echo', 'Foxtrot']
      );
    });
  });

  test.describe('manualColumnFreeze disabled', () => {
    // The entries belong to the plugin, so with it off nothing resolves either key. ItemsFactory
    // used to emit a `{ name, key }` placeholder for each, and the menu rendered a row labeled
    // with the RAW KEY that did nothing when clicked — the shape #5429 reported. Those rows are
    // now skipped, which is what this block pins (DEV-2758).
    test('skips the unresolvable keys instead of rendering raw-key rows', async () => {
      await grid.openColumnMenu(PLUGIN_OFF, 'Charlie');

      const items = await grid.visibleDropdownMenuItems();

      // Every item was dropped, so the menu falls back to its empty-list entry. Asserted as an
      // exact list, because a build that skipped only one of the two keys would still satisfy
      // the absence checks below.
      expect(items).toEqual(['No available options']);
      expect(items).not.toContain('freeze_column');
      expect(items).not.toContain('unfreeze_column');
    });

    test('reports the key as an unknown command through the API', async () => {
      // The skipped row is never registered as a command either, so the API path the placeholder
      // used to leave open now answers plainly instead of accepting the call and doing nothing.
      // Driving `executeCommand` is the only way to reach that path — opening and closing the
      // menu would assert nothing, since no build freezes a column just for being opened.
      const error = await grid.executeDropdownCommand(PLUGIN_OFF, 'freeze_column', 2);

      expect(error).toContain('freeze_column');
      expect(await grid.fixedColumnsStart(PLUGIN_OFF)).toBe(0);
      expect(await grid.columnHeaders(PLUGIN_OFF)).toEqual(
        DropdownMenuFreezeColumnPage.COLUMN_HEADERS
      );
    });

    test('warns on the console so the developer can find the key', async () => {
      // Dropping the row silently would trade a visible defect for an invisible one. The warning
      // is the replacement signal, and it names the key that could not be resolved.
      //
      // `prepareMenuItems()` runs once from `enablePlugin`, so the warning is emitted while the
      // grid is being built — the developer sees it without opening the menu at all. That is
      // before the `beforeEach` navigation returns, hence the listener plus a second visit.
      const warnings = grid.collectUnresolvedKeyWarnings();

      await grid.goto();

      // Console events arrive over CDP independently of `goto()` resolving, so the wait has to be
      // a contract rather than luck — a late message would otherwise fail the run, and a spec
      // that only passes on retry still fails the job on CI.
      await expect.poll(() => warnings.join('\n')).toContain('freeze_column');
      await expect.poll(() => warnings.join('\n')).toContain('unfreeze_column');
    });
  });
});
