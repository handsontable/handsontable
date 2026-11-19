import { test, expect } from '../fixtures/test';
import { MultiselectChipRemovePage } from '../fixtures/pages/MultiselectChipRemovePage';

const INITIAL = ['a', 'b', 'c'];

/**
 * A multiselect chip's remove button writes through `setDataAtCell`, which does not check
 * `readOnly`, so the button has to honor the cell meta itself, as the checkbox renderer does. A cell
 * that refuses edits (`readOnly` from any level, or `editor: false`) draws no remove button. A
 * button that is still drawn (the meta changed without a re-render, or `readOnlyStyling: false`
 * keeps the editable look) leaves the value alone, and the press selects the cell like any other.
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
      test(`is not drawn (${name})`, async({ page, theme, bundle }) => {
        grid = new MultiselectChipRemovePage(page, theme, bundle);
        await grid.goto({ tableReadOnly });

        // The chips themselves are still there; only their remove buttons are gone.
        await expect(grid.firstChipLabel(0, col)).toBeVisible();
        await expect(grid.removeButtons(0, col)).toHaveCount(0);

        // The chips keep working as part of the cell: a press on one selects it.
        await grid.firstChipLabel(0, col).click();

        await expect.poll(() => grid.selected()).toEqual([[0, col, 0, col]]);
        expect(await grid.sourceAt(0, col)).toEqual(INITIAL);
      });
    });

    test('follows the cell meta on the next render', async({ page, theme, bundle }) => {
      grid = new MultiselectChipRemovePage(page, theme, bundle);
      await grid.goto();

      await expect(grid.removeButtons(0, 0)).toHaveCount(INITIAL.length);

      await grid.setCellMetaAndRender(0, 0, 'readOnly', true);
      await expect(grid.removeButtons(0, 0)).toHaveCount(0);

      await grid.setCellMetaAndRender(0, 0, 'readOnly', false);
      await expect(grid.removeButtons(0, 0)).toHaveCount(INITIAL.length);
    });
  });

  test.describe('drawn on a cell that refuses edits', () => {
    const CASES = [
      {
        name: 'readOnly set without a re-render',
        col: 0,
        // `setCellMeta` does not re-render, so the editable cell keeps its remove buttons: the state
        // an application toggling `readOnly` can leave on screen.
        prepare: (g: MultiselectChipRemovePage) => g.setCellMetaWithoutRender(0, 0, 'readOnly', true),
      },
      {
        name: 'editor: false set without a re-render',
        col: 0,
        prepare: (g: MultiselectChipRemovePage) => g.setCellMetaWithoutRender(0, 0, 'editor', false),
      },
      {
        name: 'readOnlyStyling: false',
        col: 4,
        prepare: async() => {},
      },
    ];

    CASES.forEach(({ name, col, prepare }) => {
      test(`leaves the value alone and selects the cell (${name})`, async({ page, theme, bundle }) => {
        grid = new MultiselectChipRemovePage(page, theme, bundle);
        await grid.goto();
        await prepare(grid);

        await expect(grid.removeButtons(0, col)).toHaveCount(INITIAL.length);

        await grid.removeButtons(0, col).first().click();

        // `click()` resolves once the click event has been dispatched, and the selection shows the
        // press reached the grid rather than being swallowed by the remove button.
        await expect.poll(() => grid.selected()).toEqual([[0, col, 0, col]]);
        expect(await grid.sourceAt(0, col)).toEqual(INITIAL);
        // The press landed on a button that is still drawn, not on a cell a re-render replaced.
        await expect(grid.removeButtons(0, col)).toHaveCount(INITIAL.length);
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
