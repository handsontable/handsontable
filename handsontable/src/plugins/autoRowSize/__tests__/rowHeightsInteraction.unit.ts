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

describe('AutoRowSize selective cache clearing', () => {
  /**
   * Builds a grid attached to the document, so `isVisible()` answers `true` and the render path
   * under test is actually reached.
   *
   * @param {number} rows How many rows the grid holds.
   * @returns {object} The instance and its container.
   */
  function buildAttachedGrid(rows = 30) {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const hot = new Handsontable(container, {
      data: Array.from({ length: rows }, (_, row) => [`r${row}`]),
      autoRowSize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    return { hot, container };
  }

  // The "off-screen row gets re-measured" half of the selective forms is NOT asserted here: jsdom
  // has no layout, so every row falls inside the rendered band and the ordinary visible-band pass
  // measures a cleared row whether or not it was queued. It is covered in
  // `tests/e2e/auto-row-size-clear-cache.spec.ts`, against a real viewport with a real fold.

  it('should keep cleared rows queued rather than measuring them on a column-less grid', () => {
    // With no columns there is nothing to measure, but the pass still writes a height - and once a
    // row holds a number instead of `null` it is never measured again, so it stays at the default
    // height for good when the columns come back. The queue is held instead, not drained.
    const { hot, container } = buildAttachedGrid();
    const plugin = hot.getPlugin('autoRowSize');

    hot.updateSettings({ columns: [] });

    expect(hot.countCols()).toBe(0);

    plugin.clearCache([5]);
    hot.render();

    expect(plugin.rowHeightsMap.getValueAtIndex(5)).toBe(null);

    // The row was held, not dropped: with a column back, it is measured.
    hot.updateSettings({ columns: [{ data: 0 }] });
    hot.render();

    expect(plugin.rowHeightsMap.getValueAtIndex(5)).not.toBe(null);

    hot.destroy();
    container.remove();
  });

  // The other half of `#drainRowRefreshQueue()` - that a queue held back while a sweep is running
  // is drained when the sweep ends - has no unit test, and cannot have one here: jsdom reports no
  // layout, so every row falls inside the rendered band and the ordinary visible-band pass measures
  // a queued row whether or not the queue was drained. The two states are indistinguishable.

  it('should still owe the full recalculation after a render whose measurement threw', () => {
    // The ghost table runs the real renderers, so a renderer that throws aborts the sweep. Spending
    // the flag there would leave every unmeasured row at the default height for good.
    //
    // Asserted by counting the sweeps rather than by looking at the heights: the ordinary
    // visible-band pass measures rows on the second render either way, and in jsdom - which reports
    // no layout, so every row falls inside the rendered band - that would make this pass with the
    // flag spent.
    const { hot, container } = buildAttachedGrid();
    const plugin = hot.getPlugin('autoRowSize');
    let sweeps = 0;
    let shouldThrow = true;

    plugin.recalculateAllRowsHeight = () => {
      sweeps += 1;

      if (shouldThrow) {
        throw new Error('renderer blew up mid-sweep');
      }
    };

    plugin.clearCache();

    expect(() => hot.render()).toThrow('renderer blew up mid-sweep');
    expect(sweeps).toBe(1);

    // The next render must attempt the sweep again, which only happens if the throw re-owed it.
    shouldThrow = false;
    hot.render();

    expect(sweeps).toBe(2);

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
