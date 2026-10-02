// The overlay barrel goes first: the table modules and the overlays import each other, and only this entry
// point resolves that cycle.
import { InlineEndOverlay, InlineStartOverlay } from 'walkontable/overlay';
import { Overlay } from 'walkontable/overlay/regions/_base';

/**
 * The inline-end overlay's own logic, run on a stub `this` (the methods read only the fields named in each
 * stub), so no DOM layout and no grid are built. DOM geometry (where the clones land in LTR and RTL) is
 * pinned in `tests/e2e/walkontable/inline-end-overlay-review.spec.ts`.
 */

type Method<T> = (this: unknown, ...args: never[]) => T;

const run = <T>(klass: { prototype: object }, name: string, self: object, ...args: unknown[]): T =>
  ((klass.prototype as Record<string, Method<T>>)[name] as unknown as (...a: unknown[]) => T)
    .apply(self, args);

describe('InlineEndOverlay#repositionOverlay', () => {
  /**
   * Builds the stub and returns it with the clone's root element.
   *
   * @param {boolean} isRtl Whether the grid is right-to-left.
   * @param {number} inset The inline-end inset the overlay reports.
   * @returns {object}
   */
  function createStub(isRtl: boolean, inset: number) {
    const root = document.createElement('div');

    return {
      root,
      self: {
        clone: { wtTable: { holder: { parentNode: root } } },
        isRtl: () => isRtl,
        getInlineEndInset: () => inset,
      },
    };
  }

  it('should inset the clone from the RIGHT edge in LTR, and clear the left one', () => {
    const { root, self } = createStub(false, 12);

    root.style.left = '5px';
    run(InlineEndOverlay, 'repositionOverlay', self);

    expect(root.style.right).toBe('12px');
    expect(root.style.left).toBe('');
  });

  it('should inset the clone from the LEFT edge in RTL, and clear the right one', () => {
    const { root, self } = createStub(true, 12);

    root.style.right = '5px';
    run(InlineEndOverlay, 'repositionOverlay', self);

    expect(root.style.left).toBe('12px');
    expect(root.style.right).toBe('');
  });

  it('should do nothing while there is no clone', () => {
    expect(() => run(InlineEndOverlay, 'repositionOverlay', { clone: null })).not.toThrow();
  });
});

describe('InlineEndOverlay#getInlineEndInset', () => {
  /**
   * Builds a stub for the inset rule.
   *
   * @param {object} state What the viewport reports.
   * @param {boolean} state.horizontalScroll Whether the columns overflow the holder.
   * @param {boolean} state.verticalScroll Whether the rows overflow the holder.
   * @param {number} [state.gutter=0] The vertical scrollbar gutter the holder gives up.
   * @returns {object}
   */
  function createStub({ horizontalScroll, verticalScroll, gutter = 0 }:
    { horizontalScroll: boolean, verticalScroll: boolean, gutter?: number }) {
    const holder = document.createElement('div');

    return {
      deps: {
        geometryReader: { offsetWidth: () => 300, clientWidth: () => 300 - gutter },
        getWtTable: () => ({ holder, getTotalWidth: () => 180 }),
        getWtViewport: () => ({
          hasHorizontalScroll: () => horizontalScroll,
          hasVerticalScroll: () => verticalScroll,
          getWorkspaceWidth: () => 300,
        }),
      },
    };
  }

  it('should rest against the last column when the columns do not fill the holder', () => {
    expect(run(InlineEndOverlay, 'getInlineEndInset', createStub({ horizontalScroll: false, verticalScroll: false })))
      .toBe(120);
  });

  it('should add the gutter of a vertical scrollbar only when the columns scroll too', () => {
    expect(run(InlineEndOverlay, 'getInlineEndInset',
      createStub({ horizontalScroll: true, verticalScroll: true, gutter: 15 }))).toBe(15);
    expect(run(InlineEndOverlay, 'getInlineEndInset',
      createStub({ horizontalScroll: true, verticalScroll: false, gutter: 15 }))).toBe(0);
  });
});

