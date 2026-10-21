import {
  toTotalRowHeaderWidth,
  measureWorkspaceHeight,
  measureWorkspaceWidth,
  workspaceSize,
} from 'walkontable/viewport/workspaceSize';
import type { Viewport } from 'walkontable/viewport/viewport';

/**
 * `modifyRowHeaderWidth` may answer with one number or with one width per row header level, and the
 * viewport needs the width of the whole header block either way.
 *
 * The array has to be read exactly the way `ColumnUtils#calculateWidths` reads it, because that is
 * the other consumer of the same value and it is what sizes the `col` elements. Any disagreement
 * between the two leaves the viewport and the overlays working from different totals for the same
 * header, which is the misalignment this whole hook shape exists to avoid.
 */
describe('toTotalRowHeaderWidth', () => {
  const DEFAULT_WIDTH = 50;

  it('should pass a single number through', () => {
    expect(toTotalRowHeaderWidth(120, 1, DEFAULT_WIDTH)).toBe(120);
    expect(toTotalRowHeaderWidth(120, 3, DEFAULT_WIDTH)).toBe(120);
  });

  it('should add the levels of an array up', () => {
    expect(toTotalRowHeaderWidth([60, 80], 2, DEFAULT_WIDTH)).toBe(140);
  });

  it('should count only the levels the draw renders', () => {
    // A handler that answers for more levels than are drawn must not inflate the block by the
    // surplus - `ColumnUtils` never reads past the rendered count either.
    expect(toTotalRowHeaderWidth([60, 80, 200], 2, DEFAULT_WIDTH)).toBe(140);
  });

  it('should fall back to the default width for a level the answer does not cover', () => {
    // Short array, and a hole in the middle: both are the same case, and `ColumnUtils` substitutes
    // the default column width for each. Summing the array as given would under-report by 50 here.
    expect(toTotalRowHeaderWidth([60], 2, DEFAULT_WIDTH)).toBe(110);
    expect(toTotalRowHeaderWidth([60, null], 2, DEFAULT_WIDTH)).toBe(110);
    expect(toTotalRowHeaderWidth([60, undefined], 2, DEFAULT_WIDTH)).toBe(110);
  });

  it('should report nothing usable as null, so the caller keeps its own width', () => {
    expect(toTotalRowHeaderWidth(0, 1, DEFAULT_WIDTH)).toBe(null);
    expect(toTotalRowHeaderWidth(NaN, 1, DEFAULT_WIDTH)).toBe(null);
    expect(toTotalRowHeaderWidth(undefined, 1, DEFAULT_WIDTH)).toBe(null);
    // No levels drawn: an array cannot add up to anything.
    expect(toTotalRowHeaderWidth([60, 80], 0, DEFAULT_WIDTH)).toBe(null);
  });
});

/**
 * Builds the smallest viewport double `measureWorkspaceHeight` reads: the vertical axis owner on the
 * top overlay, a geometry reader, and the `layoutReservedHeight` setting.
 */
function createViewport({
  trimmingContainer,
  containerClientHeight,
  reserved,
}: {
  trimmingContainer: HTMLElement | Window,
  containerClientHeight: number,
  reserved: (container: HTMLElement) => number,
}): Viewport {
  const documentClientHeight = 900;

  return {
    deps: {
      rootDocument: document,
      rootWindow: window,
      geometryReader: {
        clientHeight: (element: HTMLElement) =>
          (element === document.documentElement ? documentClientHeight : containerClientHeight),
        outerHeight: () => containerClientHeight,
      },
      getTopOverlay: () => ({ trimmingContainer }),
    },
    wtSettings: {
      getSetting: (key: string, container: HTMLElement) =>
        (key === 'layoutReservedHeight' ? reserved(container) : undefined),
    },
  } as unknown as Viewport;
}

/**
 * The vertical axis owner's box is shared with the host's layout slots (the pagination bar, the
 * sheets bar, the license notification inside a scrollable ancestor). The host reports how much of
 * that box the slots take through `layoutReservedHeight`, and the table gets the rest (DEV-2848).
 */
