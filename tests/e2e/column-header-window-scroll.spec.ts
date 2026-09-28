import { test, expect } from '../fixtures/test';
import { ColumnHeaderWindowScrollPage } from '../fixtures/pages/ColumnHeaderWindowScrollPage';

/**
 * The window-scroll half of DEV-2786.
 *
 * `tests/e2e/column-header-border-ownership.spec.ts` covers the element-scroll shape, and it cannot
 * cover this one: every grid there declares a `width` and a `height`, so the browser clamps
 * `scrollTop` to the holder's own range and a scroll target that overshoots the end is absorbed
 * before anything can observe it. This grid declares neither, so the window owns both axes and
 * nothing clamps.
 *
 * That matters because `TopOverlay#scrollTo` deliberately overshoots a bottom-edge scroll by one
 * pixel (`newY += 1`, "Fix 1 pixel offset when cell is selected"). DEV-2786 removed the
 * header-border compensation that used to sit beside that term and left the term itself alone,
 * because it is ROW-border accounting rather than header-border accounting: it is needed on a grid
 * with no headers at all.
 *
 * Be precise about what pins what. **That term is pinned by the walkontable scroll specs**
 * (`walkontable/test/spec/scroll/scroll.spec.js`, "should scroll to the cell so that it sticks to
 * the bottom edge of the viewport", including its no-headers case) - removing it lands those a row
 * short, 22 specs over. It is NOT pinned here, and measurably so: this file passes with the term
 * removed, because in window-scroll mode the one pixel changes only how far past flush the target
 * lands, not which row is revealed.
 *
 * What this file pins is the user-visible contract on the axis owner the element fixture cannot
 * reach: a bottom-edge snap reveals its row rather than clipping it, the scroll still reaches the
 * very last row, and the header's height does not move when the window scrolls.
 */
test.describe('Column header border ownership, window-scrolled', () => {
  let grid: ColumnHeaderWindowScrollPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ColumnHeaderWindowScrollPage(page, theme, bundle);
    await grid.goto();
  });

  test('really lets the window own the vertical axis', async() => {
    // The premise. With an element-owned axis every assertion below would be about the browser's
    // clamping rather than about the engine's scroll target.
    expect(await grid.windowOwnsVerticalAxis()).toBe(true);
  });

  test('gives the header its own bottom border and takes it off the first body row', async() => {
    // The same ownership as the element-scroll fixture asserts, confirmed on this axis owner too:
    // `preventOverflow` aside, this is the shape the engine used to treat differently.
    const header = await grid.headerMetrics();

    expect(header.borderBottom).toBe(1);
    expect(await grid.firstBodyRowBorderTop()).toBe(0);
  });

  test('leaves the header height untouched by a window scroll', async() => {
    const before = await grid.headerMetrics();

    await grid.scrollRowToBottomEdge(40);

    expect(await grid.headerMetrics()).toEqual(before);
  });

  test('reveals a row snapped to the bottom edge instead of clipping it', async() => {
    // The assertion the element-scroll fixture cannot make: there the browser clamps the target and
    // this can never fail. A bottom-edge snap must put the row fully inside the viewport, and the
    // engine's deliberate overshoot errs on that side, so any clipping here is a real defect rather
    // than a rounding artifact.
    for (const row of [20, 40, 60]) {
      await grid.scrollRowToBottomEdge(row);

      const placement = await grid.rowAgainstViewport(row);

      expect(placement.clippedBelow, `row ${row} is clipped below the viewport`).toBe(0);
      expect(placement.clippedAbove, `row ${row} is clipped above the viewport`).toBe(0);
    }
  });

  test('reaches the very last row and leaves it fully visible', async() => {
    // The end of the scroll range is its own case: it is where the deleted `expandHiderVerticallyBy`
    // used to add a pixel so the scroll could still get there. It still gets there.
    const lastRow = await grid.page.evaluate(() => (window as unknown as { lastRow: number }).lastRow);

    await grid.scrollRowToBottomEdge(lastRow);

    const placement = await grid.rowAgainstViewport(lastRow);

    expect(placement.clippedBelow, 'the last row is clipped below the viewport').toBe(0);
    expect(placement.clippedAbove, 'the last row is clipped above the viewport').toBe(0);
    // And it is genuinely at the bottom, not merely somewhere on screen. The tolerance covers the
    // pixel the scroll target overshoots by, which is why this bound cannot double as a guard on
    // that term - see the note at the top of the file.
    expect(placement.viewportHeight - placement.bottom).toBeLessThanOrEqual(2);
  });
});
