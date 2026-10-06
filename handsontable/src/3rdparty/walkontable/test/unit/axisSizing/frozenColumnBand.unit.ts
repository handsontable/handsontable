import { isFrozenColumnBandOutsideMasterBand } from '../../../src/axisSizing/oversizedRows';
import { refillDisagreesWithFrozenColumnSync } from '../../../src/table/drawCycle';
import Settings from '../../../src/settings';

/**
 * Builds the real settings accessor for a grid of 10 columns.
 *
 * @param {object} values The setting overrides (frozen band sizes).
 * @returns {Settings}
 */
function createSettings(values: Record<string, unknown>) {
  return new Settings({
    facade: () => {},
    data: () => '',
    table: {},
    totalRows: () => 5,
    totalColumns: () => 10,
    fixedColumnsStart: () => 0,
    fixedColumnsEnd: () => 0,
    ...values,
  });
}

describe('isFrozenColumnBandOutsideMasterBand', () => {
  it('should be false for a grid with no frozen columns', () => {
    expect(isFrozenColumnBandOutsideMasterBand(createSettings({}), 3, 5)).toBe(false);
  });

  describe('the end band', () => {
    const settings = () => createSettings({ fixedColumnsEnd: () => 2 });

    it('should be outside the master band when the band stops short of the last column', () => {
      expect(isFrozenColumnBandOutsideMasterBand(settings(), 0, 6)).toBe(true);
      expect(isFrozenColumnBandOutsideMasterBand(settings(), 0, 8)).toBe(true);
    });

    it('should be inside the master band when the band reaches the last column', () => {
      expect(isFrozenColumnBandOutsideMasterBand(settings(), 4, 9)).toBe(false);
    });

    it('should not depend on where the band starts', () => {
      expect(isFrozenColumnBandOutsideMasterBand(settings(), 0, 9)).toBe(false);
      expect(isFrozenColumnBandOutsideMasterBand(settings(), 7, 8)).toBe(true);
    });

    it('should use the end band clamped by the start band', () => {
      // Start band covers every column: the end band is 0, so nothing is frozen at the end. The start
      // band is outside the master band only when the band starts past column 0.
      const covered = createSettings({ fixedColumnsStart: () => 10, fixedColumnsEnd: () => 3 });

      expect(isFrozenColumnBandOutsideMasterBand(covered, 0, 5)).toBe(false);
    });
  });

  describe('the start band', () => {
    const settings = () => createSettings({ fixedColumnsStart: () => 2 });

    it('should be outside the master band as soon as the band starts past column 0', () => {
      expect(isFrozenColumnBandOutsideMasterBand(settings(), 1, 9)).toBe(true);
      expect(isFrozenColumnBandOutsideMasterBand(settings(), 0, 5)).toBe(false);
    });
  });

  it('should be true when only one of the two bands is out of the master band', () => {
    const both = createSettings({ fixedColumnsStart: () => 2, fixedColumnsEnd: () => 2 });

    expect(isFrozenColumnBandOutsideMasterBand(both, 0, 9)).toBe(false);
    expect(isFrozenColumnBandOutsideMasterBand(both, 1, 9)).toBe(true);
    expect(isFrozenColumnBandOutsideMasterBand(both, 0, 7)).toBe(true);
  });
});

describe('refillDisagreesWithFrozenColumnSync with fixedColumnsEnd', () => {
  /**
   * Builds the slice of a master table the guard reads, on the real settings accessor.
   *
   * @param {object} options Stub knobs.
   * @param {object} options.values The settings overrides.
   * @param {object|null} options.proposal The `startColumn` / `endColumn` the proposal reports.
   * @returns {{ table: object, calls: number }}
   */
  function createStubs({ values, proposal }: {
    values: Record<string, unknown>,
    proposal: { startColumn: number | null, endColumn: number | null } | null
  }) {
    const viewport = {
      rowHeaderWidth: 1,
      calls: 0,
      createColumnsCalculator() {
        viewport.calls += 1;

        return { getResultsFor: () => proposal };
      },
    };
    const table = {
      wtSettings: createSettings(values),
      deps: { getWtViewport: () => viewport },
    };

    return { table, viewport };
  }

  const refill = (table: unknown, syncFrozenRows: boolean) => refillDisagreesWithFrozenColumnSync(
    table as Parameters<typeof refillDisagreesWithFrozenColumnSync>[0],
    { syncFrozenRows } as Parameters<typeof refillDisagreesWithFrozenColumnSync>[1],
    'render' as unknown as Parameters<typeof refillDisagreesWithFrozenColumnSync>[2]
  );

  it('should not skip the guard when only the end band is frozen', () => {
    const { table, viewport } = createStubs({
      values: { fixedColumnsEnd: () => 2 },
      proposal: { startColumn: 0, endColumn: 9 },
    });

    refill(table, false);

    expect(viewport.calls).toBe(1);
  });

  it('should skip the guard (and stay out of the viewport) with no frozen columns at all', () => {
    const { table, viewport } = createStubs({ values: {}, proposal: { startColumn: 0, endColumn: 9 } });

    expect(refill(table, false)).toBe(false);
    expect(viewport.calls).toBe(0);
  });

  it('should decline when the proposal leaves the end band out but the flag was captured false', () => {
    const { table } = createStubs({
      values: { fixedColumnsEnd: () => 2 },
      proposal: { startColumn: 0, endColumn: 6 },
    });

    expect(refill(table, false)).toBe(true);
  });

  it('should agree when the proposal leaves the end band out and the flag was captured true', () => {
    const { table } = createStubs({
      values: { fixedColumnsEnd: () => 2 },
      proposal: { startColumn: 0, endColumn: 6 },
    });

    expect(refill(table, true)).toBe(false);
  });

  it('should decline when the proposal reaches the last column but the flag was captured true', () => {
    const { table } = createStubs({
      values: { fixedColumnsEnd: () => 2 },
      proposal: { startColumn: 3, endColumn: 9 },
    });

    expect(refill(table, true)).toBe(true);
  });
});