describe('measureWorkspaceHeight', () => {
  it('should subtract the height the host reserves inside the axis owner', () => {
    const container = document.createElement('div');
    const viewport = createViewport({
      trimmingContainer: container,
      containerClientHeight: 300,
      reserved: () => 38,
    });

    expect(measureWorkspaceHeight(viewport)).toBe(262);
  });

  it('should hand the resolved axis owner to the reservation', () => {
    // The host decides per owner: only slots the owner CONTAINS count, so it needs the element.
    const container = document.createElement('div');
    const seen: HTMLElement[] = [];
    const viewport = createViewport({
      trimmingContainer: container,
      containerClientHeight: 300,
      reserved: (element) => {
        seen.push(element);

        return 0;
      },
    });

    measureWorkspaceHeight(viewport);

    expect(seen).toEqual([container]);
  });

  it('should leave a window-owned axis alone', () => {
    // The page scrolls the rows; a slot inside the page takes its own space and reserves nothing.
    const viewport = createViewport({
      trimmingContainer: window,
      containerClientHeight: 300,
      reserved: () => {
        throw new Error('must not be asked in window mode');
      },
    });

    expect(measureWorkspaceHeight(viewport)).toBe(900);
  });

  it('should never report less than one pixel', () => {
    // A bar taller than the owner's box must not collapse the viewport to nothing (or below).
    const container = document.createElement('div');
    const viewport = createViewport({
      trimmingContainer: container,
      containerClientHeight: 30,
      reserved: () => 38,
    });

    expect(measureWorkspaceHeight(viewport)).toBe(1);
  });

  it('should keep the zero-height owner falling back to the window height (#3119)', () => {
    const container = document.createElement('div');
    const viewport = createViewport({
      trimmingContainer: container,
      containerClientHeight: 0,
      reserved: () => 38,
    });

    expect(measureWorkspaceHeight(viewport)).toBe(900);
  });
});

/**
 * The horizontal axis owner is the window on a grid with no width, but the window is not always what
 * scrolls the columns: an ancestor that clips only the vertical axis leaves the holder to scroll them
 * (the reverse split). The workspace is then the holder's own width, not the page's.
 */
describe('measureWorkspaceWidth', () => {
  const DOCUMENT_CLIENT_WIDTH = 1000;
  const HOLDER_OFFSET_WIDTH = 800;

  /**
   * Builds the viewport double for a grid with no width whose columns are wider than the holder.
   *
   * @param {boolean} windowScrolls Whether the window, not the holder, scrolls the columns.
   * @returns {Viewport}
   */
  function createWindowOwnedViewport(windowScrolls: boolean): Viewport {
    const holder = document.createElement('div');

    return {
      deps: {
        rootDocument: document,
        rootWindow: window,
        geometryReader: {
          offsetWidth: (element: HTMLElement) => (element === holder ? HOLDER_OFFSET_WIDTH : NaN),
          clientWidth: (element: HTMLElement) => (element === document.documentElement ? DOCUMENT_CLIENT_WIDTH : NaN),
        },
        getInlineStartOverlay: () => ({
          trimmingContainer: window,
          isScrolledByWindow: () => windowScrolls,
        }),
      },
      wtTable: { holder },
      wtSettings: { getSetting: () => 5000 },
      getRowHeaderWidth: () => 50,
      sumColumnWidths: () => 5000,
    } as unknown as Viewport;
  }

  it('should measure the page when the window scrolls the columns', () => {
    expect(measureWorkspaceWidth(createWindowOwnedViewport(true))).toBe(DOCUMENT_CLIENT_WIDTH);
  });

  it('should measure the holder when the holder scrolls the columns', () => {
    expect(measureWorkspaceWidth(createWindowOwnedViewport(false))).toBe(HOLDER_OFFSET_WIDTH);
  });
});

/**
 * `isHorizontallyScrollableByWindow()` answers "does the window scroll the columns", which is the owner of the
 * horizontal axis being the window and the window, not the holder, doing the scrolling. In the reverse split
 * (an ancestor that clips only the vertical axis, or `preventOverflow: 'vertical'`) the window owns the axis
 * while the holder scrolls the columns, and the answer must be `false`.
 */
describe('Viewport#isHorizontallyScrollableByWindow', () => {
  /**
   * Runs the predicate on a viewport double carrying only the inline-start overlay it reads.
   *
   * @param {boolean} windowOwnsAxis Whether the window is the inline-start overlay's trimming container.
   * @param {boolean} windowScrolls Whether the window, not the holder, scrolls the columns.
   * @returns {boolean}
   */
  function ask(windowOwnsAxis: boolean, windowScrolls: boolean): boolean {
    const rootWindow = {};
    const viewport = {
      deps: {
        rootWindow,
        getInlineStartOverlay: () => ({
          trimmingContainer: windowOwnsAxis ? rootWindow : {},
          isScrolledByWindow: () => windowScrolls,
        }),
      },
    };

    return workspaceSize.isHorizontallyScrollableByWindow.call(viewport as unknown as Viewport);
  }

  it('should be true when the window owns the axis and scrolls the columns', () => {
    expect(ask(true, true)).toBe(true);
  });

  it('should be false when the window owns the axis but the holder scrolls the columns', () => {
    expect(ask(true, false)).toBe(false);
  });

  it('should be false when an element owns the axis', () => {
    expect(ask(false, false)).toBe(false);
    expect(ask(false, true)).toBe(false);
  });
});
