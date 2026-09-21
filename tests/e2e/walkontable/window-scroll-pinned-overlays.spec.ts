import { type Locator } from '@playwright/test';
import { test, expect } from '../../fixtures/test';
import { WindowScrollPinnedOverlaysPage } from '../../fixtures/pages/walkontable/WindowScrollPinnedOverlaysPage';

/**
 * DEV-127 – the row headers must not flicker while the WINDOW scrolls the grid sideways.
 *
 * With no `width` and no `height`, the page scrolls the grid, and three clones – the one holding the
 * row headers and the two inline-start corners – have to stay at the viewport's inline-start edge
 * while the columns slide underneath them. The browser scrolls the page on its compositor, without
 * waiting for JavaScript, so anything that re-pins those clones from a `scroll` listener is painted
 * one step behind: on about every other frame of a wheel scroll the row headers were torn away or
 * missing altogether.
 *
 * No DOM read can see that. The engine's own read-back reports the clone at the edge on every frame,
 * so the painted frames themselves are the observable contract – recorded through a CDP screencast
 * and scanned for the color the fixture paints each clone's row headers. The positive control shows
 * the scan does see a clone that stays behind.
 *
 * The placement tests are the other half: a clone held at the edge by the browser is at the edge in
 * the layout too, so everything that places itself from a cell's document position and then adds
 * the scroll distance on top (the editor, the fill handle, the resize handles) must not add it twice.
 */
