import Handsontable from 'handsontable/base';
import { registerPlugin, MergeCells } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(MergeCells);

/**
 * MergeCells runs the settings pass of an enable in the ready step (`onGridReady()`) when nothing else
 * ran it: at init, and after a direct `enablePlugin()` call. `updatePlugin()` runs its own pass, or hands
 * it to the sheets bar, so the step skips it then.
 */
describe('MergeCells ready step', () => {
  let container;
  let hot;
  let passSpy;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    passSpy = jest.spyOn(MergeCells.prototype, 'generateFromSettings');
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    passSpy.mockRestore();
    container.remove();
  });

  const AREA = { row: 1, col: 1, rowspan: 2, colspan: 2 };

  /**
   * Builds a 4x4 grid.
   *
   * @param {object} settings Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings) {
    hot = new Handsontable(container, {
      data: Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (__, col) => `${row}-${col}`)),
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  it('should build the declared merges before the init hook, with the first and only render', () => {
    const events = [];

    buildGrid({
      mergeCells: [AREA],
      init() {
        events.push(`init:${this.getCellMeta(1, 1).rowspan}`);
      },
      afterRender() {
        events.push('render');
      },
    });

    expect(events).toEqual(['init:2', 'render']);
    expect(passSpy).toHaveBeenCalledTimes(1);
  });

  it('should give the init hook the merge meta of a cell read before the merges were built', () => {
    const atInit = [];

    buildGrid({
      mergeCells: [AREA],
      afterLoadData(_sourceData, initialLoad) {
        if (initialLoad) {
          // Stores the cell's meta, and marks its dynamic extension as done, before the ready step merges it.
          this.getCellMeta(1, 1);
        }
      },
      init() {
        const meta = this.getCellMetaTransient(1, 1);

        atInit.push([meta.spanned, meta.rowspan, meta.colspan]);
      },
    });

    // The AutoColumnSize sweep reads the meta the same way from its `init` listener. Before core cleared
    // the extension memo after the held steps, it read no `colspan` and measured the merge as plain text.
    expect(atInit).toEqual([[true, 2, 2]]);
  });

  it('should run the settings pass once when updateSettings() turns the plugin on', () => {
    buildGrid({});

    hot.updateSettings({ mergeCells: [AREA] });

    expect(passSpy).toHaveBeenCalledTimes(1);
    expect(hot.getPlugin('mergeCells').mergedCellsCollection.get(1, 1)).toEqual(expect.objectContaining(AREA));
  });

  it('should run the settings pass once for each update that carries the option', () => {
    buildGrid({ mergeCells: [AREA] });
    passSpy.mockClear();

    hot.updateSettings({ mergeCells: [AREA] });

    expect(passSpy).toHaveBeenCalledTimes(1);
  });

  it('should build the declared merges again after a direct disable and enable', () => {
    buildGrid({ mergeCells: [AREA] });

    const plugin = hot.getPlugin('mergeCells');

    plugin.disablePlugin();

    expect(plugin.mergedCellsCollection.mergedCells.length).toBe(0);

    plugin.enablePlugin();

    expect(plugin.mergedCellsCollection.get(1, 1)).toEqual(expect.objectContaining(AREA));
  });
});
