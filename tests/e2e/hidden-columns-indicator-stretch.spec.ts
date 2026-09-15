import { test, expect } from '../fixtures/test';
import { HiddenColumnsIndicatorStretchPage } from '../fixtures/pages/HiddenColumnsIndicatorStretchPage';

/**
 * #13500 / DEV-2921: a grid with frozen columns, `stretchH` and `hiddenColumns.indicators` grew a
 * horizontal scrollbar that had nothing to scroll, and the rows either side of the frozen boundary
 * then drifted apart by that bar's height.
 *
 * `hiddenColumns` already reserves 15px of column width for the indicator arrow, but the theme drew
 * the arrow at `right: -2px` — partly outside the cell. Under `stretchH` the table's right edge is
 * flush with the scroll box, so that overhang landed ~1px past it and the browser painted a bar.
 * The bar took ~15px of height out of the master pane only; the frozen-column clone has no
 * horizontal bar, so it could scroll 15px less. Scrolled to the bottom the two panes sat a
 * scrollbar apart.
 *
 * WHICH ASSERTION DISCRIMINATES. `no phantom horizontal scrollbar` is the one that fails on the
 * unfixed code, and it fails on the mechanism itself (`scrollWidth - clientWidth`) rather than on
 * the painted bar — so it still discriminates on a browser or OS that draws overlay scrollbars,
 * where the bar takes no space and the misalignment cannot appear at all. `rows stay aligned` is
 * the user-visible symptom and the reason the ticket exists, and it fails on the unfixed code
 * wherever a scrollbar takes space — CI's Linux Chromium included. Where the platform draws
 * overlay scrollbars the bar steals no height, so the panes cannot drift and that test is a
 * backstop rather than the proof. It is asserted unconditionally either way: a zero that was never
 * at risk still costs nothing, and a conditional assertion is one more thing that can quietly stop
 * running.
 *
 * `indicators: off` is a genuine control, not a second copy: the same grid, the same stretch, the
 * same frozen columns, with the one subject removed. It was already green before the fix.
 */

test.describe('hidden-column indicator on a stretched grid', () => {
  let grid: HiddenColumnsIndicatorStretchPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new HiddenColumnsIndicatorStretchPage(page, theme, bundle);
  });

  test('the leg really runs the theme it claims', async({ theme }) => {
    // Guards the matrix itself. The fixture links the theme stylesheet, but the rules only apply
    // through the container's `ht-theme-*` class — miss it and all six legs render the default
    // theme while reporting as three.
    await grid.goto('on');
    expect(await grid.activeTheme()).toBe(`ht-theme-${theme}`);
  });

  test('the indicator is actually on the last visible column', async() => {
    // Guards the subject. The fix moves the arrow inside the cell; it must not remove it. Without
    // this, a stylesheet that dropped the pseudo-element would turn every assertion below green.
    // Two markers: the master table's header and the top overlay's copy of it.
    await grid.goto('on');
    expect(await grid.indicatorMarkerCount()).toBe(2);
  });

  test('no phantom horizontal scrollbar when the stretched columns already fit', async() => {
    await grid.goto('on');

    // The mechanism, and the assertion that discriminates this fix. The columns are stretched to
    // fill the box exactly, so any overflow at all is the indicator drawn outside its cell.
    expect(await grid.horizontalOverflow(), 'master content beyond its scroll box').toBe(0);

    const { horizontal } = await grid.scrollbarSizes();

    expect(horizontal, 'horizontal scrollbar height').toBe(0);
  });

  test('rows stay aligned across the frozen boundary at the bottom', async() => {
    await grid.goto('on');
    await grid.scrollToBottom();

    // Last row, the worst case: the two panes clamp to different maxima, so the gap is widest once
    // both have run out of scroll.
    expect(await grid.rowMisalignment(39), 'frozen row below the same scrollable row').toBe(0);
    // A mid-band row, to show the drift is the whole pane and not the last row's own geometry.
    expect(await grid.rowMisalignment(35), 'frozen row below the same scrollable row').toBe(0);
  });

  test('indicators off behaves identically — the control', async() => {
    await grid.goto('off');

    expect(await grid.indicatorMarkerCount(), 'no marker when indicators are off').toBe(0);
    expect(await grid.horizontalOverflow(), 'master content beyond its scroll box').toBe(0);

    await grid.scrollToBottom();

    expect(await grid.rowMisalignment(39), 'frozen row below the same scrollable row').toBe(0);
  });

  test('RTL puts the indicator on the other edge and still does not overflow', async() => {
    // The RTL rules mirror the arrow to the left, which in RTL is the scrollable edge — the same
    // defect, opposite side. Fixing only the LTR block would leave this red.
    await grid.goto('on', 'rtl');

    expect(await grid.indicatorMarkerCount()).toBe(2);
    expect(await grid.horizontalOverflow(), 'master content beyond its scroll box').toBe(0);
  });
});
