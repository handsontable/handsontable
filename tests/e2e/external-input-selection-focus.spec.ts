import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { ExternalInputSelectionPage } from '../fixtures/pages/ExternalInputSelectionPage';

/**
 * An application highlights a row from an input that lives outside the grid. On each keyup it
 * calls a selection method. The call must be able to paint the selection without taking the
 * browser focus, or the next character never reaches the input.
 *
 * Eight data rows and five columns, with both headers on. `selectRows(2)` covers row 2 from the
 * row header through column E and highlights the first cell of that row. `selectColumns(1)` covers
 * column B from the column header through the last row and highlights the first cell of that column.
 * `selectAll()` covers every cell and both headers. With navigable headers off, the focus lands on
 * the first data cell.
 */
const CASES = [
  {
    method: 'selectRows' as const,
    selected: [[2, -1, 2, 4]],
    highlight: { row: 2, col: 0 },
  },
  {
    method: 'selectColumns' as const,
    selected: [[-1, 1, 7, 1]],
    highlight: { row: 0, col: 1 },
  },
  {
    method: 'selectAll' as const,
    selected: [[-1, -1, 7, 4]],
    highlight: { row: 0, col: 0 },
  },
];

test.describe('selection from an external input', { tag: CROSS_BROWSER_TAG }, () => {
  for (const { method, selected, highlight } of CASES) {
    test(`${method} with changeListener false keeps the typed text in the external input`, async({ page, theme, bundle }) => {
      const grid = new ExternalInputSelectionPage(page, theme, bundle);

      await grid.goto();
      await grid.armSelectionOnFirstKeyup(method, false);
      await grid.externalInput.focus();
      await expect(grid.externalInput).toBeFocused();

      await page.keyboard.type('ab');

      await expect(grid.externalInput).toBeFocused();
      await expect(grid.externalInput).toHaveValue('ab');
      await expect(grid.externalInput).toHaveAccessibleName('External field');
      await expect.poll(() => grid.selected()).toEqual(selected);
      await expect.poll(() => grid.focusState()).toMatchObject({
        external: true,
        listening: false,
        row: highlight.row,
        col: highlight.col,
      });
    });

    test(`${method} without the flag moves focus into the grid`, async({ page, theme, bundle }) => {
      const grid = new ExternalInputSelectionPage(page, theme, bundle);

      await grid.goto();
      await grid.armSelectionOnFirstKeyup(method);
      await grid.externalInput.focus();
      await expect(grid.externalInput).toBeFocused();

      await page.keyboard.type('ab');

      await expect(grid.externalInput).toHaveValue('a');
      await expect(grid.externalInput).not.toBeFocused();
      await expect.poll(() => grid.selected()).toEqual(selected);
      await expect.poll(() => grid.focusState()).toEqual({
        external: false,
        onHighlight: true,
        listening: false,
        row: highlight.row,
        col: highlight.col,
      });
    });
  }
});
