import {
  recyclesRowsOnClone,
  refillDisagreesWithFrozenColumnSync,
  resolveRefillPaintWindow,
} from '../../../src/table/drawCycle';
import {
  CLONE_BOTTOM,
  CLONE_BOTTOM_INLINE_START_CORNER,
  CLONE_INLINE_START,
  CLONE_TOP,
  CLONE_TOP_INLINE_START_CORNER,
} from '../../../src/overlay/constants';

describe('recyclesRowsOnClone', () => {
  it('should let only the inline-start clone recycle its rows', () => {
    expect(recyclesRowsOnClone(CLONE_INLINE_START)).toBe(true);
  });

  it('should keep the frozen-row clones and their corners on stationary elements', () => {
    [CLONE_TOP, CLONE_BOTTOM, CLONE_TOP_INLINE_START_CORNER, CLONE_BOTTOM_INLINE_START_CORNER].forEach((name) => {
      expect(recyclesRowsOnClone(name)).toBe(false);
    });
  });
});

describe('refillDisagreesWithFrozenColumnSync', () => {
  /**
   * Builds the narrow slice of a master table the guard reads: the `fixedColumnsStart` setting and a
   * viewport whose `createColumnsCalculator` records what it was called with and the `rowHeaderWidth`
   * memo it saw at call time.
   *
   * @param {object} [options] Stub knobs.
   * @param {number} [options.fixedColumnsStart=2] The frozen-columns setting.
   * @param {number|null} [options.proposedStartColumn=1] The `startColumn` the proposal reports (`null` = no band).
   * @param {number} [options.rowHeaderWidth=120] The memo value pass 1 left behind.
   * @returns {{ table: object, viewport: object }}
   */
  function createStubs({ fixedColumnsStart = 2, proposedStartColumn = 1, rowHeaderWidth = 120 } = {}) {
    const viewport = {
      rowHeaderWidth,
      calls: [],
      createColumnsCalculator(calculatorTypes, band, options) {
        viewport.calls.push({ calculatorTypes, band, options, rowHeaderWidthSeen: viewport.rowHeaderWidth });

        return {
          getResultsFor: () => (proposedStartColumn === null ? null : { startColumn: proposedStartColumn }),
        };
      },
    };
    const table = {
      wtSettings: { getSetting: key => ({ fixedColumnsStart })[key] },
      deps: { getWtViewport: () => viewport },
    };

    return { table, viewport };
  }

  it('should agree without touching the viewport when there are no frozen columns', () => {
    const { table, viewport } = createStubs({ fixedColumnsStart: 0 });

    expect(refillDisagreesWithFrozenColumnSync(table, { syncFrozenRows: false }, 'render')).toBe(false);
    expect(viewport.calls).toEqual([]);
    expect(viewport.rowHeaderWidth).toBe(120);
  });

  it('should reset the `rowHeaderWidth` memo before predicting the column band', () => {
    const { table, viewport } = createStubs({ rowHeaderWidth: 120 });

    refillDisagreesWithFrozenColumnSync(table, { syncFrozenRows: true }, 'render');

    // The prediction must measure the header the way `createCalculators(false)` will, not read the
    // width pass 1 memoized before this render moved it.
    expect(viewport.calls).toHaveLength(1);
    expect(viewport.calls[0].rowHeaderWidthSeen).toBeNaN();
    expect(viewport.calls[0].calculatorTypes).toEqual(['rendered']);
    expect(viewport.calls[0].band).toBe('render');
    expect(viewport.calls[0].options).toEqual({ proposeOnly: true });
  });

  it('should agree when the proposal starts past column 0 and the flag was captured `true`', () => {
    const { table } = createStubs({ proposedStartColumn: 3 });

    expect(refillDisagreesWithFrozenColumnSync(table, { syncFrozenRows: true }, 'render')).toBe(false);
  });

  it('should agree when the proposal starts at column 0 and the flag was captured `false`', () => {
    const { table } = createStubs({ proposedStartColumn: 0 });

    expect(refillDisagreesWithFrozenColumnSync(table, { syncFrozenRows: false }, 'render')).toBe(false);
  });

  it('should decline when the proposal starts at column 0 but the flag was captured `true`', () => {
    const { table } = createStubs({ proposedStartColumn: 0 });

    expect(refillDisagreesWithFrozenColumnSync(table, { syncFrozenRows: true }, 'render')).toBe(true);
  });

  it('should decline when the proposal starts past column 0 but the flag was captured `false`', () => {
    const { table } = createStubs({ proposedStartColumn: 4 });

    expect(refillDisagreesWithFrozenColumnSync(table, { syncFrozenRows: false }, 'render')).toBe(true);
  });

  it('should treat a proposal with no band as starting at column 0', () => {
    const { table } = createStubs({ proposedStartColumn: null });

    expect(refillDisagreesWithFrozenColumnSync(table, { syncFrozenRows: false }, 'render')).toBe(false);
    expect(refillDisagreesWithFrozenColumnSync(table, { syncFrozenRows: true }, 'render')).toBe(true);
  });
});

