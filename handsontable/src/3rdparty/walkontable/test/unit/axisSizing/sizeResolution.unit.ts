import RowUtils from '../../../src/axisSizing/rowUtils';
import ColumnUtils from '../../../src/axisSizing/columnUtils';
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
 * Builds `TableDeps` sufficient for `RowUtils`/`ColumnUtils`: the two size sources, the settings, and
 * the volatile-object getters the utils reach for the oversized merge and the column filter.
 *
 * @param {object} config The fake configuration.
 * @param {Settings} config.wtSettings The fake settings.
 * @param {Record<number, number>} [config.oversizedRows] Oversized row heights by source index.
 * @param {Record<number, number>} [config.oversizedColumnHeaders] Oversized header heights by level.
 * @returns {TableDeps}
 */
function fakeDeps(config: {
  wtSettings: Settings;
  oversizedRows?: Record<number, number>;
  oversizedColumnHeaders?: Record<number, number>;
}): TableDeps {
  const viewport = {
    oversizedRows: config.oversizedRows ?? {},
    oversizedColumnHeaders: config.oversizedColumnHeaders ?? {},
  };

  return {
    wtSettings: config.wtSettings,
    rowSizeSource: new DefaultRowSizeSource(config.wtSettings),
    columnSizeSource: new DefaultColumnSizeSource(config.wtSettings),
    getWtViewport: () => viewport,
    getWtTable: () => ({ columnFilter: null }),
  } as unknown as TableDeps;
}

describe('size resolution (characterization)', () => {
  describe('RowUtils.getHeight', () => {
    it('should return the provided row height when the setting supplies one', () => {
      const deps = fakeDeps({ wtSettings: fakeSettings({ rowHeight: () => 42 }) });

      expect(new RowUtils(deps).getHeight(3)).toBe(42);
    });

    it('should return undefined when neither a setting nor an oversized height exists', () => {
      const deps = fakeDeps({ wtSettings: fakeSettings({ rowHeight: () => undefined }) });

      expect(new RowUtils(deps).getHeight(3)).toBe(undefined);
    });

    it('should return the oversized height when no setting height exists', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ rowHeight: () => undefined }),
        oversizedRows: { 3: 60 },
      });

      expect(new RowUtils(deps).getHeight(3)).toBe(60);
    });

    it('should return the larger of the setting height and the oversized height', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ rowHeight: () => 20 }),
        oversizedRows: { 3: 60 },
      });

      expect(new RowUtils(deps).getHeight(3)).toBe(60);
    });

    it('should keep the setting height when it is larger than the oversized height', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ rowHeight: () => 80 }),
        oversizedRows: { 3: 60 },
      });

      expect(new RowUtils(deps).getHeight(3)).toBe(80);
    });
  });

  describe('RowUtils.getHeightByOverlayName', () => {
    it('should read the per-overlay height and merge the oversized height', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({
          rowHeightByOverlayName: (index: number, overlay: string) => (overlay === 'top' ? 25 : 10),
        }),
        oversizedRows: { 2: 55 },
      });

      expect(new RowUtils(deps).getHeightByOverlayName(2, 'top')).toBe(55);
      expect(new RowUtils(deps).getHeightByOverlayName(9, 'top')).toBe(25);
    });
  });

  describe('ColumnUtils.getWidth', () => {
    it('should return the provided column width when the setting supplies one', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ columnWidth: () => 120, defaultColumnWidth: 50 }),
      });

      expect(new ColumnUtils(deps).getWidth(1)).toBe(120);
    });

    it('should fall back to the default width when no width is provided', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ columnWidth: () => undefined, defaultColumnWidth: 50 }),
      });

      expect(new ColumnUtils(deps).getWidth(1)).toBe(50);
    });

    it('should fall back to the default width when the provided width is 0 (|| not ??)', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ columnWidth: () => 0, defaultColumnWidth: 50 }),
      });

      expect(new ColumnUtils(deps).getWidth(1)).toBe(50);
    });
  });

  describe('ColumnUtils.getHeaderHeight', () => {
    it('should return the default row height when no oversized header exists', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({ stylesHandler: { getDefaultRowHeight: () => 23 } }),
      });

      expect(new ColumnUtils(deps).getHeaderHeight(0)).toBe(23);
    });

    it('should return the larger of the default row height and the columnHeaderHeight setting', () => {
      // Post-S13: the provided header height arrives through the `columnHeaderHeight` setting funnel
      // (option / `modifyColumnHeaderHeight` hook / render-size probe), not `oversizedColumnHeaders`.
      const deps = fakeDeps({
        wtSettings: fakeSettings({
          stylesHandler: { getDefaultRowHeight: () => 23 },
          columnHeaderHeight: 40,
        }),
      });

      expect(new ColumnUtils(deps).getHeaderHeight(0)).toBe(40);
    });

    it('should read the columnHeaderHeight setting per level when it is an array', () => {
      const deps = fakeDeps({
        wtSettings: fakeSettings({
          stylesHandler: { getDefaultRowHeight: () => 23 },
          columnHeaderHeight: [40, undefined],
        }),
      });

      expect(new ColumnUtils(deps).getHeaderHeight(0)).toBe(40);
      expect(new ColumnUtils(deps).getHeaderHeight(1)).toBe(23); // falls back to the default
    });
  });

  describe('uniform predicates', () => {
    it('should report row uniformity straight from the rowHeightsUniform setting', () => {
      const source = new DefaultRowSizeSource(fakeSettings({ rowHeightsUniform: true }));

      expect(source.isUniform()).toBe(true);
    });

    it('should report column uniformity straight from the columnWidthsUniform setting', () => {
      const source = new DefaultColumnSizeSource(fakeSettings({ columnWidthsUniform: false }));

      expect(source.isUniform()).toBe(false);
    });

    it('should expose the axis defaults used by the caches', () => {
      const rowSource = new DefaultRowSizeSource(
        fakeSettings({ stylesHandler: { getDefaultRowHeight: () => 23 } })
      );
      const columnSource = new DefaultColumnSizeSource(fakeSettings({ defaultColumnWidth: 50 }));

      expect(rowSource.getDefaultSize()).toBe(23);
      expect(columnSource.getDefaultSize()).toBe(50);
    });
  });
});
