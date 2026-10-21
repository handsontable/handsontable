import { test, expect, THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { FormulaBuilderPage } from '../fixtures/pages/FormulaBuilderPage';

// The autocomplete and function help popups, and the error indicator. Themes: the popups are
// themed surfaces laid out against the editor. Bundles: the suggestions and the error values come
// from HyperFormula, which the plain UMD leg loads externally. Engines: real key presses drive the
// listbox and its ARIA state.
test.describe('formulaBuilder autocomplete popup', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle);
    await grid.goto();
    await grid.selectCellByApi(3, 1);
    await page.keyboard.type('=SU');
  });

  test('typing a function prefix opens the suggestions listbox the editor controls', async() => {
    await expect(grid.suggestions).toBeVisible();
    await expect(grid.suggestions).toHaveAccessibleName('Formula suggestions');
    await expect(grid.editorInput).toBeFocused();
    await expect(grid.editorInput).toHaveAttribute('aria-expanded', 'true');
    await expect(grid.editorInput).toHaveAttribute('aria-controls', await grid.suggestions.getAttribute('id') ?? '');

    const first = grid.suggestionOptions.first();

    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(grid.editorInput).toHaveAttribute('aria-activedescendant', await first.getAttribute('id') ?? '');
    // Every option contains the typed text, and the prefix matches come first.
    const labels = await grid.suggestionOptions.allInnerTexts();

    expect(labels.length).toBeGreaterThan(1);
    expect(labels[0]).toMatch(/^SU/);
    for (const label of labels) {
      expect(label).toContain('SU');
    }
  });

  test('ArrowDown moves the active option, and Enter inserts it with the function help open', async({ page }) => {
    await expect(grid.suggestions).toBeVisible();

    const second = grid.suggestionOptions.nth(1);
    const secondId = await second.getAttribute('id');
    const secondLabel = (await second.innerText()).trim();

    await page.keyboard.press('ArrowDown');
    await expect(grid.editorInput).toHaveAttribute('aria-activedescendant', secondId ?? '');
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(grid.suggestionOptions.first()).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('Enter');
    await expect(grid.editorInput).toHaveValue(`=${secondLabel}()`);
    // Enter took the suggestion: the edit is still open, on the same cell.
    expect(await grid.editorOpened()).toBe(true);
    expect(await grid.selectedLast()).toEqual([3, 1, 3, 1]);
    await expect(grid.suggestions).toBeHidden();
    await expect(grid.editorInput).toHaveAttribute('aria-expanded', 'false');
    // The caret sits inside the parentheses, so the function help shows the picked function.
    await expect(grid.fnHelp).toBeVisible();
    await expect(grid.fnHelp.locator('.hfe-fn-help__name')).toHaveText(secondLabel);
  });

  test('Tab inserts the active suggestion instead of committing the edit', async({ page }) => {
    await expect(grid.suggestions).toBeVisible();

    const firstLabel = (await grid.suggestionOptions.first().innerText()).trim();

    await page.keyboard.press('Tab');
    await expect(grid.editorInput).toHaveValue(`=${firstLabel}()`);
    expect(await grid.editorOpened()).toBe(true);
    expect(await grid.selectedLast()).toEqual([3, 1, 3, 1]);
  });

  test('typing an opening parenthesis shows the function help for that function', async({ page }) => {
    await page.keyboard.type('M(');
    await expect(grid.editorInput).toHaveValue('=SUM()');
    await expect(grid.fnHelp).toBeVisible();
    await expect(grid.fnHelp.locator('.hfe-fn-help__name')).toHaveText('SUM');

    // Escape closes the help first, and a second one cancels the edit.
    await page.keyboard.press('Escape');
    await expect(grid.fnHelp).toBeHidden();
    expect(await grid.editorOpened()).toBe(true);
    await page.keyboard.press('Escape');
    await expect(grid.cell(3, 1)).toBeFocused();
    expect(await grid.sourceAt(3, 1)).toBe('');
  });
});

test.describe('formulaBuilder docked suggestions popup', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('popups.suggestions.container docks the listbox into the host element', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle, 'popups-host');

    await grid.goto();
    await expect(grid.suggestionsHost.getByRole('listbox')).toHaveCount(0);

    await grid.selectCellByApi(3, 1);
    await page.keyboard.type('=SU');

    await expect(grid.suggestionsHost.getByRole('listbox', { name: 'Formula suggestions' })).toBeVisible();
    await expect(grid.suggestions).toHaveCount(1);
    await expect(grid.editorInput).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('formulaBuilder error indicator', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('an error result marks the cell, and a later plain value clears the mark from the same element', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await grid.setDataAt(3, 2, '=1/0');

    const cell = grid.cell(3, 2);

    await expect(cell).toHaveText('#DIV/0!');
    await expect(cell).toHaveAttribute('data-hfe-error', '#DIV/0!');
    await expect(cell).toHaveAttribute('aria-invalid', 'true');

    // Hold the element itself: the grid recycles it on the next draw.
    const element = await cell.elementHandle();

    await grid.setDataAt(3, 2, 5);
    await expect(cell).toHaveText('5');
    await expect.poll(() => element!.evaluate(el => ({
      testId: el.getAttribute('data-testid'),
      connected: el.isConnected,
      error: el.getAttribute('data-hfe-error'),
      invalid: el.getAttribute('aria-invalid'),
    }))).toEqual({ testId: 'cell-3-2', connected: true, error: null, invalid: null });
  });

  test('with ariaTags: false the error mark stays and aria-invalid is not written', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle, 'no-aria');

    await grid.goto();
    await grid.setDataAt(0, 2, '=1/0');

    const cell = grid.cell(0, 2);

    await expect(cell).toHaveAttribute('data-hfe-error', '#DIV/0!');
    await expect(cell).not.toHaveAttribute('aria-invalid', /.*/);
    await expect(cell).not.toHaveAttribute('role', /.*/);
  });
});
