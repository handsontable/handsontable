import Handsontable from 'handsontable/base';
import { registerPlugin, EmptyDataState } from 'handsontable/plugins';

registerPlugin(EmptyDataState);

/**
 * EmptyDataState shows or hides its overlay in the ready step (`onGridReady()`), which core runs once
 * after each enable or update, before the next render. At init the enable runs before the view exists,
 * so the step is where the overlay first appears: before the `init` hook, drawn by the first render.
 */
describe('EmptyDataState ready step', () => {
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
   * Builds a grid.
   *
   * @param {object} settings Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings) {
    hot = new Handsontable(container, {
      colHeaders: true,
      emptyDataState: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  it('should show the overlay for an empty grid before the init hook, with a single render', () => {
    const events = [];

    buildGrid({
      data: [],
      afterEmptyDataStateShow() {
        events.push('show');
      },
      init() {
        events.push('init');
      },
      afterRender() {
        events.push('render');
      },
    });

    // The `afterInit` listener this replaced showed the overlay after the first render and rendered again.
    expect(events).toEqual(['show', 'init', 'render']);
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
  });

  it('should leave the overlay hidden for a grid with rows', () => {
    const showSpy = jest.fn();

    buildGrid({
      data: [['A1', 'B1']],
      afterEmptyDataStateShow: showSpy,
    });

    expect(showSpy).not.toHaveBeenCalled();
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
  });

  it('should show the overlay once when updateSettings() turns the plugin on for an empty grid', () => {
    const showSpy = jest.fn();

    buildGrid({
      data: [],
      emptyDataState: false,
      afterEmptyDataStateShow: showSpy,
    });

    hot.updateSettings({ emptyDataState: true });

    expect(showSpy).toHaveBeenCalledTimes(1);
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
  });

  it('should leave the toggle to the update itself, so the ready step does not toggle again', () => {
    buildGrid({ data: [] });

    const countSpy = jest.spyOn(hot.view, 'countRenderableColumns');
    const step = EmptyDataState.prototype.onGridReady;
    const readsInStep = [];
    const stepSpy = jest.spyOn(EmptyDataState.prototype, 'onGridReady').mockImplementation(function() {
      const before = countSpy.mock.calls.length;

      step.call(this);
      readsInStep.push(countSpy.mock.calls.length - before);
    });

    hot.updateSettings({ emptyDataState: { message: 'Nothing here' } });

    expect(readsInStep).toEqual([0]);
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

    stepSpy.mockRestore();
  });
});
