import { test, expect } from '../fixtures/test';

/**
 * Functional coverage for the CustomBorders viewport working set. The border
 * DOM (`.wtBorder` divs) is created per overlay by the selection manager, so
 * the assertions target the overlay containers directly. Visible border
 * edges carry inline sizes; hidden ones are `display: none`, which the
 * `:visible` filter excludes.
 */
test.describe('CustomBorders with frozen rows and columns', () => {
  test.beforeEach(async ({ page, theme }) => {
    await page.goto(`/tests/fixtures/demo/custom-borders.html?theme=${theme}`);
    await expect(page.getByTestId('cell-0-2')).toBeVisible();
  });

  test('renders borders located in the frozen areas', async ({ page }) => {
    // (0,0) lives in every frozen overlay; (10,0) in inline-start; (0,10) in top.
    await expect(page.locator('.ht_clone_top_inline_start_corner .wtBorder:visible').first()).toBeVisible();
    await expect(page.locator('.ht_clone_inline_start .wtBorder:visible').first()).toBeVisible();
    await expect(page.locator('.ht_clone_top .wtBorder:visible').first()).toBeVisible();
    // (10,10) is in the master viewport.
    await expect(page.locator('.ht_master .wtBorder:visible').first()).toBeVisible();
  });

  test('keeps the frozen column border rendered after scrolling far right', async ({ page }) => {
    // Scrolling only the column axis leaves the master row window unchanged, so (10, 0)'s row
    // stays rendered - isolating whether the frozen-start column keeps its border once the
    // master column range moves past col 0. Scrolled far enough (col 90 of 100) that col 10 is
    // out of the master range on every theme.
    await page.evaluate(() => (window as any).hot.scrollViewportTo({ col: 90 }));
    // The frozen column keeps its border even though the master range excludes col 0.
    await expect(page.locator('.ht_clone_inline_start .wtBorder:visible').first()).toBeVisible();
    // (10, 10) is fully unfrozen on both axes and its column scrolled out - its selection must be
    // culled (virtualization intact). Asserted by id rather than by `customSelections.length`:
    // the surviving count depends on how many rows/columns a given theme's cell size renders,
    // so a specific id is the theme-robust signal. `expect.poll` (rather than one `evaluate` read)
    // tolerates the render/cleanup happening a tick after `scrollViewportTo` resolves.
    await expect.poll(() => page.evaluate(() =>
      (window as any).hot.selection.highlight.customSelections
        .some((s: any) => s.settings?.id === 'border_row10col10'))).toBe(false);
    // The frozen-area border under test is still part of the working set.
    await expect.poll(() => page.evaluate(() =>
      (window as any).hot.selection.highlight.customSelections
        .some((s: any) => s.settings?.id === 'border_row10col0'))).toBe(true);
  });

  test('keeps the frozen row border rendered after scrolling far down', async ({ page }) => {
    // Scrolling only the row axis leaves the master column window unchanged, so (0, 10)'s column
    // stays rendered - isolating whether the frozen-top row keeps its border once the master row
    // range moves past row 0. Scrolled far enough (row 45 of 50) that row 10 is out of the master
    // range on every theme.
    await page.evaluate(() => (window as any).hot.scrollViewportTo({ row: 45 }));
    // The frozen row keeps its border even though the master range excludes row 0.
    await expect(page.locator('.ht_clone_top .wtBorder:visible').first()).toBeVisible();
    // (10, 10) is fully unfrozen on both axes and its row scrolled out - its selection must be
    // culled (virtualization intact). See the sibling test above for why this is asserted by id,
    // via `expect.poll`, instead of `customSelections.length`.
    await expect.poll(() => page.evaluate(() =>
      (window as any).hot.selection.highlight.customSelections
        .some((s: any) => s.settings?.id === 'border_row10col10'))).toBe(false);
    // The frozen-area border under test is still part of the working set.
    await expect.poll(() => page.evaluate(() =>
      (window as any).hot.selection.highlight.customSelections
        .some((s: any) => s.settings?.id === 'border_row0col10'))).toBe(true);
  });
});

test.describe('CustomBorders and UndoRedo', () => {
  test.beforeEach(async ({ page, theme }) => {
    await page.goto(`/tests/fixtures/demo/custom-borders.html?theme=${theme}`);
    await expect(page.getByTestId('cell-0-2')).toBeVisible();
  });

  test('restores a border removed together with its row when the removal is undone', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const hot = (window as any).hot;
      const plugin = hot.getPlugin('customBorders');
      const hasBorder = () => plugin.getBorders().some((b: any) => b.row === 10 && b.col === 0);

      hot.alter('remove_row', 10);
      const afterRemove = hasBorder();

      hot.getPlugin('undoRedo').undo();
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        afterRemove,
        afterUndo: hasBorder(),
        metaAfterUndo: Boolean(hot.getCellMeta(10, 0).borders),
      };
    });

    expect(result.afterRemove).toBe(false);
    expect(result.metaAfterUndo).toBe(true);
    expect(result.afterUndo).toBe(true);
  });
});

test.describe('CustomBorders selection ownership', () => {
  test('clearBorders() keeps custom selections the plugin does not own', async ({ page, theme }) => {
    await page.goto(`/tests/fixtures/demo/custom-borders.html?theme=${theme}`);
    await expect(page.getByTestId('cell-0-2')).toBeVisible();

    const result = await page.evaluate(() => {
      const hot = (window as any).hot;
      const coords = hot._createCellCoords(5, 5);

      hot.selection.highlight.addCustomSelection({
        border: { width: 2, color: 'orange' },
        visualCellRange: hot._createCellRange(coords, coords, coords),
      });

      const beforeClear = hot.selection.highlight.customSelections.length;

      hot.getPlugin('customBorders').clearBorders();

      return { beforeClear, afterClear: hot.selection.highlight.customSelections.length };
    });

    // Only the foreign selection must survive the plugin's clear.
    expect(result.afterClear).toBe(1);
  });
});
