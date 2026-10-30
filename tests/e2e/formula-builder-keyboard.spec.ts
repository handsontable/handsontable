import { test, expect, THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { FormulaBuilderPage } from '../fixtures/pages/FormulaBuilderPage';

// Keyboard-only flows of the FormulaBuilder plugin: no pointer event from the first key to the
// last assertion. Themes: the formula bar and the editor are themed surfaces the focus moves
// through. Bundles: the fixture loads HyperFormula externally on the plain UMD leg. Engines: real
// key presses and the focus order are what each engine can get wrong on its own.
test.describe('formulaBuilder keyboard flow', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle);
    await grid.goto();
  });

  test('Shift+Tab from the first column opens the bar on the cell that was left, not on A1', async({ page }) => {
    await grid.selectCellByApi(2, 0);
    await page.keyboard.press('Shift+Tab');
    await expect(grid.editorInput).toBeFocused();
    await expect(grid.addressInput).toHaveValue('A3');
    await page.keyboard.type('99');
    await page.keyboard.press('Enter');
    await expect.poll(() => grid.dataAt(0, 0)).toBe(1);
  });

  test('Shift+Tab walks out of the grid through the formula bar, and Tab walks back in', async({ page }) => {
    await grid.selectCellByApi(0, 0);

    // Backwards: the bar's formula editor, the address box, then the page before the grid.
    await page.keyboard.press('Shift+Tab');
    await expect(grid.editorInput).toBeFocused();
    await expect(grid.editorInput).toHaveAccessibleName('Formula editor');
    await expect(grid.editorInput).toHaveAttribute('role', 'combobox');
    expect(await grid.editorOpened()).toBe(true);

    await page.keyboard.press('Shift+Tab');
    await expect(grid.addressInput).toBeFocused();
    await expect(grid.addressInput).toHaveAccessibleName('Cell address');
    // Leaving the editor backwards closes the session without writing to A1.
    await expect.poll(() => grid.editorOpened()).toBe(false);
    expect(await grid.sourceAt(0, 0)).toBe(1);

    await page.keyboard.press('Shift+Tab');
    await expect(grid.beforeGrid).toBeFocused();

    // Forwards: the address box, the formula editor, then the grid takes the keyboard back.
    await page.keyboard.press('Tab');
    await expect(grid.addressInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(grid.editorInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(grid.cell(0, 0)).toBeFocused();
    expect(await grid.isListening()).toBe(true);
    expect(await grid.sourceAt(0, 0)).toBe(1);

    // The grid's own Tab navigation works again from there.
    await page.keyboard.press('Tab');
    await expect(grid.cell(0, 1)).toBeFocused();
    expect(await grid.selectedLast()).toEqual([0, 1, 0, 1]);
  });

  test('Enter opens the inline editor on a formula cell, and Escape cancels back to the cell', async({ page }) => {
    await grid.selectCellByApi(0, 2);

    await page.keyboard.press('Enter');
    await expect(grid.editorInput).toBeFocused();
    await expect(grid.editorInput).toHaveAccessibleName('Formula editor');
    await expect(grid.inlineEditorContainer).toBeVisible();
    await expect(grid.inlineEditorContainer.getByRole('combobox', { name: 'Formula editor' })).toBeFocused();
    await expect(grid.editorInput).toHaveValue('=A1+B1');

    await page.keyboard.press('End');
    await page.keyboard.type('*10');
    await expect(grid.editorInput).toHaveValue('=A1+B1*10');

    await page.keyboard.press('Escape');
    await expect(grid.cell(0, 2)).toBeFocused();
    expect(await grid.isListening()).toBe(true);
    expect(await grid.editorOpened()).toBe(false);
    expect(await grid.selectedLast()).toEqual([0, 2, 0, 2]);
    expect(await grid.sourceAt(0, 2)).toBe('=A1+B1');
    await grid.expectCell(0, 2, '3');
  });

  test('Enter, Shift+Enter, Tab and Shift+Tab commit and move the selection', async({ page }) => {
    // Enter commits and moves down.
    await grid.selectCellByApi(3, 0);
    await page.keyboard.press('7');
    await expect(grid.editorInput).toHaveValue('7');
    await page.keyboard.press('Enter');
    await expect(grid.cell(4, 0)).toBeFocused();
    expect(await grid.selectedLast()).toEqual([4, 0, 4, 0]);
    expect(await grid.sourceAt(3, 0)).toBe('7');

    // Shift+Enter commits and moves up.
    await grid.selectCellByApi(3, 1);
    await page.keyboard.press('5');
    await page.keyboard.press('Shift+Enter');
    await expect(grid.cell(2, 1)).toBeFocused();
    expect(await grid.selectedLast()).toEqual([2, 1, 2, 1]);
    expect(await grid.sourceAt(3, 1)).toBe('5');

    // Tab commits and moves right.
    await grid.selectCellByApi(3, 1);
    await page.keyboard.press('6');
    await page.keyboard.press('Tab');
    await expect(grid.cell(3, 2)).toBeFocused();
    expect(await grid.selectedLast()).toEqual([3, 2, 3, 2]);
    expect(await grid.sourceAt(3, 1)).toBe('6');

    // Shift+Tab commits and moves left.
    await page.keyboard.press('=');
    await page.keyboard.type('2*3');
    await page.keyboard.press('Shift+Tab');
    await expect(grid.cell(3, 1)).toBeFocused();
    expect(await grid.selectedLast()).toEqual([3, 1, 3, 1]);
    expect(await grid.sourceAt(3, 2)).toBe('=2*3');
    await grid.expectCell(3, 2, '6');
  });

  test('Ctrl/Cmd+Enter fills the selected range and moves the focus within it, as in the text editor', async({ page }) => {
    await page.evaluate(() => (window as unknown as { hot: { selectCell: (...args: number[]) => void } })
      .hot.selectCell(3, 0, 4, 1));
    await expect(grid.cell(3, 0)).toBeFocused();
    await page.keyboard.press('7');
    await expect(grid.editorInput).toHaveValue('7');
    await page.keyboard.press('ControlOrMeta+Enter');

    await expect.poll(() => grid.editorOpened()).toBe(false);
    expect(await page.evaluate(() => (window as unknown as { hot: { getData: (...args: number[]) => unknown } })
      .hot.getData(3, 0, 4, 1))).toEqual([['7', '7'], ['7', '7']]);
    expect(await grid.selectedAll()).toEqual([[3, 0, 4, 1]]);
    // `enterMoves` moves the focus one row down inside the range.
    await expect(grid.cell(4, 0)).toBeFocused();
  });

  test('Ctrl/Cmd+Enter twice on single cells writes two values and adds no selection layer', async({ page }) => {
    await grid.selectCellByApi(3, 0);
    await page.keyboard.type('10');
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect.poll(() => grid.editorOpened()).toBe(false);
    expect(await grid.selectedAll()).toEqual([[4, 0, 4, 0]]);

    await page.keyboard.type('20');
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect.poll(() => grid.sourceAt(3, 0)).toBe('10');
    await expect.poll(() => grid.sourceAt(4, 0)).toBe('20');
  });

  test('Tab on the last cell commits and drops the selection, as in the text editor', async({ page }) => {
    // The grid's Tab pair drops the selection when Tab has nowhere to move it, so the next Tab
    // leaves the grid. The last cell of the last row has no cell after it (`autoWrapRow` is off).
    await grid.selectCellByApi(4, 2);
    await page.keyboard.press('8');
    await expect(grid.editorInput).toHaveValue('8');
    await page.keyboard.press('Tab');

    await expect.poll(() => grid.editorOpened()).toBe(false);
    expect(await grid.sourceAt(4, 2)).toBe('8');
    await expect.poll(() => grid.selectedAll()).toBeNull();
  });

  test('the keyboard works after a commit from the formula bar', async({ page }) => {
    await grid.selectCellByApi(1, 0);
    await grid.openBarEditor();
    await page.keyboard.type('=A1');
    await page.keyboard.press('Enter');
    await expect.poll(() => grid.isListening()).toBe(true);
    // The bar's Enter moves the selection down one row, as the grid's own editors do.
    expect(await grid.selectedLast()).toEqual([2, 0, 2, 0]);
    // Row 2 has a row below it, so only a listening grid can move the selection to row 3.
    await page.keyboard.press('ArrowDown');
    expect(await grid.selectedLast()).toEqual([3, 0, 3, 0]);
  });

  test('the bar editor shows a focus ring and the in-cell editor does not get one', async({ page }) => {
    await grid.selectCellByApi(1, 0);
    await grid.openBarEditor();
    await expect(grid.editorInput).toBeFocused();
    const ring = await grid.barEditor.evaluate((el) => {
      const style = getComputedStyle(el);

      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });

    expect(ring.style).not.toBe('none');
    expect(ring.width).toBeGreaterThan(0);

    // The in-cell editor keeps the cell editor border and no outline.
    await page.keyboard.press('Escape');
    await grid.selectCellByApi(1, 0);
    await page.keyboard.press('Enter');
    await expect(grid.inlineEditor).toBeVisible();
    await expect(grid.inlineEditor).toHaveClass(/hfe-editor--focused/);
    expect(await grid.inlineEditor.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('none');
  });

  test('the keyboard works after a Ctrl/Cmd+Enter commit from the formula bar', async({ page }) => {
    await grid.selectCellByApi(3, 0);
    await grid.openBarEditor();
    await page.keyboard.type('7');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');
    await expect.poll(() => grid.isListening()).toBe(true);
  });
});

// Point mode: with a reference valid at the caret, the arrow keys pick references (the guide's
// "Keyboard point mode" table and `hyperformula-ui`'s keymap: `pointMove`, `pointExtend`,
// `pointJump`, `pointExtendJump`).
test.describe('formulaBuilder keyboard point mode', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle);
    await grid.goto();
  });

  test('an arrow key after = inserts the neighbor reference', async({ page }) => {
    await grid.selectCellByApi(3, 0);
    await page.keyboard.press('=');
    await page.keyboard.press('ArrowUp');
    await expect(grid.editorInput).toHaveValue('=A3');

    await page.keyboard.press('Enter');
    await expect(grid.cell(4, 0)).toBeFocused();
    expect(await grid.sourceAt(3, 0)).toBe('=A3');
    expect(await grid.dataAt(3, 0)).toBe(5);
  });

  test('Shift+arrow extends the picked reference into a range', async({ page }) => {
    await grid.selectCellByApi(3, 0);
    await page.keyboard.press('=');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Shift+ArrowUp');
    await expect(grid.editorInput).toHaveValue('=A2:A3');

    await page.keyboard.press('Enter');
    await expect(grid.cell(4, 0)).toBeFocused();
    expect(await grid.sourceAt(3, 0)).toBe('=A2:A3');
  });

  test('Ctrl/Cmd+Shift+arrow extends the reference to the edge of the data block', async({ page }) => {
    await grid.selectCellByApi(3, 1);
    await page.keyboard.press('=');
    await page.keyboard.press('ArrowUp');
    // One step would give B2:B3; the jump reaches the block's first row.
    await page.keyboard.press('ControlOrMeta+Shift+ArrowUp');
    await expect(grid.editorInput).toHaveValue('=B1:B3');

    await page.keyboard.press('Enter');
    await expect(grid.cell(4, 1)).toBeFocused();
    expect(await grid.sourceAt(3, 1)).toBe('=B1:B3');
  });

  test('ArrowLeft and ArrowRight pick the neighbor references', async({ page }) => {
    await grid.selectCellByApi(3, 1);
    await page.keyboard.press('=');
    await page.keyboard.press('ArrowLeft');
    await expect(grid.editorInput).toHaveValue('=A4');

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(grid.editorInput).toHaveValue('=C4');

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  });

  test('Ctrl/Cmd+arrow jumps the reference cursor to the edge of the data block', async({ page }) => {
    await grid.selectCellByApi(3, 0);
    await page.keyboard.press('=');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ControlOrMeta+ArrowUp');
    await expect(grid.editorInput).toHaveValue('=A1');

    await page.keyboard.press('Enter');
    await expect(grid.cell(4, 0)).toBeFocused();
    expect(await grid.sourceAt(3, 0)).toBe('=A1');
    expect(await grid.dataAt(3, 0)).toBe(1);
  });
});

