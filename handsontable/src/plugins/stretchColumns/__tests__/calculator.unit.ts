import Handsontable from 'handsontable/base';
import { registerPlugin, StretchColumns } from 'handsontable/plugins';

registerPlugin(StretchColumns);

/**
 * Builds a 3-column grid with fixed 50px base widths, so the stretched result is arithmetic on the
 * mocked viewport width (300 → 100 each, 600 → 200 each). `autoColumnSize` is off so no other
 * `modifyColWidth` producer moves the widths or drops the cache in these tests.
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
    // write, and nothing drops the engine cache from this plugin any more.
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
});
