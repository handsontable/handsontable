import { test, expect, THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { FormulaBuilderPage } from '../fixtures/pages/FormulaBuilderPage';

// The FormulaBuilder plugin against the grid's own configuration: read-only cells, hidden rows,
// frozen panes, right-to-left layout, and settings updates. Themes: the frozen-pane test hit-tests
// the editor and the RTL test compares popup and editor edges, which the theme sizes. Bundles: the
// fixture loads HyperFormula externally on the plain UMD leg. Engines: real keys and focus.
test.describe('formulaBuilder on a read-only cell', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle, 'read-only');
    await grid.goto();
  });

  test('Enter, typing, F2 and the formula bar do not open an editor on a read-only formula cell', async({ page }) => {
    // Positive control: a printable key opens the editor on the writable C2 below.
    await grid.selectCellByApi(1, 2);
    await page.keyboard.press('9');
    await expect(grid.editorInput).toBeFocused();
    expect(await grid.editorOpened()).toBe(true);
    await page.keyboard.press('Escape');
    await expect(grid.cell(1, 2)).toBeFocused();

    await grid.selectCellByApi(0, 2);
    await page.keyboard.press('Enter');
    expect(await grid.editorOpened()).toBe(false);

    await grid.selectCellByApi(0, 2);
    await page.keyboard.press('9');
    expect(await grid.editorOpened()).toBe(false);
    await page.keyboard.press('F2');
    expect(await grid.editorOpened()).toBe(false);
    await expect(grid.cell(0, 2)).toBeFocused();

    // Positive control for the bar: a click on it opens the editor on the writable C2.
    await grid.selectCellByApi(1, 2);
    await grid.barFormulaArea.click();
    await expect.poll(() => grid.editorOpened()).toBe(true);
    await page.keyboard.press('Escape');
    await expect.poll(() => grid.editorOpened()).toBe(false);

    // The bar shows the formula of the read-only C1 but refuses the edit.
    await grid.selectCellByApi(0, 2);
    await expect(grid.barFormulaArea).toContainText('=A1+B1');
    await grid.barFormulaArea.click();
    await page.keyboard.type('7');
    expect(await grid.editorOpened()).toBe(false);
    expect(await grid.focusedCellTestId()).toBe('cell-0-2');

    expect(await grid.sourceAt(0, 2)).toBe('=A1+B1');
    await grid.expectCell(0, 2, '3');
  });
});

test.describe('formulaBuilder with a hidden row', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('the Enter commit from the row above skips the hidden row, and Shift+Enter skips it back', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle, 'hidden-row');

    await grid.goto();
    await grid.selectCellByApi(0, 0);
    await page.keyboard.press('9');
    await page.keyboard.press('Enter');

    await expect(grid.cell(2, 0)).toBeFocused();
    expect(await grid.selectedLast()).toEqual([2, 0, 2, 0]);
    expect(await grid.sourceAt(0, 0)).toBe('9');

    await page.keyboard.press('Enter');
    await expect(grid.editorInput).toBeFocused();
    await page.keyboard.press('Shift+Enter');
    await expect(grid.cell(0, 0)).toBeFocused();
    expect(await grid.selectedLast()).toEqual([0, 0, 0, 0]);
  });
});

test.describe('formulaBuilder with frozen panes', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle, 'frozen');
    await grid.goto();
  });

  test('a reference to a frozen cell highlights it inside the frozen corner clone', async({ page }) => {
    await grid.selectCellByApi(3, 1);
    await page.keyboard.press('Enter');
    await page.keyboard.type('=A1');
    await expect(grid.editorInput).toHaveValue('=A1');

    await expect(grid.frozenCell('ht_clone_top_inline_start_corner', 0, 0)).toHaveClass(/ht-formula-ref-fill-/);
    await expect(grid.refFillBorders('ht_clone_top_inline_start_corner').first()).toBeAttached();

    await page.keyboard.press('Escape');
    await expect(grid.frozenCell('ht_clone_top_inline_start_corner', 0, 0)).not.toHaveClass(/ht-formula-ref-fill-/);
  });

  test('the inline editor opened on a frozen cell takes its pane layer and is on top', async({ page }) => {
    await grid.selectCellByApi(0, 0);
    await page.keyboard.press('Enter');
    await expect(grid.editorInput).toBeFocused();

    await expect(grid.inlineEditorContainer).toBeVisible();
    await expect(grid.inlineEditorContainer).toHaveClass(/\bht_clone_top_inline_start_corner\b/);
    expect(await grid.inlineEditorIsTopmost()).toBe(true);
  });
});

test.describe('formulaBuilder in a right-to-left grid', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle, 'rtl');
    await grid.goto();
  });

  test('the formula bar and the editor are laid out right-to-left', async({ page }) => {
    await expect(grid.formulaBarHost).toHaveAttribute('dir', 'rtl');

    await grid.selectCellByApi(0, 2);
    await page.keyboard.press('Enter');
    await expect(grid.editorInput).toBeFocused();
    await expect(grid.inlineEditor).toHaveAttribute('dir', 'rtl');
    await expect(grid.inlineEditor).toHaveCSS('direction', 'rtl');
  });

  test('the suggestions popup is anchored to the editor end edge', async({ page }) => {
    await grid.selectCellByApi(3, 1);
    await page.keyboard.type('=SU');
    await expect(grid.suggestions).toBeVisible();

    await expect.poll(async() => {
      const box = await grid.popupAlignment();

      return box && {
        endAligned: Math.abs(box.popupRight - box.editorRight) <= 1,
        extendsTowardStart: box.popupLeft < box.editorLeft,
      };
    }).toEqual({ endAligned: true, extendsTowardStart: true });
  });

  test('the address box follows the selection and jumps to a typed address', async({ page }) => {
    await grid.selectCell(1, 1);
    await expect(grid.addressInput).toHaveValue('B2');

    await grid.addressInput.click();
    await grid.addressInput.fill('A3');
    await page.keyboard.press('Enter');
    await expect.poll(() => grid.selectedLast()).toEqual([2, 0, 2, 0]);
    await expect(grid.addressInput).toHaveValue('A3');
  });
});

// Engine-neutral: settings updates and the DOM they leave, so not tagged for the other engines.
test.describe('formulaBuilder settings updates', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle);
    await grid.goto();
  });

  test('a settings update with a new object holding the same values keeps the open edit', async({ page }) => {
    await grid.selectCellByApi(3, 0);
    await page.keyboard.type('=1+');
    await expect(grid.editorInput).toHaveValue('=1+');

    await grid.updateFormulaBuilderSettings(true);

    expect(await grid.editorOpened()).toBe(true);
    await expect(grid.editorInput).toBeFocused();
    await expect(grid.editorInput).toHaveValue('=1+');
    await expect(grid.formulaBar).toBeVisible();

    // The session is the same one: typing continues it and Enter commits it.
    await page.keyboard.type('2');
    await expect(grid.editorInput).toHaveValue('=1+2');
    await page.keyboard.press('Enter');
    await expect(grid.cell(4, 0)).toBeFocused();
    expect(await grid.sourceAt(3, 0)).toBe('=1+2');
    await grid.expectCell(3, 0, '3');
  });

  test('turning showFormulaBar off removes the formula bar', async() => {
    await expect(grid.formulaBar).toBeVisible();

    await grid.updateFormulaBuilderSettings(false);

    await expect(grid.formulaBarHost).toHaveCount(0);
    await expect(grid.formulaBar).toHaveCount(0);
    await expect(grid.addressInput).toHaveCount(0);
    // The grid keeps working without it.
    await grid.expectCell(0, 2, '3');
  });
});
