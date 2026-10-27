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
    // `getSourceData()` reads each formula in the frame the grid shows, as it does after a sort.
    expect(hot.getSourceData()).toEqual([['10', '=A3*2'], ['20', '=A2*2'], [null, null]]);
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
      ['10', null, '=A4*2'],
      ['20', null, '=A3*2'],
      ['30', null, '=A2*2'],
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
    expect(hot.getSourceData()).toEqual([['10', '=B1*2', null], ['20', '=B2*2', null]]);
  });

  it('should keep column values and source formulas when an appended blank column is moved in front', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [['10', null, '=A1*2'], ['20', null, '=A2*2'], ['30', null, '=A3*2']],
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.alter('insert_col_end');
    hot.columnIndexMapper.setIndexesSequence([3, 0, 1, 2]);

    expect(hot.getData()).toEqual([
      [null, '10', null, 20],
      [null, '20', null, 40],
      [null, '30', null, 60],
    ]);
    expect(hot.getSourceData()).toEqual([
      ['10', null, '=B1*2', null],
      ['20', null, '=B2*2', null],
      ['30', null, '=B3*2', null],
    ]);
  });

  describe('after a trailing blank row moves ahead of the others', () => {
    beforeEach(() => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hot = new Handsontable(container, {
        data: [['10', '=A1*2'], ['20', '=A2*2'], [null, null]],
        formulas: { engine, sheetName: 'Sheet1' },
        manualRowMove: true,
        columnSorting: true,
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.rowIndexMapper.setIndexesSequence([2, 1, 0]);
    });

    it('should keep values and source formulas when the blank row is removed', () => {
      hot.alter('remove_row', 0);

      expect(hot.getData()).toEqual([['20', 40], ['10', 20]]);
      expect(hot.getSourceData()).toEqual([['10', '=A2*2'], ['20', '=A1*2']]);
    });

    it('should keep the other row intact when a row with content is removed', () => {
      hot.alter('remove_row', 1);

      expect(hot.getData()).toEqual([[null, null], ['10', 20]]);
      expect(hot.getSourceData()).toEqual([['10', '=A2*2'], [null, null]]);
    });

    it('should show values, not formula text, when a row is inserted', () => {
      hot.alter('insert_row_above', 1);

      expect(hot.getData()).toEqual([[null, null], [null, null], ['20', 40], ['10', 20]]);
    });

    it('should resolve a reference typed in grid addresses against the grid', () => {
      hot.setDataAtCell(0, 0, '5');
      hot.setDataAtCell(0, 1, '=A1+1');

      expect(hot.getDataAtCell(0, 1)).toBe(6);
    });

    it('should keep the values when a row is moved', () => {
      hot.getPlugin('manualRowMove').moveRow(0, 2);

      expect(hot.getData()).toEqual([['20', 40], ['10', 20], [null, null]]);
    });

    it('should keep the values when the grid is sorted back to its first order', () => {
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(hot.getData()).toEqual([['10', 20], ['20', 40], [null, null]]);
      expect(hot.getSourceData()).toEqual([['10', '=A1*2'], ['20', '=A2*2'], [null, null]]);
    });

    it('should keep the values when the grid is sorted into a new order', () => {
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

      expect(hot.getData()).toEqual([['20', 40], ['10', 20], [null, null]]);
    });
  });

  describe('after a trailing blank column moves ahead of the others', () => {
    beforeEach(() => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hot = new Handsontable(container, {
        data: [['10', '=A1*2', null], ['20', '=A2*2', null]],
        formulas: { engine, sheetName: 'Sheet1' },
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.columnIndexMapper.setIndexesSequence([2, 0, 1]);
    });

    it('should keep values and source formulas when the blank column is removed', () => {
      hot.alter('remove_col', 0);

      expect(hot.getData()).toEqual([['10', 20], ['20', 40]]);
      expect(hot.getSourceData()).toEqual([['10', '=A1*2'], ['20', '=A2*2']]);
    });

    it('should show values, not formula text, when a column is inserted', () => {
      hot.alter('insert_col_start', 1);

      expect(hot.getData()).toEqual([[null, null, '10', 20], [null, null, '20', 40]]);
    });

    it('should resolve a reference typed in grid addresses against the grid', () => {
      hot.setDataAtCell(0, 1, '5');
      hot.setDataAtCell(0, 2, '=B1+1');

      expect(hot.getDataAtCell(0, 2)).toBe(6);
    });
  });

  it('should resolve visual references into a blank tail an accepted reorder permuted', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[1, '=A1*2', null], [2, '=A2*2', null], [3, '=A3*2', null], [null, null, null], [null, null, null]],
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.rowIndexMapper.setIndexesSequence([2, 1, 0, 4, 3]);
    hot.setDataAtCell(3, 0, 100);
    hot.setDataAtCell(4, 0, 200);
    hot.setDataAtCell(0, 2, '=A4');

    expect(hot.getDataAtCell(0, 2)).toBe(100);
  });

  describe('when the host has the engine batched or suspended', () => {
    const buildGrid = () => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hot = new Handsontable(container, {
        data: [['10', '=A1*2'], ['20', '=A2*2'], [null, null]],
        formulas: { engine, sheetName: 'Sheet1' },
        licenseKey: 'non-commercial-and-evaluation',
      });

      return engine;
    };

    it('should leave the host\'s own batch open and let the host end it', () => {
      const engine = buildGrid();
      let suspendedInsideTheBatch;

      expect(() => {
        engine.batch(() => {
          hot.rowIndexMapper.setIndexesSequence([2, 1, 0]);
          suspendedInsideTheBatch = engine.isEvaluationSuspended();
        });
      }).not.toThrow();

      expect(suspendedInsideTheBatch).toBe(true);
      expect(engine.isEvaluationSuspended()).toBe(false);
      expect(hot.getData()).toEqual([[null, null], ['20', 40], ['10', 20]]);
    });

    it('should keep the evaluation suspended until the host resumes it', () => {
      const engine = buildGrid();

      engine.suspendEvaluation();
      hot.rowIndexMapper.setIndexesSequence([2, 1, 0]);

      expect(engine.isEvaluationSuspended()).toBe(true);

      engine.resumeEvaluation();

      expect(hot.getData()).toEqual([[null, null], ['20', 40], ['10', 20]]);
    });

    it('should still fold the write and the order into one engine batch when the host has none', () => {
      const engine = buildGrid();
      const batch = jest.spyOn(engine, 'batch');

      hot.rowIndexMapper.setIndexesSequence([2, 1, 0]);

      expect(batch).toHaveBeenCalledTimes(1);
      expect(engine.isEvaluationSuspended()).toBe(false);
    });
  });

  describe('when the engine cannot hold the rows or columns the order needs', () => {
    it('should warn instead of throwing and leave the engine as it was when a row is out of the engine\'s `maxRows`', () => {
      const warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', maxRows: 2 });

      hot = new Handsontable(container, {
        data: [['10', '=A1*2'], ['20', '=A2*2'], [null, null]],
        formulas: { engine, sheetName: 'Sheet1' },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const sheetId = engine.getSheetId('Sheet1');
      const serialized = engine.getSheetSerialized(sheetId);

      expect(() => hot.rowIndexMapper.setIndexesSequence([2, 1, 0])).not.toThrow();
      expect(warnings).toHaveBeenCalledTimes(1);
      expect(engine.getSheetSerialized(sheetId)).toEqual(serialized);
      expect(engine.getSheetDimensions(sheetId).height).toBe(2);

      hot.rowIndexMapper.setIndexesSequence([0, 1, 2]);

      expect(hot.getData()).toEqual([['10', 20], ['20', 40], [null, null]]);

      warnings.mockRestore();
    });

    it('should warn instead of throwing and leave the engine as it was when a column is out of the engine\'s `maxColumns`', () => {
      const warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', maxColumns: 2 });

      hot = new Handsontable(container, {
        data: [['10', '=A1*2', null], ['20', '=A2*2', null]],
        formulas: { engine, sheetName: 'Sheet1' },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const sheetId = engine.getSheetId('Sheet1');
      const serialized = engine.getSheetSerialized(sheetId);

      expect(() => hot.columnIndexMapper.setIndexesSequence([2, 1, 0])).not.toThrow();
      expect(warnings).toHaveBeenCalledTimes(1);
      expect(engine.getSheetSerialized(sheetId)).toEqual(serialized);
      expect(engine.getSheetDimensions(sheetId).width).toBe(2);

      hot.columnIndexMapper.setIndexesSequence([0, 1, 2]);

      expect(hot.getData()).toEqual([['10', 20, null], ['20', 40, null]]);

      warnings.mockRestore();
    });
  });
});
