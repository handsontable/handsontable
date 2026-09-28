import { type Locator } from '@playwright/test';
import { test, expect } from '../../fixtures/test';
import { SpreaderLayoutShiftPage } from '../../fixtures/pages/walkontable/SpreaderLayoutShiftPage';

/**
 * DEV-54 - the spreader must not register as a layout shift while the grid scrolls.
 *
 * The spreader (`div.wtSpreader`) holds the rendered rows and is repositioned on every scroll
 * draw. Written as a `top`/`left` inset, that move is a layout move: the browser subtracts the
 * scroll distance, but the spreader can only sit on a row boundary, so a sub-row remainder is
 * reported on every frame and the page's CLS grows without bound (10.4 after 25 wheel steps,
 * where 0.1 is "good"). Written as a transform, the same move is exempt.
 *
 * Nothing about this is visible - the cells land in the same place either way - so the
 * browser's own `layout-shift` entries are the observable contract, and the positive control
 * exists so a zero cannot be read from an observer that saw nothing.
 *
 * The placement tests are the other half. `offsetTop`/`offsetLeft` and the `offset()` helper walk
 * the layout chain and cannot see a transform, so everything placed from a cell's document
 * position against an element OUTSIDE the spreader - the editor, the fill handle, the resize
 * handles - has to add the spreader offset back. Each is asserted after a scroll on BOTH axes, in
 * LTR and in RTL (where the horizontal offset carries the opposite sign), and over the frozen
 * clones, whose spreaders carry an offset of their own.
 */
