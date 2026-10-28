import HyperFormula from 'hyperformula';
import Handsontable from '../../../../index';
import AxisSyncer from '../../indexSyncer/axisSyncer';

const ROWS = 2000;
const CONTENT_ROWS = 10;
const LICENSE_KEY = 'non-commercial-and-evaluation';

const buildData = (rows = ROWS) => {
  const data = [];

  for (let row = 0; row < rows; row += 1) {
    data.push(row < CONTENT_ROWS ? [row + 1, `=A${row + 1}*2`] : [null, null]);
  }

  return data;
};

const contentRows = () => Array.from({ length: CONTENT_ROWS }, (_, row) => [row + 1, (row + 1) * 2]);
const identity = length => Array.from({ length }, (_, index) => index);
const lastRowFirst = length => [length - 1, ...identity(length - 1)];

describe('AxisSyncer: the padded blanks of the engine order', () => {
  let container;
  let hot;
  let engine;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  const buildGrid = () => {
    hot = new Handsontable(container, {
      data: buildData(),
      formulas: { engine, sheetName: 'Sheet1' },
      columnSorting: { sortEmptyCells: true },
      licenseKey: LICENSE_KEY,
    });
  };
  const height = () => engine.getSheetDimensions(engine.getSheetId('Sheet1')).height;
  const setSequence = sequence => hot.rowIndexMapper.setIndexesSequence(sequence);
  const expectContentAtTheTop = () => {
    expect(hot.getData().slice(0, CONTENT_ROWS)).toEqual(contentRows());
    expect(hot.getDataAtCell(CONTENT_ROWS, 0)).toBeNull();
  };

  describe('after an undo', () => {
    it('should keep the sheet short when the order goes back to the first one', () => {
      buildGrid();
      setSequence(lastRowFirst(ROWS));
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      hot.getPlugin('undoRedo').undo();

      expect(hot.rowIndexMapper.getIndexesSequence()).toEqual(lastRowFirst(ROWS));

      setSequence(identity(ROWS));

      expect(height()).toBe(CONTENT_ROWS + 1);
      expectContentAtTheTop();
    });

    it('should keep the sheet short after a redo too', () => {
      buildGrid();
      setSequence(lastRowFirst(ROWS));
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      hot.getPlugin('undoRedo').undo();
      hot.getPlugin('undoRedo').redo();
      hot.getPlugin('undoRedo').undo();
      setSequence(identity(ROWS));

      expect(height()).toBe(CONTENT_ROWS + 1);
      expectContentAtTheTop();
    });
  });

  describe('after a switch to another sheet and back', () => {
    it('should keep the sheet short when the order goes back to the first one', () => {
      hot = new Handsontable(container, {
        sheetsBar: {
          sheets: [
            { name: 'Sheet1', data: buildData(), settings: { formulas: { engine, sheetName: 'Sheet1' } } },
            { name: 'Other', data: [[1]], settings: { formulas: { engine, sheetName: 'Other' } } },
          ],
        },
        licenseKey: LICENSE_KEY,
      });

      const sheetsBar = hot.getPlugin('sheetsBar');
      const idOf = name => sheetsBar.getSheets().find(sheet => sheet.name === name).id;

      setSequence(lastRowFirst(ROWS));
      sheetsBar.setActiveSheet(idOf('Other'));
      sheetsBar.setActiveSheet(idOf('Sheet1'));

      expect(hot.rowIndexMapper.getIndexesSequence()).toEqual(lastRowFirst(ROWS));

      setSequence(identity(ROWS));

      expect(height()).toBe(CONTENT_ROWS + 1);
      expectContentAtTheTop();
    });
  });

  describe('after rows are inserted or removed', () => {
    it('should keep the sheet short when a row is inserted ahead of the padded blank in physical order', () => {
      buildGrid();
      setSequence(lastRowFirst(ROWS));
      hot.alter('insert_row_above', 1500);
      setSequence(identity(ROWS + 1));

      expect(height()).toBe(CONTENT_ROWS + 1);
      expectContentAtTheTop();
    });

    it('should keep the sheet short when a row is inserted above the padded blank at the top', () => {
      buildGrid();
      setSequence(lastRowFirst(ROWS));
      hot.alter('insert_row_above', 0);
      setSequence(identity(ROWS + 1));

      expect(height()).toBe(CONTENT_ROWS + 2);
      expectContentAtTheTop();
    });

    it('should keep the sheet short when a row is inserted behind the padded blank in physical order', () => {
      buildGrid();
      setSequence(lastRowFirst(ROWS));
      hot.alter('insert_row_below', ROWS - 1);
      setSequence(identity(ROWS + 1));

      expect(height()).toBe(CONTENT_ROWS + 1);
      expectContentAtTheTop();
    });

    it('should keep the sheet short when a row ahead of the padded blank is removed', () => {
      buildGrid();
      setSequence(lastRowFirst(ROWS));
      hot.alter('remove_row', 1500);
      setSequence(identity(ROWS - 1));

      expect(height()).toBe(CONTENT_ROWS + 1);
      expectContentAtTheTop();
    });

    it('should keep the sheet short when the padded blank itself is removed', () => {
      buildGrid();
      setSequence(lastRowFirst(ROWS));
      hot.alter('remove_row', 0);
      setSequence(identity(ROWS - 1));

      expect(height()).toBe(CONTENT_ROWS);
      expectContentAtTheTop();
    });

    it('should keep the sheet short when several rows are removed at once', () => {
      buildGrid();
      setSequence(lastRowFirst(ROWS));
      hot.alter('remove_row', [[100, 3], [1500, 5]]);
      setSequence(identity(ROWS - 8));

      expect(height()).toBe(CONTENT_ROWS + 1);
      expectContentAtTheTop();
    });

    it('should not grow the sheet with each row inserted and undone in a reordered grid', () => {
      const rows = 7;

      hot = new Handsontable(container, {
        data: [[1, '=A1*2'], [2, '=A2*2'], ...new Array(rows - 2).fill(null).map(() => [null, null])],
        formulas: { engine, sheetName: 'Sheet1' },
        licenseKey: LICENSE_KEY,
      });
      setSequence(lastRowFirst(rows));

      const heightAfterReorder = height();

      for (let cycle = 0; cycle < 10; cycle += 1) {
        hot.alter('insert_row_above', 2);
        hot.getPlugin('undoRedo').undo();
      }

      expect(height()).toBe(heightAfterReorder);
      expect(hot.getData().slice(0, 2)).toEqual([[null, null], [1, 2]]);
    });

    it('should keep the sheet narrow when a column is inserted ahead of a padded blank column', () => {
      const columns = 300;
      const row = [1, '=A1*2', ...new Array(columns - 2).fill(null)];

      hot = new Handsontable(container, {
        data: [row, row.slice()],
        formulas: { engine, sheetName: 'Sheet1' },
        licenseKey: LICENSE_KEY,
      });
      hot.columnIndexMapper.setIndexesSequence(lastRowFirst(columns));
      hot.alter('insert_col_start', 200);
      hot.columnIndexMapper.setIndexesSequence(identity(columns + 1));

      expect(engine.getSheetDimensions(engine.getSheetId('Sheet1')).width).toBe(3);
      expect(hot.getDataAtRow(0).slice(0, 3)).toEqual([1, 2, null]);
    });
  });

  describe('the order the grid goes back to after a move', () => {
    it('should report the engine order as physical again once a move restores the first order', () => {
      hot = new Handsontable(container, {
        data: [[1, '=A1*2'], [2, '=A2*2'], [null, null], [null, null]],
        formulas: { engine, sheetName: 'Sheet1' },
        manualRowMove: true,
        licenseKey: LICENSE_KEY,
      });
      setSequence([1, 0, 3, 2]);

      expect(hot.getPlugin('formulas').exportEngineOrder()).not.toBeNull();

      hot.getPlugin('manualRowMove').moveRow(3, 2);
      hot.getPlugin('manualRowMove').moveRow(1, 0);

      expect(hot.rowIndexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3]);
      expect(hot.getPlugin('formulas').exportEngineOrder()).toBeNull();
    });

    it('should report the engine order as physical again once a row inserted into a reordered grid is removed and the order is restored', () => {
      hot = new Handsontable(container, {
        data: [[1, '=A1*2'], [2, '=A2*2'], [null, null], [null, null]],
        formulas: { engine, sheetName: 'Sheet1' },
        manualRowMove: true,
        licenseKey: LICENSE_KEY,
      });
      setSequence([1, 0, 3, 2]);
      hot.alter('insert_row_below', 3);
      hot.alter('remove_row', 4);
      hot.getPlugin('manualRowMove').moveRow(3, 2);
      hot.getPlugin('manualRowMove').moveRow(1, 0);

      expect(hot.rowIndexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3]);
      expect(hot.getPlugin('formulas').exportEngineOrder()).toBeNull();
    });
  });

  describe('the stored order', () => {
    const createAxisSyncer = () => {
      const indexMapper = {
        getIndexesSequence: () => [0, 1, 2],
        getNotTrimmedIndexes: () => [0, 1, 2],
        getNumberOfIndexes: () => 3,
        addLocalHook: () => {},
      };

      return new AxisSyncer('row', indexMapper, { getEngine: () => null, getSheetId: () => null });
    };

    it('should hand the padded elements back the way they were adopted', () => {
      const axisSyncer = createAxisSyncer();

      axisSyncer.adoptEngineOrder({ sequence: [2, 0, 1], fillSequence: null, paddedElements: [2] });

      expect(axisSyncer.getEngineOrder()).toEqual({ sequence: [2, 0, 1], fillSequence: null, paddedElements: [2] });
    });

    it('should drop a padded element the adopted sequence does not hold', () => {
      const axisSyncer = createAxisSyncer();

      axisSyncer.adoptEngineOrder({ sequence: [2, 0, 1], fillSequence: null, paddedElements: [2, 7] });

      expect(axisSyncer.getEngineOrder().paddedElements).toEqual([2]);
    });
  });
});
