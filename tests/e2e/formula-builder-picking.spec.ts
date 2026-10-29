import { test, expect, THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { FormulaBuilderPage } from '../fixtures/pages/FormulaBuilderPage';

// Reference picking with the mouse while a formula is edited. Themes: the presses land on cells
// and header labels whose size and padding each theme sets. Bundles: the fixture loads HyperFormula
// externally on the plain UMD leg. Engines: pointer gestures and modifier clicks.
test.describe('formulaBuilder mouse reference picking', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle, 'sorting');
    await grid.goto();
    await grid.selectCellByApi(3, 0);
    await page.keyboard.press('=');
    await expect(grid.editorInput).toBeFocused();
  });

  test('a click inserts the cell reference, and the edit stays on the edited cell', async({ page }) => {
    await grid.cell(0, 1).click();
    await expect(grid.editorInput).toHaveValue('=B1');
    await expect(grid.editorInput).toBeFocused();
    expect(await grid.selectedAll()).toEqual([[3, 0, 3, 0]]);

    await page.keyboard.press('Enter');
    await expect(grid.cell(4, 0)).toBeFocused();
    expect(await grid.sourceAt(3, 0)).toBe('=B1');
    expect(await grid.dataAt(3, 0)).toBe(2);
  });

  test('a pick drag released outside the grid leaves the editor focused and the grid listening', async({ page }) => {
    await grid.cell(0, 1).hover();
    await page.mouse.down();
    await page.mouse.move(5, 5, { steps: 5 });
    await page.mouse.up();

    await expect(grid.editorInput).toBeFocused();
    await expect.poll(() => grid.isListening()).toBe(true);

    await page.keyboard.press('Enter');
    await expect.poll(() => grid.editorOpened()).toBe(false);
    await expect.poll(() => grid.isListening()).toBe(true);
    await page.keyboard.press('ArrowUp');
    expect(await grid.selectedLast()).toEqual([3, 0, 3, 0]);
  });

  test('a drag across cells inserts a range reference', async({ page }) => {
    await grid.drag(grid.cell(0, 0), grid.cell(1, 1));
    await expect(grid.editorInput).toHaveValue('=A1:B2');
    expect(await grid.selectedAll()).toEqual([[3, 0, 3, 0]]);

    await page.keyboard.press('Enter');
    await expect(grid.cell(4, 0)).toBeFocused();
    expect(await grid.sourceAt(3, 0)).toBe('=A1:B2');
  });

  test('Ctrl/Cmd+click appends a second reference', async({ page }) => {
    // Every click lands on a different cell: two quick clicks on one cell are a double click
    // (`tests/AGENTS.md`).
    await grid.cell(1, 0).click();
    await expect(grid.editorInput).toHaveValue('=A2');

    await page.keyboard.press('+');
    await grid.cell(2, 0).click({ modifiers: ['ControlOrMeta'] });
    await expect(grid.editorInput).toHaveValue('=A2+A3');

    // With the caret right after a reference, Ctrl/Cmd+click does not replace it: it appends the
    // new reference after an argument separator, the way a spreadsheet builds a multi-area list.
    await grid.cell(2, 1).click({ modifiers: ['ControlOrMeta'] });
    await expect(grid.editorInput).toHaveValue('=A2+A3,B3');
  });

  test('a column header click inserts a whole-column reference, and a header drag a column range', async({ page }) => {
    await grid.columnHeader('B').click();
    await expect(grid.editorInput).toHaveValue('=B:B');

    await page.keyboard.press('+');
    await grid.drag(grid.columnHeader('B'), grid.columnHeader('C'));
    await expect(grid.editorInput).toHaveValue('=B:B+B:C');
    expect(await grid.selectedAll()).toEqual([[3, 0, 3, 0]]);
  });

  test('a row header click inserts a whole-row reference', async({ page }) => {
    await grid.rowHeader('2').click();
    await expect(grid.editorInput).toHaveValue('=2:2');
    expect(await grid.selectedAll()).toEqual([[3, 0, 3, 0]]);

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(grid.cell(3, 0)).toBeFocused();
    expect(await grid.sourceAt(3, 0)).toBe('');
  });

  test('a header pick does not sort the column, while a plain header click does', async({ page }) => {
    await grid.columnHeader('B').click();
    await expect(grid.editorInput).toHaveValue('=B:B');
    expect(await grid.sortConfig()).toEqual([]);

    await page.keyboard.press('Enter');
    await expect(grid.cell(4, 0)).toBeFocused();
    expect(await grid.sortConfig()).toEqual([]);

    // Positive control: with no edit open the same header press sorts.
    await grid.columnHeader('B').click();
    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });
});

