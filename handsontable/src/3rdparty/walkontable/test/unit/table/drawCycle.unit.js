import { refillDisagreesWithFrozenColumnSync } from '../../../src/table/drawCycle';

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