describe('InlineEndOverlay#getBandWidth', () => {
  /**
   * @param {number} fixedColumnsEnd The (clamped) end band.
   * @returns {object}
   */
  function createStub(fixedColumnsEnd: number) {
    const getSetting = jest.fn((key: string) => ({ fixedColumnsEnd, totalColumns: 10, defaultColumnWidth: 50 }[key]));
    const widths: Record<number, number> = { 7: 40, 8: 0, 9: 60 };

    return {
      getSetting,
      self: {
        wtSettings: { getSetting },
        deps: { getWtTable: () => ({ getColumnWidth: (column: number) => widths[column] }) },
        sumCellSizes: (from: number, to: number) => run<number>(InlineEndOverlay, 'sumCellSizes', {
          wtSettings: { getSetting },
          deps: { getWtTable: () => ({ getColumnWidth: (column: number) => widths[column] }) },
        }, from, to),
      },
    };
  }

  it('should sum the widths of the last columns, a missing width falling back to the default', () => {
    expect(run(InlineEndOverlay, 'getBandWidth', createStub(3).self)).toBe(40 + 50 + 60);
  });

  it('should be 0, without summing anything, when no end column is frozen', () => {
    const { self, getSetting } = createStub(0);

    expect(run(InlineEndOverlay, 'getBandWidth', self)).toBe(0);
    expect(getSetting).toHaveBeenCalledTimes(1);
  });
});

describe('InlineEndOverlay#updateStateOfRendering', () => {
  /**
   * Builds a stub whose rendering state and refresh calls are recorded.
   *
   * @param {object} state The overlay state.
   * @param {boolean} state.needFullRender Whether the overlay rendered on the previous draw.
   * @param {boolean} state.shouldBeRendered Whether it has to render on this one.
   * @returns {object}
   */
  function createStub({ needFullRender, shouldBeRendered }: { needFullRender: boolean, shouldBeRendered: boolean }) {
    const self = {
      needFullRender,
      shouldBeRendered: () => shouldBeRendered,
      updateMainScrollableElement: jest.fn(),
    };

    return self;
  }

  /**
   * Runs the real method with the base implementation reachable through `super`.
   *
   * @param {object} self The stub.
   * @param {string} phase The draw phase.
   */
  const update = (self: object, phase: 'before' | 'after') => {
    Object.setPrototypeOf(self, InlineEndOverlay.prototype);
    (self as InlineEndOverlay).updateStateOfRendering(phase);
  };

  it('should re-read the element that scrolls the columns when the overlay wakes up', () => {
    const self = createStub({ needFullRender: false, shouldBeRendered: true });

    update(self, 'before');

    expect(self.updateMainScrollableElement).toHaveBeenCalledTimes(1);
    expect(self.needFullRender).toBe(true);
  });

  it('should not re-read it while the overlay stays idle', () => {
    const self = createStub({ needFullRender: false, shouldBeRendered: false });

    update(self, 'before');

    expect(self.updateMainScrollableElement).not.toHaveBeenCalled();
    expect(self.needFullRender).toBe(false);
  });

  it('should not re-read it on every draw of an active overlay (ScrollSync keeps it fresh)', () => {
    const self = createStub({ needFullRender: true, shouldBeRendered: true });

    update(self, 'before');

    expect(self.updateMainScrollableElement).not.toHaveBeenCalled();
  });

  it('should not re-read it in the after phase', () => {
    const self = createStub({ needFullRender: false, shouldBeRendered: true });

    update(self, 'after');

    expect(self.updateMainScrollableElement).not.toHaveBeenCalled();
  });

  it('should extend the base behavior, not replace it', () => {
    expect(Object.getPrototypeOf(InlineEndOverlay.prototype)).toBe(Overlay.prototype);
  });
});