// A pick with the caret inside an existing reference replaces that reference, the way Google Sheets
// does it, instead of inserting into the middle of the token (after the `:` of a range) or
// committing the edit (inside a cell address). The replace rule lives in hyperformula-ui
// (`RefController.refTokenAtCaret()`); these pin that the grid hands the press to it. The edits
// open with Enter, so the arrows move the caret instead of closing a typed-open edit.
test.describe('formulaBuilder picking inside an existing reference', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle, 'sorting');
    await grid.goto();
  });

  test('a drag with the caret after the colon of a range replaces the whole range', async({ page }) => {
    await grid.selectCellByApi(2, 2);
    await page.keyboard.press('Enter');
    await expect(grid.editorInput).toHaveValue('=SUM(C1:C2)');
    // `=SUM(C1:C2|)` -> `=SUM(C1:C|2)` -> `=SUM(C1:|C2)`: the arrows move the caret, because the
    // character before it is not a reference opener until the caret lands after the colon.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    await grid.drag(grid.cell(0, 0), grid.cell(1, 1));
    await expect(grid.editorInput).toHaveValue('=SUM(A1:B2)');
    await expect(grid.editorInput).toBeFocused();
    expect(await grid.selectedAll()).toEqual([[2, 2, 2, 2]]);

    await page.keyboard.press('Enter');
    await expect(grid.cell(3, 2)).toBeFocused();
    expect(await grid.sourceAt(2, 2)).toBe('=SUM(A1:B2)');
    expect(await grid.dataAt(2, 2)).toBe(10);
  });

  test('a click with the caret inside a cell reference replaces it and keeps the edit open', async({ page }) => {
    await grid.selectCellByApi(0, 2);
    await page.keyboard.press('Enter');
    await expect(grid.editorInput).toHaveValue('=A1+B1');
    // `=A1+B1|` -> `=A1+B|1`.
    await page.keyboard.press('ArrowLeft');

    await grid.cell(1, 0).click();
    await expect(grid.editorInput).toHaveValue('=A1+A2');
    await expect(grid.editorInput).toBeFocused();
    expect(await grid.editorOpened()).toBe(true);
    expect(await grid.selectedAll()).toEqual([[0, 2, 0, 2]]);

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(grid.cell(0, 2)).toBeFocused();
    expect(await grid.sourceAt(0, 2)).toBe('=A1+B1');
  });
});

// NestedHeaders: a header pick must claim the press before NestedHeaders (and ColumnSorting) see
// it, also after the plugin re-registers its hooks, while a press with no edit open keeps the
// nested-header selection behavior.
test.describe('formulaBuilder picking with nested headers', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle, 'nested');
    await grid.goto();
  });

  /**
   * Picks the nested group header "Inputs" (spanning A and B) into a formula typed in A4, and
   * asserts the pick claimed the press: a column reference is inserted, the grid selection stays
   * on the edited cell, and nothing is sorted.
   */
  async function pickGroupHeader(page: FormulaBuilderPage['page']): Promise<void> {
    await grid.selectCellByApi(3, 0);
    await page.keyboard.press('=');
    await expect(grid.editorInput).toBeFocused();

    await grid.columnHeader('Inputs').click();
    // A group header covers columns A and B, and a pick of it inserts both, the way a click on it
    // selects both.
    await expect(grid.editorInput).toHaveValue('=A:B');
    await expect(grid.editorInput).toBeFocused();
    expect(await grid.editorOpened()).toBe(true);
    expect(await grid.selectedAll()).toEqual([[3, 0, 3, 0]]);
    expect(await grid.sortConfig()).toEqual([]);
  }

  test('a pick on a nested group header inserts a reference and does not select the span', async({ page }) => {
    await pickGroupHeader(page);
  });

  test('with no edit open, Ctrl/Cmd+click on a sortable nested group header still selects its whole span', async() => {
    await grid.selectCellByApi(3, 0);

    await grid.columnHeader('Inputs').click({ modifiers: ['ControlOrMeta'] });
    // A second layer from the top header level over both grouped columns and every row.
    await expect.poll(() => grid.selectedAll()).toEqual([[3, 0, 3, 0], [-2, 0, 4, 1]]);
    expect(await grid.editorOpened()).toBe(false);
  });

  test('a nested header pick still claims the press after the plugin is rebuilt by a settings change', async({ page }) => {
    // Turning the bar off and on rebuilds the plugin, which re-registers its hooks after
    // NestedHeaders registered its own.
    await grid.updateFormulaBuilderSettings(false);
    await expect(grid.formulaBarHost).toHaveCount(0);
    await grid.updateFormulaBuilderSettings(true);
    await expect(grid.formulaBar).toBeVisible();

    await pickGroupHeader(page);
  });

  test('a nested header pick still claims the press after a theme switch', async({ page }) => {
    const target = await grid.switchToAnotherTheme();

    // The builder was rebuilt for the new theme (its bar carries the new class).
    await expect(grid.formulaBar).toHaveClass(new RegExp(`\\b${target}\\b`));

    await pickGroupHeader(page);
  });
});

