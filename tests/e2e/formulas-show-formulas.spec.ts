import { test, expect } from '../fixtures/test';
import { FormulasShowFormulasPage } from '../fixtures/pages/FormulasShowFormulasPage';

/**
 * DEV-207: `showFormulas()`/`hideFormulas()` make a formula cell display its formula text instead
 * of its calculated value - display-only, like Excel/Sheets: `getDataAtCell()`, sorting, filtering
 * and validation are unaffected (pinned in the Jasmine suite, `publicAPI.spec.js`). The grid runs
 * `renderMode: 'onChange'`, so these are real-browser checks of what a Jasmine unit-style assertion
 * cannot prove: that the toggle actually repaints the DOM, that the real `Ctrl`+`` ` `` keypress
 * reaches the shortcut (a synthetic Jasmine `keydown` cannot carry the real `keyCode` a browser
 * assigns to the backquote key - and the binding is `Control` only, not `Control/Meta`: `Cmd`+`` ` ``
 * is the macOS "move focus to the next window" shortcut), that a `HYPERLINK` cell stops rendering
 * as a link once its raw formula text is shown, that `autoLink: true` doesn't re-linkify the URL
 * inside that painted text (AutoLink reads the cell's live DOM text, not the hook's `value`), and
 * that a real `Ctrl`+`X`/`Ctrl`+`V` round trip carries the formula text into a genuinely working
 * formula at the paste target, not a static string.
 */
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test.describe('Formulas: showFormulas() / hideFormulas()', () => {
  let grid: FormulasShowFormulasPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new FormulasShowFormulasPage(page, theme, bundle);
  });

  test('repaints the formula cell with its formula text under renderMode: onChange', async() => {
    await grid.goto();

    await expect(grid.cell(0, 2)).toHaveText('3');

    await grid.showFormulasViaApi();

    await expect(grid.cell(0, 2)).toHaveText('=A1+B1');
    // A plain value cell is unaffected.
    await expect(grid.cell(0, 0)).toHaveText('1');
  });

  test('toggles with a real Ctrl+` keypress', async() => {
    await grid.goto();
    await grid.selectCell(0, 0);

    await grid.page.keyboard.press('Control+Backquote');

    expect(await grid.isShowingFormulas()).toBe(true);
    await expect(grid.cell(0, 2)).toHaveText('=A1+B1');

    await grid.page.keyboard.press('Control+Backquote');

    expect(await grid.isShowingFormulas()).toBe(false);
    await expect(grid.cell(0, 2)).toHaveText('3');
  });

  test('stops rendering a HYPERLINK cell as a link while its formula text is shown', async() => {
    await grid.goto();

    await expect(grid.link(0, 3)).toHaveText('Example');

    await grid.showFormulasViaApi();

    await expect(grid.link(0, 3)).toHaveCount(0);
    await expect(grid.cell(0, 3)).toHaveText('=HYPERLINK("https://example.com", "Example")');
  });

  test('does not let AutoLink re-linkify the URL inside the painted formula text', async() => {
    await grid.goto();
    await grid.showFormulasViaApi();

    // AutoLink reads a cell's rendered text, not the hook's `value` argument, so without an
    // explicit paint order it would wrap "https://example.com" - the painted formula's own URL
    // argument - in its own anchor.
    await expect(grid.cell(0, 3)).toHaveText('=HYPERLINK("https://example.com", "Example")');
    await expect(grid.anyAnchor(0, 3)).toHaveCount(0);
  });

  test('cuts the formula text, and pasting it elsewhere creates a real, working formula', async() => {
    await grid.goto();
    await grid.showFormulasViaApi();

    await grid.selectCell(0, 2);
    await grid.page.keyboard.press('ControlOrMeta+x');

    await expect.poll(() => grid.clipboardText()).toBe('=A1+B1');
    // Cut empties the source cell.
    await expect(grid.cell(0, 2)).toHaveText('');

    await grid.selectCell(1, 2);
    await grid.page.keyboard.press('ControlOrMeta+v');

    // Still showing formulas: the pasted cell shows the formula text it received.
    await expect(grid.cell(1, 2)).toHaveText('=A1+B1');

    // Hiding formulas proves it landed as a real, calculating formula - not a static string that
    // merely looks like one.
    await grid.hideFormulasViaApi();
    await expect(grid.cell(1, 2)).toHaveText('3');
  });
});
