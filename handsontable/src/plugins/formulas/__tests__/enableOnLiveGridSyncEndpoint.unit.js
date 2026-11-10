import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const LICENSE_KEY = TEST_LICENSE_KEY;
const OWN_ROW_CONTENT = [[3, '=A1*2'], [1, '=A2*2'], [2, '=A3*2']];
const OWN_ROW_SORTED = [[1, 2], [2, 4], [3, 6]];
// Each formula reads the number of the next record (the last one the first), so a mis-mapping that swaps whole
// rows shows, and so does a reference the engine rewrote on the way.
const CROSS_ROW_CONTENT = [['b', 2, '=B2*10'], ['a', 1, '=B3*10'], ['d', 4, '=B4*10'], ['c', 3, '=B1*10']];

/**
 * Copies a sheet, so no test writes into the arrays another test loads.
 *
 * @param {Array[]} rows The rows.
 * @returns {Array[]}
 */
function copy(rows) {
  return rows.map(row => row.slice());
}

/**
 * Builds an engine for a test that shares one between the grid and the host.
 *
 * @returns {HyperFormula}
 */
function buildEngine() {
  return HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
}

/**
 * Reads the values of the sheet the grid is bound to, in the engine's own order.
 *
 * @param {Handsontable} hot The grid.
 * @returns {Array[]}
 */
function engineValues(hot) {
  const { engine, sheetId } = hot.getPlugin('formulas');

  // An error reads as its text, as the grid shows it.
  return engine.getSheetValues(sheetId)
    .map(row => row.map(value => (value !== null && typeof value === 'object' ? value.value : value)));
}

/**
 * The grid enables Formulas on a live grid (`updateSettings({ formulas })`, a re-enable, the API) after the
 * grid may have been sorted or moved. Every such path binds the plugin to an engine sheet it fills from the
 * source data, which holds the rows in physical order, so it has to point the order syncers at that sheet
 * and bring the sheet to the grid's order. Before the fix, nothing set the endpoint up: develop threw on the
 * first sort (`getSheetDimensions` of a null engine), and a guard turned that into a sort the engine never
 * got, so the formula column kept the unsorted results.
 */
