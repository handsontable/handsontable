import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * The fill handle of the grid's last column and last row against an overlay ("floating")
 * scrollbar (DEV-982). Windows 11 browsers, and macOS with "Show scroll bars" set to "When
 * scrolling", draw scrollbars that take no layout space and are painted over the cells at the
 * holder's edge. The handle there used to sit flush with that edge, under the scrollbar, which took
 * the hover and the press, so the handle could not be dragged.
 *
 * A browser that paints such a scrollbar cannot be launched in CI, and a headless one hit-tests no
 * scrollbar at all. So the page hides every scrollbar with `scrollbar-width: none` before the grid
 * loads: the holder and the engine's scrollbar-width probe then measure 0, the state an overlay
 * scrollbar leaves, and the spec asserts the geometry that keeps the handle out of the strip such a
 * scrollbar is painted over. The occlusion itself is checked by hand on a real device.
 */
test.describe('fill handle next to an overlay scrollbar', { tag: THEMES_TAG }, () => {
  let grid: SelectionFeaturesPage;

  // The strip `axisScrollbarClearance()` keeps clear for an overlay scrollbar
  // (`OVERLAY_SCROLLBAR_CLEARANCE` in walkontable's `overlay/constants.ts`).
  const SCROLLBAR_STRIP = 16;

  const WIDE_TALL_DATA = Array.from({ length: 30 }, (_, row) =>
    Array.from({ length: 20 }, (_, col) => `R${row + 1}C${col + 1}`));

  test.beforeEach(async({ page, theme, bundle }) => {
    await page.addInitScript(() => {
      const hideScrollbars = () => {
        const style = document.createElement('style');

        style.textContent = '* { scrollbar-width: none; } *::-webkit-scrollbar { width: 0; height: 0; }';
        document.documentElement.append(style);
      };

      if (document.documentElement) {
        hideScrollbars();
      } else {
        new MutationObserver((_, observer) => {
          if (document.documentElement) {
            observer.disconnect();
            hideScrollbars();
          }
        }).observe(document, { childList: true });
      }
    });

    grid = new SelectionFeaturesPage(page, theme, bundle);
    await grid.goto();
    await grid.initGrid({ data: WIDE_TALL_DATA, width: 500, height: 300 });

    // The precondition the whole spec rests on: the scrollbars take no layout space.
    expect(await grid.holderScrollbarGutters()).toEqual({ vertical: 0, horizontal: 0 });
  });

  test('pulls the last column\'s handle out of the vertical scrollbar strip and keeps it draggable', async() => {
    await grid.selectCells(2, 19, 2, 19);

    await expect.poll(async() => (await grid.fillHandleInsetFromHolderEdges()).inlineEnd)
      .toBeGreaterThanOrEqual(SCROLLBAR_STRIP);
    await expect.poll(() => grid.elementAtFillHandleCenter()).toMatch(/^ht_master\/.*corner/);

    await grid.dragFillHandleTo(4, 19);

    expect((await grid.columnValues(19)).slice(2, 5)).toEqual(['R3C20', 'R3C20', 'R3C20']);
  });

  test('pulls the last row\'s handle out of the horizontal scrollbar strip and keeps it draggable', async({ page }) => {
    await grid.selectCells(29, 0, 29, 0);

    await expect.poll(async() => (await grid.fillHandleInsetFromHolderEdges()).bottom)
      .toBeGreaterThanOrEqual(SCROLLBAR_STRIP);
    await expect.poll(() => grid.elementAtFillHandleCenter()).toMatch(/^ht_master\/.*corner/);

    await grid.dragFillHandleTo(29, 2);

    expect(await page.evaluate(() => window.hot.getDataAtRow(29).slice(0, 3)))
      .toEqual(['R30C1', 'R30C1', 'R30C1']);
  });

  test('clears both strips for the bottom-end corner cell', async() => {
    await grid.selectCells(29, 19, 29, 19);

    // Both read in one probe, so the pair comes from the same draw.
    await expect.poll(async() => {
      const inset = await grid.fillHandleInsetFromHolderEdges();

      return Math.min(inset.inlineEnd, inset.bottom);
    }).toBeGreaterThanOrEqual(SCROLLBAR_STRIP);
  });

  test('mirrors the inline-end lift in RTL', async() => {
    await grid.initGrid({ data: WIDE_TALL_DATA, width: 500, height: 300, layoutDirection: 'rtl' });
    await grid.selectCells(2, 19, 2, 19);

    await expect.poll(async() => (await grid.fillHandleInsetFromHolderEdges()).inlineEnd)
      .toBeGreaterThanOrEqual(SCROLLBAR_STRIP);
    await expect.poll(() => grid.elementAtFillHandleCenter()).toMatch(/^ht_master\/.*corner/);
  });

  test('leaves the handle of a cell inside the grid on its corner', async() => {
    await grid.selectCells(4, 4, 4, 4);

    await expect(grid.fillHandle()).not.toHaveClass(/wtCornerInlineEndEdge/);
    await expect(grid.fillHandle()).not.toHaveClass(/wtCornerBlockEndEdge/);
  });

  test('does not lift the last column\'s handle when the grid has no vertical scroll', async() => {
    // No vertical scroll, so no vertical scrollbar to clear: the handle keeps the flush lift it
    // had, against the grid's own edge.
    await grid.initGrid({ data: WIDE_TALL_DATA.slice(0, 3), width: 500, height: 'auto' });
    await grid.selectCells(1, 19, 1, 19);

    await expect(grid.fillHandle()).toHaveClass(/wtCornerInlineEndEdge/);
    await expect.poll(async() => (await grid.fillHandleInsetFromHolderEdges()).inlineEnd)
      .toBeLessThan(SCROLLBAR_STRIP);
  });
});
