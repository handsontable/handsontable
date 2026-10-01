import { test, expect } from '../fixtures/test';
import {
  ManualResizeGuideGeometryPage,
  type RowHeaderOverlay,
} from '../fixtures/pages/ManualResizeGuideGeometryPage';

/**
 * Where the row resize handle and its guide are drawn.
 *
 * Both are positioned from the hovered row header's box, and both used to be guarded by two
 * screenshots of the complex demo only (`visual-tests/tests/js-only/complex-demo/manual-row-resize`):
 * the handle under the pointer, and the guide while the button is held. A screenshot shows where the
 * line was drawn; it cannot say that was the row boundary, and a one-pixel drift approved once
 * becomes the golden. That drift is real: until #11500 the guide's 1px line sat one pixel above the
 * boundary (its `margin-top` was 4px where the handle's offset needs 5), and the fix shipped with no
 * assertion — the frozen Jasmine suite pins the handle's position
 * (`manualRowResize.spec.js`, "handle and guide") and z-index, the guide's WIDTH, and that the guide
 * keeps its distance from the handle while dragging, but never where the line is.
 *
 * So this spec asserts the geometry from DOM rects, on every theme and bundle leg:
 *
 * - the handle is as wide as the header, starts at its inline edge, and is centered one pixel above
 *   the row's bottom boundary (a 10px strip from `bottom - 6` to `bottom + 4`);
 * - on a press, the guide's line is LEVEL with that boundary (`guide.bottom === header.bottom`) and
 *   is a line — one pixel high — that starts where the handle ends and reaches the table's far edge;
 * - both are stacked above every overlay, or the line would vanish under the frozen column and the
 *   corners it crosses;
 * - while dragging, the line follows the pointer by the dragged distance and the row itself stays
 *   put — read after a settle, so a resize drawn on a later frame would show;
 * - on release, the row grew by exactly that distance.
 *
 * A row header lives in one of three overlays, and the plugin resolves its position against each
 * one separately (`ROW_RESIZE_AXIS.getHeaderPosition`): the top-start corner for a row frozen at the
 * top, the bottom-start corner for a row frozen at the bottom, the inline-start overlay otherwise.
 * One test per overlay, same gesture.
 *
 * Tolerances are half a pixel: every box here is laid out on whole CSS pixels at zoom 1, so a
 * correct render differs by exactly 0 and the #11500 shape differs by exactly 1. The row height is
 * exact too — the dragged size is the pointer delta, a whole number, and the row renders at it on
 * every leg.
 */

const EDGE_TOLERANCE_PX = 0.5;
const DRAG_PX = 40;

const CASES: { name: string, overlay: RowHeaderOverlay, rowInOverlay: number, visualRow: (rows: number) => number }[] = [
  {
    name: 'a scrolling row (inline-start overlay)',
    overlay: 'inline-start',
    rowInOverlay: 2,
    visualRow: () => 2,
  },
  {
    name: 'a row frozen at the top (top-start corner overlay)',
    overlay: 'top-start-corner',
    rowInOverlay: 0,
    visualRow: () => 0,
  },
  {
    name: 'a row frozen at the bottom (bottom-start corner overlay)',
    overlay: 'bottom-start-corner',
    rowInOverlay: 0,
    visualRow: rows => rows - 1,
  },
];

test.describe('Manual row resize handle and guide geometry', () => {
  let grid: ManualResizeGuideGeometryPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ManualResizeGuideGeometryPage(page, theme, bundle);
    await grid.goto();
  });

  for (const { name, overlay, rowInOverlay, visualRow } of CASES) {
    test(`draws the handle and the guide on the boundary of ${name}`, async() => {
      const row = visualRow(await grid.rowCount());
      const startHeight = await grid.renderedRowHeight(row);

      await grid.hoverRowHeaderCell(grid.rowHeaderIn(overlay, rowInOverlay));

      // The handle: a strip as wide as the header, flush with its inline edge, centered one pixel
      // above the boundary. Read together with the header so both describe one frame.
      const hovered = await grid.geometry(overlay, rowInOverlay);

      expect(hovered.handle, 'the handle is attached after hovering the header').not.toBeNull();
      expect(Math.abs(hovered.handle!.left - hovered.header.left), 'handle inline start vs header')
        .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
      expect(Math.abs(hovered.handle!.width - hovered.header.width), 'handle width vs header')
        .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
      expect(Math.abs((hovered.handle!.top + (hovered.handle!.height / 2)) - (hovered.header.bottom - 1)),
        'handle center vs one pixel above the row boundary').toBeLessThanOrEqual(EDGE_TOLERANCE_PX);

      // The pointer over the handle is what shows it (`:hover`), and the press is what attaches the
      // guide. Both are the user's gesture, so both run through the real mouse.
      await grid.moveOntoRowHandle();
      await grid.pressRowHandle();

      // The guide: its 1px line level with the row boundary — the #11500 pixel — starting where the
      // handle ends and reaching the table's far edge; both elements stacked above the overlays.
      const pressed = await grid.geometry(overlay, rowInOverlay);

      expect(pressed.guide, 'the guide is attached after pressing the handle').not.toBeNull();
      expect(Math.abs(pressed.guide!.bottom - pressed.header.bottom), 'guide line vs row boundary')
        .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
      expect(Math.abs(pressed.guide!.height - 1), 'the guide is a one-pixel line')
        .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
      expect(Math.abs(pressed.guide!.left - pressed.handle!.right), 'guide inline start vs handle end')
        .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
      expect(Math.abs(pressed.guide!.right - pressed.table.right), 'guide inline end vs table end')
        .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
      expect(pressed.stacking.guide, 'guide z-index vs the highest overlay')
        .toBeGreaterThan(pressed.stacking.overlays);
      expect(pressed.stacking.handle, 'handle z-index vs the highest overlay')
        .toBeGreaterThan(pressed.stacking.overlays);

      // Dragging: the line follows the pointer, by exactly the dragged distance.
      await grid.dragPointerBy(DRAG_PX);

      await expect.poll(async() => {
        const dragged = await grid.geometry(overlay, rowInOverlay);

        return dragged.guide ? dragged.guide.bottom - hovered.header.bottom : Number.NaN;
      }, { message: 'the guide line follows the pointer by the dragged distance' })
        .toBeCloseTo(DRAG_PX, 0);

      // ...and the row itself is not resized while the button is held: only the line moves. Read
      // after a settle, so a draw the drag scheduled for a later frame has landed; the release below
      // is the positive control that the same row does grow once the drag ends.
      await grid.afterFrames();

      const held = await grid.geometry(overlay, rowInOverlay);

      // Both edges of the box: a row frozen at the bottom is pinned to the holder's bottom edge, so it
      // would grow upward with its bottom boundary standing still.
      expect(held.header.height, 'the row height while the button is held').toBe(hovered.header.height);
      expect(held.header.bottom, 'the row boundary while the button is held').toBe(hovered.header.bottom);
      expect(held.guide!.bottom - hovered.header.bottom, 'the guide line while the button is held')
        .toBeCloseTo(DRAG_PX, 0);

      // Release: the row grew by that distance.
      await grid.releasePointer();

      await expect.poll(() => grid.renderedRowHeight(row), { message: 'the row grew by the dragged distance' })
        .toBeCloseTo(startHeight + DRAG_PX, 0);
    });
  }
});
