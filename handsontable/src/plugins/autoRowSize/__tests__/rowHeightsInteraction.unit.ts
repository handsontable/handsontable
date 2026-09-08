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

  it('should recover when a measurement throws in the idle part of a sweep', () => {
    // The sweep measures `SYNC_CALCULATION_LIMIT` rows inline and hands the rest to an idle task,
    // which is a separate turn - no caller's try/catch can see a throw from there. Left alone,
    // `inProgress` would stay `true` for the instance's life, which also disables the refresh queue,
    // and the recalculation would never be re-owed.
    const container = document.createElement('div');

    document.body.appendChild(container);

    // 600 rows against a sync limit of 3 leaves plenty for the idle continuation, which measures
    // `CALCULATION_STEP` (50) rows a turn.
    const hot = new Handsontable(container, {
      data: Array.from({ length: 600 }, (_, row) => [`r${row}`]),
      autoRowSize: { syncLimit: 3 },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin('autoRowSize');
    const measure = plugin.calculateRowsHeight.bind(plugin);
    let calls = 0;

    plugin.calculateRowsHeight = (...args: unknown[]) => {
      calls += 1;

      // Not the inline pass and not the first idle turn - a later one, well inside the async phase.
      if (calls === 4) {
        throw new Error('renderer blew up mid-sweep');
      }

      return (measure as (...a: unknown[]) => void)(...args);
    };

    // `requestIdleTask` falls back to `requestAnimationFrame`, so running that straight away turns
    // the idle continuation into a direct call. The continuation is still the code path under test -
    // the recovery has to live inside `loop()` either way - and driving it here keeps the test off
    // a fixed timer.
    const originalRequestAnimationFrame = window.requestAnimationFrame;

    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      callback(0);

      return 0;
    }) as typeof window.requestAnimationFrame;

    try {
      expect(() => plugin.recalculateAllRowsHeight()).toThrow('renderer blew up mid-sweep');
    } finally {
      window.requestAnimationFrame = originalRequestAnimationFrame;
    }

    // The throw landed in the continuation, not the inline pass.
    expect(calls).toBeGreaterThanOrEqual(4);
    // The sweep is no longer believed to be running, so the refresh queue works again.
    expect(plugin.inProgress).toBe(false);

    // The unfinished measurement is owed to the next render, which starts a fresh sweep - and this
    // grid is far larger than its sync limit, so that sweep goes async and says so.
    plugin.calculateRowsHeight = measure;
    hot.render();

    expect(plugin.inProgress).toBe(true);

    hot.destroy();
    container.remove();
  });

  it('should leave the ghost table clean when a renderer throws mid-sweep', () => {
    // The realistic shape of the throw above: it comes from a renderer, which the ghost table runs
    // itself. `GhostTable#addRow` pushes its row object BEFORE running them and fills in `.table`
    // only once they have returned, so a throw leaves a half-built entry behind - and `getHeights()`
    // reads `.table` on every row it holds. Left there, the retry sweep dies on that leftover
    // instead of measuring, and so does every sweep after it: the grid never recovers.
    const container = document.createElement('div');

    document.body.appendChild(container);

    // Armed only after the grid is built: jsdom reports no layout, so the master draw renders every
    // row, and a renderer that throws from the start takes the constructor down instead.
    let failing = false;

    const hot = new Handsontable(container, {
      data: Array.from({ length: 600 }, (_, row) => [`r${row}`]),
      autoRowSize: { syncLimit: 3 },
      renderer(instance: unknown, td: HTMLElement, row: number, ...rest: unknown[]) {
        if (failing && row === 100) {
          throw new Error('renderer blew up mid-sweep');
        }

        td.textContent = String(rest[2] ?? '');
      },
      licenseKey: 'non-commercial-and-evaluation',
    });
    const plugin = hot.getPlugin('autoRowSize');

    // Row 100 lands in the idle continuation: the inline pass stops at `syncLimit`, and each turn
    // after it covers `CALCULATION_STEP` rows.
    failing = true;
    const originalRequestAnimationFrame = window.requestAnimationFrame;

    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      callback(0);

      return 0;
    }) as typeof window.requestAnimationFrame;

    try {
      expect(() => plugin.recalculateAllRowsHeight()).toThrow('renderer blew up mid-sweep');

      // Nothing half-built is left behind, so the next pass has a table it can measure.
      expect(plugin.ghostTable.rows).toHaveLength(0);

      // The retry must actually measure, not die on a leftover row.
      failing = false;

      expect(() => plugin.recalculateAllRowsHeight()).not.toThrow();
    } finally {
      window.requestAnimationFrame = originalRequestAnimationFrame;
    }

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
