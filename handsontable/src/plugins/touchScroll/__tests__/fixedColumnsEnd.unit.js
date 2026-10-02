import Handsontable from 'handsontable/base';
import { TouchScroll, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(TouchScroll);

describe('TouchScroll – fixedColumnsEnd', () => {
  let container;
  let hot;

  beforeEach(() => {
    // The plugin switches on only where the browser supports touch.
    window.ontouchstart = null;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    delete window.ontouchstart;
  });

  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: Array.from({ length: 10 }, (_, row) => Array.from({ length: 10 }, (__, col) => `${row}:${col}`)),
      colHeaders: true,
      rowHeaders: true,
      touchScroll: true,
      ...settings,
    });

    return hot.getPlugin('touchScroll');
  }

  it('should hold the overlays of the end columns among the scrollbars and the clones it freezes', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2, fixedRowsTop: 1, fixedRowsBottom: 1 });
    const { inlineEndOverlay, topInlineEndCornerOverlay, bottomInlineEndCornerOverlay } = hot.view._wt.wtOverlays;

    expect(plugin.scrollbars).toContain(inlineEndOverlay);
    expect(plugin.scrollbars).toContain(topInlineEndCornerOverlay);
    expect(plugin.scrollbars).toContain(bottomInlineEndCornerOverlay);
    expect(plugin.clones).toContain(inlineEndOverlay.clone.wtTable.holder.parentNode);
    expect(plugin.clones).toContain(topInlineEndCornerOverlay.clone.wtTable.holder.parentNode);
    expect(plugin.clones).toContain(bottomInlineEndCornerOverlay.clone.wtTable.holder.parentNode);
  });

  it('should collect the end overlays when the option is set after the first render', () => {
    const plugin = createGrid();
    const { inlineEndOverlay } = hot.view._wt.wtOverlays;

    hot.updateSettings({ fixedColumnsEnd: 2 });

    expect(plugin.scrollbars).toContain(inlineEndOverlay);
    expect(plugin.clones).toContain(inlineEndOverlay.clone.wtTable.holder.parentNode);
  });
});
