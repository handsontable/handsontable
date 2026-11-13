import { test, expect, THEMES_TAG } from '../fixtures/test';
import { RowSelectionPage } from '../fixtures/pages/RowSelectionPage';
import { CheckboxHeaderPage } from '../fixtures/pages/CheckboxHeaderPage';

/**
 * The RowSelection plugin (PRO-87). In the fixture, the row at index 3 is "archived" and
 * `isRowSelectable` rejects it, so 7 of the 8 rows can be selected.
 */
test.describe('Row selection checkboxes', { tag: THEMES_TAG }, () => {
  test('selects a row on a checkbox press, marks the row, and leaves the cell selection alone',
    async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.goto();
      await grid.rowCheckbox(1).click();

      await expect.poll(() => grid.selectedRows()).toEqual([1]);
      await expect(grid.rowCheckbox(1)).toBeChecked();
      await expect(grid.cell(1, 0)).toHaveClass(/\bhtRowSelected\b/);
      await expect(grid.cell(0, 0)).not.toHaveClass(/\bhtRowSelected\b/);
      expect(await grid.cellSelection()).toBeUndefined();
      expect(await grid.eventSources()).toEqual(['checkbox']);

      // The press kept the browser focus off the checkbox, so the keyboard stays with the grid.
      expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('INPUT');

      await grid.rowCheckbox(1).click();

      await expect.poll(() => grid.selectedRows()).toEqual([]);
      await expect(grid.rowCheckbox(1)).not.toBeChecked();
    });

  test('shows the mixed state, selects every selectable row from it, and clears them from checked',
    async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);
      const header = grid.headerCheckbox();

      await grid.goto();
      await expect(header).not.toBeChecked();
      await expect(header).toHaveAccessibleName('Select all rows (0 of 7 selected)');

      await grid.rowCheckbox(0).click();

      await expect.poll(() => grid.isIndeterminate(header)).toBe(true);
      await expect(header).toHaveAttribute('aria-checked', 'mixed');

      await header.click();

      await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
      await expect(header).toBeChecked();
      await expect(header).toHaveAccessibleName('Select all rows (7 of 7 selected)');
      expect(await grid.isIndeterminate(header)).toBe(false);

      await header.click();

      await expect.poll(() => grid.selectedRows()).toEqual([]);
      await expect(header).not.toBeChecked();
    });

  test('centers the "select all" checkbox vertically in its header cell', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    // The corner's label is hidden, so its container used to shrink to the checkbox and sit at the
    // top of the cell, 4px above center on the main theme.
    expect(Math.abs(await grid.verticalOffsetInHeader(grid.headerCheckbox()))).toBeLessThanOrEqual(1);

    await grid.switchLocation('firstColumn');

    expect(Math.abs(await grid.verticalOffsetInHeader(grid.headerCheckbox('firstColumn')))).toBeLessThanOrEqual(1);
  });

  test('disables the checkbox of a row that cannot be selected', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.rowCheckbox(3)).toBeDisabled();

    // The whole header cell is the hit area, so a press beside the checkbox is a press on it. A
    // disabled input never receives the press itself, which is why the test aims at the cell.
    await grid.rowHeaderCell(3).click({ position: { x: 3, y: 3 } });

    // The press was handled (the plugin took it, so it did not select the header as a cell), but
    // the row stayed out of the selection.
    expect(await grid.selectedRows()).toEqual([]);
    await expect(grid.rowCheckbox(3)).not.toBeChecked();

    // The same press on a selectable row selects it: the position is a real hit area.
    await grid.rowHeaderCell(2).click({ position: { x: 3, y: 3 } });

    await expect.poll(() => grid.selectedRows()).toEqual([2]);
  });

  test('selects a range with Shift and skips the rows that cannot be selected', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.rowCheckbox(1).click();
    await grid.rowCheckbox(5).click({ modifiers: ['Shift'] });

    await expect.poll(() => grid.selectedRows()).toEqual([1, 2, 4, 5]);
  });

  test('toggles the focused row and the whole scope with Space', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    // The plugin's column is the row header column next to the data, so its coordinate is -1.
    await grid.focusCell(2, -1);
    await page.keyboard.press('Space');

    await expect.poll(() => grid.selectedRows()).toEqual([2]);

    await grid.focusCell(-1, -1);
    await page.keyboard.press('Space');

    await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
    expect(await grid.eventSources()).toEqual(['keyboard', 'keyboard']);
  });

  test('toggles the focused row with Space on any data cell, without opening the editor', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.focusCell(2, 0);
    await page.keyboard.press('Space');

    await expect.poll(() => grid.selectedRows()).toEqual([2]);
    expect(await grid.isEditorOpened()).toBe(false);
    expect(await grid.dataAt(2, 0)).toBe('Item 2');
    await expect(grid.announcer()).toHaveText('Row 3 selected');

    await page.keyboard.press('Space');

    await expect.poll(() => grid.selectedRows()).toEqual([]);
    await expect(grid.announcer()).toHaveText('Row 3 deselected');
  });

  test('toggles every row of a selected range with Space, skipping the rows that cannot be selected', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.selectRange(1, 0, 4, 1);
    await page.keyboard.press('Space');

    await expect.poll(() => grid.selectedRows()).toEqual([1, 2, 4]);
    await expect(grid.announcer()).toHaveText('3 of 7 rows selected');

    // Every selectable row of the range is selected now, so Space deselects them.
    await page.keyboard.press('Space');

    await expect.poll(() => grid.selectedRows()).toEqual([]);
  });

  test('selects only the filtered rows with the "filtered" scope', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto({ scope: 'filtered' });
    await grid.filterStatus('even');

    await expect.poll(() => grid.countRows()).toBe(4);
    await expect(grid.headerCheckbox()).toHaveAccessibleName('Select all rows (0 of 4 selected)');

    await grid.headerCheckbox().click();

    await expect.poll(() => grid.selectedPhysicalRows()).toEqual([0, 2, 4, 6]);
  });

  test('selects the rows the filters removed with the default "all" scope', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.filterStatus('even');
    await grid.headerCheckbox().click();

    await expect.poll(() => grid.selectedPhysicalRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
  });

  test('keeps its own row header column when the row numbers are off', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto({ rowHeaders: false });

    // The checkbox column is the only row header column, so it holds no row numbers.
    await expect(page.locator('.ht_clone_inline_start tbody .rowHeader')).toHaveCount(0);

    await grid.rowCheckbox(4).click();
    await expect.poll(() => grid.selectedRows()).toEqual([4]);

    await grid.focusCell(2, -1);
    await page.keyboard.press('Space');
    await expect.poll(() => grid.selectedRows()).toEqual([2, 4]);

    await grid.headerCheckbox().click();
    await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
  });

  test.describe('with the checkboxes in the first column', () => {
    test('renders the checkboxes next to the values and keeps the column label', async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.goto({ location: 'firstColumn' });

      await expect(grid.cell(2, 0)).toContainText('Item 2');
      await expect(page.locator('.ht_clone_top').getByText('Name', { exact: true })).toBeVisible();

      await grid.rowCheckbox(2, 'firstColumn').click();

      await expect.poll(() => grid.selectedRows()).toEqual([2]);
      // The press on the checkbox did not select the cell it sits in.
      expect(await grid.cellSelection()).toBeUndefined();

      await grid.headerCheckbox('firstColumn').click();

      await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
      await expect(grid.rowCheckbox(6, 'firstColumn')).toBeChecked();
    });

    test('does not throw when a row checkbox is double-clicked while a column header is selected',
      async({ page, theme, bundle }) => {
        const grid = new RowSelectionPage(page, theme, bundle);
        const errors: string[] = [];

        page.on('pageerror', error => errors.push(error.message));

        await grid.goto({ location: 'firstColumn' });
        await grid.columnHeader('Name').click();

        await expect.poll(() => grid.selectionHighlight()).toEqual({ row: -1, col: 0, header: true });

        await grid.rowCheckbox(0, 'firstColumn').dblclick();

        expect(errors).toEqual([]);
        expect(await grid.isEditorOpened()).toBe(false);
      });

    test('keeps the first column label after switching from the row header location', async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.goto();
      await grid.switchLocation('firstColumn');

      // The header cell that was the plugin's corner is reused for the first column, and core
      // leaves `cornerHeader` on its label. A corner rule keyed on that class hid the label.
      await expect(page.locator('.ht_clone_top').getByText('Name', { exact: true })).toBeVisible();
      await expect(grid.headerCheckbox('firstColumn')).toBeVisible();
    });
  });
});

