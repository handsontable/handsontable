import HyperFormula from 'hyperformula';
import Handsontable from '../../../../base';
import { registerAllModules } from '../../../../registry';

registerAllModules();

describe('AxisSyncer against a sheet shorter than the grid', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  it('should sort a grid whose trailing rows are empty and carry the order into the engine', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[3, 'c'], [1, 'a'], [2, 'b'], [null, null], [null, null]],
      formulas: { engine, sheetName: 'Sheet1' },
      columnSorting: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const sheetId = engine.getSheetId('Sheet1');

    // The engine sizes a sheet by the extent of its content, so the two empty rows are not counted and
    // the sheet is shorter than the grid.
    expect(engine.getSheetDimensions(sheetId).height).toBeLessThan(hot.countRows());

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, null, null]);
    expect(engine.getSheetSerialized(sheetId).map(row => row[0])).toEqual([1, 2, 3]);
  });

  it('should keep the engine and the grid in step when the same grid is sorted twice', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[3, 'c'], [1, 'a'], [2, 'b'], [null, null]],
      formulas: { engine, sheetName: 'Sheet1' },
      columnSorting: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const sheetId = engine.getSheetId('Sheet1');
    const sorting = hot.getPlugin('columnSorting');

    sorting.sort({ column: 0, sortOrder: 'asc' });
    sorting.sort({ column: 0, sortOrder: 'desc' });

    expect(hot.getDataAtCol(0)).toEqual([3, 2, 1, null]);
    expect(engine.getSheetSerialized(sheetId).map(row => row[0])).toEqual([3, 2, 1]);
  });

  it('should keep row values and source formulas when a trailing blank row moves ahead of the others', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [['10', '=A1*2'], ['20', '=A2*2'], [null, null]],
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rowIndexMapper.setIndexesSequence([2, 1, 0]);

    expect(hot.getData()).toEqual([[null, null], ['20', 40], ['10', 20]]);
    expect(hot.getSourceData()).toEqual([['10', '=A1*2'], ['20', '=A2*2'], [null, null]]);
  });

  it('should keep row values and source formulas when an appended blank row is moved in front', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [['10', null, '=A1*2'], ['20', null, '=A2*2'], ['30', null, '=A3*2']],
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.alter('insert_row_below', hot.countRows() - 1);
    hot.rowIndexMapper.setIndexesSequence([3, 2, 1, 0]);

    expect(hot.getData()).toEqual([
      [null, null, null],
      ['30', null, 60],
      ['20', null, 40],
      ['10', null, 20],
    ]);
    expect(hot.getSourceData()).toEqual([
      ['10', null, '=A1*2'],
      ['20', null, '=A2*2'],
      ['30', null, '=A3*2'],
      [null, null, null],
    ]);
  });

  it('should keep column values and source formulas when a trailing blank column moves ahead of the others', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [['10', '=A1*2', null], ['20', '=A2*2', null]],
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.columnIndexMapper.setIndexesSequence([2, 0, 1]);

    expect(hot.getData()).toEqual([[null, '10', 20], [null, '20', 40]]);
    expect(hot.getSourceData()).toEqual([['10', '=A1*2', null], ['20', '=A2*2', null]]);
  });

  it('should keep column values and source formulas when an appended blank column is moved in front', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [['10', null, '=A1*2'], ['20', null, '=A2*2'], ['30', null, '=A3*2']],
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.alter('insert_col_end');
    hot.columnIndexMapper.setIndexesSequence([3, 2, 1, 0]);

    expect(hot.getData()).toEqual([
      [null, 20, null, '10'],
      [null, 40, null, '20'],
      [null, 60, null, '30'],
    ]);
    expect(hot.getSourceData()).toEqual([
      ['10', null, '=A1*2', null],
      ['20', null, '=A2*2', null],
      ['30', null, '=A3*2', null],
    ]);
  });
});
