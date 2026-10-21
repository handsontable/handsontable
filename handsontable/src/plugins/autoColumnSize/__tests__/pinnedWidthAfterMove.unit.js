import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import { registerPlugin, AutoColumnSize } from 'handsontable/plugins';

registerPlugin(AutoColumnSize);
registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

describe('AutoColumnSize and a pinned column width after a column move', () => {
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
   * Builds a grid whose first column has a `width` and is then moved to the end.
   *
   * @returns {AutoColumnSize}
   */
  function createMovedGrid() {
    hot = new Core(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['a', 'b', 'c']],
      columns: [{ width: 200 }, {}, {}],
    });
    hot.init();
    hot.columnIndexMapper.moveIndexes([0], 2);

    const plugin = hot.getPlugin('autoColumnSize');

    plugin.clearCache();

    return plugin;
  }

  /**
   * Asserts that only the column without a pinned width was measured.
   *
   * @param {AutoColumnSize} plugin The plugin instance.
   */
  function expectOnlyUnpinnedMeasured(plugin) {
    // physical column 0 keeps its pinned width, so it is never measured
    expect(plugin.columnWidthsMap.getValueAtIndex(0)).toBeNull();
    expect(plugin.columnWidthsMap.getValueAtIndex(1)).not.toBeNull();
    expect(plugin.columnWidthsMap.getValueAtIndex(2)).not.toBeNull();
    expect(hot.getColWidth(2)).toBe(200);
  }

  it('should not measure the pinned column, wherever it sits after the move (a column range)', () => {
    const plugin = createMovedGrid();

    plugin.calculateColumnsWidth({ from: 0, to: 2 }, { from: 0, to: 0 });

    expectOnlyUnpinnedMeasured(plugin);
  });

  it('should not measure the pinned column, wherever it sits after the move (all columns)', () => {
    const plugin = createMovedGrid();

    plugin.calculateAllColumnsWidth();

    expectOnlyUnpinnedMeasured(plugin);
  });
});
