import Viewport from 'walkontable/viewport/viewport';

const ROW_HEIGHT = 29;
const TOTAL_ROWS = 100;

/**
 * Builds a viewport over a grid whose heights come from an external calculator, the way AutoRowSize
 * supplies them: every row is `ROW_HEIGHT`, and the row that is first rendered NOW is one pixel taller
 * because it draws the grid's `border-top`. The row-height cache keeps what it read when it was built.
 *
 * @param {object} [options] The grid shape.
 * @param {boolean} [options.externalRowCalculator] Whether the heights come from an external calculator.
 * @param {number} [options.columnHeaderLevels] How many column header rows the grid renders.
 * @returns {object} The viewport and a handle that moves the band.
 */
function createViewport({ externalRowCalculator = true, columnHeaderLevels = 0 } = {}) {
  const state = { firstRenderedRow: 0 };
  const wtSettings = {
    getSetting(key: string) {
      switch (key) {
        case 'totalRows':
          return TOTAL_ROWS;
        case 'externalRowCalculator':
          return externalRowCalculator;
        case 'columnHeaders':
          return new Array(columnHeaderLevels).fill(() => {});
        default:
          return undefined;
      }
    },
  };
  const wtTable = {
    getFirstRenderedRow: () => state.firstRenderedRow,
    // AutoRowSize adds the pixel only where the first body row draws a top border: with no column header.
    getRowHeight: (row: number) => ROW_HEIGHT + (
      externalRowCalculator && columnHeaderLevels === 0 && row === state.firstRenderedRow ? 1 : 0),
  };
  const viewport = new Viewport({
    wot: {},
    rootDocument: {},
    rootWindow: {},
    geometryReader: {},
    rowSizeSource: { isUniform: () => false, getDefaultSize: () => ROW_HEIGHT },
    columnSizeSource: { isUniform: () => true, getDefaultSize: () => 50 },
    layoutDeps: {},
    wtSettings,
    eventManager: { addEventListener: () => {} },
    wtTable,
  } as never);

  return {
    viewport,
    /**
     * Moves the first rendered row without rebuilding the cache, the way a scroll draw does.
     *
     * @param {number} row The new first rendered row.
     */
    renderBandFrom(row: number) {
      state.firstRenderedRow = row;
    },
  };
}

describe('Viewport#getFirstRowPixelMissingFrom', () => {
  it('should be 0 when the first rendered row is inside the summed range', () => {
    const { viewport, renderBandFrom } = createViewport();

    renderBandFrom(30);

    expect(viewport.getFirstRowPixelMissingFrom(0, 41)).toBe(0);
    expect(viewport.getFirstRowPixelMissingFrom(30, 41)).toBe(0);
  });

  it('should be 1 when the first rendered row is outside the summed range', () => {
    const { viewport, renderBandFrom } = createViewport();

    renderBandFrom(50);

    expect(viewport.getFirstRowPixelMissingFrom(0, 41)).toBe(1);
    // The range end is exclusive.
    expect(viewport.getFirstRowPixelMissingFrom(0, 50)).toBe(1);
  });

  it('should be 1 before anything is rendered', () => {
    const { viewport, renderBandFrom } = createViewport();

    renderBandFrom(-1);

    expect(viewport.getFirstRowPixelMissingFrom(0, 41)).toBe(1);
  });

  it('should make the sum the same for every band', () => {
    const { viewport, renderBandFrom } = createViewport();
    const sums = [0, 10, 31, 50, 90].map((first) => {
      renderBandFrom(first);

      return viewport.sumRowHeights(0, 41) + viewport.getFirstRowPixelMissingFrom(0, 41);
    });

    expect(new Set(sums).size).toBe(1);
    expect(sums[0]).toBe((41 * ROW_HEIGHT) + 1);
  });

  it('should be 0 when a column header owns the top gridline', () => {
    const { viewport, renderBandFrom } = createViewport({ columnHeaderLevels: 1 });

    renderBandFrom(50);

    expect(viewport.getFirstRowPixelMissingFrom(0, 41)).toBe(0);
  });

  it('should be 0 when the engine measures the rows itself', () => {
    const { viewport, renderBandFrom } = createViewport({ externalRowCalculator: false });

    renderBandFrom(50);

    expect(viewport.getFirstRowPixelMissingFrom(0, 41)).toBe(0);
  });
});

describe('Viewport#getRowBandStartOffset', () => {
  it('should take the pixel baked at the build-time first row out of a band that starts below it', () => {
    const { viewport, renderBandFrom } = createViewport();

    // The cache is built while row 30 is the first rendered one, so it holds the pixel at row 30.
    renderBandFrom(30);
    viewport.rowHeightCache.ensureBuilt();
    // The band then moves to row 50 and the cache is not rebuilt.
    renderBandFrom(50);

    expect(viewport.rowHeightCache.getOffset(50)).toBe((50 * ROW_HEIGHT) + 1);
    expect(viewport.getRowBandStartOffset(50)).toBe(50 * ROW_HEIGHT);
  });

  it('should leave the offset of a band that starts at or above the build-time first row', () => {
    const { viewport, renderBandFrom } = createViewport();

    renderBandFrom(30);
    viewport.rowHeightCache.ensureBuilt();

    expect(viewport.getRowBandStartOffset(30)).toBe(30 * ROW_HEIGHT);
    expect(viewport.getRowBandStartOffset(20)).toBe(20 * ROW_HEIGHT);
  });

  it('should leave the offset alone when the engine measures the rows itself', () => {
    const { viewport, renderBandFrom } = createViewport({ externalRowCalculator: false });

    renderBandFrom(30);
    viewport.rowHeightCache.ensureBuilt();

    expect(viewport.getRowBandStartOffset(50)).toBe(50 * ROW_HEIGHT);
  });

  it('should leave the offset alone when a column header owns the top gridline', () => {
    const { viewport, renderBandFrom } = createViewport({ columnHeaderLevels: 2 });

    renderBandFrom(30);
    viewport.rowHeightCache.ensureBuilt();

    expect(viewport.getRowBandStartOffset(50)).toBe(50 * ROW_HEIGHT);
  });
});
