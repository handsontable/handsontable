import { test, expect, THEMES_TAG, BUNDLES_TAG } from '../fixtures/test';
import { FormulaBuilderPage } from '../fixtures/pages/FormulaBuilderPage';

// Themes: the formula bar test compares editor and cell heights, which every theme sizes
// differently. Bundles: the fixture loads HyperFormula externally on the plain UMD leg.
test.describe('formulaBuilder plugin', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle);
    await grid.goto();
  });

  test('renders the grid and formula bar with A1 selected', async () => {
    await expect(grid.formulaBar).toBeVisible();
    await grid.selectCell(0, 0);
    await expect(grid.addressInput).toHaveValue('A1');
  });

  test('clicking a cell syncs the formula-bar address', async () => {
    await grid.selectCell(0, 1);
    await expect(grid.addressInput).toHaveValue('B1');
  });

  test('seeded formulas compute through the engine', async () => {
    await grid.expectCell(0, 2, '3');
    await grid.expectCell(1, 2, '7');
    await grid.expectCell(2, 2, '10');
  });

  test('editing a cell recomputes through the engine', async () => {
    await grid.openEditor(0, 0);
    await grid.editorInput.click();
    await grid.editorInput.press('ControlOrMeta+a');
    await grid.editorInput.fill('=1+1');
    await grid.page.keyboard.press('Enter');
    await grid.expectCell(0, 0, '2');
    await grid.expectCell(0, 2, '4');
  });

  test('typing on a selected cell opens the editor seeded with the char', async () => {
    await grid.selectCell(3, 0);
    await grid.page.keyboard.press('9');
    await expect(grid.editorInput).toBeVisible();
    await expect(grid.editorInput).toHaveValue('9');
    await grid.page.keyboard.press('Escape');
  });

  test('editing through the formula bar commits to the selected cell', async () => {
    await grid.selectCell(3, 0);
    await grid.openBarEditor();
    await grid.editorInput.press('ControlOrMeta+a');
    await grid.editorInput.fill('=6*7');
    await grid.page.keyboard.press('Enter');
    await grid.expectCell(3, 0, '42');
  });

  test('a multi-line formula edited in the formula bar scrolls inside the editor, not the bar', async () => {
    const barHost = grid.page.locator('.ht-formula-builder__formula-bar');
    const slot = grid.page.locator('.ht-slot-top');
    const formulaCell = grid.page.locator('.hfe-formula-bar__cell--formula');
    const barEditor = grid.page.locator('.hfe-formula-bar__overlay .hfe-editor');
    const before = await barHost.boundingBox();

    await grid.selectCell(4, 2);
    await grid.openBarEditor();
    await expect(grid.editorInput).toHaveValue(/\n/);

    // The bar keeps its one-line height: the editor is capped and scrolls its own content,
    // and its scroll port spans the bar's formula cell, padding included.
    await expect(barEditor).toHaveClass(/hfe-editor--height-capped/);

    const editorBox = await barEditor.boundingBox();
    const formulaCellBox = await formulaCell.boundingBox();

    expect(editorBox?.height).toBe(formulaCellBox?.height);
    await expect(grid.editorInput).toHaveJSProperty('clientHeight', editorBox?.height);
    expect(await grid.editorInput.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);

    // Nothing above the editor moves: the layout slot does not scroll and the bar stays put.
    await expect(slot).toHaveJSProperty('scrollTop', 0);

    const after = await barHost.boundingBox();

    expect(after?.y).toBe(before?.y);

    await grid.page.keyboard.press('Escape');
  });

  test('typing a reference highlights the referenced cell through a native custom selection', async () => {
    await grid.openEditor(3, 0);
    await grid.editorInput.click();
    await grid.editorInput.press('ControlOrMeta+a');
    await grid.editorInput.fill('=A1');

    // The caret touches the ref token, so the referenced cell gets the generated
    // fill class and its selection border renders through Walkontable.
    await expect(grid.cell(0, 0)).toHaveClass(/ht-formula-ref-fill-/);
    await expect(
      grid.page.locator('.ht_master [class*="wtBorder"][class*="ht-formula-ref-fill-"]').first(),
    ).toBeAttached();

    await grid.page.keyboard.press('Escape');

    // Cancelling the edit clears the highlight again.
    await expect(grid.cell(0, 0)).not.toHaveClass(/ht-formula-ref-fill-/);
  });
});
