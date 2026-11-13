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
   * `manualColumnMove` arrays: a load sends an order reached by moves as moves, so every cross-row reference
   * stays on its record. An enable on a live grid whose order no sort set is a load of the same kind.
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

  /**
   * Builds a grid that had Formulas from the start and was sorted the same way through `initialConfig`: a load
   * sends a sorted order as one order, so each moved formula keeps its relative offsets (a known limit, see
   * the plugin's AGENTS.md). An enable on a live sorted grid is a load of the same kind. It cannot see moves
   * the grid made under the sort, so it sends the whole order as one, as this grid does.
   *
   * @param {Array[]} data The data.
   * @param {object} sortConfig The `columnSorting.initialConfig`.
   * @returns {Handsontable}
   */
  function buildReferenceSortedAs(data, sortConfig) {
    return buildReference({ data: copy(data), columnSorting: { initialConfig: sortConfig } }, () => {});
  }

  /**
   * Builds a grid that had Formulas from the start and then took the given row sequence through
   * `setIndexesSequence()`: the engine gets it as one order, as it gets any sequence set on a live grid.
   *
   * @param {Array[]} data The data.
   * @param {number[]} sequence The row sequence.
   * @returns {Handsontable}
   */
  function buildReferenceWithSequence(data, sequence) {
    return buildReference({ data: copy(data) }, grid => grid.rowIndexMapper.setIndexesSequence(sequence));
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

    it('writes the data passed in the same call into the sheet a shared engine already holds under the sheet name', () => {
      const engine = buildEngine();

      engine.addSheet('Theirs');
      engine.setSheetContent(engine.getSheetId('Theirs'), [[10, '=A1+1'], [20, '=A2+1']]);
      hot = new Handsontable(container, { data: [[0, 0]], columnSorting: true, licenseKey: LICENSE_KEY });

      // Core loads the data before the plugins update; the sheet the call names takes it, as at construction.
      hot.updateSettings({ data: copy(OWN_ROW_CONTENT), formulas: { engine, sheetName: 'Theirs' } });

      expect(hot.getPlugin('formulas').sheetName).toBe('Theirs');
      expect(hot.getData()).toEqual([[3, 6], [1, 2], [2, 4]]);
      expect(engineValues(hot)).toEqual([[3, 6], [1, 2], [2, 4]]);

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(hot.getData()).toEqual(OWN_ROW_SORTED);
      expect(engineValues(hot)).toEqual(OWN_ROW_SORTED);
    });

    it('adds the sheet the call names from the data passed in the same call when the engine does not hold it', () => {
      const engine = buildEngine();

      hot = new Handsontable(container, { data: [[0, 0]], columnSorting: true, licenseKey: LICENSE_KEY });

      hot.updateSettings({ data: copy(OWN_ROW_CONTENT), formulas: { engine, sheetName: 'Mine' } });

      expect(hot.getPlugin('formulas').sheetName).toBe('Mine');
      expect(hot.getData()).toEqual([[3, 6], [1, 2], [2, 4]]);

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
      buildReferenceSortedAs(CROSS_ROW_CONTENT, { column: 1, sortOrder: 'asc' });

      expect(hot.getDataAtCol(0)).toEqual(['a', 'b', 'c', 'd']);
      expect(hot.getData()).toEqual(reference.getData());
      expect(engineValues(hot)).toEqual(hot.getData());

      // A re-render reloads the sheet and sends a sorted order as one order again, so the values stay.
      hot.updateSettings({});

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
      buildReferenceSortedAs(CROSS_ROW_CONTENT, { column: 1, sortOrder: 'desc' });

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

      it('sends the order of a re-enabled reordered grid once, from the resync', () => {
        const engine = buildOnSharedEngine();

        hot.rowIndexMapper.setIndexesSequence([3, 0, 1, 2]);
        hot.updateSettings({ formulas: false });

        const setRowOrder = jest.spyOn(engine, 'setRowOrder');
        const moveRows = jest.spyOn(engine, 'moveRows');

        hot.updateSettings({ formulas: { engine, sheetName: 'S' } });
        hot.render();
        buildReferenceInOrderOf(CROSS_ROW_CONTENT, hot);

        // The re-enable writes the sheet again from the data and sends the order once, as a load of a grid in
        // that order does: no sort set it, so it goes as moves (one block: one move), not as one order.
        expect(setRowOrder).not.toHaveBeenCalled();
        expect(moveRows).toHaveBeenCalledTimes(1);
        expect(hot.getData()).toEqual(reference.getData());
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
        buildReferenceWithSequence(CROSS_ROW_CONTENT, [3, 0, 1, 2]);

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
        buildReferenceWithSequence(CROSS_ROW_CONTENT, [3, 0, 1, 2]);

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
      buildReferenceSortedAs(CROSS_ROW_CONTENT, { column: 1, sortOrder: 'desc' });

      expect(hot.getData()).toEqual(reference.getData());
      expect(engineValues(hot)).toEqual(hot.getData());
    });
  });

  /**
   * A grid built from an engine sheet without `data` reads the sheet as its data, and the engine holds the sheet in
   * the grid's order once the grid is sorted or moved. A re-enable has to point the new syncers at that sheet and
   * take over the order the engine holds, or the next sort reorders the grid while the engine keeps its rows: the
   * formula column then showed `8, 6, 4, 2` instead of `2, 4, 6, 8`, and only the no-endpoint warning fired.
   */
  describe('again after it was turned off, on a grid built from an engine sheet', () => {
    const SHEET_CONTENT = [['b', 2, '=B1*2'], ['a', 1, '=B2*2'], ['c', 3, '=B3*2'], ['d', 4, '=B4*2']];
    const SORTED_ASC = [['a', 1, 2], ['b', 2, 4], ['c', 3, 6], ['d', 4, 8]];
    const SORTED_DESC = [['d', 4, 8], ['c', 3, 6], ['b', 2, 4], ['a', 1, 2]];

    /**
     * Builds an engine holding `content` in the `S1` sheet.
     *
     * @param {Array[]} content The sheet content.
     * @returns {HyperFormula}
     */
    function buildEngineWithSheet(content) {
      const engine = buildEngine();

      engine.addSheet('S1');
      engine.setSheetContent(engine.getSheetId('S1'), copy(content));

      return engine;
    }

    /**
     * Counts the order calls an engine gets from now on.
     *
     * @param {HyperFormula} engine The engine.
     * @returns {Function} Returns the number of calls made since.
     */
    function countOrderCalls(engine) {
      const spies = ['moveRows', 'setRowOrder', 'moveColumns', 'setColumnOrder'].map(name => jest.spyOn(engine, name));

      return () => spies.reduce((count, spy) => count + spy.mock.calls.length, 0);
    }

    const reenables = {
      'disablePlugin() and enablePlugin()': () => {
        const plugin = hot.getPlugin('formulas');

        plugin.disablePlugin();
        plugin.enablePlugin();
      },
      'updateSettings() back to the same engine instance and sheet name': (engine) => {
        hot.updateSettings({ formulas: false });
        hot.updateSettings({ formulas: { engine, sheetName: 'S1' } });
      },
      'updateSettings() back to the same engine instance without a sheet name': (engine) => {
        hot.updateSettings({ formulas: false });
        hot.updateSettings({ formulas: { engine } });
      },
      'updateSettings() to an engine class with the sheet name': () => {
        hot.updateSettings({ formulas: false });
        hot.updateSettings({ formulas: { engine: HyperFormula, sheetName: 'S1' } });
      },
    };

    Object.entries(reenables).forEach(([name, reenable]) => {
      it(`sorts a grid sorted before the re-enable, after ${name} (the reported case)`, () => {
        const engine = buildEngineWithSheet(SHEET_CONTENT);
        const warnSpy = jest.spyOn(console, 'warn');

        hot = new Handsontable(container, {
          formulas: { engine, sheetName: 'S1' },
          columnSorting: true,
          licenseKey: LICENSE_KEY,
        });

        hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
        reenable(engine);

        expect(hot.getData()).toEqual(SORTED_DESC);
        expect(engineValues(hot)).toEqual(SORTED_DESC);

        hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

        expect(hot.getData()).toEqual(SORTED_ASC);
        expect(engineValues(hot)).toEqual(SORTED_ASC);
        expect(warnSpy).not.toHaveBeenCalled();
      });
    });

    Object.entries(reenables).forEach(([name, reenable]) => {
      it(`keeps the sort state and the cell meta over a settings update after ${name}`, () => {
        const engine = buildEngineWithSheet(SHEET_CONTENT);

        hot = new Handsontable(container, {
          formulas: { engine, sheetName: 'S1' },
          columnSorting: true,
          licenseKey: LICENSE_KEY,
        });

        hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
        reenable(engine);
        hot.setCellMeta(0, 0, 'probeMeta', 'X');
        // A sheet-built grid reloads its sheet on every settings update. With the snapshot of the disable put back,
        // the reload stays in place; without it, it took `loadData()`, which dropped the sort state and the meta.
        hot.updateSettings({});

        expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
        expect(hot.getCellMeta(0, 0).probeMeta).toBe('X');
        expect(hot.getData()).toEqual(SORTED_DESC);
        expect(engineValues(hot)).toEqual(SORTED_DESC);

        hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

        expect(hot.getData()).toEqual(SORTED_ASC);
        expect(engineValues(hot)).toEqual(SORTED_ASC);
      });
    });

    it('tells a host change made while the plugin was off on the next settings update', () => {
      const engine = buildEngineWithSheet(SHEET_CONTENT);

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1' },
        columnSorting: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      hot.updateSettings({ formulas: false });
      // Changes no value, so the engine reports no event: only the snapshot comparison sees it.
      engine.moveRows(engine.getSheetId('S1'), 0, 1, 4);
      hot.updateSettings({ formulas: { engine, sheetName: 'S1' } });
      hot.setCellMeta(0, 0, 'probeMeta', 'X');
      hot.updateSettings({});

      // The reload took `loadData()`, which drops the meta keyed by physical rows that no longer hold the same record.
      expect(hot.getCellMeta(0, 0).probeMeta).toBeUndefined();
      expect(engineValues(hot)).toEqual(hot.getData());
      expect(hot.getDataAtCol(0)).toEqual(['c', 'b', 'a', 'd']);
    });

    it.each([
      ['removed', grid => grid.alter('remove_row', 0, 1)],
      ['inserted', grid => grid.alter('insert_row_above', 0, 1)],
    ])('loads the engine sheet on a re-enable when a row was %s while the plugin was off', (_, alter) => {
      const engine = buildEngineWithSheet(SHEET_CONTENT);

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1' },
        columnSorting: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      hot.updateSettings({ formulas: false });
      alter(hot);
      hot.updateSettings({ formulas: { engine, sheetName: 'S1' } });

      // The engine never got the change, so the grid shows the sheet as the engine holds it.
      expect(hot.getData()).toEqual(SORTED_DESC);
      expect(engineValues(hot)).toEqual(SORTED_DESC);

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

      expect(hot.getData()).toEqual(SORTED_ASC);
      expect(engineValues(hot)).toEqual(SORTED_ASC);
    });

    it('loads the sheet of another engine instance with other content on a re-enable', () => {
      const engine = buildEngineWithSheet(SHEET_CONTENT);
      const otherEngine = buildEngineWithSheet([['x', 10, '=B1*2'], ['y', 20, '=B2*2'], ['z', 30, '=B3*2'],
        ['w', 40, '=B4*2']]);

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1' },
        columnSorting: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      hot.updateSettings({ formulas: false });
      hot.updateSettings({ formulas: { engine: otherEngine, sheetName: 'S1' } });

      // Not the first engine's records mapped onto the other sheet, and the host's sheet keeps its order.
      expect(hot.getData()).toEqual([['x', 10, 20], ['y', 20, 40], ['z', 30, 60], ['w', 40, 80]]);
      expect(engineValues(hot)).toEqual(hot.getData());
    });

    it('sorts after a re-enable with another engine instance that holds the sheet in physical order', () => {
      const engine = buildEngineWithSheet(SHEET_CONTENT);
      const otherEngine = buildEngineWithSheet(SHEET_CONTENT);

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1' },
        columnSorting: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      hot.updateSettings({ formulas: false });
      hot.updateSettings({ formulas: { engine: otherEngine, sheetName: 'S1' } });

      // The order stored at the disable describes the first engine's sheet, so the grid loads the other one as it is.
      expect(hot.getData()).toEqual([['b', 2, 4], ['a', 1, 2], ['c', 3, 6], ['d', 4, 8]]);
      expect(engineValues(hot)).toEqual(hot.getData());

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

      expect(hot.getData()).toEqual(SORTED_ASC);
      expect(engineValues(hot)).toEqual(SORTED_ASC);
    });

    it('moves the columns of a grid whose columns were moved before the re-enable', () => {
      const engine = buildEngineWithSheet(SHEET_CONTENT);
      const warnSpy = jest.spyOn(console, 'warn');

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1' },
        manualColumnMove: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('manualColumnMove').moveColumns([2], 0);
      hot.render();

      const plugin = hot.getPlugin('formulas');

      plugin.disablePlugin();
      plugin.enablePlugin();
      hot.getPlugin('manualColumnMove').moveColumns([1], 2);
      hot.render();

      expect(hot.getData()).toEqual([[4, 2, 'b'], [2, 1, 'a'], [6, 3, 'c'], [8, 4, 'd']]);
      expect(engineValues(hot)).toEqual(hot.getData());
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('keeps one copy of the sheet while off: the disable of a sorted grid reads the sheet once', () => {
      const engine = buildEngineWithSheet(SHEET_CONTENT);

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1' },
        columnSorting: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

      const getSheetSerialized = jest.spyOn(engine, 'getSheetSerialized');

      // The reload snapshot is kept, and the content of a sheet added back is rebuilt from it on the enable. Called
      // directly: `updateSettings({ formulas: false })` reloads the sheet first, as every update of this grid does.
      hot.getPlugin('formulas').disablePlugin();

      // One read, compared with the snapshot; equal, so only the snapshot is kept.
      expect(getSheetSerialized).toHaveBeenCalledTimes(1);

      hot.updateSettings({ formulas: { engine: HyperFormula, sheetName: 'S1' } });

      expect(hot.getData()).toEqual(SORTED_DESC);
      expect(engineValues(hot)).toEqual(SORTED_DESC);
    });

    describe.each([
      ['a value change', (engine) => {
        engine.setCellContents({ sheet: engine.getSheetId('S1'), row: 3, col: 1 }, 100);
      }, [['d', 4, 8], ['c', 3, 6], ['b', 2, 4], ['a', 100, 200]]],
      ['a move that changes no value', (engine) => {
        engine.moveRows(engine.getSheetId('S1'), 0, 1, 2);
      }, [['c', 3, 6], ['d', 4, 8], ['b', 2, 4], ['a', 1, 2]]],
    ])('with a host change, %s, made after the grid\'s last write and before a direct disable', (
      _, hostChange, hostSheet,
    ) => {
      /**
       * Builds a sorted sheet-built grid, makes the host change, and turns the plugin off directly.
       *
       * @returns {HyperFormula}
       */
      function buildChangedAndDisabled() {
        const engine = buildEngineWithSheet(SHEET_CONTENT);

        hot = new Handsontable(container, {
          formulas: { engine, sheetName: 'S1' },
          columnSorting: true,
          licenseKey: LICENSE_KEY,
        });

        hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
        hostChange(engine);
        hot.getPlugin('formulas').disablePlugin();

        return engine;
      }

      it('keeps the host change when an engine class re-enable adds the sheet back', () => {
        buildChangedAndDisabled();
        hot.updateSettings({ formulas: { engine: HyperFormula, sheetName: 'S1' } });

        expect(engineValues(hot)).toEqual(hostSheet);
        expect(hot.getData()).toEqual(hostSheet);

        hot.updateSettings({});

        expect(hot.getData()).toEqual(hostSheet);
        expect(engineValues(hot)).toEqual(hostSheet);
      });

      it('keeps one copy of the sheet while off, and reloads in full on the re-enable of the same sheet', () => {
        const engine = buildEngineWithSheet(SHEET_CONTENT);

        hot = new Handsontable(container, {
          formulas: { engine, sheetName: 'S1' },
          columnSorting: true,
          licenseKey: LICENSE_KEY,
        });

        hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
        hostChange(engine);

        const getSheetSerialized = jest.spyOn(engine, 'getSheetSerialized');
        const afterLoadData = jest.fn();

        hot.getPlugin('formulas').disablePlugin();

        // One read, kept as the order's content; no second copy (the snapshot) goes with it.
        expect(getSheetSerialized).toHaveBeenCalledTimes(1);

        hot.getPlugin('formulas').enablePlugin();
        hot.addHook('afterLoadData', afterLoadData);
        hot.updateSettings({});

        // A missing snapshot forces a full reload, which keeps the host change.
        expect(afterLoadData).toHaveBeenCalled();
        expect(hot.getData()).toEqual(hostSheet);
      });

      it('keeps the host change when the host removed the sheet before the re-enable', () => {
        const engine = buildChangedAndDisabled();

        engine.removeSheet(engine.getSheetId('S1'));
        hot.getPlugin('formulas').enablePlugin();

        expect(engineValues(hot)).toEqual(hostSheet);
        expect(hot.getData()).toEqual(hostSheet);
      });
    });

    it('sends no order on a re-enable when the grid kept the order the engine holds', () => {
      const engine = buildEngineWithSheet(SHEET_CONTENT);

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1' },
        columnSorting: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

      const plugin = hot.getPlugin('formulas');
      const orderCalls = countOrderCalls(engine);

      plugin.disablePlugin();
      plugin.enablePlugin();

      expect(orderCalls()).toBe(0);
    });

    it('sends a sort made while the plugin was off as one order on the re-enable', () => {
      const engine = buildEngineWithSheet(SHEET_CONTENT);

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1' },
        columnSorting: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      hot.updateSettings({ formulas: false });
      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

      const setRowOrder = jest.spyOn(engine, 'setRowOrder');

      hot.updateSettings({ formulas: { engine, sheetName: 'S1' } });

      expect(setRowOrder).toHaveBeenCalledTimes(1);
      expect(hot.getData()).toEqual(SORTED_ASC);
      expect(engineValues(hot)).toEqual(SORTED_ASC);
    });

    it('keeps the cross-row results of a grid moved before and after the re-enable', () => {
      // Each formula reads the number of the next record (the last one the first). A move keeps every reference
      // on its cell, so each record keeps its result whatever order the moves leave.
      const engine = buildEngineWithSheet(CROSS_ROW_CONTENT);
      const warnSpy = jest.spyOn(console, 'warn');
      const resultsByLetter = () => Object.fromEntries(hot.getData().map(([letter, , result]) => [letter, result]));

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1' },
        manualRowMove: true,
        licenseKey: LICENSE_KEY,
      });

      const expected = resultsByLetter();

      hot.getPlugin('manualRowMove').moveRows([3], 0);
      hot.render();
      hot.updateSettings({ formulas: false });
      hot.updateSettings({ formulas: { engine, sheetName: 'S1' } });

      expect(hot.getDataAtCol(0)).toEqual(['c', 'b', 'a', 'd']);
      expect(resultsByLetter()).toEqual(expected);
      expect(engineValues(hot)).toEqual(hot.getData());

      hot.getPlugin('manualRowMove').moveRows([1], 3);
      hot.render();

      expect(hot.getDataAtCol(0)).toEqual(['c', 'a', 'd', 'b']);
      expect(resultsByLetter()).toEqual(expected);
      expect(engineValues(hot)).toEqual(hot.getData());
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('sends a move made while the plugin was off as one order, as a sheet-built grid given that order gets it', () => {
      const engine = buildEngineWithSheet(CROSS_ROW_CONTENT);

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'S1' },
        manualRowMove: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('manualRowMove').moveRows([3], 0);
      hot.render();
      hot.updateSettings({ formulas: false });
      hot.getPlugin('manualRowMove').moveRows([0], 2);
      hot.render();
      hot.updateSettings({ formulas: { engine, sheetName: 'S1' } });

      // The oracle: a grid built from the same sheet, moved the same way while the plugin was on, then brought to
      // the final order with one order.
      const referenceContainer = document.createElement('div');

      container.appendChild(referenceContainer);
      reference = new Handsontable(referenceContainer, {
        formulas: { engine: buildEngineWithSheet(CROSS_ROW_CONTENT), sheetName: 'S1' },
        manualRowMove: true,
        licenseKey: LICENSE_KEY,
      });
      reference.getPlugin('manualRowMove').moveRows([3], 0);
      reference.render();
      reference.rowIndexMapper.setIndexesSequence(hot.rowIndexMapper.getIndexesSequence());

      expect(hot.getDataAtCol(0)).toEqual(['b', 'a', 'c', 'd']);
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

    // No known path of the plugin leaves the syncers without an endpoint (the shared-engine and sheet-built re-enable
    // cases above pin the last two), so the contract is checked on syncers unbound by hand.
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
