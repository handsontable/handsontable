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

test.describe('formulaBuilder with pagination', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('an address on another page is refused, and a later bar commit still writes the selected cell', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle, 'pagination');

    await grid.goto();
    await grid.selectCellByApi(0, 0);
    await expect(grid.addressInput).toHaveValue('A1');

    await grid.addressInput.click();
    await grid.addressInput.fill('A5');
    await page.keyboard.press('Enter');

    await expect(page.locator('.hfe-live-region')).toContainText('Cannot select A5');
    await expect(grid.addressInput).toHaveValue('A1');
    expect(await grid.selectedLast()).toEqual([0, 0, 0, 0]);
    expect(await page.evaluate(() => (window as unknown as { hot: { getPlugin(n: string): { getPaginationData(): { currentPage: number } } } })
      .hot.getPlugin('pagination').getPaginationData().currentPage)).toBe(1);

    await grid.barFormulaArea.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('=999');
    await page.keyboard.press('Enter');

    expect(await grid.sourceAt(0, 0)).toBe('=999');
    expect(await grid.sourceAt(4, 0)).toBe('');
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

  test('turning the plugin off and on at runtime switches between the text editor and the formula editor', async({ page }) => {
    const plainTextarea = grid.inlineEditorContainer.locator('.ht-formula-builder__inline-editor > textarea');

    /**
     * Opens the editor on C1 with Enter, checks which editor opened, and cancels it.
     *
     * @param expected The editor expected to open.
     */
    const expectEditorOnC1 = async(expected: 'formula' | 'text') => {
      await grid.selectCellByApi(0, 2);
      await page.keyboard.press('Enter');

      if (expected === 'formula') {
        await expect(grid.editorInput).toBeFocused();
        await expect(grid.editorInput).toHaveValue('=A1+B1');
        await expect(plainTextarea).toHaveCount(0);
      } else {
        // The plain textarea is styled and sized as the grid's text editor, not a bare browser textarea.
        await expect(plainTextarea).toBeFocused();
        await expect(plainTextarea).toHaveValue('=A1+B1');
        await expect(plainTextarea).toHaveClass('handsontableInput');
        await expect(plainTextarea).toHaveCSS('resize', 'none');
        await expect(grid.inlineEditorContainer).toHaveClass(/\bhandsontableInputHolder\b/);

        const [field, cell] = await Promise.all([plainTextarea.boundingBox(), grid.cell(0, 2).boundingBox()]);

        expect(Math.abs((field?.height ?? 0) - (cell?.height ?? -10))).toBeLessThanOrEqual(2);
      }

      await page.keyboard.press('Escape');
      expect(await grid.editorOpened()).toBe(false);
    };
    const run = (code: string) => page.evaluate(code);

    await expectEditorOnC1('formula');

    await run('hot.updateSettings({ formulaBuilder: false })');
    await expectEditorOnC1('text');

    await run('hot.updateSettings({ formulaBuilder: { builder: FormulaBuilderModule, showFormulaBar: true } })');
    await expectEditorOnC1('formula');

    await run('hot.getPlugin("formulaBuilder").disablePlugin()');
    await expectEditorOnC1('text');

    await run('hot.getPlugin("formulaBuilder").enablePlugin()');
    await expectEditorOnC1('formula');

    // With the Formulas plugin off there is no engine, so the formula editor cannot run either.
    await run('hot.updateSettings({ formulas: false })');
    await expectEditorOnC1('text');

    await run('hot.updateSettings({ formulas: { engine: HyperFormula } })');
    await expectEditorOnC1('formula');
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

test.describe('formulaBuilder in a grid the window scrolls vertically', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  test('a reference drag held past the grid end edge scrolls the columns', async({ page, theme, bundle }) => {
    const grid = new FormulaBuilderPage(page, theme, bundle, 'split-scroll');

    await grid.goto();
    await grid.selectCellByApi(3, 0);
    await page.keyboard.type('=');
    await expect(grid.editorInput).toBeFocused();

    const holder = grid.grid.locator('.ht_master .wtHolder');
    const scrollLeft = () => holder.evaluate(element => element.scrollLeft);
    const holderBox = await holder.boundingBox();

    expect(await scrollLeft()).toBe(0);

    await grid.cell(0, 0).hover();
    await page.mouse.down();
    // Past the holder's end edge, level with the first row: only the columns can scroll there.
    await page.mouse.move((holderBox?.x ?? 0) + (holderBox?.width ?? 0) + 20, (await grid.cell(0, 0).boundingBox())?.y ?? 0, { steps: 5 });

    await expect.poll(scrollLeft).toBeGreaterThan(0);

    await page.mouse.up();
    await expect(grid.editorInput).toHaveValue(/^=A1:[BC]1$/);
  });
});

// A theme switch during an edit, as an application that follows `prefers-color-scheme` makes one:
// the builder takes its theme class at construction, and rebuilding it cancelled the open edit.
test.describe('formulaBuilder theme switch during an edit', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle);
    await grid.goto();
  });

  test('keeps the typed formula, and the rebuilt bar takes the new theme after the commit', async({ page }) => {
    await grid.selectCellByApi(3, 0);
    await page.keyboard.press('=');
    await page.keyboard.type('A1*10');
    await expect(grid.editorInput).toHaveValue('=A1*10');

    const target = await grid.switchToAnotherTheme();

    await expect(grid.editorInput).toHaveValue('=A1*10');
    await expect(grid.editorInput).toBeFocused();
    expect(await grid.editorOpened()).toBe(true);

    await page.keyboard.press('Enter');
    await expect(grid.cell(4, 0)).toBeFocused();
    expect(await grid.sourceAt(3, 0)).toBe('=A1*10');
    expect(await grid.dataAt(3, 0)).toBe(10);
    await expect(grid.formulaBar).toHaveClass(new RegExp(`\\b${target}\\b`));
  });
});

// A grid inside a shadow root reads no document stylesheet, so the rules the plugin generates for
// its highlights (the dashed border mask and the cell tint) must be mounted in the grid's own tree.
test.describe('formulaBuilder in a shadow root', { tag: [THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: FormulaBuilderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulaBuilderPage(page, theme, bundle, 'shadow');
    await grid.goto();
  });

  test('the reference highlights get their dashed border and their tint', async({ page }) => {
    await grid.selectCellByApi(0, 2);
    await page.keyboard.press('Enter');
    await expect(grid.editorInput).toHaveValue('=A1+B1');
    // The caret ends on `B1`, so B1 is the active reference: bordered and tinted.
    await expect(grid.cell(0, 1)).toHaveClass(/ht-formula-ref-/);

    await expect.poll(() => page.evaluate(() => {
      const root = document.querySelector('[data-testid="shadow-host"]')?.shadowRoot;
      const cell = root?.querySelector('[data-testid="cell-0-1"]');
      const borders = Array.from(root?.querySelectorAll('.ht_master .wtBorder[class*="ht-formula-ref-"]') ?? []);

      const input = root?.querySelector('.hfe-editor__input');

      return {
        tinted: !!cell && getComputedStyle(cell).backgroundImage !== 'none',
        dashed: borders.length > 0 && borders.every(border => getComputedStyle(border).maskImage !== 'none'),
        // The package stylesheet reaches the shadow root too: its text field overlays the
        // highlighted text instead of showing the formula a second time.
        inputOverlays: !!input && getComputedStyle(input).position === 'absolute',
      };
    })).toEqual({ tinted: true, dashed: true, inputOverlays: true });
  });
});