test.describe('Row selection with Space on a first column checkbox', { tag: THEMES_TAG }, () => {
  test('toggles the row and does not open the editor of the cell that holds the checkbox',
    async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.goto({ location: 'firstColumn' });
      await grid.focusCell(1, 0);
      await page.keyboard.press('Space');

      await expect.poll(() => grid.selectedRows()).toEqual([1]);
      await expect(grid.rowCheckbox(1, 'firstColumn')).toBeChecked();
      expect(await grid.isEditorOpened()).toBe(false);
      await expect(grid.cell(1, 0)).toContainText('Item 1');

      await page.keyboard.press('Space');

      await expect.poll(() => grid.selectedRows()).toEqual([]);
      expect(await grid.isEditorOpened()).toBe(false);
    });
});

test.describe('Row selection on a click (enableClickSelection)', { tag: THEMES_TAG }, () => {
  test('`true`: a click selects only its row, Ctrl/Cmd+click toggles, and Shift+click selects a range',
    async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.goto({ click: true });
      await grid.cell(1, 1).click();

      await expect.poll(() => grid.selectedRows()).toEqual([1]);
      await expect(grid.rowCheckbox(1)).toBeChecked();

      // A plain click replaces the selection.
      await grid.cell(6, 1).click();

      await expect.poll(() => grid.selectedRows()).toEqual([6]);

      // Ctrl/Cmd+click adds a row, and removes it again.
      await grid.cell(2, 0).click({ modifiers: ['ControlOrMeta'] });

      await expect.poll(() => grid.selectedRows()).toEqual([2, 6]);

      await grid.cell(6, 0).click({ modifiers: ['ControlOrMeta'] });

      await expect.poll(() => grid.selectedRows()).toEqual([2]);

      // Shift+click selects from the row clicked last (row 1) and skips the row that cannot be selected.
      await grid.cell(1, 0).click();
      await grid.cell(5, 1).click({ modifiers: ['Shift'] });

      await expect.poll(() => grid.selectedRows()).toEqual([1, 2, 4, 5]);
      expect(new Set(await grid.eventSources())).toEqual(new Set(['click']));
    });

  test('`false`: a click selects the cell and leaves the rows alone', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto({ click: false });
    await grid.cell(2, 1).click();
    await grid.cell(4, 0).click({ modifiers: ['ControlOrMeta'] });

    // The clicks landed (the cell selection followed them), and selected no row.
    expect(await grid.lastSelectedRange()).toEqual({ from: { row: 4, col: 0 }, to: { row: 4, col: 0 } });
    expect(await grid.selectedRows()).toEqual([]);
    expect(await grid.eventSources()).toEqual([]);
  });

  test('`\'enableSelection\'`: a click selects, and no click deselects', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto({ click: 'enableSelection' });
    await grid.cell(2, 1).click();

    await expect.poll(() => grid.selectedRows()).toEqual([2]);

    await grid.cell(4, 1).click({ modifiers: ['ControlOrMeta'] });

    await expect.poll(() => grid.selectedRows()).toEqual([2, 4]);

    // Ctrl/Cmd+click on a selected row would deselect it under `true`.
    await grid.cell(2, 0).click({ modifiers: ['ControlOrMeta'] });

    expect(await grid.lastSelectedRange()).toEqual({ from: { row: 2, col: 0 }, to: { row: 2, col: 0 } });
    expect(await grid.selectedRows()).toEqual([2, 4]);
  });

  test('`\'enableDeselection\'`: a Ctrl/Cmd+click deselects, and no click selects', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto({ click: 'enableDeselection' });
    await grid.cell(2, 1).click();
    await grid.cell(4, 1).click({ modifiers: ['ControlOrMeta'] });
    await grid.cell(5, 1).click({ modifiers: ['Shift'] });

    expect(await grid.lastSelectedRange()).toEqual({ from: { row: 4, col: 1 }, to: { row: 5, col: 1 } });
    expect(await grid.selectedRows()).toEqual([]);

    await grid.rowCheckbox(1).click();
    await grid.rowCheckbox(6).click();
    await expect.poll(() => grid.selectedRows()).toEqual([1, 6]);

    await grid.cell(1, 0).click({ modifiers: ['ControlOrMeta'] });

    await expect.poll(() => grid.selectedRows()).toEqual([6]);
    await expect(grid.rowCheckbox(1)).not.toBeChecked();
  });

  test('a press on a row checkbox toggles the row once, in both checkbox locations', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto({ click: true, location: 'firstColumn' });
    await grid.rowCheckbox(2, 'firstColumn').click();

    // The click selection would select the row again after the checkbox toggled it, or replace
    // the selection with it.
    await expect.poll(() => grid.selectedRows()).toEqual([2]);
    await grid.rowCheckbox(5, 'firstColumn').click();
    await expect.poll(() => grid.selectedRows()).toEqual([2, 5]);
    await grid.rowCheckbox(2, 'firstColumn').click();

    await expect.poll(() => grid.selectedRows()).toEqual([5]);
    expect(await grid.eventSources()).toEqual(['checkbox', 'checkbox', 'checkbox']);

    await grid.goto({ click: true });
    await grid.rowCheckbox(2).click();
    await grid.rowCheckbox(5).click();

    await expect.poll(() => grid.selectedRows()).toEqual([2, 5]);
    expect(await grid.eventSources()).toEqual(['checkbox', 'checkbox']);

    await grid.headerCheckbox().click();

    await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
    expect(await grid.eventSources()).toEqual(['checkbox', 'checkbox', 'headerCheckbox']);
  });

  test('a press on a bound checkbox column or its header toggles the rows once', async({ page, theme, bundle }) => {
    const grid = new CheckboxHeaderPage(page, theme, bundle);

    await grid.goto('bound', { click: true });
    await grid.cellCheckbox(3).click();

    await expect.poll(() => grid.selectedRows()).toEqual([1, 3]);
    expect(await grid.doneValues()).toEqual([false, true, false, true, false, false]);
    expect(await grid.selectionSources()).toEqual(['checkbox']);

    await grid.cellCheckbox(4).click();
    await expect.poll(() => grid.selectedRows()).toEqual([1, 3, 4]);
    await grid.cellCheckbox(3).click();

    await expect.poll(() => grid.selectedRows()).toEqual([1, 4]);

    await grid.headerCheckbox().click();

    await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 3, 4, 5]);
    expect(await grid.doneValues()).toEqual([true, true, false, true, true, true]);
  });
});