describe('InlineEndOverlay#getOverlayOffset', () => {
  /**
   * Builds a stub for a window-scrolled grid.
   *
   * @param {object} state The page.
   * @param {boolean} state.isRtl Whether the page is right-to-left.
   * @param {number} state.scroll The horizontal scroll magnitude.
   * @param {number} state.tableLeft Where the table's left edge is, in viewport coordinates.
   * @param {number} state.parentOffset The table's offset from the page start (LTR only).
   * @returns {object}
   */
  function createStub({ isRtl, scroll, tableLeft, parentOffset }:
    { isRtl: boolean, scroll: number, tableLeft: number, parentOffset: number }) {
    return {
      trimmingContainer: window,
      clone: { wtTable: { getTotalWidth: () => 120 } },
      isRtl: () => isRtl,
      getTableParentOffset: () => parentOffset,
      getScrollPosition: () => scroll,
      deps: {
        rootWindow: window,
        rootDocument: { documentElement: { clientLeft: 0 } },
        geometryReader: {
          clientWidth: () => 500,
          getBoundingClientRect: () => ({ left: tableLeft }),
        },
        getWtTable: () => ({ getTotalWidth: () => 1800, hider: document.createElement('div') }),
      },
    };
  }

  it('should measure from the scroll position in LTR, counting the page offset of the table', () => {
    // 80px of margin, 1800px of table, 500px viewport, scrolled 300px: the end is 80 + 1800 - 300 - 500 away.
    expect(run(InlineEndOverlay, 'getOverlayOffset',
      createStub({ isRtl: false, scroll: 300, tableLeft: 0, parentOffset: 80 }))).toBe(1080);
  });

  it('should be 0 in LTR once the end of the table is reached', () => {
    expect(run(InlineEndOverlay, 'getOverlayOffset',
      createStub({ isRtl: false, scroll: 1380, tableLeft: 0, parentOffset: 80 }))).toBe(0);
  });

  it('should be how far the table\'s left edge is past the viewport\'s left edge in RTL', () => {
    // The scroll position and the margin on the right (the inline start) must not matter in RTL:
    // only where the table's left edge really is.
    expect(run(InlineEndOverlay, 'getOverlayOffset',
      createStub({ isRtl: true, scroll: 100, tableLeft: -500, parentOffset: 80 }))).toBe(500);
    expect(run(InlineEndOverlay, 'getOverlayOffset',
      createStub({ isRtl: true, scroll: 580, tableLeft: -20, parentOffset: 80 }))).toBe(20);
  });

  it('should be 0 in RTL once the table\'s left edge is in view', () => {
    expect(run(InlineEndOverlay, 'getOverlayOffset',
      createStub({ isRtl: true, scroll: 600, tableLeft: 0, parentOffset: 80 }))).toBe(0);
    expect(run(InlineEndOverlay, 'getOverlayOffset',
      createStub({ isRtl: true, scroll: 600, tableLeft: 40, parentOffset: 80 }))).toBe(0);
  });

  it('should be 0 when an element scrolls the columns', () => {
    const stub = { ...createStub({ isRtl: true, scroll: 100, tableLeft: -500, parentOffset: 80 }),
      trimmingContainer: document.createElement('div') };

    expect(run(InlineEndOverlay, 'getOverlayOffset', stub)).toBe(0);
  });
});

describe('InlineStartOverlay#scrollTo with an end band', () => {
  /**
   * Builds a stub for scrolling to a column so it ends at the inline-end edge of the viewport.
   *
   * @param {object} state The grid.
   * @param {number} state.bandWidth The width of the end band.
   * @param {number} state.viewportWidth The viewport width (the end band is NOT subtracted from it).
   * @param {number} state.columnWidth The width of the target column.
   * @returns {object}
   */
  function createStub({ bandWidth, viewportWidth, columnWidth }:
    { bandWidth: number, viewportWidth: number, columnWidth: number }) {
    const holder = document.createElement('div');
    const setScrollPosition = jest.fn(() => true);
    const self = {
      wot: { cloneSource: null, wtTable: { holder } },
      wtSettings: { getSetting: (key: string) => ({ fixedColumnsStart: 2 }[key]) },
      deps: {
        rootDocument: document,
        geometryReader: { offsetWidth: () => 100, clientWidth: () => 100, getScrollbarWidth: () => 0 },
        getWtTable: () => ({ getColumnWidth: () => columnWidth }),
        getWtViewport: () => ({ getViewportWidth: () => viewportWidth }),
        getWtOverlays: () => ({ inlineEndOverlay: { getBandWidth: () => bandWidth } }),
      },
      getTableParentOffset: () => 0,
      // 60px columns: the sum of the first n columns is 60 * n.
      sumCellSizes: (from: number, to: number) => (to - from) * 60,
      setScrollPosition,
    };

    return self;
  }

  it('should align a column to the inline-end edge of the room the end band leaves', () => {
    const self = createStub({ bandWidth: 120, viewportWidth: 500, columnWidth: 60 });

    run(InlineStartOverlay, 'scrollTo', self, 9, true);

    // 10 columns (0..9) end at 600px; the room is 500 - 120 = 380px.
    expect(self.setScrollPosition).toHaveBeenCalledWith(600 - 380);
  });

  it('should fall back to the start-aligned scroll for a column wider than the room the band leaves', () => {
    // 250px fits the 500px viewport, but not the 200px that a 300px end band leaves.
    const self = createStub({ bandWidth: 300, viewportWidth: 500, columnWidth: 250 });

    run(InlineStartOverlay, 'scrollTo', self, 9, true);

    // Start-aligned: the width of columns 2..8 (after the 2 frozen ones) = 7 * 60.
    expect(self.setScrollPosition).toHaveBeenCalledWith(7 * 60);
  });

  it('should still align a column of the same width to the end when there is no band', () => {
    const self = createStub({ bandWidth: 0, viewportWidth: 500, columnWidth: 300 });

    run(InlineStartOverlay, 'scrollTo', self, 9, true);

    expect(self.setScrollPosition).toHaveBeenCalledWith(600 - 500);
  });
});
