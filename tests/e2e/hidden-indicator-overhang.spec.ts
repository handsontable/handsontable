import { test, expect } from '../fixtures/test';
import { HiddenColumnsIndicatorStretchPage } from '../fixtures/pages/HiddenColumnsIndicatorStretchPage';
import { HiddenRowsIndicatorAutoHeightPage } from '../fixtures/pages/HiddenRowsIndicatorAutoHeightPage';
import { HiddenIndicatorPositionPage } from '../fixtures/pages/HiddenIndicatorPositionPage';

/**
 * #13500 / DEV-2921: a grid with frozen columns, `stretchH` and `hiddenColumns.indicators` grew a
 * horizontal scrollbar that had nothing to scroll, and the rows either side of the frozen boundary
 * then drifted apart by that bar's height.
 *
 * `hiddenColumns` already reserves 15px of column width for the indicator arrow, but the theme laid
 * the arrow's box out at `right: -2px` — 1px past the cell. Under `stretchH` the table's right edge
 * is flush with the scroll box, so that 1px was content past it and the browser painted a bar.
 * The bar took ~15px of height out of the master pane only; the frozen-column clone has no
 * horizontal bar, so it could scroll 15px less. Scrolled to the bottom the two panes sat a
 * scrollbar apart.
 *
 * The fix must not move a painted pixel: the box now stops at the cell's edge and the icon inside
 * it moves back out by the same 1px. The third describe pins that against the 18.1.0 rules
 * directly, because the first two cannot see it — a fix that moved the arrow inward passed them.
 *
 * `hiddenRows` carries the mirrored rule (`bottom: -2px`) and the same defect on the vertical axis,
 * covered by the second describe below. It needs no `stretchH`: a `height: 'auto'` grid is flush
 * with its content by construction.
 *
 * WHICH ASSERTION DISCRIMINATES. The overflow assertions are the ones that fail on the unfixed
 * code, and they fail on the mechanism itself (`scrollWidth - clientWidth`) rather than on the
 * painted bar — so they still discriminate where a platform draws overlay scrollbars and the bar
 * takes no space. They are paired everywhere with `scrollbarSizes()`, because the overflow pair are
 * integers: a sub-pixel overflow reads as zero there while the browser is already painting a
 * full-size bar.
 *
 * Two assertions are BACKSTOPS, not proofs, and it matters which: `rows stay aligned` and `the
 * column-header clone keeps the same width`. Both measure a pane that the unwanted scrollbar
 * shortened, so they can only fail where a scrollbar takes space — true on CI's Linux Chromium,
 * false on an overlay-scrollbar machine, where they pass on the unfixed code. They are asserted
 * unconditionally anyway: a zero that was never at risk costs nothing, and a conditional assertion
 * is one more thing that can quietly stop running. The overflow assertions are what discriminate
 * everywhere.
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

  test('the indicators mark exactly the columns either side of each hidden band', async() => {
    // Guards the subject, and pins WHICH columns are marked — a bare count would pass on an
    // off-by-one. `E` is the last column before the interior band, `J` the first after it, and `L`
    // the last stretched column before the trailing band: the defect's own case. It also pins that
    // the fix did not delete the arrow, and that both marker kinds are present.
    await grid.goto('on');
    expect(await grid.markedHeaders()).toEqual({
      E: 'beforeHiddenColumn',
      J: 'afterHiddenColumn',
      L: 'beforeHiddenColumn',
    });
  });

  test('no phantom horizontal scrollbar when the stretched columns already fit', async() => {
    await grid.goto('on');

    // The mechanism, and the assertion that discriminates this fix. The columns are stretched to
    // fill the box exactly, so any overflow at all is the indicator's box laid out past its cell.
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

    expect(await grid.markedHeaders(), 'no marker when indicators are off').toEqual({});
    expect(await grid.horizontalOverflow(), 'master content beyond its scroll box').toBe(0);
    expect((await grid.scrollbarSizes()).horizontal, 'horizontal scrollbar height').toBe(0);

    await grid.scrollToBottom();

    expect(await grid.rowMisalignment(39), 'frozen row below the same scrollable row').toBe(0);
  });

  test('RTL puts the indicator on the other edge and still does not overflow', async() => {
    // The RTL rules mirror the arrow to the left, which in RTL is the scrollable edge — the same
    // defect, opposite side. Fixing only the LTR block would leave this red. Asserted to the same
    // depth as the LTR case: the mechanism, the painted bar, and the symptom.
    await grid.goto('on', 'rtl');

    expect(await grid.markedHeaders()).toEqual({
      E: 'beforeHiddenColumn',
      J: 'afterHiddenColumn',
      L: 'beforeHiddenColumn',
    });
    expect(await grid.horizontalOverflow(), 'master content beyond its scroll box').toBe(0);
    expect((await grid.scrollbarSizes()).horizontal, 'horizontal scrollbar height').toBe(0);

    await grid.scrollToBottom();

    expect(await grid.rowMisalignment(39), 'frozen row below the same scrollable row').toBe(0);
  });
});

test.describe('hidden-row indicator on an auto-height grid', () => {
  let grid: HiddenRowsIndicatorAutoHeightPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new HiddenRowsIndicatorAutoHeightPage(page, theme, bundle);
  });

  test('the leg really runs the theme it claims', async({ theme }) => {
    await grid.goto('on');
    expect(await grid.activeTheme()).toBe(`ht-theme-${theme}`);
  });

  test('the indicators mark exactly the rows either side of each hidden band', async() => {
    // Row headers are 1-based: `5` is visual row 4, `9` is row 8, `12` is row 11 — the last visible
    // row, which is the defect's own case.
    await grid.goto('on');
    expect(await grid.markedHeaders()).toEqual({
      5: 'beforeHiddenRow',
      9: 'afterHiddenRow',
      12: 'beforeHiddenRow',
    });
  });

  test('an auto-height grid grows no scrollbar of its own', async() => {
    await grid.goto('on');

    // The mechanism. A grid sized to its rows has no content the box was not sized for — unless the
    // indicator's box is laid out below its row header.
    expect(await grid.verticalOverflow(), 'master content beyond its scroll box').toBe(0);

    const { vertical, horizontal } = await grid.scrollbarSizes();

    expect(vertical, 'vertical scrollbar width').toBe(0);
    expect(horizontal, 'horizontal scrollbar height').toBe(0);
  });

  test('the column-header clone keeps the same width as the master pane', async() => {
    // The user-visible consequence: an unwanted vertical bar narrows the master pane but not the
    // header clone, and the columns and their headers then disagree about where they are.
    await grid.goto('on');
    expect(await grid.headerCloneWiderThanMasterBy(), 'header clone beyond the master pane').toBe(0);
  });

  test('indicators off behaves identically — the control', async() => {
    await grid.goto('off');

    expect(await grid.markedHeaders(), 'no marker when indicators are off').toEqual({});
    expect(await grid.verticalOverflow(), 'master content beyond its scroll box').toBe(0);
    expect((await grid.scrollbarSizes()).vertical, 'vertical scrollbar width').toBe(0);
    expect(await grid.headerCloneWiderThanMasterBy(), 'header clone beyond the master pane').toBe(0);
  });
});

test.describe('hidden indicators paint where 18.1.0 painted them', () => {
  let grid: HiddenIndicatorPositionPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new HiddenIndicatorPositionPage(page, theme, bundle);
  });

  // Why these exist: moving the arrow is a visible change on every grid with indicators, and the
  // describes above are blind to it — an arrow moved 1px inward clears the overflow just as well.
  // So every marked header, and both header strips, is compared byte for byte against the same page
  // with the 18.1.0 rules forced on top. The fixture is flush on neither axis, so those rules
  // overflow nothing there and the indicator CSS is the only thing that differs.
  test('every arrow paints the same pixels as in 18.1.0 (LTR)', async() => {
    await grid.goto('ltr');

    const { counts, reference, changed } = await grid.compareWithReleasedRules();

    // Every marker kind is on screen, the trailing before-markers included, so none is compared
    // vacuously.
    expect(counts).toEqual({
      beforeHiddenColumn: 2,
      afterHiddenColumn: 1,
      beforeHiddenRow: 2,
      afterHiddenRow: 1,
    });
    // The positive control: the second pass really ran the 18.1.0 geometry.
    expect(reference).toEqual({ column: '-2px / 0px 0px', row: '-2px / 0px 0px' });
    expect(changed, 'regions painted differently from 18.1.0').toEqual([]);
  });

  test('every arrow paints the same pixels as in 18.1.0 (RTL)', async() => {
    // The column arrows are rotated 180deg in RTL, which mirrors the icon's offset inside its box
    // as well — the one place a compensation written for LTR could land 2px off instead of 0.
    await grid.goto('rtl');

    const { counts, reference, changed } = await grid.compareWithReleasedRules();

    expect(counts).toEqual({
      beforeHiddenColumn: 2,
      afterHiddenColumn: 1,
      beforeHiddenRow: 2,
      afterHiddenRow: 1,
    });
    expect(reference).toEqual({ column: '-2px / 0px 0px', row: '-2px / 0px 0px' });
    expect(changed, 'regions painted differently from 18.1.0').toEqual([]);
  });
});
