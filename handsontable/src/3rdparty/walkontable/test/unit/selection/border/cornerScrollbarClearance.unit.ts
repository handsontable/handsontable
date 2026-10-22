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
  windowScrolls?: boolean,
  finePointer?: boolean,
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
  windowScrolls = false,
  finePointer = true,
}: GridShape = {}): object {
  const settings: Record<string, number> = { totalColumns, totalRows, fixedColumnsEnd, fixedRowsBottom };
  const wot = {
    getSetting: (key: string) => settings[key],
    wtTable: { isMaster, holder: {} as HTMLElement },
    wtViewport: {
      hasVerticalScroll: () => verticalScroll,
      hasHorizontalScroll: () => horizontalScroll,
      isVerticallyScrollableByWindow: () => windowScrolls,
      isHorizontallyScrollableByWindow: () => windowScrolls,
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
      },
    },
  };

  // A real prototype chain without running the constructor (which builds DOM).
  return Object.assign(Object.create(Border.prototype), { wot });
}

const clearance = (border: object, toIndex: number, axis: 'vertical' | 'horizontal'): number =>
  (Border.prototype as unknown as Record<string, (...args: unknown[]) => number>)
    .getCornerScrollbarClearance.call(border, toIndex, axis);

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
    expect(clearance(createBorder({ windowScrolls: true }), 19, 'vertical')).toBe(0);
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