// A pick after a sort: the reference must name the data the user clicked, highlight the clicked cell,
// and commit the clicked cell's value, whatever order the sort left the grid and the engine in.
test.describe('formulaBuilder picking on a sorted grid', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle, 'sorting');
    await grid.goto();
  });

  test('a click inserts the reference of the clicked data, highlights the clicked cell, and commits its value', async({ page }) => {
    await grid.sortBy(1, 'desc');
    // Column B descending: the row that holds 6 is now the first row. The Formulas plugin reorders
    // the engine's sheet with the sort, so that row is the engine's first row too, and `B1` names it.
    await grid.expectCell(0, 1, '6');

    await grid.selectCellByApi(3, 0);
    await page.keyboard.press('=');
    await expect(grid.editorInput).toBeFocused();

    await grid.cell(0, 1).click();
    await expect(grid.editorInput).toHaveValue('=B1');
    await expect(grid.cell(0, 1)).toHaveClass(/ht-formula-ref-/);
    await expect(grid.cell(1, 1)).not.toHaveClass(/ht-formula-ref-/);

    await page.keyboard.press('Enter');
    await expect.poll(() => grid.dataAt(3, 0)).toBe(6);
  });
});

// A pick claims the press from the grid's own handlers, but not from the document: a menu that
// closes on an outside press has to close on a pick too. The legs are the spec's own (one set per
// spec): themes size the menu and the cells it may cover, and engines dispatch the press to the document.
test.describe('formulaBuilder picking with a menu open', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('a pick closes an open dropdown menu and still inserts the reference', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle, 'menus');

    await grid.goto();
    await grid.selectCellByApi(3, 0);
    await page.keyboard.press('=');
    await expect(grid.editorInput).toBeFocused();

    await grid.openDropdownMenuByApi();
    await grid.cell(0, 1).click();

    await expect(grid.dropdownMenu).toBeHidden();
    await expect(grid.editorInput).toHaveValue('=B1');
  });
});

// A pick sets only the grid's own flag, so the press still bubbles to the dropdown arrow's listener on
// the root element, which must leave a claimed press alone. Themes: the arrow's size and the cell's
// padding place it. Engines: the modifier click.
test.describe('formulaBuilder picking on a dropdown arrow', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle, 'dropdown');
    await grid.goto();
    await grid.selectCellByApi(3, 0);
    await page.keyboard.press('=');
    await expect(grid.editorInput).toBeFocused();
  });

  test('a click on the arrow inserts the reference and keeps the formula edit', async({ page }) => {
    await grid.countBeginEditing();
    await grid.dropdownArrow(0, 1).click();
    await expect(grid.editorInput).toHaveValue('=B1');
    await expect(grid.editorInput).toBeFocused();
    expect(await grid.beginEditingCount()).toBe(0);

    await page.keyboard.press('Enter');
    await expect.poll(() => grid.sourceAt(3, 0)).toBe('=B1');
  });

  test('Ctrl/Cmd+click on the arrow inserts the reference and keeps the formula edit', async({ page }) => {
    await grid.dropdownArrow(0, 1).click({ modifiers: ['ControlOrMeta'] });
    await expect(grid.editorInput).toHaveValue('=B1');
    await expect(grid.editorInput).toBeFocused();

    await page.keyboard.press('Enter');
    await expect.poll(() => grid.sourceAt(3, 0)).toBe('=B1');
  });
});