test.describe('walkontable window-scroll pinned overlays', { tag: '@walkontable' }, () => {
  let wt: WindowScrollPinnedOverlaysPage;

  /** A pixel of border compensation either way is by design; anything larger is misplaced. */
  const PLACEMENT_TOLERANCE = 2;

  /**
   * Asserts an editor box is placed on a cell box: same top, and the same inline-start edge – the
   * one the editor is anchored on. The width is left out: a theme sizes the editor as it likes.
   *
   * @param {Locator} editor The editor holder.
   * @param {Locator} cell The edited cell.
   */
  async function expectEditorOverCell(editor: Locator, cell: Locator): Promise<void> {
    const cellBox = await wt.box(cell);
    const editorBox = await wt.box(editor);
    const cellInlineStart = wt.rtl ? cellBox.x + cellBox.width : cellBox.x;
    const editorInlineStart = wt.rtl ? editorBox.x + editorBox.width : editorBox.x;

    expect(Math.abs(editorBox.y - cellBox.y)).toBeLessThanOrEqual(PLACEMENT_TOLERANCE);
    expect(Math.abs(editorInlineStart - cellInlineStart)).toBeLessThanOrEqual(PLACEMENT_TOLERANCE);
  }

  test.beforeEach(async({ page, theme, bundle }) => {
    wt = new WindowScrollPinnedOverlaysPage(page, theme, bundle);
  });

  test('a clone left behind by the scroll reads as torn on the painted frames (positive control)', async() => {
    await wt.goto({ frozen: true, unpinned: true });

    const report = await wt.recordHorizontalWheelScroll();

    // Unpinned, the row headers leave the viewport with the first frame that moves. If the scan
    // cannot see that, every zero below is worthless.
    expect(report.torn.inlineStart).toBeGreaterThan(report.scrolledFrames * 0.8);
    expect(report.torn.topCorner).toBeGreaterThan(report.scrolledFrames * 0.8);
    expect(report.torn.bottomCorner).toBeGreaterThan(report.scrolledFrames * 0.8);
  });

  test('the row headers and the corner stay pinned on every painted frame', async() => {
    await wt.goto();

    const report = await wt.recordHorizontalWheelScroll();

    expect(report.torn.inlineStart, `row headers torn on ${report.torn.inlineStart} of ${report.scrolledFrames} frames`)
      .toBe(0);
    expect(report.torn.topCorner, `corner torn on ${report.torn.topCorner} of ${report.scrolledFrames} frames`)
      .toBe(0);
  });

  test('frozen columns and both corners stay pinned on every painted frame', async() => {
    await wt.goto({ frozen: true });

    const report = await wt.recordHorizontalWheelScroll();

    expect(report.torn).toEqual({ inlineStart: 0, topCorner: 0, bottomCorner: 0 });
  });

  test('right-to-left, frozen columns and both corners stay pinned on every painted frame', async() => {
    await wt.goto({ frozen: true, rtl: true });

    const report = await wt.recordHorizontalWheelScroll();

    expect(report.torn).toEqual({ inlineStart: 0, topCorner: 0, bottomCorner: 0 });
  });

  for (const rtl of [false, true]) {
    test.describe(rtl ? 'right-to-left, after a horizontal page scroll' : 'after a horizontal page scroll', () => {
      test.beforeEach(async() => {
        await wt.goto({ frozen: true, rtl });
        await wt.wheelScrollHorizontally(300);
        expect(await wt.windowScrollDistance(), 'the page must be scrolled sideways').toBeGreaterThan(1000);
      });

      test('the pinned clones sit at the viewport inline-start edge', async() => {
        const { width } = wt.viewport();
        const clone = await wt.box(wt.inlineStartClone);
        const pinnedEdge = rtl ? clone.x + clone.width : clone.x;

        expect(Math.abs(pinnedEdge - (rtl ? width : 0))).toBeLessThanOrEqual(PLACEMENT_TOLERANCE);
      });

      test('the editor opens over a frozen-column cell', async() => {
        const row = 3;
        const cell = wt.frozenColumnCell(row, 1);

        await expectEditorOverCell(await wt.openEditor(cell), cell);
      });

      test('the editor opens over a scrolled cell', async() => {
        const cell = await wt.cellAtViewportCenter(3);

        await expectEditorOverCell(await wt.openEditor(cell), cell);
      });

      test('the fill handle sits at the corner of a frozen-column cell', async() => {
        const cell = wt.frozenColumnCell(3, 1);
        const cellBox = await wt.box(cell);

        await wt.selectCell(cell);

        const handle = await wt.box(wt.frozenColumnFillHandle());
        const inlineEndX = rtl ? cellBox.x : cellBox.x + cellBox.width;

        expect(Math.abs((handle.x + handle.width / 2) - inlineEndX)).toBeLessThanOrEqual(4);
        expect(Math.abs((handle.y + handle.height / 2) - (cellBox.y + cellBox.height))).toBeLessThanOrEqual(4);
      });

      test('the row-resize handle lands on the row header', async() => {
        const header = await wt.box(wt.rowHeader(3));
        const handle = await wt.box(await wt.hoverRowHeader(3));
        const headerInlineStart = rtl ? header.x + header.width : header.x;
        const handleInlineStart = rtl ? handle.x + handle.width : handle.x;

        expect(Math.abs((handle.y + handle.height / 2) - (header.y + header.height))).toBeLessThanOrEqual(4);
        expect(Math.abs(handleInlineStart - headerInlineStart)).toBeLessThanOrEqual(PLACEMENT_TOLERANCE);
      });
    });
  }

  test('the row headers follow the grid when the page takes the scroll axis away and gives it back', async() => {
    await wt.goto({ frozen: true });

    // Clipped: the page no longer scrolls the grid sideways, and the clones must sit at the grid's
    // own inline-start edge.
    await wt.setContainerClipped(true);

    const grid = await wt.box(wt.master);
    let clone = await wt.box(wt.inlineStartClone);

    expect(Math.abs(clone.x - grid.x)).toBeLessThanOrEqual(PLACEMENT_TOLERANCE);

    // Unclipped: the page scrolls the grid again, and the clones must be pinned to the viewport.
    await wt.setContainerClipped(false);
    await wt.wheelScrollHorizontally(300);
    expect(await wt.windowScrollDistance()).toBeGreaterThan(1000);

    // Position only, no frame recording: the wheel listener bound while the container clipped stays
    // non-passive, so the page is scrolled from JavaScript here and no frame could tear either way.
    clone = await wt.box(wt.inlineStartClone);
    expect(Math.abs(clone.x)).toBeLessThanOrEqual(PLACEMENT_TOLERANCE);

    const corner = await wt.box(wt.topCornerClone);

    expect(Math.abs(corner.x)).toBeLessThanOrEqual(PLACEMENT_TOLERANCE);
  });

  test.describe('scrolling the page up and down', () => {
    test('a clone left behind by the scroll reads as torn on the painted frames (positive control)', async() => {
      await wt.goto({ frozen: true, tall: true, unpinned: true });

      const report = await wt.recordVerticalWheelScroll(['top', 'topCorner']);

      // Unpinned, the column headers leave the viewport with the first frame that moves. If the scan
      // cannot see that, every zero below is worthless.
      expect(report.torn.top).toBeGreaterThan(report.scrolledFrames * 0.8);
      expect(report.torn.topCorner).toBeGreaterThan(report.scrolledFrames * 0.8);
    });

    test('the column headers stay pinned on every painted frame', async() => {
      await wt.goto({ tall: true });

      const report = await wt.recordVerticalWheelScroll();

      expect(report.torn.top, `column headers torn on ${report.torn.top} of ${report.scrolledFrames} frames`)
        .toBe(0);
    });

    test('frozen rows and both corners stay pinned on every painted frame', async() => {
      await wt.goto({ frozen: true, tall: true });

      const report = await wt.recordVerticalWheelScroll();

      expect(report.torn.top, `column headers torn on ${report.torn.top} of ${report.scrolledFrames} frames`)
        .toBe(0);
      expect(report.torn.topCorner, `top corner torn on ${report.torn.topCorner} of ${report.scrolledFrames} frames`)
        .toBe(0);
      expect(report.torn.bottom, `frozen rows torn on ${report.torn.bottom} of ${report.scrolledFrames} frames`)
        .toBe(0);
      expect(report.torn.bottomCorner,
        `bottom corner torn on ${report.torn.bottomCorner} of ${report.scrolledFrames} frames`).toBe(0);
    });

    test('the editor opens over a frozen-top-row cell after a vertical page scroll', async() => {
      // The twin of the sideways case, and the one that fails on the double-counted offset: the top
      // clone is sticky, so it is already shifted in the layout the editor's offset chain walks.
      await wt.goto({ frozen: true, tall: true });
      await wt.wheelScrollVertically(400);

      // The two preconditions, or the test passes on a page that never scrolled and a clone that
      // never travelled: both would put the editor over the cell for the wrong reason.
      expect(await wt.windowScrollDistanceY()).toBeGreaterThan(1000);
      expect(await wt.isInRail(wt.topClone)).toBe(true);

      const cell = wt.frozenTopRowCell();

      await expectEditorOverCell(await wt.openEditor(cell), cell);
    });

    test('the editor opens over a frozen-bottom-row cell after a vertical page scroll', async() => {
      // The bottom clone takes NO offset compensation, here or on `develop`: its place has always
      // been an inset and is now a sticky shift, and the editor's offset chain sees both. This is
      // what proves the compensation would be a double count rather than a missing correction.
      await wt.goto({ frozen: true, tall: true });
      await wt.wheelScrollVertically(400);

      expect(await wt.windowScrollDistanceY()).toBeGreaterThan(1000);
      expect(await wt.isInRail(wt.bottomClone)).toBe(true);

      const cell = wt.frozenBottomRowCell();

      await expectEditorOverCell(await wt.openEditor(cell), cell);
    });
  });

  test('a corner that stops rendering leaves its rail and stays out of it', async() => {
    // Every draw positions the corners, rendering or not; an idle corner put back into a rail would
    // stretch to the rail's width once its own width is cleared.
    await wt.goto();
    await expect.poll(() => wt.isInRail(wt.topCornerClone)).toBe(true);

    await wt.setColumnHeaders(false);
    await expect.poll(() => wt.isInRail(wt.topCornerClone)).toBe(false);

    await wt.setColumnHeaders(true);
    await expect.poll(() => wt.isInRail(wt.topCornerClone)).toBe(true);
  });
});
