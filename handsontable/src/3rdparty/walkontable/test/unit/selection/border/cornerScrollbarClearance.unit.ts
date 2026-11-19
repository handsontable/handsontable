import Border from 'walkontable/selection/border/border';
import { OVERLAY_SCROLLBAR_CLEARANCE } from 'walkontable/overlay/constants';

/**
 * `Border#getCornerScrollbarClearance` - how far the fill handle of the grid's last column or last
 * row is pulled back so an overlay ("floating") scrollbar does not cover it (DEV-982). Run against a
 * stub `this`: the method reads only `this.wot`, so no DOM and no overlay are built.
 */

type GridShape = {
  totalColumns?: number,
  totalRows?: number,
  fixedColumnsEnd?: number,
  fixedRowsBottom?: number,
  isMaster?: boolean,
  scrollbarWidth?: number,
  holderGutter?: number,
  verticalScroll?: boolean,
  horizontalScroll?: boolean,
  windowOwnsVertical?: boolean,
  windowOwnsHorizontal?: boolean,
  finePointer?: boolean,
  holderRect?: { left: number, top: number, right: number, bottom: number },
  cellRect?: { left: number, top: number, right: number, bottom: number },
};

/**
 * Builds the stub.
 *
 * @param {GridShape} shape The grid shape and the environment the scrollbars come from.
 * @returns {object}
 */
function createBorder({
  totalColumns = 20,
  totalRows = 30,
  fixedColumnsEnd = 0,
  fixedRowsBottom = 0,
  isMaster = true,
  scrollbarWidth = 0,
  holderGutter = 0,
  verticalScroll = true,
  horizontalScroll = true,
  windowOwnsVertical = false,
  windowOwnsHorizontal = false,
  finePointer = true,
  holderRect = { left: 0, top: 0, right: 600, bottom: 300 },
  cellRect = { left: 550, top: 271, right: 600, bottom: 300 },
}: GridShape = {}): object {
  const settings: Record<string, number> = { totalColumns, totalRows, fixedColumnsEnd, fixedRowsBottom };
  const wot = {
    getSetting: (key: string) => settings[key],
    wtTable: { isMaster, holder: { kind: 'holder' } as unknown as HTMLElement },
    wtViewport: {
      hasVerticalScroll: () => verticalScroll,
      hasHorizontalScroll: () => horizontalScroll,
      isVerticallyScrollableByWindow: () => windowOwnsVertical,
      isHorizontallyScrollableByWindow: () => windowOwnsHorizontal,
    },
    rootDocument: document,
    // A fresh object per stub: `canGrabScrollbar` caches its media query per window.
    rootWindow: { matchMedia: () => ({ matches: finePointer }) },
    domBindings: {
      geometryReader: {
        getScrollbarWidth: () => scrollbarWidth,
        offsetWidth: () => 600 + holderGutter,
        clientWidth: () => 600,
        offsetHeight: () => 300 + holderGutter,
        clientHeight: () => 300,
        getBoundingClientRect: (element: { kind: string }) => {
          const rect = element.kind === 'holder' ? holderRect : cellRect;

          return { ...rect, width: rect.right - rect.left, height: rect.bottom - rect.top };
        },
      },
    },
  };

  // A real prototype chain without running the constructor (which builds DOM).
  return Object.assign(Object.create(Border.prototype), {
    wot,
    cornerDefaultStyle: { width: '8px', height: '8px' },
  });
}

const clearance = (border: object, toIndex: number, axis: 'vertical' | 'horizontal'): number =>
  (Border.prototype as unknown as Record<string, (...args: unknown[]) => number>)
    .getCornerScrollbarClearance.call(border, toIndex, axis);

const CELL = { kind: 'cell' } as unknown as HTMLElement;

const shift = (border: object, toIndex: number, axis: 'vertical' | 'horizontal', isRtl = false): number | null =>
  (Border.prototype as unknown as Record<string, (...args: unknown[]) => number | null>)
    .getCornerScrollbarShift.call(border, toIndex, axis, CELL, isRtl);