// Other plugins act on a press from their own `beforeOnCellMouseDown` listeners, which run after the
// pick and do not read its claim. A press on one of their controls is left to the plugin; a press next
// to one picks, and the control does not act.
test.describe('formulaBuilder picking next to other plugins\' controls', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle, 'checkboxes');
    await grid.goto();
    await grid.selectCellByApi(3, 0);
    await page.keyboard.press('=');
    await expect(grid.editorInput).toBeFocused();
  });

  test('a press on the "check all" header checkbox checks the column and inserts nothing', async() => {
    await grid.headerCheckbox().click();
    await expect.poll(() => Promise.all([0, 1, 2, 3, 4].map(row => grid.dataAt(row, 3))))
      .toEqual([true, true, true, true, true]);
    await expect(grid.editorInput).toHaveValue('=');
  });

  test('a press on the header label picks the column and leaves its checkboxes', async() => {
    await grid.columnHeaderLabel('D').click();
    await expect(grid.editorInput).toHaveValue('=D:D');
    expect(await Promise.all([0, 1, 2, 3, 4].map(row => grid.dataAt(row, 3))))
      .toEqual([true, false, true, false, false]);
  });

  test('a press on a checkbox cell picks the cell and leaves the checkbox unchecked', async({ page }) => {
    await grid.cellCheckbox(1, 3).click();
    await expect(grid.editorInput).toHaveValue('=D2');
    await expect(grid.cellCheckbox(1, 3)).not.toBeChecked();

    await page.keyboard.press('Enter');
    await expect.poll(() => grid.sourceAt(3, 0)).toBe('=D2');
    expect(await grid.dataAt(1, 3)).toBe(false);
  });

  test('a press on a row\'s selection checkbox selects the row and inserts nothing', async() => {
    await grid.rowSelectionHeader(1).click();
    await expect.poll(() => grid.selectedRows()).toEqual([1]);
    await expect(grid.editorInput).toHaveValue('=');
  });

  test('a press on the row number picks the row and selects no row', async() => {
    await grid.rowNumberHeader(1).click();
    await expect(grid.editorInput).toHaveValue('=2:2');
    expect(await grid.selectedRows()).toEqual([]);
  });

  test('a click that moves the edit from the formula bar into the cell selects no row', async({ page }) => {
    await page.keyboard.press('Escape');
    await grid.selectCellByApi(0, 2);
    await grid.barFormulaArea.click();
    await expect(grid.editorInput).toBeFocused();

    await grid.cell(0, 2).click();
    await expect(grid.inlineEditor).toBeVisible();
    expect(await grid.selectedRows()).toEqual([]);
  });
});

// With no `height` the window scrolls the grid, so the pick's edge auto-scroller has to scroll the
// page: the grid's holder never overflows, and DragToScroll stays out of a claimed press. Themes: the
// row heights decide how many rows fit the viewport. Engines: a pointer held past the window edge.
test.describe('formulaBuilder picking in a window-scrolled grid', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('a reference drag held below the viewport scrolls the page and extends the range', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle, 'window-scroll');

    await grid.goto();
    await grid.selectCellByApi(0, 0);
    await page.keyboard.press('=');
    await expect(grid.editorInput).toBeFocused();

    const viewport = page.viewportSize();
    const start = await grid.cell(0, 1).boundingBox();
    const scrollY = () => page.evaluate(() => window.scrollY);

    const endRow = async() => Number((await grid.editorInput.inputValue()).match(/^=B1:B(\d+)$/)?.[1] ?? 0);

    expect(await scrollY()).toBe(0);
    // The page scrolls, and the grid's own holder does not.
    expect(await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)).toBe(true);
    expect(await grid.grid.locator('.ht_master .wtHolder').evaluate(holder => holder.scrollHeight > holder.clientHeight))
      .toBe(false);

    await grid.cell(0, 1).hover();
    await page.mouse.down();
    await page.mouse.move((start?.x ?? 0) + 10, (viewport?.height ?? 0) + 40, { steps: 10 });

    // The pointer stays past the bottom edge: the auto-scroller keeps stepping on its own until the
    // page has brought row 26 into view. The editor takes the reference on the release.
    await expect.poll(scrollY).toBeGreaterThan(0);
    await expect(grid.cell(25, 1)).toBeInViewport();

    await page.mouse.up();
    await expect(grid.editorInput).toHaveValue(/^=B1:B\d{2}$/);
    expect(await endRow()).toBeGreaterThan(20);
  });
});

