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
});