test.describe('Row selection checkboxes that are hidden', { tag: THEMES_TAG }, () => {
  test('`hideDisabledCheckboxes` leaves a plain row header on a row that cannot be selected', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto({ hideDisabled: true });

    await expect(grid.rowCheckbox(2)).toBeVisible();
    await expect(grid.rowCheckbox(3)).toHaveCount(0);
    await expect(grid.rowCheckboxesInHeader()).toHaveCount(7);
    expect(await grid.cursorOf(grid.rowHeaderCell(2))).toBe('pointer');
    expect(await grid.cursorOf(grid.rowHeaderCell(3))).not.toBe('pointer');

    await grid.rowHeaderCell(3).click();

    // A plain header: the press selected the row's cells, and no row.
    expect(await grid.lastSelectedRange()).toEqual({ from: { row: 3, col: 0 }, to: { row: 3, col: 1 } });
    expect(await grid.selectedRows()).toEqual([]);
  });

  test('`hideDisabledCheckboxes` keeps the first column values aligned, and its placeholder selects nothing',
    async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.goto({ location: 'firstColumn', hideDisabled: true });

      const placeholder = grid.firstColumnCheckboxInput(3);

      await expect(placeholder).toHaveCount(1);
      await expect(placeholder).toBeHidden();
      await expect(grid.rowCheckbox(2, 'firstColumn')).toBeVisible();
      // The placeholder takes the room the checkbox takes on the other rows.
      expect(Math.abs(await grid.valueTextX(3, 0) - await grid.valueTextX(2, 0))).toBeLessThanOrEqual(0.5);

      await grid.pressAtBoxOf(placeholder);

      // The press reached the cell underneath and selected it as a cell, not as a row.
      expect(await grid.lastSelectedRange()).toEqual({ from: { row: 3, col: 0 }, to: { row: 3, col: 0 } });
      expect(await grid.selectedRows()).toEqual([]);
    });

  test('`checkboxes: false` shows no row checkbox, and a press on a row header selects no row', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto({ checkboxes: false });

    await expect(page.getByRole('checkbox', { name: /^Select row \d+$/ })).toHaveCount(0);

    await grid.rowHeaderCell(2).click();

    expect(await grid.lastSelectedRange()).toEqual({ from: { row: 2, col: 0 }, to: { row: 2, col: 1 } });
    expect(await grid.selectedRows()).toEqual([]);

    // Space on the plugin's header cell does nothing without a checkbox there.
    await grid.focusCell(4, -1);
    await page.keyboard.press('Space');

    expect(await grid.selectedRows()).toEqual([]);
  });

  test('`checkboxes` as a function shows a checkbox per row, and a row without one is a plain header',
    async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      // The fixture's function shows a checkbox on the even rows only.
      await grid.goto({ checkboxes: 'even' });

      await expect(grid.rowCheckbox(0)).toBeVisible();
      await expect(grid.rowCheckbox(2)).toBeVisible();
      await expect(grid.rowCheckbox(1)).toHaveCount(0);
      await expect(grid.rowCheckboxesInHeader()).toHaveCount(4);

      await grid.rowHeaderCell(1).click();

      expect(await grid.lastSelectedRange()).toEqual({ from: { row: 1, col: 0 }, to: { row: 1, col: 1 } });
      expect(await grid.selectedRows()).toEqual([]);

      // The cell of a row with a checkbox is the checkbox's hit area.
      await grid.rowHeaderCell(2).click();

      await expect.poll(() => grid.selectedRows()).toEqual([2]);

      // The function hides the control; the row can still be selected from a data cell.
      await grid.focusCell(1, 0);
      await page.keyboard.press('Space');

      await expect.poll(() => grid.selectedRows()).toEqual([1, 2]);
    });
});

