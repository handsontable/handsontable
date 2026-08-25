import Handsontable from 'handsontable/base';
import { registerPlugin, AutoRowSize } from 'handsontable/plugins';

registerPlugin(AutoRowSize);

/**
 * Builds a grid with AutoRowSize on.
 *
 * @param {object} settings Settings merged over the defaults.
 * @returns {object} The Handsontable instance.
 */
function buildGrid(settings: Record<string, unknown> = {}) {
  return new Handsontable(document.createElement('div'), {
    data: [['a'], ['b'], ['c']],
    autoRowSize: true,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });
}

describe('AutoRowSize and the rowHeights option', () => {
  it('should stay enabled when `rowHeights` is set', () => {
    // The documentation used to claim `rowHeights` disables this plugin, mirroring what `colWidths`
    // does to AutoColumnSize. It never did, and it must not start: a row shorter than its content
    // would hide that content, so rows are always measured and only ever grow.
    const hot = buildGrid({ rowHeights: 30 });

    expect(hot.getPlugin('autoRowSize').isEnabled()).toBe(true);

    hot.destroy();
  });

  it('should keep a measured height that is taller than the one `rowHeights` asks for', () => {
    const hot = buildGrid({ rowHeights: 20 });
    const plugin = hot.getPlugin('autoRowSize');

    // Stand in for a completed measurement, so the assertion does not depend on layout - jsdom
    // reports none.
    plugin.rowHeightsMap.setValueAtIndex(hot.toPhysicalRow(1), 80);

    expect(plugin.getRowHeight(1, 20)).toBe(80);

    hot.destroy();
  });

  it('should keep the height `rowHeights` asks for when it is taller than the measured one', () => {
    const hot = buildGrid({ rowHeights: 200 });
    const plugin = hot.getPlugin('autoRowSize');

    plugin.rowHeightsMap.setValueAtIndex(hot.toPhysicalRow(1), 80);

    expect(plugin.getRowHeight(1, 200)).toBe(200);

    hot.destroy();
  });
});

describe('AutoRowSize default settings', () => {
  it('should not declare a `useHeaders` setting, because it never reads one', () => {
    // AutoColumnSize does read `useHeaders` - it decides whether a column header is rendered beside
    // the samples it measures. AutoRowSize has no such choice to offer, so declaring the key would
    // hand the user a switch that changes nothing.
    expect(Object.keys(AutoRowSize.DEFAULT_SETTINGS).sort()).toEqual([
      'allowSampleDuplicates',
      'samplingRatio',
    ]);
  });

  it('should still declare the settings it does read', () => {
    expect(AutoRowSize.DEFAULT_SETTINGS.samplingRatio).toBe(null);
    expect(AutoRowSize.DEFAULT_SETTINGS.allowSampleDuplicates).toBe(false);
  });
});
