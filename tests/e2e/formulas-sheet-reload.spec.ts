import { test, expect } from '../fixtures/test';
import { FormulasSheetReloadPage } from '../fixtures/pages/FormulasSheetReloadPage';

/**
 * DEV-1143: a grid built without `data` and bound to a HyperFormula sheet reloads itself from that
 * sheet on every settings update. The engine hands the sheet back with each row's trailing empty
 * cell trimmed, and the core takes the column count from the first row - so cutting the first-row
 * cell of the last column and then re-rendering used to drop the whole column, although the engine
 * still held its data. Real-browser checks: the user's own cut (`Ctrl`+`X` on the selected cell)
 * and the re-render a framework wrapper performs.
 */
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test.describe('Formulas: reloading the engine sheet after a cut', () => {
  let grid: FormulasSheetReloadPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new FormulasSheetReloadPage(page, theme, bundle);
  });

  test('keeps the last column when its first-row cell is cut and the grid re-renders', async() => {
    await grid.goto();

    expect(await grid.countCols()).toBe(15);

    await grid.selectLastColumnFirstRow();
    await grid.page.keyboard.press('ControlOrMeta+x');

    await expect(grid.cell(0, 14)).toHaveText('');

    // The trigger: the engine now serializes the first row one cell short of the sheet's width.
    await expect.poll(() => grid.serializedFirstRowLength()).toBe(14);

    await grid.rerender();

    // The engine still holds the whole column, and so must the grid.
    expect(await grid.engineSheetWidth()).toBe(15);
    await expect.poll(() => grid.countCols()).toBe(15);
    await expect(grid.cell(0, 14)).toHaveText('');
    await expect(grid.cell(1, 14)).toHaveText('R1C14');
  });

  test('keeps the grid as it is when it re-renders with no edit', async() => {
    await grid.goto();
    await grid.rerender();

    await expect.poll(() => grid.countCols()).toBe(15);
    await expect(grid.cell(0, 0)).toHaveText('R0C0');
  });
});
