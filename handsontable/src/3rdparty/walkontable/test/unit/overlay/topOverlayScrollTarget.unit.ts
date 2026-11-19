// The overlay barrel goes first: the table modules and the overlays import each other, and only this entry
// point resolves that cycle.
import { TopOverlay } from 'walkontable/overlay';

const ROW_HEIGHT = 29;
const TOTAL_ROWS = 100;
const VIEWPORT_HEIGHT = 300;

/**
 * `TopOverlay#scrollTo`, run on a stub `this` that carries only the fields it reads, so no DOM layout and no
 * grid are built. The geometry it produces is pinned in `tests/e2e/fixed-rows-bottom-line.spec.ts`.
 */
describe('TopOverlay#scrollTo', () => {
  /**
   * Builds the stub for a grid whose AutoRowSize heights carry the first-row pixel: no column header, an
   * external row calculator, and `fixedRowsBottom` frozen bottom rows.
   *
   * @param {object} [options] The grid shape.
   * @param {number} [options.fixedRowsBottom=1] The number of frozen bottom rows.
   * @param {number} [options.missingPixel=0] What the viewport reports as missing from the sum.
   * @returns {object}
   */
  function createStub({ fixedRowsBottom = 1, missingPixel = 0 } = {}) {
    const getFirstRowPixelMissingFrom = jest.fn(() => missingPixel);
    const settings: Record<string, unknown> = {
      fixedRowsBottom,
      fixedRowsTop: 0,
      totalRows: TOTAL_ROWS,
      externalRowCalculator: true,
      columnHeaders: [],
    };
    const viewport = { getViewportHeight: () => VIEWPORT_HEIGHT, getFirstRowPixelMissingFrom };
    const setScrollPosition = jest.fn(() => true);

    return {
      getFirstRowPixelMissingFrom,
      setScrollPosition,
      self: {
        wot: { cloneSource: null, wtTable: { holder: {} }, wtViewport: viewport },
        wtSettings: { getSetting: (key: string) => settings[key] },
        deps: {
          geometryReader: { offsetHeight: () => 1, clientHeight: () => 1, getScrollbarWidth: () => 0 },
          getWtTable: () => ({ getRowHeight: () => ROW_HEIGHT }),
          getWtViewport: () => viewport,
          rootDocument: {},
        },
        getTableParentOffset: () => 0,
        sumCellSizes: (from: number, to: number) => (to - from) * ROW_HEIGHT,
        setScrollPosition,
      },
    };
  }

  const scrollTo = (self: object, row: number, bottomEdge: boolean) =>
    (TopOverlay.prototype as unknown as { scrollTo(this: object, row: number, bottom: boolean): boolean })
      .scrollTo.call(self, row, bottomEdge);

  it('should end a bottom-edge target on the sum of the rows above it, less the room the viewport has', () => {
    const { self, setScrollPosition } = createStub();

    scrollTo(self, 40, true);

    // 41 rows to the bottom of row 40, minus the viewport without the one frozen bottom row.
    expect(setScrollPosition).toHaveBeenCalledWith((41 * ROW_HEIGHT) - (VIEWPORT_HEIGHT - ROW_HEIGHT));
  });

  it('should ask the viewport for the pixel the sum over [0, row + 1) leaves out', () => {
    const { self, getFirstRowPixelMissingFrom } = createStub();

    scrollTo(self, 40, true);

    expect(getFirstRowPixelMissingFrom).toHaveBeenCalledWith(0, 41);
  });

  it('should move a bottom-edge target by the pixel the viewport reports missing', () => {
    const withoutPixel = createStub({ missingPixel: 0 });
    const withPixel = createStub({ missingPixel: 1 });

    scrollTo(withoutPixel.self, 40, true);
    scrollTo(withPixel.self, 40, true);

    const [[withoutTarget]] = withoutPixel.setScrollPosition.mock.calls as unknown as number[][];
    const [[withTarget]] = withPixel.setScrollPosition.mock.calls as unknown as number[][];

    expect(withTarget - withoutTarget).toBe(1);
  });

  it('should add the pixel on top of the extra pixel a grid without bottom rows keeps', () => {
    const { self, setScrollPosition } = createStub({ fixedRowsBottom: 0, missingPixel: 1 });

    scrollTo(self, 40, true);

    // The sum, the pixel the sum left out, and the one extra pixel above the viewport edge.
    expect(setScrollPosition).toHaveBeenCalledWith((41 * ROW_HEIGHT) + 1 - VIEWPORT_HEIGHT + 1);
  });

  it('should not ask for the pixel when the target is the top edge', () => {
    const { self, getFirstRowPixelMissingFrom, setScrollPosition } = createStub({ missingPixel: 1 });

    scrollTo(self, 40, false);

    expect(getFirstRowPixelMissingFrom).not.toHaveBeenCalled();
    expect(setScrollPosition).toHaveBeenCalledWith(40 * ROW_HEIGHT);
  });
});
