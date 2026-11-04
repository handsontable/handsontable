import { test, expect } from '../fixtures/test';
import { DropdownMenuHiddenColumnsPage } from '../fixtures/pages/DropdownMenuHiddenColumnsPage';

/**
 * `hidden_columns_hide` and `hidden_columns_show` as `dropdownMenu` keys.
 *
 * HiddenColumns used to add its entries to the context menu only, so listing either key in
 * `dropdownMenu` resolved to nothing: the key was skipped with an unresolved-key warning. The
 * plugin now offers both entries to the dropdown menu as well, but only to a configuration that
 * lists their keys. `dropdownMenu: true` keeps its default list.
 *
 * The label assertions check the translated text, so a row that renders the raw key cannot pass.
 */
test.describe('hidden_columns_hide / hidden_columns_show as dropdown menu keys', () => {
  let grid: DropdownMenuHiddenColumnsPage;

  const {
    CUSTOM_KEYS, DEFAULT_MENU, CONTEXT_CONTROL, PLUGIN_OFF, STARTS_HIDDEN, OBJECT_FORM, COPY_LISTENER,
    HIDE_LABEL, SHOW_LABEL,
  } = DropdownMenuHiddenColumnsPage;

  const DEFAULT_ITEMS = [
    'Insert column left',
    'Insert column right',
    'Remove column',
    'Clear column',
    'Read only',
    'Alignment',
  ];

  const countOf = (items: string[], label: string) => items.filter(item => item === label).length;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DropdownMenuHiddenColumnsPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('the keys listed explicitly in dropdownMenu', () => {
    test('renders "Hide column" exactly once and never the raw keys', async() => {
      await grid.openColumnMenu(CUSTOM_KEYS, 'Charlie');

      const items = await grid.visibleDropdownMenuItems();

      expect(items).toEqual(['Insert column left', HIDE_LABEL]);
      expect(countOf(items, HIDE_LABEL)).toBe(1);
      expect(items).not.toContain('hidden_columns_hide');
      expect(items).not.toContain('hidden_columns_show');
    });

    test('raises no unresolved-key warning for the keys when the menu opens', async() => {
      const warnings = grid.collectUnresolvedKeyWarnings();

      await grid.openColumnMenu(CUSTOM_KEYS, 'Charlie');
      await warnings.flush();

      expect(warnings.matching.filter(text => text.includes('hidden_columns_'))).toEqual([]);
    });

    test('hides the picked column and keeps its data', async() => {
      await grid.openColumnMenu(CUSTOM_KEYS, 'Charlie');
      await grid.clickDropdownMenuItem(HIDE_LABEL);

      await expect(grid.renderedHeader(CUSTOM_KEYS, 'Charlie')).toHaveCount(0);
      await expect(grid.renderedHeader(CUSTOM_KEYS, 'Bravo')).toBeVisible();
      await expect(grid.renderedHeader(CUSTOM_KEYS, 'Delta')).toBeVisible();
      expect(await grid.hiddenColumns(CUSTOM_KEYS)).toEqual([2]);
      expect(await grid.columnData(CUSTOM_KEYS, 2)).toEqual(['c1', 'c2', 'c3']);
    });
  });

  test.describe('a column next to a hidden one', () => {
    test('offers "Show column" in the dropdown of the column before the hidden one', async() => {
      await grid.openColumnMenu(STARTS_HIDDEN, 'Charlie');

      expect(await grid.visibleDropdownMenuItems()).toEqual(['Insert column left', HIDE_LABEL, SHOW_LABEL]);
    });

    test('does not offer "Show column" for a column with no hidden neighbor', async() => {
      await grid.openColumnMenu(STARTS_HIDDEN, 'Alpha');

      expect(await grid.visibleDropdownMenuItems()).toEqual(['Insert column left', HIDE_LABEL]);
    });

    test('reveals the hidden column when "Show column" is picked', async() => {
      await expect(grid.renderedHeader(STARTS_HIDDEN, 'Delta')).toHaveCount(0);

      await grid.openColumnMenu(STARTS_HIDDEN, 'Echo');
      await grid.clickDropdownMenuItem(SHOW_LABEL);

      await expect(grid.renderedHeader(STARTS_HIDDEN, 'Delta')).toBeVisible();
      expect(await grid.hiddenColumns(STARTS_HIDDEN)).toEqual([]);
      expect(await grid.columnData(STARTS_HIDDEN, 3)).toEqual(['d1', 'd2', 'd3']);
    });
  });

  test.describe('dropdownMenu: true', () => {
    test('keeps the default item list without the hide and show entries', async() => {
      await grid.openColumnMenu(DEFAULT_MENU, 'Charlie');

      const items = await grid.visibleDropdownMenuItems();

      expect(items).toEqual(DEFAULT_ITEMS);
      expect(items).not.toContain(HIDE_LABEL);
    });

    test('keeps the default item list when a listener replaces the items with copies', async() => {
      await grid.openColumnMenu(COPY_LISTENER, 'Charlie');

      expect(await grid.visibleDropdownMenuItems()).toEqual(DEFAULT_ITEMS);
    });
  });

  test.describe('the object form of items', () => {
    test('keeps the custom label and runs the built-in hide action', async() => {
      await grid.openColumnMenu(OBJECT_FORM, 'Charlie');

      expect(await grid.visibleDropdownMenuItems()).toEqual(['Hide this column']);

      await grid.clickDropdownMenuItem('Hide this column');

      await expect(grid.renderedHeader(OBJECT_FORM, 'Charlie')).toHaveCount(0);
      expect(await grid.hiddenColumns(OBJECT_FORM)).toEqual([2]);
    });
  });

  test.describe('the executeCommand API', () => {
    test('runs hidden_columns_hide when dropdownMenu lists the key', async() => {
      const error = await grid.executeDropdownCommand(CUSTOM_KEYS, 'hidden_columns_hide', 2);

      expect(error).toBeNull();
      expect(await grid.hiddenColumns(CUSTOM_KEYS)).toEqual([2]);
    });

    test('reports hidden_columns_hide as an unknown command under dropdownMenu: true', async() => {
      const error = await grid.executeDropdownCommand(DEFAULT_MENU, 'hidden_columns_hide', 2);

      expect(error).toContain('hidden_columns_hide');
      expect(await grid.hiddenColumns(DEFAULT_MENU)).toEqual([]);
    });
  });

  test.describe('the contextMenu path', () => {
    test('still offers "Hide column" in the default context menu and hides the column', async() => {
      await grid.openContextMenuOnHeader(CONTEXT_CONTROL, 'Charlie');

      const items = await grid.visibleContextMenuItems();

      expect(countOf(items, HIDE_LABEL)).toBe(1);

      await grid.clickContextMenuItem(HIDE_LABEL);

      await expect(grid.renderedHeader(CONTEXT_CONTROL, 'Charlie')).toHaveCount(0);
      expect(await grid.hiddenColumns(CONTEXT_CONTROL)).toEqual([2]);
    });
  });

  test.describe('hiddenColumns disabled', () => {
    test('skips the key and shows the empty-list entry', async() => {
      await grid.openColumnMenu(PLUGIN_OFF, 'Charlie');

      const items = await grid.visibleDropdownMenuItems();

      expect(items).toEqual(['No available options']);
      expect(items).not.toContain('hidden_columns_hide');
    });

    test('warns on the console with the key name', async() => {
      const warnings = grid.collectUnresolvedKeyWarnings();

      await grid.openColumnMenu(PLUGIN_OFF, 'Charlie');

      await expect.poll(() => warnings.matching.join('\n')).toContain('hidden_columns_hide');
    });
  });

  test.describe('the keyboard path', () => {
    test('reaches "Hide column" by its role and name and hides the column with Enter', async({ page }) => {
      await grid.selectCell(CUSTOM_KEYS, 0, 2);
      await page.keyboard.press('Shift+Alt+ArrowDown');

      await expect(grid.dropdownMenuItem('Insert column left')).toBeFocused();

      await page.keyboard.press('ArrowDown');

      const hideItem = grid.dropdownMenuItem(HIDE_LABEL);

      await expect(hideItem).toBeFocused();
      await expect(hideItem).toHaveAccessibleName(HIDE_LABEL);

      await page.keyboard.press('Enter');

      await expect(grid.openMenu('.htDropdownMenu')).toBeHidden();
      await expect(grid.renderedHeader(CUSTOM_KEYS, 'Charlie')).toHaveCount(0);
      expect(await grid.hiddenColumns(CUSTOM_KEYS)).toEqual([2]);
    });
  });
});
