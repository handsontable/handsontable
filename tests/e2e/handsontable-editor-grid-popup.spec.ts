import { test, expect, THEMES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { EditorListA11yPage, type ListEditorCellType } from '../fixtures/pages/EditorListA11yPage';

/**
 * The `handsontable` editor follows the APG combobox pattern with a grid popup: the field is a `combobox`
 * with `aria-haspopup="grid"`, and its list is a nested Handsontable grid that stays a real `grid` of
 * `gridcell`s, named after the edited cell. The field's references must name elements that exist:
 * `aria-controls` the list only while it is shown, `aria-activedescendant` the highlighted cell. With a
 * row highlighted in a list of more than one column, ArrowLeft and ArrowRight move across its columns
 * (mirrored right to left); without a highlight they move the caret, as they always did. The theme
 * decides how many rows the list draws, so the spec runs on every theme; the keys and focus are an
 * engine's to get wrong, so it runs on Firefox and WebKit too.
 */
test.describe('handsontable editor grid popup', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: EditorListA11yPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new EditorListA11yPage(page, theme, bundle, 'handsontable');
  });

  test('exposes the field as a combobox that controls a grid named after the edited cell', async() => {
    await grid.goto();
    await grid.openEditorAt(0, 0);

    const combobox = grid.combobox('A, row 1');

    await expect(combobox).toBeFocused();
    await expect(combobox).toHaveAttribute('aria-haspopup', 'grid');
    await expect(combobox).toHaveAttribute('aria-expanded', 'true');
    await expect(grid.gridPopup('A, row 1').getByRole('gridcell')).toHaveCount(3);
    expect((await grid.referencedElements()).controls).toEqual({ role: 'grid', isListRoot: true });

    await grid.cancelEditor();

    const field = grid.field('A, row 1');

    await expect(field).toHaveAttribute('aria-expanded', 'false');
    await expect(field).not.toHaveAttribute('aria-controls');
    await expect(field).not.toHaveAttribute('aria-activedescendant');
  });

  test('renames the grid for the next edited cell', async() => {
    await grid.goto();
    await grid.openEditorAt(0, 0);
    await expect(grid.gridPopup('A, row 1')).toBeVisible();
    await grid.cancelEditor();

    await grid.openEditorAt(1, 1);

    await expect(grid.combobox('B, row 2')).toBeFocused();
    await expect(grid.gridPopup('B, row 2')).toBeVisible();
  });

  test('points the field at the highlighted cell', async() => {
    await grid.goto();
    await grid.openEditorAt(0, 0);
    await grid.page.keyboard.press('ArrowDown');

    await expect.poll(() => grid.referencedElements()).toEqual({
      controls: { role: 'grid', isListRoot: true },
      activeDescendant: { role: 'gridcell', selected: 'true', text: 'Alpha', inList: true },
    });
  });

  test('keeps the field on the highlighted cell while the list scrolls', async() => {
    await grid.goto({ twoListColumns: true, longSource: true });
    await grid.openEditorAt(0, 0);
    await grid.page.keyboard.press('ArrowDown');
    await grid.page.keyboard.press('ArrowRight');
    await expect.poll(() => grid.referencedElements()).toMatchObject({
      activeDescendant: { role: 'gridcell', selected: 'true', text: 'Al 001 code', inList: true },
    });

    // The list draws other rows in the cells it drew row 1 in: the field must not name one of them.
    await grid.scrollListToRow(100);
    await expect(grid.gridPopup('A, row 1').getByRole('gridcell', { name: 'Al 101', exact: true })).toHaveCount(1);
    expect(await grid.listSelection()).toEqual([0, 1]);
    expect((await grid.referencedElements()).activeDescendant).toBeNull();

    await grid.scrollListToRow(0);
    await expect.poll(() => grid.referencedElements()).toMatchObject({
      activeDescendant: { role: 'gridcell', selected: 'true', text: 'Al 001 code', inList: true },
    });
  });

  test('names no cell while a theme change keeps the list closed', async() => {
    await grid.goto({ twoListColumns: true });
    await grid.openEditorAt(0, 0);
    await grid.page.keyboard.press('ArrowDown');
    await expect.poll(() => grid.referencedElements()).toMatchObject({ activeDescendant: { text: 'Alpha' } });

    await grid.switchToAnotherTheme();

    const field = grid.field('A, row 1');

    await expect(field).toHaveAttribute('aria-expanded', 'false');
    // The closed list keeps its selection; a render of it must not name a cell again.
    await grid.renderList();
    await expect(field).not.toHaveAttribute('aria-activedescendant');
    await expect(field).not.toHaveAttribute('aria-controls');
  });

  test('names the list only while it is shown over a scroll round-trip', async() => {
    await grid.goto({ frozen: true, twoListColumns: true });
    await grid.openEditorAt(0, 1);
    await grid.page.keyboard.press('ArrowDown');
    await expect.poll(() => grid.referencedElements()).toMatchObject({ activeDescendant: { text: 'Alpha' } });

    const field = grid.field('B, row 1');

    await grid.scrollGridToInlineEnd();
    await expect(field).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => grid.displayedListCount()).toBe(0);
    await grid.renderList();
    await expect(field).not.toHaveAttribute('aria-activedescendant');
    await expect(field).not.toHaveAttribute('aria-controls');

    await grid.scrollGridToInlineStart();
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(() => grid.displayedListCount()).toBe(1);
    await expect.poll(() => grid.referencedElements()).toEqual({
      controls: { role: 'grid', isListRoot: true },
      activeDescendant: { role: 'gridcell', selected: 'true', text: 'Alpha', inList: true },
    });
  });

  // Known trade-off: without `tabindex` the list's scrolling holder is a Tab stop to Chromium and Firefox, but no Tab
  // reaches it: the editor prevents every Tab while the list is shown, and the list is hidden whenever it is not.
  test('runs no browser Tab navigation while the list is shown, and hides the list whenever the editor closes', async() => {
    await grid.goto({ twoListColumns: true, longSource: true });
    await grid.leaveScrollingListByEveryKey();
  });

  test('moves across the list columns with ArrowLeft and ArrowRight while a row is highlighted', async() => {
    await grid.goto({ twoListColumns: true });
    await grid.openEditorAt(0, 0);
    await grid.page.keyboard.press('ArrowDown');
    await expect.poll(() => grid.listSelection()).toEqual([0, 0]);

    const caret = await grid.caret();

    await grid.page.keyboard.press('ArrowRight');
    await expect.poll(() => grid.listSelection()).toEqual([0, 1]);
    expect(await grid.isEditorOpened()).toBe(true);
    expect(await grid.caret()).toEqual(caret);
    await expect.poll(() => grid.referencedElements()).toMatchObject({
      activeDescendant: { role: 'gridcell', selected: 'true', text: 'Alpha code', inList: true },
    });

    await grid.page.keyboard.press('ArrowDown');
    await expect.poll(() => grid.listSelection()).toEqual([1, 1]);
    await expect.poll(() => grid.referencedElements()).toMatchObject({ activeDescendant: { text: 'Alfa code' } });

    await grid.page.keyboard.press('ArrowLeft');
    await expect.poll(() => grid.listSelection()).toEqual([1, 0]);
    await expect.poll(() => grid.referencedElements()).toMatchObject({ activeDescendant: { text: 'Alfa' } });

    // The first column is the edge: the key keeps the highlight and does not move the caret either.
    await grid.page.keyboard.press('ArrowLeft');
    expect(await grid.listSelection()).toEqual([1, 0]);
    expect(await grid.caret()).toEqual(caret);
    expect(await grid.isEditorOpened()).toBe(true);

    // The value pinned on the head before this change: Enter writes the highlighted row's first column.
    await grid.commitEditor();
    expect(await grid.dataAtCell(0, 0)).toBe('Alfa');
  });

  test('moves the caret with ArrowLeft while no row is highlighted', async() => {
    await grid.goto({ twoListColumns: true });
    await grid.openEditorAt(0, 0);
    await grid.page.keyboard.press('End');
    await expect.poll(() => grid.caret()).toEqual({ start: 2, end: 2 });

    await grid.page.keyboard.press('ArrowLeft');

    await expect.poll(() => grid.caret()).toEqual({ start: 1, end: 1 });
    expect(await grid.listSelection()).toBeNull();
    expect(await grid.isEditorOpened()).toBe(true);
  });

  for (const key of ['Enter', 'Tab'] as const) {
    test(`writes the highlighted cell of the second column on ${key}`, async() => {
      await grid.goto({ twoListColumns: true });
      await grid.openEditorAt(0, 0);
      await grid.page.keyboard.press('ArrowDown');
      await grid.page.keyboard.press('ArrowRight');
      await expect.poll(() => grid.listSelection()).toEqual([0, 1]);

      await grid.page.keyboard.press(key);
      await expect.poll(() => grid.isEditorOpened()).toBe(false);

      expect(await grid.dataAtCell(0, 0)).toBe('Alpha code');
    });
  }

  test('keeps the caret keys in a list of one column while a row is highlighted', async() => {
    await grid.goto();
    await grid.openEditorAt(0, 0);
    await grid.page.keyboard.press('ArrowDown');
    await expect.poll(() => grid.listSelection()).toEqual([0, 0]);
    await grid.page.keyboard.press('End');
    await expect.poll(() => grid.caret()).toEqual({ start: 2, end: 2 });

    await grid.page.keyboard.press('ArrowLeft');
    await expect.poll(() => grid.caret()).toEqual({ start: 1, end: 1 });

    await grid.page.keyboard.press('ArrowRight');
    await expect.poll(() => grid.caret()).toEqual({ start: 2, end: 2 });
    expect(await grid.listSelection()).toEqual([0, 0]);
    expect(await grid.isEditorOpened()).toBe(true);
  });

  test('moves to the next column with ArrowLeft in a right-to-left grid', async() => {
    await grid.goto({ twoListColumns: true, rtl: true });
    await grid.openEditorAt(0, 0);
    await grid.page.keyboard.press('ArrowDown');
    await expect.poll(() => grid.listSelection()).toEqual([0, 0]);

    await grid.page.keyboard.press('ArrowLeft');
    await expect.poll(() => grid.listSelection()).toEqual([0, 1]);

    await grid.page.keyboard.press('ArrowRight');
    await expect.poll(() => grid.listSelection()).toEqual([0, 0]);
  });

  test('keeps the focus out of the list on ArrowDown and on Tab', async() => {
    await grid.goto({ twoListColumns: true });
    await grid.openEditorAt(0, 0);

    await grid.page.keyboard.press('ArrowDown');
    await expect.poll(() => grid.listSelection()).toEqual([0, 0]);
    expect(await grid.focusTarget()).toEqual({ editorField: true });

    await grid.page.keyboard.press('ArrowRight');
    await expect.poll(() => grid.listSelection()).toEqual([0, 1]);
    expect(await grid.focusTarget()).toEqual({ editorField: true });
    expect(await grid.isFocusInList()).toBe(false);
    // The list's cells are not focusable: its ARIA makes them gridcells, nothing more.
    await expect(grid.gridPopup('A, row 1').getByRole('gridcell')).toHaveCount(6);
    expect(await grid.focusableListCellCount()).toBe(0);

    await grid.page.keyboard.press('Tab');
    await expect.poll(() => grid.focusTarget()).toEqual({ cell: [0, 1] });
    expect(await grid.isFocusInList()).toBe(false);
  });

  test('writes no role in the list with `handsontable: { ariaTags: false }` on the cell', async() => {
    await grid.goto({ innerAriaTags: false, twoListColumns: true });
    await grid.openEditorAt(0, 0);
    await expect.poll(() => grid.listCellCount()).toBe(6);

    const roles = await grid.listRoles();

    expect(roles.input).toBe('combobox');
    expect(roles.listRoot).toBeNull();
    expect(roles.cells.every(role => role === null)).toBe(true);
    await expect(grid.editorInput).not.toHaveAttribute('aria-controls');

    await grid.page.keyboard.press('ArrowDown');
    await grid.page.keyboard.press('ArrowRight');
    await expect.poll(() => grid.listSelection()).toEqual([0, 1]);
    await expect(grid.editorInput).not.toHaveAttribute('aria-activedescendant');
  });

  test('writes no role anywhere with ariaTags: false, and the keys still work', async() => {
    await grid.goto({ ariaTags: false, twoListColumns: true });
    // A press, not `selectCell()`: with ARIA off the cell takes no focus, so a selection laid through the
    // API leaves the grid's focus scope inactive, and the editor's focus would activate it and hand the
    // keys back to the grid.
    await grid.clickCell(0, 0);
    await grid.page.keyboard.press('Enter');
    await expect.poll(() => grid.isEditorOpened()).toBe(true);
    await expect.poll(() => grid.listCellCount()).toBe(6);

    const roles = await grid.listRoles();

    expect(roles.input).toBeNull();
    expect(roles.listRoot).toBeNull();
    expect(roles.cells.every(role => role === null)).toBe(true);
    await expect(grid.editorInput).not.toHaveAttribute('aria-haspopup');
    await expect(grid.editorInput).not.toHaveAttribute('aria-expanded');

    await grid.page.keyboard.press('ArrowDown');
    await grid.page.keyboard.press('ArrowRight');
    await expect.poll(() => grid.listSelection()).toEqual([0, 1]);
    await grid.page.keyboard.press('ArrowLeft');
    await expect.poll(() => grid.listSelection()).toEqual([0, 0]);
    await expect(grid.editorInput).not.toHaveAttribute('aria-activedescendant');
    await expect(grid.editorInput).not.toHaveAttribute('aria-controls');
  });
});

