import { test, expect } from '../fixtures/test';
import { DropdownMenuFreezeColumnPage } from '../fixtures/pages/DropdownMenuFreezeColumnPage';

/**
 * GitHub #5429. `freeze_column` and `unfreeze_column` worked as `contextMenu` keys but did nothing
 * as `dropdownMenu` keys.
 *
 * The two menus build their item lists from separate hooks — `afterContextMenuDefaultOptions` and
 * `afterDropdownMenuDefaultOptions` — and ManualColumnFreeze registered only the first. A key the
 * dropdown menu has never heard of does not raise anything: `ItemsFactory` turns it into a bare
 * `{ name, key }` placeholder. So the menu rendered a row labelled with the RAW KEY, carrying no
 * callback and no `hidden()`, and clicking it closed the menu without freezing anything.
 *
 * That failure mode is why the label assertions below check the translated text rather than just
 * "a row is there" — the broken build rendered a row too.
 */
test.describe('freeze_column / unfreeze_column as dropdown menu keys', () => {
  let grid: DropdownMenuFreezeColumnPage;

  const { CUSTOM_KEYS, DEFAULT_MENU, CONTEXT_CONTROL, PLUGIN_OFF, FREEZE_LABEL, UNFREEZE_LABEL } =
    DropdownMenuFreezeColumnPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new DropdownMenuFreezeColumnPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('the keys listed explicitly in dropdownMenu', () => {
    test('renders the translated label, not the raw key', async () => {
      await grid.openColumnMenu(CUSTOM_KEYS, 2);

      const items = await grid.visibleDropdownMenuItems();

      expect(items).toContain(FREEZE_LABEL);
      // The exact string the broken build showed. Asserted separately from the positive check
      // because a build that rendered BOTH would still pass the `toContain` above.
      expect(items).not.toContain('freeze_column');
    });

    test('offers unfreeze only once the column is frozen', async () => {
      // Nothing is frozen yet, so `unfreeze_column`'s `hidden()` must suppress it. This doubles as
      // proof that `hidden()` ran against a real selection: the placeholder the broken build
      // produced had no `hidden()` at all, so it always showed.
      await grid.openColumnMenu(CUSTOM_KEYS, 2);

      const items = await grid.visibleDropdownMenuItems();

      expect(items).not.toContain(UNFREEZE_LABEL);
      // The raw key has to be checked too. Absent the entry entirely — the broken build — the
      // label assertion above passes on its own, because what showed was `unfreeze_column`.
      expect(items).not.toContain('unfreeze_column');
    });

    test('freezes the picked column', async () => {
      await grid.openColumnMenu(CUSTOM_KEYS, 2);
      await grid.clickDropdownMenuItem(FREEZE_LABEL);

      expect(await grid.fixedColumnsStart(CUSTOM_KEYS)).toBe(1);
      expect(await grid.columnHeaders(CUSTOM_KEYS)).toEqual(
        ['Charlie', 'Alpha', 'Bravo', 'Delta', 'Echo', 'Foxtrot']
      );
    });

    test('leaves the columns past the freeze point where they were', async () => {
      await grid.openColumnMenu(CUSTOM_KEYS, 2);
      await grid.clickDropdownMenuItem(FREEZE_LABEL);

      // Freezing Charlie shifts only Alpha and Bravo, which sat before it. Delta onwards must keep
      // both their data and their index — a move that dragged them along would still satisfy a
      // "Charlie is first" assertion on its own.
      const row = await grid.rowData(CUSTOM_KEYS, 0);

      expect(row.slice(3)).toEqual(['d1', 'e1', 'f1']);
      expect(row).toEqual(['c1', 'a1', 'b1', 'd1', 'e1', 'f1']);
    });

    test('unfreezes the column again from the frozen area', async () => {
      await grid.openColumnMenu(CUSTOM_KEYS, 2);
      await grid.clickDropdownMenuItem(FREEZE_LABEL);

      // The frozen column's header is drawn by a different overlay clone, which is the part of the
      // round trip most likely to break silently.
      await grid.openColumnMenu(CUSTOM_KEYS, 0);

      const items = await grid.visibleDropdownMenuItems();

      expect(items).toContain(UNFREEZE_LABEL);
      expect(items).not.toContain(FREEZE_LABEL);

      await grid.clickDropdownMenuItem(UNFREEZE_LABEL);

      expect(await grid.fixedColumnsStart(CUSTOM_KEYS)).toBe(0);
    });
  });

  test.describe('dropdownMenu: true', () => {
    test('offers the entry alongside the built-in items', async () => {
      await grid.openColumnMenu(DEFAULT_MENU, 2);

      const items = await grid.visibleDropdownMenuItems();

      // The plugin contributes to the default list the same way it always has for the context
      // menu. The built-in entry is asserted too, so a regression that replaced the default list
      // rather than appending to it is visible here.
      expect(items).toContain(FREEZE_LABEL);
      expect(items).toContain('Insert column left');
    });

    test('freezes the picked column', async () => {
      await grid.openColumnMenu(DEFAULT_MENU, 2);
      await grid.clickDropdownMenuItem(FREEZE_LABEL);

      expect(await grid.fixedColumnsStart(DEFAULT_MENU)).toBe(1);
      expect(await grid.columnHeaders(DEFAULT_MENU)).toEqual(
        ['Charlie', 'Alpha', 'Bravo', 'Delta', 'Echo', 'Foxtrot']
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
    test('offers no freeze entry', async () => {
      await grid.openColumnMenu(PLUGIN_OFF, 2);

      // The entries belong to the plugin. With it off nothing may contribute them, which is what
      // keeps the second hook registration from handing the menu a dead item.
      expect(await grid.visibleDropdownMenuItems()).not.toContain(FREEZE_LABEL);
      expect(await grid.fixedColumnsStart(PLUGIN_OFF)).toBe(0);
    });
  });
});
