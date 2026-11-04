import { test, expect } from '../fixtures/test';
import { MultiselectChipRemovePage } from '../fixtures/pages/MultiselectChipRemovePage';

const INITIAL = ['a', 'b', 'c'];

/**
 * A multiselect chip's remove button writes through `setDataAtCell`, which does not check
 * `readOnly`, so the button has to honor the cell meta itself, as the checkbox renderer does. A cell
 * that refuses edits (`readOnly` from any level, or `editor: false`) draws no remove button, and a
 * press on one that is still drawn after the meta changed leaves the value alone and selects the
 * cell like any other press.
 */
test.describe('multiselect chip remove button', () => {
  let grid: MultiselectChipRemovePage;

  test.describe('on a cell that refuses edits', () => {
    const CASES = [
      { name: 'column readOnly', col: 1, tableReadOnly: false },
      { name: 'readOnly from cells()', col: 2, tableReadOnly: false },
      { name: 'editor: false', col: 3, tableReadOnly: false },
      { name: 'table readOnly', col: 0, tableReadOnly: true },
    ];

    CASES.forEach(({ name, col, tableReadOnly }) => {
      test(`is not drawn, and a chip press only selects the cell (${name})`, async({ page, theme, bundle }) => {
        grid = new MultiselectChipRemovePage(page, theme, bundle);
        await grid.goto({ tableReadOnly });

        // The chips themselves are still there; only their remove buttons are gone.
        await expect(grid.firstChipLabel(0, col)).toBeVisible();
        await expect(grid.removeButtons(0, col)).toHaveCount(0);

        await grid.firstChipLabel(0, col).click();

        await expect.poll(() => grid.selected()).toEqual([[0, col, 0, col]]);
        expect(await grid.sourceAt(0, col)).toEqual(INITIAL);
      });
    });
  });

  test.describe('drawn before the cell stopped accepting edits', () => {
    const CASES = [
      { name: 'readOnly', key: 'readOnly', value: true },
      { name: 'editor: false', key: 'editor', value: false },
    ];

    CASES.forEach(({ name, key, value }) => {
      test(`leaves the value alone and selects the cell (${name})`, async({ page, theme, bundle }) => {
        grid = new MultiselectChipRemovePage(page, theme, bundle);
        await grid.goto();

        // `setCellMeta` does not re-render, so the editable cell keeps its remove buttons: the state
        // a dynamic `cells()` or an app toggling `readOnly` can leave on screen.
        await grid.setCellMetaWithoutRender(0, 0, key, value);
        await expect(grid.removeButtons(0, 0)).toHaveCount(INITIAL.length);

        await grid.removeButtons(0, 0).first().click();

        // The selection is the positive control: the press reached the grid, so the click that
        // followed it has run by the time the value is read.
        await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);
        expect(await grid.sourceAt(0, 0)).toEqual(INITIAL);
      });
    });
  });

  test('removes the chip on an editable cell', async({ page, theme, bundle }) => {
    grid = new MultiselectChipRemovePage(page, theme, bundle);
    await grid.goto();

    await expect(grid.removeButtons(0, 0)).toHaveCount(INITIAL.length);

    await grid.removeButtons(0, 0).first().click();

    await expect.poll(() => grid.sourceAt(0, 0)).toEqual(['b', 'c']);
    expect(await grid.sourceAt(1, 0)).toEqual(INITIAL);
  });
});