const LISTBOX_CELL_TYPES: ListEditorCellType[] = ['autocomplete', 'dropdown'];

for (const cellType of LISTBOX_CELL_TYPES) {
  test.describe(`list editor keeps caret keys (${cellType})`, { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
    test('moves the caret with ArrowLeft and ArrowRight while an option is highlighted', async({
      page, theme, bundle,
    }) => {
      const grid = new EditorListA11yPage(page, theme, bundle, cellType);

      await grid.goto();
      await grid.openEditorAt(0, 0);
      await expect(grid.listbox('A, row 1').getByRole('option')).toHaveCount(3);
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => grid.listSelection()).toEqual([0, 0]);
      await page.keyboard.press('End');
      await expect.poll(() => grid.caret()).toEqual({ start: 2, end: 2 });

      await page.keyboard.press('ArrowLeft');
      await expect.poll(() => grid.caret()).toEqual({ start: 1, end: 1 });

      await page.keyboard.press('ArrowRight');
      await expect.poll(() => grid.caret()).toEqual({ start: 2, end: 2 });
      expect(await grid.listSelection()).toEqual([0, 0]);
      expect(await grid.isEditorOpened()).toBe(true);
    });
  });
}

/**
 * The field names an option the list has not drawn yet once the list's scroll draws it. Strict mode
 * highlights the choice the typed text completes to without scrolling the list, so that wait can
 * outlive the highlight: a later scroll must not point the field back at an option the list no longer
 * highlights.
 */
test.describe('deferred active descendant', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('keeps the field on the current highlight when the list scrolls to an option highlighted earlier', async({
    page, theme, bundle,
  }) => {
    const grid = new EditorListA11yPage(page, theme, bundle, 'autocomplete');

    await grid.goto({ longSource: true });
    await grid.openEditorAt(0, 0);

    const listbox = grid.listbox('A, row 1');

    await expect(listbox.getByRole('option').first()).toHaveText('Al 001');
    // Precondition: the 151st entry is not drawn while the list sits at its top.
    await expect(listbox.getByRole('option', { name: 'Al 151', exact: true })).toHaveCount(0);

    await grid.selectListRow(150, false);
    await grid.selectListRow(1);
    await expect.poll(() => grid.referencedElements()).toMatchObject({
      activeDescendant: { role: 'option', text: 'Al 002', inList: true },
    });

    await grid.scrollListToRow(150);

    // The scroll drew the entry highlighted first; the field still names the highlighted one.
    await expect(listbox.getByRole('option', { name: 'Al 151', exact: true })).toHaveCount(1);
    expect(await grid.listSelection()).toEqual([1, 0]);
    expect((await grid.referencedElements()).activeDescendant?.text).not.toBe('Al 151');
  });
});
