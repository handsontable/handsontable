import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * The axis syncers postpone an index sync they cannot send while no engine sheet is bound. Formulas runs
 * the postponed syncs in the ready step of the init pass (`onGridReady()`), before the `init` hook, which
 * they used to wait for. Every endpoint setup sends the order itself and drops the queue, and a live grid
 * never replays it: without a sheet write the replay would send the order on top of the engine's.
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

  it('should run a sync postponed after the last endpoint setup of the init before the init hook', () => {
    const postponed = jest.fn();
    const callsAtInit = [];

    hot = new Handsontable(container, {
      data: [[1, '=A1*2']],
      formulas: { engine: HyperFormula },
      licenseKey: LICENSE_KEY,
      // After the construction resync, which writes the sheet and sets the sync endpoint up last.
      afterCellMetaReset() {
        this.getPlugin('formulas').indexSyncer.getPostponeAction()(postponed);
      },
      init() {
        callsAtInit.push(postponed.mock.calls.length);
      },
    });

    expect(callsAtInit).toEqual([1]);
    expect(postponed).toHaveBeenCalledTimes(1);
  });

  it('should drop a sync postponed before the init load sets the sync endpoint up', () => {
    const postponed = jest.fn();

    hot = new Handsontable(container, {
      data: [[1, '=A1*2']],
      formulas: { engine: HyperFormula },
      licenseKey: LICENSE_KEY,
      beforeLoadData(_sourceData, initialLoad) {
        if (initialLoad) {
          this.getPlugin('formulas').indexSyncer.getPostponeAction()(postponed);
        }
      },
    });

    // The setup sent the grid's order itself; a replay would send it a second time.
    expect(postponed).not.toHaveBeenCalled();
  });

  it('should not replay a sync postponed on a live grid', () => {
    const postponed = jest.fn();

    hot = new Handsontable(container, {
      data: [[1, '=A1*2']],
      formulas: { engine: HyperFormula },
      licenseKey: LICENSE_KEY,
    });

    const plugin = hot.getPlugin('formulas');

    plugin.indexSyncer.getPostponeAction()(postponed);
    // A direct update writes no sheet, so nothing sets the sync endpoint up again, and only the ready step
    // could replay the sync.
    plugin.updatePlugin({});

    expect(postponed).not.toHaveBeenCalled();

    // A data load writes the sheet and sets the endpoint up, which sends the order and drops the queue.
    hot.loadData([[2, '=A1*3']]);
    hot.updateSettings({ formulas: { engine: plugin.engine, sheetName: plugin.sheetName } });

    expect(postponed).not.toHaveBeenCalled();
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
