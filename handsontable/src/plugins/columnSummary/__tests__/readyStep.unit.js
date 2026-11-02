import Handsontable from 'handsontable/base';
import { registerPlugin, ColumnSummary } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';
import Endpoints from 'handsontable/plugins/columnSummary/endpoints';

registerAllCellTypes();
registerPlugin(ColumnSummary);

/**
 * ColumnSummary parses its endpoints and writes the summaries in the ready step (`onGridReady()`), once
 * after each enable or update, when the data is loaded and the editor manager exists. At init core holds
 * the render the writes ask for, so the first render draws the summaries and the grid renders once.
 */
describe('ColumnSummary ready step', () => {
  let container;
  let hot;
  let initSpy;
  let originalScrollIntoView;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    initSpy = jest.spyOn(Endpoints.prototype, 'initEndpoints');
    originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    window.HTMLElement.prototype.scrollIntoView = () => {};
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    initSpy.mockRestore();
    container.remove();
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  const SUMMARY = [{ sourceColumn: 0, destinationRow: 3, destinationColumn: 0, ranges: [[0, 2]], type: 'sum' }];

  /**
   * Builds a one-column grid with a summary row at the end.
   *
   * @param {object} settings Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings) {
    hot = new Handsontable(container, {
      data: [[1], [2], [3], [null]],
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  it('should write the summary before the init hook, and draw it with the first and only render', () => {
    const events = [];

    buildGrid({
      columnSummary: SUMMARY,
      init() {
        events.push(`init:${this.getDataAtCell(3, 0)}`);
      },
      afterRender() {
        events.push(`render:${this.getDataAtCell(3, 0)}`);
      },
    });

    expect(events).toEqual(['init:6', 'render:6']);
    expect(initSpy).toHaveBeenCalledTimes(1);
  });

  it('should compute the endpoints once when updateSettings() turns the plugin on', () => {
    buildGrid({});

    hot.updateSettings({ columnSummary: SUMMARY });

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(hot.getDataAtCell(3, 0)).toBe(6);
  });

  it('should compute the endpoints once for each update that carries the option', () => {
    buildGrid({ columnSummary: SUMMARY });
    initSpy.mockClear();

    hot.updateSettings({ columnSummary: [{ ...SUMMARY[0], type: 'max' }] });

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(hot.getDataAtCell(3, 0)).toBe(3);
  });

  it('should compute the endpoints after a direct enablePlugin() call', () => {
    buildGrid({ columnSummary: SUMMARY });

    const plugin = hot.getPlugin('columnSummary');

    plugin.disablePlugin();
    hot.setDataAtCell(0, 0, 10);
    initSpy.mockClear();

    plugin.enablePlugin();

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(hot.getDataAtCell(3, 0)).toBe(15);
  });
});
