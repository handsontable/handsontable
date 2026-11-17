import Handsontable from 'handsontable';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

/**
 * The engine's `externalRowCalculator` setting says whether the AutoRowSize plugin measures the rows, so
 * the engine does not measure them itself. `TableView` hands it over when it builds the engine, and again
 * before a draw, because `updateSettings()` can turn the plugin on or off later.
 */
describe('The engine\'s `externalRowCalculator` setting', () => {
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
   * Builds a grid in the shared container.
   *
   * @param {object} settings Grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    hot = new Handsontable(container, {
      data: [['a'], ['b'], ['c']],
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Reads the setting the engine holds.
   *
   * @returns {boolean}
   */
  function isExternal() {
    return hot.view._wt.wtSettings.getSetting('externalRowCalculator');
  }

  it('should follow the plugin state the grid is built with', () => {
    createGrid({ autoRowSize: true });

    expect(isExternal()).toBe(true);

    hot.destroy();
    createGrid({ autoRowSize: false });

    expect(isExternal()).toBe(false);
  });

  it('should turn on when `updateSettings()` enables the plugin', () => {
    createGrid({ autoRowSize: false });

    hot.updateSettings({ autoRowSize: true });

    expect(hot.getPlugin('autoRowSize').enabled).toBe(true);
    expect(isExternal()).toBe(true);
  });

  it('should turn off when `updateSettings()` disables the plugin', () => {
    createGrid({ autoRowSize: true });

    hot.updateSettings({ autoRowSize: false });

    expect(hot.getPlugin('autoRowSize').enabled).toBe(false);
    expect(isExternal()).toBe(false);
  });

  it('should follow `updateSettings()` while rendering is suspended, when a scroll can still draw', () => {
    createGrid({ autoRowSize: false });

    hot.suspendRender();
    hot.updateSettings({ autoRowSize: true });

    expect(isExternal()).toBe(true);

    hot.updateSettings({ autoRowSize: false });

    expect(isExternal()).toBe(false);

    hot.resumeRender();
  });

  it('should pick up a plugin that an `afterUpdateSettings` listener turned on', () => {
    createGrid({ autoRowSize: false });

    hot.suspendRender();
    hot.addHookOnce('afterUpdateSettings', () => hot.getPlugin('autoRowSize').enablePlugin());
    hot.updateSettings({ colWidths: 80 });

    expect(hot.getPlugin('autoRowSize').enabled).toBe(true);
    expect(isExternal()).toBe(true);

    hot.resumeRender();
  });

  it('should drop the heights the engine recorded when the plugin state changes', () => {
    createGrid({ autoRowSize: false });

    const reset = jest.spyOn(hot.view._wt.wtViewport, 'resetAllOversizedRows');

    hot.updateSettings({ autoRowSize: true });

    expect(reset).toHaveBeenCalledTimes(1);

    hot.updateSettings({ autoRowSize: false });

    expect(reset).toHaveBeenCalledTimes(2);
  });

  it('should keep the heights the engine recorded while the plugin state stays the same', () => {
    createGrid({ autoRowSize: false });

    const { wtViewport } = hot.view._wt;
    const reset = jest.spyOn(wtViewport, 'resetAllOversizedRows');

    hot.updateSettings({ colWidths: 80 });
    hot.render();

    expect(reset).not.toHaveBeenCalled();
  });
});