describe('Formulas enabled on a live grid', () => {
  let container;
  let hot;
  let reference;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    hot?.destroy();
    hot = null;
    reference?.destroy();
    reference = null;
    container.remove();
  });

  /**
   * Builds a grid that had Formulas from the start and ran `act` afterwards: what the grid that enables the
   * plugin later has to show.
   *
   * @param {object} settings The grid settings, without `formulas`.
   * @param {Function} act What the grid does once built.
   * @returns {Handsontable}
   */
  function buildReference(settings, act) {
    const referenceContainer = document.createElement('div');

    container.appendChild(referenceContainer);
    reference = new Handsontable(referenceContainer, {
      ...settings,
      formulas: { engine: HyperFormula },
      licenseKey: LICENSE_KEY,
    });
    act(reference);

    return reference;
  }

  /**
   * Builds a grid that had Formulas from the start, in the given order through the initial `manualRowMove` and
   * `manualColumnMove` arrays: the order reaches its engine as one order at init, the way an enable on a live
   * grid sends the order the grid already has (cross-row references follow the engine's own rewrite).
   *
   * @param {Array[]} data The data.
   * @param {Handsontable} grid The grid whose current order the reference takes.
   * @returns {Handsontable}
   */
  function buildReferenceInOrderOf(data, grid) {
    return buildReference({
      data: copy(data),
      manualRowMove: grid.rowIndexMapper.getIndexesSequence(),
      manualColumnMove: grid.columnIndexMapper.getIndexesSequence(),
    }, () => {});
  }

  describe('through updateSettings()', () => {
    it('sorts the formula column with an engine class (the reported case)', () => {
      hot = new Handsontable(container, { data: copy(OWN_ROW_CONTENT), columnSorting: true, licenseKey: LICENSE_KEY });

      hot.updateSettings({ formulas: { engine: HyperFormula } });
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(hot.getData()).toEqual(OWN_ROW_SORTED);
      expect(engineValues(hot)).toEqual(OWN_ROW_SORTED);
    });

    it('sorts the formula column with a shared engine instance', () => {
      const engine = buildEngine();

      hot = new Handsontable(container, { data: copy(OWN_ROW_CONTENT), columnSorting: true, licenseKey: LICENSE_KEY });

      hot.updateSettings({ formulas: { engine } });
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(hot.getData()).toEqual(OWN_ROW_SORTED);
      expect(engineValues(hot)).toEqual(OWN_ROW_SORTED);
    });

    it('sorts the formula column with a shared engine and a sheet name the engine does not hold', () => {
      const engine = buildEngine();

      hot = new Handsontable(container, { data: copy(OWN_ROW_CONTENT), columnSorting: true, licenseKey: LICENSE_KEY });

      hot.updateSettings({ formulas: { engine, sheetName: 'Mine' } });
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(hot.getPlugin('formulas').sheetName).toBe('Mine');
      expect(hot.getData()).toEqual(OWN_ROW_SORTED);
      expect(engineValues(hot)).toEqual(OWN_ROW_SORTED);
    });

    it('sorts the sheet a shared engine already holds under the sheet name', () => {
      const engine = buildEngine();

      engine.addSheet('Theirs');
      engine.setSheetContent(engine.getSheetId('Theirs'), copy(OWN_ROW_CONTENT));
      hot = new Handsontable(container, { data: [[0, 0]], columnSorting: true, licenseKey: LICENSE_KEY });

      hot.updateSettings({ formulas: { engine, sheetName: 'Theirs' } });
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(hot.getData()).toEqual(OWN_ROW_SORTED);
      expect(engineValues(hot)).toEqual(OWN_ROW_SORTED);
    });

    it('fills the engine with the data passed in the same call, and sorts it', () => {
      hot = new Handsontable(container, { data: [[0, 0]], columnSorting: true, licenseKey: LICENSE_KEY });

      // Core loads the data before the plugins update, so the plugin this call enables never saw the load.
      hot.updateSettings({ data: copy(OWN_ROW_CONTENT), formulas: { engine: HyperFormula } });

      expect(hot.getData()).toEqual([[3, 6], [1, 2], [2, 4]]);

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(hot.getData()).toEqual(OWN_ROW_SORTED);
      expect(engineValues(hot)).toEqual(OWN_ROW_SORTED);
    });

    it('fills the engine with the data of the same call in the order an initial sort of that call gives', () => {
      hot = new Handsontable(container, { data: [[0, 0]], columnSorting: true, licenseKey: LICENSE_KEY });

      hot.updateSettings({
        data: copy(OWN_ROW_CONTENT),
        formulas: { engine: HyperFormula },
        columnSorting: { initialConfig: { column: 0, sortOrder: 'asc' } },
      });

      expect(hot.getData()).toEqual(OWN_ROW_SORTED);
      expect(engineValues(hot)).toEqual(OWN_ROW_SORTED);
    });

    it('follows a setIndexesSequence() made after the enable', () => {
      hot = new Handsontable(container, { data: copy(OWN_ROW_CONTENT), licenseKey: LICENSE_KEY });

      hot.updateSettings({ formulas: { engine: HyperFormula } });
      hot.rowIndexMapper.setIndexesSequence([1, 2, 0]);

      expect(hot.getData()).toEqual(OWN_ROW_SORTED);
      expect(engineValues(hot)).toEqual(OWN_ROW_SORTED);
    });

    it('moves rows made after the enable, with the API and with an array', () => {
      const settings = { data: copy(CROSS_ROW_CONTENT), manualRowMove: true };

      buildReference(settings, (grid) => {
        grid.getPlugin('manualRowMove').moveRows([3], 0);
        grid.render();
      });
      hot = new Handsontable(container, { ...settings, data: copy(CROSS_ROW_CONTENT), licenseKey: LICENSE_KEY });

      hot.updateSettings({ formulas: { engine: HyperFormula } });
      hot.getPlugin('manualRowMove').moveRows([3], 0);
      hot.render();

      expect(hot.getData()).toEqual(reference.getData());
      expect(hot.getData()).toEqual([['c', 3, 20], ['b', 2, 10], ['a', 1, 40], ['d', 4, 30]]);
      expect(engineValues(hot)).toEqual(hot.getData());

      hot.updateSettings({ manualRowMove: [1, 0, 2, 3] });
      reference.updateSettings({ manualRowMove: [1, 0, 2, 3] });

      expect(hot.getData()).toEqual(reference.getData());
      expect(engineValues(hot)).toEqual(hot.getData());
    });

    it('takes an edit made after the enable and a sort', () => {
      hot = new Handsontable(container, { data: copy(OWN_ROW_CONTENT), columnSorting: true, licenseKey: LICENSE_KEY });

      hot.updateSettings({ formulas: { engine: HyperFormula } });
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
      hot.setDataAtCell(0, 0, 10);

      // The edited row keeps its place (the sort is not re-run on edit) and its formula reads the new value.
      expect(hot.getDataAtRow(0)).toEqual([10, 20]);
      expect(engineValues(hot)).toEqual(hot.getData());
    });

    it('brings the engine to the order of a grid sorted before the enable', () => {
      hot = new Handsontable(container, { data: copy(OWN_ROW_CONTENT), columnSorting: true, licenseKey: LICENSE_KEY });

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
      hot.updateSettings({ formulas: { engine: HyperFormula } });

      expect(hot.getData()).toEqual(OWN_ROW_SORTED);
      expect(engineValues(hot)).toEqual(OWN_ROW_SORTED);

      hot.getPlugin('columnSorting').clearSort();

      expect(hot.getData()).toEqual([[3, 6], [1, 2], [2, 4]]);
      expect(engineValues(hot)).toEqual(hot.getData());
    });

    it('sends the order of a grid sorted before the enable as a grid built in that order gets it', () => {
      hot = new Handsontable(container, {
        data: copy(CROSS_ROW_CONTENT), columnSorting: true, licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });
      hot.updateSettings({ formulas: { engine: HyperFormula } });
      buildReferenceInOrderOf(CROSS_ROW_CONTENT, hot);

      expect(hot.getDataAtCol(0)).toEqual(['a', 'b', 'c', 'd']);
      expect(hot.getData()).toEqual(reference.getData());
      expect(engineValues(hot)).toEqual(hot.getData());
    });

    it('sends the order of a grid moved before the enable as a grid built in that order gets it', () => {
      hot = new Handsontable(container, {
        data: copy(CROSS_ROW_CONTENT), manualRowMove: true, licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('manualRowMove').moveRows([3], 0);
      hot.updateSettings({ formulas: { engine: HyperFormula } });
      buildReferenceInOrderOf(CROSS_ROW_CONTENT, hot);

      expect(hot.getDataAtCol(0)).toEqual(['c', 'b', 'a', 'd']);
      expect(hot.getData()).toEqual(reference.getData());
      expect(engineValues(hot)).toEqual(hot.getData());
    });

    it('sends the order of a grid moved and then sorted before the enable as a grid built in that order gets it', () => {
      hot = new Handsontable(container, {
        data: copy(CROSS_ROW_CONTENT),
        manualRowMove: true,
        columnSorting: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('manualRowMove').moveRows([3], 0);
      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      hot.updateSettings({ formulas: { engine: HyperFormula } });
      buildReferenceInOrderOf(CROSS_ROW_CONTENT, hot);

      expect(hot.getDataAtCol(0)).toEqual(['d', 'c', 'b', 'a']);
      expect(hot.getData()).toEqual(reference.getData());
      expect(engineValues(hot)).toEqual(hot.getData());

      hot.getPlugin('columnSorting').clearSort();

      expect(hot.getDataAtCol(0)).toEqual(['c', 'b', 'a', 'd']);
      expect(engineValues(hot)).toEqual(hot.getData());
    });

    it('does not throw when an array formula keeps the engine from taking the order of a grid moved before the enable', () => {
      hot = new Handsontable(container, {
        data: [[1, 2, '=TRANSPOSE(A1:B1)'], [3, 4, null], [5, 6, null]],
        manualRowMove: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('manualRowMove').moveRows([1], 0);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => hot.updateSettings({ formulas: { engine: HyperFormula } })).not.toThrow();
      // The engine refuses the order, and the order warning names it.
      expect(warnSpy.mock.calls.map(([message]) => message).join('\n'))
        .toMatch(/cannot reorder the rows an array formula spans/);

      warnSpy.mockRestore();
    });

    it('sends the column order of a grid moved before the enable as a grid built in that order gets it', () => {
      const data = [[1, '=A1+10', 100], [2, '=A2+10', 200]];

      hot = new Handsontable(container, { data: copy(data), manualColumnMove: true, licenseKey: LICENSE_KEY });

      hot.getPlugin('manualColumnMove').moveColumns([2], 0);
      hot.updateSettings({ formulas: { engine: HyperFormula } });
      buildReferenceInOrderOf(data, hot);

      expect(hot.getData()).toEqual(reference.getData());
      expect(engineValues(hot)).toEqual(hot.getData());
    });
  });

  describe('again after it was turned off', () => {
    it('sorts after a re-enable with an engine class', () => {
      hot = new Handsontable(container, {
        data: copy(OWN_ROW_CONTENT),
        columnSorting: true,
        formulas: { engine: HyperFormula },
        licenseKey: LICENSE_KEY,
      });

      hot.updateSettings({ formulas: false });
      hot.updateSettings({ formulas: { engine: HyperFormula } });
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(hot.getData()).toEqual(OWN_ROW_SORTED);
      expect(engineValues(hot)).toEqual(OWN_ROW_SORTED);
    });

    it('sorts after a re-enable with a shared engine that still holds the sheet', () => {
      const engine = buildEngine();

      hot = new Handsontable(container, {
        data: copy(OWN_ROW_CONTENT),
        columnSorting: true,
        formulas: { engine, sheetName: 'S' },
        licenseKey: LICENSE_KEY,
      });

      hot.updateSettings({ formulas: false });
      hot.updateSettings({ formulas: { engine, sheetName: 'S' } });
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(hot.getData()).toEqual(OWN_ROW_SORTED);
      expect(engineValues(hot)).toEqual(OWN_ROW_SORTED);
    });

    describe('with a shared engine that still holds the sheet, before anything reads or renders', () => {
      /**
       * Builds a grid on a shared engine sheet `S` with cross-row formulas and turns Formulas off. The enable that
       * follows binds the sheet the engine still holds and owes a resync, which the next read or render drains.
       *
       * @returns {HyperFormula}
       */
      function buildOnSharedEngine() {
        const engine = buildEngine();

        hot = new Handsontable(container, {
          data: copy(CROSS_ROW_CONTENT),
          manualRowMove: true,
          formulas: { engine, sheetName: 'S' },
          licenseKey: LICENSE_KEY,
        });

        return engine;
      }

      it('sends the order of a re-enabled sorted grid once, from the resync', () => {
        const engine = buildOnSharedEngine();

        hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
        hot.updateSettings({ formulas: false });

        const setRowOrder = jest.spyOn(engine, 'setRowOrder');

        hot.updateSettings({ formulas: { engine, sheetName: 'S' } });
        hot.render();

        expect(setRowOrder).toHaveBeenCalledTimes(1);
        expect(engineValues(hot)).toEqual(hot.getData());
      });

      it('takes a sequence change made right after an updateSettings() re-enable, with no warning', () => {
        const engine = buildOnSharedEngine();
        const warnSpy = jest.spyOn(console, 'warn');

        hot.suspendRender();
        hot.updateSettings({ formulas: false });
        hot.updateSettings({ formulas: { engine, sheetName: 'S' } });
        hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
        hot.resumeRender();
        buildReferenceInOrderOf(CROSS_ROW_CONTENT, hot);

        expect(warnSpy).not.toHaveBeenCalled();
        expect(hot.getDataAtCol(0)).toEqual(['c', 'b', 'a', 'd']);
        expect(hot.getData()).toEqual(reference.getData());
        expect(engineValues(hot)).toEqual(hot.getData());

        warnSpy.mockRestore();
      });

      it('takes a row move made right after an updateSettings() re-enable, with no warning', () => {
        const engine = buildOnSharedEngine();
        const warnSpy = jest.spyOn(console, 'warn');

        hot.suspendRender();
        hot.updateSettings({ formulas: false });
        hot.updateSettings({ formulas: { engine, sheetName: 'S' } });

        const moveRowsSpy = jest.spyOn(engine, 'moveRows');

        hot.getPlugin('manualRowMove').moveRows([3], 0);

        // Only a syncer that points at the sheet sends the move; without the endpoint it was dropped.
        expect(moveRowsSpy).toHaveBeenCalledTimes(1);

        hot.resumeRender();

        expect(warnSpy).not.toHaveBeenCalled();
        expect(hot.getDataAtCol(0)).toEqual(['c', 'b', 'a', 'd']);
        expect(engineValues(hot)).toEqual(hot.getData());

        warnSpy.mockRestore();
      });

      it('takes a sequence change made right after disablePlugin() and enablePlugin(), with no warning', () => {
        buildOnSharedEngine();

        const plugin = hot.getPlugin('formulas');
        const warnSpy = jest.spyOn(console, 'warn');

        plugin.disablePlugin();
        plugin.enablePlugin();
        hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
        buildReferenceInOrderOf(CROSS_ROW_CONTENT, hot);

        expect(warnSpy).not.toHaveBeenCalled();
        expect(hot.getData()).toEqual(reference.getData());
        expect(engineValues(hot)).toEqual(hot.getData());

        warnSpy.mockRestore();
      });
    });

    it('sorts after disablePlugin() and enablePlugin() called directly', () => {
      hot = new Handsontable(container, {
        data: copy(OWN_ROW_CONTENT),
        columnSorting: true,
        formulas: { engine: HyperFormula, sheetName: 'S' },
        licenseKey: LICENSE_KEY,
      });

      const plugin = hot.getPlugin('formulas');

      plugin.disablePlugin();
      plugin.enablePlugin();
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(hot.getData()).toEqual(OWN_ROW_SORTED);
      expect(engineValues(hot)).toEqual(OWN_ROW_SORTED);
    });

    it('brings the engine to the order a grid took while the plugin was off', () => {
      hot = new Handsontable(container, {
        data: copy(CROSS_ROW_CONTENT),
        manualRowMove: true,
        columnSorting: true,
        formulas: { engine: HyperFormula },
        licenseKey: LICENSE_KEY,
      });

      hot.updateSettings({ formulas: false });
      hot.getPlugin('manualRowMove').moveRows([3], 0);
      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      hot.updateSettings({ formulas: { engine: HyperFormula } });
      buildReferenceInOrderOf(CROSS_ROW_CONTENT, hot);

      expect(hot.getData()).toEqual(reference.getData());
      expect(engineValues(hot)).toEqual(hot.getData());
    });
  });

  it('warns once, and does not throw, when an order reaches a syncer that is bound to no engine sheet', () => {
    hot = new Handsontable(container, {
      data: copy(OWN_ROW_CONTENT),
      formulas: { engine: HyperFormula },
      licenseKey: LICENSE_KEY,
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // No path of the plugin leaves the syncers without an endpoint (the shared-engine re-enable cases above pin the
    // last one), so the contract is checked on syncers unbound by hand.
    hot.getPlugin('formulas').indexSyncer.setupSyncEndpoint(null, null, false);

    expect(() => {
      hot.rowIndexMapper.setIndexesSequence([1, 2, 0]);
      hot.rowIndexMapper.setIndexesSequence([2, 0, 1]);
    }).not.toThrow();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/got a row order before it was bound to an engine sheet/);

    warnSpy.mockRestore();
  });
});
