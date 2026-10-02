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
    await expect(grid.cell(0, 0)).toHaveClass(/custom-no-wrap/);
    expect(await grid.whiteSpace(0, 0)).toBe('nowrap');
  });

  test('keeps a cell with the default class name on one line', async() => {
    await expect(grid.cell(0, 1)).toHaveClass(/htNoWrap/);
    expect(await grid.whiteSpace(0, 1)).toBe('nowrap');
  });

  test('keeps wrapping a cell that has wordWrap left at its default', async() => {
    await expect(grid.cell(0, 2)).not.toHaveClass(/htNoWrap/);
    expect(await grid.whiteSpace(0, 2)).not.toBe('nowrap');
  });
});
