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
 * is the macOS "move focus to the next window" shortcut), and that a `HYPERLINK` cell stops
 * rendering as a link once its raw formula text is shown.
 */
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
});