// Each inline edit session guards its keys at the editor wrapper (`startKeyboardGuard()` in the
// plugin's editor shim), and the guard of a closed session is destroyed one task after the close,
// so the key that committed it never reaches the grid's own shortcuts. A user who types the next
// cell's first key within that task opens a new session before the old guard is destroyed. The
// clock is paused after the build so that order is forced instead of left to typing speed (with
// real time it failed 6 of 150 runs on one leg).
test.describe('formulaBuilder commit right after the previous commit', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    await page.clock.install();
    grid = new FormulaBuilderPage(page, theme, bundle);
    await grid.goto();
    await page.clock.pauseAt(Date.now() + 1000);

    // The first session: Tab commits B4 and moves to C4.
    await grid.selectCellByApi(3, 1);
    await page.keyboard.press('6');
    await page.keyboard.press('Tab');
    await expect(grid.cell(3, 2)).toBeFocused();
  });

  test('Shift+Tab moves one cell when the previous session was cleaned up before the next one opened', async({ page }) => {
    // Control: let the deferred cleanup of the first session run first.
    await page.clock.runFor(100);

    await page.keyboard.press('=');
    await page.keyboard.type('2*3');
    await expect(grid.editorInput).toHaveValue('=2*3');
    await page.keyboard.press('Shift+Tab');

    await expect(grid.cell(3, 1)).toBeFocused();
    expect(await grid.selectedLast()).toEqual([3, 1, 3, 1]);
    expect(await grid.sourceAt(3, 2)).toBe('=2*3');
  });

  test('Shift+Tab moves one cell when the next session opened before the previous one was cleaned up', async({ page }) => {
    // The next session opens while the first session's cleanup is still queued.
    await page.keyboard.press('=');
    await page.keyboard.type('2*3');
    await expect(grid.editorInput).toHaveValue('=2*3');
    await page.clock.runFor(100);
    await page.keyboard.press('Shift+Tab');

    await expect(grid.cell(3, 1)).toBeFocused();
    expect(await grid.selectedLast()).toEqual([3, 1, 3, 1]);
    expect(await grid.sourceAt(3, 2)).toBe('=2*3');
  });
});

