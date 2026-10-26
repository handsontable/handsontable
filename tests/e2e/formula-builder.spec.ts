import { test, expect, THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { FormulaBuilderPage } from '../fixtures/pages/FormulaBuilderPage';

// Themes: the formula bar test compares editor and cell heights, which every theme sizes
// differently. Bundles: the fixture loads HyperFormula externally on the plain UMD leg.
// Engines: the tests press real keys, click and double-click, and assert the focus.
test.describe('formulaBuilder plugin', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle);
    await grid.goto();
  });

  test('renders the formula bar, whose address box shows the clicked A1', async () => {
    await expect(grid.formulaBar).toBeVisible();
    await grid.selectCell(0, 0);
    await expect(grid.addressInput).toHaveValue('A1');
  });

  test('clicking a cell syncs the formula-bar address', async () => {
    await grid.selectCell(0, 1);
    await expect(grid.addressInput).toHaveValue('B1');
  });

  test('a page stylesheet loaded before the grid overrides the theme\'s formula builder tokens', async({ page }) => {
    // The core stylesheet reaches the page after the application's own CSS, so its token block must
    // not out-rank a plain class selector: the guide tells applications to declare on these classes.
    const values = await page.evaluate(() => {
      const style = document.createElement('style');

      style.textContent = '.handsontable, .hfe-formula-bar { --hfe-color-error: rgb(1, 2, 3); }';
      document.head.prepend(style);

      const read = (el: Element | null) => (el ? getComputedStyle(el).getPropertyValue('--hfe-color-error').trim() : null);

      return {
        grid: read((window as unknown as { hot: { rootElement: Element } }).hot.rootElement),
        bar: read(document.querySelector('.hfe-formula-bar')),
      };
    });

    expect(values).toEqual({ grid: 'rgb(1, 2, 3)', bar: 'rgb(1, 2, 3)' });
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
    const before = await grid.formulaBarHost.boundingBox();

    expect(before).not.toBeNull();

    await grid.selectCell(4, 2);
    await grid.openBarEditor();
    await expect(grid.editorInput).toHaveValue(/\n/);

    // The bar keeps its one-line height: the editor is capped and scrolls its own content,
    // and its scroll port spans the bar's formula cell, padding included.
    await expect(grid.barEditor).toHaveClass(/hfe-editor--height-capped/);

    const editorBox = await grid.barEditor.boundingBox();
    const formulaCellBox = await grid.barFormulaCell.boundingBox();

    // Both boxes must exist: two `undefined` heights would compare equal.
    expect(editorBox).not.toBeNull();
    expect(formulaCellBox).not.toBeNull();
    expect(editorBox?.height).toBe(formulaCellBox?.height);
    await expect(grid.editorInput).toHaveJSProperty('clientHeight', editorBox?.height);
    expect(await grid.editorInput.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);

    // Nothing above the editor moves: the layout slot does not scroll and the bar stays put.
    await expect(grid.layoutSlotTop).toHaveJSProperty('scrollTop', 0);

    const after = await grid.formulaBarHost.boundingBox();

    expect(after).not.toBeNull();
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
    await expect(grid.refFillBorders('ht_master').first()).toBeAttached();

    await grid.page.keyboard.press('Escape');

    // Cancelling the edit clears the highlight again.
    await expect(grid.cell(0, 0)).not.toHaveClass(/ht-formula-ref-fill-/);
  });

  test('a referenced cell is highlighted but not reported as selected', async () => {
    await grid.openEditor(3, 0);
    await grid.editorInput.click();
    await grid.editorInput.press('ControlOrMeta+a');
    await grid.editorInput.fill('=SUM(A1:B2)');

    // The reference highlight is a custom selection: it paints the cells, and the grid's selection
    // attribute stays on the cell being edited.
    await expect(grid.cell(1, 1)).toHaveClass(/ht-formula-ref-/);
    await expect(grid.cell(1, 1)).not.toHaveAttribute('aria-selected');
    await expect(grid.cell(0, 0)).not.toHaveAttribute('aria-selected');
    await expect(grid.cell(3, 0)).toHaveAttribute('aria-selected', 'true');

    await grid.page.keyboard.press('Escape');
  });

  test('the edit keeps the focus and its highlight when the application inserts a row', async({ page }) => {
    await grid.selectCellByApi(3, 1);
    await page.keyboard.type('=A1');
    await expect(grid.editorInput).toBeFocused();
    await expect(grid.cell(0, 0)).toHaveClass(/ht-formula-ref-/);

    // The insert moves the selection, after which the grid focuses the selected cell unless the
    // focused element is one of its own inputs.
    await page.evaluate(() => (window as unknown as { hot: { alter(action: string, index: number): void } })
      .hot.alter('insert_row_above', 0));

    await expect(grid.editorInput).toBeFocused();
    expect(await grid.editorOpened()).toBe(true);
    // `A1` now names the inserted (empty) first row, and the highlight follows it.
    await expect(grid.cell(0, 0)).toHaveClass(/ht-formula-ref-/);

    await page.keyboard.press('Escape');
  });
});

