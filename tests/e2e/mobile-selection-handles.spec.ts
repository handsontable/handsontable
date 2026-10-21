import { devices } from '@playwright/test';
import { test, expect, THEMES_TAG } from '../fixtures/test';
import { MobileHandlesPage } from '../fixtures/pages/MobileHandlesPage';

/**
 * Regression spec for DEV-2165: the mobile selection handles (the round
 * grab-points on the corners of a selection) disappeared in 18.0 — the
 * handle elements were created but never attached to the DOM.
 *
 * Handsontable creates the handles only when it detects a mobile browser at
 * grid construction time, so the whole spec runs with iPhone emulation
 * (touch + mobile user agent).
 */
test.use({
  ...devices['iPhone 13'],
  browserName: 'chromium',
});

test.describe('mobile selection handles', { tag: THEMES_TAG }, () => {
  let mobileGrid: MobileHandlesPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    mobileGrid = new MobileHandlesPage(page, theme, bundle);
    await mobileGrid.goto();
  });

  test('appear on the selection corners after tapping a cell', async () => {
    await mobileGrid.tapCell(1, 1);

    await mobileGrid.expectHandlesVisible();
  });

  test('follow the selection when another cell is tapped', async () => {
    await mobileGrid.tapCell(1, 1);
    await mobileGrid.expectHandlesVisible();

    const firstBox = await mobileGrid.topHandle().boundingBox();

    await mobileGrid.tapCell(3, 2);
    await mobileGrid.expectHandlesVisible();

    const secondBox = await mobileGrid.topHandle().boundingBox();

    expect(secondBox).not.toEqual(firstBox);
  });

  test('keep the top handle interactive for a row-0 selection with headers', async () => {
    await mobileGrid.tapCell(0, 0);
    await mobileGrid.expectHandlesVisible();

    await expect.poll(() => mobileGrid.isTopHandleHitAreaAtHandleCenter()).toBe(true);
  });

  test('keep the top handle on the outer corner when no clone renders over it', async () => {
    await mobileGrid.goto({ headers: false });
    await mobileGrid.tapCell(0, 0);
    await mobileGrid.expectHandlesVisible();

    await expect.poll(() => mobileGrid.isTopHandleOnCellOuterCorner(0, 0)).toBe(true);
  });

  test('keep the bottom handle interactive when a range ends on the bottom freeze line', async () => {
    await mobileGrid.goto({ frozenBottom: true, rows: 'tall' });
    await mobileGrid.tapCell(1, 1);
    await mobileGrid.selectRange(1, 1, 37, 3);
    await mobileGrid.expectHandlesVisible();

    await expect.poll(() => mobileGrid.isBottomHandleHitAreaAtHandleCenter()).toBe(true);
  });

  test('keep the top handle interactive when a range starts at the frozen-pane boundaries', async () => {
    await mobileGrid.goto({ frozen: true });
    await mobileGrid.tapCell(1, 1);
    await mobileGrid.selectRange(1, 1, 3, 3);
    await mobileGrid.expectHandlesVisible();

    await expect.poll(() => mobileGrid.isTopHandleHitAreaAtHandleCenter()).toBe(true);
  });

  test('keep the top handle interactive at the frozen-pane boundaries in RTL', async () => {
    await mobileGrid.goto({ direction: 'rtl', frozen: true });
    await mobileGrid.tapCell(1, 1);
    await mobileGrid.selectRange(1, 1, 3, 3);
    await mobileGrid.expectHandlesVisible();

    await expect.poll(() => mobileGrid.isTopHandleHitAreaAtHandleCenter()).toBe(true);
  });

  // DEV-749: the master renders the frozen panes' cells too, under the clones, and drew a second
  // pair of handles there. Its bottom handle hung out past the freeze line next to the clone's own.
  // The displayed lists count stacked copies too: the master's top handle used to sit on the very
  // pixel of the clone's, so a topmost-element check alone saw one handle either way.
  test('draw one pair of handles for a cell in a frozen column', async () => {
    await mobileGrid.goto({ frozen: true });
    await mobileGrid.tapPaintedCell(2, 0);

    await expect.poll(() => mobileGrid.displayedHandles('topSelectionHandle-HitArea')).toEqual(['ht_clone_inline_start']);
    await expect.poll(() => mobileGrid.displayedHandles('bottomSelectionHandle-HitArea'))
      .toEqual(['ht_clone_inline_start']);
    await expect.poll(() => mobileGrid.reachableTopHandles()).toEqual(['ht_clone_inline_start']);
    await expect.poll(() => mobileGrid.reachableBottomHandles()).toEqual(['ht_clone_inline_start']);
  });

  test('draw one pair of handles for a cell in a frozen row', async () => {
    await mobileGrid.goto({ frozen: true });
    await mobileGrid.tapPaintedCell(0, 2);

    await expect.poll(() => mobileGrid.displayedHandles('topSelectionHandle-HitArea')).toEqual(['ht_clone_top']);
    await expect.poll(() => mobileGrid.displayedHandles('bottomSelectionHandle-HitArea')).toEqual(['ht_clone_top']);
    await expect.poll(() => mobileGrid.reachableTopHandles()).toEqual(['ht_clone_top']);
    await expect.poll(() => mobileGrid.reachableBottomHandles()).toEqual(['ht_clone_top']);
  });

  test('split a range across the freeze line between the frozen column and the master', async () => {
    await mobileGrid.goto({ frozen: true });
    await mobileGrid.tapPaintedCell(2, 0);
    await mobileGrid.selectRange(2, 0, 4, 3);

    await expect.poll(() => mobileGrid.reachableTopHandles()).toEqual(['ht_clone_inline_start']);
    await expect.poll(() => mobileGrid.reachableBottomHandles()).toEqual(['ht_master']);
  });

  test('keep the handles of a frozen-column cell after a horizontal scroll', async () => {
    // Row 1 sits on the frozen-row line, so the frozen column's top handle has to clear the corner
    // clone above it, which the master's copy used to do for it.
    await mobileGrid.goto({ frozen: true, cols: 'wide' });
    await mobileGrid.tapPaintedCell(1, 0);
    await mobileGrid.scrollColumnEndUnderFrozenPane(2);

    await expect.poll(() => mobileGrid.reachableTopHandles()).toEqual(['ht_clone_inline_start']);
    await expect.poll(() => mobileGrid.reachableBottomHandles()).toEqual(['ht_clone_inline_start']);
  });

  test('extend the selection from the bottom handle of a frozen-column cell', async () => {
    await mobileGrid.goto({ frozen: true });
    await mobileGrid.tapPaintedCell(2, 0);
    await expect.poll(() => mobileGrid.reachableBottomHandles()).toEqual(['ht_clone_inline_start']);

    await mobileGrid.dragBottomHandleToCell(4, 2, 'ht_clone_inline_start');

    await expect.poll(() => mobileGrid.selectedLast()).toEqual([2, 0, 4, 2]);
  });

  test('draw one pair of handles for a cell in a frozen column in RTL', async () => {
    await mobileGrid.goto({ direction: 'rtl', frozen: true });
    await mobileGrid.tapPaintedCell(2, 0);

    await expect.poll(() => mobileGrid.displayedHandles('topSelectionHandle-HitArea')).toEqual(['ht_clone_inline_start']);
    await expect.poll(() => mobileGrid.displayedHandles('bottomSelectionHandle-HitArea'))
      .toEqual(['ht_clone_inline_start']);
    await expect.poll(() => mobileGrid.reachableTopHandles()).toEqual(['ht_clone_inline_start']);
    await expect.poll(() => mobileGrid.reachableBottomHandles()).toEqual(['ht_clone_inline_start']);
  });

  // The `top` clone owns a frozen-row cell's handles, and the corner clone covers the start of its
  // first scrollable column, so the top handle there is pulled inside the cell.
  test('keep the top handle of a frozen-row cell interactive next to the frozen column', async () => {
    await mobileGrid.goto({ frozen: true });
    await mobileGrid.tapPaintedCell(0, 1);

    await expect.poll(() => mobileGrid.reachableTopHandles()).toEqual(['ht_clone_top']);
    await expect.poll(() => mobileGrid.reachableBottomHandles()).toEqual(['ht_clone_top']);
  });

  test('keep the bottom handle of a frozen-column cell interactive above the bottom freeze line', async () => {
    await mobileGrid.goto({ frozen: true, frozenBottom: true, rows: 'tall' });
    await mobileGrid.scrollToLastRow();
    await mobileGrid.tapPaintedCell(37, 0);

    await expect.poll(() => mobileGrid.reachableBottomHandles()).toEqual(['ht_clone_inline_start']);
  });

  // The first row of the bottom pane and the first column of the end pane: the pane owns the
  // handles, and its holder clips a handle hanging out past the pane's start edge, so the top handle
  // is pulled inside the cell. Before DEV-749 the master's copy reached it once scrolled to the end.
  test('keep the top handle of the first frozen-bottom row interactive when scrolled to the end', async () => {
    await mobileGrid.goto({ frozenBottom: true, rows: 'tall' });
    await mobileGrid.scrollToLastRow();
    await mobileGrid.tapPaintedCell(38, 2);

    await expect.poll(() => mobileGrid.reachableTopHandles()).toEqual(['ht_clone_bottom']);
    await expect.poll(() => mobileGrid.reachableBottomHandles()).toEqual(['ht_clone_bottom']);
  });

  test('keep the top handle of the first frozen-end column interactive when scrolled to the end', async () => {
    await mobileGrid.goto({ frozenEnd: true, cols: 'wide' });
    await mobileGrid.scrollToLastScrollableColumn();
    await mobileGrid.tapCellIn('ht_clone_inline_end', 2, 18);

    await expect.poll(() => mobileGrid.reachableTopHandles()).toEqual(['ht_clone_inline_end']);
    await expect.poll(() => mobileGrid.reachableBottomHandles()).toEqual(['ht_clone_inline_end']);
  });

  // The clone's bottom handle is kept inside the clone's table, so for a cell in the last frozen row
  // it sits a few pixels inside the corner rather than on it (accepted in DEV-749 review). This pins
  // that it stays next to the corner.
  test('keep the bottom handle of a frozen-row cell next to the cell corner', async () => {
    await mobileGrid.goto({ frozen: true });
    await mobileGrid.tapPaintedCell(0, 2);
    await expect.poll(() => mobileGrid.reachableBottomHandles()).toEqual(['ht_clone_top']);

    const offset = await mobileGrid.bottomHandleOffsetFromCellCorner(0, 2);

    expect(offset).not.toBeNull();
    expect(Math.abs(offset!.dx)).toBeLessThanOrEqual(10);
    expect(Math.abs(offset!.dy)).toBeLessThanOrEqual(10);
  });

  // The cell next to the `fixedColumnsEnd` pane: its bottom handle would hang into the end pane,
  // which paints over the master, so it is pulled inside the cell like the one above the bottom
  // freeze line.
  for (const direction of ['ltr', 'rtl'] as const) {
    test(`keep the bottom handle of the last scrollable column interactive next to the end pane (${direction})`, async () => {
      await mobileGrid.goto({ direction, frozenEnd: true, cols: 'wide' });
      await mobileGrid.scrollToLastScrollableColumn();
      await mobileGrid.tapPaintedCell(2, 17);

      await expect.poll(() => mobileGrid.reachableBottomHandles()).toEqual(['ht_master']);
    });
  }
});