describe('resolveRefillPaintWindow', () => {
  /**
   * Builds the slice of a master table the window decision reads: the band the refill just
   * assigned (first rendered row, first rendered column, rendered column count), the host's
   * `renderEpoch` setting, and the TBODY the previous pass rendered.
   *
   * @param {object} options Stub knobs.
   * @param {number} options.firstRenderedRow The band's first row after the refill's recompute.
   * @param {number} options.firstRenderedColumn The band's first column after the recompute.
   * @param {number} options.renderedColumnsCount The band's column count after the recompute.
   * @param {number} options.previousRows How many TRs the previous pass rendered.
   * @param {number} [options.renderEpoch=7] The host's render epoch after the recompute.
   * @param {Array<[number, number, number]>} [options.rowSpans] `[visibleRow, cellIndex, rowSpan]` triples to stamp.
   * @returns {object}
   */
  function createTableStub({
    firstRenderedRow,
    firstRenderedColumn,
    renderedColumnsCount,
    previousRows,
    renderEpoch = 7,
    rowSpans = [],
  }) {
    const TBODY = document.createElement('tbody');

    for (let row = 0; row < previousRows; row++) {
      const TR = document.createElement('tr');

      for (let column = 0; column < renderedColumnsCount; column++) {
        TR.appendChild(document.createElement('td'));
      }
      TBODY.appendChild(TR);
    }
    rowSpans.forEach(([row, cell, rowSpan]) => {
      TBODY.children[row].children[cell].rowSpan = rowSpan;
    });

    return {
      TBODY,
      wtSettings: { getSetting: key => ({ renderEpoch })[key] },
      getFirstRenderedRow: () => firstRenderedRow,
      getFirstRenderedColumn: () => firstRenderedColumn,
      getRenderedColumnsCount: () => renderedColumnsCount,
    };
  }

  const previousBand = { rowsCount: 5, startColumn: 3, columnsCount: 4, renderEpoch: 7 };
  const agreeing = { firstRenderedRow: 10, firstRenderedColumn: 3, renderedColumnsCount: 4, previousRows: 5 };

  it('should window the paint to the appended rows when the start row, the column band and the epoch are unchanged', () => {
    const table = createTableStub(agreeing);

    expect(resolveRefillPaintWindow(table, 10, previousBand)).toBe(5);
  });

  it('should repaint everything when the band start row moved', () => {
    const table = createTableStub({ ...agreeing, firstRenderedRow: 9 });

    expect(resolveRefillPaintWindow(table, 10, previousBand)).toBe(0);
  });

  it('should repaint everything when the column band start moved', () => {
    const table = createTableStub({ ...agreeing, firstRenderedColumn: 2 });

    expect(resolveRefillPaintWindow(table, 10, previousBand)).toBe(0);
  });

  it('should repaint everything when the column band count moved', () => {
    const table = createTableStub({ ...agreeing, renderedColumnsCount: 5 });

    expect(resolveRefillPaintWindow(table, 10, previousBand)).toBe(0);
  });

  it('should repaint everything when the host advanced the render epoch since the draw started', () => {
    // A structural change from inside a render hook (a column reorder or hide) can keep the column
    // start and count while changing what every TD holds. `previousBand.renderEpoch` is the
    // draw-start snapshot, so a change made by the previous pass' own hooks is caught too.
    const table = createTableStub({ ...agreeing, renderEpoch: 8 });

    expect(resolveRefillPaintWindow(table, 10, previousBand)).toBe(0);
  });

  it('should repaint everything when the band renders a merged cell, wherever its span ends', () => {
    // MergeCells writes neighbor heights from pre-measure row heights in its after-renderer, so a
    // skipped row next to a merged block would keep a stale height; a merged grid takes no window.
    const spanEndingInsideTheBand = createTableStub({ ...agreeing, rowSpans: [[0, 0, 2]] });
    const spanReachingTheBandEnd = createTableStub({ ...agreeing, rowSpans: [[2, 1, 3]] });

    expect(resolveRefillPaintWindow(spanEndingInsideTheBand, 10, previousBand)).toBe(0);
    expect(resolveRefillPaintWindow(spanReachingTheBandEnd, 10, previousBand)).toBe(0);
  });

  it('should return the previous rendered row count itself, not a derivation of the calculator bounds', () => {
    const table = createTableStub(agreeing);

    expect(resolveRefillPaintWindow(table, 10, { ...previousBand, rowsCount: 9 })).toBe(9);
  });
});