describe('Border#getCornerScrollbarClearance', () => {
  it('should clear the overlay scrollbar strip for the last column and the last row', () => {
    const border = createBorder();

    expect(clearance(border, 19, 'vertical')).toBe(OVERLAY_SCROLLBAR_CLEARANCE);
    expect(clearance(border, 29, 'horizontal')).toBe(OVERLAY_SCROLLBAR_CLEARANCE);
  });

  it('should leave every other column and row where it is', () => {
    const border = createBorder();

    expect(clearance(border, 18, 'vertical')).toBe(0);
    expect(clearance(border, 0, 'vertical')).toBe(0);
    expect(clearance(border, 28, 'horizontal')).toBe(0);
  });

  it('should not move the handle beside a scrollbar that takes layout space', () => {
    // Classic scrollbars (Windows with "Always show scrollbars", macOS "Always", Linux): the browser
    // already keeps the content clear of them.
    expect(clearance(createBorder({ scrollbarWidth: 15 }), 19, 'vertical')).toBe(0);
    // The engine probe says overlay, but this holder still reserves a gutter.
    expect(clearance(createBorder({ holderGutter: 15 }), 19, 'vertical')).toBe(0);
  });

  it('should not move the handle when the axis the scrollbar belongs to does not scroll', () => {
    const border = createBorder({ verticalScroll: false, horizontalScroll: false });

    expect(clearance(border, 19, 'vertical')).toBe(0);
    expect(clearance(border, 29, 'horizontal')).toBe(0);
  });

  it('should read each axis on its own', () => {
    // Only the vertical axis scrolls: the last column clears its scrollbar, the last row has none.
    const border = createBorder({ horizontalScroll: false });

    expect(clearance(border, 19, 'vertical')).toBe(OVERLAY_SCROLLBAR_CLEARANCE);
    expect(clearance(border, 29, 'horizontal')).toBe(0);
  });

  it('should not move the handle when the window owns the scrollbar', () => {
    expect(clearance(createBorder({ windowOwnsVertical: true }), 19, 'vertical')).toBe(0);
    expect(clearance(createBorder({ windowOwnsHorizontal: true }), 29, 'horizontal')).toBe(0);
  });

  it('should ask each axis\'s own owner', () => {
    // The window owns the rows and the holder the columns (a grid with a width and no height):
    // only the horizontal scrollbar belongs to the holder.
    const border = createBorder({ windowOwnsVertical: true });

    expect(clearance(border, 19, 'vertical')).toBe(0);
    expect(clearance(border, 29, 'horizontal')).toBe(OVERLAY_SCROLLBAR_CLEARANCE);
  });

  it('should not move the handle on a touch-only device', () => {
    expect(clearance(createBorder({ finePointer: false }), 19, 'vertical')).toBe(0);
  });

  it('should leave the end freeze panes to the overlay that already keeps clear of the scrollbar', () => {
    expect(clearance(createBorder({ fixedColumnsEnd: 2 }), 19, 'vertical')).toBe(0);
    expect(clearance(createBorder({ fixedRowsBottom: 2 }), 29, 'horizontal')).toBe(0);
  });

  it('should move only the master\'s handle', () => {
    expect(clearance(createBorder({ isMaster: false }), 19, 'vertical')).toBe(0);
  });
});

describe('Border#getCornerScrollbarShift', () => {
  it('should move a handle flush with the holder edge by the whole strip', () => {
    // The cell ends on the holder's inline-end and bottom edges.
    const border = createBorder();

    expect(shift(border, 19, 'vertical')).toBe(OVERLAY_SCROLLBAR_CLEARANCE);
    expect(shift(border, 29, 'horizontal')).toBe(OVERLAY_SCROLLBAR_CLEARANCE);
  });

  it('should move a handle that ends a few pixels short of the edge by what is left of the strip', () => {
    // Ending 10px short: unlifted, the handle would hang 4px into the strip.
    const border = createBorder({ cellRect: { left: 540, top: 261, right: 590, bottom: 290 } });

    expect(shift(border, 19, 'vertical')).toBe(OVERLAY_SCROLLBAR_CLEARANCE - 10);
    expect(shift(border, 29, 'horizontal')).toBe(OVERLAY_SCROLLBAR_CLEARANCE - 10);
  });

  it('should not move a handle that is already clear of the strip', () => {
    const border = createBorder({ cellRect: { left: 500, top: 200, right: 550, bottom: 229 } });

    expect(shift(border, 19, 'vertical')).toBeNull();
    expect(shift(border, 29, 'horizontal')).toBeNull();
  });

  it('should measure from the left edge in RTL', () => {
    // The vertical scrollbar is on the left: a cell flush with it moves, one 300px away does not.
    expect(shift(createBorder({ cellRect: { left: 0, top: 271, right: 50, bottom: 300 } }), 19, 'vertical', true))
      .toBe(OVERLAY_SCROLLBAR_CLEARANCE);
    expect(shift(createBorder({ cellRect: { left: 300, top: 271, right: 350, bottom: 300 } }), 19, 'vertical', true))
      .toBeNull();
  });

  it('should keep the handle inside a track narrower than the strip', () => {
    // A 15px column: the 8px handle, lifted 1px inside the cell's end, can move 15 - 8 - 2 px more
    // and still start 1px inside the cell.
    const border = createBorder({ cellRect: { left: 585, top: 271, right: 600, bottom: 300 } });

    expect(shift(border, 19, 'vertical')).toBe(5);
  });

  it('should bring a partly visible last column\'s handle back into view, within its cell', () => {
    // The cell runs 20px past the edge; the handle moves as far as the cell allows.
    const border = createBorder({ cellRect: { left: 570, top: 271, right: 620, bottom: 300 } });

    expect(shift(border, 19, 'vertical')).toBe(36);
  });

  it('should not read any geometry when no strip applies', () => {
    const border = createBorder({ scrollbarWidth: 15 }) as { wot: { domBindings: { geometryReader: object } } };
    const reader = border.wot.domBindings.geometryReader as Record<string, () => unknown>;
    const spy = jest.spyOn(reader, 'getBoundingClientRect');

    expect(shift(border, 19, 'vertical')).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});
