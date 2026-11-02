import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { CustomBorders } from '../customBorders';

/**
 * CustomBorders applies the borders its settings declare in the ready step (`onGridReady()`) when nothing
 * else did: at init, and after a direct `enablePlugin()` call. `updatePlugin()` and `onDataReady()` apply
 * them themselves, so the step skips the pass after them and no border is written twice.
 */
describe('CustomBorders ready step', () => {
  let container;
  let hot;
  let applySpy;

  beforeAll(() => {
    registerPlugin(CustomBorders);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    applySpy = jest.spyOn(CustomBorders.prototype, 'changeBorderSettings');
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    applySpy.mockRestore();
    container.remove();
  });

  const BORDERS = [{ row: 1, col: 1, top: { width: 2, color: 'red' } }];

  /**
   * Builds a 3x3 grid.
   *
   * @param {object} settings Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings) {
    hot = new Handsontable(container, {
      data: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2'], ['A3', 'B3', 'C3']],
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  it('should apply the declared borders before the init hook, and render once more after afterInit', () => {
    const events = [];

    buildGrid({
      customBorders: BORDERS,
      init() {
        events.push(`init:${this.getCellMeta(1, 1).borders ? 'border' : 'none'}`);
      },
      afterRender() {
        events.push('render');
      },
      afterInit() {
        events.push('afterInit');
      },
    });

    // The first render draws the master table's borders; the overlay clones it built get theirs from the
    // render scheduled for `afterInit`.
    expect(events).toEqual(['init:border', 'render', 'afterInit', 'render']);
    expect(applySpy.mock.calls).toEqual([[false]]);
  });

  it('should not render a second time at init when no border is declared', () => {
    const renders = jest.fn();

    buildGrid({ customBorders: true, afterRender: renders });

    expect(renders).toHaveBeenCalledTimes(1);
  });

  it('should apply the declared borders once when updateSettings() turns the plugin on', () => {
    buildGrid({ customBorders: false });
    applySpy.mockClear();

    hot.updateSettings({ customBorders: BORDERS });

    expect(applySpy).toHaveBeenCalledTimes(1);
    expect(hot.getCellMeta(1, 1).borders.top).toEqual(expect.objectContaining({ width: 2, color: 'red' }));
  });

  it('should apply the declared borders once for each update that carries the option', () => {
    buildGrid({ customBorders: BORDERS });
    applySpy.mockClear();

    hot.updateSettings({ customBorders: BORDERS });

    expect(applySpy).toHaveBeenCalledTimes(1);
  });

  it('should apply the declared borders again after a direct disable and enable', () => {
    buildGrid({ customBorders: BORDERS });

    const plugin = hot.getPlugin('customBorders');

    plugin.disablePlugin();
    applySpy.mockClear();
    plugin.enablePlugin();

    // A grid already drawn renders from the step itself.
    expect(applySpy.mock.calls).toEqual([[true]]);
    expect(plugin.getBorders().length).toBe(1);
  });

  it('should render, and wait for no `afterInit`, when a direct enable runs on a grid that was never drawn', () => {
    buildGrid({ customBorders: BORDERS });

    const plugin = hot.getPlugin('customBorders');

    plugin.disablePlugin();
    // A grid built inside a hidden container skips its draws, so its view still reports that it never drew.
    hot.view._wt.drawn = false;

    const addHookOnceSpy = jest.spyOn(hot, 'addHookOnce');

    applySpy.mockClear();
    plugin.enablePlugin();

    // Not the init pass: the step renders itself, and leaves no `afterInit` listener that would never fire.
    expect(applySpy.mock.calls).toEqual([[true]]);
    expect(addHookOnceSpy).not.toHaveBeenCalledWith('afterInit', expect.anything());
    expect(plugin.getBorders().length).toBe(1);
  });
});
