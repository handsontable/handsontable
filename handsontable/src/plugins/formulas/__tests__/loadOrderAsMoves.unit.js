import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * Each row holds an ID and a formula that reads the ID of another row: row 1 reads A3, row 2 reads A4, and
 * so on around. `Expected` is what that formula must show for the row, whatever order the grid shows it in.
 *
 * @returns {Array[]}
 */
function crossRowData() {
  return [1, 2, 3, 4, 5].map((id, index) => {
    const target = ((index + 2) % 5) + 1;

    return [id, `=A${target}+1000`, target + 1000];
  });
}

/**
 * Reads every visual row as `[shown, expected]` pairs.
 *
 * @param {Handsontable} hot The grid.
 * @returns {Array[]}
 */
function shownAndExpected(hot) {
  return hot.getData().map(([, shown, expected]) => [shown, expected]);
}

/**
 * Checks that every row shows what its formula should read.
 *
 * @param {Handsontable} hot The grid.
 */
function expectEveryRowReadsItsRecord(hot) {
  shownAndExpected(hot).forEach(([shown, expected]) => {
    expect(shown).toBe(expected);
  });
}

describe('Formulas: an order reached by moves reaches a (re)loaded engine as moves', () => {
  let containers;
  let grids;
  let engines;

  beforeEach(() => {
    containers = [];
    grids = [];
    engines = [];
  });

  // Cleaned up here rather than at the end of each test, so a failing expectation does not leave a grid
  // registered on an engine for the next test.
  afterEach(() => {
    grids.forEach(hot => !hot.isDestroyed && hot.destroy());
    engines.forEach(engine => engine.destroy());
    containers.forEach(container => container.remove());
  });

  /**
   * @param {object} settings Extra settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    const container = document.createElement('div');

    document.body.appendChild(container);
    containers.push(container);

    const hot = new Handsontable(container, {
      data: crossRowData(),
      formulas: { engine: HyperFormula },
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    grids.push(hot);

    return hot;
  }

  /**
   * @param {object} [config] Extra engine configuration.
   * @returns {HyperFormula}
   */
  function createEngine(config = {}) {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', ...config });

    engines.push(engine);

    return engine;
  }

  it('keeps every reference on its record with a manualRowMove array at init', () => {
    const hot = createGrid({ manualRowMove: [2, 3, 4, 0, 1] });

    expect(hot.getDataAtCol(0)).toEqual([3, 4, 5, 1, 2]);
    expectEveryRowReadsItsRecord(hot);
  });

  it('keeps every reference on its record when updateSettings() follows a drag', () => {
    const hot = createGrid({ manualRowMove: true });

    hot.getPlugin('manualRowMove').moveRows([3, 4], 0);
    hot.render();

    expectEveryRowReadsItsRecord(hot);

    hot.updateSettings({});
    hot.updateSettings({});
    hot.updateSettings({});

    expect(hot.getDataAtCol(0)).toEqual([4, 5, 1, 2, 3]);
    expectEveryRowReadsItsRecord(hot);
  });

  it('keeps every reference on its record with a manualColumnMove array at init', () => {
    const hot = createGrid({
      data: [
        [1, '=A1+10', 100, 1000],
        [2, '=A2+10', 200, 2000],
      ],
      manualColumnMove: [0, 2, 1, 3],
    });

    // `=A1+10` keeps reading the ID column, as it does after a `loadData()` with the same array.
    expect(hot.getData()).toEqual([
      [1, 100, 11, 1000],
      [2, 200, 12, 2000],
    ]);
  });

  it('shows the same values at init as after a loadData() with the same move array', () => {
    const atInit = createGrid({ manualRowMove: [2, 0, 1, 4, 3] });
    const initValues = atInit.getData();

    atInit.loadData(crossRowData());

    expect(atInit.getData()).toEqual(initValues);
  });

  it('sends the order as moves, not as one engine order, at init', () => {
    const engine = createEngine();
    const setRowOrder = jest.spyOn(engine, 'setRowOrder');
    const moveRows = jest.spyOn(engine, 'moveRows');
    const hot = createGrid({ manualRowMove: [2, 3, 4, 0, 1], formulas: { engine } });

    expect(setRowOrder).not.toHaveBeenCalled();
    // `[2, 3, 4]` is one block: one move takes it to the top.
    expect(moveRows).toHaveBeenCalledTimes(1);
    expectEveryRowReadsItsRecord(hot);
  });

  it('keeps the sort order as an engine order after updateSettings() (DEV-917 known limitation)', () => {
    const engine = createEngine();
    const hot = createGrid({ columnSorting: true, formulas: { engine } });

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

    const sorted = hot.getData();
    const setRowOrder = jest.spyOn(engine, 'setRowOrder');
    const moveRows = jest.spyOn(engine, 'moveRows');

    // The engine took the sort as an order, so the re-render writes the data again and replays the sort the
    // same way, as on develop: the same values, through the same kind of engine call.
    hot.updateSettings({});

    expect(hot.getData()).toEqual(sorted);
    expect(setRowOrder).toHaveBeenCalledTimes(1);
    expect(moveRows).not.toHaveBeenCalled();
  });

  it('shows the same values on every re-render with a move array and an initial sort', () => {
    const hot = createGrid({
      manualRowMove: [2, 3, 4, 0, 1],
      columnSorting: { initialConfig: { column: 0, sortOrder: 'desc' } },
    });
    const atInit = hot.getDataAtCol(1);

    hot.updateSettings({});

    expect(hot.getDataAtCol(1)).toEqual(atInit);

    hot.updateSettings({});
    hot.updateSettings({});

    expect(hot.getDataAtCol(1)).toEqual(atInit);

    // A cleared sort is repaired on the next re-render, back to what the move array alone shows.
    hot.getPlugin('columnSorting').clearSort();
    hot.updateSettings({});

    expect(hot.getDataAtCol(0)).toEqual([3, 4, 5, 1, 2]);
    expectEveryRowReadsItsRecord(hot);
  });

  describe('a short reorder on a tall grid', () => {
    /**
     * Rows whose formula reads the ID of a row a few rows further down, and the value it must show.
     *
     * @param {number} size Number of rows.
     * @returns {Array[]}
     */
    function tallCrossRowData(size) {
      return Array.from({ length: size }, (_, index) => {
        const target = ((index + 2) % size) + 1;

        return [index + 1, `=A${target}+1000`, target + 1000];
      });
    }

    /**
     * The identity order with the rows of `moved` taken to the top.
     *
     * @param {number} size Number of rows.
     * @param {number[]} moved Physical rows to take to the top.
     * @returns {number[]}
     */
    function movedToTop(size, moved) {
      return moved.concat(Array.from({ length: size }, (_, index) => index).filter(row => !moved.includes(row)));
    }

    it.each([
      [100, [7]], [1000, [7]], [10000, [7]],
      [100, [7, 8, 9]], [1000, [70, 80, 90]], [10000, [700, 800, 900]],
    ])('sends a move array of a few rows on %i rows as moves at init (%j)', (size, moved) => {
      const engine = createEngine();
      const setRowOrder = jest.spyOn(engine, 'setRowOrder');
      const moveRows = jest.spyOn(engine, 'moveRows');
      const hot = createGrid({
        data: tallCrossRowData(size),
        manualRowMove: movedToTop(size, moved),
        formulas: { engine },
      });

      expect(setRowOrder).not.toHaveBeenCalled();
      expect(moveRows).toHaveBeenCalled();
      expect(hot.getDataAtCol(1)).toEqual(hot.getDataAtCol(2));
    });

    it('sends a short drag on a tall grid as a move on a reload that writes', () => {
      const engine = createEngine();
      const data = tallCrossRowData(1000).map(row => [...row, 'note']);
      const hot = createGrid({ data, manualRowMove: true, formulas: { engine } });

      hot.getPlugin('manualRowMove').moveRows([500], 498);
      hot.render();

      const setRowOrder = jest.spyOn(engine, 'setRowOrder');
      const moveRows = jest.spyOn(engine, 'moveRows');

      data[0][3] = 'changed';
      hot.updateSettings({});

      expect(setRowOrder).not.toHaveBeenCalled();
      expect(moveRows).toHaveBeenCalled();
      expect(hot.getDataAtCol(1)).toEqual(hot.getDataAtCol(2));
    });
  });

  describe('a reload inside a held order', () => {
    it('shows the values of a move array and an initial sort after a reload in the hold', () => {
      const data = crossRowData().map(row => [...row, 'note']);
      const hot = createGrid({
        data,
        manualRowMove: [2, 3, 4, 0, 1],
        columnSorting: { initialConfig: { column: 0, sortOrder: 'desc' } },
      });
      const atInit = hot.getDataAtCol(1);

      hot.getPlugin('formulas').runWithEngineOrderHeld(() => {
        data[0][3] = 'changed';
        hot.updateSettings({});
      });

      expect(hot.getDataAtCol(1)).toEqual(atInit);
    });
  });

  describe('a re-render after a sort is cleared', () => {
    /**
     * @returns {Array[]} Formulas that a sort by the third column moves across the cells they read.
     */
    function sortDamagedData() {
      return [[1, '=A2*10', 'x'], [2, '=A3*10', 'y'], [3, '=SUM(A1:A3)', 'z'], [4, '=A1+A4', 'w']];
    }

    it.each([
      ['columnSorting', { columnSorting: true }],
      ['multiColumnSorting', { multiColumnSorting: true }],
    ])('repairs the formulas the sort rewrote, with %s', (pluginName, settings) => {
      const data = sortDamagedData();
      const hot = createGrid({ data, ...settings });

      hot.getPlugin(pluginName).sort({ column: 2, sortOrder: 'asc' });
      hot.updateSettings({});
      hot.getPlugin(pluginName).clearSort();
      hot.updateSettings({});

      expect(hot.getDataAtCol(1)).toEqual([20, 30, 6, 5]);
      expect(hot.getSourceData().map(row => row[1])).toEqual(['=A2*10', '=A3*10', '=SUM(A1:A3)', '=A1+A4']);
      expect(data.map(row => row[1])).toEqual(['=A2*10', '=A3*10', '=SUM(A1:A3)', '=A1+A4']);
    });

    it('repairs the formulas when an edit came between the sort and the clear', () => {
      const data = sortDamagedData();
      const hot = createGrid({ data, columnSorting: true });

      hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'desc' });
      hot.setDataAtCell(0, 0, 40);
      hot.updateSettings({});
      hot.getPlugin('columnSorting').clearSort();
      hot.updateSettings({});

      expect(hot.getDataAtCell(2, 1)).toBe(hot.getDataAtCol(0).slice(0, 3).reduce((sum, id) => sum + id, 0));
      expect(hot.getSourceData()[2][1]).toBe('=SUM(A1:A3)');
      expect(data[2][1]).toBe('=SUM(A1:A3)');
    });
  });

  it('keeps every reference on its record on the column axis when updateSettings() follows a drag', () => {
    const hot = createGrid({
      data: [
        [1, '=A1+10', 100, 1000],
        [2, '=A2+10', 200, 2000],
      ],
      manualColumnMove: true,
    });

    hot.getPlugin('manualColumnMove').moveColumns([2], 0);
    hot.render();

    const afterDrag = hot.getData();

    hot.updateSettings({});
    hot.updateSettings({});

    expect(afterDrag).toEqual([
      [100, 1, 11, 1000],
      [200, 2, 12, 2000],
    ]);
    expect(hot.getData()).toEqual(afterDrag);
  });

  describe('a re-render that leaves the data unchanged', () => {
    it('neither rewrites the sheet nor replays the order after a drag', () => {
      const engine = createEngine();
      const hot = createGrid({ manualRowMove: true, formulas: { engine } });

      hot.getPlugin('manualRowMove').moveRows([3, 4], 0);
      hot.render();

      const setSheetContent = jest.spyOn(engine, 'setSheetContent');
      const moveRows = jest.spyOn(engine, 'moveRows');
      const setRowOrder = jest.spyOn(engine, 'setRowOrder');

      hot.updateSettings({});

      expect(setSheetContent).not.toHaveBeenCalled();
      expect(moveRows).not.toHaveBeenCalled();
      expect(setRowOrder).not.toHaveBeenCalled();
      expectEveryRowReadsItsRecord(hot);
    });

    it('neither rewrites the sheet nor replays the order after a drag and an edit', () => {
      const engine = createEngine();
      const hot = createGrid({ manualRowMove: true, formulas: { engine } });

      hot.getPlugin('manualRowMove').moveRows([3, 4], 0);
      hot.render();
      // Visual row 2 holds ID 1, which visual row 0 (ID 4, `=A1+1000`) reads.
      hot.setDataAtCell(2, 0, 7);
      hot.setSourceDataAtCell(2, 2, 'note');

      const setSheetContent = jest.spyOn(engine, 'setSheetContent');

      hot.updateSettings({});

      expect(setSheetContent).not.toHaveBeenCalled();
      expect(hot.getDataAtCell(0, 1)).toBe(1007);
      expect(hot.getDataAtCell(2, 1)).toBe(1003);
    });

    it('keeps the values a range showed after a drag on every re-render', () => {
      const hot = createGrid({
        data: [[1, null], [2, null], [4, null], [8, null], [16, '=SUM(A1:A3)']],
        manualRowMove: true,
      });

      hot.getPlugin('manualRowMove').moveRows([0], 4);
      hot.render();

      expect(hot.getDataAtCell(3, 1)).toBe(6);

      hot.updateSettings({});
      hot.updateSettings({});

      expect(hot.getDataAtCell(3, 1)).toBe(6);
    });

    it('keeps what other sheets and named expressions read from the sheet after a drag', () => {
      const engine = createEngine();
      const hot = createGrid({
        data: [[1], [2], [4], [8], [16]],
        manualRowMove: true,
        formulas: { engine, sheetName: 'Sheet1' },
      });

      engine.addNamedExpression('N', '=Sheet1!$A$1');
      engine.addSheet('Sheet2');
      engine.setSheetContent(engine.getSheetId('Sheet2'), [['=Sheet1!A1'], ['=SUM(Sheet1!A1:A3)']]);

      const sheet2 = engine.getSheetId('Sheet2');
      const read = () => [
        engine.getCellValue({ sheet: sheet2, row: 0, col: 0 }),
        engine.getCellValue({ sheet: sheet2, row: 1, col: 0 }),
        engine.getNamedExpressionValue('N'),
      ];

      hot.getPlugin('manualRowMove').moveRows([0], 4);
      hot.render();

      const afterDrag = read();

      expect(afterDrag).toEqual([1, 6, 1]);

      hot.updateSettings({});

      expect(read()).toEqual(afterDrag);

      hot.updateSettings({});

      expect(read()).toEqual(afterDrag);
    });

    it('keeps what a second grid on the engine reads after a drag on every re-render', () => {
      const engine = createEngine();
      const hot1 = createGrid({
        data: [['a'], ['b'], ['c']],
        manualRowMove: true,
        formulas: { engine, sheetName: 'Sheet1' },
      });
      const hot2 = createGrid({ data: [['=Sheet1!A1']], formulas: { engine, sheetName: 'Sheet2' } });

      hot1.getPlugin('manualRowMove').moveRows([0], 2);
      hot1.render();

      expect(hot2.getDataAtCell(0, 0)).toBe('a');

      hot1.updateSettings({});

      expect(hot2.getDataAtCell(0, 0)).toBe('a');

      hot1.updateSettings({});

      expect(hot2.getDataAtCell(0, 0)).toBe('a');
    });

    it('follows an edit in a grid whose columns list skips a source column', () => {
      const engine = createEngine();
      const data = [[1, 'skipped', 10, '=A1+B1'], [2, 'skipped', 20, '=A2+B2']];
      const hot = createGrid({
        data,
        columns: [{ data: 0 }, { data: 2 }, { data: 3 }],
        formulas: { engine },
      });

      hot.setDataAtCell(0, 1, 15);

      const setSheetContent = jest.spyOn(engine, 'setSheetContent');

      hot.updateSettings({});

      expect(setSheetContent).not.toHaveBeenCalled();
      expect(hot.getDataAtCol(2)).toEqual([16, 22]);

      // The record holds the edit at the edited cell's place, so a host change elsewhere still reads as one.
      data[1][2] = 30;
      hot.updateSettings({});

      expect(setSheetContent).toHaveBeenCalledTimes(1);
      expect(hot.getDataAtCol(2)).toEqual([16, 32]);
    });

    it('still writes a value the host changed in place into the engine', () => {
      const data = crossRowData();
      const hot = createGrid({ data, manualRowMove: true });

      hot.getPlugin('manualRowMove').moveRows([3, 4], 0);
      hot.render();
      // Physical row 0 holds ID 1, which physical row 3 (`=A1+1000`) reads.
      data[0][0] = 50;
      hot.updateSettings({});

      expect(hot.getDataAtCell(hot.toVisualRow(3), 1)).toBe(1050);
    });

    it('still writes a value the host changed in place over a cell the user edited', () => {
      const data = crossRowData();
      const hot = createGrid({ data, manualRowMove: true });

      hot.setDataAtCell(0, 0, 7);
      data[0][0] = 1;
      hot.updateSettings({});

      expect(hot.getDataAtCell(3, 1)).toBe(1001);
    });

    it('keeps the values ranges showed after two drags on the first re-render', () => {
      const hot = createGrid({
        data: [
          [1, '=A3+1000'], [2, '=A4+1000'], [4, '=A5+1000'],
          [8, '=A1+1000'], [16, '=SUM(A1:A3)'], [32, '=SUM(A2:A4)'],
        ],
        manualRowMove: true,
      });
      const sums = () => [16, 32].map(id => hot.getDataAtCell(hot.getDataAtCol(0).indexOf(id), 1));

      // Two drags reach the engine as two moves; a full write would replay the order by the planned path, which
      // puts the ranges on other rows (12 and 4).
      hot.getPlugin('manualRowMove').moveRows([0], 3);
      hot.getPlugin('manualRowMove').moveRows([5], 1);
      hot.render();

      expect(sums()).toEqual([38, 46]);

      hot.updateSettings({});

      expect(sums()).toEqual([38, 46]);
    });

    it('keeps the value a range showed after two drags of one row on the first re-render', () => {
      const hot = createGrid({
        data: [[1, null], [2, null], [4, null], [8, null], [16, '=SUM(A1:A3)']],
        manualRowMove: true,
      });
      const sum = () => hot.getDataAtCell(hot.getDataAtCol(0).indexOf(16), 1);

      hot.getPlugin('manualRowMove').moveRows([0], 4);
      hot.getPlugin('manualRowMove').moveRows([0], 2);
      hot.render();

      const afterDrags = sum();

      expect(afterDrags).toBe(4);

      hot.updateSettings({});

      expect(sum()).toBe(afterDrags);
    });

    it('keeps the values a range showed after drags, an edit and its undo', () => {
      const engine = createEngine();
      const hot = createGrid({
        data: [
          [1, '=A3+1000'], [2, '=A4+1000'], [4, '=A5+1000'],
          [8, '=A1+1000'], [16, '=SUM(A1:A3)'], [32, '=SUM(A2:A4)'],
        ],
        manualRowMove: true,
        undo: true,
        formulas: { engine },
      });
      const sums = () => [16, 32].map(id => hot.getDataAtCell(hot.getDataAtCol(0).indexOf(id), 1));

      hot.getPlugin('manualRowMove').moveRows([0], 3);
      hot.getPlugin('manualRowMove').moveRows([5], 1);
      hot.render();

      expect(sums()).toEqual([38, 46]);

      hot.setDataAtCell(0, 0, 99);
      hot.getPlugin('undoRedo').undo();

      const setSheetContent = jest.spyOn(engine, 'setSheetContent');

      hot.updateSettings({});

      expect(setSheetContent).not.toHaveBeenCalled();
      expect(sums()).toEqual([38, 46]);

      hot.getPlugin('undoRedo').redo();
      hot.updateSettings({});

      expect(setSheetContent).not.toHaveBeenCalled();
      expect(hot.getDataAtCell(0, 0)).toBe(99);
    });

    it('writes the sheet in full after an undo that changed the rows', () => {
      const data = crossRowData();
      const engine = createEngine();
      const hot = createGrid({ data, manualRowMove: true, undo: true, formulas: { engine } });

      hot.getPlugin('manualRowMove').moveRows([3, 4], 0);
      hot.render();
      hot.alter('insert_row_above', 1, 1);
      hot.getPlugin('undoRedo').undo();

      const setSheetContent = jest.spyOn(engine, 'setSheetContent');

      hot.updateSettings({});

      expect(setSheetContent).toHaveBeenCalledTimes(1);
      expectEveryRowReadsItsRecord(hot);
    });

    it('writes the sheet when a columns update without data resets the row order the user dragged', () => {
      const engine = createEngine();
      const hot = createGrid({ manualRowMove: true, formulas: { engine } });

      hot.getPlugin('manualRowMove').moveRows([2], 0);
      hot.render();
      hot.updateSettings({ columns: [{ data: 0 }, { data: 1 }, { data: 2 }] });

      expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
      expectEveryRowReadsItsRecord(hot);
    });

    it('writes nothing when a columns update without data resets an order the engine already holds', () => {
      const engine = createEngine();
      const hot = createGrid({ formulas: { engine } });
      const setSheetContent = jest.spyOn(engine, 'setSheetContent');

      // A Vue re-render sends `columns` without `data` whenever the columns change.
      hot.updateSettings({ columns: [{ data: 0 }, { data: 1 }, { data: 2 }] });
      hot.updateSettings({ columns: [{ data: 0 }, { data: 1 }, { data: 2 }] });

      expect(setSheetContent).not.toHaveBeenCalled();
      expectEveryRowReadsItsRecord(hot);
    });

    it('writes the sheet when a columns update without data resets the column order the user dragged', () => {
      const engine = createEngine();
      const hot = createGrid({
        data: [[1, '=A1+10', 100], [2, '=A2+10', 200]],
        manualColumnMove: true,
        formulas: { engine },
      });

      hot.getPlugin('manualColumnMove').moveColumns([2], 0);
      hot.render();

      expect(hot.getData()).toEqual([[100, 1, 11], [200, 2, 12]]);

      hot.updateSettings({ columns: [{ data: 0 }, { data: 1 }, { data: 2 }] });

      expect(hot.getData()).toEqual([[1, 11, 100], [2, 12, 200]]);
    });

    it('writes a Date the host changed in place', () => {
      const day = new Date(2024, 0, 15);
      const data = [[day, '=YEAR(A1)']];
      const engine = createEngine();
      const hot = createGrid({ data, formulas: { engine } });

      hot.updateSettings({});

      const setSheetContent = jest.spyOn(engine, 'setSheetContent');

      hot.updateSettings({});

      expect(setSheetContent).not.toHaveBeenCalled();

      day.setFullYear(2020);
      hot.updateSettings({});

      expect(setSheetContent).toHaveBeenCalledTimes(1);
      expect(hot.getDataAtCell(0, 1)).toBe(2020);
    });

    it('skips the write of a sheet that holds NaN when nothing changed', () => {
      const engine = createEngine();
      const hot = createGrid({ data: [[NaN, '=A2+1'], [1, null]], formulas: { engine } });

      hot.updateSettings({});

      const setSheetContent = jest.spyOn(engine, 'setSheetContent');

      hot.updateSettings({});

      expect(setSheetContent).not.toHaveBeenCalled();
      expect(hot.getDataAtCell(0, 1)).toBe(2);
    });

    it('follows a removal of rows that are several spans in physical order', () => {
      const data = Array.from({ length: 10 }, (_, index) => [index, `=A${index + 1}*2`]);
      const engine = createEngine();
      const hot = createGrid({ data, manualRowMove: true, formulas: { engine } });

      hot.getPlugin('manualRowMove').moveRows([8, 9], 0);
      hot.render();
      // Visual rows 1 to 3 are physical rows 9, 0 and 1: two spans in one removal.
      hot.alter('remove_row', 1, 3);

      const setSheetContent = jest.spyOn(engine, 'setSheetContent');

      hot.updateSettings({});

      expect(setSheetContent).not.toHaveBeenCalled();
      expect(hot.getData()).toEqual([[8, 16], [2, 4], [3, 6], [4, 8], [5, 10], [6, 12], [7, 14]]);

      // The record lines up with the rows that are left, so a host change in the last one is still seen.
      data[6][0] = 50;
      hot.updateSettings({});

      expect(setSheetContent).toHaveBeenCalledTimes(1);
      expect(engine.getSheetValues(hot.getPlugin('formulas').sheetId).map(([id]) => id)).toContain(50);
    });

    it('neither rewrites the sheet nor replays the order when the same data array is sent again', () => {
      const data = crossRowData();
      const engine = createEngine();
      const hot = createGrid({ data, manualRowMove: true, formulas: { engine } });

      hot.getPlugin('manualRowMove').moveRows([3, 4], 0);
      hot.render();

      const setSheetContent = jest.spyOn(engine, 'setSheetContent');
      const moveRows = jest.spyOn(engine, 'moveRows');
      const setRowOrder = jest.spyOn(engine, 'setRowOrder');

      // A React re-render sends `data` with every update.
      hot.updateSettings({ data });
      hot.updateSettings({ data });

      expect(setSheetContent).not.toHaveBeenCalled();
      expect(moveRows).not.toHaveBeenCalled();
      expect(setRowOrder).not.toHaveBeenCalled();
      expect(hot.getDataAtCol(0)).toEqual([4, 5, 1, 2, 3]);
      expectEveryRowReadsItsRecord(hot);

      data[0][0] = 50;
      hot.updateSettings({ data });

      expect(setSheetContent).toHaveBeenCalledTimes(1);
      expect(hot.getDataAtCell(hot.toVisualRow(3), 1)).toBe(1050);
    });
  });

  describe('the moves a reload still sends', () => {
    it('falls back to one order when a move would pass an array formula at init', () => {
      let hot;

      expect(() => {
        hot = createGrid({
          data: [['x', 1, 2], ['=ARRAYFORMULA(B1:C1*10)', null, null], ['z', 3, 4]],
          manualRowMove: [2, 1, 0],
        });
      }).not.toThrow();

      expect(hot.getDataAtCol(0)[0]).toBe('z');
      expect(hot.getDataAtCol(0)[2]).toBe('x');
    });

    it('falls back to one order when a line moved down would pass an array formula at init', () => {
      let hot;

      expect(() => {
        hot = createGrid({
          data: [['x', 1, 2], ['=ARRAYFORMULA(B1:C1*10)', null, null], ['z', 3, 4], ['w', 5, 6]],
          manualRowMove: [1, 2, 3, 0],
        });
      }).not.toThrow();

      expect(hot.getDataAtCol(0)[3]).toBe('x');
    });

    it('does not throw on a re-render after drags around an array formula', () => {
      const hot = createGrid({
        data: [['x', 1, 2], ['=ARRAYFORMULA(B1:C1*10)', null, null], ['z', 3, 4]],
        manualRowMove: true,
      });

      hot.getPlugin('manualRowMove').moveRows([2], 0);
      hot.getPlugin('manualRowMove').moveRows([1], 3);
      hot.render();

      const afterDrags = hot.getData();

      expect(() => hot.updateSettings({})).not.toThrow();
      expect(hot.getData()).toEqual(afterDrags);
    });

    it('falls back to one order when a move would not fit the engine\'s maxRows', () => {
      const engine = createEngine({ maxRows: 3 });
      let hot;

      expect(() => {
        hot = createGrid({ data: [[1], [2], [3]], manualRowMove: [2, 0, 1], formulas: { engine } });
      }).not.toThrow();

      expect(hot.getDataAtCol(0)).toEqual([3, 1, 2]);
      expect(() => hot.updateSettings({ data: [[4], [5], [6]] })).not.toThrow();
    });

    it('sends one order at init when another sheet reads the sheet', () => {
      const engine = createEngine();

      createGrid({ data: [['=Sheet1!A1']], formulas: { engine, sheetName: 'Sheet2' } });

      const moveRows = jest.spyOn(engine, 'moveRows');

      createGrid({
        data: [['a'], ['b'], ['c']],
        manualRowMove: [1, 2, 0],
        formulas: { engine, sheetName: 'Sheet1' },
      });

      expect(moveRows).not.toHaveBeenCalled();
    });

    it('sends the order the grid reached by drags as moves when a hold ends over a rewritten sheet', () => {
      const data = crossRowData().map(row => [...row, 'note']);
      const hot = createGrid({ data, manualRowMove: true });
      const plugin = hot.getPlugin('formulas');

      hot.getPlugin('manualRowMove').moveRows([3, 4], 0);
      hot.render();

      plugin.runWithEngineOrderHeld(() => {
        data[0][3] = 'changed';
        hot.updateSettings({});
      });

      expectEveryRowReadsItsRecord(hot);
    });
  });
});
