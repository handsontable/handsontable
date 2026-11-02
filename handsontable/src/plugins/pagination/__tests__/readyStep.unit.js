import Handsontable from 'handsontable/base';
import { registerPlugin, AutoColumnSize, Pagination } from 'handsontable/plugins';

registerPlugin(AutoColumnSize);
registerPlugin(Pagination);

/**
 * Pagination computes its page state in the ready step (`onGridReady()`) when nothing else did: at init,
 * and after a direct `enablePlugin()` call. Every ready step runs before the `init` hook, so the page is
 * applied to the index mapper before AutoColumnSize measures from its `init` listener. `updatePlugin()`
 * and `onDataReady()` compute the state themselves, so the step skips it after them.
 */
describe('Pagination ready step', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a 20-row grid.
   *
   * @param {object} settings Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings) {
    hot = new Handsontable(container, {
      data: Array.from({ length: 20 }, (_, row) => [`A${row + 1}`, `B${row + 1}`]),
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  it('should apply the page before AutoColumnSize measures and before the init hook', () => {
    const measureSpy = jest.spyOn(AutoColumnSize.prototype, 'recalculateAllColumnsWidth');
    const shownAtMeasure = [];
    const shownAtInit = [];

    measureSpy.mockImplementation(function() {
      shownAtMeasure.push(this.hot.rowIndexMapper.getRenderableIndexesLength());
    });

    try {
      buildGrid({
        pagination: { pageSize: 5 },
        init() {
          shownAtInit.push(this.rowIndexMapper.getRenderableIndexesLength());
        },
      });
    } finally {
      measureSpy.mockRestore();
    }

    expect(shownAtMeasure[0]).toBe(5);
    expect(shownAtInit).toEqual([5]);
  });

  it('should compute the page once, with one render, when updateSettings() changes the page size', () => {
    const renders = jest.fn();

    buildGrid({ pagination: { pageSize: 5 }, afterRender: renders });
    renders.mockClear();

    hot.updateSettings({ pagination: { pageSize: 10 } });

    expect(hot.rowIndexMapper.getRenderableIndexesLength()).toBe(10);
    // `updatePlugin()` renders the new page, and `updateSettings()` renders once at its end. A step that
    // computed the page again would add a third.
    expect(renders).toHaveBeenCalledTimes(2);
  });

  it('should apply the page again after a direct disable and enable', () => {
    buildGrid({ pagination: { pageSize: 5 } });

    const plugin = hot.getPlugin('pagination');

    plugin.disablePlugin();

    expect(hot.rowIndexMapper.getRenderableIndexesLength()).toBe(20);

    plugin.enablePlugin();

    expect(hot.rowIndexMapper.getRenderableIndexesLength()).toBe(5);
    expect(plugin.getPaginationData().totalPages).toBe(4);
  });
});
