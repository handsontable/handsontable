import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { CloneHolderScrollPage } from '../fixtures/pages/CloneHolderScrollPage';

/**
 * DEV-3279: holding Shift while wheeling vertically pans the grid horizontally.
 *
 * The grid scrolls from the wheel event and then consumes it, so the browser's own Shift ->
 * horizontal conversion (which some browsers run only as the default action of the event) never
 * happens. The grid has to make the conversion itself. Driven with real wheel input over the
 * element-scrolled grid of the clone-holder fixture.
 */
test.describe('Shift + mouse wheel', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: CloneHolderScrollPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new CloneHolderScrollPage(page, theme, bundle);
  });

  // The exact distances below: "moved more than zero" cannot see a doubled or halved scroll.

  test('scrolls the columns, not the rows, for a vertical wheel while Shift is held', async() => {
    await grid.goto('element');

    const swaps = await grid.shiftSwapsAxes();

    await grid.wheelOver('master', 0, 200, { shift: true });

    // On macOS the grid leaves the gesture vertical, as it was.
    await expect.poll(async() => (await grid.offsets()).master[swaps ? 'left' : 'top']).toBe(200);
    expect((await grid.offsets()).master[swaps ? 'top' : 'left']).toBe(0);
  });

  test('keeps scrolling the rows for a vertical wheel without Shift', async() => {
    await grid.goto('element');
    await grid.wheelOver('master', 0, 200);

    await expect.poll(async() => (await grid.offsets()).master.top).toBe(200);
    expect((await grid.offsets()).master.left).toBe(0);
  });

  test('keeps scrolling the columns for a horizontal wheel', async() => {
    await grid.goto('element');
    await grid.wheelOver('master', 200, 0);

    await expect.poll(async() => (await grid.offsets()).master.left).toBe(200);
    expect((await grid.offsets()).master.top).toBe(0);
  });

  test('scrolls the columns like a horizontal wheel in an RTL grid', async() => {
    await grid.goto('element', 'rtl');

    const swaps = await grid.shiftSwapsAxes();

    // A negative horizontal delta moves an RTL holder toward its inline end, which is negative
    // `scrollLeft`. A positive one would only clamp at the start, so it would prove nothing.
    await grid.wheelOver('master', 0, -200, { shift: true });

    if (swaps) {
      await expect.poll(async() => (await grid.offsets()).master.left).toBe(-200);
    } else {
      // Left vertical on macOS, and the rows are already at the top.
      expect((await grid.offsets()).master.left).toBe(0);
    }

    expect((await grid.offsets()).master.top).toBe(0);
  });

  test('does not consume a Shift + vertical wheel at the horizontal edge', async() => {
    await grid.goto('element');
    await grid.scrollMasterTo({ top: 0, left: 1e6 });

    const atEdge = (await grid.offsets()).master.left;
    const swaps = await grid.shiftSwapsAxes();

    expect(atEdge).toBeGreaterThan(0);

    await grid.startWheelLog();
    await grid.wheelOver('master', 0, 200, { shift: true });

    // Nothing is left to scroll horizontally, so the grid hands the event back to the browser. Where
    // the rows then go is the browser's call (Chromium converts Shift itself everywhere but macOS),
    // so the grid's verdict is what this pins, not the rows' offset. On macOS the grid scrolls the
    // rows itself, so it does consume the event.
    await expect.poll(() => grid.wheelPrevented()).toEqual([!swaps]);
    expect((await grid.offsets()).master.left).toBe(atEdge);
  });

  test('consumes a Shift + vertical wheel while the grid can still scroll it', async() => {
    await grid.goto('element');
    await grid.startWheelLog();
    await grid.wheelOver('master', 0, 200, { shift: true });

    await expect.poll(() => grid.wheelPrevented()).toEqual([true]);
  });
});
