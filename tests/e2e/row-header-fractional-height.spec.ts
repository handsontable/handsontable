import { test, expect, THEMES_TAG } from '../fixtures/test';
import { RowHeightFractionalPage, type PaneRowHeights } from '../fixtures/pages/RowHeightFractionalPage';

/**
 * DEV-544: the row headers drift away from the rows beside them when a row's content height is not
 * a whole number of pixels.
 *
 * A row is as tall as its tallest cell, and with a fractional line height that is a fraction
 * (13.3px * 1.37 = 18.221px a line). The engine, or AutoRowSize, recorded the height as a whole
 * pixel and wrote it on the row-header cell in the row-header clone, so the clone's row came out
 * short or long by the fraction. The error did not cancel: it stacked down the grid, row after row,
 * until the headers sat visibly beside the wrong rows.
 *
 * It does not depend on display scaling. The 4K / 150% report is one way to land on a fractional
 * content height, a custom font size or line height is another.
 *
 * The tolerance is 0.02px: both panes lay rows out on the browser's 1/64px grid, so a record that
 * keeps the fraction matches to well under that, and a rounded one misses by 0.1px to 0.5px a row.
 */
const TOLERANCE = 0.02;

function expectPanesAligned({ master, clone }: PaneRowHeights, when: string): void {
  expect(clone, `${when}: rows rendered`).toHaveLength(master.length);

  clone.forEach((height, index) => {
    expect(Math.abs(height - master[index]), `${when}: row ${index}`).toBeLessThanOrEqual(TOLERANCE);
  });
}

for (const autoRowSize of [false, true]) {
  test.describe(`row-header clone vs rows with fractional heights (autoRowSize: ${autoRowSize})`, {
    tag: THEMES_TAG,
  }, () => {
    let grid: RowHeightFractionalPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new RowHeightFractionalPage(page, theme, bundle);
    });

    test('the leg really runs the theme it claims', async({ theme }) => {
      await grid.goto({ autoRowSize });

      expect(await grid.activeTheme()).toBe(`ht-theme-${theme}`);
    });

    test('the line height really is not a whole number of pixels', async() => {
      // The precondition. Without it every assertion below passes on code that still has the bug.
      await grid.goto({ autoRowSize });

      const lineHeight = await grid.cellLineHeight();

      expect(Math.abs(lineHeight - Math.round(lineHeight))).toBeGreaterThan(0.05);
    });

    // With AutoRowSize on, its heights are whole pixels by design (rounded up, so the content has
    // room), so the master has no fractional row to check: that mode is judged by the alignment
    // below, which fails on a height rounded down.
    if (!autoRowSize) {
      test('the rows the engine measures really are fractional', async() => {
        await grid.goto({ autoRowSize });

        expect(await grid.fractionalRowCount()).toBeGreaterThan(0);
      });
    }

    if (autoRowSize) {
      test('stores a content-tall row rounded up to a whole pixel', async() => {
        // Aligned panes do not prove the stored value: a fractional store aligns them too. The stored
        // height is the contract of the plugin, and a row that is not a default one is rounded UP so the
        // content has room. The content height comes from the same grid with the plugin off, because
        // with it on the rows render at the stored whole pixels. Row 0 is left out: it draws its own top
        // border and measures a pixel less in the ghost table than it renders.
        await grid.goto({ autoRowSize: false });

        const natural = (await grid.rowHeights()).master.slice(1);

        expect(natural.some(height => height - Math.floor(height) > 0.05)).toBe(true);

        await grid.goto({ autoRowSize: true });

        const stored = (await grid.storedRowHeights()).slice(1).map(row => row.stored);

        expect(stored).toHaveLength(natural.length);
        natural.forEach((height, index) => {
          expect(stored[index], `row ${index + 1}`).toBe(Math.ceil(height - TOLERANCE));
        });
      });
    }

    if (!autoRowSize) {
      test('a row floor equal to the rounded content height still lines the clone up', async() => {
        // `minRowHeights` of 118 over 118.27px of content: `offsetHeight` reads 118, the same as the
        // floor, so a decision taken on that read records nothing and the clone row is 0.27px short.
        await grid.goto({ autoRowSize });
        await grid.floorRowsAtRoundedContent();

        expectPanesAligned(await grid.rowHeights(), 'with a rounded floor');
      });
    }

    test('every row of the clone is as tall as its row in the master', async() => {
      await grid.goto({ autoRowSize });

      expectPanesAligned(await grid.rowHeights(), 'at rest');
    });

    test('the last row of the clone ends where the last row of the master does', async() => {
      // The ticket's symptom: the offset stacks per row, so it is the bottom edge that shows it.
      await grid.goto({ autoRowSize });

      const { masterBottom, cloneBottom } = await grid.rowHeights();

      expect(Math.abs(cloneBottom - masterBottom)).toBeLessThanOrEqual(TOLERANCE * 4);
    });

    test('stays aligned under an ancestor CSS zoom', async() => {
      // Under `zoom: 1.25` the computed height is in unzoomed pixels, while the browser lays the row
      // out on a grid of zoomed ones, so a snap to the unzoomed 1/64px grid lands a step off.
      await grid.goto({ autoRowSize, zoom: 1.25 });

      const heights = await grid.rowHeights();

      expectPanesAligned(heights, 'zoom 1.25');
      // The per-row error is a fraction of a step; the sum of it is what a reader sees.
      expect(Math.abs(heights.cloneBottom - heights.masterBottom)).toBeLessThanOrEqual(0.05);
    });

    test('stays aligned while scrolling recycles the rows', async() => {
      // Row virtualization on: a scroll draws other rows, which is what `scrollTo` waits for.
      await grid.goto({ autoRowSize, renderAll: false });

      await grid.scrollTo(1500);
      expectPanesAligned(await grid.rowHeights(), 'after scrolling down');

      await grid.scrollTo(0);
      expectPanesAligned(await grid.rowHeights(), 'after scrolling back');
    });
  });
}

for (const autoRowSize of [false, true]) {
  test.describe(`frozen column with fractional heights (autoRowSize: ${autoRowSize})`, { tag: THEMES_TAG }, () => {
    let grid: RowHeightFractionalPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new RowHeightFractionalPage(page, theme, bundle);
      await grid.goto({ autoRowSize, frozen: true });
      // The frozen column's row heights now live in the inline-start overlay alone.
      await grid.scrollSidewaysTo(900);
    });

    if (!autoRowSize) {
      test('some rows have a fraction of one half or more', async() => {
        // The case a re-recorded fractional record hits: `offsetHeight` rounds 117.73 up to 118, so a
        // record of 117.73 compares as smaller than what the row measures.
        expect(await grid.fractionalRowCount(0.5)).toBeGreaterThan(0);
      });
    }

    test('keeps the clone and the master aligned', async() => {
      expectPanesAligned(await grid.rowHeights(), 'frozen, scrolled sideways');
    });

    test('costs no row-height cache invalidation once the heights have settled', async() => {
      // A fractional record that is re-recorded on every draw drops the cache on every draw, while the
      // rows stay aligned and every assertion above passes. Only the counter sees it. Warm the grid up
      // first: the draws that discover the heights are allowed to invalidate.
      await grid.countRowCacheInvalidations(3);

      expect(await grid.countRowCacheInvalidations(5)).toBe(0);
    });
  });
}
