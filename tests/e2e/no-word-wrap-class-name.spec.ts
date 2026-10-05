import { test, expect } from '../fixtures/test';
import { NoWordWrapClassNamePage } from '../fixtures/pages/NoWordWrapClassNamePage';

/**
 * DEV-239. `wordWrap: false` must keep a cell on one line whatever `noWordWrapClassName` is set to.
 * The custom class name used to replace the built-in `htNoWrap`, the only class with
 * `white-space: nowrap`, so a custom class without its own wrap rule let the cell wrap.
 */
test.describe('noWordWrapClassName', () => {
  let grid: NoWordWrapClassNamePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new NoWordWrapClassNamePage(page, theme, bundle);
    await grid.goto();
  });

  test('keeps a cell with a custom class name on one line and still applies the custom class', async() => {
    await expect(grid.cell(0, 0)).toHaveClass(/htNoWrap/);
    await expect(grid.cell(0, 0)).toHaveClass(/custom-no-wrap/);
    await expect(grid.cell(0, 0)).toHaveCSS('white-space', 'nowrap');
  });

  test('keeps a cell with the default class name on one line', async() => {
    await expect(grid.cell(0, 1)).toHaveClass(/htNoWrap/);
    await expect(grid.cell(0, 1)).toHaveCSS('white-space', 'nowrap');
  });

  test('keeps wrapping a cell that has wordWrap left at its default', async() => {
    await expect(grid.cell(0, 2)).not.toHaveClass(/htNoWrap/);
    await expect(grid.cell(0, 2)).toHaveCSS('white-space', 'pre-wrap');
  });

  test('wraps a cell again once wordWrap is set back to true', async() => {
    await expect(grid.cell(0, 0)).toHaveCSS('white-space', 'nowrap');

    await grid.setWordWrap(0, 0, true);

    await expect(grid.cell(0, 0)).not.toHaveClass(/htNoWrap/);
    await expect(grid.cell(0, 0)).not.toHaveClass(/custom-no-wrap/);
    await expect(grid.cell(0, 0)).toHaveCSS('white-space', 'pre-wrap');
  });
});
