import { test, expect } from '../../fixtures/test';
import { OverlaySelfResizePage } from '../../fixtures/pages/walkontable/OverlaySelfResizePage';

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
 * the geometry really moved, and it must stay quiet when it did not — the write walks every column,
 * so running it on every draw would be a real regression.
 *
 * What the counter sees, and does not: `engineResizes` counts `Overlays#adjustElementsSize`, which
 * is the MASTER hider write plus the scrollbar-band sync. The three region overlays re-size their
 * own roots on every master draw regardless, in `placeFixedOverlays`, and that is by design and
 * outside this gate. So a zero below means the master write and the band sync were skipped — never
 * that nothing in the grid was resized.
 */
test.describe('walkontable overlay self-resize', { tag: '@walkontable' }, () => {
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
    // The performance half of the contract. `adjustElementsSize` walks every column and re-syncs the
    // scrollbar bands, so a gate that fired on every draw would trade one bug for a slower grid.
    await grid.renderWithoutChanges(); // settle the header measurement above
    await grid.resetCounters();

    await grid.renderWithoutChanges();
    await grid.renderWithoutChanges();
    await grid.renderWithoutChanges();

    expect((await grid.counters()).engineResizes).toBe(0);
  });

  test('resizes when the container changes size, with no row or column change', async () => {
    // Replaces what `refreshDimensions.spec.js` used to assert through the old two-step. Nothing
    // about the data moved here — only the box the scrollbar bands are measured against, which is
    // why the signature carries the workspace dimensions and not just the hider size. This is the
    // test that goes red if those terms are dropped as "redundant".
    await grid.resetCounters();
    await grid.resizeContainerTo(600);

    const counters = await grid.counters();

    // Exactly one: the box moved once, so the engine judges once. A second would mean the write
    // changed a term of its own signature and re-fired on the next draw.
    expect(counters.engineResizes).toBe(1);
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

  test('resizes once, not twice, for a change that turns the scrollbars on', async () => {
    // The signature carries `hasVerticalScroll` and `hasHorizontalScroll`, and the write itself can
    // flip them: growing the hider past the scrollport is what makes the browser draw a scrollbar.
    // If the signature were captured BEFORE the write, it would record the pre-write scrollbar state,
    // the next draw would resolve a snapshot that differs, and the engine would resize a second time
    // for a hider that had not moved. It is captured after the write instead.
    await grid.loadRows(3, 3); // fits the 600 x 300 container: no scrollbars
    await grid.renderWithoutChanges();
    await grid.renderWithoutChanges(); // settle
    await grid.resetCounters();

    await grid.loadRows(500, 40); // overflows both axes: both scrollbars appear
    await grid.renderWithoutChanges();

    const afterTheChange = await grid.counters();

    await grid.renderWithoutChanges();

    const afterOneMoreDraw = await grid.counters();

    expect(afterTheChange.engineResizes).toBe(1);
    expect(afterOneMoreDraw.engineResizes).toBe(1);
  });

  test('does not resize while scrolling, at any offset', async () => {
    // Scrolling moves the viewport, never the totals — since DEV-2786 not even by the 1px the
    // `innerBorderTop` toggle used to add to the column header, because the header now owns that
    // gridline at every offset. So the contract is a flat zero, including the very first scroll off
    // row 0, which is where the old 1px change happened. Scrolling is the hottest path in the grid,
    // so a resize here would be the most expensive place to get this wrong.
    await grid.renderWithoutChanges(); // settle the header measurement
    await grid.resetCounters();

    await grid.scrollVerticallyTo(120);

    const afterFirstScroll = await grid.counters();

    await grid.scrollVerticallyTo(240);
    await grid.scrollVerticallyTo(360);
    await grid.scrollVerticallyTo(480);

    const afterMoreScrolling = await grid.counters();

    expect(afterFirstScroll.engineResizes).toBe(0);
    expect(afterMoreScrolling.engineResizes).toBe(0);
    expect(afterMoreScrolling.externalRequests).toBe(0);
  });
});