test.describe('walkontable spreader layout shift', { tag: '@walkontable' }, () => {
  let wt: SpreaderLayoutShiftPage;

  /** A pixel of border compensation either way is by design; anything larger is misplaced. */
  const PLACEMENT_TOLERANCE = 2;

  /**
   * Asserts an editor box is PLACED on a cell box: same top, and the same inline-start edge - the
   * one the editor is anchored on (left in LTR, right in RTL). The editor's width is deliberately
   * not compared: a theme sizes it as it likes (horizon draws it a few pixels wider than the cell),
   * and that has nothing to do with where it was placed.
   *
   * @param {Locator} editor The editor holder.
   * @param {Locator} cell The edited cell.
   */
  async function expectEditorOverCell(editor: Locator, cell: Locator): Promise<void> {
    const cellBox = await cell.boundingBox();
    const editorBox = await editor.boundingBox();

    expect(cellBox).not.toBeNull();
    expect(editorBox).not.toBeNull();

    const cellInlineStart = wt.rtl ? cellBox!.x + cellBox!.width : cellBox!.x;
    const editorInlineStart = wt.rtl ? editorBox!.x + editorBox!.width : editorBox!.x;

    expect(Math.abs(editorBox!.y - cellBox!.y)).toBeLessThanOrEqual(PLACEMENT_TOLERANCE);
    expect(Math.abs(editorInlineStart - cellInlineStart)).toBeLessThanOrEqual(PLACEMENT_TOLERANCE);
  }

  /**
   * Asserts a fill handle straddles a cell's inline-end bottom corner - bottom-right in LTR,
   * bottom-left in RTL.
   *
   * @param {Locator} handle The fill handle.
   * @param {Locator} cell The selected cell.
   */
  async function expectHandleAtCellCorner(handle: Locator, cell: Locator): Promise<void> {
    const cellBox = await cell.boundingBox();
    const handleBox = await handle.boundingBox();

    expect(cellBox).not.toBeNull();
    expect(handleBox).not.toBeNull();

    const handleCenterX = handleBox!.x + handleBox!.width / 2;
    const handleCenterY = handleBox!.y + handleBox!.height / 2;
    const inlineEndX = wt.rtl ? cellBox!.x : cellBox!.x + cellBox!.width;

    expect(Math.abs(handleCenterX - inlineEndX)).toBeLessThanOrEqual(4);
    expect(Math.abs(handleCenterY - (cellBox!.y + cellBox!.height))).toBeLessThanOrEqual(4);
  }

  /**
   * Asserts the column-resize handle sits on a header's inline-end edge, and the row-resize
   * handle on a header's bottom edge.
   *
   * @param {number} col A column whose header is rendered in the top clone.
   * @param {number} row A row whose header is rendered in the inline-start clone.
   */
  async function expectResizeHandlesOnHeaders(col: number, row: number): Promise<void> {
    const columnHandle = await wt.hoverColumnHeader(col);
    const columnHeaderBox = await (await wt.columnHeader(col)).boundingBox();
    const columnHandleBox = await columnHandle.boundingBox();

    expect(columnHeaderBox).not.toBeNull();
    expect(columnHandleBox).not.toBeNull();

    const headerInlineEndX = wt.rtl ? columnHeaderBox!.x : columnHeaderBox!.x + columnHeaderBox!.width;

    expect(Math.abs((columnHandleBox!.x + columnHandleBox!.width / 2) - headerInlineEndX)).toBeLessThanOrEqual(4);
    expect(Math.abs(columnHandleBox!.y - columnHeaderBox!.y)).toBeLessThanOrEqual(PLACEMENT_TOLERANCE);

    const rowHandle = await wt.hoverRowHeader(row);
    const rowHeaderBox = await wt.rowHeader(row).boundingBox();
    const rowHandleBox = await rowHandle.boundingBox();

    expect(rowHeaderBox).not.toBeNull();
    expect(rowHandleBox).not.toBeNull();

    const headerInlineStartX = wt.rtl ? rowHeaderBox!.x + rowHeaderBox!.width : rowHeaderBox!.x;
    const handleInlineStartX = wt.rtl ? rowHandleBox!.x + rowHandleBox!.width : rowHandleBox!.x;

    expect(Math.abs((rowHandleBox!.y + rowHandleBox!.height / 2) - (rowHeaderBox!.y + rowHeaderBox!.height))).toBeLessThanOrEqual(4);
    expect(Math.abs(handleInlineStartX - headerInlineStartX)).toBeLessThanOrEqual(PLACEMENT_TOLERANCE);
  }

  test.beforeEach(async({ page, theme, bundle }) => {
    wt = new SpreaderLayoutShiftPage(page, theme, bundle);
  });

  test.describe('without frozen panes', () => {
    test.beforeEach(async() => {
      await wt.goto();

      // Only Chromium reports layout shifts, and every project here runs it. A precondition rather
      // than a skip: on a browser without the entry type every assertion below would pass on nothing.
      expect(await wt.layoutShiftsSupported(), 'layout-shift entries must be reported by this browser').toBe(true);
    });

    test('reports a layout shift for a box moved with an inset (positive control)', async() => {
      await wt.resetLayoutShifts();
      await wt.moveControlBox();

      // The observer path works: a real layout move on this page IS seen and IS blamed correctly.
      await expect.poll(() => wt.shiftValueBlamedOn('cls-control'), {
        message: 'the control box moved by 200px, so the observer must report it',
      }).toBeGreaterThan(0);
    });

    test('a vertical wheel scroll moves no layout', async() => {
      await wt.resetLayoutShifts();
      await wt.wheelScroll({ deltaY: 600 });

      expect(await wt.shiftValueBlamedOn('wtSpreader')).toBe(0);
      // Well under the 0.1 "good" line, and 200× under what the inset write measured.
      expect(await wt.totalShiftValue()).toBeLessThan(0.05);
    });

    test('a horizontal wheel scroll moves no layout', async() => {
      await wt.resetLayoutShifts();
      await wt.wheelScroll({ deltaX: 400 });

      expect(await wt.shiftValueBlamedOn('wtSpreader')).toBe(0);
      expect(await wt.totalShiftValue()).toBeLessThan(0.05);
    });

    test('the editor opens over its cell after a scroll on both axes', async() => {
      // Both axes, so the horizontal offset the editor adds back is not zero.
      await wt.wheelScroll({ deltaY: 600 });
      await wt.wheelScroll({ deltaX: 400 });

      const row = (await wt.masterFirstRenderedRow()) + 4;
      const col = (await wt.masterFirstRenderedColumn()) + 2;
      const cell = wt.cell(row, col);

      await expectEditorOverCell(await wt.openEditor(cell), cell);
    });

    test('the fill handle sits at the selection corner after a scroll on both axes', async() => {
      // The corner is positioned from `offset(TD) - offset(TABLE)`, both inside the spreader, so this
      // pins that the transform cancels out of that difference on both axes. (The separate anchor
      // that decides whether the handle is pulled inside the grid's last row/column is not
      // exercised here - that decision only changes at the grid's edge, where the band-relative
      // coordinate already exceeds the viewport, so it cannot flip either way.)
      await wt.wheelScroll({ deltaY: 600 });
      await wt.wheelScroll({ deltaX: 400 });

      const row = (await wt.masterFirstRenderedRow()) + 4;
      const col = (await wt.masterFirstRenderedColumn()) + 2;
      const cell = wt.cell(row, col);

      await wt.selectCell(cell);
      await expectHandleAtCellCorner(wt.fillHandle(), cell);
    });

    test('the resize handles land on the header edges after a scroll on both axes', async() => {
      // The handles are placed from the header's position relative to the root element, through
      // the clone spreader's offset - the third reader that has to add the offset back.
      await wt.wheelScroll({ deltaY: 600 });
      await wt.wheelScroll({ deltaX: 400 });

      const row = (await wt.masterFirstRenderedRow()) + 4;
      const col = (await wt.masterFirstRenderedColumn()) + 2;

      await expectResizeHandlesOnHeaders(col, row);
    });
  });

  test.describe('with frozen rows and columns', () => {
    test.beforeEach(async() => {
      await wt.goto({ frozen: true });
      expect(await wt.layoutShiftsSupported(), 'layout-shift entries must be reported by this browser').toBe(true);
    });

    test('the overlay clones move no layout either', async() => {
      // Each clone has a spreader of its own, offset on the axis it does not freeze.
      await wt.resetLayoutShifts();
      await wt.wheelScroll({ deltaY: 600 });
      await wt.wheelScroll({ deltaX: 400 });

      expect(await wt.shiftValueBlamedOn('wtSpreader')).toBe(0);
      expect(await wt.totalShiftValue()).toBeLessThan(0.05);
    });

    test('the editor opens over a frozen-column cell and a frozen-row cell after a scroll', async() => {
      // The inline-start clone's spreader is offset vertically, the top clone's horizontally.
      await wt.wheelScroll({ deltaY: 600 });
      await wt.wheelScroll({ deltaX: 400 });

      const row = (await wt.masterFirstRenderedRow()) + 4;
      const col = (await wt.masterFirstRenderedColumn()) + 2;
      const frozenColumnCell = wt.frozenColumnCell(row, 1);

      await expectEditorOverCell(await wt.openEditor(frozenColumnCell), frozenColumnCell);
      await wt.closeEditor();

      const frozenRowCell = wt.frozenRowCell(1, col);

      await expectEditorOverCell(await wt.openEditor(frozenRowCell), frozenRowCell);
    });

    test('the fill handle sits at the corner of a frozen-column cell after a scroll', async() => {
      await wt.wheelScroll({ deltaY: 600 });
      await wt.wheelScroll({ deltaX: 400 });

      const row = (await wt.masterFirstRenderedRow()) + 4;
      const cell = wt.frozenColumnCell(row, 1);

      await wt.selectCell(cell);
      // The inline-start clone draws its own handle for a selection in a frozen column.
      await expectHandleAtCellCorner(wt.frozenColumnFillHandle(), cell);
    });

    test('the resize handles land on the header edges after a scroll on both axes', async() => {
      await wt.wheelScroll({ deltaY: 600 });
      await wt.wheelScroll({ deltaX: 400 });

      const row = (await wt.masterFirstRenderedRow()) + 4;
      const col = (await wt.masterFirstRenderedColumn()) + 2;

      await expectResizeHandlesOnHeaders(col, row);
    });
  });

  test.describe('right-to-left, with frozen rows and columns', () => {
    test.beforeEach(async() => {
      await wt.goto({ frozen: true, rtl: true });
      expect(await wt.layoutShiftsSupported(), 'layout-shift entries must be reported by this browser').toBe(true);
    });

    test('a wheel scroll on both axes moves no layout', async() => {
      // The horizontal offset carries the opposite sign here.
      await wt.resetLayoutShifts();
      await wt.wheelScroll({ deltaY: 600 });
      await wt.wheelScroll({ deltaX: 400 });

      expect(await wt.shiftValueBlamedOn('wtSpreader')).toBe(0);
      expect(await wt.totalShiftValue()).toBeLessThan(0.05);
    });

    test('the editor opens over its cell after a scroll on both axes', async() => {
      await wt.wheelScroll({ deltaY: 600 });
      await wt.wheelScroll({ deltaX: 400 });

      const row = (await wt.masterFirstRenderedRow()) + 4;
      const col = (await wt.masterFirstRenderedColumn()) + 2;
      const cell = wt.cell(row, col);

      await expectEditorOverCell(await wt.openEditor(cell), cell);
      await wt.closeEditor();

      const frozenColumnCell = wt.frozenColumnCell(row, 1);

      await expectEditorOverCell(await wt.openEditor(frozenColumnCell), frozenColumnCell);
    });

    test('the fill handle sits at the inline-end corner after a scroll on both axes', async() => {
      await wt.wheelScroll({ deltaY: 600 });
      await wt.wheelScroll({ deltaX: 400 });

      const row = (await wt.masterFirstRenderedRow()) + 4;
      const col = (await wt.masterFirstRenderedColumn()) + 2;
      const cell = wt.cell(row, col);

      await wt.selectCell(cell);
      await expectHandleAtCellCorner(wt.fillHandle(), cell);
    });

    test('the resize handles land on the header edges after a scroll on both axes', async() => {
      await wt.wheelScroll({ deltaY: 600 });
      await wt.wheelScroll({ deltaX: 400 });

      const row = (await wt.masterFirstRenderedRow()) + 4;
      const col = (await wt.masterFirstRenderedColumn()) + 2;

      await expectResizeHandlesOnHeaders(col, row);
    });
  });
});
