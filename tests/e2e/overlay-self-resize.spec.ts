import { test, expect } from '../fixtures/test';
import { OverlaySelfResizePage } from '../fixtures/pages/OverlaySelfResizePage';

/**
 * DEV-19 — Walkontable notices for itself when the overlays need resizing.
 *
 * The engine writes the hider's size from the size of the WHOLE grid, but for years it decided
 * whether that write was needed by measuring the spreader. The spreader can answer neither half of
 * the question: `.handsontable .wtSpreader` is `width: 0` in the stylesheet, so `clientWidth` never
 * moves, and its `height: auto` describes only the rows currently in the DOM. So on a virtualized
 * grid the check reported "nothing changed" while the hider needed thousands of pixels of
 * correction, and 30 sites across core and the plugins had to force the resize by hand.
 *
 * The gate now compares the geometry the engine is about to write against the geometry it last
 * wrote (`Overlays#currentLayoutSignature`). These tests pin both halves of that: it must fire when
 * the geometry really moved, and it must stay quiet when it did not — a resize walks every column
 * and re-sizes three overlays, so running it on every draw would be a real regression.
 */
test.describe('overlay self-resize', () => {
  let grid: OverlaySelfResizePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new OverlaySelfResizePage(page, theme, bundle);
    await grid.goto();
  });

  test('the spreader cannot see either axis, which is why measuring it was never enough', async () => {
    // The premise the rest of the file rests on. If this ever stops holding — someone gives the
    // spreader a width, or stops virtualizing — the other tests would still pass while measuring
    // something much easier, so pin it explicitly rather than leaving it as folklore.
    await grid.renderWithoutChanges(); // settle the header measurement, which moves both readings

    const before = await grid.geometry();

    expect(before.spreaderWidth).toBe(0);
    expect(before.renderedRows).toBeLessThan(500);

    await grid.loadRows(60, 40);

    const after = await grid.geometry();

    // The total height collapsed, and the spreader did not notice: same rendered band, same
    // measurement, while the hider moved by thousands of pixels.
    expect(after.hiderHeight).toBeLessThan(before.hiderHeight / 2);
    expect(after.spreaderWidth).toBe(0);
    expect(after.spreaderHeight).toBe(before.spreaderHeight);
  });

  test('resizes on a pure width change, with nothing outside the engine asking', async () => {
    const before = await grid.geometry();

    await grid.resetCounters();
    await grid.hideColumns([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

    const after = await grid.geometry();
    const counters = await grid.counters();

    // Ten of forty columns gone, so the hider must have narrowed.
    expect(after.hiderWidth).toBeLessThan(before.hiderWidth);
    expect(counters.engineResizes).toBeGreaterThan(0);
    // The whole point: the plugins no longer ask. This is the assertion that fails if the 30 deleted
    // call sites creep back.
    expect(counters.externalRequests).toBe(0);
  });

  test('resizes on a total-height change the rendered band does not show', async () => {
    const before = await grid.geometry();

    await grid.resetCounters();
    await grid.loadRows(60, 40);

    const after = await grid.geometry();
    const counters = await grid.counters();

    expect(after.hiderHeight).toBeLessThan(before.hiderHeight);
    expect(counters.engineResizes).toBeGreaterThan(0);
    expect(counters.externalRequests).toBe(0);
  });

  test('grows the hider back when the data grows again', async () => {
    await grid.loadRows(60, 40);

    const small = await grid.geometry();

    await grid.resetCounters();
    await grid.loadRows(800, 40);

    const large = await grid.geometry();

    expect(large.hiderHeight).toBeGreaterThan(small.hiderHeight);
    expect((await grid.counters()).externalRequests).toBe(0);
  });

  test('resizes once when the column header height becomes known', async () => {
    // The first draw runs before the column header is measured, so the engine works with a header
    // height of 0 and a hider 29px short of the truth. The measurement lands on the next draw, the
    // geometry it would write changes, and it corrects itself — exactly once. This is why the
    // settling render in the two tests below is a real step, not a way to hide a flaky count.
    await grid.resetCounters();

    const before = await grid.layoutInputs();

    await grid.renderWithoutChanges();

    const after = await grid.layoutInputs();

    expect(before.columnHeaderHeight).toBe(0);
    expect(after.columnHeaderHeight).toBeGreaterThan(0);
    expect(after.hiderHeight).toBeGreaterThan(before.hiderHeight);
    expect((await grid.counters()).engineResizes).toBe(1);
  });

  test('does not resize on a draw that changes no geometry', async () => {
    // The performance half of the contract. `adjustElementsSize` walks every column and re-sizes
    // three overlays, so a gate that fired on every draw would trade one bug for a slower grid.
    await grid.renderWithoutChanges(); // settle the header measurement above
    await grid.resetCounters();

    await grid.renderWithoutChanges();
    await grid.renderWithoutChanges();
    await grid.renderWithoutChanges();

    expect((await grid.counters()).engineResizes).toBe(0);
  });

  test('resizes when the container changes size, with no row or column change', async () => {
    // Replaces what `refreshDimensions.spec.js` used to assert through the old two-step. Nothing
    // about the data moved here — only the box the overlays are sized against, which is why the
    // signature carries the workspace dimensions and not just the hider size.
    await grid.resetCounters();
    await grid.resizeContainerTo(600);

    const counters = await grid.counters();

    expect(counters.engineResizes).toBeGreaterThan(0);
    expect(counters.externalRequests).toBe(0);
  });

  test('resizes once for a batch of geometry changes, not once per operation', async () => {
    // Replaces what `batchRender.spec.js` used to assert through the postponed flag. Three
    // structural changes, one draw, so one resize — a resize per operation would be the regression.
    await grid.resetCounters();
    await grid.batchSeveralGeometryChanges();

    const counters = await grid.counters();

    expect(counters.engineResizes).toBe(1);
    expect(counters.externalRequests).toBe(0);
  });

  test('resizes once when scrolling off the top, then not again', async () => {
    // Scrolling away from row 0 makes the top overlay add its `innerBorderTop` class, which grows
    // the column header by 1px — a real change the hider has to follow. So the honest contract is
    // not "scrolling never resizes": it is that the border transition costs ONE resize and every
    // scroll after it costs none. Scrolling is the hottest path in the grid, so a per-frame resize
    // here would be the most expensive place to get this wrong.
    await grid.renderWithoutChanges(); // settle the header measurement
    await grid.resetCounters();

    await grid.scrollVerticallyTo(120);

    const afterFirstScroll = await grid.counters();

    await grid.scrollVerticallyTo(240);
    await grid.scrollVerticallyTo(360);
    await grid.scrollVerticallyTo(480);

    const afterMoreScrolling = await grid.counters();

    expect(afterFirstScroll.engineResizes).toBe(1);
    expect(afterMoreScrolling.engineResizes).toBe(1);
    expect(afterMoreScrolling.externalRequests).toBe(0);
  });
});