test.describe('Row selection corner without a "select all" checkbox', { tag: THEMES_TAG }, () => {
  for (const [label, options] of [
    ['`headerCheckbox: false`', { headerCheckbox: false }],
    ['the `\'singleRow\'` mode', { mode: 'singleRow' as const }],
  ] as const) {
    test(`${label}: the corner is a plain corner that selects every cell`, async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      // The default corner holds the checkbox and shows a pointer: the control for the cursor check.
      await grid.goto();
      expect(await grid.cursorOf(grid.cornerCell())).toBe('pointer');

      await grid.goto(options);

      await expect(grid.cornerCell()).toBeVisible();
      await expect(page.locator('.ht_clone_top_inline_start_corner').getByRole('checkbox')).toHaveCount(0);
      expect(await grid.cursorOf(grid.cornerCell())).not.toBe('pointer');

      await grid.rowCheckbox(2).click();
      await expect.poll(() => grid.selectedRows()).toEqual([2]);

      await grid.cornerCell().click();

      const range = await grid.lastSelectedRange();

      expect(range?.to).toEqual({ row: 7, col: 1 });
      expect(range?.from.row).toBeLessThanOrEqual(0);
      expect(range?.from.col).toBeLessThanOrEqual(0);
      expect(await grid.selectedRows()).toEqual([2]);
    });
  }
});

