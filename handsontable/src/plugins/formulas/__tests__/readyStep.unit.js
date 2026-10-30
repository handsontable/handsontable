import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * The axis syncers postpone an index sync they cannot send while no engine sheet is bound. Formulas runs
 * the postponed syncs in its ready step (`onGridReady()`): at init before the `init` hook, which they used
 * to wait for, and on a live grid after the next enable or update, where an `init` listener never fired.
 */
describe('Formulas ready step', () => {
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

  it('should run a sync postponed during the init load before the init hook', () => {
    const postponed = jest.fn();
    const callsAtInit = [];

    hot = new Handsontable(container, {
      data: [[1, '=A1*2']],
      formulas: { engine: HyperFormula },
      licenseKey: LICENSE_KEY,
      afterLoadData(_sourceData, initialLoad) {
        if (initialLoad) {
          this.getPlugin('formulas').indexSyncer.getPostponeAction()(postponed);
        }
      },
      init() {
        callsAtInit.push(postponed.mock.calls.length);
      },
    });

    expect(callsAtInit).toEqual([1]);
    expect(postponed).toHaveBeenCalledTimes(1);
  });

  it('should run a sync postponed on a live grid after the next update of the plugin', () => {
    const postponed = jest.fn();

    hot = new Handsontable(container, {
      data: [[1, '=A1*2']],
      formulas: { engine: HyperFormula },
      licenseKey: LICENSE_KEY,
    });

    const plugin = hot.getPlugin('formulas');

    plugin.indexSyncer.getPostponeAction()(postponed);

    expect(postponed).not.toHaveBeenCalled();

    hot.updateSettings({ formulas: { engine: plugin.engine, sheetName: plugin.sheetName } });

    expect(postponed).toHaveBeenCalledTimes(1);
  });

  it('should drop the postponed syncs when the plugin is disabled', () => {
    const postponed = jest.fn();

    hot = new Handsontable(container, {
      data: [[1, '=A1*2']],
      formulas: { engine: HyperFormula },
      licenseKey: LICENSE_KEY,
    });

    hot.getPlugin('formulas').indexSyncer.getPostponeAction()(postponed);
    hot.updateSettings({ formulas: false });
    hot.updateSettings({ formulas: { engine: HyperFormula } });

    expect(postponed).not.toHaveBeenCalled();
  });
});
