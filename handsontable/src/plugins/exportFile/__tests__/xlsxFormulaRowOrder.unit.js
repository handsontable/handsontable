import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../index';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';

/**
 * Review round 12 (PR #13634): with `exportFormulas`, every exported cell must carry the formula of
 * the record it shows. `getSourceDataAtCell` takes a physical row, and the export walked visual rows,
 * so a sorted, moved, trimmed or filtered grid paired a cell with another record's formula, next to
 * this record's cached value and error flag. A trimmed or filtered-out record also stays in the
 * formula engine, so the references below it are shifted up like those below an excluded hidden row.
 */
describe('Xlsx export: formulas of a reordered or trimmed grid', () => {
  let container;
  let hot;
  let writeSpy;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    writeSpy = jest.spyOn(nativeAdapter, 'write').mockResolvedValue(new Uint8Array());
  });

  afterEach(() => {
    writeSpy.mockRestore();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  const createData = () => [[3, 'x', '=A1*10'], [1, 'y', '=A2*100'], [2, 'z', '=A3*1000']];

  async function exportedColumn(settings, act, exportOptions = {}) {
    hot = new Handsontable(container, {
      data: createData(),
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      exportFile: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });
    act?.(hot);

    await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true, ...exportOptions });

    const [snapshot] = writeSpy.mock.calls[0];

    return snapshot.sheets[0].rows.map(row => row[2].formula);
  }

  it('should export the formula of each record after a sort', async() => {
    const column = await exportedColumn({ columnSorting: true }, (grid) => {
      grid.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
    });

    expect(hot.getDataAtCol(2)).toEqual([100, 2000, 30]);
    expect(column).toEqual([
      { text: 'A1*100', result: 100 },
      { text: 'A2*1000', result: 2000 },
      { text: 'A3*10', result: 30 },
    ]);
  });

  it('should export the formula of each record after a row move', async() => {
    const column = await exportedColumn({ manualRowMove: true }, (grid) => {
      grid.getPlugin('manualRowMove').moveRows([1], 0);
    });

    expect(hot.getDataAtCol(2)).toEqual([100, 30, 2000]);
    expect(column).toEqual([
      { text: 'A1*100', result: 100 },
      { text: 'A2*10', result: 30 },
      { text: 'A3*1000', result: 2000 },
    ]);
  });

  it('should export the formula of each record and shift the references past a trimmed row', async() => {
    const column = await exportedColumn({ trimRows: [1] });

    expect(hot.getDataAtCol(2)).toEqual([30, 2000]);
    expect(column).toEqual([
      { text: 'A1*10', result: 30 },
      { text: 'A2*1000', result: 2000 },
    ]);
  });

  it('should export the formula of each record and shift the references past a filtered-out row', async() => {
    const column = await exportedColumn({ filters: true }, (grid) => {
      const filters = grid.getPlugin('filters');

      filters.addCondition(1, 'neq', ['y']);
      filters.filter();
    });

    expect(hot.getDataAtCol(2)).toEqual([30, 2000]);
    expect(column).toEqual([
      { text: 'A1*10', result: 30 },
      { text: 'A2*1000', result: 2000 },
    ]);
  });

  it('should shift the references past a hidden row of a sorted grid by its engine row', async() => {
    const column = await exportedColumn({ columnSorting: true, hiddenRows: true }, (grid) => {
      grid.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
      grid.getPlugin('hiddenRows').hideRow(1);
    }, { exportHiddenRows: false });

    expect(column).toEqual([
      { text: 'A1*100', result: 100 },
      { text: 'A2*10', result: 30 },
    ]);
  });

  it('should pair the error flag with the formula that produced it after a sort', async() => {
    hot = new Handsontable(container, {
      data: [[0, '=1/A1'], [2, '=1/A2']],
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      columnSorting: true,
      exportFile: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

    await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true });

    const [snapshot] = writeSpy.mock.calls[0];

    expect(snapshot.sheets[0].rows.map(row => row[1].formula)).toEqual([
      { text: '1/A1', result: 0.5 },
      { text: '1/A2', result: '#DIV/0!', resultIsError: true },
    ]);
  });
});
