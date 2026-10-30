import Handsontable from 'handsontable/base';
import { registerPlugin, NestedRows } from 'handsontable/plugins';
import HeadersUI from 'handsontable/plugins/nestedRows/ui/headers';

registerPlugin(NestedRows);

/**
 * NestedRows sizes its row header in the ready step (`onGridReady()`), which core runs once after each
 * enable or update, before the next render. The size is read from the tree's depth, so the step needs the
 * loaded data. jsdom loads no theme, so the width itself is `NaN` here; these tests pin when the sizing
 * runs and that it never renders on its own.
 */
describe('NestedRows ready step', () => {
  let container;
  let hot;
  let sizeSpy;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    sizeSpy = jest.spyOn(HeadersUI.prototype, 'updateRowHeaderWidth');
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    sizeSpy.mockRestore();
    container.remove();
  });

  /**
   * A two-level tree.
   *
   * @returns {object[]}
   */
  function nestedData() {
    return [
      { name: 'A', __children: [{ name: 'A1' }, { name: 'A2' }] },
      { name: 'B', __children: [{ name: 'B1' }] },
    ];
  }

  /**
   * Builds a grid with row headers.
   *
   * @param {object} [settings] Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: nestedData(),
      rowHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  it('should size the row header once at init, before the init hook, without a render of its own', () => {
    const callsAtInit = [];
    const renderSpy = jest.fn();

    buildGrid({
      nestedRows: true,
      init() {
        callsAtInit.push(sizeSpy.mock.calls.length);
      },
      afterRender: renderSpy,
    });

    expect(callsAtInit).toEqual([1]);
    expect(sizeSpy.mock.calls).toEqual([[undefined, false]]);
    // The first render only: the `afterInit` listener this replaced rendered a second time.
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('should size the row header once when updateSettings() turns the plugin on', () => {
    buildGrid({ nestedRows: false });

    expect(sizeSpy).not.toHaveBeenCalled();

    hot.updateSettings({ nestedRows: true });

    expect(sizeSpy.mock.calls).toEqual([[undefined, false]]);
  });

  it('should size the row header once more for each update that carries the option', () => {
    buildGrid({ nestedRows: true });
    sizeSpy.mockClear();

    hot.updateSettings({ nestedRows: true });
    hot.updateSettings({ colHeaders: true });

    expect(sizeSpy.mock.calls).toEqual([[undefined, false]]);
  });

  it('should size the row header on a direct enablePlugin() call after init', () => {
    buildGrid({ nestedRows: false });

    hot.getPlugin('nestedRows').enablePlugin();

    expect(sizeSpy.mock.calls).toEqual([[undefined, false]]);
  });
});