// A drag held on a header clamps to the first visible track: after the grid scrolled, the first row or
// column is out of view, and a range that starts there would reach far past anything on screen. The
// frozen band counts as visible, so a frozen grid clamps to its own first track.
test.describe('formulaBuilder picking onto the headers of a scrolled grid', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('a drag from a cell up onto the column header starts at the first visible row', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await page.evaluate(() => {
      const hot = (window as unknown as { hot: { loadData(data: unknown[][]): void } }).hot;

      hot.loadData(Array.from({ length: 100 }, (_, row) => [row + 1, '', '']));
    });
    await page.evaluate(() => {
      (window as unknown as { hot: { scrollViewportTo(options: { row: number }): void } }).hot
        .scrollViewportTo({ row: 50 });
    });
    await expect.poll(() => page.evaluate(
      () => (window as unknown as { hot: { getFirstFullyVisibleRow(): number } }).hot.getFirstFullyVisibleRow()
    )).toBeGreaterThan(20);

    const firstVisible = await page.evaluate(
      () => (window as unknown as { hot: { getFirstFullyVisibleRow(): number } }).hot.getFirstFullyVisibleRow()
    );
    const editedRow = firstVisible + 1;

    await grid.selectCellByApi(editedRow, 0);
    await page.keyboard.press('=');
    await expect(grid.editorInput).toBeFocused();

    const targetRow = firstVisible + 3;
    const start = await grid.cell(targetRow, 1).boundingBox();
    const header = await grid.columnHeaderLabel('B').boundingBox();

    await grid.cell(targetRow, 1).hover();
    await page.mouse.down();
    await page.mouse.move((start?.x ?? 0) + 10, (header?.y ?? 0) + (header?.height ?? 0) / 2, { steps: 10 });
    await page.mouse.up();

    const startRow = firstVisible + 1;

    await expect(grid.editorInput).toHaveValue(`=B${startRow}:B${targetRow + 1}`);
  });
});

// A frozen band is always on screen, so a header hover in a scrolled frozen grid clamps to its first track.
test.describe('formulaBuilder picking onto the headers of a scrolled frozen grid', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('a drag from a cell up onto the column header starts at the frozen first row', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle, 'frozen');

    await grid.goto();
    await page.evaluate(() => {
      const hot = (window as unknown as { hot: { loadData(data: unknown[][]): void; scrollViewportTo(o: { row: number }): void } }).hot;

      hot.loadData(Array.from({ length: 100 }, (_, row) => [row + 1, '', '']));
      hot.scrollViewportTo({ row: 50 });
    });

    await expect.poll(() => page.evaluate(
      () => (window as unknown as { hot: { getFirstFullyVisibleRow(): number } }).hot.getFirstFullyVisibleRow()
    )).toBeGreaterThan(20);
    await grid.selectCellByApi(0, 0);
    await page.keyboard.press('=');
    await expect(grid.editorInput).toBeFocused();

    const targetRow = await page.evaluate(
      () => (window as unknown as { hot: { getFirstFullyVisibleRow(): number } }).hot.getFirstFullyVisibleRow()
    ) + 2;
    const start = await grid.cell(targetRow, 1).boundingBox();
    const header = await grid.columnHeaderLabel('B').boundingBox();

    await grid.cell(targetRow, 1).hover();
    await page.mouse.down();
    await page.mouse.move((start?.x ?? 0) + 10, (header?.y ?? 0) + (header?.height ?? 0) / 2, { steps: 10 });
    await page.mouse.up();

    await expect(grid.editorInput).toHaveValue(`=B1:B${targetRow + 1}`);
  });
});