test.describe('Row selection vetoed by beforeRowSelectionChange', { tag: THEMES_TAG }, () => {
  test('leaves the checkbox unchecked after a press and after Space', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.setVeto(true);
    await grid.rowCheckbox(1).click();

    await expect(grid.rowCheckbox(1)).not.toBeChecked();
    expect(await grid.selectedRows()).toEqual([]);

    await grid.focusCell(2, 0);
    await page.keyboard.press('Space');

    await expect(grid.rowCheckbox(2)).not.toBeChecked();
    expect(await grid.selectedRows()).toEqual([]);
    expect(await grid.isEditorOpened()).toBe(false);

    // Without the veto the same Space selects the row: the key reached the plugin above.
    await grid.setVeto(false);
    await page.keyboard.press('Space');

    await expect(grid.rowCheckbox(2)).toBeChecked();
    expect(await grid.selectedRows()).toEqual([2]);
  });
});

test.describe('Row selection in the context menu', { tag: THEMES_TAG }, () => {
  test('hides its items with nothing selected, and removes the selected rows', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();

    let menu = await grid.openContextMenu(0, 1);

    // The menu is open with its default items, and none of the plugin's.
    await expect(grid.menuItem(menu, 'Insert row above')).toBeVisible();
    await expect(grid.menuItem(menu, /^Remove selected rows/)).toHaveCount(0);
    await expect(grid.menuItem(menu, 'Clear row selection')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();

    await grid.rowCheckbox(1).click();
    await grid.rowCheckbox(2).click();
    await grid.rowCheckbox(5).click();

    menu = await grid.openContextMenu(0, 1);
    await expect(grid.menuItem(menu, 'Clear row selection')).toBeVisible();
    await grid.menuItem(menu, 'Remove selected rows (3)').click();

    await expect(menu).toBeHidden();
    await expect.poll(() => grid.names()).toEqual(['Item 0', 'Item 3', 'Item 4', 'Item 6', 'Item 7']);
    expect(await grid.selectedRows()).toEqual([]);
  });

  test('counts and removes only the selected rows the filters show, and clears the selection', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.rowCheckbox(1).click();
    await grid.rowCheckbox(2).click();
    await grid.rowCheckbox(5).click();
    // Rows 1, 5, and 7 are "odd": row 2 stays selected but is filtered out.
    await grid.filterStatus('odd');
    await expect.poll(() => grid.countRows()).toBe(3);

    let menu = await grid.openContextMenu(0, 1);

    await grid.menuItem(menu, 'Remove selected rows (2)').click();

    await expect(menu).toBeHidden();
    await expect.poll(() => grid.names()).toEqual(['Item 0', 'Item 2', 'Item 3', 'Item 4', 'Item 6', 'Item 7']);
    expect(await grid.selectedPhysicalRows()).toEqual([1]);

    menu = await grid.openContextMenu(0, 1);
    // The filtered-out row is selected but stays, so the remove item has nothing to remove.
    await expect(grid.menuItem(menu, 'Remove selected rows (0)')).toBeVisible();
    await grid.menuItem(menu, 'Clear row selection').click();

    await expect(menu).toBeHidden();
    await expect.poll(() => grid.selectedPhysicalRows()).toEqual([]);

    menu = await grid.openContextMenu(0, 1);
    await expect(grid.menuItem(menu, 'Insert row above')).toBeVisible();
    await expect(grid.menuItem(menu, /^Remove selected rows/)).toHaveCount(0);
    await expect(grid.menuItem(menu, 'Clear row selection')).toHaveCount(0);
  });
});

