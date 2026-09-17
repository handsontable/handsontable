import { toTotalRowHeaderWidth, measureWorkspaceHeight } from 'walkontable/viewport/workspaceSize';
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
