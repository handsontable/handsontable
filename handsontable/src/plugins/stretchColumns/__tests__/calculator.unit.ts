import Handsontable from 'handsontable/base';
import { registerPlugin, StretchColumns } from 'handsontable/plugins';

registerPlugin(StretchColumns);

/**
 * Builds a 3-column grid with fixed 50px base widths, so the stretched result is arithmetic on the
 * mocked viewport width (300 → 100 each, 600 → 200 each). `autoColumnSize` is off on purpose: it is
 * the other `modifyColWidth` producer that drops the same cache (through `observeMapChange`), and
 * with it on the counts below would no longer be this plugin's alone. The default setup, with
 * `autoColumnSize` on, is covered by the Playwright spec `stretch-columns-container-resize.spec.ts`.
 *
 * @param {object} settings Settings merged over the defaults.
 * @returns {object} The Handsontable instance.
 */
function buildGrid(settings: Record<string, unknown> = {}) {
  return new Handsontable(document.createElement('div'), {
    data: [['a', 'b', 'c'], ['d', 'e', 'f']],
    colWidths: 50,
    autoColumnSize: false,
    stretchH: 'all',
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });
}

describe('StretchCalculator widths map and engine cache', () => {
  it('writes the widths map once per width change and drops the engine column-width cache each time', () => {
    const hot = buildGrid();
    const viewportWidth = jest.spyOn(hot.view, 'getViewportWidth').mockReturnValue(300);
    const invalidate = jest.spyOn(hot.view, 'invalidateColumnWidthCache');
    const widthsMap = hot.columnIndexMapper.variousMapsCollection.get('stretchColumns');
    let mapChanges = 0;

    expect(widthsMap).toBeDefined();

    hot.columnIndexMapper.observeMapChange(widthsMap!, () => {
      mapChanges += 1;
    });

    hot.render();

    expect(hot.getColWidth(0)).toBe(100);
    expect(hot.getColWidth(2)).toBe(100);
    expect(mapChanges).toBe(1);
    // Loose on purpose: under jsdom, `TableView#render` can drop the width cache itself through
    // `#discardSizesMeasuredWithoutStyles`, so the exact count here is environment-dependent. The
    // steady-state and change-count assertions below are the exact ones.
    expect(invalidate).toHaveBeenCalled();

    // Steady state: same viewport, same widths — nothing written, nothing dropped.
    invalidate.mockClear();
    hot.render();

    expect(mapChanges).toBe(1);
    expect(invalidate).not.toHaveBeenCalled();

    // The container grows: one write, one drop.
    viewportWidth.mockReturnValue(600);
    hot.render();

    expect(hot.getColWidth(0)).toBe(200);
    expect(mapChanges).toBe(2);
    expect(invalidate).toHaveBeenCalledTimes(1);

    hot.destroy();
  });

  it('switches strategy with one map write and one cache drop, then stays silent', () => {
    // `all` → `last` keeps the plugin enabled, so `updatePlugin()` swaps the strategy and the next
    // render writes the new widths: only the last column is stretched now.
    const hot = buildGrid();

    jest.spyOn(hot.view, 'getViewportWidth').mockReturnValue(300);
    hot.render();

    expect(hot.getColWidth(0)).toBe(100);

    const widthsMap = hot.columnIndexMapper.variousMapsCollection.get('stretchColumns');
    const invalidate = jest.spyOn(hot.view, 'invalidateColumnWidthCache');
    let mapChanges = 0;

    hot.columnIndexMapper.observeMapChange(widthsMap!, () => {
      mapChanges += 1;
    });

    hot.updateSettings({ stretchH: 'last' });

    expect(hot.getColWidth(0)).toBe(50);
    expect(hot.getColWidth(2)).toBe(200);
    expect(mapChanges).toBe(1);
    expect(invalidate).toHaveBeenCalledTimes(1);

    invalidate.mockClear();
    hot.render();

    expect(mapChanges).toBe(1);
    expect(invalidate).not.toHaveBeenCalled();

    hot.destroy();
  });

  it('leaves the map and the engine cache alone once the plugin is disabled', () => {
    // `all` → `none` disables the plugin: `BasePlugin#onUpdateSettings` clears its hooks before
    // the render, so `refreshStretching()` never runs on that transition and afterwards. The
    // widths come back to their base through the removed `modifyColWidth` hook, not through a map
    // write. The engine cache IS dropped on this transition — by core's `updateSettings()`, through
    // `view.invalidateIndexSizesCache()`, which reaches `_wt.wtViewport` directly and so never shows
    // on the spy below. What the spy pins is that this plugin adds no drop of its own.
    const hot = buildGrid();

    jest.spyOn(hot.view, 'getViewportWidth').mockReturnValue(300);
    hot.render();

    expect(hot.getColWidth(0)).toBe(100);

    const widthsMap = hot.columnIndexMapper.variousMapsCollection.get('stretchColumns');
    const invalidate = jest.spyOn(hot.view, 'invalidateColumnWidthCache');
    let mapChanges = 0;

    hot.columnIndexMapper.observeMapChange(widthsMap!, () => {
      mapChanges += 1;
    });

    hot.updateSettings({ stretchH: 'none' });
    hot.render();

    expect(hot.getColWidth(0)).toBe(50);
    expect(mapChanges).toBe(0);
    expect(invalidate).not.toHaveBeenCalled();

    hot.destroy();
  });

  it('measures the viewport against the base widths, never against the previous stretched ones', () => {
    // When the window owns the horizontal axis the engine decides the workspace width by summing the
    // columns through `modifyColWidth`. The previous stretched widths must not take part in that sum,
    // or a shrink reads the OLD viewport back and overshoots the root (review finding on #13493). The
    // mocked `getViewportWidth` stands in for that engine read: it records what the columns sum to
    // at the moment of the measurement.
    const hot = buildGrid();
    const sumsSeenWhileMeasuring: number[] = [];

    jest.spyOn(hot.view, 'getViewportWidth').mockImplementation(() => {
      let sum = 0;

      for (let col = 0; col < hot.countCols(); col++) {
        sum += hot.getColWidth(col);
      }

      sumsSeenWhileMeasuring.push(sum);

      return 300;
    });

    hot.render();

    expect(hot.getColWidth(0)).toBe(100);

    // The map now holds 100/100/100. A second refresh must still measure against 50/50/50.
    hot.render();

    expect(hot.getColWidth(0)).toBe(100);
    expect(sumsSeenWhileMeasuring.length).toBeGreaterThanOrEqual(2);
    expect(sumsSeenWhileMeasuring.every(sum => sum === 150)).toBe(true);

    hot.destroy();
  });
});