test.describe('Row selection on a touch screen', { tag: THEMES_TAG }, () => {
  test.use({ hasTouch: true });

  test('a tap on a row checkbox toggles the row, and a tap on the corner toggles every row', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.rowCheckbox(1).tap();

    await expect.poll(() => grid.selectedRows()).toEqual([1]);
    await expect(grid.rowCheckbox(1)).toBeChecked();

    await grid.rowCheckbox(4).tap();
    await expect.poll(() => grid.selectedRows()).toEqual([1, 4]);
    await grid.rowCheckbox(1).tap();

    await expect.poll(() => grid.selectedRows()).toEqual([4]);
    await expect(grid.rowCheckbox(1)).not.toBeChecked();

    // From the mixed state, a tap selects every selectable row.
    await grid.headerCheckbox().tap();

    await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
    await expect(grid.headerCheckbox()).toBeChecked();
    expect(await grid.eventSources()).toEqual(['checkbox', 'checkbox', 'checkbox', 'headerCheckbox']);
  });

  test('a second tap on the same checkbox toggles it back', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.rowCheckbox(1).tap();
    await expect.poll(() => grid.selectedRows()).toEqual([1]);

    // A tap must keep the browser focus off the checkbox, as a mouse press does: Walkontable
    // ignores a press on the focused element (#3555), so a focused checkbox takes no second tap.
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('INPUT');

    await grid.rowCheckbox(1).tap();

    await expect.poll(() => grid.selectedRows()).toEqual([]);

    await grid.headerCheckbox().tap();
    await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
    await grid.headerCheckbox().tap();

    await expect.poll(() => grid.selectedRows()).toEqual([]);
  });
});