// In a right-to-left grid the columns run from right to left, so ArrowLeft points at the next
// column and ArrowRight at the previous one, the way the grid's own selection moves.
test.describe('formulaBuilder keyboard point mode in a right-to-left grid', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('ArrowLeft picks the next column and ArrowRight the previous one', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle, 'rtl');

    await grid.goto();
    await grid.selectCellByApi(3, 1);
    await page.keyboard.press('=');
    await page.keyboard.press('ArrowLeft');
    await expect(grid.editorInput).toHaveValue('=C4');

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(grid.editorInput).toHaveValue('=A4');

    await page.keyboard.press('Enter');
    await expect(grid.cell(4, 1)).toBeFocused();
    expect(await grid.sourceAt(3, 1)).toBe('=A4');
  });
});

// A key the formula editor does not handle reaches the grid, like from the grid's own editors: an
// arrow key commits a quick edit (one opened by typing) and moves the selection.
test.describe('formulaBuilder quick edit', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('an arrow key commits a value typed into a cell and moves the selection', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCellByApi(3, 0);
    await page.keyboard.type('abc');
    await expect(grid.editorInput).toHaveValue('abc');
    await page.keyboard.press('ArrowDown');

    await expect(grid.cell(4, 0)).toBeFocused();
    expect(await grid.editorOpened()).toBe(false);
    expect(await grid.sourceAt(3, 0)).toBe('abc');
  });

  // The package's point-mode toggle (F2, mod+E) emits no event: the shim watches the handled keydown
  // and enters full edit mode, so the arrows move the caret instead of committing the quick edit.
  for (const [title, chord] of [['F2', 'F2'], ['Ctrl/Cmd+E', 'ControlOrMeta+e']]) {
    test(`${title} in a typed edit switches the arrows to caret movement`, async({ page, theme, bundle }) => {
      const grid = new FormulaBuilderPage(page, theme, bundle);

      await grid.goto();
      await grid.selectCellByApi(3, 1);
      await page.keyboard.type('=');
      await page.keyboard.press('ArrowUp');
      await expect(grid.editorInput).toHaveValue('=B3');
      await page.keyboard.press(chord);
      await page.keyboard.press('ArrowLeft');

      expect(await grid.editorOpened()).toBe(true);
      await expect(grid.editorInput).toHaveValue('=B3');
      expect(await grid.selectedLast()).toEqual([3, 1, 3, 1]);
      await page.keyboard.press('Escape');
    });
  }

  test('an arrow key moves the caret in a value opened with Enter', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCellByApi(0, 0);
    await page.keyboard.press('Enter');
    await expect(grid.editorInput).toBeFocused();
    await page.keyboard.press('ArrowLeft');

    expect(await grid.editorOpened()).toBe(true);
    expect(await grid.selectedLast()).toEqual([0, 0, 0, 0]);
    await page.keyboard.press('Escape');
  });
});
