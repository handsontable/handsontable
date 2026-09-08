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

describe('AutoRowSize#clearCache', () => {
  it('should report that a recalculation is needed once every height has been dropped', () => {
    // `isNeedRecalculate()` slices the height map by `measuredRows`, so zeroing that counter in
    // `clearCache()` would make this answer "nothing to recalculate" at the exact moment every
    // height was wiped - and any caller polling it would silently stop re-measuring.
    const hot = buildGrid();
    const plugin = hot.getPlugin('autoRowSize');

    plugin.rowHeightsMap.setValueAtIndex(hot.toPhysicalRow(0), 40);
    plugin.measuredRows = 3;

    plugin.clearCache();

    expect(plugin.isNeedRecalculate()).toBe(true);

    hot.destroy();
  });

  it('should not spend the scheduled recalculation on a render that has no columns to measure', () => {
    // A column-less grid still reports itself visible - `isVisible()` is a CSS-display check - so
    // nothing but an explicit guard stops the sweep running against an empty column range. It would
    // write a near-empty height for every row, and because those entries are no longer `null` they
    // would never be re-measured: the rows stay stuck at the default height once the columns come
    // back. `calculateVisibleRowsHeight()` bails out on this grid for the same reason.
    //
    // The container has to be IN the document: `isVisible()` answers `false` for a detached
    // element, which would skip the whole branch and make this pass without measuring anything.
    const container = document.createElement('div');

    document.body.appendChild(container);

    const hot = new Handsontable(container, {
      data: [['a'], ['b'], ['c']],
      autoRowSize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin('autoRowSize');

    expect(hot.view.isVisible()).toBe(true);

    hot.updateSettings({ columns: [] });

    expect(hot.countCols()).toBe(0);

    plugin.clearCache();
    hot.render();

    // Nothing was measured, so nothing was recorded as measured either.
    expect(plugin.rowHeightsMap.getValues().every((value: number | null) => value === null)).toBe(true);

    hot.destroy();
    container.remove();
  });
});

describe('AutoRowSize default settings', () => {
  it('should not declare a `useHeaders` setting, because it never reads one', () => {
    // AutoColumnSize does read `useHeaders` - it decides whether a column header is rendered beside
    // the samples it measures. AutoRowSize has no such choice to offer, so declaring the key would
    // hand the user a switch that changes nothing.
    // Asserted as an absence, not as the whole key set: `syncLimit` is documented as an
    // `autoRowSize` option, so pinning the exact shape here would stand in the way of ever
    // declaring it.
    expect(AutoRowSize.DEFAULT_SETTINGS).not.toHaveProperty('useHeaders');
  });

  it('should still declare the settings it does read', () => {
    expect(AutoRowSize.DEFAULT_SETTINGS.samplingRatio).toBe(null);
    expect(AutoRowSize.DEFAULT_SETTINGS.allowSampleDuplicates).toBe(false);
  });
});