test.describe('Row selection on a server-backed grid', { tag: THEMES_TAG }, () => {
  test('keeps the selection across pages and selects rows the server never sent', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);
    const header = grid.headerCheckbox();

    await grid.gotoServerBacked();
    await expect(header).toHaveAccessibleName('Select all rows (0 of 12 selected)');

    await grid.rowCheckbox(1).click();
    await grid.nextPage('Item 6');

    await expect(grid.rowCheckbox(0)).not.toBeChecked();
    // The header counts the whole result set, not the page in view.
    await expect(header).toHaveAccessibleName('Select all rows (1 of 12 selected)');
    expect(await grid.isIndeterminate(header)).toBe(true);

    await grid.previousPage('Item 1');
    await expect(grid.rowCheckbox(1)).toBeChecked();

    // From the mixed state, "select all" covers every row matching the query, loaded or not.
    await header.click();
    await expect(header).toHaveAccessibleName('Select all rows (12 of 12 selected)');
    expect(await grid.serverSelection()).toEqual({ selectAll: true, toggledRowIds: [] });

    await grid.nextPage('Item 6');
    await grid.nextPage('Item 11');

    await expect(grid.rowCheckbox(0)).toBeChecked();
    await expect(grid.rowCheckbox(1)).toBeChecked();

    await grid.rowCheckbox(1).click();

    await expect.poll(() => grid.serverSelection()).toEqual({ selectAll: true, toggledRowIds: [12] });
    await expect(header).toHaveAccessibleName('Select all rows (11 of 12 selected)');
  });
});

/**
 * The RowSelection plugin over the NestedRows plugin (`groupSelects`). The fixture's tree, by visual
 * row: 0 Europe, 1 Poland, 2 Krakow, 3 Warsaw, 4 France, 5 Asia, 6 Japan.
 */
test.describe('Row selection over nested rows', { tag: THEMES_TAG }, () => {
  test('`\'descendants\'`: a parent selects every row under it, and its ancestors show the mixed state',
    async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.gotoNested('descendants');
      await grid.rowCheckbox(1).click();

      await expect.poll(() => grid.checkboxStates(7)).toEqual(['-', 'x', 'x', 'x', ' ', ' ', ' ']);
      await expect.poll(() => grid.isIndeterminate(grid.headerCheckbox())).toBe(true);

      // A leaf of the selected parent deselected: the parent turns mixed too.
      await grid.rowCheckbox(3).click();

      await expect.poll(() => grid.checkboxStates(7)).toEqual(['-', '-', 'x', ' ', ' ', ' ', ' ']);

      // The mixed top-level parent selects its whole subtree.
      await grid.rowCheckbox(0).click();

      await expect.poll(() => grid.checkboxStates(7)).toEqual(['x', 'x', 'x', 'x', 'x', ' ', ' ']);
      await expect.poll(() => grid.eventSources()).toEqual(['checkbox', 'checkbox', 'checkbox']);
    });

  test('`\'descendants\'`: Space on a parent row\'s data cell selects its subtree', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.gotoNested('descendants');
    await grid.focusCell(5, 0);
    await page.keyboard.press('Space');

    await expect.poll(() => grid.checkboxStates(7)).toEqual([' ', ' ', ' ', ' ', ' ', 'x', 'x']);
    expect(await grid.isEditorOpened()).toBe(false);
  });

  test('`\'self\'`: every row is selected on its own', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.gotoNested('self');
    await grid.rowCheckbox(1).click();

    await expect.poll(() => grid.checkboxStates(7)).toEqual([' ', 'x', ' ', ' ', ' ', ' ', ' ']);

    await grid.rowCheckbox(2).click();

    await expect.poll(() => grid.checkboxStates(7)).toEqual([' ', 'x', 'x', ' ', ' ', ' ', ' ']);
    await expect.poll(() => grid.selectedRows()).toEqual([1, 2]);
  });

  test('`\'topLevel\'`: only the top-level rows can be selected', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.gotoNested('topLevel');

    await expect.poll(() => grid.checkboxStates(7)).toEqual([' ', ' d', ' d', ' d', ' d', ' ', ' d']);

    await grid.rowCheckbox(5).click();
    await grid.headerCheckbox().click();

    await expect.poll(() => grid.selectedRows()).toEqual([0, 5]);
    await expect.poll(() => grid.checkboxStates(7)).toEqual(['x', ' d', ' d', ' d', ' d', 'x', ' d']);
  });
});
