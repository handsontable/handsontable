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
