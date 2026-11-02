import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * Plugins whose data-dependent work `Core#_applySettingsAndData()` holds back for their
 * `onDataReady()` step, exercised through the call the sheets bar makes on every switch.
 */
describe('plugins applied ahead of their data', () => {
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

  it('keeps a declared Pagination page that the previous data was too short for', () => {
    hot = new Handsontable(container, { data: [[1]], licenseKey: LICENSE_KEY });

    hot._applySettingsAndData(
      { pagination: { pageSize: 2, initialPage: 3 } },
      Array.from({ length: 10 }, (_, row) => [row]),
      'test',
    );

    expect(hot.getPlugin('pagination').enabled).toBe(true);
    expect(hot.getPlugin('pagination').getCurrentPage()).toBe(3);
  });

  it('shows the empty state only when the new data is empty, never for the rows the grid held', () => {
    const shown = jest.fn();

    hot = new Handsontable(container, { data: [], afterEmptyDataStateShow: shown, licenseKey: LICENSE_KEY });

    hot._applySettingsAndData({ emptyDataState: true }, [[1], [2]], 'test');

    expect(shown).not.toHaveBeenCalled();
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);

    hot._applySettingsAndData({ emptyDataState: { message: 'Nothing here' } }, [], 'test');

    expect(shown).toHaveBeenCalledTimes(1);
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
  });

  it('applies a ColumnSummary to the new rows without writing into the rows the grid held', () => {
    const departing = [['Draft'], ['Final'], ['Keep me']];
    const arriving = [[1], [2], [null]];

    hot = new Handsontable(container, { data: departing, licenseKey: LICENSE_KEY });

    hot._applySettingsAndData({
      columnSummary: [{ sourceColumn: 0, destinationRow: 2, destinationColumn: 0, type: 'sum', ranges: [[0, 1]] }],
    }, arriving, 'test');

    expect(departing[2][0]).toBe('Keep me');
    expect(hot.getDataAtCell(2, 0)).toBe(3);
  });

  it('feeds Formulas the value a cell type from the `cell` option resolves on the new data', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [['x']],
      formulas: { engine, sheetName: 'First' },
      licenseKey: LICENSE_KEY,
    });

    hot._applySettingsAndData({
      formulas: { engine, sheetName: 'Second' },
      cell: [{ row: 0, col: 0, type: 'dropdown', source: [{ key: 1, value: 'Apple' }] }],
    }, [[{ key: 1, value: 'Apple' }, '=A1']], 'test');

    expect(hot.getDataAtCell(0, 1)).toBe('Apple');
  });

  it('feeds Formulas the value a cell type from a `columns` function resolves on the new data', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [['x']],
      formulas: { engine, sheetName: 'First' },
      licenseKey: LICENSE_KEY,
    });

    hot._applySettingsAndData({
      formulas: { engine, sheetName: 'Second' },
      columns: column => (column === 0 ? { type: 'dropdown', source: [{ key: 1, value: 'Apple' }] } : {}),
    }, [[{ key: 1, value: 'Apple' }, '=A1']], 'test');

    expect(hot.getDataAtCell(0, 1)).toBe('Apple');
  });

  it('feeds Formulas the value the new data has once `columns: null` drops the previous column types', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const reference = new Handsontable(document.createElement('div'), {
      data: [[{ key: 1, value: 'Apple' }, '=A1']],
      formulas: { engine: HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' }) },
      licenseKey: LICENSE_KEY,
    });
    const expected = reference.getDataAtCell(0, 1);

    reference.destroy();
    hot = new Handsontable(container, {
      data: [['x', null]],
      columns: [{ type: 'dropdown', source: [{ key: 1, value: 'Apple' }] }, {}],
      formulas: { engine, sheetName: 'First' },
      licenseKey: LICENSE_KEY,
    });

    hot._applySettingsAndData({
      formulas: { engine, sheetName: 'Second' },
      columns: null,
    }, [[{ key: 1, value: 'Apple' }, '=A1']], 'test');

    expect(expected).not.toBe('Apple');
    expect(hot.getDataAtCell(0, 1)).toBe(expected);
  });

  describe('ColumnSummary#exportEndpointSettings', () => {
    /**
     * Builds a grid with the given summary and returns what the plugin exports.
     *
     * @param {Array|Function} columnSummary The `columnSummary` setting.
     * @returns {Array|null}
     */
    function exportFor(columnSummary) {
      hot = new Handsontable(container, {
        data: [[1], [2], [3], [null]],
        columnSummary,
        licenseKey: LICENSE_KEY,
      });

      return hot.getPlugin('columnSummary').exportEndpointSettings();
    }

    it('gives a destination counted from the bottom back as its offset', () => {
      const [endpoint] = exportFor([{
        sourceColumn: 0,
        destinationRow: 0,
        destinationColumn: 0,
        reversedRowCoords: true,
        ranges: [[0, 2]],
      }]);

      expect(endpoint.destinationRow).toBe(0);
      expect(endpoint.reversedRowCoords).toBe(true);
    });

    it('leaves a whole-table default range out, and keeps an explicit one', () => {
      const [defaultRange, explicitRange] = exportFor([
        { sourceColumn: 0, destinationRow: 3, destinationColumn: 0 },
        { sourceColumn: 0, destinationRow: 3, destinationColumn: 0, ranges: [[0, 1]] },
      ]);

      expect('ranges' in defaultRange).toBe(false);
      expect(explicitRange.ranges).toEqual([[0, 1]]);
    });

    it('exports nothing for the function form', () => {
      expect(exportFor(() => [{ sourceColumn: 0, destinationRow: 3, destinationColumn: 0 }])).toBe(null);
    });

    it('keeps an empty `ranges` empty, so a return does not widen it to the whole table', () => {
      const [endpoint] = exportFor([{
        sourceColumn: 0,
        destinationRow: 3,
        destinationColumn: 0,
        type: 'sum',
        ranges: [],
      }]);

      expect(endpoint.ranges).toEqual([]);
    });
  });

  /**
   * Builds a grid whose next `afterLoadData` runs `update` once, the way a host listener does while
   * a sheet switch loads its data.
   *
   * @param {object} settings The grid settings.
   * @param {Function} update The settings update to make from the listener.
   */
  function createGridUpdatingAfterLoad(settings, update) {
    hot = new Handsontable(container, { ...settings, licenseKey: LICENSE_KEY });

    const listener = () => {
      hot.removeHook('afterLoadData', listener);
      update();
    };

    hot.addHook('afterLoadData', listener);
  }

  it('builds the NestedRows tree for an enable made from afterLoadData, once the call has loaded its data', () => {
    createGridUpdatingAfterLoad({ data: [{ name: 'old' }] }, () => hot.updateSettings({ nestedRows: true }));

    hot._applySettingsAndData({ colHeaders: true }, [{ name: 'parent', __children: [{ name: 'child' }] }], 'test');

    expect(hot.getPlugin('nestedRows').enabled).toBe(true);
    expect(hot.getDataAtCol(0)).toEqual(['parent', 'child']);
  });

  it('evaluates the loaded data for a Formulas enable made from afterLoadData', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    createGridUpdatingAfterLoad({ data: [['old']] }, () => hot.updateSettings({ formulas: { engine } }));

    hot._applySettingsAndData({ colHeaders: true }, [[1, '=A1+1']], 'test');

    expect(hot.getDataAtCell(0, 1)).toBe(2);
  });

  it('feeds Formulas the column types an afterLoadData listener sets during the call', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    createGridUpdatingAfterLoad({
      data: [['x', null]],
      formulas: { engine, sheetName: 'First' },
    }, () => hot.updateSettings({ columns: [{ type: 'dropdown', source: [{ key: 1, value: 'Apple' }] }, {}] }));
    engine.addSheet('Second');

    hot._applySettingsAndData({
      formulas: { engine, sheetName: 'Second' },
    }, [[{ key: 1, value: 'Apple' }, '=A1']], 'test');

    expect(hot.getDataAtCell(0, 1)).toBe('Apple');
  });

  it('feeds Formulas the text a `cell` entry preserves with `preserveTextValue`', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [['x', null]],
      formulas: { engine, sheetName: 'First' },
      licenseKey: LICENSE_KEY,
    });
    engine.addSheet('Second');

    hot._applySettingsAndData({
      formulas: { engine, sheetName: 'Second' },
      columns: [{ type: 'text' }, {}],
      cell: [{ row: 0, col: 0, preserveTextValue: true }],
    }, [['007', '=A1']], 'test');

    expect(hot.getDataAtCell(0, 1)).toBe('007');
  });

  it('writes the Formulas engine once for a switch whose `cell` entries set no value-reading key', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [['x']],
      formulas: { engine, sheetName: 'First' },
      licenseKey: LICENSE_KEY,
    });
    engine.addSheet('Second');

    const writes = jest.spyOn(engine, 'setSheetContent');

    hot._applySettingsAndData({
      formulas: { engine, sheetName: 'Second' },
      cell: [{ row: 0, col: 0, readOnly: true }],
    }, [[1, '=A1+1']], 'test');

    expect(writes).toHaveBeenCalledTimes(1);
    expect(hot.getDataAtCell(0, 1)).toBe(2);
  });
});
