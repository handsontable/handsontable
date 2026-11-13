import { test, expect, THEMES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * The fill handle of the grid's last column and last row against an overlay ("floating")
 * scrollbar (DEV-982). Windows 11 browsers, and macOS with "Show scroll bars" set to "When
 * scrolling", draw scrollbars that take no layout space and are painted over the cells at the
 * holder's edge. The handle there used to sit flush with that edge, under the scrollbar, which took
 * the hover and the press, so the handle could not be dragged.
 *
 * No browser the suite launches paints such a scrollbar, and none hit-tests one. So the page hides
 * the grid's scrollbars with `scrollbar-width: none !important` before the grid loads - the
 * `!important` is what beats the theme's own `scrollbar-width: auto` on `.wtHolder` - and the holder
 * and the engine's scrollbar-width probe then measure 0, the state an overlay scrollbar leaves. The
 * spec asserts the handle's geometry against the strip such a scrollbar is painted over, and against
 * the clearance band the grid opens in that strip while the scrollbar shows. The covered handle
 * itself is checked by hand on a real device.
 */
test.describe('fill handle next to an overlay scrollbar', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  let grid: SelectionFeaturesPage;

  // The strip `axisScrollbarClearance()` keeps clear for an overlay scrollbar
  // (`OVERLAY_SCROLLBAR_CLEARANCE` in walkontable's `overlay/constants.ts`).
  const SCROLLBAR_STRIP = 16;

  const dataOf = (rows: number, cols: number) => Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (__, col) => `R${row + 1}C${col + 1}`));

  const WIDE_TALL_DATA = dataOf(30, 20);

  test.beforeEach(async({ page, theme, bundle }) => {
    await page.addInitScript(() => {
      const hideScrollbars = () => {
        const style = document.createElement('style');

        style.textContent = '.wtHolder, .htScrollbarTest { scrollbar-width: none !important; } ' +
          '.wtHolder::-webkit-scrollbar, .htScrollbarTest::-webkit-scrollbar { display: none; }';
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

  test('pulls the last row\'s handle out of the horizontal scrollbar strip and keeps it draggable', async() => {
    await grid.selectCells(29, 0, 29, 0);

    await expect.poll(async() => (await grid.fillHandleInsetFromHolderEdges()).bottom)
      .toBeGreaterThanOrEqual(SCROLLBAR_STRIP);
    await expect.poll(() => grid.elementAtFillHandleCenter()).toMatch(/^ht_master\/.*corner/);

    await grid.dragFillHandleTo(29, 2);

    expect((await grid.rowValues(29)).slice(0, 3)).toEqual(['R30C1', 'R30C1', 'R30C1']);
  });

  test('clears both strips for the bottom-end corner cell', async() => {
    await grid.selectCells(29, 19, 29, 19);

    // Both read in one probe, so the pair comes from the same draw.
    await expect.poll(async() => {
      const inset = await grid.fillHandleInsetFromHolderEdges();

      return Math.min(inset.inlineEnd, inset.bottom);
    }).toBeGreaterThanOrEqual(SCROLLBAR_STRIP);
  });

  test('keeps the handle out of the clearance band the grid opens while the scrollbar shows', async() => {
    await grid.selectCells(2, 19, 2, 19);
    await grid.hoverCell(4, 17);
    // A scroll is what opens the band.
    await grid.wheel(30);

    await expect.poll(() => grid.fillHandleOverlapsScrollbarBand())
      .toEqual({ bandShown: true, overlaps: false });
  });

  test('clears the strip for a last column that ends a few pixels short of the holder edge', async() => {
    // Eight 60px columns and no row headers in a 490px grid: the last column ends 10px before the
    // edge, close enough for its handle to hang into the strip, too far for the plain lift.
    await grid.initGrid({ data: dataOf(30, 8), rowHeaders: false, colWidths: 60, width: 490, height: 300 });
    await grid.selectCells(2, 7, 2, 7);

    await expect.poll(async() => {
      const inset = await grid.fillHandleInsetFromHolderEdges();

      return { cellIsShortOfTheEdge: inset.cellInlineEnd > 0, clear: inset.inlineEnd >= SCROLLBAR_STRIP };
    }).toEqual({ cellIsShortOfTheEdge: true, clear: true });
  });

  test('keeps the handle inside a last column narrower than the strip', async() => {
    await grid.initGrid({
      data: WIDE_TALL_DATA,
      colWidths: Array.from({ length: 20 }, (_, col) => (col === 19 ? 15 : 50)),
      width: 500,
      height: 300,
    });
    await grid.selectCells(2, 19, 2, 19);

    await expect(grid.fillHandle()).toHaveClass(/wtCornerInlineEndEdge/);
    await expect.poll(async() => (await grid.fillHandleInsetFromHolderEdges()).withinCellInline).toBe(true);
  });

  test('keeps the bottom resize pill off a last-column handle', async() => {
    // A one-column range: the bottom pill is centered on the column, where the moved handle sits.
    await grid.selectCells(2, 19, 6, 19);
    await grid.hoverCell(4, 19);

    await expect(grid.handle('bottom')).toBeVisible();
    await expect.poll(() => grid.elementAtFillHandleCenter(grid.rangeFillHandle())).toMatch(/^ht_master\/.*corner/);
  });

  test('keeps the end resize pill off a last-row handle', async() => {
    // A one-row range: the end pill is centered on the row, where the moved handle sits.
    await grid.selectCells(29, 0, 29, 1);
    await grid.hoverCell(29, 1);

    await expect(grid.handle('end')).toBeVisible();
    await expect.poll(() => grid.elementAtFillHandleCenter(grid.rangeFillHandle())).toMatch(/^ht_master\/.*corner/);
  });

  test('mirrors the inline-end lift in RTL', async() => {
    await grid.initGrid({ data: WIDE_TALL_DATA, width: 500, height: 300, layoutDirection: 'rtl' });
    await grid.selectCells(2, 19, 2, 19);

    await expect.poll(async() => (await grid.fillHandleInsetFromHolderEdges()).inlineEnd)
      .toBeGreaterThanOrEqual(SCROLLBAR_STRIP);
    await expect.poll(() => grid.elementAtFillHandleCenter()).toMatch(/^ht_master\/.*corner/);
  });

  test('does not move the handle of an RTL grid narrower than its holder', async() => {
    // Three columns in a 500px holder: the last column ends far from the scrollbar on the left, so
    // its handle stays where it is drawn without one, on the cell's own edge.
    await grid.initGrid({ data: dataOf(30, 3), width: 500, height: 300, layoutDirection: 'rtl' });
    await grid.selectCells(2, 2, 2, 2);

    await expect.poll(async() => {
      const inset = await grid.fillHandleInsetFromHolderEdges();

      return { farFromTheScrollbar: inset.cellInlineEnd > 100, onTheCellEdge: Math.abs(inset.inlineEnd - inset.cellInlineEnd) <= 2 };
    }).toEqual({ farFromTheScrollbar: true, onTheCellEdge: true });
  });

  test('leaves the handle of a cell inside the grid on its corner', async() => {
    await grid.selectCells(4, 4, 4, 4);

    await expect(grid.fillHandle()).toBeVisible();
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
      .toBeGreaterThanOrEqual(0);
    expect((await grid.fillHandleInsetFromHolderEdges()).inlineEnd).toBeLessThan(SCROLLBAR_STRIP);
  });
});
