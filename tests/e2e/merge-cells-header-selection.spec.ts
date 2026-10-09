import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SharedDemoGridPage } from '../fixtures/pages/SharedDemoGridPage';

/**
 * A range merged with Ctrl+M on the shared `/` grid, then selected by its column headers: the merged
 * cell is drawn as fully selected (`fullySelectedMergedCell-*`) while the column layers cover it whole,
 * and stops being so once a header click selects only part of it. #10559 fixed the second half – the
 * class used to outlive the selection that earned it – and added the `mergeCells/column-selection`
 * visual spec as its only test: three captures (the merged cell, the full cover, the partial one) on
 * every js variant and the three wrappers, the first taken right after the shortcut with nothing
 * asserted. Since DEV-3351 the visual spec keeps the full cover alone, as the theme and wrapper
 * canary; the merge, both covers and the class are asserted here.
 */
test.describe('a merged cell under a column selection', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: SharedDemoGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SharedDemoGridPage(page, theme, bundle);
    await grid.goto();
  });

  /**
   * The classes the merged cell's anchor carries that mark it as fully selected.
   *
   * @returns {Promise<string[]>}
   */
  async function fullySelectedClasses(): Promise<string[]> {
    return [...(await grid.cell(3, 0).getAttribute('class') ?? '').split(/\s+/)]
      .filter(name => name.startsWith('fullySelectedMergedCell-'));
  }

  test('merges a dragged range and draws it fully selected only while the column layers cover it whole',
    async({ page }) => {
      const from = await grid.cell(3, 0).boundingBox();
      const to = await grid.cell(5, 2).boundingBox();

      await page.mouse.move(from!.x + 10, from!.y + 10);
      await page.mouse.down();
      await page.mouse.move(to!.x + 10, to!.y + 10);
      await page.mouse.up();

      expect(await grid.selected()).toEqual([[3, 0, 5, 2]]);

      // The first capture: the range merged into one cell, three rows by three columns. The shortcut is
      // Control+M on every platform.
      await page.keyboard.press('Control+m');

      await expect(grid.cell(3, 0)).toHaveAttribute('rowspan', '3');
      await expect(grid.cell(3, 0)).toHaveAttribute('colspan', '3');
      await expect(grid.cell(4, 1)).toBeHidden();

      // The second capture: Ctrl+clicks on the three column headers add a column layer each, which
      // together cover the merged cell whole.
      for (const column of [0, 1, 2]) {
        // eslint-disable-next-line no-await-in-loop
        await grid.columnHeader(column).click({ position: { x: 1, y: 1 }, modifiers: ['ControlOrMeta'] });
      }

      expect(await grid.selected()).toEqual([
        [3, 0, 5, 2], [-1, 0, 99, 0], [-1, 1, 99, 1], [-1, 2, 99, 2],
      ]);
      expect(await grid.activeHeaders()).toEqual(['col-header-0', 'col-header-1', 'col-header-2']);
      expect(await fullySelectedClasses()).toContain('fullySelectedMergedCell-multiple');

      // The third capture: a plain click on the middle column's header selects that column alone,
      // which covers only part of the merged cell, so the cell loses the full-selection classes (#10559).
      await grid.columnHeader(1).click({ position: { x: 1, y: 1 } });

      expect(await grid.selected()).toEqual([[-1, 1, 99, 1]]);
      expect(await fullySelectedClasses()).toEqual([]);
      await expect(grid.cell(3, 0)).toHaveClass(/\barea\b/);
    });
});
