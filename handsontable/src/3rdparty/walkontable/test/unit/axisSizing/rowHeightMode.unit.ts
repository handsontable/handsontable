import RowUtils from '../../../src/axisSizing/rowUtils';
import { DefaultRowSizeSource, DefaultColumnSizeSource } from '../../../src/axisSizing/defaultSizeSource';
import type { default as Settings } from '../../../src/settings';
import type { TableDeps } from '../../../src/table';

/**
 * A fake `Settings` whose `getSetting(key, ...args)` returns a value from a map. A function value is
 * called with the args (mirrors the per-index size callbacks); anything else is returned as-is.
 *
 * @param {Record<string, unknown>} values The settings values keyed by name.
 * @returns {Settings}
 */
function fakeSettings(values: Record<string, unknown>): Settings {
  return {
    getSetting(key: string, ...args: unknown[]): unknown {
      const value = values[key];

      return typeof value === 'function' ? value(...args) : value;
    },
  } as unknown as Settings;
}

/**
 * Builds `TableDeps` sufficient for `RowUtils`: the size sources, the settings, and the viewport
 * getter the utils reach for the oversized merge.
 *
 * @param {object} config The fake configuration.
 * @param {Settings} config.wtSettings The fake settings.
 * @param {Record<number, number>} [config.oversizedRows] Oversized row heights by source index.
 * @returns {TableDeps}
 */
function fakeDeps(config: { wtSettings: Settings; oversizedRows?: Record<number, number> }): TableDeps {
  const viewport = { oversizedRows: config.oversizedRows ?? {}, oversizedColumnHeaders: {} };

  return {
    wtSettings: config.wtSettings,
    rowSizeSource: new DefaultRowSizeSource(config.wtSettings),
    columnSizeSource: new DefaultColumnSizeSource(config.wtSettings),
    getWtViewport: () => viewport,
    getWtTable: () => ({ columnFilter: null }),
  } as unknown as TableDeps;
}

describe('row height mode', () => {
  describe('RowUtils.isExact', () => {
    it('should be false when the mode setting is absent (a bare engine keeps the floor semantics)', () => {
      const deps = fakeDeps({ wtSettings: fakeSettings({ rowHeight: () => 20 }) });

      expect(new RowUtils(deps).isExact(3)).toBe(false);
    });

    it('should be false in the `min` mode', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ rowHeight: () => 20, rowHeightMode: () => 'min' }),
      });

      expect(new RowUtils(deps).isExact(3)).toBe(false);
    });

    it('should be true in the `exact` mode when the row has a provided height', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ rowHeight: () => 20, rowHeightMode: () => 'exact' }),
      });

      expect(new RowUtils(deps).isExact(3)).toBe(true);
    });

    it('should be false in the `exact` mode when the row has no provided height', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ rowHeight: () => undefined, rowHeightMode: () => 'exact' }),
      });

      expect(new RowUtils(deps).isExact(3)).toBe(false);
    });

    it('should be false in the `exact` mode when the provided height is `0` (a hidden row)', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ rowHeight: () => 0, rowHeightMode: () => 'exact' }),
      });

      expect(new RowUtils(deps).isExact(3)).toBe(false);
    });

    it('should consult the mode per row', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({
          rowHeight: () => 20,
          rowHeightMode: (row: number) => (row === 1 ? 'exact' : 'min'),
        }),
      });
      const rowUtils = new RowUtils(deps);

      expect(rowUtils.isExact(0)).toBe(false);
      expect(rowUtils.isExact(1)).toBe(true);
      expect(rowUtils.isExact(2)).toBe(false);
    });
  });

  describe('RowUtils.getHeight in the `exact` mode', () => {
    it('should return the provided height even when a larger oversized height was measured', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ rowHeight: () => 20, rowHeightMode: () => 'exact' }),
        oversizedRows: { 3: 60 },
      });

      expect(new RowUtils(deps).getHeight(3)).toBe(20);
    });

    it('should keep the oversized height for a row without a provided height', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ rowHeight: () => undefined, rowHeightMode: () => 'exact' }),
        oversizedRows: { 3: 60 },
      });

      expect(new RowUtils(deps).getHeight(3)).toBe(60);
    });

    it('should keep the oversized height for a row whose provided height is `0`', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ rowHeight: () => 0, rowHeightMode: () => 'exact' }),
        oversizedRows: { 3: 60 },
      });

      expect(new RowUtils(deps).getHeight(3)).toBe(60);
    });
  });

  describe('RowUtils.getHeightByOverlayName in the `exact` mode', () => {
    it('should return the per-overlay provided height even when a larger oversized height was measured', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({
          rowHeight: () => 20,
          rowHeightByOverlayName: (...args: unknown[]) => (args[1] === 'top' ? 25 : 20),
          rowHeightMode: () => 'exact',
        }),
        oversizedRows: { 3: 60 },
      });
      const rowUtils = new RowUtils(deps);

      expect(rowUtils.getHeightByOverlayName(3, 'top')).toBe(25);
      expect(rowUtils.getHeightByOverlayName(3, 'master')).toBe(20);
    });

    it('should still merge the oversized height in the `min` mode', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({
          rowHeight: () => 20,
          rowHeightByOverlayName: () => 20,
          rowHeightMode: () => 'min',
        }),
        oversizedRows: { 3: 60 },
      });

      expect(new RowUtils(deps).getHeightByOverlayName(3, 'master')).toBe(60);
    });
  });
});
