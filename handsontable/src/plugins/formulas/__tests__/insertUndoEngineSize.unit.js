import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';
const CYCLES = 40;
const SIZE = 7;
const CONTENT = 2;

const identity = length => Array.from({ length }, (_, index) => index);
const lastFirst = length => [length - 1, ...identity(length - 1)];
const blank = () => new Array(SIZE).fill(null);

describe('Formulas: an insert followed by an undo', () => {
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

  const dimensions = () => engine.getSheetDimensions(engine.getSheetId('Sheet1'));
  const undo = () => hot.getPlugin('undoRedo').undo();

  describe('on rows', () => {
    const buildGrid = () => {
      const data = [];

      for (let row = 0; row < SIZE; row += 1) {
        data.push(row < CONTENT ? [10 * (row + 1), `=A${row + 1}*2`, ...blank().slice(2)] : blank());
      }

      hot = new Handsontable(container, {
        data,
        formulas: { engine, sheetName: 'Sheet1' },
        undoRedo: true,
        licenseKey: LICENSE_KEY,
      });
    };

    [0, 1, 2, 3].forEach((visualRow) => {
      it(`should not leave the sheet taller after ${CYCLES} cycles of an insert at row ${visualRow}`, () => {
        buildGrid();

        const { height } = dimensions();
        const values = hot.getData();

        for (let cycle = 0; cycle < CYCLES; cycle += 1) {
          hot.alter('insert_row_above', visualRow);
          undo();
        }

        expect(dimensions().height).toBe(height);
        expect(hot.getData()).toEqual(values);
        expect(hot.countRows()).toBe(SIZE);
      });

      it(`should not leave the sheet taller after ${CYCLES} cycles of an insert at row ${visualRow} ` +
        'in a grid whose last row moved to the top', () => {
        buildGrid();
        hot.rowIndexMapper.setIndexesSequence(lastFirst(SIZE));

        const { height } = dimensions();
        const values = hot.getData();

        for (let cycle = 0; cycle < CYCLES; cycle += 1) {
          hot.alter('insert_row_above', visualRow);
          undo();
        }

        expect(dimensions().height).toBe(height);
        expect(hot.getData()).toEqual(values);
      });
    });

    it('should keep the sheet as short as an insert needs when the undo is redone and undone again', () => {
      buildGrid();

      const { height } = dimensions();

      hot.alter('insert_row_above', 1);

      const insertedHeight = dimensions().height;

      for (let cycle = 0; cycle < CYCLES; cycle += 1) {
        undo();
        hot.getPlugin('undoRedo').redo();
      }

      expect(dimensions().height).toBe(insertedHeight);
      expect(insertedHeight).toBe(height + 1);
      expect(hot.getDataAtCell(2, 1)).toBe(40);
    });
  });

  describe('with formulas that read cells past the content', () => {
    const buildGrid = () => {
      const data = [[10, '=A5*2', '=SUM(A1:A9)'], [20, null, null]];

      while (data.length < SIZE) {
        data.push([null, null, null]);
      }

      hot = new Handsontable(container, {
        data,
        formulas: { engine, sheetName: 'Sheet1' },
        undoRedo: true,
        licenseKey: LICENSE_KEY,
      });
    };

    it('should keep the cells the formulas read, and not turn a reference into #REF!', () => {
      buildGrid();

      const { height } = dimensions();
      const sheet = engine.getSheetSerialized(engine.getSheetId('Sheet1'));

      expect(height).toBe(9);

      for (let cycle = 0; cycle < 5; cycle += 1) {
        hot.alter('insert_row_above', 1);

        expect(dimensions().height).toBe(10);

        undo();
      }

      expect(dimensions().height).toBe(height);
      expect(engine.getSheetSerialized(engine.getSheetId('Sheet1'))).toEqual(sheet);
      expect(hot.getDataAtRow(0)).toEqual([10, 0, 30]);
    });

    it('should keep the rows another sheet reads', () => {
      buildGrid();
      engine.addSheet('Other');
      engine.setSheetContent(engine.getSheetId('Other'), [['=Sheet1!A12']]);

      const { height } = dimensions();
      const other = () => engine.getSheetSerialized(engine.getSheetId('Other'));

      expect(height).toBe(12);

      for (let cycle = 0; cycle < 5; cycle += 1) {
        hot.alter('insert_row_above', 1);
        undo();
      }

      expect(dimensions().height).toBe(height);
      expect(other()).toEqual([['=Sheet1!A12']]);
    });
  });

  describe('with a sheet the engine holds larger than its content', () => {
    const buildGrid = () => {
      const data = [[10, '=A1*2'], [20, '=A2*2']];

      while (data.length < SIZE) {
        data.push([null, null]);
      }

      hot = new Handsontable(container, {
        data,
        formulas: { engine, sheetName: 'Sheet1' },
        undoRedo: true,
        licenseKey: LICENSE_KEY,
      });
    };
    const extendSheet = (row, col) => {
      const address = { sheet: engine.getSheetId('Sheet1'), row, col };

      engine.setCellContents(address, 0);
      engine.setCellContents(address, null);
    };

    it('should give back only the row an insert added', () => {
      buildGrid();
      extendSheet(5, 1);

      expect(dimensions()).toEqual({ width: 2, height: 6 });

      hot.alter('insert_row_above', 1);
      undo();

      expect(dimensions()).toEqual({ width: 2, height: 6 });
    });

    it('should leave the width alone when a row is inserted and undone', () => {
      buildGrid();
      extendSheet(0, 6);

      expect(dimensions()).toEqual({ width: 7, height: 2 });

      hot.alter('insert_row_above', 1);
      undo();

      expect(dimensions()).toEqual({ width: 7, height: 2 });
    });

    it('should leave the height alone when a column is inserted and undone', () => {
      buildGrid();
      extendSheet(5, 1);

      hot.alter('insert_col_start', 1);
      undo();

      expect(dimensions()).toEqual({ width: 2, height: 6 });
    });
  });

  describe('with a sheet the host grew after the last undo step was recorded', () => {
    it('should keep the size the host gave the sheet when a row is inserted and undone', () => {
      hot = new Handsontable(container, {
        data: [[10, '=A1*2'], [20, '=A2*2'], [null, null]],
        formulas: { engine, sheetName: 'Sheet1' },
        undoRedo: true,
        licenseKey: LICENSE_KEY,
      });

      const address = { sheet: engine.getSheetId('Sheet1'), row: 5, col: 12 };

      hot.setDataAtCell(0, 0, 11);
      engine.setCellContents(address, 0);
      engine.setCellContents(address, null);

      const size = dimensions();

      expect(size).toEqual({ width: 13, height: 6 });

      hot.alter('insert_row_above', 1);
      undo();

      expect(dimensions()).toEqual(size);
      expect(hot.getData()).toEqual([[11, 22], [20, 40], [null, null]]);
    });
  });

  describe('with a formula that reads a whole column or row (known limit)', () => {
    const CYCLES_PINNED = 5;

    const buildGrid = (formula) => {
      hot = new Handsontable(container, {
        data: [[10, 20, formula], [20, null, null], [null, null, null], [null, null, null]],
        formulas: { engine, sheetName: 'Sheet1' },
        undoRedo: true,
        licenseKey: LICENSE_KEY,
      });
    };

    // A whole-column reference depends on every cell of its column, so no row of it is unused and the
    // trim leaves the sheet as it was on develop: one row more per insert and undo.
    it('should keep the values and leave the sheet one row taller per cycle, as before the trim', () => {
      buildGrid('=SUM(A:A)');

      const values = hot.getData();
      const { height } = dimensions();

      for (let cycle = 0; cycle < CYCLES_PINNED; cycle += 1) {
        hot.alter('insert_row_above', 1);
        undo();
      }

      expect(hot.getData()).toEqual(values);
      expect(dimensions().height).toBe(height + CYCLES_PINNED);
    });

    it('should keep the values and leave the sheet one column wider per cycle, as before the trim', () => {
      buildGrid('=SUM(1:1)');

      const values = hot.getData();
      const { width } = dimensions();

      for (let cycle = 0; cycle < CYCLES_PINNED; cycle += 1) {
        hot.alter('insert_col_start', 1);
        undo();
      }

      expect(hot.getData()).toEqual(values);
      expect(dimensions().width).toBe(width + CYCLES_PINNED);
    });
  });

  describe('on columns', () => {
    const buildGrid = () => {
      const row = (value, formula) => [value, formula, ...blank().slice(2)];

      hot = new Handsontable(container, {
        data: [row(10, '=A1*2'), row(20, '=A2*2')],
        formulas: { engine, sheetName: 'Sheet1' },
        undoRedo: true,
        licenseKey: LICENSE_KEY,
      });
    };

    [0, 1, 2, 3].forEach((visualColumn) => {
      it(`should not leave the sheet wider after ${CYCLES} cycles of an insert at column ${visualColumn}`, () => {
        buildGrid();

        const { width } = dimensions();
        const values = hot.getData();

        for (let cycle = 0; cycle < CYCLES; cycle += 1) {
          hot.alter('insert_col_start', visualColumn);
          undo();
        }

        expect(dimensions().width).toBe(width);
        expect(hot.getData()).toEqual(values);
        expect(hot.countCols()).toBe(SIZE);
      });

      it(`should not leave the sheet wider after ${CYCLES} cycles of an insert at column ${visualColumn} ` +
        'in a grid whose last column moved to the start', () => {
        buildGrid();
        hot.columnIndexMapper.setIndexesSequence(lastFirst(SIZE));

        const { width } = dimensions();
        const values = hot.getData();

        for (let cycle = 0; cycle < CYCLES; cycle += 1) {
          hot.alter('insert_col_start', visualColumn);
          undo();
        }

        expect(dimensions().width).toBe(width);
        expect(hot.getData()).toEqual(values);
      });
    });
  });
});
