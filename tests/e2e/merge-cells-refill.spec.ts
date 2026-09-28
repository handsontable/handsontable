import { test, expect } from '../fixtures/test';
import { ColumnAutosizeRefillPage } from '../fixtures/pages/ColumnAutosizeRefillPage';

/**
 * DEV-2908: a refill pass repaints only the rows it appends — unless the band renders a merged
 * cell, when it must repaint the whole band (MergeCells writes the heights of the cells next to a
 * merged block from row heights pass 1 read before the re-measure). This spec drives a real
 * `mergeCells` block through a multi-pass refill and pins what the plugin actually leaves in the
 * DOM: the anchor keeps its full rowspan, the covered cells stay hidden, and the neighbor cell is
 * as tall as its row. The full repaint itself is pinned in the engine tier (`table.spec.js`,
 * DEV-2908), where no overlay clone renders and the band-render count is observable — the host's
 * `afterViewRender`/`afterRenderer` counters cannot tell a refill pass from a clone render. The
 * block sits INSIDE the tall
 * band on purpose: MergeCells extends the rendered band to cover a merged block whole, so a block
 * reaching past the band would defeat the short-band precondition, and the gate only matters when
 * the block is already rendered when the refill starts.
 */
test.describe('row-band refill with a merged block inside the band', () => {
  let grid: ColumnAutosizeRefillPage;

  const ANCHOR = { row: 1, col: 3, rowspan: 3 };

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ColumnAutosizeRefillPage(page, theme, bundle, 'merge-cells-refill');
    await grid.goto();
  });

  /**
   * The merged block as rendered: anchor rowspan, covered cells hidden, neighbor height equals the
   * row height. Read in one evaluate so all describe the same frame.
   */
  async function expectMergedBlockIntact(): Promise<void> {
    await expect(grid.cell(ANCHOR.row, ANCHOR.col)).toHaveAttribute('rowspan', String(ANCHOR.rowspan));

    for (let row = ANCHOR.row + 1; row < ANCHOR.row + ANCHOR.rowspan; row++) {
      // A covered cell is in the DOM (the band renders it) but hidden by the plugin.
      await expect(grid.cell(row, ANCHOR.col)).toBeHidden();
    }

    // The neighbor next to the block is sized by the plugin's after-renderer to its own row.
    await expect.poll(() => grid.page.evaluate(() => {
      const TD = document.querySelector('[data-testid="grid"] .ht_master [data-testid="cell-2-2"]') as HTMLElement | null;

      if (!TD || !TD.parentElement) {
        return null;
      }

      return TD.getBoundingClientRect().height - TD.parentElement.getBoundingClientRect().height;
    })).toBe(0);
  }

  test('double-click autosize refills the viewport and leaves the merged block intact', async () => {
    await expect.poll(() => grid.columnHeaderWidth(2)).toBeLessThanOrEqual(41);
    await expect.poll(() => grid.renderedRowCount()).toBeLessThanOrEqual(6);

    const paintsBefore = await grid.paintCounters();

    await grid.autosizeColumnByDoubleClick(2);

    await expect.poll(() => grid.columnHeaderWidth(2)).toBeGreaterThan(200);

    await grid.expectViewportFilled();
    await grid.expectPaintedOnEveryDrawSince(paintsBefore);
    await expectMergedBlockIntact();
  });

  test('replacing the long values refills the viewport and leaves the merged block intact', async () => {
    await expect.poll(() => grid.renderedRowCount()).toBeLessThanOrEqual(6);

    const paintsBefore = await grid.paintCounters();

    await grid.shortenTexts();

    await grid.expectViewportFilled();
    await grid.expectPaintedOnEveryDrawSince(paintsBefore);
    await expectMergedBlockIntact();
  });
});
