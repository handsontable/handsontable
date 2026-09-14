import { refillDisagreesWithFrozenColumnSync, resolveRefillPaintWindow } from '../../../src/table/drawCycle';

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
   * assigned (first rendered row, first rendered column, rendered column count) and the TBODY the
   * previous pass rendered.
   *
   * @param {object} options Stub knobs.
   * @param {number} options.firstRenderedRow The band's first row after the refill's recompute.
   * @param {number} options.firstRenderedColumn The band's first column after the recompute.
   * @param {number} options.renderedColumnsCount The band's column count after the recompute.
   * @param {number} options.previousRows How many TRs the previous pass rendered.
   * @param {Array<[number, number, number]>} [options.rowSpans] `[visibleRow, cellIndex, rowSpan]` triples to stamp.
   * @returns {object}
   */
  function createTableStub({
    firstRenderedRow, firstRenderedColumn, renderedColumnsCount, previousRows, rowSpans = [],
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
      getFirstRenderedRow: () => firstRenderedRow,
      getFirstRenderedColumn: () => firstRenderedColumn,
      getRenderedColumnsCount: () => renderedColumnsCount,
    };
  }

  const previousColumns = { startColumn: 3, count: 4 };

  it('should window the paint to the appended rows when the start row and the column band are unchanged', () => {
    const table = createTableStub({
      firstRenderedRow: 10, firstRenderedColumn: 3, renderedColumnsCount: 4, previousRows: 5,
    });

    expect(resolveRefillPaintWindow(table, 10, 14, previousColumns)).toBe(5);
  });

  it('should repaint everything when the band start row moved', () => {
    const table = createTableStub({
      firstRenderedRow: 9, firstRenderedColumn: 3, renderedColumnsCount: 4, previousRows: 5,
    });

    expect(resolveRefillPaintWindow(table, 10, 14, previousColumns)).toBe(0);
  });

  it('should repaint everything when the column band start moved', () => {
    const table = createTableStub({
      firstRenderedRow: 10, firstRenderedColumn: 2, renderedColumnsCount: 4, previousRows: 5,
    });

    expect(resolveRefillPaintWindow(table, 10, 14, previousColumns)).toBe(0);
  });

  it('should repaint everything when the column band count moved', () => {
    const table = createTableStub({
      firstRenderedRow: 10, firstRenderedColumn: 3, renderedColumnsCount: 5, previousRows: 5,
    });

    expect(resolveRefillPaintWindow(table, 10, 14, previousColumns)).toBe(0);
  });

  it('should repaint everything when a cell above the window spans into the appended rows', () => {
    // A merged cell clamped to the previous band end must grow its rowspan into the new rows, and
    // its anchor TD sits above the window - only a full repaint reaches it.
    const table = createTableStub({
      firstRenderedRow: 10,
      firstRenderedColumn: 3,
      renderedColumnsCount: 4,
      previousRows: 5,
      rowSpans: [[2, 1, 3]],
    });

    expect(resolveRefillPaintWindow(table, 10, 14, previousColumns)).toBe(0);
  });

  it('should keep the window when the spanning cells end above the previous band end', () => {
    const table = createTableStub({
      firstRenderedRow: 10,
      firstRenderedColumn: 3,
      renderedColumnsCount: 4,
      previousRows: 5,
      rowSpans: [[0, 0, 2], [1, 3, 3]],
    });

    expect(resolveRefillPaintWindow(table, 10, 14, previousColumns)).toBe(5);
  });
});
